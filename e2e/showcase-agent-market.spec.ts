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
