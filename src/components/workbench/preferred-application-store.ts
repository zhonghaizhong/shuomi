"use client";
import {readOwnProducts,ownProductUpdated,type OwnProductRecord} from "./showcase-own-product-data";
import {SHUOMI_ADAPTATION_AGENT,SHUOMI_ADAPTATION_TEMPLATE_ID,SHUOMI_ADAPTATION_TEMPLATE_NAME} from "./showcase-agent-template-store";
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
};
export type PreferredCandidate={
 product:OwnProductRecord;optimized?:OptimizedDataset;
 snapshot?:PreferredProductSnapshot;
 status:"可申请"|"待首次适配"|"待智能体优化"|"审核中"|"已入选";
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
 const own=readOwnProducts(org,member),versions=readOptimizedDatasets(org,member),applications=readPreferredApplications(org,member);
 return own.map(product=>{
  const latest=applications.filter(record=>record.products.some(p=>p.sourceProductId===product.id))
   .sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
  // “待审核” is the Shuomi own-product intake review, NOT an external
  // marketplace review. “已入库” means that in-app review passed.
  const intakeApproved=product.status==="已入库"&&!product.missing.length&&product.skus.length>0;
  const originals=product.originalSkus??[];
  const originalBySku=new Map(originals.map(sku=>[sku.id,sku]));
  const contentOptimized=originals.length>0&&product.skus.some(sku=>{
   const before=originalBySku.get(sku.id);
   return before&&(before.name.trim()!==sku.name.trim()||before.description.trim()!==sku.description.trim()||
    sku.images.some((src,i)=>src!==before.images[i]));
  });
  const agentOptimized=Boolean(product.agent===SHUOMI_ADAPTATION_AGENT&&product.template===SHUOMI_ADAPTATION_TEMPLATE_NAME&&product.templateId===SHUOMI_ADAPTATION_TEMPLATE_ID&&contentOptimized);
  // The Shuomi adaptation is the completed, validated own-product intake:
  // all SKU essentials are present and the in-app review has passed.
  const shuomiAdapted=intakeApproved&&product.skus.every(sku=>Boolean(sku.name.trim()&&sku.description.trim()&&sku.images.some(Boolean)));
  // A verified external dataset is optional, never a prerequisite.
  const optimized=agentOptimized?findOptimizedProduct(product,versions):undefined;
  const snapshot:PreferredProductSnapshot|undefined=agentOptimized&&shuomiAdapted?{
   sourceProductId:product.id,
   sku:product.skus.map(p=>p.skuCode||String(p.id)).join(" / "),
   name:product.skus[0].name,
   image:product.skus[0].images.find(Boolean)||"",
   category:product.name,
   batchId:product.batchId,
   versionId:optimized?.dataset.id??"shuomi-intake:"+product.id,
   versionName:optimized?"V"+optimized.dataset.version:"硕米适配版本（演示）",
   platform:"硕米平台",
   site:"自有商品库",
   description:product.skus[0].description,
   skuCount:product.skus.length
  }:undefined;
  const status:PreferredCandidate["status"]=latest?.status==="已通过"?"已入选":
    latest?.status==="待审核"?"审核中":
    !agentOptimized?"待智能体优化":
    !shuomiAdapted?"待首次适配":"可申请";
  return {product,optimized:optimized?.dataset,snapshot,status,lastRejected:latest?.status==="未通过"?latest.reviewNote:undefined};
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
 if(eligible.some(c=>!c||c.status!=="可申请"||!c.snapshot))throw Error("所选商品已变化或尚未通过系统「硕米适配」模板优化及自有商品入库审核，请刷新商品列表");
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
 const next={...row,status:decision,updatedAt:new Date().toISOString(),reviewOrigin:"仅演示" as const,
  reviewNote:decision==="已通过"?"演示审核通过：已进入本账号演示硕米优选展示，非正式平台审核。":reason?.trim()||"演示审核未通过：请补充资料后重新发起申请。"};
 sessionStorage.setItem(key(org,member),JSON.stringify(rows.map(item=>item.id===id?next:item)));
 signal(org,member);
 return next;
}
/** Only approved snapshots appear in the preferred showcase; originals are untouched. */
export function readDemoSelectedCatalog(org:string,member:string):{applicationId:string;product:PreferredProductSnapshot;supply:PreferredSupply;reviewOrigin:string}[]{
 const map=new Map<string,{applicationId:string;product:PreferredProductSnapshot;supply:PreferredSupply;reviewOrigin:string}>();
 for(const record of readPreferredApplications(org,member).filter(row=>row.status==="已通过")){
  for(const product of record.products)if(!map.has(product.sourceProductId))map.set(product.sourceProductId,{
   applicationId:record.id,product,supply:record.supply,reviewOrigin:record.reviewOrigin
  });
 }
 return [...map.values()];
}
export {ownProductUpdated,optimizedDatasetsChanged};
