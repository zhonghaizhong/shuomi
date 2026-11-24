import {expect,test} from "@playwright/test";

/** Account-scoped fixture. Real ASIN references, not a live Amazon scrape. */
test("My Data shows five identifiable Amazon US fixture products in an isolated batch",async({page})=>{
 await page.goto("/shuomi/#/workbench/data/mine");
 const mine=page.locator("[data-my-data-owner]");
 await expect(mine).toBeVisible();
 await expect(mine.getByRole("region",{name:"采集批次",exact:true})).toBeVisible();
 const batch=mine.getByText("Amazon 美国站 · 5个真实商品（模拟采集）");
 await expect(batch).toBeVisible();
 const row=mine.locator("tr").filter({has:batch});
 await expect(row).toContainText("Amazon");
 await expect(row).toContainText("5");
 await row.getByRole("button",{name:"更多"}).click();
 await mine.getByRole("group",{name:/批次操作 Amazon 美国站/}).getByRole("button",{name:"查看商品"}).click();
 const dialog=page.getByRole("dialog",{name:"批次商品"});
 await expect(dialog).toBeVisible();
 await expect(dialog).toContainText("商品数量");
 await expect(dialog).toContainText("5 件");
 await expect(dialog.getByText("CeraVe Moisturizing Cream, Face & Body Moisturizer, 19 oz")).toBeVisible();
 await expect(dialog.getByRole("link",{name:"Amazon 商品链接 · B00TTD9BRC"})).toHaveAttribute("href","https://www.amazon.com/dp/B00TTD9BRC");
 await dialog.getByRole("button",{name:"下一页商品"}).click();
 await expect(dialog.getByText("Amazon Basics AAA Alkaline Batteries, 20-Count, 1.5V")).toBeVisible();
});
