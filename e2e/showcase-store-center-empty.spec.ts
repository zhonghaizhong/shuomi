import {expect,test} from "@playwright/test";
const prefix="/shuomi/#/workbench";
test("store center starts clean and reflects Figma entry-to-fulfillment flow",async({page})=>{
 await page.goto(prefix+"/store-center");
 const root=page.locator("[data-store-center-showcase]");
 await expect(root.getByRole("heading",{name:"店铺中心",exact:true})).toBeVisible();
 for(const label of ["我的店铺","刊登管理","店铺商品","订单管理"])await expect(root.getByRole("heading",{name:label,exact:true})).toBeVisible();
 for(const label of ["绑定并授权店铺","准备并刊登商品","同步店铺商品","接收并处理订单","完成发货履约"])await expect(root.getByRole("heading",{name:label,exact:true})).toBeVisible();
 await root.getByRole("button",{name:"管理我的店铺"}).click();
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
 await expect(root.locator("span").getByText("待授权",{exact:true}).first()).toBeVisible();
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
  for(const selector of ["header","[class*='entries']>article","[class*='noteCard']"]){
   const el=root.locator(selector).first();
   const rgb=await el.evaluate(n=>getComputedStyle(n).backgroundColor.match(/\d+/g)?.slice(0,3).map(Number)||[]);
   expect(rgb.length).toBe(3);
   if(mode==="light")expect(Math.min(...rgb)).toBeGreaterThan(225);
   else expect(Math.max(...rgb)).toBeLessThan(135);
  }
 }
});

test("store management supports filtering, renaming, removing, and Escape to close dialogs",async({page})=>{
 await page.goto(prefix+"/stores");
 const root=page.locator("[data-store-center-showcase]");
 await root.getByRole("button",{name:"绑定新店铺"}).first().click();
 const create=page.getByRole("dialog",{name:"绑定新店铺"});
 await create.getByRole("textbox",{name:"店铺名称"}).fill("待管理店铺");
 await create.getByRole("button",{name:"创建演示店铺"}).click();
 await root.getByLabel("站点筛选").selectOption({label:"加拿大站"});
 await expect(root.getByText("待管理店铺",{exact:true})).toHaveCount(0);
 await root.getByRole("button",{name:"重置"}).click();
 await expect(root.getByText("待管理店铺",{exact:true})).toBeVisible();
 await root.getByRole("button",{name:"管理",exact:true}).click();
 await page.getByRole("dialog",{name:"店铺详情"}).getByRole("button",{name:"修改名称"}).click();
 const edit=page.getByRole("dialog",{name:"管理店铺名称"});
 await expect(edit).toBeVisible();
 await page.keyboard.press("Escape");
 await expect(edit).toHaveCount(0);
 await root.getByRole("button",{name:"管理",exact:true}).click();
 await page.getByRole("dialog",{name:"店铺详情"}).getByRole("button",{name:"修改名称"}).click();
 await edit.getByRole("textbox",{name:"店铺名称"}).fill("更新店铺");
 await edit.getByRole("button",{name:"保存修改"}).click();
 await expect(root.getByText("更新店铺",{exact:true})).toBeVisible();
 await root.getByRole("button",{name:"移除"}).click();
 const confirm=page.getByRole("alertdialog",{name:"确认移除演示店铺"});
 await expect(confirm).toBeVisible();
 await confirm.getByRole("button",{name:"确认移除"}).click();
 await expect(root.getByText("更新店铺",{exact:true})).toHaveCount(0);
 await expect(root.getByRole("heading",{name:"尚未绑定店铺"})).toBeVisible();
});

test("store details, authorization guidance and cross-page buttons preserve real authorization boundary",async({page})=>{
 await page.goto(prefix+"/stores");
 const root=page.locator("[data-store-center-showcase]");
 await root.getByRole("button",{name:"绑定新店铺"}).first().click();
 const form=page.getByRole("dialog",{name:"绑定新店铺"});
 await form.getByRole("textbox",{name:"店铺名称"}).fill("待授权测试");
 await form.getByRole("button",{name:"创建演示店铺"}).click();
 await root.getByRole("button",{name:"管理",exact:true}).click();
 const details=page.getByRole("dialog",{name:"店铺详情"});
 await expect(details.getByText("待授权测试",{exact:true})).toBeVisible();
 await details.getByRole("button",{name:"授权信息",exact:true}).click();
 await expect(details.getByText("待授权",{exact:true})).toBeVisible();
 await details.getByRole("button",{name:"查看授权方式"}).click();
 const help=page.getByRole("dialog",{name:"店铺授权说明"});
 await expect(help.getByText(/不会模拟已授权/)).toBeVisible();
 await help.getByRole("button",{name:"我知道了"}).click();
 await expect(help).toHaveCount(0);
 await root.getByRole("button",{name:"立即同步"}).click();
 await expect(page.getByRole("dialog",{name:"立即同步"})).toBeVisible();
 await page.getByRole("dialog",{name:"立即同步"}).getByRole("button",{name:"查看授权要求"}).click();
 await expect(page.getByRole("dialog",{name:"店铺授权说明"})).toBeVisible();
 await page.keyboard.press("Escape");
 await expect(page.getByRole("dialog",{name:"店铺授权说明"})).toHaveCount(0);
 await page.goto(prefix+"/store-products");
 await root.getByRole("button",{name:"前往我的店铺"}).click();
 await expect(root).toHaveAttribute("data-store-center-showcase","stores");
});

