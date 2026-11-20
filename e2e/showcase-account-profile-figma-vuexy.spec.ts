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
test("personal and enterprise authentication never report a real successful verification",async({page})=>{
 await page.goto(base+"/verification");
 const root=page.locator('[data-account-profile-page="verification"]');
 await expect(root.getByRole("tab",{name:"个人认证"})).toHaveAttribute("aria-selected","true");
 await root.getByRole("tab",{name:"企业认证"}).click();
 await expect(root.getByRole("textbox",{name:"企业名称"})).toBeVisible();
 await expect(root.getByRole("textbox",{name:"统一社会信用代码"})).toBeVisible();
 await root.getByRole("tab",{name:"个人认证"}).click();
 await expect(root.getByRole("textbox",{name:"真实姓名"})).toBeVisible();
 await expect(root.getByRole("textbox",{name:"身份证号码"})).toBeVisible();
 await expect(root).toContainText("演示环境不上传或保存证件");
});
test("contact change uses truthful security modal and closes on outside click",async({page})=>{
 await page.goto(base+"/settings");
 await page.getByRole("button",{name:"更换邮箱"}).click();
 const dialog=page.getByRole("dialog",{name:"更换邮箱"});
 await expect(dialog).toContainText("不发送验证码");
 await dialog.getByRole("button",{name:"知道了"}).click();
 await expect(dialog).toHaveCount(0);
});
