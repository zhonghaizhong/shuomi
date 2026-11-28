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
  await expect(globe).toHaveAttribute("data-globe-motion","reduced");
  const firstAngle=await globe.getAttribute("data-globe-angle");
  const firstBounds=await globe.boundingBox();
  await page.waitForTimeout(750);
  await expect(globe).toHaveAttribute("data-globe-motion","reduced");
  expect(await globe.getAttribute("data-globe-angle")).toBe(firstAngle);
  const secondBounds=await globe.boundingBox();
  expect(firstBounds).not.toBeNull();
  expect(secondBounds).not.toBeNull();
  expect(secondBounds!.width).toBeCloseTo(firstBounds!.width,1);
  expect(secondBounds!.height).toBeCloseTo(firstBounds!.height,1);
});


test("cockpit quick actions navigate to the intended existing pages", async ({ page }) => {
  await page.goto(cockpit);
  await page.getByRole("button", { name: "检查店铺" }).click();
  await expect(page).toHaveURL(/#\/workbench\/store-center(?:\?|$)/);
  await page.goto(cockpit);
  await page.getByRole("button", { name: "店铺详情", exact: true }).click();
  await expect(page).toHaveURL(/#\/workbench\/overview\/stores/);
  await page.goto(cockpit);
  const dashboard = page.locator('[data-dashboard="operations"]');
  await expect(dashboard).toContainText("尚无与当前店铺范围关联的可核验任务数据");
  await dashboard.getByRole("button", { name: "查看任务中心", exact: true }).click();
  await expect(page).toHaveURL(/#\/workbench\/ai\/tasks(?:\?|$)/);
  await page.goto(cockpit);
  await dashboard.getByRole("button", { name: "进入店铺中心" }).click();
  await expect(page).toHaveURL(/#\/workbench\/stores(?:\?|$)/);

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
    { route: "goals", panel: '[class*="goalPanel"]', content: '[class*="goalTable"]' },
    { route: "stores", panel: '[class*="matrixPanel"]', content: '[class*="matrixTable"]' },
    { route: "alerts", panel: '[class*="matrixPanel"]', content: '[class*="alertTable"]' },
    { route: "advice", panel: '[class*="adviceDetail"]', content: '[class*="adviceDetail"]' },
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
    if (item.route === "stores") {
      const canvas = page.locator(".showcase-content");
      expect(await canvas.evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgba(0, 0, 0, 0)");
      const rows = page.locator('[class*="matrixAnalysisRow"]');
      await expect(rows.first()).toBeVisible();
      expect(await rows.first().evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgb(255, 255, 255)");
      expect(await rows.nth(1).evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgb(248, 247, 250)");
      await page.getByRole("button",{name:"查看分析",exact:true}).first().click();
      const dialog=page.getByRole("dialog",{name:"店铺经营分析"});
      await expect(dialog).toBeVisible();
      expect(await dialog.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe("rgb(255, 255, 255)");
      expect(await dialog.locator('[class*="matrixAnalysisMetrics"] article').first().evaluate(el=>getComputedStyle(el).backgroundColor)).toBe("rgb(248, 247, 250)");
      await dialog.getByRole("button",{name:"关闭经营分析"}).click();
    }
    expect(text).not.toBe("rgb(207, 205, 228)");
    const contentBg = await page.locator(item.content).first().evaluate(el => getComputedStyle(el).backgroundColor);
    expect(contentBg).not.toBe("rgb(47, 51, 73)");
    await page.screenshot({ path: "test-results/cockpit-light-" + item.route + ".png", fullPage: true });
  }
});


const lightModules: Array<[string,string]> = [
  ["/workbench",'[class*="metricsDigest"]'],
  ["/workbench/supply",'[class*="supplyCard"]:not([class*="supplyCards"])'],
  ["/workbench/data",'[class*="dataCard"]:not([class*="dataCards"])'],
  ["/workbench/store-center",'[data-store-center-showcase="home"] [class*="homeIntro"]'],
  ["/workbench/plans",'[class*="planOverview"]'],
  ["/workbench/account",'[class*="accountOverview"]'],
  ["/workbench/ai",'[class*="aiCards"] article'],
  ["/workbench/ai/tasks",'[data-task-center-preview="all"] [class*="guideIntro"]'],
  ["/workbench/agents",'[class*="dataCard"]:not([class*="dataCards"])'],
  ["/workbench/agents/market",'[class*="agentCards"] article'],
  ["/workbench/agents/mine",'[class*="agentMine"] > article > section'],
  ["/workbench/ai/projects",'[data-project-showcase] [class*="guideCapabilities"] article'],
  // The knowledge landing intentionally has two intro cards instead of obsolete metric cards.
  // Check a solid surfaced tag inside the new card (the card itself uses a gradient).
  ["/workbench/ai/knowledge",'[data-library-hub="knowledge"] [class*="knowledgeIntroTags"] > span'],
  // Reports now use a single results panel instead of redundant metric cards.
  ["/workbench/ai/reports",'[data-report-center] [class*="results"]'],
  ["/workbench/tools",'[class*="entry"]'],
  ["/workbench/tools/official",'[class*="toolCard"]'],
  ["/workbench/services",'[class*="homeCard"]:not([class*="homeCards"])'],
  ["/workbench/services/market",'[class*="serviceCard"]'],
  ["/workbench/agents/custom",'main header'],
  ["/workbench/tools/custom",'main header'],
  ["/workbench/store-products",'[data-store-center-showcase="products"] [class*="metrics"] article'],
  ["/workbench/store-orders",'[data-store-center-showcase="orders"] [class*="metrics"] article'],
];

for (const [start, end] of [[0, 6], [6, 12], [12, 18], [18, lightModules.length]]) {
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
  await expect(page.getByRole("heading", { name: "建议队列" })).toBeVisible();
  const advice = page.locator('[class*="adviceWorkspace"]');
  await expect(advice).toBeVisible();
  const queue = advice.locator('aside button');
  if (await queue.count()) {
    await queue.first().click();
    await expect(queue.first()).toHaveAttribute("aria-pressed","true");
    const conversation=advice.getByRole("region",{name:"经营建议对话"});
    await expect(conversation).toBeVisible();
    await expect(conversation.getByRole("heading",{name:"当前经营情况",exact:true})).toBeVisible();
    await expect(conversation.getByRole("heading",{name:"经营分析",exact:true})).toBeVisible();
    await expect(conversation.getByRole("heading",{name:"经营建议",exact:true})).toBeVisible();
    await expect(conversation.getByText("尚未接入大模型",{exact:false})).toBeVisible();
    await expect(advice.getByRole("button",{name:"前往处理",exact:true})).toHaveCount(0);
    await expect(advice.getByRole("button",{name:"确认已执行",exact:true})).toHaveCount(0);
    const composer=advice.getByRole("textbox",{name:"经营建议追问"});
    await expect(composer).toBeVisible();
    const send=advice.getByRole("button",{name:"发送",exact:true});
    await expect(send).toBeDisabled();
    await composer.fill("目前有哪些经营风险？");
    await send.click();
    await expect(conversation.getByText("目前有哪些经营风险？",{exact:true})).toBeVisible();
    await expect(conversation.getByText("硕米 AI · 规则化演示",{exact:true})).toBeVisible();
    await expect(composer).toHaveValue("");
    const bubble=conversation.locator('[class*="adviceChatBubble"]').first();
    expect(await bubble.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe("rgb(248, 247, 250)");
  } else {
    await expect(advice.getByRole("heading", { name: "暂无经营建议" })).toBeVisible();
    await expect(advice.getByRole("status").filter({hasText:"暂无经营建议"})).toBeVisible();
  }
  await page.getByRole("button", { name: "切换深色主题" }).click();
  await expect(page.locator(".dark .showcase-shell")).toBeVisible();
  await page.getByRole("button", { name: "切换浅色主题" }).click();
  await expect(page.locator(".light .showcase-shell")).toBeVisible();
});


/* User-provided 硕米Chat image is the page-title reference.
   Verify the page-title panel only, never subsection/table column headers. */
const standardPageHeaders = [
  ["/workbench/ai/chat",'[class*="page"] > header[class*="header"]'],
  ["/workbench/ai",'[class*="page"] > header[class*="header"]'],
  ["/workbench/overview/advice",'[class*="page"] > header[class*="header"]'],
  ["/workbench/overview/goals",'[class*="page"] > header[class*="header"]'],
  ["/workbench/agents/market",'[class*="page"] > header[class*="header"]'],
  ["/workbench/ai/tasks",'[class*="page"] > header[class*="header"]'],
  ["/workbench/ai/projects",'[data-project-showcase] > header[class*="hero"]'],
  ["/workbench/ai/reports",'[data-report-center] > header[class*="hero"]'],
  ["/workbench/store-products",'[class*="page"] > header[class*="header"]'],
  ["/workbench/data/api",'[class*="page"] > header[class*="header"]'],
  ["/workbench/tools",'[class*="page"] > header[class*="hero"]'],
  ["/workbench/tools/official",'[class*="page"] > header[class*="header"]'],
  ["/workbench/tools/custom",'[class*="page"] > header[class*="header"]'],
  ["/workbench/agents/custom",'[class*="page"] > header[class*="header"]'],
  ["/workbench/services/market",'[class*="page"] > header[class*="head"]'],
] as const;

test("page title headers match Chat reference across modules and both themes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/shuomi/#/workbench/ai/chat");
  await expect(page.locator(".showcase-shell")).toBeVisible();
  for (const theme of ["dark", "light"] as const) {
    if (theme === "light") {
      await page.getByRole("button", { name: "切换浅色主题" }).click();
    }
    for (const [route, selector] of standardPageHeaders) {
      await page.goto("/shuomi/#" + route);
      const header = page.locator(selector).first();
      await expect(header, route + " must contain the standard header").toBeVisible();
      const metrics = await header.evaluate(el => {
        const title = el.querySelector("h1");
        const paragraph = el.querySelector("p");
        const titleStyle = title ? getComputedStyle(title) : null;
        const descriptionStyle = paragraph ? getComputedStyle(paragraph) : null;
        const headerStyle = getComputedStyle(el);
        return {
          height: el.getBoundingClientRect().height,
          leftPad: headerStyle.paddingLeft,
          rightPad: headerStyle.paddingRight,
          radius: headerStyle.borderTopLeftRadius,
          borderWidth: headerStyle.borderTopWidth,
          titleSize: titleStyle?.fontSize,
          titleLine: titleStyle?.lineHeight,
          titleRule: titleStyle?.borderLeftWidth,
          descriptionSize: descriptionStyle?.fontSize,
          titleText: title?.textContent,
        };
      });
      expect(metrics.height, route + ": header height").toBeGreaterThanOrEqual(129);
      expect(metrics.leftPad, route + ": left padding").toBe("24px");
      expect(metrics.rightPad, route + ": right padding").toBe("24px");
      expect(metrics.radius, route + ": corner radius").toBe(route === "/workbench/tools" ? "12px" : "6px");
      expect(metrics.borderWidth, route + ": border").toBe("1px");
      expect(metrics.titleSize, route + ": title typography").toBe("26px");
      expect(metrics.titleLine, route + ": title line-height").toBe("34px");
      expect(metrics.titleRule, route + ": title vertical rule").toBe("3px");
      expect(metrics.descriptionSize, route + ": description typography").toBe("14px");
      expect(metrics.titleText?.trim().length, route + ": title must be present").toBeGreaterThan(0);
    }
  }
});

test("standard headers keep actions clickable and adapt to narrow screens", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/shuomi/#/workbench/tools");
  const header = page.locator('[class*="page"] > header[class*="hero"]').first();
  await expect(header).toBeVisible();
  const title = header.locator("h1");
  await expect(title).toHaveCSS("font-size", "23px");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/shuomi/#/workbench/overview/advice");
  await expect(page.locator('[class*="page"] > header[class*="header"]')).toBeVisible();
  await page.getByRole("button", { name: "切换浅色主题" }).click();
  await expect(page.locator(".light .showcase-shell")).toBeVisible();
  await expect(page.getByRole("heading", { name: "建议队列" })).toBeVisible();
  const advice = page.locator('[class*="adviceWorkspace"]');
  await expect(advice).toBeVisible();
  const queue = advice.locator('aside button');
  if (await queue.count()) {
    await queue.first().click();
    await expect(queue.first()).toHaveAttribute("aria-pressed","true");
    const conversation=advice.getByRole("region",{name:"经营建议对话"});
    await expect(conversation).toBeVisible();
    await expect(conversation.getByRole("heading",{name:"当前经营情况",exact:true})).toBeVisible();
    await expect(conversation.getByRole("heading",{name:"经营分析",exact:true})).toBeVisible();
    await expect(conversation.getByRole("heading",{name:"经营建议",exact:true})).toBeVisible();
    await expect(conversation.getByText("尚未接入大模型",{exact:false})).toBeVisible();
    await expect(advice.getByRole("button",{name:"前往处理",exact:true})).toHaveCount(0);
    await expect(advice.getByRole("button",{name:"确认已执行",exact:true})).toHaveCount(0);
    const composer=advice.getByRole("textbox",{name:"经营建议追问"});
    await expect(composer).toBeVisible();
    const send=advice.getByRole("button",{name:"发送",exact:true});
    await expect(send).toBeDisabled();
    await composer.fill("目前有哪些经营风险？");
    await send.click();
    await expect(conversation.getByText("目前有哪些经营风险？",{exact:true})).toBeVisible();
    await expect(conversation.getByText("硕米 AI · 规则化演示",{exact:true})).toBeVisible();
    await expect(composer).toHaveValue("");
    const bubble=conversation.locator('[class*="adviceChatBubble"]').first();
    expect(await bubble.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe("rgb(248, 247, 250)");
  } else {
    await expect(advice.getByRole("heading", { name: "暂无经营建议" })).toBeVisible();
    await expect(advice.getByRole("status").filter({hasText:"暂无经营建议"})).toBeVisible();
  }
});


/* Regression for previously unstyled light-mode nested surfaces.
   Test rendered RGB and foreground/background contrast, not just CSS presence. */
const lightDetailSurfaces = [
  {route:"/workbench/tools/official", target:'[class*="toolCard"]', text:"h3"},
  {route:"/workbench/agents/custom", target:'[class*="introFeatures"] article', text:"h3"},
  {route:"/workbench/tools/custom", target:'[data-tool-custom-page] [class*="introFeatures"] article', text:"h3"},
  {route:"/workbench/agents/custom/new", target:'[class*="formLayout"] input:not([type="checkbox"]):not([type="file"])', text:null},
  {route:"/workbench/tools/custom/new", target:'[class*="formLayout"] input:not([type="checkbox"]):not([type="file"])', text:null},
  {route:"/workbench/store-products", target:'[data-store-center-showcase="products"] [class*="metrics"] article', text:"strong"},
  {route:"/workbench/store-orders", target:'[data-store-center-showcase="orders"] [class*="metrics"] article', text:"strong"},
] as const;

test("light mode nested cards and controls are light and text is readable", async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto("/shuomi/#/workbench/tools");
  await page.getByRole("button", {name:"切换浅色主题"}).click();
  for (const item of lightDetailSurfaces) {
    await page.goto("/shuomi/#"+item.route);
    await expect(page.locator(".light .showcase-shell")).toBeVisible();
    const target=page.locator(item.target).first();
    await expect(target, item.route).toBeVisible();
    const colors=await target.evaluate((element, childSelector) => {
      function channels(value:string) {
        const values=value.match(/[\d.]+/g)?.slice(0,3).map(Number)??[];
        return value.startsWith("color(srgb")?values.map(v=>v*255):values;
      }
      function brightness(c:number[]) {return (c[0]*.2126+c[1]*.7152+c[2]*.0722);}
      const style=getComputedStyle(element);
      const foreground=childSelector ? element.querySelector(childSelector) : element;
      const fg=foreground?getComputedStyle(foreground).color:"";
      return {background:style.backgroundColor,foreground:fg,backgroundBrightness:brightness(channels(style.backgroundColor)),foregroundBrightness:brightness(channels(fg))};
    },item.text);
    expect(colors.background, item.route+" unexpectedly transparent").not.toBe("rgba(0, 0, 0, 0)");
    expect(colors.backgroundBrightness, item.route+" has dark card").toBeGreaterThan(190);
    expect(colors.foregroundBrightness, item.route+" has too-light text").toBeLessThan(190);
  }
});

test("tool modal in light theme has light nested details with readable labels", async ({page}) => {
  await page.goto("/shuomi/#/workbench/tools/official");
  await page.getByRole("button", {name:"切换浅色主题"}).click();
  // Product collection introduction now follows the original Figma source-selection dialog.
  const product=page.locator('[class*="toolCard"]').filter({hasText:"商品采集插件"});
  await product.getByRole("button",{name:"启用",exact:true}).click();
  await page.getByRole("button",{name:"我的工具",exact:true}).click();
  await page.locator('[data-figma-tool="商品采集插件"]').getByRole("button",{name:"在线采集"}).click();
  const modal=page.getByRole("dialog");
  await expect(modal.getByRole("heading",{name:"选择在线采集来源"})).toBeVisible();
  const card=modal.locator('[class*="figmaSourceGrid"] section').first();
  await expect(card).toBeVisible();
  await expect(card).toContainText("亚马逊采集");
  await expect(card).toHaveCSS("background-color","rgb(248, 247, 250)");
});


test("light mode has no severely invisible ordinary text across sampled workbench pages", async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto("/shuomi/#/workbench/overview/advice");
  await page.getByRole("button",{name:"切换浅色主题"}).click();
  const routes = [
    "/workbench","/workbench/overview/goals","/workbench/overview/stores",
    "/workbench/overview/alerts","/workbench/overview/advice",
    ...lightModules.map(([route])=>route),
    "/workbench/agents/custom","/workbench/tools/custom",
    "/workbench/agents/custom/new","/workbench/tools/custom/new",
    "/workbench/store-products","/workbench/store-orders"
  ];
  const seen=new Set<string>();
  const allLow:string[]=[];
  for (const route of routes) {
    if (seen.has(route)) continue;
    seen.add(route);
    await page.goto("/shuomi/#"+route);
    await expect(page.locator(".light .showcase-shell")).toBeVisible();
    const low=await page.evaluate(() => {
      function rgb(value:string):number[]|null {
        let x:number[]=[];
        const m=value.match(/[\d.]+/g);
        if(!m||m.length<3)return null;
        x=m.slice(0,3).map(Number);
        if(value.startsWith("color(srgb")) x=x.map(v=>v*255);
        return x;
      }
      function lum(c:number[]) {
        const linear=c.map(v=>{const n=v/255;return n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4);});
        return linear[0]*.2126+linear[1]*.7152+linear[2]*.0722;
      }
      const bad:string[]=[];
      const roots=document.querySelectorAll('main h1,main h2,main h3,main p,main label,main dt,main dd,main small,main button,main a');
      for(const node of Array.from(roots).slice(0,260)) {
        const el=node as HTMLElement;
        const txt=(el.textContent||"").trim().slice(0,35);
        if(!txt||!el.getClientRects().length||el.getBoundingClientRect().height<5)continue;
        const style=getComputedStyle(el);
        if(style.visibility!=="visible"||style.opacity==="0"||style.display==="none"||style.color==="transparent")continue;
        const fg=rgb(style.color);if(!fg)continue;
        // The purple hero is intentionally gradient-backed in both themes.
        if(el.closest('[class*="featureMetric"]'))continue;
        let anc:Element|null=el;let bg:number[]|null=null;let complex=false;
        while(anc) {
          const cs=getComputedStyle(anc);
          if(cs.backgroundImage!=="none"){complex=true;break;}
          const v=cs.backgroundColor;
          const alpha=v.startsWith("rgba(") ? Number(v.match(/,\s*([\d.]+)\)$/)?.[1]??1) : 1;
          if(v && alpha>=.98 && v!=="transparent") {
            const c=rgb(v);
            if(c){bg=c;break;}
          }
          anc=anc.parentElement;
        }
        if(complex||!bg)continue;
        const a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
        if(ratio<2.5)bad.push(txt+" ("+ratio.toFixed(2)+":1, "+style.color+" / "+bg.map(Math.round).join(",")+")");
      }
      return bad.slice(0,12);
    });
    if(low.length)allLow.push(route+": "+low.join(" | "));
  }
  expect(allLow, "Pages with unreadable foreground/background colors").toEqual([]);
});


test("Chat, task center and project center light visual surfaces follow Vuexy", async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto("/shuomi/#/workbench/ai/chat");
  await page.getByRole("button",{name:"切换浅色主题"}).click();
  const screens=[
    {route:"/workbench/ai/chat",surfaces:['[data-conversation-composer="stable"]','[class*="_modeList_"] button[aria-pressed="false"]','[class*="_examples_"] > div > button']},
    {route:"/workbench/ai/tasks",surfaces:['[data-task-center-preview="all"] [class*="guideIntro"]','[data-task-center-preview="all"] [class*="guideCapabilities"] > article','[data-task-center-preview="all"] [class*="guideSteps"] > article']},
    {route:"/workbench/ai/projects",surfaces:['[data-project-showcase] [class*="guideIntro"]','[data-project-showcase] [class*="guideCapabilities"] article','[data-project-showcase] [class*="guideSteps"] article']},
  ] as const;
  for(const screen of screens) {
    await page.goto("/shuomi/#"+screen.route);
    await expect(page.locator(".light .showcase-shell")).toBeVisible();
    for(const selector of screen.surfaces){
      const card=page.locator(selector).first();
      await expect(card,screen.route+" "+selector).toBeVisible();
      const result=await card.evaluate(el=>{
        const styles=getComputedStyle(el);
        const firstTitle=el.querySelector("h2,h3,strong");
        let surface:Element|null=el;
        let background="rgba(0, 0, 0, 0)";
        while(surface) {
          const computed=getComputedStyle(surface);
          if(computed.backgroundColor!=="transparent" && computed.backgroundColor!=="rgba(0, 0, 0, 0)") {
            background=computed.backgroundColor;
            break;
          }
          surface=surface.parentElement;
        }
        return {background,border:styles.borderTopColor,text:firstTitle?getComputedStyle(firstTitle).color:styles.color};
      });
      expect(result.background,screen.route+" should use white/pale cards").toMatch(/^rgb\(2(?:4[0-9]|5[0-5]), 2(?:4[0-9]|5[0-5]), 2(?:4[0-9]|5[0-5])\)$/);
      expect(result.text,screen.route+" should not have pastel title text").not.toBe("rgb(207, 205, 228)");
    }
    if(screen.route==="/workbench/ai/chat") {
      const selected=page.locator('[class*="_modeList_"] button[aria-pressed="true"]');
      await expect(selected).toHaveCount(1);
      await expect(selected).toHaveCSS("background-color","rgb(238, 235, 255)");
    }
    await page.screenshot({path:"test-results/vuexy-light-"+screen.route.split("/").at(-1)+".png",fullPage:true});
  }
  await page.goto("/shuomi/#/workbench/ai/tasks");
  await page.getByRole("button",{name:"切换深色主题"}).click();
  await expect(page.locator(".dark .showcase-shell")).toBeVisible();
  await page.getByRole("button",{name:"切换浅色主题"}).click();
  await expect(page.locator(".light .showcase-shell")).toBeVisible();
});

