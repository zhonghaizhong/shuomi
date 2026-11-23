import {expect,test} from "@playwright/test";
const root="/shuomi/#/workbench";
// The legacy workflow tests intentionally begin with an empty tenant.
test.beforeEach(async({page},info)=>{
 if(info.title.startsWith("organization-scoped")||info.title.startsWith("My Stores Figma optimized asset layout")||info.title.startsWith("expired 30-day store service")||info.title.startsWith("four colleague stores are bound")||info.title.startsWith("historically paid colleague demo stores survive")||info.title.startsWith("administrator fixture status and bounded pagination"))return;
 await page.goto(root+"/stores");
 await page.evaluate(()=>{
  sessionStorage.setItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001","[]");
  sessionStorage.setItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001-groups","[]");
 });
 await page.reload();
});
test("administrator fixture status and bounded pagination separate two connection faults from three normal stores",async({page})=>{
 await page.goto(root+"/stores");
 const area=page.locator('[data-store-center-showcase="stores"]');
 const metrics=area.getByRole("region",{name:"店铺运营概览"});
 await expect(metrics.getByRole("button",{name:/正常店铺/})).toContainText("5 家");
 await expect(metrics.getByRole("button",{name:/即将到期/})).toContainText("2 家");
 await expect(metrics.getByRole("button",{name:/待处理/})).toContainText("2 家");
 await expect(area.getByRole("navigation",{name:"店铺列表分页"})).toContainText("第 1 / 2 页");
 await expect(area.locator('article[class*="storeCard"]')).toHaveCount(10);
 await metrics.getByRole("button",{name:/待处理/}).click();
 await expect(area.locator('article[class*="storeCard"]')).toHaveCount(2);
 await expect(area).toContainText("管理员演示店铺04");
 await expect(area).toContainText("管理员演示店铺05");
 await metrics.getByRole("button",{name:/正常店铺/}).click();
 await expect(area.locator('article[class*="storeCard"]')).toHaveCount(5);
 for(const n of ["02","03"])await expect(area.locator('article[class*="storeCard"]').filter({hasText:"管理员演示店铺"+n})).toContainText("服务有效");
 await expect(area).not.toContainText("管理员演示店铺04");
});
test("organization-scoped simulated bindings show eleven to enterprise admin, five to colleague, and isolate other organizations",async({page})=>{
 await page.goto(root+"/stores");
 const area=page.locator('[data-store-center-showcase="stores"]');
 await expect(area.getByText("已绑定店铺")).toBeVisible();
 await expect(area).toContainText("共 11 家店铺");
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
 await expect(area).toContainText("共 5 家店铺");
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
 await expect(dialog).toContainText("额度不足，不能绑定新店铺");
 await expect(dialog.getByRole("button",{name:"确认绑定"})).toBeDisabled();
 await expect(area).not.toContainText("企业B独立店铺");
 await dialog.getByRole("button",{name:"取消"}).click();
 switcher=await openSwitch();
 await switcher.getByRole("tab",{name:"切换企业"}).click();
 await switcher.getByRole("button",{name:/武汉硕米电子商务有限公司/}).click();
 await switcher.getByRole("button",{name:"确认切换"}).click();
 await page.goto(root+"/stores");
 await expect(area).toContainText("同事01演示店铺01");
 await expect(area).toContainText("共 5 家店铺");
 await expect(area).not.toContainText("企业B独立店铺");
});

