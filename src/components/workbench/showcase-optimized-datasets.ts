"use client";
import {readShowcaseUploadTasks} from "./listing/showcase-upload-tasks";
import {readDemoCollectionBatches} from "./showcase-collection-batches";

/** Immutable, reusable adapted-product snapshots. Never merge them into original inventory.
 * Demo session storage only. A real service must authenticate upload receipts server-side.
 */
export type OptimizedDatasetProduct={
 sourceProductId:string;name:string;images:string[];description:string;
 skuCodes:string[]; /** product presentation only: no stock/price overwrite */
};
export type PlatformReviewStatus="待审核"|"审核中"|"审核通过"|"审核驳回";
export type PlatformListingStatus="未上架"|"已上架"|"已下架";
export type OptimizedDataset={
 id:string;name:string;createdAt:string;version:number;
 sourceKind:"采集批次"|"自有商品库";sourceBatchId:string;sourceBatchName:string;
 platform:string;site:string;language:string;storeName:string;
 uploadTaskId:string;externalReceiptId:string;
 acceptedAt?:string;reviewStatus?:PlatformReviewStatus;listingStatus?:PlatformListingStatus;reviewUpdatedAt?:string;
 products:OptimizedDatasetProduct[];
 demo?:true;storeType?:string;
};
const key=(org:string,member:string)=>"shuomi:optimized-datasets-v1:"+org+":"+member;
const statusKey=(org:string,member:string)=>"shuomi:optimized-dataset-platform-states-v1:"+org+":"+member;
export type DatasetPlatformState={datasetId:string;reviewStatus:PlatformReviewStatus;listingStatus:PlatformListingStatus;updatedAt:string};
const readStates=(org:string,member:string):DatasetPlatformState[]=>{try{const data:unknown=JSON.parse(sessionStorage.getItem(statusKey(org,member))||"[]");return Array.isArray(data)?data.filter((x):x is DatasetPlatformState=>Boolean(x&&typeof x==="object"&&"datasetId"in x&&"reviewStatus"in x&&"listingStatus"in x)):[]}catch{return []}};
export const optimizedDatasetsChanged="shuomi:optimized-datasets-changed";
export function readOptimizedDatasets(org:string,member:string):OptimizedDataset[]{
 if(typeof window==="undefined")return [];
 try{
  const value:unknown=JSON.parse(sessionStorage.getItem(key(org,member))||"[]");
  if(!Array.isArray(value))return [];
  const states=new Map(readStates(org,member).map(s=>[s.datasetId,s]));
  return value.filter((v):v is OptimizedDataset=>Boolean(v&&typeof v==="object"&&"id"in v&&typeof v.id==="string"&&"products"in v&&Array.isArray(v.products)&&"sourceBatchId"in v&&"language"in v&&"platform"in v&&"site"in v)).map(v=>({...v,acceptedAt:v.acceptedAt||v.createdAt,reviewStatus:states.get(v.id)?.reviewStatus??v.reviewStatus??"待审核",listingStatus:states.get(v.id)?.listingStatus??v.listingStatus??"未上架",reviewUpdatedAt:states.get(v.id)?.updatedAt??v.reviewUpdatedAt}));
 }catch{return [];}
}
/** Call only after a verified platform success response from a trusted service.
 * Client-submitted success flags are never adequate evidence.
 */
export function saveVerifiedOptimizedDataset(
 org:string,member:string,
 payload:Omit<OptimizedDataset,"id"|"createdAt"|"version"|"acceptedAt"|"reviewStatus"|"listingStatus"|"reviewUpdatedAt">,
 verifiedReceipt:{verifiedBy:"platform-callback";taskId:string;externalReceiptId:string;acceptedAt?:string;result?:"accepted"|"rejected"}|null
):OptimizedDataset{
 if(!verifiedReceipt||verifiedReceipt.result!=="accepted"||verifiedReceipt.verifiedBy!=="platform-callback"||verifiedReceipt.taskId!==payload.uploadTaskId||verifiedReceipt.externalReceiptId!==payload.externalReceiptId||!verifiedReceipt.externalReceiptId.trim())
  throw Error("缺少已核实的上传成功回执，不能保存为已优化数据集");
 if(typeof window==="undefined")throw Error("演示存储不可用");
 if(!payload.products.length||!payload.sourceBatchId.trim()||!payload.platform.trim()||!payload.site.trim()||!payload.language.trim())throw Error("优化版本信息不完整");
 const existing=readOptimizedDatasets(org,member);
 const duplicate=existing.find(d=>d.uploadTaskId===payload.uploadTaskId&&d.externalReceiptId===payload.externalReceiptId);
 if(duplicate)return duplicate;
 const revision=existing.filter(d=>d.sourceKind===payload.sourceKind&&d.sourceBatchId===payload.sourceBatchId&&d.platform===payload.platform&&d.site===payload.site&&d.language===payload.language).reduce((n,d)=>Math.max(n,d.version),0)+1;
 const record:OptimizedDataset={...payload,id:"OPT-"+crypto.randomUUID(),version:revision,createdAt:new Date().toLocaleString("zh-CN",{hour12:false}),acceptedAt:verifiedReceipt.acceptedAt||new Date().toISOString(),reviewStatus:"待审核",listingStatus:"未上架"};
 sessionStorage.setItem(key(org,member),JSON.stringify([record,...existing]));
 window.dispatchEvent(new CustomEvent(optimizedDatasetsChanged,{detail:{organizationId:org,memberId:member}}));
 return record;
}

