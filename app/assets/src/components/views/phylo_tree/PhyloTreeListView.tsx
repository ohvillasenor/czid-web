import { ButtonIcon, Icon, Tooltip } from "@czi-sds/components";
import cx from "classnames";
import { find, isUndefined, set } from "lodash/fp";
import React from "react";
import {
  getPhyloTree,
  getPhyloTrees,
  retryPhyloTree,
  saveVisualization,
} from "~/api";
import {
  ANALYTICS_EVENT_NAMES,
  trackEvent,
  withAnalytics,
} from "~/api/analytics";
import { getPhyloTreeNg, rerunPhyloTreeNg } from "~/api/phylo_tree_ngs";
import BasicPopup from "~/components/BasicPopup";
import DetailsSidebar from "~/components/common/DetailsSidebar";
import { UserContext } from "~/components/common/UserContext";
import NarrowContainer from "~/components/layout/NarrowContainer";
import PrimaryButton from "~/components/ui/controls/buttons/PrimaryButton";
import ExternalLink from "~/components/ui/controls/ExternalLink";
import {
  PHYLO_TREE_LIST_VIEW_HELP_SIDEBAR,
  PHYLO_TREE_LIST_VIEW_MATRIX_HELP_SIDEBAR,
  showAppcue,
} from "~/components/utils/appcues";
import {
  MAIL_TO_HELP_LINK,
  PHYLO_TREE_LINK,
} from "~/components/utils/documentationLinks";
import { SampleMessage } from "~/components/views/components/SampleMessage";
import csSampleMessage from "~/components/views/components/SampleMessage/sample_message.scss";
import PairwiseDistanceMatrixErrorModal from "~/components/views/phylo_tree/PairwiseDistanceMatrixErrorModal";
import {
  copyShortUrlToClipboard,
  getURLParamString,
  parseUrlParams,
} from "~/helpers/url";
import { HelpButton, SaveButton, ShareButton } from "~ui/controls/buttons";
import Link from "~ui/controls/Link";
import { IconAlert, IconLoading } from "~ui/icons";
import Notification from "~ui/notifications/Notification";
import Divider from "../../layout/Divider";
import ViewHeader from "../../layout/ViewHeader/ViewHeader";
import cs from "./phylo_tree_list_view.scss";
import PhyloTreeDownloadButton from "./PhyloTreeDownloadButton";
import PhyloTreeVis from "./PhyloTreeVis";

// Old PhyloTree statuses:
const STATUS_INITIALIZED = 0;
const STATUS_READY = 1;
const STATUS_FAILED = 2;
const STATUS_IN_PROGRESS = 3;

// PhyloTreeNg statuses:
const NG_STATUS_CREATED = "CREATED";
const NG_STATUS_FAILED = "FAILED";
const NG_STATUS_RUNNING = "RUNNING";
const NG_STATUS_SUCCEEDED = "SUCCEEDED";

interface PhyloTreeListViewProps {
  phyloTrees?: $TSFixMeUnknown[];
  selectedPhyloTreeNgId?: number;
}

interface PhyloTreeListViewState {
  adminToolsOpen: boolean;
  currentTree: {
    taxid: $TSFixMeUnknown;
    name: string;
    id: $TSFixMeUnknown;
    parent_taxid: $TSFixMeUnknown;
    tax_id: $TSFixMeUnknown;
    tax_name: $TSFixMeUnknown;
    sampleDetailsByNodeName: object;
    nextGeneration: $TSFixMeUnknown;
    log_url: string;
    status: string | number;
    clustermap_svg_url: string;
    newick: string;
  };
  matrixErrorModalOpen: boolean;
  phyloTrees: $TSFixMeUnknown[];
  selectedPipelineRunId: $TSFixMeUnknown;
  selectedSampleId: $TSFixMeUnknown;
  selectedPhyloTreeId: $TSFixMeUnknown;
  showLowCoverageWarning: boolean;
  showOldTreeWarning: boolean;
  selectedPhyloTreeNgId: number;
  sidebarConfig: $TSFixMe;
  sidebarMode?: "taxonDetails" | "sampleDetails";
  sidebarVisible: boolean;
  treeContainer: $TSFixMeUnknown;
}

