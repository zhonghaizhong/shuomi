// @vitest-environment jsdom
import {beforeEach,describe,expect,it} from "vitest";
import {readOptimizedDatasets,saveVerifiedOptimizedDataset,updateOptimizedDatasetPlatformState,readReusableOptimizedDatasets} from "./showcase-optimized-datasets";
import {persistShowcaseUploadTaskRecords,type ShowcaseUploadTask} from "./listing/showcase-upload-tasks";

describe("optimized dataset provenance and reusable batch selection",()=>{
 beforeEach(()=>sessionStorage.clear());
 const payload={name:"美国站英文优化版",sourceKind:"采集批次" as const,sourceBatchId:"raw-1",sourceBatchName:"采集原批次 001",platform:"SHEIN",site:"美国站",language:"英语",storeName:"一号店",uploadTaskId:"task-1",externalReceiptId:"receipt-1",products:[{sourceProductId:"item-1",name:"Cotton Tee",images:["image-en"],description:"English adaptation",skuCodes:["SKU-1"]}]};
 const receipt={verifiedBy:"platform-callback" as const,result:"accepted" as const,taskId:"task-1",externalReceiptId:"receipt-1"};
 it("does not invent optimization batches without platform confirmation",()=>{
  expect(()=>saveVerifiedOptimizedDataset("org-a","member-a",payload,null)).toThrow();
  expect(()=>saveVerifiedOptimizedDataset("org-a","member-a",payload,{...receipt,taskId:"another"})).toThrow();
  expect(readOptimizedDatasets("org-a","member-a")).toHaveLength(0);
 });
 it("records lineage, prevents duplicate receipts and separates members and organizations",()=>{
  const first=saveVerifiedOptimizedDataset("org-a","member-a",payload,receipt);
  expect(first).toMatchObject({sourceKind:"采集批次",sourceBatchId:"raw-1",site:"美国站",language:"英语",version:1});
  expect(first).toMatchObject({reviewStatus:"待审核",listingStatus:"未上架"});
  const duplicate=saveVerifiedOptimizedDataset("org-a","member-a",payload,receipt);
  expect(duplicate.id).toBe(first.id);
  expect(readOptimizedDatasets("org-a","member-b")).toHaveLength(0);
  expect(readOptimizedDatasets("org-b","member-a")).toHaveLength(0);
  const another={...payload,uploadTaskId:"task-2",externalReceiptId:"receipt-2"};
  const v2=saveVerifiedOptimizedDataset("org-a","member-a",another,{verifiedBy:"platform-callback",result:"accepted",taskId:"task-2",externalReceiptId:"receipt-2"});
  expect(v2.version).toBe(2);
  const french=saveVerifiedOptimizedDataset("org-a","member-a",{...another,site:"法国站",language:"法语",uploadTaskId:"task-fr",externalReceiptId:"receipt-fr"},{verifiedBy:"platform-callback",result:"accepted",taskId:"task-fr",externalReceiptId:"receipt-fr"});
  expect(french.version).toBe(1);
  expect(readOptimizedDatasets("org-a","member-a")).toHaveLength(3);
 });
 it("stores the version on platform acceptance, then only updates status after subsequent verified callbacks",()=>{
  const received=saveVerifiedOptimizedDataset("org-a","member-a",payload,{...receipt,result:"accepted",acceptedAt:"2026-11-23T09:00:00Z"});
  expect(received).toMatchObject({acceptedAt:"2026-11-23T09:00:00Z",reviewStatus:"待审核",listingStatus:"未上架"});
  expect(()=>updateOptimizedDatasetPlatformState("org-a","member-a",received.id,{reviewStatus:"审核通过",listingStatus:"已上架"},null)).toThrow();
  expect(()=>updateOptimizedDatasetPlatformState("org-a","member-a",received.id,{reviewStatus:"待审核",listingStatus:"已上架"},{verifiedBy:"platform-callback",externalReceiptId:"receipt-1"})).toThrow();
  expect(()=>updateOptimizedDatasetPlatformState("org-a","member-a",received.id,{reviewStatus:"审核通过",listingStatus:"已上架"},{verifiedBy:"platform-callback",externalReceiptId:"wrong"})).toThrow();
  const reviewed=updateOptimizedDatasetPlatformState("org-a","member-a",received.id,{reviewStatus:"审核通过",listingStatus:"未上架"},{verifiedBy:"platform-callback",externalReceiptId:"receipt-1"});
  expect(reviewed.reviewStatus).toBe("审核通过");
  const listed=updateOptimizedDatasetPlatformState("org-a","member-a",received.id,{reviewStatus:"审核通过",listingStatus:"已上架"},{verifiedBy:"platform-callback",externalReceiptId:"receipt-1"});
  expect(listed.listingStatus).toBe("已上架");
  expect(readOptimizedDatasets("org-a","member-a")).toHaveLength(1);
  expect(readOptimizedDatasets("org-a","member-a")[0]).toMatchObject({id:received.id,version:1,reviewStatus:"审核通过",listingStatus:"已上架"});
  expect(readOptimizedDatasets("org-a","member-b")).toEqual([]);
 });
 it("does not create a snapshot when the platform rejected intake",()=>{
  expect(()=>saveVerifiedOptimizedDataset("org-a","member-a",payload,{...receipt,result:"rejected"})).toThrow();
  expect(readOptimizedDatasets("org-a","member-a")).toEqual([]);
 });

});

