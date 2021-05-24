// Pipeline workflow options
export const WORKFLOWS = {
  CONSENSUS_GENOME: {
    label: "Consensus Genome",
    value: "consensus-genome",
  },
  CONSENSUS_GENOME_FLAT_LIST: {
    label: "Consensus Genome Flat List",
    value: "consensus-genome",
  },
  SHORT_READ_MNGS: { label: "Metagenomic", value: "short-read-mngs" },
};

export const WORKFLOW_ORDER = [
  "SHORT_READ_MNGS",
  "CONSENSUS_GENOME",
  "CONSENSUS_GENOME_FLAT_LIST",
];
