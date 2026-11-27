"use client";

/** POD print provenance for the browser-only showcase.
 *
 * Production orders MUST store the same immutable identifiers, source SHA-256
 * and frozen print-file URL in durable backend storage; sessionStorage is
 * intentionally NOT a production fulfillment archive.
 */
export type PodPrintReviewStatus="待审核"|"审核通过"|"退回重做"|"驳回";
export type PodPrintVersion={
  printId:string;version:number;originPrintId:string;
  name:string;sourceBatchId:string;sourceKind:"图片裂变";
  assetPath:string;sha256:string;mimeType:"image/png"|"image/webp";
  width:number;height:number;createdAt:string;
};
export type PodPrintReview={
  reviewId:string;printId:string;version:number;
  status:PodPrintReviewStatus;updatedAt:string;reviewNote?:string;
};
export type PodProductPrintBinding={
  productId:string;variantId:string;sku?:string;printId:string;printVersion:number;
  assetPath:string;sha256:string;createdAt:string;
};
export type PodOrderLinePrintSnapshot={
  orderId:string;orderLineId:string;platform:string;externalOrderId:string;
  productId:string;variantId:string;sku?:string;printId:string;printVersion:number;
  assetPath:string;sha256:string;frozenAt:string;
};
export type PodPrintLineageState={
 prints:PodPrintVersion[];reviews:PodPrintReview[];
 bindings:PodProductPrintBinding[];orders:PodOrderLinePrintSnapshot[];
};
const empty=():PodPrintLineageState=>({prints:[],reviews:[],bindings:[],orders:[]});
const key=(organizationId:string,memberId:string)=>
 "shuomi:pod:print-lineage:v1:"+encodeURIComponent(organizationId)+":"+encodeURIComponent(memberId);
const printKey=(printId:string,version:number)=>printId+"@"+version;
const validHash=(hash:string)=>/^[a-f0-9]{64}$/.test(hash);
const validAssetPath=(path:string)=>/^\/assets\/pod-prints\/[a-zA-Z0-9_/-]+\.(?:png|webp)$/.test(path)&&!path.includes("..");
export function readPodPrintLineage(organizationId:string,memberId:string):PodPrintLineageState{
 if(typeof window==="undefined")return empty();
 try {
  const data=JSON.parse(sessionStorage.getItem(key(organizationId,memberId))||"null") as PodPrintLineageState|null;
  if(!data||!Array.isArray(data.prints)||!Array.isArray(data.reviews)||!Array.isArray(data.bindings)||!Array.isArray(data.orders))return empty();
  return data;
 }catch{return empty();}
}
const store=(organizationId:string,memberId:string,next:PodPrintLineageState)=>{
 sessionStorage.setItem(key(organizationId,memberId),JSON.stringify(next));
 window.dispatchEvent(new CustomEvent("shuomi:pod:print-lineage:change",{detail:{organizationId,memberId}}));
 return next;
};
/** Register only actual immutable GitHub-hosted assets, never placeholders. */
export function registerPodPrint(organizationId:string,memberId:string,print:PodPrintVersion):PodPrintLineageState{
 if(!print.printId.trim()||!print.originPrintId.trim()||!print.sourceBatchId.trim()||
  !Number.isSafeInteger(print.version)||print.version<1||!validHash(print.sha256)||
  !validAssetPath(print.assetPath)||print.width<1||print.height<1)
  throw Error("必须先保存真实印花文件、SHA256 和原始批次，才能登记审核");
 const current=readPodPrintLineage(organizationId,memberId);
 const previous=current.prints.find(p=>p.printId===print.printId&&p.version===print.version);
 if(previous){
  if(JSON.stringify(previous)!==JSON.stringify(print))throw Error("已登记的印花版本不可覆盖，请创建新版本");
  return current;
 }
 if(current.prints.some(p=>p.assetPath===print.assetPath&&p.sha256!==print.sha256))
  throw Error("同一个存储路径不能覆盖已有印花文件");
 const review:PodPrintReview={reviewId:"print-review:"+printKey(print.printId,print.version),
  printId:print.printId,version:print.version,status:"待审核",updatedAt:new Date().toISOString()};
 return store(organizationId,memberId,{...current,prints:[...current.prints,print],reviews:[...current.reviews,review]});
}
export function reviewPodPrint(organizationId:string,memberId:string,printId:string,version:number,status:PodPrintReviewStatus,note=""){
 const current=readPodPrintLineage(organizationId,memberId);
 const review=current.reviews.find(x=>x.printId===printId&&x.version===version);
 if(!review)throw Error("印花审核记录不存在");
 if(review.status!=="待审核")throw Error("审核已完成，不允许覆盖原审核结论；请创建新印花版本");
 return store(organizationId,memberId,{...current,reviews:current.reviews.map(x=>x===review?
  {...x,status,reviewNote:note,updatedAt:new Date().toISOString()}:x)});
}
/** Undo an accidental demo approval, but never rewrite prints with frozen order references. */
export function reopenPodPrintReview(organizationId:string,memberId:string,printId:string,version:number){
 const current=readPodPrintLineage(organizationId,memberId);
 const review=current.reviews.find(x=>x.printId===printId&&x.version===version);
 if(!review)throw Error("审核记录不存在");
 if(current.orders.some(x=>x.printId===printId&&x.printVersion===version))
  throw Error("此印花已有订单履约快照，不能直接撤销审核；需人工处理");
 if(review.status==="待审核")return current;
 if(review.status!=="审核通过")throw Error("只有已通过的印花允许撤销通过");
 return store(organizationId,memberId,{
  ...current,
  reviews:current.reviews.map(x=>x===review?{...x,status:"待审核",reviewNote:"误操作撤销：重新进入待审核",updatedAt:new Date().toISOString()}:x),
  bindings:current.bindings.filter(x=>x.printId!==printId||x.printVersion!==version),
 });
}
export function bindPodPrintToVariant(organizationId:string,memberId:string,productId:string,variantId:string,printId:string,version:number,sku?:string){
 const current=readPodPrintLineage(organizationId,memberId);
 const print=current.prints.find(x=>x.printId===printId&&x.version===version);
 const review=current.reviews.find(x=>x.printId===printId&&x.version===version);
 if(!print||review?.status!=="审核通过")throw Error("印花尚未通过审核，不能绑定商品变体");
 if(!productId.trim()||!variantId.trim())throw Error("商品和变体编号不能为空");
 const binding:PodProductPrintBinding={productId,variantId,sku,printId,printVersion:version,
  assetPath:print.assetPath,sha256:print.sha256,createdAt:new Date().toISOString()};
 const bindings=current.bindings.filter(x=>x.productId!==productId||x.variantId!==variantId);
 return store(organizationId,memberId,{...current,bindings:[...bindings,binding]});
}
/** On order creation, freeze the precise file/version so later product edits do not rewrite history. */
export function freezePodOrderLine(organizationId:string,memberId:string,ids:{
 orderId:string;orderLineId:string;platform:string;externalOrderId:string;productId:string;variantId:string;sku?:string;
}):PodOrderLinePrintSnapshot{
 const current=readPodPrintLineage(organizationId,memberId);
 const exists=current.orders.find(x=>x.orderId===ids.orderId&&x.orderLineId===ids.orderLineId);
 if(exists)return exists;
 if(["orderId","orderLineId","platform","externalOrderId","productId","variantId"].some(k=>!ids[k as keyof typeof ids]?.trim()))throw Error("订单、平台、商品和变体编号不能为空");
 const binding=current.bindings.find(x=>x.productId===ids.productId&&x.variantId===ids.variantId);
 if(!binding)throw Error("该商品变体未绑定审核通过的印花，不能创建印花履约记录");
 const snapshot:PodOrderLinePrintSnapshot={...ids,sku:ids.sku||binding.sku,printId:binding.printId,printVersion:binding.printVersion,
  assetPath:binding.assetPath,sha256:binding.sha256,frozenAt:new Date().toISOString()};
 store(organizationId,memberId,{...current,orders:[...current.orders,snapshot]});
 return snapshot;
}
export function findPodPrintForOrderLine(organizationId:string,memberId:string,orderId:string,orderLineId:string){
 const current=readPodPrintLineage(organizationId,memberId);
 const order=current.orders.find(x=>x.orderId===orderId&&x.orderLineId===orderLineId);
 if(!order)return null;
 const print=current.prints.find(x=>x.printId===order.printId&&x.version===order.printVersion);
 if(!print||print.sha256!==order.sha256||print.assetPath!==order.assetPath)
  throw Error("原始印花版本无法校验，请停止履约并核对存档");
 return {order,print};
}