test("new Chat conversation light theme never leaves dark input or mode panels", async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto("/shuomi/#/workbench/ai/chat/new");
  const workspace=page.locator('[class*="_workspace_"]');
  await expect(workspace).toBeVisible();
  await page.getByRole("button",{name:"切换浅色主题"}).click();
  await expect(page.locator(".light .showcase-shell")).toBeVisible();
  const panels=[
    '[class*="_composer_"]',
    '[class*="_modePanel_"]',
    '[class*="_composer_"] textarea',
    '[class*="_modeList_"] button',
    '[class*="_examples_"] button'
  ];
  for(const selector of panels){
    const target=workspace.locator(selector).first();
    await expect(target).toBeVisible();
    const visual=await target.evaluate(el=>({
      background:getComputedStyle(el).backgroundColor,
      gradient:getComputedStyle(el).backgroundImage,
      foreground:getComputedStyle(el).color
    }));
    if(visual.gradient!=="none") {
      expect(visual.gradient,selector+": dark gradient in light mode").toContain("rgb(255, 255, 255)");
    } else {
      const channels=visual.background.match(/[\d.]+/g)?.slice(0,3).map(Number)??[];
      expect(channels.length,selector).toBe(3);
      expect(Math.min(...channels),selector+": dark card in light mode").toBeGreaterThan(225);
    }
    expect(visual.foreground,selector+": text still pastel").not.toBe("rgb(207, 205, 228)");
  }
  await page.screenshot({path:"test-results/chat-new-light-fixed.png",fullPage:true});
  await page.getByRole("button",{name:"执行定时任务",exact:true}).click();
  await expect(page.getByRole("button",{name:"执行定时任务",exact:true})).toHaveAttribute("aria-pressed","true");
  await page.getByRole("button",{name:"资源与能力"}).click();
  const drawer=page.getByRole("dialog",{name:"选择资源与能力"});
  await expect(drawer).toBeVisible();
  await expect(drawer).toHaveCSS("background-color","rgb(255, 255, 255)");
  await drawer.getByRole("button",{name:"关闭"}).click();
  await expect(drawer).toHaveCount(0);
  await page.getByRole("button",{name:"切换深色主题"}).click();
  await expect(workspace.locator('[class*="_composer_"]')).toHaveCSS("background-color","rgb(47, 51, 73)");
  await page.getByRole("button",{name:"切换浅色主题"}).click();
  await expect(workspace.locator('[class*="_modePanel_"]')).toHaveCSS("background-color","rgba(0, 0, 0, 0)");
});


