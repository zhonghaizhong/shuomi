// @vitest-environment jsdom
import {beforeEach,describe,expect,it} from "vitest";
import {addShowcaseUploadTask,type ShowcaseUploadTask} from "./showcase-upload-tasks";
import {recordVerifiedPlatformAcceptance,recordVerifiedPlatformOutcome} from "./showcase-platform-acceptance";
import {readOptimizedDatasets} from "../showcase-optimized-datasets";
describe("platform acceptance creates optimized dataset before review or listing",()=>{
 beforeEach(()=>sessionStorage.clear());
 const task:ShowcaseUploadTask={id:"LIST-1",organizationId:"org",memberId:"member",source:"采集批次",batchId:"raw-1",batchName:"春季采集",sourceVersionId:"original",productIds:["P-1"],productCount:1,missingCount:0,storeId:"store-1",storeName:"一号店",platform:"SHEIN",region:"美国站",storeType:"半托店",rule:"默认",agentId:null,agentName:null,templateId:null,mode:"直接上传到平台",status:"待平台提交",createdAt:"2026-11-23",demo:true};
 const receipt={verifiedBy:"platform-callback" as const,result:"accepted" as const,taskId:"LIST-1",externalReceiptId:"SHEIN-REC-1",acceptedAt:"2026-11-23T10:00:00Z"};
 const product={sourceProductId:"P-1",name:"Cotton Shirt",images:["new-us-image"],description:"Optimized English description",skuCodes:["ORIGINAL-SKU"]};
 it("does not create optimized data on queued tasks or untrusted receipt",()=>{
  expect(addShowcaseUploadTask(task)).toBe(true);
  expect(readOptimizedDatasets("org","member")).toHaveLength(0);
  expect(()=>recordVerifiedPlatformAcceptance("org","member",{...receipt,taskId:"another"},[product],"英语")).toThrow();
  expect(()=>recordVerifiedPlatformAcceptance("org","member",receipt,[{...product,sourceProductId:"OTHER"}],"英语")).toThrow();
  expect(readOptimizedDatasets("org","member")).toHaveLength(0);
 });
 it("saves on verified acceptance and follows review/listing changes without duplicating versions",()=>{
  addShowcaseUploadTask(task);
  const accepted=recordVerifiedPlatformAcceptance("org","member",receipt,[product],"英语");
  expect(accepted).toMatchObject({sourceBatchId:"raw-1",sourceKind:"采集批次",reviewStatus:"待审核",listingStatus:"未上架"});
  expect(recordVerifiedPlatformAcceptance("org","member",receipt,[product],"英语").id).toBe(accepted.id);
  const audited=recordVerifiedPlatformOutcome("org","member",{verifiedBy:"platform-callback",taskId:receipt.taskId,externalReceiptId:receipt.externalReceiptId,reviewStatus:"审核通过",listingStatus:"未上架"});
  expect(audited.reviewStatus).toBe("审核通过");
  const published=recordVerifiedPlatformOutcome("org","member",{verifiedBy:"platform-callback",taskId:receipt.taskId,externalReceiptId:receipt.externalReceiptId,reviewStatus:"审核通过",listingStatus:"已上架"});
  expect(published.listingStatus).toBe("已上架");
  expect(readOptimizedDatasets("org","member")).toHaveLength(1);
  expect(readOptimizedDatasets("org","member")[0].products[0].images).toEqual(["new-us-image"]);
  expect(readOptimizedDatasets("another-org","member")).toHaveLength(0);
 });
});
