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
 await expect(suite.getByRole("heading",{name:"成员资源分配",exact:true})).toHaveCount(0);
 await suite.getByRole("navigation",{name:"企业空间业务导航"}).getByRole("button",{name:"资源与额度",exact:true}).click();
 await expect(page).toHaveURL(/account\/organization\/resources/);
 await expect(page.locator("[data-account-suite]").getByRole("heading",{name:"成员资源分配"})).toBeVisible();
 await page.goto(root+"/account/referrals/earnings");
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
 await expect(rootEl.locator('[class*="serviceRow"]')).toHaveCount(0);
 await rootEl.getByRole("button",{name:"确定",exact:true}).click();
 await expect(rootEl.locator('[class*="serviceRow"]')).toHaveCount(0);
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


test("plans empty usage and orders retain aligned headers without fabricating transactions",async({page})=>{
 await page.goto(root+"/plans/usage");
 const usage=page.locator('[data-commerce-unified="plans"]');
 await expect(usage.locator('[class*="planUsageColumns"]').first().locator("span")).toHaveCount(7);
 await expect(usage.getByText("暂无用量流水。充值或使用资源后将在此显示记录。")).toBeVisible();
 await expect(usage.getByRole("button",{name:"详情"})).toHaveCount(0);
 await expect(usage.getByRole("button",{name:"导出明细"})).toBeDisabled();
 await page.goto(root+"/plans/orders");
 const orders=page.locator('[data-commerce-unified="plans"]');
 await expect(orders.locator('[class*="planOrderColumns"]').first().locator("span")).toHaveCount(6);
 await expect(orders).toContainText("模拟已到账");
 await expect(orders).toContainText("¥10,000.00");
 await orders.getByRole("button",{name:"详情",exact:true}).first().click();
 await expect(page.getByRole("dialog",{name:"订单详情"})).toContainText("模拟充值或服务购买记录");
 await page.getByRole("dialog",{name:"订单详情"}).getByRole("button",{name:"关闭",exact:true}).click();
 await expect(orders.getByRole("button",{name:"导出账单"})).toBeEnabled();
});

test("plans overview shows no payable reminder or fictional last order",async({page})=>{
 await page.goto(root+"/plans");
 const overview=page.locator('[data-commerce-unified="plans"]');
 await expect(overview).toContainText("未来 7 天内到期：0 家");
 await expect(overview).toContainText("暂无待处理店铺");
 await expect(overview.getByRole("button",{name:"处理",exact:true})).toHaveCount(0);
 await expect(overview).toContainText("10,000,000 积分、50,000 条数据");
 await expect(overview).toContainText("模拟购买 4 笔共 ¥1,839.00");
 await expect(overview.getByRole("button",{name:"进入账单与订单"})).toBeVisible();
});

