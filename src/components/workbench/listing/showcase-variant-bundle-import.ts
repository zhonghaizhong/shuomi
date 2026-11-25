"use client";
import {listingVariantPhotoRoles,readShowcaseUploadTasks,persistShowcaseUploadTaskRecords,showcaseUploadTasksEvent,type ListingVariantImage,type ShowcaseUploadTask} from "./showcase-upload-tasks";

/** User-provided ZIP is browser-local; neither this demo nor GitHub Pages has a server image store.
 * ZIP bytes are kept in IndexedDB scoped to this organization's member and task.
 */
const dbName="shuomi-demo-variant-photo-library-v1";
const storeName="photos";
const scheme="shuomi-bundle:";
export const isVariantBundleUrl=(url:string)=>url.startsWith(scheme);
const expectedRoles=["01_product_hero.jpg","02_purchase_reasons.jpg","03_core_solution.jpg","04_product_structure.jpg","05_detail_evidence.jpg","06_usage_scenario.jpg"] as const;
const mappings=[
 {product:"SIM-AMZ-US-CROCS-10001",folder:"crocs",colors:[["black","black"],["white","white"],["navy","navy"]]},
 {product:"SIM-AMZ-US-STANLEY-Q40",folder:"stanley",colors:[["cream 2.0","cream"],["black","black"],["rose quartz","rose_quartz"]]}
] as const;

