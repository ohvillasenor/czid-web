require 'rails_helper'

RSpec.describe BulkDownloadsController, type: :controller do
  let(:fake_sfn_execution_arn) { "fake:sfn:execution:arn".freeze }
  let(:fake_sfn_execution_description) do
    {
      execution_arn: "FAKE_SFN_ARN",
      input: JSON.dump(OutputPrefix: "FAKE_OUTPUT_PREFIX"),
      output: JSON.dump({ "consensus_genome.make_consensus_out_consensus_fa" => "FAKE_OUTPUT_PREFIX/consensus.fa" }),
      start_date: Time.zone.now,
      state_machine_arn: fake_sfn_execution_arn,
      status: "FAKE_EXECUTION_STATUS",
    }
  end
  let(:fake_wdl_version) { "999".freeze }
  let(:fake_dag_version) { "9.999".freeze }

  create_users

  # Regular user specific behavior
  context "Normal user with bulk_downloads flag" do
    # create_users
    before do
      sign_in @joe
      @project = create(:project, users: [@joe], name: "Test Project")
      @admin_project = create(:project, users: [@admin], name: "Admin Project")
    end

    describe "POST #create" do
      before do
        AppConfigHelper.set_app_config(AppConfig::MAX_OBJECTS_BULK_DOWNLOAD, 100)
        AppConfigHelper.set_app_config(AppConfig::MAX_SAMPLES_BULK_DOWNLOAD_ORIGINAL_FILES, 50)
        stub_const('ENV', ENV.to_hash.merge("SERVER_DOMAIN" => "https://czid.org",
                                            "SAMPLES_BUCKET_NAME" => "czid-samples-prod"))
      end

      def get_expected_tar_name(project, sample, suffix)
        Shellwords.escape(
          "#{project.cleaned_project_name[0...100]}_#{project.id}/#{sample.name[0...65]}_#{sample.id}_#{suffix}"
        )
      end

      let(:mock_field_params) do
        {
          foo: {
            displayName: "Bar",
            value: "bar",
          },
        }
      end

      it "should create new bulk download and kickoff the aegea ecs task" do
        @sample_one = create(:sample, project: @project, name: "Test Sample One",
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
        @sample_two = create(:sample, project: @project, name: "Test Sample Two",
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        expect(Open3).to receive(:capture3)
          .with("aegea", "ecs", "run", a_string_starting_with("--execute"), any_args)
          .exactly(1).times.and_return(
            [JSON.generate("taskArn": "ABC"), "", instance_double(Process::Status, exitstatus: 0)]
          )

        bulk_download_params = {
          download_type: "unmapped_reads",
          sample_ids: [@sample_one, @sample_two],
          params: mock_field_params,
          workflow: WorkflowRun::WORKFLOW[:short_read_mngs],
        }

        post :create, params: bulk_download_params

        expect(response).to have_http_status(200)
        json_response = JSON.parse(response.body)
        bulk_download = BulkDownload.find(json_response["id"])

        # Verify that bulk download was created correctly.
        expect(bulk_download).not_to eq(nil)
        expect(bulk_download.download_type).to eq("unmapped_reads")
        expect(bulk_download.pipeline_run_ids).to include(@sample_one.pipeline_runs.first.id)
        expect(bulk_download.pipeline_run_ids).to include(@sample_two.pipeline_runs.first.id)
        expect(bulk_download.user_id).to eq(@joe.id)
        expect(bulk_download.status).to eq(BulkDownload::STATUS_RUNNING)
        expect(bulk_download.ecs_task_arn).to eq("ABC")
        expect(bulk_download.params_json).to eq(mock_field_params.to_json)
      end

      it "should return failure if aegea task failed to start" do
        @sample_one = create(:sample, project: @project, name: "Test Sample One",
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
        @sample_two = create(:sample, project: @project, name: "Test Sample Two",
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        expect(Open3).to receive(:capture3).exactly(1).times.and_return(
          ["", "", instance_double(Process::Status, exitstatus: 1)]
        )

        bulk_download_params = {
          download_type: "unmapped_reads",
          sample_ids: [@sample_one, @sample_two],
          params: mock_field_params,
          workflow: WorkflowRun::WORKFLOW[:short_read_mngs],
        }

        post :create, params: bulk_download_params
        expect(response).to have_http_status(500)
        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq(BulkDownloadsHelper::KICKOFF_FAILURE_HUMAN_READABLE)
        bulk_download = BulkDownload.find(json_response["bulk_download"]["id"])

        # Verify that bulk download was created and correctly updated to the "error" state.
        expect(bulk_download).not_to eq(nil)
        expect(bulk_download.download_type).to eq("unmapped_reads")
        expect(bulk_download.status).to eq(BulkDownload::STATUS_ERROR)
        expect(bulk_download.error_message).to eq(BulkDownloadsHelper::KICKOFF_FAILURE)
      end

      it "should error if a requested sample is not done running" do
        @sample_one = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 0, job_status: PipelineRun::STATUS_RUNNING }])

        bulk_download_params = {
          download_type: "sample_overview",
          sample_ids: [@sample_one],
          workflow: WorkflowRun::WORKFLOW[:short_read_mngs],
        }

        post :create, params: bulk_download_params
        expect(response).to have_http_status(422)

        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq(BulkDownloadsHelper::SAMPLE_STILL_RUNNING_ERROR)
      end

      it "should error if a requested sample failed" do
        @sample_one = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: "1.Host Filtering-FAILED" }])

        bulk_download_params = {
          download_type: "sample_overview",
          sample_ids: [@sample_one],
          workflow: WorkflowRun::WORKFLOW[:short_read_mngs],
        }

        post :create, params: bulk_download_params
        expect(response).to have_http_status(422)

        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq(BulkDownloadsHelper::SAMPLE_FAILED_ERROR)
      end

      it "should error if a requested sample is not viewable by the user" do
        @sample_one = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
        @project_admin = create(:project, users: [@admin])
        @sample_two = create(:sample, project: @project_admin,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        bulk_download_params = {
          download_type: "sample_overview",
          sample_ids: [@sample_one, @sample_two],
          workflow: WorkflowRun::WORKFLOW[:short_read_mngs],
        }

        post :create, params: bulk_download_params
        expect(response).to have_http_status(422)

        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq(BulkDownloadsHelper::SAMPLE_NO_PERMISSION_ERROR)
      end

      it "should error if too many samples are requested in the bulk download" do
        @sample_one = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
        @sample_two = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        # Set MAX_OBJECTS_BULK_DOWNLOAD to 1
        AppConfigHelper.set_app_config(AppConfig::MAX_OBJECTS_BULK_DOWNLOAD, 1)

        bulk_download_params = {
          download_type: "sample_overview",
          sample_ids: [@sample_one, @sample_two],
          workflow: WorkflowRun::WORKFLOW[:short_read_mngs],
        }

        post :create, params: bulk_download_params
        expect(response).to have_http_status(422)

        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq(BulkDownloadsHelper::MAX_OBJECTS_EXCEEDED_ERROR_TEMPLATE % 1)
      end

      it "should use the correct max samples app config for normal downloads" do
        @sample_one = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
        @sample_two = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        # Set MAX_SAMPLES_BULK_DOWNLOAD_ORIGINAL_FILES to 1
        # Since this is not the original input file download type, the download should succeed.
        AppConfigHelper.set_app_config(AppConfig::MAX_SAMPLES_BULK_DOWNLOAD_ORIGINAL_FILES, 1)

        bulk_download_params = {
          download_type: "sample_overview",
          sample_ids: [@sample_one, @sample_two],
          workflow: WorkflowRun::WORKFLOW[:short_read_mngs],
        }

        post :create, params: bulk_download_params
        expect(response).to have_http_status(200)
      end

      it "should error if too many samples are requested in an original input files bulk download" do
        @sample_one = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
        @sample_two = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        # Set MAX_SAMPLES_BULK_DOWNLOAD_ORIGINAL_FILES to 1
        AppConfigHelper.set_app_config(AppConfig::MAX_SAMPLES_BULK_DOWNLOAD_ORIGINAL_FILES, 1)

        bulk_download_params = {
          download_type: "original_input_file",
          sample_ids: [@sample_one, @sample_two],
          workflow: WorkflowRun::WORKFLOW[:short_read_mngs],
        }

        post :create, params: bulk_download_params
        expect(response).to have_http_status(422)

        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq(BulkDownloadsHelper::MAX_OBJECTS_EXCEEDED_ERROR_TEMPLATE % 1)
      end

      it "checks and uses the most recent pipeline run for a sample" do
        travel_to 1.day.ago do
          @sample_one = create(:sample, project: @project,
                                        pipeline_runs_data: [
                                          { finalized: 1, job_status: PipelineRun::STATUS_FAILED },
                                        ])
        end

        create(:pipeline_run, sample: @sample_one, finalized: 1, job_status: PipelineRun::STATUS_CHECKED)

        bulk_download_params = {
          download_type: "sample_overview",
          sample_ids: [@sample_one],
          workflow: WorkflowRun::WORKFLOW[:short_read_mngs],
        }

        post :create, params: bulk_download_params
        expect(response).to have_http_status(200)
        json_response = JSON.parse(response.body)
        bulk_download = BulkDownload.find(json_response["id"])

        # Verify that bulk download uses correct pipeline run id.
        expect(bulk_download).not_to eq(nil)
        expect(bulk_download.pipeline_run_ids).to include(@sample_one.first_pipeline_run.id)
      end

      it "allows user to activate collaborator-only download type for all samples on which they are a collaborator" do
        @sample_one = create(:sample,
                             project: @project,
                             user: @joe,
                             pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
        @user = create(:user)
        @collaborative_project = create(:project, users: [@user, @joe])
        @collaborative_sample = create(:sample,
                                       project: @collaborative_project,
                                       user: @user,
                                       pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
        # This runs "aegea ecs run", which won't succeed in CI, so we must mock it out.
        allow(Open3).to receive(:capture3)
          .and_return(
            [JSON.generate("taskArn": "ABC"), "", instance_double(Process::Status, exitstatus: 0)]
          )

        bulk_download_params = {
          # This download type is collaborator-only.
          download_type: BulkDownloadTypesHelper::HOST_GENE_COUNTS_BULK_DOWNLOAD_TYPE,
          sample_ids: [@sample_one.id, @collaborative_sample.id],
          workflow: WorkflowRun::WORKFLOW[:short_read_mngs],
        }

        post :create, params: bulk_download_params
        expect(response).to have_http_status(:ok)
      end

      it "errors if user attempts to activate collaborator-only download type with samples on which they are not a collaborator" do
        @sample_one = create(:sample,
                             project: @project,
                             user: @joe,
                             pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
        @user = create(:user)
        @public_project = create(:project, users: [@user], public_access: 1)
        @public_sample = create(:sample,
                                project: @public_project,
                                pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        bulk_download_params = {
          # This download type is collaborator-only.
          download_type: BulkDownloadTypesHelper::HOST_GENE_COUNTS_BULK_DOWNLOAD_TYPE,
          sample_ids: [@sample_one.id, @public_sample.id],
          workflow: WorkflowRun::WORKFLOW[:short_read_mngs],
        }

        post :create, params: bulk_download_params
        expect(response).to have_http_status(:unprocessable_entity)

        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq(BulkDownloadsHelper::COLLABORATOR_ONLY_DOWNLOAD_TYPE)
      end

      it "should error if user attempts to activate uploader-only download type with sample they didn't upload" do
        @sample_one = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }], user: @joe)
        @sample_two = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }], user: @admin)

        bulk_download_params = {
          # This download type is uploader-only.
          download_type: "original_input_file",
          sample_ids: [@sample_one, @sample_two],
          workflow: WorkflowRun::WORKFLOW[:short_read_mngs],
        }

        post :create, params: bulk_download_params
        expect(response).to have_http_status(422)

        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq(BulkDownloadsHelper::UPLOADER_ONLY_DOWNLOAD_TYPE)
      end

      it "should error if user specifies an unknown download type" do
        @sample_one = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
        @sample_two = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        bulk_download_params = {
          download_type: "mock_download_type",
          sample_ids: [@sample_one, @sample_two],
          workflow: WorkflowRun::WORKFLOW[:short_read_mngs],
        }

        post :create, params: bulk_download_params
        expect(response).to have_http_status(422)

        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq(BulkDownloadsHelper::UNKNOWN_DOWNLOAD_TYPE)
      end

      it "should error if field params are invalid" do
        @sample_one = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
        @sample_two = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        bulk_download_params = {
          download_type: "reads_non_host",
          sample_ids: [@sample_one, @sample_two],
          params: {
            # Intentionally pass a string, instead of a hash of the form { displayName: "FOO", value: "BAR" }
            taxa_with_reads: "abc",
          },
          workflow: WorkflowRun::WORKFLOW[:short_read_mngs],
        }

        post :create, params: bulk_download_params
        expect(response).to have_http_status(422)

        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq(BulkDownloadsHelper::KICKOFF_FAILURE_HUMAN_READABLE)
      end

      it "should be able to create a bulk download with workflow runs" do
        sample_one = create(:sample, project: @project, name: "Test Sample One")
        sample_two = create(:sample, project: @project, name: "Test Sample Two")
        workflow_run_one = create(:workflow_run, sample: sample_one, workflow: WorkflowRun::WORKFLOW[:consensus_genome], status: WorkflowRun::STATUS[:succeeded])
        workflow_run_two = create(:workflow_run, sample: sample_two, workflow: WorkflowRun::WORKFLOW[:consensus_genome], status: WorkflowRun::STATUS[:succeeded])

        expect(Open3).to receive(:capture3)
          .with("aegea", "ecs", "run", a_string_starting_with("--execute"), any_args)
          .exactly(1).times.and_return(
            [JSON.generate("taskArn": "ABC"), "", instance_double(Process::Status, exitstatus: 0)]
          )

        allow_any_instance_of(SfnExecution).to receive(:output_path) { |output_key| "#{@s3_path}/#{output_key}" }

        # pass in a valid download_format
        fields = {
          "download_format": {
            "displayName": BulkDownloadTypesHelper::SEPARATE_FILES_DOWNLOAD,
            "value": BulkDownloadTypesHelper::SEPARATE_FILES_DOWNLOAD,
          },
        }
        bulk_download_params = {
          download_type: BulkDownloadTypesHelper::CONSENSUS_GENOME_DOWNLOAD_TYPE,
          workflow_run_ids: [workflow_run_one.id, workflow_run_two.id],
          params: fields,
          workflow: WorkflowRun::WORKFLOW[:consensus_genome],
        }

        post :create, params: bulk_download_params

        expect(response).to have_http_status(200)
        json_response = JSON.parse(response.body)
        bulk_download = BulkDownload.find(json_response["id"])

        # Verify that bulk download was created correctly.
        expect(bulk_download).not_to eq(nil)
        expect(bulk_download.download_type).to eq(BulkDownloadTypesHelper::CONSENSUS_GENOME_DOWNLOAD_TYPE)
        expect(bulk_download.workflow_run_ids).to contain_exactly(workflow_run_one.id, workflow_run_two.id)
        expect(bulk_download.user_id).to eq(@joe.id)
        expect(bulk_download.status).to eq(BulkDownload::STATUS_RUNNING)
        expect(bulk_download.ecs_task_arn).to eq("ABC")
        expect(bulk_download.params_json).to eq(fields.to_json)
      end
    end

    describe "GET #index" do
      it "should return only bulk downloads viewable to the user" do
        @sample_one = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
        @project_admin = create(:project, users: [@admin])
        @sample_two = create(:sample, project: @project_admin,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        bulk_download_joe = create(:bulk_download, user: @joe, pipeline_run_ids: [@sample_one.first_pipeline_run.id], download_type: "unmapped_reads")
        create(:bulk_download, user: @admin, pipeline_run_ids: [@sample_two.first_pipeline_run.id])

        get :index, format: :json

        expect(response).to have_http_status(200)
        bulk_downloads = JSON.parse(response.body)

        expect(bulk_downloads.length).to eq(1)
        expect(bulk_downloads[0]["id"]).to eq(bulk_download_joe.id)
        expect(bulk_downloads[0]["user_id"]).to eq(@joe.id)
        expect(bulk_downloads[0]["download_type"]).to eq("unmapped_reads")
        expect(bulk_downloads[0]["num_samples"]).to eq(1)
        # Should not return pipeline runs.
        expect(bulk_downloads[0]["pipeline_runs"]).to eq(nil)
        # Should not return admin-only fields.
        expect(bulk_downloads[0]["user_name"]).to eq(nil)
        expect(bulk_downloads[0]["execution_type"]).to eq(nil)
        expect(bulk_downloads[0]["log_url"]).to eq(nil)
      end
    end

    describe "GET #show" do
      it "should return the bulk download and download type" do
        @sample_one = create(:sample, project: @project, name: "Joes Sample",
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        bulk_download_joe = create(:bulk_download, user: @joe, pipeline_run_ids: [@sample_one.first_pipeline_run.id], download_type: "unmapped_reads")

        get :show, params: { format: "json", id: bulk_download_joe.id }

        expect(response).to have_http_status(200)
        json_response = JSON.parse(response.body)

        expect(json_response["bulk_download"]["user_id"]).to eq(@joe.id)
        expect(json_response["bulk_download"]["download_type"]).to eq("unmapped_reads")
        expect(json_response["bulk_download"]["num_samples"]).to eq(1)
        expect(json_response["bulk_download"]["pipeline_runs"].length).to eq(1)
        expect(json_response["bulk_download"]["pipeline_runs"][0]["sample_name"]).to eq("Joes Sample")
        expect(json_response["download_type"]["display_name"]).to eq("Unmapped Reads")
      end

      it "should error if the requested bulk download is not viewable" do
        @project_admin = create(:project, users: [@admin])
        @sample_two = create(:sample, project: @project_admin,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        bulk_download_admin = create(:bulk_download, user: @admin, pipeline_run_ids: [@sample_two.first_pipeline_run.id])

        get :show, params: { format: "json", id: bulk_download_admin.id }

        expect(response).to have_http_status(404)
        json_response = JSON.parse(response.body)

        expect(json_response["error"]).to eq(BulkDownloadsHelper::BULK_DOWNLOAD_NOT_FOUND)
      end
    end

    describe "GET #presigned_output_url" do
      let(:fake_presigned_url) { "https://fake-presigned-url" }

      before do
        @sample_one = create(:sample, project: @project, name: "Joes Sample",
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        @bulk_download_joe = create(:bulk_download, user: @joe, status: BulkDownload::STATUS_SUCCESS, pipeline_run_ids: [@sample_one.first_pipeline_run.id], download_type: "unmapped_reads")
      end

      it "should return url in basic case" do
        allow(S3_PRESIGNER).to receive(:presigned_url).and_return(fake_presigned_url)

        get :presigned_output_url, params: { format: "json", id: @bulk_download_joe.id }

        expect(response).to have_http_status(200)
        expect(response.body).to eq(fake_presigned_url)
      end

      it "should return 500 status if url fails to generate" do
        allow(S3_PRESIGNER).to receive(:presigned_url).and_raise(StandardError)

        get :presigned_output_url, params: { format: "json", id: @bulk_download_joe.id }

        expect(response).to have_http_status(500)
        json_response = JSON.parse(response.body)

        expect(json_response["error"]).to eq(BulkDownloadsHelper::PRESIGNED_URL_GENERATION_ERROR)
      end

      it "should return 404 if not found" do
        get :presigned_output_url, params: { format: "json", id: 12_345 }

        expect(response).to have_http_status(404)
        json_response = JSON.parse(response.body)

        expect(json_response["error"]).to eq(BulkDownloadsHelper::BULK_DOWNLOAD_NOT_FOUND)
      end

      it "should return 404 if bulk download not finished" do
        @bulk_download_joe.update(status: BulkDownload::STATUS_RUNNING)

        get :presigned_output_url, params: { format: "json", id: @bulk_download_joe.id }

        expect(response).to have_http_status(404)
        json_response = JSON.parse(response.body)

        expect(json_response["error"]).to eq(BulkDownloadsHelper::OUTPUT_FILE_NOT_SUCCESSFUL)
      end
    end

    describe "GET #metrics" do
      it "should return nil for unspecified workflows" do
        get :metrics

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response).to be nil
      end

      it "should return nil for workflows without mngs sample reports" do
        workflows = [WorkflowRun::WORKFLOW[:consensus_genome], WorkflowRun::WORKFLOW[:amr]]
        workflows.each do |workflow|
          get :metrics, params: { workflow: workflow }

          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body)
          expect(json_response).to be nil
        end
      end

      it "should return correct metrics for metagenomics workflows" do
        workflows = [WorkflowRun::WORKFLOW[:short_read_mngs], WorkflowRun::WORKFLOW[:long_read_mngs]]
        workflows.each do |workflow|
          get :metrics, params: { workflow: workflow }

          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body)

          # JSON stringify and parse workflow metrics to convert symbols to strings
          workflow_metrics = WorkflowRun::WORKFLOW_METRICS[workflow]
          expect(json_response).to eq(JSON.parse(workflow_metrics.to_json))
        end
      end
    end
  end

  context "Admin user with bulk_downloads flag" do
    # create_users
    before do
      sign_in @admin
      @project = create(:project, users: [@admin], name: "Test Project")
    end

    describe "GET #index" do
      it "should see ALL bulk downloads" do
        @sample_one = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
        @project_admin = create(:project, users: [@admin])
        @sample_two = create(:sample, project: @project_admin,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        create(:bulk_download, user: @joe, pipeline_run_ids: [@sample_one.first_pipeline_run.id], download_type: "unmapped_reads")
        create(:bulk_download, user: @admin, pipeline_run_ids: [@sample_two.first_pipeline_run.id], download_type: "sample_overview")

        get :index, format: :json

        expect(response).to have_http_status(200)
        bulk_downloads = JSON.parse(response.body)

        expect(bulk_downloads.length).to eq(2)
        expect(bulk_downloads[0]["user_id"]).to eq(@joe.id)
        expect(bulk_downloads[0]["download_type"]).to eq("unmapped_reads")
        expect(bulk_downloads[0]["num_samples"]).to eq(1)
        expect(bulk_downloads[1]["user_id"]).to eq(@admin.id)
        expect(bulk_downloads[1]["download_type"]).to eq("sample_overview")
        expect(bulk_downloads[1]["num_samples"]).to eq(1)
      end

      it "should see admin-only fields for bulk downloads" do
        @sample_one = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        bulk_download = create(:bulk_download, user: @joe, pipeline_run_ids: [@sample_one.first_pipeline_run.id], download_type: "original_input_file", ecs_task_arn: "MOCK_TASK_ARN")

        get :index, format: :json

        expect(response).to have_http_status(200)
        bulk_downloads = JSON.parse(response.body)

        expect(bulk_downloads.length).to eq(1)
        expect(bulk_downloads[0]["id"]).to eq(bulk_download.id)
        expect(bulk_downloads[0]["user_id"]).to eq(@joe.id)
        expect(bulk_downloads[0]["download_type"]).to eq("original_input_file")
        expect(bulk_downloads[0]["num_samples"]).to eq(1)
        expect(bulk_downloads[0]["user_name"]).to eq("Joe")
        expect(bulk_downloads[0]["execution_type"]).to eq("ecs")
        expect(bulk_downloads[0]["log_url"]).to match("MOCK_TASK_ARN")
      end
    end

    describe "POST #create" do
      before do
        AppConfigHelper.set_app_config(AppConfig::MAX_OBJECTS_BULK_DOWNLOAD, 100)
        AppConfigHelper.set_app_config(AppConfig::MAX_SAMPLES_BULK_DOWNLOAD_ORIGINAL_FILES, 50)
        stub_const('ENV', ENV.to_hash.merge("SERVER_DOMAIN" => "https://czid.org",
                                            "SAMPLES_BUCKET_NAME" => "czid-samples-prod"))
        Aws.config[:states] = {
          stub_responses: {
            describe_execution: fake_sfn_execution_description,
            list_tags_for_resource: {
              tags: [
                { key: "wdl_version", value: fake_wdl_version },
                { key: "dag_version", value: fake_dag_version },
              ],
            },
          },
        }
      end

      it "should ignore max samples limit if admin" do
        @sample_one = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
        @sample_two = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        # Set MAX_OBJECTS_BULK_DOWNLOAD to 1
        AppConfigHelper.set_app_config(AppConfig::MAX_OBJECTS_BULK_DOWNLOAD, 1)

        bulk_download_params = {
          download_type: "sample_overview",
          sample_ids: [@sample_one, @sample_two],
          workflow: WorkflowRun::WORKFLOW[:short_read_mngs],
        }

        post :create, params: bulk_download_params
        expect(response).to have_http_status(200)
      end

      it "should allow uploader-only downloads with samples the admin didn't upload" do
        @sample_one = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }], user: @joe)
        @sample_two = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }], user: @admin)

        # This runs "aegea ecs run", which won't succeed in CI, so we must mock it out.
        allow(Open3).to receive(:capture3)
          .and_return(
            [JSON.generate("taskArn": "ABC"), "", instance_double(Process::Status, exitstatus: 0)]
          )

        bulk_download_params = {
          # This download type is uploader-only.
          download_type: "original_input_file",
          sample_ids: [@sample_one, @sample_two],
          workflow: WorkflowRun::WORKFLOW[:short_read_mngs],
        }

        post :create, params: bulk_download_params
        expect(response).to have_http_status(200)
      end

      it "allows collaborator-only downloads with samples on which the admin is not a collaborator" do
        @sample_one = create(:sample, project: @project, user: @joe, pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
        @user = create(:user)
        @public_project = create(:project, users: [@user], public_access: 1)
        @public_sample = create(:sample, project: @public_project, pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        # This runs "aegea ecs run", which won't succeed in CI, so we must mock it out.
        allow(Open3).to receive(:capture3)
          .and_return(
            [JSON.generate("taskArn": "ABC"), "", instance_double(Process::Status, exitstatus: 0)]
          )

        bulk_download_params = {
          # This download type is collaborator-only.
          download_type: BulkDownloadTypesHelper::HOST_GENE_COUNTS_BULK_DOWNLOAD_TYPE,
          sample_ids: [@sample_one.id, @public_sample.id],
          workflow: WorkflowRun::WORKFLOW[:short_read_mngs],
        }

        post :create, params: bulk_download_params
        puts(response.body)
        expect(response).to have_http_status(:ok)
      end
    end
  end

  context "NO user logged in" do
    before do
      @project = create(:project, users: [@joe])
    end

    describe "GET #success_with_token" do
      before do
        @sample_one = create(:sample, project: @project, name: "Joes Sample",
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        @bulk_download_joe = create(:bulk_download, user: @joe, status: BulkDownload::STATUS_RUNNING, pipeline_run_ids: [@sample_one.first_pipeline_run.id], download_type: "unmapped_reads")
      end

      let(:mock_file_size) { 1000 }

      it "should properly update bulk download on success" do
        expect(S3_CLIENT).to receive(:head_object).exactly(1).times.and_return(
          instance_double(Aws::S3::Types::HeadObjectOutput, content_length: mock_file_size)
        )

        get :success_with_token, params: { format: "json", id: @bulk_download_joe.id, access_token: @bulk_download_joe.access_token }

        expect(response).to have_http_status(200)

        expect(BulkDownload.find(@bulk_download_joe.id).status).to eq(BulkDownload::STATUS_SUCCESS)
        expect(BulkDownload.find(@bulk_download_joe.id).access_token).to eq(nil)
        expect(BulkDownload.find(@bulk_download_joe.id).output_file_size).to eq(mock_file_size)
      end

      it "should update error message if error_type is FailedSrcUrlError" do
        expect(S3_CLIENT).to receive(:head_object).exactly(1).times.and_return(
          instance_double(Aws::S3::Types::HeadObjectOutput, content_length: 1000)
        )

        get :success_with_token, params: {
          format: "json",
          id: @bulk_download_joe.id,
          access_token: @bulk_download_joe.access_token,
          error_type: "FailedSrcUrlError",
          # Should count this as 2 samples even though it's 4 files.
          error_data: [
            "s3://czid-samples-test/samples/1/100/path-to-file", "s3://czid-samples-test/samples/1/100/path-to-file-2",
            "s3://czid-samples-test/samples/1/101/path-to-file", "s3://czid-samples-test/samples/1/101/path-to-file-2",
          ],
        }

        expect(response).to have_http_status(200)

        expect(BulkDownload.find(@bulk_download_joe.id).status).to eq(BulkDownload::STATUS_SUCCESS)
        expect(BulkDownload.find(@bulk_download_joe.id).error_message).to eq(BulkDownloadsHelper::FAILED_SAMPLES_ERROR_TEMPLATE % 2)
        expect(BulkDownload.find(@bulk_download_joe.id).access_token).to eq(nil)
        expect(BulkDownload.find(@bulk_download_joe.id).output_file_size).to eq(mock_file_size)
      end

      it "should be resilient to s3 HEAD failures" do
        # s3 HEAD is called to get the output_file_size
        expect(S3_CLIENT).to receive(:head_object).exactly(1).times.and_raise("Error")

        get :success_with_token, params: {
          format: "json",
          id: @bulk_download_joe.id,
          access_token: @bulk_download_joe.access_token,
        }

        expect(response).to have_http_status(200)

        expect(BulkDownload.find(@bulk_download_joe.id).status).to eq(BulkDownload::STATUS_SUCCESS)
        expect(BulkDownload.find(@bulk_download_joe.id).access_token).to eq(nil)
        # The output_file_size could not be fetched, so it is set to nil.
        expect(BulkDownload.find(@bulk_download_joe.id).output_file_size).to eq(nil)
      end
    end

    describe "GET #error_with_token" do
      before do
        @sample_one = create(:sample, project: @project, name: "Joes Sample",
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        @bulk_download_joe = create(:bulk_download, user: @joe, status: BulkDownload::STATUS_RUNNING, pipeline_run_ids: [@sample_one.first_pipeline_run.id], download_type: "unmapped_reads")
      end

      it "should properly update bulk download on success" do
        get :error_with_token, params: {
          format: "json",
          id: @bulk_download_joe.id,
          access_token: @bulk_download_joe.access_token,
          error_message: "Test Error Message",
        }

        expect(response).to have_http_status(200)

        expect(BulkDownload.find(@bulk_download_joe.id).status).to eq(BulkDownload::STATUS_ERROR)
        expect(BulkDownload.find(@bulk_download_joe.id).error_message).to eq("Test Error Message")
        expect(BulkDownload.find(@bulk_download_joe.id).access_token).to eq(nil)
      end
    end

    describe "GET #progress_with_token" do
      before do
        @sample_one = create(:sample, project: @project, name: "Joes Sample",
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        @bulk_download_joe = create(:bulk_download, user: @joe, status: BulkDownload::STATUS_RUNNING, pipeline_run_ids: [@sample_one.first_pipeline_run.id], download_type: "unmapped_reads")
      end

      it "should properly update bulk download on success" do
        get :progress_with_token, params: {
          format: "json",
          id: @bulk_download_joe.id,
          access_token: @bulk_download_joe.access_token,
          progress: "0.5",
        }

        expect(response).to have_http_status(200)

        expect(BulkDownload.find(@bulk_download_joe.id).status).to eq(BulkDownload::STATUS_RUNNING)
        expect(BulkDownload.find(@bulk_download_joe.id).progress).to eq(0.5)
      end
    end

    # Test that all endpoints that use tokens pass these tests.
    describe "Common token action tests" do
      before do
        @sample_one = create(:sample, project: @project, name: "Joes Sample",
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        @bulk_download_joe = create(:bulk_download, user: @joe, status: BulkDownload::STATUS_RUNNING, pipeline_run_ids: [@sample_one.first_pipeline_run.id], download_type: "unmapped_reads")
      end

      actions = BulkDownloadsController::UPDATE_WITH_TOKEN_ACTIONS

      actions.each do |action|
        context action.to_s do
          it "should return 401 if access token incorrect" do
            get :success_with_token, params: { format: "json", id: @bulk_download_joe.id, access_token: "FOOBAR" }

            expect(response).to have_http_status(401)
            json_response = JSON.parse(response.body)
            expect(json_response["error"]).to eq(BulkDownloadsHelper::INVALID_ACCESS_TOKEN)

            # Bulk download status should not be modified.
            expect(BulkDownload.find(@bulk_download_joe.id).status).to eq(BulkDownload::STATUS_RUNNING)
          end

          it "should return 404 if bulk download not found" do
            get :success_with_token, params: { format: "json", id: "FOOBAR", access_token: @bulk_download_joe.access_token }

            expect(response).to have_http_status(404)
            json_response = JSON.parse(response.body)
            expect(json_response["error"]).to eq(BulkDownloadsHelper::BULK_DOWNLOAD_NOT_FOUND)

            # Bulk download status should not be modified.
            expect(BulkDownload.find(@bulk_download_joe.id).status).to eq(BulkDownload::STATUS_RUNNING)
          end

          it "should return 401 if bulk download access token is nil" do
            previous_access_token = @bulk_download_joe.access_token
            @bulk_download_joe.update(access_token: nil)
            get :success_with_token, params: { format: "json", id: "FOOBAR", access_token: previous_access_token }

            expect(response).to have_http_status(404)
            json_response = JSON.parse(response.body)
            expect(json_response["error"]).to eq(BulkDownloadsHelper::BULK_DOWNLOAD_NOT_FOUND)

            # Bulk download status should not be modified.
            expect(BulkDownload.find(@bulk_download_joe.id).status).to eq(BulkDownload::STATUS_RUNNING)
          end
        end
      end
    end
  end
end