test("empty billing filters remain functional without inventing paid records",async({page})=>{
 await page.goto(root+"/plans/orders");
 const plans=page.locator('[data-commerce-unified="plans"]');
 const rows=plans.locator('[class*="planTableScroll"] [class*="planOrderColumns"][class*="serviceRow"]');
 await expect(rows).toHaveCount(5);
 await plans.getByRole("combobox",{name:"全部状态"}).selectOption("已支付");
 await plans.getByRole("textbox",{name:"搜索账单"}).fill("不存在的订单");
 // Filters are staged until the user confirms them.
 await expect(rows).toHaveCount(5);
 await plans.getByRole("button",{name:"确定",exact:true}).click();
 await expect(rows).toHaveCount(0);
 await plans.getByRole("button",{name:"重置",exact:true}).click();
 await expect(rows).toHaveCount(5);
 await expect(plans.getByRole("combobox",{name:"全部状态"})).toHaveValue("全部状态");
 await expect(plans.getByRole("textbox",{name:"搜索账单"})).toHaveValue("");
 await expect(plans.getByRole("button",{name:"导出账单"})).toBeEnabled();
});
test("plans zero-value balances and free 5 GiB storage agree across all pages",async({page})=>{
 await page.goto(root+"/plans");
 let plans=page.locator('[data-commerce-unified="plans"]');
 await expect(plans).toContainText("0 家");
 await expect(plans).toContainText("8.00 GiB");
 await expect(plans).toContainText("已用 0.00 GiB");
 await expect(plans).not.toContainText("8,650");
 await expect(plans).not.toContainText("300,000 条");
 await page.goto(root+"/plans/entitlements");
 plans=page.locator('[data-commerce-unified="plans"]');
 await expect(plans).toContainText("免费容量");
 await expect(plans).toContainText("5.00 GiB");
 await expect(plans).toContainText("已用容量");
 await expect(plans).toContainText("0.00 GiB");
 await expect(plans.getByRole("button",{name:"前往资源与额度"})).toBeVisible();
 await page.goto(root+"/plans/usage");
 plans=page.locator('[data-commerce-unified="plans"]');
 await expect(plans).toContainText("本月使用 0 条数据");
 await page.goto(root+"/plans/top-up");
 plans=page.locator('[data-commerce-unified="plans"]');
 await expect(plans).toContainText("¥8,161.00");
 await expect(plans).toContainText("累计模拟充值 ¥10,000");
 await expect(plans).toContainText("累计模拟支出 ¥1,839");
 await expect(plans).toContainText("钱包充值流水");
 await expect(plans).toContainText("模拟充值");
});

test("plans visual polish keeps five accessible entries and a grounded storage utilization bar",async({page})=>{
 await page.goto(root+"/plans");
 const plans=page.locator('[data-commerce-unified="plans"]');
 const cards=plans.locator('[class*="planEntryCard"]');
 await expect(cards).toHaveCount(5);
 for(const name of ["套餐方案","我的权益","用量明细","充值中心","账单与订单"])
  await expect(cards.getByRole("button",{name:"进入"+name})).toBeVisible();
 await expect(plans).toContainText("已用 0.00 GiB");
 await expect(plans).toContainText("剩余 8.00 GiB");
 await expect(plans.locator('[class*="usageBar"]')).toHaveCount(4);
 await cards.getByRole("button",{name:"进入我的权益"}).click();
 await expect(page.locator('[data-commerce-unified="plans"] [class*="planEntitlementCards"] article')).toHaveCount(4);
});
test("plans premium cards, empty transactions and purchase controls remain usable in both Vuexy themes",async({page})=>{
 for(const mode of ["light","dark"] as const){
  await page.goto(root+"/plans/entitlements");
  const switcher=page.getByRole("button",{name:mode==="light"?"切换到浅色主题":"切换到深色主题"});
  if(await switcher.count())await switcher.click();
  const entitlement=page.locator('[data-commerce-unified="plans"] [class*="planEntitlementCards"] article');
  await expect(entitlement).toHaveCount(4);
  await expect(entitlement.first().locator('[class*="planEntitlementStoreSplit"]')).toBeVisible();
  for(let i=1;i<4;i++)await expect(entitlement.nth(i).locator('[class*="planEntitlementValue"]')).toBeVisible();
  await page.goto(root+"/plans/top-up");
  const purchase=page.locator('[data-commerce-unified="plans"] [class*="planPurchaseCards"] article');
  await expect(purchase).toHaveCount(4);
  for(let i=0;i<4;i++){
   await expect(purchase.nth(i).locator('[class*="planPurchaseAction"]')).toBeVisible();
   await expect(purchase.nth(i).getByRole("spinbutton")).toBeVisible();
  }
  await page.goto(root+"/plans/usage");
  await expect(page.locator('[data-commerce-unified="plans"]').getByText("暂无用量流水。充值或使用资源后将在此显示记录。")).toBeVisible();
  await expect(page.getByRole("dialog",{name:"流水详情"})).toHaveCount(0);
 }
});


