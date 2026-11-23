"use client";

/** Isolated, browser-session-only fixture batches. Never represents a 1688 API response. */
export type DemoCollectedProduct={id:string;name:string;sku:string;source:string;price:string;status:"演示数据";images?:string[];variants?:string[];variantCount?:number;originalTitle?:string;description?:string;demoSourceLink?:string};
export type DemoCollectionBatch={id:string;organizationId:string;ownerMemberId:string;source:"1688"|"Amazon";method:string;name:string;createdAt:string;products:DemoCollectedProduct[];status:"已采集 · 待上传";demo:true};
type CatalogItem={name:string;price:string;variants:string[];description:string;photos:string[]};
// Public photographic sample references. Not original 1688 product photos or authenticated offers.
const demoCatalog:CatalogItem[]=[
 {name:"纯棉圆领短袖T恤",price:"¥19.80 起",variants:["白色 / S","白色 / M","白色 / L","黑色 / S","黑色 / M","黑色 / L","灰色 / M","灰色 / XL"],description:"演示：纯棉面料、圆领基础款、多色可选，可用于服装定制和日常穿搭。",photos:["photo-1521572163474-6864f9cf17ab","photo-1503341504253-dff4815485f1","photo-1503342217505-b0a15ec3261c"]},
 {name:"宽松连帽卫衣",price:"¥42.50 起",variants:["黑色 / M","黑色 / L","黑色 / XL","灰色 / M","灰色 / L","灰色 / XL","米白 / L","米白 / 2XL"],description:"演示：宽松版型，连帽抽绳设计，适合秋冬休闲搭配。",photos:["photo-1556821840-3a63f95609a7","photo-1578681994506-b8f463449011","photo-1503342217505-b0a15ec3261c"]},
 {name:"帆布手提购物袋",price:"¥8.90 起",variants:["原色 / 标准款","黑色 / 标准款","原色 / 加大款"],description:"演示：帆布面料，适合购物、通勤和礼品定制。",photos:["photo-1544816155-12df9643f363","photo-1590874103328-eac38a683ce7","photo-1622560480605-d83c853bc5c3"]},
 {name:"家用收纳置物盒",price:"¥16.80 起",variants:["小号 / 米白","中号 / 米白","大号 / 灰色","四件套 / 米白"],description:"演示：家居收纳盒，适合衣物及日用品分类摆放。",photos:["photo-1600585154340-be6161a56a0c","photo-1600607687939-ce8a6c25118c","photo-1600566753190-17f0baa2a6c3"]},
 {name:"不锈钢保温水杯",price:"¥23.60 起",variants:["黑色 / 500ml","银色 / 500ml","白色 / 500ml","黑色 / 750ml"],description:"演示：不锈钢杯身，便携杯型，适合办公与户外使用。",photos:["photo-1602143407151-7111542de6e8","photo-1523362628745-0c100150b504","photo-1544145945-f90425340c7e"]},
 {name:"运动休闲长裤",price:"¥29.80 起",variants:["黑色 / M","黑色 / L","黑色 / XL","灰色 / M","灰色 / L","灰色 / XL"],description:"演示：日常休闲运动裤，松紧腰设计，多尺码可选。",photos:["photo-1473966968600-fa801b869a1a","photo-1515886657613-9f3515b0c78f","photo-1542272604-787c3835535d"]},
 {name:"纯色抱枕套",price:"¥7.80 起",variants:["米白 / 45×45cm","灰色 / 45×45cm","咖色 / 45×45cm","米白 / 50×50cm"],description:"演示：简约纯色家居抱枕套，多尺寸及颜色可选。",photos:["photo-1584100936595-c0654b55a2e2","photo-1615971677499-5467cbab01c0","photo-1583847268964-b28dc8f51f92"]},
 {name:"硅胶厨房工具套装",price:"¥26.50 起",variants:["黑色 / 6件套","米色 / 6件套","黑色 / 10件套"],description:"演示：厨房烹饪辅助工具套装，多种组合可选。",photos:["photo-1556911220-bff31c812dba","photo-1556910103-1c02745aae4d","photo-1556911220-e15b29be8c8f"]},
 {name:"简约桌面收纳架",price:"¥18.80 起",variants:["白色 / 双层","黑色 / 双层","白色 / 三层"],description:"演示：桌面物品分层收纳，用于办公及家居小件整理。",photos:["photo-1600607687920-4e2a09cf159d","photo-1497366811353-6870744d04b2","photo-1497366754035-f200968a6e72"]},
 {name:"旅行便携洗漱包",price:"¥12.60 起",variants:["黑色 / 标准款","灰色 / 标准款","米色 / 加大款"],description:"演示：旅行用便携收纳包，用于洗漱用品及小件物品整理。",photos:["photo-1553062407-98eeb64c6a62","photo-1547949003-9792a18a2601","photo-1572635196237-14b3f281503f"]}
];
function imageUrl(id:string){return "https://images.unsplash.com/"+id+"?auto=format&fit=crop&w=1200&q=85";}
function addDemoFields(product:DemoCollectedProduct,index:number):DemoCollectedProduct{
 const item=demoCatalog[index%demoCatalog.length];
 return {...product,name:item.name,price:item.price,originalTitle:item.name+"（1688 在线采集演示商品）",images:item.photos.map(imageUrl),variants:item.variants,variantCount:item.variants.length,description:item.description,demoSourceLink:"1688 演示链接（不指向实际商品）"};
}
function decorate(batch:DemoCollectionBatch):DemoCollectionBatch{
 if(batch.source!=="1688"||batch.demo!==true)return batch;
 return {...batch,products:batch.products.map((p,i)=>addDemoFields(p,i))};
}
const prefix="shuomi:demo-collection-batches-v1:";
const seedNames=demoCatalog.map(x=>x.name);
function key(organizationId:string){return prefix+organizationId;}
function valid(value:unknown):value is DemoCollectionBatch{return Boolean(value&&typeof value==="object"&&"id" in value&&"products" in value&&Array.isArray((value as DemoCollectionBatch).products));}
function initialBatch(organizationId:string):DemoCollectionBatch{return {id:"SIM-1688-10-20261123",organizationId,ownerMemberId:"admin",source:"1688",method:"在线采集",name:"1688 在线采集 · 10个产品（模拟）",createdAt:"2026-11-23 12:00",products:seedNames.map((name,i)=>addDemoFields({id:"SIM-1688-"+String(i+1).padStart(3,"0"),name,sku:"SIM-1688-"+String(i+1).padStart(3,"0"),source:"1688（演示）",price:"演示报价",status:"演示数据"},i)),status:"已采集 · 待上传",demo:true};}
export function readDemoCollectionBatches(organizationId:string,memberId="admin",_isAdministrator=false):DemoCollectionBatch[]{
 if(typeof window==="undefined")return [];
 try{const stored=sessionStorage.getItem(key(organizationId));let result:DemoCollectionBatch[];
  if(stored===null){result=organizationId==="SM-ENT-000001"?[decorate(initialBatch(organizationId))]:[];sessionStorage.setItem(key(organizationId),JSON.stringify(result));}
  else{const data:unknown=JSON.parse(stored);result=Array.isArray(data)?data.filter(valid):[];}
  return result.filter(batch=>batch.organizationId===organizationId&&batch.ownerMemberId===memberId).map(decorate);
 }catch{return organizationId==="SM-ENT-000001"&&memberId==="admin"?[initialBatch(organizationId)]:[];}
}
export function addDemoCollectionBatch(organizationId:string,memberId:string,source:"1688"|"Amazon",method:string,entries:string[]):DemoCollectionBatch|null{
 if(typeof window==="undefined"||!entries.length)return null;
 const now=new Date(),id="SIM-"+source+"-"+now.getTime().toString(36);
 const products=entries.map((value,i)=>{const base:DemoCollectedProduct={id:id+"-"+String(i+1).padStart(2,"0"),sku:"DEMO-"+String(i+1).padStart(3,"0"),name:source+" 演示商品 "+String(i+1).padStart(2,"0"),source:source+"（演示） · "+value.slice(0,120),price:"演示报价",status:"演示数据"};return source==="1688"?addDemoFields(base,i):base;});
 const batch:DemoCollectionBatch={id,organizationId,ownerMemberId:memberId,source,method,name:source+" 在线采集 · "+products.length+"个产品（模拟）",createdAt:now.toLocaleString("zh-CN",{hour12:false}),products,status:"已采集 · 待上传",demo:true};
 try{const stored=sessionStorage.getItem(key(organizationId));const parsed:unknown=stored===null?(organizationId==="SM-ENT-000001"?[initialBatch(organizationId)]:[]):JSON.parse(stored);const current=Array.isArray(parsed)?parsed.filter(valid):[];sessionStorage.setItem(key(organizationId),JSON.stringify([batch,...current].slice(0,30)));window.dispatchEvent(new CustomEvent("shuomi:demo-batches-updated",{detail:{organizationId}}));return batch;}catch{return null;}
}


