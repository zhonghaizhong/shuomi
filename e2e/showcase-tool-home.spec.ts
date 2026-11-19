import { expect, test } from "@playwright/test";
const home="/shuomi/#/workbench/tools";

test("Figma tool-market home has exact sections and unchanged content",async({page})=>{
 await page.goto(home);
 await expect(page.getByRole("heading",{name:"连接工具能力，让业务流程更高效"})).toBeVisible();
 const overview=page.locator("[data-tool-home]");
 await expect(overview.locator('[class*="entry"] article')).toHaveCount(3);
 await expect(overview.locator('[class*="capabilityGrid"] article')).toHaveCount(4);
 await expect(overview.locator('[class*="steps"] li')).toHaveCount(4);
 await expect(overview.locator('[class*="notes"] > section')).toHaveCount(2);
 for(const txt of ["浏览平台维护的官方工具，了解商品采集、POD素材等能力，以及适用范围与使用要求。","集中管理已启用的工具，查看授权状态、配置与使用入口，并按实际业务需要调用。","针对特殊采集、系统连接或自动化场景，提交定制需求，说明目标、数据来源和预期成果。","启用后可在「我的工具」管理和配置。支持的工具可在任务或智能体中调用。"]){
  await expect(overview.getByText(txt,{exact:true})).toBeVisible();
 }
});
test("Figma card selection changes highlight without navigating",async({page})=>{
 await page.goto(home);
 const area=page.locator("[data-tool-home]");
 for(const [i,label] of ["选择官方工具卡片","选择我的工具卡片","选择工具定制卡片"].entries()){
  await area.getByRole("button",{name:label}).click();
  await expect(area.locator('[class*="entry"]').nth(i)).toHaveAttribute("data-selected","true");
  await expect(page).toHaveURL(/#\/workbench\/tools$/);
  await expect(area.locator('[class*="entry"][data-selected="true"]')).toHaveCount(1);
 }
});
test("navigate to all three subpages and return twice without broken links",async({page})=>{
 await page.goto(home);
 const entries=[
   {label:"浏览官方工具",path:"official",heading:"官方工具"},
   {label:"管理我的工具",path:"mine",heading:"我的工具"},
   {label:"了解定制服务",path:"custom",heading:"工具定制"},
 ];
 for(let round=0;round<2;round++){
  for(const item of entries){
   await page.getByRole("button",{name:item.label,exact:true}).click();
   await expect(page).toHaveURL(new RegExp("tools/"+item.path+"\\?preview=1"));
   await expect(page.getByRole("heading",{name:item.heading,exact:true})).toBeVisible();
   await page.goBack();
   await expect(page.locator("[data-tool-home]")).toBeVisible();
  }
 }
});
test("Figma layout 1440 and 2560 keeps centered cards, no overflow or clipping",async({page})=>{
 for(const [width,height] of [[1440,900],[2560,1440],[1920,1080]]){
  await page.setViewportSize({width,height});
  await page.goto(home);
  const area=page.locator("[data-tool-home]");
  const bounds=await area.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.width).toBeLessThanOrEqual(1601);
  const geom=await page.evaluate(()=>{
   const articles=[...document.querySelectorAll('[data-tool-home] [class*="entry"]')].filter(x=>x.tagName==="ARTICLE");
   const cards=articles.map(x=>x.getBoundingClientRect());
   return {viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth, cards:cards.map(x=>({top:x.top,height:x.height,width:x.width})), main:document.querySelector("[data-tool-home]")?.getBoundingClientRect().toJSON()};
  });
  expect(geom.scroll, "overflow at "+width).toBeLessThanOrEqual(geom.viewport+2);
  expect(geom.cards).toHaveLength(3);
  for(const rect of geom.cards){
   expect(Math.abs(rect.top-geom.cards[0].top)).toBeLessThan(2);
   expect(rect.height).toBeGreaterThanOrEqual(165);
   expect(rect.width).toBeGreaterThan(250);
  }
  if(width===2560){expect(bounds!.x).toBeGreaterThan(450);expect(width-bounds!.x-bounds!.width).toBeGreaterThan(250);}
  if(width===1440||width===2560) await page.screenshot({path:`test-results/tool-market-home-${width}.png`,fullPage:true});
 }
});
