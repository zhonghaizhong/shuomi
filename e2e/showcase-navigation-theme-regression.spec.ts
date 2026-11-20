import { expect, test } from "@playwright/test";

const base = "/shuomi/#/workbench";
const groups = [
  ["运营驾驶舱", "/overview/goals"],
  ["AI工作台", "/ai/tasks"],
  ["供应市场", "/supply/catalogs"],
  ["智能市场", "/agents/market"],
  ["工具市场", "/tools/official"],
  ["生态服务", "/services/market"],
  ["数据服务", "/data/market"],
  ["店铺中心", "/stores"],
  ["套餐与权益", "/plans/options"],
  ["我的账户", "/account/profile"],
] as const;

test("main and nested navigation: repeated expansion, routing and browser history", async ({ page }) => {
  test.setTimeout(120000);
  await page.goto(base);
  const nav = page.getByRole("navigation", { name: "工作台导航" });
  for (const [label, route] of groups) {
    const expand = nav.getByRole("button", { name: `展开${label}` });
    const collapse = nav.getByRole("button", { name: `收起${label}` });
    if (await expand.count()) await expand.click();
    await expect(nav.getByRole("button", { name: `收起${label}` })).toHaveAttribute("aria-expanded", "true");
    const link = nav.locator(`a[href$="#/workbench${route}"]`).first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(new RegExp(`#/workbench${route.replaceAll("/", "\\/")}$`));
    await expect(page.locator("main.showcase-content")).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(/#\/workbench$/);
    const toggle = nav.getByRole("button", { name: `收起${label}` });
    if (await toggle.count()) {
      await toggle.click();
      await expect(nav.getByRole("button", { name: `展开${label}` })).toHaveAttribute("aria-expanded", "false");
    }
  }
});

test("collapsed sidebar keeps navigation usable in both themes and all toggle states", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(base);
  for (const light of [false, true]) {
    if (light) await page.getByRole("button", { name: "切换浅色主题" }).click();
    const toggle = page.getByRole("button", { name: "收窄侧栏" });
    await toggle.click();
    const shell = page.locator(".showcase-shell");
    await expect(shell).toHaveAttribute("data-sidebar-collapsed", "true");
    const side = page.locator(".showcase-sidebar");
    const width = await side.evaluate(el => el.getBoundingClientRect().width);
    expect(width, "collapsed sidebar should be compact, not a full-width empty column").toBeGreaterThanOrEqual(72);
    expect(width).toBeLessThanOrEqual(80);
    const menuItems = side.locator(".console-nav-level-1 > .console-nav-row > a");
    const menuBox = await menuItems.first().boundingBox();
    const sideBox = await side.boundingBox();
    expect(menuBox).not.toBeNull();
    expect(sideBox).not.toBeNull();
    expect(Math.abs(menuBox!.x + menuBox!.width / 2 - (sideBox!.x + sideBox!.width / 2))).toBeLessThanOrEqual(4);
    const background = await side.evaluate(el => getComputedStyle(el).backgroundColor);
    if (light) expect(background).not.toBe("rgb(12, 20, 39)");
    await page.getByRole("button", { name: "展开侧栏" }).click();
    await expect(shell).not.toHaveAttribute("data-sidebar-collapsed", "true");
    await expect(page.getByRole("navigation", { name: "工作台导航" }).getByRole("link", { name: "AI工作台" })).toBeVisible();
  }
});

test("light and dark modes apply to the document and interactive overlays", async ({ page }) => {
  await page.goto(base + "/data");
  for (const [themeButton, rootClass] of [["切换浅色主题", "light"], ["切换深色主题", "dark"]] as const) {
    await page.getByRole("button", { name: themeButton }).click();
    await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${rootClass}\\b`));
    await page.getByRole("button", { name: "联系客服" }).click();
    const dialog = page.getByRole("dialog", { name: "硕米客服" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await page.getByRole("button", { name: "示例用户账户" }).click();
    await expect(page.getByRole("dialog", { name: "账户快捷操作" })).toBeVisible();
    await page.keyboard.press("Escape");
  }
});
