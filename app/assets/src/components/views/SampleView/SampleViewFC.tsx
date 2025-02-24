import deepEqual from "fast-deep-equal";
import { find, get, head, isEmpty, isNull, map, merge, uniq } from "lodash/fp";
import React, {
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
} from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import {
  getBackgrounds,
  getCoverageVizSummary,
  getSample,
  getSampleReportData,
  getSamples,
  kickoffConsensusGenome,
} from "~/api";
import { getAmrDeprecatedData } from "~/api/amr";
import {
  ANALYTICS_EVENT_NAMES,
  trackEvent,
  withAnalytics,
} from "~/api/analytics";
import {
  createPersistedBackground,
  getPersistedBackground,
  updatePersistedBackground,
} from "~/api/persisted_backgrounds";
import CoverageVizBottomSidebar from "~/components/common/CoverageVizBottomSidebar";
import { CoverageVizParamsRaw } from "~/components/common/CoverageVizBottomSidebar/types";
import { getCoverageVizParams } from "~/components/common/CoverageVizBottomSidebar/utils";
import { UserContext } from "~/components/common/UserContext";
import NarrowContainer from "~/components/layout/NarrowContainer";
import {
  computeMngsReportTableValuesForCSV,
  createCSVObjectURL,
} from "~/components/utils/csv";
import {
  MERGED_NT_NR_FEATURE,
  MULTITAG_PATHOGENS_FEATURE,
} from "~/components/utils/features";
import { logError } from "~/components/utils/logUtil";
import {
  COVERAGE_VIZ_FEATURE,
  isPipelineFeatureAvailable,
} from "~/components/utils/pipeline_versions";
import {
  findInWorkflows,
  isMngsWorkflow,
  labelToVal,
  WORKFLOWS,
  WORKFLOW_VALUES,
} from "~/components/utils/workflows";
import { SEQUENCING_TECHNOLOGY_OPTIONS } from "~/components/views/SampleUploadFlow/constants";
import { usePrevious } from "~/helpers/customHooks/usePrevious";
import {
  getAllGeneraPathogenCounts,
  getGeneraPathogenCounts,
} from "~/helpers/taxon";
import { copyShortUrlToClipboard } from "~/helpers/url";
import ReportMetadata from "~/interface/reportMetaData";
import Sample, { WorkflowRun } from "~/interface/sample";
import {
  AmrDeprectatedData,
  BlastData,
  ConsensusGenomeClick,
  ConsensusGenomeParams,
  CurrentTabSample,
  FilterSelections,
  Lineage,
  RawReportData,
  SampleReportViewMode,
  SampleViewProps,
} from "~/interface/sampleView";
import {
  AccessionData,
  Background,
  ConsensusGenomeData,
  NumberId,
  PipelineRun,
  Taxon,
} from "~/interface/shared";
import { updateProjectIds } from "~/redux/modules/discovery/slice";
import { DetailsSidebarSwitcher } from "./components/DetailsSidebarSwitcher";
import { ModalManager } from "./components/ModalManager";
import { BlastModalInfo } from "./components/ModalManager/components/BlastModals/constants";
import { ReportPanel } from "./components/ReportPanel";
import { SampleViewHeader } from "./components/SampleViewHeader";
import { TabSwitcher } from "./components/TabSwitcher";
import cs from "./sample_view.scss";
import {
  addSampleDeleteFlagToSessionStorage,
  adjustMetricPrecision,
  cancellablePromise,
  determineInitialTab,
  filterReportData,
  GENUS_LEVEL_INDEX,
  getConsensusGenomeData,
  getPiplineRunByVersionOrId,
  getStateFromUrlandLocalStorage,
  getWorkflowCount,
  hasAppliedFilters,
  initializeSelectedOptions,
  KEY_SAMPLE_VIEW_OPTIONS,
  KEY_SELECTED_OPTIONS_BACKGROUND,
  loadState,
  NOTIFICATION_TYPES,
  PIPELINE_RUN_TABS,
  provideOptionToRevertToSampleViewFilters,
  selectedOptionsReducer,
  setDisplayName,
  shouldEnableMassNormalizedBackgrounds,
  showNotification,
  SPECIES_LEVEL_INDEX,
  TABS,
  TAX_LEVEL_GENUS,
  TAX_LEVEL_SPECIES,
  urlParser,
  URL_FIELDS,
} from "./utils";

//  Notes from Suzette on converting SampleView to hooks - Aug 2023
//  1.  First we need to get any persisted options from local storage and the URL
//  2.  The component uses those options to set the initial state
//  3.  The component needs to fetch data from the API based on those options
//       a. Before the component started by fetching the background data but that shows that this component was initially designed to only work with the short read pipeline as that is the only one that relys on background data
//       b. The component needs to fetch the sample and figure out which is the current pipeline/workflow run
//       c. Using the sample id, filter options, and backgrounds we can fetch the short read report data
//       d. The consensus genome report data is fetched using the workflow run id
//       e. The AMR report data is fetched in the AMRView component (we should work towards this pattern for all the report data)
//  4.  Whenever selectedOptions or other fields stored in the url change, the component needs to update the URL.
//  5.  If the user manually changes selectedOptions (e.g. by clicking on a filter) then the component needs to update the local storage

