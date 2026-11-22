import { expect, test } from "@playwright/test";
const root="/shuomi/#/workbench";

test("new goal opens a theme-aware form and creates a local draft",async({page})=>{
  await page.goto(root+"/overview/goals");
  await page.getByRole("button",{name:"新建目标"}).click();
  const dialog=page.getByRole("dialog",{name:"新建目标"});
  await expect(dialog).toBeVisible();
  await dialog.getByRole("textbox",{name:"目标名称"}).fill("演示十一月利润目标");
  await dialog.getByRole("combobox",{name:"适用店铺"}).selectOption("二号店");
  await dialog.getByRole("combobox",{name:"目标周期"}).selectOption("每月");
  await dialog.getByRole("spinbutton",{name:"目标值"}).fill("12000");
  await dialog.getByRole("button",{name:"添加到演示列表"}).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText("演示十一月利润目标", {exact:true})).toBeVisible();
  await expect(page.getByText("未提交正式业务数据")).toBeVisible();
});
test("goal row opens a real detail dialog instead of a fake success toast",async({page})=>{
  await page.goto(root+"/overview/goals");
  await page.getByRole("button",{name:"新建目标"}).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog",{name:"新建目标"})).toHaveCount(0);
  // The store/goal fixture is intentionally empty: create a draft before opening row actions.
  await expect(page.getByRole("button",{name:"操作"})).toHaveCount(0);
  await page.getByRole("button",{name:"新建目标"}).click();
  const create=page.getByRole("dialog",{name:"新建目标"});
  await create.getByRole("textbox",{name:"目标名称"}).fill("月度利润目标");
  await create.getByRole("combobox",{name:"适用店铺"}).selectOption("二号店");
  await create.getByRole("combobox",{name:"目标周期"}).selectOption("每月");
  await create.getByRole("spinbutton",{name:"目标值"}).fill("12000");
  await create.getByRole("button",{name:"添加到演示列表"}).click();
  await expect(page.getByText("月度利润目标",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"操作"}).first().click();
  const dialog=page.getByRole("dialog");
  await expect(dialog).toContainText("月度利润目标");
  await expect(dialog).toContainText("当前状态");
  await expect(page.getByText("已在原型中打开")).toHaveCount(0);
  await dialog.getByRole("button",{name:"返回列表"}).click();
  await expect(dialog).toHaveCount(0);
});
