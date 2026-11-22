import {expect,test} from "@playwright/test";
const root="/shuomi/#/workbench";
// The legacy workflow tests intentionally begin with an empty tenant.
test.beforeEach(async({page},info)=>{
 if(info.title.startsWith("organization-scoped")||info.title.startsWith("My Stores Figma optimized asset layout"))return;
 await page.goto(root+"/stores");
 await page.evaluate(()=>{
  sessionStorage.setItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001","[]");
  sessionStorage.setItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001-groups","[]");
 });
 await page.reload();
});
test("organization-scoped simulated bindings show ten to enterprise admin, five to colleague, and isolate other organizations",async({page})=>{
 await page.goto(root+"/stores");
 const area=page.locator('[data-store-center-showcase="stores"]');
 await expect(area.getByText("店铺总数")).toBeVisible();
 await expect(area).toContainText("共 10 家");
 await expect(area).toContainText("管理员演示店铺01");
 await expect(area).toContainText("同事01演示店铺01");
 for(const site of ["美国站","加拿大站","英国站","德国站","法国站"])await expect(area).toContainText(site);
 const openSwitch=async()=>{
  await page.getByRole("button",{name:/(linchen_demo|模拟同事01)账户/}).click();
  await page.getByRole("dialog",{name:"账户快捷操作"}).getByRole("button",{name:"切换账户与企业组织"}).click();
  return page.getByRole("dialog",{name:"切换账户与企业组织"});
 };
 let switcher=await openSwitch();
 await switcher.getByRole("button",{name:/模拟同事01/}).click();
 await switcher.getByRole("button",{name:"确认切换"}).click();
 await page.goto(root+"/stores");
 await expect(area).toContainText("共 5 家");
 await expect(area).toContainText("同事01演示店铺01");
 await expect(area).not.toContainText("管理员演示店铺01");
 switcher=await openSwitch();
 await switcher.getByRole("tab",{name:"切换企业"}).click();
 await switcher.getByRole("button",{name:/模拟企业B（供应链公司）/}).click();
 await switcher.getByRole("button",{name:"确认切换"}).click();
 await page.goto(root+"/stores");
 await expect(area.getByRole("heading",{name:"尚未绑定店铺"})).toBeVisible();
 await area.getByRole("button",{name:"绑定新店铺"}).first().click();
 const dialog=page.getByRole("dialog",{name:"绑定新店铺"});
 await dialog.getByRole("textbox",{name:"自定义名称"}).fill("企业B独立店铺");
 await dialog.getByRole("button",{name:"提交授权"}).click();
 await expect(area).toContainText("企业B独立店铺");
 switcher=await openSwitch();
 await switcher.getByRole("tab",{name:"切换企业"}).click();
 await switcher.getByRole("button",{name:/武汉硕米电子商务有限公司/}).click();
 await switcher.getByRole("button",{name:"确认切换"}).click();
 await page.goto(root+"/stores");
 await expect(area).toContainText("同事01演示店铺01");
 await expect(area).toContainText("共 5 家");
 await expect(area).not.toContainText("企业B独立店铺");
});

