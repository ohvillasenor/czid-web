import cx from "classnames";
import React from "react";
import { ILLUMINA_MNGS_PINNED_PIPELINE_VERSION_HELP_LINK } from "~/components/utils/documentationLinks";
import {
  isPipelineFeatureAvailable,
  SHORT_READ_MNGS_MODERN_HOST_FILTERING_FEATURE,
} from "~/components/utils/pipeline_versions";
import { WORKFLOWS } from "~/components/utils/workflows";
import cs from "~/components/views/SampleUploadFlow/components/WorkflowSelector/workflow_selector.scss";
import { ProjectPipelineVersions, SampleUploadType } from "~/interface/shared";
import {
  SEQUENCING_TECHNOLOGY_OPTIONS,
  UploadWorkflows,
  UPLOAD_WORKFLOWS,
} from "../../../../constants";
import { shouldDisableSequencingPlatformOption } from "../../WorkflowSelector";
import { IlluminaSequencingPlatformOption } from "../IlluminaSequencingPlatformOption";
import { MetagenomicsWithNanopore } from "./components/MetagenomicsWithNanopore";

interface MetagenomicsSequencingPlatformOptionsProps {
  currentTab: SampleUploadType;
  onChangeGuppyBasecallerSetting(selected: string): void;
  onTechnologyToggle(
    workflow: UploadWorkflows,
    technology: SEQUENCING_TECHNOLOGY_OPTIONS,
  ): void;
  onWetlabProtocolChange(value: string): void;
  selectedGuppyBasecallerSetting: string;
  selectedTechnology: SEQUENCING_TECHNOLOGY_OPTIONS;
  selectedWetlabProtocol: string;
  projectPipelineVersions?: ProjectPipelineVersions;
}

const MetagenomicsSequencingPlatformOptions = ({
  currentTab,
  onChangeGuppyBasecallerSetting,
  onTechnologyToggle,
  onWetlabProtocolChange,
  selectedGuppyBasecallerSetting,
  selectedTechnology,
  selectedWetlabProtocol,
  projectPipelineVersions,
}: MetagenomicsSequencingPlatformOptionsProps) => {
  const { ILLUMINA, NANOPORE } = SEQUENCING_TECHNOLOGY_OPTIONS;
  const MNGS = UPLOAD_WORKFLOWS.MNGS.value;
  const isPinnedVersion =
    projectPipelineVersions?.[WORKFLOWS.SHORT_READ_MNGS.value] &&
    !isPipelineFeatureAvailable(
      SHORT_READ_MNGS_MODERN_HOST_FILTERING_FEATURE,
      projectPipelineVersions?.[WORKFLOWS.SHORT_READ_MNGS.value],
    );

  return (
    <button
      className={cx(cs.optionText, "noStyleButton")}
      onClick={e => e.stopPropagation()}
    >
      <div className={cx(cs.title, cs.technologyTitle)}>
        Sequencing Platform:
      </div>
      <div className={cs.technologyOptions}>
        <IlluminaSequencingPlatformOption
          isCg={false}
          isPinnedVersion={isPinnedVersion}
          isSelected={selectedTechnology === ILLUMINA}
          onClick={() => onTechnologyToggle(MNGS, ILLUMINA)}
          selectedWetlabProtocol={selectedWetlabProtocol}
          onWetlabProtocolChange={onWetlabProtocolChange}
          pipelineVersion={
            projectPipelineVersions?.[WORKFLOWS.SHORT_READ_MNGS.value]
          }
          versionHelpLink={ILLUMINA_MNGS_PINNED_PIPELINE_VERSION_HELP_LINK}
        />
        <MetagenomicsWithNanopore
          isDisabled={shouldDisableSequencingPlatformOption(
            currentTab,
            NANOPORE,
            MNGS,
          )}
          isSelected={selectedTechnology === NANOPORE}
          onClick={() => onTechnologyToggle(MNGS, NANOPORE)}
          selectedGuppyBasecallerSetting={selectedGuppyBasecallerSetting}
          onChangeGuppyBasecallerSetting={onChangeGuppyBasecallerSetting}
          pipelineVersion={
            projectPipelineVersions?.[WORKFLOWS.LONG_READ_MNGS.value]
          }
        />
      </div>
    </button>
  );
};

export { MetagenomicsSequencingPlatformOptions };
