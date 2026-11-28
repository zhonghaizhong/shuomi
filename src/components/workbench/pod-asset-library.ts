"use client";
import {isShowcasePODScope,showcasePODOriginalAsset} from "./pod-showcase-print-demo";

/** Browser-only demo asset library shared by POD management and image pickers.
 * Scope to the active organization AND member. No cross-tenant fallback.
 * This is session storage, not a server asset database or upload service.
 */
export type PodLibraryAsset={
 id:number;name:string;category:string;style:number;prompt:string;
 image?:string;dataUrl?:string;status?:string;
 archivePath?:string;archiveSha256?:string;originPrintId?:string;readonly?:boolean;
 lineagePrintId?:string;lineageVersion?:number;
};
const libraryKey=(organizationId:string,memberId:string)=>
 "shuomi:pod:asset-library:v1:"+encodeURIComponent(organizationId)+":"+encodeURIComponent(memberId);
/** Built-in reference artwork is immutable, but its library visibility is per user.
 * Only a display preference is stored; lineage, GitHub files, and order references stay intact.
 */
const hiddenOriginalKey=(org:string,member:string)=>
 "shuomi:pod:hidden-original:v1:"+encodeURIComponent(org)+":"+encodeURIComponent(member);
export function isPodOriginalHidden(org:string,member:string):boolean{
 if(typeof window==="undefined"||!isShowcasePODScope(org,member))return false;
 try{return localStorage.getItem(hiddenOriginalKey(org,member))==="hidden"}catch{return false}
}
export function setPodOriginalHidden(org:string,member:string,hidden:boolean):void{
 if(typeof window==="undefined"||!isShowcasePODScope(org,member))throw Error("此素材仅属于默认演示账号");
 try{
  if(hidden)localStorage.setItem(hiddenOriginalKey(org,member),"hidden");
  else localStorage.removeItem(hiddenOriginalKey(org,member));
 }catch{throw Error("浏览器无法保存素材可见性设置，请检查网站存储权限")}
 window.dispatchEvent(new CustomEvent("shuomi:pod:asset-library:change",{detail:{organizationId:org,memberId:member}}));
}
export function readPodLibrary(organizationId:string,memberId:string):PodLibraryAsset[]{
 if(typeof window==="undefined")return [];
 // Checked-in demo art stays visible in every browser, not sessionStorage.
 const builtins=isShowcasePODScope(organizationId,memberId)&&!isPodOriginalHidden(organizationId,memberId)?[showcasePODOriginalAsset]:[];
 try {
  const saved=sessionStorage.getItem(libraryKey(organizationId,memberId));
  if(!saved)return builtins;
  const parsed:unknown=JSON.parse(saved);
  if(!Array.isArray(parsed))return builtins;
  const personal=parsed.filter((x):x is PodLibraryAsset=>{
   if(!x||typeof x!=="object")return false;
   const item=x as Record<string,unknown>;
   return typeof item.id==="number"&&typeof item.name==="string"&&typeof item.category==="string"
     &&typeof item.style==="number"&&(typeof item.dataUrl==="string"||typeof item.image==="string"||typeof item.archivePath==="string");
  }).filter(asset=>!isShowcasePODScope(organizationId,memberId)||asset.id!==showcasePODOriginalAsset.id);
  return [...builtins,...personal];
 }catch{return builtins;}
}
export function savePodLibrary(organizationId:string,memberId:string,assets:PodLibraryAsset[]):boolean{
 if(typeof window==="undefined")return false;
 try{
  const personal=assets.filter(asset=>!isShowcasePODScope(organizationId,memberId)||asset.id!==showcasePODOriginalAsset.id);
  sessionStorage.setItem(libraryKey(organizationId,memberId),JSON.stringify(personal));
  window.dispatchEvent(new CustomEvent("shuomi:pod:asset-library:change",{detail:{organizationId,memberId}}));
  return true;
 }catch{return false;}
}
export async function readPodAssetImage(file:File):Promise<string>{
 if(!["image/png","image/jpeg","image/webp","image/svg+xml"].includes(file.type))throw Error("只支持 PNG、JPG、WebP、SVG 图片。");
 if(file.size>450*1024)throw Error("演示素材每张不能超过 450KB；正式大图上传需接入存储服务。");
 return await new Promise<string>((resolve,reject)=>{
  const reader=new FileReader();
  reader.onerror=()=>reject(Error("图片读取失败，请重新选择。"));
  reader.onload=()=>typeof reader.result==="string"?resolve(reader.result):reject(Error("无法读取图片。"));
  reader.readAsDataURL(file);
 });
}
export function podAssetPreviewSrc(asset:PodLibraryAsset):string{
 if(asset.dataUrl?.startsWith("data:image/"))return asset.dataUrl;
  if(asset.archivePath && /^\/assets\/pod-prints\/[a-zA-Z0-9_\/-]+\.(png|webp)$/.test(asset.archivePath) && !asset.archivePath.includes("..")){
  const prefix=typeof window!=="undefined"&&window.location.pathname.startsWith("/shuomi")?"/shuomi":"";
  return prefix+asset.archivePath;
 }
 if(asset.image){
  const prefix=typeof window!=="undefined"&&window.location.pathname.startsWith("/shuomi")?"/shuomi":"";
  return prefix+"/assets/pod-inspiration/"+asset.image+".svg";
 }
 return "";
}
