import {expect,test,type Page} from "@playwright/test";

/* Showcase-only contrast/surface regression. Does not change user records. */
const violetPanel="rgb(47, 51, 73)";
const ensureDark=async(page:Page)=>{
 const switcher=page.getByRole("button",{name:"切换深色主题"});
 if(await switcher.count())await switcher.click();
 await expect(page.locator("html")).toHaveClass(/dark/);
};
test("My Data's self-owned product library uses the same approved dark card as its neighbors",async({page})=>{
 await page.goto("/shuomi/#/workbench/data/mine");
 await ensureDark(page);
 await page.getByRole("button",{name:"自有商品库",exact:true}).click();
 const library=page.getByRole("region",{name:"自有商品库"});
 await expect(library).toBeVisible();
 await expect.poll(()=>library.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe(violetPanel);
});
test("Listing waiting stage keeps approved Vuexy dark surfaces after shared styles load",async({page})=>{
 await page.goto("/shuomi/#/workbench/listing/waiting");
 await ensureDark(page);
 const stage=page.locator('[data-listing-stage="waiting"]');
 await expect(stage).toBeVisible();
 const header=stage.locator("header").first();
 await expect.poll(()=>header.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe(violetPanel);
});
