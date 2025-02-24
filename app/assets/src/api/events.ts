/**
 * @module Events
 */

/**
 * @class A dictionary of all JavaScript user analytics events:<br>
 *
 * - We are consolidating all analytics event names here to prevent typos, facilitate code completion, and make a reference for product analysts.<br>
 * - Provide a plain-English description of what each event means.<br>
 * - Make sure the key matches its SQL-compatible converted form (e.g. NextcladeModal changes to NEXTCLADE_MODAL, dash changes to underscore).<br>
 * - If you migrate a legacy-style event name, please flag it in the analytics channel in case there are dashboards relying directly on the EVENTS.TRACKS.NAME field.<br>
 * - You MUST use the ** comment style if you want the comment to appear in JSDoc docs.<br>
 * - This is in a JS function mostly so that JSDoc can parse it.<br>
 */
function EventDictionary() {
  /** The user clicked "Learn more" in the BLAST Contigs Modal */
  this.BLAST_CONTIGS_MODAL_LEARN_MORE_CLICKED =
    "BLAST_CONTIGS_MODAL_LEARN_MORE_CLICKED";

  /** The user clicked "Continue" in the BLAST Contigs Modal */
  this.BLAST_CONTIGS_MODAL_CONTINUE_BUTTON_CLICKED =
    "BLAST_CONTIGS_MODAL_CONTINUE_BUTTON_CLICKED";

  /** The user clicked "Close" in the BLAST Contigs Modal */
  this.BLAST_CONTIGS_MODAL_CLOSE_BUTTON_CLICKED =
    "BLAST_CONTIGS_MODAL_CLOSE_BUTTON_CLICKED";

  /** The user clicked "Learn more" in the Blast Reads Modal */
  this.BLAST_READS_MODAL_LEARN_MORE_CLICKED =
    "BLAST_READS_MODAL_LEARN_MORE_CLICKED";

  /** The user clicked "Continue" in the Blast Reads Modal */
  this.BLAST_READS_MODAL_CONTINUE_BUTTON_CLICKED =
    "BLAST_READS_MODAL_CONTINUE_BUTTON_CLICKED";

  /** The user clicked the NCBI Support Center link in the Blast Notification */
  this.BLAST_NOTIFICATION_NCBI_SUPPORT_CENTER_LINK_CLICKED =
    "BLAST_NOTIFICATION_NCBI_SUPPORT_CENTER_LINK_CLICKED";

  /** The user clicked the "Conditions of Use" link in the BLAST redirection modal */
  this.BLAST_REDIRECTION_MODAL_CONDITIONS_OF_USE_LINK_CLICKED =
    "BLAST_REDIRECTION_MODAL_CONDITIONS_OF_USE_LINK_CLICKED";

  /** The user clicked the checkbox to automatically redirect them to NCBI in the future (for the current session)  */
  this.BLAST_REDIRECTION_MODAL_AUTO_REDIRECT_CHECKBOX_CHECKED =
    "BLAST_REDIRECTION_MODAL_AUTO_REDIRECT_CHECKBOX_CHECKED";

  /** The user clicked "Continue" in the BLAST Redirection Modal */
  this.BLAST_REDIRECTION_MODAL_CONTINUE_BUTTON_CLICKED =
    "BLAST_REDIRECTION_MODAL_CONTINUE_BUTTON_CLICKED";

  /** The user clicked "Cancel" in the BLAST Redirection Modal */
  this.BLAST_REDIRECTION_MODAL_CANCEL_BUTTON_CLICKED =
    "BLAST_REDIRECTION_MODAL_CANCEL_BUTTON_CLICKED";

  /** The user clicked the BLASTN button in the CoverageVizBottomSidebar. */
  this.COVERAGE_VIZ_BOTTOM_SIDEBAR_BLAST_BUTTON_CLICKED =
    "COVERAGE_VIZ_BLAST_BUTTON_CLICKED";

  /** The user clicked the "Download Contig FASTA" button in the CoverageVizBottomSidebar. */
  this.COVERAGE_VIZ_BOTTOM_SIDEBAR_DOWNLOAD_CONTIG_BUTTON_CLICKED =
    "COVERAGE_VIZ_BOTTOM_SIDEBAR_DOWNLOAD_CONTIG_BUTTON_CLICKED";

  this.HIT_GROUP_VIZ_CONTIG_DOWNLOAD_BUTTON_CLICKED =
    "HIT_GROUP_VIZ_CONTIG_DOWNLOAD_BUTTON_CLICKED";

  this.HIT_GROUP_VIZ_CONTIG_COPY_BUTTON_CLICKED =
    "HIT_GROUP_VIZ_CONTIG_COPY_BUTTON_CLICKED";

  /** The bulk download creation failed */
  this.BULK_DOWNLOAD_MODAL_BULK_DOWNLOAD_CREATION_FAILED =
    "BULK_DOWNLOAD_MODAL_BULK_DOWNLOAD_CREATION_FAILED";

  /** The bulk download creation was successful */
  this.BULK_DOWNLOAD_MODAL_BULK_DOWNLOAD_CREATION_SUCCESSFUL =
    "BULK_DOWNLOAD_MODAL_BULK_DOWNLOAD_CREATION_SUCCESSFUL";

  /** The user closed the confirmation modal before sending their samples to Nextclade. */
  this.NEXTCLADE_MODAL_CONFIRMATION_MODAL_CANCEL_BUTTON_CLICKED =
    "NEXTCLADE_MODAL_CONFIRMATION_MODAL_CANCEL_BUTTON_CLICKED";

  /** The user clicked Confirm on the confirmation modal to send their samples to Nextclade. */
  this.NEXTCLADE_MODAL_CONFIRMATION_MODAL_CONFIRM_BUTTON_CLICKED =
    "NEXTCLADE_MODAL_CONFIRMATION_MODAL_CONFIRM_BUTTON_CLICKED";

  /** The user clicked Retry after sending the samples to Nextclade failed. */
  this.NEXTCLADE_MODAL_CONFIRMATION_MODAL_RETRY_BUTTON_CLICKED =
    "NEXTCLADE_MODAL_CONFIRMATION_MODAL_RETRY_BUTTON_CLICKED";

  /** The operation to send samples to Nextclade failed. */
  this.NEXTCLADE_MODAL_UPLOAD_FAILED = "NEXTCLADE_MODAL_UPLOAD_FAILED";

  /** There was a failure upon retrying the operation to send samples to Nextclade. */
  this.NEXTCLADE_MODAL_RETRY_UPLOAD_FAILED =
    "NEXTCLADE_MODAL_RETRY_UPLOAD_FAILED";

  /** The user clicked the "contact us" link in the Nextclade error modal. */
  this.NEXTCLADE_MODAL_ERROR_MODAL_HELP_LINK_CLICKED =
    "NEXTCLADE_MODAL_ERROR_MODAL_HELP_LINK_CLICKED";

  /** The user entered a prohibited background model name and attempted to create the background model. */
  this.COLLECTION_MODAL_INVALID_BACKGROUND_MODEL_NAME_ENTERED =
    "COLLECTION_MODAL_INVALID_BACKGROUND_MODEL_NAME_ENTERED";

  /** The user changed their selected accession in the Consensus Genome Creation modal. */
  this.CONSENSUS_GENOME_CREATION_MODAL_SELECTED_ACCESSION_CHANGED =
    "CONSENSUS_GENOME_CREATION_MODAL_SELECTED_ACCESSION_CHANGED";

  this.ACCESSION_VIZ_MORE_READS_LINK_CLICKED =
    "ACCESSION_VIZ_MORE_READS_LINK_CLICKED";

  /** The user clicked Create Consensus Genome in the Consensus Genome Creation modal. */
  this.CONSENSUS_GENOME_CREATION_MODAL_CREATE_BUTTON_CLICKED =
    "CONSENSUS_GENOME_CREATION_MODAL_CREATE_BUTTON_CLICKED";

  /** The user closed the Consensus Genome Creation modal. */
  this.CONSENSUS_GENOME_CREATION_MODAL_CLOSED =
    "CONSENSUS_GENOME_CREATION_MODAL_CLOSED";

  /** The user clicked the Learn More link in the Consensus Genome Creation modal. */
  this.CONSENSUS_GENOME_CREATION_MODAL_HELP_LINK_CLICKED =
    "CONSENSUS_GENOME_CREATION_MODAL_HELP_LINK_CLICKED";

  /** The user clicked the hover action to create a Consensus Genome from the mngs report page taxon row. */
  this.REPORT_TABLE_CONSENSUS_GENOME_HOVER_ACTION_CLICKED =
    "REPORT_TABLE_CONSENSUS_GENOME_HOVER_ACTION_CLICKED";

  /** The user clicked a Consensus Genome technology in the Sample Upload Flow. */
  this.UPLOAD_SAMPLE_STEP_CONSENSUS_GENOME_TECHNOLOGY_CLICKED =
    "UPLOAD_SAMPLE_STEP_CONSENSUS_GENOME_TECHNOLOGY_CLICKED";

  /** The user clicked a mNGS technology in the Sample Upload Flow. */
  this.UPLOAD_SAMPLE_STEP_MNGS_TECHNOLOGY_CLICKED =
    "UPLOAD_SAMPLE_STEP_MNGS_TECHNOLOGY_CLICKED";

  /** The user clicked the "here" link under the Consensus Genome Illumina technology option in the Sample Upload Flow. */
  this.UPLOAD_SAMPLE_CG_ILLUMINA_PIPELINE_GITHUB_LINK_CLICKED =
    "UPLOAD_SAMPLE_CG_ILLUMINA_PIPELINE_GITHUB_LINK_CLICKED";

  /** The user clicked the "here" link under the Consensus Genome Nanopore technology option in the Sample Upload Flow. */
  this.UPLOAD_SAMPLE_STEP_CG_ARTIC_PIPELINE_LINK_CLICKED =
    "UPLOAD_SAMPLE_STEP_CG_ARTIC_PIPELINE_LINK_CLICKED";

  this.PIPELINE_STEP_DETAILS_MODE_RESOURCE_LINK_CLICKED =
    "PIPELINE_STEP_DETAILS_MODE_RESOURCE_LINK_CLICKED";

  this.PIPELINE_STEP_DETAILS_MODE_FILE_LINK_CLICKED =
    "PIPELINE_STEP_DETAILS_MODE_FILE_LINK_CLICKED";

  /** The user selected a medaka model for their Nanopore Conesnsus Genome sample(s) in the Sample Upload Flow. */
  this.UPLOAD_SAMPLE_STEP_CONSENSUS_GENOME_MEDAKA_MODEL_SELECTED =
    "UPLOAD_SAMPLE_STEP_CONSENSUS_GENOME_MEDAKA_MODEL_SELECTED";

  /** The user toggled the ClearLabs option for their Nanopore Conesnsus Genome sample(s) in the Sample Upload Flow. */
  this.UPLOAD_SAMPLE_STEP_CONSENSUS_GENOME_CLEAR_LABS_TOGGLED =
    "UPLOAD_SAMPLE_STEP_CONSENSUS_GENOME_CLEAR_LABS_TOGGLED";

  /** The user clicked the "here" link under the mNGS Illumina technology option. */
  this.UPLOAD_SAMPLE_STEP_MNGS_ILLUMINA_PIPELINE_LINK_CLICKED =
    "UPLOAD_SAMPLE_STEP_MNGS_ILLUMINA_PIPELINE_LINK_CLICKED";

  /** The user clicked the "here" link under the mNGS Nanopore technology option. */
  this.UPLOAD_SAMPLE_STEP_MNGS_NANOPORE_PIPELINE_LINK_CLICKED =
    "UPLOAD_SAMPLE_STEP_MNGS_NANOPORE_PIPELINE_LINK_CLICKED";

  /** The user clicked the "Edit Analysis Type" link during the Review Step in the Sample Upload Flow. */
  this.REVIEW_STEP_EDIT_ANALYSIS_TYPE_LINK_CLICKED =
    "REVIEW_STEP_EDIT_ANALYSIS_TYPE_LINK_CLICKED";

  /** The user closed the modal listing previously generated Consensus Genomes for the taxon. */
  this.CONSENSUS_GENOME_PREVIOUS_MODAL_CLOSED =
    "CONSENSUS_GENOME_PREVIOUS_MODAL_CLOSED";

  /** The user clicked the hover action to open up previous Consensus Genome runs from the mngs report page taxon row. */
  this.REPORT_TABLE_PREVIOUS_CONSENSUS_GENOME_HOVER_ACTION_CLICKED =
    "REPORT_TABLE_PREVIOUS_CONSENSUS_GENOME_HOVER_ACTION_CLICKED";

  /** The user clicked the "contact us" link in the Consensus Genome creation error modal. */
  this.CONSENSUS_GENOME_ERROR_MODAL_HELP_LINK_CLICKED =
    "CONSENSUS_GENOME_ERROR_MODAL_HELP_LINK_CLICKED";

  /** The operation to kickoff a Consensus Genome run from an mNGS report failed. */
  this.CONSENSUS_GENOME_CREATION_MODAL_KICKOFF_FAILED =
    "CONSENSUS_GENOME_CREATION_MODAL_KICKOFF_FAILED";

  /** The user clicked Retry after the Consensus Genome kickoff failed. */
  this.CONSENSUS_GENOME_ERROR_MODAL_RETRY_BUTTON_CLICKED =
    "CONSENSUS_GENOME_ERROR_MODAL_RETRY_BUTTON_CLICKED";

  /** There was a failure upon retrying the kickoff of a Consensus Genome run from an mNGS report. */
  this.CONSENSUS_GENOME_CREATION_MODAL_RETRY_KICKOFF_FAILED =
    "CONSENSUS_GENOME_CREATION_MODAL_RETRY_KICKOFF_FAILED";

  /* The user selected a Consensus Genome from the Consensus Genome Dropdown */
  this.CONSENSUS_GENOME_DROPDOWN_CONSENSUS_GENOME_SELECTED =
    "CONSENSUS_GENOME_DROPDOWN_CONSENSUS_GENOME_SELECTED";
  /** The user clicked on one of the previously-generated consensus genomes for this taxon. */
  this.CONSENSUS_GENOME_PREVIOUS_MODAL_ROW_CLICKED =
    "CONSENSUS_GENOME_PREVIOUS_MODAL_ROW_CLICKED";

  /** The user clicked the button to create another consensus genome for this taxon. */
  this.CONSENSUS_GENOME_PREVIOUS_MODAL_CREATE_NEW_CLICKED =
    "CONSENSUS_GENOME_PREVIOUS_MODAL_CREATE_NEW_CLICKED";

  /** The user clicked the help button in an Metagenomics report page.  */
  this.SAMPLE_VIEW_HEADER_MNGS_HELP_BUTTON_CLICKED =
    "SAMPLE_VIEW_HEADER_MNGS_HELP_BUTTON_CLICKED";

  /** The user selected a new background model in a Sample Report */
  this.SAMPLE_VIEW_BACKGROUND_MODEL_SELECTED =
    "SAMPLE_VIEW_BACKGROUND_MODEL_SELECTED";

  /** The user clicked the help button in the Consensus Genome report page. */
  this.SAMPLE_VIEW_HEADER_CONSENSUS_GENOME_HELP_BUTTON_CLICKED =
    "SAMPLE_VIEW_HEADER_CONSENSUS_GENOME_HELP_BUTTON_CLICKED";

  /** The user clicked the help button in the AMR report page. */
  this.SAMPLE_VIEW_HEADER_AMR_HELP_BUTTON_CLICKED =
    "SAMPLE_VIEW_HEADER_AMR_HELP_BUTTON_CLICKED";

  /** The user clicked the help button in a heatmap. */
  this.SAMPLES_HEATMAP_HEADER_HELP_BUTTON_CLICKED =
    "SAMPLES_HEATMAP_HEADER_HELP_BUTTON_CLICKED";

  /** The user clicked the New Presets button in a heatmap to open the Heatmap Creation Modal. */
  this.SAMPLES_HEATMAP_HEADER_NEW_PRESETS_BUTTON_CLICKED =
    "SAMPLES_HEATMAP_HEADER_NEW_PRESETS_BUTTON_CLICKED";

  this.HEADER_DROPDOWN_LOGOUT_OPTION_CLICKED =
    "HEADER_DROPDOWN_LOGOUT_OPTION_CLICKED";

  /** The user clicked the sortable column headers on the mngs report page. */
  this.REPORT_TABLE_COLUMN_SORT_ARROW_CLICKED =
    "REPORT_TABLE_COLUMN_SORT_ARROW_CLICKED";

  /** The user clicked on the status message in the middle of the report page (e.g. failed sample message or pipeline viz link or help link).
   * status: link category, e.g. "IN PROGRESS", "SAMPLE FAILED", etc.
   */
  this.SAMPLE_VIEW_SAMPLE_MESSAGE_LINK_CLICKED =
    "SAMPLE_VIEW_SAMPLE_MESSAGE_LINK_CLICKED";

  /** The user renamed a project from the project header. */
  this.PROJECT_HEADER_PROJECT_RENAMED = "PROJECT_HEADER_PROJECT_RENAMED";

  // /** The user renamed a heatmap from the heatmap header. */
  this.SAMPLES_HEATMAP_HEADER_NAME_RENAMED =
    "SAMPLES_HEATMAP_HEADER_NAME_RENAMED";

  /** The user clicked on the Learn More link in the project visibility tooltip. */
  this.PROJECT_VISIBILITY_HELP_LINK_CLICKED =
    "PROJECT_VISIBILITY_HELP_LINK_CLICKED";

  /** The user navigated to the samples heatmap view and backend heatmap data is fetched. */
  this.SAMPLES_HEATMAP_VIEW_HEATMAP_DATA_FETCHED =
    "SAMPLES_HEATMAP_VIEW_HEATMAP_DATA_FETCHED";

  /** The user ran into an error while loading heatmap data. */
  this.SAMPLES_HEATMAP_VIEW_LOADING_ERROR =
    "SAMPLES_HEATMAP_VIEW_LOADING_ERROR";

  /** The user clicked on the Learn More link in the error modal explaining why a matrix is shown when the samples are
   * too divergent to display a phylo tree.
   */
  this.PAIRWISE_DISTANCE_MATRIX_ERROR_MODAL_HELP_LINK_CLICKED =
    "PAIRWISE_DISTANCE_MATRIX_ERROR_MODAL_HELP_LINK_CLICKED";

  /** The user clicked on the Learn More link in the AccordionNotification of the error modal explaining why a matrix is
   * shown when the samples are too divergent to display a phylo tree.
   */
  this.PAIRWISE_DISTANCE_MATRIX_ERROR_MODAL_NOTIFICATION_HELP_LINK_CLICKED =
    "PAIRWISE_DISTANCE_MATRIX_ERROR_MODAL_NOTIFICATION_HELP_LINK_CLICKED";

  /** The user clicked on the Continue button to dismiss the error modal explaining why a matrix is shown when samples are
   * too divergent to display a phylo tree.
   */
  this.PAIRWISE_DISTANCE_MATRIX_ERROR_MODAL_CONTINUE_BUTTON_CLICKED =
    "PAIRWISE_DISTANCE_MATRIX_ERROR_MODAL_CONTINUE_BUTTON_CLICKED";

  /** The user clicked the Learn More link in the old Phylo Tree warning banner. */
  this.OLD_PHYLO_TREE_WARNING_BANNER_HELP_LINK_CLICKED =
    "OLD_PHYLO_TREE_WARNING_BANNER_HELP_LINK_CLICKED";

  /** The user had a failed phylo tree (either original or NG), and they clicked on the link on the report to get help with re-running the tree. */
  this.PHYLO_TREE_LIST_VIEW_PIPELINE_ERROR_HELP_CLICKED =
    "PHYLO_TREE_LIST_VIEW_PIPELINE_ERROR_HELP_CLICKED";

  /** The phylo tree is being generated and the user clicked on the link on the report to learn more about the creation process. */
  this.PHYLO_TREE_LIST_VIEW_IN_PROGRESS_LINK_CLICKED =
    "PHYLO_TREE_LIST_VIEW_IN_PROGRESS_LINK_CLICKED";

  /** The user clicked the help button on a phylo tree page. */
  this.PHYLO_TREE_LIST_VIEW_HELP_BUTTON_CLICKED =
    "PHYLO_TREE_LIST_VIEW_HELP_BUTTON_CLICKED";

  /** The user clicked the help button on a phylo tree page while the matrix was displayed. */
  this.PHYLO_TREE_LIST_VIEW_MATRIX_HELP_BUTTON_CLICKED =
    "PHYLO_TREE_LIST_VIEW_MATRIX_HELP_BUTTON_CLICKED";

  /** The user clicked the tools attribution link to view the SKA repo on a phylo tree page. */
  this.PHYLO_TREE_LIST_VIEW_SKA_LINK_CLICKED =
    "PHYLO_TREE_LIST_VIEW_SKA_LINK_CLICKED";

  /** The user clicked the tools attribution link to view the IQTree repo on a phylo tree page. */
  this.PHYLO_TREE_LIST_VIEW_IQTREE_LINK_CLICKED =
    "PHYLO_TREE_LIST_VIEW_IQTREE_LINK_CLICKED";

  /** The user hovered over a hoverAction in a mNGS sample report */
  this.SAMPLE_VIEW_HOVER_ACTION_HOVERED = "SAMPLE_VIEW_HOVER_ACTION_HOVERED";

  /** The user clicked the BackgroundModelFilter in the SampleView */
  this.SAMPLE_VIEW_BACKGROUND_MODEL_FILTER_CLICKED =
    "SAMPLE_VIEW_BACKGROUND_MODEL_FILTER_CLICKED";

  /** The user clicked the BackgroundModelFilter in the SamplesHeatmapControls */
  this.SAMPLES_HEATMAP_CONTROLS_BACKGROUND_MODEL_FILTER_CLICKED =
    "SAMPLES_HEATMAP_CONTROLS_BACKGROUND_MODEL_FILTER_CLICKED";

  /** The user clicked the "+ Create new tree" button from the phylo tree list view in the PhyloTreeCreationModal to begin the tree creation flow */
  this.PHYLO_TREE_CREATION_MODAL_CREATE_NEW_TREE_BUTTON_CLICKED =
    "PHYLO_TREE_CREATION_MODAL_CREATE_NEW_TREE_BUTTON_CLICKED";

  /** The user selected a project during step 1 of the PhyloTreeCreationModal process */
  this.PHYLO_TREE_CREATION_MODAL_PROJECT_SELECTED =
    "PHYLO_TREE_CREATION_MODAL_PROJECT_SELECTED";

  /** The user selected a taxon during step 1 of the PhyloTreeCreationModal process */
  this.PHYLO_TREE_CREATION_MODAL_TAXON_SELECTED =
    "PHYLO_TREE_CREATION_MODAL_TAXON_SELECTED";

  /** The user entered a name for their phylo tree during step 2 of the PhyloTreeCreationModal process */
  this.PHYLO_TREE_CREATION_MODAL_TREE_NAME_ENTERED =
    "PHYLO_TREE_CREATION_MODAL_TREE_NAME_ENTERED";

  /** The user changed their selection of samples within the table containing samples from their project that contain the specified taxonName during step 2 of the PhyloTreeCreationModal process */
  this.PHYLO_TREE_CREATION_MODAL_PROJECT_SAMPLES_CHANGED =
    "PHYLO_TREE_CREATION_MODAL_PROJECT_SAMPLES_CHANGED";

  /** The user changed their selection of samples within the table containing all IDseq samples the specified taxonName during step 3 of the PhyloTreeCreationModal process */
  this.PHYLO_TREE_CREATION_MODAL_OTHER_SAMPLES_CHANGED =
    "PHYLO_TREE_CREATION_MODAL_OTHER_SAMPLES_CHANGED";

  /** The user searched for a sample during step 3 of the PhyloTreeCreationModal process */
  this.PHYLO_TREE_CREATION_MODAL_SAMPLE_SEARCH_PERFORMED =
    "PHYLO_TREE_CREATION_MODAL_SAMPLE_SEARCH_PERFORMED";

  /** The user selected an invalid amount of samples to create a PhyloTree in the last step of the PhyloTreeCreationModal process */
  this.PHYLO_TREE_CREATION_MODAL_INVALID_AMOUNT_OF_SAMPLES_SELECTED_FOR_CREATION =
    "PHYLO_TREE_CREATION_MODAL_INVALID_AMOUNT_OF_SAMPLES_SELECTED_FOR_CREATION";

  /** The user clicked the "Create Tree" button on the last step of the PhyloTreeCreationModal process to actually kickoff the phylo tree pipeline */
  this.PHYLO_TREE_CREATION_MODAL_CREATE_TREE_BUTTON_CLICKED =
    "PHYLO_TREE_CREATION_MODAL_CREATE_TREE_BUTTON_CLICKED";

  /** The user successfully created a PhyloTree */
  this.PHYLO_TREE_CREATION_MODAL_CREATION_SUCCESSFUL =
    "PHYLO_TREE_CREATION_MODAL_CREATION_SUCCESSFUL";

  /** The user successfully created a PhyloTreeNg */
  this.PHYLO_TREE_CREATION_MODAL_NG_CREATION_SUCCESSFUL =
    "PHYLO_TREE_CREATION_MODAL_NG_CREATION_SUCCESSFUL";

  /** PhyloTree creation failed */
  this.PHYLO_TREE_CREATION_MODAL_CREATION_FAILED =
    "PHYLO_TREE_CREATION_MODAL_CREATION_FAILED";

  /** PhyloTreeNG creation failed */
  this.PHYLO_TREE_CREATION_MODAL_NG_CREATION_FAILED =
    "PHYLO_TREE_CREATION_MODAL_NG_CREATION_FAILED";

  /** The user clicked on an existing old phylo tree in the PhyloTreeCreationModal list */
  this.PHYLO_TREE_CREATION_MODAL_VIEW_PHYLO_TREE_LINK_CLICKED =
    "PHYLO_TREE_CREATION_MODAL_VIEW_PHYLO_TREE_LINK_CLICKED";

  /** The user clicked on an existing phylo tree NG in the PhyloTreeCreationModal list */
  this.PHYLO_TREE_CREATION_MODAL_VIEW_PHYLO_TREE_NG_LINK_CLICKED =
    "PHYLO_TREE_CREATION_MODAL_VIEW_PHYLO_TREE_NG_LINK_CLICKED";

  /** The user clicked the Learn More link in the low coverage warning banner in the PhyloTreeCreationModal sample selection process. */
  this.PHYLO_TREE_CREATION_MODAL_LOW_COVERAGE_WARNING_BANNER_HELP_LINK_CLICKED =
    "PHYLO_TREE_CREATION_MODAL_LOW_COVERAGE_WARNING_BANNER_HELP_LINK_CLICKED";

  /** The user clicked the View Visualizations link in the PhyloTreeNotification. */
  this.PHYLO_TREE_NOTIFICATION_VIEW_VISUALIZATIONS_LINK_CLICKED =
    "PHYLO_TREE_NOTIFICATION_VIEW_VISUALIZATIONS_LINK_CLICKED";

  /** The user advanced the onto the next page in the Wizard */
  this.WIZARD_PAGE_ADVANCED = "WIZARD_PAGE_ADVANCED";

  /** The user clicked the "Learn more" link under the Consensus Genome Intermediate Output Files bulk download option. */
  this.CG_INTERMEDIATE_OUTPUT_FILES_BULK_DOWNLOAD_HELP_LINK_CLICKED =
    "CG_INTERMEDIATE_OUTPUT_FILES_BULK_DOWNLOAD_HELP_LINK_CLICKED";

  /** The user hovered on the PathogenPreview circular label in a ReportTable row. */
  this.PATHOGEN_PREVIEW_HOVERED = "PATHOGEN_PREVIEW_HOVERED";

  /** The user hovered on the "Known Pathogen" PathogenLabel in a ReportTable row or TaxonTreeVis. */
  this.PATHOGEN_LABEL_HOVERED = "PATHOGEN_LABEL_HOVERED";

  /** The user clicked the pathogen list link in the PathogenLabel popup. */
  this.PATHOGEN_LABEL_PATHOGEN_LIST_LINK_CLICKED =
    "PATHOGEN_LABEL_PATHOGEN_LIST_LINK_CLICKED";

  /** The user clicked the ncbi link in the PathogenListView. */
  this.PATHOGEN_LIST_VIEW_NCBI_LINK_CLICKED =
    "PATHOGEN_LIST_VIEW_NCBI_LINK_CLICKED";

  /** The user opened the HeatmapCreationModal from SamplesView. */
  this.SAMPLES_VIEW_HEATMAP_CREATION_MODAL_OPENED =
    "SAMPLES_VIEW_HEATMAP_CREATION_MODAL_OPENED";

  /** The user closed the HeatmapCreationModal on SamplesView. */
  this.SAMPLES_VIEW_HEATMAP_CREATION_MODAL_CLOSED =
    "SAMPLES_VIEW_HEATMAP_CREATION_MODAL_CLOSED";

  /** The user clicked the Continue button in the HeatmapCreationModal to generate a heatmap, possibly with presets. */
  this.HEATMAP_CREATION_MODAL_CONTINUE_BUTTON_CLICKED =
    "HEATMAP_CREATION_MODAL_CONTINUE_BUTTON_CLICKED";

  /** The user hovered over the Duplicate Compression Ratio info icon on a QualityControl histogram. */
  this.QUALITY_CONTROL_DCR_INFO_ICON_HOVERED =
    "QUALITY_CONTROL_DCR_INFO_ICON_HOVERED";

  /** The user clicked a histogram bar on a QualityControl histogram. */
  this.QUALITY_CONTROL_HISTOGRAM_BAR_CLICKED =
    "QUALITY_CONTROL_HISTOGRAM_BAR_CLICKED";

  /** The user clicked the empty space on a QualityControl histogram. This unseelects previously-selected histogram bars. */
  this.QUALITY_CONTROL_HISTOGRAM_EMPTY_SPACE_CLICKED =
    "QUALITY_CONTROL_HISTOGRAM_EMPTY_SPACE_CLICKED";

  /** The user hovered over a histogram bar on a QualityControl histogram. */
  this.QUALITY_CONTROL_HISTOGRAM_BAR_HOVERED =
    "QUALITY_CONTROL_HISTOGRAM_BAR_HOVERED";

  /** The user hovered over the Mean Insert Size info icon on a QualityControl histogram. */
  this.QUALITY_CONTROL_MEAN_INSERT_SIZE_INFO_ICON_HOVERED =
    "QUALITY_CONTROL_MEAN_INSERT_SIZE_INFO_ICON_HOVERED";

  /** The user hovered over the Passed QC info icon on a QualityControl histogram. */
  this.QUALITY_CONTROL_PASSED_QC_INFO_ICON_HOVERED =
    "QUALITY_CONTROL_PASSED_QC_INFO_ICON_HOVERED";

  /** The user hovered over a bar on a QualityControl stacked bar chart. */

  this.QUALITY_CONTROL_STACKED_BAR_CHART_BAR_HOVERED =
    "QUALITY_CONTROL_STACKED_BAR_CHART_BAR_HOVERED";

  /** The user hovered over the Reads Lost info icon on a QualityControl stacked bar chart. */
  this.QUALITY_CONTROL_STACKED_BAR_CHART_INFO_ICON_HOVERED =
    "QUALITY_CONTROL_STACKED_BAR_CHART_INFO_ICON_HOVERED";

  /** The user clicked a label on a QualityControl stacked bar chart. */
  this.QUALITY_CONTROL_STACKED_BAR_CHART_LABEL_CLICKED =
    "QUALITY_CONTROL_STACKED_BAR_CHART_LABEL_CLICKED";

  /** The user hovered over a label on a QualityControl stacked bar chart. */

  this.QUALITY_CONTROL_STACKED_BAR_CHART_LABEL_HOVERED =
    "QUALITY_CONTROL_STACKED_BAR_CHART_LABEL_HOVERED";

  /** The user clicked the BarChartToggle on a Quality Control chart. */
  this.QUALITY_CONTROL_BAR_CHART_TOGGLE_CLICKED =
    "QUALITY_CONTROL_BAR_CHART_TOGGLE_CLICKED";

  /** The user hovered over the Total Reads info icon on a QualityControl chart. */
  this.QUALITY_CONTROL_TOTAL_READS_INFO_ICON_HOVERED =
    "QUALITY_CONTROL_TOTAL_READS_INFO_ICON_HOVERED";

  /** The user hovered over the AnnotationsLabel on a samples view ReportTable. */
  this.ANNOTATION_LABEL_HOVERED = "ANNOTATION_LABEL_HOVERED";

  /** The user clicked a MenuItem within the AnnotationMenu. */
  this.ANNOTATION_MENU_MENU_ITEM_CLICKED = "ANNOTATION_MENU_MENU_ITEM_CLICKED";

  /** The user closed the Project Creation modal in the Upload Sample Step. */
  this.UPLOAD_SAMPLE_STEP_PROJECT_CREATION_MODAL_CLOSED =
    "UPLOAD_SAMPLE_STEP_PROJECT_CREATION_MODAL_CLOSED";

  /** The user clicked the BLAST button on the HoverActions within a species or genus row. */
  this.REPORT_TABLE_BLAST_BUTTON_HOVER_ACTION_CLICKED =
    "REPORT_TABLE_BLAST_BUTTON_HOVER_ACTION_CLICKED";

  /** The user opened the AnnotationMenu within a species or genus row. */
  this.REPORT_TABLE_ANNOTATION_MENU_OPENED =
    "REPORT_TABLE_ANNOTATION_MENU_OPENED";

  /** The user clicked the trigger to open the Pin Samples dropdown on the SamplesHeatmapVis. */
  this.SAMPLES_HEATMAP_VIS_PIN_SAMPLES_DROPDOWN_TRIGGER_CLICKED =
    "SAMPLES_HEATMAP_VIS_PIN_SAMPLES_DROPDOWN_TRIGGER_CLICKED";

  /** The user changed the selected Pinned Samples in the dropdown on the SamplesHeatmapView. */
  this.SAMPLES_HEATMAP_VIEW_PINNED_SAMPLES_CHANGED =
    "SAMPLES_HEATMAP_VIEW_PINNED_SAMPLES_CHANGED";

  /** The user applied changes to their selected Pinned Samples in the dropdown on the SamplesHeatmapView. */
  this.SAMPLES_HEATMAP_VIEW_PINNED_SAMPLES_APPLIED =
    "SAMPLES_HEATMAP_VIEW_PINNED_SAMPLES_APPLIED";

  /** The user canceled changes to their selected Pinned Samples in the dropdown on the SamplesHeatmapView. */
  this.SAMPLES_HEATMAP_VIEW_PINNED_SAMPLES_CANCELED =
    "SAMPLES_HEATMAP_VIEW_PINNED_SAMPLES_CANCELED";

  /** The user clicked the pin icon to unpin a sample on the taxon heatmap. */
  this.SAMPLES_HEATMAP_VIEW_SAMPLE_UNPIN_ICON_CLICKED =
    "SAMPLES_HEATMAP_VIEW_SAMPLE_UNPIN_ICON_CLICKED";

  /** An in-progress local upload has failed. Its status on the LocalUploadProgress modal has been updated. */
  this.LOCAL_UPLOAD_PROGRESS_MODAL_UPLOAD_FAILED =
    "LOCAL_UPLOAD_PROGRESS_MODAL_UPLOAD_FAILED";

  /** An in-progress local upload has succeeded. Its status on the LocalUploadProgress modal has been updated. */
  this.LOCAL_UPLOAD_PROGRESS_MODAL_UPLOAD_SUCCEEDED =
    "LOCAL_UPLOAD_PROGRESS_MODAL_UPLOAD_SUCCEEDED";

  /** An in-progress local upload step has failed.  */
  this.LOCAL_UPLOAD_PROGRESS_MODAL_UPLOAD_STEP_ERROR =
    "LOCAL_UPLOAD_PROGRESS_MODAL_UPLOAD_STEP_ERROR";

  /** The user clicked the "contact us" link on the LocalUploadProgressModal. */
  this.LOCAL_UPLOAD_PROGRESS_MODAL_CONTACT_US_LINK_CLICKED =
    "LOCAL_UPLOAD_PROGRESS_MODAL_CONTACT_US_LINK_CLICKED";

  /** The user clicked the "Go to Project" button on the LocalUploadProgressModal. */
  this.LOCAL_UPLOAD_PROGRESS_MODAL_GO_TO_PROJECT_BUTTON_CLICKED =
    "LOCAL_UPLOAD_PROGRESS_MODAL_GO_TO_PROJECT_BUTTON_CLICKED";

  /** The user clicked "Retry all failed" in the upload failure Notification on the LocalUploadProgressModal. */
  this.LOCAL_UPLOAD_PROGRESS_MODAL_RETRY_ALL_FAILED_CLICKED =
    "LOCAL_UPLOAD_PROGRESS_MODAL_RETRY_ALL_FAILED_CLICKED";

  /** The user clicked "Retry" in the upload failure Alert on the LocalUploadProgressModal. */
  this.LOCAL_UPLOAD_PROGRESS_MODAL_RETRY_CLICKED =
    "LOCAL_UPLOAD_PROGRESS_MODAL_RETRY_CLICKED";

  /** Heartbeat, which is sent every minute and indicates that the browser is actively uploading samples, has been activated. */
  this.LOCAL_UPLOAD_PROGRESS_MODAL_UPLOADS_BATCH_HEARTBEAT_SENT =
    "LOCAL_UPLOAD_PROGRESS_MODAL_UPLOADS_BATCH_HEARTBEAT_SENT";

  /** Heartbeat, which is sent every minute and indicates that the browser is actively uploading samples, has been deactivated. */
  this.LOCAL_UPLOAD_PROGRESS_MODAL_UPLOADS_BATCH_HEARTBEAT_COMPLETED =
    "LOCAL_UPLOAD_PROGRESS_MODAL_UPLOADS_BATCH_HEARTBEAT_COMPLETED";

  /** An in-progress remote upload has failed. Its status on the LocalUploadProgress modal has been updated. */
  this.REMOTE_UPLOAD_PROGRESS_MODAL_UPLOAD_FAILED =
    "REMOTE_UPLOAD_PROGRESS_MODAL_UPLOAD_FAILED";

  /** An in-progress remote upload has succeeded. Its status on the LocalUploadProgress modal has been updated. */
  this.REMOTE_UPLOAD_PROGRESS_MODAL_UPLOAD_SUCCEEDED =
    "REMOTE_UPLOAD_PROGRESS_MODAL_UPLOAD_SUCCEEDED";

  /** The user clicked the "contact us" link on the RemoteUploadProgressModal. */
  this.REMOTE_UPLOAD_PROGRESS_MODAL_CONTACT_US_LINK_CLICKED =
    "REMOTE_UPLOAD_PROGRESS_MODAL_CONTACT_US_LINK_CLICKED";

  /** The user clicked the "Go to Project" button on the RemoteUploadProgressModal. */
  this.REMOTE_UPLOAD_PROGRESS_MODAL_GO_TO_PROJECT_BUTTON_CLICKED =
    "REMOTE_UPLOAD_PROGRESS_MODAL_GO_TO_PROJECT_BUTTON_CLICKED";

  /** The user clicked the "Yes, leave Upload" button on the UploadConfirmationModal. */
  this.UPLOAD_CONFIRMATION_MODAL_LEAVE_UPLOAD_BUTTON_CLICKED =
    "UPLOAD_CONFIRMATION_MODAL_LEAVE_UPLOAD_BUTTON_CLICKED";

  /** The user clicked the "Return to Upload" button on the UploadConfirmationModal. */
  this.UPLOAD_CONFIRMATION_MODAL_RETURN_TO_UPLOAD_BUTTON_CLICKED =
    "UPLOAD_CONFIRMATION_MODAL_RETURN_TO_UPLOAD_BUTTON_CLICKED";

  /** This user clicked the sortable column headers on a discovery view table. */
  this.DISCOVERY_VIEW_COLUMN_SORT_ARROW_CLICKED =
    "DISCOVERY_VIEW_COLUMN_SORT_ARROW_CLICKED";

  /** One page of data is loaded onto the DiscoveryView table */
  this.DISCOVERY_VIEW_TABLE_PAGE_LOADED = "DISCOVERY_VIEW_TABLE_PAGE_LOADED";

  /** The user clicked apply in the TaxonThresholdFilter. */
  this.TAXON_THRESHOLD_FILTER_APPLY_CLICKED =
    "TAXON_THRESHOLD_FILTER_APPLY_CLICKED";

  /** The user triggered a download from the SampleHeatmapDownloadModal. */
  this.SAMPLES_HEATMAP_DOWNLOAD_MODAL_DOWNLOAD_CLICKED =
    "SAMPLES_HEATMAP_DOWNLOAD_MODAL_DOWNLOAD_CLICKED";

  /** The user closed the SampleHeatmapDownloadModal. */
  this.SAMPLES_HEATMAP_DOWNLOAD_MODAL_CLOSED =
    "SAMPLES_HEATMAP_DOWNLOAD_MODAL_CLOSED";

  /** The user launched a heatmap from the BulkDownloadsModal */
  this.SAMPLES_HEATMAP_BULK_DOWNLOAD_MODAL_CLICKED =
    "SAMPLES_HEATMAP_BULK_DOWNLOAD_MODAL_CLICKED";
  this.SAMPLES_HEATMAP_DOWNLOAD_MODAL_BULK_DOWNLOAD_CREATION_SUCCESS =
    "SAMPLES_HEATMAP_DOWNLOAD_MODAL_BULK_DOWNLOAD_CREATION_SUCCESS";

  this.SAMPLES_HEATMAP_DOWNLOAD_MODAL_BULK_DOWNLOAD_CREATION_FAILED =
    "SAMPLES_HEATMAP_DOWNLOAD_MODAL_BULK_DOWNLOAD_CREATION_FAILED";

  /**  The user selected a file for upload that failed one or more pre-upload QC checks */
  this.PRE_UPLOAD_QC_CHECK_WARNING_TYPE = "PRE_UPLOAD_QC_CHECK_WARNING_TYPE";

  /** Track the cumulative size of files that did not pass the pre-upload validation checks */
  this.PRE_UPLOAD_QC_CHECK_CUMULATIVE_FILE_SIZE_FAILED =
    "PRE_UPLOAD_QC_CHECK_CUMULATIVE_FILE_SIZE_FAILED";

  /** The user has clicked the Bulk Kickoff AMR Trigger on the SamplesView */
  this.SAMPLES_VIEW_BULK_KICKOFF_AMR_WORKFLOW_TRIGGER_CLICKED =
    "SAMPLES_VIEW_BULK_KICKOFF_AMR_WORKFLOW_TRIGGER_CLICKED";

  /** The user has clicked the "Register Now" button on the LandingPage */
  this.LANDING_PAGE_REGISTER_NOW_BUTTON_CLICKED =
    "LANDING_PAGE_REGISTER_NOW_BUTTON_CLICKED";

  /** The user has signed in for the first time */
  this.DISCOVERY_VIEW_ROUTER_USER_FIRST_SIGN_IN =
    "DISCOVERY_VIEW_ROUTER_USER_FIRST_SIGN_IN";

  /** The user has clicked the "Complete Setup" button on the UserProfileForm */
  this.USER_PROFILE_FORM_COMPLETE_SETUP_CLICKED =
    "USER_PROFILE_FORM_COMPLETE_SETUP_CLICKED";

  /** The welcome modal was shown to a first time user on the DiscoveryView */
  this.MODAL_FIRST_TIME_USER_SHOWN = "MODAL_FIRST_TIME_USER_SHOWN";

  this.ANNOUNCEMENT_BANNER_CLOSE_CLICKED = "ANNOUNCEMENT_BANNER_CLOSE_CLICKED";

  this.ADVANCED_DOWNLOAD_TAB_COPY_CLOUD_COMMAND_LINK_CLICKED =
    "ADVANCED_DOWNLOAD_TAB_COPY_CLOUD_COMMAND_LINK_CLICKED";

  this.METADATA_CSV_LOCATIONS_MENU_APPLY_ALL_CLICKED =
    "METADATA_CSV_LOCATIONS_MENU_APPLY_ALL_CLICKED";

  this.METADATA_UPLOAD_INSTRUCTION_LINK_CLICKED =
    "METADATA_UPLOAD_INSTRUCTION_LINK_CLICKED";

  this.METADATA_UPLOAD_DOWNLOAD_CSV_TEMPLATE_CLICKED =
    "METADATA_UPLOAD_DOWNLOAD_CSV_TEMPLATE_CLICKED";

  this.BULK_DOWNLOAD_LIST_DETAILS_SIDEBAR_CLOSED =
    "BULK_DOWNLOAD_LIST_DETAILS_SIDEBAR_CLOSED";

  this.BULK_DOWNLOAD_MODAL_FOOTER_START_GENERATING_BUTTON_CLICKED =
    "BULK_DOWNLOAD_MODAL_FOOTER_START_GENERATING_BUTTON_CLICKED";

  this.SAMPLES_HEATMAP_VIS_ZOOM_IN_CONTROL_CLICKED =
    "SAMPLES_HEATMAP_VIS_ZOOM_IN_CONTROL_CLICKED";

  this.SAMPLES_HEATMAP_VIS_ZOOM_OUT_CONTROL_CLICKED =
    "SAMPLES_HEATMAP_VIS_ZOOM_OUT_CONTROL_CLICKED";

  this.SAMPLES_HEATMAP_VIEW_DETAILS_SIDEBAR_CLOSED =
    "SAMPLES_HEATMAP_VIEW_DETAILS_SIDEBAR_CLOSED";

  this.SAMPLES_HEATMAP_HEADER_SHARE_BUTTON_CLICKED =
    "SAMPLES_HEATMAP_HEADER_SHARE_BUTTON_CLICKED";

  this.SAMPLES_HEATMAP_HEADER_SAVE_BUTTON_CLICKED =
    "SAMPLES_HEATMAP_HEADER_SAVE_BUTTON_CLICKED";

  this.DISCOVERY_FILTERS_TAG_REMOVED = "DISCOVERY_FILTERS_TAG_REMOVED";

  this.EMPTY_STATES_MODAL_CLOSE_MODAL_CLICKED =
    "EMPTY_STATES_MODAL_CLOSE_MODAL_CLICKED";

  this.DISCOVERY_SIDEBAR_METADATA_LABEL_CLICKED =
    "DISCOVERY_SIDEBAR_METADATA_LABEL_CLICKED";

  this.DISCOVERY_SIDEBAR_METADATA_BAR_CLICKED =
    "DISCOVERY_SIDEBAR_METADATA_BAR_CLICKED";

  this.MAP_BANNER_CLEAR_FILTERS_LINK_CLICKED =
    "MAP_BANNER_CLEAR_FILTERS_LINK_CLICKED";

  this.NEXTCLADE_MODAL_FOOTER_VIEW_QC_IN_NEXTCLADE_BUTTON_CLICKED =
    "NEXTCLADE_MODAL_FOOTER_VIEW_QC_IN_NEXTCLADE_BUTTON_CLICKED";

  this.PHYLO_TREE_LIST_VIEW_SHARE_BUTTON_CLICKED =
    "PHYLO_TREE_LIST_VIEW_SHARE_BUTTON_CLICKED";

  this.PHYLO_TREE_LIST_VIEW_SAVE_BUTTON_CLICKED =
    "PHYLO_TREE_LIST_VIEW_SAVE_BUTTON_CLICKED";

  this.PHYLO_TREE_LIST_VIEW_DETAILS_SIDEBAR_CLOSED =
    "PHYLO_TREE_LIST_VIEW_DETAILS_SIDEBAR_CLOSED";

  this.PIPELINE_VIZ_STAGE_COLLAPSE_BUTTON_CLICKED =
    "PIPELINE_VIZ_STAGE_COLLAPSE_BUTTON_CLICKED";

  this.PIPELINE_VIZ_STAGE_EXPAND_BUTTON_CLICKED =
    "PIPELINE_VIZ_STAGE_EXPAND_BUTTON_CLICKED";

  this.PIPELINE_VIZ_ZOOM_IN_CONTROL_CLICKED =
    "PIPELINE_VIZ_ZOOM_IN_CONTROL_CLICKED";

  this.PIPELINE_VIZ_ZOOM_OUT_CONTROL_CLICKED =
    "PIPELINE_VIZ_ZOOM_OUT_CONTROL_CLICKED";

  this.PIPELINE_VIZ_SIDEBAR_CLOSE_BUTTON_CLICKED =
    "PIPELINE_VIZ_SIDEBAR_CLOSE_BUTTON_CLICKED";

  this.COLLECTION_MODAL_APPLIED_CORRECTION_METHOD_CHANGED =
    "COLLECTION_MODAL_APPLIED_CORRECTION_METHOD_CHANGED";

  this.COLLECTION_MODAL_CREATE_COLLECTION_BUTTON_CLICKED =
    "COLLECTION_MODAL_CREATE_COLLECTION_BUTTON_CLICKED";

  this.COLLECTION_MODAL_CANCEL_BUTTON_CLICKED =
    "COLLECTION_MODAL_CANCEL_BUTTON_CLICKED";

  this.COLLECTION_MODAL_OPEN_LINK_CLICKED =
    "COLLECTION_MODAL_OPEN_LINK_CLICKED";

  this.COLLECTION_MODAL_CLOSE_LINK_CLICKED =
    "COLLECTION_MODAL_CLOSE_LINK_CLICKED";

  this.METADATA_UPLOAD_MODAL_MODAL_CLOSED =
    "METADATA_UPLOAD_MODAL_MODAL_CLOSED";

  this.PROJECT_SETTINGS_MODAL_OPEN_LINK_CLICK =
    "PROJECT_SETTINGS_MODAL_OPEN_LINK_CLICK";

  this.PROJECT_SETTINGS_MODAL_CLOSE_MODAL_CLICKED =
    "PROJECT_SETTINGS_MODAL_CLOSE_MODAL_CLICKED";

  this.PROJECT_SETTINGS_MODAL_PUBLIC_BUTTON_CONFIRMED =
    "PROJECT_SETTINGS_MODAL_PUBLIC_BUTTON_CONFIRMED";

  this.USER_MANAGEMENT_FORM_ADD_MEMBER_BUTTON_CLICKED =
    "USER_MANAGEMENT_FORM_ADD_MEMBER_BUTTON_CLICKED";

  this.SAMPLES_VIEW_PHYLO_TREE_MODAL_OPEN_CLICKED =
    "SAMPLES_VIEW_PHYLO_TREE_MODAL_OPEN_CLICKED";

  this.SAMPLES_VIEW_BULK_DOWNLOAD_MODAL_OPEN_CLICKED =
    "SAMPLES_VIEW_BULK_DOWNLOAD_MODAL_OPEN_CLICKED";

  this.SAMPLES_VIEW_NEXTCLADE_MODAL_OPEN_CLICKED =
    "SAMPLES_VIEW_NEXTCLADE_MODAL_OPEN_CLICKED";

  this.SAMPLES_VIEW_SELECT_ALL_ROWS_CLICKED =
    "SAMPLES_VIEW_SELECT_ALL_ROWS_CLICKED";

  this.SAMPLES_VIEW_PHYLO_TREE_MODAL_CLOSED =
    "SAMPLES_VIEW_PHYLO_TREE_MODAL_CLOSED";

  this.SAMPLES_VIEW_BULK_DOWNLOAD_MODAL_CLOSED =
    "SAMPLES_VIEW_BULK_DOWNLOAD_MODAL_CLOSED";

  this.SAMPLES_VIEW_NEXTCLADE_MODAL_CLOSED =
    "SAMPLES_VIEW_NEXTCLADE_MODAL_CLOSED";

  this.BASESPACE_SAMPLE_IMPORT_CONNECT_BTN_CLICKED =
    "BASESPACE_SAMPLE_IMPORT_CONNECT_BTN_CLICKED";

  this.BASESPACE_SAMPLE_IMPORT_CONNECT_PROJECT_BTN_CLICKED =
    "BASESPACE_SAMPLE_IMPORT_CONNECT_PROJECT_BTN_CLICKED";

  this.REVIEW_STEP_START_UPLOAD_BUTTON_CLICKED =
    "REVIEW_STEP_START_UPLOAD_BUTTON_CLICKED";

  this.UPLOAD_SAMPLE_STEP_CREATE_PROJECT_OPENED =
    "UPLOAD_SAMPLE_STEP_CREATE_PROJECT_OPENED";

  this.SAMPLE_VIEW_COVERAGE_VIZ_SIDEBAR_CLOSED =
    "SAMPLE_VIEW_COVERAGE_VIZ_SIDEBAR_CLOSED";

  this.AMR_VIEW_DETAILS_SIDEBAR_CLOSED = "AMR_VIEW_DETAILS_SIDEBAR_CLOSED";

  this.SAMPLE_VIEW_DETAILS_SIDEBAR_CLOSED =
    "SAMPLE_VIEW_DETAILS_SIDEBAR_CLOSED";

  this.PIPELINE_SAMPLE_REPORT_TAXON_SIDEBAR_LINK_CLICKED =
    "PIPELINE_SAMPLE_REPORT_TAXON_SIDEBAR_LINK_CLICKED";

  this.PIPELINE_SAMPLE_REPORT_EXPAND_GENUS_CLICKED =
    "PIPELINE_SAMPLE_REPORT_EXPAND_GENUS_CLICKED";

  this.PIPELINE_SAMPLE_REPORT_EXPAND_ALL_CLICKED =
    "PIPELINE_SAMPLE_REPORT_EXPAND_ALL_CLICKED";

  this.REPORT_TABLE_COUNT_TYPE_CLICKED = "REPORT_TABLE_COUNT_TYPE_CLICKED";

  this.PIPELINE_SAMPLE_REPORT_TAXON_FASTA_LINK_CLICKED =
    "PIPELINE_SAMPLE_REPORT_TAXON_FASTA_LINK_CLICKED";

  this.PIPELINE_SAMPLE_REPORT_COVERAGE_VIZ_LINK_CLICKED =
    "PIPELINE_SAMPLE_REPORT_COVERAGE_VIZ_LINK_CLICKED";

  this.PIPELINE_SAMPLE_REPORT_CONTIG_DOWNLOAD_LINK_CLICKED =
    "PIPELINE_SAMPLE_REPORT_CONTIG_DOWNLOAD_LINK_CLICKED";

  this.PIPELINE_SAMPLE_REPORT_PHYLOTREE_LINK_CLICKED =
    "PIPELINE_SAMPLE_REPORT_PHYLOTREE_LINK_CLICKED";

  this.TAXON_TREE_VIS_NODE_COLLAPSED_STATE_CHANGED =
    "TAXON_TREE_VIS_NODE_COLLAPSED_STATE_CHANGED";

  this.SAMPLE_VIEW_SAVE_BUTTON_CLICKED = "SAMPLE_VIEW_SAVE_BUTTON_CLICKED";

  this.SAMPLE_VIEW_SAMPLE_DETAILS_LINK_CLICKED =
    "SAMPLE_VIEW_SAMPLE_DETAILS_LINK_CLICKED";

  this.PROJECT_CREATION_MODAL_MORE_INFO_TOGGLE_CLICKED =
    "PROJECT_CREATION_MODAL_MORE_INFO_TOGGLE_CLICKED";

  /** The user has clicked the link out to CARD in the license on the gene details sidebar */
  this.GENE_DETAILS_MODE_CARD_ONTOLOGY_ATTRIBUTION_CLICKED =
    "GENE_DETAILS_MODE_CARD_ONTOLOGY_ATTRIBUTION_CLICKED";

  /** The user clicked one of the links at the bottom of the gene details sidebar */
  this.GENE_DETAILS_MODE_FOOTER_LINK_CLICKED =
    "GENE_DETAILS_MODE_FOOTER_LINK_CLICKED";

  /** The user clicked the creative commons license link at the bottom of the gene details sidebar */
  this.GENE_DETAILS_MODE_CREATIVE_COMMONS_LICENSE_CLICKED =
    "GENE_DETAILS_MODE_CREATIVE_COMMONS_LICENSE_CLICKED";
}

const eventNames = new EventDictionary();

export default eventNames;
