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


/* Browser-computed backgrounds, not a source-token grep. Kept in the existing
   showcase interaction suite, which runs against the built Pages preview. */
test("Tool Market actual dark-mode button and card backgrounds keep approved Vuexy states",async({page})=>{
 await page.goto("/shuomi/#/workbench/tools/official");
 await ensureDark(page);
 const firstCard=page.locator('[class*="toolCard"]').first();
 await expect(firstCard).toBeVisible();
 const background=async(selector:string)=>page.locator(selector).first().evaluate(el=>getComputedStyle(el).backgroundColor);
 await expect.poll(()=>firstCard.evaluate(el=>getComputedStyle(el).backgroundColor))
  .toBe("rgb(47, 51, 73)");
 const primary=firstCard.getByRole("button",{name:"介绍"});
 await expect(primary).toBeVisible();
 const defaultButton=await primary.evaluate(el=>getComputedStyle(el).backgroundColor);
 // Secondary actions must be raised, never white or a light-theme fill.
 expect(defaultButton).toBe("rgb(57, 61, 85)");
 const selected=page.getByRole("button",{name:"采集",exact:true});
 await selected.click();
 await expect(selected).toHaveAttribute("aria-pressed","true");
 await expect.poll(()=>selected.evaluate(el=>getComputedStyle(el).backgroundColor))
  .toBe("rgb(115, 103, 240)");
 await expect.poll(()=>background('[class*="toolCard"]')).toBe("rgb(57, 61, 85)");
});

test("Tool customization real card and button paints retain dark/light separation",async({page})=>{
 await page.goto("/shuomi/#/workbench/tools/custom");
 await ensureDark(page);
 const first=page.locator('[class*="features"] article').first();
 await expect(first).toBeVisible();
 await expect.poll(()=>first.evaluate(el=>getComputedStyle(el).backgroundColor))
  .toBe("rgb(47, 51, 73)");
 const action=page.getByRole("button",{name:"提交定制需求"});
 await expect(action).toBeVisible();
 // Preserve the primary action brand rather than painting it as a neutral card.
 await expect.poll(()=>action.evaluate(el=>getComputedStyle(el).backgroundColor))
  .toBe("rgb(115, 103, 240)");
});
