import { IconNameToSizes } from "@czi-sds/components";
import { IconCovidVirusXLarge } from "~/components/ui/icons";
import {
  AMR_PIPELINE_HELP_LINK,
  CG_PIPELINE_HELP_LINK,
  ILLUMINA_MNGS_PIPELINE_HELP_LINK,
  NANOPORE_MNGS_PIPELINE_HELP_LINK,
} from "~/components/utils/documentationLinks";
import { WORKFLOWS } from "~/components/utils/workflows";

export const NO_TARGET_PROJECT_ERROR =
  "Please select a CZ ID project to upload your samples to.";

export const NO_VALID_SAMPLES_FOUND_ERROR = "No valid samples were found.";

export const SELECT_ID_KEY = "_selectId";
export const ILLUMINA = "Illumina";
export const NANOPORE = "ONT";
export const NO_TECHNOLOGY_SELECTED = "noTechnologySelected";

export const UPLOAD_WORKFLOWS: {
  [key: string]: {
    label: string;
    value: UploadWorkflows;
    icon?: keyof IconNameToSizes;
    customIcon?(props: any): JSX.Element; // a function that returns an icon component instance; ie: a component def
  };
} = {
  MNGS: {
    label: "Metagenomics" as const,
    value: "mngs" as const,
    icon: "dna" as const,
  },
  VIRAL_CONSENSUS_GENOME: {
    label: "Viral Consensus Genome" as const,
    value: "viral-consensus-genome" as const,
    icon: "virus" as const,
  },
  COVID_CONSENSUS_GENOME: {
    label: "SARS-CoV-2 Consensus Genome" as const,
    value: "covid-consensus-genome" as const,
    customIcon: IconCovidVirusXLarge,
  },
  AMR: {
    label: "Antimicrobial Resistance" as const,
    value: WORKFLOWS.AMR.value,
    icon: "bacteria" as const,
  },
};

export const UPLOAD_WORKFLOW_KEY_FOR_VALUE = {
  [UPLOAD_WORKFLOWS.MNGS.value]: "MNGS" as const,
  [UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value]:
    "COVID_CONSENSUS_GENOME" as const,
  [UPLOAD_WORKFLOWS.VIRAL_CONSENSUS_GENOME.value]:
    "VIRAL_CONSENSUS_GENOME" as const,
  [UPLOAD_WORKFLOWS.AMR.value]: "AMR" as const,
};

/**
 * This constant specifies which workflows can be selected together during sample upload.
 * The top-level key indicates which workflow was most recently selected. The second level
 * key indicates which technology was selected for that workflow, if any. Given the
 * already-selected workflows/technologies, we limit further selections depending on which
 * workflow types are compatible with each other. The array (value) should always include the
 * top level key, since you can always run the workflow you have already selected.
 */
export const ALLOWED_UPLOAD_WORKFLOWS_BY_TECHNOLOGY = {
  [UPLOAD_WORKFLOWS.MNGS.value]: {
    [ILLUMINA]: [
      UPLOAD_WORKFLOWS.MNGS.value,
      UPLOAD_WORKFLOWS.AMR.value,
      UPLOAD_WORKFLOWS.VIRAL_CONSENSUS_GENOME.value,
    ],
    [NANOPORE]: [UPLOAD_WORKFLOWS.MNGS.value],
    [NO_TECHNOLOGY_SELECTED]: [
      UPLOAD_WORKFLOWS.MNGS.value,
      UPLOAD_WORKFLOWS.AMR.value,
      UPLOAD_WORKFLOWS.VIRAL_CONSENSUS_GENOME.value,
    ], // Case when user does not have access to ont_v1
  },
  [UPLOAD_WORKFLOWS.AMR.value]: {
    [ILLUMINA]: [UPLOAD_WORKFLOWS.AMR.value, UPLOAD_WORKFLOWS.MNGS.value], // Case when short-read-mngs and amr are both selected
    [NO_TECHNOLOGY_SELECTED]: [
      UPLOAD_WORKFLOWS.AMR.value,
      UPLOAD_WORKFLOWS.MNGS.value,
    ], // Case when only amr is selected
  },
  [UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value]: {
    [ILLUMINA]: [UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value],
    [NANOPORE]: [UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value],
    [NO_TECHNOLOGY_SELECTED]: [UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value],
  },
  [UPLOAD_WORKFLOWS.VIRAL_CONSENSUS_GENOME.value]: {
    [ILLUMINA]: [
      UPLOAD_WORKFLOWS.VIRAL_CONSENSUS_GENOME.value,
      UPLOAD_WORKFLOWS.MNGS.value,
    ],
    [NANOPORE]: [UPLOAD_WORKFLOWS.VIRAL_CONSENSUS_GENOME.value],
    [NO_TECHNOLOGY_SELECTED]: [
      UPLOAD_WORKFLOWS.VIRAL_CONSENSUS_GENOME.value,
      UPLOAD_WORKFLOWS.MNGS.value,
    ],
  },
};

