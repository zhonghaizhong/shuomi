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
   const surfaces=isSkills?canvas.locator(':scope > section[class*="toolbar"], :scope > section[class*="empty"], :scope > aside'):canvas.locator('[class*="header"],[class*="table"],[class*="toolbar"],[class*="category"]');
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


test("actual Figma skills pages retain readable Vuexy light and dark surfaces",async({page})=>{
 for(const category of ["official","mine","team"]){
  await page.goto("/shuomi/#/workbench/agents/skills/"+category);
  const light=page.getByRole("button",{name:"切换浅色主题"});if(await light.isVisible())await light.click();
  const root=page.locator('[data-skill-showcase="true"]');
  const title={official:"官方模板",mine:"我的技能",team:"团队技能"}[category]!;
  await expect(root.getByRole("heading",{name:title,level:1})).toBeVisible();
  const surface=root.locator("[data-skill-management]");
  expect(isLight(await surface.evaluate(el=>getComputedStyle(el).backgroundColor))).toBeTruthy();
  await page.getByRole("button",{name:"切换深色主题"}).click();
  expect(isLight(await surface.evaluate(el=>getComputedStyle(el).backgroundColor))).toBeFalsy();
 }
});
test("linked Figma home, official catalog, enabled skills and closed team",async({page})=>{
 await page.goto("/shuomi/#/workbench/agents/skills");
 const root=page.locator('[data-skill-showcase="true"]');
 await expect(root.getByRole("heading",{name:"让技能成为可重复使用的工作能力"})).toBeVisible();
 await root.getByRole("button",{name:"浏览官方模板"}).click();
 await expect(root.locator("[data-skill-name]")).toHaveCount(6);
 await root.getByRole("button",{name:"图片制作",exact:true}).click();
 await expect(root.locator("[data-skill-name]")).toHaveCount(3);
 await root.getByRole("button",{name:"重置"}).click();
 await root.getByRole("textbox",{name:"技能名称或关键词"}).fill("商品标题整理");
 await root.getByRole("button",{name:"搜索",exact:true}).click();
 await expect(root.locator("[data-skill-name]")).toHaveCount(1);
 const card=root.locator('[data-skill-name="商品标题整理"]');
 await card.getByRole("button",{name:"介绍"}).click();
 await expect(root.getByRole("dialog",{name:"官方技能介绍"})).toBeVisible();
 await root.getByRole("button",{name:"关闭",exact:true}).click();
 await card.getByRole("button",{name:"启用",exact:true}).click();
 await expect(card.getByText("已启用",{exact:true})).toBeVisible();
 await page.goto("/shuomi/#/workbench/agents/skills/mine");
 await expect(root.locator('[data-skill-name="商品标题整理"]')).toBeVisible();
 await root.locator('[data-skill-name="商品标题整理"]').getByRole("button",{name:"去会话引用"}).click();
 await expect(page).toHaveURL(/chat\/new\?preview=1&skillMode=reference/);
 await page.goto("/shuomi/#/workbench/agents/skills/mine");
 await root.locator('[data-skill-name="商品标题整理"]').getByRole("button",{name:"停用"}).click();
 await expect(root.locator('[data-skill-name="商品标题整理"]')).toHaveCount(0);
 await root.getByRole("button",{name:"创建我的技能"}).click();
 await expect(page).toHaveURL(/chat\/new\?preview=1&skillMode=create/);
 await page.goto("/shuomi/#/workbench/agents/skills/team");
 await expect(root.getByRole("heading",{name:"暂未开放"})).toBeVisible();
 await expect(root.getByRole("button",{name:"新建技能"})).toHaveCount(0);
 await expect(root.getByRole("button",{name:"待审批的个人提交"})).toHaveCount(0);
 await root.getByRole("button",{name:"返回技能库"}).click();
 await expect(root.getByRole("heading",{name:"让技能成为可重复使用的工作能力"})).toBeVisible();
});

test("clicking the AI workbench skill menu opens the independent introduction and exposes children",async({page})=>{
 await page.goto("/shuomi/#/workbench/ai");
 const nav=page.getByRole("navigation",{name:"工作台导航"});
 await nav.getByRole("link",{name:"技能库",exact:true}).click();
 await expect(page).toHaveURL(/#\/workbench\/agents\/skills(?:\?.*)?$/);
 const root=page.locator('[data-skill-showcase="true"]');
 await expect(root.getByRole("heading",{name:"让技能成为可重复使用的工作能力"})).toBeVisible();
 await expect(nav.getByRole("link",{name:"官方模板",exact:true})).toBeVisible();
 await expect(nav.getByRole("link",{name:"我的技能",exact:true})).toBeVisible();
 await expect(nav.getByRole("link",{name:"团队技能",exact:true})).toBeVisible();
 await nav.getByRole("link",{name:"官方模板",exact:true}).click();
 await expect(root.getByRole("heading",{name:"官方模板",level:1})).toBeVisible();
 await nav.getByRole("link",{name:"技能库",exact:true}).click();
 await expect(root.getByRole("heading",{name:"让技能成为可重复使用的工作能力"})).toBeVisible();
});

test("skill pages share the approved tools header and readable dual-theme controls",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto("/shuomi/#/workbench/tools");
 const toolHeader=page.locator('main.showcase-content header[class*="hero"]').first();
 await expect(toolHeader).toBeVisible();
 const css=(el:Element)=>{const s=getComputedStyle(el);return {background:s.backgroundColor,border:s.borderTopColor,radius:s.borderRadius,padding:s.paddingLeft,font:s.fontSize}};
 for(const theme of ["dark","light"]){
  await page.goto("/shuomi/#/workbench/tools");
  const toggle=page.getByRole("button",{name:theme==="dark"?"切换深色主题":"切换浅色主题"});if(await toggle.isVisible())await toggle.click();
  const reference=await toolHeader.evaluate(css);
  const refTitle=await toolHeader.getByRole("heading",{level:1}).evaluate(el=>({font:getComputedStyle(el).fontSize,rail:getComputedStyle(el).borderLeftWidth,weight:getComputedStyle(el).fontWeight}));
  for(const suffix of ["","/official","/mine","/team"]){
   await page.goto("/shuomi/#/workbench/agents/skills"+suffix);
   const root=page.locator('[data-skill-showcase="true"]');
   const header=root.locator(":scope > header");
   await expect(header).toBeVisible();
   expect(await header.evaluate(css)).toEqual(reference);
   expect(await header.getByRole("heading",{level:1}).evaluate(el=>({font:getComputedStyle(el).fontSize,rail:getComputedStyle(el).borderLeftWidth,weight:getComputedStyle(el).fontWeight}))).toEqual(refTitle);
   if(suffix==="/official"){
    const card=root.locator("[data-skill-name]").first();
    await expect(card).toBeVisible();
    const cardBg=await card.evaluate(el=>getComputedStyle(el).backgroundColor);
    expect(isLight(cardBg)).toBe(theme==="light");
    await card.getByRole("button",{name:"介绍"}).click();
    const dialog=root.getByRole("dialog",{name:"官方技能介绍"});await expect(dialog).toBeVisible();
    expect(isLight(await dialog.evaluate(el=>getComputedStyle(el).backgroundColor))).toBe(theme==="light");
    await dialog.getByRole("button",{name:"关闭",exact:true}).click();
   }
  }
 }
});
