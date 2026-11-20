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
  await expect(nav.getByRole("link",{name:"我的刊登",exact:true})).toHaveCount(0);
  await nav.getByRole("button",{name:"展开店铺中心"}).click();
  await nav.getByRole("button",{name:"展开我的店铺"}).click();
  await expect(nav.getByRole("link",{name:"我的刊登",exact:true})).toBeVisible();
  await nav.getByRole("button",{name:"展开我的刊登"}).click();
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
    await expect(nav.getByRole("button",{name:"收起我的刊登"})).toBeVisible();
  }
  await nav.getByRole("button",{name:"收起我的刊登"}).click();
  await expect(nav.getByRole("button",{name:"展开我的刊登"})).toBeVisible();
});

test("supply overview describes sourcing without publishing management", async ({page})=>{
  await page.goto(entry+"/supply");
  const main=page.locator("main.showcase-content");
  await expect(main.getByRole("heading",{name:"发现优质货源，连接多元供货渠道"})).toBeVisible();
  for(const name of ["硕米自营","硕米优选","货盘集成","优选申请"]) {
    await expect(main.getByRole("heading",{name,exact:true})).toBeVisible();
  }
  await expect(main.getByRole("heading",{name:"我的供应链"})).toHaveCount(0);
  await expect(main.getByRole("heading",{name:"我的刊登"})).toHaveCount(0);
  await expect(main.getByText("完成平台适配与审核")).toHaveCount(0);
});
