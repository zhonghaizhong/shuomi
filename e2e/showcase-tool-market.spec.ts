import { expect, test } from "@playwright/test";
const base = "/shuomi/#/workbench/tools";

test("official tool list keeps ten Figma cards and supports filter/search/reset",async({page})=>{
 await page.goto(base+"/official");
 await expect(page.getByRole("heading",{name:"官方工具",exact:true})).toBeVisible();
 const cards=page.locator('[class*="toolCard"]');
 await expect(cards).toHaveCount(10);
 await page.getByRole("button",{name:"采集",exact:true}).click();
 await expect(cards).toHaveCount(1);
 await page.getByRole("button",{name:"全部",exact:true}).click();
 const search=page.getByRole("textbox",{name:"搜索官方工具"});
 await search.fill("POD");
 await page.getByRole("button",{name:"确认",exact:true}).click();
 await expect(cards).toHaveCount(1);
 await expect(cards.first()).toContainText("POD素材管理工具");
 await page.getByRole("button",{name:"重置",exact:true}).click();
 await expect(cards).toHaveCount(10);
});
test("official tool introduction opens native modal with close, Escape and focus restoration",async({page})=>{
 await page.goto(base+"/official");
 const pod=page.locator('[class*="toolCard"]').filter({hasText:"POD素材管理工具"});
 const trigger=pod.getByRole("button",{name:"介绍"});
 await trigger.click();
 const modal=page.getByRole("dialog");
 await expect(modal).toBeVisible();
 await expect(modal).toContainText("POD素材管理工具");
 await page.keyboard.press("Escape");
 await expect(modal).toHaveCount(0);
 await expect(trigger).toBeFocused();
});
test("download plugin dialog is grounded, and does not pretend an installer exists",async({page})=>{
 await page.goto(base+"/official");
 await page.locator('[class*="toolCard"]').filter({hasText:"商品采集插件"}).getByRole("button",{name:"介绍"}).click();
 const modal=page.getByRole("dialog");
 await expect(modal).toContainText("下载商品采集插件");
 await expect(modal).toContainText("数据服务");
 await expect(modal.getByRole("button",{name:"暂无可下载文件"})).toBeDisabled();
 await modal.getByRole("button",{name:"取消"}).click();
 await expect(modal).toHaveCount(0);
});
test("enable an official tool, see it in my tools, disable via confirmation",async({page})=>{
 await page.goto(base+"/official");
 const plugin=page.locator('[class*="toolCard"]').filter({hasText:"商品采集插件"});
 await plugin.getByRole("button",{name:"启用",exact:true}).click();
 await expect(plugin).toContainText("已启用");
 await page.getByRole("button",{name:"我的工具",exact:true}).click();
 await expect(page).toHaveURL(/tools\/mine/);
 await expect(page.locator('[class*="mineCard"]')).toHaveCount(2);
 const item=page.locator('[class*="mineCard"]').filter({hasText:"商品采集插件"});
 await item.getByRole("button",{name:"停用"}).click();
 const modal=page.getByRole("dialog");
 await expect(modal).toContainText("确认停用工具");
 await modal.getByRole("button",{name:"确认停用"}).click();
 await expect(item).toHaveCount(0);
 await expect(page.locator('[class*="mineCard"]')).toHaveCount(1);
});
test("my tools search and reset work and launch shows a truthful dialog",async({page})=>{
 await page.goto(base+"/mine");
 await expect(page.locator('[class*="mineCard"]')).toHaveCount(1);
 await page.getByRole("textbox",{name:"搜索我的工具"}).fill("不匹配");
 await page.getByRole("button",{name:"确认",exact:true}).click();
 await expect(page.locator('[class*="mineCard"]')).toHaveCount(0);
 await page.getByRole("button",{name:"重置",exact:true}).click();
 await expect(page.locator('[class*="mineCard"]')).toHaveCount(1);
 await page.getByRole("button",{name:"前往POD素材管理"}).click();
 const modal=page.getByRole("dialog");
 await expect(modal).toContainText("POD素材管理工具 · 进入使用");
 await expect(modal).not.toContainText("公开原型不提供真实工具运行");
 await modal.getByRole("button",{name:"产品图审核"}).click();
 await expect(modal.getByRole("button",{name:"产品图审核"})).toHaveAttribute("aria-pressed","true");
 const geometry=await modal.boundingBox();
 const viewport=page.viewportSize()!;
 expect(geometry).not.toBeNull();
 expect(Math.abs(geometry!.x+geometry!.width/2-viewport.width/2)).toBeLessThan(3);
 expect(Math.abs(geometry!.y+geometry!.height/2-viewport.height/2)).toBeLessThan(3);
 await page.keyboard.press("Escape");
 await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("customization landing matches Figma structure and both entry routes navigate",async({page})=>{
 await page.goto(base+"/custom");
 await expect(page.getByRole("heading",{name:"工具定制",exact:true})).toBeVisible();
 await expect(page.getByRole("heading",{name:"可定制内容"})).toBeVisible();
 await expect(page.locator('[class*="features"] article')).toHaveCount(4);
 await page.getByRole("button",{name:"提交定制需求"}).click();
 await expect(page).toHaveURL(/tools\/custom\/new/);
 await expect(page.getByLabel("工具需求名称")).toBeVisible();
 await page.getByRole("button",{name:"查看定制进度"}).click();
 await expect(page).toHaveURL(/tools\/custom\/progress/);
});
test("custom request form validates consent, confirms and shows local demo progress",async({page})=>{
 await page.goto(base+"/custom/new");
 await page.getByLabel("工具需求名称").fill("测试批量采集工具");
 await page.getByLabel("使用场景").fill("跨境商品信息采集");
 await page.getByLabel("工具功能与执行规则").fill("在授权范围内获取资料并整理字段");
 await page.getByLabel("联系人",{exact:true}).fill("演示用户");
 await page.getByLabel("手机或微信").fill("demo-only");
 const submit=page.getByRole("button",{name:"提交定制需求"});
 await expect(submit).toBeDisabled();
 await page.getByRole("checkbox").check();
 await expect(submit).toBeEnabled();
 await submit.click();
 const modal=page.getByRole("dialog");
 await expect(modal).toContainText("不向平台发送真实申请");
 await page.keyboard.press("Escape");
 await expect(modal).toHaveCount(0);
 await expect(submit).toBeFocused();
 await submit.click();
 await modal.getByRole("button",{name:"确认保存演示记录"}).click();
 await expect(page).toHaveURL(/tools\/custom\/progress/);
 await expect(page.getByText("测试批量采集工具")).toBeVisible();
 await expect(page.getByText(/本地演示需求/)).toBeVisible();
});
test("customization progress shows 5 Figma steps and truly empty state",async({page})=>{
 await page.goto(base+"/custom/progress");
 await expect(page.locator('[class*="progressSteps"] > div')).toHaveCount(5);
 await page.getByRole("button",{name:"暂无记录"}).click();
 await expect(page.getByRole("heading",{name:"暂无记录"})).toBeVisible();
});
test("ultrawide tool pages have centered content with no horizontal overflow",async({page})=>{
 await page.setViewportSize({width:2560,height:1440});
 for(const route of ["/official","/mine","/custom","/custom/new","/custom/progress"]){
  await page.goto(base+route);
  const box=await page.locator('[data-tool-market-page], [data-tool-custom-page]').boundingBox();
  expect(box,route).not.toBeNull();
  expect(box!.width,route).toBeLessThanOrEqual(1601);
  const doc=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  expect(doc.scroll,route).toBeLessThanOrEqual(doc.client+2);
 }
});


test("my tools respects Figma 1168:359 visible content and shows native acquisition details when enabled", async({page})=>{
 await page.goto(base+"/mine");
 const pod=page.locator('[data-figma-tool="POD素材管理工具"]');
 await expect(pod).toBeVisible();
 await expect(page.locator('[data-figma-tool="商品采集插件"]')).toHaveCount(0);
 await expect(pod.getByRole("heading",{name:"功能介绍"})).toBeVisible();
 await expect(pod.getByText("贴图审核与打印")).toBeVisible();
 await expect(pod.getByText("我的素材",{exact:true})).toBeVisible();
 await expect(pod.getByText("灵感市场",{exact:true})).toBeVisible();
 await expect(page.getByRole("button",{name:"前往官方工具"})).toBeVisible();
 await page.getByRole("button",{name:"前往官方工具"}).click();
 await page.locator('[class*="toolCard"]').filter({hasText:"商品采集插件"}).getByRole("button",{name:"启用",exact:true}).click();
 await page.getByRole("button",{name:"我的工具",exact:true}).click();
 const acquisition=page.locator('[data-figma-tool="商品采集插件"]');
 await expect(acquisition).toBeVisible();
 await expect(acquisition).toContainText("采集商品的标题、主图、规格与价格等信息");
 await expect(acquisition).toContainText("安装在客户电脑本地运行");
 await expect(acquisition).toContainText("由平台云端执行");
 await expect(acquisition).toContainText("采集结果统一保存至「数据服务 / 我的数据」");
 await expect(acquisition.getByRole("button",{name:"下载插件"})).toBeVisible();
 await expect(acquisition.getByRole("button",{name:"在线采集"})).toBeVisible();
});


test("my tools adopts Vuexy dark/light surfaces and title indicator without constraining widescreen content",async({page})=>{
 await page.setViewportSize({width:1920,height:1080});
 await page.goto(base+"/mine");
 const region=page.locator('[class*="figmaMine"]');
 const header=region.locator("header").first();
 const title=header.getByRole("heading",{name:"我的工具"});
 await expect(title).toBeVisible();
 const dark=await page.evaluate(()=>{
   const area=document.querySelector('[class*="figmaMine"]') as HTMLElement;
   const heading=area.querySelector("h1") as HTMLElement;
   const card=area.querySelector('[class*="mineCard"]') as HTMLElement;
   return {width:area.getBoundingClientRect().width,bar:getComputedStyle(heading).borderLeftWidth,
     header:getComputedStyle(area.querySelector("header") as HTMLElement).backgroundColor,
     card:getComputedStyle(card).backgroundColor};
 });
 expect(dark.width).toBeGreaterThan(1136);
 expect(dark.bar).toBe("3px");
 expect(dark.header).toBe("rgb(47, 51, 73)");
 expect(dark.card).toBe("rgb(47, 51, 73)");
 await page.evaluate(()=>document.documentElement.classList.add("light"));
 const light=await page.evaluate(()=>{
   const area=document.querySelector('[class*="figmaMine"]') as HTMLElement;
   const heading=area.querySelector("h1") as HTMLElement;
   const card=area.querySelector('[class*="mineCard"]') as HTMLElement;
   return {header:getComputedStyle(area.querySelector("header") as HTMLElement).backgroundColor,
     card:getComputedStyle(card).backgroundColor,bar:getComputedStyle(heading).borderLeftColor};
 });
 expect(light.header).toBe("rgb(255, 255, 255)");
 expect(light.card).toBe("rgb(255, 255, 255)");
 expect(light.bar).toBe("rgb(115, 103, 240)");
});


test("online acquisition has a centered tool-specific modal, not a generic execution warning",async({page})=>{
 await page.goto(base+"/official");
 await page.locator('[class*="toolCard"]').filter({hasText:"商品采集插件"}).getByRole("button",{name:"启用",exact:true}).click();
 await page.getByRole("button",{name:"我的工具",exact:true}).click();
 await page.locator('[data-figma-tool="商品采集插件"]').getByRole("button",{name:"在线采集"}).click();
 const modal=page.getByRole("dialog");
 await expect(modal).toContainText("按实际采集数据条数扣除额度");
 await expect(modal).not.toContainText("公开原型不提供真实工具运行");
 await expect(modal).not.toContainText("工具使用入口");
 await modal.getByRole("button",{name:"确定"}).click();
 await expect(modal).toHaveCount(0);
});
