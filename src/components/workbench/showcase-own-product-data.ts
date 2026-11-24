"use client";

/** Browser-session showcase only. This is not a production inventory API. */
export type OwnProductSku={id:number;name:string;description:string;images:string[];price?:string;stock?:number;skuCode?:string};
export type OwnProductRecord={
 id:string;batchId:string;name:string;source:"上传资料"|"导入表格"|"商品链接"|"API 接入";
 createdAt:string;checkedAt:string;status:"入库待完善"|"待审核"|"已入库";
 missing:string[];skus:OwnProductSku[];originalSkus?:OwnProductSku[];agent:string;template:string;
};
export type OwnProductBatch={id:string;name:string;createdAt:string;productCount:number};
const batchKey=(org:string,member:string)=>"shuomi:own-product-batches-v1:"+org+":"+member;
const productKey=(org:string,member:string)=>"shuomi:own-product-records-v1:"+org+":"+member;
export const ownProductUpdated="shuomi:own-products-updated";
const cloneSkus=(skus:OwnProductSku[]):OwnProductSku[]=>skus.map(s=>({...s,images:[...s.images]}));
const readArray=(key:string):unknown[]=>{if(typeof window==="undefined")return [];try{const p:unknown=JSON.parse(sessionStorage.getItem(key)||"[]");return Array.isArray(p)?p:[]}catch{return []}};
export function readOwnProductBatches(org:string,member:string):OwnProductBatch[]{
 return readArray(batchKey(org,member)).filter((p):p is OwnProductBatch=>Boolean(p&&typeof p==="object"&&"id"in p&&typeof p.id==="string"&&"name"in p&&typeof p.name==="string"&&"createdAt"in p&&typeof p.createdAt==="string")).map(p=>({...p,productCount:readOwnProducts(org,member).filter(x=>x.batchId===p.id).length}));
}
export function readOwnProducts(org:string,member:string):OwnProductRecord[]{
 return readArray(productKey(org,member)).filter((p):p is OwnProductRecord=>Boolean(p&&typeof p==="object"&&"id"in p&&typeof p.id==="string"&&"batchId"in p&&typeof p.batchId==="string"&&"skus"in p&&Array.isArray(p.skus))).map(p=>{const legacy:string=p.status;return {...p,status:(legacy==="待补全"?"入库待完善":legacy==="待上传"?"已入库":p.status) as OwnProductRecord["status"]}});
}
function notify(org:string,member:string){window.dispatchEvent(new CustomEvent(ownProductUpdated,{detail:{organizationId:org,memberId:member}}))}
export function createOwnProductBatch(org:string,member:string,name:string):OwnProductBatch{
 if(typeof window==="undefined")throw Error("只能在浏览器演示中创建批次");
 const value=name.trim();
 if(!value)throw Error("请输入批次名称");
 const list=readOwnProductBatches(org,member);
 if(list.some(b=>b.name===value))throw Error("该批次名称已经存在");
 const batch={id:"OWN-"+crypto.randomUUID(),name:value,createdAt:new Date().toLocaleString("zh-CN",{hour12:false}),productCount:0};
 sessionStorage.setItem(batchKey(org,member),JSON.stringify([batch,...list]));
 notify(org,member);return batch;
}
export function saveOwnProduct(org:string,member:string,batchId:string,entry:Omit<OwnProductRecord,"id"|"batchId"|"createdAt"|"checkedAt">):OwnProductRecord{
 if(typeof window==="undefined")throw Error("演示存储不可用");
 if(!readOwnProductBatches(org,member).some(b=>b.id===batchId))throw Error("该批次不属于当前账号或已不存在");
 if(!entry.skus.length)throw Error("请至少添加一个 SKU");
 const time=new Date().toLocaleString("zh-CN",{hour12:false});
 const product:OwnProductRecord={...entry,skus:cloneSkus(entry.skus),originalSkus:cloneSkus(entry.skus),id:"OWN-P-"+crypto.randomUUID(),batchId,createdAt:time,checkedAt:time};
 const current=readOwnProducts(org,member);
 // Keep prior products intact if session storage is full; no success without the actual data.
 sessionStorage.setItem(productKey(org,member),JSON.stringify([product,...current]));
 notify(org,member);return product;
}

