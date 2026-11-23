"use client";

/** Local showcase task ledger. This is not platform submission, AI execution or an order. */
export type ShowcaseUploadTask={
 id:string;organizationId:string;memberId:string;
 source:"采集批次"|"自有商品库";batchId:string;batchName:string;
 productIds:string[];productCount:number;missingCount:number;
 storeId:string;storeName:string;platform:"SHEIN";region:string;storeType:string;
 rule:string;ruleConfig?:{id:string;name:string;skuMode:string;prefix:string;suffix:string;priceMode:string;priceValue:string;currencyConversion:boolean;aiFill:boolean};agentId:string|null;agentName:string|null;
 templateId:string|null;mode:"平台草稿"|"直接上传到平台"|"定时上传";
 status:"待补全"|"待执行智能体"|"待审核"|"待平台提交";
 createdAt:string;demo:true;
};
export const showcaseUploadTasksEvent="shuomi:listing-upload-tasks-updated";
const key=(organizationId:string,memberId:string)=>"shuomi:listing-upload-tasks-v1:"+organizationId+":"+memberId;
export function readShowcaseUploadTasks(organizationId:string,memberId:string):ShowcaseUploadTask[]{
 if(typeof window==="undefined")return [];
 try{
  const raw:unknown=JSON.parse(sessionStorage.getItem(key(organizationId,memberId))||"[]");
  return Array.isArray(raw)?raw.filter((value):value is ShowcaseUploadTask=>Boolean(value&&typeof value==="object"&&"id"in value&&"organizationId"in value&&value.organizationId===organizationId&&"memberId"in value&&value.memberId===memberId&&"productIds"in value&&Array.isArray(value.productIds)&&"status"in value)):[];
 }catch{return [];}
}
export function addShowcaseUploadTask(task:ShowcaseUploadTask):boolean{
 if(typeof window==="undefined"||!task.productIds.length||task.productCount!==task.productIds.length)return false;
 try{
  const existing=readShowcaseUploadTasks(task.organizationId,task.memberId);
  sessionStorage.setItem(key(task.organizationId,task.memberId),JSON.stringify([task,...existing]));
  window.dispatchEvent(new CustomEvent(showcaseUploadTasksEvent,{detail:{organizationId:task.organizationId,memberId:task.memberId}}));
  return true;
 }catch{return false;}
}
