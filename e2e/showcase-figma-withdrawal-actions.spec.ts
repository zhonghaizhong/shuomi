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

test("Figma account configuration supports bank, Alipay and default account switching",async({page})=>{
 await page.goto(route);
 const suite=page.locator("[data-account-suite]");
 await suite.getByRole("button",{name:"配置账户"}).click();
 let dialog=suite.getByRole("dialog",{name:"配置收款账户"});
 await dialog.getByRole("button",{name:"设置银行卡账户"}).click();
 await dialog.getByRole("textbox",{name:"持卡人姓名"}).fill("模拟持卡人");
 await dialog.getByRole("textbox",{name:"银行卡号"}).fill("1234567890123456");
 await dialog.getByRole("textbox",{name:"开户银行"}).fill("模拟银行");
 await dialog.getByRole("button",{name:"保存并验证"}).click();
 await dialog.getByRole("button",{name:"去验证"}).last().click();
 await dialog.getByRole("button",{name:"确认模拟验证并保存"}).click();
 await expect(suite).toContainText("银行卡 · 12******56");
 await suite.getByRole("button",{name:"配置账户"}).click();
 dialog=suite.getByRole("dialog",{name:"配置收款账户"});
 await dialog.getByRole("button",{name:"添加其他支付宝账户"}).click();
 await dialog.getByRole("textbox",{name:"收款人姓名"}).fill("模拟账户");
 await dialog.getByRole("textbox",{name:"支付宝账号"}).fill("pay-demo-123456");
 await dialog.getByRole("checkbox").uncheck();
 await dialog.getByRole("button",{name:"保存并验证"}).click();
 await dialog.getByRole("button",{name:"去验证"}).first().click();
 await dialog.getByRole("button",{name:"确认模拟验证并保存"}).click();
 await expect(suite).toContainText("银行卡 · 12******56");
 await suite.getByRole("button",{name:"配置账户"}).click();
 dialog=suite.getByRole("dialog",{name:"配置收款账户"});
 await expect(dialog).toContainText("支付宝 · pa******56");
 await dialog.getByRole("button",{name:"设为默认"}).last().click();
 await expect(suite).toContainText("支付宝 · pa******56");
 await page.reload();
 await expect(suite).toContainText("支付宝 · pa******56");
});

test("simulate adding WeChat, Alipay and bank accounts then modifying an existing payment method",async({page})=>{
 await page.goto(route);
 const suite=page.locator("[data-account-suite]");
 const openConfig=async()=>{await suite.getByRole("button",{name:"配置账户"}).click();return suite.getByRole("dialog",{name:"配置收款账户"});};
 let dialog=await openConfig();
 await dialog.getByRole("button",{name:"设置微信账户"}).click();
 await dialog.getByRole("textbox",{name:"收款人姓名"}).fill("测试微信收款人");
 await dialog.getByRole("textbox",{name:"微信号"}).fill("wx-test-0011");
 await dialog.getByRole("button",{name:"保存并验证"}).click();
 await dialog.getByRole("button",{name:"去验证"}).first().click();
 await dialog.getByRole("button",{name:"确认模拟验证并保存"}).click();
 await expect(suite).toContainText("微信 · wx******11");

 dialog=await openConfig();
 await dialog.getByRole("button",{name:/支付宝账户/}).last().click();
 await dialog.getByRole("textbox",{name:"收款人姓名"}).fill("测试支付宝收款人");
 await dialog.getByRole("textbox",{name:"支付宝账号"}).fill("alipay-0022");
 await dialog.getByRole("checkbox").uncheck();
 await dialog.getByRole("button",{name:"保存并验证"}).click();
 await dialog.getByRole("button",{name:"去验证"}).last().click();
 await dialog.getByRole("button",{name:"确认模拟验证并保存"}).click();
 await expect(suite).toContainText("微信 · wx******11");

 dialog=await openConfig();
 await dialog.getByRole("button",{name:"设置银行卡账户"}).click();
 await dialog.getByRole("textbox",{name:"持卡人姓名"}).fill("测试银行卡持卡人");
 await dialog.getByRole("textbox",{name:"银行卡号"}).fill("6222000000003344");
 await dialog.getByRole("textbox",{name:"开户银行"}).fill("演示银行");
 await dialog.getByRole("checkbox").uncheck();
 await dialog.getByRole("button",{name:"保存并验证"}).click();
 await dialog.getByRole("button",{name:"去验证"}).first().click();
 await dialog.getByRole("button",{name:"确认模拟验证并保存"}).click();

 dialog=await openConfig();
 await expect(dialog).toContainText("微信 · wx******11");
 await expect(dialog).toContainText("支付宝 · al******22");
 await expect(dialog).toContainText("银行卡 · 62******44");
 const wxRow=dialog.locator("div").filter({hasText:"微信 · wx******11"}).filter({has:dialog.getByRole("button",{name:"修改"})}).last();
 await wxRow.getByRole("button",{name:"修改"}).click();
 await dialog.getByRole("textbox",{name:"收款人姓名"}).fill("测试微信修改");
 await dialog.getByRole("textbox",{name:"微信号"}).fill("wx-revised-0099");
 await dialog.getByRole("button",{name:"保存并验证"}).click();
 await dialog.getByRole("button",{name:"去验证"}).last().click();
 await dialog.getByRole("button",{name:"确认模拟验证并保存"}).click();
 await expect(suite).toContainText("微信 · wx******99");
 await page.reload();
 dialog=await openConfig();
 await expect(dialog).toContainText("微信 · wx******99");
 await expect(dialog).not.toContainText("微信 · wx******11");
 await expect(dialog).toContainText("支付宝 · al******22");
 await expect(dialog).toContainText("银行卡 · 62******44");
});

