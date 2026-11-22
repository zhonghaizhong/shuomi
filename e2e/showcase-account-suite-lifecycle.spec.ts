import {expect,test} from "@playwright/test";
const base="/shuomi/#/workbench/account";
test("legacy account demo records are cleared once while preserving the new company fixture",async({page})=>{
 await page.goto(base);
 await page.evaluate(()=>{
   localStorage.removeItem("shuomi-account-fixture-reset-20261121-v2");
   localStorage.setItem("shuomi-demo-account-suite-SM-ENT-000001-v1",JSON.stringify({
    members:[{id:"admin",name:"旧管理员",email:"old@example.com",role:"管理员",status:"正常",joined:1},{id:"legacy",name:"张琳",email:"legacy@example.com",role:"运营负责人",status:"正常",joined:1}],
    audit:[],roles:["管理员"],allocations:{},referrals:[{id:"a",at:1,referred:"旧客户",amount:3260,status:"已结算"}],withdrawals:[],payoutAccount:"OLD",referralCode:"OLD"
   }));
   localStorage.setItem("shuomi-demo-security-SM-ENT-000001",JSON.stringify({phone:"13811112222",email:"old@example.com",passwordUpdated:"旧日期"}));
   localStorage.setItem("shuomi-demo-credential-files-SM-ENT-000001",JSON.stringify({"营业执照":{name:"legacy.pdf",size:10,type:"application/pdf",at:1}}));
   sessionStorage.setItem("shuomi-demo-account-settings-SM-ENT-000001",JSON.stringify({name:"old_user",city:"杭州市"}));
   sessionStorage.setItem("shuomi-demo-business-profile-SM-ENT-000001",JSON.stringify({roles:["旧企业"],shops:"已有店铺"}));
 });
 await page.reload();
 await expect(page.locator('[data-commerce-unified="account"]')).toContainText("武汉硕米电子商务有限公司");
 await expect(page.locator('[data-commerce-unified="account"]')).toContainText("¥0.00");
 await expect(page.locator('[data-commerce-unified="account"]')).not.toContainText("张琳");
 await page.goto(base+"/profile");
 await expect(page.locator('[data-account-profile-page="overview"]')).toContainText("linchen_demo");
 await expect(page.locator('[data-account-profile-page="overview"]')).not.toContainText("old_user");
 await page.goto(base+"/profile/settings");
 await expect(page.locator('[data-account-profile-page="settings"]')).toContainText("admin@example.com");
 await page.goto(base+"/profile/verification");
 await expect(page.locator('[data-document-kind="business"]')).not.toContainText("legacy.pdf");
 await page.goto(base+"/organization/members");
 const suite=page.locator("[data-account-suite]");
 await expect(suite.getByRole("row")).toHaveCount(2);
 await expect(suite).not.toContainText("张琳");
 await page.reload();
 await expect(suite.getByRole("row")).toHaveCount(2);
 const marker=await page.evaluate(()=>localStorage.getItem("shuomi-account-fixture-reset-20261121-v2"));
 expect(marker).toBe("done");
});

