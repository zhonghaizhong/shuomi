import {expect,test} from "@playwright/test";
const routes=["","/running","/pending","/completed","/errors","/scheduled"];
test("task center dual theme surfaces, grid alignment and modal visibility",async({page})=>{
 test.setTimeout(120000);
 for(const theme of ["dark","light"]){
  for(const route of routes){
   await page.setViewportSize({width:1920,height:1080});
   await page.goto("/shuomi/#/workbench/ai/tasks"+route);
   const toggle=page.getByRole("button",{name:theme==="light"?"切换浅色主题":"切换深色主题"});
   if(await toggle.isVisible())await toggle.click();
   const root=page.locator("[data-task-center-preview]");
   await expect(root).toBeVisible();
   const header=root.locator('[class*="taskColumns"]').first(), row=root.locator('[class*="taskRow"]').first();
   await expect(header).toBeVisible();await expect(row).toBeVisible();
   const layout=await header.evaluate(el=>getComputedStyle(el).gridTemplateColumns);
   expect(await row.evaluate(el=>getComputedStyle(el).gridTemplateColumns)).toBe(layout);
   for(const cell of [header,row,root.locator('[class*="taskSearch"]').first()]){
    const bg=await cell.evaluate(el=>getComputedStyle(el).backgroundColor);
    const rgb=bg.match(/\d+/g)?.slice(0,3).map(Number)??[];
    expect(rgb.length).toBe(3);
    if(theme==="light")expect(Math.min(...rgb),route+" "+bg).toBeGreaterThan(220);
    else expect(Math.max(...rgb),route+" "+bg).toBeLessThan(130);
   }
   const controls=root.locator('form[class*="taskSearch"] input,form[class*="taskSearch"] select,form[class*="taskSearch"] button');
   const heights=await controls.evaluateAll(nodes=>nodes.map(n=>Math.round(n.getBoundingClientRect().height)));
   expect(Math.max(...heights)-Math.min(...heights)).toBeLessThanOrEqual(1);
   await row.getByRole("button").first().click();
   const modal=page.getByRole("dialog");await expect(modal).toBeVisible();
   const uncovered=await modal.evaluate(el=>{const r=el.getBoundingClientRect();const top=document.elementFromPoint(r.x+r.width/2,r.y+20);return !!top&&el.contains(top)});
   expect(uncovered).toBeTruthy();
   const bg=await modal.evaluate(el=>getComputedStyle(el).backgroundColor);
   const rgb=bg.match(/\d+/g)?.slice(0,3).map(Number)??[];
   if(theme==="light")expect(Math.min(...rgb)).toBeGreaterThan(220);else expect(Math.max(...rgb)).toBeLessThan(130);
   await page.keyboard.press("Escape");await expect(modal).toHaveCount(0);
  }
 }
});

test("task lifecycle preserves review conversation, handles retry and retains completed result",async({page})=>{
 const base="/shuomi/#/workbench/ai/tasks";
 await page.goto(base+"/pending");
 await page.getByRole("button",{name:"去确认",exact:true}).first().click();
 let dialog=page.getByRole("dialog");
 await dialog.getByRole("textbox",{name:"处理说明"}).fill("演示：先核对商品筛选规则");
 await dialog.getByRole("button",{name:"发送消息",exact:true}).click();
 await dialog.getByRole("button",{name:"关闭弹窗"}).click();
 await page.getByRole("button",{name:"去确认",exact:true}).first().click();
 await expect(page.getByRole("log").getByText("演示：先核对商品筛选规则",{exact:true})).toBeVisible();
 await dialog.getByRole("button",{name:"确认并继续执行",exact:true}).click();
 await page.goto(base+"/running");
 const task=page.locator('[class*="taskRow"]').filter({hasText:"美国站潜力商品分析"});
 await expect(task).toBeVisible();
 await task.getByRole("button").first().click();
 await dialog.getByRole("button",{name:"模拟执行异常",exact:true}).click();
 await page.goto(base+"/errors");
 const failed=page.locator('[class*="taskRow"]').filter({hasText:"美国站潜力商品分析"});
 await failed.getByRole("button").first().click();
 const retry=dialog.getByRole("button",{name:"确认并申请重试",exact:true});
 await expect(retry).toBeDisabled();
 await dialog.getByRole("textbox",{name:"处理说明"}).fill("演示：核对阻塞解除");
 await dialog.getByRole("button",{name:"发送消息",exact:true}).click();
 await dialog.getByRole("checkbox",{name:"已核对阻塞解除（演示）"}).check();
 await retry.click();
 await page.goto(base+"/running");
 await task.getByRole("button").first().click();
 await dialog.getByRole("button",{name:"模拟执行完成",exact:true}).click();
 await page.goto(base+"/completed");
 await task.getByRole("button").first().click();
 await expect(dialog.getByText("执行结果",{exact:true})).toBeVisible();
 await expect(dialog.getByText("处理记录",{exact:true})).toBeVisible();
});
test("schedule creates a separate execution record and exposes it in plan history",async({page})=>{
 const base="/shuomi/#/workbench/ai/tasks";
 await page.goto(base+"/scheduled");
 const plan=page.locator('[class*="taskRow"]').filter({hasText:"每日店铺经营简报"});
 await plan.getByRole("button",{name:"详情",exact:true}).click();
 const dialog=page.getByRole("dialog");
 await dialog.getByRole("button",{name:"发起一次演示执行",exact:true}).click();
 await expect(plan).toBeVisible();
 await page.goto(base+"/running");
 const run=page.locator('[class*="taskRow"]').filter({hasText:"每日店铺经营简报 · 本次执行"});
 await expect(run).toBeVisible();
 await run.getByRole("button").first().click();
 await dialog.getByRole("button",{name:"模拟执行完成",exact:true}).click();
 await page.goto(base+"/scheduled");
 await plan.getByRole("button",{name:"详情",exact:true}).click();
 await dialog.getByRole("button",{name:/每日店铺经营简报 · 本次执行 · 已完成/}).click();
 await expect(dialog.getByText("执行结果",{exact:true})).toBeVisible();
});
