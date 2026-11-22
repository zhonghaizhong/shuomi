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
 await expect(page).toHaveURL(/chat\/new\?preview=1&projectMode=create/);
 await page.locator("#chat-new-prompt").fill("制定增长目标和阶段安排");
 await page.getByRole("button",{name:"生成项目计划",exact:true}).click();
 const project=page.getByRole("dialog",{name:"确认加入我的项目"});
 await project.getByRole("textbox",{name:"项目名称"}).fill("演示增长项目");
 await project.getByRole("button",{name:"确认并继续"}).click();
 await expect(page.getByText(/已创建本地演示项目：演示增长项目/)).toBeVisible();
 await page.goto(base+"/ai/projects/active");
 const row=page.locator("tr").filter({hasText:"演示增长项目"});
 await expect(row).toBeVisible();
 await row.getByRole("button",{name:"查看详情"}).click();
 const detail=page.getByRole("dialog",{name:"项目详情"});
 await expect(detail.getByText("演示增长项目",{exact:true})).toBeVisible();
 await detail.getByRole("textbox",{name:"成果名称"}).fill("增长计划成果");
 await detail.getByRole("button",{name:"记录成果"}).click();
 await expect(detail.getByText("增长计划成果",{exact:true})).toBeVisible();
 await detail.getByRole("button",{name:"归档项目"}).click();
 await detail.getByRole("button",{name:"确认归档"}).click();
 await expect(row).toHaveCount(0);
 await page.goto(base+"/ai/projects/archived");
 const archived=page.locator("tr").filter({hasText:"演示增长项目"});
 await archived.getByRole("button",{name:"查看详情"}).click();
 await expect(detail.getByText("增长计划成果",{exact:true})).toBeVisible();
 await detail.getByRole("button",{name:"恢复项目"}).click();
 await detail.getByRole("button",{name:"确认恢复"}).click();
 await expect(archived).toHaveCount(0);
 await page.goto(base+"/ai/projects/recent");
 await page.locator("tr").filter({hasText:"演示增长项目"}).getByRole("button",{name:"继续查看"}).click();
 await detail.getByRole("button",{name:"去会话"}).click();
 await expect(page).toHaveURL(/projectMode=reference/);
});

test("uploaded products keep empty state consistent through filtering, reset, and reload",async({page})=>{
 await page.goto(base+"/listing/uploaded");
 const main=page.locator("[data-showcase-uploaded]");
 await expect(main).toBeVisible();
 await expect(main).toContainText("暂无已上传商品记录");
 await expect(main.getByRole("button",{name:"查看商品"})).toHaveCount(0);
 await main.getByRole("combobox",{name:"已发布站点"}).selectOption("美国站");
 await main.getByRole("button",{name:"确认"}).click();
 await expect(main).toContainText("暂无已上传商品记录");
 await expect(main.getByRole("button",{name:"查看商品"})).toHaveCount(0);
 await main.getByRole("button",{name:"重置"}).click();
 await expect(main).toContainText("暂无已上传商品记录");
 await page.reload();
 await expect(main).toContainText("暂无已上传商品记录");
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


test("billing filters remain compact, expand on demand and preserve actions",async({page})=>{
 await page.goto(base+"/plans/orders");
 const filter=page.getByRole("region",{name:"账单筛选"});
 await expect(filter.getByRole("textbox",{name:"搜索账单"})).toBeVisible();
 const toggle=filter.getByRole("button",{name:"筛选条件"});
 await expect(toggle).toHaveAttribute("aria-expanded","false");
 await expect(filter.getByRole("combobox",{name:"全部时间"})).toHaveCount(0);
 await expect(filter.getByRole("combobox",{name:"全部类型"})).toHaveCount(0);
 await expect(filter.getByRole("combobox",{name:"全部状态"})).toHaveCount(0);
 await toggle.click();
 await expect(toggle).toHaveAttribute("aria-expanded","true");
 await filter.getByRole("combobox",{name:"全部类型"}).selectOption({label:"店铺服务"});
 await expect(toggle).toContainText("1");
 await filter.getByRole("button",{name:"确定",exact:true}).click();
 await expect(toggle).toHaveAttribute("aria-expanded","false");
 await expect(filter).toContainText("已筛选 1 项");
 await expect(filter.getByRole("button",{name:"店铺服务 ×"})).toBeVisible();
 await filter.getByRole("button",{name:"重置"}).click();
 await expect(filter).not.toContainText("已筛选 1 项");
 await expect(toggle).toHaveText("筛选条件");
 await expect(filter.getByRole("button",{name:"导出账单"})).toBeVisible();
});
