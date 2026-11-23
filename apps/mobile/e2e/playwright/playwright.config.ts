import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 180_000,
  workers: 1,
  reporter: "list",
  use: { baseURL: "http://localhost:4173", browserName: "chromium" },
  webServer: {
    command: "node scripts/serve-web.mjs",
    url: "http://localhost:4173",
    cwd: "../..",
    reuseExistingServer: true,
  },
});
