"use client";
import {listingDemoArtSet,type ListingArtKind} from "./showcase-listing-ai-images";
import {categoryFieldImpact,fieldSchemaMatches,validatePlatformFields,type PlatformFieldSchema,type ScopedFieldValues} from "./showcase-platform-field-schema";
import {variantStructureImpact,variantStructureValidation,type VariantStructureDraft} from "./showcase-variant-structure";

/** Local showcase task ledger. This is not platform submission, AI execution or an order. */
export const listingVariantPhotoRoles=[
 "商品识别主图","核心购买理由","核心需求解决","产品结构确认","核心细节证据","核心使用场景"
] as const;
export type ListingVariantPhotoRole=typeof listingVariantPhotoRoles[number];
export type ListingVariantImage={role:ListingVariantPhotoRole;url:string;version:number;source:"ai-generated"|"manual-review"|"demo-import";provenance?:string};
export type ListingVariantImageGroup={
 id:string;color:string;skuIds:string[];originalImages:string[];
 optimizedImages:ListingVariantImage[];version:number;reviewedAt?:string;
};
export type ListingVariantDetail={sku:string;label:string;color:string;size:string;image:string};
export function buildListingVariantGroups(details:ListingVariantDetail[]):ListingVariantImageGroup[]{
 const groups=new Map<string,ListingVariantImageGroup>();
 for(const variant of details){
  const id=variant.color.trim().toLowerCase();
  if(!groups.has(id))groups.set(id,{id,color:variant.color,skuIds:[],originalImages:[],optimizedImages:[],version:1});
  const group=groups.get(id)!;
  if(!group.skuIds.includes(variant.sku))group.skuIds.push(variant.sku);
  if(variant.image&&!group.originalImages.includes(variant.image))group.originalImages.push(variant.image);
 }
 return [...groups.values()];
}
/** Read-only role previews for the current color. Source photographs are never saved as AI outputs. */
export function listingVariantGalleryCards(group:ListingVariantImageGroup){
 return listingVariantPhotoRoles.map((role,index)=>{
  const optimized=group.optimizedImages.find(img=>img.role===role);
  return {role,index,url:optimized?.url??group.originalImages[0]??null,isOptimized:Boolean(optimized&&optimized.source!=="demo-import"),isDemoImported:optimized?.source==="demo-import"};
 });
}
export function variantGroupReady(group:ListingVariantImageGroup):boolean{
 return listingVariantPhotoRoles.every(role=>group.optimizedImages.some(img=>img.role===role&&img.source!=="demo-import"&&/^(https:\/\/|\/assets\/)/.test(img.url)&&!group.originalImages.includes(img.url)))&&group.optimizedImages.length===6&&new Set(group.optimizedImages.map(x=>x.url)).size===6;
}
export type ShowcaseUploadTask={
 id:string;organizationId:string;memberId:string;
 source:"采集批次"|"自有商品库"|"数据集";batchId:string;batchName:string;sourceVersionId?:string;sourceVersionLabel?:string;
 productIds:string[];productCount:number;missingCount:number;
 originalPricingBaseline?:import("../showcase-optimized-datasets").OriginalPricingBaseline[];
 reusedProducts?:import("../showcase-optimized-datasets").OptimizedDatasetProduct[];
 storeId:string;storeName:string;platform:"SHEIN";region:string;storeType:string;
 rule:string;ruleConfig?:{id:string;name:string;skuMode:string;prefix:string;suffix:string;priceMode:string;priceValue:string;currencyConversion:boolean;aiFill:boolean};agentId:string|null;agentName:string|null;
 templateId:string|null;mode:"平台草稿"|"直接上传到平台"|"定时上传";
 status:"待补全"|"待执行智能体"|"待审核"|"待平台提交"|"模拟已提交";
 /** Local demonstration only; not evidence of external API submission. */
 demoSubmission?:{reviewedAt:string;submittedAt:string;platform:"SHEIN";site:string;storeId:string;storeName:string;result:"模拟提交成功";externalReceiptId:null};
 demoProduct?:{sourceName:string;sourceDescription:string;sourceImages:string[];optimizedName:string;optimizedDescription:string;optimizedImages:string[];missingFields:string[];agentRun:"模拟已优化";reviewedAt?:string;variantDetails?:ListingVariantDetail[];variantImageGroups?:ListingVariantImageGroup[];imageProvenance?:"品牌/零售商真实商品照片（未进行图片 AI 重绘）"};
 textEdits?:{title?:string;description?:string;colorDescriptions?:Record<string,string>;skuDescriptions?:Record<string,string>;skuNames?:Record<string,string>;merchantSkuCodes?:Record<string,string>;categoryPath?:string;categoryRulePending?:boolean;revision?:number;updatedAt?:string;fieldValues?:ScopedFieldValues;legacyMissingValues?:Record<string,string>;variantStructure?:VariantStructureDraft;variantStructurePending?:boolean};
 /** Authoritative schema only; no guessed marketplace categories. */
 platformFieldSchema?:PlatformFieldSchema;
 fieldVersionArchive?:Record<string,ScopedFieldValues>;
 editHistory?:Array<{revision:number;updatedAt:string;categoryPath:string;ruleVersion:string;changedFields:string[]}>;
 editSnapshots?:Array<{revision:number;updatedAt:string;previous:NonNullable<ShowcaseUploadTask["textEdits"]>}>;
 /** User-managed display gallery; never replaces preserved source evidence. Key is color group id or "default". */
 imageEdits?:Record<string,{main?:string[];detail?:string[]}>;

 createdAt:string;demo:true;
};
export const showcaseUploadTasksEvent="shuomi:listing-upload-tasks-updated";
const key=(organizationId:string,memberId:string)=>"shuomi:listing-upload-tasks-v1:"+organizationId+":"+memberId;
/** Keep task metadata beyond tab closure. IndexedDB holds image bytes separately. */
export function persistShowcaseUploadTaskRecords(org:string,member:string,tasks:ShowcaseUploadTask[]):void{
 const k=key(org,member),serialized=JSON.stringify(tasks);
 sessionStorage.setItem(k,serialized);
 try{localStorage.setItem(k,serialized)}catch{/* Session remains usable if local quota is exhausted. */}
}

