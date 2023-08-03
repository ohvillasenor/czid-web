# frozen_string_literal: true

# Generated by https://github.com/chanzuckerberg/idseq/blob/main/scripts/generate_host_genome.py

class UpdateAlignmentConfigMarisa < ActiveRecord::Migration[6.1]
  def up
    alignment_config = AlignmentConfig.find_by(name: "2020-04-20")
    return unless alignment_config

    alignment_config.s3_nt_loc_db_path = "s3://czid-public-references/alignment_data/2020-04-20/nt_loc.marisa"
    alignment_config.s3_nr_loc_db_path = "s3://czid-public-references/alignment_data/2020-04-20/nr_loc.marisa"
    alignment_config.s3_accession2taxid_path = "s3://czid-public-references/alignment_data/2020-04-20/accession2taxid.marisa"
    alignment_config.s3_nt_info_db_path = "s3://czid-public-references/alignment_data/2020-04-20/nt_info.marisa"
    alignment_config.s3_lineage_path = "s3://czid-public-references/taxonomy/2020-04-20/taxid-lineages.marisa"
    alignment_config.save!
  end

  def down
    alignment_config = AlignmentConfig.find_by(name: "2020-04-20")
    return unless alignment_config

    alignment_config.s3_nt_loc_db_path = "s3://czid-public-references/alignment_data/2020-04-20/nt_loc.db"
    alignment_config.s3_nr_loc_db_path = "s3://czid-public-references/alignment_data/2020-04-20/nr_loc.db"
    alignment_config.s3_accession2taxid_path = "s3://czid-public-references/alignment_data/2020-04-20/accession2taxid.db"
    alignment_config.s3_nt_info_db_path = "s3://czid-public-references/alignment_data/2020-04-20/nt_info.db"
    alignment_config.s3_lineage_path = "s3://czid-public-references/taxonomy/2020-04-20/taxid-lineages.db"
    alignment_config.save!
  end
end