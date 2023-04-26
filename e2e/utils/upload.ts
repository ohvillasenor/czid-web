import { expect, Page } from "@playwright/test";
import {
  ACCEPT_ALL_COOKIES,
  ANALYSIS_TYPE,
  COLLECTION_DATE,
  COLLECTION_LOCATION,
  COLUMN_SELECTOR,
  CONTINUE,
  DISEASES_CONDITIONS,
  FIXTURE_DIR,
  HOST_GENUS_SPECIES,
  HOST_ORGANISM,
  HOST_SEX,
  INFECTION_CLASS,
  ISOLATE,
  KNOWN_ORGANISM,
  RNA_DNA,
  SAMPLE_TYPE,
  SEARCH,
  SELECT_PROJECT,
  START_UPLOAD,
  UPLOAD_METADATA,
} from "../constants/common.const";
import { Metadata } from "../types/metadata";
import { findByTextRole, pressKey, selectFile } from "../utils/page";
import { getFixture } from "./common";
import { getMetadataField } from "./selectors";

const metadataFieldFixture = getFixture("metadata_fields");

export async function uploadSampleFiles(
  page: Page,
  projectName: string,
  analysisType: string,
  sampleFiles: Array<string>,
): Promise<any> {
  // select project
  await page.locator(SELECT_PROJECT).click();
  await (
    await findByTextRole(page, SEARCH)
  ).type(projectName, {
    timeout: 1000,
  });

  await page.getByText(projectName).click();

  // select analysis type
  const analysisTypeId = analysisType.toLowerCase().replace(/ /g, "-");
  await page.getByTestId(`${ANALYSIS_TYPE}-${analysisTypeId}`).click();
  if (analysisTypeId === "metagenomics") {
    await page
      .getByTestId("sequencing-technology-Illumina") // todo: needs to be parametrized
      .click();
  }

  // select files
  await selectFile(page, `${FIXTURE_DIR}/${sampleFiles}`);
  await page.getByText(ACCEPT_ALL_COOKIES).click();
  await page.getByText(CONTINUE).click();

  // wait for page and file data to be imported
  expect(page.getByText(UPLOAD_METADATA)).toBeVisible();
}

export async function fillMetadata(
  page: Page,
  metaData: Metadata,
): Promise<any> {
  // host organism
  await page
    .locator('input[type="text"]')
    .nth(0)
    .fill(String(metaData[HOST_ORGANISM]));

  // sample type
  await page
    .locator('input[type="text"]')
    .nth(1)
    .fill(String(metaData[SAMPLE_TYPE]));

  // water control
  if (metaData["Water Control"] === "Yes") {
    // todo: atm this crashes the test
    // await page.locator('input[type="radio"]').nth(0).click({ force: true });
  }
  // collection date
  await page
    .locator('input[type="text"]')
    .nth(2)
    .fill(metaData[COLLECTION_DATE] as string);

  // nucleotide type
  await page.locator(".dropdownTrigger-1fB9V").nth(1).click();
  await page
    .getByRole("option", { name: metaData["Nucleotide Type"] as string })
    .click();

  // await page.getByText(metaData["Nucleotide Type"] as string).click();

  // collection location
  await page
    .getByPlaceholder("Enter a city, region or country")
    .type(metaData[COLLECTION_LOCATION] as string);
  await page
    .getByText(metaData[COLLECTION_LOCATION] as string)
    .nth(0)
    .click();

  // first add optional columns so they can be filled
  const optionalFields: Array<string> =
    metadataFieldFixture["allOptinalFields"];
  // clicking the + icon
  await page.getByTestId("select-columns").click();
  const items = page.locator(COLUMN_SELECTOR);
  const indexOfFirstOptionalField = 5;
  for (let i = indexOfFirstOptionalField; i < (await items.count()); i++) {
    const optionName = (await items.nth(i).textContent()) as string;
    // this is a hack: at the moment we are not handling all optional fields
    if (optionalFields.includes(optionName)) {
      await items.nth(i).click();
    }
  }

  // close the column selection popup
  await pressKey(page, "Escape");

  // host sex
  const hostSex = "host_sex";
  await page.locator(getMetadataField(hostSex)).click();
  await page.getByText(metaData[HOST_SEX] as string, { exact: true }).click();
  // await page.getByText(metaData[HOST_SEX] as string).click();

  // known organism
  await page
    .locator('input[type="text"]')
    .nth(4)
    .fill(metaData[KNOWN_ORGANISM] as string);

  // infection class
  const infectionClass = "infection_class";
  await page.locator(getMetadataField(infectionClass)).click();
  await page.getByText(metaData[INFECTION_CLASS] as string).click();

  // host age
  await page
    .locator('input[type="number"]')
    .nth(0)
    .fill(String(metaData["Host Age"]));

  // detection method
  await page
    .locator('input[type="text"]')
    .nth(5)
    .fill(metaData["Detection Method"] as string);

  // library prep
  await page.locator(getMetadataField("library_prep")).click();
  await page.getByText(metaData["Library Prep"] as string).click();

  // sequencer
  await page.locator(getMetadataField("sequencer")).click();
  await page.getByText(metaData["Sequencer"] as string).click();

  // rna/dna input (ng)
  await page
    .locator('input[type="number"]')
    .nth(1)
    .fill(String(metaData[RNA_DNA]));

  // host genus species
  const hostGenusSpecies = "host_genus_species";
  await page.locator(getMetadataField(hostGenusSpecies)).click();
  await page.getByText(metaData[HOST_GENUS_SPECIES] as string).click();

  // isolate
  const isolate = "isolate";
  if (metaData[ISOLATE] === "Yes") {
    // at the moment this crashes the browser
    await page.locator(getMetadataField(isolate)).click();
  }

  // diseases and conditions
  await page
    .locator('input[type="text"]')
    .nth(6)
    .fill(String(metaData[DISEASES_CONDITIONS]));

  // click continue button
  const continueButtonIndex = 0;
  await page
    // .getByText(CONTINUE)
    // .nth(continueButtonIndex)
    .locator(".continueButton-2Bayh")
    .nth(1)
    .click();
}

export async function submitUpload(page: Page): Promise<any> {
  await page
    .locator(
      "text=I agree that the data I am uploading to CZ ID has been lawfully collected",
    )
    .click();
  await page.getByText(START_UPLOAD).click();
}

export async function getGeneratedSampleName(
  page: Page,
): Promise<string | null> {
  return page.getByTestId("sample-name").textContent();
}