function openDatabase():Promise<IDBDatabase>{
 return new Promise((resolve,reject)=>{
  if(typeof indexedDB==="undefined"){reject(new Error("此浏览器不支持本地图片存储"));return;}
  const request=indexedDB.open(dbName,1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(storeName))request.result.createObjectStore(storeName);};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error??new Error("打开图片存储失败"));
 });
}
async function storePhotos(entries:{key:string;blob:Blob}[]):Promise<void>{
 const db=await openDatabase();
 try{
  await new Promise<void>((resolve,reject)=>{
   const tx=db.transaction(storeName,"readwrite");
   for(const entry of entries)tx.objectStore(storeName).put(entry.blob,entry.key);
   tx.oncomplete=()=>resolve();
   tx.onerror=()=>reject(tx.error??new Error("存储图片失败"));
   tx.onabort=()=>reject(tx.error??new Error("图片导入已中止"));
  });
 }finally{db.close();}
}
/** Local image attachments are browser-only, and are never classified as generated AI artwork. */
export async function saveListingLocalPhoto(org:string,member:string,task:string,color:string,file:File):Promise<string>{
 if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>8*1024*1024||file.size===0)
  throw new Error("请选择不超过 8MB 的 JPG、PNG 或 WebP 图片");
 const id=["manual",org,member,task,color,Date.now().toString(36),Math.random().toString(36).slice(2,9)].join("|");
 await storePhotos([{key:id,blob:file}]);
 return scheme+id;
}
export async function readVariantBundlePhoto(url:string):Promise<Blob|null>{
 if(!isVariantBundleUrl(url))return null;
 const db=await openDatabase();
 try{return await new Promise<Blob|null>((resolve,reject)=>{
  const tx=db.transaction(storeName,"readonly"),req=tx.objectStore(storeName).get(url.slice(scheme.length));
  req.onsuccess=()=>resolve(req.result instanceof Blob?req.result:null);
  req.onerror=()=>reject(req.error??new Error("读取图片失败"));
 });}finally{db.close();}
}
function zipNumber(view:DataView,offset:number):number{return view.getUint32(offset,true);}
async function readZip(file:File):Promise<Map<string,Uint8Array>>{
 if(file.size>40*1024*1024)throw new Error("图片包超过 40MB，请选择之前下载的 36 张图片 ZIP 文件");
 const bytes=await file.arrayBuffer(),view=new DataView(bytes),raw=new Uint8Array(bytes),files=new Map<string,Uint8Array>();
 let eocd=-1;
 for(let i=bytes.byteLength-22;i>=Math.max(0,bytes.byteLength-65557);i--){if(zipNumber(view,i)===0x06054b50){eocd=i;break;}}
 if(eocd<0)throw new Error("不是有效的 ZIP 图片包");
 const count=view.getUint16(eocd+10,true);
 let ptr=zipNumber(view,eocd+16),total=0;
 if(count>120)throw new Error("图片包文件数量异常");
 for(let i=0;i<count;i++){
  if(ptr+46>raw.length||zipNumber(view,ptr)!==0x02014b50)throw new Error("ZIP 文件目录损坏");
  const method=view.getUint16(ptr+10,true),compressed=zipNumber(view,ptr+20),uncompressed=zipNumber(view,ptr+24);
  const nameSize=view.getUint16(ptr+28,true),extra=view.getUint16(ptr+30,true),comment=view.getUint16(ptr+32,true),local=zipNumber(view,ptr+42);
  const name=new TextDecoder().decode(raw.subarray(ptr+46,ptr+46+nameSize));
  ptr+=46+nameSize+extra+comment;
  if(name.endsWith("/"))continue;
  if(!/^(crocs|stanley)\/(black|white|navy|cream|rose_quartz)\/\d\d_[\w]+\.jpg$/.test(name)&&name!=="manifest.json")throw new Error("图片包含非预期文件："+name);
  if(local+30>raw.length||zipNumber(view,local)!==0x04034b50)throw new Error("ZIP 文件内容损坏");
  const start=local+30+view.getUint16(local+26,true)+view.getUint16(local+28,true);
  if(start+compressed>raw.length||uncompressed>12*1024*1024)throw new Error("图片尺寸或压缩数据异常");
  let data:Uint8Array;
  if(method===0)data=raw.slice(start,start+compressed);
  else if(method===8){
   if(typeof DecompressionStream==="undefined")throw new Error("当前浏览器不支持 ZIP 解压，请使用新版 Chrome 或 Edge");
   // ZIP uses raw DEFLATE rather than gzip or zlib-wrapped deflate.
   const stream=new Blob([raw.slice(start,start+compressed) as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
   data=new Uint8Array(await new Response(stream).arrayBuffer());
  }else throw new Error("不支持的 ZIP 压缩方式");
  if(data.length!==uncompressed)throw new Error("ZIP 中的图片数据不完整");
  total+=data.length;if(total>65*1024*1024)throw new Error("图片包解压后过大");
  files.set(name,data);
 }
 return files;
}
/** Recover actual browser-held historical images whose session-scoped gallery links were lost.
 * Only reads the current org/member/task and known variant role; never labels imports as AI-generated.
 */
export async function recoverLocalListingPhotos(org:string,member:string,taskId:string):Promise<{found:number;restored:number}>{
 const tasks=readShowcaseUploadTasks(org,member),task=tasks.find(t=>t.id===taskId);
 if(!task?.demoProduct?.variantImageGroups?.length)throw new Error("当前商品没有可恢复的多变体图片记录");
 const db=await openDatabase();
 let entries:Array<{key:string;blob:Blob}>=[];
 try{
  entries=await new Promise<Array<{key:string;blob:Blob}>>((resolve,reject)=>{
   const tx=db.transaction(storeName,"readonly"),request=tx.objectStore(storeName).openCursor();
   const found:Array<{key:string;blob:Blob}>=[];
   const prefix=[org,member,taskId].join("|")+"|";
   request.onsuccess=()=>{
    const cursor=request.result;
    if(!cursor){resolve(found);return;}
    if(typeof cursor.key==="string"&&cursor.key.startsWith(prefix)&&cursor.value instanceof Blob)
     found.push({key:cursor.key,blob:cursor.value});
    cursor.continue();
   };
   request.onerror=()=>reject(request.error??new Error("读取历史图片目录失败"));
   tx.onerror=()=>reject(tx.error??new Error("读取历史图片目录失败"));
  });
 }finally{db.close();}
 const base=[org,member,taskId].join("|")+"|";
 // New AI ZIP imports use `|generated-<sha256 prefix>`; older imports used a bare index.
 // Validate the content hash before restoring AI provenance; never classify legacy imports as AI.
 const validGenerated=new Map<string,string>();
 const legacy=new Set<string>();
 for(const {key,blob} of entries){
  const suffix=key.slice(base.length);
  const match=/^([^|]+)\|(\d+)\|generated-([a-f0-9]{16})$/.exec(suffix);
  if(match){
   if(blob.type!=="image/jpeg"||blob.size<1024)continue;
   const bytes=await blob.arrayBuffer();
   const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)))
    .map(b=>b.toString(16).padStart(2,"0")).join("");
   if(hash.startsWith(match[3]))validGenerated.set(match[1]+"|"+match[2],key);
  }else if(/^([^|]+)\|(\d+)$/.test(suffix))legacy.add(key);
 }
 const groups=task.demoProduct.variantImageGroups.map(group=>{
  const recovered:ListingVariantImage[]=[];
  for(let i=0;i<listingVariantPhotoRoles.length;i++){
   const role=listingVariantPhotoRoles[i],legacyKey=base+group.id+"|"+i;
   const generatedKey=validGenerated.get(group.id+"|"+i);
   const prior=group.optimizedImages.find(img=>img.role===role);
   // Protect previously saved AI or user-reviewed images; only replace absent or demo links.
   if(prior&&prior.source!=="demo-import")continue;
   if(generatedKey){
    recovered.push({role,url:scheme+generatedKey,version:group.version,source:"ai-generated",
     provenance:"从当前浏览器恢复已校验 SHA-256 的 AI 图片导入记录，需人工核对"});
   }else if(!prior&&legacy.has(legacyKey)){
    recovered.push({role,url:scheme+legacyKey,version:group.version,source:"demo-import",
     provenance:"在当前浏览器找回的历史导入素材，未验证为 AI 重构成品"});
   }
  }
  const replaced=new Set(recovered.map(img=>img.role));
  return {...group,optimizedImages:[...group.optimizedImages.filter(img=>!replaced.has(img.role)),...recovered],
   ...(recovered.length?{reviewedAt:undefined}:{})};
 });
 const restored=groups.reduce((n,g,i)=>n+g.optimizedImages.filter(img=>{
  const previous=task.demoProduct!.variantImageGroups![i].optimizedImages.find(old=>old.role===img.role);
  return !previous||previous.url!==img.url;
 }).length,0);
 if(restored){
  const latest=readShowcaseUploadTasks(org,member),current=latest.find(t=>t.id===taskId);
  if(!current?.demoProduct?.variantImageGroups)throw new Error("恢复时任务发生变化，请重试");
  // Reconcile against the latest task metadata rather than overwriting concurrent edits.
  const merged=current.demoProduct.variantImageGroups.map(group=>{
   const recoveredGroup=groups.find(g=>g.id===group.id);
   if(!recoveredGroup)return group;
   const additions=recoveredGroup.optimizedImages.filter(img=>{
    const original=task.demoProduct!.variantImageGroups!.find(g=>g.id===group.id)?.optimizedImages.find(old=>old.role===img.role);
    return !original||original.url!==img.url;
   }).filter(img=>{
    const currentImage=group.optimizedImages.find(old=>old.role===img.role);
    return !currentImage||currentImage.source==="demo-import";
   });
   if(!additions.length)return group;
   const roles=new Set(additions.map(img=>img.role));
   return {...group,optimizedImages:[...group.optimizedImages.filter(img=>!roles.has(img.role)),...additions],reviewedAt:undefined};
  });
  const next={...current,demoProduct:{...current.demoProduct,variantImageGroups:merged}};
  persistShowcaseUploadTaskRecords(org,member,latest.map(t=>t.id===taskId?next:t));
  window.dispatchEvent(new CustomEvent(showcaseUploadTasksEvent,{detail:{organizationId:org,memberId:member}}));
 }
 return {found:entries.length,restored};
}
/** Bind one immutable, public demo photo set to the original Crocs task.
 * Probe all 18 static assets before changing anything; a missing GitHub Pages
 * deploy must never overwrite local AI reconstructions or original photos.
 */
