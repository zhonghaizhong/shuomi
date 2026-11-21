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
 await expect(suite.getByRole("heading",{name:"企业资源",exact:true})).toBeVisible();
 await expect(suite.getByRole("heading",{name:"成员资源分配",exact:true})).toBeVisible();
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


test("plans five Figma secondary routes use Vuexy cards and preserve pricing navigation",async({page})=>{
 test.setTimeout(120000);
 const leaves=[["options","套餐方案"],["entitlements","我的权益"],["usage","用量明细"],["top-up","充值中心"],["orders","账单与订单"]] as const;
 await page.setViewportSize({width:1440,height:900});
 await page.goto(root+"/plans");
 const overview=page.locator('[data-commerce-unified="plans"]');
 for(const [,label] of leaves)await expect(overview.getByRole("heading",{name:label,exact:true})).toBeVisible();
 for(const [slug,label] of leaves){
  await page.goto(root+"/plans/"+slug);
  const detail=page.locator('[data-commerce-unified="plans"]');
  await expect(detail).toBeVisible();
  await expect(detail.getByRole("heading",{level:1,name:label,exact:true})).toBeVisible();
 }
 for(const mode of ["light","dark"] as const){
  await page.goto(root+"/plans/options");
  const toggle=page.getByRole("button",{name:mode==="light"?"切换浅色主题":"切换深色主题"});
  if(await toggle.count())await toggle.click();
  await expect(page.locator("html")).toHaveClass(new RegExp(mode));
  const cards=page.locator('[data-commerce-unified="plans"] [class*="fourCards"] article');
  await expect(cards).toHaveCount(4);
  for(const card of await cards.all()){
   const bg=await card.evaluate(e=>getComputedStyle(e).backgroundColor);
   expect(bg,mode+" Vuexy card surface").toBe(mode==="light"?"rgb(255, 255, 255)":"rgb(47, 51, 73)");
  }
  await page.goto(root+"/plans/entitlements");
  await expect(page.locator('[data-commerce-unified="plans"] [class*="fourCards"] article')).toHaveCount(4);
 }
});
test("plans usage flow filters and top-up estimates work without issuing real charges",async({page})=>{
 await page.goto(root+"/plans/usage");
 const rootEl=page.locator('[data-commerce-unified="plans"]');
 await expect(rootEl.getByRole("button",{name:"全部流水"})).toBeVisible();
 await expect(rootEl.getByRole("button",{name:"店铺费用"})).toBeVisible();
 await expect(rootEl.getByRole("combobox",{name:"变动类型"})).toBeVisible();
 await expect(rootEl.getByRole("combobox",{name:"关联店铺"})).toBeVisible();
 await rootEl.getByRole("combobox",{name:"变动类型"}).selectOption("扣减");
 await rootEl.getByRole("textbox",{name:"搜索流水"}).fill("商品优化");
 await expect(rootEl.locator('[class*="serviceRow"]')).toHaveCount(4);
 await rootEl.getByRole("button",{name:"确定",exact:true}).click();
 await expect(rootEl.locator('[class*="serviceRow"]')).toHaveCount(1);
 await rootEl.getByRole("button",{name:"重置"}).click();
 await expect(rootEl.getByRole("combobox",{name:"变动类型"})).toHaveValue("全部变动");
 await expect(rootEl.getByRole("textbox",{name:"搜索流水"})).toHaveValue("");
 await page.goto(root+"/plans/top-up");
 const cards=page.locator('[data-commerce-unified="plans"] [class*="planPurchaseCards"] article');
 await expect(cards).toHaveCount(4);
 for(const [i,title] of ["店铺服务","token 积分","数据资源","企业存储"].entries())
  await expect(cards.nth(i).getByRole("heading",{name:title})).toBeVisible();
 const store=cards.first();
 await expect(store.getByRole("button",{name:"购买续费期数"})).toBeDisabled();
 await store.getByRole("spinbutton",{name:/购买期数/}).fill("2");
 await expect(store).toContainText("¥336.00");
 await expect(store.getByRole("button",{name:"购买续费期数"})).toBeEnabled();
 const storage=cards.last();
 await storage.getByRole("spinbutton",{name:/扩容容量/}).fill("3");
 await expect(storage).toContainText("¥3.00");
 await expect(storage.getByRole("button",{name:"购买扩容"})).toBeEnabled();
 await page.goto(root+"/plans/orders");
 await expect(page.locator('[data-commerce-unified="plans"] [class*="metrics"] article')).toHaveCount(4);
});