test("synthetic enterprise uses one tenant across account home, members, roles and audit",async({page})=>{
 await page.goto(base);
 const root=page.locator('[data-commerce-unified="account"]');
 await expect(root).toContainText("武汉硕米电子商务有限公司");
 await expect(root).not.toContainText("¥3,260");
 await expect(root).not.toContainText("张琳");
 await root.getByRole("button",{name:"进入空间"}).click();
 const suite=page.locator("[data-account-suite]");
 await expect(suite).toContainText("武汉硕米电子商务有限公司");
 await expect(suite).toContainText("企业成员");
 await expect(suite.locator('[class*="metrics"]')).toContainText("0");
 await page.goto(base+"/organization/members");
 await expect(suite.getByRole("row")).toHaveCount(2);
 await suite.getByRole("button",{name:"邀请成员"}).click();
 const invite=suite.getByRole("dialog",{name:"邀请成员"});
 await invite.getByRole("textbox",{name:"成员姓名"}).fill("模拟运营人员");
 await invite.getByRole("textbox",{name:"成员邮箱"}).fill("operator@example.com");
 await invite.getByRole("combobox",{name:"业务角色"}).selectOption("商品运营");
 await invite.getByRole("button",{name:"确认并模拟通过"}).click();
 await expect(suite.getByRole("row").filter({hasText:"模拟运营人员"})).toBeVisible();
 await page.reload();
 await expect(suite.getByRole("row").filter({hasText:"模拟运营人员"})).toBeVisible();
 await suite.getByRole("row").filter({hasText:"模拟运营人员"}).getByRole("button",{name:"查看 / 调整"}).click();
 const manage=suite.getByRole("dialog",{name:"管理成员"});
 await manage.getByRole("combobox",{name:"业务角色"}).selectOption("运营负责人");
 await manage.getByRole("button",{name:"确认并模拟通过"}).click();
 await expect(suite.getByRole("row").filter({hasText:"模拟运营人员"})).toContainText("运营负责人");
 await page.goto(base+"/organization/roles");
 await expect(suite.getByRole("row").filter({hasText:"运营负责人"})).toContainText("1 人");
 await page.goto(base+"/organization/audit");
 await expect(suite).toContainText("邀请并模拟审核通过");
 await expect(suite).toContainText("调整成员");
 await page.goto(base+"/organization/resources");
 await expect(suite).toContainText("模拟已到账");
 await expect(suite).toContainText("10,000,000");
 await expect(suite).toContainText("50,000");
 await expect(suite).toContainText("0 GiB");
});
test("synthetic referral flow starts at zero and updates earnings and withdrawal records",async({page})=>{
 await page.goto(base+"/referrals");
 const suite=page.locator("[data-account-suite]");
 await expect(suite).toContainText("¥0.00");
 await page.goto(base+"/referrals/center");
 await suite.getByRole("button",{name:"模拟一笔推广成交并结算"}).click();
 const dialog=suite.getByRole("dialog",{name:"模拟推广收益"});
 await dialog.getByRole("textbox",{name:"模拟客户标识"}).fill("TEST-CUSTOMER-001");
 await dialog.getByRole("spinbutton",{name:"模拟佣金金额"}).fill("120");
 await dialog.getByRole("button",{name:"确认并模拟通过"}).click();
 await page.goto(base+"/referrals/earnings");
 await expect(suite).toContainText("TEST-CUSTOMER-001");
 await expect(suite).toContainText("¥120.00");
 await page.goto(base+"/referrals/withdrawals");
 await suite.getByRole("button",{name:"设置收款方式"}).click();
 const account=suite.getByRole("dialog",{name:"设置收款方式"});
 await account.getByRole("textbox",{name:"演示收款标识"}).fill("TEST-PAYOUT-001");
 await account.getByRole("button",{name:"确认并模拟通过"}).click();
 await suite.getByRole("button",{name:"申请模拟提现"}).click();
 const withdrawal=suite.getByRole("dialog",{name:"模拟提现"});
 await withdrawal.getByRole("spinbutton",{name:"模拟提现金额"}).fill("120");
 await withdrawal.getByRole("button",{name:"确认并模拟通过"}).click();
 await expect(suite).toContainText("模拟审核通过");
 await page.goto(base+"/referrals/earnings");
 await expect(suite).toContainText("已提现（模拟）");
 await page.goto(base);
 await expect(page.locator('[data-commerce-unified="account"]')).toContainText("¥0.00");
 await page.goto(base+"/organization/audit");
 await expect(suite).toContainText("模拟提现并审核通过");
});
test("enterprise and referral subpages preserve approved dark/light surfaces and do not overflow",async({page})=>{
 for(const route of ["/organization","/organization/members","/organization/roles","/organization/resources","/organization/audit","/referrals","/referrals/center","/referrals/earnings","/referrals/withdrawals","/referrals/rules"]){
  await page.setViewportSize({width:1440,height:900});
  await page.goto(base+route);
  const suite=page.locator("[data-account-suite]");
  await expect(suite).toBeVisible();
  const light=page.getByRole("button",{name:"切换浅色主题"});if(await light.isVisible())await light.click();
  const bg=await suite.locator(":scope > header").evaluate(x=>getComputedStyle(x).backgroundColor);
  expect(bg).toBe("rgb(255, 255, 255)");
  const dark=page.getByRole("button",{name:"切换深色主题"});if(await dark.isVisible())await dark.click();
  const darkBg=await suite.locator(":scope > header").evaluate(x=>getComputedStyle(x).backgroundColor);
  expect(darkBg).toBe("rgb(47, 51, 73)");
  await expect(suite).toContainText("武汉硕米电子商务有限公司");
 }
});