describe("demo uploaded product versions are not upload-count versions",()=>{
 beforeEach(()=>{sessionStorage.clear();localStorage.clear()});
 const org="test-version-org",member="test-version-member";
 const make=(id:string,productId:string,submittedAt:string,optimizationVersionKey?:string):ShowcaseUploadTask=>({
  id,organizationId:org,memberId:member,source:"采集批次",batchId:"batch-1",
  batchName:"源批次",sourceVersionId:"original",productIds:[productId],productCount:1,missingCount:0,
  storeId:"store-1",storeName:"演示店铺",platform:"SHEIN",region:"美国站",storeType:"全托管",
  rule:"规则",agentId:null,agentName:null,templateId:null,mode:"直接上传到平台",
  status:"模拟已提交",optimizationVersionKey,createdAt:submittedAt,demo:true,
  demoSubmission:{reviewedAt:submittedAt,submittedAt,platform:"SHEIN",site:"美国站",storeId:"store-1",storeName:"演示店铺",result:"模拟提交成功",externalReceiptId:null},
  demoProduct:{sourceName:productId,sourceDescription:"原文",sourceImages:[],optimizedName:productId,optimizedDescription:"英文优化",optimizedImages:[],missingFields:[],agentRun:"模拟已优化"}
 });
 it("groups two products from the same source into V2, even with separate receipts",()=>{
  persistShowcaseUploadTaskRecords(org,member,[make("task-a","product-a","2026-11-27T05:00:00Z"),make("task-b","product-b","2026-11-27T09:00:00Z")]);
  const versions=readReusableOptimizedDatasets(org,member);
  expect(versions).toHaveLength(1);
  expect(versions[0].version).toBe(1); // Display V2 after raw V1
  expect(versions[0].products.map(p=>p.sourceProductId).sort()).toEqual(["product-a","product-b"]);
 });
 it("reusing an upload does not increment version or duplicate a product",()=>{
  persistShowcaseUploadTaskRecords(org,member,[make("task-a","product-a","2026-11-27T05:00:00Z"),make("task-b","product-a","2026-11-27T09:00:00Z")]);
  const versions=readReusableOptimizedDatasets(org,member);
  expect(versions).toHaveLength(1);
  expect(versions[0].products).toHaveLength(1);
 });
 it("only an explicitly identified new optimization snapshot advances to V3",()=>{
  persistShowcaseUploadTaskRecords(org,member,[make("task-a","product-a","2026-11-27T05:00:00Z"),make("task-c","product-a","2026-11-27T09:00:00Z","approved-revision-2")]);
  const versions=readReusableOptimizedDatasets(org,member);
  expect(versions.map(v=>v.version)).toEqual([1,2]);
  expect(versions.map(v=>v.products.length)).toEqual([1,1]);
 });
});
