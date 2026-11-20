import {defineConfig,devices} from "@playwright/test";
export default defineConfig({
 testDir:"./e2e",testMatch:["showcase-goal-actions.spec.ts","showcase-cross-module-actions.spec.ts","showcase-light-library-theme.spec.ts","showcase-theme-persistence.spec.ts","showcase-light-supply-submenus.spec.ts"],
 timeout:90000,expect:{timeout:12000},retries:0,reporter:"line",
 use:{baseURL:"http://127.0.0.1:4173",screenshot:"only-on-failure",trace:"retain-on-failure",...devices["Desktop Chrome"]},
 webServer:{command:"pnpm exec vite preview --config vite.pages.config.ts --host 127.0.0.1 --port 4173",url:"http://127.0.0.1:4173/shuomi/",reuseExistingServer:false,timeout:45000},
});
