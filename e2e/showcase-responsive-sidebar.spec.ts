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


test("light-mode chat collections never retain dark background colors", async ({ page }) => {
  for (const route of ["/ai/chat/recent", "/ai/chat/saved"]) {
    await page.goto(entry + route);
    const enableLight = page.getByRole("button", { name: "切换浅色主题" });
    if (await enableLight.isVisible()) await enableLight.click();
    await expect(page.locator("html")).toHaveClass(/light/);
    const input = page.getByPlaceholder(/搜索.*标题或内容/);
    await expect(input).toBeVisible();
    const listRow = page.locator("main.showcase-content article").first();
    await expect(listRow).toBeVisible();
    const surfaces = await page.evaluate(() => {
      const input = document.querySelector("main.showcase-content input[placeholder]")!;
      const search = input.parentElement!;
      const list = document.querySelector("main.showcase-content article")!.parentElement!;
      const title = list.querySelector("article strong")!;
      const parse = (s: string) => (s.match(/[0-9.]+/g) ?? []).slice(0,3).map(Number);
      return {
        search: parse(getComputedStyle(search).backgroundColor),
        input: parse(getComputedStyle(input).backgroundColor),
        list: parse(getComputedStyle(list).backgroundColor),
        title: parse(getComputedStyle(title).color),
      };
    });
    for (const name of ["search","input","list"] as const) {
      const rgb = surfaces[name];
      expect(rgb.length, `${route}: ${name} must have an opaque surface`).toBe(3);
      expect(rgb[0] + rgb[1] + rgb[2], `${route}: ${name} must be light`).toBeGreaterThan(600);
    }
    expect(surfaces.title[0] + surfaces.title[1] + surfaces.title[2], `${route}: title must be dark`).toBeLessThan(400);
  }
});

test("my listing and all stages are nested beneath my stores", async ({ page }) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto(entry);
  const nav=page.getByRole("navigation",{name:"工作台导航"});
  await nav.getByRole("button",{name:"展开供应市场"}).click();
  for(const label of ["硕米自营","硕米优选","货盘集成","优选申请"]) {
    await expect(nav.getByRole("link",{name:label,exact:true})).toBeVisible();
  }
  await expect(nav.getByRole("link",{name:"刊登管理",exact:true})).toHaveCount(0);
  await nav.getByRole("button",{name:"展开店铺中心"}).click();
  const stores=nav.getByRole("link",{name:"我的店铺",exact:true});
  const listing=nav.getByRole("link",{name:"刊登管理",exact:true});
  await expect(stores).toBeVisible();
  await expect(listing).toBeVisible();
  await expect(stores.locator("xpath=ancestor::li[1]")).toHaveClass(/console-nav-level-2/);
  await expect(listing.locator("xpath=ancestor::li[1]")).toHaveClass(/console-nav-level-2/);
  await expect(nav.getByRole("button",{name:"展开我的店铺"})).toHaveCount(0);
  await nav.getByRole("button",{name:"展开刊登管理"}).click();
  const stages = [
    ["待上传","waiting"],
    ["待补全","missing"],
    ["待审核","review"],
    ["已上传","uploaded"],
  ] as const;
  for(const [label,route] of stages) {
    const stage=nav.getByRole("link",{name:label,exact:true});
    await expect(stage).toBeVisible();
    await stage.click();
    await expect(page).toHaveURL(new RegExp("#/workbench/listing/"+route+"(?:[?]|$)"));
    await expect(page.locator("main.showcase-content")).toBeVisible();
    await expect(nav.getByRole("button",{name:"收起刊登管理"})).toBeVisible();
  }
  await nav.getByRole("button",{name:"收起刊登管理"}).click();
  await expect(nav.getByRole("button",{name:"展开刊登管理"})).toBeVisible();
});

test("supply overview describes sourcing without publishing management", async ({page})=>{
  await page.goto(entry+"/supply");
  const main=page.locator("main.showcase-content");
  await expect(main.getByRole("heading",{name:"发现优质货源，连接多元供货渠道"})).toBeVisible();
  for(const name of ["硕米自营","硕米优选","货盘集成","优选申请"]) {
    await expect(main.getByRole("heading",{name,exact:true})).toBeVisible();
  }
  await expect(main.getByRole("heading",{name:"我的供应链"})).toHaveCount(0);
  await expect(main.getByRole("heading",{name:"刊登管理"})).toHaveCount(0);
  await expect(main.getByText("完成平台适配与审核")).toHaveCount(0);
});