test("plans details show selected transaction with aligned columns and close safely",async({page})=>{
 await page.goto(root+"/plans/usage");
 const usage=page.locator('[data-commerce-unified="plans"]');
 const usageColumns=usage.locator('[class*="planUsageColumns"]');
 await expect(usageColumns).toHaveCount(5);
 await expect(usageColumns.first().locator("span")).toHaveCount(7);
 await usage.getByRole("button",{name:"详情"}).first().click();
 const detail=page.getByRole("dialog",{name:"流水详情"});
 await expect(detail).toBeVisible();
 await expect(detail).toContainText("商品标题与卖点优化");
 await detail.getByRole("button",{name:"关闭",exact:true}).click();
 await expect(detail).toHaveCount(0);
 await page.goto(root+"/plans/orders");
 const orders=page.locator('[data-commerce-unified="plans"]');
 await expect(orders.locator('[class*="planOrderColumns"]').first().locator("span")).toHaveCount(6);
 await orders.getByRole("button",{name:"详情"}).first().click();
 const orderDialog=page.getByRole("dialog",{name:"订单详情"});
 await expect(orderDialog).toContainText("一号店续费 2 期");
 await orderDialog.getByRole("button",{name:"关闭",exact:true}).click();
 await expect(orderDialog).toHaveCount(0);
});
test("plans overview omits unnecessary actions for normal account states",async({page})=>{
 await page.goto(root+"/plans");
 const overview=page.locator('[data-commerce-unified="plans"]');
 await expect(overview).toContainText("未来 7 天内到期：1 家");
 await expect(overview.getByRole("button",{name:"处理"})).toBeVisible();
 await expect(overview).toContainText("无需充值");
 await expect(overview.getByRole("button",{name:"查看账单"})).toBeVisible();
});


test("billing filters wait until confirmation, then reset and export reflect applied selection",async({page})=>{
 await page.goto(root+"/plans/orders");
 const plans=page.locator('[data-commerce-unified="plans"]');
 const rows=plans.locator('[class*="planTableScroll"] [class*="planOrderColumns"][class*="serviceRow"]');
 await expect(rows).toHaveCount(5);
 await plans.getByRole("combobox",{name:"全部状态"}).selectOption("已支付");
 await plans.getByRole("textbox",{name:"搜索账单"}).fill("一号店");
 await expect(rows).toHaveCount(5);
 await plans.getByRole("button",{name:"确定",exact:true}).click();
 await expect(rows).toHaveCount(1);
 await expect(rows.first()).toContainText("一号店续费");
 await plans.getByRole("button",{name:"重置",exact:true}).click();
 await expect(rows).toHaveCount(5);
 await expect(plans.getByRole("combobox",{name:"全部状态"})).toHaveValue("全部状态");
});
test("plans shared demo balances match across overview, entitlements, usage and wallet",async({page})=>{
 await page.goto(root+"/plans");
 let plans=page.locator('[data-commerce-unified="plans"]');
 await expect(plans).toContainText("8,650");
 await expect(plans).toContainText("300,000 条");
 await expect(plans).toContainText("2.75 GiB");
 await page.goto(root+"/plans/entitlements");
 plans=page.locator('[data-commerce-unified="plans"]');
 for(const value of ["8,650","300,000 条","2.75 GiB"])await expect(plans).toContainText(value);
 await page.goto(root+"/plans/top-up");
 await expect(page.locator('[data-commerce-unified="plans"]')).toContainText("¥5,000.00（演示）");
});
