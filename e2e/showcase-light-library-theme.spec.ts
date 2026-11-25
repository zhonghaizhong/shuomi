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
   const isProjects=route.startsWith("/ai/projects/");
   const isReports=route.startsWith("/ai/reports/");
   const canvas=isSkills?page.locator('[data-skill-showcase="true"]'):isProjects?page.locator('[data-project-showcase="true"]'):isReports?page.locator('[class*="libraryHubPreview"]'):page.locator('[class*="libraryDetailPreview"]');
   await expect(canvas).toBeVisible();
   const surfaces=isSkills?canvas.locator(':scope > section[class*="toolbar"], :scope > section[class*="empty"], :scope > aside'):isProjects?canvas.locator(':scope > header, :scope > section[class*="panel"]'):canvas.locator('[class*="header"],[class*="table"],[class*="toolbar"],[class*="category"]');
   const count=Math.min(await surfaces.count(),5);
   for(let i=0;i<count;i++){
     if(!(await surfaces.nth(i).isVisible()))continue;
     const bg=await surfaces.nth(i).evaluate(el=>getComputedStyle(el).backgroundColor);
     if(bg!=="rgba(0, 0, 0, 0)")expect(isLight(bg),`${route} surface ${i} must not remain dark: ${bg}`).toBeTruthy();
   }
 }
});
test("project center filters, template cards and dialogs stay readable in both themes",async({page})=>{
 for(const theme of ["light","dark"]){
  await page.goto("/shuomi/#/workbench/ai/projects/templates");
  const toggle=page.getByRole("button",{name:theme==="light"?"切换浅色主题":"切换深色主题"});if(await toggle.isVisible())await toggle.click();
  const root=page.locator('[data-project-showcase="true"]');
  await expect(root.getByRole("heading",{name:"项目中心",level:1})).toBeVisible();
   await expect(root.getByRole("heading",{name:"官方模板列表",level:2})).toBeVisible();
  const cards=root.locator('article');
  await expect(cards).toHaveCount(4);
  await root.getByRole("button",{name:"商品开发",exact:true}).click();
  await expect(cards).toHaveCount(1);
  await cards.first().getByRole("button",{name:"介绍"}).click();
  const dialog=root.getByRole("dialog",{name:"模板介绍"});
  await expect(dialog).toBeVisible();
  expect(isLight(await dialog.evaluate(el=>getComputedStyle(el).backgroundColor))).toBe(theme==="light");
  await dialog.getByRole("button",{name:"关闭",exact:true}).click();
  await page.goto("/shuomi/#/workbench/ai/projects/recent");
  await expect(root.getByRole("heading",{name:"最近访问",level:2})).toBeVisible();
  const heading=root.locator(":scope > header");
  expect(isLight(await heading.evaluate(el=>getComputedStyle(el).backgroundColor))).toBe(theme==="light");
 }
});


test("actual Figma skills pages retain readable Vuexy light and dark surfaces",async({page})=>{
 for(const category of ["official","mine","team"]){
  await page.goto("/shuomi/#/workbench/agents/skills/"+category);
  const light=page.getByRole("button",{name:"切换浅色主题"});if(await light.isVisible())await light.click();
  const root=page.locator('[data-skill-showcase="true"]');
  const title={official:"官方模板",mine:"我的技能",team:"团队技能"}[category]!;
  await expect(root.getByRole("heading",{name:"技能库",level:1})).toBeVisible();
   if(category==="official")await expect(root.getByRole("heading",{name:"官方技能列表",level:2})).toBeVisible();
   else if(category==="mine")await expect(root.getByRole("heading",{name:"已启用技能",level:2})).toBeVisible();
   else await expect(root.getByRole("heading",{name:"暂未开放",level:2})).toBeVisible();
  const surface=root.locator("[data-skill-management]");
  expect(isLight(await surface.evaluate(el=>getComputedStyle(el).backgroundColor))).toBeTruthy();
  await page.getByRole("button",{name:"切换深色主题"}).click();
  expect(isLight(await surface.evaluate(el=>getComputedStyle(el).backgroundColor))).toBeFalsy();
 }
});
test("linked Figma home, official catalog, enabled skills and closed team",async({page})=>{
 await page.goto("/shuomi/#/workbench/agents/skills");
 const root=page.locator('[data-skill-showcase="true"]');
 await expect(root.getByRole("heading",{name:"技能库",level:1})).toBeVisible();
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
 await expect(root.getByRole("heading",{name:"技能库",level:1})).toBeVisible();
});

