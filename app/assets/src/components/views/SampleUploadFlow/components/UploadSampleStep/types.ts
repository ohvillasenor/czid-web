import { TaxonOption } from "~/components/common/filters/types";
import { ProjectPipelineVersions, SampleUploadType } from "~/interface/shared";
import {
  SEQUENCING_TECHNOLOGY_OPTIONS,
  UploadWorkflows,
} from "../../constants";

export interface UploadSampleStepProps {
  onUploadSamples: $TSFixMeFunction;
  // Immediately called when the user changes anything, even before validation has returned.
  // Used to disable later steps the header navigation if the data in previous steps has changed.
  onDirty: $TSFixMeFunction;
  visible?: boolean;
  admin?: boolean;
  biohubS3UploadEnabled?: boolean;
  basespaceClientId: string;
  basespaceOauthRedirectUri: string;
  getPipelineVersionsForExistingProject: (
    projectId: number,
  ) => Promise<{ pipelineVersions: ProjectPipelineVersions }>;
  pipelineVersions: { [projectId: string]: ProjectPipelineVersions };
}

export interface UploadSampleStepState {
  basespaceAccessToken: $TSFixMe;
  basespaceSamples: $TSFixMe[];
  basespaceSelectedSampleIds: Set<string>;
  bedFile: File;
  CLI: $TSFixMe;
  createProjectOpen: boolean;
  currentTab: SampleUploadType;
  enabledWorkflows: UploadWorkflows[];
  localSamples: $TSFixMe[];
  localSelectedSampleIds: Set<string>;
  projects: $TSFixMe[];
  refSeqFile: File;
  refSeqAccession: RefSeqAccessionDataType;
  remoteSamples: $TSFixMe[];
  remoteSelectedSampleIds: Set<string>;
  removedLocalFiles: $TSFixMe[];
  selectedGuppyBasecallerSetting: $TSFixMe;
  selectedTaxon: TaxonOption;
  selectedTechnology: SEQUENCING_TECHNOLOGY_OPTIONS;
  selectedProject: $TSFixMe;
  selectedMedakaModel: string; // TODO: This should be an enum of available models
  selectedWetlabProtocol: string; // TODO: This should be an enum of available protocols
  selectedWorkflows: Set<UploadWorkflows>;
  showNoProjectError: boolean;
  usedClearLabs: boolean;
  files: $TSFixMe[];
  validatingSamples: boolean;
}

export type SelectedSampleIdsKeyType =
  | "basespaceSelectedSampleIds"
  | "localSelectedSampleIds"
  | "remoteSelectedSampleIds";

export type SelectedSampleIdsRecord = Record<
  SelectedSampleIdsKeyType,
  Set<string>
>;

export type SamplesKeyType =
  | "basespaceSamples"
  | "localSamples"
  | "remoteSamples";

export type SamplesRecord = Record<SamplesKeyType, $TSFixMe[]>;

export type RefSeqAccessionDataType = {
  id: string;
  name: string;
};