test("account submenus navigate without dead ends and preserve navigation state",async({page})=>{
 await page.goto(base+"/organization");
 for(const [name,suffix] of [["成员管理","organization/members"],["角色权限","organization/roles"],["资源与额度","organization/resources"],["操作记录","organization/audit"]] as const){
  const nav=page.getByRole("navigation",{name:"企业空间业务导航"});
  await nav.getByRole("button",{name,exact:true}).click();
  await expect(page).toHaveURL(new RegExp("/account/"+suffix.replaceAll("/","\\/")));
  await expect(page.locator("[data-account-suite]")).toContainText("武汉硕米电子商务有限公司");
  await expect(page.getByRole("navigation",{name:"企业空间业务导航"}).getByRole("button",{name,exact:true})).toHaveAttribute("aria-current","page");
 }
 await page.goto(base+"/referrals");
 for(const [name,suffix] of [["推广中心","referrals/center"],["收益明细","referrals/earnings"],["提现管理","referrals/withdrawals"],["推广规则","referrals/rules"]] as const){
  const nav=page.getByRole("navigation",{name:"推广与收益业务导航"});
  await nav.getByRole("button",{name,exact:true}).click();
  await expect(page).toHaveURL(new RegExp("/account/"+suffix.replaceAll("/","\\/")));
  await expect(page.locator("[data-account-suite]")).toContainText("武汉硕米电子商务有限公司");
  await expect(page.getByRole("navigation",{name:"推广与收益业务导航"}).getByRole("button",{name,exact:true})).toHaveAttribute("aria-current","page");
 }
 await page.goto(base+"/profile");
 const profileNav=page.getByRole("navigation",{name:"账户资料二级导航"});
 for(const [name,suffix] of [["账户设置","/settings"],["经营画像","/business"],["认证信息","/verification"],["账户概览",""]] as const){
  await profileNav.getByRole("button",{name}).click();
  await expect(page.locator("[data-account-profile-page]")).toBeVisible();
  await expect(page.locator("[data-account-profile-page]").getByRole("navigation",{name:"账户资料二级导航"}).getByRole("button",{name})).toHaveAttribute("aria-current","page");
 }
});
test("role permission editing persists and affects linked role rows",async({page})=>{
 await page.goto(base+"/organization/roles");
 const suite=page.locator("[data-account-suite]");
 const role=suite.getByRole("row").filter({hasText:"商品运营"});
 await role.getByRole("button",{name:"配置权限"}).click();
 const dialog=suite.getByRole("dialog",{name:"配置角色权限"});
 await dialog.getByRole("checkbox",{name:"数据服务"}).check();
 await dialog.getByRole("checkbox",{name:"供应市场"}).uncheck();
 await dialog.getByRole("button",{name:"确认并模拟通过"}).click();
 await expect(role).toContainText("数据服务");
 await expect(role).not.toContainText("供应市场");
 await page.reload();
 await expect(suite.getByRole("row").filter({hasText:"商品运营"})).toContainText("数据服务");
 await page.goto(base+"/organization/audit");
 await expect(suite).toContainText("更新角色 商品运营 权限");
});
test("per member storage allocation is bounded by enterprise capacity and logged",async({page})=>{
 await page.goto(base+"/organization/members");
 const suite=page.locator("[data-account-suite]");
 await suite.getByRole("button",{name:"邀请成员"}).click();
 let dialog=suite.getByRole("dialog",{name:"邀请成员"});
 await dialog.getByRole("textbox",{name:"成员姓名"}).fill("模拟资源运营");
 await dialog.getByRole("textbox",{name:"成员邮箱"}).fill("resource@example.com");
 await dialog.getByRole("button",{name:"确认并模拟通过"}).click();
 await page.goto(base+"/organization/resources");
 await suite.getByRole("row").filter({hasText:"模拟资源运营"}).getByRole("button",{name:"分配存储"}).click();
 dialog=suite.getByRole("dialog",{name:"分配成员存储"});
 await dialog.getByRole("spinbutton",{name:"成员存储上限"}).fill("9");
 await dialog.getByRole("button",{name:"确认并模拟通过"}).click();
 await expect(dialog.getByRole("alert")).toContainText("超出企业可分配");
 await dialog.getByRole("spinbutton",{name:"成员存储上限"}).fill("2.5");
 await dialog.getByRole("button",{name:"确认并模拟通过"}).click();
 await expect(suite.getByRole("row").filter({hasText:"模拟资源运营"})).toContainText("2.5 GiB");
 await page.reload();
 await expect(suite).toContainText("剩余 5.5 GiB");
 await page.goto(base+"/organization/audit");
 await expect(suite).toContainText("存储上限：2.5 GiB");
});
test("partial withdrawals retain remaining earnings and save independent withdrawal records",async({page})=>{
 await page.goto(base+"/referrals/center");
 const suite=page.locator("[data-account-suite]");
 await suite.getByRole("button",{name:"模拟一笔推广成交并结算"}).click();
 let dialog=suite.getByRole("dialog",{name:"模拟推广收益"});
 await dialog.getByRole("textbox",{name:"模拟客户标识"}).fill("TEST-PARTIAL");
 await dialog.getByRole("spinbutton",{name:"模拟佣金金额"}).fill("120");
 await dialog.getByRole("button",{name:"确认并模拟通过"}).click();
 await page.goto(base+"/referrals/withdrawals");
 await suite.getByRole("button",{name:"设置收款方式"}).click();
 dialog=suite.getByRole("dialog",{name:"设置收款方式"});
 await dialog.getByRole("textbox",{name:"演示收款标识"}).fill("TEST-ACCOUNT");
 await dialog.getByRole("button",{name:"确认并模拟通过"}).click();
 await suite.getByRole("button",{name:"申请模拟提现"}).click();
 dialog=suite.getByRole("dialog",{name:"模拟提现"});
 await dialog.getByRole("spinbutton",{name:"模拟提现金额"}).fill("45.50");
 await dialog.getByRole("button",{name:"确认并模拟通过"}).click();
 await expect(suite).toContainText("¥74.50");
 await expect(suite).toContainText("¥45.50");
 await page.goto(base+"/referrals/earnings");
 await expect(suite).toContainText("¥74.50");
 await expect(suite).toContainText("¥45.50");
});
test("simulated certification changes are locally saved and reflected in preview after reload",async({page})=>{
 await page.goto(base+"/profile/verification");
 const root=page.locator('[data-account-profile-page="verification"]');
 await root.getByRole("textbox",{name:"法定代表人"}).fill("模拟测试法人");
 await root.getByRole("button",{name:"核对认证资料"}).click();
 await expect(root.getByRole("status")).toContainText("未发起真实认证");
 await page.reload();
 await expect(root.getByRole("textbox",{name:"法定代表人"})).toHaveValue("模拟测试法人");
 await root.getByRole("tab",{name:"个人认证"}).click();
 await root.getByRole("textbox",{name:"真实姓名"}).fill("演示身份");
 await root.getByRole("button",{name:"核对认证资料"}).click();
 await page.reload();
 await root.getByRole("tab",{name:"个人认证"}).click();
 await expect(root.getByRole("textbox",{name:"真实姓名"})).toHaveValue("演示身份");
});

