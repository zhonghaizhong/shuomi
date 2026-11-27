"use client";

/** Browser-only demonstration of the last successfully verified product sync.
 * Production must persist these records server-side per organization and store.
 * Never infer 'published' or 'Shuomi-originated' from a pending upload task.
 */
export type StoreProductSnapshotRow={
 platformProductId:string;
 name:string;
 sku:string;
 imageUrl?:string;
 platformStatus:string;
 price?:string;
 stock?:number;
 origin:"merchant"|"shuomi"|"unknown";
};
export type StoreProductSnapshot={
 organizationId:string;
 storeId:string;
 platformStoreId:string;
 syncedAt:string;
 rows:StoreProductSnapshotRow[];
};
const key=(org:string,store:string)=>"shuomi:store-product-snapshot-demo:v1:"+org+":"+store;
export function readStoreProductSnapshot(org:string,store:string,platformStoreId:string):StoreProductSnapshot|null{
 if(typeof window==="undefined"||!org||!store||!platformStoreId)return null;
 try{
  const raw=localStorage.getItem(key(org,store));
  if(!raw)return null;
  const parsed:unknown=JSON.parse(raw);
  if(!parsed||typeof parsed!=="object")return null;
  const v=parsed as Partial<StoreProductSnapshot>;
  if(v.organizationId!==org||v.storeId!==store||v.platformStoreId!==platformStoreId||!v.syncedAt||!Number.isFinite(Date.parse(v.syncedAt))||!Array.isArray(v.rows))return null;
  const rows=v.rows.filter((r):r is StoreProductSnapshotRow=>Boolean(r&&typeof r.platformProductId==="string"&&r.platformProductId&&typeof r.name==="string"&&typeof r.sku==="string"&&typeof r.platformStatus==="string"&&["merchant","shuomi","unknown"].includes(r.origin))).map(r=>({...r}));
  if(rows.length!==v.rows.length)return null;
  return {organizationId:org,storeId:store,platformStoreId,syncedAt:v.syncedAt,rows};
 }catch{return null}
}
/** Only call after platform sync finishes and returned records are validated. */
export function saveVerifiedStoreProductSnapshot(snapshot:StoreProductSnapshot):void{
 if(typeof window==="undefined")throw Error("仅支持浏览器演示存储");
 if(!snapshot.organizationId||!snapshot.storeId||!snapshot.platformStoreId||!Number.isFinite(Date.parse(snapshot.syncedAt)))throw Error("同步快照的店铺身份或时间无效");
 if(snapshot.rows.some(r=>!r.platformProductId||!r.name||!r.sku||!r.platformStatus||!["merchant","shuomi","unknown"].includes(r.origin)))throw Error("平台商品数据不完整");
 localStorage.setItem(key(snapshot.organizationId,snapshot.storeId),JSON.stringify(snapshot));
 window.dispatchEvent(new CustomEvent("shuomi:store-product-snapshot-updated",{detail:{organizationId:snapshot.organizationId,storeId:snapshot.storeId}}));
}
