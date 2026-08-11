import { defineConfig, devices } from "@playwright/test"

/**
 * E2E smoke suite for Nairi.
 * - Boots `npm run dev` (reads .env.local -> real prod DB, hCaptcha test-key fallback).
 * - `setup` project logs in once and saves an authenticated storage state.
 * - `chromium` project runs all specs; logged-in specs reuse the saved session.
 * - Console errors and failed requests fail tests (see fixtures.ts) so regressions
 *   are caught automatically instead of being reported manually.
 */
export default defineConfig({
  testDir: "./__tests__/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
      timeout: 180000,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".auth/e2e-test.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 180000,
  },
})
