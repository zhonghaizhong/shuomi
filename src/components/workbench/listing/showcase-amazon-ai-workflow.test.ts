// @vitest-environment jsdom
import {beforeEach,expect,it} from "vitest";
import {simulateAmazonFiveListingWorkflow,readShowcaseUploadTasks,completeShowcaseUploadTask,approveShowcaseUploadTask} from "./showcase-upload-tasks";
import {renderListingDemoArt,listingDemoArtSet} from "./showcase-listing-ai-images";
beforeEach(()=>sessionStorage.clear());
const org="SM-ENT-000001",member="admin";
const items=[
 ["B00TTD9BRC","Moisturizing Cream"],
 ["B07WRKXQ8W","USB-C Charger"],
 ["B00008GKD3","Cast Iron Skillet"],
 ["B0CFPJYX7P","E-Reader"],
 ["B00NTCHCU2","AAA Batteries"]
].map(([sku,name])=>({id:"SIM-AMZ-US-"+sku,sku,name,description:"Original source content",images:["https://example.test/original.jpg"]}));
const args={organizationId:org,memberId:member,batchId:"SIM-AMAZON-US-5-20261124",
 batchName:"Amazon 美国站 · 5个真实商品（模拟采集）",products:items,
 storeId:"store-admin-01",storeName:"管理员演示店铺01",region:"美国站",storeType:"全托店",
 rule:"硕米规则",agentName:"商品优化智能体",templateId:"test-template"};
it("creates 5 separate optimized items, three missing and two review without external submission",()=>{
 expect(simulateAmazonFiveListingWorkflow(args)).toEqual({created:5,missing:3,review:2,alreadyInstalled:false});
 const all=readShowcaseUploadTasks(org,member);
 expect(all).toHaveLength(5);
 expect(all.filter(x=>x.status==="待补全")).toHaveLength(3);
 expect(all.filter(x=>x.status==="待审核")).toHaveLength(2);
 expect(all.every(x=>x.productIds.length===1&&x.mode==="直接上传到平台"&&x.demoProduct?.agentRun==="模拟已优化")).toBe(true);
 expect(all.every(x=>x.demoProduct?.optimizedImages.length===8)).toBe(true);
 expect(all.every(x=>x.demoProduct?.sourceImages.length===1)).toBe(true);
 expect(new Set(all.flatMap(x=>x.demoProduct!.optimizedImages)).size).toBe(40);
 expect(all.every(x=>x.status!=="待平台提交")).toBe(true);
 expect(simulateAmazonFiveListingWorkflow(args).alreadyInstalled).toBe(true);
 expect(readShowcaseUploadTasks("different-org",member)).toHaveLength(0);
 expect(readShowcaseUploadTasks(org,"other-member")).toHaveLength(0);
});
it("gates missing fields, then review and never fakes upload",()=>{
 simulateAmazonFiveListingWorkflow(args);
 const records=readShowcaseUploadTasks(org,member);
 const incomplete=records.find(x=>x.status==="待补全")!;
 const ready=records.find(x=>x.status==="待审核")!;
 expect(()=>approveShowcaseUploadTask(org,member,incomplete.id)).toThrow();
 expect(()=>completeShowcaseUploadTask(org,member,incomplete.id,{})).toThrow();
 const entries=Object.fromEntries(incomplete.demoProduct!.missingFields.map(field=>[field,"Reviewed document"]));
 expect(completeShowcaseUploadTask(org,member,incomplete.id,entries).status).toBe("待审核");
 expect(approveShowcaseUploadTask(org,member,ready.id).status).toBe("待平台提交");
 expect(approveShowcaseUploadTask(org,member,incomplete.id).status).toBe("待平台提交");
 expect(()=>approveShowcaseUploadTask(org,member,ready.id)).toThrow();
 expect(readShowcaseUploadTasks(org,member).every(t=>t.demo&&t.demoProduct?.reviewedAt!==undefined?Boolean(t.demoProduct.reviewedAt):true)).toBe(true);
});
it("renders individual self-contained English white-background images with no missing URL",()=>{
 for(const kind of ["cream","charger","skillet","ereader","battery"] as const){
  const images=listingDemoArtSet(kind);
  expect(images).toHaveLength(8);
  expect(new Set(images).size).toBe(8);
  expect(images.every(x=>x.startsWith("data:image/svg+xml;charset=utf-8,"))).toBe(true);
  const decoded=decodeURIComponent(images[0].split(",")[1]);
  expect(decoded).toContain('fill="#fff"');
  expect(decoded).toContain("ILLUSTRATIVE DEMO");
  expect(decoded).not.toContain("http://images.");
  expect(renderListingDemoArt(kind,7)).toContain("8%2F8");
 }
});