/** Manage only the active member's demo batches; never mutate another tenant's records. */
export function createDemoCollectionBatch(organizationId:string,memberId:string,name:string):boolean{
 if(typeof window==="undefined"||!name.trim())return false;
 try{
  const stored=sessionStorage.getItem(key(organizationId));
  const raw:unknown=stored===null?(organizationId==="SM-ENT-000001"?[initialBatch(organizationId)]:[]):JSON.parse(stored);
  const current=Array.isArray(raw)?raw.filter(valid):[];
  const batch:DemoCollectionBatch={id:"SIM-MANUAL-"+Date.now().toString(36),organizationId,ownerMemberId:memberId,source:"1688",method:"手动新建",name:name.trim(),createdAt:new Date().toLocaleString("zh-CN",{hour12:false}),products:[],status:"已采集 · 待上传",demo:true};
  sessionStorage.setItem(key(organizationId),JSON.stringify([batch,...current]));
  window.dispatchEvent(new CustomEvent("shuomi:demo-batches-updated",{detail:{organizationId}}));
  return true;
 }catch{return false;}
}
export function renameDemoCollectionBatch(organizationId:string,memberId:string,batchId:string,name:string):boolean{
 if(typeof window==="undefined"||!name.trim())return false;
 try{
  const stored=sessionStorage.getItem(key(organizationId));
  const raw:unknown=stored===null?(organizationId==="SM-ENT-000001"?[initialBatch(organizationId)]:[]):JSON.parse(stored);
  const current=Array.isArray(raw)?raw.filter(valid):[];
  let found=false;
  const updated=current.map(b=>{
   if(b.id!==batchId||b.organizationId!==organizationId||b.ownerMemberId!==memberId)return b;
   found=true;return {...b,name:name.trim()};
  });
  if(!found)return false;
  sessionStorage.setItem(key(organizationId),JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("shuomi:demo-batches-updated",{detail:{organizationId}}));
  return true;
 }catch{return false;}
}


/** Permanently remove an owned demo batch from this browser session. */
export function deleteDemoCollectionBatch(organizationId:string,memberId:string,batchId:string):boolean{
 if(typeof window==="undefined")return false;
 try{
  const stored=sessionStorage.getItem(key(organizationId));
  const raw:unknown=stored===null?(organizationId==="SM-ENT-000001"?[initialBatch(organizationId)]:[]):JSON.parse(stored);
  const current=Array.isArray(raw)?raw.filter(valid):[];
  const target=current.find(b=>b.id===batchId&&b.organizationId===organizationId&&b.ownerMemberId===memberId);
  if(!target)return false;
  sessionStorage.setItem(key(organizationId),JSON.stringify(current.filter(b=>b!==target)));
  window.dispatchEvent(new CustomEvent("shuomi:demo-batches-updated",{detail:{organizationId}}));
  return true;
 }catch{return false;}
}
