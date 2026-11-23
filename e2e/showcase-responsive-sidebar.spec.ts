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
 await expect(waiting.getByRole("heading",{name:"智能体（按需）"})).toBeVisible();
 await expect(waiting.getByRole("button",{name:"直接上传到平台"})).toBeDisabled();
 await expect(waiting.getByLabel("本次批次 / 产品集")).toHaveValue("");
 await expect(waiting.getByRole("button",{name:"确认目标店铺"})).toBeVisible();
 await expect(waiting.getByRole("button",{name:"直接上传到平台"})).toBeDisabled();
 // The waiting screen deliberately keeps stage navigation hidden until a task exists.\n await page.goto(entry+"/listing/missing");
 const missing=page.locator('[data-listing-stage="missing"]');
 await expect(missing.getByRole("heading",{name:"商品列表（共 0 个商品）"})).toBeVisible();
 await expect(missing.getByRole("status")).toContainText("暂无商品记录");
 await missing.getByRole("button",{name:"待审核",exact:true}).click();
 const review=page.locator('[data-listing-stage="review"]');
 await expect(review.getByRole("heading",{name:"为什么需要人工审核 AI 建议？"})).toBeVisible();
 await expect(review.getByRole("heading",{name:"商品列表（共 0 个商品）"})).toBeVisible();
 await expect(review.getByRole("status")).toContainText("暂无商品记录");
 await review.getByRole("button",{name:"已上传",exact:true}).click();
 await expect(page.locator("[data-showcase-uploaded]")).toBeVisible();
 await expect(page.locator("[data-showcase-uploaded]")).toContainText("暂无已上传商品记录");
});

test("listing overview uses aligned Vuexy cards and readable theme surfaces",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto(entry+"/listing");
 const root=page.locator('[data-listing-management-overview]');
 await expect(root.getByRole("heading",{name:"从商品数据到平台上传的统一管理"})).toBeVisible();
 const cards=root.locator('section[aria-label="刊登管理主要入口"] article');
 await expect(cards).toHaveCount(3);
 const rects=await cards.evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {top:r.top,width:r.width,height:r.height}}));
 expect(Math.max(...rects.map(x=>x.top))-Math.min(...rects.map(x=>x.top))).toBeLessThan(2);
 expect(Math.max(...rects.map(x=>x.width))-Math.min(...rects.map(x=>x.width))).toBeLessThan(2);
 expect(Math.max(...rects.map(x=>x.height))-Math.min(...rects.map(x=>x.height))).toBeLessThan(2);
 const stepCards=root.locator('section[aria-labelledby="listing-main-flow"] article');
 await expect(stepCards).toHaveCount(4);
 const stepTops=await stepCards.evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().top));
 expect(Math.max(...stepTops)-Math.min(...stepTops)).toBeLessThan(2);
 const enableLight=page.getByRole("button",{name:"切换浅色主题"});
 if(await enableLight.isVisible())await enableLight.click();
 const background=await cards.first().evaluate(el=>getComputedStyle(el).backgroundColor);
 expect(background).toBe("rgb(255, 255, 255)");
 const button=cards.first().getByRole("button");
 await expect(button).toBeVisible();
 const height=await button.evaluate(el=>el.getBoundingClientRect().height);
 expect(height).toBeGreaterThanOrEqual(40);
 await page.setViewportSize({width:390,height:844});
 await expect(cards.first()).toBeVisible();
 const overflow=await root.evaluate(el=>el.scrollWidth>el.clientWidth+2);
 expect(overflow).toBe(false);
});


