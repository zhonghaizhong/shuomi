"use client";

/** Isolated, browser-session-only fixture batches. Never represents a 1688 API response. */
export type DemoCollectedProduct={id:string;name:string;sku:string;source:string;price:string;status:"演示数据"};
export type DemoCollectionBatch={id:string;organizationId:string;ownerMemberId:string;source:"1688"|"Amazon";method:string;name:string;createdAt:string;products:DemoCollectedProduct[];status:"已采集 · 待上传";demo:true};
const prefix="shuomi:demo-collection-batches-v1:";
const seedNames=["纯棉圆领短袖T恤","宽松连帽卫衣","帆布手提购物袋","家用收纳置物盒","不锈钢保温水杯","运动休闲长裤","纯色抱枕套","硅胶厨房工具套装","简约桌面收纳架","旅行便携洗漱包"];
function key(organizationId:string){return prefix+organizationId;}
function valid(value:unknown):value is DemoCollectionBatch{return Boolean(value&&typeof value==="object"&&"id" in value&&"products" in value&&Array.isArray((value as DemoCollectionBatch).products));}
function initialBatch(organizationId:string):DemoCollectionBatch{return {id:"SIM-1688-10-20261123",organizationId,ownerMemberId:"admin",source:"1688",method:"在线采集",name:"1688 在线采集 · 10个产品（模拟）",createdAt:"2026-11-23 12:00",products:seedNames.map((name,i)=>({id:"SIM-1688-"+String(i+1).padStart(3,"0"),name,sku:"SIM-1688-"+String(i+1).padStart(3,"0"),source:"1688（演示）",price:"未获取真实报价",status:"演示数据"})),status:"已采集 · 待上传",demo:true};}
export function readDemoCollectionBatches(organizationId:string,memberId="admin",isAdministrator=false):DemoCollectionBatch[]{
 if(typeof window==="undefined")return [];
 try{const stored=sessionStorage.getItem(key(organizationId));let result:DemoCollectionBatch[];
  if(stored===null){result=organizationId==="SM-ENT-000001"?[initialBatch(organizationId)]:[];sessionStorage.setItem(key(organizationId),JSON.stringify(result));}
  else{const data:unknown=JSON.parse(stored);result=Array.isArray(data)?data.filter(valid):[];}
  return result.filter(batch=>batch.organizationId===organizationId&&(isAdministrator||batch.ownerMemberId===memberId));
 }catch{return organizationId==="SM-ENT-000001"&&(isAdministrator||memberId==="admin")?[initialBatch(organizationId)]:[];}
}
export function addDemoCollectionBatch(organizationId:string,memberId:string,source:"1688"|"Amazon",method:string,entries:string[]):DemoCollectionBatch|null{
 if(typeof window==="undefined"||!entries.length)return null;
 const now=new Date(),id="SIM-"+source+"-"+now.getTime().toString(36);
 const products=entries.map((value,i)=>({id:id+"-"+String(i+1).padStart(2,"0"),sku:"DEMO-"+String(i+1).padStart(3,"0"),name:source+" 演示商品 "+String(i+1).padStart(2,"0"),source:source+"（演示） · "+value.slice(0,120),price:"未获取真实报价",status:"演示数据" as const}));
 const batch:DemoCollectionBatch={id,organizationId,ownerMemberId:memberId,source,method,name:source+" 在线采集 · "+products.length+"个产品（模拟）",createdAt:now.toLocaleString("zh-CN",{hour12:false}),products,status:"已采集 · 待上传",demo:true};
 try{const current=readDemoCollectionBatches(organizationId,memberId,true);sessionStorage.setItem(key(organizationId),JSON.stringify([batch,...current].slice(0,30)));window.dispatchEvent(new CustomEvent("shuomi:demo-batches-updated",{detail:{organizationId}}));return batch;}catch{return null;}
}
