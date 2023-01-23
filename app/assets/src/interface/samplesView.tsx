import { SortDirectionType } from "react-virtualized";
import { ThresholdForAPI } from "~/components/utils/ThresholdMap";
import { WORKFLOW_VALUES } from "~/components/utils/workflows";
import { ObjectCollectionView } from "~/components/views/discovery/DiscoveryDataLayer";
import { AnnotationValue } from "~/interface/discovery";
import { LocationObject } from "~/interface/shared";
import { DateString } from "~/interface/shared/generic";

export interface SamplesViewProps {
  activeColumns?: string[];
  admin?: boolean;
  currentDisplay: string;
  currentTab: string;
  domain?: string;
  filters?: FilterList;
  filtersSidebarOpen?: boolean;
  hasAtLeastOneFilterApplied?: boolean;
  handleNewAmrCreationsFromMngs?(param: { numAmrRunsCreated: number }): void;
  hideAllTriggers?: boolean;
  mapLevel?: string;
  mapLocationData?: Record<string, unknown>;
  mapPreviewedLocationId?: number;
  mapTilerKey?: string;
  numOfMngsSamples?: number;
  objects?: ObjectCollectionView<Entry>;
  onActiveColumnsChange?(activeColumns: string[]): void;
  onClearFilters?(): void;
  onDisplaySwitch?: (display: string) => void;
  onLoadRows(param: { startIndex: number; stopIndex: number }): Promise<any>;
  onMapClick?(): void;
  onMapLevelChange?(mapLevel: string): void;
  onMapMarkerClick?(locationId: number): void;
  onMapTooltipTitleClick?(locationId: number): void;
  onPLQCHistogramBarClick?(sampleIds: string[]): void;
  onObjectSelected?(param: {
    object: Entry;
    currentEvent: React.SyntheticEvent;
  }): void;
  onUpdateSelectedIds?(selectedSampleIds: Set<number>): void;
  onSortColumn?(param: {
    sortBy: string;
    sortDirection: SortDirectionType;
  }): void;
  projectId?: number;
  protectedColumns?: string[];
  sampleStatsSidebarOpen?: boolean;
  selectableIds?: number[];
  selectedIds?: Set<number>;
  showAllMetadata?: boolean;
  sortBy?: string;
  sortDirection?: SortDirectionType;
  snapshotShareId?: string;
  sortable?: boolean;
  userDataCounts?: { sampleCountByWorkflow: { [key: string]: number } };
  workflow?: WORKFLOW_VALUES;
  workflowEntity?: string;
}

export interface Entry {
  collection_date: DateString;
  collection_location_v2: LocationObject;
  createdAt: DateString;
  duplicateCompressionRatio: number;
  erccReads: number;
  host: string;
  host_sex: string;
  id: number;
  medakaModel: string;
  notes: string;
  nucleotide_type: string;
  privateUntil: DateString;
  projectId: number;
  qcPercent: number;
  referenceAccession: object;
  sample: { name: string; project: string };
  sample_type: string;
  status: string;
  technology: string;
  totalReads: number;
  totalRuntime: number;
  water_control: string;
  wetlabProtocol: string;
  workflow: string;
}

export interface ViewProps<T> {
  conditions: { entries?: T };
  pageSize: number;
  onViewChange: () => void;
  displayName: string;
}

export interface FilterList {
  annotations: Array<{ name: AnnotationValue }>;
  host: Array<number>;
  locationV2: Array<string>;
  taxon: Array<number>;
  taxonThresholds: Array<ThresholdForAPI>;
  taxaLevels: Array<string>;
  time: [string, string];
  tissue: Array<string>;
  visibility: string;
}
