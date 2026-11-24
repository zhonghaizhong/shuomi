"use client";

/** Isolated, browser-session-only fixture batches. Never represents a 1688 API response. */
export type DemoCollectedProduct={id:string;name:string;sku:string;source:string;price:string;status:"演示数据";images?:string[];variants?:string[];variantCount?:number;variantDetails?:Array<{sku:string;label:string;color:string;size:string;image:string}>;originalTitle?:string;description?:string;demoSourceLink?:string};
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
/** Real, independently identified US Amazon listings; fixture only, not an Amazon API scrape.
 * References/prices are indicative and can change. Photos are illustrative product matches.
 * Never label these as fresh Amazon price/stock responses.
 */
const amazonUsFive=[
 {asin:"B00TTD9BRC",name:"CeraVe Moisturizing Cream, Face & Body Moisturizer, 19 oz",price:"$17.80（2026-11-23参考价）",variants:["19 oz (539 g) / Jar"],description:"真实商品资料演示：CeraVe 19 oz 面部及身体保湿霜，含神经酰胺与透明质酸。ASIN 已核对；价格为第三方历史参考，并非实时 Amazon 报价。",photos:["https://images-na.ssl-images-amazon.com/images/I/61c5dK4tv9L.jpg"]},
 {asin:"B07WRKXQ8W",name:"Anker PowerPort III Nano 20W USB-C Wall Charger, White",price:"$11.99（品牌站参考价）",variants:["White / 20W / USB-C"],description:"真实商品资料演示：Anker 20W 单 USB-C 紧凑型充电器，白色。ASIN 对应 Anker PowerPort III Nano；价格仅为品牌同类产品参考，不代表该 ASIN 实时售价。",photos:["https://cdn.shopify.com/s/files/1/0493/9834/9974/files/A2637121_TD01_V1_6effced4-d18a-403b-94c8-783dba212e64_3840x.png?v=1730775376"]},
 {asin:"B00008GKD3",name:"Lodge L8SK3 Pre-Seasoned Cast Iron Skillet, 10.25 Inch",price:"$19.90（第三方参考价）",variants:["10.25 inch / Black / L8SK3"],description:"真实商品资料演示：Lodge L8SK3 10.25 英寸预开锅铸铁平底锅，双导流口与辅助把手。价格来自第三方商品跟踪参考，非实时 Amazon 报价。",photos:["https://down-sg.img.susercontent.com/file/c1e6f7028ab2ea2458f8dfc2fe5346bd"]},
 {asin:"B0CFPJYX7P",name:"Amazon Kindle Paperwhite 16GB (2024 Release), Black",price:"$129.99（第三方参考价）",variants:["Black / 16GB / 2024"],description:"真实商品资料演示：Amazon Kindle Paperwhite 2024 款，黑色、16GB。价格仅供演示，不代表当前 Amazon 实时成交价或库存。",photos:["https://www.bigw.com.au/medias/sys_master/images/images/h54/h94/85360867672094.jpg"]},
 {asin:"B00NTCHCU2",name:"Amazon Basics AAA Alkaline Batteries, 20-Count, 1.5V",price:"$12.49（第三方参考价）",variants:["AAA / 1.5V / 20-count"],description:"真实商品资料演示：Amazon Basics AAA 1.5V 碱性电池 20 粒装。ASIN 已核对；价格为第三方参考，非当前 Amazon 报价。",photos:["https://www.ufinebattery.com/images/upload/amazonbasics-alkaline.webp"]}
] as const;
/** Verified real product families with color/size choices; Amazon child ASINs are NOT claimed.
 * Image URLs are photographic originals shown on actual product pages, not generated art.
 * Only the fixture is simulated; there was no Amazon API access or merchant listing created.
 */