/** Explicit, account-scoped demonstration only; these are illustrative goods and public sample photos, not seller inventory. */
export function simulateFiveOwnProductIntakes(org:string,member:string,batchId:string,template:string):{created:number;pending:number;review:number}{
 if(typeof window==="undefined")throw Error("演示存储不可用");
 const batch=readOwnProductBatches(org,member).find(x=>x.id===batchId);
 if(!batch||batch.name!=="自有商品测试批次")throw Error("请先选择「自有商品测试批次」");
 if(!template.trim())throw Error("请先选择商品优化智能体已保存的测试模板");
 const catalog=[
  {name:"纯棉圆领短袖T恤",code:"SH-DEMO-TEE-001",desc:"基础圆领短袖T恤，棉质面料，黑色 M 码。用于商品资料上传演示。",photo:"photo-1521572163474-6864f9cf17ab",price:"39.90",missing:false},
  {name:"宽松连帽卫衣",code:"SH-DEMO-HOOD-002",desc:"宽松版型，连帽抽绳，灰色 L 码。用于商品资料上传演示。",photo:"photo-1556821840-3a63f95609a7",price:"89.00",missing:false},
  {name:"帆布手提购物袋",code:"SH-DEMO-BAG-003",desc:"原色帆布手提袋，日常购物和收纳使用。用于商品资料上传演示。",photo:"photo-1544816155-12df9643f363",price:"25.00",missing:false},
  {name:"不锈钢保温杯",code:"SH-DEMO-CUP-004",desc:"",photo:"photo-1602143407151-7111542de6e8",price:"59.00",missing:true},
  {name:"旅行便携洗漱包",code:"SH-DEMO-TRAVEL-005",desc:"旅行收纳袋，黑色标准款，拉链开合。用于商品资料上传演示。",photo:"",price:"29.00",missing:true}
 ];
 const existing=readOwnProducts(org,member);
 const newEntries:OwnProductRecord[]=catalog.filter(item=>!existing.some(p=>p.batchId===batchId&&p.skus.some(s=>s.skuCode===item.code))).map(item=>{
  const skus:OwnProductSku[]=[{id:1,name:item.name,description:item.desc,images:item.photo?["https://images.unsplash.com/"+item.photo+"?auto=format&fit=crop&w=1200&q=85"]:[],price:item.price,stock:20,skuCode:item.code}];
  const missing=checkOwnProductSkus(skus);
  const now=new Date().toLocaleString("zh-CN",{hour12:false});
  return {id:"OWN-DEMO-"+crypto.randomUUID(),batchId,name:item.name,source:"上传资料" as const,createdAt:now,checkedAt:now,status:missing.length?"入库待完善" as const:"待审核" as const,missing,skus,originalSkus:cloneSkus(skus),agent:"商品优化智能体",template};
 });
 if(!newEntries.length)return {created:0,pending:0,review:0};
 sessionStorage.setItem(productKey(org,member),JSON.stringify([...newEntries,...existing]));
 notify(org,member);
 return {created:newEntries.length,pending:newEntries.filter(p=>p.status==="入库待完善").length,review:newEntries.filter(p=>p.status==="待审核").length};
}

/** First-stage Shuomi intake: incomplete drafts stay inside the tool, never in third-party listing 待补全. */
export function listOwnPendingProducts(org:string,member:string):OwnProductRecord[]{
 return readOwnProducts(org,member).filter(p=>p.status==="入库待完善");
}
export function listOwnReadyProducts(org:string,member:string):OwnProductRecord[]{
 return readOwnProducts(org,member).filter(p=>p.status==="已入库");
}
export function checkOwnProductSkus(skus:OwnProductSku[]):string[]{
 const missing:string[]=[];
 if(!skus.length)return ["至少添加一个 SKU"];
 skus.forEach((sku,i)=>{
  const label=sku.name.trim()||"SKU "+(i+1);
  if(!sku.name.trim())missing.push("SKU "+(i+1)+" 名称");
  if(!sku.images.some(src=>typeof src==="string"&&src.trim().length>0))missing.push(label+" 商品图片");
  if(!sku.description.trim())missing.push(label+" 基础资料");
 });
 return missing;
}
export function updateOwnProductAfterReview(org:string,member:string,id:string,skus:OwnProductSku[]):OwnProductRecord{
 if(typeof window==="undefined")throw Error("演示存储不可用");
 const all=readOwnProducts(org,member);
 const existing=all.find(p=>p.id===id);
 if(!existing)throw Error("无权修改或找不到该商品");
 if(existing.status!=="入库待完善")throw Error("只有待完善商品可以补充资料；待审核需先确认，已入库商品不可回退");
 if(!skus.length)throw Error("至少需要一个 SKU");
 const missing=checkOwnProductSkus(skus);
 const checkedAt=new Date().toLocaleString("zh-CN",{hour12:false});
 const updated:OwnProductRecord={...existing,originalSkus:cloneSkus(existing.originalSkus??existing.skus),skus:cloneSkus(skus),missing,checkedAt,status:missing.length?"入库待完善":"待审核",name:skus[0].name.trim()||existing.name};
 sessionStorage.setItem(productKey(org,member),JSON.stringify(all.map(p=>p.id===id?updated:p)));
 notify(org,member);
 return updated;
}

