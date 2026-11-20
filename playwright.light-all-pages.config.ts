import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir:"./e2e",
  testMatch:"showcase-light-all-pages.spec.ts",
  timeout:120000,
  retries:0,
  workers:2,
  reporter:[["line"],["json",{outputFile:"test-results/light-audit-report.json"}]],
  outputDir:"test-results/light-audit",
  use:{
    baseURL:"http://127.0.0.1:4173",
    screenshot:"only-on-failure",
    trace:"retain-on-failure",
    ...devices["Desktop Chrome"]
  },
  webServer:{
    command:"pnpm exec vite preview --config vite.pages.config.ts --host 127.0.0.1 --port 4173",
    url:"http://127.0.0.1:4173/shuomi/",
    reuseExistingServer:false,
    timeout:60000
  }
});
