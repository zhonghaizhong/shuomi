import {expect,test} from "@playwright/test";
const routes=["","/running","/pending","/completed","/errors","/scheduled"];
// Seed only the isolated Playwright browser session. Real user data remains empty.
async function seedTaskTestData(page:import("@playwright/test").Page){
 await page.goto("/shuomi/#/workbench/ai/tasks");
 await page.evaluate(()=>{
  const now="演示时间";
  const rows=[
   {id:"e2e-pending",name:"美国站潜力商品分析",description:"等待审核",scope:"美国站",state:"pending",time:now},
   {id:"e2e-running",name:"测试进行中任务",description:"执行中",scope:"演示店铺",state:"running",progress:30,time:now},
   {id:"e2e-completed",name:"测试已完成任务",description:"已完成",scope:"演示店铺",state:"completed",progress:100,time:now},
   {id:"e2e-error",name:"测试异常任务",description:"授权异常",scope:"演示店铺",state:"errors",time:now},
   {id:"e2e-plan",name:"每日店铺经营简报",description:"演示定时计划",scope:"演示店铺",state:"scheduled",frequency:"每天 08:30",time:now}
  ];
  sessionStorage.setItem("shuomi-task-center-demo-v1",JSON.stringify(rows));
 });
 await page.reload();
}
test("task center dual theme surfaces, grid alignment and modal visibility",async({page})=>{
 await seedTaskTestData(page);
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
 await seedTaskTestData(page);
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
 await seedTaskTestData(page);
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

test("task center premium layout keeps overview cards equal and task content within its canvas",async({page})=>{
 test.setTimeout(120000);
 const base="/shuomi/#/workbench/ai/tasks";
 for(const theme of ["dark","light"]){
  for(const [width,height] of [[1366,768],[1440,900],[1536,864],[1920,1080],[2560,1440]]){
   await page.setViewportSize({width,height});
   await page.goto(base);
   const toggle=page.getByRole("button",{name:theme==="light"?"切换浅色主题":"切换深色主题"});
   if(await toggle.isVisible())await toggle.click();
   const root=page.locator("[data-task-center-preview]");
   await expect(root).toBeVisible();
   const cards=root.locator('[class*="taskStats"]>button');
   await expect(cards).toHaveCount(5);
   const sizes=await cards.evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {w:r.width,h:r.height}}));
   expect(Math.max(...sizes.map(x=>x.w))-Math.min(...sizes.map(x=>x.w))).toBeLessThanOrEqual(2);
   expect(Math.max(...sizes.map(x=>x.h))-Math.min(...sizes.map(x=>x.h))).toBeLessThanOrEqual(2);
   const title=root.locator("h1");
   expect(await title.evaluate(el=>getComputedStyle(el).whiteSpace)).toBe("nowrap");
   expect(await root.evaluate(el=>el.scrollWidth-el.clientWidth)).toBeLessThanOrEqual(3);
  }
 }
});
