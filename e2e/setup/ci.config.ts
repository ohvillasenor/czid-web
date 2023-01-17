import { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../../", ".env.dev"),
});

const config: PlaywrightTestConfig = {
  expect: {
    timeout: 120000,
  },
  fullyParallel: true,
  globalSetup: "./globalSetup",
  // globalTeardown: "./globalTeardown",
  outputDir: "../report",
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        video: "on",
      },
    },
  ],
  reporter: "github",
  testDir: "../tests",
  timeout: 120000,
  use: {
    actionTimeout: 0,
    contextOptions: { recordHar: { path: "traffic.har" } },
    baseURL: "http://localhost:3000",
    headless: true,
    ignoreHTTPSErrors: false,
    storageState: "/tmp/state.json",
    trace: "retain-on-failure",
    video: "on",
  },
};
export default config;