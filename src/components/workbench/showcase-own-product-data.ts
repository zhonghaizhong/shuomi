"use client";
import {readAgentPreviewTemplates,writeAgentPreviewTemplates,SHUOMI_ADAPTATION_AGENT,SHUOMI_ADAPTATION_TEMPLATE_ID,SHUOMI_ADAPTATION_TEMPLATE_NAME} from "./showcase-agent-template-store";

/** Browser-session showcase only. This is not a production inventory API. */
export type OwnProductSku={id:number;name:string;description:string;images:string[];price?:string;stock?:number;skuCode?:string};
export type OwnProductRecord={
 id:string;batchId:string;name:string;source:"上传资料"|"导入表格"|"商品链接"|"API 接入";
 createdAt:string;checkedAt:string;status:"入库待完善"|"待审核"|"已入库";
 missing:string[];skus:OwnProductSku[];originalSkus?:OwnProductSku[];agent:string;template:string;templateId?:string;demoImageSource?:string;
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
 const templateId=entry.agent===SHUOMI_ADAPTATION_AGENT&&entry.template===SHUOMI_ADAPTATION_TEMPLATE_NAME&&readAgentPreviewTemplates(org,member,entry.agent).some(t=>t.id===SHUOMI_ADAPTATION_TEMPLATE_ID)?SHUOMI_ADAPTATION_TEMPLATE_ID:undefined;
  const product:OwnProductRecord={...entry,templateId,skus:cloneSkus(entry.skus),originalSkus:cloneSkus(entry.skus),id:"OWN-P-"+crypto.randomUUID(),batchId,createdAt:time,checkedAt:time};
 const current=readOwnProducts(org,member);
 // Keep prior products intact if session storage is full; no success without the actual data.
 sessionStorage.setItem(productKey(org,member),JSON.stringify([product,...current]));
 notify(org,member);return product;
}

/** Explicit, account-scoped demonstration only; these are illustrative goods and public sample photos, not seller inventory. */
/** Legacy UI entrypoint. Retained for existing buttons; it now installs the six-item fixture. */
export function simulateFiveOwnProductIntakes(org:string,member:string,batchId:string,template:string):{created:number;pending:number;review:number}{
 const batch=readOwnProductBatches(org,member).find(b=>b.id===batchId);
 if(!batch||batch.name!=="自有商品测试批次")throw Error("请选择「自有商品测试批次」");
 if(template!=="测试模板")throw Error("请选择商品优化智能体的「测试模板」");
 const result=installSixProductOptimizationDemo(org,member);
 return {created:result.created,pending:result.pending,review:result.review};
}

/** One-time, per-account showroom refresh requested for 自有商品测试批次.
 * This is realistic-looking fixture data, NOT real merchant inventory or a completed AI API call.
 * Existing approved products and other batches are retained.
 */
