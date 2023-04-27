// These are the buttons that appear on a Report table row when hovered.
import cx from "classnames";
import { ButtonIcon, IconNameToSizes } from "czifui";
import { filter, pick, size } from "lodash/fp";
import React, { useContext, useState } from "react";
import { ANALYTICS_EVENT_NAMES, trackEvent } from "~/api/analytics";
// TODO(mark): Move BasicPopup into /ui.
import BasicPopup from "~/components/BasicPopup";
import { CoverageVizParamsRaw } from "~/components/common/CoverageVizBottomSidebar/types";
import { UserContext } from "~/components/common/UserContext";
import BareDropdown from "~/components/ui/controls/dropdowns/BareDropdown";
import BetaLabel from "~/components/ui/labels/BetaLabel";
import { BLAST_V1_FEATURE } from "~/components/utils/features";
import {
  CONSENSUS_GENOME_FEATURE,
  COVERAGE_VIZ_FEATURE,
  isPipelineFeatureAvailable,
  MINIMUM_VERSIONS,
} from "~/components/utils/pipeline_versions";
import { BlastData } from "~/interface/sampleView";
import {
  DOWNLOAD_CONTIGS,
  DOWNLOAD_READS,
  SPECIES_LEVEL_INDEX,
  TAX_LEVEL_GENUS,
  TAX_LEVEL_SPECIES,
} from "./constants";
import cs from "./hover_actions.scss";
import { PickConsensusGenomeData } from "./ReportTable";

interface HoverActionsProps {
  className?: string;
  consensusGenomeEnabled?: boolean;
  contigVizEnabled?: boolean;
  coverageVizEnabled?: boolean;
  fastaEnabled?: boolean;
  onlyShowLongReadMNGSOptions: boolean;
  onBlastClick: (params: BlastData) => void;
  onConsensusGenomeClick: (options: PickConsensusGenomeData) => void;
  onContigVizClick: (options: object) => void;
  onCoverageVizClick: (newCoverageVizParams: CoverageVizParamsRaw) => void;
  onFastaActionClick: (options: object) => void;
  onPhyloTreeModalOpened?: (options: object) => void;
  onPreviousConsensusGenomeClick?: (params: PickConsensusGenomeData) => void;
  percentIdentity?: number;
  phyloTreeEnabled?: boolean;
  pipelineVersion?: string;
  previousConsensusGenomeRuns?: $TSFixMeUnknown[];
  sampleId?: number;
  snapshotShareId?: string;
  taxonStatsByCountType?: {
    ntContigs: number;
    ntReads: number;
    nrContigs: number;
    nrReads: number;
  };
  taxCategory?: string;
  taxCommonName?: string;
  taxId?: number;
  taxLevel?: number;
  taxName?: string;
  taxSpecies?: $TSFixMeUnknown[];
}