const SampleViewFC = ({
  snapshotShareId,
  sampleId,
  updateDiscoveryProjectId,
}: SampleViewProps) => {
  const { allowedFeatures } = useContext(UserContext) || {};
  const {
    pipelineVersionFromUrl,
    viewFromUrl,
    selectedOptionsFromLocal,
    selectedOptionsFromUrl,
    tempSelectedOptions,
    workflowRunIdFromUrl,
    currentTabFromUrl,
  } = getStateFromUrlandLocalStorage(location, localStorage);

  const [pipelineVersion, setPipelineVersion] = useState<string>(
    pipelineVersionFromUrl,
  );
  const [currentTab, setCurrentTab] =
    useState<CurrentTabSample>(currentTabFromUrl);
  // here we initially set the selected option taking into account the url and local storage
  const [selectedOptions, dispatchSelectedOptions] = useReducer(
    selectedOptionsReducer,
    {
      tempSelectedOptions,
      currentTab,
      selectedOptionsFromLocal,
      selectedOptionsFromUrl,
    },
    initializeSelectedOptions,
  );
  const [view, setView] = useState<SampleReportViewMode>(
    viewFromUrl || ("table" as const),
  );
  const [workflowRunId, setWorkflowRunId] = useState<number | null>(
    workflowRunIdFromUrl || null,
  );
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [ownedBackgrounds, setOwnedBackgrounds] = useState<Background[]>(null);
  const [otherBackgrounds, setOtherBackgrounds] = useState<Background[]>(null);
  const [hasPersistedBackground, setHasPersistedBackground] =
    useState<boolean>(null);
  const [sample, setSample] = useState<Sample | null>(null);
  const [project, setProject] = useState<NumberId | null>(null);
  const [projectSamples, setProjectSamples] = useState<
    Pick<Sample, "id" | "name">[]
  >([]);
  const [pipelineRun, setPipelineRun] = useState<PipelineRun>(null);
  const [enableMassNormalizedBackgrounds, setEnableMassNormalizedBackgrounds] =
    useState(false);
  const [lineageData, setLineageData] = useState<{ [key: string]: Lineage }>(
    {},
  );
  const [loadingReport, setLoadingReport] = useState(false);
  const [filteredReportData, setFilteredReportData] = useState<Taxon[]>([]);
  const [reportData, setReportData] = useState<Taxon[]>([]);
  const [reportMetadata, setReportMetadata] = useState<ReportMetadata>({});
  const [workflowRun, setWorkflowRun] = useState<WorkflowRun>(null);
  const [amrDeprecatedData, setAmrDeprecatedData] =
    useState<AmrDeprectatedData[]>(null);
  const [blastData, setBlastData] = useState<BlastData | Record<string, never>>(
    {},
  );
  const [blastModalInfo, setBlastModalInfo] = useState<BlastModalInfo>({});
  const [consensusGenomeData, setConsensusGenomeData] =
    useState<ConsensusGenomeData>({});
  const [consensusGenomeCreationParams, setConsensusGenomeCreationParams] =
    useState<ConsensusGenomeParams>({
      accessionId: "",
      accessionName: "",
      taxonId: null,
      taxonName: "",
    });
  const [consensusGenomePreviousParams, setConsensusGenomePreviousParams] =
    useState<ConsensusGenomeData | Record<string, never>>({});
  const [coverageVizDataByTaxon, setCoverageVizDataByTaxon] = useState<{
    [taxonId: number]: AccessionData;
  }>({});
  const [coverageVizParams, setCoverageVizParams] = useState<
    CoverageVizParamsRaw | Record<string, never>
  >({});
  const [coverageVizVisible, setCoverageVizVisible] = useState(false);
  const [modalsVisible, setModalsVisible] = useState({
    consensusGenomeError: false,
    consensusGenomeCreation: false,
    consensusGenomePrevious: false,
    blastSelection: false,
    blastContigs: false,
    blastReads: false,
  });
  const [sidebarMode, setSidebarMode] = useState<
    "sampleDetails" | "taxonDetails" | null
  >(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [sidebarTaxonData, setSidebarTaxonData] = useState<Taxon>(null);

  const [ignoreProjectBackground] = useState<boolean>(
    !!(
      (
        (selectedOptionsFromUrl && // if selected options exist from url
          isNull(selectedOptionsFromUrl.background)) || // and if background is null in url 1️⃣
        !isEmpty(tempSelectedOptions)
      ) // or if temp options exists 2️⃣ // Don't fetch saved background if have temp options (e.g. if coming from heatmap)
    ),
  );

  const prevPipelineVersion = usePrevious(pipelineVersion);
  const prevSelectedOptions = usePrevious(selectedOptions);
  const prevView = usePrevious(view);
  const prevCurrentTab = usePrevious(currentTab);
  const prevWorkflowRunId = usePrevious(workflowRunId);

  useEffect(() => {
    if (
      prevPipelineVersion !== pipelineVersion ||
      !deepEqual(prevSelectedOptions, selectedOptions) ||
      prevView !== view ||
      prevCurrentTab !== currentTab ||
      prevWorkflowRunId !== workflowRunId
    ) {
      const urlFieldsMap: URL_FIELDS = {
        pipelineVersion: pipelineVersion,
        selectedOptions: selectedOptions,
        view: view,
        currentTab: currentTab,
        workflowRunId: workflowRunId,
      };
      let urlQuery = urlParser.stringify(urlFieldsMap);
      if (urlQuery) {
        urlQuery = `?${urlQuery}`;
      }
      history.replaceState(urlFieldsMap, `SampleView`, `${urlQuery}`);
    }
  }, [
    pipelineVersion,
    prevPipelineVersion,
    selectedOptions,
    prevSelectedOptions,
    view,
    prevView,
    currentTab,
    prevCurrentTab,
    prevWorkflowRunId,
    workflowRunId,
  ]);

  const revertToSampleViewFilters = () => {
    const { selectedOptions: selectedOptionsFromLocal } = loadState(
      localStorage,
      KEY_SAMPLE_VIEW_OPTIONS,
    );
    dispatchSelectedOptions({
      type: "revertToSampleViewFilters",
      payload: {
        selectedOptionsFromLocal,
      },
    });
  };

  useEffect(() => {
    // selectedOptionsFromURL overrides selectedOptionsFromLocal in initializeSelectedOptions
    // but selectedOptionsFromLocal can be reverted back to using this function
    provideOptionToRevertToSampleViewFilters(
      tempSelectedOptions,
      currentTabFromUrl,
      revertToSampleViewFilters,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // When we navigate to the SampleView via React Router, let Appcues know we are on this page.
    if (window.analytics) {
      window.analytics.page();
    }
    // When SampleView unmounts unsubscribe from the toast notifications
    return () => {
      toast.dismiss();
    };
  }, []);

  useEffect(() => {
    const fetchSample = async () => {
      setLoadingReport(true);
      const sample = await getSample({ snapshotShareId, sampleId });
      sample.id = sampleId;

      setSample(sample);
      setProject(sample.project);

      const pipelineRun = getPiplineRunByVersionOrId(pipelineVersion, sample);
      const enableMassNormalizedBackgrounds =
        shouldEnableMassNormalizedBackgrounds(pipelineRun);
      setPipelineRun(pipelineRun);
      setEnableMassNormalizedBackgrounds(enableMassNormalizedBackgrounds);

      const newCurrentTab = determineInitialTab({
        initialWorkflow: sample.initial_workflow,
        workflowCount: getWorkflowCount(sample),
        currentTab: currentTabFromUrl,
      });
      setCurrentTab(newCurrentTab);
    };

    fetchSample().catch(error => {
      console.error(error);
    });
  }, [snapshotShareId, sampleId, currentTabFromUrl, pipelineVersion]);

  useEffect(() => {
    // track Clicks on tabs
    if (typeof currentTab === "string") {
      const name = currentTab.replace(/\W+/g, "-").toLowerCase();
      trackEvent(`SampleView_tab-${name}_clicked`, {
        tab: currentTab,
      });
    }
    if (currentTab === TABS.CONSENSUS_GENOME || currentTab === TABS.AMR) {
      let workflowRun;
      if (workflowRunId) {
        workflowRun = find({ id: workflowRunId }, sample?.workflow_runs);
      } else {
        workflowRun = find(
          { workflow: labelToVal(currentTab) },
          sample?.workflow_runs,
        );
      }
      setWorkflowRun(workflowRun);
      setWorkflowRunId(workflowRun?.id);
    }
  }, [workflowRunId, currentTab, sample?.workflow_runs]);

  useEffect(() => {
    const { runFetch, cancelFetch } = cancellablePromise<AmrDeprectatedData[]>(
      getAmrDeprecatedData(sampleId),
    );
    const fetchAmrDeprecatedData = async () => {
      const amrDeprecatedData: AmrDeprectatedData[] = await runFetch;
      setAmrDeprecatedData(amrDeprecatedData);
    };
    if (currentTab === TABS.AMR_DEPRECATED && !amrDeprecatedData) {
      fetchAmrDeprecatedData();
    }
    return cancelFetch;
  }, [currentTab, sampleId, amrDeprecatedData]);

  useEffect(() => {
    // define function to fetch all background data
    const fetchBackgrounds = async snapshotShareId => {
      setLoadingReport(true);
      const {
        owned_backgrounds: ownedBackgrounds,
        other_backgrounds: otherBackgrounds,
      } = await getBackgrounds({
        snapshotShareId,
        categorizeBackgrounds: !snapshotShareId,
      });
      const backgrounds = [...ownedBackgrounds, ...otherBackgrounds];
      setOwnedBackgrounds(ownedBackgrounds);
      setOtherBackgrounds(otherBackgrounds);
      setBackgrounds(backgrounds);
      return backgrounds;
    };

    // call function to fetch all background data
    fetchBackgrounds(snapshotShareId).catch(error => {
      console.error(error);
    });
  }, [snapshotShareId]);

  useEffect(() => {
    const fetchPersistedBackground = async ({
      projectId,
    }: {
      projectId: number;
    }) => {
      await getPersistedBackground(projectId)
        .then(({ background_id: persistedBackgroundFetched }) => {
          dispatchSelectedOptions({
            type: "newBackground",
            payload: {
              background: persistedBackgroundFetched,
            },
          });
          setHasPersistedBackground(true);
        })
        .catch((error: object) => {
          setHasPersistedBackground(false);
          console.error(error);
        });
    };
    if (project?.id && !ignoreProjectBackground && !hasPersistedBackground) {
      fetchPersistedBackground({ projectId: project.id }).catch(error => {
        console.error(error);
      });
    }
  }, [project?.id, ignoreProjectBackground, hasPersistedBackground]);

  const mergeNtNr =
    allowedFeatures.includes(MERGED_NT_NR_FEATURE) &&
    (currentTab === TABS.MERGED_NT_NR || currentTab === TABS.SHORT_READ_MNGS);

  const processRawSampleReportData = useCallback(
    (rawReportData: RawReportData) => {
      const reportData: Taxon[] = [];
      const highlightedTaxIds = new Set(rawReportData.highlightedTaxIds);
      if (rawReportData.sortedGenus) {
        const generaPathogenCounts = allowedFeatures.includes(
          MULTITAG_PATHOGENS_FEATURE,
        )
          ? getAllGeneraPathogenCounts(
              rawReportData.counts[SPECIES_LEVEL_INDEX],
            )
          : getGeneraPathogenCounts(rawReportData.counts[SPECIES_LEVEL_INDEX]);

        rawReportData.sortedGenus.forEach((genusTaxId: number) => {
          let hasHighlightedChildren = false;
          const childrenSpecies =
            rawReportData.counts[GENUS_LEVEL_INDEX][genusTaxId].species_tax_ids;
          const speciesData = childrenSpecies.map((speciesTaxId: number) => {
            const isHighlighted = highlightedTaxIds.has(speciesTaxId);
            hasHighlightedChildren = hasHighlightedChildren || isHighlighted;
            const speciesInfo =
              rawReportData.counts[SPECIES_LEVEL_INDEX][speciesTaxId];
            const speciesWithAdjustedMetricPrecision =
              adjustMetricPrecision(speciesInfo);
            return merge(speciesWithAdjustedMetricPrecision, {
              highlighted: isHighlighted,
              taxId: speciesTaxId,
              taxLevel: TAX_LEVEL_SPECIES,
            });
          });
          reportData.push(
            merge(rawReportData.counts[GENUS_LEVEL_INDEX][genusTaxId], {
              highlightedChildren: hasHighlightedChildren,
              pathogens: generaPathogenCounts[genusTaxId],
              taxId: genusTaxId,
              taxLevel: TAX_LEVEL_GENUS,
              species: speciesData,
            }),
          );
        });
      }
      setDisplayName({ reportData, nameType: selectedOptions.nameType });
      // filter report data based on selected options
      dispatchSelectedOptions({
        type: "filterReportData",
        payload: {
          currentTab,
          setFilteredReportData,
          reportData,
        },
      });
      setLineageData(rawReportData.lineage);
      setReportData(reportData);
      setReportMetadata(rawReportData.metadata);
      setLoadingReport(false);
      dispatchSelectedOptions({
        type: "newBackground",
        payload: {
          background: rawReportData.metadata.backgroundId,
        },
      });
    },
    [allowedFeatures, currentTab, selectedOptions.nameType],
  );

  const fetchSampleReportData = useCallback(
    async ({ backgroundId }: { backgroundId?: number } = {}) => {
      let selectedBackground = backgrounds.find(
        background => selectedOptions.background === background.id,
      );
      if (
        (!ignoreProjectBackground && isEmpty(selectedBackground)) ||
        (!enableMassNormalizedBackgrounds &&
          get("mass_normalized", selectedBackground))
      ) {
        // When the selectedBackground is incompatible with the sample, set it to "None"
        // and show a popup about why it is not compatible.
        selectedBackground &&
          showNotification(NOTIFICATION_TYPES.invalidBackground, {
            backgroundName: selectedBackground.name,
          });
        selectedBackground = null;
      }
      const backgroundIdUsed = backgroundId || selectedBackground?.id;

      setLoadingReport(true);
      trackEvent("PipelineSampleReport_sample_viewed", {
        sampleId,
        workflow: currentTab,
      });
      try {
        const rawReportData: RawReportData = await getSampleReportData({
          snapshotShareId,
          sampleId,
          background: backgroundIdUsed,
          pipelineVersion,
          mergeNtNr,
        });
        if (rawReportData) {
          processRawSampleReportData(rawReportData);
          dispatchSelectedOptions({
            type: "rawReportDataProcessed",
            payload: {
              allTaxIds: rawReportData?.all_tax_ids,
              backgroundIdUsed,
            },
          });
        }
        return !!rawReportData;
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    [
      backgrounds,
      ignoreProjectBackground,
      enableMassNormalizedBackgrounds,
      sampleId,
      currentTab,
      selectedOptions.background,
      snapshotShareId,
      pipelineVersion,
      mergeNtNr,
      processRawSampleReportData,
    ],
  );

  const persistNewBackgroundModelSelection = useCallback(
    async ({ newBackgroundId }: { newBackgroundId: number }) => {
      const persistBackgroundApi = !hasPersistedBackground
        ? createPersistedBackground
        : updatePersistedBackground;
      await persistBackgroundApi({
        projectId: project?.id,
        backgroundId: newBackgroundId,
      }).catch((error: Error) => {
        logError({
          message: "SampleView: Failed to persist background model selection",
          details: {
            error,
            projectId: project?.id,
            backgroundId: newBackgroundId,
            hasExistingPersistedBackground: hasPersistedBackground,
          },
        });
        console.error(error);
      });
    },
    [hasPersistedBackground, project?.id],
  );

  const handleDeliberateOptionChanged = useCallback(
    ({ key, value }: { key: string; value: unknown }) => {
      if (key === KEY_SELECTED_OPTIONS_BACKGROUND) {
        trackEvent(
          ANALYTICS_EVENT_NAMES.SAMPLE_VIEW_BACKGROUND_MODEL_SELECTED,
          {
            sampleId: sample.id,
            projectId: project.id,
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
            backgroundId: value,
          },
        );
      }
      dispatchSelectedOptions({
        type: "optionChanged",
        payload: { key, value },
      });
    },
    [project?.id, sample?.id],
  );

  const handleInvalidBackgroundSelection = useCallback(
    ({ invalidBackgroundId }: { invalidBackgroundId: number }) => {
      const invalidBackground = backgrounds.find(
        background => invalidBackgroundId === background.id,
      );
      handleDeliberateOptionChanged({
        key: KEY_SELECTED_OPTIONS_BACKGROUND,
        value: null,
      });
      showNotification(NOTIFICATION_TYPES.invalidBackground, {
        backgroundName: invalidBackground?.name,
      });
    },
    [backgrounds, handleDeliberateOptionChanged],
  );

  useEffect(() => {
    if (!sample?.pipeline_runs || sample?.pipeline_runs?.length === 0) {
      // don't fetch sample report data if there is no mngs run on the sample
      // this will be fixed when we split the sample report by tab
      return;
    }
    if (!ignoreProjectBackground && hasPersistedBackground === null) {
      return;
    }
    setLoadingReport(true);
    const { runFetch, cancelFetch } = cancellablePromise(
      fetchSampleReportData({
        backgroundId: selectedOptions.background,
      }),
    );
    runFetch
      .then(successfullyFetchedSampleReportData => {
        // if project background is different than background
        if (successfullyFetchedSampleReportData) {
          if (!ignoreProjectBackground) {
            persistNewBackgroundModelSelection({
              newBackgroundId: selectedOptions.background,
            });
          }
        } else {
          handleInvalidBackgroundSelection({
            invalidBackgroundId: selectedOptions.background,
          });
        }
      })
      .catch(err => console.error(err));
    return cancelFetch;
  }, [
    selectedOptions.background,
    ignoreProjectBackground,
    hasPersistedBackground,
    fetchSampleReportData,
    persistNewBackgroundModelSelection,
    sample?.pipeline_runs,
    handleInvalidBackgroundSelection,
  ]);

  useEffect(() => {
    project?.id && updateDiscoveryProjectId(project.id);
  }, [project?.id, updateDiscoveryProjectId]);

  useEffect(() => {
    const fetchProjectSamples = async (projectId, snapshotShareId) => {
      // only really need sample names and ids, so request the basic version without extra details
      const projectSamples: {
        samples: Pick<Sample, "id" | "name">[];
      } = await getSamples({
        projectId: projectId,
        snapshotShareId: snapshotShareId,
        basic: true,
      });
      setProjectSamples(projectSamples.samples);
    };
    project?.id &&
      fetchProjectSamples(project.id, snapshotShareId).catch(error => {
        console.error("Error fetching project samples", error);
      });
  }, [project?.id, snapshotShareId]);

  useEffect(() => {
    setFilteredReportData(
      filterReportData({
        currentTab,
        reportData,
        filters: {
          annotations: selectedOptions.annotations,
          flags: selectedOptions.flags,
          taxa: selectedOptions.taxa,
          categories: selectedOptions.categories,
          thresholdsShortReads: selectedOptions.thresholdsShortReads,
          thresholdsLongReads: selectedOptions.thresholdsLongReads,
          readSpecificity: selectedOptions.readSpecificity,
        },
      }),
    );
  }, [
    selectedOptions.annotations,
    selectedOptions.flags,
    selectedOptions.taxa,
    selectedOptions.categories,
    selectedOptions.thresholdsShortReads,
    selectedOptions.thresholdsLongReads,
    selectedOptions.readSpecificity,
    currentTab,
    reportData,
  ]);

  useEffect(() => {
    const fetchCoverageVizData = async () => {
      if (
        isPipelineFeatureAvailable(
          COVERAGE_VIZ_FEATURE,
          get("pipeline_version", pipelineRun),
        ) ||
        currentTab === TABS.LONG_READ_MNGS
      ) {
        const coverageVizSummary = await getCoverageVizSummary({
          sampleId: sampleId,
          snapshotShareId,
          pipelineVersion,
        });
        setCoverageVizDataByTaxon(coverageVizSummary);
      }
    };
    fetchCoverageVizData().catch(error => {
      console.error("Error fetching coverage viz data", error);
    });
  }, [pipelineVersion, sampleId, snapshotShareId, currentTab, pipelineRun]);

  const handlePipelineVersionSelect = (newPipelineVersion: string) => {
    if (newPipelineVersion === pipelineVersion) {
      return;
    }

    if (
      currentTab === TABS.SHORT_READ_MNGS ||
      currentTab === TABS.LONG_READ_MNGS
    ) {
      const newRun = find(
        { pipeline_version: newPipelineVersion },
        sample.pipeline_runs,
      );

      setPipelineRun(newRun);
      setPipelineVersion(newPipelineVersion);
      setFilteredReportData([]);
      setReportData([]);
    } else if (
      currentTab === TABS.CONSENSUS_GENOME ||
      currentTab === TABS.AMR
    ) {
      const workflowVal: WORKFLOW_VALUES =
        WORKFLOWS[findInWorkflows(currentTab, "label")]?.value;
      const newRun = find(
        { wdl_version: newPipelineVersion, workflow: workflowVal },
        sample.workflow_runs,
      );
      setWorkflowRun(newRun);
      setPipelineVersion(newPipelineVersion);
    }
  };

  const handleDeleteCurrentRun = () => {
    const workflowCount = getWorkflowCount(sample);
    const workflow = labelToVal(currentTab);

    let status: string;
    if (isMngsWorkflow(workflow)) {
      status = reportMetadata.pipelineRunStatus ?? "upload_failed";
    } else {
      status = workflowRun?.status ?? "no workflow run status";
    }

    trackEvent("SampleView_single_run_deleted", {
      workflow: workflow,
      runStatus: status.toLowerCase(),
      projectId: project?.id,
    });

    // add all the values of the workflowCount object
    const totalWorkflowCount = Object.values(workflowCount).reduce(
      (a, b) => a + b,
      0,
    );
    if (totalWorkflowCount <= 1) {
      // if there is only one or zero workflow run(s), navigate to the project page
      // zero workflow runs happens for failed short read mNGS uploads
      addSampleDeleteFlagToSessionStorage(sample?.name);
      location.replace(`/home?project_id=${sample.project_id}`);
      return;
    }

    // choose pipeline runs or workflow runs based on current tab
    const runType = isMngsWorkflow(workflow)
      ? "pipeline_runs"
      : "workflow_runs";
    const runs: { id: number }[] = sample[runType];

    // filter out the current run
    const newRuns = runs.filter(run => run.id !== getCurrentRun().id);

    // update the workflowCount object
    workflowCount[workflow] -= 1;

    const nextTab = determineInitialTab({
      initialWorkflow: sample.initial_workflow,
      workflowCount,
      currentTab,
    });

    // update the state to remove the current run and change the tab

    setSample({
      ...sample,
      [runType]: newRuns,
    });
    setCurrentTab(nextTab);
  };

  const handleCoverageVizClick = (
    newCoverageVizParams: CoverageVizParamsRaw,
  ) => {
    if (!newCoverageVizParams.taxId) {
      setCoverageVizVisible(false);
      return;
    }

    if (
      coverageVizVisible &&
      get("taxId", coverageVizParams) === newCoverageVizParams.taxId
    ) {
      setCoverageVizVisible(false);
    } else {
      setCoverageVizParams(newCoverageVizParams);
      setCoverageVizVisible(true);
      setSidebarVisible(false);
    }
  };

  useEffect(() => {
    setDisplayName({ reportData, nameType: selectedOptions.nameType });
    setReportData([...reportData]);
    // this should be removed when we don't have to also support the Class component of SampleView
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOptions?.nameType]);

  const handleTaxonClick = (clickedTaxonData: Taxon) => {
    if (!clickedTaxonData.taxId) {
      setSidebarVisible(false);
      return;
    }

    if (
      sidebarMode === "taxonDetails" &&
      sidebarVisible &&
      sidebarTaxonData &&
      sidebarTaxonData.taxId === clickedTaxonData.taxId
    ) {
      setSidebarVisible(false);
    } else {
      setSidebarTaxonData(clickedTaxonData);
      setSidebarMode("taxonDetails");
      setSidebarVisible(true);
      setCoverageVizVisible(false);
    }
  };

  const toggleSampleDetailsSidebar = () => {
    if (sidebarVisible && sidebarMode === "sampleDetails") {
      setSidebarVisible(false);
    } else {
      setSidebarMode("sampleDetails");
      setSidebarVisible(true);
    }
  };

  const handleConsensusGenomeKickoff = async (
    consensusGenomeParams: ConsensusGenomeParams,
  ) => {
    const workflowRuns = await kickoffConsensusGenome({
      sampleId: sample.id,
      workflow: WORKFLOWS.CONSENSUS_GENOME.value,
      alignment_config_name: sample?.pipeline_runs[0]?.alignment_config_name,
      ...consensusGenomeParams,
      technology: SEQUENCING_TECHNOLOGY_OPTIONS.ILLUMINA,
    });

    setSample({
      ...sample,
      workflow_runs: workflowRuns,
    });
    // Close both modals in case they came via the previous runs modal + error modal
    handleModalAction([
      ["close", "consensusGenomeCreation"],
      ["close", "consensusGenomePrevious"],
      ["close", "consensusGenomeError"],
    ]);
    showNotification(NOTIFICATION_TYPES.consensusGenomeCreated, {
      handleTabChange: () => setCurrentTab(TABS.CONSENSUS_GENOME),
    });
  };

  const handleConsensusGenomeClick = ({
    percentIdentity,
    taxId,
    taxName,
  }: ConsensusGenomeClick) => {
    const accessionData = get(taxId, coverageVizDataByTaxon);
    const usedAccessions = uniq(
      map("inputs.accession_id", get(taxId, getConsensusGenomeData(sample))),
    );
    handleModalAction([["open", "consensusGenomeCreation"]]);

    setConsensusGenomeData({
      accessionData,
      percentIdentity,
      taxId,
      taxName,
      usedAccessions,
    });
  };

  // Clicking the HoverAction to open the previous CG modal
  const handlePreviousConsensusGenomeClick = ({
    percentIdentity,
    taxId,
    taxName,
  }: ConsensusGenomeClick) => {
    const previousRuns = get(taxId, getConsensusGenomeData(sample));
    handleModalAction([["open", "consensusGenomePrevious"]]);
    setConsensusGenomePreviousParams({
      percentIdentity,
      previousRuns,
      taxId,
      taxName,
    });
  };

  const onConsensusGenomeCreation = async (
    consensusGenomeCreationParams: ConsensusGenomeParams,
  ) => {
    try {
      // Save the creation parameters if kickoff fails and we need to retry.
      setConsensusGenomeCreationParams(consensusGenomeCreationParams);
      await handleConsensusGenomeKickoff(consensusGenomeCreationParams);
    } catch (error) {
      console.error(error);
      trackEvent(
        ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_CREATION_MODAL_KICKOFF_FAILED,
        {
          error,
          sampleId: sample.id,
          ...consensusGenomeCreationParams,
        },
      );
      handleModalAction([["open", "consensusGenomeError"]]);
    }
  };

  // Opening up a previous Consensus Genome run
  const handlePreviousConsensusGenomeReportClick = ({
    rowData,
  }: {
    rowData: WorkflowRun;
  }) => {
    handleModalAction([["close", "consensusGenomePrevious"]]);
    setWorkflowRun(rowData);
    setWorkflowRunId(rowData.id);
    setCurrentTab(TABS.CONSENSUS_GENOME);
  };

  const handleBlastClick = (blastData: BlastData) => {
    handleModalAction([["open", "blastSelection"]]);
    setBlastData(blastData);
  };

  const handleBlastSelectionModalContinue = (
    blastModalInfo: BlastModalInfo,
  ) => {
    const { shouldBlastContigs } = blastModalInfo;
    const modalToOpen = shouldBlastContigs ? "blastContigs" : "blastReads";
    handleModalAction([
      ["close", "blastSelection"],
      ["open", modalToOpen],
    ]);
    setBlastModalInfo(blastModalInfo);
  };

  const handleModalAction = (modals: ["close" | "open", string][]) => {
    const newModalsVisible = { ...modalsVisible };
    modals.forEach(modal => {
      newModalsVisible[modal[1]] = modal[0] === "open";
    });
    setModalsVisible(newModalsVisible);
  };

  const handleConsensusGenomeErrorModalRetry = async () => {
    try {
      await handleConsensusGenomeKickoff(consensusGenomeCreationParams);
      trackEvent(
        ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_ERROR_MODAL_RETRY_BUTTON_CLICKED,
        {
          ...consensusGenomeCreationParams,
          sampleId: sample.id,
        },
      );
    } catch (error) {
      console.error(error);
      trackEvent(
        ANALYTICS_EVENT_NAMES.CONSENSUS_GENOME_CREATION_MODAL_RETRY_KICKOFF_FAILED,
        {
          error,
          sampleId: sample.id,
          ...consensusGenomeCreationParams,
        },
      );
    }
  };

  const handleMetadataUpdate = (key: string, value: string) => {
    if (key === "name") {
      setSample({
        ...sample,
        name: value,
      });
    }
  };

  const clearAllFilters = () => {
    const newSelectedOptions = { ...selectedOptions };
    newSelectedOptions.categories = {};
    newSelectedOptions.taxa = [];
    // Only clear thresholds filters that apply to the current tab
    if (currentTab === TABS.SHORT_READ_MNGS) {
      newSelectedOptions.thresholdsShortReads = [];
    } else if (currentTab === TABS.LONG_READ_MNGS) {
      newSelectedOptions.thresholdsLongReads = [];
    }
    newSelectedOptions.annotations = [];
    dispatchSelectedOptions({ type: "clear", payload: newSelectedOptions });
    setFilteredReportData(
      filterReportData({
        currentTab,
        reportData,
        filters: newSelectedOptions,
      }),
    );
    trackEvent("PipelineSampleReport_clear-filters-link_clicked");
  };

  const getCurrentRun = () => {
    if (PIPELINE_RUN_TABS.includes(currentTab)) {
      return pipelineRun;
    }

    if (sample && sample.workflow_runs.length > 0) {
      if (workflowRunId) {
        return find({ id: workflowRunId }, sample.workflow_runs);
      }

      const workflowType = Object.values(WORKFLOWS).find(
        workflow => workflow.label === currentTab,
      ).value;

      if (workflowRun && workflowRun.workflow === workflowType) {
        return workflowRun;
      }

      if (pipelineVersion) {
        return sample.workflow_runs.find(run => {
          if (run.workflow === workflowType && !!run.wdl_version) {
            return run.wdl_version === pipelineVersion;
          } else {
            return false;
          }
        });
      } else {
        return head(
          sample.workflow_runs.filter(run => run.workflow === workflowType),
        );
      }
    }
  };

  const handleViewClick = ({ view }: { view: SampleReportViewMode }) => {
    trackEvent(`PipelineSampleReport_${view}-view-menu_clicked`);
    setView(view);
  };

  const getDownloadReportTableWithAppliedFiltersLink = () => {
    const includePathogenFlags = allowedFeatures.includes(
      MULTITAG_PATHOGENS_FEATURE,
    );
    const [csvHeaders, csvRows] = computeMngsReportTableValuesForCSV(
      filteredReportData,
      selectedOptions,
      backgrounds,
      currentTab,
      includePathogenFlags,
    );

    return createCSVObjectURL(csvHeaders, csvRows);
  };

  const handleChangeWorkflowRun = (workflowRun: WorkflowRun) => {
    setWorkflowRun(workflowRun);
    setWorkflowRunId(workflowRun.id);
  };

  const handleShareClick = () => {
    copyShortUrlToClipboard();
    trackEvent("SampleView_share-button_clicked", {
      sampleId: sample && sample.id,
    });
  };

  const refreshDataFromOptionsChange = (x: {
    key: string;
    newSelectedOptions: FilterSelections;
  }) => {
    // translation for cc to fc transition
    dispatchSelectedOptions({ type: "clear", payload: x.newSelectedOptions });
  };

  return (
    <React.Fragment>
      <NarrowContainer className={cs.sampleViewContainer}>
        <SampleViewHeader
          backgroundId={
            isNaN(selectedOptions.background)
              ? null
              : selectedOptions.background
          }
          currentRun={getCurrentRun()}
          currentTab={currentTab}
          getDownloadReportTableWithAppliedFiltersLink={
            getDownloadReportTableWithAppliedFiltersLink
          }
          hasAppliedFilters={hasAppliedFilters(currentTab, selectedOptions)}
          onDetailsClick={toggleSampleDetailsSidebar}
          onPipelineVersionChange={handlePipelineVersionSelect}
          onShareClick={handleShareClick}
          project={project}
          projectSamples={projectSamples}
          reportMetadata={reportMetadata}
          sample={sample}
          snapshotShareId={snapshotShareId}
          view={view}
          onDeleteRunSuccess={handleDeleteCurrentRun}
        />
        <TabSwitcher
          currentTab={currentTab}
          handleTabChange={setCurrentTab}
          reportMetadata={reportMetadata}
          sample={sample}
        />
        <ReportPanel
          amrDeprecatedData={amrDeprecatedData}
          backgrounds={backgrounds}
          currentTab={currentTab}
          currentRun={getCurrentRun()}
          clearAllFilters={clearAllFilters}
          enableMassNormalizedBackgrounds={enableMassNormalizedBackgrounds}
          filteredReportData={filteredReportData}
          handleAnnotationUpdate={fetchSampleReportData}
          handleBlastClick={handleBlastClick}
          handleConsensusGenomeClick={handleConsensusGenomeClick}
          handleCoverageVizClick={handleCoverageVizClick}
          handlePreviousConsensusGenomeClick={
            handlePreviousConsensusGenomeClick
          }
          handleOptionChanged={handleDeliberateOptionChanged}
          handleTaxonClick={handleTaxonClick}
          handleViewClick={handleViewClick}
          handleWorkflowRunSelect={handleChangeWorkflowRun}
          refreshDataFromOptionsChange={refreshDataFromOptionsChange}
          lineageData={lineageData}
          loadingReport={loadingReport}
          ownedBackgrounds={ownedBackgrounds}
          otherBackgrounds={otherBackgrounds}
          project={project}
          reportData={reportData}
          reportMetadata={reportMetadata}
          sample={sample}
          selectedOptions={selectedOptions}
          snapshotShareId={snapshotShareId}
          view={view}
        />
      </NarrowContainer>
      <DetailsSidebarSwitcher
        handleMetadataUpdate={handleMetadataUpdate}
        handleWorkflowRunSelect={handleChangeWorkflowRun}
        handleTabChange={setCurrentTab}
        getCurrentRun={getCurrentRun}
        closeSidebar={() => setSidebarVisible(false)}
        currentTab={currentTab}
        snapshotShareId={snapshotShareId}
        sidebarVisible={sidebarVisible}
        sidebarMode={sidebarMode}
        sample={sample}
        backgrounds={backgrounds}
        selectedOptions={selectedOptions}
        sidebarTaxonData={sidebarTaxonData}
      />
      {sample &&
        (isPipelineFeatureAvailable(
          COVERAGE_VIZ_FEATURE,
          get("pipeline_version", pipelineRun),
        ) ||
          currentTab === TABS.LONG_READ_MNGS) && (
          <CoverageVizBottomSidebar
            nameType={selectedOptions.nameType}
            onBlastClick={handleBlastClick}
            onClose={withAnalytics(
              () => setCoverageVizVisible(false),
              "SampleView_coverage-viz-sidebar_closed",
              {
                sampleId: sample.id,
                sampleName: sample.name,
              },
            )}
            params={getCoverageVizParams(
              coverageVizParams,
              coverageVizDataByTaxon,
            )}
            pipelineVersion={pipelineRun.pipeline_version}
            sampleId={sample.id}
            snapshotShareId={snapshotShareId}
            visible={coverageVizVisible}
            workflow={sample.initial_workflow}
          />
        )}
      <ModalManager
        blastData={blastData}
        blastModalInfo={blastModalInfo}
        consensusGenomeData={consensusGenomeData}
        consensusGenomePreviousParams={consensusGenomePreviousParams}
        handleBlastSelectionModalContinue={handleBlastSelectionModalContinue}
        handleConsensusGenomeClick={handleConsensusGenomeClick}
        handleConsensusGenomeErrorModalRetry={
          handleConsensusGenomeErrorModalRetry
        }
        handleModalAction={handleModalAction}
        handlePreviousConsensusGenomeReportClick={
          handlePreviousConsensusGenomeReportClick
        }
        onConsensusGenomeCreation={onConsensusGenomeCreation}
        modalsVisible={modalsVisible}
        sample={sample}
      />
    </React.Fragment>
  );
};

const mapDispatchToProps = { updateDiscoveryProjectId: updateProjectIds };

// Don't need mapStateToProps yet so pass in null
const connectedComponent = connect(null, mapDispatchToProps)(SampleViewFC);

(connectedComponent.name as string) = "SampleViewFC";

export default connectedComponent;