/** First-stage approval belongs to the own-product tool, not 刊登管理/待审核. */
export function approveOwnProductIntake(org:string,member:string,id:string):OwnProductRecord{
 if(typeof window==="undefined")throw Error("演示存储不可用");
 const all=readOwnProducts(org,member);
 const current=all.find(p=>p.id===id);
 if(!current)throw Error("无权审核或商品已不存在");
 if(current.status!=="待审核")throw Error("商品未处于首次入库待审核状态");
 if(!current.skus.length)throw Error("至少需要一个 SKU，禁止空商品入库");
 if(checkOwnProductSkus(current.skus).length)throw Error("资料缺失，请先在待完善补齐");
 const updated:OwnProductRecord={...current,status:"已入库",missing:[],checkedAt:new Date().toLocaleString("zh-CN",{hour12:false})};
 sessionStorage.setItem(productKey(org,member),JSON.stringify(all.map(p=>p.id===id?updated:p)));
 notify(org,member);
 return updated;
}

/** Third-party publishing success is required before source optimization can be applied.
 * No UI demo or queued task is allowed to provide this proof.
 */
export type ConfirmedPlatformUpload={
 taskId:string;
 externalProductId:string;
 platform:"SHEIN";
 acceptedAt:string;
 verifiedBy:"platform-callback";
};
export type OptimizedOwnSku={id:number;name?:string;images?:string[];description?:string;price?:string;stock?:number;skuCode?:string};
export type OptimizedOwnProduct={name?:string;skus:OptimizedOwnSku[]};
export type SourceOptimizationResult={product:OwnProductRecord;updated:boolean;reason:string};
/** Whitelist source-data fields. Protected fields never come from the uploaded candidate.
 * Free-text description may contain prices, so it is not rewritten until structured splitting is available.
 */
export function mergeOptimizedOwnProduct(original:OwnProductRecord,candidate:OptimizedOwnProduct):OwnProductRecord{
 const byId=new Map(candidate.skus.map(s=>[s.id,s]));
 return {...original,name:candidate.name?.trim()||original.name,
  skus:original.skus.map(s=>{
   const update=byId.get(s.id);if(!update)return s;
   return {...s,
    name:update.name?.trim()||s.name,
    images:Array.isArray(update.images)&&update.images.length>0?update.images.slice(0,8):s.images,
    // original description may contain pricing/inventory text: preserve it.
    description:s.description,
    price:s.price,stock:s.stock,skuCode:s.skuCode
   };
  })
 };
}
/** Server integration must call this only after an authenticated platform response.
 * Browser-only showcase never calls this automatically.
 */
export function applyConfirmedSourceOptimization(
 org:string,member:string,productId:string,
 candidate:OptimizedOwnProduct,proof:ConfirmedPlatformUpload|null
):SourceOptimizationResult{
 if(!proof||proof.verifiedBy!=="platform-callback"||proof.platform!=="SHEIN"||!proof.taskId.trim()||!proof.externalProductId.trim()||!Number.isFinite(Date.parse(proof.acceptedAt)))
  throw Error("没有经平台核实的上传成功回执，禁止覆盖原始商品");
 if(typeof window==="undefined")throw Error("演示存储不可用");
 const all=readOwnProducts(org,member),existing=all.find(p=>p.id===productId&&p.status==="已入库");
 if(!existing)throw Error("没有权限或原始商品尚未完成入库");
 // Deprecated legacy path. Cross-site optimized content must be saved separately
 // through saveVerifiedOptimizedDataset; original product fields are immutable here.
 void candidate;
 return {product:existing,updated:false,reason:"原始资料保留不覆盖；请将优化结果保存到独立的数据集版本"};

}
