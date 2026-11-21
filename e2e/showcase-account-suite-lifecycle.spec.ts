import {expect,test} from "@playwright/test";
const base="/shuomi/#/workbench/account";
test("legacy account demo records are cleared once while preserving the new company fixture",async({page})=>{
 await page.goto(base);
 await page.evaluate(()=>{
   localStorage.removeItem("shuomi-account-fixture-reset-20261121-v2");
   localStorage.setItem("shuomi-demo-account-suite-SM-ENT-000001-v1",JSON.stringify({
    members:[{id:"admin",name:"旧管理员",email:"old@example.com",role:"管理员",status:"正常",joined:1},{id:"legacy",name:"张琳",email:"legacy@example.com",role:"运营负责人",status:"正常",joined:1}],
    audit:[],roles:["管理员"],allocations:{},referrals:[{id:"a",at:1,referred:"旧客户",amount:3260,status:"已结算"}],withdrawals:[],payoutAccount:"OLD",referralCode:"OLD"
   }));
   localStorage.setItem("shuomi-demo-security-SM-ENT-000001",JSON.stringify({phone:"13811112222",email:"old@example.com",passwordUpdated:"旧日期"}));
   localStorage.setItem("shuomi-demo-credential-files-SM-ENT-000001",JSON.stringify({"营业执照":{name:"legacy.pdf",size:10,type:"application/pdf",at:1}}));
   sessionStorage.setItem("shuomi-demo-account-settings-SM-ENT-000001",JSON.stringify({name:"old_user",city:"杭州市"}));
   sessionStorage.setItem("shuomi-demo-business-profile-SM-ENT-000001",JSON.stringify({roles:["旧企业"],shops:"已有店铺"}));
 });
 await page.reload();
 await expect(page.locator('[data-commerce-unified="account"]')).toContainText("武汉硕米电子商务有限公司");
 await expect(page.locator('[data-commerce-unified="account"]')).toContainText("¥0.00");
 await expect(page.locator('[data-commerce-unified="account"]')).not.toContainText("张琳");
 await page.goto(base+"/profile");
 await expect(page.locator('[data-account-profile-page="overview"]')).toContainText("linchen_demo");
 await expect(page.locator('[data-account-profile-page="overview"]')).not.toContainText("old_user");
 await page.goto(base+"/profile/settings");
 await expect(page.locator('[data-account-profile-page="settings"]')).toContainText("admin@example.com");
 await page.goto(base+"/profile/verification");
 await expect(page.locator('[data-document-kind="business"]')).not.toContainText("legacy.pdf");
 await page.goto(base+"/organization/members");
 const suite=page.locator("[data-account-suite]");
 await expect(suite.getByRole("row")).toHaveCount(2);
 await expect(suite).not.toContainText("张琳");
 await page.reload();
 await expect(suite.getByRole("row")).toHaveCount(2);
 const marker=await page.evaluate(()=>localStorage.getItem("shuomi-account-fixture-reset-20261121-v2"));
 expect(marker).toBe("done");
});