export async function linkHostedCrocsDemoPhotos(org:string,member:string):Promise<number>{
 const tasks=readShowcaseUploadTasks(org,member);
 const task=tasks.find(t=>t.id.startsWith("SHUOMI-AMZ-AI-MULTI:")&&t.productIds.includes("SIM-AMZ-US-CROCS-10001"));
 if(!task?.demoProduct?.variantImageGroups)return 0;
 const base=typeof window!=="undefined"&&window.location.pathname.startsWith("/shuomi")?"/shuomi":"";
 const colors=["black","white","navy"] as const;
 const images=colors.flatMap(color=>expectedRoles.map((file,index)=>({
  color,role:listingVariantPhotoRoles[index],url:"/assets/demo-products/crocs/"+color+"/"+file
 })));
 // A static 404 or partial deployment must not create broken galleries.
 const available=await Promise.all(images.map(async image=>{
  try{
   const result=await fetch(base+image.url,{method:"HEAD",cache:"no-store"});
   return result.ok&&result.headers.get("content-type")?.startsWith("image/");
  }catch{return false;}
 }));
 if(available.some(v=>!v))return 0;
 const latest=readShowcaseUploadTasks(org,member);
 const current=latest.find(t=>t.id===task.id);
 if(!current?.demoProduct?.variantImageGroups)return 0;
 let attached=0;
 const groups=current.demoProduct.variantImageGroups.map(group=>{
  if(!colors.some(c=>c===group.id))return group;
  const additions=images.filter(image=>image.color===group.id).filter(image=>{
   // Never replace existing genuinely generated or manually reviewed photos.
   const existing=group.optimizedImages.find(item=>item.role===image.role);
   return !existing||existing.source==="demo-import";
  }).map(image=>({
   role:image.role,url:image.url,version:group.version,source:"demo-import" as const,
   provenance:"GitHub 静态公开演示图片，供跨浏览器展示；不可作为正式 AI 生成或人工审核证明"
  }));
  if(!additions.length)return group;
  attached+=additions.length;
  const replaced=new Set(additions.map(image=>image.role));
  return {...group,optimizedImages:[...group.optimizedImages.filter(image=>!replaced.has(image.role)),...additions]};
 });
 if(attached){
  const next={...current,demoProduct:{...current.demoProduct,variantImageGroups:groups}};
  persistShowcaseUploadTaskRecords(org,member,latest.map(t=>t.id===task.id?next:t));
  window.dispatchEvent(new CustomEvent(showcaseUploadTasksEvent,{detail:{organizationId:org,memberId:member}}));
 }
 return attached;
}