export function installSixProductOptimizationDemo(org:string,member:string):{created:number;pending:number;review:number;alreadyInstalled:boolean}{
 if(typeof window==="undefined"||!org||!member)throw Error("演示账号信息不完整");
 const marker="shuomi:own-product-six-demo-v2:"+org+":"+member;
 if(sessionStorage.getItem(marker)==="ready")return {created:0,pending:0,review:0,alreadyInstalled:true};
 const existingBatches=readOwnProductBatches(org,member);
 const batch=existingBatches.find(b=>b.name==="自有商品测试批次");
 // Prepare in-memory first; only replace data after the full new batch is constructed.
 const batchId=batch?.id??"OWN-"+crypto.randomUUID();
 const now=new Date().toLocaleString("zh-CN",{hour12:false});
 const photo=(id:string)=>"https://images.unsplash.com/"+id+"?auto=format&fit=crop&w=1200&q=85";
 type Fixture={code:string;name:string;price:string;stock:number;photo:string;raw:string;optimized:string;title:string;pending?:boolean;secondSku?:boolean};
 const catalog:Fixture[]=[
  {code:"SH-OPT-TEE-001",name:"纯棉圆领短袖 T 恤",price:"49.90",stock:86,photo:"photo-1521572163474-6864f9cf17ab",raw:"圆领短袖T恤，棉质面料，黑色，M码。",title:"纯棉圆领短袖 T 恤｜黑色 M 码｜休闲基础款",optimized:"商品简介：纯棉圆领短袖 T 恤，黑色 M 码，圆领短袖设计；适合日常休闲搭配。已将原始材质、颜色及尺码信息整理为易读商品描述。"},
  {code:"SH-OPT-HOOD-002",name:"宽松连帽卫衣",price:"129.00",stock:52,photo:"photo-1556821840-3a63f95609a7",raw:"灰色L码连帽卫衣，宽松款，带抽绳。",title:"宽松连帽卫衣｜灰色 L 码｜抽绳连帽款",optimized:"商品简介：灰色 L 码宽松连帽卫衣，采用连帽抽绳设计。将版型、尺码与颜色信息分层呈现，方便核对及上架使用。"},
  {code:"SH-OPT-TOTE-003",name:"帆布购物托特包",price:"39.00",stock:118,photo:"photo-1544816155-12df9643f363",raw:"原色帆布手提包，购物用，可收纳。",title:"原色帆布手提托特包｜购物收纳两用",optimized:"商品简介：原色帆布手提托特包，可用于日常购物与物品收纳。按产品名称、面料和用途整理了结构化卖点，没有补充未提供的容量与尺寸。"},
  {code:"SH-OPT-BOTTLE-004",name:"不锈钢保温水杯",price:"79.00",stock:64,photo:"photo-1602143407151-7111542de6e8",raw:"不锈钢水杯，蓝色，带杯盖。",title:"不锈钢随行水杯｜蓝色｜带盖款",optimized:"商品简介：蓝色不锈钢随行水杯，配有杯盖，适合日常携带。保温时长、具体容量及食品接触认证没有来源，不在模拟优化稿中添加。"},
  {code:"SH-OPT-MUG-005",name:"陶瓷咖啡马克杯",price:"45.00",stock:37,photo:"photo-1514228742587-6b1558fcca3d",raw:"",title:"陶瓷咖啡马克杯｜日常饮水杯",optimized:"",pending:true},
  {code:"SH-OPT-TRAVEL-006",name:"旅行洗漱收纳包",price:"59.00",stock:43,photo:"photo-1553062407-98eeb64c6a62",raw:"旅行洗漱包，黑色，拉链开合，附另一色可选。",title:"旅行洗漱收纳包｜黑色｜拉链开合",optimized:"商品简介：旅行用洗漱收纳包，黑色主款，拉链开合；将用途、颜色和闭合方式整理成可审核的商品资料。另一色变体缺少独立商品图片，需补充真实图片后才能审核。",pending:true,secondSku:true}
 ];
 const created:OwnProductRecord[]=catalog.map(item=>{
  const original:OwnProductSku[]=[{id:1,name:item.name,description:item.raw,images:[photo(item.photo)],price:item.price,stock:item.stock,skuCode:item.code}];
  const optimized:OwnProductSku[]=[{...original[0],name:item.title,description:item.optimized||"",images:[...original[0].images]}];
  if(item.secondSku){
   original.push({id:2,name:"旅行洗漱收纳包｜另一色",description:"同款旅行洗漱包，另一颜色，拉链开合。",images:[],price:item.price,stock:21,skuCode:"SH-OPT-TRAVEL-006-B"});
   optimized.push({...original[1],name:"旅行洗漱收纳包｜另一色｜拉链开合",description:"商品简介：旅行洗漱收纳包，拉链开合，另一颜色变体。缺少该变体的独立实拍图片，禁止使用主款图片冒充。"});
  }
  const missing=checkOwnProductSkus(optimized);
  return {id:"OWN-SIX-DEMO-"+item.code,batchId,name:item.name,source:"上传资料" as const,createdAt:now,checkedAt:now,status:missing.length?"入库待完善" as const:"待审核" as const,missing,skus:optimized,originalSkus:cloneSkus(original),agent:"商品优化智能体",template:"测试模板"};
 });
 if(created.filter(x=>x.status==="待审核").length!==4||created.filter(x=>x.status==="入库待完善").length!==2)throw Error("模拟商品分流数量异常");
 const prior=readOwnProducts(org,member);
 // Only replace unfinished products IN THE NAMED DEMO BATCH; preserve all real/other-batch records and approved data.
 const retained=prior.filter(p=>p.batchId!==batchId||p.status==="已入库");
 const templates=readAgentPreviewTemplates(org,member,"商品优化智能体");
 const needsTemplate=!templates.some(t=>t.name==="测试模板");
 const nextBatches=batch?existingBatches:[{id:batchId,name:"自有商品测试批次",createdAt:now,productCount:0},...existingBatches];
 // Persist product data before writing marker. Failures must not report success.
 if(!batch)sessionStorage.setItem(batchKey(org,member),JSON.stringify(nextBatches));
 sessionStorage.setItem(productKey(org,member),JSON.stringify([...created,...retained]));
 if(needsTemplate)writeAgentPreviewTemplates(org,member,"商品优化智能体",[...templates,{
  id:"own-six-demo-test-template",name:"测试模板",createdAt:now,config:{
   skills:["标题结构整理","商品卖点提炼","信息完整性检测"],knowledge:[],
   imageOptimization:true,imageInstructions:"English labels; white background; eight image slots per product; preserve original source. Generated illustrative assets must be marked as simulation.",useConfig:{imageLanguage:"英语",imageBackground:"白色背景",optimizationSource:"官方方案",imageUse:"共用视觉素材",imageProcessingScope:"手动选择",selectedMainImages:[1,2,3,4,5,6,7,8],selectedDetailImages:[1,2,3,4,5,6,7,8]}
  }
 }]);
 sessionStorage.setItem(marker,"ready");
 notify(org,member);
 return {created:6,pending:2,review:4,alreadyInstalled:false};
}


