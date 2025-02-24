import { cx } from "@emotion/css";
import { compact, map } from "lodash/fp";
import React, { useContext, useState } from "react";
import {
  defaultTableRowRenderer,
  SortDirection,
  TableRowProps,
} from "react-virtualized";
import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
import { getCsrfToken } from "~/api/utils";
import { CoverageVizParamsRaw } from "~/components/common/CoverageVizBottomSidebar/types";
import { UserContext } from "~/components/common/UserContext";
import PhyloTreeCreationModal from "~/components/views/phylo_tree/PhyloTreeCreationModal";
import {
  ANNOTATION_NOT_A_HIT,
  NANOPORE_DEFAULT_COLUMN_WIDTH,
  TABS,
  TAX_LEVEL_SPECIES,
} from "~/components/views/SampleView/utils";
import { Table } from "~/components/visualizations/table";
import {
  BlastData,
  ColumnProps,
  CurrentTabSample,
  DBType,
  PickConsensusGenomeData,
} from "~/interface/sampleView";
import { Taxon } from "~/interface/shared";
import { getIlluminaColumns } from "./components/columns/illuminaColumns";
import { getNanoporeColumns } from "./components/columns/nanoporeColumns";
import { getNonNumericColumns } from "./components/columns/nonNumericColumns";
import { getSharedColumns } from "./components/columns/sharedColumns";
import cs from "./report_table.scss";

// Values for null values when sorting ascending and descending
// for strings - HACK: In theory, there can be strings larger than this
export const STRING_NULL_VALUES = ["", "zzzzzzzzz"];
export const NUMBER_NULL_VALUES = [
  Number.MIN_SAFE_INTEGER,
  Number.MAX_SAFE_INTEGER,
];
export const INVALID_CALL_BASE_TAXID = -1e8;
export const TAX_LEVEL_INDICES = {
  species: 1,
  genus: 2,
};

export type PhyloTreeModalParamsType = {
  taxId: number;
  taxName: string;
};
interface ReportTableProps {
  data?: Taxon[];
  shouldDisplayMergedNtNrValue?: boolean;
  shouldDisplayNoBackground?: boolean;
  onTaxonNameClick?: (clickedTaxonData: Taxon) => void;
  rowHeight?: number;
  // Needed only for hover actions
  // Consider adding a callback to render the hover actions
  currentTab: CurrentTabSample;
  consensusGenomeData?: Record<string, object[]>;
  isAlignVizAvailable: boolean;
  isConsensusGenomeEnabled: boolean;
  isFastaDownloadEnabled: boolean;
  isPhyloTreeAllowed: boolean;
  onAnnotationUpdate: () => void;
  onBlastClick: (params: BlastData) => void;
  onConsensusGenomeClick: (params: PickConsensusGenomeData) => void;
  onCoverageVizClick: (newCoverageVizParams: CoverageVizParamsRaw) => void;
  onPreviousConsensusGenomeClick: (params: PickConsensusGenomeData) => void;
  pipelineRunId?: number;
  pipelineVersion?: string;
  projectId?: number;
  projectName?: string;
  sampleId?: number;
  snapshotShareId?: string;
}

