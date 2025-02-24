import { camelCase, get, map, merge, values } from "lodash/fp";
import { useContext } from "react";
import { UserContext } from "~/components/common/UserContext";
import { WGS_CG_UPLOAD_FEATURE } from "~/components/utils/features";
import { FIELDS_METADATA } from "~/components/utils/tooltip";
import TableRenderers from "~/components/views/discovery/TableRenderers";
import {
  LONG_READ_MNGS_SAMPLE_TABLE_COLUMNS,
  SHARED_SAMPLE_TABLE_COLUMNS,
  SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS,
} from "~/components/views/samples/constants";
import { MetadataType } from "~/interface/shared";
import { WORKFLOWS } from "~utils/workflows";
import { StackedBasicValues } from "../../discovery/components/StackedBasicValues";
import { StackedSampleIds } from "../../discovery/components/StackedSampleIds";
import { ValueWithTooltip } from "../../discovery/components/ValueWithTooltip";
import cs from "./samples_view.scss";

// Label constants
const CREATED_ON = "Created On";
const PIPELINE_VERSION = "Pipeline Version";
const SAMPLE_TYPE = "Sample Type";

export const computeColumnsByWorkflow = ({
  workflow,
  metadataFields = [],
  basicIcon = false,
}: {
  workflow?: string;
  metadataFields?: MetadataType[];
  basicIcon?: boolean;
} = {}) => {
  // At the moment, columns for long read mNGS are the same as for short read mNGS.
  // To change that in the future, just add another function to compute columns.
  if (
    workflow === WORKFLOWS.SHORT_READ_MNGS.value ||
    workflow === WORKFLOWS.LONG_READ_MNGS.value
  ) {
    return computeMngsColumns({ basicIcon, metadataFields, workflow });
  } else if (workflow === WORKFLOWS.CONSENSUS_GENOME.value) {
    return computeConsensusGenomeColumns({ basicIcon, metadataFields });
  } else if (workflow === WORKFLOWS.AMR.value) {
    return computeAmrColumns({ basicIcon, metadataFields });
  } else if (workflow === WORKFLOWS.BENCHMARK.value) {
    return computeBenchmarkColumns({ basicIcon });
  }
};

const computeMngsColumns = ({ basicIcon, metadataFields, workflow }) => {
  const fixedColumns = [
    {
      dataKey: "sample",
      flexGrow: 1,
      width: 350,
      cellRenderer: ({ cellData }) =>
        TableRenderers.renderSample({
          sample: cellData,
          full: true,
          basicIcon,
        }),
      headerClassName: cs.sampleHeader,
    },
    {
      dataKey: "createdAt",
      label: CREATED_ON,
      width: 120,
      className: cs.basicCell,
      cellRenderer: TableRenderers.renderDateWithElapsed,
      // Get latest run or fallback to sample createdAt
      cellDataGetter: ({ rowData }) =>
        get("sample.pipelineRunCreatedAt", rowData) || rowData.createdAt,
    },
    {
      dataKey: "host",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "collection_location_v2",
      label: "Location",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "totalReads",
      label: "Total Reads",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumberWithCommas(rowData[dataKey]),
    },
    {
      dataKey: "nonHostReads",
      label: "Passed Filters",
      flexGrow: 1,
      className: cs.basicCell,
      cellRenderer: TableRenderers.renderNumberAndPercentage,
    },
    {
      dataKey: "qcPercent",
      label: "Passed QC",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatPercentage(rowData[dataKey]),
    },
    {
      dataKey: "duplicateCompressionRatio",
      label: "DCR",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumber(rowData[dataKey]),
    },
    {
      dataKey: "erccReads",
      label: "ERCC Reads",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumberWithCommas(rowData[dataKey]),
    },
    {
      dataKey: "nucleotide_type",
      label: "Nucleotide Type",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "sample_type",
      label: SAMPLE_TYPE,
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "water_control",
      label: "Water Control",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "notes",
      flexGrow: 1,
      disableSort: true,
      className: cs.basicCell,
    },
    {
      dataKey: "pipelineVersion",
      label: PIPELINE_VERSION,
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "subsampledFraction",
      label: "SubSampled Fraction",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumber(rowData[dataKey]),
    },
    {
      dataKey: "totalRuntime",
      label: "Total Runtime",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatDuration(rowData[dataKey]),
    },
    {
      dataKey: "meanInsertSize",
      label: "Mean Insert Size",
      flexGrow: 1,
      className: cs.basicCell,
    },
  ];

  const columns = [...fixedColumns, ...computeMetadataColumns(metadataFields)];

  const columnData = merge(
    SHARED_SAMPLE_TABLE_COLUMNS,
    workflow === WORKFLOWS.LONG_READ_MNGS.value
      ? LONG_READ_MNGS_SAMPLE_TABLE_COLUMNS
      : SHORT_READ_MNGS_SAMPLE_TABLE_COLUMNS,
  );

  for (const col of columns) {
    col["columnData"] = columnData[col["dataKey"]];
  }

  return columns;
};

