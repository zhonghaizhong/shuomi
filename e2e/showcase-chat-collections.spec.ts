import {expect,test} from "@playwright/test";
/** Populate only the isolated Playwright tab; the actual workspace stays empty. */
async function seedCollections(page:import("@playwright/test").Page){
 // Open the showcase first so the app can complete its empty-state hydration.
 // Seed the isolated Playwright browser afterwards, then reload so React reads
 // the fixture before any persistence effects run. This never touches user data.
 await page.goto("/shuomi/#/workbench/ai/chat/recent");
 await expect(page.locator('[data-chat-collection-preview="recent"]')).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>sessionStorage.getItem("shuomi-ai-workbench-reset-20261125-v1"))).toBe("done");
 await page.evaluate(()=>{
  sessionStorage.setItem("shuomi-showcase-chat-collections-v1",JSON.stringify([
   {id:"e2e-conversation-1",title:"一号店转化率下降分析",description:"演示会话",time:"刚刚",favorite:false}
  ]));
 });
 await page.reload();
 await expect(page.getByRole("button",{name:"更多操作：一号店转化率下降分析"})).toBeVisible();
}


test("Figma recent/saved three-dot actions keep demonstration rows in sync",async({page})=>{
 await seedCollections(page);
 const recent=page.locator('[data-chat-collection-preview="recent"]');
 await expect(recent).toBeVisible();
 await recent.getByRole("button",{name:"更多操作：一号店转化率下降分析"}).click();
 await expect(recent.getByRole("menu",{name:"会话操作：一号店转化率下降分析"})).toBeVisible();
 await recent.getByRole("menuitem",{name:"重命名"}).click();
 const rename=recent.getByRole("dialog",{name:"重命名会话"});
 await expect(rename).toBeVisible();
 await rename.getByRole("textbox",{name:"会话名称"}).fill("一号店经营复盘");
 await rename.getByRole("button",{name:"保存"}).click();
 await expect(recent.getByRole("button",{name:"查看会话：一号店经营复盘"})).toBeVisible();

 await recent.getByRole("button",{name:"更多操作：一号店经营复盘"}).click();
 await recent.getByRole("menuitem",{name:"加入收藏会话"}).click();
 await expect(recent.getByText(/已加入收藏会话/)).toBeVisible();
 await page.goto("/shuomi/#/workbench/ai/chat/saved");
 const saved=page.locator('[data-chat-collection-preview="saved"]');
 await expect(saved.getByRole("button",{name:"查看会话：一号店经营复盘"})).toBeVisible();
 await saved.getByRole("button",{name:"更多操作：一号店经营复盘"}).click();
 await saved.getByRole("menuitem",{name:"取消收藏"}).click();
 await expect(saved.getByRole("button",{name:"查看会话：一号店经营复盘"})).toHaveCount(0);
 await page.goto("/shuomi/#/workbench/ai/chat/recent");
 await expect(page.getByRole("button",{name:"查看会话：一号店经营复盘"})).toBeVisible();
 await page.getByRole("button",{name:"更多操作：一号店经营复盘"}).click();
 await page.getByRole("menuitem",{name:"删除会话"}).click();
 const confirmation=page.getByRole("alertdialog",{name:"确认删除会话"});
 await expect(confirmation).toBeVisible();
 await confirmation.getByRole("button",{name:"确认删除"}).click();
 await expect(page.getByRole("button",{name:"查看会话：一号店经营复盘"})).toHaveCount(0);
 await page.reload();
 await expect(page.getByRole("button",{name:"查看会话：一号店经营复盘"})).toHaveCount(0);
});