async function createDemo(page:any,name="Figma店铺"){
 await page.goto(root+"/stores");
 const area=page.locator('[data-store-center-showcase="stores"]');
 await area.getByRole("button",{name:"绑定新店铺"}).first().click();
 const modal=page.getByRole("dialog",{name:"绑定新店铺"});
 await expect(modal).toBeVisible();
 await modal.getByRole("textbox",{name:"自定义名称"}).fill(name);
 await modal.getByRole("button",{name:"提交授权"}).click();
 await expect(modal).toHaveCount(0);
 await expect(area.getByText(name,{exact:true})).toBeVisible();
 return area;
}
test("Figma store center preserves new listing submenu and clean independent data",async({page})=>{
 await page.goto(root+"/store-center");
 const area=page.locator('[data-store-center-showcase="home"]');
 for(const title of ["我的店铺","刊登管理","店铺商品","订单管理"])await expect(area.getByRole("heading",{name:title,exact:true})).toBeVisible();
 await area.getByRole("button",{name:"管理我的店铺"}).click();
 await expect(page.locator('[data-store-center-showcase="stores"]').getByRole("heading",{name:"尚未绑定店铺"})).toBeVisible();
 for(const route of ["/store-products","/store-orders"]){
  await page.goto(root+route);
  await expect(page.locator("[data-store-center-showcase]").getByText("共 0 条")).toBeVisible();
 }
});
test("store center resets previous demo stores and groups and all listing stages remain empty",async({page})=>{
 await page.goto(root+"/stores");
 await page.evaluate(()=>{
  sessionStorage.setItem("shuomi-store-center-empty-v3",JSON.stringify([{id:"DEMO-OLD",name:"旧测试店铺",platform:"SHEIN",region:"美国站",type:"半托管",status:"待授权",createdAt:"2026-11-21"}]));
  sessionStorage.setItem("shuomi-store-center-empty-v3-groups",JSON.stringify(["旧测试分组"]));
  sessionStorage.removeItem("shuomi-store-center-empty-v4");
  sessionStorage.removeItem("shuomi-store-center-empty-v4-groups");
 });
 await page.reload();
 await expect(page.locator('[data-store-center-showcase="stores"]').getByRole("heading",{name:"尚未绑定店铺"})).toBeVisible();
 await expect(page.locator('[data-store-center-showcase="stores"]')).not.toContainText("旧测试店铺");
 await page.getByRole("button",{name:"管理分组"}).click();
 await expect(page.getByRole("dialog",{name:"管理分组"})).not.toContainText("旧测试分组");
 for(const path of ["/store-products","/store-orders"]){
  await page.goto(root+path);
  await expect(page.locator("[data-store-center-showcase]")).toContainText("共 0 条");
 }
 for(const stage of ["missing","review"]){
  await page.goto(root+"/listing/"+stage);
  const listing=page.locator("[data-listing-stage]");
  await expect(listing).toContainText("商品列表（共 0 个商品）");
  await expect(listing).toContainText("暂无商品记录");
 }
 await page.goto(root+"/listing/uploaded");
 await expect(page.locator("[data-showcase-uploaded]")).toContainText("共 0 条记录");
 await expect(page.locator("[data-showcase-uploaded]")).toContainText("暂无已上传商品记录");
});
test("Manage Groups is visible in the My Stores top actions even when there are no stores",async({page})=>{
 await page.goto(root+"/stores");
 const area=page.locator('[data-store-center-showcase="stores"]');
 const topActions=area.locator("header").first().locator('[class*="headerActions"]');
 await expect(topActions.getByRole("button",{name:"管理分组"})).toBeVisible();
 await expect(topActions.getByRole("button",{name:"绑定新店铺"})).toBeVisible();
 await expect(area.getByRole("button",{name:"管理分组"})).toHaveCount(1);
 await topActions.getByRole("button",{name:"管理分组"}).click();
 await expect(page.getByRole("dialog",{name:"管理分组"})).toBeVisible();
 await page.keyboard.press("Escape");
 await expect(page.getByRole("dialog",{name:"管理分组"})).toHaveCount(0);
});
test("Figma binding modal has account, OTP, groups, fixed IP and honest authorization state",async({page})=>{
 await page.goto(root+"/stores");
 await page.getByRole("button",{name:"绑定新店铺"}).first().click();
 const dlg=page.getByRole("dialog",{name:"绑定新店铺"});
 await expect(dlg.getByLabel("平台")).toHaveValue("SHEIN");
 await dlg.getByLabel("站点").selectOption("加拿大站");
 await dlg.getByLabel("店铺类型").selectOption("全托管");
 await dlg.getByLabel("自定义名称").fill("测试绑定流程");
 await dlg.getByLabel("子账户账号").fill("example-seller");
 await dlg.getByLabel("子账户密码").fill("temporary-placeholder");
 await dlg.getByRole("button",{name:"显示"}).click();
 await expect(dlg.getByLabel("子账户密码")).toHaveAttribute("type","text");
 await dlg.getByRole("button",{name:"手机验证码"}).click();
 await expect(dlg).toContainText("手机号");
 await dlg.getByRole("button",{name:"接收验证码"}).click();
 await expect(dlg.getByRole("status")).toContainText("未发送验证码");
 await dlg.getByLabel("启用固定IP").check();
 await expect(dlg.getByText("已启用（仅演示）")).toBeVisible();
 await dlg.getByRole("button",{name:"API 授权"}).click();
 await expect(dlg.getByRole("button",{name:"提交授权"})).toBeDisabled();
 await dlg.getByRole("button",{name:"子账户授权"}).click();
 await dlg.getByRole("button",{name:"提交授权"}).click();
 await expect(dlg).toHaveCount(0);
 const area=page.locator('[data-store-center-showcase="stores"]');
 await expect(area.getByText("测试绑定流程",{exact:true})).toBeVisible();
 await area.getByRole("button",{name:"进入店铺",exact:true}).click();
  await page.getByRole("navigation",{name:"店铺详情导航"}).getByRole("button",{name:"授权信息",exact:true}).click();
  await expect(page.locator('[aria-label="店铺详情页面"]')).toContainText("待授权");
 await page.goto(root+"/store-products");
 await expect(page.getByRole("heading",{name:"暂无已同步商品"})).toBeVisible();
});
test("Figma filters apply only on confirm and reset together",async({page})=>{
 const area=await createDemo(page,"筛选店铺");
 await area.getByLabel("站点筛选").selectOption("加拿大站");
 await expect(area.getByText("筛选店铺",{exact:true})).toBeVisible();
 await area.getByRole("button",{name:"确认",exact:true}).click();
 await expect(area.getByText("筛选店铺",{exact:true})).toHaveCount(0);
 await area.getByRole("button",{name:"重置"}).click();
 await expect(area.getByText("筛选店铺",{exact:true})).toBeVisible();
 await area.getByLabel("店铺状态筛选").selectOption("待授权");
 await area.getByRole("button",{name:"确认",exact:true}).click();
 await expect(area.getByText("筛选店铺",{exact:true})).toBeVisible();
});
test("Figma Manage opens store settings; Reauthorize opens binding, without fake authorization",async({page})=>{
 const area=await createDemo(page,"待修改店铺");
 await area.getByRole("button",{name:"管理",exact:true}).click();
 const details=page.getByRole("region",{name:"店铺详情页面"});
 await expect(details).toBeVisible();
 await expect(details.getByRole("button",{name:"店铺设置",exact:true})).toHaveAttribute("aria-current","page");
 await expect(page.getByRole("dialog",{name:"管理店铺"})).toHaveCount(0);
 await details.getByLabel("店铺负责人").selectOption("林晨");
 await details.getByRole("button",{name:"保存设置"}).click();
 await page.getByRole("button",{name:"返回我的店铺"}).click();
 await expect(area.getByText("林晨",{exact:true})).toBeVisible();
 await area.getByRole("button",{name:"更多操作 · 待修改店铺"}).click();
 await area.getByRole("menuitem",{name:"重新授权"}).click();
 const authorization=page.getByRole("dialog",{name:"管理店铺"});
 await expect(authorization.getByLabel("子账户账号")).toBeVisible();
 await authorization.getByRole("button",{name:"保存修改"}).click();
 await area.getByRole("button",{name:"进入店铺",exact:true}).click();
 await page.getByRole("navigation",{name:"店铺详情导航"}).getByRole("button",{name:"授权信息",exact:true}).click();
 await expect(page.locator('[aria-label="店铺详情页面"]')).toContainText("待授权");
});
test("Figma binding group and owner affordances preserve draft and follow company member flow",async({page})=>{
 await page.goto(root+"/stores");
 await page.getByRole("button",{name:"绑定新店铺"}).first().click();
 const form=page.getByRole("dialog",{name:"绑定新店铺"});
 await form.getByLabel("自定义名称").fill("分组绑定草稿");
 await form.getByRole("button",{name:"新建分组"}).click();
 const group=page.getByRole("dialog",{name:"新建店铺分组"});
 await expect(group).toBeVisible();
 await group.getByRole("textbox",{name:"新建店铺分组名称"}).fill("店铺运营组");
 await group.getByRole("button",{name:"创建分组"}).click();
 await expect(group).toHaveCount(0);
 await expect(form.getByLabel("绑定店铺分组")).toHaveValue("店铺运营组");
 await expect(form.getByLabel("自定义名称")).toHaveValue("分组绑定草稿");
 await form.getByRole("button",{name:"添加负责人"}).click();
 const owner=page.getByRole("dialog",{name:"添加负责人"});
 await expect(owner).toContainText("成员与权限");
 await owner.getByRole("button",{name:"暂不添加"}).click();
 await expect(form).toBeVisible();
 await form.getByLabel("负责人").selectOption("林晨");
 await form.getByRole("button",{name:"提交授权"}).click();
 const area=page.locator('[data-store-center-showcase="stores"]');
 await expect(area.locator("article").filter({hasText:"分组绑定草稿"}).getByText("店铺运营组",{exact:true})).toBeVisible();
 await expect(area.getByText("林晨",{exact:true})).toBeVisible();
});
test("Figma more-operation menu wires rename, reauthorization and safe unlink",async({page})=>{
 const area=await createDemo(page,"待操作店铺");
 await area.getByRole("button",{name:"更多操作 · 待操作店铺"}).click();
 const menu=area.getByRole("menu",{name:"店铺操作"});
 for(const label of ["修改自定义名称","调整负责人","调整分组","重新授权","解绑店铺"])await expect(menu.getByRole("menuitem",{name:label})).toBeVisible();
 await menu.getByRole("menuitem",{name:"修改自定义名称"}).click();
 const edit=page.getByRole("dialog",{name:"管理店铺名称"});
 await edit.getByRole("textbox",{name:"店铺名称"}).fill("已重命名店铺");
 await edit.getByRole("button",{name:"保存修改"}).click();
 await expect(area.getByText("已重命名店铺",{exact:true})).toBeVisible();
 await area.getByRole("button",{name:"更多操作 · 已重命名店铺"}).click();
 await area.getByRole("menuitem",{name:"解绑店铺"}).click();
 const confirm=page.getByRole("alertdialog",{name:"确认移除演示店铺"});
 await expect(confirm).toBeVisible();
 await confirm.getByRole("button",{name:"确认移除"}).click();
 await expect(area.getByRole("heading",{name:"尚未绑定店铺"})).toBeVisible();
});
test("enter-store is a full five-tab Figma detail view rather than a generic workspace modal",async({page})=>{
 const area=await createDemo(page,"店铺详情演示");
 await area.getByRole("button",{name:"进入店铺"}).click();
 await expect(page.getByRole("dialog",{name:"店铺工作台"})).toHaveCount(0);
 const details=page.getByRole("region",{name:"店铺详情页面"});
 await expect(details).toBeVisible();
 for(const tab of ["店铺概览","授权信息","数据同步","网络环境","店铺设置"]){
  await details.getByRole("button",{name:tab,exact:true}).click();
  await expect(details.getByRole("button",{name:tab,exact:true})).toHaveAttribute("aria-current","page");
 }
 await details.getByLabel("店铺负责人").selectOption("林晨");
 await details.getByRole("button",{name:"保存设置"}).click();
 await page.getByRole("button",{name:"返回我的店铺"}).click();
 await expect(area.getByText("林晨",{exact:true})).toBeVisible();
});
test("store settings are staged until Save, and returning discards uncommitted edits",async({page})=>{
 const area=await createDemo(page,"待保存设置");
 await area.getByRole("button",{name:"管理",exact:true}).click();
 const details=page.getByRole("region",{name:"店铺详情页面"});
 await details.getByLabel("店铺负责人").selectOption("林晨");
 await page.getByRole("button",{name:"返回我的店铺"}).click();
 await expect(area.getByText("林晨",{exact:true})).toHaveCount(0);
 await area.getByRole("button",{name:"管理",exact:true}).click();
 await expect(details.getByLabel("店铺负责人")).toHaveValue("");
 await details.getByLabel("店铺负责人").selectOption("林晨");
 await details.getByRole("button",{name:"保存设置"}).click();
 await page.getByRole("button",{name:"返回我的店铺"}).click();
 await expect(area.getByText("林晨",{exact:true})).toBeVisible();
});
test("Figma group creation, rename and deletion preserve store rather than unlink it",async({page})=>{
 const area=await createDemo(page,"分组店铺");
 await area.getByRole("button",{name:"管理分组"}).click();
 const groups=page.getByRole("dialog",{name:"管理分组"});
 await groups.getByRole("textbox",{name:"分组名称"}).fill("原型分组");
 await groups.getByRole("button",{name:"创建分组"}).click();
 await groups.getByRole("button",{name:"完成"}).click();
 await area.getByRole("button",{name:"进入店铺"}).click();
 const details=page.getByRole("region",{name:"店铺详情页面"});
 await details.getByRole("button",{name:"店铺设置"}).click();
 await details.getByLabel("店铺所属分组").selectOption("原型分组");
 await details.getByRole("button",{name:"保存设置"}).click();
 await details.getByRole("button",{name:"管理分组"}).click();
 const groupDialog=page.getByRole("dialog",{name:"管理分组"});
 await groupDialog.getByRole("button",{name:"重命名"}).click();
 const rename=page.getByRole("dialog",{name:"重命名分组"});
 await rename.getByRole("textbox",{name:"重命名分组名称"}).fill("核心分组");
 await rename.getByRole("button",{name:"保存修改"}).click();
 await expect(groupDialog.getByText("核心分组",{exact:true})).toBeVisible();
 await groupDialog.getByRole("button",{name:"删除",exact:true}).click();
 await groupDialog.getByRole("button",{name:"完成"}).click();
 await expect(details.getByLabel("店铺所属分组")).toHaveValue("未分组");
 await expect(page.getByText("分组店铺",{exact:true}).first()).toBeVisible();
});
test("Escape closes the topmost Figma overlay without dropping the store-detail page",async({page})=>{
 const area=await createDemo(page,"保持上下文店铺");
 await area.getByRole("button",{name:"进入店铺",exact:true}).click();
 const details=page.getByRole("region",{name:"店铺详情页面"});
 await details.getByRole("button",{name:"店铺设置",exact:true}).click();
 await details.getByRole("button",{name:"管理分组"}).click();
 await expect(page.getByRole("dialog",{name:"管理分组"})).toBeVisible();
 await page.keyboard.press("Escape");
 await expect(page.getByRole("dialog",{name:"管理分组"})).toHaveCount(0);
 await expect(details).toBeVisible();
 await expect(details.getByRole("button",{name:"店铺设置",exact:true})).toHaveAttribute("aria-current","page");
 await page.getByRole("button",{name:"返回我的店铺"}).click();
 await area.getByRole("button",{name:"更多操作 · 保持上下文店铺"}).click();
 await expect(area.getByRole("menu",{name:"店铺操作"})).toBeVisible();
 await page.keyboard.press("Escape");
 await expect(area.getByRole("menu",{name:"店铺操作"})).toHaveCount(0);
});
test("store-center UI keeps approved dark/light Vuexy surface colors",async({page})=>{
 for(const theme of ["dark","light"]){
  await page.goto(root+"/stores");
  const btn=page.getByRole("button",{name:theme==="light"?"切换浅色主题":"切换深色主题"});
  if(await btn.isVisible())await btn.click();
  const area=page.locator('[data-store-center-showcase="stores"]');
  const bg=await area.locator("header").first().evaluate(el=>getComputedStyle(el).backgroundColor);
  expect(bg,theme).toMatch(/^rgb\(/);
  await area.getByRole("button",{name:"绑定新店铺"}).first().click();
  await expect(page.getByRole("dialog",{name:"绑定新店铺"})).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog",{name:"绑定新店铺"})).toHaveCount(0);
 }
});


test("My Stores Figma optimized asset layout exposes captions and separate operational statuses",async({page})=>{
 await page.goto(root+"/stores");
 const area=page.locator('[data-store-center-showcase="stores"]');
 await expect(area.getByRole("heading",{name:"我的店铺"})).toBeVisible();
 const overview=area.getByRole("region",{name:"店铺运营概览"});
 for(const metric of ["店铺总数","正常店铺","需要处理","同步正常"])await expect(overview.getByText(metric,{exact:true})).toBeVisible();
 await expect(overview.locator("article")).toHaveCount(4);
 await expect(area.getByText("统一管理店铺连接、授权、网络环境和数据状态。")).toBeVisible();

 for(const caption of ["搜索","平台","站点","店铺类型","店铺状态","店铺分组"]){
  await expect(area.locator("form").filter({has:page.getByLabel("搜索店铺")}).first().getByText(caption,{exact:true})).toBeVisible();
 }
 const cards=area.locator("article[class*=\"storeCard\"]").filter({hasText:"管理员演示店铺01"});
 await expect(cards.first()).toContainText("平台授权");
 await expect(cards.first()).toContainText("网络环境");
 await expect(cards.first()).toContainText("数据同步");
 await expect(cards.first()).toContainText("待授权");
 await expect(cards.first()).toContainText("待检测");
 await expect(cards.first()).toContainText("未开始");
 await expect(cards.first()).toContainText("店铺分组");
 await expect(cards.first().getByRole("button",{name:"管理",exact:true})).toBeVisible();
 await expect(cards.first().getByRole("button",{name:"立即同步"})).toBeVisible();
 await expect(cards.first().getByRole("button",{name:"进入店铺"})).toBeVisible();
 await area.getByLabel("站点筛选").selectOption("美国站");
 await area.getByRole("button",{name:"确认",exact:true}).click();
 await expect(area).toContainText("管理员演示店铺01");
 await expect(area).not.toContainText("管理员演示店铺02");
 await area.getByRole("button",{name:"重置"}).click();
 await expect(area).toContainText("管理员演示店铺02");
});


test("organization-scoped store bindings activate 30-day plans and synchronize with enterprise resources",async({page})=>{
 await page.goto(root+"/stores");
 const stores=page.locator('[data-store-center-showcase="stores"]');
 await expect(stores).toContainText("共 10 家");
 await page.goto(root+"/account");
 await expect(page.locator('[class*="accountBottom"]')).toContainText("已绑定 10 家 · 待授权 10 家");
 await page.goto(root+"/plans");
 await expect(page.locator('[class*="planOverview"]')).toContainText("本组织已绑定 10 家");
 await expect(page.locator('[class*="planOverview"]')).toContainText("已使用 0 期");
 await page.goto(root+"/plans/entitlements");
 const card=page.locator('[class*="planEntitlementCards"]').getByRole("heading",{name:"店铺服务"}).locator("..");
 await expect(page.locator('[class*="planEntitlementStoreSplit"]')).toContainText("10");
 await expect(card).toContainText("剩余可分配");
 await page.goto(root+"/account/organization");
 await expect(page.getByRole("region",{name:"企业空间概览"})).toContainText("10");
 await expect(page.getByRole("region",{name:"企业空间概览"})).toContainText("待授权 10 家");
 await page.goto(root+"/account/profile");
 await expect(page.locator('[data-account-profile-page="overview"]')).toContainText("系统登记店铺");
 await expect(page.locator('[data-account-profile-page="overview"]')).toContainText("10 家 · 待授权");
 await page.goto(root+"/stores");
 await stores.getByRole("button",{name:"绑定新店铺"}).first().click();
 const binding=page.getByRole("dialog",{name:"绑定新店铺"});
 await binding.getByRole("textbox",{name:"自定义名称"}).fill("联动校验管理员店铺");
 await binding.getByRole("button",{name:"提交授权"}).click();
 await expect(stores).toContainText("共 11 家");
 const service=await page.evaluate(()=>{
  const stores=JSON.parse(sessionStorage.getItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001")||"[]");
  const added=stores.find((s:{name:string})=>s.name==="联动校验管理员店铺");
  return added&&{periods:added.servicePeriods,duration:Date.parse(added.serviceExpiresAt)-Date.parse(added.serviceStartedAt)};
 });
 expect(service).toEqual({periods:1,duration:30*24*60*60*1000});
 await page.goto(root+"/plans/entitlements");
 await expect(page.locator('[class*="planEntitlementStoreSplit"]')).toContainText("11");
 await expect(page.locator('[class*="planEntitlementNotes"]').first()).toContainText("已使用：1 期");
 await page.goto(root+"/stores");
 const activeCard=stores.locator('article[class*="storeCard"]').filter({hasText:"联动校验管理员店铺"});
 await expect(activeCard).toContainText("服务中");
 await activeCard.getByRole("button",{name:"续费30天"}).click();
 const renewed=await page.evaluate(()=>{
  const raw=JSON.parse(sessionStorage.getItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001")||"[]");
  const store=raw.find((s:{name:string})=>s.name==="联动校验管理员店铺");
  return store&&{periods:store.servicePeriods,duration:Date.parse(store.serviceExpiresAt)-Date.parse(store.serviceStartedAt)};
 });
 expect(renewed).toEqual({periods:2,duration:60*24*60*60*1000});
 await expect(activeCard).toContainText("服务中");
 await page.goto(root+"/plans/entitlements");
 await expect(page.locator('[class*="planEntitlementNotes"]').first()).toContainText("已使用：2 期");
 await page.goto(root+"/stores");
 await expect(stores.locator('article[class*="storeCard"]').filter({hasText:"联动校验管理员店铺"})).toContainText("服务中");

 await page.goto(root+"/account/organization");
 await expect(page.getByRole("region",{name:"企业空间概览"})).toContainText("待授权 11 家");
});


test("other organization purchase ledger stays isolated from the primary organization",async({page})=>{
 await page.goto(root+"/stores");
 await page.getByRole("button",{name:/linchen_demo账户/}).click();
 await page.getByRole("dialog",{name:"账户快捷操作"}).getByRole("button",{name:"切换账户与企业组织"}).click();
 const switcher=page.getByRole("dialog",{name:"切换账户与企业组织"});
 await switcher.getByRole("button",{name:/模拟同事01/}).click();
 await switcher.getByRole("button",{name:"确认切换"}).click();
 await page.getByRole("button",{name:/模拟同事01账户/}).click();
 await page.getByRole("dialog",{name:"账户快捷操作"}).getByRole("button",{name:"切换账户与企业组织"}).click();
 const organizationSwitch=page.getByRole("dialog",{name:"切换账户与企业组织"});
 await organizationSwitch.getByRole("tab",{name:"切换企业"}).click();
 await organizationSwitch.getByRole("button",{name:/模拟企业A（运营公司）/}).click();
 await organizationSwitch.getByRole("button",{name:"确认切换"}).click();
 await page.goto(root+"/plans/entitlements");
 const entitlements=page.locator('[data-commerce-unified="plans"]');
 await expect(entitlements).toContainText("已绑定店铺");
 await expect(entitlements.locator('[class*="planEntitlementStoreSplit"]')).toContainText("0");
 await page.goto(root+"/plans/top-up");
 const wallet=page.locator('[data-commerce-unified="plans"]');
 await expect(wallet).toContainText("¥0.00");
 await wallet.getByRole("spinbutton",{name:"充值金额（元）"}).fill("336");
 await wallet.getByRole("button",{name:"账户充值",exact:true}).click();
 const dialog=page.getByRole("dialog",{name:"确认模拟购买"});
 await dialog.getByRole("button",{name:/确认模拟充值/}).click();
 await wallet.getByRole("spinbutton",{name:"购买期数 · 店铺服务"}).fill("2");
 await wallet.getByRole("button",{name:"购买续费期数"}).click();
 await page.getByRole("dialog",{name:"确认模拟购买"}).getByRole("button",{name:"确认购买并扣除演示余额"}).click();
 await page.goto(root+"/plans/entitlements");
 await expect(entitlements.locator('[class*="planEntitlementStoreSplit"]')).toContainText("2");
 await page.goto(root+"/stores");
 const stores=page.locator('[data-store-center-showcase="stores"]');
 await stores.getByRole("button",{name:"绑定新店铺"}).first().click();
 const binding=page.getByRole("dialog",{name:"绑定新店铺"});
 await binding.getByRole("textbox",{name:"自定义名称"}).fill("企业A模拟付费店铺");
 await binding.getByRole("button",{name:"提交授权"}).click();
 await expect(stores).toContainText("服务中");
 await page.goto(root+"/plans/entitlements");
 await expect(entitlements.locator('[class*="planEntitlementStoreSplit"]')).toContainText("1");
});

test("expired 30-day store service shows expired status and blocks synchronization until renewed",async({page})=>{
 await page.goto(root+"/stores");
 // Wait for the seeded store to render and session storage effects to commit.
 await expect(page.locator('[data-store-center-showcase="stores"] article[class*="storeCard"]').filter({hasText:"管理员演示店铺01"})).toBeVisible();
 await page.evaluate(()=>{
  const key="shuomi-store-center-demo-ten-v2-SM-ENT-000001";
  const stores=JSON.parse(sessionStorage.getItem(key)||"[]");
  const item=stores.find((s:{id:string})=>s.id==="SIM-ADMIN-01");
  if(!item)throw new Error("Expected seeded administrator store");
  item.serviceStartedAt="2026-09-01T00:00:00.000Z";
  item.serviceExpiresAt="2026-10-01T00:00:00.000Z";
  item.servicePeriods=1;
  sessionStorage.setItem(key,JSON.stringify(stores));
 });
 await page.reload();
 const card=page.locator('[data-store-center-showcase="stores"] article[class*="storeCard"]').filter({hasText:"管理员演示店铺01"});
 await expect(card).toContainText("服务已到期");
 await card.getByRole("button",{name:"立即同步"}).click();
 await expect(page.getByRole("dialog",{name:"立即同步"})).toContainText("请先购买并激活 30 天服务期");
 await page.getByRole("dialog",{name:"立即同步"}).getByRole("button",{name:"取消"}).click();
 await card.getByRole("button",{name:"开通30天"}).click();
 await expect(card).toContainText("服务中");
 await page.goto(root+"/plans/entitlements");
 await expect(page.locator('[class*="planEntitlementNotes"]').first()).toContainText("已使用：2 期");
});