const computeConsensusGenomeColumns = ({ basicIcon, metadataFields }) => {
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};
  const fixedColumns = [
    {
      dataKey: "sample",
      flexGrow: 1,
      width: 350,
      cellRenderer: ({ rowData }) =>
        TableRenderers.renderSampleInfo({
          rowData,
          full: true,
          basicIcon,
        }),
      headerClassName: cs.sampleHeader,
    },
    {
      dataKey: "createdAt",
      label: CREATED_ON,
      width: 120,
      className: cs.basicCell,
      cellRenderer: TableRenderers.renderDateWithElapsed,
    },
    {
      dataKey: "host",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "collection_location_v2",
      label: "Location",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "nucleotide_type",
      label: "Nucleotide Type",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "sample_type",
      label: SAMPLE_TYPE,
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "water_control",
      label: "Water Control",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "wdl_version",
      label: PIPELINE_VERSION,
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "notes",
      flexGrow: 1,
      disableSort: true,
      className: cs.basicCell,
    },
    {
      dataKey: "coverageDepth",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumber(rowData[dataKey]),
    },
    {
      dataKey: "totalReadsCG",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumberWithCommas(rowData[dataKey]),
    },
    {
      dataKey: "gcPercent",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatPercentage(rowData[dataKey]),
    },
    {
      dataKey: "refSnps",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "percentIdentity",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatPercentage(rowData[dataKey]),
    },
    {
      dataKey: "nActg",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumberWithCommas(rowData[dataKey]),
    },
    {
      dataKey: "percentGenomeCalled",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatPercentage(rowData[dataKey]),
    },
    {
      dataKey: "nMissing",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumberWithCommas(rowData[dataKey]),
    },
    {
      dataKey: "nAmbiguous",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumberWithCommas(rowData[dataKey]),
    },
    {
      dataKey: "wetlabProtocol",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "technology",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "referenceAccession",
      flexGrow: 1,
      width: 200,
      className: cs.basicCell,
      cellRenderer: ({ cellData }) =>
        TableRenderers.renderReferenceAccession(cellData),
    },
    {
      dataKey: "referenceAccessionLength",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumberWithCommas(rowData[dataKey]),
    },
    {
      dataKey: "medakaModel",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "ct_value",
      label: "Ct Value",
      flexGrow: 1,
      className: cs.basicCell,
    },
  ];

  // TODO (phoenix) remove this check when we enable WGS
  if (allowedFeatures.includes(WGS_CG_UPLOAD_FEATURE)) {
    fixedColumns.push({
      dataKey: "creation_source",
      label: "Creation Source",
      flexGrow: 1,
      className: cs.basicCell,
    });
  }

  const columns = [...fixedColumns, ...computeMetadataColumns(metadataFields)];

  for (const col of columns) {
    const dataKey = camelCase(col["dataKey"]);
    if (
      Object.prototype.hasOwnProperty.call(SHARED_SAMPLE_TABLE_COLUMNS, dataKey)
    ) {
      col["columnData"] = SHARED_SAMPLE_TABLE_COLUMNS[dataKey];
    } else if (Object.prototype.hasOwnProperty.call(FIELDS_METADATA, dataKey)) {
      col["columnData"] = FIELDS_METADATA[dataKey];
      col["label"] = FIELDS_METADATA[dataKey].label;
    }
  }

  return columns;
};

