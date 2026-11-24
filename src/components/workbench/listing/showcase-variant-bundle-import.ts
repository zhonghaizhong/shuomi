"use client";
import {listingVariantPhotoRoles,readShowcaseUploadTasks,showcaseUploadTasksEvent,type ListingVariantImage,type ShowcaseUploadTask} from "./showcase-upload-tasks";

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
 let keys:IDBValidKey[];
 try{
  keys=await new Promise<IDBValidKey[]>((resolve,reject)=>{
   const tx=db.transaction(storeName,"readonly"),request=tx.objectStore(storeName).getAllKeys();
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error??new Error("读取历史图片目录失败"));
  });
 }finally{db.close();}
 const base=[org,member,taskId].join("|")+"|";
 const available=new Set(keys.filter((k):k is string=>typeof k==="string"&&k.startsWith(base)));
 const groups=task.demoProduct.variantImageGroups.map(group=>{
  const existing=new Set(group.optimizedImages.map(img=>img.role));
  const recovered:ListingVariantImage[]=[];
  for(let i=0;i<listingVariantPhotoRoles.length;i++){
   const role=listingVariantPhotoRoles[i],savedKey=base+group.id+"|"+i;
   if(available.has(savedKey)&&!existing.has(role)){
    recovered.push({role,url:scheme+savedKey,version:group.version,source:"demo-import",provenance:"在当前浏览器找回的历史导入素材，未验证为 AI 重构成品"});
   }
  }
  return {...group,optimizedImages:[...group.optimizedImages,...recovered]};
 });
 const restored=groups.reduce((n,g,i)=>n+g.optimizedImages.length-task.demoProduct!.variantImageGroups![i].optimizedImages.length,0);
 if(restored){
  const next={...task,demoProduct:{...task.demoProduct,variantImageGroups:groups}};
  const storageKey="shuomi:listing-upload-tasks-v1:"+org+":"+member;
  sessionStorage.setItem(storageKey,JSON.stringify(tasks.map(t=>t.id===taskId?next:t)));
  window.dispatchEvent(new CustomEvent(showcaseUploadTasksEvent,{detail:{organizationId:org,memberId:member}}));
 }
 return {found:available.size,restored};
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
 const storageKey="shuomi:listing-upload-tasks-v1:"+organizationId+":"+memberId;
 sessionStorage.setItem(storageKey,JSON.stringify(tasks.map(t=>next.get(t.id)??t)));
 window.dispatchEvent(new CustomEvent(showcaseUploadTasksEvent,{detail:{organizationId,memberId}}));
 return {imported,skipped,tasks:2,colors:6};
}
