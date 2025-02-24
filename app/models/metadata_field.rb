# ActiveRecord documentation summary

# Name/key ex: "sample_type"
# t.string :name

# User-friendly display name ex: "Sample Type"
# t.string :display_name

# Human-readable description e.g. "Type of sample or tissue such as plasma, whole blood, etc."
# t.string :description

# Base data type. 0 for string, 1 for number, 2 for dates. Used for figuring out which column
# to use in "metadata-data" ex: string_validated_value, number_validated_value,
# date_validated_value.
# t.integer :base_type

# Name of a validation type corresponding to a 'hardcoded' validation function.
# Ex: "positive_number" here would call a positive_number validator in code dynamically (with
# a restricted set of functions we make).

# An array of options when applicable. Ex for nucleotide_type: ["DNA", "RNA"]. Unfortunately our
# RDS flavor/version doesn't support json types so this is string.
# t.string :options

# If true then only allow users to use the options (i.e. no freetext).
# t.integer :force_options

# A hash that maps host genome ids to an array of examples for that metadata field and host genome.
# Stored as JSON.
# If the key is "all", the examples apply to all host genomes.
# We separate by host genome because, for example, valid sample_types are different for human vs mosquito,
# and the examples should reflect this.
# t.string :examples

# +----------------------+
# |      All fields      |
# | +------------------+ |
# | |      Core        | |
# | | +--------------+ | |
# | | |   Default    | | |
# | | | +----------+ | | |
# | | | | Required | | | |
# | | | +__________+ | | |
# | | +______________+ | |
# | +__________________+ |
# +______________________+

# The core fields are basically the set of fields that we think are important/interesting/have
# curated ourselves. All user-created custom types will not be core (unless we make them).
# Ex: lat_lon could be a core field but not on new projects by default.
# t.integer :is_core

# Default fields are a subset of the core fields that will appear on a project when someone
# creates a project. These can be removed from a project.
# See add_default_metadata_fields in project.rb.
# t.integer :is_default

# Required fields are a subset of the core/default fields that cannot be removed from the
# project. This is the strictest level. Ex: collection_date, location, nucleotide_type, etc.
# t.integer :is_required

# Name of a group of fields for the frontend. Ex: Sample, Donor, Infection, Sequencing, etc.
# t.string :group

# Certain meta-fields are appropriate for different (and potentially multiple) hosts. E.g.
# "Discharge Date" is only for humans. Therefore host genomes have many meta-fields and
# meta-fields have many host genomes. This is a way of handling many-to-many /
# has_and_belongs_to_many in Rails.
# create_join_table :host_genomes, :metadata_fields

# User-defined meta-fields will belong to each (and potentially multiple) projects. So
# meta-fields have many projects and projects have many meta-fields.
# When a user creates a new project, they'll basically get a list of all the meta-fields marked
# "default". Then they can add and subtract from their set of meta-fields from there.
# create_join_table :projects, :metadata_fields