const computeAmrColumns = ({ basicIcon, metadataFields }) => {
  const fixedColumns = [
    {
      dataKey: "sample",
      flexGrow: 1,
      width: 350,
      cellRenderer: ({ rowData }) =>
        TableRenderers.renderSampleInfo({
          rowData,
          full: true,
          basicIcon,
        }),
      headerClassName: cs.sampleHeader,
    },
    {
      dataKey: "createdAt",
      label: CREATED_ON,
      width: 120,
      className: cs.basicCell,
      cellRenderer: TableRenderers.renderDateWithElapsed,
    },
    {
      dataKey: "sample_type",
      label: SAMPLE_TYPE,
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "wdl_version",
      label: PIPELINE_VERSION,
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "host",
      flexGrow: 1,
      className: cs.basicCell,
    },
    // TODO: consider DRY'ing repeated configs
    {
      dataKey: "nonHostReads",
      label: "Passed Filters",
      flexGrow: 1,
      className: cs.basicCell,
      cellRenderer: TableRenderers.renderNumberAndPercentage,
    },
    {
      dataKey: "totalReadsAMR",
      label: "Total Reads",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumberWithCommas(rowData[dataKey]),
    },
    {
      dataKey: "qcPercent",
      label: "Passed QC",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatPercentage(rowData[dataKey]),
    },
    {
      dataKey: "duplicateCompressionRatio",
      label: "DCR",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumber(rowData[dataKey]),
    },
    {
      dataKey: "erccReads",
      label: "ERCC Reads",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumberWithCommas(rowData[dataKey]),
    },
    {
      dataKey: "subsampledFraction",
      label: "SubSampled Fraction",
      flexGrow: 1,
      className: cs.basicCell,
      cellDataGetter: ({ dataKey, rowData }) =>
        TableRenderers.formatNumber(rowData[dataKey]),
    },
    {
      dataKey: "meanInsertSize",
      label: "Mean Insert Size",
      flexGrow: 1,
      className: cs.basicCell,
    },
  ];

  const columns = [...fixedColumns, ...computeMetadataColumns(metadataFields)];

  for (const col of columns) {
    const dataKey = col["dataKey"];
    if (
      Object.prototype.hasOwnProperty.call(SHARED_SAMPLE_TABLE_COLUMNS, dataKey)
    ) {
      col["columnData"] = SHARED_SAMPLE_TABLE_COLUMNS[dataKey];
    } else if (Object.prototype.hasOwnProperty.call(FIELDS_METADATA, dataKey)) {
      col["columnData"] = FIELDS_METADATA[dataKey];
      col["label"] = FIELDS_METADATA[dataKey].label;
    }
  }

  return columns;
};

