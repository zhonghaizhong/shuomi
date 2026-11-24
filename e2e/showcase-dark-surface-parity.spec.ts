import {expect,test,type Page} from "@playwright/test";

/* Showcase-only contrast/surface regression. Does not change user records. */
const violetPanel="rgb(47, 51, 73)";
const ensureDark=async(page:Page)=>{
 const switcher=page.getByRole("button",{name:"切换深色主题"});
 if(await switcher.count())await switcher.click();
 await expect(page.locator("html")).toHaveClass(/dark/);
};
test("My Data's self-owned product library uses the same approved dark card as its neighbors",async({page})=>{
 await page.goto("/shuomi/#/workbench/data/mine");
 await ensureDark(page);
 await page.getByRole("button",{name:"自有商品库",exact:true}).click();
 const library=page.getByRole("region",{name:"自有商品库"});
 await expect(library).toBeVisible();
 // The library wrapper is deliberately transparent; the batch section owns
 // the painted Vuexy card surface, alongside the separate filter card.
 const batchCard=library.locator('[class*="batchSection"]').first();
 await expect(batchCard).toBeVisible();
 await expect.poll(()=>batchCard.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe(violetPanel);
});
test("Listing waiting stage keeps approved Vuexy dark surfaces after shared styles load",async({page})=>{
 await page.goto("/shuomi/#/workbench/listing/waiting");
 await ensureDark(page);
 const stage=page.locator('[data-listing-stage="waiting"]');
 await expect(stage).toBeVisible();
 const header=stage.locator("header").first();
 await expect.poll(()=>header.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe(violetPanel);
});


/* Browser-computed backgrounds, not a source-token grep. Kept in the existing
   showcase interaction suite, which runs against the built Pages preview. */
test("Tool Market actual dark-mode button and card backgrounds keep approved Vuexy states",async({page})=>{
 await page.goto("/shuomi/#/workbench/tools/official");
 await ensureDark(page);
 const firstCard=page.locator('[class*="toolCard"]').first();
 await expect(firstCard).toBeVisible();
 const background=async(selector:string)=>page.locator(selector).first().evaluate(el=>getComputedStyle(el).backgroundColor);
 await expect.poll(()=>firstCard.evaluate(el=>getComputedStyle(el).backgroundColor))
  .toBe("rgb(47, 51, 73)");
 const primary=firstCard.getByRole("button",{name:"介绍"});
 await expect(primary).toBeVisible();
 const defaultButton=await primary.evaluate(el=>getComputedStyle(el).backgroundColor);
 // Secondary actions must be raised, never white or a light-theme fill.
 expect(defaultButton).toBe("rgb(57, 61, 85)");
 const selected=page.getByRole("button",{name:"采集",exact:true});
 await selected.click();
 await expect(selected).toHaveAttribute("aria-pressed","true");
 await expect.poll(()=>selected.evaluate(el=>getComputedStyle(el).backgroundColor))
  .toBe("rgb(115, 103, 240)");
 await expect.poll(()=>background('[class*="toolCard"]')).toBe("rgb(47, 51, 73)");
});

test("Tool customization real card and button paints retain dark/light separation",async({page})=>{
 await page.goto("/shuomi/#/workbench/tools/custom");
 await ensureDark(page);
 const first=page.locator('[class*="features"] article').first();
 await expect(first).toBeVisible();
 await expect.poll(()=>first.evaluate(el=>getComputedStyle(el).backgroundColor))
  .toBe("rgb(47, 51, 73)");
 const action=page.getByRole("button",{name:"提交定制需求"});
 await expect(action).toBeVisible();
 // Preserve the primary action brand rather than painting it as a neutral card.
 await expect.poll(()=>action.evaluate(el=>getComputedStyle(el).backgroundColor))
  .toBe("rgb(115, 103, 240)");
});


/* Screenshot regression: the top-level Tool Market route has its own stylesheet.
   Check computed pixels, not only /tools/official color tokens. */
test("Tool Market landing background matches Vuexy dark cards and raised actions",async({page})=>{
 await page.goto("/shuomi/#/workbench/tools");
 await ensureDark(page);
 const root=page.locator("[data-tool-home]");
 await expect(root).toBeVisible();
 const color=(selector:string)=>root.locator(selector).first().evaluate(el=>getComputedStyle(el).backgroundColor);
 for(const selector of ['header','article[class*="entry"]','article[class*="capability"]','section[class*="process"]','section[class*="note"]']){
  await expect.poll(()=>color(selector),selector).toBe("rgb(47, 51, 73)");
 }
 await expect.poll(()=>root.getByRole("button",{name:"浏览官方工具"}).evaluate(el=>getComputedStyle(el).backgroundColor))
  .toBe("rgb(57, 61, 85)");
 await expect.poll(()=>color('li[class*="step"]')).toBe("rgb(57, 61, 85)");
});


/* Data landing is rendered by demo-workbench-preview, not the independent
   Next.js data-services overview. Guard the actual card and button surfaces. */
test("Data Services landing uses consistent dark Vuexy card and button paints",async({page})=>{
 await page.goto("/shuomi/#/workbench/data");
 await ensureDark(page);
 const root=page.locator('[data-commerce-unified="data"]');
 await expect(root).toBeVisible();
 const paint=(selector:string)=>root.locator(selector).first().evaluate(el=>getComputedStyle(el).backgroundColor);
 for(const selector of ['[class*="dataCards"] article','[class*="dataSteps"]','[class*="dataDetails"] article']){
  const actual=await paint(selector);
  console.log(`[data landing] ${selector}: ${actual}`);
  await expect.poll(()=>paint(selector),selector).toBe("rgb(47, 51, 73)");
 }
 await expect.poll(()=>paint('[class*="dataSteps"] article')).toBe("rgb(57, 61, 85)");
 await expect.poll(()=>paint('[class*="dataCards"] article button')).toBe("rgb(57, 61, 85)");
});


/* These are the three real showcase routes shown in the data-service screenshots.
   Verify painted surfaces, not the mere presence of source CSS tokens. */
test("Data Market, API and My Data have Vuexy dark computed surfaces",async({page})=>{
 const bg=async(selector:string)=>page.locator(selector).first().evaluate(el=>getComputedStyle(el).backgroundColor);
 await page.goto("/shuomi/#/workbench/data/market");
 await ensureDark(page);
 const market=page.locator('[data-commerce-unified="data"]');
 await expect(market.locator('[class*="cards"] article').first()).toBeVisible();
 await expect.poll(()=>bg('[data-commerce-unified="data"] [class*="cards"] article')).toBe("rgb(47, 51, 73)");
 await expect.poll(()=>bg('[data-commerce-unified="data"] [class*="toolbar"]')).toBe("rgb(47, 51, 73)");
 await expect.poll(()=>bg('[data-commerce-unified="data"] [class*="toolbar"] input')).toBe("rgb(57, 61, 85)");
 await page.goto("/shuomi/#/workbench/data/api");
 await ensureDark(page);
 const api=page.locator('[data-api-dashboard]');
 await expect(api).toBeVisible();
 await expect.poll(()=>bg('[data-api-dashboard] [class*="apiMetrics"] article')).toBe("rgb(47, 51, 73)");
 await expect.poll(()=>bg('[data-api-dashboard] [class*="apiSection"]')).toBe("rgb(47, 51, 73)");
 await page.goto("/shuomi/#/workbench/data/mine");
 await ensureDark(page);
 const mine=page.locator('[data-my-data-owner]');
 await expect(mine).toBeVisible();
 await expect.poll(()=>mine.locator('[class*="filterBar"]').first().evaluate(el=>getComputedStyle(el).backgroundColor)).toBe("rgb(47, 51, 73)");
 await expect.poll(()=>mine.getByRole("region",{name:"采集批次",exact:true}).evaluate(el=>getComputedStyle(el).backgroundColor)).toBe("rgb(47, 51, 73)");
});


/* Screenshotted account routes share one stylesheet; guard against a later
   deep-blue override or full-card KPI tint surviving at the CSS tail. */
test("Enterprise Space and Referrals use neutral Vuexy cards with raised buttons",async({page})=>{
 for(const route of ["/organization","/referrals"]){
  await page.goto("/shuomi/#/workbench/account"+route);
  await ensureDark(page);
  const root=page.locator('[data-account-suite="'+route+'"]');
  await expect(root).toBeVisible();
  for(const selector of ['header[class*="hero"]','[class*="identity"]','[class*="metrics"] article','section[class*="panel"]']){
   const target=root.locator(selector).first();
   await expect(target).toBeVisible();
   await expect.poll(()=>target.evaluate(el=>getComputedStyle(el).backgroundColor),route+" "+selector)
    .toBe("rgb(47, 51, 73)");
  }
  const selected=root.locator('nav[class*="subNavigation"] button[aria-current="page"]');
  await expect(selected).toBeVisible();
  await expect.poll(()=>selected.evaluate(el=>getComputedStyle(el).backgroundColor))
   .not.toBe("rgb(20, 34, 55)");
 }
});


/* Regression for a formerly inherited 2-column cockpit filter grid. */
test("Store matrix seven filters stay on one desktop row and date picker works",async({page})=>{
 await page.setViewportSize({width:1600,height:900});
 await page.goto("/shuomi/#/workbench/overview/stores");
 const row=page.locator('[class*="matrixInlineFilters"]');
 await expect(row).toBeVisible();
 const children=row.locator(':scope > *');
 await expect(children).toHaveCount(7);
 const bounds=await children.evaluateAll(elements=>elements.map(el=>{
  const rect=el.getBoundingClientRect();
  return {x:rect.x,y:rect.y,right:rect.right,width:rect.width};
 }));
 const firstY=bounds[0].y;
 for(const box of bounds)expect(Math.abs(box.y-firstY)).toBeLessThan(3);
 for(let i=1;i<bounds.length;i++)expect(bounds[i].x).toBeGreaterThanOrEqual(bounds[i-1].right-2);
 await expect(row.getByRole("button",{name:"选择统计时间"})).toHaveText("全部时间");
 await row.getByRole("button",{name:"选择统计时间"}).click();
 await expect(row.getByRole("group",{name:"自定义统计时间"})).toBeVisible();
 await row.getByRole("button",{name:"清空日期"}).click();
 await expect(row.getByRole("button",{name:"选择统计时间"})).toHaveText("全部时间");
});


/* Regression: alert/advice filters must not inherit the former two-column
   select/actions grids. Ensure both rows are really horizontal in the browser. */
test("Alerts and advice each keep nine filter controls on one desktop row",async({page})=>{
 await page.setViewportSize({width:1600,height:900});
 for(const [route,kind] of [["alerts","alerts"],["advice","advice"]] as const){
  await page.goto("/shuomi/#/workbench/overview/"+route);
  const bar=page.locator('[data-cockpit-filter="'+kind+'"]');
  await expect(bar).toBeVisible();
  const controls=bar.locator(':scope > *');
  await expect(controls).toHaveCount(9);
  const boxes=await controls.evaluateAll(elements=>elements.map(el=>{
   const rect=el.getBoundingClientRect();
   return {left:rect.left,top:rect.top,right:rect.right,width:rect.width};
  }));
  for(const box of boxes)expect(Math.abs(box.top-boxes[0].top)).toBeLessThan(3);
  for(let i=1;i<boxes.length;i++)expect(boxes[i].left).toBeGreaterThanOrEqual(boxes[i-1].right-2);
  await expect(bar.getByRole("button",{name:"选择统计时间"})).toHaveText("全部时间");
  await bar.getByRole("button",{name:"选择统计时间"}).click();
  await expect(bar.getByRole("group",{name:"自定义统计时间"})).toBeVisible();
  await bar.getByRole("button",{name:"清空日期"}).click();
 }
});
