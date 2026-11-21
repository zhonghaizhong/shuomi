import {expect,test} from "@playwright/test";
const prefix="/shuomi/#/workbench";
test("store center starts clean and reflects Figma entry-to-fulfillment flow",async({page})=>{
 await page.goto(prefix+"/store-center");
 const root=page.locator("[data-store-center-showcase]");
 await expect(root.getByRole("heading",{name:"店铺中心",exact:true})).toBeVisible();
 for(const label of ["我的店铺","店铺商品","订单履约"])await expect(root.getByRole("heading",{name:label,exact:true})).toBeVisible();
 for(const label of ["绑定并授权店铺","同步店铺商品","接收并处理订单","完成发货履约"])await expect(root.getByRole("heading",{name:label,exact:true})).toBeVisible();
 await root.getByRole("button",{name:"进入我的店铺"}).click();
 await expect(root).toHaveAttribute("data-store-center-showcase","stores");
 await expect(root.getByRole("heading",{name:"尚未绑定店铺"})).toBeVisible();
 for(const route of ["/store-products","/store-orders"]){
  await page.goto(prefix+route);
  await expect(root).toBeVisible();
  await expect(root.getByText("共 0 条")).toBeVisible();
  expect(await root.locator("[class*='metrics'] strong").allTextContents()).toEqual(["0","0","0","0"]);
 }
});
test("store showcase keeps temporary onboarding drafts separate from authenticated store data",async({page})=>{
 await page.goto(prefix+"/stores");
 const root=page.locator("[data-store-center-showcase]");
 await root.getByRole("button",{name:"绑定新店铺"}).first().click();
 const dialog=page.getByRole("dialog",{name:"绑定新店铺"});
 await expect(dialog).toBeVisible();
 await dialog.getByRole("textbox",{name:"店铺名称"}).fill("演示新店铺");
 await dialog.getByRole("button",{name:"创建演示店铺"}).click();
 await expect(root.getByText("演示新店铺",{exact:true})).toBeVisible();
 await expect(root.getByText("待授权",{exact:true})).toBeVisible();
 await page.goto(prefix+"/store-products");
 await expect(root.getByRole("heading",{name:"暂无已同步商品"})).toBeVisible();
 await page.goto(prefix+"/store-orders");
 await expect(root.getByRole("heading",{name:"暂无平台订单"})).toBeVisible();
 await page.goto(prefix+"/stores");
 await expect(root.getByText("演示新店铺",{exact:true})).toBeVisible();
});
test("store center light and dark theme use consistent card surfaces",async({page})=>{
 for(const mode of ["dark","light"]){
  await page.goto(prefix+"/store-center");
  const toggle=page.getByRole("button",{name:mode==="light"?"切换浅色主题":"切换深色主题"});
  if(await toggle.isVisible())await toggle.click();
  const root=page.locator("[data-store-center-showcase]");
  await expect(root).toBeVisible();
  for(const selector of ["header","[class*='entries']>article","[class*='panel']"]){
   const el=root.locator(selector).first();
   const rgb=await el.evaluate(n=>getComputedStyle(n).backgroundColor.match(/\d+/g)?.slice(0,3).map(Number)||[]);
   expect(rgb.length).toBe(3);
   if(mode==="light")expect(Math.min(...rgb)).toBeGreaterThan(225);
   else expect(Math.max(...rgb)).toBeLessThan(135);
  }
 }
});
