"use client";
/** 5×6 approved photographic e-commerce images assembled into one WebP atlas.
 *  Each source tile is 192×192. Original high-resolution JPG files are
 *  supplied separately; this compact atlas serves the live showcase previews.
 */
export type ListingArtKind="cream"|"charger"|"skillet"|"ereader"|"battery";
const order:ListingArtKind[]=["cream","charger","skillet","ereader","battery"];
const prefix="shuomi-photo:";
export function listingDemoArtSet(kind:ListingArtKind):string[]{
 if(!order.includes(kind))throw Error("未知商品图片分类");
 return Array.from({length:6},(_,index)=>prefix+kind+":"+index);
}
export function parseListingPhoto(src:string):{kind:ListingArtKind;index:number;row:number;col:number}|null{
 if(!src.startsWith(prefix))return null;
 const match=/^shuomi-photo:(cream|charger|skillet|ereader|battery):([0-5])$/.exec(src);
 if(!match)return null;
 const kind=match[1] as ListingArtKind,index=Number(match[2]);
 return {kind,index,row:order.indexOf(kind),col:index};
}
export function listingPhotoAtlasUrl():string{
 const base=typeof window!=="undefined"&&window.location.pathname.startsWith("/shuomi")?"/shuomi":"";
 return base+"/assets/listing-ai-preview/amazon-five-30-images-atlas.webp";
}
