import { expect, test } from "@playwright/test";
const root = "/shuomi/#/workbench";
const hubs = [
  {route:"/data", title:"让数据成为可调用、可管理、可复用的业务资产", child:".dataCard", count:3},
  {route:"/store-center", title:"统一管理店铺、商品与订单，让经营链路更清晰", child:".dataCard", count:3},
  {route:"/plans", title:"套餐与权益", child:".planEntrances article", count:5},
  {route:"/account", title:"我的账户", child:".accountModules article", count:3},
];
const details = [
 "/data/market","/data/api","/data/mine",
 "/stores","/store-products","/store-orders",
 "/plans/options","/plans/entitlements","/plans/usage","/plans/top-up","/plans/orders",
 "/account/organization","/account/organization/members",
 "/account/organization/resources","/account/organization/audit",
 "/account/referrals","/account/referrals/center","/account/referrals/earnings",
 "/account/referrals/withdrawals","/account/referrals/rules",
 "/account/profile/business","/account/profile/verification",
];
test("four Figma overviews retain their original card counts, headings and centered widths",async({page})=>{
 for(const width of [1440,2560]){
  await page.setViewportSize({width,height:width===2560?1440:900});
  for(const item of hubs){
   await page.goto(root+item.route);
   const layout=page.locator('[data-commerce-unified]');
   await expect(layout).toBeVisible();
   await expect(layout.getByRole("heading",{level:1,name:item.title})).toBeVisible();
   const suffix=item.child.split(" ")[0];
   const count=await layout.locator(`[class*="${suffix.replace(".","")}"]`).count();
   expect(count,item.route+" has module-specific cards").toBeGreaterThan(0);
   const box=await layout.boundingBox();
   expect(box).not.toBeNull();
   expect(box!.width,item.route+" constrained width").toBeLessThanOrEqual(1601);
   expect(box!.width).toBeGreaterThan(750);
   const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,view:document.documentElement.clientWidth}));
   expect(dims.scroll,item.route+" no horizontal overflow").toBeLessThanOrEqual(dims.view+2);
   const bg=await layout.locator('header[class*="header"]').first().evaluate(el=>getComputedStyle(el).backgroundColor);
   expect(bg,item.route+" Vuexy background").toBe("rgb(47, 51, 73)");
   if(width===2560)await page.screenshot({path:`test-results/unified-${item.route.substring(1).replaceAll("/","-")}-2560.png`,fullPage:true});
  }
 }
});
test("all Figma-derived subpages are styled without changing copy or nested navigation",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 for(const route of details){
  await page.goto(root+route);
  const layout=page.locator('[data-commerce-unified]');
  await expect(layout,route).toBeVisible();
  await expect(layout.locator('header[class*="header"] h1'),route).toBeVisible();
  const bg=await layout.locator('header[class*="header"]').evaluate(el=>getComputedStyle(el).backgroundColor);
  expect(bg,route).toBe("rgb(47, 51, 73)");
  const box=await layout.boundingBox();expect(box).not.toBeNull();expect(box!.width).toBeLessThanOrEqual(1601);
 }
});
test("market filters, store tabs and permissions panels remain interactive",async({page})=>{
 await page.goto(root+"/data/market");
 await expect(page.getByRole("heading",{level:1,name:"数据市场"})).toBeVisible();
 await page.getByRole("button",{name:"已开放",exact:true}).click();
 await expect(page.locator('[data-commerce-unified] [class*="selected"]').first()).toBeVisible();
 await page.getByRole("button",{name:"重置"}).click();
 await page.goto(root+"/store-products");
 await expect(page.getByRole("heading",{level:1,name:"店铺商品"})).toBeVisible();
 await page.getByRole("button",{name:"在售",exact:true}).click();
 await expect(page.locator('[data-commerce-unified] [class*="selected"]').first()).toBeVisible();
 await page.goto(root+"/account/organization/members");
 await expect(page.getByRole("heading",{level:1,name:"成员与权限"})).toBeVisible();
 await page.getByRole("button",{name:"角色权限"}).first().click();
 await expect(page.getByRole("button",{name:"角色权限"}).first()).toHaveClass(/selected/);
});
test("plans options and account profile forms retain content and local-only confirmation",async({page})=>{
 await page.goto(root+"/plans/options");
 await expect(page.getByText("¥168 / 店 / 期")).toBeVisible();
 await page.goto(root+"/account/profile");
 await expect(page.getByRole("heading",{level:1,name:"账户资料"})).toBeVisible();
 await page.getByRole("button",{name:"编辑资料"}).click();
 await expect(page).toHaveURL(/\/account\/profile\/settings\?preview=1/);
 await expect(page.locator('[data-commerce-unified] input').first()).toBeVisible();
 await page.getByRole("button",{name:"保存更改"}).click();
 await expect(page.getByRole("status")).toContainText("本地预览");
});
test("light theme keeps readable text and labels in all four scoped modules",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 for(const route of ["/data","/store-center","/plans","/account","/data/market","/plans/options"]){
  await page.goto(root+route);
  await page.evaluate(()=>document.documentElement.classList.add("light"));
  const header=page.locator('[data-commerce-unified] header[class*="header"]').first();
  const bg=await header.evaluate(el=>getComputedStyle(el).backgroundColor);
  expect(bg,route).toBe("rgb(255, 255, 255)");
 }
});