export const amazonMultiVariantPhotoFixtures=[
 {id:"SIM-AMZ-US-CROCS-10001",sku:"AMZ-US-CROCS-10001",name:"Crocs Unisex Classic Clog, Color and Size Options",price:"价格待采集（不模拟 Amazon 实时报价）",
  sourceUrl:"https://www.crocs.com/p/classic-clog/10001.html",
  description:"真实品牌商品 Crocs Classic Clog，款号 10001。演示颜色/尺码的多变体数据；Amazon 具体父子 ASIN 未核实，不应将本地 SKU 视为 ASIN。",
  variants:[
   {sku:"CROCS-001-M8",label:"Black / Men's US 8",color:"Black",size:"M8 / W10",image:"https://www.sneakers4u.nl/img/images/2023/07/14/crocs-classic-clog-black-10001-001.jpg"},
   {sku:"CROCS-001-M9",label:"Black / Men's US 9",color:"Black",size:"M9 / W11",image:"https://www.sneakers4u.nl/img/images/2023/07/14/crocs-classic-clog-black-10001-001.jpg"},
   {sku:"CROCS-100-M8",label:"White / Men's US 8",color:"White",size:"M8 / W10",image:"https://www.crocs.ch/cdn/shop/products/CRO0002WHT_7e46eabf-2af5-4d4f-a183-ee015167b6db_1200x.jpg?v=1704412862"},
   {sku:"CROCS-100-M9",label:"White / Men's US 9",color:"White",size:"M9 / W11",image:"https://www.crocs.ch/cdn/shop/products/CRO0002WHT_7e46eabf-2af5-4d4f-a183-ee015167b6db_1200x.jpg?v=1704412862"},
   {sku:"CROCS-410-M8",label:"Navy / Men's US 8",color:"Navy",size:"M8 / W10",image:"https://www.crocs.in/media/catalog/product/1/0/10001_410_alt100.jpeg"},
   {sku:"CROCS-410-M9",label:"Navy / Men's US 9",color:"Navy",size:"M9 / W11",image:"https://www.crocs.in/media/catalog/product/1/0/10001_410_alt100.jpeg"}
  ],
  images:[
   "https://www.sneakers4u.nl/img/images/2023/07/14/crocs-classic-clog-black-10001-001.jpg",
   "https://www.crocs.ch/cdn/shop/products/CRO0002WHT_7e46eabf-2af5-4d4f-a183-ee015167b6db_1200x.jpg?v=1704412862",
   "https://www.crocs.in/media/catalog/product/1/0/10001_410_alt100.jpeg"
  ]},
 {id:"SIM-AMZ-US-STANLEY-Q40",sku:"AMZ-US-STANLEY-QUENCHER40",name:"Stanley Quencher H2.0 FlowState Tumbler, 40 oz, Multiple Colors",price:"价格待采集（不模拟 Amazon 实时报价）",
  sourceUrl:"https://www.stanley1913.com/products/adventure-quencher-travel-tumbler-40-oz",
  description:"真实品牌商品 Stanley 40 oz Quencher H2.0 FlowState；演示颜色变体。Amazon 实时价格、库存及具体变体 ASIN 尚未通过接口核实。",
  variants:[
   {sku:"STANLEY-Q40-CREAM",label:"Cream 2.0 / 40 oz",color:"Cream 2.0",size:"40 oz",image:"https://au.stanley1913.com/cdn/shop/files/B2B_Web_PNG-TheQuencherH2.OFlowStateTumbler40OZ-Cream2.0-Front_1400x.png?v=1742252844"},
   {sku:"STANLEY-Q40-BLACK",label:"Black / 40 oz",color:"Black",size:"40 oz",image:"https://au.stanley1913.com/cdn/shop/files/Untitleddesign_1_1400x.png?v=1741819955"},
   {sku:"STANLEY-Q40-ROSE",label:"Rose Quartz / 40 oz",color:"Rose Quartz",size:"40 oz",image:"https://www.elite-usa.com/cdn/shop/files/EU_Stan_RQ_14967.jpg?v=1726066365&width=1024"}
  ],
  images:[
   "https://au.stanley1913.com/cdn/shop/files/B2B_Web_PNG-TheQuencherH2.OFlowStateTumbler40OZ-Cream2.0-Front_1400x.png?v=1742252844",
   "https://au.stanley1913.com/cdn/shop/files/Untitleddesign_1_1400x.png?v=1741819955",
   "https://www.elite-usa.com/cdn/shop/files/EU_Stan_RQ_14967.jpg?v=1726066365&width=1024"
  ]}
] as const;
const amazonDemoId="SIM-AMAZON-US-5-20261124";
function amazonUsDemoBatch(organizationId:string,memberId:string):DemoCollectionBatch{
 return {id:amazonDemoId,organizationId,ownerMemberId:memberId,source:"Amazon",method:"美国站 · 商品资料演示",name:"Amazon 美国站 · 7个真实商品（模拟采集）",createdAt:"2026-11-24 18:11",status:"已采集 · 待上传",demo:true,
  products:[...amazonUsFive.map(p=>({id:"SIM-AMZ-US-"+p.asin,sku:p.asin,name:p.name,originalTitle:p.name,source:"Amazon US · ASIN "+p.asin+"（公开资料演示）",price:p.price,variants:[...p.variants],variantCount:1,images:[...p.photos],description:p.description,demoSourceLink:"https://www.amazon.com/dp/"+p.asin,status:"演示数据" as const})),
   ...amazonMultiVariantPhotoFixtures.map(p=>({id:p.id,sku:p.sku,name:p.name,originalTitle:p.name,source:"Amazon 美国站 · 品牌实物公开资料（模拟采集，未核实 Amazon 子 ASIN）",price:p.price,variants:p.variants.map(v=>v.label),variantDetails:p.variants.map(v=>({...v})),variantCount:p.variants.length,images:[...p.images],description:p.description,demoSourceLink:p.sourceUrl,status:"演示数据" as const}))]
 };
}
/** Append two fixture products to an already seeded five-product batch without resetting edits. */
function migrateAmazonMultiVariantBatch(batches:DemoCollectionBatch[]):DemoCollectionBatch[]{
 return batches.map(b=>{
  if(b.id!==amazonDemoId||b.source!=="Amazon"||b.organizationId!=="SM-ENT-000001"||b.ownerMemberId!=="admin")return b;
  const additions=amazonMultiVariantPhotoFixtures.filter(p=>!b.products.some(existing=>existing.id===p.id)).map(p=>({
   id:p.id,sku:p.sku,name:p.name,originalTitle:p.name,source:"Amazon 美国站 · 品牌商品公开资料（模拟采集）",price:p.price,
   variants:p.variants.map(v=>v.label),variantDetails:p.variants.map(v=>({...v})),variantCount:p.variants.length,
   images:[...p.images],description:p.description,demoSourceLink:p.sourceUrl,status:"演示数据" as const
  }));
  const oldName="Amazon 美国站 · 5个真实商品（模拟采集）";
  return {...b,name:b.name===oldName?"Amazon 美国站 · 7个真实商品（模拟采集）":b.name,products:[...b.products,...additions]};
 });
}
const amazonSeedMarker=(org:string,member:string)=>"shuomi:amazon-us-five-seeded-v1:"+org+":"+member;