const HoverActions = ({
  className,
  consensusGenomeEnabled,
  contigVizEnabled,
  coverageVizEnabled,
  fastaEnabled,
  onBlastClick,
  onConsensusGenomeClick,
  onContigVizClick,
  onCoverageVizClick,
  onFastaActionClick,
  onPhyloTreeModalOpened,
  onPreviousConsensusGenomeClick,
  onlyShowLongReadMNGSOptions,
  percentIdentity,
  phyloTreeEnabled,
  pipelineVersion,
  previousConsensusGenomeRuns,
  sampleId,
  snapshotShareId,
  taxonStatsByCountType,
  taxCategory,
  taxCommonName,
  taxId,
  taxLevel,
  taxName,
  taxSpecies,
}: HoverActionsProps) => {
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};
  const [showHoverActions, setShowHoverActions] = useState(false);
  const { ntContigs, ntReads } = taxonStatsByCountType;

  const handlePhyloModalOpen = () => {
    onPhyloTreeModalOpened &&
      onPhyloTreeModalOpened({
        taxId,
        taxName,
      });
  };

  const handleConsensusGenomeClick = () => {
    onConsensusGenomeClick &&
      onConsensusGenomeClick({
        percentIdentity,
        taxId,
        taxName,
      });
  };

  const handlePreviousConsensusGenomeClick = () => {
    onPreviousConsensusGenomeClick &&
      onPreviousConsensusGenomeClick({
        percentIdentity,
        taxId,
        taxName,
      });
  };

  const handleBlastClick = () => {
    // If there are contigs, then BLAST contigs, otherwise BLAST reads.
    onBlastClick &&
      onBlastClick({
        context: {
          blastedFrom: "HoverActions",
        },
        pipelineVersion,
        sampleId,
        // shouldBlastContigs is only used by the BLAST v0 feature. It will be removed after BLAST v1 is launched
        shouldBlastContigs: ntContigs >= 0,
        taxonStatsByCountType,
        taxName,
        taxLevel,
        taxId,
      });
  };

  // Metadata for each of the hover actions.
  const getHoverActions = () => {
    const hasCoverageViz =
      isPipelineFeatureAvailable(COVERAGE_VIZ_FEATURE, pipelineVersion) ||
      onlyShowLongReadMNGSOptions;
    const hasBlastv1Feature = allowedFeatures.includes(BLAST_V1_FEATURE);
    const params = {
      pipelineVersion,
      taxCommonName: taxCommonName,
      taxId: taxId,
      taxLevel:
        taxLevel === SPECIES_LEVEL_INDEX ? TAX_LEVEL_SPECIES : TAX_LEVEL_GENUS,
      taxName: taxName,
      taxSpecies: taxSpecies,
      taxonStatsByCountType,
    };

    // Define all available icons (but don't display them)
    const HOVER_ACTIONS_VIZ = hasCoverageViz
      ? {
          key: `coverage_viz_${params.taxId}`,
          message: "Coverage Visualization",
          iconName: "barChartVertical4",
          handleClick: onCoverageVizClick,
          enabled: coverageVizEnabled,
          disabledMessage:
            "Coverage Visualization Not Available - requires reads in NT",
          params,
          snapshotEnabled: true,
        }
      : {
          key: `alignment_viz_${params.taxId}`,
          message: "Alignment Visualization",
          iconName: "linesHorizontal",
          handleClick: onCoverageVizClick,
          enabled: coverageVizEnabled,
          disabledMessage:
            "Alignment Visualization Not Available - requires reads in NT",
          params,
        };

    const HOVER_ACTIONS_BLAST_V1 = {
      key: `blast_${params.taxId}_v1`,
      message: "BLAST",
      iconName: "searchLinesHorizontal",
      handleClick: handleBlastClick,
      enabled: true,
    };

    const HOVER_ACTIONS_BLAST = {
      key: `blast_${params.taxId}`,
      message: "BLASTN",
      iconName: "searchLinesHorizontal",
      handleClick: handleBlastClick,
      enabled: !!ntContigs || !!ntReads,
      disabledMessage:
        "BLAST is not available - requires at least 1 contig or read in NT.",
    };

    const HOVER_ACTIONS_PHYLO = {
      key: `phylo_tree_${params.taxId}`,
      message: (
        <div>
          Phylogenetic Analysis <BetaLabel />
        </div>
      ),
      iconName: "treeHorizontal",
      handleClick: handlePhyloModalOpen,
      enabled: phyloTreeEnabled,
      disabledMessage:
        "Phylogenetic Analysis Not Available - requires 100+ reads in NT/NR",
    };

    let HOVER_ACTIONS_CONSENSUS = null;
    if (consensusGenomeEnabled) {
      if (previousConsensusGenomeRuns) {
        HOVER_ACTIONS_CONSENSUS = {
          key: `consensus_genome_${params.taxId}`,
          message: `Consensus Genome`,
          iconName: "linesDashed3Solid1",
          count: size(previousConsensusGenomeRuns),
          handleClick: handlePreviousConsensusGenomeClick,
          enabled: true,
        };
      } else {
        HOVER_ACTIONS_CONSENSUS = {
          key: `consensus_genome_${params.taxId}`,
          message: "Consensus Genome",
          iconName: "linesDashed3Solid1",
          handleClick: handleConsensusGenomeClick,
          enabled: !getConsensusGenomeError(),
          disabledMessage: getConsensusGenomeError(),
        };
      }
    }

    const HOVER_ACTIONS_DOWNLOAD = {
      key: `download_${params.taxId}`,
      message: "Download Options",
      iconName: "download",
      options: [
        {
          text: "Contigs FASTA",
          value: DOWNLOAD_CONTIGS,
          disabled: !contigVizEnabled,
        },
        {
          text: "Reads FASTA",
          value: DOWNLOAD_READS,
          disabled: !fastaEnabled,
        },
      ],
      onChange: (value: typeof DOWNLOAD_CONTIGS | typeof DOWNLOAD_READS) => {
        if (value === DOWNLOAD_CONTIGS) onContigVizClick(params || {});
        else if (value === DOWNLOAD_READS) onFastaActionClick(params || {});
        else console.error("Unexpected dropdown value:", value);
      },
      enabled: contigVizEnabled || fastaEnabled,
      disabledMessage: "Downloads Not Available",
      params,
    };

    // Build up the list of hover actions
    let hoverActions = [];
    if (onlyShowLongReadMNGSOptions) {
      hoverActions = [HOVER_ACTIONS_VIZ, HOVER_ACTIONS_DOWNLOAD];
    } else {
      if (hasBlastv1Feature) {
        hoverActions = [
          HOVER_ACTIONS_VIZ,
          HOVER_ACTIONS_BLAST_V1,
          { divider: true },
          HOVER_ACTIONS_PHYLO,
          HOVER_ACTIONS_CONSENSUS,
          HOVER_ACTIONS_DOWNLOAD,
        ];
      } else {
        hoverActions = [
          HOVER_ACTIONS_VIZ,
          HOVER_ACTIONS_BLAST,
          { divider: true },
          HOVER_ACTIONS_PHYLO,
          HOVER_ACTIONS_CONSENSUS,
          HOVER_ACTIONS_DOWNLOAD,
        ];
      }
    }
    // Remove null actions (could happen with HOVER_ACTIONS_CONSENSUS)
    hoverActions = hoverActions.filter(d => d !== null);

    return snapshotShareId
      ? filter("snapshotEnabled", hoverActions)
      : hoverActions;
  };

  const getConsensusGenomeError = () => {
    if (
      !isPipelineFeatureAvailable(CONSENSUS_GENOME_FEATURE, pipelineVersion)
    ) {
      return `Consensus genome pipeline not available for mNGS pipeline versions < ${MINIMUM_VERSIONS[CONSENSUS_GENOME_FEATURE]}`;
    } else if (taxCategory !== "viruses") {
      return "Consensus genome pipeline is currently available for viruses only.";
    } else if (taxLevel !== 1) {
      return "Consensus genome pipeline only available at the species level.";
    } else if (ntContigs === undefined || ntContigs <= 0) {
      return "Please select a virus with at least 1 contig that aligned to the NT database to run the consensus genome pipeline.";
    } else if (!coverageVizEnabled) {
      return "Consensus genome pipeline only available when coverage visualization is available.";
    }
  };

  // Render the hover action according to metadata.
  const renderHoverAction = (hoverAction: {
    key: string;
    iconName: keyof IconNameToSizes;
    divider: boolean;
    enabled: boolean;
    handleClick: $TSFixMeFunction;
    params: object;
    count: $TSFixMeUnknown;
    options?: {
      text: string;
      value: string;
      disabled: boolean;
    }[];
    onChange: $TSFixMeFunction;
    message: string;
    disabledMessage: string;
  }) => {
    // Show a vertical divider
    if (hoverAction.divider) return <span className={cs.divider} />;

    const count = hoverAction.count ? (
      <span className={cs.countCircle}>{hoverAction.count}</span>
    ) : null;

    const onClickFunction = !hoverAction.handleClick
      ? null
      : () => hoverAction.handleClick(hoverAction.params || {});

    const buttonIconComponent = (
      <div className={cs.actionDot} role="none">
        <ButtonIcon
          sdsSize="small"
          sdsType="primary"
          sdsIcon={hoverAction.iconName}
          onClick={onClickFunction}
          disabled={!hoverAction.enabled}
        />
        {count}
      </div>
    );

    // If the hoverActions contains options, display these options in a dropdown menu.
    const trigger = hoverAction.options ? (
      <BareDropdown
        hideArrow
        onOpen={() => setShowHoverActions(true)}
        onClose={() => setShowHoverActions(false)}
        trigger={buttonIconComponent}
        options={hoverAction.options}
        onChange={hoverAction.onChange}
      />
    ) : (
      buttonIconComponent
    );

    const tooltipMessage = hoverAction.enabled
      ? hoverAction.message
      : hoverAction.disabledMessage;

    return (
      <BasicPopup
        className={cx(
          cs.hoverActionPopup,
          hoverAction.enabled ? cs.actionEnabled : cs.actionDisabled,
        )}
        basic={false}
        inverted={hoverAction.enabled}
        position="top center"
        key={hoverAction.key}
        trigger={React.cloneElement(trigger, {
          onMouseEnter: () => {
            const { enabled, key, params } = hoverAction;

            trackEvent(ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_HOVER_ACTION_HOVERED, {
              enabled,
              key,
              sampleId,
              ...(params
                ? pick(
                    ["taxId", "taxLevel", "taxName", "pipelineVersion"],
                    params,
                  )
                : {}),
            });
          },
        })}
        content={tooltipMessage}
      />
    );
  };

  // If the user clicks the download icon while hovering on a row, we want to
  // make sure the resulting dropdown is still visible even if the user has to
  // move away from the row in order to reach the dropdown--this happens when
  // opening a dropdown on the last row of a table.
  return (
    <span
      className={cx(
        cs.hoverActions,
        showHoverActions ? cs.hoverActionsDropdown : className,
      )}
    >
      {getHoverActions().map((hoverAction, key) => (
        <span key={key}>{renderHoverAction(hoverAction)}</span>
      ))}
    </span>
  );
};

export default HoverActions;
