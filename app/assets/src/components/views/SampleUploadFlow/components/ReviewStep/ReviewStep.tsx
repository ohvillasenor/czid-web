import cx from "classnames";
import { get, keyBy } from "lodash/fp";
import React from "react";
import {
  ANALYTICS_EVENT_NAMES,
  trackEvent,
  withAnalytics,
} from "~/api/analytics";
import { getProjectMetadataFields } from "~/api/metadata";
import { TaxonOption } from "~/components/common/filters/types";
import { UserContext } from "~/components/common/UserContext";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import {
  HostGenome,
  MetadataBasic,
  Project,
  ProjectPipelineVersions,
  SampleFromApi,
} from "~/interface/shared";
import { UploadStepType } from "~/interface/upload";
import Checkbox from "~ui/controls/Checkbox";
import TermsAgreement from "~ui/controls/TermsAgreement";
import { Technology, UploadWorkflows, UPLOAD_WORKFLOWS } from "../../constants";
import HostOrganismMessage from "../../HostOrganismMessage";
import UploadProgressModal from "../../UploadProgressModal";
import { RefSeqAccessionDataType } from "../UploadSampleStep/types";
import { AnalysesSections } from "./components/AnalysesSections";
import { ProjectInfo } from "./components/ProjectInfo";
import { ReviewHeader } from "./components/ReviewHeader";
import { SampleInfo } from "./components/SampleInfo";
import cs from "./review_step.scss";

interface ReviewStepProps {
  admin?: boolean;
  bedFile?: File;
  clearlabs?: boolean;
  guppyBasecallerSetting?: string;
  hostGenomes?: HostGenome[];
  medakaModel?: string;
  metadata?: MetadataBasic;
  // Triggers when we start or stop uploading. Lets the parent know to disable header link.
  onUploadComplete: $TSFixMeFunction;
  onUploadStatusChange?: $TSFixMeFunction;
  onStepSelect?(UploadStepType): void;
  originalHostGenomes?: HostGenome[];
  pipelineVersions: { [projectId: string]: ProjectPipelineVersions };
  project?: Project;
  refSeqAccession?: RefSeqAccessionDataType;
  refSeqFile?: File;
  refSeqTaxon?: TaxonOption;
  samples?: SampleFromApi[];
  uploadType: string;
  visible?: boolean;
  technology?: Technology;
  workflows?: Set<UploadWorkflows>;
  wetlabProtocol?: string;
}

interface ReviewStepState {
  consentChecked: boolean;
  projectMetadataFields: $TSFixMeUnknown;
  showUploadModal: boolean;
  skipSampleProcessing: boolean;
  useStepFunctionPipeline: boolean;
  adminOptions: Record<string, string>;
}

class ReviewStep extends React.Component<ReviewStepProps, ReviewStepState> {
  state: ReviewStepState = {
    consentChecked: false,
    projectMetadataFields: null,
    showUploadModal: false,
    skipSampleProcessing: false,
    useStepFunctionPipeline: true,
    adminOptions: {},
  };

  componentDidMount() {
    this.loadProjectMetadataFields();
  }

  loadProjectMetadataFields = async () => {
    const { project } = this.props;
    const projectMetadataFields = await getProjectMetadataFields(project.id);
    this.setState({
      projectMetadataFields: keyBy("key", projectMetadataFields),
    });
  };

  uploadSamplesAndMetadata = () => {
    const { onUploadStatusChange } = this.props;

    onUploadStatusChange(true);

    this.setState({
      showUploadModal: true,
    });

    this.setState({});
  };

  onLinkClick = (link: UploadStepType) => {
    const areLinksEnabled = !this.state.showUploadModal;

    if (areLinksEnabled) {
      this.props.onStepSelect(link);
    }
  };

  handleAdminOptionsChanged = (
    adminOptions: ReviewStepState["adminOptions"],
  ) => {
    this.setState({ adminOptions });
  };

  toggleSkipSampleProcessing = () => {
    const { skipSampleProcessing } = this.state;
    this.setState({
      skipSampleProcessing: !skipSampleProcessing,
    });
  };

