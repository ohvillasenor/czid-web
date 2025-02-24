import { ONT_V1_HARD_LAUNCH_FEATURE } from "./features";

// Pipeline workflow options
export const WORKFLOW_ENTITIES = {
  SAMPLES: "Samples" as const,
  WORKFLOW_RUNS: "WorkflowRuns" as const,
};

// String constants
const ANTIMICROBIAL_RESISTANCE = "Antimicrobial Resistance";

export const WORKFLOWS = {
  AMR: {
    label: ANTIMICROBIAL_RESISTANCE,
    pluralizedLabel: ANTIMICROBIAL_RESISTANCE,
    value: "amr" as const,
    entity: WORKFLOW_ENTITIES.WORKFLOW_RUNS,
    pipelineName: ANTIMICROBIAL_RESISTANCE,
    shorthand: "AMR",
  },
  CONSENSUS_GENOME: {
    label: "Consensus Genome" as const,
    pluralizedLabel: "Consensus Genomes",
    value: "consensus-genome" as const,
    entity: WORKFLOW_ENTITIES.WORKFLOW_RUNS,
    pipelineName: "Consensus Genome",
    shorthand: "CG",
  },
  SHORT_READ_MNGS: {
    label: "Metagenomic" as const,
    pluralizedLabel: "Metagenomics",
    value: "short-read-mngs" as const,
    entity: WORKFLOW_ENTITIES.SAMPLES,
    pipelineName: "Illumina mNGS",
    shorthand: "mNGS",
  },
  LONG_READ_MNGS: {
    label: "Nanopore" as const,
    pluralizedLabel: "Metagenomics - Nanopore",
    value: "long-read-mngs" as const,
    entity: WORKFLOW_ENTITIES.SAMPLES,
    pipelineName: "Nanopore mNGS",
    shorthand: "mNGS",
  },
  BENCHMARK: {
    label: "Benchmark" as const,
    pluralizedLabel: "Benchmarks",
    value: "benchmark" as const,
    entity: WORKFLOW_ENTITIES.WORKFLOW_RUNS,
    pipelineName: "Benchmark",
    shorthand: "BM",
  },
};

export const WORKFLOW_KEY_FOR_VALUE = {
  [WORKFLOWS.AMR.value]: "AMR" as const,
  [WORKFLOWS.CONSENSUS_GENOME.value]: "CONSENSUS_GENOME" as const,
  [WORKFLOWS.SHORT_READ_MNGS.value]: "SHORT_READ_MNGS" as const,
  [WORKFLOWS.LONG_READ_MNGS.value]: "LONG_READ_MNGS" as const,
  [WORKFLOWS.BENCHMARK.value]: "BENCHMARK" as const,
};

export const workflowIsWorkflowRunEntity = (workflow: WORKFLOW_VALUES) => {
  const workflowKey = WORKFLOW_KEY_FOR_VALUE[workflow];
  return WORKFLOWS[workflowKey].entity === WORKFLOW_ENTITIES.WORKFLOW_RUNS;
};

export const WORKFLOW_ORDER = [
  "SHORT_READ_MNGS" as const,
  "LONG_READ_MNGS" as const,
  "CONSENSUS_GENOME" as const,
  "AMR" as const,
  "BENCHMARK" as const,
];

export const workflowIsBeta = (
  workflow: keyof typeof WORKFLOWS,
  allowedFeatures: string[],
) => {
  const betaWorkflows = [];
  if (!allowedFeatures.includes(ONT_V1_HARD_LAUNCH_FEATURE)) {
    betaWorkflows.push("LONG_READ_MNGS");
  }
  return betaWorkflows.includes(workflow);
};

export const getShorthandFromWorkflow = (workflow: WORKFLOW_VALUES) => {
  const workflowKey = WORKFLOW_KEY_FOR_VALUE[workflow];
  return WORKFLOWS[workflowKey].shorthand;
};

export const getLabelFromWorkflow = (workflow: WORKFLOW_VALUES) => {
  const workflowKey = WORKFLOW_KEY_FOR_VALUE[workflow];
  return WORKFLOWS[workflowKey].label;
};

export const mngsWorkflows = [
  WORKFLOWS.SHORT_READ_MNGS.value,
  WORKFLOWS.LONG_READ_MNGS.value,
] as string[];

export const isMngsWorkflow = (workflow: WORKFLOW_VALUES) =>
  mngsWorkflows.includes(workflow);

/**
 *
 * Return key of matched element in WORKFLOWS object
 *
 * ie.
 * toCompare === "Antimicrobial Resistance"
 * keyToFind === "label"
 * Returns "AMR";
 *
 * @param {string} toCompare String to search for within WORKFLOWS values
 * @param {string} keyToSearch Key at which to search
 * @return {string} Key in WORKFLOWS where toCompare was found
 */
export const findInWorkflows = (
  toCompare: string,
  keyToSearch: WorkflowAttrs,
): Workflows[WorkflowKeys][typeof keyToSearch] => {
  return Object.keys(WORKFLOWS).find(
    workflow => WORKFLOWS[workflow][keyToSearch] === toCompare,
  );
};

export const labelToVal = (label: string) => {
  const otherMngsTabLabels = [
    "Antimicrobial Resistance (Deprecated)",
    "Metagenomics - Simplified",
  ] as string[];
  if (otherMngsTabLabels.includes(label)) {
    label = "Metagenomic";
  }
  return WORKFLOWS[findInWorkflows(label, "label")].value;
};

/**
 * WORKFLOW TYPES
 */

export type MetagenomicTabsSample =
  | "Metagenomic"
  | "Antimicrobial Resistance (Deprecated)"
  | "Metagenomics - Simplified";

export type WorkflowTabsSample =
  | "Consensus Genome"
  | "Antimicrobial Resistance"
  | "Benchmark";

export type LongReadTabsSample = "Nanopore";

export type WorkflowCount = {
  [key in WORKFLOW_VALUES]?: number;
};

type Workflows = typeof WORKFLOWS;
type WorkflowKeys = keyof Workflows;
export type WORKFLOW_VALUES = Workflows[WorkflowKeys]["value"];
export type WORKFLOW_LABELS = Workflows[WorkflowKeys]["label"];
type WorkflowAttrs = keyof Workflows[WorkflowKeys];
