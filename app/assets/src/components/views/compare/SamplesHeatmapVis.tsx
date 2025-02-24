import cx from "classnames";
import { find, isEmpty, isEqual, keyBy, orderBy } from "lodash/fp";
import React from "react";
import {
  ANALYTICS_EVENT_NAMES,
  trackEvent,
  withAnalytics,
} from "~/api/analytics";
import BasicPopup from "~/components/BasicPopup";
import MetadataLegend from "~/components/common/Heatmap/MetadataLegend";
import MetadataSelector from "~/components/common/Heatmap/MetadataSelector";
import PinSampleSelector from "~/components/common/Heatmap/PinSampleSelector";
import RowGroupLegend from "~/components/common/Heatmap/RowGroupLegend";
import TaxonSelector from "~/components/common/TaxonSelector";
import { UserContext } from "~/components/common/UserContext";
import PlusMinusControl from "~/components/ui/controls/PlusMinusControl";
import { HEATMAP_PATHOGEN_FLAGGING_FEATURE } from "~/components/utils/features";
import { logError } from "~/components/utils/logUtil";
import { getTooltipStyle } from "~/components/utils/tooltip";
import { generateUrlToSampleView } from "~/components/utils/urls";
import Heatmap from "~/components/visualizations/heatmap/Heatmap";
import { splitIntoMultipleLines } from "~/helpers/strings";
import { SelectedOptions } from "~/interface/shared";
import { TooltipVizTable } from "~ui/containers";
import { IconAlertSmall, IconCloseSmall } from "~ui/icons";
import { openUrlInNewTab } from "~utils/links";
import cs from "./samples_heatmap_vis.scss";
import { SPECIFICITY_OPTIONS } from "./SamplesHeatmapView/constants";

const CAPTION_LINE_WIDTH = 180;

interface SamplesHeatmapVisProps {
  data?: object;
  pathogenFlagsData?: string[][][];
  taxonFilterState?: Record<string, Record<string, boolean>>;
  defaultMetadata?: $TSFixMe[];
  metadataTypes?: $TSFixMe[];
  metric?: string;
  metadataSortField?: string;
  metadataSortAsc?: boolean;
  onMetadataSortChange?: $TSFixMeFunction;
  onMetadataChange?: $TSFixMeFunction;
  onAddTaxon?: $TSFixMeFunction;
  newTaxon?: number;
  onRemoveTaxon?: $TSFixMeFunction;
  onPinSample?: $TSFixMeFunction;
  onPinSampleApply?: $TSFixMeFunction;
  onPinSampleCancel?: $TSFixMeFunction;
  onUnpinSample?: $TSFixMeFunction;
  pendingPinnedSampleIds?: $TSFixMe[];
  pinnedSampleIds?: $TSFixMe[];
  onSampleLabelClick?: $TSFixMeFunction;
  onTaxonLabelClick?: $TSFixMeFunction;
  sampleDetails?: object;
  sampleIds?: $TSFixMe[];
  selectedOptions: SelectedOptions;
  scale?: string;
  taxLevel?: string;
  taxonCategories?: $TSFixMe[];
  taxonDetails?: object;
  tempSelectedOptions?: object;
  allTaxonIds?: $TSFixMe[];
  taxonIds?: $TSFixMe[];
  selectedTaxa?: object;
  appliedFilters?: SelectedOptions;
  sampleSortType?: string;
  fullScreen?: boolean;
  taxaSortType?: string;
  backgroundName?: string;
}

interface SamplesHeatmapVisState {
  addTaxonTrigger: $TSFixMe;
  addMetadataTrigger: $TSFixMe;
  nodeHoverInfo: $TSFixMe;
  columnMetadataLegend: $TSFixMe;
  rowGroupLegend: $TSFixMe;
  selectedMetadata: Set<$TSFixMe>;
  tooltipLocation: $TSFixMe;
  displayControlsBanner: $TSFixMe;
  pinIconHovered: boolean;
  pinSampleTrigger: $TSFixMe;
  spacePressed?: boolean;
}

class SamplesHeatmapVis extends React.Component<
  SamplesHeatmapVisProps,
  SamplesHeatmapVisState