/** Search a print by its fixed ID, exact version, name, source batch, originating
 * artwork, associated product/variant, or frozen platform order numbers.
 * Order references resolve the ORIGINAL purchased print version, even if the
 * current SKU now points to a different design.
 */
export type PodPrintSearchHit={
 print:PodPrintVersion;reviewStatus:PodPrintReviewStatus|"未知";
 productIds:string[];variantIds:string[];skus:string[];orderIds:string[];
 externalOrderIds:string[];platforms:string[];
};
export function searchPodPrints(organizationId:string,memberId:string,query:string):PodPrintSearchHit[]{
 const state=readPodPrintLineage(organizationId,memberId);
 const needle=query.trim().toLocaleLowerCase();
 return state.prints.map(print=>{
  const bindings=state.bindings.filter(x=>x.printId===print.printId&&x.printVersion===print.version);
  const orders=state.orders.filter(x=>x.printId===print.printId&&x.printVersion===print.version);
  const review=state.reviews.find(x=>x.printId===print.printId&&x.version===print.version);
  const hit:PodPrintSearchHit={
   print,reviewStatus:review?.status??"未知",
   productIds:[...new Set([...bindings.map(x=>x.productId),...orders.map(x=>x.productId)])],
   variantIds:[...new Set([...bindings.map(x=>x.variantId),...orders.map(x=>x.variantId)])],
   skus:[...new Set([...bindings.map(x=>x.sku),...orders.map(x=>x.sku)].filter((x):x is string=>!!x))],
   orderIds:[...new Set(orders.map(x=>x.orderId))],
   externalOrderIds:[...new Set(orders.map(x=>x.externalOrderId))],
   platforms:[...new Set(orders.map(x=>x.platform))]
  };
  const fields=[print.printId,print.printId+"@"+print.version,print.name,
   print.originPrintId,print.sourceBatchId,print.assetPath,print.sha256,
   ...hit.productIds,...hit.variantIds,...hit.skus,...hit.orderIds,...hit.externalOrderIds,...hit.platforms];
  return {hit,matches:!needle||fields.some(value=>value.toLocaleLowerCase().includes(needle))};
 }).filter(x=>x.matches).map(x=>x.hit);
}
