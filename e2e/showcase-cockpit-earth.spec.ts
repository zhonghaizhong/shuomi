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


test("cockpit quick actions navigate to the intended existing pages", async ({ page }) => {
  await page.goto(cockpit);
  await page.getByRole("button", { name: "查看全部预警" }).click();
  await expect(page).toHaveURL(/#\/workbench\/overview\/alerts/);
  await page.goto(cockpit);
  await page.getByRole("button", { name: "查看全部店铺" }).click();
  await expect(page).toHaveURL(/#\/workbench\/overview\/stores/);
  for (const [action, route] of [["查看进度", "running"], ["去确认", "pending"]]) {
    await page.goto(cockpit);
    await page.getByRole("button", { name: action, exact: true }).click();
    await expect(page).toHaveURL(new RegExp("#/workbench/ai/tasks/" + route));
  }
  await page.goto(cockpit);
  await page.getByRole("button", { name: "去处理" }).click();
  await expect(page).toHaveURL(/#\/workbench\/overview\/alerts/);
});

test("cockpit second-level navigation keeps correct targets and active path during repeated switches", async ({ page }) => {
  await page.goto(cockpit);
  const nav = page.getByRole("navigation", { name: "工作台导航" });
  const routes = [
    ["目标管理", "goals"],
    ["店铺矩阵", "stores"],
    ["经营预警", "alerts"],
    ["经营建议", "advice"],
  ];
  for (const [label, route] of [...routes, ...routes.slice().reverse()]) {
    await nav.getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp("#/workbench/overview/" + route + "$"));
    await expect(nav.getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "page");
    await expect(nav.getByRole("button", { name: "收起运营驾驶舱" })).toHaveAttribute("aria-expanded", "true");
  }
  await nav.getByRole("link", { name: "运营驾驶舱", exact: true }).click();
  await expect(page).toHaveURL(/#\/workbench$/);
  await nav.getByRole("button", { name: "收起运营驾驶舱" }).click();
  await expect(nav.getByRole("button", { name: "展开运营驾驶舱" })).toHaveAttribute("aria-expanded", "false");
  await nav.getByRole("button", { name: "展开运营驾驶舱" }).click();
  await expect(nav.getByRole("link", { name: "经营预警", exact: true })).toBeVisible();
});


test("Vuexy light theme gives all cockpit subpages white panels and readable content", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const pages = [
    { route: "goals", panel: '[class*="goalPanel"]', content: '[class*="goalRow"]' },
    { route: "stores", panel: '[class*="matrixPanel"]', content: '[class*="matrixRow"]' },
    { route: "alerts", panel: '[class*="matrixPanel"]', content: '[class*="alertRow"]' },
    { route: "advice", panel: '[class*="adviceDetail"]', content: '[class*="adviceOptions"] button' },
  ];
  await page.goto("/shuomi/#/workbench/overview/goals");
  await page.getByRole("button", { name: "切换浅色主题" }).click();
  for (const item of pages) {
    await page.goto("/shuomi/#/workbench/overview/" + item.route);
    await expect(page.locator(".light .showcase-shell")).toBeVisible();
    const shellBg = await page.locator(".showcase-shell").evaluate(el => getComputedStyle(el).backgroundColor);
    const sidebarBg = await page.locator(".console-sidebar").evaluate(el => getComputedStyle(el).backgroundColor);
    const panelBg = await page.locator(item.panel).first().evaluate(el => getComputedStyle(el).backgroundColor);
    const text = await page.locator(item.panel).first().evaluate(el => getComputedStyle(el).color);
    expect(shellBg).toBe("rgb(248, 247, 250)");
    expect(sidebarBg).toBe("rgb(255, 255, 255)");
    expect(panelBg).toBe("rgb(255, 255, 255)");
    expect(text).not.toBe("rgb(207, 205, 228)");
    const contentBg = await page.locator(item.content).first().evaluate(el => getComputedStyle(el).backgroundColor);
    expect(contentBg).not.toBe("rgb(47, 51, 73)");
    await page.screenshot({ path: "test-results/cockpit-light-" + item.route + ".png", fullPage: true });
  }
});


const lightModules: Array<[string,string]> = [
  ["/workbench/supply",'[class*="supplyCard"]:not([class*="supplyCards"])'],
  ["/workbench/data",'[class*="dataCard"]:not([class*="dataCards"])'],
  ["/workbench/store-center",'[class*="storeModule"]'],
  ["/workbench/plans",'[class*="planOverview"]'],
  ["/workbench/account",'[class*="accountOverview"]'],
  ["/workbench/ai",'[class*="aiCards"] article'],
  ["/workbench/ai/tasks",'[class*="taskTable"]'],
  ["/workbench/agents",'[class*="dataCard"]:not([class*="dataCards"])'],
  ["/workbench/agents/market",'[class*="agentCards"] article'],
  ["/workbench/agents/mine",'[class*="agentMine"] > article > section'],
  ["/workbench/ai/projects",'[class*="metrics"] > article'],
  ["/workbench/ai/knowledge",'[class*="metrics"] > article'],
  ["/workbench/ai/reports",'[class*="metrics"] > article'],
  ["/workbench/tools",'[class*="entry"]'],
  ["/workbench/tools/official",'[class*="toolCard"]'],
  ["/workbench/services",'[class*="homeCard"]:not([class*="homeCards"])'],
  ["/workbench/services/market",'[class*="serviceCard"]'],
];

for (const [start, end] of [[0, 6], [6, 12], [12, lightModules.length]]) {
  test(`light theme across workbench pages ${start + 1}-${end}: no dark cards`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/shuomi/#/workbench/overview/advice");
    await page.getByRole("button", { name: "切换浅色主题" }).click();
    for (const [route, selector] of lightModules.slice(start, end)) {
      await page.goto("/shuomi/#" + route);
      await expect(page.locator(".light .showcase-shell")).toBeVisible();
      const card = page.locator(selector).first();
      await expect(card).toBeVisible();
      const rgb = await card.evaluate(el => getComputedStyle(el).backgroundColor);
      const values = rgb.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [];
      const channels = rgb.startsWith("color(srgb") ? values.map(value => value * 255) : values;
      expect(channels.length, route + ": card color missing").toBe(3);
      expect(rgb, route + ": card background transparent").not.toBe("rgba(0, 0, 0, 0)");
      expect(Math.min(...channels), route + ": dark card background " + rgb).toBeGreaterThan(190);
    }
  });
}

test("switching themes preserves menus and light-page selected card interaction", async ({ page }) => {
  await page.goto("/shuomi/#/workbench/tools");
  await page.getByRole("button", { name: "切换浅色主题" }).click();
  const nav = page.getByRole("navigation", { name: "工作台导航" });
  await nav.getByRole("button", { name: "展开运营驾驶舱" }).click();
  await nav.getByRole("link", { name: "经营建议", exact: true }).click();
  await expect(page).toHaveURL(new RegExp("#/workbench/overview/advice$"));
  await expect(page.locator(".light .showcase-shell")).toBeVisible();
  await page.getByRole("button", { name: /转化率下降/ }).click();
  await expect(page.getByRole("heading", { name: "转化率下降" })).toBeVisible();
  await page.getByRole("button", { name: "切换深色主题" }).click();
  await expect(page.locator(".dark .showcase-shell")).toBeVisible();
  await page.getByRole("button", { name: "切换浅色主题" }).click();
  await expect(page.locator(".light .showcase-shell")).toBeVisible();
});