test("chat keeps work modes available after sending, without overlapping the composer in either theme", async ({page}) => {
  for(const size of [{width:1440,height:900},{width:820,height:900},{width:390,height:844}]){
    await page.setViewportSize(size);
    await page.goto("/shuomi/#/workbench/ai/chat/new");
    for(const theme of ["light","dark"]){
      const switchTheme=page.getByRole("button",{name:theme==="light"?"切换浅色主题":"切换深色主题"});
      if(await switchTheme.isVisible().catch(()=>false))await switchTheme.click();
      const workspace=page.locator('[class*="_workspace_"]').first();
      const panel=page.getByRole("complementary",{name:"选择执行方式"});
      await expect(panel).toBeVisible();
      await panel.getByRole("button",{name:"创建会话",exact:true}).click();
      await page.locator("#chat-new-prompt").fill("帮我整理本周店铺经营目标");
      await page.locator("#chat-new-prompt").press("Control+Enter");
      await expect(workspace).toHaveAttribute("data-chat-active","true");
      await expect(page.getByRole("region",{name:"会话消息与输入区"})).toContainText("帮我整理本周店铺经营目标");
      await expect(panel).toBeVisible();
      await expect(panel.getByRole("button",{name:"发起任务",exact:true})).toBeVisible();
      const send=page.getByRole("button",{name:"发送消息",exact:true});
      await send.scrollIntoViewIfNeeded();
      const hit=await send.evaluate(el=>{const b=el.getBoundingClientRect();const target=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);return target===el||el.contains(target)});
      expect(hit,"work panel must not cover send button at "+size.width+" "+theme).toBe(true);
      await panel.getByRole("button",{name:"发起任务",exact:true}).click();
      await expect(panel.getByRole("button",{name:"发起任务",exact:true})).toHaveAttribute("aria-pressed","true");
      await page.locator("#chat-new-prompt").fill("核对商品资料");
      await page.getByRole("button",{name:"确认任务草案",exact:true}).click();
      const confirmation=page.getByRole("region",{name:"会话内确认任务"});
      await expect(confirmation).toBeVisible();
      await expect(confirmation).toContainText("核对商品资料");
      await confirmation.getByRole("button",{name:"返回修改"}).click();
      await expect(confirmation).not.toBeVisible();
      await expect(panel).toBeVisible();
      await page.screenshot({path:"test-results/chat-persistent-work-modes-"+size.width+"-"+theme+".png",fullPage:false});
    }
  }
});


