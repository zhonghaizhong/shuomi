"use client";
import {readOwnProducts,ownProductUpdated,type OwnProductRecord} from "./showcase-own-product-data";
import {SHUOMI_ADAPTATION_TEMPLATE_ID,SHUOMI_ADAPTATION_TEMPLATE_NAME} from "./showcase-agent-template-store";
import {readOptimizedDatasets,optimizedDatasetsChanged,type OptimizedDataset,type OptimizedDatasetProduct} from "./showcase-optimized-datasets";

/** Showcase-only, tenant/member scoped preferred-supplier application records.
 * A browser demo decision is not an authenticated platform moderation result.
 * Production must persist applications and authorize review/publishing server-side.
 */
export type PreferredDecision="待审核"|"已通过"|"未通过";
export type PreferredSupply={stock:string;moq:string;dispatch:string;origin:string;pricing:string;returns:string};
export const emptyPreferredSupply:PreferredSupply={stock:"",moq:"",dispatch:"",origin:"",pricing:"",returns:""};
export type PreferredProductSnapshot={
 sourceProductId:string;sku:string;name:string;image:string;category:string;
 batchId:string;versionId:string;versionName:string;platform:string;site:string;
 description:string;skuCount:number;
};
export type PreferredApplicationRecord={
 id:string;createdAt:string;updatedAt:string;status:PreferredDecision;
 reviewNote:string;reviewOrigin:"未审核"|"仅演示";
 products:PreferredProductSnapshot[];supply:PreferredSupply;
 secondaryOptimization?: "待二次优化"|"已完成";
};
export type PreferredCandidate={
 product:OwnProductRecord;optimized?:OptimizedDataset;
 snapshot?:PreferredProductSnapshot;
 status:"待申请"|"审核中"|"审核未通过"|"待二次优化"|"已入选";
 lastRejected?:string;
};
const key=(org:string,member:string)=>"shuomi:preferred-applications-demo-v2:"+encodeURIComponent(org)+":"+encodeURIComponent(member);
export const preferredApplicationChanged="shuomi:preferred-applications-changed";
const signal=(org:string,member:string)=>{window.dispatchEvent(new CustomEvent(preferredApplicationChanged,{detail:{organizationId:org,memberId:member}}));};
export function readPreferredApplications(org:string,member:string):PreferredApplicationRecord[]{
 if(typeof window==="undefined")return [];
 try{
  const data:unknown=JSON.parse(sessionStorage.getItem(key(org,member))||"[]");
  return Array.isArray(data)?data.filter((row):row is PreferredApplicationRecord=>
   Boolean(row&&typeof row==="object"&&typeof row.id==="string"&&["待审核","已通过","未通过"].includes(row.status)&&Array.isArray(row.products)&&row.supply&&typeof row.createdAt==="string")
  ):[];
 }catch{return []}
}
function findOptimizedProduct(own:OwnProductRecord,versions:OptimizedDataset[]){
 const matches:{dataset:OptimizedDataset;entry:OptimizedDatasetProduct}[]=[];
 for(const dataset of versions){
  if(dataset.sourceKind!=="自有商品库"||dataset.sourceBatchId!==own.batchId)continue;
  for(const entry of dataset.products){
   if(entry.sourceProductId===own.id||
    (entry.skuCodes?.length>0&&own.skus.some(sku=>Boolean(sku.skuCode)&&entry.skuCodes.includes(sku.skuCode!)))){
    matches.push({dataset,entry});
   }
  }
 }
 matches.sort((a,b)=>b.dataset.version-a.dataset.version||String(b.dataset.createdAt).localeCompare(String(a.dataset.createdAt)));
 return matches[0];
}
export function readPreferredCandidates(org:string,member:string):PreferredCandidate[]{
 const own=readOwnProducts(org,member),applications=readPreferredApplications(org,member);
 // Candidate source is the approved own-product library only.
 return own.filter(p=>p.status==="已入库"&&!p.missing.length&&p.skus.length>0).map(product=>{
  const latest=applications.filter(record=>record.products.some(p=>p.sourceProductId===product.id))
   .sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
  const sourceSnapshot:PreferredProductSnapshot={
   sourceProductId:product.id,
   sku:product.skus.map(p=>p.skuCode||String(p.id)).join(" / "),
   name:product.skus[0].name,
   image:product.skus[0].images.find(Boolean)||"",
   category:product.name,
   batchId:product.batchId,
   versionId:"shuomi-own-intake:"+product.id,
   versionName:"自有商品已入库",
   platform:"硕米平台",
   site:"自有商品库",
   description:product.skus[0].description,
   skuCount:product.skus.length
  };
  const status:PreferredCandidate["status"]=latest?.status==="已通过"
    ?latest.secondaryOptimization==="已完成"?"已入选":"待二次优化"
    :latest?.status==="待审核"?"审核中"
    :latest?.status==="未通过"?"审核未通过":"待申请";
  return {product,snapshot:sourceSnapshot,status,
   lastRejected:latest?.status==="未通过"?latest.reviewNote:undefined};
 });
}
function validateSupply(supply:PreferredSupply){
 if(!Number.isSafeInteger(Number(supply.stock))||Number(supply.stock)<1||
    !Number.isSafeInteger(Number(supply.moq))||Number(supply.moq)<1||
    Number(supply.moq)>Number(supply.stock))throw Error("请填写有效库存及不超过库存的起订量");
 if(!supply.dispatch.trim()||!supply.origin.trim()||!supply.returns.trim())throw Error("请补充发货时效、发货地和售后政策");
}
export function submitPreferredDemoApplication(org:string,member:string,productIds:string[],supply:PreferredSupply):PreferredApplicationRecord{
 if(typeof window==="undefined")throw Error("演示申请只能在浏览器中操作");
 const ids=[...new Set(productIds)];
 if(!ids.length)throw Error("请先选择至少一件可申请商品");
 validateSupply(supply);
 const candidates=readPreferredCandidates(org,member);
 const eligible=ids.map(id=>candidates.find(c=>c.product.id===id));
 if(eligible.some(c=>!c||c.status!=="待申请"||!c.snapshot))throw Error("所选商品已变化或尚未完成自有商品入库审核或已发起优选申请，请刷新商品列表");
 const now=new Date().toISOString();
 const row:PreferredApplicationRecord={
  id:"SQ-DEMO-"+Date.now().toString(36).toUpperCase()+"-"+Math.random().toString(36).slice(2,6).toUpperCase(),
  createdAt:now,updatedAt:now,status:"待审核",
  reviewNote:"演示申请已记录，等待审核。正式业务需要服务端审核与通知。",
  reviewOrigin:"未审核",
  products:eligible.map(c=>({...c!.snapshot!})),supply:{...supply}
 };
 const records=readPreferredApplications(org,member);
 sessionStorage.setItem(key(org,member),JSON.stringify([row,...records]));
 signal(org,member);
 return row;
}
/** Explicit demo review controls; never imply the browser has authority to approve real suppliers. */
export function simulatePreferredReview(org:string,member:string,id:string,decision:"已通过"|"未通过",reason?:string):PreferredApplicationRecord{
 if(typeof window==="undefined")throw Error("当前无法执行演示审核");
 const rows=readPreferredApplications(org,member),row=rows.find(item=>item.id===id);
 if(!row||row.status!=="待审核")throw Error("仅允许审核当前账号下的待审核演示申请");
 const next={...row,status:decision,secondaryOptimization:decision==="已通过"?"待二次优化" as const:undefined,updatedAt:new Date().toISOString(),reviewOrigin:"仅演示" as const,
  reviewNote:decision==="已通过"?"演示申请审核通过，待使用官方「硕米适配」模板完成二次优化；尚未进入优选展示。":reason?.trim()||"演示审核未通过：请补充资料后重新发起申请。"};
 sessionStorage.setItem(key(org,member),JSON.stringify(rows.map(item=>item.id===id?next:item)));
 signal(org,member);
 return next;
}
/** Explicit second-stage demo operation after a distinct preferred application approval.
 * It preserves the source-product version and never pretends that an AI model ran.
 */