> {
  heatmap: $TSFixMe;
  heatmapContainer: $TSFixMe;
  metadataTypes: $TSFixMe;
  metrics: $TSFixMe;
  scale: $TSFixMe;
  constructor(props: SamplesHeatmapVisProps) {
    super(props);

    this.state = {
      addTaxonTrigger: null,
      addMetadataTrigger: null,
      nodeHoverInfo: null,
      columnMetadataLegend: null,
      rowGroupLegend: null,
      selectedMetadata: new Set(this.props.defaultMetadata),
      tooltipLocation: null,
      displayControlsBanner: true,
      pinIconHovered: false,
      pinSampleTrigger: null,
    };

    this.heatmap = null;
    this.scale = this.props.scale;

    // TODO: yet another metric name conversion to remove
    this.metrics = [
      { key: "NT.zscore", label: "NT Z Score" },
      { key: "NT.rpm", label: "NT rPM" },
      { key: "NT.r", label: "NT r (total reads)" },
      { key: "NR.zscore", label: "NR Z Score" },
      { key: "NR.rpm", label: "NR rPM" },
      { key: "NR.r", label: "NR r (total reads)" },
    ];

    this.metadataTypes = keyBy("key", this.props.metadataTypes);
  }

  componentDidMount() {
    const {
      onMetadataSortChange,
      metadataSortField,
      metadataSortAsc,
      taxonFilterState,
    } = this.props;
    const { allowedFeatures = [] } = this.context || {};

    this.heatmap = new Heatmap(
      this.heatmapContainer,
      {
        rowLabels: this.extractTaxonLabels(),
        columnLabels: this.extractSampleLabels(), // Also includes column metadata.
        values: this.props.data[this.props.metric],
        pathogenFlags: this.props.pathogenFlagsData,
        taxonFilterState: taxonFilterState,
      },
      {
        customColorCallback: this.colorScale,
        columnMetadata: this.getSelectedMetadata(),
        initialColumnMetadataSortField: metadataSortField,
        initialColumnMetadataSortAsc: metadataSortAsc,
        onNodeHover: this.handleNodeHover,
        onMetadataNodeHover: this.handleMetadataNodeHover,
        onNodeHoverOut: this.handleNodeHoverOut,
        onColumnMetadataSortChange: onMetadataSortChange,
        onColumnMetadataLabelHover: this.handleColumnMetadataLabelHover,
        onColumnMetadataLabelOut: this.handleColumnMetadataLabelOut,
        onRowGroupEnter: this.handleRowGroupEnter,
        onRowGroupLeave: this.handleRowGroupLeave,
        onAddRowClick: this.props.onAddTaxon ? this.handleAddTaxonClick : null,
        onRemoveRow: this.props.onRemoveTaxon,
        onPinColumnClick:
          allowedFeatures.includes("heatmap_pin_samples") &&
          this.props.onPinSample
            ? this.handlePinSampleClick
            : null,
        onUnpinColumn: this.props.onUnpinSample,
        onPinIconHover: this.handlePinIconHover,
        onPinIconExit: this.handlePinIconExit,
        onCellClick: this.handleCellClick,
        onColumnLabelHover: this.handleSampleLabelHover,
        onColumnLabelOut: this.handleSampleLabelOut,
        onColumnLabelClick: this.props.onSampleLabelClick,
        onRowLabelClick: this.props.onTaxonLabelClick,
        onAddColumnMetadataClick: this.handleAddColumnMetadataClick,
        scale: this.props.scale,
        // only display colors to positive values
        scaleMin: 0,
        printCaption: this.generateHeatmapCaptions(),
        shouldSortColumns: this.props.sampleSortType === "alpha", // else cluster
        shouldSortRows: this.props.taxaSortType === "genus", // else cluster
        // Shrink to fit the viewport width
        maxWidth: this.heatmapContainer.offsetWidth,
        shouldShowPathogenFlagsOutlines: allowedFeatures.includes(
          HEATMAP_PATHOGEN_FLAGGING_FEATURE,
        ),
      },
    );
    this.heatmap.start();

    if (this.props.newTaxon) {
      this.scrollToRow();
    }

    document.addEventListener("keydown", this.handleKeyDown, false);
    document.addEventListener("keyup", this.handleKeyUp, false);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown, false);
    document.removeEventListener("keyup", this.handleKeyUp, false);
  }

  componentDidUpdate(prevProps: SamplesHeatmapVisProps) {
    if (this.props.scale !== this.scale) {
      this.scale = this.props.scale;
      this.heatmap.updateScale(this.props.scale);
    }
    // We don't need to use isEqual() for comparing the objects `sampleDetails` and `data`.
    // This is because their references are only updated when the data changes, in which
    // case !== will pick it up.
    if (this.props.sampleDetails !== prevProps.sampleDetails) {
      this.heatmap.updateData({
        columnLabels: this.extractSampleLabels(), // Also includes column metadata.
      });
    }
    if (this.props.data !== prevProps.data) {
      this.heatmap.updateData({
        values: this.props.data[this.props.metric],
        pathogenFlags: this.props.pathogenFlagsData,
        rowLabels: this.extractTaxonLabels(),
      });
      this.scrollToRow();
    }
    if (!isEqual(this.props.taxonIds, prevProps.taxonIds)) {
      this.heatmap.updateData({
        values: this.props.data[this.props.metric],
        pathogenFlags: this.props.pathogenFlagsData,
        rowLabels: this.extractTaxonLabels(),
      });
    }
    if (!isEqual(this.props.pinnedSampleIds, prevProps.pinnedSampleIds)) {
      this.heatmap.updateData({
        columnLabels: this.extractSampleLabels(), // Also includes column pinned state.
      });
    }
    if (!isEqual(this.props.appliedFilters, prevProps.appliedFilters)) {
      this.heatmap.updatePrintCaption(this.generateHeatmapCaptions());
    }
    if (this.props.sampleSortType !== prevProps.sampleSortType) {
      this.heatmap.updateSortColumns(this.props.sampleSortType === "alpha");
    }
    if (this.props.taxaSortType !== prevProps.taxaSortType) {
      this.heatmap.updateSortRows(this.props.taxaSortType === "genus");
    }
  }

  extractSampleLabels() {
    return this.props.sampleIds.map(id => {
      const sampleDetail = this.props.sampleDetails[id];
      const { name, metadata, duplicate } = sampleDetail;
      return {
        label: name,
        metadata: metadata,
        id,
        duplicateLabel: duplicate,
        pinned: this.props.pinnedSampleIds.includes(id),
        filterStateColumn: sampleDetail["index"],
      };
    });
  }

  colorScale = (
    value: $TSFixMe,
    node: $TSFixMe,
    originalColor: $TSFixMe,
    _: $TSFixMe,
    colorNoValue: $TSFixMe,
  ) => {
    const { taxonFilterState, sampleIds, taxonIds } = this.props;
    const sampleId = sampleIds[node.columnIndex];
    const taxonId = taxonIds[node.rowIndex];
    const sampleDetails = this.props.sampleDetails[sampleId];
    const taxonDetails = this.props.taxonDetails[taxonId];

    const filtered =
      taxonFilterState?.[taxonDetails["index"]]?.[sampleDetails["index"]];
    return value > 0 && filtered ? originalColor : colorNoValue;
  };

  extractTaxonLabels() {
    return this.props.taxonIds.map(id => {
      const taxon = this.props.taxonDetails[id];
      // parentId is false when taxon level is genus
      // This means there is no sortKey when set to "Taxon Level: Genus"
      const sortKey =
        taxon.parentId === -200 // MISSING_GENUS_ID
          ? Number.MAX_SAFE_INTEGER
          : taxon.parentId;
      return {
        label: taxon.name,
        sortKey: sortKey,
        genusName: taxon.genusName,
        filterStateRow: taxon["index"],
      };
    });
  }

  formatFilterString = (name, val) => {
    let stringToReturn = "";
    let numberOfFilters = 0;
    switch (name) {
      case "thresholdFilters": {
        const thresholdFilters = val.reduce(
          (result: string[], threshold: $TSFixMe) => {
            result.push(
              `${threshold["metricDisplay"]} ${threshold["operator"]} ${threshold["value"]}`,
            );
            return result;
          },
          [],
        );

        if (!isEmpty(thresholdFilters)) {
          numberOfFilters += thresholdFilters.length;
          stringToReturn = `Thresholds: ${thresholdFilters.join()}`;
        }
        break;
      }
      case "categories": {
        stringToReturn = `Categories: ${val}`;
        numberOfFilters += val.length;
        break;
      }
      case "subcategories": {
        const subcategories = [];
        for (const [subcategoryName, subcategoryVal] of Object.entries(val)) {
          if (!isEmpty(subcategoryVal)) {
            subcategories.push(
              // @ts-expect-error Property 'join' does not exist on type 'unknown'
              `${subcategoryName} - ${subcategoryVal.join()}`,
            );
          }
        }

        stringToReturn = `Subcategories: ${subcategories}`;
        numberOfFilters += subcategories.length;
        break;
      }
      case "readSpecificity": {
        stringToReturn = `Read Specificity: ${
          find({ value: val }, SPECIFICITY_OPTIONS).text
        }`;
        ++numberOfFilters;
        break;
      }
      case "taxonTags": {
        stringToReturn = `Pathogen Tags: ${val}`;
        numberOfFilters += val.length;
        break;
      }

      default: {
        logError({
          message:
            "SamplesHeatmapVis: Invalid filter passed to formatFilterString()",
          details: { name, val },
        });
        break;
      }
    }
    return { string: stringToReturn, numberOfFilters };
  };

  generateHeatmapCaptions = () => {
    const { appliedFilters, selectedOptions, backgroundName, scale } =
      this.props;

    // first, note the metric, scale and background used
    const selectedOptionsString = splitIntoMultipleLines(
      `Showing ${selectedOptions.metric} for ${selectedOptions.taxonsPerSample} taxa per sample on a ${scale} scale; Background: ${backgroundName}.`,
      CAPTION_LINE_WIDTH,
    );

    // next, figure out how many filters are applied and describe them
    const filtersStrings = [];
    let nFilters = 0;

    const filterListOrder = [
      "categories",
      "readSpecificity",
      "taxonTags",
      "subcategories",
      "thresholdFilters",
    ];

    filterListOrder.forEach(name => {
      let val = appliedFilters[name];
      if (val === undefined || name === "subcategories") return;

      if (name === "categories") {
        val = [...val, ...(appliedFilters.subcategories?.Viruses || [])];
      }

      const { string, numberOfFilters } = this.formatFilterString(name, val);
      filtersStrings.push(string);
      nFilters += numberOfFilters;
    });

    // if there are any filters applied, describe what filtered vs null data look like.
    const missingDataString =
      nFilters > 0
        ? splitIntoMultipleLines(
            `Taxa which are not present in the sample are represented by white cells. Taxa filtered out in this view have been hidden or grayed out.  ${nFilters} filter(s) applied:`,
            CAPTION_LINE_WIDTH,
          )
        : ["No filters applied."];

    // finally, describe the filters
    const filtersString = splitIntoMultipleLines(
      filtersStrings.join("; "),
      CAPTION_LINE_WIDTH,
    );

    return [...selectedOptionsString, ...missingDataString, ...filtersString];
  };

  // Update tooltip contents and location when hover over a data/metadata node
  handleNodeHover = (node: $TSFixMe) => {
    this.setState({
      nodeHoverInfo: this.getTooltipData(node),
      tooltipLocation: this.heatmap.getCursorLocation(),
    });
    trackEvent("SamplesHeatmapVis_node_hovered", {
      nodeValue: node.value,
      nodeId: node.id,
    });
  };

  handleMetadataNodeHover = (node: $TSFixMe, metadata: $TSFixMe) => {
    const legend = this.heatmap.getColumnMetadataLegend(metadata.value);
    const currentValue = node.metadata[metadata.value] || "Unknown";
    const currentPair = { [currentValue]: legend[currentValue] };
    this.setState({
      columnMetadataLegend: currentPair,
      tooltipLocation: this.heatmap.getCursorLocation(),
    });
    trackEvent("SamplesHeatmapVis_metadata-node_hovered", metadata);
  };

  handleRowGroupEnter = (
    rowGroup: $TSFixMe,
    rect: $TSFixMe,
    minTop: $TSFixMe,
  ) => {
    this.setState({
      rowGroupLegend: {
        label: `Genus: ${rowGroup.genusName || "Unknown"}`,
        tooltipLocation: {
          left: rect.left + rect.width / 2,
          top: Math.max(minTop, rect.top),
        },
      },
    });
    trackEvent("SamplesHeatmapVis_row-group_hovered", {
      genusName: rowGroup.genusName,
      genusId: rowGroup.sortKey,
    });
  };

  handleNodeHoverOut = () => {
    this.setState({ nodeHoverInfo: null });
  };

  handleColumnMetadataLabelHover = (node: $TSFixMe) => {
    const legend = this.heatmap.getColumnMetadataLegend(node.value);
    this.setState({
      columnMetadataLegend: legend,
      tooltipLocation: this.heatmap.getCursorLocation(),
    });
    trackEvent("SamplesHeatmapVis_column-metadata_hovered", {
      nodeValue: node.value,
    });
  };

  handleColumnMetadataLabelOut = () => {
    this.setState({ columnMetadataLegend: null });
  };

  handleRowGroupLeave = () => {
    this.setState({ rowGroupLegend: null });
  };

  handleSampleLabelHover = (node: $TSFixMe) => {
    this.setState({
      columnMetadataLegend: this.getSampleTooltipData(node),
      tooltipLocation: this.heatmap.getCursorLocation(),
    });
  };

  handleSampleLabelOut = () => {
    this.setState({ columnMetadataLegend: null });
  };

  getSampleTooltipData(node: $TSFixMe) {
    const sampleId = node.id;
    const sampleDetails = this.props.sampleDetails[sampleId];

    if (sampleDetails["duplicate"]) {
      return { "Duplicate sample name": "" };
    }
  }

  download() {
    this.heatmap.download();
  }

  downloadAsPng() {
    this.heatmap.downloadAsPng();
  }

  computeCurrentHeatmapViewValuesForCSV({ headers }: $TSFixMe) {
    // Need to specify the Taxon header. The other headers (sample names in the heatmap) will be computed in this.heatmap
    return this.heatmap.computeCurrentHeatmapViewValuesForCSV({
      headers,
    });
  }

  getTooltipData(node: $TSFixMe) {
    const { data, taxonFilterState, sampleIds, taxonIds } = this.props;
    const sampleId = sampleIds[node.columnIndex];
    const taxonId = taxonIds[node.rowIndex];
    const sampleDetails = this.props.sampleDetails[sampleId];
    const taxonDetails = this.props.taxonDetails[taxonId];

    const nodeHasData = this.metrics.some(
      (metric: $TSFixMe) => !!data[metric.key][node.rowIndex][node.columnIndex],
    );

    const isFiltered =
      taxonFilterState[taxonDetails["index"]][sampleDetails["index"]];

    let values = null;
    if (nodeHasData) {
      values = this.metrics.map((metric: $TSFixMe) => {
        const data = this.props.data[metric.key];
        const value = parseFloat(
          (data[node.rowIndex][node.columnIndex] || 0).toFixed(4),
        );
        return [
          metric.label,
          metric.key === this.props.metric ? <b>{value}</b> : value,
        ];
      });
    }

    let subtitle = null;

    if (!nodeHasData) {
      subtitle = "This taxon was not found in the sample.";
    } else if (!isFiltered) {
      subtitle = "This taxon does not satisfy the threshold filters.";
    }

    if (subtitle) {
      subtitle = (
        <div className={cs.warning}>
          <IconAlertSmall className={cs.warningIcon} type="warning" />
          <div className={cs.warningText}>{subtitle}</div>
        </div>
      );
    }

    const sections = [
      {
        name: "Info",
        data: [
          ["Sample", sampleDetails.name],
          ["Taxon", taxonDetails.name],
          ["Category", taxonDetails.category],
        ],
        disabled: !isFiltered,
      },
    ];

    if (nodeHasData) {
      sections.push({
        name: "Values",
        data: values,
        disabled: !isFiltered,
      });
    }

    return {
      subtitle,
      data: sections,
      nodeHasData,
    };
  }

  handleKeyDown = (currentEvent: $TSFixMe) => {
    if (currentEvent.code === "Space") {
      this.setState({ spacePressed: true });
    }
  };

  handleKeyUp = (currentEvent: $TSFixMe) => {
    if (currentEvent.code === "Space") {
      this.setState({ spacePressed: false });
      currentEvent.preventDefault();
    }
  };

  handleCellClick = (cell: $TSFixMe, currentEvent: $TSFixMe) => {
    const { tempSelectedOptions } = this.props;

    // Disable cell click if spacebar is pressed to pan the heatmap.
    if (!this.state.spacePressed) {
      const sampleId = this.props.sampleIds[cell.columnIndex];
      const url = generateUrlToSampleView({
        sampleId,
        // @ts-expect-error Type 'object' is not assignable to type 'TempSelectedOptionsShape | Record<string, never>'.
        tempSelectedOptions,
      });
      // @ts-expect-error Expected 1 arguments, but got 2.
      openUrlInNewTab(url, currentEvent);
      trackEvent("SamplesHeatmapVis_cell_clicked", {
        sampleId,
      });
    }
  };

  handleAddTaxonClick = (trigger: $TSFixMe) => {
    this.setState({
      addTaxonTrigger: trigger,
    });
    trackEvent("SamplesHeatmapVis_add-taxon_clicked", {
      addTaxonTrigger: trigger,
    });
  };

  handlePinSampleClick = (trigger: $TSFixMe) => {
    this.setState({
      pinSampleTrigger: trigger,
    });
    trackEvent(
      ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_VIS_PIN_SAMPLES_DROPDOWN_TRIGGER_CLICKED,
      {
        pinSampleTrigger: trigger,
      },
    );
  };

  handlePinIconHover = () => {
    this.setState({
      pinIconHovered: true,
    });
  };

  handlePinIconExit = () => {
    this.setState({
      pinIconHovered: false,
    });
  };

  getAvailableTaxa() {
    // taxonDetails includes entries mapping both
    // taxId => taxonDetails and taxName => taxonDetails,
    // so iterate over allTaxonIds to avoid duplicates.
    const { allTaxonIds, taxonDetails } = this.props;
    return allTaxonIds.map(taxId => {
      return {
        value: taxId,
        label: taxonDetails[taxId].name,
        count: taxonDetails[taxId].sampleCount,
      };
    });
  }

  scrollToRow() {
    if (this.props.newTaxon) {
      this.heatmap.scrollToRow(
        this.props.taxonDetails[this.props.newTaxon]?.name,
      );
    }
  }

  handleAddColumnMetadataClick = (trigger: $TSFixMe) => {
    this.setState({
      addMetadataTrigger: trigger,
    });
    trackEvent("SamplesHeatmapVis_column-metadata_clicked", {
      addMetadataTrigger: trigger,
    });
  };

  handleSelectedMetadataChange = (selectedMetadata: $TSFixMe) => {
    const { onMetadataChange } = this.props;

    const intersection = new Set(
      [...this.state.selectedMetadata].filter(metadatum =>
        selectedMetadata.has(metadatum),
      ),
    );
    const current = new Set([...intersection, ...selectedMetadata]);
    this.setState(
      {
        selectedMetadata: current,
      },
      () => {
        this.heatmap.updateColumnMetadata(this.getSelectedMetadata());
        onMetadataChange && onMetadataChange(selectedMetadata);
        trackEvent("SamplesHeatmapVis_selected-metadata_changed", {
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'length' does not exist on type 'Set<any>... Remove this comment to see the full error message
          selectedMetadata: current.length,
        });
      },
    );
  };

  getSelectedMetadata() {
    const sortByLabel = (a: $TSFixMe, b: $TSFixMe) =>
      a.label > b.label ? 1 : -1;

    return Array.from(this.state.selectedMetadata)
      .filter(metadatum => !!this.metadataTypes[metadatum])
      .map(metadatum => {
        return { value: metadatum, label: this.metadataTypes[metadatum].name };
      })
      .sort(sortByLabel);
  }

  getAvailableMetadataOptions() {
    return this.props.metadataTypes
      .filter(metadata => {
        return metadata.key && metadata.name;
      })
      .map(metadata => {
        return { value: metadata.key, label: metadata.name };
      });
  }

  handleZoom(increment: $TSFixMe) {
    const newZoom = Math.min(
      3, // max zoom factor
      Math.max(0.2, this.heatmap.options.zoom + increment),
    );
    this.heatmap.updateZoom(newZoom);
  }

  hideControlsBanner = () => {
    this.setState({ displayControlsBanner: false });
  };

  render() {
    const {
      addTaxonTrigger,
      tooltipLocation,
      nodeHoverInfo,
      columnMetadataLegend,
      rowGroupLegend,
      addMetadataTrigger,
      selectedMetadata,
      pinSampleTrigger,
      pinIconHovered,
    } = this.state;

    let pinSampleOptions = this.props.sampleIds.map(id => {
      return {
        id,
        name: this.props.sampleDetails[id].name,
        pinned: this.props.pinnedSampleIds.includes(id),
      };
    });
    pinSampleOptions = orderBy(
      ["pinned", "name"],
      ["desc", "asc"],
      pinSampleOptions,
    );

    return (
      <div className={cs.samplesHeatmapVis}>
        <PlusMinusControl
          onPlusClick={withAnalytics(
            () => this.handleZoom(0.25),
            ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_VIS_ZOOM_IN_CONTROL_CLICKED,
          )}
          onMinusClick={withAnalytics(
            () => this.handleZoom(-0.25),
            ANALYTICS_EVENT_NAMES.SAMPLES_HEATMAP_VIS_ZOOM_OUT_CONTROL_CLICKED,
          )}
          className={cs.plusMinusControl}
        />

        <div
          className={cs.heatmapContainer}
          ref={container => {
            this.heatmapContainer = container;
          }}
        />

        {nodeHoverInfo && tooltipLocation && (
          <div
            className={cx(cs.tooltip, nodeHoverInfo && cs.visible)}
            style={getTooltipStyle(tooltipLocation, {
              buffer: 20,
              below: true,
              // so we can show the tooltip above the cursor if need be
              height: nodeHoverInfo.nodeHasData ? 300 : 180,
            })}
          >
            <TooltipVizTable {...nodeHoverInfo} />
          </div>
        )}
        {columnMetadataLegend && tooltipLocation && (
          <MetadataLegend
            metadataColors={columnMetadataLegend}
            tooltipLocation={tooltipLocation}
          />
        )}
        {pinIconHovered && tooltipLocation && (
          <div
            className={cx(cs.tooltip, cs.visible)}
            style={{
              left: tooltipLocation.left,
              top: tooltipLocation.top - 10,
            }}
          >
            <BasicPopup
              basic={false}
              content="Unpin"
              open // Make sure the tooltip is visible as long as the container is visible.
              position="top center"
              // Pass in an empty div because the tooltip requires a trigger element.
              trigger={<div />}
            />
          </div>
        )}
        {rowGroupLegend && <RowGroupLegend {...rowGroupLegend} />}
        {addMetadataTrigger && (
          <MetadataSelector
            addMetadataTrigger={addMetadataTrigger}
            selectedMetadata={selectedMetadata}
            metadataTypes={this.getAvailableMetadataOptions()}
            onMetadataSelectionChange={this.handleSelectedMetadataChange}
            onMetadataSelectionClose={() => {
              this.setState({ addMetadataTrigger: null });
            }}
          />
        )}
        {addTaxonTrigger && (
          <TaxonSelector
            addTaxonTrigger={addTaxonTrigger}
            // @ts-expect-error ts-migrate(2554) FIXME: Expected 0-1 arguments, but got 2.
            selectedTaxa={new Set(this.props.taxonIds, this.props.selectedTaxa)}
            availableTaxa={this.getAvailableTaxa()}
            sampleIds={this.props.sampleIds}
            onTaxonSelectionChange={(selected: $TSFixMe) => {
              this.props.onAddTaxon(selected);
            }}
            onTaxonSelectionClose={() => {
              this.setState({ addTaxonTrigger: null });
            }}
            taxLevel={this.props.taxLevel}
          />
        )}
        {pinSampleTrigger && (
          <PinSampleSelector
            onApply={this.props.onPinSampleApply}
            onCancel={this.props.onPinSampleCancel}
            onClose={() => {
              this.setState({ pinSampleTrigger: null });
            }}
            onSelectionChange={this.props.onPinSample}
            options={pinSampleOptions}
            selectedSamples={this.props.pendingPinnedSampleIds}
            selectSampleTrigger={pinSampleTrigger}
          />
        )}
        <div
          className={cx(
            cs.bannerContainer,
            this.state.displayControlsBanner ? cs.show : cs.hide,
          )}
        >
          <div className={cs.bannerText}>
            Hold SHIFT to scroll horizontally and SPACE BAR to pan.
            <IconCloseSmall
              className={cs.removeIcon}
              onClick={this.hideControlsBanner}
            />
          </div>
        </div>
      </div>
    );
  }
}

// @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
SamplesHeatmapVis.defaultProps = {
  defaultMetadata: [],
};

SamplesHeatmapVis.contextType = UserContext;

export default SamplesHeatmapVis;
