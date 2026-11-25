import {expect,test} from "@playwright/test";

test("Shuomi selected supply catalog demo can collect a blank-image product to the current account",async({page})=>{
 await page.goto("/shuomi/#/workbench/supply/selected");
 const market=page.locator('[data-selected-market="true"]');
 await expect(market.getByRole("heading",{name:"硕米优选",level:1})).toBeVisible();
 const fixture=market.locator('[data-selected-product="SMYX-DEMO-001"]');
 await expect(fixture).toBeVisible();
 await expect(fixture.getByText("暂无商品图片")).toBeVisible();
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