test("light hero keeps high-contrast subtitle and luminous main title during globe rotation", async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto(cockpit);
  await page.getByRole("button",{name:"切换浅色主题"}).click();
  const hero=page.locator('[data-dashboard="operations"] [class*="overviewFeature"]').first();
  const title=hero.getByRole("heading",{name:"经营全局 · 一屏掌握"});
  const intro=hero.locator('[class*="heroIntro"]');
  const globe=hero.locator("canvas[data-globe-status]");
  await expect(title).toBeVisible();
  await expect(globe).toHaveAttribute("data-globe-status","ready",{timeout:30000});
  await expect(globe).toHaveAttribute("data-globe-clouds","ready",{timeout:30000});
  const visual=await title.evaluate(el=>{
    const css=getComputedStyle(el);
    return {gradient:css.backgroundImage,clip:css.backgroundClip,fill:css.getPropertyValue("-webkit-text-fill-color")};
  });
  expect(visual.gradient).toContain("linear-gradient");
  expect(visual.clip).toContain("text");
  expect(visual.fill).toBe("rgba(0, 0, 0, 0)");
  const introText=await intro.evaluate(el=>getComputedStyle(el).color);
  expect(introText).toBe("rgb(249, 247, 255)");
  await page.screenshot({path:"test-results/cockpit-hero-light-gradient.png",fullPage:false});
  await globe.screenshot({path:"test-results/cockpit-globe-seam-first.png"});
  await page.waitForTimeout(1200);
  await expect(globe).toHaveAttribute("data-globe-status","ready");
  await globe.screenshot({path:"test-results/cockpit-globe-seam-rotating.png"});
  await page.getByRole("button",{name:"切换深色主题"}).click();
  await expect(intro).toHaveCSS("color","rgb(249, 247, 255)");
});


