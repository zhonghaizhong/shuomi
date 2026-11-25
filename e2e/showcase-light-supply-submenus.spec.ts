import {expect,test} from "@playwright/test";
const catalogRoutes=["/supply/catalogs","/supply/catalogs/selection","/supply/catalogs/apply"];
const preferredRoutes=["/supply/applications","/supply/applications/new","/supply/applications/progress","/supply/applications/records"];
const url=(route:string)=>"/shuomi/#/workbench"+route;
/** Computed colors may serialize as rgb(221, 247, 251) or color(srgb .867 .969 .984).
 * Normalize to 0–255 RGB channels before checking pale backgrounds and contrast.
 */
const channels=(color:string)=>{
 const raw=color.trim().toLowerCase();
 // Chrome may serialize CSS color-mix() as oklab(), not rgb().
 // Convert to sRGB instead of treating OKLab coordinates as RGB bytes.
 if(raw.startsWith("oklab(")){
  const values=raw.match(/-?(?:\d*\.\d+|\d+)/g)?.slice(0,3).map(Number)??[];
  if(values.length!==3||!values.every(Number.isFinite))return [];
  const [L,a,b]=values;
  const l=(L+0.3963377774*a+0.2158037573*b)**3;
  const m=(L-0.1055613458*a-0.0638541728*b)**3;
  const s=(L-0.0894841775*a-1.291485548*b)**3;
  const linear=[
   4.0767416621*l-3.3077115913*m+0.2309699292*s,
   -1.2684380046*l+2.6097574011*m-0.3413193965*s,
   -0.0041960863*l-0.7034186147*m+1.7076147010*s
  ];
  return linear.map(n=>Math.max(0,Math.min(255,255*(n<=0.0031308?12.92*n:1.055*n**(1/2.4)-0.055))));
 }
 if(raw.startsWith("color(srgb ")){
  const values=raw.slice("color(srgb ".length).replace(/\)$/, "").split("/")[0]
   .trim().split(/\s+/).slice(0,3).map(Number);
  return values.length===3&&values.every(Number.isFinite)?values.map(n=>n*255):[];
 }
 const matches=raw.match(/-?(?:\d*\.\d+|\d+)/g)?.slice(0,3).map(Number)??[];
 return matches.length===3&&matches.every(Number.isFinite)?matches:[];
};
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
  const panel=root.locator('[class*="mainPanel"]').first();
   const heroTitle=root.getByRole("heading",{name:"加入硕米优选",exact:true});
   await expect(heroTitle).toBeVisible();
  await expect(panel).toBeVisible();
  const darkBg=await panel.evaluate(el=>getComputedStyle(el).backgroundColor);
  expect(pale(darkBg),route+" dark bg").toBeFalsy();
  await page.getByRole("button",{name:"切换浅色主题"}).click();
  const c=await panel.evaluate(async el=>({bg:getComputedStyle(el).backgroundColor,fg:getComputedStyle(document.querySelector('[data-preferred-application] h1')!).color}));
  expect(pale(c.bg),route+" light bg").toBeTruthy();
  expect(contrast(c.bg,c.fg),route+" heading contrast").toBeGreaterThanOrEqual(4.5);
  const cards=root.locator('[class*="metricCard"],[class*="mainPanel"],[class*="infoColumns"]>article');
  for(let i=0;i<Math.min(4,await cards.count());i++){
   const e=cards.nth(i);if(!await e.isVisible())continue;
   const bg=await e.evaluate(el=>getComputedStyle(el).backgroundColor);
   if(bg!=="rgba(0, 0, 0, 0)")expect(pale(bg),route+" card "+i+" "+bg).toBeTruthy();
  }
 }
});
test("preferred application reads owned adapted products and promotes only demo-approved items",async({page})=>{
 await page.goto(url("/supply/applications"));
 const root=page.locator('[data-preferred-application="unified"]');
 await expect(root).toBeVisible();
 await expect(root.getByRole("heading",{name:"加入硕米优选"})).toBeVisible();
 await expect(root.getByText(/曝光、询盘及成交不作保证/)).toBeVisible();
 await expect(root.getByRole("tab",{name:/商品候选/})).toBeVisible();
 await expect(root.getByRole("tab",{name:/申请记录/})).toBeVisible();
 const scope=await root.evaluate(el=>({org:el.getAttribute("data-organization")!,member:el.getAttribute("data-member")!}));
 await page.evaluate(({org,member})=>{
  const now=new Date().toISOString();
  const own=[
   {id:"OWN-PREF-A",batchId:"B-PREF",name:"测试优选家居收纳盒",source:"上传资料",createdAt:now,checkedAt:now,status:"已入库",missing:[],originalSkus:[{id:1,name:"原家居收纳盒",skuCode:"PREF-A",images:["https://example.com/a.jpg"],description:"收纳盒",price:"29",stock:100}],skus:[{id:1,name:"AI优化家居收纳盒",skuCode:"PREF-A",images:["https://example.com/a.jpg"],description:"优化后的收纳盒",price:"29",stock:100}],agent:"商品优化智能体",template:"硕米适配",templateId:"shuomi-official-adaptation-v1",optimizationMode:"shuomi-template-demo"},
   {id:"OWN-PREF-B",batchId:"B-PREF",name:"尚未优化的测试产品",source:"上传资料",createdAt:now,checkedAt:now,status:"已入库",missing:[],skus:[{id:2,name:"待优化",skuCode:"PREF-B",images:[],description:"待优化产品"}],agent:"",template:""},
   {id:"OWN-PREF-C",batchId:"B-PREF",name:"尚未完成首次适配",source:"上传资料",createdAt:now,checkedAt:now,status:"待审核",missing:[],skus:[{id:3,name:"待适配",skuCode:"PREF-C",images:[],description:"待适配"}],agent:"",template:""}
  ];
  const optimized=[{id:"OPT-PREF-TEST",name:"演示优选优化版本",createdAt:now,version:1,sourceKind:"自有商品库",sourceBatchId:"B-PREF",sourceBatchName:"优选测试批次",platform:"SHEIN",site:"美国",language:"英语",storeName:"测试店铺",uploadTaskId:"TASK-PREF",externalReceiptId:"receipt-pref",acceptedAt:now,reviewStatus:"审核通过",products:[{sourceProductId:"OWN-PREF-A",name:"AI优化后的家居收纳盒",images:[],description:"优化后的商品说明",skuCodes:["PREF-A"]}]}];
  sessionStorage.setItem("shuomi:own-product-records-v1:"+org+":"+member,JSON.stringify(own));
  sessionStorage.setItem("shuomi:optimized-datasets-v1:"+org+":"+member,JSON.stringify(optimized));
 },scope);
 await page.reload();
 const after=page.locator('[data-preferred-application="unified"]');
 await expect(after.getByRole("checkbox",{name:"选择测试优选家居收纳盒"})).toBeEnabled();
 await expect(after.getByRole("checkbox",{name:"选择尚未优化的测试产品"})).toBeEnabled();
 await expect(after.locator('[data-product-id="OWN-PREF-C"]')).toHaveCount(0);
 await after.getByRole("button",{name:"发起申请",exact:true}).click();
 const apply=page.getByRole("dialog",{name:"发起优选申请"});
 await expect(apply).toBeVisible();
 await apply.getByRole("spinbutton",{name:"可供库存"}).fill("120");
 await apply.getByRole("spinbutton",{name:"最小起订量"}).fill("5");
 await apply.getByRole("combobox",{name:"发货时效"}).selectOption("48小时内");
 await apply.getByRole("textbox",{name:"发货地"}).fill("浙江义乌");
 await apply.getByRole("textbox",{name:"售后政策"}).fill("质量问题支持换货");
 await apply.getByRole("button",{name:"提交演示申请"}).click();
 const detail=page.getByRole("dialog",{name:"优选申请详情"});
 await expect(detail).toBeVisible();
 await expect(detail.locator('[data-status="待审核"]')).toBeVisible();
 await detail.getByRole("button",{name:"演示审核通过"}).click();
 await expect(detail.locator('[data-status="已通过"]')).toBeVisible();
 await expect(detail.getByRole("button",{name:/执行官方模板二次优化/})).toBeVisible();
 await detail.getByRole("button",{name:/执行官方模板二次优化/}).click();
 await detail.getByRole("button",{name:"关闭"}).click();
 await after.getByRole("button",{name:"查看硕米优选"}).click();
 await expect(page).toHaveURL(/supply\/selected/);
 const selected=page.locator('[data-selected-market="true"]');
 await expect(selected.getByText("AI优化家居收纳盒")).toBeVisible();
 await expect(selected.locator('[data-selected-product="OWN-PREF-A"]')).toBeVisible();
 await expect(selected.getByText(/不保证订单/)).toBeVisible();
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
  // The same hash route can preserve the mounted React form between viewport runs.
  // Explicitly establish an empty-form precondition before testing validation.
  for(const field of [/货盘名称/,/货盘网址/,/对接联系人/,/主要商品类目/]){
   await root.getByRole("textbox",{name:field}).fill("");
  }
  await expect(page.getByRole("dialog",{name:"提交对接申请"})).toHaveCount(0);
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

test("preferred application lists only approved own products regardless of initial agent template",async({page})=>{
 await page.goto(url("/supply/applications"));
 const root=page.locator('[data-preferred-application="unified"]');
 const scope=await root.evaluate(el=>({org:el.getAttribute("data-organization")!,member:el.getAttribute("data-member")!}));
 await page.evaluate(({org,member})=>{
  const now=new Date().toISOString();
  const make=(id:string,status:"已入库"|"待审核",optimized:boolean)=>({
   id,batchId:"B-SHUOMI-TEST",name:id,source:"上传资料",createdAt:now,checkedAt:now,
   status,missing:[],agent:optimized?"商品优化智能体":"",template:optimized?"硕米适配":"",templateId:optimized?"shuomi-official-adaptation-v1":undefined,optimizationMode:optimized?"shuomi-template-demo":undefined,
   originalSkus:[{id:1,name:"原始标题",description:"原始商品描述",images:["https://example.com/product.jpg"],skuCode:id}],
   skus:[{id:1,name:optimized?"优化标题":"原始标题",description:optimized?"优化商品描述":"原始商品描述",images:["https://example.com/product.jpg"],skuCode:id}]
  });
  sessionStorage.setItem("shuomi:own-product-records-v1:"+org+":"+member,JSON.stringify([
   make("SHUOMI-REVIEW-PENDING","待审核",true),
   make("SHUOMI-READY","已入库",true),
   make("SHUOMI-NOT-OPTIMIZED","已入库",false)
  ]));
  sessionStorage.removeItem("shuomi:optimized-datasets-v1:"+org+":"+member);
  sessionStorage.removeItem("shuomi:preferred-applications-demo-v2:"+encodeURIComponent(org)+":"+encodeURIComponent(member));
 },scope);
 await page.reload();
 const approved=root.locator('[data-product-id="SHUOMI-READY"]');
 const pending=root.locator('[data-product-id="SHUOMI-REVIEW-PENDING"]');
 const noOptimization=root.locator('[data-product-id="SHUOMI-NOT-OPTIMIZED"]');
 await expect(approved.getByRole("checkbox")).toBeEnabled();
 await expect(approved.getByText("自有商品已入库")).toBeVisible();
 await expect(pending).toHaveCount(0);
 await expect(noOptimization.getByRole("checkbox")).toBeEnabled();
 // External-platform receipts or review states are NOT required.
 await approved.getByRole("button",{name:"发起申请"}).click();
 await expect(page.getByRole("dialog",{name:"发起优选申请"})).toBeVisible();
});
