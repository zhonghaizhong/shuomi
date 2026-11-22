import {expect,test} from "@playwright/test";
const pageUrl="/shuomi/#/workbench/account/organization";
test("enterprise overview member resources filters and paginates a large member list",async({page})=>{
 await page.goto(pageUrl);
 await expect(page.getByRole("region",{name:"企业空间概览"})).toBeVisible();
 await page.evaluate(()=>{
  const key="shuomi-demo-account-suite-SM-ENT-000001-v1";
  const initial=JSON.parse(localStorage.getItem(key)||"null")||{members:[{id:"admin",name:"林晨",email:"admin@example.com",role:"管理员",status:"正常",joined:Date.UTC(2026,10,21)}],roles:["管理员","子账号"],audit:[],referrals:[],withdrawals:[]};
  const extras=Array.from({length:30},(_,i)=>({
   id:"TEST-RESOURCE-"+i,
   name:"资源同事"+String(i+1).padStart(2,"0"),
   email:"resource"+String(i+1)+"@example.test",
   role:i%2?"子账号":"测试运营",
   status:i===29?"已停用":"正常",
   joined:Date.UTC(2026,10,22)
  }));
  localStorage.setItem(key,JSON.stringify({...initial,members:[...initial.members,...extras]}));
 });
 await page.reload();
 const section=page.getByRole("region",{name:"成员资源分配"});
 const table=section.getByRole("table");
 await expect(table.getByRole("row")).toHaveCount(11);
 await expect(section).toContainText("共 33 位成员");
 await section.getByRole("button",{name:"资源表下一页"}).click();
 await expect(section).toContainText("第 2 / 4 页");
 await expect(table.getByRole("row")).toHaveCount(11);
 await section.getByRole("searchbox",{name:"搜索资源成员"}).fill("resource15@example.test");
 await expect(table).toContainText("资源同事15");
 await expect(table.getByRole("row")).toHaveCount(2);
 await section.getByRole("searchbox",{name:"搜索资源成员"}).fill("");
 await section.getByRole("combobox",{name:"筛选资源角色"}).selectOption("测试运营");
 await expect(section).toContainText("共 15 位成员");
 await section.getByRole("combobox",{name:"筛选资源状态"}).selectOption("已停用");
 await expect(section).toContainText("没有符合条件的成员");
 await section.getByRole("button",{name:"重置"}).click();
 await expect(section).toContainText("共 33 位成员");
 await section.getByRole("combobox",{name:"每页显示"}).selectOption("20");
 await expect(table.getByRole("row")).toHaveCount(21);
 await section.getByRole("combobox",{name:"筛选资源状态"}).selectOption("all");
 await expect(section).toContainText("共 34 位成员");
 await expect(section.getByRole("button",{name:"资源表上一页"})).toBeDisabled();
});
