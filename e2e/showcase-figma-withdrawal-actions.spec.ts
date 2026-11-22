import {expect,test} from "@playwright/test";
async function configureDemoPayout(dialog:import("@playwright/test").Locator,identifier:string){
 await dialog.getByRole("button",{name:"设置微信账户"}).click();
 await dialog.getByRole("textbox",{name:"收款人姓名"}).fill("模拟收款人");
 await dialog.getByRole("textbox",{name:"微信号"}).fill(identifier);
 await dialog.getByRole("button",{name:"保存并验证"}).click();
 await dialog.getByRole("button",{name:"去验证"}).first().click();
 await dialog.getByRole("button",{name:"确认模拟验证并保存"}).click();
}
const route="/shuomi/#/workbench/account/referrals/withdrawals";
test("Figma payout actions show configuration and withdrawal, with saved account and isolated records",async({page})=>{
 await page.goto(route);
 const suite=page.locator("[data-account-suite]");
 const payoutSection=suite.locator("section").filter({has:suite.getByRole("heading",{name:"收款账户",exact:true})}).first();
 await expect(payoutSection.getByRole("button",{name:"配置账户"})).toBeVisible();
 await expect(payoutSection.getByRole("button",{name:"申请提现"})).toBeVisible();
 await expect(suite.getByRole("button",{name:"设置收款方式"})).toHaveCount(0);
 await expect(suite.getByRole("button",{name:"申请模拟提现"})).toHaveCount(0);
 await suite.getByRole("button",{name:"配置账户"}).click();
 const account=suite.getByRole("dialog",{name:"配置收款账户"});
 await configureDemoPayout(account,"ADMIN-NEW-DEMO-PAYOUT");
 await expect(suite).toContainText("微信 · AD******UT");
 await suite.getByRole("button",{name:"申请提现"}).click();
 const dialog=suite.getByRole("dialog",{name:"申请提现"});
 await dialog.getByRole("spinbutton",{name:"模拟提现金额"}).fill("999999");
 await dialog.getByRole("button",{name:"确认提现"}).click();
 await expect(dialog.getByRole("alert")).toContainText("不超过可提现余额");
 await dialog.getByRole("spinbutton",{name:"模拟提现金额"}).fill("10");
 await dialog.getByRole("button",{name:"确认提现"}).click();
 await expect(suite).toContainText("¥10.00");
 await page.reload();
 await expect(suite).toContainText("微信 · AD******UT");
 await expect(suite).toContainText("¥10.00");
});