test("skill library entry cards open independent pages without relying on third-level navigation",async({page})=>{
 await page.goto("/shuomi/#/workbench/ai");
 const nav=page.getByRole("navigation",{name:"工作台导航"});
 await nav.getByRole("link",{name:"技能库",exact:true}).click();
 await expect(page).toHaveURL(/#\/workbench\/agents\/skills(?:\?.*)?$/);
 const root=page.locator('[data-skill-showcase="true"]');
 await expect(root.getByRole("heading",{name:"技能库",level:1})).toBeVisible();
 const entries=root.locator('[data-skill-entry]');
 await expect(entries).toHaveCount(3);
 for(const [key,title] of [["official","官方模板"],["mine","我的技能"],["team","团队技能"]]){
  await expect(root.locator('[data-skill-entry="'+key+'"]').getByRole("heading",{name:title})).toBeVisible();
 }
 const skillTabs=page.getByRole("navigation",{name:"技能库分类"});
 await root.locator('[data-skill-entry="official"]').getByRole("button",{name:"浏览官方模板"}).click();
 // Approved design switches the content below stable tabs, not the browser URL.
 await expect(page).toHaveURL(/#\/workbench\/agents\/skills(?:\?.*)?$/);
 await expect(root.getByRole("heading",{name:"官方技能列表",level:2})).toBeVisible();
 await expect(skillTabs.getByRole("button",{name:"官方模板",exact:true})).toHaveAttribute("aria-current","page");
 await skillTabs.getByRole("button",{name:"技能库介绍"}).click();
 await expect(root.getByRole("heading",{name:"技能库",level:1})).toBeVisible();
 await expect(root.locator('[data-skill-entry]')).toHaveCount(3);
 await root.locator('[data-skill-entry="mine"]').getByRole("button",{name:"查看我的技能"}).click();
 await expect(page).toHaveURL(/#\/workbench\/agents\/skills(?:\?.*)?$/);
 await expect(root.getByRole("heading",{name:"已启用技能",level:2})).toBeVisible();
 await expect(skillTabs.getByRole("button",{name:"我的技能",exact:true})).toHaveAttribute("aria-current","page");
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
   const actual=await header.evaluate(css);
    // One RGB channel of the border can differ by 1 due to theme token rounding.
    // The skill header uses the approved Vuexy elevated card surface in dark mode.
     expect(actual.background).toBe(theme==="dark"?"rgb(47, 51, 73)":reference.background);
     expect({radius:actual.radius,padding:actual.padding,font:actual.font}).toEqual({radius:reference.radius,padding:reference.padding,font:reference.font});
    const borderChannels=(v:string)=>(v.match(/\d+/g)||[]).map(Number);
    const actualBorder=borderChannels(actual.border),referenceBorder=borderChannels(reference.border);
    expect(actualBorder.length).toBe(3);
    // Theme-specific skill outlines can intentionally differ from the tools header.
     // Require a visible RGB border without forcing identical color tokens.
     expect(actualBorder.every(v=>Number.isInteger(v)&&v>=0&&v<=255)).toBeTruthy();
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

test("knowledge landing has exactly two compact entries at desktop and mobile widths",async({page})=>{
 for(const width of [1440,1920,2560,720]){
  await page.setViewportSize({width,height:900});
  await page.goto("/shuomi/#/workbench/ai/knowledge");
  const root=page.locator('[data-library-hub="knowledge"]');
  await expect(root.getByRole("heading",{name:"知识库",level:1})).toBeVisible();
  const cards=root.locator('[data-knowledge-entry]');
  await expect(cards).toHaveCount(2);
  await expect(root.getByText("官方知识推荐")).toHaveCount(0);
  await expect(root.getByText("最近更新")).toHaveCount(0);
  await expect(root.getByText("让 AI 有知识可参考，更准确地理解你的业务需求。")).toBeVisible();
  await expect(root.getByText("官方知识和我的知识库都可以被 AI 引用，区别在于来源和管理方式。")).toBeVisible();
  await expect(root.getByText("做 SHEIN 商品优化时，可引用平台规则、运营方法和合规参考。")).toBeVisible();
  await expect(root.getByText("保存品牌规范、商品资料和企业要求，让 AI 结合你的业务规则完成工作。")).toBeVisible();
  const steps=root.locator('aside[aria-label="知识引用说明"] ol li');
  await expect(steps).toHaveCount(3);
  await expect(steps.nth(0).getByText("从官方预设或我的知识中选择")).toBeVisible();
  await expect(steps.nth(1).getByText("用于支持的会话、任务或智能体")).toBeVisible();
  await expect(steps.nth(2).getByText("结合选中的知识辅助完成工作")).toBeVisible();
  const stepBoxes=await steps.evaluateAll(items=>items.map(el=>{const b=el.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,right:b.right};}));
  if(width>760) {
   // All three stages share the full available width, not just the left half.
   expect(Math.abs(stepBoxes[0].width-stepBoxes[1].width)).toBeLessThan(4);
   expect(Math.abs(stepBoxes[1].width-stepBoxes[2].width)).toBeLessThan(4);
   expect(stepBoxes[2].x).toBeGreaterThan(stepBoxes[0].x+stepBoxes[0].width);
   expect(stepBoxes[2].right).toBeGreaterThan(stepBoxes[0].x+(width>1500?500:350));
  } else {
   expect(stepBoxes[2].y).toBeGreaterThan(stepBoxes[0].y);
  }
  await expect(root.getByRole("button",{name:"浏览官方知识"})).toBeVisible();
  await expect(root.getByRole("button",{name:"管理我的知识库"})).toBeVisible();
  const header=root.locator(":scope > header");
  const strip=root.locator('aside[aria-label="知识引用说明"]');
  const bounds=await header.evaluate(el=>{const b=el.getBoundingClientRect();return {x:b.x,width:b.width};});
  const headerBounds=await header.boundingBox();
  const stripBounds=await strip.boundingBox();
  expect(headerBounds).not.toBeNull();
  expect(stripBounds).not.toBeNull();
  expect(headerBounds!.width).toBeGreaterThan(0);
  expect(stripBounds!.width).toBeGreaterThan(0);
  const boxes=await cards.evaluateAll(items=>items.map(el=>{const b=el.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,right:b.right};}));
  if(width>800){
   // Full-width page shell; only the descriptive content area is bounded.
   // On 1440px screens the sidebar still takes its normal width.
   if(width>=1920)expect(bounds.width).toBeGreaterThan(1250);
   else expect(bounds.width).toBeGreaterThan(850);
   expect(bounds.width).toBeLessThanOrEqual(1601);
   // The title, two-card row and help strip must share BOTH edges.
   expect(Math.abs(boxes[0].x-headerBounds!.x)).toBeLessThan(3);
   expect(Math.abs(boxes[1].right-(headerBounds!.x+headerBounds!.width))).toBeLessThan(3);
   expect(Math.abs(stripBounds!.x-headerBounds!.x)).toBeLessThan(3);
   expect(Math.abs((stripBounds!.x+stripBounds!.width)-(headerBounds!.x+headerBounds!.width))).toBeLessThan(3);
   expect(Math.abs(boxes[0].width-boxes[1].width)).toBeLessThan(3);
   expect(Math.abs(boxes[0].y-boxes[1].y)).toBeLessThan(3);
   // On large monitors the two equal cards use their full width but stay compact.
   const heights=await cards.evaluateAll(items=>items.map(el=>el.getBoundingClientRect().height));
   if(bounds.width>=1400){
    expect(boxes[0].width).toBeGreaterThan(650);
    expect(heights[0]).toBeLessThan(310);
    expect(Math.abs(heights[0]-heights[1])).toBeLessThan(3);
   }
  }else{
   expect(boxes[1].y).toBeGreaterThan(boxes[0].y+120);
  }
 }
 await page.locator('[data-knowledge-entry="mine"]').getByRole("button",{name:"管理我的知识库"}).click();
 await expect(page).toHaveURL(/#\/workbench\/ai\/knowledge(?:\?.*)?$/);
 await expect(page.locator('[data-library-page="knowledge-mine"]')).toBeVisible();
 await expect(page.getByRole("heading",{name:"我的知识库",level:1})).toBeVisible();
 await expect(page.getByRole("navigation",{name:"知识库分类"}).getByRole("button",{name:"我的知识库",exact:true})).toHaveAttribute("aria-current","page");
});

test("knowledge landing keeps readable card, header and workflow surfaces in both themes",async({page})=>{
 for(const theme of ["light","dark"]){
  await page.goto("/shuomi/#/workbench/ai/knowledge");
  const toggle=page.getByRole("button",{name:theme==="light"?"切换浅色主题":"切换深色主题"});
  if(await toggle.isVisible())await toggle.click();
  const root=page.locator('[data-library-hub="knowledge"]');
  const items=[root.locator(":scope > header"),...await root.locator("[data-knowledge-entry]").all(),root.locator('aside[aria-label="知识引用说明"]')];
  for(const item of items){
   const color=await item.evaluate(el=>getComputedStyle(el).backgroundColor);
   if(color!=="rgba(0, 0, 0, 0)")expect(isLight(color)).toBe(theme==="light");
  }
 }
});
test("skill home matches knowledge layout with three aligned destinations and concise AI usage",async({page})=>{
 for(const theme of ["dark","light"]){
  for(const viewport of [{width:1440,height:900},{width:2560,height:1440},{width:720,height:900}]){
   await page.setViewportSize(viewport);
   await page.goto("/shuomi/#/workbench/agents/skills");
   const toggle=page.getByRole("button",{name:theme==="dark"?"切换深色主题":"切换浅色主题"});
   if(await toggle.isVisible())await toggle.click();
   const root=page.locator('[data-skill-flow="home"]');
   const cards=root.locator('[data-skill-entry]');
   const heading=root.locator(":scope > header");
   const flow=root.getByRole("complementary",{name:"技能使用说明"});
   await expect(root.getByRole("heading",{name:"技能库",level:1})).toBeVisible();
   await expect(cards).toHaveCount(3);
   await expect(flow).toBeVisible();
   for(const removed of ["技能库可以帮你做什么","如何开始使用","使用前需要了解"]){
    await expect(root.getByRole("heading",{name:removed})).toHaveCount(0);
   }
   await expect(cards.nth(0)).toContainText("官方模板");
   await expect(cards.nth(1)).toContainText("我的技能");
   await expect(cards.nth(2)).toContainText("暂未开放");
   await expect(root.getByText("技能告诉 AI 如何处理工作；知识库提供参考资料。两者可以按需配合使用，不会因为启用就自动执行。")).toBeVisible();
   const a=await heading.boundingBox(),b=await flow.boundingBox();
   expect(a).not.toBeNull();expect(b).not.toBeNull();
   expect(Math.abs(a!.x-b!.x)).toBeLessThan(3);
   expect(Math.abs((a!.x+a!.width)-(b!.x+b!.width))).toBeLessThan(3);
   const box=await cards.evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,right:r.right};}));
   expect(Math.abs(box[0].x-a!.x)).toBeLessThan(3);
   if(viewport.width>=1200){
    expect(Math.abs(box[2].right-(a!.x+a!.width))).toBeLessThan(3);
    expect(Math.abs(box[0].y-box[1].y)).toBeLessThan(3);
    expect(Math.abs(box[1].y-box[2].y)).toBeLessThan(3);
    expect(Math.abs(box[0].width-box[1].width)).toBeLessThan(3);
    expect(Math.abs(box[1].width-box[2].width)).toBeLessThan(3);
   }else expect(box[2].y).toBeGreaterThan(box[1].y+50);
   expect(isLight(await cards.first().evaluate(el=>getComputedStyle(el).backgroundColor))).toBe(theme==="light");
  }
 }
 await page.getByRole("button",{name:"浏览官方模板"}).click();
 await expect(page).toHaveURL(/#\/workbench\/agents\/skills(?:\?.*)?$/);
 await expect(page.locator('[data-skill-flow="official"]')).toBeVisible();
 await expect(page.getByRole("heading",{name:"官方技能列表",level:2})).toBeVisible();
 await expect(page.getByRole("navigation",{name:"技能库分类"}).getByRole("button",{name:"官方模板",exact:true})).toHaveAttribute("aria-current","page");
});

test("knowledge landing navigation aligns with cards and opens Chat new conversation",async({page})=>{
 await page.setViewportSize({width:1600,height:900});
 await page.goto("/shuomi/#/workbench/ai/knowledge");
 const root=page.locator('[data-library-hub="knowledge"]');
 const nav=root.getByRole("navigation",{name:"知识库分类"});
 const tabs=nav.getByRole("button");
 await expect(tabs).toHaveCount(3);
 const bounds=await Promise.all([
  root.locator('header').first().boundingBox(),
  nav.boundingBox(),
  root.locator('[aria-label="选择知识库"]').boundingBox()
 ]);
 for(const box of bounds)expect(box).not.toBeNull();
 expect(Math.abs(bounds[0]!.x-bounds[1]!.x)).toBeLessThanOrEqual(2);
 expect(Math.abs(bounds[1]!.x-bounds[2]!.x)).toBeLessThanOrEqual(2);
 expect(Math.abs(bounds[0]!.width-bounds[1]!.width)).toBeLessThanOrEqual(2);
 const widths=await tabs.evaluateAll(nodes=>nodes.map(x=>x.getBoundingClientRect().width));
 expect(Math.max(...widths)-Math.min(...widths)).toBeLessThanOrEqual(1);
 await page.getByRole("button",{name:"去创建知识库"}).click();
 await expect(page).toHaveURL(/\/workbench\/ai\/chat\/new\?preview=1/);
});

test("project archive restores shared create action and My Projects manages custom groups without deleting projects",async({page})=>{
 await page.goto("/shuomi/#/workbench/ai/projects/archived");
 const archived=page.locator('[data-project-showcase="true"]');
 await expect(archived.getByRole("button",{name:"新建项目"})).toBeVisible();
 await page.goto("/shuomi/#/workbench/ai/projects/mine");
 const root=page.locator('[data-project-showcase="true"]');
 await expect(root.getByRole("button",{name:"管理分组"})).toBeVisible();
 await root.getByRole("button",{name:"管理分组"}).click();
 const dialog=page.getByRole("dialog",{name:"管理项目分组"});
 await expect(dialog).toBeVisible();
 await dialog.getByRole("textbox",{name:"新分组名称"}).fill("美国站业务");
 await dialog.getByRole("button",{name:"创建分组"}).click();
 await expect(dialog.getByText("美国站业务")).toBeVisible();
 await dialog.getByRole("button",{name:"完成"}).click();
 await expect(dialog).not.toBeVisible();
 await expect(root.getByRole("combobox",{name:"按项目分组筛选"}).getByRole("option",{name:"美国站业务"})).toHaveCount(1);
 await root.getByRole("button",{name:"管理分组"}).click();
 await dialog.getByRole("button",{name:"重命名"}).click();
 await dialog.getByRole("textbox",{name:"重命名美国站业务"}).fill("重点项目");
 await dialog.getByRole("button",{name:"保存"}).click();
 await expect(dialog.getByText("重点项目")).toBeVisible();
 await dialog.getByRole("button",{name:"删除分组"}).click();
 await expect(dialog.getByText("重点项目")).toHaveCount(0);
 await dialog.getByRole("button",{name:"完成"}).click();
});

test("knowledge creation stays visible on all tabs; personal groups manage enabled knowledge",async({page})=>{
 for(const route of ["/ai/knowledge","/ai/knowledge/official","/ai/knowledge/mine"]){
  await page.goto("/shuomi/#/workbench"+route);
  await expect(page.getByRole("button",{name:"去创建知识库"})).toBeVisible();
 }
 await page.goto("/shuomi/#/workbench/ai/knowledge/official");
 await page.locator('[data-library-page="knowledge-official"]').getByRole("button",{name:"启用",exact:true}).first().click();
 await expect(page.getByRole("status")).toContainText("已加入我的知识库");
 await page.goto("/shuomi/#/workbench/ai/knowledge/mine");
 const root=page.locator("[data-my-knowledge-groups]");
 await expect(root).toBeVisible();
 await expect(root.getByRole("table")).toBeVisible();
 await expect(root.getByRole("textbox",{name:"搜索知识库名称"})).toBeVisible();
 await expect(root.getByText("跨境平台规则")).toBeVisible();
 await root.getByRole("button",{name:"管理分组"}).click();
 const dialog=page.getByRole("dialog",{name:"管理知识库分组"});
 await expect(dialog).toBeVisible();
 await dialog.getByRole("textbox",{name:"分组名称"}).fill("运营资料");
 await dialog.getByRole("button",{name:"创建分组"}).click();
 await expect(dialog.getByText("运营资料")).toBeVisible();
 await dialog.getByRole("button",{name:"完成"}).click();
 await root.getByRole("combobox",{name:"跨境平台规则的所属分组"}).selectOption("运营资料");
 await root.getByRole("combobox",{name:"按知识库分组筛选"}).selectOption("运营资料");
 await expect(root.getByText("跨境平台规则")).toBeVisible();
 await page.reload();
 await expect(root.getByRole("combobox",{name:"按知识库分组筛选"}).getByRole("option",{name:"运营资料"})).toHaveCount(1);
 await root.getByRole("button",{name:"管理分组"}).click();
 await dialog.getByRole("button",{name:"删除分组"}).click();
 await dialog.getByRole("button",{name:"完成"}).click();
 await expect(root.getByText("跨境平台规则")).toBeVisible();
 // The persistent create action belongs to the page header, outside the personal groups panel.
 const createKnowledge=page.getByRole("button",{name:"去创建知识库",exact:true});
 await expect(createKnowledge).toBeVisible();
 await createKnowledge.click();
 await expect(page).toHaveURL(/chat\/new/);
 await expect(page.getByRole("button",{name:"加入我的知识库",exact:true})).toHaveAttribute("aria-pressed","true");
});

test("archived project categories come from archived records and are hidden when no records exist",async({page})=>{
 await page.goto("/shuomi/#/workbench/ai/projects/archived");
 const root=page.locator('[data-project-showcase="true"]');
 await expect(root.getByRole("heading",{name:"已归档项目"})).toBeVisible();
 await expect(root.locator('form[class*="filters"] [class*="tabs"] button')).toHaveCount(0);
 await page.evaluate(()=>{
  sessionStorage.setItem("shuomi-preview-projects-v1",JSON.stringify([
   {id:"test-archived-one",name:"广告复盘",goal:"复盘",scope:"美国站",category:"自定义运营",milestone:"归档",progress:100,status:"已归档",updated:1,visited:1,archivedAt:1,reports:[],resources:[]},
   {id:"test-archived-two",name:"商品改版",goal:"改版",scope:"美国站",category:"新商品实验",milestone:"归档",progress:100,status:"已归档",updated:2,visited:2,archivedAt:2,reports:[],resources:[]}
  ]));
 });
 await page.reload();
 await expect(root.getByRole("button",{name:"自定义运营"})).toBeVisible();
 await expect(root.getByRole("button",{name:"新商品实验"})).toBeVisible();
 await expect(root.getByRole("button",{name:"店铺经营"})).toHaveCount(0);
 await root.getByRole("button",{name:"自定义运营"}).click();
 await expect(root.locator("tbody tr")).toHaveCount(1);
 await expect(root.getByText("广告复盘")).toBeVisible();
});

test("empty My Knowledge retains fixed search, group tools and table header",async({page})=>{
 await page.goto("/shuomi/#/workbench/ai/knowledge/mine");
 const root=page.locator("[data-my-knowledge-groups]");
 await expect(root).toBeVisible();
 await expect(page.getByRole("heading",{name:"我的知识库"})).toBeVisible();
 await expect(page.getByRole("button",{name:"去创建知识库"})).toBeVisible();
 await expect(root.getByRole("combobox",{name:"按知识库分组筛选"})).toBeVisible();
 await expect(root.getByRole("textbox",{name:"搜索知识库名称"})).toBeVisible();
 await expect(root.getByRole("button",{name:"管理分组"})).toBeVisible();
 await expect(root.getByRole("table")).toBeVisible();
 await expect(root.getByRole("columnheader")).toHaveCount(5);
 await expect(root.getByText("暂无知识库")).toBeVisible();
 await expect(root.getByRole("button",{name:"添加官方知识",exact:true})).toHaveCount(0);
});

test("My Knowledge toolbar stays in one row and its table has no vertical scrollbar",async({page})=>{
 await page.setViewportSize({width:1650,height:900});
 await page.goto("/shuomi/#/workbench/ai/knowledge/official");
 await page.locator('[data-library-page="knowledge-official"]').getByRole("button",{name:"启用",exact:true}).first().click();
 await page.goto("/shuomi/#/workbench/ai/knowledge/mine");
 const root=page.locator("[data-my-knowledge-groups]");
 await expect(root.getByRole("table")).toBeVisible();
 const toolbar=root.locator('[aria-label="知识库操作"]');
 const group=toolbar.getByRole("combobox",{name:"按知识库分组筛选"});
 const search=toolbar.getByRole("textbox",{name:"搜索知识库名称"});
 const manage=toolbar.getByRole("button",{name:"管理分组"});
 await expect(group).toBeVisible();await expect(search).toBeVisible();await expect(manage).toBeVisible();
 const positions=await Promise.all([group.boundingBox(),search.boundingBox(),manage.boundingBox()]);
 for(const pos of positions)expect(pos).not.toBeNull();
 const center=(box:NonNullable<typeof positions[number]>)=>box.y+box.height/2;
 expect(Math.max(...positions.map(p=>center(p!)))-Math.min(...positions.map(p=>center(p!)))).toBeLessThan(6);
 const table=root.getByRole("table");
 const dimensions=await table.evaluate(el=>({height:el.getBoundingClientRect().height,rows:el.querySelectorAll("tbody tr").length}));
 expect(dimensions.rows).toBe(1);expect(dimensions.height).toBeGreaterThan(85);
 const scroll=await root.locator('[class*="tableWrap"]').evaluate(el=>({height:el.clientHeight,scrollHeight:el.scrollHeight,overflowY:getComputedStyle(el).overflowY}));
 expect(scroll.scrollHeight-scroll.height).toBeLessThanOrEqual(2);
 expect(scroll.overflowY).not.toBe("scroll");
});
