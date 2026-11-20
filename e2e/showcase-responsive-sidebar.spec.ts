import { expect, test } from "@playwright/test";

const entry = "/shuomi/#/workbench";

test("desktop sidebar collapses to a compact, aligned icon rail at four sizes", async ({ page }) => {
  test.setTimeout(100000);
  for (const width of [1024, 1440, 1920, 2560]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(entry);
    const sidebar = page.locator(".showcase-sidebar");
    await expect(sidebar).toBeVisible();
    await page.getByRole("button", { name: "收窄侧栏" }).click();
    await expect(page.locator(".showcase-shell")).toHaveAttribute("data-sidebar-collapsed", "true");
    const actualWidth = await sidebar.evaluate(el => el.getBoundingClientRect().width);
    expect(actualWidth, `collapsed width at ${width}px`).toBeGreaterThanOrEqual(75);
    expect(actualWidth, `collapsed width at ${width}px`).toBeLessThanOrEqual(77);
    await expect(page.getByRole("button", { name: "展开侧栏" })).toBeVisible();
    await page.getByRole("button", { name: "展开侧栏" }).click();
    await expect.poll(
      () => sidebar.evaluate(el => el.getBoundingClientRect().width),
      { message: `expanded width at ${width}px` },
    ).toBeGreaterThanOrEqual(225);
  }
});

test("mobile and narrow desktop always have a visible menu opener and closable drawer", async ({ page }) => {
  test.setTimeout(100000);
  for (const width of [390, 568, 768, 900]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(entry);
    const open = page.getByRole("button", { name: "打开侧边栏" });
    const sidebar = page.locator(".showcase-sidebar");
    await expect(open, `menu opener at ${width}px`).toBeVisible();
    await open.click();
    await expect(sidebar).toHaveAttribute("data-mobile-open", "true");
    await expect(sidebar.getByRole("navigation", { name: "工作台导航" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sidebar).not.toHaveAttribute("data-mobile-open", "true");
    await open.click();
    await page.getByRole("button", { name: "关闭侧边栏" }).click();
    await expect(sidebar).not.toHaveAttribute("data-mobile-open", "true");
    await open.click();
    await page.getByRole("button", { name: "关闭导航菜单" }).click({ position: { x: width - 10, y: 60 } });
    await expect(sidebar).not.toHaveAttribute("data-mobile-open", "true");
  }
});

test("mobile drawer closes after navigation and remains usable across themes", async ({ page }) => {
  await page.setViewportSize({ width: 568, height: 900 });
  await page.goto(entry);
  await page.getByRole("button", { name: "切换浅色主题" }).click();
  await page.getByRole("button", { name: "打开侧边栏" }).click();
  const nav = page.getByRole("navigation", { name: "工作台导航" });
  await nav.getByRole("button", { name: "展开AI工作台" }).click();
  await nav.getByRole("link", { name: "任务中心" }).click();
  await expect(page).toHaveURL(/#\/workbench\/ai\/tasks$/);
  await expect(page.locator(".showcase-sidebar")).not.toHaveAttribute("data-mobile-open", "true");
  await expect(page.getByRole("button", { name: "打开侧边栏" })).toBeVisible();
});

test("desktop collapsed state can become a mobile drawer after resize", async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1440 });
  await page.goto(entry);
  await page.getByRole("button", { name: "收窄侧栏" }).click();
  await page.setViewportSize({ width: 568, height: 900 });
  await page.getByRole("button", { name: "打开侧边栏" }).click();
  const sidebar = page.locator(".showcase-sidebar");
  await expect(sidebar).toHaveAttribute("data-mobile-open", "true");
  await expect(sidebar.locator(".console-brand-label")).toBeVisible();
  await expect(sidebar.getByRole("link", { name: "AI工作台" })).toBeVisible();
});