test("account suite keeps Figma submenu groups separate and Escape closes dialogs",async({page})=>{
 await page.goto(base+"/organization/members");
 const enterprise=page.getByRole("navigation",{name:"企业空间业务导航"});
 await expect(enterprise.getByRole("button",{name:"成员管理"})).toHaveAttribute("aria-current","page");
 await expect(enterprise.getByRole("button",{name:"角色权限"})).toBeVisible();
 await expect(enterprise.getByRole("button",{name:"推广中心"})).toHaveCount(0);
 await page.getByRole("button",{name:"邀请成员"}).click();
 await expect(page.getByRole("dialog",{name:"邀请成员"})).toBeVisible();
 await page.keyboard.press("Escape");
 await expect(page.getByRole("dialog",{name:"邀请成员"})).toHaveCount(0);
 await page.goto(base+"/referrals/earnings");
 const referrals=page.getByRole("navigation",{name:"推广与收益业务导航"});
 await expect(referrals.getByRole("button",{name:"收益明细"})).toHaveAttribute("aria-current","page");
 await expect(referrals.getByRole("button",{name:"提现管理"})).toBeVisible();
 await expect(referrals.getByRole("button",{name:"成员管理"})).toHaveCount(0);
});

test("enterprise overview matches Figma business sections without changing customized tertiary tabs",async({page})=>{
 await page.goto(base+"/organization");
 const root=page.locator('[data-account-suite="/organization"]');
 await expect(root).toBeVisible();
 for(const heading of ["企业空间","企业资源","成员资源分配"])
  await expect(root.getByRole("heading",{name:heading,exact:true})).toBeVisible();
 const summary=root.getByRole("region",{name:"企业空间概览"});
 await expect(summary.getByText("企业成员",{exact:true})).toBeVisible();
 await expect(summary.getByText("已绑定店铺")).toBeVisible();
 await expect(summary.getByText("待处理邀请")).toBeVisible();
 const tabs=root.getByRole("navigation",{name:"企业空间业务导航"});
 const labels=["企业空间","成员管理","角色权限","资源与额度","操作记录"];
 await expect(tabs.getByRole("button")).toHaveCount(labels.length);
 for(const [index,label] of labels.entries())
  await expect(tabs.getByRole("button").nth(index)).toHaveText(label);
 const resource=root.getByRole("region",{name:"企业资源"});
 await expect(root.getByRole("region",{name:"企业管理"})).toHaveCount(0);
 for(const label of ["店铺","AI 积分","数据额度","企业存储"])
  await expect(resource.getByText(label,{exact:true})).toBeVisible();
 await expect(resource.locator('[class*="resourceSummary"] article')).toHaveCount(4);
 await expect(resource.getByRole("progressbar",{name:"已分配企业存储"})).toBeVisible();
 const allocation=root.getByRole("region",{name:"成员资源分配"});
 await expect(allocation.getByRole("columnheader",{name:"成员 / 角色"})).toBeVisible();
 await expect(allocation.getByRole("columnheader",{name:"存储上限（GiB）"})).toBeVisible();
 await tabs.getByRole("button",{name:"成员管理",exact:true}).click();
 await expect(page).toHaveURL(/account\/organization\/members/);
 await page.getByRole("navigation",{name:"企业空间业务导航"}).getByRole("button",{name:"角色权限",exact:true}).click();
 await expect(page).toHaveURL(/account\/organization\/roles/);
});

