import cx from "classnames";
import { find, flow, get, min, omit, set, without } from "lodash/fp";
import React from "react";
import { getProjectPipelineVersions } from "~/api";
import {
  FIELDS_THAT_HAVE_MAX_INPUT,
  HOST_GENOME_SYNONYMS,
} from "~/components/common/Metadata/constants";
import NarrowContainer from "~/components/layout/NarrowContainer";
import {
  HostGenome,
  MetadataBasic,
  Project,
  ProjectPipelineVersions,
  SampleFromApi,
} from "~/interface/shared";
import { ReviewStep } from "./components/ReviewStep";
import UploadSampleStep from "./components/UploadSampleStep/UploadSampleStep";
import { Technology, UploadWorkflows } from "./constants";
import cs from "./sample_upload_flow.scss";
import SampleUploadFlowHeader from "./SampleUploadFlowHeader";
import UploadMetadataStep from "./UploadMetadataStep";

interface SampleUploadFlowProps {
  csrf?: string;
  hostGenomes?: HostGenome[];
  admin?: boolean;
  biohubS3UploadEnabled?: boolean;
  basespaceClientId: string;
  basespaceOauthRedirectUri: string;
}

interface SampleUploadFlowState {
  workflows: Set<UploadWorkflows>;
  currentStep: string;
  samples?: SampleFromApi[];
  uploadType: "remote" | "local" | "";
  project: Project;
  sampleNamesToFiles: $TSFixMeUnknown;
  bedFile?: File;
  refSeqFile?: File;
  clearlabs: boolean;
  guppyBasecallerSetting?: string;
  medakaModel: string;
  metadata?: MetadataBasic;
  metadataIssues: $TSFixMeUnknown;
  pipelineVersions: { [projectId: string]: ProjectPipelineVersions };
  technology?: Technology;
  stepsEnabled: {
    uploadSamples: boolean;
    uploadMetadata: boolean;
    review: boolean;
  };
  hostGenomes: HostGenome[];
  wetlabProtocol?: string;
}

class SampleUploadFlow extends React.Component<SampleUploadFlowProps> {
  state: SampleUploadFlowState = {
    currentStep: "uploadSamples",
    // Sample upload information
    samples: null,
    uploadType: "", // remote or local
    project: null,
    sampleNamesToFiles: null, // Needed for local samples.
    bedFile: null, // Optional for WGS samples.
    refSeqFile: null, // Needed for WGS samples.
    // Metadata upload information
    clearlabs: false,
    guppyBasecallerSetting: null,
    medakaModel: null,
    metadata: null, //
    metadataIssues: null,
    pipelineVersions: {} as { [projectId: string]: ProjectPipelineVersions },
    technology: null,
    stepsEnabled: {
      uploadSamples: true,
      uploadMetadata: false,
      review: false,
    },
    hostGenomes: [], // set on metadata upload
    workflows: new Set() as Set<UploadWorkflows>,
    wetlabProtocol: null,
  };

  componentDidMount() {
    // Latest browsers will only show a generic warning
    window.onbeforeunload = () =>
      "Are you sure you want to leave? All data will be lost.";
  }

  onUploadComplete = () => {
    window.onbeforeunload = null;
  };

  handleUploadSamples = ({
    bedFile,
    clearlabs,
    technology,
    project,
    guppyBasecallerSetting,
    medakaModel,
    refSeqFile,
    sampleNamesToFiles,
    samples,
    uploadType,
    wetlabProtocol,
    workflows,
  }: Partial<SampleUploadFlowState>) => {
    this.setState({
      bedFile,
      clearlabs,
      technology,
      currentStep: "uploadMetadata",
      guppyBasecallerSetting,
      medakaModel,
      project,
      refSeqFile,
      sampleNamesToFiles,
      samples,
      stepsEnabled: set("uploadMetadata", true, this.state.stepsEnabled),
      uploadType,
      wetlabProtocol,
      workflows,
    });
  };

  handleUploadMetadata = ({
    metadata,
    issues,
    newHostGenomes,
  }: {
    metadata: SampleUploadFlowState["metadata"];
    issues: SampleUploadFlowState["metadataIssues"];
    newHostGenomes: HostGenome[];
  }) => {
    const updatedHostGenomes = this.props.hostGenomes.concat(newHostGenomes);

    // Populate host_genome_id in sample using metadata.
    const newSamples: SampleFromApi[] = this.state.samples.map(
      (sample: $TSFixMe) => {
        const metadataRow = find(
          row =>
            get("sample_name", row) === sample.name ||
            get("Sample Name", row) === sample.name,
          metadata.rows,
        );
        const hostGenomeName = HOST_GENOME_SYNONYMS.reduce(
          (match: $TSFixMe, name: $TSFixMe) => metadataRow[name] || match,
          null,
        );
        const hostGenomeId = find(
          // Lowercase to allow for 'human' to match 'Human'. The same logic
          // is replicated in MetadataHelper.
          hg => {
            return hg.name.toLowerCase() === hostGenomeName.toLowerCase();
          },
          updatedHostGenomes,
        ).id;

        // Enforce hipaa compliant host age
        if (hostGenomeName.toLowerCase() === "human") {
          const maxValue = FIELDS_THAT_HAVE_MAX_INPUT["host_age"];
          // THIS LINT ERROR LOOKS LIKE A BUG.
          // I (ehoops) am not changing functionality in this PR.
          // eslint-disable-next-line
          metadata.rows.map((row: $TSFixMe) => {
            if ("Host Age" in row) {
              const parsedValue = Number.parseInt(row["Host Age"]);
              const hipaaCompliantVal = min([parsedValue, maxValue + 1]);
              row["Host Age"] = hipaaCompliantVal.toString();
            }
          });
        }

        return {
          ...sample,
          // Set the host_genome_id and name so it is available in review
          host_genome_id: hostGenomeId,
          host_genome_name: hostGenomeName,
        };
      },
    );

    // Remove host_genome from metadata.
    const newMetadata: SampleUploadFlowState["metadata"] = flow(
      set("rows", metadata.rows.map(omit(HOST_GENOME_SYNONYMS))),
      set("headers", without(HOST_GENOME_SYNONYMS, metadata.headers)),
    )(metadata);

    this.setState({
      samples: newSamples,
      metadata: newMetadata,
      metadataIssues: issues,
      currentStep: "review",
      stepsEnabled: set("review", true, this.state.stepsEnabled),
      hostGenomes: updatedHostGenomes,
    });
  };

