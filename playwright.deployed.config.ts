import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL;
if (!baseURL) {
  throw new Error("E2E_BASE_URL is required for deployed smoke tests.");
}

const mode = process.env.DEPLOYED_SMOKE_MODE ?? "preauth";
const projects = [
  {
    name: "chromium",
    use: { ...devices["Desktop Chrome"] },
  },
];

if (mode === "login" || mode === "preauth") {
  projects.push(
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  );
}

export default defineConfig({
  testDir: "./e2e",
  testMatch: /deployed-auth\.spec\.ts$/,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 45_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects,
});