test("task center modes retain readable light/dark surfaces and functional task actions",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto("/shuomi/#/workbench/ai/tasks");
 await page.getByRole("button",{name:"切换浅色主题"}).click();
 for(const mode of ["running","completed","errors","scheduled","pending"]){
  await page.goto("/shuomi/#/workbench/ai/tasks/"+mode);
  await expect(page.locator(".light .showcase-shell")).toBeVisible();
  const root=page.locator('[data-task-center-preview="'+mode+'"]');
  await expect(root).toBeVisible();
  const search=root.getByRole("textbox",{name:"搜索任务名称、店铺或项目"});
  await expect(search).toBeVisible();
  await expect(root.locator('[class*="taskTable"]').first()).toBeVisible();
  await expect(root.locator('[class*="taskSearch"]').first()).toBeVisible();
  const bg=await root.locator('[class*="taskTable"]').first().evaluate(el=>getComputedStyle(el).backgroundColor);
  expect(bg,mode+" table should remain light").toMatch(/^rgb\(2(?:4[0-9]|5[0-5]), 2(?:4[0-9]|5[0-5]), 2(?:4[0-9]|5[0-5])\)$/);
  await search.fill("不存在的任务编号");
  await root.getByRole("button",{name:"确定"}).click();
  await expect(root.getByText("没有符合条件的任务。")).toBeVisible();
  await root.getByRole("button",{name:"重置"}).click();
  await expect(search).toHaveValue("");
 }
 await page.goto("/shuomi/#/workbench/ai/tasks/running");
 const root=page.locator('[data-task-center-preview="running"]');
 // Real task lists may be empty; test the available create flow rather
 // than silently adding a fixture to the user's workspace.
 if(await root.locator('[data-task-state]').count()){
  await root.locator('[data-task-state]').first().getByRole("button").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
 }else{
  await expect(root.getByText("没有符合条件的任务。")).toBeVisible();
  await root.getByRole("button",{name:/新建任务/}).click();
  await expect(page).toHaveURL(/chat\/new\?preview=1&taskMode=task/);
  await expect(page.getByRole("button",{name:"发起任务",exact:true})).toHaveAttribute("aria-pressed","true");
  await page.locator("#chat-new-prompt").fill("检查商品资料");
  await page.getByRole("button",{name:"确认任务草案",exact:true}).click();
  const dialog=page.getByRole("region",{name:"会话内确认任务"});
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button",{name:"返回修改"}).click();
  await expect(dialog).not.toBeVisible();
  await page.goto("/shuomi/#/workbench/ai/tasks/running");
 }
 await page.getByRole("button",{name:"切换深色主题"}).click();
 await expect(page.locator(".dark .showcase-shell")).toBeVisible();
 await expect(root.locator('[class*="taskTable"]').first()).toBeVisible();
});
