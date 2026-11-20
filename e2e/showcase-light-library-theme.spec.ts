import {expect,test} from "@playwright/test";

const routes=[
 "/ai/projects/recent",
 "/ai/projects/active",
 "/ai/projects/templates",
 "/ai/projects/archived",
 "/ai/knowledge/official",
 "/ai/knowledge/mine",
 "/agents/skills/official",
 "/agents/skills/mine",
 "/agents/skills/team",
 "/ai/reports/recent",
] as const;
const rgb=(value:string)=>value.match(/\d+(?:\.\d+)?/g)?.slice(0,3).map(Number)??[];
const isLight=(value:string)=>{const [r,g,b]=rgb(value);return [r,g,b].every(x=>Number.isFinite(x)&&x>=225);};
test("light theme uses readable pale surfaces on every library subpage",async({page})=>{
 test.setTimeout(120000);
 await page.setViewportSize({width:1600,height:900});
 await page.goto("/shuomi/#/workbench/ai/projects/recent");
 await page.getByRole("button",{name:"切换浅色主题"}).click();
 for(const route of routes){
   await page.goto("/shuomi/#/workbench"+route);
   const canvas=page.locator('[class*="libraryDetailPreview"]');
   await expect(canvas).toBeVisible();
   const surfaces=canvas.locator('[class*="header"],[class*="table"],[class*="toolbar"],[class*="category"]').filter({visible:true});
   const count=Math.min(await surfaces.count(),5);
   for(let i=0;i<count;i++){
     const bg=await surfaces.nth(i).evaluate(el=>getComputedStyle(el).backgroundColor);
     if(bg!=="rgba(0, 0, 0, 0)")expect(isLight(bg),`${route} surface ${i} must not remain dark: ${bg}`).toBeTruthy();
   }
 }
});
test("recent projects filter/table/buttons stay on the same light theme",async({page})=>{
 await page.goto("/shuomi/#/workbench/ai/projects/recent");
 await page.getByRole("button",{name:"切换浅色主题"}).click();
 const root=page.locator('[class*="libraryDetailPreview"]');
 const surfaces=["header","table","projectTableHead","searchRow","projectRow"];
 for(const name of surfaces){
   const nodes=root.locator(`[class*="${name}"]`);
   if(await nodes.count()){
     const background=await nodes.first().evaluate(el=>getComputedStyle(el).backgroundColor);
     if(background!=="rgba(0, 0, 0, 0)")expect(isLight(background),`${name}: ${background}`).toBeTruthy();
   }
 }
 await expect(root.getByRole("heading",{name:"最近访问"}).first()).toBeVisible();
});
