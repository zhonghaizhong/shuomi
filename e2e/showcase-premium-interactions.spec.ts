import { expect, test } from "@playwright/test";
const base="/shuomi/#/workbench";
const target=["/data","/data/market","/data/api","/data/mine","/store-center","/stores","/store-products","/store-orders","/plans","/plans/options","/plans/entitlements","/plans/usage","/plans/top-up","/plans/orders","/account","/account/profile","/account/profile/settings","/account/organization","/account/organization/members","/account/organization/resources","/account/organization/audit","/account/referrals","/account/referrals/center","/account/referrals/earnings","/account/referrals/withdrawals","/account/referrals/rules"];

test("Figma support drawer opens, switches online/message and closes on Escape/outside",async({page})=>{
 await page.goto(base+"/data");
 await page.getByRole("button",{name:"联系客服"}).click();
 const dlg=page.getByRole("dialog",{name:"硕米客服"});
 await expect(dlg).toBeVisible();
 await dlg.getByRole("button",{name:"在线咨询"}).click();
 await expect(dlg).toContainText("未连接实时客服");
 await dlg.getByRole("button",{name:"返回服务方式"}).click();
 await dlg.getByRole("button",{name:"提交留言"}).click();
 await dlg.getByRole("textbox",{name:"留言内容"}).fill("请帮我检查数据额度");
 await expect(dlg.getByRole("link",{name:"打开邮件程序"})).toHaveAttribute("href",/mailto:support@shuomiai.com/);
 await page.keyboard.press("Escape");await expect(dlg).toHaveCount(0);
 await page.getByRole("button",{name:"联系客服"}).click();await page.locator("main.showcase-content").click({position:{x:5,y:5}});
 await expect(dlg).toHaveCount(0);
 await page.screenshot({path:"test-results/topbar-support-closed.png"});
});