async function createDemo(page:any,name="Figma店铺"){
 await page.goto(root+"/stores");
 const area=page.locator('[data-store-center-showcase="stores"]');
 await area.getByRole("button",{name:"绑定新店铺"}).first().click();
 const modal=page.getByRole("dialog",{name:"绑定新店铺"});
 await expect(modal).toBeVisible();
 await modal.getByRole("textbox",{name:"自定义名称"}).fill(name);
 await modal.getByRole("button",{name:"确认绑定"}).click();
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
 await expect(dlg.getByLabel("平台",{exact:true})).toHaveValue("SHEIN");
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
 await expect(dlg.getByRole("status").filter({hasText:"未发送验证码"})).toBeVisible();
 await dlg.getByLabel("启用固定IP").check();
 const ip=page.getByRole("dialog",{name:"固定IP配置"});
 await expect(ip).toContainText("IP的作用");
 await expect(ip).toContainText("防关联");
 await ip.getByLabel("IP地址").fill("192.168.1.10");
 await ip.getByLabel("端口").fill("8080");
 await ip.getByRole("button",{name:"保存并启用"}).click();
 await expect(ip).toHaveCount(0);
 await expect(dlg.getByText("已配置（演示）")).toBeVisible();
 await dlg.getByRole("button",{name:"API 授权"}).click();
 await expect(dlg.getByRole("button",{name:"确认绑定"})).toBeDisabled();
 await dlg.getByRole("button",{name:"子账户授权"}).click();
 await dlg.getByRole("button",{name:"确认绑定"}).click();
 await expect(dlg).toHaveCount(0);
 const area=page.locator('[data-store-center-showcase="stores"]');
 await expect(area.getByText("测试绑定流程",{exact:true})).toBeVisible();
 await area.getByRole("button",{name:"管理店铺",exact:true}).click();
  await page.getByRole("dialog",{name:"管理店铺"}).getByRole("button",{name:"检测连接"}).click();
  await expect(page.getByRole("dialog",{name:"连接检测结果"})).toContainText("未接入 SHEIN 官方验证接口");
  await page.getByRole("dialog",{name:"连接检测结果"}).getByRole("button",{name:"进入店铺详情"}).click();
  await page.getByRole("navigation",{name:"店铺详情导航"}).getByRole("button",{name:"服务信息",exact:true}).click();
  await expect(page.locator('[aria-label="店铺详情页面"]')).toContainText("已绑定");
 await page.goto(root+"/store-products");
 await expect(page.getByRole("heading",{name:"暂无已同步商品"})).toBeVisible();
});
test("compact store rows show batch actions only after selection and preserve local group changes",async({page})=>{
 const area=await createDemo(page,"批量店铺");
 await expect(area.getByRole("region",{name:"批量操作"})).toHaveCount(0);
 await area.getByRole("checkbox",{name:"选择批量店铺"}).check();
 const bulk=area.getByRole("region",{name:"批量操作"});
 await expect(bulk).toContainText("已选择 1 家店铺");
 await bulk.getByRole("button",{name:"加入分组"}).click();
 await bulk.getByLabel("选择批量分组").selectOption("未分组");
 await bulk.getByRole("button",{name:"确认加入"}).click();
 await expect(bulk).toHaveCount(0);
 await expect(area.getByText("批量店铺",{exact:true})).toBeVisible();
});
test("pending includes only previously bound active stores with confirmed connection faults, never expired stores",async({page})=>{
 const area=await createDemo(page,"连接异常店铺");
 await page.evaluate(()=>{
  const key="shuomi-store-center-demo-ten-v2-SM-ENT-000001";
  const values=JSON.parse(sessionStorage.getItem(key)||"[]");
  const store=values.find((s:{name:string})=>s.name==="连接异常店铺");
  if(!store)throw new Error("Expected bound store");
  store.connectionIssue="平台接口异常";
  values.push({...store,id:"EXPIRED-TEST-ONLY",name:"已到期但连接状态不作为待处理",connectionIssue:undefined,serviceExpiresAt:"2026-01-01T00:00:00.000Z"});
  sessionStorage.setItem(key,JSON.stringify(values));
 });
 await page.reload();
 const overview=area.getByRole("region",{name:"店铺运营概览"});
 await expect(overview.getByRole("button",{name:/待处理/})).toContainText("1 家");
 await expect(overview.getByRole("button",{name:/已到期/})).toContainText("1 家");
 await overview.getByRole("button",{name:/待处理/}).click();
 await expect(area).toContainText("连接异常店铺");
 await expect(area).not.toContainText("已到期但连接状态不作为待处理");
 await expect(area.locator('article[class*="storeCard"]').filter({hasText:"连接异常店铺"})).toContainText("平台接口异常");
});
test("Figma manage dialog edits a normal store without changing its service or authorization",async({page})=>{
 const area=await createDemo(page,"管理弹窗测试店铺");
 const card=area.locator('article[class*="storeCard"]').filter({hasText:"管理弹窗测试店铺"});
 await card.getByRole("button",{name:"管理店铺",exact:true}).click();
 const dialog=page.getByRole("dialog",{name:"管理店铺"});
 await expect(dialog).toBeVisible();
 await expect(dialog.getByLabel("平台",{exact:true})).toHaveValue("SHEIN");
 await expect(dialog.getByLabel("自定义名称")).toHaveValue("管理弹窗测试店铺");
 await expect(dialog.getByLabel("子账户账号")).toBeVisible();
 await expect(dialog.getByRole("button",{name:"保存修改"})).toBeVisible();
 await dialog.getByLabel("自定义名称").fill("调整后店铺");
 await dialog.getByRole("button",{name:"保存修改"}).click();
 await expect(dialog).toHaveCount(0);
 await expect(area).toContainText("调整后店铺");
 await expect(area).toContainText("服务有效");
});
test("existing binding preserves immutable platform store identity and previously saved non-secret auth account",async({page})=>{
 const area=await createDemo(page,"锁定身份演示");
 const card=area.locator('article[class*="storeCard"]').filter({hasText:"锁定身份演示"});
 const originalId=(await card.locator("small").first().textContent())?.replace("店铺 ID：","").trim();
 expect(originalId).toMatch(/^SIM-SHEIN-/);
 await card.getByRole("button",{name:"管理店铺",exact:true}).click();
 const dlg=page.getByRole("dialog",{name:"管理店铺"});
 await expect(dlg.getByTestId("locked-platform-store-id")).toHaveText(originalId!);
 await expect(dlg.getByLabel("站点",{exact:true})).toBeDisabled();
 await expect(dlg.getByLabel("店铺类型")).toBeDisabled();
 await expect(dlg.getByLabel("子账户账号")).toBeEnabled();
 await expect(dlg.getByLabel("子账户密码")).toBeEnabled();
 await dlg.getByLabel("子账户账号").fill("demo_changed_account");
 await dlg.getByLabel("子账户密码").fill("DEMO_ONLY_changed");
 await dlg.getByLabel("自定义名称").fill("变更显示名而不换店");
 await dlg.getByRole("button",{name:"保存修改"}).click();
 const renamed=area.locator('article[class*="storeCard"]').filter({hasText:"变更显示名而不换店"});
 await expect(renamed).toContainText(originalId!);
 const record=await page.evaluate(()=>JSON.parse(sessionStorage.getItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001")||"[]").find((s:{name:string})=>s.name==="变更显示名而不换店"));
 expect(record.platformStoreId).toBe(originalId);
 expect(record.servicePeriods).toBe(1);
 expect(record.bindingAccount).toBe("demo_changed_account");
 expect(record.demoPassword).toBe("DEMO_ONLY_changed");
});

test("every bound card always presents four aligned actions; moving group and unlinking never reassign service",async({page})=>{
 const area=await createDemo(page,"卡片四按钮店铺");
 const card=area.locator('article[class*="storeCard"]').filter({hasText:"卡片四按钮店铺"});
 for(const action of ["移动分组","删除店铺","续费","管理店铺"])await expect(card.getByRole("button",{name:action,exact:true})).toBeVisible();
 await card.getByRole("button",{name:"移动分组"}).click();
 const move=page.getByRole("dialog",{name:"移动店铺分组"});
 await expect(move).toContainText("平台店铺 ID");
 await move.getByRole("button",{name:"确认移动"}).click();
 await expect(move).toHaveCount(0);
 await card.getByRole("button",{name:"删除店铺"}).click();
 const confirmation=page.getByRole("alertdialog",{name:"确认移除演示店铺"});
 await expect(confirmation).toContainText("已删除");
 await expect(confirmation).toContainText("可随时恢复");
 await expect(confirmation).toContainText("已使用服务期不退回");
 await confirmation.getByRole("button",{name:"取消"}).click();
 await expect(card).toBeVisible();
});
test("soft deleted stores recover unchanged platform ID, owner and service periods",async({page})=>{
 const area=await createDemo(page,"待恢复演示店铺");
 const card=area.locator('article[class*="storeCard"]').filter({hasText:"待恢复演示店铺"});
 const original=await page.evaluate(()=>JSON.parse(sessionStorage.getItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001")||"[]").find((s:{name:string})=>s.name==="待恢复演示店铺"));
 await card.getByRole("button",{name:"删除店铺"}).click();
 await page.getByRole("alertdialog",{name:"确认移除演示店铺"}).getByRole("button",{name:"确认移除"}).click();
 await expect(area).not.toContainText("待恢复演示店铺");
 await area.getByRole("button",{name:/已删除/}).click();
 const archived=area.locator('article[class*="storeCard"]').filter({hasText:"待恢复演示店铺"});
 await expect(archived.getByRole("button",{name:"恢复店铺"})).toBeVisible();
 await archived.getByRole("button",{name:"恢复店铺"}).click();
 await area.getByRole("button",{name:/已绑定店铺/}).click();
 await expect(area).toContainText("待恢复演示店铺");
 const restored=await page.evaluate(()=>JSON.parse(sessionStorage.getItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001")||"[]").find((s:{name:string})=>s.name==="待恢复演示店铺"));
 expect(restored.platformStoreId).toBe(original.platformStoreId);
 expect(restored.ownerMemberId).toBe(original.ownerMemberId);
 expect(restored.serviceExpiresAt).toBe(original.serviceExpiresAt);
 expect(restored.servicePeriods).toBe(original.servicePeriods);
 expect(restored.archived).toBe(false);
});
test("administrator transfers store ownership to colleague without changing service or connection state",async({page})=>{
 const area=await createDemo(page,"所属权转移测试店铺");
 const before=await page.evaluate(()=>JSON.parse(sessionStorage.getItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001")||"[]").find((s:{name:string})=>s.name==="所属权转移测试店铺"));
 await area.getByRole("button",{name:"管理店铺",exact:true}).click();
 const dlg=page.getByRole("dialog",{name:"管理店铺"});
 await dlg.getByRole("combobox",{name:"负责人"}).selectOption({label:"模拟同事01"});
 await dlg.getByRole("button",{name:"保存修改"}).click();
 const after=await page.evaluate(()=>JSON.parse(sessionStorage.getItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001")||"[]").find((s:{name:string})=>s.name==="所属权转移测试店铺"));
 expect(after.ownerMemberId).toBe("SIM-COLLEAGUE-01");
 expect(after.platformStoreId).toBe(before.platformStoreId);
 expect(after.servicePeriods).toBe(before.servicePeriods);
 expect(after.serviceExpiresAt).toBe(before.serviceExpiresAt);
 expect(after.connectionIssue).toBe(before.connectionIssue);
 await page.getByRole("button",{name:/linchen_demo账户/}).click();
 await page.getByRole("dialog",{name:"账户快捷操作"}).getByRole("button",{name:"切换账户与企业组织"}).click();
 await page.getByRole("dialog",{name:"切换账户与企业组织"}).getByRole("button",{name:/模拟同事01/}).click();
 await page.getByRole("dialog",{name:"切换账户与企业组织"}).getByRole("button",{name:"确认切换"}).click();
 await page.goto(root+"/stores");
 await expect(page.locator('[data-store-center-showcase="stores"]')).toContainText("所属权转移测试店铺");
});
test("Figma filters apply only on confirm and reset together",async({page})=>{
 const area=await createDemo(page,"筛选店铺");
 await area.getByLabel("站点筛选").selectOption("加拿大站");
 await expect(area.getByText("筛选店铺",{exact:true})).toBeVisible();
 await area.getByRole("button",{name:"确认",exact:true}).click();
 await expect(area.getByText("筛选店铺",{exact:true})).toHaveCount(0);
 await area.getByRole("button",{name:"重置"}).click();
 await expect(area.getByText("筛选店铺",{exact:true})).toBeVisible();
 await expect(area.getByLabel("店铺状态筛选")).toHaveCount(0);
 await expect(area.getByLabel("店铺分组筛选")).toHaveCount(0);
 await area.getByRole("region",{name:"店铺运营概览"}).getByRole("button",{name:/待处理/}).click();
 await expect(area.getByText("筛选店铺",{exact:true})).toHaveCount(0);
});
test("Figma Manage opens modal and retains settings under store-detail tabs, without fake authorization",async({page})=>{
 const area=await createDemo(page,"待修改店铺");
 await area.getByRole("button",{name:"管理店铺",exact:true}).click();
  await page.getByRole("dialog",{name:"管理店铺"}).getByRole("button",{name:"检测连接"}).click();
  await expect(page.getByRole("dialog",{name:"连接检测结果"})).toContainText("未接入 SHEIN 官方验证接口");
  await page.getByRole("dialog",{name:"连接检测结果"}).getByRole("button",{name:"进入店铺详情"}).click();
 const details=page.getByRole("region",{name:"店铺详情页面"});
 await expect(details).toBeVisible();
 await details.getByRole("button",{name:"店铺设置",exact:true}).click();
 await expect(details.getByRole("button",{name:"店铺设置",exact:true})).toHaveAttribute("aria-current","page");
 await expect(page.getByRole("dialog",{name:"管理店铺"})).toHaveCount(0);
 await details.getByLabel("店铺负责人").selectOption("林晨");
 await details.getByRole("button",{name:"保存设置"}).click();
 await page.getByRole("button",{name:"返回我的店铺"}).click();
 await expect(area).toContainText("林晨");
 await area.getByRole("button",{name:"管理店铺",exact:true}).click();
  await page.getByRole("dialog",{name:"管理店铺"}).getByRole("button",{name:"检测连接"}).click();
  await expect(page.getByRole("dialog",{name:"连接检测结果"})).toContainText("未接入 SHEIN 官方验证接口");
  await page.getByRole("dialog",{name:"连接检测结果"}).getByRole("button",{name:"进入店铺详情"}).click();
 await details.getByRole("button",{name:"店铺设置",exact:true}).click();
 await details.getByRole("button",{name:"编辑店铺资料"}).click();
 const authorization=page.getByRole("dialog",{name:"管理店铺"});
 await expect(authorization.getByLabel("子账户账号")).toBeVisible();
 await authorization.getByRole("button",{name:"保存修改"}).click();
 await details.getByRole("button",{name:"店铺概览",exact:true}).click();
 await page.getByRole("navigation",{name:"店铺详情导航"}).getByRole("button",{name:"服务信息",exact:true}).click();
 await expect(page.locator('[aria-label="店铺详情页面"]')).toContainText("已绑定");
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
 await form.getByLabel("负责人").selectOption({label:"模拟同事01"});
 await form.getByRole("button",{name:"确认绑定"}).click();
 const area=page.locator('[data-store-center-showcase="stores"]');
 await expect(area.locator("article").filter({hasText:"分组绑定草稿"})).toContainText("店铺运营组");
 await expect(area).toContainText("模拟同事01");
});
test("store detail retains rename, edit and unlink without card menu",async({page})=>{
 const area=await createDemo(page,"待操作店铺");
 await area.getByRole("button",{name:"管理店铺",exact:true}).click();
  await page.getByRole("dialog",{name:"管理店铺"}).getByRole("button",{name:"检测连接"}).click();
  await expect(page.getByRole("dialog",{name:"连接检测结果"})).toContainText("未接入 SHEIN 官方验证接口");
  await page.getByRole("dialog",{name:"连接检测结果"}).getByRole("button",{name:"进入店铺详情"}).click();
 const details=page.getByRole("region",{name:"店铺详情页面"});
 await details.getByRole("button",{name:"店铺设置",exact:true}).click();
 for(const label of ["修改自定义名称","编辑店铺资料","解绑店铺"])await expect(details.getByRole("button",{name:label})).toBeVisible();
 await details.getByRole("button",{name:"修改自定义名称"}).click();
 const edit=page.getByRole("dialog",{name:"管理店铺名称"});
 await edit.getByRole("textbox",{name:"店铺名称"}).fill("已重命名店铺");
 await edit.getByRole("button",{name:"保存修改"}).click();
 await details.getByRole("button",{name:"解绑店铺"}).click();
 const confirm=page.getByRole("alertdialog",{name:"确认移除演示店铺"});
 await expect(confirm).toBeVisible();
 await confirm.getByRole("button",{name:"确认移除"}).click();
 await expect(area.getByRole("heading",{name:"尚未绑定店铺"})).toBeVisible();
});
test("enter-store is a full five-tab Figma detail view rather than a generic workspace modal",async({page})=>{
 const area=await createDemo(page,"店铺详情演示");
 await area.getByRole("button",{name:"管理店铺"}).click();
  await page.getByRole("dialog",{name:"管理店铺"}).getByRole("button",{name:"检测连接"}).click();
  await expect(page.getByRole("dialog",{name:"连接检测结果"})).toContainText("未接入 SHEIN 官方验证接口");
  await page.getByRole("dialog",{name:"连接检测结果"}).getByRole("button",{name:"进入店铺详情"}).click();
 await expect(page.getByRole("dialog",{name:"店铺工作台"})).toHaveCount(0);
 const details=page.getByRole("region",{name:"店铺详情页面"});
 await expect(details).toBeVisible();
 for(const tab of ["店铺概览","服务信息","数据同步","网络环境","店铺设置"]){
  await details.getByRole("button",{name:tab,exact:true}).click();
  await expect(details.getByRole("button",{name:tab,exact:true})).toHaveAttribute("aria-current","page");
 }
 await details.getByLabel("店铺负责人").selectOption("林晨");
 await details.getByRole("button",{name:"保存设置"}).click();
 await page.getByRole("button",{name:"返回我的店铺"}).click();
 await expect(area).toContainText("林晨");
});
test("store settings are staged until Save, and returning discards uncommitted edits",async({page})=>{
 const area=await createDemo(page,"待保存设置");
 await area.getByRole("button",{name:"管理店铺",exact:true}).click();
  await page.getByRole("dialog",{name:"管理店铺"}).getByRole("button",{name:"检测连接"}).click();
  await expect(page.getByRole("dialog",{name:"连接检测结果"})).toContainText("未接入 SHEIN 官方验证接口");
  await page.getByRole("dialog",{name:"连接检测结果"}).getByRole("button",{name:"进入店铺详情"}).click();
 const details=page.getByRole("region",{name:"店铺详情页面"});
 await details.getByRole("button",{name:"店铺设置",exact:true}).click();
 const before=await page.evaluate(()=>JSON.parse(sessionStorage.getItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001")||"[]").find((s:{name:string})=>s.name==="待保存设置"));
 await details.getByLabel("店铺负责人").selectOption({label:"模拟同事01"});
 await page.getByRole("button",{name:"返回我的店铺"}).click();
 const after=await page.evaluate(()=>JSON.parse(sessionStorage.getItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001")||"[]").find((s:{name:string})=>s.name==="待保存设置"));
 expect(after.ownerMemberId).toBe(before.ownerMemberId);
 expect(after.owner).toBe(before.owner);
 await area.getByRole("button",{name:"管理店铺",exact:true}).click();
  await page.getByRole("dialog",{name:"管理店铺"}).getByRole("button",{name:"检测连接"}).click();
  await expect(page.getByRole("dialog",{name:"连接检测结果"})).toContainText("未接入 SHEIN 官方验证接口");
  await page.getByRole("dialog",{name:"连接检测结果"}).getByRole("button",{name:"进入店铺详情"}).click();
 await details.getByRole("button",{name:"店铺设置",exact:true}).click();
 await expect(details.getByLabel("店铺负责人")).toHaveValue(before.owner);
 await details.getByLabel("店铺负责人").selectOption("林晨");
 await details.getByRole("button",{name:"保存设置"}).click();
 await page.getByRole("button",{name:"返回我的店铺"}).click();
 await expect(area).toContainText("林晨");
});
test("Figma group creation, rename and deletion preserve store rather than unlink it",async({page})=>{
 const area=await createDemo(page,"分组店铺");
 await area.getByRole("button",{name:"管理分组"}).click();
 const groups=page.getByRole("dialog",{name:"管理分组"});
 await groups.getByRole("textbox",{name:"分组名称"}).fill("原型分组");
 await groups.getByRole("button",{name:"创建分组"}).click();
 await groups.getByRole("button",{name:"完成"}).click();
 await area.getByRole("button",{name:"管理店铺"}).click();
  await page.getByRole("dialog",{name:"管理店铺"}).getByRole("button",{name:"检测连接"}).click();
  await expect(page.getByRole("dialog",{name:"连接检测结果"})).toContainText("未接入 SHEIN 官方验证接口");
  await page.getByRole("dialog",{name:"连接检测结果"}).getByRole("button",{name:"进入店铺详情"}).click();
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
 await area.getByRole("button",{name:"管理店铺",exact:true}).click();
  await page.getByRole("dialog",{name:"管理店铺"}).getByRole("button",{name:"检测连接"}).click();
  await expect(page.getByRole("dialog",{name:"连接检测结果"})).toContainText("未接入 SHEIN 官方验证接口");
  await page.getByRole("dialog",{name:"连接检测结果"}).getByRole("button",{name:"进入店铺详情"}).click();
 const details=page.getByRole("region",{name:"店铺详情页面"});
 await details.getByRole("button",{name:"店铺设置",exact:true}).click();
 await details.getByRole("button",{name:"管理分组"}).click();
 await expect(page.getByRole("dialog",{name:"管理分组"})).toBeVisible();
 await page.keyboard.press("Escape");
 await expect(page.getByRole("dialog",{name:"管理分组"})).toHaveCount(0);
 await expect(details).toBeVisible();
 await expect(details.getByRole("button",{name:"店铺设置",exact:true})).toHaveAttribute("aria-current","page");
 await page.getByRole("button",{name:"返回我的店铺"}).click();
 await area.getByRole("button",{name:"管理店铺",exact:true}).click();
  await page.getByRole("dialog",{name:"管理店铺"}).getByRole("button",{name:"检测连接"}).click();
  await expect(page.getByRole("dialog",{name:"连接检测结果"})).toContainText("未接入 SHEIN 官方验证接口");
  await page.getByRole("dialog",{name:"连接检测结果"}).getByRole("button",{name:"进入店铺详情"}).click();
 await details.getByRole("button",{name:"店铺设置",exact:true}).click();
 await expect(details.getByRole("button",{name:"解绑店铺"})).toBeVisible();
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
 for(const metric of ["已绑定店铺","正常店铺","即将到期","已到期","待处理","已删除"])await expect(overview.getByText(metric,{exact:true})).toBeVisible();
 await expect(overview.getByRole("button")).toHaveCount(6);
 await expect(area.getByText("统一管理店铺连接、授权、网络环境和数据状态。")).toBeVisible();

 const filter=area.getByRole("form",{name:"店铺筛选"});
 const criteria=filter.locator('[aria-label="条件筛选"]');
 const actions=filter.locator('[aria-label="搜索与操作"]');
 for(const field of ["平台筛选","站点筛选","店铺类型筛选"])await expect(criteria.getByLabel(field)).toBeVisible();
 await expect(actions.getByLabel("搜索店铺")).toBeVisible();
 await expect(actions.getByRole("button",{name:"重置"})).toBeVisible();
 await expect(actions.getByRole("button",{name:"确认"})).toBeVisible();
 const cards=area.locator("article[class*=\"storeCard\"]").filter({hasText:"管理员演示店铺01"});
 await expect(cards.first()).toContainText("店铺 ID：");
 await expect(cards.first()).toContainText("服务期限：");
 await expect(cards.first()).toContainText("林晨");
 await expect(cards.first()).not.toContainText("平台授权");
 await expect(cards.first()).not.toContainText("网络环境");
 await expect(cards.first().getByRole("button",{name:"管理店铺",exact:true})).toBeVisible();
 for(const action of ["移动分组","删除店铺","续费","管理店铺"])await expect(cards.first().getByRole("button",{name:action,exact:true})).toBeVisible();
 await expect(cards.first().getByRole("button")).toHaveCount(4);
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
 await expect(stores).toContainText("共 11 家");
 await page.goto(root+"/account");
 await expect(page.locator('[class*="accountBottom"]')).toContainText("已绑定 11 家");
 await page.goto(root+"/plans");
 await expect(page.locator('[class*="planOverview"]')).toContainText("本组织已绑定 11 家");
 await expect(page.locator('[class*="planOverview"]')).toContainText("已使用 2 期");
 await page.goto(root+"/plans/entitlements");
 const card=page.locator('[class*="planEntitlementCards"]').getByRole("heading",{name:"店铺服务"}).locator("..");
 await expect(page.locator('[class*="planEntitlementStoreSplit"]')).toContainText("11");
 await expect(card).toContainText("剩余可分配");
 await page.goto(root+"/account/organization");
 await expect(page.getByRole("region",{name:"企业空间概览"})).toContainText("11");
 await expect(page.getByRole("region",{name:"企业空间概览"})).toContainText("已绑定店铺");
 await page.goto(root+"/account/profile");
 await expect(page.locator('[data-account-profile-page="overview"]')).toContainText("系统登记店铺");
 await expect(page.locator('[data-account-profile-page="overview"]')).toContainText("11 家");
 // The two pre-expired fixtures have already consumed the initial two service periods.
 // Purchase two additional periods to verify a new binding and its subsequent renewal.
 await page.goto(root+"/plans/top-up");
 await page.getByRole("spinbutton",{name:"购买期数 · 店铺服务"}).fill("2");
 await page.getByRole("button",{name:"购买续费期数"}).click();
 await page.getByRole("dialog",{name:"确认模拟购买"}).getByRole("button",{name:"确认购买并扣除演示余额"}).click();
 await page.goto(root+"/stores");
 await stores.getByRole("button",{name:"绑定新店铺"}).first().click();
 const binding=page.getByRole("dialog",{name:"绑定新店铺"});
 await binding.getByRole("textbox",{name:"自定义名称"}).fill("联动校验管理员店铺");
 await binding.getByRole("button",{name:"确认绑定"}).click();
 await expect(stores).toContainText("共 12 家");
 const service=await page.evaluate(()=>{
  const stores=JSON.parse(sessionStorage.getItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001")||"[]");
  const added=stores.find((s:{name:string})=>s.name==="联动校验管理员店铺");
  return added&&{periods:added.servicePeriods,duration:Date.parse(added.serviceExpiresAt)-Date.parse(added.serviceStartedAt)};
 });
 expect(service).toEqual({periods:1,duration:30*24*60*60*1000});
 await page.goto(root+"/plans/entitlements");
 await expect(page.locator('[class*="planEntitlementStoreSplit"]')).toContainText("12");
 await expect(page.locator('[class*="planEntitlementNotes"]').first()).toContainText("已使用：3 期");
 await page.goto(root+"/stores");
 await stores.getByLabel("搜索店铺").fill("联动校验管理员店铺");
 await stores.getByRole("button",{name:"确认",exact:true}).click();
 const activeCard=stores.locator('article[class*="storeCard"]').filter({hasText:"联动校验管理员店铺"});
 await expect(activeCard).toContainText("服务有效");
 await activeCard.getByRole("button",{name:"管理店铺",exact:true}).click();
  await page.getByRole("dialog",{name:"管理店铺"}).getByRole("button",{name:"检测连接"}).click();
  await expect(page.getByRole("dialog",{name:"连接检测结果"})).toContainText("未接入 SHEIN 官方验证接口");
  await page.getByRole("dialog",{name:"连接检测结果"}).getByRole("button",{name:"进入店铺详情"}).click();
 const detail=page.getByRole("region",{name:"店铺详情页面"});
 await detail.getByRole("button",{name:"服务信息",exact:true}).click();
 await detail.getByRole("button",{name:"续费30天",exact:true}).click();
 const renew=page.getByRole("dialog",{name:"店铺续费"});
 await expect(renew.getByLabel("续费周期")).toHaveValue("1");
 await renew.getByRole("button",{name:"确认续费"}).click();
 await expect(renew).toHaveCount(0);
 await page.getByRole("button",{name:"返回我的店铺"}).click();
 const renewed=await page.evaluate(()=>{
  const raw=JSON.parse(sessionStorage.getItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001")||"[]");
  const store=raw.find((s:{name:string})=>s.name==="联动校验管理员店铺");
  return store&&{periods:store.servicePeriods,duration:Date.parse(store.serviceExpiresAt)-Date.parse(store.serviceStartedAt)};
 });
 expect(renewed).toEqual({periods:2,duration:60*24*60*60*1000});
 await expect(activeCard).toContainText("服务有效");
 await page.goto(root+"/plans/entitlements");
 await expect(page.locator('[class*="planEntitlementNotes"]').first()).toContainText("已使用：4 期");
 await page.goto(root+"/stores");
 await stores.getByLabel("搜索店铺").fill("联动校验管理员店铺");
 await stores.getByRole("button",{name:"确认",exact:true}).click();
 await expect(stores.locator('article[class*="storeCard"]').filter({hasText:"联动校验管理员店铺"})).toContainText("服务有效");

 await page.goto(root+"/account/organization");
 await expect(page.getByRole("region",{name:"企业空间概览"})).toContainText("12已绑定店铺");
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
 await binding.getByRole("button",{name:"确认绑定"}).click();
 await expect(stores).toContainText("服务有效");
 await page.goto(root+"/plans/entitlements");
 await expect(entitlements.locator('[class*="planEntitlementStoreSplit"]')).toContainText("1");
});

test("expired 30-day store service prevents synchronization until renewed",async({page})=>{
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
   item.platformStoreId="SIM-SHEIN-ADMIN-01";
  sessionStorage.setItem(key,JSON.stringify(stores));
 });
 await page.reload();
 const card=page.locator('[data-store-center-showcase="stores"] article[class*="storeCard"]').filter({hasText:"管理员演示店铺01"});
 await expect(card).toContainText("服务已到期");
 await card.getByRole("button",{name:"管理店铺"}).click();
  await page.getByRole("dialog",{name:"管理店铺"}).getByRole("button",{name:"检测连接"}).click();
  await expect(page.getByRole("dialog",{name:"连接检测结果"})).toContainText("未接入 SHEIN 官方验证接口");
  await page.getByRole("dialog",{name:"连接检测结果"}).getByRole("button",{name:"进入店铺详情"}).click();
 await page.getByRole("navigation",{name:"店铺详情导航"}).getByRole("button",{name:"数据同步"}).click();
 await page.getByRole("region",{name:"店铺详情页面"}).getByRole("button",{name:"立即同步"}).click();
 await expect(page.getByRole("dialog",{name:"立即同步"})).toContainText("请先确认服务期");
 await page.getByRole("dialog",{name:"立即同步"}).getByRole("button",{name:"我知道了"}).click();
 await page.getByRole("navigation",{name:"店铺详情导航"}).getByRole("button",{name:"服务信息"}).click();
 await expect(page.getByRole("region",{name:"店铺详情页面"})).toContainText("已到期");
 // This scenario has no unassigned service periods, so renewal must not succeed without a purchase.
 await page.getByRole("region",{name:"店铺详情页面"}).getByRole("button",{name:"续费30天"}).click();
 const renew=page.getByRole("dialog",{name:"店铺续费"});
 await expect(renew).toContainText("服务期数不足");
 await expect(renew.getByRole("button",{name:"确认续费"})).toBeDisabled();
 await renew.getByRole("button",{name:"取消"}).click();
 await expect(page.getByRole("region",{name:"店铺详情页面"})).toContainText("已到期");
});


test("new binding is blocked without an available 30-day service period",async({page})=>{
 await page.goto(root+"/stores");
 await page.evaluate(()=>{
   const key="shuomi-store-center-demo-ten-v2-SM-ENT-000001";
   const current=JSON.parse(sessionStorage.getItem(key)||"[]");
   const now=new Date().toISOString();
   sessionStorage.setItem(key,JSON.stringify([
     {id:"TEST-ACTIVE-1",name:"已使用服务一期01",platform:"SHEIN",region:"美国站",type:"半托管",status:"已绑定",createdAt:now,ownerMemberId:"admin",serviceStartedAt:now,serviceExpiresAt:new Date(Date.now()+30*86400000).toISOString(),servicePeriods:1},
     {id:"TEST-ACTIVE-2",name:"已使用服务一期02",platform:"SHEIN",region:"加拿大站",type:"半托管",status:"已绑定",createdAt:now,ownerMemberId:"admin",serviceStartedAt:now,serviceExpiresAt:new Date(Date.now()+30*86400000).toISOString(),servicePeriods:1}
   ]));
 });
 await page.reload();
 const area=page.locator('[data-store-center-showcase="stores"]');
 await area.getByRole("button",{name:"绑定新店铺"}).first().click();
 const dialog=page.getByRole("dialog",{name:"绑定新店铺"});
 await dialog.getByRole("textbox",{name:"自定义名称"}).fill("不得绑定的店铺");
 await expect(dialog).toContainText("额度不足，不能绑定新店铺");
 await expect(dialog.getByRole("button",{name:"确认绑定"})).toBeDisabled();
 await expect(area).not.toContainText("不得绑定的店铺");
 await expect(area).toContainText("共 2 家店铺");
});

test("four colleague stores are bound, and one failed platform-ID lookup is only a failed attempt",async({page})=>{
 await page.goto(root+"/account/organization/resources");
 const suite=page.locator("[data-account-suite]");
 await suite.getByRole("row").filter({hasText:"模拟同事01"}).getByRole("button",{name:"查看店铺"}).click();
 const dialog=page.getByRole("dialog",{name:"店铺详情"});
 for(let i=1;i<=4;i++)await expect(dialog.getByRole("row").filter({hasText:"同事01演示店铺"+String(i).padStart(2,"0")})).toBeVisible();
 await expect(dialog.getByRole("row").filter({hasText:"同事01演示店铺05"})).toHaveCount(0);
 await expect(dialog).toContainText("1 条模拟绑定失败记录");
 await expect(dialog.getByRole("button",{name:"重试获取"})).toHaveCount(0);
});

test("binding starts 30-day service only after a provider ID is returned; failure does not consume a period",async({page})=>{
 await page.goto(root+"/plans/top-up");
 await page.getByRole("spinbutton",{name:"购买期数 · 店铺服务"}).fill("1");
 await page.getByRole("button",{name:"购买续费期数"}).click();
 await page.getByRole("dialog",{name:"确认模拟购买"}).getByRole("button",{name:"确认购买并扣除演示余额"}).click();
 await page.goto(root+"/stores");
 const area=page.locator('[data-store-center-showcase="stores"]');
 const before=await page.evaluate(()=>{
  const stores=JSON.parse(sessionStorage.getItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001")||"[]");
  return stores.reduce((n:number,x:{servicePeriods?:number})=>n+(x.servicePeriods||0),0);
 });
 await area.getByRole("button",{name:"绑定新店铺"}).first().click();
 const dlg=page.getByRole("dialog",{name:"绑定新店铺"});
 await dlg.getByRole("textbox",{name:"自定义名称"}).fill("平台ID校验店铺");
 await dlg.getByRole("textbox",{name:"子账户账号"}).fill("MOCK-FAIL");
 await dlg.getByRole("button",{name:"确认绑定"}).click();
 await expect(dlg).toContainText("绑定未完成，未扣期数");
 await expect(area.getByText("平台ID校验店铺",{exact:true})).toHaveCount(0);
 const afterFailed=await page.evaluate(()=>{
  const stores=JSON.parse(sessionStorage.getItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001")||"[]");
  return stores.reduce((n:number,x:{servicePeriods?:number})=>n+(x.servicePeriods||0),0);
 });
 expect(afterFailed).toBe(before);
 await dlg.getByRole("textbox",{name:"子账户账号"}).fill("valid-showcase-seller");
 await dlg.getByRole("button",{name:"确认绑定"}).click();
 await expect(dlg).toHaveCount(0);
 await expect(area.getByText("平台ID校验店铺",{exact:true})).toBeVisible();
 const created=await page.evaluate(()=>{
  const stores=JSON.parse(sessionStorage.getItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001")||"[]");
  const added=stores.find((x:{name:string})=>x.name==="平台ID校验店铺");
  return added?{id:added.platformStoreId,periods:added.servicePeriods,duration:Date.parse(added.serviceExpiresAt)-Date.parse(added.serviceStartedAt)}:null;
 });
 expect(created?.id).toMatch(/^SIM-SHEIN-/);
 expect(created?.periods).toBe(1);
 expect(created?.duration).toBe(30*86400000);
});

test("historically paid colleague demo stores survive reload without debiting new allocations",async({page})=>{
 await page.goto(root+"/account/organization/resources");
 await expect(page.locator("[data-account-suite]")).toBeVisible();
 await page.waitForFunction(()=>localStorage.getItem("shuomi-account-fixture-reset-20261121-v2")==="done");
 await page.evaluate(()=>{
  const key="shuomi-demo-account-suite-SM-ENT-000001-v1";
  const suite=JSON.parse(localStorage.getItem(key)||"null")||{members:[{id:"admin",name:"林晨",email:"admin@example.test",role:"管理员",status:"正常",joined:Date.now()}],audit:[],roles:["管理员","子账号"],referrals:[],withdrawals:[]};
  suite.storeAllocations={...(suite.storeAllocations||{}),"SIM-COLLEAGUE-01":8};
  localStorage.setItem(key,JSON.stringify(suite));
  // Historical billed fixtures must not consume the newly allocated eight periods.
  sessionStorage.removeItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001");
  sessionStorage.removeItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001-expired-fixture-v1");
 });
 await page.reload();
 const colleague=page.locator("[data-account-suite]").getByRole("row").filter({hasText:"模拟同事01"});
 await expect(colleague).toContainText("已用 5 · 剩余 8");
 await expect(colleague).toContainText("服务中 4 家");
 await page.reload();
 await expect(colleague).toContainText("已用 5 · 剩余 8");
 // A fresh session recreates the synthetic fixtures: restoration must use the
 // historical paid dates rather than issue another debit.
 const snapshot=await page.evaluate(()=>{
  const stores=JSON.parse(sessionStorage.getItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001")||"[]");
  return stores.filter((s:{id:string})=>/^SIM-C01-0[1-4]$/.test(s.id)).map((s:{id:string;serviceExpiresAt?:string})=>[s.id,s.serviceExpiresAt]);
 });
 await page.evaluate(()=>{
  sessionStorage.removeItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001");
  sessionStorage.removeItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001-expired-fixture-v1");
 });
 await page.reload();
 await expect(colleague).toContainText("已用 5 · 剩余 8");
 const snapshotRestored=await page.evaluate(()=>{
  const stores=JSON.parse(sessionStorage.getItem("shuomi-store-center-demo-ten-v2-SM-ENT-000001")||"[]");
  return stores.filter((s:{id:string})=>/^SIM-C01-0[1-4]$/.test(s.id)).map((s:{id:string;serviceExpiresAt?:string})=>[s.id,s.serviceExpiresAt]);
 });
 expect(snapshotRestored).toEqual(snapshot);
});
