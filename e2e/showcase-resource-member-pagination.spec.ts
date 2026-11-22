import {expect,test} from "@playwright/test";
const base="/shuomi/#/workbench/account";
test("enterprise overview has no duplicate member resource table, while member management supports filters and pagination",async({page})=>{
 await page.goto(base+"/organization");
 await expect(page.getByRole("region",{name:"企业资源"})).toBeVisible();
 await expect(page.getByRole("region",{name:"成员资源分配"})).toHaveCount(0);
 await page.evaluate(()=>{
  const key="shuomi-demo-account-suite-SM-ENT-000001-v1";
  const initial=JSON.parse(localStorage.getItem(key)||"null")||{members:[{id:"admin",name:"林晨",email:"admin@example.com",role:"管理员",status:"正常",joined:Date.UTC(2026,10,21)}],roles:["管理员","子账号"],audit:[],referrals:[],withdrawals:[]};
  const extras=Array.from({length:30},(_,i)=>({
   id:"TEST-MEMBER-"+i,name:"资源同事"+String(i+1).padStart(2,"0"),
   email:"resource"+String(i+1)+"@example.test",role:i%2?"子账号":"测试运营",
   status:i===29?"已停用":"正常",joined:Date.UTC(2026,10,22)
  }));
  localStorage.setItem(key,JSON.stringify({...initial,members:[...initial.members,...extras]}));
 });
 await page.goto(base+"/organization/members");
 await page.reload();
 const section=page.getByRole("region",{name:"成员列表"});
 const table=section.getByRole("table");
 await expect(table.getByRole("row")).toHaveCount(11);
 await expect(section).toContainText("共 34 位成员");
 await expect(section.getByRole("combobox",{name:"筛选成员状态"})).toHaveValue("all");
 await section.getByRole("button",{name:"成员下一页"}).click();
 await expect(section).toContainText("第 2 / 4 页");
 await section.getByRole("searchbox",{name:"搜索成员"}).fill("资源同事15");
 await expect(table).toContainText("资源同事15");
 await expect(table.getByRole("row")).toHaveCount(2);
 await section.getByRole("searchbox",{name:"搜索成员"}).fill("resource15@example.test");
 await expect(table).toContainText("资源同事15");
 await section.getByRole("searchbox",{name:"搜索成员"}).fill("");
 await section.getByRole("combobox",{name:"筛选成员状态"}).selectOption("已停用");
 await expect(table).toContainText("资源同事30");
 await expect(section).toContainText("共 1 位成员");
 await section.getByRole("combobox",{name:"筛选成员状态"}).selectOption("all");
 await section.getByRole("combobox",{name:"每页显示"}).selectOption("20");
 await expect(table.getByRole("row")).toHaveCount(21);
 await expect(section.getByRole("button",{name:"成员上一页"})).toBeDisabled();
});