  render() {
    const {
      adminOptions,
      consentChecked,
      projectMetadataFields,
      showUploadModal,
      skipSampleProcessing,
      useStepFunctionPipeline,
    } = this.state;

    const {
      bedFile,
      clearlabs,
      guppyBasecallerSetting,
      technology,
      hostGenomes,
      medakaModel,
      metadata,
      onUploadComplete,
      originalHostGenomes,
      pipelineVersions,
      refSeqAccession,
      refSeqFile,
      refSeqTaxon,
      project,
      samples,
      uploadType,
      visible,
      wetlabProtocol,
      workflows,
    } = this.props;

    const { userSettings } = this.context || {};

    const areLinksEnabled = !showUploadModal;

    return (
      <div
        className={cx(cs.reviewStep, cs.uploadFlowStep, visible && cs.visible)}
      >
        <div className={cs.flexContent}>
          <ProjectInfo
            areLinksEnabled={areLinksEnabled}
            onLinkClick={this.onLinkClick}
            uploadType={uploadType}
            project={project}
          />
          <div className={cs.sectionContainer}>
            <ReviewHeader
              areLinksEnabled={areLinksEnabled}
              onLinkClick={this.onLinkClick}
              project={project}
              uploadType={uploadType}
            />
            <AnalysesSections
              pipelineVersions={pipelineVersions}
              project={project}
              workflows={workflows}
              technology={technology}
              clearlabs={clearlabs}
              medakaModel={medakaModel}
              wetlabProtocol={wetlabProtocol}
              guppyBasecallerSetting={guppyBasecallerSetting}
              refSeqTaxon={refSeqTaxon?.name}
              refSeqFile={refSeqFile?.name}
              bedFile={bedFile?.name}
            />
          </div>
          <SampleInfo
            adminOptions={adminOptions}
            areLinksEnabled={areLinksEnabled}
            onAdminOptionsChanged={this.handleAdminOptionsChanged}
            onLinkClick={this.onLinkClick}
            project={project}
            uploadType={uploadType}
            hostGenomes={hostGenomes}
            metadata={metadata}
            projectMetadataFields={projectMetadataFields}
            samples={samples}
          />
        </div>
        <div className={cs.controls}>
          {workflows.has(UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value) || ( // TODO (mlila): should be with viral cg as well?
            <HostOrganismMessage
              hostGenomes={originalHostGenomes}
              samples={samples}
            />
          )}
          {/* This is only for admins and QA testers. */}
          {get("show_skip_processing_option", userSettings) && (
            <Checkbox
              className={cs.sampleProcessingOption}
              checked={skipSampleProcessing}
              onChange={this.toggleSkipSampleProcessing}
              label="Skip sample processing after upload is complete."
            />
          )}
          <TermsAgreement
            checked={consentChecked}
            onChange={() =>
              this.setState(
                {
                  consentChecked: !consentChecked,
                },
                () =>
                  trackEvent("ReviewStep_consent-checkbox_checked", {
                    consentChecked: consentChecked,
                  }),
              )
            }
          />
          {!showUploadModal && (
            <PrimaryButton
              text="Start Upload"
              disabled={!consentChecked}
              onClick={withAnalytics(
                this.uploadSamplesAndMetadata,
                ANALYTICS_EVENT_NAMES.REVIEW_STEP_START_UPLOAD_BUTTON_CLICKED,
                {
                  samples: samples.length,
                  uploadType: uploadType,
                },
              )}
            />
          )}
          {showUploadModal && (
            <UploadProgressModal
              adminOptions={adminOptions}
              bedFile={bedFile}
              clearlabs={clearlabs}
              guppyBasecallerSetting={guppyBasecallerSetting}
              technology={technology}
              medakaModel={medakaModel}
              metadata={metadata}
              onUploadComplete={onUploadComplete}
              project={project}
              refSeqAccession={refSeqAccession}
              refSeqFile={refSeqFile}
              refSeqTaxon={refSeqTaxon}
              samples={samples}
              skipSampleProcessing={skipSampleProcessing}
              uploadType={uploadType}
              useStepFunctionPipeline={useStepFunctionPipeline}
              wetlabProtocol={wetlabProtocol}
              workflows={workflows}
            />
          )}
        </div>
      </div>
    );
  }
}

ReviewStep.contextType = UserContext;

export default ReviewStep;