/** Re-import six freshly generated image outputs into exactly one selected variant color.
 * This does not restore previous images or touch other colors/tasks.
 * AI generation provenance is provided with the ZIP and outputs still require review before publication.
 */
export async function importSingleColorAIReconstruction(
 organizationId:string,memberId:string,taskId:string,colorGroupId:string,file:File
):Promise<number>{
 const tasks=readShowcaseUploadTasks(organizationId,memberId);
 const task=tasks.find(t=>t.id===taskId);
 const group=task?.demoProduct?.variantImageGroups?.find(g=>g.id===colorGroupId);
 if(!task||!group||!["待补全","待审核"].includes(task.status))throw new Error("当前商品或颜色不可导入图片");
 const packageFiles=await readZip(file);
 const manifestBytes=packageFiles.get("manifest.json");
 if(!manifestBytes)throw new Error("图片包缺少 AI 生成说明");
 let manifest:{
  count?:number;source?:string;colorId?:string;
  product?:string;images?:Array<{path:string;method:string;sha256?:string}>;
 };
 try{manifest=JSON.parse(new TextDecoder().decode(manifestBytes));}
 catch{throw new Error("AI 图片来源说明无法解析");}
 if(manifest.count!==6||manifest.source!=="ai-generated"||manifest.colorId!==colorGroupId||
    !Array.isArray(manifest.images)||manifest.images.length!==6)
  throw new Error("需要当前颜色的六张 AI 重构图片包");
 const expected=expectedRoles.map(name=>"crocs/"+colorGroupId+"/"+name);
 const hashes=new Set<string>();
 const photos:{key:string;blob:Blob}[]=[],outputs:ListingVariantImage[]=[];
 for(let index=0;index<expected.length;index++){
  const path=expected[index],details=manifest.images.find(x=>x.path===path),bytes=packageFiles.get(path);
  if(!details||details.method!=="ai-generated"||!bytes||bytes.length<1024||
     bytes[0]!==0xff||bytes[1]!==0xd8)throw new Error("图片包缺少有效的 AI 重构图："+path);
  const hashInput=new Uint8Array(bytes.length);hashInput.set(bytes);
  const hashBytes=await crypto.subtle.digest("SHA-256",hashInput);
  const digest=Array.from(new Uint8Array(hashBytes)).map(x=>x.toString(16).padStart(2,"0")).join("");
  if(details.sha256!==digest||hashes.has(digest))throw new Error("图片校验不通过或出现重复成品："+path);
  hashes.add(digest);
  const key=[organizationId,memberId,taskId,colorGroupId,String(index)].join("|")+"|generated-"+digest.slice(0,16);
  photos.push({key,blob:new Blob([bytes as BlobPart],{type:"image/jpeg"})});
  outputs.push({role:listingVariantPhotoRoles[index],url:scheme+key,version:group.version,
   source:"ai-generated",provenance:"OpenAI ImageGen 新生成图片包；需核对商品真实性，未自动通过审核；SHA256 "+digest});
 }
 await storePhotos(photos);
 // Re-read task after async validation to retain other edits and user actions.
 const latest=readShowcaseUploadTasks(organizationId,memberId);
 const current=latest.find(t=>t.id===taskId);
 if(!current?.demoProduct?.variantImageGroups)throw new Error("保存前商品任务已改变，请重试");
 const nextGroups=current.demoProduct.variantImageGroups.map(g=>{
  if(g.id!==colorGroupId)return g;
  const replaced=new Set(outputs.map(x=>x.role));
  return {...g,optimizedImages:[...g.optimizedImages.filter(x=>!replaced.has(x.role)),...outputs],reviewedAt:undefined};
 });
 const next={...current,demoProduct:{...current.demoProduct,variantImageGroups:nextGroups}};
 persistShowcaseUploadTaskRecords(organizationId,memberId,latest.map(t=>t.id===taskId?next:t));
 window.dispatchEvent(new CustomEvent(showcaseUploadTasksEvent,{detail:{organizationId,memberId}}));
 return outputs.length;
}