const prefix="shuomi:demo-collection-batches-v1:";
const seedNames=demoCatalog.map(x=>x.name);
function key(organizationId:string){return prefix+organizationId;}
function valid(value:unknown):value is DemoCollectionBatch{return Boolean(value&&typeof value==="object"&&"id" in value&&"products" in value&&Array.isArray((value as DemoCollectionBatch).products));}
function initialBatch(organizationId:string):DemoCollectionBatch{return {id:"SIM-1688-10-20261123",organizationId,ownerMemberId:"admin",source:"1688",method:"在线采集",name:"1688 在线采集 · 10个产品（模拟）",createdAt:"2026-11-23 12:00",products:seedNames.map((name,i)=>addDemoFields({id:"SIM-1688-"+String(i+1).padStart(3,"0"),name,sku:"SIM-1688-"+String(i+1).padStart(3,"0"),source:"1688（演示）",price:"演示报价",status:"演示数据"},i)),status:"已采集 · 待上传",demo:true};}
export function readDemoCollectionBatches(organizationId:string,memberId="admin",_isAdministrator=false):DemoCollectionBatch[]{
 if(typeof window==="undefined")return [];
 try{const stored=sessionStorage.getItem(key(organizationId));let result:DemoCollectionBatch[];
  if(stored===null){result=organizationId==="SM-ENT-000001"?[decorate(initialBatch(organizationId))]:[];}
  else{const data:unknown=JSON.parse(stored);result=Array.isArray(data)?data.filter(valid):[];}
  // Seed once for the requested default-enterprise administrator, including sessions
  // that already contain the previous 1688 demo. Do not re-create a batch if deleted.
  if(organizationId==="SM-ENT-000001"&&memberId==="admin"&&!sessionStorage.getItem(amazonSeedMarker(organizationId,memberId))){
   if(!result.some(b=>b.id===amazonDemoId))result=[amazonUsDemoBatch(organizationId,memberId),...result];
   sessionStorage.setItem(amazonSeedMarker(organizationId,memberId),"1");
  }
  result=migrateAmazonMultiVariantBatch(result);
  sessionStorage.setItem(key(organizationId),JSON.stringify(result));
  return result.filter(batch=>batch.organizationId===organizationId&&batch.ownerMemberId===memberId).map(decorate);
 }catch{return organizationId==="SM-ENT-000001"&&memberId==="admin"?[amazonUsDemoBatch(organizationId,memberId),initialBatch(organizationId)]:[];}
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
