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
  ["/workbench",'[class*="metricsDigest"]'],
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
  ["/workbench/agents/custom",'main header'],
  ["/workbench/tools/custom",'main header'],
  ["/workbench/store-products",'[class*="productMetrics"] article'],
  ["/workbench/store-orders",'[class*="orderMetrics"] article'],
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
  await page.getByRole("button", { name: /转化率下降/ }).click();
  await expect(page.getByRole("heading", { name: "转化率下降" })).toBeVisible();
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
  ["/workbench/ai/projects",'[class*="page"] > header[class*="header"]'],
  ["/workbench/ai/reports",'[class*="page"] > header[class*="header"]'],
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
      expect(metrics.radius, route + ": corner radius").toBe("6px");
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
  await page.getByRole("button", { name: /转化率下降/ }).click();
  await expect(page.getByRole("heading", { name: "转化率下降" })).toBeVisible();
});


/* Regression for previously unstyled light-mode nested surfaces.
   Test rendered RGB and foreground/background contrast, not just CSS presence. */
const lightDetailSurfaces = [
  {route:"/workbench/tools/official", target:'[class*="toolCard"]', text:"h3"},
  {route:"/workbench/agents/custom", target:'[class*="featureGrid"] article', text:"h3"},
  {route:"/workbench/tools/custom", target:'[class*="features"] article', text:"h3"},
  {route:"/workbench/agents/custom/new", target:'[class*="formLayout"] input:not([type="checkbox"]):not([type="file"])', text:null},
  {route:"/workbench/tools/custom/new", target:'[class*="formLayout"] input:not([type="checkbox"]):not([type="file"])', text:null},
  {route:"/workbench/store-products", target:'[class*="productMetrics"] article', text:"strong"},
  {route:"/workbench/store-orders", target:'[class*="orderMetrics"] article', text:"strong"},
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
  // Download dialogs are rendered conditionally; find the real install action.
  const download=page.getByRole("button", {name:"介绍"}).first();
  await expect(download).toBeVisible();
  await download.click();
  const details=page.locator('[class*="downloadDetails"]');
  await expect(details).toBeVisible();
  const background=await details.evaluate(el=>getComputedStyle(el).backgroundColor);
  expect(background).not.toBe("rgb(39, 52, 72)");
  const label=details.locator("dt").first();
  await expect(label).toBeVisible();
  await expect(label).toHaveCSS("color","rgb(111, 107, 125)");
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
    {route:"/workbench/ai/chat",surfaces:['[class*="landingCard"]','[class*="example"]','[class*="steps"] > li > *']},
    {route:"/workbench/ai/tasks",surfaces:['[class*="taskStats"] > button','[class*="taskSearch"]','[class*="taskTable"]','[class*="taskRow"]']},
    {route:"/workbench/ai/projects",surfaces:['[class*="metrics"] > article','[class*="filters"]','[class*="list"]','[data-library-hub="projects"] [class*="list"] > button[class*="row"]']},
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
  const workspace=page.locator('[class*="chat-new-preview_workspace"]');
  await expect(workspace).toBeVisible();
  await page.getByRole("button",{name:"切换浅色主题"}).click();
  await expect(page.locator(".light .showcase-shell")).toBeVisible();
  const panels=[
    '[class*="chat-new-preview_composer"]',
    '[class*="chat-new-preview_modePanel"]',
    '[class*="chat-new-preview_composer"] textarea',
    '[class*="chat-new-preview_modeList"] button',
    '[class*="chat-new-preview_examples"] button'
  ];
  for(const selector of panels){
    const target=workspace.locator(selector).first();
    await expect(target).toBeVisible();
    const visual=await target.evaluate(el=>({
      background:getComputedStyle(el).backgroundColor,
      foreground:getComputedStyle(el).color
    }));
    const channels=visual.background.match(/[\\d.]+/g)?.slice(0,3).map(Number)??[];
    expect(channels.length,selector).toBe(3);
    expect(Math.min(...channels),selector+": dark card in light mode").toBeGreaterThan(225);
    expect(visual.foreground,selector+": text still pastel").not.toBe("rgb(207, 205, 228)");
  }
  await page.screenshot({path:"test-results/chat-new-light-fixed.png",fullPage:true});
  await page.getByRole("button",{name:"执行定时任务"}).click();
  await expect(page.getByRole("button",{name:"执行定时任务"})).toHaveAttribute("aria-pressed","true");
  await page.getByRole("button",{name:"资源与能力"}).click();
  const drawer=page.getByRole("dialog",{name:"选择资源与能力"});
  await expect(drawer).toBeVisible();
  await expect(drawer).toHaveCSS("background-color","rgb(255, 255, 255)");
  await drawer.getByRole("button",{name:"关闭"}).click();
  await expect(drawer).toHaveCount(0);
  await page.getByRole("button",{name:"切换深色主题"}).click();
  await expect(workspace.locator('[class*="chat-new-preview_composer"]')).toHaveCSS("background-color","rgb(47, 51, 73)");
  await page.getByRole("button",{name:"切换浅色主题"}).click();
  await expect(workspace.locator('[class*="chat-new-preview_modePanel"]')).toHaveCSS("background-color","rgba(0, 0, 0, 0)");
});
