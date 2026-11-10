import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./examples/vanilla-ui/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    trace: "retain-on-failure",
  },
  projects: [
    { name: "vanilla-chromium", use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:5174" } },
    { name: "vanilla-firefox", use: { ...devices["Desktop Firefox"], baseURL: "http://127.0.0.1:5174" } },
    { name: "vanilla-webkit", use: { ...devices["Desktop Safari"], baseURL: "http://127.0.0.1:5174" } },
  ],
  webServer: {
    command: "pnpm --filter @rowlith/example-vanilla-ui dev",
    url: "http://127.0.0.1:5174",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
