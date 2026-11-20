import {expect,test} from "@playwright/test";
const base="/shuomi/#/workbench";

test("task and project creation produce visible local drafts",async({page})=>{
 await page.goto(base+"/ai/tasks");
 await page.getByRole("button",{name:/新建任务/}).click();
 const task=page.getByRole("dialog",{name:"新建任务"});
 await expect(task).toBeVisible();
 await task.getByRole("textbox",{name:"任务名称"}).fill("演示自定义任务");
 await task.getByRole("button",{name:"创建演示草稿"}).click();
 await expect(page.getByText("演示自定义任务", {exact:true})).toBeVisible();
 await page.goto(base+"/ai/projects");
 await page.getByRole("button",{name:/新建项目/}).click();
 const project=page.getByRole("dialog",{name:"新建项目"});
 await project.getByRole("textbox",{name:"项目名称"}).fill("演示增长项目");
 await project.getByRole("button",{name:"创建演示草稿"}).click();
 await expect(page.getByText("演示增长项目", {exact:true})).toBeVisible();
});

test("uploaded products support filter, pagination, detail and reset",async({page})=>{
 await page.goto(base+"/listing/uploaded");
 const main=page.locator("[data-showcase-uploaded]");
 await expect(main).toBeVisible();
 await main.getByRole("combobox",{name:"已发布站点"}).selectOption("美国站");
 await main.getByRole("button",{name:"确认"}).click();
 await expect(main.getByText("共 3 条演示记录")).toBeVisible();
 await main.getByRole("button",{name:"查看商品"}).first().click();
 await expect(page.getByRole("dialog",{name:"查看商品详情"})).toContainText("SKU");
 await page.keyboard.press("Escape");
 await expect(page.getByRole("dialog",{name:"查看商品详情"})).toHaveCount(0);
 await main.getByRole("button",{name:"重置"}).click();
 await expect(main.getByText("共 6 条演示记录")).toBeVisible();
 await main.getByRole("button",{name:"下一页"}).click();
 await expect(main.getByText("第 2 / 2 页")).toBeVisible();
});

test("agent activation status is shared with my agents",async({page})=>{
 await page.goto(base+"/agents/market");
 const card=page.locator('[class*="agentCards"] article').filter({hasText:"商品优化智能体"});
 await expect(card.getByRole("button",{name:"停用"})).toBeVisible();
 await card.getByRole("button",{name:"停用"}).click();
 await expect(card.getByRole("button",{name:"启用"})).toBeVisible();
 await page.getByRole("button",{name:"我的智能体"}).click();
 await expect(page.getByText("已启用智能体 1")).toBeVisible();
});
