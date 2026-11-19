import { expect, test } from "@playwright/test";

const cockpit = "/shuomi/#/workbench";

test("purple cockpit hero loads a real textured 3D globe without a GIF", async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1440 });
  await page.goto(cockpit);
  await expect(page.locator('[data-dashboard="operations"]')).toBeVisible();
  const globe = page.locator('[data-dashboard="operations"] canvas[data-globe-status]');
  await expect(globe).toHaveAttribute("data-globe-status", "ready", { timeout: 30000 });
  await expect(globe).toHaveAttribute("data-globe-clouds", "ready", { timeout: 30000 });
  const earthMap = await page.request.get("http://127.0.0.1:4173/shuomi/assets/cockpit/earth-blue-marble.jpg");
  const cloudsMap = await page.request.get("http://127.0.0.1:4173/shuomi/assets/cockpit/earth-clouds.png");
  expect(earthMap.ok()).toBe(true);
  expect(cloudsMap.ok()).toBe(true);
  await expect(globe).toBeVisible();
  const hero = page.locator('article[class*="overviewFeature"]');
  const heroBox = await hero.boundingBox();
  const globeBox = await globe.boundingBox();
  expect(heroBox).not.toBeNull();
  expect(globeBox).not.toBeNull();
  expect(globeBox!.width).toBeGreaterThanOrEqual(130);
  expect(globeBox!.width).toBeLessThanOrEqual(201);
  expect(globeBox!.x).toBeGreaterThan(heroBox!.x);
  expect(globeBox!.x + globeBox!.width).toBeLessThanOrEqual(heroBox!.x + heroBox!.width + 1);
  await expect(page.locator('[class*="overviewGlobe"] svg')).toHaveCount(0);
  await expect(page.getByRole("heading", {name:"经营全局 · 一屏掌握"})).toBeVisible();
  await expect(page.getByText("汇聚多店铺经营表现、核心指标与风险动态，让每一次决策都有清晰依据。")).toBeVisible();
  const copy = await page.locator('[class*="overviewFeature"] [class*="heroCopy"]').boundingBox();
  expect(copy).not.toBeNull();
  expect(copy!.x + copy!.width).toBeLessThanOrEqual(globeBox!.x + 2);
  await page.screenshot({path:"test-results/cockpit-hero-2560.png",fullPage:true});
  await globe.screenshot({ path: "test-results/globe-3d-loaded.png" });
});

test("Earth visibly rotates between real-time frames", async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1440 });
  await page.goto(cockpit);
  const globe = page.locator('canvas[data-globe-status]');
  await expect(globe).toHaveAttribute("data-globe-status", "ready", { timeout: 30000 });
  await expect(globe).toHaveAttribute("data-globe-clouds", "ready", { timeout: 30000 });
  const first = await globe.screenshot();
  await page.waitForTimeout(1800);
  const second = await globe.screenshot();
  expect(first.equals(second)).toBe(false);
});

test("prefers reduced motion keeps globe still, without layout changes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 2560, height: 1440 });
  await page.goto(cockpit);
  const globe = page.locator('canvas[data-globe-status]');
  await expect(globe).toHaveAttribute("data-globe-status", "ready", { timeout: 30000 });
  await expect(globe).toHaveAttribute("data-globe-clouds", "ready", { timeout: 30000 });
  const first = await globe.screenshot();
  await page.waitForTimeout(750);
  const second = await globe.screenshot();
  expect(first.equals(second)).toBe(true);
});