test("synthetic enterprise uses one tenant across account home, members, roles and audit",async({page})=>{
 await page.goto(base);
 const root=page.locator('[data-commerce-unified="account"]');
 await expect(root).toContainText("武汉硕米电子商务有限公司");
 await expect(root).not.toContainText("¥3,260");
 await expect(root).not.toContainText("张琳");
 await root.getByRole("button",{name:"进入空间"}).click();
 const suite=page.locator("[data-account-suite]");
 await expect(suite).toContainText("武汉硕米电子商务有限公司");
 await expect(suite).toContainText("企业成员");
 await expect(suite.locator('[class*="metrics"]')).toContainText("0");
 await page.goto(base+"/organization/members");
 await expect(suite.getByRole("row")).toHaveCount(2);
 await suite.getByRole("button",{name:"邀请成员"}).click();
 const invite=suite.getByRole("dialog",{name:"邀请成员"});
 await invite.getByRole("textbox",{name:"成员姓名"}).fill("模拟运营人员");
 await invite.getByRole("textbox",{name:"成员邮箱"}).fill("operator@example.com");
 await invite.getByRole("combobox",{name:"业务角色"}).selectOption("商品运营");
 await invite.getByRole("button",{name:"确认并模拟通过"}).click();
 await expect(suite.getByRole("row").filter({hasText:"模拟运营人员"})).toBeVisible();
 await page.reload();
 await expect(suite.getByRole("row").filter({hasText:"模拟运营人员"})).toBeVisible();
 await suite.getByRole("row").filter({hasText:"模拟运营人员"}).getByRole("button",{name:"查看 / 调整"}).click();
 const manage=suite.getByRole("dialog",{name:"管理成员"});
 await manage.getByRole("combobox",{name:"业务角色"}).selectOption("运营负责人");
 await manage.getByRole("button",{name:"确认并模拟通过"}).click();
 await expect(suite.getByRole("row").filter({hasText:"模拟运营人员"})).toContainText("运营负责人");
 await page.goto(base+"/organization/roles");
 await expect(suite.getByRole("row").filter({hasText:"运营负责人"})).toContainText("1 人");
 await page.goto(base+"/organization/audit");
 await expect(suite).toContainText("邀请并模拟审核通过");
 await expect(suite).toContainText("调整成员");
 await page.goto(base+"/organization/resources");
 await expect(suite).toContainText("尚未充值");
 await expect(suite).toContainText("0 GiB");
});
test("synthetic referral flow starts at zero and updates earnings and withdrawal records",async({page})=>{
 await page.goto(base+"/referrals");
 const suite=page.locator("[data-account-suite]");
 await expect(suite).toContainText("¥0.00");
 await page.goto(base+"/referrals/center");
 await suite.getByRole("button",{name:"模拟一笔推广成交并结算"}).click();
 const dialog=suite.getByRole("dialog",{name:"模拟推广收益"});
 await dialog.getByRole("textbox",{name:"模拟客户标识"}).fill("TEST-CUSTOMER-001");
 await dialog.getByRole("spinbutton",{name:"模拟佣金金额"}).fill("120");
 await dialog.getByRole("button",{name:"确认并模拟通过"}).click();
 await page.goto(base+"/referrals/earnings");
 await expect(suite).toContainText("TEST-CUSTOMER-001");
 await expect(suite).toContainText("¥120.00");
 await page.goto(base+"/referrals/withdrawals");
 await suite.getByRole("button",{name:"设置收款方式"}).click();
 const account=suite.getByRole("dialog",{name:"设置收款方式"});
 await account.getByRole("textbox",{name:"演示收款标识"}).fill("TEST-PAYOUT-001");
 await account.getByRole("button",{name:"确认并模拟通过"}).click();
 await suite.getByRole("button",{name:"申请模拟提现"}).click();
 const withdrawal=suite.getByRole("dialog",{name:"模拟提现"});
 await withdrawal.getByRole("spinbutton",{name:"模拟提现金额"}).fill("120");
 await withdrawal.getByRole("button",{name:"确认并模拟通过"}).click();
 await expect(suite).toContainText("模拟审核通过");
 await page.goto(base+"/referrals/earnings");
 await expect(suite).toContainText("已提现（模拟）");
 await page.goto(base);
 await expect(page.locator('[data-commerce-unified="account"]')).toContainText("¥0.00");
 await page.goto(base+"/organization/audit");
 await expect(suite).toContainText("模拟提现并审核通过");
});
test("enterprise and referral subpages preserve approved dark/light surfaces and do not overflow",async({page})=>{
 for(const route of ["/organization","/organization/members","/organization/roles","/organization/resources","/organization/audit","/referrals","/referrals/center","/referrals/earnings","/referrals/withdrawals","/referrals/rules"]){
  await page.setViewportSize({width:1440,height:900});
  await page.goto(base+route);
  const suite=page.locator("[data-account-suite]");
  await expect(suite).toBeVisible();
  const light=page.getByRole("button",{name:"切换浅色主题"});if(await light.isVisible())await light.click();
  const bg=await suite.locator(":scope > header").evaluate(x=>getComputedStyle(x).backgroundColor);
  expect(bg).toBe("rgb(255, 255, 255)");
  const dark=page.getByRole("button",{name:"切换深色主题"});if(await dark.isVisible())await dark.click();
  const darkBg=await suite.locator(":scope > header").evaluate(x=>getComputedStyle(x).backgroundColor);
  expect(darkBg).toBe("rgb(47, 51, 73)");
  await expect(suite).toContainText("武汉硕米电子商务有限公司");
 }
});