const computeBenchmarkColumns = ({ basicIcon }) => {
  const fixedColumns = [
    {
      dataKey: "sample",
      flexGrow: 1,
      width: 350,
      cellRenderer: ({ rowData }) =>
        TableRenderers.renderSampleInfo({
          rowData,
          full: true,
          basicIcon,
        }),
      headerClassName: cs.sampleHeader,
    },
    {
      dataKey: "createdAt",
      label: CREATED_ON,
      width: 120,
      className: cs.basicCell,
      cellRenderer: TableRenderers.renderDateWithElapsed,
    },
    {
      dataKey: "wdl_version",
      label: "Benchmark Version",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "workflowBenchmarked",
      label: "Workflow",
      flexGrow: 1,
      className: cs.basicCell,
    },
    // TODO: Create custom cell renderer for this to be able to display
    // sample id, pipeline versions, ncbi index versions
    {
      dataKey: "aupr",
      label: "AUPR",
      flexGrow: 1,
      className: cs.basicCell,
      cellRenderer: TableRenderers.renderNtNrValue,
    },
    {
      dataKey: "l2Norm",
      label: "L2 Norm",
      flexGrow: 1,
      className: cs.basicCell,
      cellRenderer: TableRenderers.renderNtNrValue,
    },
    {
      dataKey: "correlation",
      label: "Correlation",
      flexGrow: 1,
      className: cs.basicCell,
    },
    {
      dataKey: "groundTruthFile",
      label: "Ground Truth File",
      flexGrow: 1,
      className: cs.basicCell,
      cellRenderer: ValueWithTooltip,
    },
    {
      dataKey: "sampleId",
      label: "Sample IDs",
      flexGrow: 1,
      className: cs.basicCell,
      cellRenderer: StackedSampleIds,
      cellDataGetter: ({ rowData }) => rowData?.additionalInfo ?? {},
    },
    {
      dataKey: "pipelineVersion",
      label: "Pipeline Versions",
      flexGrow: 1,
      className: cs.basicCell,
      cellRenderer: StackedBasicValues,
      cellDataGetter: extractBenchmarkAdditionalInfo,
    },
    {
      dataKey: "ncbiIndexVersion",
      label: "NCBI Index Versions",
      flexGrow: 1,
      className: cs.basicCell,
      cellRenderer: StackedBasicValues,
      cellDataGetter: extractBenchmarkAdditionalInfo,
    },
    {
      dataKey: "runId",
      label: "Pipeline Run IDs",
      flexGrow: 1,
      className: cs.basicCell,
      cellRenderer: StackedBasicValues,
      cellDataGetter: extractBenchmarkAdditionalInfo,
    },
  ];

  const columns = [...fixedColumns];

  for (const col of columns) {
    const dataKey = col["dataKey"];
    if (
      Object.prototype.hasOwnProperty.call(SHARED_SAMPLE_TABLE_COLUMNS, dataKey)
    ) {
      col["columnData"] = SHARED_SAMPLE_TABLE_COLUMNS[dataKey];
    } else if (Object.prototype.hasOwnProperty.call(FIELDS_METADATA, dataKey)) {
      col["columnData"] = FIELDS_METADATA[dataKey];
      col["label"] = FIELDS_METADATA[dataKey].label;
    }
  }

  return columns;
};

const extractBenchmarkAdditionalInfo = ({ dataKey, rowData }) => {
  const additionalInfo = rowData?.additionalInfo ?? {};

  return map(({ [dataKey]: value }) => value, values(additionalInfo));
};

const computeMetadataColumns = metadataFields => {
  // The following metadata fields are hard-coded in fixedColumns
  // and will always be available on the samples table.
  const fixedMetadata = [
    "sample_type",
    "nucleotide_type",
    "water_control",
    "collection_location_v2",
    "ct_value",
  ];

  const additionalMetadata = metadataFields.filter(
    mf => !fixedMetadata.includes(mf["key"]),
  );

  return additionalMetadata.map(mf => {
    return {
      dataKey: mf["key"],
      label: mf["name"],
      flexGrow: 1,
      className: cs.basicCell,
    };
  }, []);
};

export const DEFAULT_ACTIVE_COLUMNS_BY_WORKFLOW = {
  [WORKFLOWS.SHORT_READ_MNGS.value]: [
    "sample",
    "createdAt",
    "host",
    "collection_location_v2",
    "nonHostReads",
    "qcPercent",
  ],
  // update these default columns if long read should be different from short read
  [WORKFLOWS.LONG_READ_MNGS.value]: [
    "sample",
    "createdAt",
    "host",
    "collection_location_v2",
    "nonHostReads",
    "qcPercent",
  ],
  [WORKFLOWS.CONSENSUS_GENOME.value]: [
    "sample",
    "referenceAccession",
    "createdAt",
    "host",
    "collection_location_v2",
    "totalReadsCG",
    "percentGenomeCalled",
  ],
  [WORKFLOWS.AMR.value]: [
    "sample",
    "createdAt",
    "sample_type",
    "host",
    "nonHostReads",
    "totalReadsAMR",
  ],
  [WORKFLOWS.BENCHMARK.value]: [
    "sample",
    "createdAt",
    "workflowBenchmarked",
    "runIds",
    "nonHostReads",
    "totalReadsAMR",
  ],
};

// DEFAULT_SORTED_COLUMN_BY_TAB (frontend) should always match TIEBREAKER_SORT_KEY (backend).
export const DEFAULT_SORTED_COLUMN_BY_TAB = {
  projects: "created_at",
  samples: "createdAt",
  visualizations: "updated_at",
};
