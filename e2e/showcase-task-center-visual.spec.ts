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
