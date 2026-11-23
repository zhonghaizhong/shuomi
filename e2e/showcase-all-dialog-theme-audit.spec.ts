import { expect, test, type Page, type Locator } from "@playwright/test";

/* Explicit open/inspect/close matrix. Never click a confirmation or perform a mutation.
   Each scenario runs in its own clean browser page and in both themes. */
const base="/shuomi/#/workbench";
type Case={name:string;route:string;trigger:string;dialog:string;scope?:string;menu?:string;kind?:"dialog"|"alertdialog"};
const cases:Case[]=[
 {name:"AI tasks new task",route:"/ai/tasks",trigger:"新建任务",dialog:"新建任务"},
 {name:"Agent model configuration",route:"/agents/mine",trigger:"模型设置",dialog:"模型设置"},
 {name:"Official skill introduction",route:"/agents/skills/official",trigger:"介绍",dialog:"官方技能介绍",scope:"[data-skill-name]"},
 {name:"Project template introduction",route:"/ai/projects/templates",trigger:"介绍",dialog:"模板介绍",scope:"article"},
 {name:"Store binding",route:"/stores",trigger:"绑定新店铺",dialog:"绑定新店铺"},
 {name:"Store group management",route:"/stores",trigger:"管理分组",dialog:"管理分组"},
 {name:"Enterprise member invitation",route:"/account/organization/members",trigger:"邀请成员",dialog:"邀请成员"},
 {name:"Enterprise role creation",route:"/account/organization/roles",trigger:"新建角色",dialog:"新建角色"},
 {name:"Referral payout configuration",route:"/account/referrals/withdrawals",trigger:"配置账户",dialog:"配置收款账户"},
 {name:"Referral withdrawal request",route:"/account/referrals/withdrawals",trigger:"申请提现",dialog:"申请提现"},
 {name:"Recent conversation rename",route:"/ai/chat/recent",trigger:"重命名",dialog:"重命名会话",scope:'[data-chat-collection-preview="recent"]',menu:"更多操作：一号店转化率下降分析"},
];
const rgb=(value:string):number[]|null=>{
 const nums=value.match(/^rgba?\\(([^)]+)\\)$/)?.[1].split(/[,\\s/]+/).map(Number);
 return nums&&nums.length>=3&&nums.slice(0,3).every(Number.isFinite)?nums.slice(0,3):null;
};
const luminance=(color:number[])=>{
 const c=color.map(v=>{const n=v/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});
 return .2126*c[0]+.7152*c[1]+.0722*c[2];
};
async function setTheme(page:Page,theme:"light"|"dark"){
 const switchTo=page.getByRole("button",{name:theme==="light"?"切换浅色主题":"切换深色主题"});
 if(await switchTo.count())await switchTo.click();
 await expect(page.locator("html")).toHaveClass(new RegExp(theme));
}
async function checkDialog(page:Page,dialog:Locator,theme:"light"|"dark",scenario:string){
 await expect(dialog).toBeVisible();
 const check=await dialog.evaluate(el=>{
  const s=getComputedStyle(el),rect=el.getBoundingClientRect();
  const colors=[...el.querySelectorAll("h1,h2,h3,p,label,small,button,input,select,textarea")]
   .filter(node=>{const r=node.getBoundingClientRect();return r.width>5&&r.height>5})
   .slice(0,35).map(node=>({text:node.textContent?.trim().slice(0,34)||node.tagName,
    color:getComputedStyle(node).color,background:getComputedStyle(node).backgroundColor,
    fontSize:getComputedStyle(node).fontSize}));
  const surfaces=[...el.querySelectorAll("section,article,aside,[class*=card],[class*=panel]")]
   .filter(node=>{const r=node.getBoundingClientRect();return r.width>8&&r.height>8})
   .slice(0,30).map(node=>({cls:String((node as HTMLElement).className).slice(0,55),
    background:getComputedStyle(node).backgroundColor}));
  return {background:s.backgroundColor,color:s.color,rect:{x:rect.x,y:rect.y,width:rect.width,height:rect.height},
    viewport:{width:innerWidth,height:innerHeight},surfaces,colors,
    scrollable:el.scrollHeight>el.clientHeight?["auto","scroll"].includes(s.overflowY):true};
 });
 const surface=rgb(check.background),ink=rgb(check.color);
 expect(surface,scenario+" dialog must have painted background").not.toBeNull();
 if(surface&&ink){
  const L=luminance(surface),T=luminance(ink);
  expect((Math.max(L,T)+.05)/(Math.min(L,T)+.05),scenario+" base text contrast").toBeGreaterThanOrEqual(4.5);
  if(theme==="light")expect(L,scenario+" retains a dark dialog in light mode").toBeGreaterThan(.55);
  else expect(L,scenario+" retains a pale dialog in dark mode").toBeLessThan(.34);
 }
 // At least 90% of the dialog must fit viewport; tall content must remain scrollable.
 const {rect,viewport}=check;
 expect(rect.x+rect.width).toBeLessThanOrEqual(viewport.width+12);
 expect(rect.x).toBeGreaterThanOrEqual(-12);
 expect(rect.y).toBeGreaterThanOrEqual(-12);
 expect(rect.y).toBeLessThan(viewport.height-35);
 expect(check.scrollable,scenario+" clipped content without scrolling").toBeTruthy();
 for(const nested of check.surfaces){
  const n=rgb(nested.background);if(!n||nested.background==="rgba(0, 0, 0, 0)")continue;
  const L=luminance(n);
  if(theme==="light")expect(L,scenario+" nested "+nested.cls).toBeGreaterThan(.48);
  else expect(L,scenario+" nested "+nested.cls).toBeLessThan(.5);
 }
 return check;
}
for(const c of cases){
 for(const theme of ["dark","light"] as const){
  test(c.name+" / "+theme,async({page},testInfo)=>{
   await page.setViewportSize({width:1440,height:900});
   await page.goto(base+c.route);
   await setTheme(page,theme);
   let root:Locator=page.locator("main.showcase-content");
   if(c.scope)root=root.locator(c.scope).first();
   if(c.menu)await root.getByRole("button",{name:c.menu}).click();
   await root.getByRole(c.menu?"menuitem":"button",{name:c.trigger,exact:!["新建任务"].includes(c.trigger)}).first().click();
   const dialog=page.getByRole(c.kind??"dialog",{name:c.dialog});
   const evidence=await checkDialog(page,dialog,theme,c.name);
   await testInfo.attach("dialog-appearance.json",{body:JSON.stringify({scenario:c,theme,...evidence},null,2),contentType:"application/json"});
   await page.keyboard.press("Escape");
   if(await dialog.isVisible()){
    const close=dialog.getByRole("button",{name:/^(关闭|取消|关闭弹窗|退出)$/}).first();
    if(await close.isVisible())await close.click();
   }
   await expect(dialog,c.name+" dialog should close cleanly").not.toBeVisible();
   await expect(page.locator("main.showcase-content")).toBeVisible();
  });
 }
}