/** Import the six actual ChatGPT-generated image sheets split into 48 standalone images.
 * Explicit user-selected JSON payload; no server upload or real model invocation.
 * All original source photos and missing-field statuses are preserved.
 */
export function importOwnProductDemoImagePack(org:string,member:string,raw:unknown):{products:number;images:number;pending:number;review:number}{
 if(typeof window==="undefined")throw Error("请在浏览器中导入图片演示包");
 if(!raw||typeof raw!=="object")throw Error("图片包格式无效");
 const payload=raw as Record<string,unknown>;
 if(payload.format!=="shuomi-own-product-six-optimization-image-pack"||payload.version!==2||payload.language!=="英语"||payload.background!=="白色背景"||payload.perProduct!==8||!Array.isArray(payload.products)||payload.products.length!==6)
  throw Error("图片包不符合测试模板：英语、白底、每款 8 张、共 6 款");
 const demoBatch=readOwnProductBatches(org,member).find(b=>b.name==="自有商品测试批次");
 if(!demoBatch)throw Error("请先创建自有商品测试批次");
 const all=readOwnProducts(org,member);
 const validCodes=["SH-OPT-TEE-001","SH-OPT-HOOD-002","SH-OPT-TOTE-003","SH-OPT-BOTTLE-004","SH-OPT-MUG-005","SH-OPT-TRAVEL-006"];
 const byCode=new Map<string,string[]>();
 for(const candidate of payload.products){
  if(!candidate||typeof candidate!=="object")throw Error("图片包产品记录无效");
  const item=candidate as Record<string,unknown>;
  if(typeof item.skuCode!=="string"||!validCodes.includes(item.skuCode)||byCode.has(item.skuCode)||!Array.isArray(item.images)||item.images.length!==8||
    !item.images.every(x=>typeof x==="string"&&/^data:image\/jpeg;base64,[a-zA-Z0-9+/]+={0,2}$/.test(x)&&x.length<120000))
   throw Error("图片包存在重复 SKU、损坏的图片或图片数量不足");
  byCode.set(item.skuCode,item.images as string[]);
 }
 if(validCodes.some(code=>!byCode.has(code)))throw Error("六款测试商品的图片必须全部齐全");
 const candidates=validCodes.map(code=>all.find(p=>p.batchId===demoBatch.id&&p.status!=="已入库"&&p.skus.some(s=>s.skuCode===code)));
 if(candidates.some(p=>!p))throw Error("演示批次中缺少待审核或待完善商品，请先重建六款商品");
 const ids=new Set(candidates.map(p=>p!.id));
 const next=all.map(p=>{
  if(!ids.has(p.id))return p;
  const code=p.skus[0]?.skuCode??"";
  const pictures=byCode.get(code);
  if(!pictures)return p;
  const skus=p.skus.map((sku,i)=>i===0?{...sku,images:pictures.slice()}:sku);
  return {...p,skus,missing:checkOwnProductSkus(skus),demoImageSource:"ChatGPT 示意图片模拟"} as OwnProductRecord;
 });
 const review=next.filter(p=>ids.has(p.id)&&p.status==="待审核").length;
 const pending=next.filter(p=>ids.has(p.id)&&p.status==="入库待完善").length;
 if(review!==4||pending!==2)throw Error("预期状态不是 4 款待审核、2 款待完善，已停止导入");
 try{sessionStorage.setItem(productKey(org,member),JSON.stringify(next));}catch{throw Error("浏览器会话存储空间不足，未能保存全部 48 张图片；请换一个空白演示会话。")}
 notify(org,member);
 return {products:6,images:48,pending,review};
}


/** Hydrate 48 generated showcase images from the versioned, same-origin static atlas.
 * Illustrative ChatGPT output, never represented as the configured Shuomi agent's actual model call.
 * The source image version is immutable and available even when session storage is empty.
 */
