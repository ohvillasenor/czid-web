import {
  AccessionsSummary,
  CoverageVizParamsRaw,
} from "~/components/common/CoverageVizBottomSidebar/types";
import { ThresholdConditions } from "~/components/utils/ThresholdMap";
import {
  LongReadTabsSample,
  MetagenomicTabsSample,
  WorkflowTabsSample,
} from "~/components/utils/workflows";
import ReportMetadata from "~/interface/reportMetaData";
import Sample, { WorkflowRun } from "~/interface/sample";
import {
  Background,
  ConsensusGenomeData,
  DateString,
  NumberId,
  PipelineRun,
  Taxon,
} from "~/interface/shared";
import { BlastModalInfo } from "../components/views/blast/constants";

export interface SampleViewProps {
  sampleId?: number;
  snapshotShareId?: string;
  updateDiscoveryProjectId?(projectId: number): void;
}

export type CurrentTabSample =
  | MetagenomicTabsSample
  | WorkflowTabsSample
  | LongReadTabsSample;

export interface AmrDeprectatedData {
  allele: string;
  annotation_gene?: $TSFixMeUnknown;
  coverage: number;
  created_at: DateString;
  depth: number;
  dpm: number;
  drug_family: string;
  genbank_accession: null;
  gene: string;
  gene_family: string;
  id: number;
  pipeline_run_id: number;
  rpm: number;
  total_reads: number;
  updated_at: DateString;
}

export interface Lineage {
  name: string;
  parent: number;
  rank: "kingdom" | "phylum" | "class" | "order" | "family" | "genus";
}

export interface BlastData {
  context: { blastedFrom: string };
  pipelineVersion: string;
  sampleId: number;
  taxName: string;
  taxId: number;
  taxLevel?: number;
  shouldBlastContigs?: boolean;
  taxonStatsByCountType: {
    ntContigs: number;
    ntReads: number;
    nrContigs: number;
    nrReads: number;
  };
}

export interface ConsensusGenomeParams {
  accessionId: number;
  accessionName: string;
  taxonId: number;
  taxonName: string;
}

export interface SampleViewState {
  amrDeprecatedData?: AmrDeprectatedData[];
  backgrounds: Background[];
  blastData: BlastData | Record<string, never>;
  blastModalInfo: BlastModalInfo;
  blastSelectionModalVisible: boolean;
  blastContigsModalVisible?: boolean;
  blastReadsModalVisible?: boolean;
  blastV1ContigsModalVisible?: boolean;
  blastV1ReadsModalVisible?: boolean;
  consensusGenomeData: ConsensusGenomeData;
  consensusGenomeCreationParams: ConsensusGenomeParams | Record<string, never>;
  consensusGenomePreviousParams: ConsensusGenomeData | Record<string, never>;
  consensusGenomeCreationModalVisible: boolean;
  consensusGenomeErrorModalVisible: boolean;
  consensusGenomePreviousModalVisible: boolean;
  coverageVizDataByTaxon: {
    [taxonId: number]: {
      best_accessions: AccessionsSummary[];
      num_accessions: number;
    };
  };
  coverageVizParams: CoverageVizParamsRaw | Record<string, never>;
  coverageVizVisible: boolean;
  currentTab?: CurrentTabSample | null;
  enableMassNormalizedBackgrounds?: boolean;
  hasPersistedBackground: boolean;
  filteredReportData: Taxon[];
  lineageData?: { [key: string]: Lineage };
  loadingReport: boolean;
  loadingWorkflowRunResults: boolean;
  ownedBackgrounds?: Background[];
  otherBackgrounds?: Background[];
  pipelineRun?: PipelineRun;
  pipelineVersion?: string;
  project?: NumberId;
  projectSamples: Pick<Sample, "id" | "name">[];
  reportData: Taxon[];
  reportMetadata: ReportMetadata;
  sample: Sample;
  selectedOptions: FilterSelections;
  sidebarMode?: "sampleDetails" | "taxonDetails";
  sidebarVisible: boolean;
  sidebarTaxonData?: Taxon;
  view: SampleReportViewMode;
  workflowRun?: WorkflowRun;
  workflowRunId?: number;
  workflowRunResults: WorkflowRunResults | Record<string, never>;
  sharedWithNoBackground: boolean;
}

export interface FilterSelections {
  annotations: string[];
  flags: string[];
  thresholds: ThresholdConditions[];
  taxa: { id: number; name: string; level: "genus" | "species" }[];
  metric: string;
  metricBases: string;
  readSpecificity: number;
  background: number;
  nameType: string;
  categories:
    | { categories: string[]; subcategories: { Viruses: string[] } }
    | Record<string, never>;
}

export type SampleReportViewMode = "table" | "tree";

export interface WorkflowRunResults {
  coverage_viz: {
    coverage_bin_size: number;
    coverage: $TSFixMeUnknown[];
    total_length: number;
    coverage_breadth: number;
    coverage_depth: number;
  };
  quality_metrics: object;
  taxon_info: {
    accession_name: string;
    accession_id: number;
    taxonId: number;
    taxon_name: string;
  };
}

export interface RawReportData {
  all_tax_ids: number[];
  counts: {
    [key: number]: {
      [id: number]: Taxon;
    };
  };
  highlightedTaxIds: number[];
  lineage: {
    [id: string]: Lineage;
  };
  metadata: ReportMetadata;
  sortedGenus: number[];
}

export interface ColumnProps {
  dataKey?: string;
  cellRenderer?: ({
    cellData,
    rowData,
  }: {
    cellData?: Array<number> | number | string;
    rowData?: Taxon;
  }) => JSX.Element | "-";
  className?: string;
  columnData?: { [key: string]: any };
  disableSort?: boolean;
  disableDrag?: boolean;
  flexGrow?: number;
  headerClassName?: string;
  headerRenderer?: () => JSX.Element;
  label?: string;
  minWidth?: number;
  width?: number;
  sortFunction?: ({ data, sortDirection }: SortFunctionsParams) => Taxon[];
  cellDataGetter?: ({ rowData }: { rowData: Taxon }) => (string | number)[];
}

export interface SortFunctionsParams {
  data: Taxon[];
  sortDirection: "asc" | "desc";
}