export function readShowcaseUploadTasks(organizationId:string,memberId:string):ShowcaseUploadTask[]{
 if(typeof window==="undefined")return [];
 try{
  const k=key(organizationId,memberId);
  const session=sessionStorage.getItem(k),durable=localStorage.getItem(k);
  const raw:unknown=JSON.parse(session||durable||"[]");
  if(!session&&durable)sessionStorage.setItem(k,durable);
  return Array.isArray(raw)?raw.filter((value):value is ShowcaseUploadTask=>Boolean(value&&typeof value==="object"&&"id"in value&&"organizationId"in value&&value.organizationId===organizationId&&"memberId"in value&&value.memberId===memberId&&"productIds"in value&&Array.isArray(value.productIds)&&"status"in value)).map(task=>{
   const data=task.demoProduct;
   // Upgrade previous multi-variant sessions without resetting the original status or review fields.
   if(!task.id.startsWith("SHUOMI-AMZ-AI-MULTI:")||!data?.variantDetails?.length)return task;
   const groups=buildListingVariantGroups(data.variantDetails).map(base=>{
    const prior=data.variantImageGroups?.find(item=>item.id===base.id);
    if(!prior)return base;
    return {...base,optimizedImages:prior.optimizedImages??[],version:prior.version??1,reviewedAt:prior.reviewedAt};
   });
   return {...task,demoProduct:{...data,variantImageGroups:groups,
     // Old fixture mistakenly copied original photos into optimizedImages; never present them as generated output.
     optimizedImages:[]}};
  }):[];
 }catch{return [];}
}
export function addShowcaseUploadTask(task:ShowcaseUploadTask):boolean{
 if(typeof window==="undefined"||!task.productIds.length||task.productCount!==task.productIds.length)return false;
 try{
  const existing=readShowcaseUploadTasks(task.organizationId,task.memberId);
  persistShowcaseUploadTaskRecords(task.organizationId,task.memberId,[task,...existing]);
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
export type AmazonDemoListingProduct={id:string;sku:string;name:string;description?:string;images?:string[];variantDetails?:Array<{sku:string;label:string;color:string;size:string;image:string}>};
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
 const fiveProducts=args.products.filter(p=>expected.includes(p.sku));
 if(typeof window==="undefined"||!org||!member||args.batchId!==amazonDemoBatchId||
 fiveProducts.length!==5||args.agentName!=="商品优化智能体"||!args.templateId||
 !args.storeId||!args.storeName||!args.rule.trim())throw Error("演示配置不完整，不能执行");
 if(new Set(fiveProducts.map(p=>p.sku)).size!==5)throw Error("仅支持选定的 Amazon 美国站五款商品批次");
 const existing=readShowcaseUploadTasks(org,member);
 const scopeKey="SHUOMI-AMZ-AI-5:"+args.batchId+":"+args.storeId;
 const previous=existing.filter(task=>task.id.startsWith(scopeKey));
 if(previous.length===5){refreshAmazonFiveDemoPhotos(org,member);return {created:0,missing:previous.filter(t=>t.status==="待补全").length,review:previous.filter(t=>t.status==="待审核").length,alreadyInstalled:true};}
 if(previous.length)throw Error("已存在部分演示任务，请先检查任务记录，避免重复覆盖");
 const now=new Date().toISOString();
 const created:ShowcaseUploadTask[]=fiveProducts.map(product=>{
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
  persistShowcaseUploadTaskRecords(org,member,[...created,...existing]);
  window.dispatchEvent(new CustomEvent(showcaseUploadTasksEvent,{detail:{organizationId:org,memberId:member}}));
  return {created:5,missing:3,review:2,alreadyInstalled:false};
 }catch{throw Error("当前浏览器无法保存智能体演示任务");}
}
/** Two photographed product families are appended to the *same* Amazon demo batch.
 * Never replaces the five original tasks, makes Amazon API claims or uploads to SHEIN.
 */
export function simulateAmazonMultiVariantListingWorkflow(args:{
 organizationId:string;memberId:string;batchId:string;batchName:string;products:AmazonDemoListingProduct[];
 storeId:string;storeName:string;region:string;storeType:string;rule:string;agentName:string;templateId:string;
}):{created:number;missing:number;review:number;alreadyInstalled:boolean}{
 if(typeof window==="undefined"||!args.organizationId||!args.memberId||args.batchId!==amazonDemoBatchId||
  !args.storeId||!args.storeName||!args.rule.trim()||args.agentName!=="商品优化智能体"||!args.templateId)throw Error("新增多变体演示配置不完整");
 const selected=args.products.filter(p=>p.sku==="AMZ-US-CROCS-10001"||p.sku==="AMZ-US-STANLEY-QUENCHER40");
 if(selected.length!==2||selected.some(p=>!p.variantDetails||p.variantDetails.length<2||!p.images?.length))throw Error("需要两件带完整变体结构及真实商品图片的商品");
 const current=readShowcaseUploadTasks(args.organizationId,args.memberId);
 const scope="SHUOMI-AMZ-AI-MULTI:"+args.batchId+":"+args.storeId+":";
 const previous=current.filter(t=>t.id.startsWith(scope));
 if(previous.length===2)return {created:0,missing:previous.filter(t=>t.status==="待补全").length,review:previous.filter(t=>t.status==="待审核").length,alreadyInstalled:true};
 if(previous.length)throw Error("已有部分多变体任务，请检查后再运行，避免覆盖原处理记录");
 const now=new Date().toISOString();
 const created:ShowcaseUploadTask[]=selected.map(p=>{
  const isClog=p.sku==="AMZ-US-CROCS-10001";
  const missing=isClog?["目标站点鞋类尺码对照表","鞋面及鞋底材质信息（按平台规则确认）"]:[];
  const realPhotos=[...(p.images??[])];
  return {
   id:scope+p.sku,organizationId:args.organizationId,memberId:args.memberId,source:"采集批次",batchId:args.batchId,
   batchName:args.batchName,sourceVersionId:"original",sourceVersionLabel:"原始版本",
   productIds:[p.id],productCount:1,missingCount:missing.length,storeId:args.storeId,storeName:args.storeName,
   platform:"SHEIN",region:args.region,storeType:args.storeType,rule:args.rule,
   agentId:"product.content.agent",agentName:args.agentName,templateId:args.templateId,mode:"直接上传到平台",
   status:isClog?"待补全" as const:"待审核" as const,createdAt:now,demo:true,
   demoProduct:{
    sourceName:p.name,sourceDescription:p.description??"",sourceImages:realPhotos,
    optimizedName:isClog?"Crocs Classic Unisex Clog - Color and Size Options":"Stanley Quencher H2.0 FlowState 40 oz Tumbler - Color Options",
    optimizedDescription:isClog
     ?"Lightweight classic unisex clogs with ventilation ports, pivoting heel straps, and color/size options. Confirm size chart and category attributes before listing."
     :"40 oz stainless steel insulated travel tumbler with reusable straw, handle and FlowState rotating lid. Color-specific photos retained for each variant.",
    // Use original photographic product assets, never falsely call altered or generated photos authentic.
    optimizedImages:[],missingFields:missing,agentRun:"模拟已优化" as const,
    variantDetails:p.variantDetails!.map(v=>({...v})),variantImageGroups:buildListingVariantGroups(p.variantDetails!),imageProvenance:"品牌/零售商真实商品照片（未进行图片 AI 重绘）" as const
   }
  };
 });
 if(created.filter(t=>t.status==="待补全").length!==1||created.filter(t=>t.status==="待审核").length!==1)throw Error("两款商品的分流不正确");
 try{
  persistShowcaseUploadTaskRecords(args.organizationId,args.memberId,[...created,...current]);
  window.dispatchEvent(new CustomEvent(showcaseUploadTasksEvent,{detail:{organizationId:args.organizationId,memberId:args.memberId}}));
  return {created:2,missing:1,review:1,alreadyInstalled:false};
 }catch{throw Error("无法保存多变体演示数据");}
}
/** Save the actual six-slot gallery for one color only; size SKUs inherit their color group.
 * This demo accepts an already hosted image URL and never claims to execute an image model.
 */
export function saveListingVariantPhoto(org:string,member:string,taskId:string,colorGroupId:string,role:ListingVariantPhotoRole,url:string):ShowcaseUploadTask{
 if(!listingVariantPhotoRoles.includes(role))throw Error("未知图片任务类型");
 const path=url.trim();
 if(path&&!(/^(https:\/\/[^\s]+|\/assets\/[^\s]+)$/.test(path)))throw Error("请输入可访问的 HTTPS 图片链接或本站静态资源路径");
 const tasks=readShowcaseUploadTasks(org,member);
 const task=tasks.find(t=>t.id===taskId);
 if(!task?.demoProduct?.variantImageGroups?.length||!["待补全","待审核"].includes(task.status))throw Error("该商品当前不可修改变体优化图片");
 if(!task.demoProduct.variantImageGroups.some(g=>g.id===colorGroupId))throw Error("所选颜色组不存在");
 if(path&&task.demoProduct.variantImageGroups.some(g=>g.originalImages.includes(path)))throw Error("原始采集图片不能作为 AI 优化图片使用");
 const groups=task.demoProduct.variantImageGroups.map(g=>{
  if(g.id!==colorGroupId)return g;
  const other=g.optimizedImages.filter(img=>img.role!==role);
  const next=path?[...other,{role,url:path,version:g.version,source:"manual-review" as const}]:other;
  return {...g,optimizedImages:next,reviewedAt:undefined};
 });
 const next={...task,demoProduct:{...task.demoProduct,variantImageGroups:groups}};
 persistShowcaseUploadTaskRecords(org,member,tasks.map(t=>t.id===taskId?next:t));
 window.dispatchEvent(new CustomEvent(showcaseUploadTasksEvent,{detail:{organizationId:org,memberId:member}}));
 return next;
}
/** Store only a local gallery arrangement. Source images and independently verified AI results remain untouched. */
export function saveShowcaseGalleryEdits(org:string,member:string,taskId:string,colorId:string,kind:"main"|"detail",urls:string[]):ShowcaseUploadTask{
 const tasks=readShowcaseUploadTasks(org,member),task=tasks.find(t=>t.id===taskId);
 if(!task?.demoProduct||!["待补全","待审核"].includes(task.status))throw new Error("当前任务不可编辑图片");
 if(task.demoProduct.variantImageGroups?.length&&!task.demoProduct.variantImageGroups.some(g=>colorId===g.id||colorId===g.id+":optimized"||colorId===g.id+":original"||colorId===g.id+":detail"))throw new Error("颜色组不存在");
 if(urls.length>24||urls.some(u=>typeof u!=="string"||u.length>2048||!(u.startsWith("https://")||u.startsWith("/assets/")||u.startsWith("shuomi-bundle:"))))throw new Error("图片地址无效或数量超限");
 const existing=task.imageEdits??{};
 const next={...task,imageEdits:{...existing,[colorId]:{...existing[colorId],[kind]:[...urls]}}};
 persistShowcaseUploadTaskRecords(org,member,tasks.map(t=>t.id===taskId?next:t));
 window.dispatchEvent(new CustomEvent(showcaseUploadTasksEvent,{detail:{organizationId:org,memberId:member}}));
 return next;
}
/** Explicit text edits preserve original product and prior AI output; never touch photos or platform attributes. */
export function saveShowcaseListingTextEdits(
 org:string,member:string,taskId:string,
 updates:NonNullable<ShowcaseUploadTask["textEdits"]>
):ShowcaseUploadTask{
 const tasks=readShowcaseUploadTasks(org,member),task=tasks.find(t=>t.id===taskId);
 if(!task?.demoProduct||!["待补全","待审核"].includes(task.status))throw Error("当前任务不可保存资料修改");
 const safe=(value:string|undefined,max:number)=>typeof value==="string"?value.trim().slice(0,max):undefined;
 const existing=task.textEdits??{};
 const cleaned={
  title:safe(updates.title,500)??existing.title,
  description:safe(updates.description,6000)??existing.description,
  colorDescriptions:{...existing.colorDescriptions,...Object.fromEntries(Object.entries(updates.colorDescriptions??{}).filter(([key,value])=>key.length<=100&&typeof value==="string").map(([key,value])=>[key,value.trim().slice(0,2000)]))},
  skuDescriptions:{...existing.skuDescriptions,...Object.fromEntries(Object.entries(updates.skuDescriptions??{}).filter(([key,value])=>key.length<=160&&typeof value==="string").map(([key,value])=>[key,value.trim().slice(0,2000)]))},
  skuNames:{...existing.skuNames,...Object.fromEntries(Object.entries(updates.skuNames??{}).filter(([key,value])=>key.length<=160&&typeof value==="string"&&!!value.trim()).map(([key,value])=>[key,value.trim().slice(0,160)]))},
  merchantSkuCodes:{...existing.merchantSkuCodes,...Object.fromEntries(Object.entries(updates.merchantSkuCodes??{}).filter(([key,value])=>key.length<=160&&typeof value==="string"&&!!value.trim()).map(([key,value])=>[key,value.trim().slice(0,100)]))},
  categoryPath:safe(updates.categoryPath,300)??existing.categoryPath,
  categoryRulePending:updates.categoryRulePending??existing.categoryRulePending,
  revision:(existing.revision??0)+1,
  updatedAt:new Date().toISOString(),
  fieldValues:{...existing.fieldValues,...updates.fieldValues},
  legacyMissingValues:{...existing.legacyMissingValues,...updates.legacyMissingValues},
  variantStructure:updates.variantStructure??existing.variantStructure,
  variantStructurePending:updates.variantStructure?variantStructureImpact(task.demoProduct.variantDetails??[],updates.variantStructure).changed:existing.variantStructurePending
 };
 const knownSkus=task.demoProduct.variantDetails?.map(v=>v.sku)??task.productIds;
 const allowed=new Set(knownSkus);
 for(const id of [...Object.keys(updates.skuNames??{}),...Object.keys(updates.merchantSkuCodes??{})]){
  if(!allowed.has(id))throw Error("SKU记录不存在，不能修改");
 }
 const codes=knownSkus.map(id=>cleaned.merchantSkuCodes[id]??id).map(v=>v.trim().toLocaleLowerCase());
 if(codes.some(v=>!v)||new Set(codes).size!==codes.length)throw Error("商家SKU编码不能为空，且同一商品内必须唯一");
 if(Object.values(cleaned.skuNames).some(name=>!name.trim()))throw Error("SKU显示名称不能为空");
 if(updates.variantStructure){
  if(!task.demoProduct.variantDetails?.length)throw Error("当前商品没有可编辑的变体结构");
  const issues=variantStructureValidation(updates.variantStructure);
  if(issues.length)throw Error(issues[0]);
  const impacts=variantStructureImpact(task.demoProduct.variantDetails,updates.variantStructure);
  if(impacts.added.length+impacts.retained>200)throw Error("变体组合不能超过200个");
 }
 if(Object.entries(cleaned.fieldValues).some(([key,value])=>key.length>500||typeof value!=="string"||value.length>6000))throw Error("平台属性输入格式或长度不正确");
 if(Object.entries(cleaned.legacyMissingValues).some(([key,value])=>key.length>300||typeof value!=="string"||value.length>6000))throw Error("历史必填资料格式或长度不正确");
 if(cleaned.categoryRulePending===false&&cleaned.categoryPath!==(existing.categoryPath??""))throw Error("分类变更须先完成目标平台规则复核");
 const record={revision:cleaned.revision,updatedAt:cleaned.updatedAt,categoryPath:cleaned.categoryPath??"",ruleVersion:task.platformFieldSchema?.ruleVersion??"unverified",changedFields:[...Object.keys(updates.fieldValues??{}),...Object.keys(updates.skuNames??{}),...Object.keys(updates.merchantSkuCodes??{}),...(updates.variantStructure?["variantStructure"]:[])]};
 const next={...task,textEdits:cleaned,editHistory:[...(task.editHistory??[]),record].slice(-60),editSnapshots:existing.revision?[...(task.editSnapshots??[]),{revision:existing.revision,updatedAt:existing.updatedAt??task.createdAt,previous:existing}].slice(-20):task.editSnapshots};
 persistShowcaseUploadTaskRecords(org,member,tasks.map(t=>t.id===taskId?next:t));
 window.dispatchEvent(new CustomEvent(showcaseUploadTasksEvent,{detail:{organizationId:org,memberId:member}}));
 return next;
}
/** Apply a platform/category rule only when an authorized integration provides a
 * matching, versioned schema.  Incompatible historical values remain in the audit
 * trail; they never silently transfer to the new category. */
export function applyVerifiedListingFieldSchema(org:string,member:string,taskId:string,schema:PlatformFieldSchema):ShowcaseUploadTask{
 const records=readShowcaseUploadTasks(org,member),task=records.find(t=>t.id===taskId);
 if(!task?.demoProduct||!["待补全","待审核"].includes(task.status))throw Error("该任务不允许替换平台字段规则");
 if(schema.source!=="official"&&schema.source!=="verified-import")throw Error("字段规则必须来自经过验证的数据源");
 if(!schema.fields.length||!schema.ruleVersion.trim())throw Error("平台字段规则不完整");
 const expected={platform:task.platform,region:task.region,storeType:task.storeType,categoryPath:task.textEdits?.categoryPath??""};
 if(!fieldSchemaMatches(schema,expected))throw Error("平台、站点、店铺类型或分类与字段规则不一致");
 const current=task.platformFieldSchema;
 const impact=categoryFieldImpact(current,schema);
 const oldValues=task.textEdits?.fieldValues??{};
 const compatible=impact.ready?new Set(impact.retained):new Set<string>();
 // Retain all historical values as source evidence. Only keys belonging to
 // compatible fields become active for the newly verified rule version.
 const currentValues=Object.fromEntries(Object.entries(oldValues).filter(([key])=>{
  try{const scopeField=JSON.parse(key) as unknown;return Array.isArray(scopeField)&&typeof scopeField[2]==="string"&&compatible.has(scopeField[2]);}catch{return false}
 }));
 const archiveKey=current?JSON.stringify([current.platform,current.region,current.storeType,current.categoryPath,current.ruleVersion]):"";
 const archive=archiveKey?{...task.fieldVersionArchive,[archiveKey]:{...(task.fieldVersionArchive?.[archiveKey]??{}),...oldValues}}:task.fieldVersionArchive;
 const next={...task,fieldVersionArchive:archive,editSnapshots:task.textEdits?.revision?[...(task.editSnapshots??[]),{revision:task.textEdits.revision,updatedAt:task.textEdits.updatedAt??task.createdAt,previous:task.textEdits}].slice(-20):task.editSnapshots,platformFieldSchema:schema,textEdits:{...task.textEdits,categoryRulePending:false,fieldValues:currentValues,revision:(task.textEdits?.revision??0)+1,updatedAt:new Date().toISOString()},editHistory:[...(task.editHistory??[]),{revision:(task.textEdits?.revision??0)+1,updatedAt:new Date().toISOString(),categoryPath:schema.categoryPath,ruleVersion:schema.ruleVersion,changedFields:impact.ready?impact.added: schema.fields.map(x=>x.id)}].slice(-60)};
 persistShowcaseUploadTaskRecords(org,member,records.map(t=>t.id===taskId?next:t));
 window.dispatchEvent(new CustomEvent(showcaseUploadTasksEvent,{detail:{organizationId:org,memberId:member}}));
 return next;
}
export function completeShowcaseUploadTask(org:string,member:string,taskId:string,fields:Record<string,string>):ShowcaseUploadTask{
 const records=readShowcaseUploadTasks(org,member),task=records.find(t=>t.id===taskId);
 if(!task||task.status!=="待补全"||!task.demoProduct)throw Error("没有可补全的演示任务");
 if(task.textEdits?.categoryRulePending)throw Error("目标分类变更后尚未核对平台规则，不允许提交审核");
 if(task.textEdits?.variantStructurePending)throw Error("变体结构变更尚未完成SKU组合及平台规则复核，不能提交审核");
 const category=task.textEdits?.categoryPath??"";
 if(category){
  if(!fieldSchemaMatches(task.platformFieldSchema,{platform:task.platform,region:task.region,storeType:task.storeType,categoryPath:category}))throw Error("目标分类没有经过验证的完整平台字段规则，不能提交审核");
  const detail=task.demoProduct.variantDetails??[];
  const errors=validatePlatformFields(task.platformFieldSchema!,task.textEdits?.fieldValues??{},{variantIds:[...new Set(detail.map(v=>v.color.trim().toLowerCase()))],skuIds:detail.length?detail.map(v=>v.sku):task.productIds});
  if(errors.length)throw Error("目标平台必填字段不完整："+errors.slice(0,4).join("；"));
 }
 if(task.demoProduct.missingFields.some(f=>!(fields[f]??task.textEdits?.legacyMissingValues?.[f])?.trim()))throw Error("请先补齐所有缺失资料");
 const next={...task,status:"待审核" as const,missingCount:0,textEdits:{...task.textEdits,legacyMissingValues:{...task.textEdits?.legacyMissingValues,...fields}},demoProduct:{...task.demoProduct,missingFields:[]}};
 persistShowcaseUploadTaskRecords(org,member,records.map(t=>t.id===taskId?next:t));
 window.dispatchEvent(new CustomEvent(showcaseUploadTasksEvent,{detail:{organizationId:org,memberId:member}}));
 return next;
}
export function approveShowcaseUploadTask(org:string,member:string,taskId:string):ShowcaseUploadTask{
 const records=readShowcaseUploadTasks(org,member),task=records.find(t=>t.id===taskId);
 if(!task||task.status!=="待审核"||!task.demoProduct||task.demoProduct.missingFields.length)throw Error("智能体优化结果尚未完成资料检查与人工审核");
 if(task.textEdits?.categoryRulePending)throw Error("目标分类规则尚未重新验证，不能审核通过");
 if(task.textEdits?.variantStructurePending)throw Error("变体结构变更尚未完成SKU关联核验，不能审核通过");
 if(task.textEdits?.categoryPath){
  if(!fieldSchemaMatches(task.platformFieldSchema,{platform:task.platform,region:task.region,storeType:task.storeType,categoryPath:task.textEdits.categoryPath}))throw Error("缺少已验证的平台分类规则");
  const detail=task.demoProduct.variantDetails??[];
  if(validatePlatformFields(task.platformFieldSchema!,task.textEdits.fieldValues??{},{variantIds:[...new Set(detail.map(v=>v.color.trim().toLowerCase()))],skuIds:detail.length?detail.map(v=>v.sku):task.productIds}).length)throw Error("平台必填属性尚未补齐");
 }
 if(task.demoProduct.variantImageGroups?.length&&!task.demoProduct.variantImageGroups.every(variantGroupReady))throw Error("每个颜色组需要六张不同用途的真实优化图后才能审核通过");
 const next={...task,status:"待平台提交" as const,demoProduct:{...task.demoProduct,reviewedAt:new Date().toISOString()}};
 persistShowcaseUploadTaskRecords(org,member,records.map(t=>t.id===taskId?next:t));
 window.dispatchEvent(new CustomEvent(showcaseUploadTasksEvent,{detail:{organizationId:org,memberId:member}}));
 return next;
}

/** Complete the selected Lodge demo against its already bound SHEIN US destination.
 * This updates only the scoped browser demo ledger and NEVER calls SHEIN or
 * creates an external receipt. Existing manual results are left untouched.
 */
export function simulateApprovedLodgeSubmission(org:string,member:string,storeId:string):boolean{
 if(typeof window==="undefined"||org!=="SM-ENT-000001"||member!=="admin"||!storeId)return false;
 const records=readShowcaseUploadTasks(org,member);
 const target=records.find(t=>t.id.startsWith("SHUOMI-AMZ-AI-5:")&&t.productIds.length===1&&t.id.endsWith(":B00008GKD3")&&t.storeId===storeId);
 if(!target||target.status==="模拟已提交"||target.status!=="待审核"||target.demoProduct?.missingFields.length||target.demoProduct?.variantImageGroups?.length||
  target.platform!=="SHEIN"||target.region!=="美国站"||target.storeName!=="管理员演示店铺01"||!target.demoProduct)return false;
 const now=new Date().toISOString();
 const next:ShowcaseUploadTask={...target,status:"模拟已提交",demoProduct:{...target.demoProduct,reviewedAt:now},
  demoSubmission:{reviewedAt:now,submittedAt:now,platform:"SHEIN",site:target.region,storeId:target.storeId,storeName:target.storeName,result:"模拟提交成功",externalReceiptId:null}};
 persistShowcaseUploadTaskRecords(org,member,records.map(t=>t.id===target.id?next:t));
 window.dispatchEvent(new CustomEvent(showcaseUploadTasksEvent,{detail:{organizationId:org,memberId:member}}));
 return true;
}

/** Migrate only old generated SVG previews in this user's five-product demo.
 * Never reset review status, custom field values, source images, or other batches.
 */
export function refreshAmazonFiveDemoPhotos(org:string,member:string):number{
 if(typeof window==="undefined")return 0;
 const records=readShowcaseUploadTasks(org,member);
 let count=0;
 const updated=records.map(task=>{
  const src=task.demoProduct?.optimizedImages;
  const sku=task.productIds[0]?.replace(/^SIM-AMZ-US-/,"");
  const plan=sku?amazonRules[sku]:undefined;
  if(!plan||!task.id.startsWith("SHUOMI-AMZ-AI-5:")||!src?.length)return task;
  const generated=src.every(x=>x.startsWith("data:image/svg+xml")||x.startsWith("shuomi-photo:"));
  if(!generated)return task; // preserve any manually attached photography
  const replacement=listingDemoArtSet(plan.art as ListingArtKind);
  if(src.length===replacement.length&&src.every((x,i)=>x===replacement[i]))return task;
  count++;
  return {...task,demoProduct:{...task.demoProduct!,optimizedImages:replacement}};
 });
 if(count){
  persistShowcaseUploadTaskRecords(org,member,updated);
  window.dispatchEvent(new CustomEvent(showcaseUploadTasksEvent,{detail:{organizationId:org,memberId:member}}));
 }
 return count;
}