test("recent/saved action panels inherit light and dark palette",async({page})=>{
 await seedCollections(page);
 // The saved tab must contain an explicitly favorited fixture.
 await page.getByRole("button",{name:"更多操作：一号店转化率下降分析"}).click();
 await page.getByRole("menuitem",{name:"加入收藏会话"}).click();
 await page.goto("/shuomi/#/workbench/ai/chat/saved");
 const root=page.locator('[data-chat-collection-preview="saved"]');
 const toggleLight=page.getByRole("button",{name:"切换浅色主题"});
 if(await toggleLight.isVisible())await toggleLight.click();
 const light=await root.locator('[class*="list"]').first().evaluate(node=>getComputedStyle(node).backgroundColor);
 await expect(root.getByRole("button",{name:/更多操作/}).first()).toBeVisible();
 const toggleDark=page.getByRole("button",{name:"切换深色主题"});
 await toggleDark.click();
 const dark=await root.locator('[class*="list"]').first().evaluate(node=>getComputedStyle(node).backgroundColor);
 expect(light).not.toBe(dark);
});


test("Chat home three entry cards are compact and keep links and examples visible",async({page})=>{
 await page.setViewportSize({width:1600,height:900});
 await page.goto("/shuomi/#/workbench/ai/chat");
 const entries=page.getByRole("region",{name:"会话入口"});
 await expect(entries).toBeVisible();
 const cards=entries.locator(":scope > *");
 await expect(cards).toHaveCount(3);
 const bounds=await cards.evaluateAll(elements=>elements.map(element=>{
  const rect=element.getBoundingClientRect();
  return {top:rect.top,height:rect.height,width:rect.width};
 }));
 for(const card of bounds){
  expect(card.height).toBeLessThan(285);
  expect(card.height).toBeGreaterThan(165);
  expect(Math.abs(card.top-bounds[0].top)).toBeLessThan(3);
 }
 expect(Math.max(...bounds.map(card=>card.height))-Math.min(...bounds.map(card=>card.height))).toBeLessThan(3);
 for(const name of ["新建会话","最近会话","收藏会话"]){
  const card=entries.locator('[class*="landingCard"]').filter({has:page.getByRole("heading",{name,exact:true})});
  await expect(card.getByText("使用示例")).toBeVisible();
 }
 // The create action can live in the page header; entry-card copy must not imply edit permission.
 await expect(entries.getByRole("heading",{name:"新建会话",exact:true})).toBeVisible();
 await expect(entries.getByRole("link",{name:/查看最近会话/})).toBeVisible();
 await expect(entries.getByRole("link",{name:/进入收藏会话/})).toBeVisible();
});

test("new chat keeps task and schedule demo inside one conversation and orders task below chat",async({page})=>{
 await page.goto("/shuomi/#/workbench/ai/chat/new");
 const modes=page.getByRole("complementary",{name:"选择执行方式"});
 await expect(modes).toBeVisible();
 const buttons=modes.locator('[class*="modeList"] > button');
 await expect(buttons.nth(0)).toContainText("创建会话");
 await expect(buttons.nth(1)).toContainText("发起任务");
 await buttons.nth(1).click();
 await page.getByLabel("描述你的业务目标").fill("核对待审核商品并整理处理方案");
 await page.getByRole("button",{name:"确认任务草案"}).click();
 const inline=page.getByLabel("会话内确认任务");
 await expect(inline).toBeVisible();
 await expect(page.getByRole("dialog",{name:/确认发起任务/})).toHaveCount(0);
 await expect(inline).toContainText("核对待审核商品并整理处理方案");
 await inline.getByRole("button",{name:"确认并继续"}).click();
 await expect(inline).toHaveCount(0);
 const thread=page.getByLabel("聊天记录");
 await expect(thread).toContainText("核对待审核商品并整理处理方案");
 await expect(thread).toContainText("任务中心");
 await page.getByRole("button",{name:"＋ 新会话"}).click();
 await modes.getByRole("button",{name:"执行定时任务"}).click();
 await page.getByLabel("描述你的业务目标").fill("每周检查待审核商品");
 await page.getByRole("button",{name:"确认定时计划"}).click();
 const schedule=page.getByLabel("会话内确认任务");
 await expect(schedule.getByLabel("定时安排")).toBeVisible();
 await expect(page.getByRole("dialog",{name:/确认执行定时任务/})).toHaveCount(0);
 await schedule.getByRole("button",{name:"确认并继续"}).click();
 await expect(thread).toContainText("定时任务演示草案");
});
