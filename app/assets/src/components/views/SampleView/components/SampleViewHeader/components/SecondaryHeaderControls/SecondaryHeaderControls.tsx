import { Button } from "@czi-sds/components";
import { get } from "lodash/fp";
import React from "react";
import { ANALYTICS_EVENT_NAMES, withAnalytics } from "~/api/analytics";
import {
  isMngsWorkflow,
  WORKFLOWS,
  WORKFLOW_VALUES,
} from "~/components/utils/workflows";
import { PipelineVersionSelect } from "~/components/views/components/PipelineVersionSelect";
import Sample, { WorkflowRun } from "~/interface/sample";
import { PipelineRun } from "~/interface/shared";
import cs from "./secondary_header_controls.scss";

interface SecondaryHeaderControlsProps {
  sample: Sample;
  currentRun: WorkflowRun | PipelineRun;
  getAllRuns: () => WorkflowRun[] | PipelineRun[];
  workflow: WORKFLOW_VALUES;
  onPipelineVersionChange: (newPipelineVersion: string) => void;
  userIsAdmin: boolean;
  onDetailsClick: () => void;
}

export const SecondaryHeaderControls = ({
  sample,
  currentRun,
  getAllRuns,
  workflow,
  onPipelineVersionChange,
  userIsAdmin,
  onDetailsClick,
}: SecondaryHeaderControlsProps) => {
  return (
    <div className={cs.controlsTopRowContainer}>
      <PipelineVersionSelect
        sampleId={get("id", sample)}
        // show the CARD db version for AMR but not for other workflows
        shouldIncludeDatabaseVersion={workflow === "amr"}
        currentRun={currentRun}
        allRuns={getAllRuns()}
        workflowType={workflow}
        versionKey={
          isMngsWorkflow(workflow) ? "pipeline_version" : "wdl_version"
        }
        timeKey={isMngsWorkflow(workflow) ? "created_at" : "executed_at"}
        onVersionChange={onPipelineVersionChange}
      />
      {userIsAdmin && workflow !== WORKFLOWS.CONSENSUS_GENOME.value && (
        <>
          <Button
            className={cs.controlElement}
            sdsType="primary"
            sdsStyle="minimal"
            isAllCaps
            onClick={() =>
              (location.href = `/samples/${sample?.id}/pipeline_runs`)
            }
          >
            Pipeline Runs
          </Button>
          <span className={cs.seperator}> | </span>
        </>
      )}
      <Button
        data-testid="sample-details"
        sdsType="primary"
        sdsStyle="minimal"
        isAllCaps={true}
        onClick={withAnalytics(
          onDetailsClick,
          ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_SAMPLE_DETAILS_LINK_CLICKED,
          {
            sampleId: sample?.id,
          },
        )}
      >
        Sample Details
      </Button>
    </div>
  );
};