test("configured payout method buttons use Vuexy primary tokens in both themes",async({page})=>{
 await page.goto(route);
 const suite=page.locator("[data-account-suite]");
 const openConfig=async()=>{await suite.getByRole("button",{name:"配置账户"}).click();return suite.getByRole("dialog",{name:"配置收款账户"});};
 let dialog=await openConfig();
 await dialog.getByRole("button",{name:"设置微信账户"}).click();
 const active=dialog.getByRole("button",{name:"微信",exact:true});
 const action=dialog.getByRole("button",{name:"保存并验证"});
 const colors=await Promise.all([active,action].map(x=>x.evaluate(el=>({bg:getComputedStyle(el).backgroundColor,text:getComputedStyle(el).color}))));
 for(const style of colors){expect(style.bg).toBe("rgb(115, 103, 240)");expect(style.text).toBe("rgb(255, 255, 255)");}
 await page.keyboard.press("Escape");
 const switchLight=page.getByRole("button",{name:"切换浅色主题"});
 if(await switchLight.isVisible())await switchLight.click();
 dialog=await openConfig();
 await dialog.getByRole("button",{name:"设置微信账户"}).click();
 const lightColors=await Promise.all([dialog.getByRole("button",{name:"微信",exact:true}),dialog.getByRole("button",{name:"保存并验证"})].map(x=>x.evaluate(el=>({bg:getComputedStyle(el).backgroundColor,text:getComputedStyle(el).color}))));
 for(const style of lightColors){expect(style.bg).toBe("rgb(115, 103, 240)");expect(style.text).toBe("rgb(255, 255, 255)");}
});

test("simulate editing Alipay and bank collection methods without losing separate accounts",async({page})=>{
 await page.goto(route);
 const suite=page.locator("[data-account-suite]");
 const openConfig=async()=>{
  await suite.getByRole("button",{name:"配置账户"}).click();
  return suite.getByRole("dialog",{name:"配置收款账户"});
 };
 const save=async(dialog:import("@playwright/test").Locator)=>{
  await dialog.getByRole("button",{name:"保存并验证"}).click();
  await dialog.getByRole("button",{name:"去验证"}).first().click();
  await dialog.getByRole("button",{name:"确认模拟验证并保存"}).click();
 };
 let d=await openConfig();
 await d.getByRole("button",{name:/支付宝账户/}).last().click();
 await d.getByRole("textbox",{name:"收款人姓名"}).fill("模拟支付宝账户");
 await d.getByRole("textbox",{name:"支付宝账号"}).fill("alipay-new-0044");
 await save(d);
 await expect(suite).toContainText("支付宝 · al******44");

 d=await openConfig();
 await d.getByRole("button",{name:"设置银行卡账户"}).click();
 await d.getByRole("textbox",{name:"持卡人姓名"}).fill("模拟银行卡账户");
 await d.getByRole("textbox",{name:"银行卡号"}).fill("6222000000006688");
 await d.getByRole("textbox",{name:"开户银行"}).fill("模拟开户行");
 await d.getByRole("checkbox").uncheck();
 await save(d);
 await expect(suite).toContainText("支付宝 · al******44");

 d=await openConfig();
 const alipay=d.locator("section").filter({hasText:"支付宝"});
 await expect(alipay).toContainText("支付宝 · al******44");
 await alipay.getByRole("button",{name:"修改"}).last().click();
 await d.getByRole("textbox",{name:"收款人姓名"}).fill("修改后支付宝账户");
 await d.getByRole("textbox",{name:"支付宝账号"}).fill("alipay-updated-0055");
 await save(d);
 await expect(suite).toContainText("支付宝 · al******55");

 d=await openConfig();
 const bank=d.locator("section").filter({hasText:"银行卡"});
 await bank.getByRole("button",{name:"修改"}).click();
 await d.getByRole("textbox",{name:"持卡人姓名"}).fill("修改后银行卡账户");
 await d.getByRole("textbox",{name:"银行卡号"}).fill("6222000000007799");
 await d.getByRole("textbox",{name:"开户银行"}).fill("模拟新开户行");
 await d.getByRole("checkbox").check();
 await save(d);
 await expect(suite).toContainText("银行卡 · 62******99");

 await page.reload();
 d=await openConfig();
 await expect(d).toContainText("支付宝 · al******55");
 await expect(d).not.toContainText("支付宝 · al******44");
 await expect(d).toContainText("银行卡 · 62******99");
 await expect(d).not.toContainText("银行卡 · 62******88");
 await expect(d.locator("section").filter({hasText:"银行卡"})).toContainText("默认收款");
});