export async function installGeneratedOwnProductDemoImages(org:string,member:string):Promise<{products:number;images:number;review:number;pending:number;alreadyInstalled:boolean}>{
 if(typeof window==="undefined"||!org||!member)throw Error("浏览器会话不可用");
 const batch=readOwnProductBatches(org,member).find(b=>b.name==="自有商品测试批次");
 if(!batch)throw Error("未找到自有商品测试批次");
 const codes=["SH-OPT-TEE-001","SH-OPT-HOOD-002","SH-OPT-TOTE-003","SH-OPT-BOTTLE-004","SH-OPT-MUG-005","SH-OPT-TRAVEL-006"];
 const records=readOwnProducts(org,member);
 const demo=records.filter(p=>p.batchId===batch.id&&codes.some(code=>p.skus[0]?.skuCode===code));
 if(demo.length!==6)throw Error("六款演示商品尚未全部初始化");
 const reviewCount=demo.filter(p=>p.status==="待审核").length;
 const pendingCount=demo.filter(p=>p.status==="入库待完善").length;
 // Never undo a user's completed approvals or manual edits on subsequent visits.
 // An approved or manually edited product must not block the other demo products.
 const needsPreview=(p:OwnProductRecord)=>p.status!=="已入库"&&!p.demoImageSource&&
  p.skus[0]?.images.length===1&&/^https:\/\/images\.unsplash\.com\//.test(p.skus[0].images[0]??"");
 if(!demo.some(needsPreview))
  return {products:6,images:demo.reduce((n,p)=>n+(p.demoImageSource?Math.min(8,p.skus[0]?.images.length??0):0),0),review:reviewCount,pending:pendingCount,alreadyInstalled:true};
 const img=await new Promise<HTMLImageElement>((resolve,reject)=>{
  const source=new Image();
  source.onload=()=>resolve(source);
  source.onerror=()=>reject(Error("48 张模拟图片资源暂时无法加载，请核实 GitHub Pages 已发布该静态资源"));
  const prefix=window.location.pathname.startsWith("/shuomi")?"/shuomi":"";
  source.src=prefix+"/assets/own-product-ai-demo/six-products-48-images.webp";
 });
 if(img.naturalWidth!==1024||img.naturalHeight!==3072)throw Error("模拟图片图集尺寸与模板不一致");
 const canvas=document.createElement("canvas");canvas.width=256;canvas.height=256;
 const ctx=canvas.getContext("2d");if(!ctx)throw Error("浏览器不支持图片切分");
 const imagesByCode=new Map<string,string[]>();
 for(const [productIndex,code] of codes.entries()){
  const images:string[]=[];
  for(let tile=0;tile<8;tile++){
   ctx.clearRect(0,0,256,256);
   ctx.drawImage(img,(tile%4)*256,(productIndex*2+Math.floor(tile/4))*256,256,256,0,0,256,256);
   images.push(canvas.toDataURL("image/webp",0.8));
  }
  imagesByCode.set(code,images);
 }
 // Re-read after async load: never revert a product that was approved or edited in another tab.
 const fresh=readOwnProducts(org,member);
 const changed=fresh.map(p=>{
  if(p.batchId!==batch.id||!codes.includes(p.skus[0]?.skuCode??"")||!needsPreview(p))return p;
  const images=imagesByCode.get(p.skus[0].skuCode??"");if(!images)return p;
  const skus=p.skus.map((sku,i)=>i===0?{...sku,images:images.slice()}:sku);
  return {...p,skus,missing:checkOwnProductSkus(skus),demoImageSource:"ChatGPT 英语白底 8 张图片模拟"} as OwnProductRecord;
 });
 const selected=changed.filter(p=>p.batchId===batch.id&&p.status!=="已入库"&&codes.includes(p.skus[0]?.skuCode??""));
 const review=selected.filter(p=>p.status==="待审核").length;
 const pending=selected.filter(p=>p.status==="入库待完善").length;
 // Approved products and manually edited statuses are preserved, even if counts differ from the original 4/2 fixture.
 try{sessionStorage.setItem(productKey(org,member),JSON.stringify(changed));}catch{throw Error("本次会话存储空间不足，无法保存 48 张图片")}
 notify(org,member);
 return {products:6,images:changed.filter(p=>p.batchId===batch.id&&codes.includes(p.skus[0]?.skuCode??"")&&p.demoImageSource).reduce((n,p)=>n+Math.min(8,p.skus[0]?.images.length??0),0),review,pending,alreadyInstalled:false};
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