# Whether this metadata field should be added automatically to new host genomes.
# See add_default_metadata_fields in host_genome.rb.
# t.integer :default_for_new_host_genome, limit: 1, default: 0
# NOTE: making the attribute true will also add the field to all existing host genomes.
class MetadataField < ApplicationRecord
  has_and_belongs_to_many :host_genomes
  has_and_belongs_to_many :projects
  has_many :metadata, dependent: :destroy

  # Obeying the same rules as in MetadataHelper validate_metadata_csv_for_samples
  # Metadata fields are shared globally and can be created by users.
  validates :name, presence: true
  validates :display_name, presence: true

  validate :metadata_field_validations

  before_save :update_host_genomes!

  # As of Feb 2020, we renamed "Host Genome" in the UI to better reflect its
  # purpose as "Host Organism". For backwards compatibility, especially for CSV
  # uploads, we treat both as synonyms.
  HOST_GENOME_SYNONYMS = [
    "host_genome",
    "Host Genome",
    "host_organism",
    "Host Organism",
  ].freeze
  # We can't let a user create their own sample_name custom metadata column
  SAMPLE_NAME_SYNONYMS = ["sample_name", "Sample Name"].freeze
  RESERVED_NAMES = HOST_GENOME_SYNONYMS | SAMPLE_NAME_SYNONYMS
  validates :name, exclusion: { in: RESERVED_NAMES }

  STRING_TYPE = 0
  NUMBER_TYPE = 1
  DATE_TYPE = 2
  LOCATION_TYPE = 3
  validates :base_type, presence: true, inclusion: { in: [
    STRING_TYPE,
    NUMBER_TYPE,
    DATE_TYPE,
    LOCATION_TYPE,
    # see also boolean? method
  ] }

  # Ensure human metadata is HIPAA compliant
  # The equivalent frontend constant is specified in FIELDS_THAT_HAVE_MAX_INPUT
  MAX_HUMAN_AGE = 90

  # NOTE: not sure why these columns were not created as booleans
  validates :force_options, inclusion: { in: [0, 1] }
  validates :is_core, inclusion: { in: [0, 1] }
  validates :is_default, inclusion: { in: [0, 1] }
  validates :is_required, inclusion: { in: [0, 1] }

  # Note: default_for_host_genome is no longer only for "new" hosts
  def default_for_host_genome?
    # for migration compatibility
    respond_to?(:default_for_new_host_genome) && default_for_new_host_genome == 1
  end

  def metadata_field_validations
    if is_default == 1 && is_core == 0
      errors.add(:name, 'Default field must also be core field')
    end
    if is_required == 1 && is_default == 0
      errors.add(:name, 'Required field must also be default field')
    end
    if is_required == 1 && !default_for_host_genome?
      errors.add(:name, 'Required field must also be default_for_new_host_genome field')
    end
  end

  def update_host_genomes!
    if is_required == 1 || default_for_host_genome?
      host_genomes << HostGenome.all_without_metadata_field(name)
    end
  end

  # Important attributes for the frontend
  def field_info
    {
      key: name,
      dataType: self.class.convert_type_to_string(base_type),
      name: display_name,
      options: options && JSON.parse(options),
      group: group,
      host_genome_ids: host_genome_ids,
      description: description,
      is_required: is_required,
      examples: examples && JSON.parse(examples),
      default_for_new_host_genome: default_for_new_host_genome,
      isBoolean: boolean?,
    }
  end

  def add_examples(new_examples, host_genome = "all")
    if host_genome == "all"
      add_examples_helper(new_examples, "all")
    # If a host genome is specified, make sure the metadata field applies to that host.
    elsif host_genomes.where(name: host_genome).length == 1
      add_examples_helper(new_examples, host_genomes.find_by(name: host_genome).id)
    else
      raise "Invalid host genome"
    end
  end

  def remove_examples(examples_to_remove, host_genome = "all")
    if host_genome == "all"
      remove_examples_helper(examples_to_remove, "all")
    # If a host genome is specified, make sure the metadata field applies to that host.
    elsif host_genomes.where(name: host_genome).length == 1
      remove_examples_helper(examples_to_remove, host_genomes.find_by(name: host_genome).id)
    else
      raise "Invalid host genome"
    end
  end

  def validated_field
    base = self.class.convert_type_to_string(base_type)
    "#{base}_validated_value"
  end

  def self.convert_type_to_string(type)
    if type == STRING_TYPE
      return "string"
    elsif type == NUMBER_TYPE
      return "number"
    elsif type == DATE_TYPE
      return "date"
    elsif type == LOCATION_TYPE
      return "location"
    end

    ""
  end

  # If the field has exactly two forced options, it is effectively a boolean.
  # For now, we only support Yes/No, in that order.
  def boolean?
    return false unless options && force_options == 1

    parsed = JSON.parse(options)

    return false unless parsed.length == 2

    return parsed[0] == "Yes" && parsed[1] == "No"
  end

  # Get the MetadataFields that are on the Samples' Projects and HostGenomes
  def self.by_samples(samples)
    return [] if samples.nil?

    project_ids = samples.distinct.pluck(:project_id)
    host_genome_ids = samples.distinct.pluck(:host_genome_id)

    # combined multiple lines into a single call for performance optimization
    # The performance gains come largely from removing the nested `.includes` and
    # using the union function to filter the results into only the fields in the given projects and host_genome
    # some extra information can be found here: https://github.com/chanzuckerberg/czid-web-private/pull/2938
    metadata_fields_union = (Project.where(id: project_ids).includes(:metadata_fields).map(&:metadata_fields).flatten & HostGenome.where(id: host_genome_ids).includes(:metadata_fields).map(&:metadata_fields).flatten)
    metadata_fields_union.map(&:field_info)
  end

  private

  def add_examples_helper(new_examples, host_genome)
    existing_examples = examples ? JSON.parse(examples) : {}

    # merge new examples using a set
    existing_examples_set = (existing_examples[host_genome] || []).to_set
    existing_examples_set.merge(new_examples)
    existing_examples[host_genome] = existing_examples_set.to_a

    update(examples: JSON.dump(existing_examples))
  end

  def remove_examples_helper(examples_to_remove, host_genome)
    existing_examples = examples ? JSON.parse(examples) : {}

    existing_examples[host_genome] ||= []
    existing_examples[host_genome] -= examples_to_remove

    update(examples: JSON.dump(existing_examples))
  end
end
