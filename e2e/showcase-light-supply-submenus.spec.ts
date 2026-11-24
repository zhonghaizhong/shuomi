import {expect,test} from "@playwright/test";
const catalogRoutes=["/supply/catalogs","/supply/catalogs/selection","/supply/catalogs/apply"];
const preferredRoutes=["/supply/applications","/supply/applications/new","/supply/applications/progress","/supply/applications/records"];
const url=(route:string)=>"/shuomi/#/workbench"+route;
const channels=(color:string)=>color.match(/\d+(?:\.\d+)?/g)?.slice(0,3).map(Number)??[];
const pale=(color:string)=>{const c=channels(color);return c.length===3&&c.every(n=>n>=220);};
const turnLight=async(page:any)=>{const b=page.getByRole("button",{name:"切换浅色主题"});if(await b.count())await b.click();};
const turnDark=async(page:any)=>{const b=page.getByRole("button",{name:"切换深色主题"});if(await b.count())await b.click();};
const contrast=(a:string,b:string)=>{
 const lum=(v:string)=>{const c=channels(v).map(n=>{const x=n/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return c.length===3?c[0]*.2126+c[1]*.7152+c[2]*.0722:0;};
 const [x,y]=[lum(a),lum(b)].sort((a,b)=>b-a);return(x+.05)/(y+.05);
};
test("cargo integration routes keep theme-consistent surfaces",async({page})=>{
 test.setTimeout(130000);
 for(const route of catalogRoutes){
  await page.goto(url(route));
  await turnDark(page);
  const root=page.locator('[class*="supplyDetailPreview"]');
  await expect(root).toBeVisible();
  const first=root.locator('[class*="header"],[class*="filterBox"],[class*="twoCards"]>article').first();
  await expect(first).toBeVisible();
  let bg=await first.evaluate(el=>getComputedStyle(el).backgroundColor);
  expect(pale(bg),route+" dark").toBeFalsy();
  await turnLight(page);
  bg=await first.evaluate(el=>getComputedStyle(el).backgroundColor);
  expect(pale(bg),route+" light").toBeTruthy();
 }
});
test("Figma preferred application submenus have legible dark/light card, text and control colors",async({page})=>{
 test.setTimeout(150000);
 for(const route of preferredRoutes){
  await page.goto(url(route));
  await turnDark(page);
  const root=page.locator("[data-preferred-application]");
  await expect(root,route).toBeVisible();
  const panel=root.locator('[class*="heading"]').first();
  await expect(panel).toBeVisible();
  const darkBg=await panel.evaluate(el=>getComputedStyle(el).backgroundColor);
  expect(pale(darkBg),route+" dark bg").toBeFalsy();
  await page.getByRole("button",{name:"切换浅色主题"}).click();
  const c=await panel.evaluate(el=>({bg:getComputedStyle(el).backgroundColor,fg:getComputedStyle(el.querySelector("h1")!).color}));
  expect(pale(c.bg),route+" light bg").toBeTruthy();
  expect(contrast(c.bg,c.fg),route+" heading contrast").toBeGreaterThanOrEqual(4.5);
  const cards=root.locator('[class*="metric"],[class*="panel"],[class*="infoColumns"]>article');
  for(let i=0;i<Math.min(4,await cards.count());i++){
   const e=cards.nth(i);if(!await e.isVisible())continue;
   const bg=await e.evaluate(el=>getComputedStyle(el).backgroundColor);
   if(bg!=="rgba(0, 0, 0, 0)")expect(pale(bg),route+" card "+i+" "+bg).toBeTruthy();
  }
 }
});
test("preferred application Figma flow: overview, selection, details, supply form, progress and records",async({page})=>{
 await page.goto(url("/supply/applications"));
 const root=page.locator("[data-preferred-application]");
 await expect(root.getByRole("heading",{name:"申请条件"})).toBeVisible();
 await expect(root.getByRole("heading",{name:"申请流程"})).toBeVisible();
 await root.getByRole("button",{name:"选择商品发起申请"}).click();
 await expect(page).toHaveURL(/\/applications\/new/);
 const selection=page.locator('[data-preferred-application="select"]');
 await expect(selection.getByText("自有商品库 · 已上传")).toBeVisible();
 await selection.getByRole("checkbox",{name:"选择轻量防晒连帽外套"}).check();
 await selection.getByRole("button",{name:"填写供货信息"}).click();
 const form=page.locator('[data-preferred-application="supply"]');
 await expect(form.getByRole("heading",{name:"供货与交付"})).toBeVisible();
 await form.getByRole("spinbutton",{name:"可供库存"}).fill("100");
 await form.getByRole("spinbutton",{name:"最小起订量"}).fill("1");
 await form.getByRole("combobox",{name:"发货时效"}).selectOption("48小时内");
 await form.getByRole("textbox",{name:"发货地"}).fill("浙江省义乌市");
 await form.getByRole("textbox",{name:"售后政策"}).fill("按质量情况提供退换货处理");
 await form.getByRole("button",{name:"保存草稿"}).click();
 await expect(form.getByRole("status")).toContainText("演示草稿");
 await form.getByRole("button",{name:"提交申请"}).click();
 await expect(form.getByText("没有连接正式提交接口")).toBeVisible();
 await form.getByRole("button",{name:"查看演示申请进度"}).click();
 await expect(page).toHaveURL(/\/applications\/progress/);
 await page.goto(url("/supply/applications/records"));
 await expect(page.getByRole("heading",{name:"审核历史记录"})).toBeVisible();
 await page.locator("[data-preferred-application]").getByRole("button",{name:"未通过",exact:true}).first().click();
 await expect(page.getByText("SQ-20260815-003").first()).toBeVisible();
});


test("Supply market has four equal-width entry cards on one desktop row",async({page})=>{
 await page.setViewportSize({width:1600,height:900});
 await page.goto(url("/supply"));
 const cards=page.locator('[class*="supplyPreview"] [class*="supplyCards"] > article');
 await expect(cards).toHaveCount(4);
 const bounds=await cards.evaluateAll(elements=>elements.map(el=>{
  const b=el.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,right:b.right};
 }));
 for(const box of bounds){
  expect(Math.abs(box.y-bounds[0].y)).toBeLessThan(3);
  expect(Math.abs(box.width-bounds[0].width)).toBeLessThan(3);
 }
 for(let i=1;i<bounds.length;i++)expect(bounds[i].x).toBeGreaterThanOrEqual(bounds[i-1].right-2);
 for(const title of ["硕米自营","硕米优选","货盘集成","优选申请"]){
  await expect(cards.filter({has:page.getByRole("heading",{name:title,exact:true})})).toBeVisible();
 }
 await expect(cards.filter({hasText:"货盘集成"}).getByRole("button",{name:"进入"})).toBeVisible();
 await expect(cards.filter({hasText:"优选申请"}).getByRole("button",{name:"进入"})).toBeVisible();
 await page.setViewportSize({width:1000,height:900});
 const middle=await cards.evaluateAll(elements=>elements.map(el=>el.getBoundingClientRect().y));
 expect(Math.abs(middle[0]-middle[1])).toBeLessThan(3);
 expect(middle[2]).toBeGreaterThan(middle[0]+40);
 await page.setViewportSize({width:640,height:900});
 const narrow=await cards.evaluateAll(elements=>elements.map(el=>el.getBoundingClientRect().y));
 for(let i=1;i<narrow.length;i++)expect(narrow[i]).toBeGreaterThan(narrow[i-1]+40);
});

test("cargo application page uses aligned, colorful yet theme-consistent workflow with validated fields",async({page})=>{
 for(const width of [1440,2560,720]){
  await page.setViewportSize({width,height:950});
  await page.goto(url("/supply/catalogs/apply"));
  const root=page.locator('[data-catalog-apply="true"]');
  await expect(root).toBeVisible();
  const cards=root.locator(":scope > article");
  await expect(cards).toHaveCount(2);
  const steps=root.locator("ol li[data-step]");
  await expect(steps).toHaveCount(4);
  await expect(root.getByText("技术对接属于有偿服务")).toBeVisible();
  const xs=await cards.evaluateAll(items=>items.map(el=>{const b=el.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};}));
  if(width>=1440){
   expect(Math.abs(xs[0].y-xs[1].y)).toBeLessThan(3);
   expect(Math.abs(xs[0].height-xs[1].height)).toBeLessThan(3);
   expect(xs[1].x).toBeGreaterThan(xs[0].x+xs[0].width);
  }else expect(xs[1].y).toBeGreaterThan(xs[0].y+40);
  const submit=root.getByRole("button",{name:"提交对接申请"});
  await submit.click();
  await expect(page.getByRole("dialog",{name:"提交对接申请"})).toHaveCount(0);
  await root.getByRole("textbox",{name:/货盘名称/}).fill("示例货盘");
  await root.getByRole("textbox",{name:/货盘网址/}).fill("https://example.com");
  await root.getByRole("textbox",{name:/对接联系人/}).fill("测试联系人 test@example.com");
  await root.getByRole("textbox",{name:/主要商品类目/}).fill("家居、宠物");
  await submit.click();
  const dialog=page.getByRole("dialog",{name:"提交对接申请"});
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("不会提交申请");
  await page.getByRole("button",{name:"关闭操作弹窗"}).click();
  for(const theme of ["dark","light"]){
   const toggle=page.getByRole("button",{name:theme==="light"?"切换浅色主题":"切换深色主题"});
   if(await toggle.isVisible())await toggle.click();
   const bg=await cards.first().evaluate(el=>getComputedStyle(el).backgroundColor);
   expect(pale(bg)).toBe(theme==="light");
  }
 }
});
