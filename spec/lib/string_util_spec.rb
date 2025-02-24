require "rails_helper"

RSpec.describe StringUtil do
  describe "#humanize_step_name" do
    it "should humanize step names" do
      expect(StringUtil.humanize_step_name("validate_input_out")).to eq("Validate Input")
      expect(StringUtil.humanize_step_name("runValidateInput")).to eq("Validate Input")
    end

    it "should use custom names if a stage name is provided" do
      expect(StringUtil.humanize_step_name("RunStar")).to eq("Star")
      expect(StringUtil.humanize_step_name("RunStar", PipelineRunStage::HOST_FILTERING_STAGE_NAME)).to eq("STAR")
    end
  end

  describe "#canonicalize_url" do
    it "should replace the id with an X in a PUT request" do
      url = "/projects/123.json"
      expect(StringUtil.canonicalize_url(url, :put)).to eq("/projects/X")
    end

    it "should replace the id with an X in a POST request" do
      url = "/samples/123/save_metadata_v2"
      expect(StringUtil.canonicalize_url(url, :post)).to eq("/samples/X/save_metadata_v2")
    end

    it "should replace the id with an X in a DELETE request" do
      url = "/samples/123.json"
      expect(StringUtil.canonicalize_url(url, :delete)).to eq("/samples/X")
    end

    it "should replace the id with an X in a GET request" do
      url = "/samples/123.json"
      expect(StringUtil.canonicalize_url(url, :get)).to eq("/samples/X")
    end

    it "should replace all variable fields with an X and remove format" do
      url = "/samples/20169/pipeline_viz/4.11.json"
      expect(StringUtil.canonicalize_url(url, :get)).to eq("/samples/X/pipeline_viz/X")
    end

    it "should not include params in canonicalized URL" do
      url = "/samples/123/coverage_viz_data?accession_id=456"
      expect(StringUtil.canonicalize_url(url, :get)).to eq("/samples/X/coverage_viz_data")
    end

    it "should not modify a URL that does not need to be canonicalized" do
      url = "/samples/validate_sample_files"
      expect(StringUtil.canonicalize_url(url, :post)).to eq(url)
    end

    it "should remove the format from a URL" do
      url = "/samples.json"
      expect(StringUtil.canonicalize_url(url, :get)).to eq("/samples")
    end

    it "should raise error with message when empty string is given" do
      url = ""
      expect { StringUtil.canonicalize_url(url, :get) }.to raise_error.with_message("The url provided is an empty string")
    end

    it "should raise UnknownHttpMethod error when url with invalid http method is given" do
      url = "/samples/123"
      expect { StringUtil.canonicalize_url(url, :invalid_method) }.to raise_error(ActionController::UnknownHttpMethod)
    end
  end
end
