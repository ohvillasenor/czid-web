require "rails_helper"

RSpec.describe BulkDeletionService, type: :service do
  create_users

  let(:short_read_mngs) { WorkflowRun::WORKFLOW[:short_read_mngs] }
  let(:long_read_mngs) { WorkflowRun::WORKFLOW[:long_read_mngs] }
  let(:consensus_genome) { WorkflowRun::WORKFLOW[:consensus_genome] }
  let(:amr) { WorkflowRun::WORKFLOW[:amr] }
  let(:illumina) { PipelineRun::TECHNOLOGY_INPUT[:illumina] }
  let(:nanopore) { PipelineRun::TECHNOLOGY_INPUT[:nanopore] }

  context "when no workflow is passed in" do
    it "raises an error" do
      expect do
        BulkDeletionService.call(
          object_ids: [],
          user: @joe,
          workflow: nil
        )
      end.to raise_error(DeletionValidationService::WorkflowMissingError)
    end
  end

  context "when no object ids are passed in" do
    it "returns an object with empty arrays of ids" do
      validate_samples = BulkDeletionService.call(
        object_ids: [],
        user: @joe,
        workflow: short_read_mngs
      )
      expect(validate_samples[:deleted_run_ids]).to be_empty
    end
  end

  context "when sample ids are passed in for mNGS workflows" do
    before do
      @project = create(:project, users: [@joe, @admin])
      @sample1 = create(:sample, project: @project,
                                 user: @joe,
                                 name: "completed Illumina mNGs sample 1",
                                 initial_workflow: short_read_mngs)
      @pr1 = create(:pipeline_run, sample: @sample1, technology: illumina, finalized: 1)
      @sample2 = create(:sample, project: @project,
                                 user: @joe,
                                 name: "completed Illumina mNGs sample 2",
                                 initial_workflow: short_read_mngs)
      @pr2 = create(:pipeline_run, sample: @sample2, technology: illumina, finalized: 1)
      @sample3 = create(:sample, project: @project,
                                 user: @joe,
                                 name: "completed Illumina mNGs sample 3")
      @pr3 = create(:pipeline_run, sample: @sample3, technology: illumina, finalized: 1)

      @sample_with_deprecated_pr = create(:sample, project: @project,
                                                   user: @joe,
                                                   name: "Illumina mNGs sample with deprecated pr",
                                                   initial_workflow: short_read_mngs)
      @deprecated_pr = create(:pipeline_run, sample: @sample_with_deprecated_pr, technology: illumina, finalized: 1, deprecated: true)
      @active_pr = create(:pipeline_run, sample: @sample_with_deprecated_pr, technology: illumina, finalized: 1, deprecated: false)

      @sample_no_prs = create(:sample, project: @project,
                                       user: @joe,
                                       name: "failed upload Illumina mNGs sample 1",
                                       initial_workflow: short_read_mngs)
    end

    it "returns deletable pipeline run ids and sample ids for samples" do
      response = BulkDeletionService.call(
        object_ids: [@sample1.id, @sample2.id],
        user: @joe,
        workflow: short_read_mngs
      )
      expect(response[:error]).to be_nil
      expect(response[:deleted_run_ids]).to contain_exactly(@pr1.id, @pr2.id)
      expect(response[:deleted_sample_ids]).to contain_exactly(@sample1.id, @sample2.id)
    end

    it "sets the deleted_at field to current time" do
      response = BulkDeletionService.call(
        object_ids: [@sample1.id, @sample2.id],
        user: @joe,
        workflow: short_read_mngs
      )
      expect(response[:error]).to be_nil
      @pr1.reload
      @pr2.reload
      expect(@pr1.deleted_at).to be_within(1.minute).of(Time.now.utc)
      expect(@pr2.deleted_at).to be_within(1.minute).of(Time.now.utc)
    end

    context "when the samples have associated tables/trees" do
      before do
        @tree = create(:visualization, visualization_type: "tree", user_id: @joe.id, name: "Test Tree", samples: [@sample1])
        @table = create(:visualization, visualization_type: "table", user_id: @joe.id, name: "Test Table", samples: [@sample1])
      end

      it "deletes associated tables/trees" do
        BulkDeletionService.call(
          object_ids: [@sample1.id, @sample2.id],
          user: @joe,
          workflow: "short-read-mngs"
        )
        expect(Visualization.find_by(id: @tree.id)).to be_nil
        expect(Visualization.find_by(id: @table.id)).to be_nil
      end
    end

    context "when the samples have associated heatmaps" do
      before do
        @heatmap = create(:visualization, visualization_type: "heatmap", user_id: @joe.id, name: "Test Heatmap", samples: [@sample1, @sample2, @sample3])
      end

      it "deletes associated heatmaps - not enough samples left" do
        BulkDeletionService.call(
          object_ids: [@sample1.id, @sample2.id],
          user: @joe,
          workflow: "short-read-mngs"
        )
        expect(Visualization.find_by(id: @heatmap.id)).to be_nil
      end

      it "updates associated heatmaps - enough samples left" do
        BulkDeletionService.call(
          object_ids: [@sample1.id],
          user: @joe,
          workflow: "short-read-mngs"
        )
        expect(Visualization.find_by(id: @heatmap.id)).to_not be_nil
        expect(Visualization.find_by(id: @heatmap.id).sample_ids).to contain_exactly(@sample2.id, @sample3.id)
      end
    end

    context "when the samples have associated phylo trees" do
      before do
        @pr4 = create(:pipeline_run, sample: @sample3, technology: illumina, finalized: 1)
        @pr5 = create(:pipeline_run, sample: @sample3, technology: illumina, finalized: 1)
        @phylo_tree = create(:phylo_tree, user_id: @joe.id, name: "Test Phylo Tree", pipeline_runs: [@pr1, @pr2])
        @phylo_tree_ng = create(:phylo_tree_ng, user_id: @joe.id, name: "Test Phylo Tree Ng", pipeline_runs: [@pr1, @pr2, @pr3, @pr4, @pr5])
      end

      it "marks deprecated phylo trees for deletion" do
        BulkDeletionService.call(
          object_ids: [@sample1.id],
          user: @joe,
          workflow: "short-read-mngs"
        )
        @phylo_tree.reload
        expect(@phylo_tree.deleted_at).to be_within(1.minute).of(Time.now.utc)
        expect(Visualization.find_by(data: { treeId: @phylo_tree.id })).to be_nil
      end

      it "updates phylotrees - enough samples left" do
        BulkDeletionService.call(
          object_ids: [@sample1.id],
          user: @joe,
          workflow: "short-read-mngs"
        )
        @phylo_tree_ng.reload
        expect(@phylo_tree_ng.deprecated).to be true
        expect(@phylo_tree_ng.deleted_at).to be_within(1.minute).of(Time.now.utc)
        expect(Visualization.find_by(data: { treeId: @phylo_tree_ng.id })).to be_nil

        # check that phylo tree was rerun with subset of pipeline runs
        # should be rerun without pr1
        @pr2.reload
        new_phylo_tree = @pr2.phylo_tree_ngs.non_deleted.first
        expect(new_phylo_tree.pipeline_run_ids).to match_array([@pr2, @pr3, @pr4, @pr5].map(&:id))
      end

      it "deletes phylotrees - not enough samples left" do
        BulkDeletionService.call(
          object_ids: [@sample1.id, @sample2.id],
          user: @joe,
          workflow: "short-read-mngs"
        )
        @phylo_tree_ng.reload
        expect(@phylo_tree_ng.deprecated).to be false
        expect(@phylo_tree_ng.deleted_at).to be_within(1.minute).of(Time.now.utc)
        expect(Visualization.find_by(data: { treeId: @phylo_tree_ng.id })).to be_nil
      end
    end

    it "marks deprecated pipeline runs as deleted" do
      response = BulkDeletionService.call(
        object_ids: [@sample_with_deprecated_pr.id],
        user: @joe,
        workflow: short_read_mngs
      )
      expect(response[:deleted_run_ids]).to contain_exactly(@deprecated_pr.id, @active_pr.id)
      expect(response[:deleted_sample_ids]).to contain_exactly(@sample_with_deprecated_pr.id)
      @deprecated_pr.reload
      expect(@deprecated_pr.deleted_at).to be_within(1.minute).of(Time.now.utc)
      @active_pr.reload
      expect(@active_pr.deleted_at).to be_within(1.minute).of(Time.now.utc)
    end

    it "creates a DeletionLog entry for the pipeline run for GDPR compliance" do
      run_deletion_metadata = {
        project_id: @sample1.project.id,
        project_name: @sample1.project.name,
        sample_id: @sample1.id,
        sample_name: @sample1.name,
        workflow: short_read_mngs,
      }.to_json

      BulkDeletionService.call(
        object_ids: [@sample1.id],
        user: @joe,
        workflow: short_read_mngs
      )
      log = DeletionLog.find_by(object_id: @pr1.id, object_type: "PipelineRun", user_id: @joe.id)
      expect(log).not_to be(nil)
      expect(log.user_email).to eq(@joe.email)
      expect(log.soft_deleted_at).to be_within(1.minute).of(Time.now.utc)
      expect(log.metadata_json).to eq(run_deletion_metadata)
    end

    context "when the sample failed to upload" do
      it "allows deletion of failed uploads with no successful uploads" do
        expect(Resque).to receive(:enqueue).with(
          HardDeleteObjects, [], [@sample_no_prs.id], short_read_mngs, @joe.id
        )
        response = BulkDeletionService.call(
          object_ids: [@sample_no_prs.id],
          user: @joe,
          workflow: "short-read-mngs"
        )
        expect(response[:error]).to be_nil
        expect(response[:deleted_run_ids]).to be_empty
        expect(response[:deleted_sample_ids]).to contain_exactly(@sample_no_prs.id)
        @sample_no_prs.reload
        expect(@sample_no_prs.deleted_at).to be_within(1.minute).of(Time.now.utc)
      end

      it "allows deletion of failed uploads in the same request as successful uploads" do
        expect(Resque).to receive(:enqueue).with(
          HardDeleteObjects, [], [@sample_no_prs.id], short_read_mngs, @joe.id
        )
        expect(Resque).to receive(:enqueue).with(
          HardDeleteObjects, [@pr1.id], [@sample1.id], short_read_mngs, @joe.id
        )
        response = BulkDeletionService.call(
          object_ids: [@sample_no_prs.id, @sample1.id],
          user: @joe,
          workflow: "short-read-mngs"
        )
        expect(response[:error]).to be_nil
        expect(response[:deleted_run_ids]).to contain_exactly(@pr1.id)
        expect(response[:deleted_sample_ids]).to contain_exactly(@sample_no_prs.id, @sample1.id)
        @sample_no_prs.reload
        expect(@sample_no_prs.deleted_at).to be_within(1.minute).of(Time.now.utc)
        @sample1.reload
        expect(@sample1.deleted_at).to be_within(1.minute).of(Time.now.utc)
      end

      it "creates a DeletionLog entry for the sample" do
        sample_deletion_metadata = {
          project_id: @sample_no_prs.project.id,
          project_name: @sample_no_prs.project.name,
          sample_id: @sample_no_prs.id,
          sample_name: @sample_no_prs.name,
        }.to_json

        BulkDeletionService.call(
          object_ids: [@sample_no_prs.id],
          user: @joe,
          workflow: "short-read-mngs"
        )
        log = DeletionLog.find_by(object_id: @sample_no_prs.id, object_type: Sample.name, user_id: @joe.id)
        expect(log).not_to be(nil)
        expect(log.user_email).to eq(@joe.email)
        expect(log.soft_deleted_at).to be_within(1.minute).of(Time.now.utc)
        expect(log.metadata_json).to eq(sample_deletion_metadata)
      end
    end

    context "when a user submits a large bulk deletion" do
      before do
        @sample_ids = []
        @pipeline_run_ids = []
        11.times do |n|
          sample = create(:sample, project: @project,
                                   user: @joe,
                                   name: "sample #{n}",
                                   initial_workflow: short_read_mngs)
          pr = create(:pipeline_run, sample: sample, technology: illumina, finalized: 1)
          @sample_ids << sample.id
          @pipeline_run_ids << pr.id
        end
        @sample_ids << @sample_no_prs.id
      end

      it "batches the hard deletion jobs" do
        expect(Resque).to receive(:enqueue).with(
          HardDeleteObjects,
          [],
          [@sample_no_prs.id],
          short_read_mngs,
          @joe.id
        )
        expect(Resque).to receive(:enqueue).with(
          HardDeleteObjects,
          @pipeline_run_ids.slice(0, 10),
          @sample_ids.slice(0, 10),
          short_read_mngs,
          @joe.id
        )
        expect(Resque).to receive(:enqueue).with(
          HardDeleteObjects,
          [@pipeline_run_ids[10]],
          [@sample_ids[10]],
          short_read_mngs,
          @joe.id
        )
        BulkDeletionService.call(
          object_ids: @sample_ids,
          user: @joe,
          workflow: "short-read-mngs"
        )
      end
    end

    context "when the initial workflow is short read mNGS" do
      context "when the sample has CG and AMR runs" do
        before do
          create(:workflow_run, sample: @sample1, user_id: @joe.id, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded])
          create(:workflow_run, sample: @sample1, user_id: @joe.id, workflow: amr, status: WorkflowRun::STATUS[:succeeded])
        end

        it "sets the initial workflow to CG" do
          response = BulkDeletionService.call(
            object_ids: [@sample1.id],
            user: @joe,
            workflow: short_read_mngs
          )
          @sample1.reload

          expect(@sample1.initial_workflow).to eq(consensus_genome)
          expect(@sample1.deleted_at).to be_nil
          expect(response[:deleted_sample_ids]).to be_empty
        end

        it "sends all sample ids to the async hard-delete job" do
          expect(Resque).to receive(:enqueue).with(
            HardDeleteObjects, [@pr1.id, @pr2.id], [@sample1.id, @sample2.id], short_read_mngs, @joe.id
          )
          BulkDeletionService.call(
            object_ids: [@sample1.id, @sample2.id],
            user: @joe,
            workflow: short_read_mngs
          )
        end
      end

      context "when the sample has an AMR run and no CG runs" do
        before do
          create(:workflow_run, sample: @sample1, user_id: @joe.id, workflow: amr, status: WorkflowRun::STATUS[:succeeded])
        end

        it "sets the initial workflow to AMR" do
          response = BulkDeletionService.call(
            object_ids: [@sample1.id],
            user: @joe,
            workflow: short_read_mngs
          )
          @sample1.reload

          expect(@sample1.initial_workflow).to eq(amr)
          expect(@sample1.deleted_at).to be_nil
          expect(response[:deleted_sample_ids]).to be_empty
        end

        it "sends all sample ids to the async hard-delete job" do
          expect(Resque).to receive(:enqueue).with(
            HardDeleteObjects, [@pr1.id, @pr2.id], [@sample1.id, @sample2.id], short_read_mngs, @joe.id
          )
          BulkDeletionService.call(
            object_ids: [@sample1.id, @sample2.id],
            user: @joe,
            workflow: short_read_mngs
          )
        end
      end

      context "when the sample has no other runs" do
        it "sets the deleted_at column to the current timestamp" do
          response = BulkDeletionService.call(
            object_ids: [@sample1.id],
            user: @joe,
            workflow: short_read_mngs
          )
          @sample1.reload

          expect(@sample1.initial_workflow).to eq(short_read_mngs)
          expect(@sample1.deleted_at).to be_within(1.minute).of(Time.now.utc)
          expect(response[:deleted_sample_ids]).to include(@sample1.id)
        end

        it "creates a DeletionLog entry for the sample for GDPR compliance" do
          sample_deletion_metadata = {
            project_id: @sample1.project.id,
            project_name: @sample1.project.name,
            sample_id: @sample1.id,
            sample_name: @sample1.name,
          }.to_json

          BulkDeletionService.call(
            object_ids: [@sample1.id],
            user: @joe,
            workflow: short_read_mngs
          )
          log = DeletionLog.find_by(object_id: @sample1.id, object_type: "Sample", user_id: @joe.id)
          expect(log).not_to be(nil)
          expect(log.user_email).to eq(@joe.email)
          expect(log.soft_deleted_at).to be_within(1.minute).of(Time.now.utc)
          expect(log.metadata_json).to eq(sample_deletion_metadata)
        end

        it "sends all sample ids to the async hard-delete job" do
          expect(Resque).to receive(:enqueue).with(
            HardDeleteObjects, [@pr1.id], [@sample1.id], short_read_mngs, @joe.id
          )
          BulkDeletionService.call(
            object_ids: [@sample1.id],
            user: @joe,
            workflow: short_read_mngs
          )
        end
      end
    end

    # This isn't possible right now but if it becomes possible in the future we have a test for it
    context "when the initial workflow is long read mNGS" do
      before do
        @project = create(:project, users: [@joe, @admin])
        @sample1 = create(:sample, project: @project,
                                   user: @joe,
                                   name: "completed Nanopore mNGs sample 1",
                                   initial_workflow: "long-read-mngs")
        @pr1 = create(:pipeline_run, sample: @sample1, technology: nanopore, finalized: 1)
      end

      context "when the sample has CG runs and AMR runs" do
        before do
          create(:workflow_run, sample: @sample1, user_id: @joe.id, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded])
          create(:workflow_run, sample: @sample1, user_id: @joe.id, workflow: amr, status: WorkflowRun::STATUS[:succeeded])
        end

        it "sets the initial workflow to CG" do
          response = BulkDeletionService.call(
            object_ids: [@sample1.id],
            user: @joe,
            workflow: "long-read-mngs"
          )
          @sample1.reload

          expect(@sample1.initial_workflow).to eq(consensus_genome)
          expect(@sample1.deleted_at).to be_nil
          expect(response[:deleted_sample_ids]).to be_empty
        end

        it "sends all sample ids to the async hard-delete job" do
          expect(Resque).to receive(:enqueue).with(
            HardDeleteObjects, [@pr1.id], [@sample1.id], long_read_mngs, @joe.id
          )
          BulkDeletionService.call(
            object_ids: [@sample1.id],
            user: @joe,
            workflow: long_read_mngs
          )
        end
      end

      context "when the sample has AMR runs and no CG runs" do
        before do
          create(:workflow_run, sample: @sample1, user_id: @joe.id, workflow: amr, status: WorkflowRun::STATUS[:succeeded])
        end

        it "sets the initial workflow to AMR" do
          response = BulkDeletionService.call(
            object_ids: [@sample1.id],
            user: @joe,
            workflow: "long-read-mngs"
          )
          @sample1.reload

          expect(@sample1.initial_workflow).to eq(amr)
          expect(@sample1.deleted_at).to be_nil
          expect(response[:deleted_sample_ids]).to be_empty
        end

        it "sends all sample id to the async hard-delete job" do
          expect(Resque).to receive(:enqueue).with(
            HardDeleteObjects, [@pr1.id], [@sample1.id], long_read_mngs, @joe.id
          )
          BulkDeletionService.call(
            object_ids: [@sample1.id],
            user: @joe,
            workflow: long_read_mngs
          )
        end
      end

      context "when the sample has no other runs" do
        it "sets the deleted_at column to the current timestamp" do
          response = BulkDeletionService.call(
            object_ids: [@sample1.id],
            user: @joe,
            workflow: long_read_mngs
          )
          @sample1.reload

          expect(@sample1.initial_workflow).to eq(long_read_mngs)
          expect(@sample1.deleted_at).to be_within(1.minute).of(Time.now.utc)
          expect(response[:deleted_sample_ids]).to include(@sample1.id)
        end

        it "creates a DeletionLog entry for the sample for GDPR compliance" do
          sample_deletion_metadata = {
            project_id: @sample1.project.id,
            project_name: @sample1.project.name,
            sample_id: @sample1.id,
            sample_name: @sample1.name,
          }.to_json

          BulkDeletionService.call(
            object_ids: [@sample1.id],
            user: @joe,
            workflow: long_read_mngs
          )
          log = DeletionLog.find_by(object_id: @sample1.id, object_type: "Sample", user_id: @joe.id)
          expect(log).not_to be(nil)
          expect(log.user_email).to eq(@joe.email)
          expect(log.soft_deleted_at).to be_within(1.minute).of(Time.now.utc)
          expect(log.metadata_json).to eq(sample_deletion_metadata)
        end

        it "sends all sample ids to the async hard-delete job" do
          expect(Resque).to receive(:enqueue).with(
            HardDeleteObjects, [@pr1.id], [@sample1.id], long_read_mngs, @joe.id
          )
          BulkDeletionService.call(
            object_ids: [@sample1.id],
            user: @joe,
            workflow: long_read_mngs
          )
        end
      end
    end
  end

  context "when workflow run ids are passed in for CG/AMR workflows" do
    before do
      @project = create(:project, users: [@joe, @admin])
      @sample1 = create(:sample, project: @project, user: @joe, name: "Joe sample 1", initial_workflow: consensus_genome)
      @completed_wr = create(:workflow_run, sample: @sample1, user_id: @joe.id, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded])

      @sample2 = create(:sample, project: @project, user: @joe, name: "Joe sample 2", initial_workflow: consensus_genome)
      @failed_wr = create(:workflow_run, sample: @sample2, user_id: @joe.id, workflow: consensus_genome, status: WorkflowRun::STATUS[:failed])

      @sample3 = create(:sample, project: @project, user: @joe, name: "Joe sample 3", initial_workflow: amr)
      @completed_amr_wr = create(:workflow_run, sample: @sample3, user_id: @joe.id, workflow: amr, status: WorkflowRun::STATUS[:succeeded])
    end

    it "returns deletable workflow run ids and sample ids for workflow runs" do
      response = BulkDeletionService.call(
        object_ids: [@completed_wr.id, @failed_wr.id],
        user: @joe,
        workflow: consensus_genome
      )
      expect(response[:error]).to be_nil
      expect(response[:deleted_run_ids]).to contain_exactly(@completed_wr.id, @failed_wr.id)
      expect(response[:deleted_sample_ids]).to contain_exactly(@sample1.id, @sample2.id)
    end

    it "sets the deleted_at field to current time" do
      response = BulkDeletionService.call(
        object_ids: [@completed_wr.id, @failed_wr.id],
        user: @joe,
        workflow: consensus_genome
      )
      expect(response[:error]).to be_nil
      @completed_wr.reload
      @failed_wr.reload
      expect(@completed_wr.deleted_at).to be_within(1.minute).of(Time.now.utc)
      expect(@failed_wr.deleted_at).to be_within(1.minute).of(Time.now.utc)
    end

    it "creates a DeletionLog entry for the workflow run for GDPR compliance" do
      run_deletion_metadata = {
        project_id: @sample1.project.id,
        project_name: @sample1.project.name,
        sample_id: @sample1.id,
        sample_name: @sample1.name,
        workflow: consensus_genome,
      }.to_json

      BulkDeletionService.call(
        object_ids: [@completed_wr.id],
        user: @joe,
        workflow: consensus_genome
      )
      log = DeletionLog.find_by(object_id: @completed_wr.id, object_type: "WorkflowRun", user_id: @joe.id)
      expect(log).not_to be(nil)
      expect(log.user_email).to eq(@joe.email)
      expect(log.soft_deleted_at).to be_within(1.minute).of(Time.now.utc)
      expect(log.metadata_json).to eq(run_deletion_metadata)
    end

    context "when CG runs are deleted and the initial workflow is CG" do
      context "when the sample has more CG runs" do
        before do
          create(:workflow_run, sample: @sample1, user_id: @joe.id, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded])
        end

        it "maintains an initial workflow of CG" do
          response = BulkDeletionService.call(
            object_ids: [@completed_wr.id],
            user: @joe,
            workflow: consensus_genome
          )
          @sample1.reload

          expect(@sample1.initial_workflow).to eq(consensus_genome)
          expect(@sample1.deleted_at).to be_nil
          expect(response[:deleted_sample_ids]).to be_empty
        end

        it "sends all sample ids to the async hard-delete job" do
          expect(Resque).to receive(:enqueue).with(
            HardDeleteObjects, [@completed_wr.id], [@completed_wr.sample.id], consensus_genome, @joe.id
          )
          BulkDeletionService.call(
            object_ids: [@completed_wr.id],
            user: @joe,
            workflow: consensus_genome
          )
        end
      end

      context "when the sample has AMR runs" do
        before do
          create(:workflow_run, sample: @sample1, user_id: @joe.id, workflow: amr, status: WorkflowRun::STATUS[:succeeded])
        end

        it "sets the initial workflow to AMR" do
          response = BulkDeletionService.call(
            object_ids: [@completed_wr.id],
            user: @joe,
            workflow: consensus_genome
          )
          @sample1.reload

          expect(@sample1.initial_workflow).to eq(amr)
          expect(@sample1.deleted_at).to be_nil
          expect(response[:deleted_sample_ids]).to be_empty
        end

        it "sends all sample ids to async hard-delete job" do
          expect(Resque).to receive(:enqueue).with(
            HardDeleteObjects, [@completed_wr.id], [@completed_wr.sample.id], consensus_genome, @joe.id
          )
          BulkDeletionService.call(
            object_ids: [@completed_wr.id],
            user: @joe,
            workflow: consensus_genome
          )
        end
      end

      context "when the sample has no more runs" do
        it "sets the deleted_at column on the sample to the current timestamp" do
          response = BulkDeletionService.call(
            object_ids: [@completed_wr.id],
            user: @joe,
            workflow: consensus_genome
          )
          @sample1.reload

          expect(@sample1.initial_workflow).to eq(consensus_genome)
          expect(@sample1.deleted_at).to be_within(1.minute).of(Time.now.utc)
          expect(response[:deleted_sample_ids]).to contain_exactly(@sample1.id)
        end

        it "sends all sample ids to the async hard-delete job" do
          expect(Resque).to receive(:enqueue).with(
            HardDeleteObjects, [@completed_wr.id], [@sample1.id], consensus_genome, @joe.id
          )
          BulkDeletionService.call(
            object_ids: [@completed_wr.id],
            user: @joe,
            workflow: consensus_genome
          )
        end

        it "creates a DeletionLog entry for the sample for GDPR compliance" do
          sample_deletion_metadata = {
            project_id: @sample1.project.id,
            project_name: @sample1.project.name,
            sample_id: @sample1.id,
            sample_name: @sample1.name,
          }.to_json

          BulkDeletionService.call(
            object_ids: [@completed_wr.id],
            user: @joe,
            workflow: consensus_genome
          )
          log = DeletionLog.find_by(object_id: @sample1.id, object_type: "Sample", user_id: @joe.id)
          expect(log).not_to be(nil)
          expect(log.user_email).to eq(@joe.email)
          expect(log.soft_deleted_at).to be_within(1.minute).of(Time.now.utc)
          expect(log.metadata_json).to eq(sample_deletion_metadata)
        end
      end
    end

    context "when AMR runs are deleted and the initial workflow is AMR" do
      context "when the sample has no more runs" do
        it "sets the deleted_at column on the sample to the current timestamp" do
          response = BulkDeletionService.call(
            object_ids: [@completed_amr_wr.id],
            user: @joe,
            workflow: amr
          )
          @sample3.reload

          expect(@sample3.initial_workflow).to eq(amr)
          expect(@sample3.deleted_at).to be_within(1.minute).of(Time.now.utc)
          expect(response[:deleted_sample_ids]).to contain_exactly(@sample3.id)
        end

        it "sends all sample ids to the async hard-delete job" do
          expect(Resque).to receive(:enqueue).with(
            HardDeleteObjects, [@completed_amr_wr.id], [@sample3.id], amr, @joe.id
          )
          BulkDeletionService.call(
            object_ids: [@completed_amr_wr.id],
            user: @joe,
            workflow: amr
          )
        end

        it "creates a DeletionLog entry for the sample for GDPR compliance" do
          sample_deletion_metadata = {
            project_id: @sample3.project.id,
            project_name: @sample3.project.name,
            sample_id: @sample3.id,
            sample_name: @sample3.name,
          }.to_json

          BulkDeletionService.call(
            object_ids: [@completed_amr_wr.id],
            user: @joe,
            workflow: amr
          )
          log = DeletionLog.find_by(object_id: @sample3.id, object_type: "Sample", user_id: @joe.id)
          expect(log).not_to be(nil)
          expect(log.user_email).to eq(@joe.email)
          expect(log.soft_deleted_at).to be_within(1.minute).of(Time.now.utc)
          expect(log.metadata_json).to eq(sample_deletion_metadata)
        end
      end
    end
  end
end
