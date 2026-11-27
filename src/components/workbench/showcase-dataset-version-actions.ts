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
 const cols=["来源批次","版本","适配平台","站点","语言","商品名称","原商品ID","SKU","描述","图片地址"];
 const lines=dataset.products.map(p=>[dataset.sourceBatchName,"V"+(dataset.version+1),dataset.platform,dataset.site,dataset.language,p.name,p.sourceProductId,p.skuCodes.join(" / "),p.description,p.images.join(" / ")]);
 const data="\ufeff"+[cols,...lines].map(row=>row.map(csv).join(",")).join("\r\n");
 const url=URL.createObjectURL(new Blob([data],{type:"text/csv;charset=utf-8"}));
 const el=document.createElement("a");el.href=url;el.download="优化版本-"+dataset.id.replace(/[^a-zA-Z0-9_-]/g,"")+".csv";document.body.appendChild(el);el.click();el.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
