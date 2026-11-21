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
const rgb=(value:string)=>{const values=value.match(/-?\d+(?:\.\d+)?/g)?.slice(0,3).map(Number)??[];return value.startsWith("color(srgb ") ? values.map(x=>x*255) : values;};
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
   const surfaces=isSkills?canvas.locator(':scope > header, :scope > nav, :scope > section[class*="toolbar"], :scope > section[class*="empty"], :scope > aside'):canvas.locator('[class*="header"],[class*="table"],[class*="toolbar"],[class*="category"]');
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
  const surfaces=root.locator(':scope > header, :scope > section[class*="toolbar"], :scope > section[class*="empty"]');
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

test("Figma skills hierarchy, actions, and permission variants match the showcase",async({page})=>{
 await page.goto("/shuomi/#/workbench/agents/skills/official");
 const root=page.locator('[data-skill-showcase="true"]');
 await expect(root.getByRole("heading",{name:"技能库",level:1})).toBeVisible();
 await expect(root.getByText("AI工作台 / 技能库 / 官方模板")).toBeVisible();
 await expect(root.getByRole("navigation",{name:"技能库分类"}).getByRole("button")).toHaveCount(3);
 await expect(root.getByRole("button",{name:"刷新列表"})).toBeVisible();
 await expect(root.getByText("当前范围没有可读取的技能。官方模板由获授权维护者导入、发布并启用后提供。")).toBeVisible();
 await root.getByRole("button",{name:"我的技能"}).click();
 await expect(root.getByRole("button",{name:"新建技能"})).toBeVisible();
 await expect(root.getByRole("button",{name:"我的共享申请"})).toBeVisible();
 await expect(root.getByText("local-trial-title-normalization-20261015")).toBeVisible();
 await expect(root.getByText("v1 · 已启用 · 私有")).toBeVisible();
 await root.getByRole("button",{name:"团队技能"}).click();
 await expect(root.getByRole("button",{name:"待审批的个人提交"})).toBeEnabled();
 await expect(root.getByRole("button",{name:"关闭个人技能准入"})).toBeVisible();
 await page.goto("/shuomi/#/workbench/agents/skills/team?permission=readonly");
 const readonlyRoot=page.locator('[data-skill-showcase="true"]');
 await expect(readonlyRoot.getByRole("button",{name:"待审批的个人提交"})).toBeDisabled();
 await expect(readonlyRoot.getByText("个人技能准入：未准入 · 策略版本 0")).toBeVisible();
 await expect(readonlyRoot.getByRole("button",{name:/个人技能准入/})).toHaveCount(0);
});


test("skill showcase creates a local draft, verifies a version, and gates sharing on consent",async({page})=>{
 await page.goto("/shuomi/#/workbench/agents/skills/mine");
 const root=page.locator('[data-skill-showcase="true"]');
 await root.getByRole("button",{name:"新建技能"}).click();
 const form=root.getByRole("form",{name:"新建技能"});
 await expect(form).toBeVisible();
 await form.getByRole("textbox",{name:"技能名称"}).fill("demo-catalog-audit");
 await form.getByRole("textbox",{name:"技能简介"}).fill("用于整理商品资料的本地演示技能");
 await form.getByRole("textbox",{name:"方法内容"}).fill("先核对输入字段，再整理商品资料；不要补造数据。");
 await form.getByRole("button",{name:"检查格式"}).click();
 await expect(form.getByText(/格式预检查通过/)).toBeVisible();
 await form.getByRole("button",{name:"保存演示草稿"}).click();
 await expect(root.getByText("demo-catalog-audit")).toBeVisible();
 await expect(root.getByText("v1 · 演示草稿 · 私有")).toBeVisible();
 await root.getByRole("button",{name:/demo-catalog-audit/}).click();
 await expect(root.getByRole("region",{name:"技能详情"})).toBeVisible();
 await root.getByRole("button",{name:"保存为新版本"}).click();
 const versionForm=root.getByRole("form",{name:"保存为新版本"});
 await versionForm.getByRole("textbox",{name:"方法内容"}).fill("核对商品标题、图片和数据，再保存本地版本。");
 await versionForm.getByRole("button",{name:"保存演示草稿"}).click();
 await expect(root.getByText("v2 · 演示草稿 · 私有")).toBeVisible();
 await root.getByRole("button",{name:"我的共享申请"}).click();
 const sharing=root.getByRole("region",{name:"我的共享申请"});
 const submit=sharing.getByRole("button",{name:"提交演示共享申请"});
 await expect(submit).toBeDisabled();
 await sharing.getByRole("checkbox").check();
 await expect(submit).toBeEnabled();
 await submit.click();
 await expect(sharing.getByText("状态：演示申请已提交")).toBeVisible();
 await sharing.getByRole("button",{name:"撤回演示申请"}).click();
 await expect(sharing.getByText("状态：演示申请已撤回")).toBeVisible();
});
