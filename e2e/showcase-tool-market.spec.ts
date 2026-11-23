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
test("product acquisition local plugin can be installed and used in a truthful simulation",async({page})=>{
 await page.goto(base+"/official");
 await page.locator('[class*="toolCard"]').filter({hasText:"商品采集插件"}).getByRole("button",{name:"介绍"}).click();
 const modal=page.getByRole("dialog");
 await expect(modal).toContainText("本地插件采集");
 await expect(modal).toContainText("不会安装浏览器插件");
 await modal.getByRole("button",{name:"模拟安装插件"}).click();
 await expect(modal).toContainText("已模拟安装");
 const localBox=await modal.boundingBox();
 const localViewport=page.viewportSize()!;
 expect(localBox).not.toBeNull();
 expect(Math.abs(localBox!.x+localBox!.width/2-localViewport.width/2)).toBeLessThan(4);
 expect(Math.abs(localBox!.y+localBox!.height/2-localViewport.height/2)).toBeLessThan(4);
 await modal.getByRole("textbox",{name:"商品链接 *"}).fill("https://example.com/product/abc");
 await modal.getByRole("textbox",{name:"商品标题（演示） *"}).fill("演示T恤");
 await modal.getByRole("button",{name:"模拟插件采集"}).click();
 await expect(modal).toContainText("模拟采集已完成");
 await expect(modal).toContainText("演示T恤");
 await modal.getByRole("button",{name:"关闭",exact:true}).click();
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
 await expect(modal).toContainText("贴图审核、素材复用与官方灵感，一处管理");
 await expect(modal).toContainText("生成 → 暂存待审 → 审核通过后贴图 → 订单查图打印");
 await expect(modal).toContainText("贴图审核与打印");
 await expect(modal).toContainText("官方提供示例图片及生成指令");
 await expect(modal.getByRole("button",{name:"知道了"})).toBeVisible();
 await expect(modal).not.toContainText("公开原型不提供真实工具运行");
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


test("online collection matches Figma source chooser and Amazon/1688 settings",async({page})=>{
 await page.goto(base+"/official");
 await page.locator('[class*="toolCard"]').filter({hasText:"商品采集插件"}).getByRole("button",{name:"启用",exact:true}).click();
 await page.getByRole("button",{name:"我的工具",exact:true}).click();
 await page.locator('[data-figma-tool="商品采集插件"]').getByRole("button",{name:"在线采集"}).click();
 const modal=page.getByRole("dialog");
 await expect(modal.getByRole("heading",{name:"选择在线采集来源"})).toBeVisible();
 await expect(modal).toContainText("当前支持亚马逊和1688，请选择对应商品来源。");
 await expect(modal).toContainText("两种在线采集均按实际采集的数据条数扣除数据额度。");
 const viewport=page.viewportSize()!;
 const position=await modal.boundingBox();
 expect(position).not.toBeNull();
 expect(Math.abs(position!.x+position!.width/2-viewport.width/2)).toBeLessThan(4);
 expect(Math.abs(position!.y+position!.height/2-viewport.height/2)).toBeLessThan(4);
 await modal.getByRole("button",{name:"进入亚马逊采集"}).click();
 await expect(modal.getByRole("heading",{name:"亚马逊在线采集"})).toBeVisible();
 await expect(modal.getByLabel("站点",{exact:true})).toHaveValue("美国站");
 await modal.getByRole("button",{name:"按关键词"}).click();
 await expect(modal.getByRole("textbox",{name:"关键词"})).toBeVisible();
 await modal.getByRole("button",{name:"指定商品"}).click();
 await modal.getByRole("button",{name:"ASIN"}).click();
 await modal.getByRole("textbox",{name:"ASIN"}).fill("B012345678");
 await modal.getByRole("checkbox",{name:"采集后自动转入待上传"}).check();
 await modal.getByRole("button",{name:"设置规则"}).click();
 await expect(modal.getByRole("heading",{name:"亚马逊采集规则"})).toBeVisible();
 await expect(modal).toContainText("不符合规则的商品仍保留在「我的数据」中。");
 await modal.getByRole("button",{name:"保存模板"}).click();
 await modal.getByRole("button",{name:"开始采集"}).click();
 await expect(modal).toContainText("采集任务已模拟完成");
 await expect(modal).toContainText("1 条亚马逊演示数据");
 await modal.getByRole("button",{name:"知道了"}).click();
 await expect(modal).toHaveCount(0);
 await page.locator('[data-figma-tool="商品采集插件"]').getByRole("button",{name:"在线采集"}).click();
 await modal.getByRole("button",{name:"进入1688采集"}).click();
 await expect(modal.getByRole("heading",{name:"1688在线采集"})).toBeVisible();
 await modal.getByRole("textbox",{name:"商品链接"}).fill("https://detail.1688.com/offer/123456789.html");
 await modal.getByRole("button",{name:"设置规则"}).click();
 await expect(modal.getByRole("heading",{name:"1688采集规则"})).toBeVisible();
 await expect(modal).toContainText("规则只影响后续处理，不影响采集范围。");
 await modal.getByRole("button",{name:"保存设置"}).click();
 await modal.getByRole("button",{name:"开始采集"}).click();
 await expect(modal).toContainText("1 条1688演示数据");
});

test("listing use dialog follows the original Figma introduction instead of invented feature tabs",async({page})=>{
 await page.goto(base+"/official");
 await page.locator('[class*="toolCard"]').filter({hasText:"自有商品刊登工具"}).getByRole("button",{name:"启用",exact:true}).click();
 await page.getByRole("button",{name:"我的工具",exact:true}).click();
 await page.locator('[data-figma-tool="自有商品刊登工具"]').getByRole("button",{name:"进入自有商品刊登"}).click();
 const modal=page.getByRole("dialog");
 await expect(modal.getByRole("heading",{name:"自有商品刊登工具"})).toBeVisible();
 await expect(modal).toContainText("自有商品导入 · 平台适配 · 快速刊登");
 await expect(modal).toContainText("支持自有商品信息导入、校验与批量整理。");
 await expect(modal).toContainText("本地商品");
 await expect(modal).toContainText("信息校验");
 await expect(modal).toContainText("平台适配");
 await expect(modal).toContainText("启用后在「我的工具」进入自有商品待上传流程。");
 await expect(modal.getByRole("button",{name:"知道了"})).toBeVisible();
 await expect(modal.getByRole("button",{name:"自有商品导入"})).toHaveCount(0);
 await modal.getByRole("button",{name:"知道了"}).click();
 await expect(modal).toHaveCount(0);
});

test("1688 online collection creates ten demo products and shows only owned batches in My Data",async({page})=>{
 await page.goto("/shuomi/#/workbench/data/mine");
 const mine=page.getByRole("region",{name:"采集批次",exact:true});
 await expect(mine).toContainText("1688 在线采集 · 10个产品（模拟）");
 await expect(mine).toContainText("1 批");
 await mine.getByRole("button",{name:"更多"}).click();
 await mine.getByRole("button",{name:"查看商品"}).click();
 const details=page.getByRole("dialog",{name:"批次商品"});
 await expect(details).toContainText("批次商品");
 await expect(details).toContainText("来源平台");
 await expect(details).toContainText("商品数量");
 await expect(details.getByRole("row")).toHaveCount(5);
 await expect(details).toContainText("纯棉圆领短袖T恤");
 await details.getByRole("button",{name:"下一页商品"}).click();
 await expect(details).toContainText("不锈钢保温水杯");
 await expect(details.getByRole("button",{name:"下载当前批次"})).toBeVisible();
 await details.getByRole("button",{name:"关闭批次商品弹窗"}).click();
 await page.goto(base+"/official");
 await page.locator('[class*="toolCard"]').filter({hasText:"商品采集插件"}).getByRole("button",{name:"启用",exact:true}).click();
 await page.getByRole("button",{name:"我的工具",exact:true}).click();
 await page.locator('[data-figma-tool="商品采集插件"]').getByRole("button",{name:"在线采集"}).click();
 const modal=page.getByRole("dialog");
 await modal.getByRole("button",{name:"进入1688采集"}).click();
 const links=Array.from({length:10},(_,i)=>"https://detail.1688.com/offer/"+(980000000+i)+".html").join("\n");
 await modal.getByRole("textbox",{name:"商品链接"}).fill(links);
 await modal.getByRole("button",{name:"开始采集"}).click();
 await expect(modal).toContainText("已记录 10 条1688演示数据");
 await modal.getByRole("button",{name:"知道了"}).click();
 await page.goto("/shuomi/#/workbench/data/mine");
 await expect(page.getByRole("region",{name:"采集批次",exact:true})).toContainText("2 批");
 await page.getByRole("region",{name:"采集批次",exact:true}).getByRole("button",{name:"更多"}).first().click();
 await page.getByRole("region",{name:"采集批次",exact:true}).getByRole("button",{name:"查看商品"}).click();
 await expect(page.getByRole("dialog",{name:"批次商品"}).locator("tbody tr")).toHaveCount(4);
 await expect(page.getByRole("dialog",{name:"批次商品"})).toContainText("商品列表");
});

test("My Data follows Figma batch screen and archives only selected demo batches",async({page})=>{
 await page.goto("/shuomi/#/workbench/data/mine");
 await expect(page.getByRole("region",{name:"采集批次流程说明"})).toContainText("原始商品数据");
 await expect(page.getByRole("region",{name:"数据筛选"})).toBeVisible();
 const region=page.getByRole("region",{name:"采集批次",exact:true});
 await expect(region.getByRole("columnheader",{name:/批次名称/})).toBeVisible();
 for(const name of ["产品来源","总量","符合","过滤","创建时间","上传状态","操作"]){await expect(region.getByRole("columnheader",{name})).toBeVisible()}
 await region.getByRole("button",{name:"更多"}).click();
 await region.getByRole("button",{name:"归档批次"}).click();
 await expect(region).toContainText("暂无采集批次");
 await region.getByRole("button",{name:"已归档"}).click();
 await expect(region).toContainText("1688 在线采集 · 10个产品（模拟）");
 await region.getByRole("button",{name:"更多"}).click();
 await region.getByRole("button",{name:"恢复批次"}).click();
 await region.getByRole("button",{name:"返回批次"}).click();
 await expect(region).toContainText("1688 在线采集 · 10个产品（模拟）");
 await region.getByRole("button",{name:"管理批次"}).click();
 await expect(page.getByRole("dialog",{name:"管理采集批次"})).toBeVisible();
});

test("batch product dialog matches provided layout, supports item archive and pagination",async({page})=>{
 await page.goto("/shuomi/#/workbench/data/mine");
 const region=page.getByRole("region",{name:"采集批次",exact:true});
 const filters=page.getByRole("region",{name:"数据筛选"});
 await expect(filters.getByRole("textbox",{name:"搜索采集批次"})).toBeVisible();
 await expect(filters.getByRole("combobox",{name:"采集来源"})).toBeVisible();
 await expect(filters.getByRole("combobox",{name:"上传状态"})).toBeVisible();
 await region.getByRole("button",{name:"更多"}).click();
 await region.getByRole("button",{name:"查看商品"}).click();
 const dialog=page.getByRole("dialog",{name:"批次商品"});
 await expect(dialog).toContainText("在线采集");
 await expect(dialog).toContainText("原始资料保留");
 await expect(dialog.getByRole("row")).toHaveCount(5);
 await dialog.getByRole("button",{name:"更多"}).first().click();
 await dialog.getByRole("button",{name:"归档",exact:true}).click();
 await expect(dialog).toContainText("已归档所选演示商品");
 await expect(dialog.locator("tbody tr")).toHaveCount(4);
 await dialog.getByRole("button",{name:/已归档/}).click();
 await expect(dialog.locator("tbody tr")).toHaveCount(1);
 await dialog.getByRole("button",{name:"更多"}).click();
 await dialog.getByRole("button",{name:"恢复",exact:true}).click();
 await dialog.getByRole("button",{name:"当前商品"}).click();
 await expect(dialog.locator("tbody tr")).toHaveCount(4);
});

test("1688 demo products provide realistic sample photos, simulated prices, variants and split detail gallery",async({page})=>{
 await page.goto("/shuomi/#/workbench/data/mine");
 const batch=page.getByRole("region",{name:"采集批次",exact:true});
 await batch.getByRole("button",{name:"更多"}).click();
 await batch.getByRole("button",{name:"查看商品"}).click();
 const modal=page.getByRole("dialog",{name:"批次商品"});
 await expect(modal).toContainText("¥19.80 起");
 await expect(modal).toContainText("多变体 · 8 规格");
 const thumb=modal.getByRole("button",{name:/放大商品图片 纯棉圆领短袖T恤/});
 await expect(thumb.locator("img")).toHaveAttribute("src",/images.unsplash.com/);
 await thumb.click();
 const detail=page.getByRole("dialog",{name:"商品详情"});
 await expect(detail).toContainText("纯棉圆领短袖T恤");
 await expect(detail).toContainText("模拟参考价格，非真实供应商报价");
 await expect(detail).toContainText("白色 / S");
 await expect(page.getByRole("img",{name:"纯棉圆领短袖T恤的放大演示参考图"})).toBeVisible();
 await page.getByRole("button",{name:"查看第2张图片"}).click();
 await expect(page.getByRole("button",{name:"查看第2张图片"})).toHaveAttribute("aria-pressed","true");
 await expect(detail.getByRole("button",{name:"下载商品数据"})).toBeVisible();
 await detail.getByRole("button",{name:"关闭商品详情"}).click();
 await expect(detail).toHaveCount(0);
 await modal.getByRole("button",{name:"更多"}).first().click();
 await modal.getByRole("button",{name:"查看",exact:true}).click();
 await expect(page.getByRole("dialog",{name:"商品详情"})).toBeVisible();
});

test("batch product image viewer stays compact and price sliders filter by a selected range",async({page})=>{
 await page.goto("/shuomi/#/workbench/data/mine");
 const batch=page.getByRole("region",{name:"采集批次",exact:true});
 await batch.getByRole("button",{name:"更多"}).click();
 await batch.getByRole("button",{name:"查看商品"}).click();
 const modal=page.getByRole("dialog",{name:"批次商品"});
 await modal.getByRole("button",{name:"价格区间"}).click();
 const slider=modal.getByRole("group",{name:"滑动筛选价格"});
 await expect(slider).toBeVisible();
 await slider.getByRole("slider",{name:"最高价格滑块"}).fill("20");
 await expect(modal).toContainText("¥19.80 起");
 await expect(modal).not.toContainText("¥42.50 起");
 await slider.getByRole("button",{name:"确定"}).click();
 await modal.getByRole("button",{name:/放大商品图片 纯棉圆领短袖T恤/}).click();
 const viewer=page.getByRole("dialog",{name:"商品详情"});
 await expect(viewer).toBeVisible();
 const rect=await page.locator('[class*="detailOverlay"]').boundingBox();
 const viewport=page.viewportSize();
 expect(rect).not.toBeNull();
 expect(viewport).not.toBeNull();
 expect(rect!.width).toBeLessThan(viewport!.width);
 expect(rect!.height).toBeLessThan(viewport!.height);
 await viewer.getByRole("button",{name:"关闭商品详情"}).click();
 await modal.getByRole("button",{name:/¥0 – ¥20/}).click();
 await modal.getByRole("group",{name:"滑动筛选价格"}).getByRole("button",{name:"重置"}).click();
 await expect(modal).toContainText("¥42.50 起");
});
