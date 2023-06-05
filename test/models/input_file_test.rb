require 'test_helper'

class InputFileTest < ActiveSupport::TestCase
  setup do
    @input_file = input_files(:one)
  end

  test "file_path" do
    expected = "samples/#{@input_file.sample.project.id}/#{@input_file.sample.id}/fastqs/#{@input_file.name}"
    assert_equal expected, @input_file.file_path
  end

  test "validate name presence" do
    file = InputFile.new(source_type: 'local', source: 'file1.fastq.gz', upload_client: 'web')
    assert_not file.valid?
    assert_equal [:sample, :name], file.errors.attribute_names
  end

  test "validate name format" do
    invalid_names = ['.fastq', 'a{.fastq.gz', 'a/b.fastq.gz']
    invalid_names.each do |name|
      file = InputFile.new(source_type: 'local', source: 'file1.fastq.gz', upload_client: 'web')
      file.name = name
      assert_not file.valid?
      assert_equal [:sample, :name], file.errors.attribute_names
    end
  end

  test "validate source_type" do
    file = InputFile.new(source_type: 'invalid', name: 'valid.fastq.gz', source: 'file1.fastq.gz', upload_client: 'web')
    assert_not file.valid?
    assert_equal [:sample, :source_type], file.errors.attribute_names
  end

  test "validate upload_client" do
    file = InputFile.new(source_type: 'local', name: 'valid.fastq.gz', source: 'file1.fastq.gz', upload_client: 'invalid')
    assert_not file.valid?
    assert_equal [:sample, :upload_client], file.errors.attribute_names
  end
end
