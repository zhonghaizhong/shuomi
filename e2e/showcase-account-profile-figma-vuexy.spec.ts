import {expect,test,type Page} from "@playwright/test";
const base="/shuomi/#/workbench/account/profile";
const rgb=(c:string)=>c.match(/\d+(?:\.\d+)?/g)?.slice(0,3).map(Number)??[];
const lightSurface=(c:string)=>rgb(c).length===3&&rgb(c).every(n=>n>=220);
async function theme(page:Page,mode:"light"|"dark"){
 const button=page.getByRole("button",{name:mode==="light"?"切换浅色主题":"切换深色主题"});
 if(await button.count())await button.click();
 await expect(page.locator("html")).toHaveClass(new RegExp(mode));
}
test("account profile and all submenus use approved Vuexy surfaces and legible text",async({page})=>{
 test.setTimeout(120000);
 const routes=["","/settings","/business","/verification"];
 for(const route of routes){
  await page.goto(base+route);
  const root=page.locator("[data-account-profile-page]");
  await expect(root).toBeVisible();
  for(const mode of ["dark","light"] as const){
   await theme(page,mode);
   const header=root.locator(":scope > header").first();
   const bg=await header.evaluate(el=>getComputedStyle(el).backgroundColor);
   expect(bg,route+" "+mode+" header").toBe(mode==="dark"?"rgb(47, 51, 73)":"rgb(255, 255, 255)");
   for(const node of await root.locator('[class*="panel"]:not([class*="panelHeader"]),[class*="profileTop"],[class*="intro"]').all()){
    if(!await node.isVisible())continue;
    const bg=await node.evaluate(el=>getComputedStyle(el).backgroundColor);
    if(bg!=="rgba(0, 0, 0, 0)")expect(lightSurface(bg),route+" "+mode+" "+bg).toBe(mode==="light");
   }
   const primary=root.locator('button[class*="primary"]').first();
   if(await primary.count())expect(await primary.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe("rgb(115, 103, 240)");
  }
 }
});
test("account profile links to settings and saves local-only preview account name",async({page})=>{
 await page.goto(base);
 await page.getByRole("button",{name:"编辑资料"}).click();
 await expect(page).toHaveURL(/\/account\/profile\/settings/);
 const section=page.locator('[data-account-profile-page="settings"]');
 await section.getByRole("textbox",{name:"用户名"}).fill("test_profile_preview");
 await section.getByRole("button",{name:"保存更改"}).click();
 await expect(section.getByRole("status")).toContainText("演示");
 await page.getByRole("button",{name:"返回账户资料"}).click();
 const overview=page.locator('[data-account-profile-page="overview"]');
 await expect(overview).toContainText("test_profile_preview");
 await overview.getByRole("button",{name:"编辑画像"}).click();
 await expect(page).toHaveURL(/\/account\/profile\/business/);
});
test("business portrait maintenance saves a demo update and cancellation reverts edits",async({page})=>{
 await page.goto(base+"/business");
 const root=page.locator('[data-account-profile-page="business"]');
 await root.getByRole("button",{name:"维护经营画像"}).click();
 const field=root.getByRole("checkbox",{name:"电商服务商"});
 await field.check();
 await root.getByRole("button",{name:"保存修改"}).click();
 await expect(root).toContainText("电商服务商");
 await root.getByRole("button",{name:"维护经营画像"}).click();
 await root.getByRole("checkbox",{name:"电商服务商"}).uncheck();
 await root.locator("footer").getByRole("button",{name:"取消"}).click();
 await expect(root).toContainText("电商服务商");
});
test("registered test tenant has prefilled synthetic certification and no real verification",async({page})=>{
 await page.goto(base+"/verification");
 const root=page.locator('[data-account-profile-page="verification"]');
 await expect(root.getByRole("tab",{name:"企业认证"})).toHaveAttribute("aria-selected","true");
 await expect(root.getByRole("textbox",{name:"企业名称"})).toHaveValue("武汉硕米电子商务有限公司");
 await expect(root.getByRole("textbox",{name:"统一社会信用代码"})).toHaveValue("TEST-SM-000001");
 await expect(root.getByRole("textbox",{name:"法定代表人"})).toHaveValue("林晨");
 await expect(root).toContainText("当前状态：已认证（模拟）");
 await expect(root.locator('[data-document-kind="business"]')).toContainText("已归档（模拟）");
 await root.getByRole("button",{name:"核对认证资料"}).click();
 await expect(root.getByRole("status")).toContainText("未发起真实认证");
 await root.getByRole("tab",{name:"个人认证"}).click();
 await expect(root.getByRole("textbox",{name:"真实姓名"})).toHaveValue("林晨");
 await expect(root.getByRole("textbox",{name:"身份证号码"})).toHaveValue("TEST-ID-000001");
 await expect(root).toContainText("不会发起真实后台审核");
 await page.goto(base);
 await expect(page.locator('[data-account-profile-page="overview"]')).toContainText("林晨");
 await expect(page.locator('[data-account-profile-page="overview"]')).toContainText("暂时没有店铺");
 await expect(page.locator('[data-account-profile-page="overview"]')).toContainText("admin@example.com");
});
test("business license archive shows real actions and simulated replacement is saved",async({page})=>{
 await page.goto(base+"/verification");
 const root=page.locator('[data-document-kind="business"]');
 await expect(root).toBeVisible();
 await expect(root).toContainText("武汉硕米电子商务有限公司");
 await root.getByRole("button",{name:"查看证照"}).click();
 const view=root.getByRole("dialog",{name:"查看营业执照"});
 await expect(view).toContainText("无可显示的真实影像");
 await view.getByRole("button",{name:"关闭",exact:true}).click();
 await root.getByRole("button",{name:"更换文件"}).click();
 const replace=root.getByRole("dialog",{name:"更换营业执照"});
 await replace.getByLabel("选择营业执照文件").setInputFiles({name:"license-demo.pdf",mimeType:"application/pdf",buffer:Buffer.from("%PDF-1.4\n")});
 await replace.getByRole("button",{name:"上传并更新（模拟）"}).click();
 await expect(root).toContainText("license-demo.pdf");
 await root.getByRole("button",{name:"重新识别"}).click();
 await expect(root.getByRole("status")).toContainText("模拟识别");
 await page.reload();
 await expect(page.locator('[data-document-kind="business"]')).toContainText("license-demo.pdf");
});
test("personal ID front and back archive use consistent cards and cancel replacement safely",async({page})=>{
 await page.goto(base+"/verification");
 await page.getByRole("tab",{name:"个人认证"}).click();
 const root=page.locator('[data-document-kind="identity"]');
 await expect(root).toContainText("身份证人像面");
 await expect(root).toContainText("身份证国徽面");
 await root.getByRole("button",{name:"查看证件"}).click();
 await expect(root.getByRole("dialog",{name:"查看个人身份证"})).toBeVisible();
 await root.getByRole("dialog",{name:"查看个人身份证"}).getByRole("button",{name:"更换文件"}).click();
 const replace=root.getByRole("dialog",{name:"更换个人身份证"});
 await replace.getByLabel("选择身份证人像面文件").setInputFiles({name:"front-demo.png",mimeType:"image/png",buffer:Buffer.from("89504e470d0a1a0a","hex")});
 await replace.getByLabel("选择身份证国徽面文件").setInputFiles({name:"back-demo.png",mimeType:"image/png",buffer:Buffer.from("89504e470d0a1a0a","hex")});
 await replace.getByRole("button",{name:"取消"}).click();
 await expect(root).not.toContainText("front-demo.png");
 await root.getByRole("button",{name:"更换文件"}).click();
 const replacement=root.getByRole("dialog",{name:"更换个人身份证"});
 await replacement.getByLabel("选择身份证人像面文件").setInputFiles({name:"front-demo.png",mimeType:"image/png",buffer:Buffer.from("89504e470d0a1a0a","hex")});
 await replacement.getByLabel("选择身份证国徽面文件").setInputFiles({name:"back-demo.png",mimeType:"image/png",buffer:Buffer.from("89504e470d0a1a0a","hex")});
 await replacement.getByRole("button",{name:"上传并更新（模拟）"}).click();
 await expect(root).toContainText("front-demo.png");
 await expect(root).toContainText("back-demo.png");
});
test("both certification document cards honor Vuexy light and dark surfaces",async({page})=>{
 await page.goto(base+"/verification");
 for(const mode of ["dark","light"] as const){
  await theme(page,mode);
  const card=page.locator('[data-document-kind="business"]');
  await expect(card).toBeVisible();
  expect(await card.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe(mode==="light"?"rgb(255, 255, 255)":"rgb(47, 51, 73)");
  await page.getByRole("tab",{name:"个人认证"}).click();
  const identity=page.locator('[data-document-kind="identity"]');
  await expect(identity).toBeVisible();
  expect(await identity.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe(mode==="light"?"rgb(255, 255, 255)":"rgb(47, 51, 73)");
  await page.getByRole("tab",{name:"企业认证"}).click();
 }
});
test("phone change performs simulated validation, persists after reload, and updates account overview",async({page})=>{
 await page.goto(base+"/settings");
 await page.getByRole("button",{name:"更换手机号"}).click();
 const dialog=page.getByRole("dialog",{name:"更换手机号"});
 await expect(dialog).toBeVisible();
 await dialog.getByRole("textbox",{name:"新手机号"}).fill("123");
 await dialog.getByRole("button",{name:"模拟验证通过"}).click();
 await expect(dialog.getByRole("alert")).toContainText("有效的手机号");
 await dialog.getByRole("textbox",{name:"新手机号"}).fill("13800138000");
 await dialog.getByRole("button",{name:"模拟验证通过"}).click();
 await expect(dialog).toContainText("模拟安全审核已通过");
 await dialog.getByRole("button",{name:"确认更换"}).click();
 await expect(dialog).toHaveCount(0);
 await expect(page.locator('[data-account-profile-page="settings"]')).toContainText("13800138000");
 await page.reload();
 await expect(page.locator('[data-account-profile-page="settings"]')).toContainText("13800138000");
 await page.getByRole("button",{name:"返回账户资料"}).click();
 await expect(page.locator('[data-account-profile-page="overview"]')).toContainText("13800138000");
});
test("email change validates and persists, and security modal cancels safely",async({page})=>{
 await page.goto(base+"/settings");
 await page.getByRole("button",{name:"更换邮箱"}).click();
 let dialog=page.getByRole("dialog",{name:"更换邮箱"});
 await dialog.getByRole("textbox",{name:"新邮箱地址"}).fill("new@example.com");
 await dialog.getByRole("button",{name:"模拟验证通过"}).click();
 await dialog.getByRole("button",{name:"确认更换"}).click();
 await expect(page.locator('[data-account-profile-page="settings"]')).toContainText("new@example.com");
 await page.getByRole("button",{name:"更换邮箱"}).click();
 dialog=page.getByRole("dialog",{name:"更换邮箱"});
 await dialog.getByRole("textbox",{name:"新邮箱地址"}).fill("cancel@example.com");
 await dialog.getByRole("button",{name:"取消"}).click();
 await expect(page.locator('[data-account-profile-page="settings"]')).not.toContainText("cancel@example.com");
 await page.reload();
 await expect(page.locator('[data-account-profile-page="settings"]')).toContainText("new@example.com");
});
test("simulated password change validates confirmation without persisting a password",async({page})=>{
 await page.goto(base+"/settings");
 await page.getByRole("button",{name:"修改密码"}).click();
 const dialog=page.getByRole("dialog",{name:"修改密码"});
 await dialog.getByLabel("新密码",{exact:true}).fill("abcd1234");
 await dialog.getByLabel("确认新密码",{exact:true}).fill("different");
 await dialog.getByRole("button",{name:"模拟验证通过"}).click();
 await expect(dialog.getByRole("alert")).toContainText("不一致");
 await dialog.getByLabel("确认新密码",{exact:true}).fill("abcd1234");
 await dialog.getByRole("button",{name:"模拟验证通过"}).click();
 await dialog.getByRole("button",{name:"确认修改"}).click();
 await expect(page.getByRole("status")).toContainText("模拟密码修改成功");
 await page.reload();
 await expect(page.locator('[data-account-profile-page="settings"]')).toContainText("上次修改");
 const saved=await page.evaluate(()=>localStorage.getItem("shuomi-demo-security-SM-ENT-000001"));
 expect(saved).not.toContain("abcd1234");
});


test("My Account overview matches approved Vuexy theme in dark/light with aligned cards and working navigation",async({page})=>{
 test.setTimeout(120000);
 await page.setViewportSize({width:1440,height:900});
 await page.goto("/shuomi/#/workbench/account");
 const root=page.locator('[data-commerce-unified="account"]');
 const overview=root.locator('[class*="accountOverview"]');
 const modules=root.locator('[class*="accountModules"]');
 const recent=root.locator('[class*="accountBottom"]');
 await expect(root.getByRole("heading",{name:"我的账户",exact:true})).toBeVisible();
 await expect(overview.locator("article")).toHaveCount(3);
 await expect(modules.locator("article")).toHaveCount(3);
 for(const mode of ["dark","light"] as const){
  await theme(page,mode);
  const expectedSurface=mode==="dark"?"rgb(47, 51, 73)":"rgb(255, 255, 255)";
  const expectedInset=mode==="dark"?"rgb(57, 61, 85)":"rgb(248, 247, 250)";
  for(const item of [root.locator('[class*="header"]').first(),overview,recent.locator(":scope>article"),recent.locator(":scope>aside")]){
   await expect(item).toBeVisible();
   expect(await item.evaluate(e=>getComputedStyle(e).backgroundColor)).toBe(expectedSurface);
  }
  for(const card of await overview.locator("article").all()){
   const actual=await card.evaluate(e=>getComputedStyle(e).backgroundColor);
   const expected=rgb(expectedInset),received=rgb(actual);
   expect(received,"Vuexy inset surfaces should not drift beyond a single RGB level")
    .toHaveLength(3);
   expect(received.every((v,i)=>Math.abs(v-expected[i])<=1),actual+" close to "+expectedInset).toBe(true);
  }
  const moduleCards=modules.locator("article");
  const heights=await moduleCards.evaluateAll(nodes=>nodes.map(n=>Math.round(n.getBoundingClientRect().height)));
  expect(Math.max(...heights)-Math.min(...heights),"Three account modules must align").toBeLessThanOrEqual(2);
  // The module section is a layout wrapper; only its cards must use Vuexy surfaces.
  for(const card of await moduleCards.all())expect(await card.evaluate(e=>getComputedStyle(e).backgroundColor)).toBe(expectedSurface);
  for(const card of await moduleCards.all())await expect(card.locator("header h3")).toBeVisible();
  for(const button of await modules.getByRole("button").all()){
   expect(await button.evaluate(e=>getComputedStyle(e).backgroundColor)).toBe("rgb(115, 103, 240)");
  }
  const mainTitle=root.getByRole("heading",{name:"我的账户",exact:true});
  expect(await mainTitle.evaluate(e=>Number.parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(28);
 }
 await modules.getByRole("button",{name:"管理资料"}).click();
 await expect(page).toHaveURL(/\/account\/profile/);
 await page.goto("/shuomi/#/workbench/account");
 await page.locator('[data-commerce-unified="account"]').getByRole("button",{name:"进入空间"}).click();
 await expect(page).toHaveURL(/\/account\/organization/);
 await page.goto("/shuomi/#/workbench/account");
 await page.locator('[data-commerce-unified="account"]').getByRole("button",{name:"查看收益"}).click();
 await expect(page).toHaveURL(/\/account\/referrals/);
});