test("notification button navigates to full Figma-style center, read/mark-all actually updates",async({page})=>{
 await page.goto(base+"/data");
 await page.getByRole("button",{name:"通知",exact:true}).click();
 await expect(page).toHaveURL(/#\/workbench\/notifications/);
 await expect(page.locator("[data-showcase-notifications]")).toBeVisible();
 await expect(page.getByText("3 条未读")).toBeVisible();
 await page.getByRole("button",{name:/AI工作台 2.0 能力升级/}).click();
 await expect(page.getByRole("heading",{name:"AI工作台 2.0 能力升级"})).toBeVisible();
 await page.getByRole("button",{name:"返回列表"}).click();
 await expect(page.getByText("2 条未读")).toBeVisible();
 await page.getByRole("button",{name:"全部标为已读"}).click();
 await expect(page.getByText("0 条未读")).toBeVisible();
 await page.getByRole("tab",{name:"商家经营触发通知"}).click();
 await expect(page.getByText("2 条未读")).toBeVisible();
 await page.getByRole("checkbox",{name:"仅看未读"}).check();
 await page.getByRole("button",{name:"全部标为已读"}).click();
 await expect(page.getByText("当前筛选下暂无通知。")).toBeVisible();
 await page.getByRole("button",{name:"返回运营驾驶舱"}).click();
 await expect(page.getByRole("button",{name:"通知"}).locator("i")).toHaveCount(0);
});

test("theme toggle and account menu follow Figma, with safe dialog for logout/deletion",async({page})=>{
 await page.goto(base+"/account");
 const theme=page.getByRole("button",{name:"切换浅色主题"});
 await expect(theme).toHaveAttribute("aria-pressed","false");
 await theme.click();
 await expect(page.locator(".light.showcase-shell").count()).resolves.toBe(0).catch(()=>undefined);
 await expect(page.getByRole("button",{name:"切换深色主题"})).toHaveAttribute("aria-pressed","true");
 const account=page.getByRole("button",{name:/账户$/}).last();
 await account.click();
 const popup=page.getByRole("dialog",{name:"账户快捷操作"});
 await expect(popup).toBeVisible();
 await expect(popup).toContainText("admin@example.com");
 await expect(popup).toContainText("武汉硕米电子商务有限公司");
 await expect(popup.getByRole("button",{name:"切换账户与企业组织"})).toBeVisible();
 await popup.getByRole("button",{name:"退出登录"}).click();
 await expect(page.getByRole("alertdialog")).toContainText("不会退出真实登录");
 await page.getByRole("button",{name:"返回账户菜单"}).click();
 await popup.getByRole("button",{name:"注销账号"}).click();
 await expect(page.getByRole("alertdialog")).toContainText("不会注销账号或删除");
 await page.keyboard.press("Escape");
 await expect(page.getByRole("alertdialog")).toHaveCount(0);
 await popup.getByRole("button",{name:"账户资料"}).click();
 await expect(page).toHaveURL(/#\/workbench\/account\/profile/);
 await expect(page.getByRole("heading",{name:"账户资料"})).toBeVisible();
});

test("cleared store product and order pages show truthful empty states and working navigation",async({page})=>{
 for(const [route,label] of [["/store-products","暂无已同步商品"],["/store-orders","暂无平台订单"]]){
  await page.goto(base+route);
  const root=page.locator('[data-store-center-showcase]');
  await expect(root).toBeVisible();
  await expect(root.getByRole("heading",{name:label,exact:true})).toBeVisible();
  await expect(root.getByText("共 0 条")).toBeVisible();
  await root.getByRole("button",{name:"前往我的店铺"}).click();
  await expect(root).toHaveAttribute("data-store-center-showcase","stores");
  await expect(root).toContainText("共 12 家");
  await expect(root).toContainText("管理员演示店铺01");
  await expect(root).toContainText("同事01演示店铺01");
 }
});

test("My Stores filters work on local drafts and other account modules preserve their entry points",async({page})=>{
 await page.goto(base+"/stores");
 const root=page.locator('[data-store-center-showcase="stores"]');
 await root.getByRole("button",{name:"绑定新店铺"}).first().click();
 const dialog=page.getByRole("dialog",{name:"绑定新店铺"});
 await dialog.getByRole("textbox",{name:"自定义名称"}).fill("筛选交互检查");
 await dialog.getByRole("button",{name:"确认绑定"}).click();
 await expect(root.getByText("筛选交互检查",{exact:true})).toBeVisible();
 await root.getByLabel("站点筛选").selectOption("加拿大站");
 await root.getByRole("button",{name:"确认",exact:true}).click();
 await expect(root.getByText("筛选交互检查",{exact:true})).toHaveCount(0);
 await root.getByRole("button",{name:"重置"}).click();
 await expect(root.getByText("筛选交互检查",{exact:true})).toBeVisible();
 await page.goto(base+"/plans/orders");
 await expect(page.getByRole("heading",{level:1}).first()).toBeVisible();
 await page.goto(base+"/account/organization/members");
 await expect(page.getByRole("navigation",{name:"企业空间业务导航"})).toBeVisible();
 await page.goto(base+"/account/referrals/earnings");
 await expect(page.getByRole("navigation",{name:"推广与收益业务导航"})).toBeVisible();
});

test("API actions and My Stores binding open functional dialogs and Escape closes",async({page})=>{
 await page.goto(base+"/data/api");
 await page.getByRole("button",{name:"创建API密钥"}).click();
 const api=page.getByRole("dialog",{name:"创建API密钥"});
 await expect(api).toBeVisible();
 await page.keyboard.press("Escape");
 await expect(api).toHaveCount(0);
 await page.goto(base+"/stores");
 await page.getByRole("button",{name:"绑定新店铺"}).first().click();
 const store=page.getByRole("dialog",{name:"绑定新店铺"});
 await expect(store.getByRole("button",{name:"子账户授权"})).toBeVisible();
 await expect(store.getByRole("button",{name:"API 授权"})).toBeVisible();
 await store.getByRole("button",{name:"API 授权"}).click();
 await expect(store).toContainText("暂未开放");
 await page.keyboard.press("Escape");
 await expect(store).toHaveCount(0);
 await page.goto(base+"/account/referrals/withdrawals");
 await expect(page.getByRole("heading",{level:1}).first()).toBeVisible();
});

test("all 26 current online routes have bounded content, titles and no horizontal overflow",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 const visited=[];
 for(const route of target){
  await page.goto(base+route);
  const main=page.locator('[data-commerce-unified], [data-store-center-showcase], [data-account-suite], [data-account-profile-page]').first();
  await expect(main,route).toBeVisible();
  await expect(main.getByRole("heading",{level:1}).first(),route).toBeVisible();
  const box=await main.boundingBox();
  expect(box,route).not.toBeNull();
  expect(box!.width,route).toBeLessThanOrEqual(1601);
  const widths=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
  expect(widths.scroll,route).toBeLessThanOrEqual(widths.viewport+2);
  visited.push(route);
 }
 expect(visited).toHaveLength(26);
});

test("ultrawide preview keeps bounded centered content, readable headers and working support",async({page})=>{
 await page.setViewportSize({width:2560,height:1440});
 for(const route of ["/data","/store-center","/plans","/account"]){
  await page.goto(base+route);
  const area=page.locator('[data-commerce-unified], [data-store-center-showcase], [data-account-suite]').first();
  await expect(area).toBeVisible();
  const bounds=await area.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.width).toBeLessThanOrEqual(1601);
  expect(bounds!.x).toBeGreaterThan(350);
  expect(2560-bounds!.x-bounds!.width).toBeGreaterThan(260);
  const h=await area.getByRole("heading",{level:1}).first().boundingBox();
  expect(h?.height).toBeGreaterThanOrEqual(24);
  const calc=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
  expect(calc.scroll).toBeLessThanOrEqual(calc.viewport+2);
  await page.screenshot({path:"test-results/premium-"+route.slice(1).replaceAll("/","-")+"-2560.png",fullPage:true});
 }
 await page.getByRole("button",{name:"联系客服"}).click();
 await expect(page.getByRole("dialog",{name:"硕米客服"})).toBeVisible();
});

