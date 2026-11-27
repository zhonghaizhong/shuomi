"use client";
import {optimizedDatasetsChanged,type OptimizedDataset} from "./showcase-optimized-datasets";

/** An archived revision remains stored and can be restored without changing the original batch. */
const key=(org:string,member:string)=>"shuomi:archived-optimized-versions-v1:"+org+":"+member;
export function readArchivedOptimizedVersions(org:string,member:string):string[]{
 if(typeof window==="undefined")return [];
 try{const parsed:unknown=JSON.parse(sessionStorage.getItem(key(org,member))||"[]");return Array.isArray(parsed)?parsed.filter((v):v is string=>typeof v==="string"):[]}catch{return []}
}
export function setOptimizedVersionArchived(org:string,member:string,versionId:string,archive:boolean):boolean{
 if(typeof window==="undefined")return false;
 try{
  const set=new Set(readArchivedOptimizedVersions(org,member));
  if(archive)set.add(versionId);else set.delete(versionId);
  sessionStorage.setItem(key(org,member),JSON.stringify([...set]));
  window.dispatchEvent(new CustomEvent(optimizedDatasetsChanged,{detail:{organizationId:org,memberId:member}}));
  return true;
 }catch{return false}
}
const csv=(value:unknown)=>'"'+String(value??"").replace(/"/g,'""')+'"';
export function downloadOptimizedVersionCsv(dataset:OptimizedDataset){
 if(typeof window==="undefined")return;
 const cols=["来源批次","版本","适配平台","站点","语言","商品名称","原商品ID","SKU","规格","原始价格","提交价格","上架价格","原始库存","提交库存","上架库存","商家SKU","平台SKU","描述","图片地址"];
 const lines=dataset.products.flatMap(p=>(p.skuSnapshots?.length?p.skuSnapshots:p.skuCodes.map(sku=>({sku} as import("./showcase-optimized-datasets").VersionSkuSnapshot))).map(v=>[dataset.sourceBatchName,"V"+(dataset.version+1),dataset.platform,dataset.site,dataset.language,p.name,p.sourceProductId,v.sku,v.spec,v.originalPrice,v.submittedPrice,v.listingPrice,v.originalStock,v.submittedStock,v.listingStock,v.merchantSku,v.platformSku,p.description,p.images.join(" / ")]));
 const data="\ufeff"+[cols,...lines].map(row=>row.map(csv).join(",")).join("\r\n");
 const url=URL.createObjectURL(new Blob([data],{type:"text/csv;charset=utf-8"}));
 const el=document.createElement("a");el.href=url;el.download="优化版本-"+dataset.id.replace(/[^a-zA-Z0-9_-]/g,"")+".csv";document.body.appendChild(el);el.click();el.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
