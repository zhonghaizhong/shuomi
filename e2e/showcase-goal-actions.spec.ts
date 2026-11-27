import {expect,test} from "@playwright/test";
const root="/shuomi/#/workbench";
async function pickStores(page:import("@playwright/test").Page,names:string[]){
 const create=page.getByRole("dialog",{name:"新建目标"});
 await create.getByRole("button",{name:"选择适用店铺"}).click();
 const picker=page.getByRole("dialog",{name:"选择目标店铺"});
 await expect(picker).toBeVisible();
 for(const name of names){
  await picker.getByRole("textbox",{name:"搜索目标店铺"}).fill(name);
  await picker.getByRole("checkbox",{name:new RegExp(name)}).check();
 }
 await picker.getByRole("button",{name:/确定（/}).click();
}
test("orders goal supports selected bound stores, weekly period, and local draft",async({page})=>{
 await page.goto(root+"/overview/goals");
 await page.getByRole("button",{name:"新建目标"}).click();
 const dialog=page.getByRole("dialog",{name:"新建目标"});
 await expect(dialog).toBeVisible();
 await dialog.getByRole("textbox",{name:"目标名称"}).fill("演示每周订单目标");
 await expect(dialog.getByRole("combobox",{name:"目标指标"}).locator("option")).toHaveText(["订单量","销售额"]);
 await expect(dialog.getByRole("combobox",{name:"目标周期"}).locator("option")).toHaveText(["按周","按月"]);
 await pickStores(page,["管理员演示店铺01","管理员演示店铺02"]);
 await dialog.getByRole("combobox",{name:"目标周期"}).selectOption("每周");
 await dialog.getByRole("spinbutton",{name:"目标值"}).fill("120");
 await dialog.getByRole("button",{name:"添加到演示列表"}).click();
 await expect(dialog).toHaveCount(0);
 await expect(page.getByText("演示每周订单目标",{exact:true})).toBeVisible();
 await expect(page.getByText("未提交正式业务数据")).toBeVisible();
 await page.reload();
 await expect(page.getByText("演示每周订单目标",{exact:true})).toBeVisible();
});
test("sales goals separate different site currencies without automatic conversion",async({page})=>{
 await page.goto(root+"/overview/goals");
 await page.getByRole("button",{name:"新建目标"}).click();
 const dialog=page.getByRole("dialog",{name:"新建目标"});
 await dialog.getByRole("textbox",{name:"目标名称"}).fill("跨站点销售额目标");
 await dialog.getByRole("combobox",{name:"目标指标"}).selectOption("销售额");
 await pickStores(page,["管理员演示店铺01","管理员演示店铺02"]);
 await dialog.getByRole("spinbutton",{name:"目标值 USD"}).fill("2000");
 await dialog.getByRole("spinbutton",{name:"目标值 CAD"}).fill("3000");
 await expect(dialog).toContainText("不同币种不直接相加");
 await dialog.getByRole("button",{name:"添加到演示列表"}).click();
 await expect(dialog).toHaveCount(0);
 await expect(page.getByText("跨站点销售额目标",{exact:true})).toBeVisible();
 await expect(page.getByText("USD 2000 / CAD 3000",{exact:true})).toBeVisible();
});
test("goal actions open a detail dialog after creating a store-scoped draft",async({page})=>{
 await page.goto(root+"/overview/goals");
 await page.getByRole("button",{name:"新建目标"}).click();
 await page.keyboard.press("Escape");
 await expect(page.getByRole("dialog",{name:"新建目标"})).toHaveCount(0);
 await expect(page.getByRole("button",{name:"操作"})).toHaveCount(0);
 await page.getByRole("button",{name:"新建目标"}).click();
 const create=page.getByRole("dialog",{name:"新建目标"});
 await create.getByRole("textbox",{name:"目标名称"}).fill("月度订单目标");
 await pickStores(page,["管理员演示店铺01"]);
 await create.getByRole("spinbutton",{name:"目标值"}).fill("300");
 await create.getByRole("button",{name:"添加到演示列表"}).click();
 await expect(page.getByText("月度订单目标",{exact:true})).toBeVisible();
 await page.getByRole("button",{name:"操作"}).first().click();
 const detail=page.getByRole("dialog");
 await expect(detail).toContainText("月度订单目标");
 await expect(detail).toContainText("当前状态");
 await detail.getByRole("button",{name:"返回列表"}).click();
 await expect(detail).toHaveCount(0);
});
