import { RouteComponentProps } from "react-router-dom";
import { SortDirectionType } from "react-virtualized";
import { ThresholdConditions } from "~/components/utils/ThresholdMap";
import { WorkflowCount, WORKFLOW_VALUES } from "~/components/utils/workflows";
import { ObjectCollectionView } from "~/components/views/discovery/DiscoveryDataLayer";
import { FilterList } from "./samplesView";
import { MustHaveId, Project } from "./shared";

export interface DiscoveryViewProps extends RouteComponentProps {
  admin?: boolean;
  domain: string;
  mapTilerKey?: string;
  projectId?: number;
  snapshotProjectDescription?: string;
  snapshotProjectName?: string;
  snapshotShareId?: string;
  updateDiscoveryProjectId?(...args: unknown[]): unknown;
}

export type DimensionsDetailed = Array<
  Dimension | LocationV2Dimension | TimeBinDimension
>;

export interface Dimension {
  dimension: string;
  values: DimensionValue[];
}

type LocationV2Dimension = {
  dimension: "locationV2";
  values: (DimensionValue & { parents: string[] })[];
};

type TimeBinDimension = {
  dimension: "time_bin";
  values: (DimensionValue & { start: string; end: string })[];
};

export interface DimensionValue {
  text: string;
  value: string;
  count: number;
}

export type SelectedFilters = {
  annotationsSelected?: Array<{ name: string }>;
  hostSelected?: Array<number>;
  locationV2Selected?: Array<string>;
  taxonSelected?: Array<{ id: number; name: string; level: string }>;
  taxonThresholdsSelected?: Array<ThresholdConditions>;
  timeSelected?: string;
  tissueSelected?: string[];
  visibilitySelected?: string;
};

export type WorkflowSets = {
  [K in WORKFLOW_VALUES]: Set<number>;
};

export type MapEntry = {
  geo_level: string;
  id: number;
  hasOwnEntries: boolean;
  name: string;
};

export interface DiscoveryViewState {
  currentDisplay: string;
  currentTab: string;
  emptyStateModalOpen: boolean;
  filteredProjectCount: number;
  filteredProjectDimensions: Dimension[];
  filteredSampleCountsByWorkflow: WorkflowCount;
  filteredSampleDimensions: Dimension[];
  filteredSampleStats: { count?: number };
  filteredVisualizationCount: number;
  filters: SelectedFilters | Record<string, never>;
  loadingDimensions: boolean;
  loadingLocations: boolean;
  loadingStats: boolean;
  mapLevel: string;
  mapLocationData: Record<string, { name: string }>;
  mapPreviewedLocationId: number;
  mapSidebarProjectCount: number;
  mapSidebarProjectDimensions: Dimension[];
  mapSidebarSampleCount: number;
  mapSidebarSampleDimensions: Dimension[];
  mapSidebarSampleStats: Record<string, $TSFixMeUnknown>;
  mapSidebarTab: string;
  orderBy: string;
  orderDirection: SortDirectionType;
  project: Project;
  projectDimensions: DimensionsDetailed;
  projectId: number;
  plqcPreviewedSamples?: string[];
  rawMapLocationData: Record<string, MapEntry>;
  sampleActiveColumnsByWorkflow: { [workflow: string]: string[] };
  sampleDimensions: DimensionsDetailed;
  sampleWasDeleted: string | null;
  search: string;
  selectableSampleIds: number[];
  selectableWorkflowRunIds: number[];
  selectedSampleIdsByWorkflow: WorkflowSets;
  showFilters: boolean;
  showStats: boolean;
  userDataCounts: {
    sampleCountByWorkflow: DiscoveryViewState["filteredSampleCountsByWorkflow"];
    sampleCount: number;
    projectCount: number;
    visualizationCount: number;
  };
  workflow: WORKFLOW_VALUES;
  workflowEntity: string;
}

export interface ConfigForWorkflow<T extends MustHaveId> {
  bannerTitle: string;
  objectCollection: ObjectCollectionView<T>;
  noDataLinks: {
    external?: boolean;
    href: string;
    text: string;
  }[];
  noDataMessage: string;
}

export interface Conditions {
  projectId: number;
  snapshotShareId: string;
  search: string;
  orderBy: string;
  orderDir: SortDirectionType;
  filters: FilterList & { workflow: WORKFLOW_VALUES };
  sampleIds?: string[];
}