test("enterprise Vuexy landing layout respects stats, spacing and preserved tabs in both themes",async({page})=>{
 test.setTimeout(120000);
 await page.setViewportSize({width:1440,height:900});
 await page.goto(base+"/organization");
 const root=page.locator('[data-account-suite="/organization"]');
 const tabs=root.getByRole("navigation",{name:"企业空间业务导航"});
 const labels=["企业空间","成员管理","角色权限","资源与额度","操作记录"];
 for(const [i,label] of labels.entries())
  await expect(tabs.getByRole("button").nth(i)).toHaveText(label);
 for(const mode of ["dark","light"] as const){
  const themeButton=page.getByRole("button",{name:mode==="light"?"切换浅色主题":"切换深色主题"});
  if(await themeButton.count())await themeButton.click();
  await expect(page.locator("html")).toHaveClass(new RegExp(mode));
  const panels=root.locator("section[aria-label='企业资源'],section[aria-label='成员资源分配']");
  await expect(panels).toHaveCount(2);
  await expect(root.locator('section[aria-label="企业管理"]')).toHaveCount(0);
  const surface=mode==="light"?"rgb(255, 255, 255)":"rgb(47, 51, 73)";
  for(const p of await panels.all())expect(await p.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe(surface);
  const stats=root.locator('[aria-label="企业空间概览"] article');
  await expect(stats).toHaveCount(3);
  for(const stat of await stats.all()){
   const n=stat.locator('[class*="enterpriseMetricNumber"]');
   await expect(n).toBeVisible();
   const box=await n.boundingBox();
   expect(box?.width).toBeGreaterThanOrEqual(56);
  }
  const cards=root.locator('section[aria-label="企业资源"] [class*="resourceSummary"] article');
  await expect(cards).toHaveCount(4);
  for(const card of await cards.all()){
   await expect(card.locator('[class*="resourceIcon"] svg')).toBeVisible();
   const font=await card.locator("strong").evaluate(e=>Number.parseFloat(getComputedStyle(e).fontSize));
   expect(font,"Resource figures use consistent Vuexy emphasis").toBeGreaterThanOrEqual(30);
  }
  const heights=await cards.evaluateAll(nodes=>nodes.map(e=>Math.round(e.getBoundingClientRect().height)));
  expect(Math.max(...heights)-Math.min(...heights),"Enterprise resource cards align").toBeLessThanOrEqual(2);
  await expect(root.getByRole("progressbar",{name:"已分配企业存储"})).toBeVisible();
  const gap=await root.evaluate(e=>getComputedStyle(e).rowGap);
  expect(Number.parseFloat(gap),"Vuexy desktop vertical rhythm").toBeGreaterThanOrEqual(20);
  await expect(tabs.getByRole("button")).toHaveCount(5);
 }
});

test("account second-level pages use Vuexy rhythm without duplicate referral entry buttons",async({page})=>{
 test.setTimeout(90000);
 await page.setViewportSize({width:1440,height:900});
 for(const route of ["/organization","/organization/members","/organization/roles","/organization/resources","/organization/audit","/referrals","/referrals/center","/referrals/earnings","/referrals/withdrawals","/referrals/rules"]){
  await page.goto(base+route);
  const suite=page.locator("[data-account-suite]");
  await expect(suite).toBeVisible();
  await expect(suite.getByRole("button",{name:"我的账户",exact:true})).toHaveCount(0);
  const gap=await suite.evaluate(e=>Number.parseFloat(getComputedStyle(e).rowGap));
  expect(gap,route+" Vuexy vertical spacing").toBeGreaterThanOrEqual(20);
  const header=suite.locator(":scope > header").first();
  const font=await header.locator("h1").evaluate(e=>Number.parseFloat(getComputedStyle(e).fontSize));
  expect(font,route+" title scale").toBeGreaterThanOrEqual(28);
 }
 await page.goto(base+"/referrals");
 const suite=page.locator('[data-account-suite="/referrals"]');
 await expect(suite.getByRole("heading",{name:"推广业务管理"})).toHaveCount(0);
 await expect(suite.getByRole("button",{name:"进入管理"})).toHaveCount(0);
 const tabs=suite.getByRole("navigation",{name:"推广与收益业务导航"});
 for(const label of ["推广与收益","推广中心","收益明细","提现管理","推广规则"])
  await expect(tabs.getByRole("button",{name:label,exact:true})).toBeVisible();
 await tabs.getByRole("button",{name:"收益明细",exact:true}).click();
 await expect(page).toHaveURL(/account\/referrals\/earnings/);
 await page.goto(base+"/organization");
 const enterpriseTabs=page.getByRole("navigation",{name:"企业空间业务导航"});
 for(const label of ["企业空间","成员管理","角色权限","资源与额度","操作记录"])
  await expect(enterpriseTabs.getByRole("button",{name:label,exact:true})).toBeVisible();
});
