import {expect,test} from "@playwright/test";

const routes=[
 "/supply/catalogs",
 "/supply/catalogs/selection",
 "/supply/catalogs/apply",
 "/supply/applications/new",
 "/supply/applications/progress",
 "/supply/applications/records",
] as const;
const colorChannels=(color:string)=>color.match(/\d+(?:\.\d+)?/g)?.slice(0,3).map(Number)??[];
const isPale=(color:string)=>{
 const channels=colorChannels(color);
 return channels.length===3&&channels.every(value=>value>=225);
};
test("catalog integrations and preferred application submenus use light backgrounds",async({page})=>{
 test.setTimeout(160000);
 await page.setViewportSize({width:1440,height:900});
 for(const route of routes){
  await page.goto("/shuomi/#/workbench"+route);
  await page.getByRole("button",{name:"切换浅色主题"}).click();
  const root=page.locator('[class*="supplyDetailPreview"]');
  await expect(root,route).toBeVisible();
  const surfaces=root.locator('[class*="header"],[class*="filterBox"],[class*="table"],[class*="toolbar"],[class*="warehouses"] > article,[class*="twoCards"] > article,[class*="split"] > article,[class*="metrics"] > article,[class*="noticeBar"]');
  const count=Math.min(await surfaces.count(),14);
  for(let i=0;i<count;i++){
   const item=surfaces.nth(i);
   if(!(await item.isVisible()))continue;
   const bg=await item.evaluate(el=>getComputedStyle(el).backgroundColor);
   if(bg!=="rgba(0, 0, 0, 0)")expect(isPale(bg),route+" element "+i+" uses "+bg).toBeTruthy();
  }
  const fg=await root.evaluate(el=>getComputedStyle(el).color);
  const channels=colorChannels(fg);
  expect(Math.max(...channels),route+" foreground should be dark").toBeLessThan(140);
 }
});
test("catalog and application surfaces restore dark theme",async({page})=>{
 await page.goto("/shuomi/#/workbench/supply/catalogs/selection");
 await page.getByRole("button",{name:"切换浅色主题"}).click();
 await page.getByRole("button",{name:"切换深色主题"}).click();
 const item=page.locator('[class*="supplyDetailPreview"] [class*="filterBox"]').first();
 await expect(item).toBeVisible();
 const bg=await item.evaluate(el=>getComputedStyle(el).backgroundColor);
 expect(isPale(bg)).toBeFalsy();
});