test("listing four subpages share aligned Vuexy typography, cards and controls",async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  for(const route of ["waiting","missing","review","uploaded"]){
    await page.goto(entry+"/listing/"+route);
    const enableDark=page.getByRole("button",{name:"切换深色主题"});
    if(await enableDark.isVisible())await enableDark.click();
    const root=route==="uploaded"?page.locator("[data-showcase-uploaded]"):page.locator('[data-listing-stage="'+route+'"]');
    await expect(root).toBeVisible();
    const heading=root.locator("header").first();
    const bg=await heading.evaluate(el=>getComputedStyle(el).backgroundColor);
    expect(bg,route+" must use dark card surface initially").toBe("rgb(47, 51, 73)");
    const headingFont=await root.locator("h1").first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
    expect(headingFont,route+" title must be readable").toBeGreaterThanOrEqual(26);
    const contentWidth=await root.evaluate(el=>el.getBoundingClientRect().width);
    expect(contentWidth).toBeLessThanOrEqual(1601);
    if(route==="waiting"){
      const cards=root.locator('section[class*="configuration"] > article');
      await expect(cards).toHaveCount(4);
      const tops=await cards.evaluateAll(nodes=>nodes.map(el=>el.getBoundingClientRect().top));
      expect(Math.max(...tops)-Math.min(...tops)).toBeLessThan(2);
    }
    if(route==="missing"||route==="review"){
      const cards=root.locator('section[class*="summary"]');
      if(route==="missing")await expect(cards.locator("article")).toHaveCount(4);
      const source=root.getByRole("combobox",{name:"商品来源"});
      await source.selectOption("自有商品库");
      await root.getByRole("button",{name:"确认",exact:true}).first().click();
      await expect(root.getByRole("heading",{name:"商品列表（共 0 个商品）"})).toBeVisible();
      await root.getByRole("button",{name:"重置"}).click();
      await expect(root.getByRole("heading",{name:"商品列表（共 0 个商品）"})).toBeVisible();
    }
    const enableLight=page.getByRole("button",{name:"切换浅色主题"});
    if(await enableLight.isVisible())await enableLight.click();
    const lightBg=await heading.evaluate(el=>getComputedStyle(el).backgroundColor);
    expect(lightBg,route+" light title background").toBe("rgb(255, 255, 255)");
    const darkText=await root.locator("h1").first().evaluate(el=>getComputedStyle(el).color);
    expect(darkText,route+" light heading contrast").toBe("rgb(68, 64, 80)");
    const inputs=route==="waiting"?root.locator("select"):root.locator("input,select");
    await expect(inputs.first()).toBeVisible();
    const inputHeight=await inputs.first().evaluate(el=>el.getBoundingClientRect().height);
    expect(inputHeight).toBeGreaterThanOrEqual(40);
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto(entry+"/listing/missing");
  const root=page.locator('[data-listing-stage="missing"]');
  const spill=await root.evaluate(el=>el.scrollWidth>el.clientWidth+2);
  expect(spill,"horizontal overflow stays within the internal table").toBe(false);
});

test("account left sidebar only shows three second-level entries while right-side tabs navigate",async({page})=>{
 await page.goto(entry+"/account/profile/settings");
 const sidebar=page.getByRole("navigation",{name:"工作台导航"});
 for(const label of ["账户资料","企业空间","推广与收益"]){
  await expect(sidebar.getByRole("link",{name:label,exact:true})).toBeVisible();
  await expect(sidebar.getByRole("button",{name:"展开"+label})).toHaveCount(0);
 }
 for(const label of ["账户设置","经营画像","认证信息","成员管理","角色权限","资源与额度","操作记录","推广中心","收益明细","提现管理","推广规则"]){
  await expect(sidebar.getByRole("link",{name:label,exact:true})).toHaveCount(0);
 }
 const profileTabs=page.getByRole("navigation",{name:"账户资料二级导航"});
 await profileTabs.getByRole("button",{name:"经营画像"}).click();
 await expect(page).toHaveURL(/account\/profile\/business/);
 await expect(sidebar.getByRole("link",{name:"账户资料",exact:true})).toHaveAttribute("aria-current","page");
 await page.goto(entry+"/account/organization/members");
 const enterpriseTabs=page.getByRole("navigation",{name:"企业空间业务导航"});
 await enterpriseTabs.getByRole("button",{name:"角色权限",exact:true}).click();
 await expect(page).toHaveURL(/account\/organization\/roles/);
 await expect(sidebar.getByRole("link",{name:"企业空间",exact:true})).toHaveAttribute("aria-current","page");
 await page.goto(entry+"/account/referrals/center");
 const referralTabs=page.getByRole("navigation",{name:"推广与收益业务导航"});
 await referralTabs.getByRole("button",{name:"收益明细",exact:true}).click();
 await expect(page).toHaveURL(/account\/referrals\/earnings/);
 await expect(sidebar.getByRole("link",{name:"推广与收益",exact:true})).toHaveAttribute("aria-current","page");
});