test("plans simulated top-up immediately credits local wallet without actual payment",async({page})=>{
 await page.goto(root+"/plans/top-up");
 const topup=page.locator('[data-commerce-unified="plans"]');
 await expect(topup).toContainText("¥8,161.00");
 await topup.getByRole("spinbutton",{name:"充值金额（元）"}).fill("100");
 await topup.getByRole("button",{name:"账户充值",exact:true}).click();
 const review=page.getByRole("dialog",{name:"确认模拟购买"});
 await expect(review).toContainText("不会扣除真实资金");
 await review.getByRole("button",{name:"返回修改"}).click();
 await topup.getByRole("button",{name:"账户充值",exact:true}).click();
 await review.getByRole("button",{name:"确认模拟充值"}).click();
 await expect(topup).toContainText("¥8,261.00");
 await expect(topup.getByRole("region",{name:"本地充值申请草稿"})).toHaveCount(0);
 await expect(topup.getByRole("region",{name:"模拟钱包充值流水"})).toContainText("模拟充值成功");
 await page.reload();
 await expect(page.locator('[data-commerce-unified="plans"]')).toContainText("¥8,261.00");
});
test("store renewals and storage expansion directly debit demo wallet and credit entitlements",async({page})=>{
 await page.goto(root+"/plans/top-up");
 const area=page.locator('[data-commerce-unified="plans"]');
 const cards=area.locator('[class*="planPurchaseCards"] article');
 await cards.first().getByRole("spinbutton").fill("2");
 await cards.first().getByRole("button",{name:"购买续费期数"}).click();
 let review=page.getByRole("dialog",{name:"确认模拟购买"});
 await expect(review).toContainText("¥336.00");
 await review.getByRole("button",{name:"确认购买并扣除演示余额"}).click();
 await cards.last().getByRole("spinbutton").fill("3");
 await cards.last().getByRole("button",{name:"购买扩容"}).click();
 review=page.getByRole("dialog",{name:"确认模拟购买"});
 await expect(review).toContainText("¥3.00");
 await review.getByRole("button",{name:"确认购买并扣除演示余额"}).click();
 await expect(area).toContainText("¥7,822.00");
 await expect(area.getByRole("region",{name:"本地充值申请草稿"})).toHaveCount(0);
 await page.goto(root+"/plans/entitlements");
 const rights=page.locator('[data-commerce-unified="plans"]');
 await expect(rights.locator('[class*="planEntitlementStoreSplit"]')).toContainText("4");
 await expect(rights).toContainText("11.00 GiB");
 await expect(rights).toContainText("6.00 GiB");
 await page.goto(root+"/plans/orders");
 await expect(page.locator('[data-commerce-unified="plans"]')).toContainText("模拟购买成功");
 await page.getByRole("button",{name:"发票管理"}).click();
 await expect(page.getByRole("dialog",{name:"发票管理"})).toContainText("暂无可开票的真实已支付订单");
});
test("four simulated service purchases debit the 10k wallet and update entitlements without pretending real payment",async({page})=>{
 await page.goto(root+"/plans/top-up");
 const wallet=page.locator('[data-commerce-unified="plans"]');
 await expect(wallet).toContainText("¥8,161.00");
 await expect(wallet).toContainText("累计模拟充值 ¥10,000");
 await expect(wallet).toContainText("累计模拟支出 ¥1,839");
 const ledger=wallet.getByRole("region",{name:"模拟钱包充值流水"});
 await expect(ledger).toContainText("+¥10,000.00");
 for(const amount of ["-¥336.00","-¥1,000.00","-¥500.00","-¥3.00"])await expect(ledger).toContainText(amount);
 await expect(ledger).toContainText("模拟购买");
 await page.goto(root+"/plans/orders");
 const orders=page.locator('[data-commerce-unified="plans"]');
 for(const name of ["店铺服务","token 积分","数据资源","企业存储"])await expect(orders).toContainText(name);
 await expect(orders.locator('[class*="planOrderColumns"][class*="serviceRow"]')).toHaveCount(5);
 await expect(orders).toContainText("模拟购买成功");
 await expect(orders).toContainText("10,000,000 积分");
 await expect(orders).toContainText("50,000 条数据");
 await orders.getByRole("button",{name:"详情",exact:true}).last().click();
 const receipt=page.getByRole("dialog",{name:"订单详情"});
 await expect(receipt).toContainText("模拟充值或服务购买记录");
 await receipt.getByRole("button",{name:"关闭",exact:true}).click();
 await page.goto(root+"/plans/entitlements");
 const rights=page.locator('[data-commerce-unified="plans"]');
 await expect(rights).toContainText("待分配期数");
 await expect(rights).toContainText("2");
 await expect(rights).toContainText("10,000,000");
 await expect(rights).toContainText("50,000");
 await expect(rights).toContainText("免费容量");
 await expect(rights).toContainText("扩容容量");
 await expect(rights).toContainText("3.00 GiB");
 await expect(rights).toContainText("8.00 GiB");
 await expect(rights).toContainText("已用容量");
 await expect(rights).toContainText("0.00 GiB");
 await page.goto(root+"/account/organization");
 await expect(page.locator('[data-account-suite]')).toContainText("8 GiB");
});
test("user-defined conversion rates credit demo AI 10m points and data 50k rows consistently",async({page})=>{
 await page.goto(root+"/plans/options");
 let area=page.locator('[data-commerce-unified="plans"]');
 await expect(area).toContainText("¥1 = 10,000 积分");
 await expect(area).toContainText("¥0.01 / 条");
 await page.goto(root+"/plans/top-up");
 area=page.locator('[data-commerce-unified="plans"]');
 await expect(area).toContainText("¥8,161.00");
 const purchase=area.locator('[class*="planPurchaseCards"] article');
 await purchase.nth(1).getByRole("spinbutton").fill("10");
 await expect(purchase.nth(1)).toContainText("100,000 积分");
 await purchase.nth(2).getByRole("spinbutton").fill("10");
 await expect(purchase.nth(2)).toContainText("1,000 条数据");
 await page.goto(root+"/plans/entitlements");
 area=page.locator('[data-commerce-unified="plans"]');
 await expect(area).toContainText("10,000,000");
 await expect(area).toContainText("50,000");
 await expect(area).toContainText("模拟已到账");
 await page.goto(root+"/plans/orders");
 area=page.locator('[data-commerce-unified="plans"]');
 await expect(area).toContainText("10,000,000 积分");
 await expect(area).toContainText("50,000 条数据");
 await page.goto(root+"/account/organization/resources");
 await expect(page.locator('[data-account-suite]')).toContainText("10,000,000");
 await expect(page.locator('[data-account-suite]')).toContainText("50,000");
});

test("plans entitlement cards show balanced two-value store renewal and three-row storage breakdown",async({page})=>{
 await page.goto(root+"/plans/entitlements");
 const cards=page.locator('[data-commerce-unified="plans"] [class*="planEntitlementCards"] article');
 await expect(cards).toHaveCount(4);
 await expect(cards.nth(0).getByText("已绑定店铺")).toBeVisible();
 await expect(cards.nth(0).getByText("待分配期数")).toBeVisible();
 await expect(cards.nth(0).locator('[class*="planEntitlementStoreSplit"] strong').first()).toContainText("0");
 await expect(cards.nth(0).locator('[class*="planEntitlementStoreSplit"] strong').last()).toContainText("2");
 await expect(cards.nth(1)).toContainText("10,000,000");
 await expect(cards.nth(2)).toContainText("50,000");
 await expect(cards.nth(3)).toContainText("8.00 GiB");
 for(const label of ["免费容量","扩容容量","已用容量"])await expect(cards.nth(3).getByText(label)).toBeVisible();
 await expect(cards.nth(3)).toContainText("5.00 GiB");
 await expect(cards.nth(3)).toContainText("3.00 GiB");
 await expect(cards.nth(3)).toContainText("0.00 GiB");
});