// Mapping of UPLOAD_WORKFLOW and TECHNOLOGY selected by the user in the sample upload flow
// to the WORKFLOW that should be dispatched to in the backend
export const WORKFLOWS_BY_UPLOAD_SELECTIONS = {
  [UPLOAD_WORKFLOWS.MNGS.value]: {
    [ILLUMINA]: WORKFLOWS.SHORT_READ_MNGS.value,
    [NANOPORE]: WORKFLOWS.LONG_READ_MNGS.value,
    [NO_TECHNOLOGY_SELECTED]: WORKFLOWS.SHORT_READ_MNGS.value, // Case when user does not have access to ont_v1
  },
  [UPLOAD_WORKFLOWS.AMR.value]: {
    [ILLUMINA]: WORKFLOWS.AMR.value, // Case when short-read-mngs and amr are both selected
    [NO_TECHNOLOGY_SELECTED]: WORKFLOWS.AMR.value, // Case when only amr is selected
  },
  [UPLOAD_WORKFLOWS.COVID_CONSENSUS_GENOME.value]: {
    [ILLUMINA]: WORKFLOWS.CONSENSUS_GENOME.value,
    [NANOPORE]: WORKFLOWS.CONSENSUS_GENOME.value,
  },
  [UPLOAD_WORKFLOWS.VIRAL_CONSENSUS_GENOME.value]: {
    [ILLUMINA]: WORKFLOWS.CONSENSUS_GENOME.value,
  },
};

export enum SEQUENCING_TECHNOLOGY_OPTIONS {
  ILLUMINA = "Illumina",
  NANOPORE = "ONT",
}

export const SEQUENCING_TECHNOLOGY_DISPLAY_NAMES = {
  Illumina: "Illumina",
  ONT: "Nanopore",
};

export const GUPPY_BASECALLER_SETTINGS = [
  {
    text: "fast",
    value: "fast",
  },
  {
    text: "hac",
    value: "hac",
  },
  {
    text: "super",
    value: "super",
  },
];

// "Unknown" option provided in UploadTaxonFilter during the WGS sample upload flow
export const UNKNOWN_TAXON_OPTION = {
  id: null,
  name: "Unknown",
};

export const CG_WETLAB_DISPLAY_NAMES = {
  ampliseq: "AmpliSeq",
  artic_short_amplicons: "ARTIC v3 - Short Amplicons (275 bp)",
  artic_v4: "ARTIC v4/ARTIC v4.1",
  artic: "ARTIC v3",
  combined_msspe_artic: "Combined MSSPE & ARTIC v3",
  covidseq: "COVIDseq",
  midnight: "Midnight",
  msspe: "MSSPE",
  snap: "SNAP",
  varskip: "VarSkip",
  easyseq: "Easyseq",
  artic_v5: "ARTIC v5.3.2",
};

// WARNING: If you are adding an option here, you probably also want to add it to: https://github.com/chanzuckerberg/czid-cli
export const CG_WETLAB_OPTIONS = [
  {
    text: CG_WETLAB_DISPLAY_NAMES.artic_v4,
    value: "artic_v4",
  },
  {
    text: CG_WETLAB_DISPLAY_NAMES.artic_v5,
    value: "artic_v5",
  },
  {
    text: CG_WETLAB_DISPLAY_NAMES.artic,
    value: "artic",
  },
  {
    text: CG_WETLAB_DISPLAY_NAMES.artic_short_amplicons,
    value: "artic_short_amplicons",
  },
  {
    text: CG_WETLAB_DISPLAY_NAMES.msspe,
    value: "msspe",
  },
  {
    text: CG_WETLAB_DISPLAY_NAMES.combined_msspe_artic,
    value: "combined_msspe_artic",
  },
  {
    text: CG_WETLAB_DISPLAY_NAMES.snap,
    value: "snap",
  },
  {
    text: CG_WETLAB_DISPLAY_NAMES.ampliseq,
    value: "ampliseq",
  },
  {
    text: CG_WETLAB_DISPLAY_NAMES.covidseq,
    value: "covidseq",
  },
  {
    text: CG_WETLAB_DISPLAY_NAMES.varskip,
    value: "varskip",
  },
  {
    text: CG_WETLAB_DISPLAY_NAMES.midnight,
    value: "midnight",
  },
  {
    text: CG_WETLAB_DISPLAY_NAMES.easyseq,
    value: "easyseq",
  },
];

// WARNING: If you are adding an option here, you probably also want to add it to: https://github.com/chanzuckerberg/czid-cli
export const CG_NANOPORE_WETLAB_OPTIONS = [
  {
    text: CG_WETLAB_DISPLAY_NAMES.artic,
    value: "artic",
  },
  {
    text: CG_WETLAB_DISPLAY_NAMES.midnight,
    value: "midnight",
  },
  {
    text: CG_WETLAB_DISPLAY_NAMES.artic_v4,
    value: "artic_v4",
  },
  {
    text: CG_WETLAB_DISPLAY_NAMES.varskip,
    value: "varskip",
  },
  {
    text: CG_WETLAB_DISPLAY_NAMES.artic_v5,
    value: "artic_v5",
  },
];

export const DEFAULT_NANOPORE_WETLAB_OPTION = "artic";

export const DEFAULT_MEDAKA_MODEL_OPTION = "r941_min_high_g360";

