import { isEmpty, forEach } from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import Moment from "react-moment";
import {
  createPhyloTree,
  getNewPhyloTree,
  getPhyloTrees,
  getProjectsToChooseFrom,
  validatePhyloTreeName,
} from "~/api";
import { UserContext } from "~/components/common/UserContext";
import { PHYLO_TREE_NG_FEATURE } from "~/components/utils/features";
import { IconLoading } from "~ui/icons";
import Notification from "~ui/notifications/Notification";
import Modal from "../../ui/containers/Modal";
import Wizard from "../../ui/containers/Wizard";
import Input from "../../ui/controls/Input";
import SearchBox from "../../ui/controls/SearchBox";
import DataTable from "../../visualizations/table/DataTable";
import PhyloTreeChecks from "./PhyloTreeChecks";

class PhyloTreeCreationModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      defaultPage: 0,
      skipListTrees: false,
      phyloTreesLoaded: false,
      phyloTrees: [],

      samplesLoaded: false,
      projectSamples: [],
      selectedProjectSamples: new Set(),

      otherSamples: [],
      selectedOtherSamples: new Set(),
      otherSamplesFilter: "",

      taxonList: [],

      projectsLoaded: false,
      projectList: [],

      taxonId: this.props.taxonId,
      taxonName: this.props.taxonName,
      projectId: this.props.projectId,
      projectName: this.props.projectName,
      showErrorTaxonAndProject: false,
      showErrorName: false,
      showErrorSamples: false,
      treeName: "",
    };

    this.phyloTreeHeaders = {
      name: "Phylogenetic Tree",
      user: "Creator",
      last_update: "Last Updated",
      view: "View",
    };

    this.projectSamplesHeaders = {
      name: "Name",
      host: "Host",
      tissue: "Sample Type",
      location: "Location",
      date: "Date",
      numContigs: "Contigs",
    };

    this.otherSamplesHeaders = {
      project: "Project",
      ...this.projectSamplesHeaders,
    };

    this.skipSelectProjectAndTaxon = this.props.projectId && this.props.taxonId;

    this.dagBranch = "";
    this.dagVars = "{}";

    this.inputTimeout = null;
    this.inputDelay = 500;
  }

  componentDidMount() {
    this.loadPhylotrees();
  }

  loadPhylotrees = () => {
    const { taxonId, projectId } = this.state;
    const { allowedFeatures = [] } = this.context || {};

    getPhyloTrees({
      taxId: taxonId,
      projectId,
      nextGeneration: allowedFeatures.includes(PHYLO_TREE_NG_FEATURE),
    }).then(({ phyloTrees, taxonName }) => {
      if (isEmpty(phyloTrees)) {
        this.setState({
          skipListTrees: true,
          phyloTreesLoaded: true,
        });
      } else {
        this.setState({
          phyloTrees: this.parsePhyloTreeData(phyloTrees),
          phyloTreesLoaded: true,
          taxonName,
        });
      }
    });
  };

  parsePhyloTreeData = phyloTreeData => {
    return phyloTreeData.map(row => ({
      name: row.name,
      user: (row.user || {}).name,
      last_update: <Moment fromNow date={row.updated_at} />,
      view: <a href={`/phylo_trees/index?treeId=${row.id}`}>View</a>,
    }));
  };

  loadNewTreeContext = () => {
    const { taxonId, projectId } = this.state;
    const { allowedFeatures = [] } = this.context || {};

    getNewPhyloTree({
      taxId: taxonId,
      projectId,
      nextGeneration: allowedFeatures.includes(PHYLO_TREE_NG_FEATURE),
    }).then(({ samples }) => this.handleNewTreeContextResponse(samples));
  };

  handleNewTreeContextResponse = samples => {
    if (!samples || !Array.isArray(samples)) {
      // TODO: properly handle error
      // eslint-disable-next-line no-console
      console.error("Error loading samples data");
    } else if (isEmpty(samples)) {
      this.setState({
        samplesLoaded: true,
      });
    } else {
      const { projectSamples, otherSamples } = this.parseProjectSamplesData(
        samples
      );

      this.setState({
        projectSamples,
        otherSamples,
        samplesLoaded: true,
      });
    }
  };

  parseProjectSamplesData = samples => {
    const projectSamples = [];
    const otherSamples = [];

    forEach(sample => {
      const numContigs = sample.num_contigs;
      let formattedSample = {
        name: sample.name,
        host: sample.host,
        tissue: sample.tissue,
        location: sample.location,
        date: <Moment fromNow date={sample.created_at} />,
        pipelineRunId: sample.pipeline_run_id,
        numContigs,
      };

      if (numContigs === 0) {
        formattedSample = {
          shouldDisable: true,
          tooltipInfo: {
            position: "right center",
            content:
              "There must be at least 1 contig in the sample for it to be included in the tree.",
          },
          ...formattedSample,
        };
      }

      if (sample.project_id === this.state.projectId) {
        projectSamples.push(formattedSample);
      } else {
        formattedSample.project = sample.project_name;
        otherSamples.push(formattedSample);
      }
    }, samples);

    return { projectSamples, otherSamples };
  };

  loadProjectSearchContext = () =>
    getProjectsToChooseFrom().then(projectList =>
      this.handleProjectSearchContextResponse(projectList)
    );

  handleProjectSearchContextResponse = projectList =>
    this.setState({ projectList, projectsLoaded: true });

  handleSelectProject = (_, { result }) => {
    this.setState({
      projectId: result.project_id,
      projectName: result.title,
      // Reset sample lists (in case user went back and changed project selection after they had been loaded)
      samplesLoaded: false,
      projectSamples: [],
      selectedProjectSamples: new Set(),
      otherSamples: [],
      selectedOtherSamples: new Set(),
      otherSamplesFilter: "",
    });
  };

  handleSelectTaxon = (_, { result }) => {
    this.setState({
      taxonId: result.taxid,
      taxonName: result.title,
      // Reset sample lists (in case user went back and changed taxon selection after they had been loaded)
      samplesLoaded: false,
      projectSamples: [],
      selectedProjectSamples: new Set(),
      otherSamples: [],
      selectedOtherSamples: new Set(),
      otherSamplesFilter: "",
    });
  };

  setPage = defaultPage => this.setState({ defaultPage });

  handleChangedProjectSamples = selectedProjectSamples =>
    this.setState({ selectedProjectSamples });

  handleChangedOtherSamples = selectedOtherSamples =>
    this.setState({ selectedOtherSamples });

  handleFilterChange = newFilter => {
    clearTimeout(this.inputTimeout);
    this.inputTimeout = setTimeout(() => {
      this.setState({ otherSamplesFilter: newFilter });
    }, this.inputDelay);
  };

  handleNameChange = newName => {
    this.setState({ treeName: newName.trim() }, this.isTreeNameValid);
  };

  handleBranchChange = newBranch => {
    this.dagBranch = newBranch.trim();
  };

  handleDagVarsChange = newDagVars => {
    this.dagVars = newDagVars;
  };

  handleCreation = () => {
    const { treeName, projectId, taxonId, taxonName } = this.state;
    const { dagBranch, dagVars } = this;
    const { allowedFeatures = [] } = this.context || {};

    if (!this.isNumberOfSamplesValid()) {
      this.setState({
        showErrorSamples: true,
      });
      return false;
    }

    const pipelineRunIds = [];
    this.state.selectedProjectSamples.forEach(rowIndex => {
      pipelineRunIds.push(this.state.projectSamples[rowIndex].pipelineRunId);
    });
    this.state.selectedOtherSamples.forEach(rowIndex => {
      pipelineRunIds.push(this.state.otherSamples[rowIndex].pipelineRunId);
    });

    createPhyloTree({
      treeName,
      dagBranch,
      dagVars,
      projectId,
      taxId: taxonId,
      taxName: taxonName,
      pipelineRunIds,
      nextGeneration: allowedFeatures.includes(PHYLO_TREE_NG_FEATURE),
    }).then(({ phylo_tree_id: phyloTreeId }) => {
      if (phyloTreeId) {
        location.href = `/phylo_trees/index?treeId=${phyloTreeId}`;
      } else {
        // TODO: properly handle error
        // eslint-disable-next-line no-console
        console.error("Error creating tree");
      }
    });

    return true;
  };

  handleComplete = () => {
    const { onClose } = this.props;

    if (this.handleCreation() && onClose) {
      onClose();
    }
  };

  isTreeNameValid = async () => {
    const { allowedFeatures = [] } = this.context || {};
    const { treeName } = this.state;
    const { sanitizedName, valid } = await validatePhyloTreeName({
      treeName,
      nextGeneration: allowedFeatures.includes(PHYLO_TREE_NG_FEATURE),
    });

    this.setState({
      treeName: sanitizedName,
      treeNameValid: valid,
    });

    return valid;
  };

  isNumberOfSamplesValid() {
    let nSamples =
      this.state.selectedProjectSamples.size +
      this.state.selectedOtherSamples.size;
    return PhyloTreeChecks.isNumberOfSamplesValid(nSamples);
  }

  canContinueWithTaxonAndProject = () => {
    if (this.state.taxonId && this.state.projectId) {
      this.setState({ showErrorTaxonAndProject: false }); // remove any pre-existing error message
      return true;
    }
    this.setState({ showErrorTaxonAndProject: true });
    return false;
  };

  canContinueWithTreeName = () => {
    this.setState({ showErrorName: true });
    return this.isTreeNameValid();
  };

  getTotalPageRendering() {
    let totalSelectedSamples =
      this.state.selectedProjectSamples.size +
      this.state.selectedOtherSamples.size;
    return `${totalSelectedSamples} Total Samples`;
  }

  renderNotifications() {
    const { treeNameValid, showErrorSamples, showErrorName } = this.state;

    if (showErrorName && !treeNameValid) {
      return (
        <Notification type="error" displayStyle="flat">
          The current tree name is taken. Please choose a different name.
        </Notification>
      );
    } else if (showErrorSamples && !this.isNumberOfSamplesValid()) {
      return (
        <Notification type="error" displayStyle="flat">
          Phylogenetic Tree creation must have between{" "}
          {PhyloTreeChecks.MIN_SAMPLES} and {PhyloTreeChecks.MAX_SAMPLES}{" "}
          samples.
        </Notification>
      );
    }
    return null;
  }

  page = action => {
    const { allowedFeatures = [] } = this.context || {};
    const projectSamplesColumns = [
      "name",
      "host",
      "tissue",
      "location",
      "date",
      "numContigs",
    ];
    const otherSamplesColumns = ["project", ...projectSamplesColumns];

    let options = {
      listTrees: (
        <Wizard.Page
          key="page_1"
          className="wizard__page-1"
          skipDefaultButtons={true}
          title="Phylogenetic Trees"
          small
        >
          <div className="wizard__page-1__subtitle">{this.state.taxonName}</div>
          <div className="wizard__page-1__table">
            {this.state.phyloTreesLoaded && (
              <DataTable
                headers={this.phyloTreeHeaders}
                columns={["name", "user", "last_update", "view"]}
                data={this.state.phyloTrees}
              />
            )}
          </div>
          <div className="wizard__page-1__action">
            <Wizard.Action action="continue">+ Create new tree</Wizard.Action>
          </div>
        </Wizard.Page>
      ),
      selectTaxonAndProject: (
        <Wizard.Page
          key="wizard__page_2"
          title="Select organism and project"
          onLoad={this.loadProjectSearchContext}
          onContinue={this.canContinueWithTaxonAndProject}
        >
          <div className="wizard__page-2__subtitle" />
          <div className="wizard__page-2__searchbar">
            <div className="wizard__page-2__searchbar__container">Project</div>
            <div className="wizard__page-2__searchbar__container">
              {this.state.projectsLoaded ? (
                <SearchBox
                  clientSearchSource={this.state.projectList}
                  onResultSelect={this.handleSelectProject}
                  initialValue={this.state.projectName}
                  placeholder="Existing project name"
                />
              ) : (
                <IconLoading />
              )}
            </div>
          </div>
          <div className="wizard__page-2__searchbar">
            <div className="wizard__page-2__searchbar__container">Organism</div>
            <div className="wizard__page-2__searchbar__container">
              <SearchBox
                serverSearchAction={
                  allowedFeatures.includes(PHYLO_TREE_NG_FEATURE)
                    ? "choose_taxon_ng"
                    : "choose_taxon"
                }
                serverSearchActionArgs={{
                  args: "species,genus",
                  projectId: this.state.projectId,
                }}
                onResultSelect={this.handleSelectTaxon}
                initialValue={this.state.taxonName}
                placeholder="Taxon name"
              />
            </div>
          </div>
          <div>
            {this.state.showErrorTaxonAndProject
              ? "Please select a project and organism"
              : null}
          </div>
        </Wizard.Page>
      ),
      selectNameAndProjectSamples: (
        <Wizard.Page
          key="wizard__page_3"
          title={`Name phylogenetic tree and select samples from project '${this.state.projectName}'`}
          onLoad={this.loadNewTreeContext}
          onContinueAsync={this.canContinueWithTreeName}
        >
          <div className="wizard__page-3__subtitle">{this.state.taxonName}</div>
          <div className="wizard__page-3__form">
            <div>
              <div className="wizard__page-3__form__label-name">Name</div>
              <Input
                className={
                  this.state.showErrorName && !this.state.treeNameValid
                    ? "error"
                    : ""
                }
                placeholder="Tree Name"
                onChange={this.handleNameChange}
              />
            </div>
            {this.props.admin === 1 && (
              <div>
                <div className="wizard__page-3__form__label-branch">Branch</div>
                <Input
                  placeholder="master"
                  onChange={this.handleBranchChange}
                />
                <div className="wizard__page-3__form__label-branch">
                  DAG variables
                </div>
                <Input placeholder="{}" onChange={this.handleDagVarsChange} />
              </div>
            )}
          </div>
          <div className="wizard__page-3__table">
            {this.state.samplesLoaded &&
            this.state.projectSamples.length > 0 ? (
              <DataTable
                headers={this.projectSamplesHeaders}
                columns={projectSamplesColumns}
                data={this.state.projectSamples}
                selectedRows={this.state.selectedProjectSamples}
                onSelectedRowsChanged={this.handleChangedProjectSamples}
              />
            ) : this.state.samplesLoaded &&
              this.state.projectSamples.length === 0 ? (
              <div>No samples containing {this.state.taxonName} available</div>
            ) : (
              <IconLoading />
            )}
          </div>
          <div className="wizard__page-3__notifications">
            {this.renderNotifications()}
          </div>
        </Wizard.Page>
      ),
      addIdseqSamples: (
        <Wizard.Page
          key="wizard__page_4"
          title={`Add additional samples from IDseq that contain ${this.state.taxonName}?`}
        >
          <div className="wizard__page-4__subtitle" />
          <div className="wizard__page-4__searchbar">
            <div className="wizard__page-4__searchbar__container">
              <Input placeholder="Search" onChange={this.handleFilterChange} />
            </div>
            <div className="wizard__page-4__searchbar__container">
              {this.state.selectedProjectSamples.size} Project Samples
            </div>
            <div className="wizard__page-4__searchbar__container">
              {this.state.selectedOtherSamples.size} IDseq Samples
            </div>
            <div className="wizard__page-4__searchbar__container">
              {this.getTotalPageRendering()}
            </div>
          </div>
          <div className="wizard__page-4__table">
            {this.state.samplesLoaded && this.state.otherSamples.length > 0 ? (
              <DataTable
                headers={this.otherSamplesHeaders}
                columns={otherSamplesColumns}
                data={this.state.otherSamples}
                selectedRows={this.state.selectedOtherSamples}
                onSelectedRowsChanged={this.handleChangedOtherSamples}
                filter={this.state.otherSamplesFilter}
              />
            ) : this.state.samplesLoaded &&
              this.state.otherSamples.length === 0 ? (
              <div>No samples containing {this.state.taxonName} available</div>
            ) : (
              <IconLoading />
            )}
          </div>
          <div className="wizard__page-4__notifications">
            {this.renderNotifications()}
          </div>
        </Wizard.Page>
      ),
    };
    return options[action];
  };

  getPages = () => {
    let chosenPages = [];
    if (!this.state.skipListTrees) {
      chosenPages.push(this.page("listTrees"));
    }
    if (!this.skipSelectProjectAndTaxon) {
      chosenPages.push(this.page("selectTaxonAndProject"));
    }
    chosenPages.push(
      this.page("selectNameAndProjectSamples"),
      this.page("addIdseqSamples")
    );
    return chosenPages;
  };

  render() {
    const { onClose } = this.props;
    const { defaultPage, phyloTreesLoaded, skipListTrees } = this.state;

    if (phyloTreesLoaded) {
      return (
        <Modal open tall onClose={onClose}>
          <Wizard
            className="phylo-tree-creation-wizard"
            skipPageInfoNPages={skipListTrees ? 0 : 1}
            onComplete={this.handleComplete}
            defaultPage={defaultPage}
            labels={{
              finish: "Create Tree",
            }}
          >
            {this.getPages()}
          </Wizard>
        </Modal>
      );
    } else {
      return <IconLoading />;
    }
  }
}

PhyloTreeCreationModal.propTypes = {
  admin: PropTypes.number,
  csrf: PropTypes.string.isRequired,
  onClose: PropTypes.func,
  projectId: PropTypes.number,
  projectName: PropTypes.string,
  taxonId: PropTypes.number,
  taxonName: PropTypes.string,
};

PhyloTreeCreationModal.contextType = UserContext;

export default PhyloTreeCreationModal;
