"use client";

/** Browser-only demo asset library shared by POD management and image pickers.
 * Scope to the active organization AND member. No cross-tenant fallback.
 * This is session storage, not a server asset database or upload service.
 */
export type PodLibraryAsset={
 id:number;name:string;category:string;style:number;prompt:string;
 image?:string;dataUrl?:string;status?:string;
 archivePath?:string;lineagePrintId?:string;lineageVersion?:number;
};
const libraryKey=(organizationId:string,memberId:string)=>
 "shuomi:pod:asset-library:v1:"+encodeURIComponent(organizationId)+":"+encodeURIComponent(memberId);
export function readPodLibrary(organizationId:string,memberId:string):PodLibraryAsset[]{
 if(typeof window==="undefined")return [];
 try {
  const saved=sessionStorage.getItem(libraryKey(organizationId,memberId));
  if(!saved)return [];
  const parsed:unknown=JSON.parse(saved);
  if(!Array.isArray(parsed))return [];
  return parsed.filter((x):x is PodLibraryAsset=>{
   if(!x||typeof x!=="object")return false;
   const item=x as Record<string,unknown>;
   return typeof item.id==="number"&&typeof item.name==="string"&&typeof item.category==="string"
     &&typeof item.style==="number"&&(typeof item.dataUrl==="string"||typeof item.image==="string");
  });
 }catch{return [];}
}
export function savePodLibrary(organizationId:string,memberId:string,assets:PodLibraryAsset[]):boolean{
 if(typeof window==="undefined")return false;
 try{
  sessionStorage.setItem(libraryKey(organizationId,memberId),JSON.stringify(assets));
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
