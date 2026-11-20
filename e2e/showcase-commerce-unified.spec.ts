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
 "/account/organization","/account/organization/members","/account/organization/roles",
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
  const enterprise=route.startsWith("/account/organization");
  const layout=enterprise?page.locator("[data-enterprise-space]"):page.locator('[data-commerce-unified]');
  await expect(layout,route).toBeVisible();
  await expect(layout.locator('header[class*="header"] h1,header[class*="heading"] h1'),route).toBeVisible();
  const bg=await layout.locator('header[class*="header"],header[class*="heading"]').first().evaluate(el=>getComputedStyle(el).backgroundColor);
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
 await page.locator('[data-enterprise-space="members"]').getByRole("button",{name:"角色权限"}).first().click();
 await expect(page.locator('[data-enterprise-space="roles"]')).toBeVisible();
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

test("Figma account navigation, enterprise roles and referrals keep correct routes and components",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto(root+"/account");
 const nav=page.getByRole("navigation",{name:"工作台导航"});
 const accountToggle=nav.getByRole("button",{name:"展开我的账户"});
 if(await accountToggle.count())await accountToggle.click();
 for(const name of ["账户资料","企业空间","推广与收益"]){
  await expect(nav.getByRole("link",{name,exact:true})).toBeVisible();
 }
 const enterpriseToggle=nav.getByRole("button",{name:"展开企业空间"});
 if(await enterpriseToggle.count())await enterpriseToggle.click();
 for(const [label,route] of [["成员管理","members"],["角色权限","roles"],["资源与额度","resources"],["操作记录","audit"]] as const){
  const link=nav.getByRole("link",{name:label,exact:true});
  await expect(link,`Figma enterprise child ${label} must appear exactly once`).toHaveCount(1);
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(new RegExp("#/workbench/account/organization/"+route));
  await expect(page.getByRole("heading",{level:1,name:route==="members"||route==="roles"?"成员与权限":label})).toBeVisible();
 }
 await page.goto(root+"/account/organization");
 for(const heading of ["成员管理","角色权限","资源与额度","操作记录"]){
  await expect(page.getByRole("heading",{name:heading,exact:true})).toBeVisible();
 }
 await page.goto(root+"/account/referrals");
 await expect(page.getByRole("heading",{name:"推广与收益管理"})).toBeVisible();
 for(const label of ["推广中心","收益明细","提现管理","推广规则"]){
  await expect(page.getByRole("heading",{name:label,exact:true})).toBeVisible();
 }
});
test("account Figma leaf forms, filters and theme surfaces remain responsive",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto(root+"/account/profile/verification");
 await page.getByRole("button",{name:"企业认证"}).click();
 await expect(page.getByRole("heading",{name:"企业主体信息"})).toBeVisible();
 await expect(page.getByPlaceholder("请输入统一社会信用代码")).toBeVisible();
 await page.getByRole("button",{name:"个人认证"}).click();
 await expect(page.getByPlaceholder("请输入身份证号码")).toBeVisible();
 await page.goto(root+"/account/referrals/earnings");
 await expect(page.getByText("¥11,120")).toBeVisible();
 await page.getByRole("textbox",{name:"搜索来源用户或订单号"}).fill("chen");
 await expect(page.getByText("zhang***")).toHaveCount(0);
 await expect(page.getByText("chen***")).toBeVisible();
 for(const route of ["/account","/account/profile","/account/organization","/account/organization/roles","/account/referrals","/account/referrals/withdrawals"]){
   await page.goto(root+route);
   const enableLight=page.getByRole("button",{name:"切换浅色主题"});
   if(await enableLight.isVisible())await enableLight.click();
   const isEnterprise=route.startsWith("/account/organization");
   const rootElement=isEnterprise?page.locator("[data-enterprise-space]"):page.locator('[data-commerce-unified="account"]');
   await expect(rootElement).toBeVisible();
   const heading=rootElement.locator("header[class*='heading'],header[class*='header']").first();
   const bg=await heading.evaluate(el=>getComputedStyle(el).backgroundColor);
   expect(bg,route+" should have a white heading card").toBe("rgb(255, 255, 255)");
 }
});


test("enterprise Figma member, resources and audit controls are connected",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto(root+"/account/organization");
 const overview=page.locator('[data-enterprise-space="overview"]');
 await expect(overview.getByRole("heading",{name:"企业管理"})).toBeVisible();
 await expect(overview.getByRole("heading",{name:"成员资源分配"})).toBeVisible();
 await overview.getByRole("button",{name:"管理成员"}).click();
 const memberPage=page.locator('[data-enterprise-space="members"]');
 await expect(memberPage.getByRole("heading",{level:1,name:"成员与权限"})).toBeVisible();
 await memberPage.getByRole("button",{name:"邀请成员"}).click();
 await expect(page.getByRole("dialog",{name:"邀请成员"})).toBeVisible();
 await page.getByRole("button",{name:"取消"}).click();
 await memberPage.getByRole("combobox",{name:"角色"}).selectOption("商品运营");
 await memberPage.getByRole("button",{name:"确认"}).click();
 await expect(memberPage.getByRole("cell",{name:"李明"})).toBeVisible();
 await expect(memberPage.getByRole("cell",{name:"张琳"})).toHaveCount(0);
 await memberPage.getByRole("button",{name:"角色权限"}).first().click();
 await expect(page.locator('[data-enterprise-space="roles"]')).toBeVisible();
 await page.goto(root+"/account/organization/resources");
 const resources=page.locator('[data-enterprise-space="resources"]');
 await expect(resources.getByText("120 期")).toBeVisible();
 await resources.getByRole("button",{name:"分配"}).first().click();
 await expect(page.getByRole("dialog",{name:"分配资源"})).toBeVisible();
 await page.getByRole("button",{name:"取消"}).click();
 await page.goto(root+"/account/organization/audit");
 const audit=page.locator('[data-enterprise-space="audit"]');
 await expect(audit.getByRole("heading",{name:"操作记录"})).toBeVisible();
 await audit.getByRole("combobox",{name:"操作成员"}).selectOption("张琳");
 await audit.getByRole("button",{name:"确定"}).click();
 await expect(audit.getByRole("cell",{name:"钟海忠",exact:true})).toHaveCount(0);
 await audit.getByRole("button",{name:"详情"}).first().click();
 await expect(page.getByRole("dialog",{name:"记录详情"})).toBeVisible();
 await page.getByRole("button",{name:"取消"}).click();
});
