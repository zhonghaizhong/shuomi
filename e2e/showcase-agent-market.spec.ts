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
  await expect(modal.getByRole("heading", { name: "自定义模型" })).toBeVisible();
  await modal.getByRole("button", { name: "测试连接" }).click();
  await expect(modal.getByRole("status")).toContainText("请填写");
  await modal.getByRole("textbox", { name: "模型服务商" }).fill("演示供应商");
  await modal.getByRole("textbox", { name: "模型名称" }).fill("demo-model");
  await modal.getByLabel("API Key").fill("demo-key-not-real");
  await modal.getByRole("button", { name: "测试连接" }).click();
  await expect(modal.getByRole("status")).toContainText("尚未连接模型服务");
  await modal.getByRole("button", { name: "保存并启用" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "模型设置", exact: true }).first().click();
  await expect(page.getByRole("dialog").getByRole("button", { name: /自定义模型/ })).toHaveAttribute("aria-pressed", "true");
});
test("customization request requires consent, confirms demo-only save and shows progress", async ({ page }) => {
  await page.goto(base + "/custom/new");
  await page.getByLabel("需求名称").fill("测试智能体需求");
  await page.getByLabel("主要使用场景").selectOption({label:"商品与供应链管理"});
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

test("enter use opens Figma-based skill, knowledge and image configuration without creating a real task",async({page})=>{
 await page.goto(base+"/mine");
 await page.getByRole("button",{name:"进入使用"}).first().click();
 const dialog=page.getByRole("dialog",{name:"商品优化智能体"});
 await expect(dialog).toContainText("步骤 1 · 选择技能（可选）");
 await expect(dialog).toContainText("步骤 2 · 选择知识库（可选）");
 await expect(dialog).toContainText("步骤 3 · 配置图片优化（按需）");
 await dialog.getByRole("checkbox",{name:"标题优化"}).check();
 await dialog.getByRole("checkbox",{name:"平台规则"}).check();
 await dialog.getByRole("button",{name:"开启"}).click();
 await dialog.getByRole("button",{name:"保存为模板"}).click();
 await expect(dialog.getByRole("status")).toContainText("请先填写图片优化设置");
 await dialog.getByRole("textbox",{name:"图片优化指令"}).fill("只优化主图，不修改商品规格");
 await dialog.getByRole("button",{name:"设置图片优化"}).click();
 await dialog.getByRole("button",{name:"预览优化范围"}).click();
 await expect(dialog.getByRole("status")).toContainText("标题优化");
 await dialog.getByRole("button",{name:"保存为模板"}).click();
 await expect(dialog).toHaveCount(0);
 await expect(page.getByRole("status")).toContainText("已保存为模板");
 await page.getByRole("button",{name:"进入使用"}).last().click();
 await expect(page.getByRole("dialog",{name:"POD刊登智能体"})).toContainText("步骤 4 · 保存模板");
 await page.keyboard.press("Escape");
 await expect(page.getByRole("dialog")).toHaveCount(0);
});
