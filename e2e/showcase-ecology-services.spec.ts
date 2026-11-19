import { expect, test } from "@playwright/test";
const root="/shuomi/#/workbench/services";

test("ecology overview keeps three Figma links, four steps and two guidance cards", async ({page})=>{
 await page.goto(root);
 await expect(page.getByRole("heading",{name:"连接专业服务资源，补齐跨境经营关键环节"})).toBeVisible();
 await expect(page.locator('[data-eco-page="home"] article[class*="homeCard"]')).toHaveCount(3);
 await expect(page.locator('[data-eco-page="home"] [class*="howtoGrid"] article')).toHaveCount(4);
 await expect(page.locator('[data-eco-page="home"] [class*="homeNotes"] article')).toHaveCount(2);
 const routes=[["浏览服务市场","market"],["查看我的服务","mine"],["了解入驻要求","join"]];
 for(const [name,route] of routes){
   await page.getByRole("button",{name}).click();
   await expect(page).toHaveURL(new RegExp("/services/"+route+"\\?preview=1"));
   await expect(page.locator('[data-eco-page="'+route+'"]')).toBeVisible();
   await page.goBack();
   await expect(page.locator('[data-eco-page="home"]')).toBeVisible();
 }
});

test("Figma market has four original services, categories and functional search/reset",async({page})=>{
 await page.goto(root+"/market");
 await expect(page.locator('article[class*="serviceCard"]')).toHaveCount(4);
 for(const title of ["公司注册","商标注册","店铺开通服务","店铺代运营"])await expect(page.locator('article[class*="serviceCard"]').filter({hasText:title})).toBeVisible();
 await page.getByRole("button",{name:"企业服务 2"}).click();
 await expect(page.locator('article[class*="serviceCard"]')).toHaveCount(2);
 await page.getByRole("button",{name:"全部服务 4"}).click();
 await page.getByRole("textbox",{name:"搜索服务名称或关键词"}).fill("商标");
 await page.getByRole("button",{name:"确认",exact:true}).click();
 await expect(page.locator('article[class*="serviceCard"]')).toHaveCount(1);
 await expect(page.locator('article[class*="serviceCard"]')).toContainText("商标注册");
 await page.getByRole("button",{name:"重置"}).click();
 await expect(page.locator('article[class*="serviceCard"]')).toHaveCount(4);
});

test("service details and request onboarding are honest keyboard accessible dialogs",async({page})=>{
 await page.goto(root+"/market");
 const company=page.locator('article[class*="serviceCard"]').filter({hasText:"公司注册"});
 await company.getByRole("button",{name:"查看详情"}).click();
 const modal=page.getByRole("dialog");
 await expect(modal).toContainText("申请资料指导");
 await modal.getByRole("button",{name:"提交服务需求"}).click();
 await expect(modal).toContainText("正式提交暂未接入");
 await expect(modal).toContainText("不会创建真实申请");
 await modal.getByRole("button",{name:"返回服务详情"}).click();
 await expect(modal).toContainText("服务内容");
 await page.keyboard.press("Escape");
 await expect(modal).toHaveCount(0);
});

test("my services has four Figma records, status tabs, search, reset, progress drawer",async({page})=>{
 await page.goto(root+"/mine");
 await expect(page.getByRole("heading",{name:"我的服务",exact:true})).toBeVisible();
 const rows=page.locator('[class*="recordRow"]');
 await expect(rows).toHaveCount(4);
 await page.getByRole("button",{name:"待确认 1"}).click();
 await expect(rows).toHaveCount(1);
 await expect(rows).toContainText("商标注册");
 await page.getByRole("button",{name:"全部服务 4"}).click();
 await page.getByRole("textbox",{name:"搜索服务名称或服务编号"}).fill("SV-20260801");
 await page.getByRole("button",{name:"确定",exact:true}).click();
 await expect(rows).toHaveCount(1);
 await rows.first().getByRole("button",{name:"查看进度"}).click();
 const drawer=page.getByRole("dialog");
 await expect(drawer).toContainText("登记资料审核中");
 await expect(drawer).toContainText("办理阶段");
 await page.keyboard.press("Escape");
 await expect(drawer).toHaveCount(0);
 await page.getByRole("button",{name:"重置"}).click();
 await expect(rows).toHaveCount(4);
});

test("provider application keeps Figma four-stage flow and no false submission",async({page})=>{
 await page.goto(root+"/join");
 await expect(page.getByRole("heading",{name:"申请加入",exact:true})).toBeVisible();
 await expect(page.locator('[class*="joinStep"]')).toHaveCount(4);
 await expect(page.getByText("预计 3–7 个工作日")).toBeVisible();
 await page.getByRole("button",{name:"提交入驻申请"}).click();
 const drawer=page.getByRole("dialog");
 await expect(drawer).toContainText("正式入驻表单暂未接入");
 await expect(drawer).toContainText("不会上传、保存或提交信息");
 await drawer.getByRole("button",{name:"了解后续流程"}).click();
 await expect(drawer).toContainText("审核与服务上线");
 await drawer.getByRole("button",{name:"返回资料清单"}).click();
 await expect(drawer).toContainText("申请资料清单");
 await page.keyboard.press("Escape");
 await expect(drawer).toHaveCount(0);
});

test("centered Vuexy layouts at 1440 and 2560 do not overflow or clip key content",async({page})=>{
 for(const [width,height] of [[1440,900],[2560,1440]]){
  await page.setViewportSize({width,height});
  for(const route of ["","/market","/mine","/join"]){
   await page.goto(root+route);
   const pageBox=page.locator("[data-eco-page]");
   const bounds=await pageBox.boundingBox();
   expect(bounds).not.toBeNull();
   expect(bounds!.width).toBeLessThanOrEqual(1601);
   const dim=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
   expect(dim.scroll,route+":"+width).toBeLessThanOrEqual(dim.width+2);
   if(width===2560){expect(bounds!.x).toBeGreaterThan(350);expect(width-bounds!.x-bounds!.width).toBeGreaterThan(250);}
   if(route==="")await page.screenshot({path:"test-results/ecology-home-"+width+".png",fullPage:true});
   if(width===2560&&route==="/market")await page.screenshot({path:"test-results/ecology-market-2560.png",fullPage:true});
  }
 }
});


test("light theme maintains contrast for service points, filters and details",async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto(root+"/market");
 await page.evaluate(()=>document.documentElement.classList.add("light"));
 const color=await page.locator('[class*="serviceCard"] [class*="points"] li').first().evaluate(el=>getComputedStyle(el).color);
 expect(color).toBe("rgb(111, 107, 125)");
 await page.locator('article[class*="serviceCard"]').first().getByRole("button",{name:"查看详情"}).click();
 await expect(page.getByRole("dialog")).toBeVisible();
 await page.screenshot({path:"test-results/ecology-light-market-1440.png",fullPage:true});
 await page.keyboard.press("Escape");
});
