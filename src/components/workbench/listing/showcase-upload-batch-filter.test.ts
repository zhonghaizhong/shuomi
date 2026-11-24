import {beforeEach,expect,it} from "vitest";
import {addShowcaseUploadTask,readShowcaseUploadTasks,showcaseUploadBatchKey,showcaseUploadBatchLabel,showcaseUploadBatchPreferenceKey,type ShowcaseUploadTask} from "./showcase-upload-tasks";
const sample=(overrides:Partial<ShowcaseUploadTask>={}):ShowcaseUploadTask=>({
 id:"TASK-01",organizationId:"org-one",memberId:"user-one",source:"自有商品库",
 batchId:"batch-5",batchName:"自有商品测试批次",sourceVersionId:"original",
 productIds:["sku-1","sku-2"],productCount:2,missingCount:2,storeId:"store-a",
 storeName:"测试店铺",platform:"SHEIN",region:"US",storeType:"全托店",rule:"测试规则",
 agentId:null,agentName:null,templateId:null,mode:"平台草稿",status:"待补全",
 createdAt:"2026-11-24T00:00:00Z",demo:true,...overrides
});
beforeEach(()=>sessionStorage.clear());

it("retains the same source batch and version across missing/review/uploaded stages",()=>{
 const first=sample(),second=sample({id:"TASK-02",status:"待审核",productIds:["sku-3","sku-4","sku-5"],productCount:3,missingCount:0});
 expect(addShowcaseUploadTask(first)).toBe(true);
 expect(addShowcaseUploadTask(second)).toBe(true);
 const ledger=readShowcaseUploadTasks("org-one","user-one");
 expect(ledger).toHaveLength(2);
 expect(new Set(ledger.map(showcaseUploadBatchKey)).size).toBe(1);
 expect(ledger.filter(task=>task.status==="待补全").flatMap(task=>task.productIds)).toHaveLength(2);
 expect(ledger.filter(task=>task.status==="待审核").flatMap(task=>task.productIds)).toHaveLength(3);
 expect(showcaseUploadBatchLabel(first)).toContain("自有商品测试批次");
 expect(showcaseUploadBatchPreferenceKey("org-one","user-one")).not.toBe(showcaseUploadBatchPreferenceKey("org-one","user-two"));
});

it("separates identically named batches by source, exact ID and selected version",()=>{
 const base=sample();
 expect(showcaseUploadBatchKey(base)).not.toBe(showcaseUploadBatchKey(sample({batchId:"other-id"})));
 expect(showcaseUploadBatchKey(base)).not.toBe(showcaseUploadBatchKey(sample({source:"采集批次"})));
 expect(showcaseUploadBatchKey(base)).not.toBe(showcaseUploadBatchKey(sample({sourceVersionId:"opt-v2"})));
 expect(readShowcaseUploadTasks("org-two","user-one")).toEqual([]);
 expect(readShowcaseUploadTasks("org-one","user-two")).toEqual([]);
});
