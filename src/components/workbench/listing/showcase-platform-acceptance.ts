"use client";
import {readShowcaseUploadTasks} from "./showcase-upload-tasks";
import {readOptimizedDatasets,saveVerifiedOptimizedDataset,updateOptimizedDatasetPlatformState,type OptimizedDataset,type OptimizedDatasetProduct,type PlatformReviewStatus,type PlatformListingStatus} from "../showcase-optimized-datasets";

/** Showcase integration boundary. A trusted server must authenticate the actual third-party callback.
 * Do not call from a browser "upload" button, queued task or fabricated demo response.
 */
export type AcceptedPlatformReceipt={
 verifiedBy:"platform-callback";
 result:"accepted";
 taskId:string;externalReceiptId:string;acceptedAt:string;
};
export type AcceptedProductSnapshot={
 sourceProductId:string;name:string;images:string[];description:string;skuCodes:string[];
};
/** One accepted task may have several platform product receipts; the snapshot groups only
 * the verified accepted products and preserves their source lineage.
 */
export function recordVerifiedPlatformAcceptance(
 org:string,member:string,
 callback:AcceptedPlatformReceipt,
 acceptedProducts:AcceptedProductSnapshot[],
 language:string
):OptimizedDataset{
 if(callback.result!=="accepted"||callback.verifiedBy!=="platform-callback"||!Number.isFinite(Date.parse(callback.acceptedAt)))
  throw Error("平台接收回执不合法");
 const task=readShowcaseUploadTasks(org,member).find(t=>t.id===callback.taskId);
 if(!task)throw Error("找不到与回执匹配的原刊登任务");
 if(task.mode==="定时上传")throw Error("未实际执行的定时任务不能标记平台接收");
 if(!callback.externalReceiptId.trim()||!language.trim())throw Error("回执编号或适配语言缺失");
 if(!acceptedProducts.length||acceptedProducts.some(p=>!p.sourceProductId||!p.name.trim()||!p.images.length))
  throw Error("实际接收商品资料不完整");
 const inherited=task.source==="数据集"?readOptimizedDatasets(org,member).find(d=>d.id===task.sourceVersionId):null;
 if(task.source==="数据集"&&!inherited)throw Error("复用的源优化版本不存在");
 const ids=new Set(task.productIds);
 if(acceptedProducts.some(p=>!ids.has(p.sourceProductId)))throw Error("平台接收的商品不属于原任务");
 if(new Set(acceptedProducts.map(p=>p.sourceProductId)).size!==acceptedProducts.length)throw Error("同一回执不能重复关联商品");
 // This is a separate, immutable optimization snapshot: price, stock and source identity
 // are intentionally absent, so no source record can be overwritten by these values.
 const products:OptimizedDatasetProduct[]=acceptedProducts.map(p=>({
  sourceProductId:p.sourceProductId,name:p.name,images:[...p.images],
  description:p.description,skuCodes:[...p.skuCodes]
 }));
 return saveVerifiedOptimizedDataset(org,member,{
  name:task.batchName+" · "+task.platform+" "+task.region+"优化版",
  sourceKind:inherited?inherited.sourceKind:task.source as "采集批次"|"自有商品库",
  sourceBatchId:inherited?inherited.sourceBatchId:task.batchId,sourceBatchName:inherited?inherited.sourceBatchName:task.batchName,
  platform:task.platform,site:task.region,language,storeName:task.storeName,
  uploadTaskId:task.id,externalReceiptId:callback.externalReceiptId,products
 },callback);
}
export function recordVerifiedPlatformOutcome(
 org:string,member:string,callback:{verifiedBy:"platform-callback";taskId:string;externalReceiptId:string;reviewStatus:PlatformReviewStatus;listingStatus:PlatformListingStatus}
):OptimizedDataset{
 const dataset=readOptimizedDatasets(org,member).find(d=>d.uploadTaskId===callback.taskId&&d.externalReceiptId===callback.externalReceiptId);
 if(!dataset)throw Error("没有收到平台接收回执，无法更新审核或上架状态");
 return updateOptimizedDatasetPlatformState(org,member,dataset.id,{reviewStatus:callback.reviewStatus,listingStatus:callback.listingStatus},callback);
}
