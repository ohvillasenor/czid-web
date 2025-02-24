class ProjectsController < ApplicationController
  include ApplicationHelper
  include ProjectsHelper
  include SamplesHelper
  include ReportHelper
  include MetadataHelper
  include ParameterSanitization
  ########################################
  # Note to developers:
  # If you are adding a new action to the project controller, you must classify your action into
  # READ_ACTIONS: where current_user has read access of the project
  # EDIT_ACTIONS: where current_user has update access of the project
  # OTHER_ACTIONS: where the actions access multiple projects or non-existing projects.
  #                access control should still be checked as neccessary through current_power
  #
  ##########################################

  READ_ACTIONS = [:show, :project_pipeline_versions, :validate_project_name, :validate_sample_names].freeze
  EDIT_ACTIONS = [:edit, :update, :destroy, :add_user, :all_users, :update_project_visibility, :upload_metadata, :validate_metadata_csv].freeze
  OTHER_ACTIONS = [:choose_project, :create, :dimensions, :index, :metadata_fields, :new, :send_project_csv].freeze
  TOKEN_AUTH_METHODS = [:index, :create, :validate_sample_names].freeze

  # Required for token auth for CLI actions
  prepend_before_action :token_based_login_support, only: TOKEN_AUTH_METHODS
  skip_before_action :verify_authenticity_token, only: TOKEN_AUTH_METHODS

  power :projects, map: { EDIT_ACTIONS => :updatable_projects }, as: :projects_scope

  before_action :admin_required, only: [:edit, :new]
  before_action :set_project, only: READ_ACTIONS + EDIT_ACTIONS
  before_action :assert_access, only: OTHER_ACTIONS
  before_action :check_access
  before_action :login_required, only: [:create, :new]

  around_action :instrument_with_timer

  MAX_BINS = 34
  FAR_FUTURE_DAYS = 100_000

  # GET /projects
  # GET /projects.json
  def index
    respond_to do |format|
      format.html do
        # keep compatibility with old route
        # TODO(tiago): remove once once DD projects has a link to admin project view
        @projects = current_power.projects
      end
      format.json do
        domain = params[:domain]

        sorting_v0_allowed = current_user.allowed_feature?("sorting_v0_admin") ||
                             (current_user.allowed_feature?("sorting_v0") && domain == "my_data")

        order_by = if sorting_v0_allowed
                     params[:orderBy] || "created_at"
                   else
                     :id
                   end

        order_dir = sanitize_order_dir(params[:orderDir], :desc)
        # TODO: impose a max return value -> implies changing all calls to projects
        limit = params[:limit] ? params[:limit].to_i : nil
        offset = params[:offset] ? params[:offset].to_i : 0

        # we do not want to search samples by name
        search = params.delete(:search)
        project_id = params.delete(:projectId)

        # If basic, just return a few fields for the project.
        basic = ActiveModel::Type::Boolean.new.cast(params[:basic])

        list_all_project_ids = ActiveModel::Type::Boolean.new.cast(params[:listAllIds])

        projects = current_power.projects_by_domain(domain)

        # including these early ensures that users and samples are joined in the same order, making rails assign deterministic aliases
        # we use includes because we need data from both associations to return aggregate data for the project
        projects = projects.includes(:users).includes(:samples)
        projects = projects.where(id: project_id) if project_id
        projects = projects.search_by_name(search) if search
        if [:host, :location, :locationV2, :taxon, :time, :tissue, :annotations].any? { |key| params.key? key }
          projects = projects.where(samples: { id: filter_samples(current_power.samples, params) })
        elsif params.key?(:visibility)
          access_to_project = params[:visibility] == "public"
          projects = projects.where(public_access: access_to_project)
        end

        projects = if sorting_v0_allowed
                     Project.sort_projects(projects, order_by, order_dir)
                   else
                     projects.order(Hash[order_by => order_dir])
                   end

        limited_projects = limit ? projects.offset(offset).limit(limit) : projects

        basic_attributes = [
          'id', 'name', 'description', 'created_at', 'public_access', Arel.sql('COUNT(DISTINCT samples.id) AS number_of_samples'),
        ]

        if basic
          names = basic_attributes.map { |attr| attr.split(' AS ').last }
          limited_projects = limited_projects.group(:id)
          render json: {
            projects: limited_projects.group(:id).pluck(*basic_attributes).map { |p| names.zip(p).to_h },
          }
        else
          limited_projects = limited_projects
                             .includes(:creator, samples: [:host_genome, :user, { metadata: [:metadata_field, :location] }, :pipeline_runs, :workflow_runs])
                             .group(:id)
                             .references(:pipeline_runs, :samples, :workflow_runs)
          # get aggregated lists of association values in string by using MySQL's GROUP_CONCAT (should update to JSON_ARRAYAGG when possible)
          group_concat_host = Arel.sql("GROUP_CONCAT(DISTINCT host_genomes.name ORDER BY host_genomes.name SEPARATOR '::') AS hosts")
          group_concat_sample_type = Arel.sql("GROUP_CONCAT(DISTINCT CASE WHEN metadata_fields.name = 'sample_type' THEN metadata.string_validated_value ELSE NULL END ORDER BY 1 SEPARATOR '::') AS sample_types") # order by sample type
          group_concat_location = Arel.sql("GROUP_CONCAT(DISTINCT CASE WHEN metadata_fields.name = 'collection_location' THEN IFNULL(locations.name, metadata.string_validated_value) ELSE NULL END SEPARATOR '::') AS locations")
          group_concat_users = Arel.sql("GROUP_CONCAT(DISTINCT CONCAT(users.name,'|',users.email) ORDER BY users.name SEPARATOR '::') AS users")
          editable = Arel.sql("BIT_OR(IF(users.id=#{current_user.id} OR #{current_user.admin?}, 1, 0)) AS editable")
          creator = Arel.sql("creators_projects.name AS creator")
          creator_id = Arel.sql("creators_projects.id AS creator_id")
          mngs_runs_count = Arel.sql("COUNT(DISTINCT CASE WHEN samples.initial_workflow='#{WorkflowRun::WORKFLOW[:short_read_mngs]}' THEN samples.id ELSE NULL END) AS mngs_runs_count")
          cg_runs_count = Arel.sql("COUNT(DISTINCT (CASE
                                      WHEN workflow_runs.workflow = '#{WorkflowRun::WORKFLOW[:consensus_genome]}' AND workflow_runs.deprecated = false AND workflow_runs.deleted_at IS NULL THEN workflow_runs.id
                                      WHEN samples.initial_workflow = '#{WorkflowRun::WORKFLOW[:consensus_genome]}' THEN samples.id
                                      ELSE NULL
                                    END)
                          ) AS cg_runs_count")
          amr_runs_count = Arel.sql("COUNT(DISTINCT (CASE
                                      WHEN workflow_runs.workflow = '#{WorkflowRun::WORKFLOW[:amr]}' AND workflow_runs.deprecated = false AND workflow_runs.deleted_at IS NULL THEN workflow_runs.id
                                      WHEN samples.initial_workflow = '#{WorkflowRun::WORKFLOW[:amr]}' THEN samples.id
                                      ELSE NULL
                                    END)
                            ) AS amr_runs_count")

          attrs = [
            *basic_attributes, group_concat_sample_type, group_concat_host, group_concat_location, editable, group_concat_users, creator, creator_id, mngs_runs_count, cg_runs_count, amr_runs_count,
          ]
          names = attrs.map { |attr| attr.split(' AS ').last }
          name_email = ["name", "email"]
          metadata = ["locations", "hosts", "sample_types"]

          render json: {
            # Parentheses are very important. With do..end map returns nil before it is run (same does not happen with curly braces {} )
            projects: (limited_projects.pluck(*attrs).map do |p|
              project_hash = names.zip(p).to_h

              # Don't show list of project members unless they can edit the project.
              # :: and | are used as separators in the SQL queries above, so split on them here.
              project_hash["users"] = project_hash["editable"] == 1 ? (project_hash["users"] || '').split('::').map { |u| name_email.zip(u.split('|')).to_h } : []
              project_hash["owner"] = project_hash["creator"]

              project_hash["editable"] = current_user.admin? || project_hash["editable"] == 1

              metadata.each { |k| project_hash[k] = (project_hash[k] || '').split('::') }
              # Return as "tissue" for legacy compatibility. It's too hard to
              # rename all JS instances of "tissue".
              project_hash["tissues"] = project_hash["sample_types"]

              project_hash["sample_counts"] = project_hash.slice("number_of_samples", "mngs_runs_count", "cg_runs_count", "amr_runs_count")
              project_hash.except("sample_types", "number_of_samples", "mngs_runs_count", "cg_runs_count", "amr_runs_count")
            end),
            all_projects_ids: (projects.pluck(:id).uniq if list_all_project_ids),
          }.compact
        end
      end
    end
  end

  def dimensions
    @timer.add_tags([
                      "domain:#{params[:domain]}",
                    ])

    # TODO(tiago): consider split into specific controllers / models
    domain = params[:domain]

    samples = samples_by_domain(domain)
    samples = filter_samples(samples, params)

    sample_ids = samples.pluck(:id)

    project_ids = samples.distinct(:project_id).pluck(:project_id)
    projects = Project.where(id: project_ids)
    projects_count = projects.count

    @timer.split("prep_projects")

    locations = LocationHelper.project_dimensions(sample_ids, "collection_location")
    @timer.split("locations")

    locations_v2 = LocationHelper.project_dimensions(sample_ids, "collection_location_v2")
    @timer.split("locations_v2")

    sample_types = SamplesHelper.samples_by_metadata_field(sample_ids, "sample_type")
                                .joins(:sample)
                                .distinct
                                .count(:project_id)
    sample_types = sample_types.map do |sample_type, count|
      { value: sample_type, text: sample_type, count: count }
    end
    @timer.split("sample_types")

    all_projects = current_power.projects_by_domain(domain)
    public_count = all_projects.where(public_access: 1).count
    private_count = all_projects.count - public_count

    visibility = [
      { value: "public", text: "Public", count: public_count },
      { value: "private", text: "Private", count: private_count },
    ]
    @timer.split("visibility")

    times = [
      { value: "1_week", text: "Last Week",
        count: projects.where("projects.created_at >= ?", 1.week.ago.utc).count, },
      { value: "1_month", text: "Last Month",
        count: projects.where("projects.created_at >= ?", 1.month.ago.utc).count, },
      { value: "3_month", text: "Last 3 Months",
        count: projects.where("projects.created_at >= ?", 3.months.ago.utc).count, },
      { value: "6_month", text: "Last 6 Months",
        count: projects.where("projects.created_at >= ?", 6.months.ago.utc).count, },
      { value: "1_year", text: "Last Year",
        count: projects.where("projects.created_at >= ?", 1.year.ago.utc).count, },
    ]
    @timer.split("times")

    # TODO(tiago): move grouping to a helper function (similar code in samples_controller)
    time_bins = []
    if projects_count > 0
      min_date = projects.minimum(:created_at).utc.to_date
      max_date = projects.maximum(:created_at).utc.to_date
      span = (max_date - min_date + 1).to_i
      if span <= MAX_BINS
        # we group by day if the span is shorter than MAX_BINS days
        bins_map = projects.group("DATE(`projects`.`created_at`)").count.map do |timestamp, count|
          [timestamp.strftime("%Y-%m-%d"), count]
        end.to_h
        time_bins = (0...span).map do |offset|
          date = (min_date + offset.days).to_s
          {
            value: date,
            text: date,
            count: bins_map[date] || 0,
          }
        end
      else
        # we group by equally spaced MAX_BINS bins to cover the necessary span
        step = (span.to_f / MAX_BINS).ceil
        bins_map = projects.group(
          ActiveRecord::Base.send(
            :sanitize_sql_array,
            ["FLOOR(TIMESTAMPDIFF(DAY, :min_date, `projects`.`created_at`)/:step)", { min_date: min_date, step: step }]
          )
        ).count
        time_bins = (0...MAX_BINS).map do |bucket|
          start_date = min_date + (bucket * step).days
          end_date = start_date + step - 1
          {
            interval: { start: start_date, end: end_date },
            count: bins_map[bucket] || 0,
            value: "#{start_date}:#{end_date}",
            text: "#{start_date} - #{end_date}",
          }
        end
      end
    end
    @timer.split("time_bins")

    hosts = samples.includes(:host_genome).group(:host_genome).distinct.count(:project_id)
    hosts = hosts.map do |host, count|
      { value: host&.id, text: host&.name, count: count }
    end
    @timer.split("hosts")

    respond_to do |format|
      format.json do
        render json: [
          { dimension: "location", values: locations },
          { dimension: "locationV2", values: locations_v2 },
          { dimension: "visibility", values: visibility },
          { dimension: "time", values: times },
          { dimension: "time_bins", values: time_bins },
          { dimension: "host", values: hosts },
          # Return as "tissue" for legacy compatibility. It's too hard to
          # rename all JS instances of "tissue".
          { dimension: "tissue", values: sample_types },
        ]
      end
    end
  end

  def choose_project
    project_search = current_power.updatable_projects.index_by(&:name).map do |name, record|
      { "name" => name,
        "description" => record.description,
        "id" => record.id, }
    end
    render json: JSON.dump(project_search)
  end

  # GET /projects/1
  # GET /projects/1.json
  def show
    @samples = current_power.project_samples(@project).order(id: :desc)
    # all existing project are null, we ensure private projects are explicitly set to 0
    respond_to do |format|
      format.html
      format.json do
        render json: {
          id: @project.id,
          name: @project.name,
          description: @project.description,
          public_access: @project.public_access.to_i,
          created_at: @project.created_at,
          total_sample_count: @samples.count,
        }
      end
    end
  end

  def send_project_csv
    if params[:id] == 'all'
      samples = current_power.samples
      project_name = "all-projects"
    else
      project = current_power.projects.find(params[:id])
      samples = current_power.project_samples(project)
      project_name = project.cleaned_project_name
    end
    selected_sample_ids = (params[:sampleIds] || "").split(",").map(&:to_i)
    samples = samples.where(id: selected_sample_ids) unless selected_sample_ids.empty?
    project_csv = generate_sample_list_csv(samples)
    send_data project_csv, filename: project_name + '_sample-table.csv'
  end

  def project_pipeline_versions
    render json: {
      WorkflowRun::WORKFLOW[:amr] => PipelineVersionControlService.call(@project.id, WorkflowRun::WORKFLOW[:amr]),
      WorkflowRun::WORKFLOW[:consensus_genome] => PipelineVersionControlService.call(@project.id, WorkflowRun::WORKFLOW[:consensus_genome]),
      WorkflowRun::WORKFLOW[:long_read_mngs] => PipelineVersionControlService.call(@project.id, WorkflowRun::WORKFLOW[:long_read_mngs]),
      WorkflowRun::WORKFLOW[:short_read_mngs] => PipelineVersionControlService.call(@project.id, WorkflowRun::WORKFLOW[:short_read_mngs]),
    }
  end

  def update_project_visibility
    errors = []
    public_access = params[:public_access] ? params[:public_access].to_i : nil

    errors.push('Project id is Invalid') unless @project
    errors.push('Access value is empty') if public_access.nil?

    if errors.empty?
      @project.update(public_access: public_access)
      render json: {
        message: 'Project visibility updated successfully',
        status: :accepted,
      }
    else
      render json: {
        message: 'Unable to set visibility for project',
        status: :unprocessable_entity,
        errors: errors,
      }
    end
  end

  # GET /projects/new
  def new
    @project = Project.new
  end

  # GET /projects/1/edit
  def edit
  end

  # POST /projects
  # POST /projects.json
  def create
    @project = Project.new(project_params)
    @project.days_to_keep_sample_private = FAR_FUTURE_DAYS if current_user.admin?
    @project.users << current_user
    @project.creator_id = current_user.id

    respond_to do |format|
      if @project.save
        format.html { redirect_to @project, notice: 'Project was successfully created.' }
        format.json { render :show, status: :created, location: @project, project: @project }
      else
        format.html { render :new }
        format.json { render json: @project.errors.full_messages, status: :unprocessable_entity }
      end
    end
  rescue ActiveRecord::RecordNotUnique
    respond_to do |format|
      format.html {}
      format.json do
        render json: "Duplicate name",
               status: :unprocessable_entity
      end
    end
  end

  # PATCH/PUT /projects/1
  # PATCH/PUT /projects/1.json
  def update
    respond_to do |format|
      if @project.update(project_params)
        format.html { redirect_to @project, notice: 'Project was successfully updated.' }
        format.json { render :show, status: :ok, location: @project }
      else
        format.html { render :edit }
        format.json { render json: @project.errors.full_messages, status: "failed" }
      end
    end
  end

  # GET /projects/1/validate_project_name.json
  def validate_project_name
    permitted_params = params.permit(:name)
    name = ProjectsHelper.sanitize_project_name(permitted_params[:name])
    @project.name = name
    @project.valid?
    if @project.errors.key?(:name)
      render json: {
        valid: false,
        sanitizedName: name,
        message: "This project name is already taken. Please enter another name.",
      }
    else
      render json: {
        valid: true,
        sanitizedName: name,
      }
    end
  end

  # DELETE /projects/1
  # DELETE /projects/1.json
  def destroy
    deletable = current_user.admin? || Sample.where(project_id: @project.id).empty?
    @project.destroy if deletable
    respond_to do |format|
      if deletable
        format.html { redirect_to projects_url, notice: 'Project was successfully destroyed.' }
        format.json { head :no_content }
      else
        format.html { render :edit }
        format.json { render json: { message: 'Cannot delete this project' }, status: :unprocessable_entity }
      end
    end
  end

  def all_users
    render json: { users: @project.users.map { |user| { name: user[:name], email: user[:email] } } }
  end

  def add_user
    @user = User.find_by(email: add_user_params[:user_email_to_add].downcase)

    if @user
      UserMailer.added_to_projects_email(@user.id, shared_project_email_arguments).deliver_now unless @project.user_ids.include? @user.id
    else
      @user = create_new_user_random_password(name: add_user_params[:user_name_to_add], email: add_user_params[:user_email_to_add])
    end

    @project.user_ids |= [@user.id]
  end

  def validate_metadata_csv
    metadata = params[:metadata]

    project_samples = current_power.project_samples(@project).includes(
      project: [:metadata_fields],
      host_genome: [:metadata_fields],
      metadata: [:metadata_field]
    )
    issues = validate_metadata_csv_for_project_samples(
      project_samples.to_a,
      metadata
    )
    render json: {
      status: "success",
      issues: issues,
    }
  end

  def upload_metadata
    metadata = params[:metadata]

    project_samples = current_power.project_samples(@project).includes(host_genome: [:metadata_fields], metadata: :metadata_field)

    errors = upload_metadata_for_samples(project_samples.to_a, metadata)
    render json: {
      status: "success",
      errors: errors,
    }
  end

  def metadata_fields
    project_ids = (params[:projectIds] || []).map(&:to_i)

    results = if project_ids.length == 1
                current_power.projects.find(project_ids[0]).metadata_fields.map(&:field_info)
              else
                current_power.projects.where(id: project_ids)
                             .includes(metadata_fields: [:host_genomes])
                             .map(&:metadata_fields).flatten.uniq.map(&:field_info)
              end

    # Hide legacy v1 collection_location until removal.
    results = results.reject { |f| f[:key] == "collection_location" }

    render json: results
  end

  # TODO: Consider consolidating into a general sample validator
  # Takes an array of sample names.
  # Returns an array of sample names that has no name collisions with existing samples or with each other.
  def validate_sample_names
    sample_names = params[:sample_names]
    ignore_unuploaded = params[:ignore_unuploaded]
    new_sample_names = []

    existing_names = if ignore_unuploaded
                       # Ignore checking for sample name conflicts if the samples haven't uploaded yet
                       Sample
                         .where(project: @project)
                         .where.not(status: Sample::STATUS_CREATED)
                         .pluck(:name)
                         .map(&:downcase)
                     else
                       Sample.where(project: @project).pluck(:name).map(&:downcase)
                     end

    sample_names.each do |sample_name|
      i = 0
      cur_sample_name = sample_name

      # If the sample name already exists in the project, add a _1, _2, _3, etc.
      while existing_names.include?(cur_sample_name.downcase)
        i += 1
        cur_sample_name = sample_name + "_#{i}"
      end

      new_sample_names << cur_sample_name
      # Add the validated sample name to existing names, so subsequent names don't collide.
      existing_names << cur_sample_name.downcase
    end

    render json: new_sample_names
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def create_new_user_random_password(name:, email:)
    Rails.logger.info("Going to create new user via project sharing: #{email}")

    user_params = {
      email: email,
      name: name,
      created_by_user_id: current_user.id,
    }

    # All users prior to auto account creation v1 are considered to have completed a profile form
    if AppConfigHelper.get_app_config(AppConfig::AUTO_ACCOUNT_CREATION_V1) != "1"
      user_params[:profile_form_version] = User::PROFILE_FORM_VERSION[:interest_form]
    end

    return UserFactoryService.call(current_user: current_user, project_id: @project.id, send_activation: true, signup_path: User::SIGNUP_PATH[:project], **user_params)
  end

  def shared_project_email_arguments
    {
      email_subject: 'You have been added to a project on CZ ID',
      sharing_user_id: current_user.id,
      shared_project_id: @project.id,
    }
  end

  def set_project
    @project = projects_scope.find(params[:id])
    assert_access
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def project_params
    result = params.require(:project).permit(:name, :public_access, :description, user_ids: [])
    result[:name] = ProjectsHelper.sanitize_project_name(result[:name]) if result[:name]
    result[:description] = ProjectsHelper.sanitize_project_description(result[:description]) if result[:description]
    result
  end

  def add_user_params
    params.permit(:user_email_to_add, :user_name_to_add)
  end
end
