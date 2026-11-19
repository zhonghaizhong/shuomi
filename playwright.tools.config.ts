import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  testMatch: "showcase-tool-market.spec.ts",
  reporter: "line",
  timeout: 25000,
  use: { baseURL: "http://127.0.0.1:4173", screenshot: "only-on-failure", trace: "retain-on-failure", ...devices["Desktop Chrome"] },
  webServer: { command: "pnpm exec vite preview --config vite.pages.config.ts --host 127.0.0.1 --port 4173", url: "http://127.0.0.1:4173/shuomi/", reuseExistingServer: false, timeout: 45000 },
});