  samplesChanged = () => {
    this.setState({
      stepsEnabled: {
        uploadSamples: true,
        uploadMetadata: false,
        review: false,
      },
    });
  };

  metadataChanged = () => {
    this.setState({
      stepsEnabled: {
        uploadSamples: true,
        uploadMetadata: true,
        review: false,
      },
    });
  };

  // *** Project-related functions ***
  // Get pipeline versions associated with a project
  getPipelineVersionsForExistingProject = async projectId => {
    if (this.state.pipelineVersions[projectId]) {
      return { pipelineVersions: this.state.pipelineVersions[projectId] };
    }

    const pipelineVersions = await getProjectPipelineVersions(projectId);
    this.setState((prevState: SampleUploadFlowState) => ({
      pipelineVersions: {
        ...prevState.pipelineVersions,
        [projectId]: pipelineVersions,
      },
    }));
  };

  handleStepSelect = (step: string) => {
    this.setState({
      currentStep: step,
    });
  };

  // SLIGHT HACK: Keep steps mounted, so user can return to them if needed.
  // The internal state of some steps is difficult to recover if they are unmounted.
  renderSteps = () => {
    const { pipelineVersions, workflows, wetlabProtocol } = this.state;
    return (
      <div>
        <UploadSampleStep
          onDirty={this.samplesChanged}
          onUploadSamples={this.handleUploadSamples}
          visible={this.state.currentStep === "uploadSamples"}
          basespaceClientId={this.props.basespaceClientId}
          basespaceOauthRedirectUri={this.props.basespaceOauthRedirectUri}
          admin={this.props.admin}
          biohubS3UploadEnabled={this.props.biohubS3UploadEnabled}
          getPipelineVersionsForExistingProject={(projectId: number) =>
            this.getPipelineVersionsForExistingProject(projectId)
          }
          pipelineVersions={pipelineVersions}
        />
        {this.state.samples && (
          <UploadMetadataStep
            onUploadMetadata={this.handleUploadMetadata}
            samples={this.state.samples}
            // @ts-expect-error Property 'name' is optional in type this.state.project but required in UploadMetadataStep
            project={this.state.project}
            visible={this.state.currentStep === "uploadMetadata"}
            onDirty={this.metadataChanged}
            workflows={workflows}
          />
        )}
        {this.state.samples && this.state.metadata && (
          <ReviewStep
            bedFile={this.state.bedFile}
            clearlabs={this.state.clearlabs}
            guppyBasecallerSetting={this.state.guppyBasecallerSetting}
            hostGenomes={this.state.hostGenomes}
            medakaModel={this.state.medakaModel}
            metadata={this.state.metadata}
            onStepSelect={this.handleStepSelect}
            onUploadComplete={this.onUploadComplete}
            onUploadStatusChange={this.onUploadStatusChange}
            originalHostGenomes={this.props.hostGenomes}
            pipelineVersions={pipelineVersions}
            project={this.state.project}
            refSeqFile={this.state.refSeqFile}
            samples={this.state.samples}
            technology={this.state.technology}
            uploadType={this.state.uploadType}
            visible={this.state.currentStep === "review"}
            wetlabProtocol={wetlabProtocol}
            workflows={workflows}
          />
        )}
      </div>
    );
  };

  onUploadStatusChange = (uploadStatus: boolean) => {
    this.setState({
      stepsEnabled: {
        uploadSamples: !uploadStatus,
        uploadMetadata: !uploadStatus,
        review: !uploadStatus,
      },
    });
  };

  render() {
    return (
      <div>
        <SampleUploadFlowHeader
          currentStep={this.state.currentStep}
          samples={this.state.samples}
          project={this.state.project}
          onStepSelect={this.handleStepSelect}
          stepsEnabled={this.state.stepsEnabled}
        />
        <NarrowContainer className={cx(cs.sampleUploadFlow)}>
          <div className={cs.inner}>{this.renderSteps()}</div>
        </NarrowContainer>
      </div>
    );
  }
}

export default SampleUploadFlow;