/** Import one manifest-verified 18-image pack to the existing Crocs task.
 * This bridges separately generated assets into the original simulated upload
 * task's three color groups without creating another product or draft version.
 * Import is explicit: a ChatGPT attachment is not automatically available to the
 * logged-in browser and must first be selected by that user.
 */
export async function importThreeColorAIReconstruction(
 organizationId:string,memberId:string,taskId:string,file:File
):Promise<{count:number;colors:number}>{
 const tasks=readShowcaseUploadTasks(organizationId,memberId);
 const task=tasks.find(t=>t.id===taskId);
 const colors=["black","white","navy"] as const;
 if(!task?.id.startsWith("SHUOMI-AMZ-AI-MULTI:")||!task.productIds.includes("SIM-AMZ-US-CROCS-10001")||
    !task.demoProduct?.variantImageGroups||!["待补全","待审核"].includes(task.status))
  throw new Error("请先进入 Crocs 多变体商品的待补全或待审核任务");
 if(colors.some(c=>!task.demoProduct?.variantImageGroups?.some(g=>g.id===c)))
  throw new Error("缺少 Black、White 或 Navy 的颜色组，不会写入其他商品");
 const files=await readZip(file),manifestFile=files.get("manifest.json");
 if(!manifestFile)throw new Error("缺少 18 张图的 AI 来源清单");
 let manifest:{count?:number;source?:string;colors?:string[];images?:Array<{path:string;method:string;sha256?:string}>};
 try{manifest=JSON.parse(new TextDecoder().decode(manifestFile));}
 catch{throw new Error("图片包 manifest.json 无效");}
 if(manifest.count!==18||manifest.source!=="ai-generated"||!Array.isArray(manifest.images)||
    manifest.images.length!==18||colors.some(c=>!manifest.colors?.includes(c)))
  throw new Error("请选择 Black、White、Navy 各六张的 AI 图片包（共 18 张）");
 const validated:{color:string;items:ListingVariantImage[]}[]=[];
 const photos:{key:string;blob:Blob}[]=[];
 const hashes=new Set<string>();
 for(const color of colors){
  const group=task.demoProduct.variantImageGroups.find(g=>g.id===color)!;
  const outputs:ListingVariantImage[]=[];
  for(let idx=0;idx<6;idx++){
   const path="crocs/"+color+"/"+expectedRoles[idx],meta=manifest.images.find(m=>m.path===path),bytes=files.get(path);
   if(!meta||meta.method!=="ai-generated"||!bytes||bytes.length<1024||
      bytes[0]!==0xff||bytes[1]!==0xd8)
    throw new Error("缺少 "+color+" 第 "+(idx+1)+" 张有效图片");
   const hashInput=new Uint8Array(bytes.length);hashInput.set(bytes);
   const hashBytes=await crypto.subtle.digest("SHA-256",hashInput);
   const digest=Array.from(new Uint8Array(hashBytes)).map(v=>v.toString(16).padStart(2,"0")).join("");
   if(meta.sha256!==digest||hashes.has(digest))
    throw new Error(color+" 第 "+(idx+1)+" 张校验失败或图片重复");
   hashes.add(digest);
   const key=[organizationId,memberId,taskId,color,String(idx)].join("|")+"|generated-"+digest.slice(0,16);
   photos.push({key,blob:new Blob([bytes as BlobPart],{type:"image/jpeg"})});
   outputs.push({role:listingVariantPhotoRoles[idx],url:scheme+key,version:group.version,
    source:"ai-generated",provenance:"已导入生成的 AI 商品图片，待人工核对；SHA256 "+digest});
  }
  validated.push({color,items:outputs});
 }
 // All checks must pass before any writes; keep source photos and other tasks.
 const latest=readShowcaseUploadTasks(organizationId,memberId);
 const current=latest.find(t=>t.id===taskId);
 if(!current?.demoProduct?.variantImageGroups||!["待补全","待审核"].includes(current.status))
  throw new Error("导入期间商品状态变化，请重新打开任务");
 await storePhotos(photos);
 const groups=current.demoProduct.variantImageGroups.map(group=>{
  const pack=validated.find(v=>v.color===group.id);
  if(!pack)return group;
  const roles=new Set(pack.items.map(i=>i.role));
  return {...group,optimizedImages:[...group.optimizedImages.filter(i=>!roles.has(i.role)),...pack.items],reviewedAt:undefined};
 });
 const next={...current,demoProduct:{...current.demoProduct,variantImageGroups:groups}};
 persistShowcaseUploadTaskRecords(organizationId,memberId,latest.map(t=>t.id===taskId?next:t));
 window.dispatchEvent(new CustomEvent(showcaseUploadTasksEvent,{detail:{organizationId,memberId}}));
 return {count:photos.length,colors:validated.length};
}

