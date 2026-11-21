import {expect,test} from "@playwright/test";
const root="/shuomi/#/workbench";
const hubs=[
 {route:"/data",heading:"让数据成为可调用、可管理、可复用的业务资产",selector:'[data-commerce-unified="data"]'},
 {route:"/store-center",heading:"统一管理店铺、商品与订单，让经营链路更清晰",selector:"main.showcase-content"},
 {route:"/plans",heading:"套餐与权益",selector:'[data-commerce-unified="plans"]'},
 {route:"/account",heading:"我的账户",selector:'[data-commerce-unified="account"]'},
];
const accountLeaves=["/profile","/profile/settings","/profile/business","/profile/verification",
 "/organization","/organization/members","/organization/roles","/organization/resources","/organization/audit",
 "/referrals","/referrals/center","/referrals/earnings","/referrals/withdrawals","/referrals/rules"];

test("four commerce overview routes render within the responsive canvas",async({page})=>{
 for(const width of [1440,2560]){
  await page.setViewportSize({width,height:width===2560?1440:900});
  for(const hub of hubs){
   await page.goto(root+hub.route);
   await expect(page.locator(hub.selector).first()).toBeVisible();
   if(hub.route==="/store-center"){
    await expect(page.locator("main.showcase-content")).toContainText(/店铺|商品/);
   }else{
    await expect(page.getByRole("heading",{level:1,name:hub.heading,exact:true}).first()).toBeVisible();
   }
   const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
   expect(size.scroll,hub.route+" horizontal overflow").toBeLessThanOrEqual(size.client+2);
  }
 }
 await page.goto(root+"/account");
 await expect(page.locator('[data-commerce-unified="account"] [class*="accountOverview"] article')).toHaveCount(3);
 await expect(page.locator('[data-commerce-unified="account"] [class*="accountModules"] article')).toHaveCount(3);
});

test("commerce subpages and account leaves route to visible content",async({page})=>{
 for(const route of ["/data/market","/data/api","/data/mine","/stores","/store-products","/store-orders",
 "/plans/options","/plans/entitlements","/plans/usage","/plans/top-up","/plans/orders",...accountLeaves.map(x=>"/account"+x)]){
  await page.goto(root+route);
  await expect(page.locator("main.showcase-content")).toBeVisible();
  if(route.startsWith("/account/organization")||route.startsWith("/account/referrals"))
   await expect(page.locator("[data-account-suite]")).toBeVisible();
  if(route.startsWith("/account/profile"))
   await expect(page.locator("[data-account-profile-page]")).toBeVisible();
 }
});

test("store filtering and member invitations are operational",async({page})=>{
 await page.goto(root+"/stores");
 const stores=page.locator("[data-store-center-showcase]");
 await expect(stores).toBeVisible();
 await expect(stores.getByLabel("平台筛选")).toBeVisible();
 await expect(stores.getByLabel("店铺分组筛选")).toBeVisible();
 await page.goto(root+"/account/organization/members");
 const suite=page.locator("[data-account-suite]");
 await suite.getByRole("button",{name:"邀请成员"}).click();
 const dialog=suite.getByRole("dialog",{name:"邀请成员"});
 await expect(dialog).toBeVisible();
 await dialog.getByRole("textbox",{name:"成员姓名"}).fill("综合验收成员");
 await dialog.getByRole("textbox",{name:"成员邮箱"}).fill("commerce-ci@example.com");
 await dialog.getByRole("button",{name:"确认并模拟通过"}).click();
 await expect(suite).toContainText("综合验收成员");
});

test("plans and account profile forms provide editable, persisted demo actions",async({page})=>{
 await page.goto(root+"/plans/options");
 await expect(page.locator("main.showcase-content")).toBeVisible();
 await page.goto(root+"/account/profile/settings");
 const profile=page.locator('[data-account-profile-page="settings"]');
 await expect(profile).toBeVisible();
 const name=profile.getByRole("textbox",{name:"用户名"});
 await name.fill("commerce_acceptance");
 await profile.getByRole("button",{name:"保存更改"}).click();
 await expect(profile.getByRole("status")).toContainText("演示");
 await page.reload();
 await expect(page.locator('[data-account-profile-page="settings"]').getByRole("textbox",{name:"用户名"})).toHaveValue("commerce_acceptance");
});

