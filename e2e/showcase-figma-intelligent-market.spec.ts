import {test,expect,type Page} from "@playwright/test";
const base="/shuomi/#/workbench";
const rgb=(s:string)=>s.match(/\d+(?:\.\d+)?/g)?.slice(0,3).map(Number)??[];
const isPale=(s:string)=>rgb(s).length===3&&rgb(s).every(n=>n>=215);
const rgbLum=(s:string)=>{const c=rgb(s).map(n=>{const x=n/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return c.length===3?c[0]*.2126+c[1]*.7152+c[2]*.0722:0};
const ratio=(a:string,b:string)=>{const [x,y]=[rgbLum(a),rgbLum(b)].sort((a,b)=>b-a);return (x+.05)/(y+.05)};
const setTheme=async(page:Page,mode:"light"|"dark")=>{
 const label=mode==="light"?"切换浅色主题":"切换深色主题";
 const button=page.getByRole("button",{name:label});
 if(await button.count())await button.click();
 await expect(page.locator("html")).toHaveClass(new RegExp(mode));
};
test("intelligent market and customization routes have readable dark and light surfaces",async({page})=>{
 test.setTimeout(160000);
 const routes=[
  ["/agents","[data-intelligent-market='agents']"],
  ["/agents/market","[data-intelligent-market='agentMarket']"],
  ["/agents/mine","[data-intelligent-market='agentMine']"],
  ["/agents/custom","[data-agent-customization='overview']"],
  ["/agents/custom/new","[data-agent-customization='new']"],
  ["/agents/custom/progress","[data-agent-customization='progress']"],
 ] as const;
 for(const [route,selector] of routes){
  await page.goto(base+route);
  const root=page.locator(selector);
  await expect(root,route).toBeVisible();
  const header=root.locator(":scope > header").first();
  await expect(header).toBeVisible();
  for(const mode of ["dark","light"] as const){
   await setTheme(page,mode);
   const props=await header.evaluate(el=>{
    const title=el.querySelector("h1")!;
    return {bg:getComputedStyle(el).backgroundColor,fg:getComputedStyle(title).color};
   });
   expect(isPale(props.bg),route+" "+mode+" header background").toBe(mode==="light");
   expect(ratio(props.bg,props.fg),route+" "+mode+" title contrast").toBeGreaterThanOrEqual(4.5);
   const cards=root.locator('[class*="agentCards"] article,[class*="agentMine"] > article > section,[class*="agentMine"] > article > aside,[class*="featureGrid"] article,article[class*="card"],article[class*="dataCard"],[class*="sideCards"] > article');
   for(let i=0;i<Math.min(await cards.count(),4);i++){
    const el=cards.nth(i);
    if(!(await el.isVisible()))continue;
    const color=await el.evaluate(e=>{
      // Transparent inner articles inherit the visible card surface.
      // Check the first painted ancestor rather than treating transparency as black.
      let current:Element|null=e;
      while(current){
       const color=getComputedStyle(current).backgroundColor;
       if(color!=="rgba(0, 0, 0, 0)" && color!=="transparent")return color;
       current=current.parentElement;
      }
      return "rgba(0, 0, 0, 0)";
    });
    expect(isPale(color),route+" "+mode+" card "+i+" "+color).toBe(mode==="light");
   }
  }
 }
});
test("agent market category/search and activation persist across menu navigation",async({page})=>{
 await page.goto(base+"/agents/market");
 const market=page.locator("[data-intelligent-market='agentMarket']");
 await expect(market.locator('[class*="agentCards"] article')).toHaveCount(8);
 await market.getByRole("button",{name:"客服",exact:true}).click();
 await expect(market.locator('[class*="agentCards"] article')).toHaveCount(1);
 await market.getByRole("button",{name:"重置"}).click();
 await expect(market.locator('[class*="agentCards"] article')).toHaveCount(8);
 const agent=market.locator('[class*="agentCards"] article').filter({has:page.getByRole("heading",{name:"商品优化智能体"})});
 await agent.getByRole("button",{name:"停用"}).click();
 await market.getByRole("button",{name:"我的智能体"}).click();
 const mine=page.locator("[data-intelligent-market='agentMine']");
 await expect(mine).toContainText("已启用智能体 1");
 await mine.getByRole("button",{name:/已停用 1/}).click();
 await expect(mine.locator('[class*="agentMine"] article')).toHaveCount(1);
 await page.goto(base+"/agents/market");
 const card=page.locator("[data-intelligent-market='agentMarket'] [class*='agentCards'] article").filter({hasText:"商品优化智能体"});
 await card.getByRole("button",{name:"启用"}).click();
 await page.goto(base+"/agents/mine");
 await expect(page.locator("[data-intelligent-market='agentMine']")).toContainText("已启用智能体 2");
});
test("customization request is validated and switches between demo progress and empty state",async({page})=>{
 await page.goto(base+"/agents/custom");
 await page.locator("[data-agent-customization='overview']").getByRole("button",{name:"提交定制需求"}).click();
 await expect(page).toHaveURL(/agents\/custom\/new/);
 const form=page.locator('[data-agent-customization="new"]');
 await expect(form.getByRole("heading",{name:"告诉我们你希望智能体完成什么"})).toBeVisible();
 await form.getByRole("textbox",{name:"需求名称"}).fill("SHEIN 商品资料规范化");
 await form.getByRole("combobox",{name:"主要使用场景"}).selectOption("商品与供应链管理");
 await form.getByRole("textbox",{name:"希望智能体完成什么？"}).fill("批量检查标题、描述与商品资料");
 await form.getByRole("textbox",{name:"联系人"}).fill("测试联系人");
 await form.getByRole("textbox",{name:"手机或微信"}).fill("test-contact");
 const submit=form.getByRole("button",{name:"提交定制需求"});
 await expect(submit).toBeDisabled();
 await form.getByRole("checkbox").check();
 await expect(submit).toBeEnabled();
 await submit.click();
 await expect(page.getByRole("dialog",{name:"确认保存演示需求"})).toBeVisible();
 await page.getByRole("button",{name:"确认保存演示记录"}).click();
 await expect(page).toHaveURL(/agents\/custom\/progress/);
 const progress=page.locator('[data-agent-customization="progress"]');
 await expect(progress.getByText("SHEIN 商品资料规范化")).toBeVisible();
 await progress.getByRole("button",{name:"本地演示记录"}).click();
 await expect(progress.getByText("SHEIN 商品资料规范化")).toBeVisible();
 await expect(progress.getByText("未提交服务器")).toBeVisible();
});

test("My Agents model settings dialog retains demo selection across submenu navigation",async({page})=>{
 await page.goto(base+"/agents/mine");
 const root=page.locator("[data-intelligent-market='agentMine']");
 await root.getByRole("button",{name:"模型设置"}).first().click();
 let dialog=page.getByRole("dialog",{name:"模型设置"});
 await expect(dialog).toBeVisible();
 await dialog.getByRole("button",{name:/自定义模型/}).click();
 dialog=page.getByRole("dialog",{name:"自定义模型"});
 await dialog.getByRole("textbox",{name:"模型服务商"}).fill("本地演示服务商");
 await dialog.getByRole("textbox",{name:"模型名称"}).fill("demo-only");
 await dialog.getByLabel("API Key").fill("not-a-real-key");
 await dialog.getByRole("button",{name:"保存并启用"}).click();
 await root.getByRole("button",{name:"前往智能体市场"}).click();
 await page.locator("[data-intelligent-market='agentMarket']").getByRole("button",{name:"我的智能体"}).click();
 await page.locator("[data-intelligent-market='agentMine']").getByRole("button",{name:"模型设置"}).first().click();
 dialog=page.getByRole("dialog",{name:"模型设置"});
 await expect(dialog.getByRole("button",{name:/自定义模型/})).toHaveAttribute("aria-pressed","true");
 await page.keyboard.press("Escape");
 await expect(dialog).not.toBeVisible();
});

test("approved Vuexy visual palette takes precedence over Figma visual skin",async({page})=>{
 test.setTimeout(130000);
 for(const route of ["/agents","/agents/market","/agents/mine","/agents/custom","/agents/custom/new","/agents/custom/progress"]){
  await page.goto(base+route);
  const root=page.locator("[data-intelligent-market],[data-agent-customization]");
  const header=root.locator(":scope > header").first();
  for(const mode of ["dark","light"] as const){
   await setTheme(page,mode);
   await expect(header).toBeVisible();
   const bg=await header.evaluate(el=>getComputedStyle(el).backgroundColor);
   const expectedDarkSurface=route==="/agents"||route==="/agents/market"||route==="/agents/mine"?"rgb(47, 51, 73)":"rgb(20, 34, 55)";
    expect(bg,route+" "+mode+" header").toBe(mode==="dark"?expectedDarkSurface:"rgb(255, 255, 255)");
   const primary=root.locator("button[class*='primary']").first();
   if(await primary.count()){
    const buttonBg=await primary.evaluate(el=>getComputedStyle(el).backgroundColor);
    expect(buttonBg,route+" "+mode+" primary").toBe("rgb(115, 103, 240)");
   }
  }
 }
});
