import {expect,test} from "@playwright/test";

test("Shuomi selected supply catalog demo can collect a product with repository images to the current account",async({page})=>{
 await page.goto("/shuomi/#/workbench/supply/selected");
 const market=page.locator('[data-selected-market="true"]');
 await expect(market.getByRole("heading",{name:"硕米优选",level:1})).toBeVisible();
 const fixture=market.locator('[data-selected-product="SMYX-DEMO-001"]');
 await expect(fixture).toBeVisible();
 const cover=fixture.getByRole("img",{name:"纯棉圆领短袖T恤",exact:true});
 await expect(cover).toHaveAttribute("src",/black-01\.png$/);
 await expect.poll(()=>cover.evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
 const frame=await cover.boundingBox();expect(Math.abs(frame!.width-frame!.height)).toBeLessThan(2);
 await expect(fixture.getByText("纯棉圆领短袖T恤")).toBeVisible();
 await fixture.getByRole("button",{name:"查看详情"}).click();
 const detail=page.getByRole("dialog",{name:"优选商品详情"});
 await expect(detail).toBeVisible();
 await expect(detail.getByText("SMYX-001-BK-M")).toBeVisible();
 await expect(detail.getByText("演示供货商 · 织造工厂")).toBeVisible();
 await detail.getByRole("button",{name:"加入采集批次"}).click();
 const collect=page.getByRole("dialog",{name:"加入我的采集批次"});
 await expect(collect).toBeVisible();
 await collect.getByRole("textbox",{name:"新批次名称"}).fill("优选商品测试批次");
 await collect.getByRole("button",{name:"确认加入"}).click();
 await expect(market.getByRole("status")).toContainText("优选商品测试批次");
 await page.goto("/shuomi/#/workbench/data/mine");
 await expect(page.getByText("优选商品测试批次")).toBeVisible();
});

test("selected catalog supports multi-select and preserves private batch ownership",async({page})=>{
 await page.goto("/shuomi/#/workbench/supply/selected");
 const market=page.locator('[data-selected-market="true"]');
 await market.getByRole("checkbox",{name:"选择纯棉圆领短袖T恤"}).check();
 await market.getByRole("checkbox",{name:"选择宽松连帽卫衣"}).check();
 await expect(market.getByText("已选择 2 件商品")).toBeVisible();
 await market.getByRole("button",{name:"加入我的采集批次"}).click();
 const collect=page.getByRole("dialog",{name:"加入我的采集批次"});
 await expect(collect).toContainText("已选择 2 件商品");
 await collect.getByRole("textbox",{name:"新批次名称"}).fill("双商品测试批次");
 await collect.getByRole("button",{name:"确认加入"}).click();
 await expect(market.getByRole("status")).toContainText("2 件商品");
});

test("selected catalog shows renamed metrics, MOQ slider and country shipping details",async({page})=>{
 await page.goto("/shuomi/#/workbench/supply/selected");
 const market=page.locator('[data-selected-market="true"]');
 await expect(market.getByText("货盘商品",{exact:true})).toBeVisible();
 await expect(market.getByText("供应商数量",{exact:true})).toBeVisible();
 const moq=market.getByRole("slider",{name:"起订量"});
 await expect(moq).toHaveValue("100");
 await moq.fill("1");
 await expect(market.locator('[data-selected-product="SMYX-DEMO-001"]')).toBeVisible();
 await expect(market.locator('[data-selected-product="SMYX-DEMO-003"]')).toHaveCount(0);
 await moq.fill("100");
 await market.locator('[data-selected-product="SMYX-DEMO-001"]').getByRole("button",{name:"查看详情"}).click();
 const dialog=page.getByRole("dialog",{name:"优选商品详情"});
 await expect(dialog.getByText("包装重量")).toBeVisible();
 await expect(dialog.getByText("包装体积")).toBeVisible();
 await expect(dialog.getByRole("heading",{name:"各国家运费与配送时效"})).toBeVisible();
 await expect(dialog.getByText("29.00",{exact:false})).toBeVisible();
 await expect(dialog.getByText("运输时效不包含备货")).toBeVisible();
});

test("selected product detail uses square gallery, SKU switching and per-item service fees",async({page})=>{
 await page.goto("/shuomi/#/workbench/supply/selected");
 const market=page.locator('[data-selected-market="true"]');
 await market.locator('[data-selected-product="SMYX-DEMO-001"]').getByRole("button",{name:"查看详情"}).click();
 const detail=page.getByRole("dialog",{name:"优选商品详情"});
 await expect(detail).toBeVisible();
 await expect(detail.getByLabel("商品图片轮播")).toBeVisible();
 await expect(detail.getByText("质检 / 打包 / 贴标")).toBeVisible();
 await expect(detail.locator('[class*="galleryColumn"] [aria-label="目标国家成本测算"]')).toBeVisible();
 await expect(detail.getByRole("heading",{name:"目标国家及成本"})).toBeVisible();
 await detail.getByRole("button",{name:"选择变体 黑色 / L"}).click();
 await expect(detail.getByText("SKU：SMYX-001-BK-L")).toBeVisible();
 await expect(detail.getByText("库存：900")).toBeVisible();
 await expect(detail.getByRole("button",{name:"选择变体 黑色 / L"})).toHaveAttribute("aria-pressed","true");
 await detail.getByRole("button",{name:"选择变体 白色 / M"}).click();
 await expect(detail.getByText("SKU：SMYX-001-WH-M")).toBeVisible();
 const photo=detail.getByLabel("商品图片轮播").getByRole("img");
 await expect(photo).toHaveAttribute("src",/white-01\.png$/);
 await expect.poll(()=>photo.evaluate((img:HTMLImageElement)=>img.naturalWidth)).toBeGreaterThan(0);
 await detail.getByRole("button",{name:"下一张商品图片"}).click();
 await expect(photo).toHaveAttribute("src",/white-02\.png$/);
 await detail.getByRole("button",{name:"选择变体 黑色 / M"}).click();
 await expect(photo).toHaveAttribute("src",/black-01\.png$/);
 await expect(detail.getByRole("button",{name:/查看商品图片 [1-4]/})).toHaveCount(4);
});

test("destination updates per-SKU cost while collection saves every selected variant and country",async({page})=>{
 await page.goto("/shuomi/#/workbench/supply/selected");
 const market=page.locator('[data-selected-market="true"]');
 await market.locator('[data-selected-product="SMYX-DEMO-001"]').getByRole("button",{name:"查看详情"}).click();
 const detail=page.getByRole("dialog",{name:"优选商品详情"});
 await detail.getByRole("combobox",{name:"选择目标国家"}).selectOption("美国");
 const estimate=detail.getByLabel("目标国家成本测算");
 await expect(estimate).toContainText("¥60.50");
 await detail.getByRole("combobox",{name:"选择目标国家"}).selectOption("加拿大");
 await expect(estimate).toContainText("¥68.50");
 await detail.getByRole("button",{name:"加入采集批次"}).click();
 const collect=page.getByRole("dialog",{name:"加入我的采集批次"});
 await expect(collect.getByRole("combobox",{name:"采集目标国家"})).toHaveCount(0);
 await collect.getByRole("radio",{name:"按总成本采集"}).check();
 await expect(collect.getByText("已选 4 / 4 个")).toBeVisible();
 await collect.getByRole("checkbox",{name:"采集变体 纯棉圆领短袖T恤 黑色 / L"}).uncheck();
 await expect(collect.getByText("已选 3 / 4 个")).toBeVisible();
 await collect.getByRole("textbox",{name:"新批次名称"}).fill("多站点成本变体测试批次");
 await collect.getByRole("button",{name:"确认加入"}).click();
 await expect(market.getByRole("status")).toContainText("3 个选定 SKU");
 const collected=await page.evaluate(()=>{
  const raw=sessionStorage.getItem("shuomi:demo-collection-batches-v1:SM-ENT-000001");
  if(!raw)return [];
  return (JSON.parse(raw) as Array<{name:string;products:Array<{variantCount?:number;variantDetails?:Array<{sku:string}>;destinationCosts?:Array<{skuId:string;country:string;unitTotal:number|null}>}>}>)
   .filter(b=>b.name==="多站点成本变体测试批次").flatMap(b=>b.products);
 });
 expect(collected).toHaveLength(1);
 expect(collected[0].variantCount).toBe(3);
 expect(collected[0].variantDetails?.some(v=>v.sku==="SMYX-001-BK-L")).toBe(false);
 expect(collected[0].destinationCosts).toHaveLength(6);
 expect(collected[0].destinationCosts?.some(q=>q.country==="美国"&&q.unitTotal===60.5)).toBe(true);
 expect(collected[0].destinationCosts?.some(q=>q.country==="加拿大"&&q.unitTotal===68.5)).toBe(true);
});
test("supply-only collection can use all variants with no country selector",async({page})=>{
 await page.goto("/shuomi/#/workbench/supply/selected");
 const market=page.locator('[data-selected-market="true"]');
 await market.locator('[data-selected-product="SMYX-DEMO-001"]').getByRole("button",{name:"加入采集批次"}).click();
 const collect=page.getByRole("dialog",{name:"加入我的采集批次"});
 await expect(collect.getByText("已选 4 / 4 个")).toBeVisible();
 await collect.getByRole("radio",{name:"只采集供货价格"}).check();
 await collect.getByRole("textbox",{name:"新批次名称"}).fill("仅供货价全部变体");
 await collect.getByRole("button",{name:"确认加入"}).click();
 await expect(market.getByRole("status")).toContainText("仅供货价格");
});
test("bulk collection supports each product's variant selection and prevents an empty selection",async({page})=>{
 await page.goto("/shuomi/#/workbench/supply/selected");
 const market=page.locator('[data-selected-market="true"]');
 await market.getByRole("checkbox",{name:"选择纯棉圆领短袖T恤"}).check();
 await market.getByRole("checkbox",{name:"选择宽松连帽卫衣"}).check();
 await market.getByRole("button",{name:"加入我的采集批次"}).click();
 const collect=page.getByRole("dialog",{name:"加入我的采集批次"});
 await expect(collect.getByText("已选 8 / 8 个")).toBeVisible();
 await collect.getByRole("checkbox",{name:"全选宽松连帽卫衣变体"}).uncheck();
 await expect(collect.getByText("已选 4 / 8 个")).toBeVisible();
 await collect.getByRole("button",{name:"确认加入"}).click();
 await expect(collect.getByRole("alert")).toContainText("至少选择一个 SKU");
 await collect.getByRole("checkbox",{name:"采集变体 宽松连帽卫衣 黑色 / M"}).check();
 await collect.getByRole("radio",{name:"按总成本采集"}).check();
 await collect.getByRole("textbox",{name:"新批次名称"}).fill("批量部分变体成本批次");
 await collect.getByRole("button",{name:"确认加入"}).click();
 await expect(market.getByRole("status")).toContainText("5 个选定 SKU");
});

test("existing batch chooser is synced with My Data and imports preserve origin provenance",async({page})=>{
 await page.goto("/shuomi/#/workbench/supply/selected");
 const market=page.locator('[data-selected-market="true"]');
 await market.locator('[data-selected-product="SMYX-DEMO-001"]').getByRole("button",{name:"加入采集批次"}).click();
 const collect=page.getByRole("dialog",{name:"加入我的采集批次"});
 await collect.getByRole("radio",{name:"加入已有批次"}).check();
 const select=collect.getByRole("combobox",{name:"选择已有批次"});
 // The standard Amazon/1688 batches are real entries in the same browser store
 // and must not be hidden by a previous supply-only source filter.
 await expect(select.locator("option").filter({hasText:"SDS"})).toHaveCount(1);
 await expect(select.locator("option").filter({hasText:"Amazon 美国站"})).toHaveCount(1);
 const amazon=await select.locator("option").evaluateAll(options=>
  options.find(o=>o.textContent?.includes("Amazon 美国站"))?.getAttribute("value")||"");
 expect(amazon).not.toBe("");
 await select.selectOption(amazon);
 await collect.getByRole("button",{name:"确认加入"}).click();
 await expect(market.getByRole("status")).toContainText("已将 1 件商品");
 await page.goto("/shuomi/#/workbench/data/mine");
 const myData=page.locator("[data-my-data-owner]");
 await expect(myData.getByRole("combobox",{name:"采集来源"})).toContainText("混合来源");
 await myData.getByRole("combobox",{name:"采集来源"}).selectOption("混合来源");
 await myData.getByRole("button",{name:"确认"}).first().click();
 await expect(myData.getByText("Amazon 美国站 · 7个真实商品（模拟采集）",{exact:true})).toBeVisible();
});

test("recollecting same product merges only new SKU rows into selected My Data batch",async({page})=>{
 await page.goto("/shuomi/#/workbench/supply/selected");
 const market=page.locator('[data-selected-market="true"]');
 const card=market.locator('[data-selected-product="SMYX-DEMO-001"]');
 await card.getByRole("button",{name:"加入采集批次"}).click();
 let collect=page.getByRole("dialog",{name:"加入我的采集批次"});
 await collect.getByRole("checkbox",{name:"全选纯棉圆领短袖T恤变体"}).uncheck();
 await collect.getByRole("checkbox",{name:"采集变体 纯棉圆领短袖T恤 黑色 / M"}).check();
 await collect.getByRole("textbox",{name:"新批次名称"}).fill("SKU增量合并批次");
 await collect.getByRole("button",{name:"确认加入"}).click();
 await expect(market.getByRole("status")).toContainText("1 个选定 SKU");
 await card.getByRole("button",{name:"加入采集批次"}).click();
 collect=page.getByRole("dialog",{name:"加入我的采集批次"});
 await collect.getByRole("radio",{name:"加入已有批次"}).check();
 await collect.getByRole("combobox",{name:"选择已有批次"}).selectOption(await collect.getByRole("combobox",{name:"选择已有批次"}).locator("option").filter({hasText:"SKU增量合并批次"}).getAttribute("value")||"");
 await collect.getByRole("checkbox",{name:"全选纯棉圆领短袖T恤变体"}).uncheck();
 await collect.getByRole("checkbox",{name:"采集变体 纯棉圆领短袖T恤 白色 / L"}).check();
 await collect.getByRole("button",{name:"确认加入"}).click();
 await expect(market.getByRole("status")).toContainText("SKU增量合并批次");
 const found=await page.evaluate(()=>{
  const arr=JSON.parse(sessionStorage.getItem("shuomi:demo-collection-batches-v1:SM-ENT-000001")||"[]") as Array<{name:string;products:Array<{supplyProductId?:string;variantDetails?:Array<{sku:string}>}>}>;
  return arr.find(b=>b.name==="SKU增量合并批次")?.products||[];
 });
 expect(found).toHaveLength(1);
 expect(found[0].variantDetails?.map(v=>v.sku).sort()).toEqual(["SMYX-001-BK-M","SMYX-001-WH-L"]);
 await card.getByRole("button",{name:"加入采集批次"}).click();
 collect=page.getByRole("dialog",{name:"加入我的采集批次"});
 await collect.getByRole("radio",{name:"加入已有批次"}).check();
 await collect.getByRole("combobox",{name:"选择已有批次"}).selectOption(await collect.getByRole("combobox",{name:"选择已有批次"}).locator("option").filter({hasText:"SKU增量合并批次"}).getAttribute("value")||"");
 await collect.getByRole("checkbox",{name:"全选纯棉圆领短袖T恤变体"}).uncheck();
 await collect.getByRole("checkbox",{name:"采集变体 纯棉圆领短袖T恤 白色 / L"}).check();
 await collect.getByRole("button",{name:"确认加入"}).click();
 await expect(collect.getByRole("alert")).toContainText("没有新增内容");
});
