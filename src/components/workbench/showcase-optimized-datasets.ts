"use client";

/** Immutable, reusable adapted-product snapshots. Never merge them into original inventory.
 * Demo session storage only. A real service must authenticate upload receipts server-side.
 */
export type OptimizedDatasetProduct={
 sourceProductId:string;name:string;images:string[];description:string;
 skuCodes:string[]; /** product presentation only: no stock/price overwrite */
};
export type OptimizedDataset={
 id:string;name:string;createdAt:string;version:number;
 sourceKind:"采集批次"|"自有商品库";sourceBatchId:string;sourceBatchName:string;
 platform:string;site:string;language:string;storeName:string;
 uploadTaskId:string;externalReceiptId:string;
 products:OptimizedDatasetProduct[];
};
const key=(org:string,member:string)=>"shuomi:optimized-datasets-v1:"+org+":"+member;
export const optimizedDatasetsChanged="shuomi:optimized-datasets-changed";
export function readOptimizedDatasets(org:string,member:string):OptimizedDataset[]{
 if(typeof window==="undefined")return [];
 try{
  const value:unknown=JSON.parse(sessionStorage.getItem(key(org,member))||"[]");
  if(!Array.isArray(value))return [];
  return value.filter((v):v is OptimizedDataset=>Boolean(v&&typeof v==="object"&&"id"in v&&typeof v.id==="string"&&"products"in v&&Array.isArray(v.products)&&"sourceBatchId"in v&&"language"in v&&"platform"in v&&"site"in v));
 }catch{return [];}
}
/** Call only after a verified platform success response from a trusted service.
 * Client-submitted success flags are never adequate evidence.
 */
export function saveVerifiedOptimizedDataset(
 org:string,member:string,
 payload:Omit<OptimizedDataset,"id"|"createdAt"|"version">,
 verifiedReceipt:{verifiedBy:"platform-callback";taskId:string;externalReceiptId:string}|null
):OptimizedDataset{
 if(!verifiedReceipt||verifiedReceipt.verifiedBy!=="platform-callback"||verifiedReceipt.taskId!==payload.uploadTaskId||verifiedReceipt.externalReceiptId!==payload.externalReceiptId||!verifiedReceipt.externalReceiptId.trim())
  throw Error("缺少已核实的上传成功回执，不能保存为已优化数据集");
 if(typeof window==="undefined")throw Error("演示存储不可用");
 if(!payload.products.length||!payload.sourceBatchId.trim()||!payload.platform.trim()||!payload.site.trim()||!payload.language.trim())throw Error("优化版本信息不完整");
 const existing=readOptimizedDatasets(org,member);
 const duplicate=existing.find(d=>d.uploadTaskId===payload.uploadTaskId&&d.externalReceiptId===payload.externalReceiptId);
 if(duplicate)return duplicate;
 const revision=existing.filter(d=>d.sourceKind===payload.sourceKind&&d.sourceBatchId===payload.sourceBatchId&&d.platform===payload.platform&&d.site===payload.site&&d.language===payload.language).reduce((n,d)=>Math.max(n,d.version),0)+1;
 const record:OptimizedDataset={...payload,id:"OPT-"+crypto.randomUUID(),version:revision,createdAt:new Date().toLocaleString("zh-CN",{hour12:false})};
 sessionStorage.setItem(key(org,member),JSON.stringify([record,...existing]));
 window.dispatchEvent(new CustomEvent(optimizedDatasetsChanged,{detail:{organizationId:org,memberId:member}}));
 return record;
}
