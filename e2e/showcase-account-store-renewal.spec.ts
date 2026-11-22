import {expect,test} from "@playwright/test";
const root="/shuomi/#/workbench";
test("resource quota store dialogs show owner-scoped stores and renew expired admin store",async({page})=>{
 await page.goto(root+"/account/organization/resources");
 const suite=page.locator("[data-account-suite]");
 const adminRow=suite.getByRole("row").filter({hasText:"林晨"});
 await adminRow.getByRole("button",{name:"查看店铺"}).click();
 const all=page.getByRole("dialog",{name:"企业店铺"});
 await expect(all).toContainText("管理员已到期测试店铺");
 await expect(all).toContainText("同事01已到期测试店铺");
 await expect(all).toContainText("共 11 家");
 await all.getByRole("button",{name:"关闭"}).click();
 const colleagueRow=suite.getByRole("row").filter({hasText:"模拟同事01"});
 await colleagueRow.getByRole("button",{name:"查看店铺"}).click();
 const colleague=page.getByRole("dialog",{name:"店铺详情"});
 await expect(colleague).toContainText("同事01已到期测试店铺");
 await expect(colleague).not.toContainText("管理员已到期测试店铺");
 await colleague.getByRole("button",{name:"关闭"}).click();

 // Both historical expired fixtures already consumed the original two periods.
 // Purchase one period in the local showcase ledger before renewing the admin store.
 await page.goto(root+"/plans/top-up");
 await page.getByRole("spinbutton",{name:"购买期数 · 店铺服务"}).fill("1");
 await page.getByRole("button",{name:"购买续费期数"}).click();
 await page.getByRole("dialog",{name:"确认模拟购买"}).getByRole("button",{name:"确认购买并扣除演示余额"}).click();
 await page.goto(root+"/account/organization/resources");
 const row=page.locator("[data-account-suite]").getByRole("row").filter({hasText:"林晨"});
 await row.getByRole("button",{name:"查看店铺"}).click();
 const listing=page.getByRole("dialog",{name:"企业店铺"});
 const expired=listing.getByRole("row").filter({hasText:"管理员已到期测试店铺"});
 await expect(expired).toContainText("已到期");
 await expired.getByRole("button",{name:"续费"}).click();
 const renewal=page.getByRole("dialog",{name:"店铺续费"});
 await expect(renewal).toContainText("企业资源池可用续费期数：1 期");
 await renewal.getByRole("spinbutton",{name:"续费周期"}).fill("1");
 await expect(renewal).toContainText("续费后到期");
 await renewal.getByRole("button",{name:"确认续费"}).click();
 await expect(renewal).toHaveCount(0);
 await expect(expired).toContainText("即将到期");
 await page.goto(root+"/plans/entitlements");
 await expect(page.locator('[class*="planEntitlementNotes"]').first()).toContainText("已使用：3 期");
});

test("four colleague demo bindings are listed and failed provider lookup is a separate record",async({page})=>{
 await page.goto(root+"/account/organization/resources");
 const suite=page.locator("[data-account-suite]");
 await suite.getByRole("row").filter({hasText:"模拟同事01"}).getByRole("button",{name:"查看店铺"}).click();
 const dialog=page.getByRole("dialog",{name:"店铺详情"});
 for(let i=1;i<=4;i++)await expect(dialog.getByRole("row").filter({hasText:"同事01演示店铺"+String(i).padStart(2,"0")})).toBeVisible();
 await expect(dialog.getByRole("row").filter({hasText:"同事01演示店铺05"})).toHaveCount(0);
 await expect(dialog).toContainText("1 条模拟绑定失败记录");
 await expect(dialog.getByRole("button",{name:"重试获取"})).toHaveCount(0);
});
