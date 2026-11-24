"use client";
import {listingDemoArtSet,type ListingArtKind} from "./showcase-listing-ai-images";

/** Local showcase task ledger. This is not platform submission, AI execution or an order. */
export type ShowcaseUploadTask={
 id:string;organizationId:string;memberId:string;
 source:"采集批次"|"自有商品库"|"数据集";batchId:string;batchName:string;sourceVersionId?:string;sourceVersionLabel?:string;
 productIds:string[];productCount:number;missingCount:number;
 storeId:string;storeName:string;platform:"SHEIN";region:string;storeType:string;
 rule:string;ruleConfig?:{id:string;name:string;skuMode:string;prefix:string;suffix:string;priceMode:string;priceValue:string;currencyConversion:boolean;aiFill:boolean};agentId:string|null;agentName:string|null;
 templateId:string|null;mode:"平台草稿"|"直接上传到平台"|"定时上传";
 status:"待补全"|"待执行智能体"|"待审核"|"待平台提交";
 demoProduct?:{sourceName:string;sourceDescription:string;sourceImages:string[];optimizedName:string;optimizedDescription:string;optimizedImages:string[];missingFields:string[];agentRun:"模拟已优化";reviewedAt?:string};
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

/** One source batch and selected data version remain the common identifier across all four stages. */
export const showcaseUploadBatchKey=(task:Pick<ShowcaseUploadTask,"source"|"batchId"|"sourceVersionId">)=>
 JSON.stringify([task.source,task.batchId,task.sourceVersionId||"original"]);
export const showcaseUploadBatchLabel=(task:Pick<ShowcaseUploadTask,"source"|"batchName"|"sourceVersionId"|"sourceVersionLabel">)=>
 task.batchName+" · "+(task.sourceVersionLabel||(task.sourceVersionId&&task.sourceVersionId!=="original"?"优化版本 "+task.sourceVersionId:"原始版本"))+" · "+task.source;
export const showcaseUploadBatchPreferenceKey=(organizationId:string,memberId:string)=>
 "shuomi:listing-batch-filter-v1:"+organizationId+":"+memberId;

/** Demo-only, account-scoped product optimization. Generated art is illustrative, not an actual model execution. */
export type AmazonDemoListingProduct={id:string;sku:string;name:string;description?:string;images?:string[]};
const amazonDemoBatchId="SIM-AMAZON-US-5-20261124";
const amazonRules:Record<string,{missing:string[];title:string;summary:string;art:string}>={
 "B00TTD9BRC":{missing:["商品成分／合规证明","批次与有效期"],title:"CeraVe Moisturizing Cream for Face and Body, 19 oz",summary:"Face and body moisturizing cream, 19 oz. Ceramides and hyaluronic acid are mentioned in the original product description; claims require verification.",art:"cream"},
 "B07WRKXQ8W":{missing:["美国站插头规格／认证","适用电压与安全资料"],title:"Anker PowerPort III Nano USB-C Wall Charger, 20W, White",summary:"Compact USB-C wall charger, white, rated at 20W. Electrical and certification claims must be checked.",art:"charger"},
 "B00008GKD3":{missing:[],title:"Lodge L8SK3 Pre-Seasoned Cast Iron Skillet, 10.25 Inch",summary:"10.25-inch pre-seasoned cast-iron skillet, Lodge L8SK3. Source model and dimensions retained.",art:"skillet"},
 "B0CFPJYX7P":{missing:[],title:"Kindle Paperwhite 16GB E-Reader, Black, 2024 Release",summary:"Black Kindle Paperwhite e-reader, 16GB, 2024 release. Review trademarks and platform listing permissions before approval.",art:"ereader"},
 "B00NTCHCU2":{missing:["电池运输与危险品属性","包装和电池合规资料"],title:"Amazon Basics AAA Alkaline Batteries, 1.5V, 20 Count",summary:"AAA alkaline batteries, 1.5V, pack of 20. Shipping and battery compliance documents remain to be supplied.",art:"battery"}
};
export function simulateAmazonFiveListingWorkflow(args:{
 organizationId:string;memberId:string;batchId:string;batchName:string;products:AmazonDemoListingProduct[];
 storeId:string;storeName:string;region:string;storeType:string;rule:string;agentName:string;templateId:string;
}):{created:number;missing:number;review:number;alreadyInstalled:boolean}{
 const {organizationId:org,memberId:member}=args;
 const expected=Object.keys(amazonRules);
 if(typeof window==="undefined"||!org||!member||args.batchId!==amazonDemoBatchId||
 args.products.length!==5||args.agentName!=="商品优化智能体"||!args.templateId||
 !args.storeId||!args.storeName||!args.rule.trim())throw Error("演示配置不完整，不能执行");
 if(new Set(args.products.map(p=>p.sku)).size!==5||args.products.some(p=>!expected.includes(p.sku)))throw Error("仅支持选定的 Amazon 美国站五款商品批次");
 const existing=readShowcaseUploadTasks(org,member);
 const scopeKey="SHUOMI-AMZ-AI-5:"+args.batchId+":"+args.storeId;
 const previous=existing.filter(task=>task.id.startsWith(scopeKey));
 if(previous.length===5)return {created:0,missing:previous.filter(t=>t.status==="待补全").length,review:previous.filter(t=>t.status==="待审核").length,alreadyInstalled:true};
 if(previous.length)throw Error("已存在部分演示任务，请先检查任务记录，避免重复覆盖");
 const now=new Date().toISOString();
 const created:ShowcaseUploadTask[]=args.products.map(product=>{
  const plan=amazonRules[product.sku],missing=[...plan.missing];
  const images=listingDemoArtSet(plan.art as ListingArtKind);
  return {
   id:scopeKey+":"+product.sku,organizationId:org,memberId:member,source:"采集批次",batchId:args.batchId,
   batchName:args.batchName,sourceVersionId:"original",sourceVersionLabel:"原始版本",
   productIds:[product.id],productCount:1,missingCount:missing.length,
   storeId:args.storeId,storeName:args.storeName,platform:"SHEIN",region:args.region,storeType:args.storeType,
   rule:args.rule,agentId:"product.content.agent",agentName:args.agentName,
   templateId:args.templateId,mode:"直接上传到平台",
   status:missing.length?"待补全":"待审核",createdAt:now,demo:true,
   demoProduct:{sourceName:product.name,sourceDescription:product.description??"",sourceImages:[...(product.images??[])],
    optimizedName:plan.title,optimizedDescription:plan.summary,optimizedImages:images,
    missingFields:missing,agentRun:"模拟已优化"}
  };
 });
 if(created.filter(t=>t.status==="待补全").length!==3||created.filter(t=>t.status==="待审核").length!==2)throw Error("演示商品分流异常");
 try{
  sessionStorage.setItem(key(org,member),JSON.stringify([...created,...existing]));
  window.dispatchEvent(new CustomEvent(showcaseUploadTasksEvent,{detail:{organizationId:org,memberId:member}}));
  return {created:5,missing:3,review:2,alreadyInstalled:false};
 }catch{throw Error("当前浏览器无法保存智能体演示任务");}
}
export function completeShowcaseUploadTask(org:string,member:string,taskId:string,fields:Record<string,string>):ShowcaseUploadTask{
 const records=readShowcaseUploadTasks(org,member),task=records.find(t=>t.id===taskId);
 if(!task||task.status!=="待补全"||!task.demoProduct)throw Error("没有可补全的演示任务");
 if(task.demoProduct.missingFields.some(f=>!fields[f]?.trim()))throw Error("请先补齐所有缺失资料");
 const next={...task,status:"待审核" as const,missingCount:0,demoProduct:{...task.demoProduct,missingFields:[]}};
 sessionStorage.setItem(key(org,member),JSON.stringify(records.map(t=>t.id===taskId?next:t)));
 window.dispatchEvent(new CustomEvent(showcaseUploadTasksEvent,{detail:{organizationId:org,memberId:member}}));
 return next;
}
export function approveShowcaseUploadTask(org:string,member:string,taskId:string):ShowcaseUploadTask{
 const records=readShowcaseUploadTasks(org,member),task=records.find(t=>t.id===taskId);
 if(!task||task.status!=="待审核"||!task.demoProduct||task.demoProduct.missingFields.length)throw Error("智能体优化结果尚未完成资料检查与人工审核");
 const next={...task,status:"待平台提交" as const,demoProduct:{...task.demoProduct,reviewedAt:new Date().toISOString()}};
 sessionStorage.setItem(key(org,member),JSON.stringify(records.map(t=>t.id===taskId?next:t)));
 window.dispatchEvent(new CustomEvent(showcaseUploadTasksEvent,{detail:{organizationId:org,memberId:member}}));
 return next;
}