/** Apply subsequent review / listing callbacks separately: never create new versions.
 * This store is a showcase. Production must authenticate callbacks and enforce tenant permissions on the server.
 */
export function updateOptimizedDatasetPlatformState(
 org:string,member:string,datasetId:string,
 next:Pick<DatasetPlatformState,"reviewStatus"|"listingStatus">,
 verified:{verifiedBy:"platform-callback";externalReceiptId:string}|null
):OptimizedDataset{
 if(!verified||verified.verifiedBy!=="platform-callback")throw Error("必须收到经验证的平台状态回执");
 const records=readOptimizedDatasets(org,member),record=records.find(d=>d.id===datasetId);
 if(!record||verified.externalReceiptId!==record.externalReceiptId)throw Error("平台回执与商品版本不匹配");
 const validReview:PlatformReviewStatus[]=["待审核","审核中","审核通过","审核驳回"];
 const validListing:PlatformListingStatus[]=["未上架","已上架","已下架"];
 if(!validReview.includes(next.reviewStatus)||!validListing.includes(next.listingStatus))throw Error("平台状态不合法");
 if(next.listingStatus==="已上架"&&next.reviewStatus!=="审核通过")throw Error("尚未审核通过，不能标记为已上架");
 if(next.reviewStatus==="审核驳回"&&next.listingStatus==="已上架")throw Error("审核驳回不能保持已上架");
 const states=readStates(org,member).filter(s=>s.datasetId!==datasetId);
 const state:DatasetPlatformState={datasetId,reviewStatus:next.reviewStatus,listingStatus:next.listingStatus,updatedAt:new Date().toISOString()};
 sessionStorage.setItem(statusKey(org,member),JSON.stringify([...states,state]));
 window.dispatchEvent(new CustomEvent(optimizedDatasetsChanged,{detail:{organizationId:org,memberId:member}}));
 return {...record,...state};
}

/** Browser-only accepted snapshots. Never pass these to verified callback APIs. Stable task IDs
 * backfill previously accepted demo submissions without re-running listing or inventing receipts. */
export function readReusableOptimizedDatasets(org:string,member:string):OptimizedDataset[]{
 const verified=readOptimizedDatasets(org,member);
 const names=new Map(readDemoCollectionBatches(org,member).map(b=>[b.id,b.name]));
 const tasks=readShowcaseUploadTasks(org,member).filter(t=>t.status==="模拟已提交"&&t.demoSubmission?.result==="模拟提交成功"&&t.demoProduct&&t.source!=="数据集").sort((a,b)=>a.demoSubmission!.submittedAt.localeCompare(b.demoSubmission!.submittedAt)||a.id.localeCompare(b.id));
 const result=verified.map(d=>({...d,sourceBatchName:d.sourceKind==="采集批次"?names.get(d.sourceBatchId)??d.sourceBatchName:d.sourceBatchName}));
 for(const t of tasks){
  if(verified.some(d=>d.uploadTaskId===t.id))continue;
  const p=t.demoProduct!;
  const version=result.filter(d=>d.sourceKind===t.source&&d.sourceBatchId===t.batchId).reduce((n,d)=>Math.max(n,d.version),0)+1;
  const batchName=t.source==="采集批次"?names.get(t.batchId)??t.batchName:t.batchName;
  const images=[...new Set([...Object.values(t.imageEdits??{}).flatMap(x=>x.main??[]),...p.optimizedImages,...(p.variantImageGroups??[]).flatMap(g=>g.optimizedImages.map(x=>x.url))])];
  const skus=p.variantDetails?.map(v=>t.textEdits?.merchantSkuCodes?.[v.sku]??v.sku)??t.productIds;
  result.push({id:"DEMO-OPT-"+t.id,name:batchName+" · "+t.platform+" "+t.region+"优化版（演示）",createdAt:t.demoSubmission!.submittedAt,acceptedAt:t.demoSubmission!.submittedAt,version,sourceKind:t.source as OptimizedDataset["sourceKind"],sourceBatchId:t.batchId,sourceBatchName:batchName,platform:t.platform,site:t.region,language:t.region==="美国站"?"英语":"站点适配",storeName:t.storeName,storeType:t.storeType,uploadTaskId:t.id,externalReceiptId:"",reviewStatus:"审核通过",listingStatus:"未上架",demo:true,products:t.productIds.map(id=>({sourceProductId:id,name:t.textEdits?.title??p.optimizedName,description:t.textEdits?.description??p.optimizedDescription,images:[...images],skuCodes:[...skus]}))});
 }
 return result;
}
