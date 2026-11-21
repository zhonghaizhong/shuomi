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
 for(const route of routes){
   await page.goto("/shuomi/#/workbench"+route);
   const enableLight=page.getByRole("button",{name:"切换浅色主题"});
   if(await enableLight.isVisible())await enableLight.click();
   const isSkills=route.startsWith("/agents/skills/");
   const canvas=isSkills?page.locator('[data-skill-showcase="true"]'):page.locator('[class*="libraryDetailPreview"]');
   await expect(canvas).toBeVisible();
   const surfaces=isSkills?canvas.locator('[class*="hero"],[class*="tabs"],[class*="toolbar"],[class*="empty"],[class*="note"]'):canvas.locator('[class*="header"],[class*="table"],[class*="toolbar"],[class*="category"]');
   const count=Math.min(await surfaces.count(),5);
   for(let i=0;i<count;i++){
     if(!(await surfaces.nth(i).isVisible()))continue;
     const bg=await surfaces.nth(i).evaluate(el=>getComputedStyle(el).backgroundColor);
     if(bg!=="rgba(0, 0, 0, 0)")expect(isLight(bg),`${route} surface ${i} must not remain dark: ${bg}`).toBeTruthy();
   }
 }
});
test("recent projects filter/table/buttons stay on the same light theme",async({page})=>{
 await page.goto("/shuomi/#/workbench/ai/projects/recent");
 const enableLight=page.getByRole("button",{name:"切换浅色主题"});
   if(await enableLight.isVisible())await enableLight.click();
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

test("redesigned skills categories stay readable in light and dark themes",async({page})=>{
 for(const category of ["official","mine","team"]){
  await page.goto("/shuomi/#/workbench/agents/skills/"+category);
  const lightToggle=page.getByRole("button",{name:"切换浅色主题"});
  if(await lightToggle.isVisible())await lightToggle.click();
  const root=page.locator('[data-skill-showcase="true"]');
  await expect(root).toBeVisible();
  const title={official:"官方模板",mine:"我的技能",team:"团队技能"}[category]!;
  await expect(root.getByRole("heading",{name:title,exact:true})).toBeVisible();
  await expect(root.getByRole("navigation",{name:"技能库分类"})).toBeVisible();
  const surfaces=root.locator('[class*="hero"],[class*="toolbar"],[class*="empty"]');
  for(let i=0;i<await surfaces.count();i++){
   const element=surfaces.nth(i);
   const bg=await element.evaluate(el=>getComputedStyle(el).backgroundColor);
   expect(isLight(bg),category+" light surface "+i+" should be pale, got "+bg).toBeTruthy();
  }
  const heading=root.getByRole("heading",{name:title,exact:true});
  const headingColor=await heading.evaluate(el=>getComputedStyle(el).color);
  expect(rgb(headingColor).every(x=>x<170),category+" title must be readable in light theme").toBeTruthy();
  const darkToggle=page.getByRole("button",{name:"切换深色主题"});
  await darkToggle.click();
  const dark=await surfaces.first().evaluate(el=>getComputedStyle(el).backgroundColor);
  expect(isLight(dark),category+" dark surface must not stay pale").toBeFalsy();
 }
});
