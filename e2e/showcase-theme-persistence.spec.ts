import { expect, test } from "@playwright/test";

const path="/shuomi/#/workbench/ai/projects/recent";

test("light mode remains selected on refresh and deep links",async({page})=>{
 await page.goto(path);
 await page.getByRole("button",{name:"切换浅色主题"}).click();
 await expect(page.locator("html")).toHaveClass(/light/);
 await expect(page.getByRole("button",{name:"切换深色主题"})).toBeVisible();
 await page.reload();
 await expect(page.locator("html")).toHaveClass(/light/);
 await expect(page.getByRole("button",{name:"切换深色主题"})).toBeVisible();
 await page.goto("/shuomi/#/workbench/ai/knowledge/official");
 await expect(page.locator("html")).toHaveClass(/light/);
 const shell=page.locator(".showcase-shell");
 const bg=await shell.evaluate(el=>getComputedStyle(el).backgroundColor);
 expect(bg).not.toBe("rgb(37, 41, 60)");
 const card=await shell.evaluate(el=>getComputedStyle(el).getPropertyValue("--card").trim());
 expect(card.toLowerCase()).toMatch(/#fff|#ffffff|rgb\(255, ?255, ?255\)/);
});

test("project center surface, filters, and table use light surfaces",async({page})=>{
 await page.goto(path);
 await page.getByRole("button",{name:"切换浅色主题"}).click();
 const content=page.locator('[class*="libraryDetailPreview"]');
 await expect(content).toBeVisible();
 for (const name of ["header","table","projectTableHead","searchRow"]) {
   const element=content.locator('[class*="'+name+'"]').first();
   if (await element.count() && await element.isVisible()) {
     const background=await element.evaluate(el=>getComputedStyle(el).backgroundColor);
     const rgb=background.match(/\d+/g)?.slice(0,3).map(Number)??[];
     if (rgb.length===3) expect(Math.min(...rgb), name+" "+background).toBeGreaterThanOrEqual(225);
   }
 }
});