export type VariantBundleImportResult={imported:number;skipped:number;tasks:number;colors:number};
/** One ZIP binds 36 images into the existing two Amazon showcase tasks, never creating a real platform upload. */
export async function importAmazonVariantBundle(organizationId:string,memberId:string,file:File):Promise<VariantBundleImportResult>{
 const contents=await readZip(file),tasks=readShowcaseUploadTasks(organizationId,memberId);
 const identified=mappings.map(m=>{
  const task=tasks.find(t=>t.productIds.includes(m.product));
  if(!task?.demoProduct?.variantImageGroups?.length)throw new Error("未找到 "+m.folder+" 对应的演示刊登任务，请先在刊登管理打开该批次");
  return {...m,task};
 });
 const sourceManifest=contents.get("manifest.json");
 if(!sourceManifest)throw new Error("图片包没有 manifest.json，无法核实素材来源");
 let parsed:{count?:number;images?:Array<{path:string;method:string}>};
 try{parsed=JSON.parse(new TextDecoder().decode(sourceManifest));}catch{throw new Error("图片包来源说明无效");}
 if(parsed.count!==36||!Array.isArray(parsed.images)||parsed.images.length!==36)throw new Error("图片包必须包含完整的 36 张来源记录");
 const methods=new Map(parsed.images.map(x=>[x.path,x.method]));
 const next=new Map<string,ShowcaseUploadTask>(),blobs:{key:string;blob:Blob}[]=[];
 let imported=0,skipped=0;
 for(const item of identified){
  if(!["待补全","待审核"].includes(item.task.status))throw new Error("商品已离开补全/审核阶段，不自动覆盖其图片");
  const data=item.task.demoProduct!;
  const groups=data.variantImageGroups!.map(group=>{
   const mapped=item.colors.find(([id])=>id===group.id);
   if(!mapped)return group;
   const [,folder]=mapped,optimizedImages:ListingVariantImage[]=[...group.optimizedImages];
   for(let i=0;i<6;i++){
    const role=listingVariantPhotoRoles[i],filePath=item.folder+"/"+folder+"/"+expectedRoles[i],content=contents.get(filePath);
    if(!content||!methods.has(filePath)||!content.length)throw new Error("缺少 "+filePath+" 或其来源标记");
    if(content[0]!==0xff||content[1]!==0xd8)throw new Error(filePath+" 不是有效的 JPG 图片");
    const old=optimizedImages.find(p=>p.role===role);
    // Do not replace previously verified or manually approved work.
    if(old&&old.source!=="demo-import"){skipped++;continue;}
    const key=[organizationId,memberId,item.task.id,group.id,String(i)].join("|");
    blobs.push({key,blob:new Blob([content as BlobPart],{type:"image/jpeg"})});
    const image:ListingVariantImage={role,url:scheme+key,version:group.version,source:"demo-import",provenance:methods.get(filePath)};
    const existing=optimizedImages.findIndex(x=>x.role===role);
    if(existing<0)optimizedImages.push(image);else optimizedImages[existing]=image;
    imported++;
   }
   return {...group,optimizedImages};
  });
  next.set(item.task.id,{...item.task,demoProduct:{...data,variantImageGroups:groups}});
 }
 if(imported+skipped!==36)throw new Error("图片与六个颜色组不完整，未保存");
 await storePhotos(blobs);
 persistShowcaseUploadTaskRecords(organizationId,memberId,tasks.map(t=>next.get(t.id)??t));
 window.dispatchEvent(new CustomEvent(showcaseUploadTasksEvent,{detail:{organizationId,memberId}}));
 return {imported,skipped,tasks:2,colors:6};
}