test("four commerce overview pages remain readable in both Vuexy themes",async({page})=>{
 for(const mode of ["dark","light"] as const){
  await page.goto(root+"/account");
  const toggle=page.getByRole("button",{name:mode==="light"?"切换浅色主题":"切换深色主题"});
  if(await toggle.count())await toggle.click();
  await expect(page.locator("html")).toHaveClass(new RegExp(mode));
  for(const hub of hubs){
   await page.goto(root+hub.route);
   if(hub.route==="/store-center"){
    await expect(page.locator("main.showcase-content")).toContainText(/店铺|商品/);
   }else{
    await expect(page.getByRole("heading",{level:1,name:hub.heading,exact:true}).first()).toBeVisible();
   }
   await expect(page.locator("html")).toHaveClass(new RegExp(mode));
   if(hub.route==="/account"){
    const account=page.locator('[data-commerce-unified="account"]');
    const actual=await account.locator('[class*="accountModules"] article').first().evaluate(e=>getComputedStyle(e).backgroundColor);
    expect(actual).toBe(mode==="light"?"rgb(255, 255, 255)":"rgb(47, 51, 73)");
   }
  }
 }
});

test("account sidebar has three second-level entries, with right-hand leaf navigation",async({page})=>{
 await page.goto(root+"/account/organization/members");
 const sidebar=page.getByRole("navigation",{name:"工作台导航"});
 for(const label of ["账户资料","企业空间","推广与收益"])
  await expect(sidebar.getByRole("link",{name:label,exact:true})).toBeVisible();
 for(const label of ["成员管理","角色权限","资源与额度","推广中心","提现管理"])
  await expect(sidebar.getByRole("link",{name:label,exact:true})).toHaveCount(0);
 const tabs=page.getByRole("navigation",{name:"企业空间业务导航"});
 await tabs.getByRole("button",{name:"角色权限",exact:true}).click();
 await expect(page).toHaveURL(/account\/organization\/roles/);
 await expect(page.getByRole("navigation",{name:"企业空间业务导航"}).getByRole("button",{name:"角色权限",exact:true})).toHaveAttribute("aria-current","page");
 await page.goto(root+"/account/referrals");
 await page.getByRole("navigation",{name:"推广与收益业务导航"}).getByRole("button",{name:"收益明细",exact:true}).click();
 await expect(page).toHaveURL(/account\/referrals\/earnings/);
});

test("personal and enterprise certification tabs save simulated changes",async({page})=>{
 await page.goto(root+"/account/profile/verification");
 const profile=page.locator('[data-account-profile-page="verification"]');
 await expect(profile.getByRole("tab",{name:"企业认证"})).toBeVisible();
 await profile.getByRole("textbox",{name:"法定代表人"}).fill("测试验收法人");
 await profile.getByRole("button",{name:"核对认证资料"}).click();
 await expect(profile.getByRole("status")).toContainText("未发起真实认证");
 await profile.getByRole("tab",{name:"个人认证"}).click();
 await expect(profile.getByRole("textbox",{name:"真实姓名"})).toBeVisible();
 await page.reload();
 await page.locator('[data-account-profile-page="verification"]').getByRole("tab",{name:"企业认证"}).click();
 await expect(page.getByRole("textbox",{name:"法定代表人"})).toHaveValue("测试验收法人");
});

test("enterprise operations and referral transactions have working entry points",async({page})=>{
 await page.goto(root+"/account/organization");
 const suite=page.locator("[data-account-suite]");
 await expect(suite.getByRole("heading",{name:"企业管理"})).toBeVisible();
 await suite.getByRole("navigation",{name:"企业空间业务导航"}).getByRole("button",{name:"资源与额度",exact:true}).click();
 await expect(page).toHaveURL(/account\/organization\/resources/);
 await expect(page.locator("[data-account-suite]").getByRole("heading",{name:"成员资源分配"})).toBeVisible();
 await page.goto(root+"/account/referrals/center");
 await page.locator("[data-account-suite]").getByRole("button",{name:"模拟一笔推广成交并结算"}).click();
 const dialog=page.getByRole("dialog",{name:"模拟推广收益"});
 await dialog.getByRole("textbox",{name:"模拟客户标识"}).fill("COMMERCE-ACCEPTANCE");
 await dialog.getByRole("spinbutton",{name:"模拟佣金金额"}).fill("12.50");
 await dialog.getByRole("button",{name:"确认并模拟通过"}).click();
 await page.goto(root+"/account/referrals/earnings");
 await expect(page.locator("[data-account-suite]")).toContainText("COMMERCE-ACCEPTANCE");
 await expect(page.locator("[data-account-suite]")).toContainText("¥12.50");
});