class PhyloTreeListView extends React.Component<
  PhyloTreeListViewProps,
  PhyloTreeListViewState
> {
  selectedMetadata: $TSFixMe;
  constructor(props: PhyloTreeListViewProps) {
    super(props);

    const urlParams = parseUrlParams();

    this.state = {
      adminToolsOpen: false,
      currentTree: null,
      matrixErrorModalOpen: false,
      phyloTrees: props.phyloTrees || [],
      selectedPipelineRunId: null,
      selectedSampleId: null,
      selectedPhyloTreeId: this.getDefaultSelectedTreeId(
        urlParams,
        props.phyloTrees,
      ),
      showLowCoverageWarning: false,
      showOldTreeWarning: true,
      selectedPhyloTreeNgId: props.selectedPhyloTreeNgId,
      sidebarConfig: null,
      sidebarMode: null,
      sidebarVisible: false,
      treeContainer: null,
    };
    this.selectedMetadata = urlParams.selectedMetadata;
  }

  getDefaultSelectedTreeId(urlParams: $TSFixMe, phyloTrees = []) {
    const selectedId =
      urlParams.treeId || parseInt(window.sessionStorage.getItem("treeId"));

    // If the selected tree doesn't exist, default to the first one.
    if (!selectedId || !find({ id: selectedId }, phyloTrees)) {
      return (phyloTrees[0] || {}).id;
    }

    return selectedId;
  }

  async componentDidMount() {
    const { phyloTrees } = this.props;
    const { selectedPhyloTreeId, selectedPhyloTreeNgId } = this.state;

    if (selectedPhyloTreeNgId) {
      const currentTree = await getPhyloTreeNg(selectedPhyloTreeNgId);

      // Add a parameter to the URL to indicate whether or not a matrix is being displayed
      // for Appcue survey purposes.
      const matrixURLParam = getURLParamString({
        matrix: !isUndefined(currentTree.clustermap_svg_url),
      });
      window.history.replaceState(
        window.history.state,
        document.title,
        `/phylo_tree_ngs/${selectedPhyloTreeNgId}?${matrixURLParam}`,
      );

      this.setState({
        currentTree,
        showOldTreeWarning: false,
        matrixErrorModalOpen: currentTree.clustermap_svg_url,
        showLowCoverageWarning: currentTree.has_low_coverage,
      });
    } else if (selectedPhyloTreeId) {
      this.setState({ currentTree: await getPhyloTree(selectedPhyloTreeId) });
    }

    // Populating the dropdown list of trees: First make sure the list of old
    // trees is there. Then add NG trees:
    let allPhyloTrees = phyloTrees || [];
    if (!phyloTrees) {
      const { phyloTrees } = await getPhyloTrees();
      allPhyloTrees = phyloTrees;
    }
    const { phyloTrees: phyloTreeNgs } = await getPhyloTrees({
      nextGeneration: true,
    });
    allPhyloTrees = [...phyloTreeNgs, ...allPhyloTrees];
    this.setState({ phyloTrees: allPhyloTrees });
  }

  handleTreeChange = async (
    newPhyloTreeId: $TSFixMe,
    nextGeneration = false,
  ) => {
    if (nextGeneration) {
      const currentTree = await getPhyloTreeNg(newPhyloTreeId);

      this.setState({
        currentTree,
        selectedPhyloTreeId: null,
        selectedPhyloTreeNgId: newPhyloTreeId,
        showOldTreeWarning: false,
        sidebarVisible: false,
      });

      // Add a parameter to the URL to indicate whether or not a matrix is being displayed
      // for Appcue survey purposes.
      const matrixURLParam = getURLParamString({
        matrix: !isUndefined(currentTree.clustermap_svg_url),
      });

      window.history.replaceState(
        window.history.state,
        document.title,
        `/phylo_tree_ngs/${newPhyloTreeId}?${matrixURLParam}`,
      );
      // NG isn't using the sessionStorage 'default tree' functionality

      trackEvent("PhyloTreeListView_phylo-tree_changed", {
        selectedPhyloTreeNgId: newPhyloTreeId,
      });
    } else {
      // OLD TREE SELECTED
      const currentTree = await getPhyloTree(newPhyloTreeId);
      this.setState({
        currentTree,
        selectedPhyloTreeId: newPhyloTreeId,
        selectedPhyloTreeNgId: null,
        showOldTreeWarning: true,
        sidebarVisible: false,
      });

      window.history.replaceState(
        window.history.state,
        document.title,
        `/phylo_trees/index?treeId=${newPhyloTreeId}`,
      );
      // TODO (gdingle): do we want to keep using sessionStorage and cookies and urlparams and db saving?!
      window.sessionStorage.setItem("treeId", newPhyloTreeId);

      trackEvent("PhyloTreeListView_phylo-tree_changed", {
        selectedPhyloTreeId: newPhyloTreeId,
      });
    }
  };

  afterSelectedMetadataChange = (selectedMetadata: $TSFixMe) => {
    this.persistInUrl("selectedMetadata", selectedMetadata);
  };

  persistInUrl = (param: $TSFixMe, value: $TSFixMe) => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set(param, value);
      // TODO (gdingle): make back button load previous vis state
      history.replaceState(window.history.state, document.title, url);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  handleMetadataUpdate = (key: $TSFixMe, newValue: $TSFixMe) => {
    // Update the metadata stored locally.
    this.setState({
      // @ts-expect-error Type 'LodashSet1x5 is not compatiple
      currentTree: set(
        [
          "sampleDetailsByNodeName",
          this.state.selectedPipelineRunId,
          "metadata",
          key,
        ],
        newValue,
        this.state.currentTree,
      ),
    });
  };

  handleShareClick = async () => {
    await copyShortUrlToClipboard();
  };

  handleSaveClick = async () => {
    // TODO (gdingle): add analytics tracking?
    const params = parseUrlParams();
    const sampleIds = Object.values(
      this.state.currentTree.sampleDetailsByNodeName,
    )
      .map((details: $TSFixMe) => details.sample_id)
      .filter((s: $TSFixMe) => !!s);
    // @ts-expect-error Type 'Set<any>' is not assignable to type 'string | number | boolean | (string | number | boolean)[]'.
    params.sampleIds = new Set(sampleIds);
    await saveVisualization("phylo_tree", params);
  };

  getTreeStatus(tree: $TSFixMe) {
    let statusMessage = "";
    switch (tree) {
      case NG_STATUS_CREATED:
      case NG_STATUS_RUNNING:
      case STATUS_IN_PROGRESS:
      case STATUS_INITIALIZED:
        statusMessage = "Computation in progress. Please check back later!";
        break;
      default:
        // TODO: process error
        statusMessage = "Tree unavailable!";
        break;
    }
    return statusMessage;
  }

  handleTaxonModeOpen = () => {
    const currentTree = this.state.currentTree;
    if (
      this.state.sidebarMode === "taxonDetails" &&
      this.state.sidebarVisible &&
      (currentTree.taxid === this.state.sidebarConfig.taxonId ||
        currentTree.tax_id === this.state.sidebarConfig.taxonId)
    ) {
      this.setState({
        sidebarVisible: false,
      });
      trackEvent("PhyloTreeListView_taxon-details-sidebar_closed", {
        sidebarMode: "taxonDetails",
        treeName: currentTree.name,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
        treeId: currentTree.id,
      });
    } else {
      this.setState({
        sidebarVisible: true,
        sidebarConfig: {
          parentTaxonId: currentTree.parent_taxid,
          taxonId: currentTree.taxid || currentTree.tax_id,
          taxonName: currentTree.tax_name,
        },
        sidebarMode: "taxonDetails",
      });
      trackEvent("PhyloTreeListView_taxon-details-sidebar_opened", {
        sidebarMode: "taxonDetails",
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
        treeName: currentTree.name,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
        treeId: currentTree.id,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
        parentTaxonId: currentTree.parent_taxid,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
        taxonId: currentTree.taxid || currentTree.tax_id,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
        taxonName: currentTree.tax_name,
      });
    }
  };

  handleSampleNodeClick = (sampleId: $TSFixMe, pipelineRunId: $TSFixMe) => {
    if (!sampleId) {
      this.setState({
        sidebarVisible: false,
      });
      return;
    }

    if (
      this.state.sidebarVisible &&
      this.state.sidebarMode === "sampleDetails" &&
      this.state.selectedSampleId === sampleId
    ) {
      this.setState({
        sidebarVisible: false,
      });
      trackEvent("PhyloTreeListView_sample-details-sidebar_closed", {
        sidebarMode: "sampleDetails",
        selectedSampleId: sampleId,
      });
    } else {
      this.setState({
        selectedSampleId: sampleId,
        selectedPipelineRunId: pipelineRunId,
        sidebarConfig: {
          sampleId,
          onMetadataUpdate: this.handleMetadataUpdate,
          showReportLink: true,
        },
        sidebarMode: "sampleDetails",
        sidebarVisible: true,
      });
      trackEvent("PhyloTreeListView_sample-details-sidebar_opened", {
        sidebarMode: "sampleDetails",
        selectedSampleId: sampleId,
      });
    }
  };

  closeSidebar = () => {
    this.setState({
      sidebarVisible: false,
    });
  };

  handleRerunClick = async () => {
    const { currentTree } = this.state;
    if (currentTree.nextGeneration) {
      const { id } = await rerunPhyloTreeNg(currentTree.id);
      this.handleTreeChange(id, true);
    } else {
      retryPhyloTree(currentTree.id);
      location.reload();
    }
  };

  renderAdminPanel = () => {
    const { currentTree } = this.state;
    return (
      <div className={cs.adminPanel}>
        <div className={cs.header}>Admin Tools</div>
        <PrimaryButton text="Rerun Tree" onClick={this.handleRerunClick} />
        <div>
          <Link href={currentTree.log_url}>Link to Pipeline</Link>
        </div>
        <div>
          <pre>{JSON.stringify(currentTree, null, 2)}</pre>
        </div>
      </div>
    );
  };

  hideOldTreeWarning = () => {
    this.setState({ showOldTreeWarning: false });
  };

  handleCloseMatrixErrorModal = () => {
    this.setState({ matrixErrorModalOpen: false });
  };

  renderVisualization = () => {
    const { currentTree } = this.state;
    const clustermapSvgUrl = currentTree
      ? currentTree.clustermap_svg_url
      : false;

    if (currentTree.newick) {
      return (
        <PhyloTreeVis
          afterSelectedMetadataChange={this.afterSelectedMetadataChange}
          defaultMetadata={this.selectedMetadata}
          newick={currentTree.newick}
          nodeData={currentTree.sampleDetailsByNodeName}
          onMetadataUpdate={this.handleMetadataUpdate}
          onNewTreeContainer={t => this.setState({ treeContainer: t })}
          onSampleNodeClick={this.handleSampleNodeClick}
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedPhyloTreeId' does not exist on t... Remove this comment to see the full error message
          phyloTreeId={this.state.selectedPhyloTreeId}
        />
      );
    } else if (clustermapSvgUrl) {
      return (
        <img
          alt="Pairwise distance matrix"
          className={cs.matrix}
          src={clustermapSvgUrl}
        />
      );
    } else if ([STATUS_FAILED, NG_STATUS_FAILED].includes(currentTree.status)) {
      return (
        <SampleMessage
          icon={<IconAlert className={cs.iconAlert} type={"error"} />}
          link={MAIL_TO_HELP_LINK}
          linkText="Contact us for help."
          message="Sorry, we were unable to compute a phylogenetic tree."
          status="Tree Failed"
          type="error"
          analyticsEventName={
            ANALYTICS_EVENT_NAMES.PHYLO_TREE_LIST_VIEW_PIPELINE_ERROR_HELP_CLICKED
          }
        />
      );
    } else if (
      [
        NG_STATUS_CREATED,
        NG_STATUS_RUNNING,
        STATUS_INITIALIZED,
        STATUS_IN_PROGRESS,
      ].includes(currentTree.status)
    ) {
      return (
        <SampleMessage
          icon={<IconLoading className={csSampleMessage.icon} />}
          link={PHYLO_TREE_LINK}
          linkText="Learn about Phylogenetic Analysis"
          message="Your tree is being created."
          status="Generating Tree"
          subtitle="Hang tight and grab a cup of coffee while we generate your tree!"
          type="inProgress"
          analyticsEventName={
            ANALYTICS_EVENT_NAMES.PHYLO_TREE_LIST_VIEW_IN_PROGRESS_LINK_CLICKED
          }
        />
      );
    } else {
      return (
        <div className={cs.noTreeBanner}>
          {this.getTreeStatus(currentTree.status)}
        </div>
      );
    }
  };

  renderHeader = () => {
    const { currentTree, phyloTrees, selectedPhyloTreeNgId, treeContainer } =
      this.state;
    const clustermapSvgUrl = currentTree
      ? currentTree.clustermap_svg_url
      : false;

    return (
      <NarrowContainer>
        <ViewHeader title="Phylogenetic Trees" className={cs.viewHeader}>
          <ViewHeader.Content>
            <ViewHeader.Pretitle>
              Phylogenetic Tree{" "}
              {currentTree.tax_name && (
                <span>
                  &nbsp;-&nbsp;
                  <button
                    className={cx("noStyle", cs.taxonName)}
                    onClick={this.handleTaxonModeOpen}
                  >
                    {currentTree.tax_name}
                  </button>
                </span>
              )}
            </ViewHeader.Pretitle>
            <ViewHeader.Title
              label={currentTree.name}
              // @ts-expect-error ts-migrate(2339) FIXME: Property 'selectedPhyloTreeId' does not exist on t... Remove this comment to see the full error message
              id={this.state.selectedPhyloTreeId}
              options={phyloTrees.map((tree: $TSFixMe) => ({
                label: tree.name,
                id: `${tree.id}-${tree.nextGeneration}`,

                onClick: () =>
                  this.handleTreeChange(tree.id, tree.nextGeneration),
              }))}
            />
          </ViewHeader.Content>
          <ViewHeader.Controls className={cs.controls}>
            <BasicPopup
              trigger={
                <ShareButton
                  onClick={withAnalytics(
                    this.handleShareClick,
                    ANALYTICS_EVENT_NAMES.PHYLO_TREE_LIST_VIEW_SHARE_BUTTON_CLICKED,
                    {
                      treeName: currentTree.name,
                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
                      treeId: currentTree.id,
                    },
                  )}
                  className={cs.controlElement}
                />
              }
              content="A shareable URL was copied to your clipboard!"
              on="click"
              hideOnScroll
            />
            <SaveButton
              onClick={withAnalytics(
                this.handleSaveClick,
                ANALYTICS_EVENT_NAMES.PHYLO_TREE_LIST_VIEW_SAVE_BUTTON_CLICKED,
                {
                  treeName: currentTree.name,
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
                  treeId: currentTree.id,
                },
              )}
              className={cs.controlElement}
            />
            {[STATUS_READY, NG_STATUS_SUCCEEDED].includes(
              currentTree.status,
            ) && (
              <PhyloTreeDownloadButton
                className={cs.controlElement}
                showPhyloTreeNgOptions={!!selectedPhyloTreeNgId}
                tree={currentTree}
                // @ts-expect-error Type '{}' is missing the following properties from type 'Element'
                treeContainer={treeContainer}
              />
            )}
            <HelpButton
              className={cs.controlElement}
              onClick={showAppcue({
                flowId: clustermapSvgUrl
                  ? PHYLO_TREE_LIST_VIEW_MATRIX_HELP_SIDEBAR
                  : PHYLO_TREE_LIST_VIEW_HELP_SIDEBAR,
                analyticEventName: clustermapSvgUrl
                  ? ANALYTICS_EVENT_NAMES.PHYLO_TREE_LIST_VIEW_MATRIX_HELP_BUTTON_CLICKED
                  : ANALYTICS_EVENT_NAMES.PHYLO_TREE_LIST_VIEW_HELP_BUTTON_CLICKED,
              })}
            />
          </ViewHeader.Controls>
        </ViewHeader>
      </NarrowContainer>
    );
  };

  renderOldTreeWarning = () => {
    const { showOldTreeWarning } = this.state;
    return (
      <Notification
        className={cx(cs.notification, showOldTreeWarning ? cs.show : cs.hide)}
        type="info"
        displayStyle="flat"
        onClose={this.hideOldTreeWarning}
        closeWithDismiss={false}
        closeWithIcon={true}
      >
        <div className={cs.notificationContent}>
          <span className={cs.warning}>
            This tree was created with a previous version of our phylogenetic
            tree module that used kSNP3.
          </span>{" "}
          Please create a new tree from these samples to use our new module,
          which uses SKA, for continued analysis.{" "}
          <ExternalLink
            coloredBackground={true}
            href={PHYLO_TREE_LINK}
            analyticsEventName={
              ANALYTICS_EVENT_NAMES.OLD_PHYLO_TREE_WARNING_BANNER_HELP_LINK_CLICKED
            }
          >
            Learn more
          </ExternalLink>
          .
        </div>
      </Notification>
    );
  };

  renderToolsAttributionBanner = () => {
    const { currentTree } = this.state;
    const onlyMatrixAvailable = currentTree && currentTree.clustermap_svg_url;
    return (
      <div className={cs.attributionsBanner}>
        <Icon
          sdsIcon="infoCircle"
          sdsSize="s"
          sdsType="static"
          className={cs.infoIcon}
        />
        <ExternalLink
          href={"https://github.com/simonrharris/SKA"}
          analyticsEventName={
            ANALYTICS_EVENT_NAMES.PHYLO_TREE_LIST_VIEW_SKA_LINK_CLICKED
          }
        >
          SKA v1.0
        </ExternalLink>
        {!onlyMatrixAvailable && (
          <span>
            {" "}
            and{" "}
            <ExternalLink
              href={"https://github.com/Cibiv/IQ-TREE"}
              analyticsEventName={
                ANALYTICS_EVENT_NAMES.PHYLO_TREE_LIST_VIEW_IQTREE_LINK_CLICKED
              }
            >
              IQTree v1.6.1
            </ExternalLink>
          </span>
        )}
      </div>
    );
  };

  render() {
    const {
      adminToolsOpen,
      currentTree,
      matrixErrorModalOpen,
      selectedPhyloTreeId,
      selectedPhyloTreeNgId,
      showLowCoverageWarning,
      showOldTreeWarning,
    } = this.state;

    const { admin } = this.context || {};

    if (!selectedPhyloTreeId && !selectedPhyloTreeNgId) {
      return (
        <div className={cs.noTreeBanner}>
          No phylogenetic trees were found. You can create trees from the report
          page.
        </div>
      );
    }

    if (!currentTree) return null;
    return (
      <div className={cs.phyloTreeListView}>
        {this.renderHeader()}
        <Divider />
        <DetailsSidebar
          visible={this.state.sidebarVisible}
          mode={this.state.sidebarMode}
          onClose={withAnalytics(
            this.closeSidebar,
            ANALYTICS_EVENT_NAMES.PHYLO_TREE_LIST_VIEW_DETAILS_SIDEBAR_CLOSED,
            {
              treeName: currentTree.name,
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
              treeId: currentTree.id,
            },
          )}
          params={this.state.sidebarConfig}
        />
        <NarrowContainer>
          {showOldTreeWarning && this.renderOldTreeWarning()}
          {this.renderVisualization()}
          {selectedPhyloTreeNgId && this.renderToolsAttributionBanner()}
          {admin && (
            <Tooltip arrow sdsStyle="dark" placement="top" title="Admin Tools">
              <ButtonIcon
                sdsSize="large"
                sdsType="primary"
                sdsIcon="bacteria"
                onClick={() => {
                  this.setState({ adminToolsOpen: !adminToolsOpen });
                }}
              />
            </Tooltip>
          )}
          {adminToolsOpen && this.renderAdminPanel()}
        </NarrowContainer>
        {matrixErrorModalOpen && (
          <PairwiseDistanceMatrixErrorModal
            open
            onContinue={withAnalytics(
              this.handleCloseMatrixErrorModal,
              ANALYTICS_EVENT_NAMES.PAIRWISE_DISTANCE_MATRIX_ERROR_MODAL_CONTINUE_BUTTON_CLICKED,
            )}
            showLowCoverageWarning={showLowCoverageWarning}
          />
        )}
      </div>
    );
  }
}

PhyloTreeListView.contextType = UserContext;

export default PhyloTreeListView;