export const MEDAKA_MODEL_OPTIONS = {
  DEFAULT: {
    displayName: "default",
    options: [
      {
        text: "r941_min_high_g360",
        value: "r941_min_high_g360",
        subtext:
          "Pore: r941, Instrument: minION or gridION, Basecaller Method: High, Version: g/360",
      },
    ],
  },
  MINION_GRIDION: {
    displayName: "minION or gridION",
    options: [
      {
        text: "r941_min_fast_g303",
        value: "r941_min_fast_g303",
        subtext:
          "Pore: r941, Instrument: minION or gridION, Basecaller Method: Fast, Version: g/303",
      },
      {
        text: "r941_min_high_g303",
        value: "r941_min_high_g303",
        subtext:
          "Pore: r941, Instrument: minION or gridION, Basecaller Method: High, Version: g/303",
      },
      {
        text: "r941_min_high_g330",
        value: "r941_min_high_g330",
        subtext:
          "Pore: r941, Instrument: minION or gridION, Basecaller Method: High, Version: g/330",
      },
      {
        text: "r941_min_high_g340_rle",
        value: "r941_min_high_g340_rle",
        subtext:
          "Pore: r941, Instrument: minION or gridION, Basecaller Method: High, Version: g/340",
      },
      {
        text: "r941_min_high_g344",
        value: "r941_min_high_g344",
        subtext:
          "Pore: r941, Instrument: minION or gridION, Basecaller Method: High, Version: g/344",
      },
      {
        text: "r941_min_high_g351",
        value: "r941_min_high_g351",
        subtext:
          "Pore: r941, Instrument: minION or gridION, Basecaller Method: High, Version: g/351",
      },
    ],
  },
  PROMETHION: {
    displayName: "promethION",
    options: [
      {
        text: "r103_prom_high_g360",
        value: "r103_prom_high_g360",
        subtext:
          "Pore: r103, Instrument: promethION, Basecaller Method: High, Version: g/",
      },
      {
        text: "r103_prom_snp_g3210",
        value: "r103_prom_snp_g3210",
        subtext:
          "Pore: r103, Instrument: promethION, Basecaller Method: SNP, Version: g/3210",
      },
      {
        text: "r103_prom_variant_g3210",
        value: "r103_prom_variant_g3210",
        subtext:
          "Pore: r103, Instrument: promethION, Basecaller Method: Variant, Version: g/3210",
      },
      {
        text: "r941_prom_fast_g303",
        value: "r941_prom_fast_g303",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: Fast, Version: g/303",
      },
      {
        text: "r941_prom_high_g303",
        value: "r941_prom_high_g303",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: High, Version: g/303",
      },
      {
        text: "r941_prom_high_g330",
        value: "r941_prom_high_g330",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: High, Version: g/330",
      },
      {
        text: "r941_prom_high_g344",
        value: "r941_prom_high_g344",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: High, Version: g/344",
      },
      {
        text: "r941_prom_high_g360",
        value: "r941_prom_high_g360",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: High, Version: g/360",
      },
      {
        text: "r941_prom_high_g4011",
        value: "r941_prom_high_g4011",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: High, Version: g/4011",
      },
      {
        text: "r941_prom_snp_g303",
        value: "r941_prom_snp_g303",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: SNP, Version: g/303",
      },
      {
        text: "r941_prom_snp_g322",
        value: "r941_prom_snp_g322",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: SNP, Version: g/322",
      },
      {
        text: "r941_prom_snp_g360",
        value: "r941_prom_snp_g360",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: SNP, Version: g/360",
      },
      {
        text: "r941_prom_variant_g303",
        value: "r941_prom_variant_g303",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: Variant, Version: g/303",
      },
      {
        text: "r941_prom_variant_g322",
        value: "r941_prom_variant_g322",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: Variant, Version: g/322",
      },
      {
        text: "r941_prom_variant_g360",
        value: "r941_prom_variant_g360",
        subtext:
          "Pore: r941, Instrument: promethION, Basecaller Method: Variant, Version: g/360",
      },
    ],
  },
};

export const LOCAL_UPLOAD = "local";
export const REMOTE_UPLOAD = "remote";
export const BASESPACE_UPLOAD = "basespace";

export const PIPELINE_HELP_LINKS = {
  [WORKFLOWS.SHORT_READ_MNGS.value]: ILLUMINA_MNGS_PIPELINE_HELP_LINK,
  [WORKFLOWS.LONG_READ_MNGS.value]: NANOPORE_MNGS_PIPELINE_HELP_LINK,
  [WORKFLOWS.CONSENSUS_GENOME.value]: CG_PIPELINE_HELP_LINK,
  [WORKFLOWS.AMR.value]: AMR_PIPELINE_HELP_LINK,
};

// TYPES
export type Technology = "Illumina" | "ONT";
export type UploadWorkflows =
  | "mngs"
  | "amr"
  | "covid-consensus-genome"
  | "viral-consensus-genome";

export const INPUT_FILE_TYPES = {
  FASTQ: "fastq",
  PRIMER_BED: "primer_bed",
  REFERENCE_SEQUENCE: "reference_sequence",
};