export const ReportTable = ({
  data = [],
  shouldDisplayMergedNtNrValue,
  shouldDisplayNoBackground,
  onTaxonNameClick,
  rowHeight = 54,
  currentTab,
  consensusGenomeData,
  isAlignVizAvailable,
  isConsensusGenomeEnabled,
  isFastaDownloadEnabled,
  isPhyloTreeAllowed,
  onAnnotationUpdate,
  onBlastClick,
  onConsensusGenomeClick,
  onCoverageVizClick,
  onPreviousConsensusGenomeClick,
  pipelineRunId,
  pipelineVersion,
  projectId,
  projectName,
  sampleId,
  snapshotShareId,
}: ReportTableProps) => {
  const [dbType, setDbType] = useState<DBType>(
    shouldDisplayMergedNtNrValue ? "merged_nt_nr" : "nt",
  );
  const [expandedGenusIds, setExpandedGenusIds] = useState<Set<number>>(
    new Set(),
  );
  const [isExpandAllOpened, setIsExpandAllOpened] = useState<boolean>(false);
  const [phyloTreeModalParams, setPhyloTreeModalParams] =
    useState<PhyloTreeModalParamsType | null>(null);

  const { allowedFeatures = [] } = useContext(UserContext) || {};

  const handlePhyloTreeModalClose = () => {
    setPhyloTreeModalParams(null);
  };

  const toggleExpandAllRows = () => {
    if (isExpandAllOpened) {
      setExpandedGenusIds(new Set());
      setIsExpandAllOpened(false);
    } else {
      setExpandedGenusIds(new Set(map("taxId", data)));
      setIsExpandAllOpened(true);
    }
  };

  const toggleExpandGenus = ({ taxonId }: { taxonId: number }) => {
    const newExpandedGenusIds = new Set(expandedGenusIds);
    newExpandedGenusIds.delete(taxonId) || newExpandedGenusIds.add(taxonId);

    let newIsExpandedAllOpened = isExpandAllOpened;
    if (newExpandedGenusIds.size === data.length) {
      newIsExpandedAllOpened = true;
    } else if (!newExpandedGenusIds.size) {
      newIsExpandedAllOpened = false;
    }

    setExpandedGenusIds(newExpandedGenusIds);
    setIsExpandAllOpened(newIsExpandedAllOpened);
  };

  const handleNtNrChange = (selectedDbType: "nr" | "nt") => {
    setDbType(selectedDbType);
  };

  const nonNumericColumns: Array<ColumnProps> = getNonNumericColumns(
    allowedFeatures,
    consensusGenomeData,
    currentTab,
    expandedGenusIds,
    onCoverageVizClick,
    isAlignVizAvailable,
    isConsensusGenomeEnabled,
    isExpandAllOpened,
    isFastaDownloadEnabled,
    isPhyloTreeAllowed,
    pipelineRunId,
    pipelineVersion,
    projectId,
    sampleId,
    shouldDisplayMergedNtNrValue,
    setPhyloTreeModalParams,
    onAnnotationUpdate,
    onBlastClick,
    onConsensusGenomeClick,
    onPreviousConsensusGenomeClick,
    toggleExpandAllRows,
    toggleExpandGenus,
    onTaxonNameClick,
    snapshotShareId,
  );

  const illuminaColumns = getIlluminaColumns(
    dbType,
    shouldDisplayMergedNtNrValue,
    shouldDisplayNoBackground,
    pipelineVersion,
  );

  const nanoporeColumns = getNanoporeColumns(
    dbType,
    shouldDisplayMergedNtNrValue,
  );

  const numericColumnWidth =
    currentTab === TABS.LONG_READ_MNGS ? NANOPORE_DEFAULT_COLUMN_WIDTH : 70;

  const sharedColumns = getSharedColumns(
    dbType,
    handleNtNrChange,
    numericColumnWidth,
    shouldDisplayMergedNtNrValue,
  );

  const columns = compact(
    nonNumericColumns.concat(
      currentTab === TABS.SHORT_READ_MNGS && illuminaColumns,
      currentTab === TABS.LONG_READ_MNGS && nanoporeColumns,
      sharedColumns,
    ),
  );

  // Table helpers
  const rowRenderer = (rowProps: TableRowProps) => {
    const rowData = rowProps.rowData;
    const isDimmed =
      rowData.taxLevel === TAX_LEVEL_SPECIES &&
      rowData.annotation === ANNOTATION_NOT_A_HIT;
    if (data) {
      rowProps.className = cx(
        rowProps.className,
        cs[`${rowData.taxLevel}Row`],
        (rowData.highlighted || rowData.highlightedChildren) && cs.highlighted,
        isDimmed && cs.dimmed,
      );
    }
    return defaultTableRowRenderer(rowProps);
  };

  const handleColumnSort = ({
    sortBy,
    sortDirection,
  }: {
    sortBy: string;
    sortDirection: "ASC" | "DESC";
  }) => {
    trackEvent(ANALYTICS_EVENT_NAMES.REPORT_TABLE_COLUMN_SORT_ARROW_CLICKED, {
      sortBy,
      sortDirection,
    });
  };

  const getTableRows = () => {
    // flatten data for consumption of react virtualized table
    // removes collapsed rows
    const tableRows: Taxon[] = [];
    data.forEach(genusData => {
      if (shouldDisplayMergedNtNrValue && !genusData["merged_nt_nr"]) {
        // skip lines without merged counts
        return;
      }

      tableRows.push(genusData);

      if (expandedGenusIds.has(genusData.taxId)) {
        genusData.filteredSpecies.forEach(speciesData => {
          if (shouldDisplayMergedNtNrValue && !speciesData["merged_nt_nr"]) {
            // skip lines without merged counts
            return;
          }

          // Add a pointer to the genus data for sorting purposes
          speciesData.genus = genusData;
          tableRows.push(speciesData);
        });
      }
    });
    return tableRows;
  };

  const readsPerMillionKey =
    currentTab === TABS.SHORT_READ_MNGS ? "rpm" : "bpm";

  return (
    <div className={cs.reportTable}>
      <Table
        cellClassName={cs.cell}
        columns={columns}
        data={getTableRows()}
        defaultRowHeight={rowHeight}
        defaultSortBy={
          shouldDisplayNoBackground || shouldDisplayMergedNtNrValue
            ? readsPerMillionKey
            : "agg_score"
        }
        defaultSortDirection={SortDirection.DESC}
        headerClassName={cs.header}
        onColumnSort={handleColumnSort}
        rowClassName={cs.row}
        rowRenderer={rowRenderer}
        sortable={true}
      />
      {/* TODO: FE Refactor (CZID-8444) - move this to live with other SampleView modals */}
      {phyloTreeModalParams && (
        <UserContext.Consumer>
          {currentUser => (
            <PhyloTreeCreationModal
              admin={currentUser.admin ? 1 : 0}
              csrf={getCsrfToken()}
              taxonId={phyloTreeModalParams.taxId}
              taxonName={phyloTreeModalParams.taxName}
              projectId={projectId}
              projectName={projectName}
              onClose={handlePhyloTreeModalClose}
            />
          )}
        </UserContext.Consumer>
      )}
    </div>
  );
};