export function completePreferredSecondaryOptimizationDemo(org:string,member:string,id:string):PreferredApplicationRecord{
 const rows=readPreferredApplications(org,member);
 const row=rows.find(item=>item.id===id);
 if(!row||row.status!=="已通过")throw Error("优选申请审核通过后才可执行二次优化");
 if(row.secondaryOptimization==="已完成")return row;
 const own=readOwnProducts(org,member);
 if(row.products.some(p=>!own.some(source=>source.id===p.sourceProductId&&source.status==="已入库")))
  throw Error("原始自有商品已不存在或未入库，无法完成二次优化");
 const next:PreferredApplicationRecord={
  ...row,secondaryOptimization:"已完成",updatedAt:new Date().toISOString(),
  products:row.products.map(product=>({
   ...product,
   versionId:"shuomi-official-secondary-demo:"+SHUOMI_ADAPTATION_TEMPLATE_ID+":"+product.sourceProductId,
   versionName:SHUOMI_ADAPTATION_TEMPLATE_NAME+" · 二次优化（演示）"
  })),
  reviewNote:"申请审核已通过；已使用官方「硕米适配」模板完成本地演示字段整理，非真实 AI 生成或正式平台发布。"
 };
 sessionStorage.setItem(key(org,member),JSON.stringify(rows.map(item=>item.id===id?next:item)));
 signal(org,member);
 return next;
}
/** Only approved snapshots appear in the preferred showcase; originals are untouched. */
export function readDemoSelectedCatalog(org:string,member:string):{applicationId:string;product:PreferredProductSnapshot;supply:PreferredSupply;reviewOrigin:string}[]{
 const map=new Map<string,{applicationId:string;product:PreferredProductSnapshot;supply:PreferredSupply;reviewOrigin:string}>();
 for(const record of readPreferredApplications(org,member).filter(row=>row.status==="已通过"&&row.secondaryOptimization==="已完成")){
  for(const product of record.products)if(!map.has(product.sourceProductId))map.set(product.sourceProductId,{
   applicationId:record.id,product,supply:record.supply,reviewOrigin:record.reviewOrigin
  });
 }
 return [...map.values()];
}
export {ownProductUpdated,optimizedDatasetsChanged};
