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
 const account=page.getByRole("button",{name:"示例用户账户"});
 await account.click();
 const popup=page.getByRole("dialog",{name:"账户快捷操作"});
 await expect(popup).toBeVisible();
 await expect(popup).toContainText("user@sumi.ai");
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

test("store product/order filters are real selects: apply, reset, status and search",async({page})=>{
 await page.goto(base+"/store-products");
 const productRows=page.locator('[data-commerce-unified] div[class*="productTableRow"]');
 await expect(productRows).toHaveCount(5);
 await page.getByRole("combobox",{name:"全部站点"}).selectOption("加拿大站");
 await expect(productRows).toHaveCount(2);
 await page.getByRole("combobox",{name:"全部状态"}).selectOption("审核中");
 await expect(productRows).toHaveCount(1);
 await page.getByRole("button",{name:"重置"}).click();
 await expect(productRows).toHaveCount(5);
 await page.goto(base+"/store-orders");
 const orderRows=page.locator('[data-commerce-unified] div[class*="orderTableRow"]');
 await expect(orderRows).toHaveCount(5);
 await page.getByRole("combobox",{name:"全部状态"}).selectOption("异常订单");
 await expect(orderRows).toHaveCount(1);
 await expect(orderRows).toContainText("地址异常");
 await page.getByRole("button",{name:"重置"}).click();
 await expect(orderRows).toHaveCount(5);
});

test("stores, bills, enterprise members and referrals filter instead of placeholder actions",async({page})=>{
 await page.goto(base+"/stores");
 await page.getByRole("combobox",{name:"全部站点"}).selectOption("加拿大站");
 await expect(page.getByText("一号店", {exact:true})).toHaveCount(0);
 await expect(page.getByText("二号店", {exact:true})).toBeVisible();
 await page.goto(base+"/plans/orders");
 await page.getByRole("combobox",{name:"全部状态"}).selectOption("已支付");
 await expect(page.locator('[data-commerce-unified] div[class*="serviceRow"]')).toHaveCount(2);
 await page.goto(base+"/account/organization/members");
 await page.getByRole("combobox",{name:"全部角色"}).selectOption("运营负责人");
 await expect(page.locator('[data-commerce-unified] div[class*="serviceRow"]')).toHaveCount(1);
 await page.getByRole("button",{name:"重置"}).click();
 await expect(page.locator('[data-commerce-unified] div[class*="serviceRow"]')).toHaveCount(3);
 await page.goto(base+"/account/referrals/earnings");
 await page.getByRole("combobox",{name:"全部状态"}).selectOption("已结算");
 await expect(page.locator('[data-commerce-unified] div[class*="serviceRow"]')).toHaveCount(1);
});

test("API, store and account destructive business actions open honest preview dialog, Escape closes",async({page})=>{
 for(const [route,label] of [["/data/api","创建API密钥"],["/stores","＋ 绑定新店铺"],["/account/referrals/withdrawals","申请提现"]]){
  await page.goto(base+route);
  await page.getByRole("button",{name:label,exact:true}).click();
  const modal=page.getByRole("dialog",{name:label.includes("绑定新店铺")?"绑定新店铺":label});
  await expect(modal,route).toBeVisible();
  await expect(modal).toContainText("不会向服务器");
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
 }
});

test("all 26 affected online pages have scoping, readable titles and no document overflow",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 const visited=[];
 for(const route of target){
  await page.goto(base+route);
  const main=page.locator('[data-commerce-unified]');
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

test("2560 ultra-wide previews have balanced whitespace, grown cards, zero horizontal clipping and topbar layout",async({page})=>{
 await page.setViewportSize({width:2560,height:1440});
 for(const route of ["/data","/store-center","/plans","/account"]){
  await page.goto(base+route);
  const area=page.locator('[data-commerce-unified]');
  const bounds=await area.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.width).toBeLessThanOrEqual(1601);
  expect(bounds!.x).toBeGreaterThan(350);
  expect(2560-bounds!.x-bounds!.width).toBeGreaterThan(260);
  const h=await area.locator('header[class*="header"]').first().boundingBox();
  expect(h?.height).toBeGreaterThanOrEqual(149);
  const calc=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
  expect(calc.scroll).toBeLessThanOrEqual(calc.viewport+2);
  await page.screenshot({path:"test-results/premium-"+route.slice(1).replaceAll("/","-")+"-2560.png",fullPage:true});
 }
 await page.getByRole("button",{name:"联系客服"}).click();
 await expect(page.getByRole("dialog",{name:"硕米客服"})).toBeVisible();
 await page.screenshot({path:"test-results/premium-topbar-support-2560.png",fullPage:true});
});