test("listing management overview follows Figma entry and conditional flow", async ({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto(entry+"/listing");
 const overview=page.locator("[data-listing-management-overview]");
 await expect(overview.getByRole("heading",{name:"从商品数据到平台上传的统一管理"})).toBeVisible();
 for(const name of ["商品数据","待上传配置","上传记录","选择商品","选择目标店铺","配置规则与智能体","确认提交","待补全 · 必填信息补齐后继续","待审核 · 应用后明确继续上传"]){
   await expect(overview.getByRole("heading",{name,exact:true})).toBeVisible();
 }
 await expect(overview.getByText("适配规则必选；智能体按需使用")).toBeVisible();
 await expect(overview.getByText(/系统定时发送未开放/)).toBeVisible();
 await overview.getByRole("button",{name:"进入待上传"}).click();
 await expect(page).toHaveURL(/#\/workbench\/listing\/waiting/);
 await page.goto(entry+"/listing");
 await overview.getByRole("button",{name:"进入待补全"}).click();
 await expect(page).toHaveURL(/#\/workbench\/listing\/missing/);
 await page.goto(entry+"/listing");
 await overview.getByRole("button",{name:"进入待审核"}).click();
 await expect(page).toHaveURL(/#\/workbench\/listing\/review/);
 await page.goto(entry+"/listing");
 await overview.getByRole("button",{name:"查看已上传"}).click();
 await expect(page).toHaveURL(/#\/workbench\/listing\/uploaded/);
});

test("listing four-stage Figma flow has distinct functional screens",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto(entry+"/listing/waiting");
 const waiting=page.locator('[data-listing-stage="waiting"]');
 await expect(waiting.getByRole("heading",{name:"商品上传流程"})).toBeVisible();
 await expect(waiting.getByRole("heading",{name:"选择商品"})).toBeVisible();
 await expect(waiting.getByRole("heading",{name:"目标平台与店铺"})).toBeVisible();
 await expect(waiting.getByRole("heading",{name:"启用规则"})).toBeVisible();
 await expect(waiting.getByRole("heading",{name:"启用智能体"})).toBeVisible();
 await expect(waiting.getByRole("button",{name:"确认提交"})).toBeDisabled();
 await waiting.getByLabel("本次批次 / 产品集").selectOption("美国站商品");
 await waiting.getByLabel("本次目标店铺").selectOption("一号店 · 全托");
 await expect(waiting.getByRole("button",{name:"确认提交"})).toBeEnabled();
 await waiting.getByRole("button",{name:"确认提交"}).click();
 await expect(waiting.getByRole("status")).toContainText("演示任务已配置");
 await waiting.getByRole("button",{name:"待补全",exact:true}).click();
 const missing=page.locator('[data-listing-stage="missing"]');
 await expect(missing.getByRole("heading",{name:"商品列表（共 4 个演示商品）"})).toBeVisible();
 await missing.getByRole("button",{name:"查看并补全"}).first().click();
 const dialog=page.getByRole("dialog",{name:"查看并补全"});
 await expect(dialog.getByText("商品品牌（必填）")).toBeVisible();
 await dialog.getByRole("button",{name:"返回列表"}).click();
 await missing.getByRole("button",{name:"待审核",exact:true}).click();
 const review=page.locator('[data-listing-stage="review"]');
 await expect(review.getByRole("heading",{name:"为什么需要人工审核 AI 建议？"})).toBeVisible();
 await review.getByRole("button",{name:"审核 AI 建议"}).first().click();
 await expect(page.getByRole("dialog",{name:"审核智能体建议"})).toBeVisible();
 await page.getByRole("button",{name:"返回列表"}).click();
 await review.getByRole("button",{name:"已上传",exact:true}).click();
 await expect(page.locator("[data-showcase-uploaded]")).toBeVisible();
 await expect(page.getByText(/已上传记录只读/)).toBeVisible();
});