test("Figma asset-list structure exposes its required filters, cards and actions",async({page})=>{
 await page.goto(prefix+"/stores");
 const root=page.locator("[data-store-center-showcase]");
 for(const label of ["店铺总数","正常店铺","需要处理"])await expect(root.locator("[class*=metric]").getByText(label,{exact:true})).toBeVisible();
 for(const name of ["平台筛选","站点筛选","店铺类型筛选","店铺状态筛选","店铺分组筛选"])await expect(root.getByLabel(name)).toBeVisible();
 await root.getByRole("button",{name:"管理分组"}).click();
 await expect(page.getByRole("dialog",{name:"管理分组"})).toBeVisible();
 await page.getByRole("dialog",{name:"管理分组"}).getByRole("button",{name:"完成",exact:true}).click();
 await root.getByRole("button",{name:"绑定新店铺"}).first().click();
 const dialog=page.getByRole("dialog",{name:"绑定新店铺"});
 await dialog.getByRole("textbox",{name:"店铺名称"}).fill("待授权资产");
 await dialog.getByRole("button",{name:"创建演示店铺"}).click();
 for(const label of ["管理","立即同步","进入店铺"])await expect(root.getByRole("button",{name:label,exact:true})).toBeVisible();
 await root.getByRole("button",{name:"立即同步"}).click();
 await expect(page.getByRole("dialog",{name:"立即同步"}).getByText(/不能同步商品或订单/)).toBeVisible();
});

test("enter-store opens its own workspace and routes to store products",async({page})=>{
 await page.goto(prefix+"/stores");
 const root=page.locator("[data-store-center-showcase]");
 await root.getByRole("button",{name:"绑定新店铺"}).first().click();
 const dialog=page.getByRole("dialog",{name:"绑定新店铺"});
 await dialog.getByRole("textbox",{name:"店铺名称"}).fill("待授权进入测试");
 await dialog.getByRole("button",{name:"创建演示店铺"}).click();
 await root.getByRole("button",{name:"进入店铺"}).click();
 const workspace=page.getByRole("dialog",{name:"店铺工作台"});
 await expect(workspace).toBeVisible();
 await expect(workspace.getByText(/授权尚未完成/)).toBeVisible();
 await workspace.getByRole("button",{name:"进入店铺商品"}).click();
 await expect(root).toHaveAttribute("data-store-center-showcase","products");
});

test("store-center Figma introduction includes new listing-management submenu and boundaries",async({page})=>{
 await page.goto(prefix+"/store-center");
 const root=page.locator('[data-store-center-showcase="home"]');
 await expect(root.getByRole("heading",{name:/统一管理店铺、刊登、商品与订单/})).toBeVisible();
 for(const name of ["我的店铺","刊登管理","店铺商品","订单管理"]){
  await expect(root.getByRole("heading",{name,exact:true})).toBeVisible();
 }
 await expect(root.getByRole("heading",{name:"四个业务模块如何协同"})).toBeVisible();
 await expect(root.getByRole("heading",{name:"经营分析与 AI 执行明确分工"})).toBeVisible();
 await root.getByRole("button",{name:"进入刊登管理"}).click();
 await expect(page).toHaveURL(/\/workbench\/listing/);
});


test("Figma My Stores detail tabs and local grouping have working interactions",async({page})=>{
 await page.goto(prefix+"/stores");
 const root=page.locator("[data-store-center-showcase]");
 await root.getByRole("button",{name:"管理分组"}).click();
 const groups=page.getByRole("dialog",{name:"管理分组"});
 await groups.getByRole("textbox",{name:"分组名称"}).fill("核心店铺");
 await groups.getByRole("button",{name:"创建分组"}).click();
 await expect(groups.getByText("核心店铺")).toBeVisible();
 await groups.getByRole("button",{name:"完成"}).click();
 await root.getByRole("button",{name:"绑定新店铺"}).first().click();
 const create=page.getByRole("dialog",{name:"绑定新店铺"});
 await create.getByRole("textbox",{name:"店铺名称"}).fill("原型交互验证");
 await create.getByRole("button",{name:"创建演示店铺"}).click();
 await root.getByRole("button",{name:"管理",exact:true}).click();
 const details=page.getByRole("dialog",{name:"店铺详情"});
 for(const tab of ["店铺概览","授权信息","数据同步","网络环境","店铺设置"]){
  await details.getByRole("button",{name:tab,exact:true}).click();
  await expect(details.getByRole("button",{name:tab,exact:true})).toHaveAttribute("aria-current","page");
 }
 await details.getByLabel("店铺所属分组").selectOption("核心店铺");
 await details.getByLabel("店铺负责人").fill("演示负责人");
 await details.getByRole("button",{name:"保存设置"}).click();
 await expect(root.locator("[class*=storeTags]").getByText("核心店铺",{exact:true})).toBeVisible();
 await root.getByLabel("店铺分组筛选").selectOption("核心店铺");
 await expect(root.getByText("原型交互验证",{exact:true})).toBeVisible();
 await root.getByRole("button",{name:"管理",exact:true}).click();
 await details.getByRole("button",{name:"授权信息"}).click();
 await details.getByRole("button",{name:"查看授权方式"}).click();
 const help=page.getByRole("dialog",{name:"店铺授权说明"});
 await help.getByLabel("授权方式").selectOption("子账户手机验证码");
 await expect(help.getByText(/手机号接收验证码/)).toBeVisible();
 await help.getByLabel("授权方式").selectOption("API 授权（暂未开放）");
 await expect(help.getByText(/API 授权暂未开放/)).toBeVisible();
});
