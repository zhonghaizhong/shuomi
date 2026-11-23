// @vitest-environment jsdom
import {beforeEach,describe,expect,it} from "vitest";
import {readOptimizedDatasets,saveVerifiedOptimizedDataset} from "./showcase-optimized-datasets";

describe("optimized dataset provenance and reusable batch selection",()=>{
 beforeEach(()=>sessionStorage.clear());
 const payload={name:"美国站英文优化版",sourceKind:"采集批次" as const,sourceBatchId:"raw-1",sourceBatchName:"采集原批次 001",platform:"SHEIN",site:"美国站",language:"英语",storeName:"一号店",uploadTaskId:"task-1",externalReceiptId:"receipt-1",products:[{sourceProductId:"item-1",name:"Cotton Tee",images:["image-en"],description:"English adaptation",skuCodes:["SKU-1"]}]};
 const receipt={verifiedBy:"platform-callback" as const,taskId:"task-1",externalReceiptId:"receipt-1"};
 it("does not invent optimization batches without platform confirmation",()=>{
  expect(()=>saveVerifiedOptimizedDataset("org-a","member-a",payload,null)).toThrow();
  expect(()=>saveVerifiedOptimizedDataset("org-a","member-a",payload,{...receipt,taskId:"another"})).toThrow();
  expect(readOptimizedDatasets("org-a","member-a")).toHaveLength(0);
 });
 it("records lineage, prevents duplicate receipts and separates members and organizations",()=>{
  const first=saveVerifiedOptimizedDataset("org-a","member-a",payload,receipt);
  expect(first).toMatchObject({sourceKind:"采集批次",sourceBatchId:"raw-1",site:"美国站",language:"英语",version:1});
  const duplicate=saveVerifiedOptimizedDataset("org-a","member-a",payload,receipt);
  expect(duplicate.id).toBe(first.id);
  expect(readOptimizedDatasets("org-a","member-b")).toHaveLength(0);
  expect(readOptimizedDatasets("org-b","member-a")).toHaveLength(0);
  const another={...payload,uploadTaskId:"task-2",externalReceiptId:"receipt-2"};
  const v2=saveVerifiedOptimizedDataset("org-a","member-a",another,{verifiedBy:"platform-callback",taskId:"task-2",externalReceiptId:"receipt-2"});
  expect(v2.version).toBe(2);
  const french=saveVerifiedOptimizedDataset("org-a","member-a",{...another,site:"法国站",language:"法语",uploadTaskId:"task-fr",externalReceiptId:"receipt-fr"},{verifiedBy:"platform-callback",taskId:"task-fr",externalReceiptId:"receipt-fr"});
  expect(french.version).toBe(1);
  expect(readOptimizedDatasets("org-a","member-a")).toHaveLength(3);
 });
});
