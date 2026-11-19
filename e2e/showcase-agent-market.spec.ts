import { test, expect } from "@playwright/test";
const base = "/shuomi/#/workbench/agents";
test("market shows all eight agents, filters, reset and centered desktop layout", async ({ page }) => {
  await page.setViewportSize({ width: 2560, height: 1440 });
  await page.goto(base + "/market");
  await expect(page.getByRole("heading", { name: "智能体市场", exact: true })).toBeVisible();
  const cards = page.locator('[class*="agentCards"] article');
  await expect(cards).toHaveCount(8);
  const content = await page.locator('[class*="agentMarketReference"]').boundingBox();
  expect(content).not.toBeNull();
  expect(content!.width).toBeLessThanOrEqual(1601);
  expect(content!.x).toBeGreaterThan(250);
  await page.getByRole("button", { name: "商品", exact: true }).click();
  await expect(cards).toHaveCount(1);
  await page.locator('[class*="agentFilters"] input').fill("POD");
  await expect(cards).toHaveCount(0);
  await page.getByRole("button", { name: "重置" }).click();
  await expect(cards).toHaveCount(8);
});
test("market introduction opens and closes a dialog", async ({ page }) => {
  await page.goto(base + "/market");
  await page.getByRole("button", { name: "介绍", exact: true }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("my agents model settings opens and closes a dialog", async ({ page }) => {
  await page.goto(base + "/mine");
  await expect(page.getByRole("heading", { name: "我的智能体", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "模型设置", exact: true }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("customization has working request and progress entry points", async ({ page }) => {
  await page.goto(base + "/custom");
  await expect(page.getByRole("heading", { name: "智能体定制", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "提交定制需求" }).click();
  await expect(page).toHaveURL(/agents\/custom\/new/);
  await expect(page.getByLabel("需求名称")).toBeVisible();
  await page.getByRole("button", { name: "查看定制进度" }).click();
  await expect(page).toHaveURL(/agents\/custom\/progress/);
});


test("model setting selection is saved in this preview and can be reopened", async ({ page }) => {
  await page.goto(base + "/mine");
  await page.getByRole("button", { name: "模型设置", exact: true }).first().click();
  const modal = page.getByRole("dialog");
  await expect(modal).toContainText("官方模型");
  await expect(modal).toContainText("自定义模型");
  await modal.getByRole("button", { name: /自定义模型/ }).click();
  await expect(modal.getByRole("button", { name: /自定义模型/ })).toHaveAttribute("aria-pressed", "true");
  await modal.getByRole("button", { name: "保存设置" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "模型设置", exact: true }).first().click();
  await expect(page.getByRole("dialog").getByRole("button", { name: /自定义模型/ })).toHaveAttribute("aria-pressed", "true");
});
test("customization request requires consent, confirms demo-only save and shows progress", async ({ page }) => {
  await page.goto(base + "/custom/new");
  await page.getByLabel("需求名称").fill("测试智能体需求");
  await page.getByLabel("主要使用场景").fill("跨境店铺商品资料处理");
  await page.getByLabel("希望智能体完成什么？").fill("核对商品数据并整理结果");
  await page.getByLabel("联系人", { exact: true }).fill("测试员");
  await page.getByLabel("手机或微信").fill("demo-contact");
  const submit = page.locator("form").getByRole("button", { name: "提交定制需求" });
  await expect(submit).toBeDisabled();
  await page.getByRole("checkbox").check();
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.getByRole("dialog")).toContainText("不会向硕米平台真实提交");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(submit).toBeFocused();
  await submit.click();
  await page.getByRole("dialog").getByRole("button", { name: "取消" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await submit.click();
  await page.getByRole("dialog").getByRole("button", { name: "确认保存演示记录" }).click();
  await expect(page).toHaveURL(/agents\/custom\/progress/);
  await expect(page.getByText("测试智能体需求")).toBeVisible();
  await expect(page.getByText(/本地演示需求/)).toBeVisible();
});
test("intelligent market submenus can be reached via sidebar navigation", async ({ page }) => {
  await page.goto(base + "/market");
  await page.getByRole("link", { name: "我的智能体", exact: true }).click();
  await expect(page).toHaveURL(/agents\/mine/);
  await page.getByRole("link", { name: "智能体定制", exact: true }).click();
  await expect(page).toHaveURL(/agents\/custom$/);
  await page.getByRole("button", { name: "查看定制进度" }).click();
  await expect(page).toHaveURL(/agents\/custom\/progress/);
});
test("market cards and customization page do not overflow the desktop viewport", async ({ page }) => {
  for (const route of ["/market", "/mine", "/custom", "/custom/new", "/custom/progress"]) {
    await page.setViewportSize({ width: 2560, height: 1440 });
    await page.goto(base + route);
    const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(dimensions.scroll, route).toBeLessThanOrEqual(dimensions.client + 2);
  }
});
