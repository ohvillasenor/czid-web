import { find, getOr, isEmpty, omit, size } from "lodash/fp";
import { diff } from "~/components/utils/objectUtil";
import {
  findInWorkflows,
  isMngsWorkflow,
  labelToVal,
  WorkflowCount,
  WORKFLOWS,
  WorkflowTabsSample,
  WORKFLOW_ENTITIES,
  WORKFLOW_VALUES,
} from "~/components/utils/workflows";
import Sample from "~/interface/sample";
import { CurrentTabSample, FilterSelections } from "~/interface/sampleView";
import { TABS, TREE_METRICS } from "./constants";

export const getWorkflowCount = (sample: Sample): WorkflowCount => {
  const count = {};
  Object.keys(WORKFLOWS).forEach(workflow => {
    switch (WORKFLOWS[workflow].entity) {
      case WORKFLOW_ENTITIES.SAMPLES:
        /* This line works to separate Illumina/Nanopore because all pipeline runs for a
        sample will be of one technology type (Illumina or Nanopore).
        Equivalently, to deprecate initial_workflow we could update samples_controller#show
        to return technology and filter the pipeline runs by technology. */
        count[WORKFLOWS[workflow].value] =
          sample.initial_workflow === WORKFLOWS[workflow].value &&
          size(sample.pipeline_runs);
        break;
      case WORKFLOW_ENTITIES.WORKFLOW_RUNS:
        count[WORKFLOWS[workflow].value] = size(
          sample.workflow_runs.filter(
            (run: $TSFixMe) => run.workflow === WORKFLOWS[workflow].value,
          ),
        );
        break;
      default:
        break;
    }
  });
  return count;
};

export const getDefaultSelectedOptions = (): FilterSelections => {
  return {
    annotations: [],
    flags: [],
    background: null,
    categories: { categories: [], subcategories: { Viruses: [] } },
    // Don't set the default metric as 'aggregatescore' because it computed based on the background model and will error if the background model is 'None'.
    metricShortReads: find(
      { value: "nt_r" },
      TREE_METRICS[TABS.SHORT_READ_MNGS],
    ).value,
    metricLongReads: find({ value: "nt_b" }, TREE_METRICS[TABS.LONG_READ_MNGS])
      .value,
    nameType: "Scientific name",
    readSpecificity: 0,
    taxa: [],
    thresholdsShortReads: [],
    thresholdsLongReads: [],
  };
};

export const determineInitialTab = ({
  initialWorkflow,
  workflowCount,
  currentTab,
}: {
  initialWorkflow: string;
  workflowCount: WorkflowCount;
  currentTab: CurrentTabSample | null;
}): CurrentTabSample => {
  const {
    [WORKFLOWS.SHORT_READ_MNGS.value]: shortReadMngs,
    [WORKFLOWS.LONG_READ_MNGS.value]: longReadMngs,
    [WORKFLOWS.CONSENSUS_GENOME.value]: cg,
    [WORKFLOWS.AMR.value]: amr,
    [WORKFLOWS.BENCHMARK.value]: benchmark,
  } = workflowCount;
  if (currentTab && workflowCount[labelToVal(currentTab)] > 0) {
    return currentTab;
  } else if (shortReadMngs) {
    return TABS.SHORT_READ_MNGS;
  } else if (longReadMngs) {
    return TABS.LONG_READ_MNGS;
  } else if (cg) {
    return TABS.CONSENSUS_GENOME;
  } else if (amr) {
    return TABS.AMR as WorkflowTabsSample;
  } else if (benchmark) {
    return TABS.BENCHMARK as WorkflowTabsSample;
  } else if (initialWorkflow) {
    return TABS[findInWorkflows(initialWorkflow, "value")];
  } else {
    return TABS.SHORT_READ_MNGS;
  }
};

export const getAppliedFilters = (
  selectedOptions,
): Omit<
  FilterSelections,
  "nameType" | "metricShortReads" | "metricLongReads" | "background"
> => {
  // Only Taxon, Category, Subcategories, Read Specifity, and Threshold Filters are considered "Applied Filters"
  return omit(
    ["nameType", "metricShortReads", "metricLongReads", "background"],
    diff(selectedOptions, getDefaultSelectedOptions()),
  ) as Omit<
    FilterSelections,
    "nameType" | "metricShortReads" | "metricLongReads" | "background"
  >;
};

export const hasAppliedFilters = (currentTab, selectedOptions) => {
  const {
    categories,
    readSpecificity,
    taxa,
    thresholdsShortReads,
    thresholdsLongReads,
  } = selectedOptions;

  const hasCategoryFilters =
    !isEmpty(getOr([], "categories", categories)) ||
    !isEmpty(getOr([], "subcategories.Viruses", categories));
  const hasReadSpecificityFilters = readSpecificity !== 0;
  const hasTaxonFilter = !isEmpty(taxa);
  const thresholds =
    currentTab === TABS.SHORT_READ_MNGS
      ? thresholdsShortReads
      : thresholdsLongReads;
  const hasThresholdFilters = !isEmpty(thresholds);

  return (
    hasCategoryFilters ||
    hasReadSpecificityFilters ||
    hasTaxonFilter ||
    hasThresholdFilters
  );
};

export const hasMngsRuns = (sample: Sample) => {
  const workflowCount = getWorkflowCount(sample);
  // remove keys of workflowCount that are falsy
  // and count how many of the remaining keys are mngs workflows
  const mngsWorkflowsCount = Object.entries(workflowCount).filter(
    ([workflow, count]: [WORKFLOW_VALUES, number]) =>
      isMngsWorkflow(workflow) && count > 0,
  ).length;
  return mngsWorkflowsCount > 0;
};

export const loadState = (
  store: Storage,
  key: string,
): {
  selectedOptions?: { background: number; metric: string };
  [x: string]: unknown;
} => {
  try {
    return JSON.parse(store.getItem(key)) || {};
  } catch (e) {
    // Avoid possible bad transient state related crash
    // eslint-disable-next-line no-console
    console.warn(`Bad state: ${e}`);
  }
  return {};
};
