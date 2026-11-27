"use client";
import {readShowcaseUploadTasks,persistShowcaseUploadTaskRecords,showcaseUploadTasksEvent} from "../listing/showcase-upload-tasks";
import {listingDemoArtSet} from "../listing/showcase-listing-ai-images";

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
 demoUploadTaskId?:string;
 demoReceiptId?:string;
};
export type StoreProductSnapshot={
 organizationId:string;
 storeId:string;
 platformStoreId:string;
 syncedAt:string;
 rows:StoreProductSnapshotRow[];
 simulated?:true;
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
  return {organizationId:org,storeId:store,platformStoreId,syncedAt:v.syncedAt,rows,...(v.simulated===true?{simulated:true as const}:{})};
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

/** Two explicitly synthetic marketplace results, scoped to the existing approved and published Kindle task.
 * No external receipt is created or claimed; the simulated receipt is matched by task/store ID.
 * No other product or shop is seeded. Existing successful snapshots are not overwritten on load.
 */
export function buildAdminStoreSyncDemo(org:string,store:string,platformStoreId:string):StoreProductSnapshot|null{
 if(org!=="SM-ENT-000001")return null;
 if(["SIM-ADMIN-02","SIM-ADMIN-03"].includes(store)&&platformStoreId==="SIM-SHEIN-ADMIN-"+store.slice(-2)){
 const second=store.endsWith("02"),base=typeof window!=="undefined"&&window.location.pathname.startsWith("/shuomi")?"/shuomi":"";
 return {organizationId:org,storeId:store,platformStoreId,syncedAt:"2026-11-27T08:00:00Z",simulated:true,rows:[{platformProductId:platformStoreId+"-MERCHANT-0001",sku:second?"CA-CLOG-BLK":"UK-CLOG-NAVY",name:second?"Black Classic Clogs":"Navy Classic Clogs",imageUrl:base+"/assets/store-sync-demo/"+(second?"merchant-ca-clogs.jpg":"merchant-uk-clogs.jpg"),platformStatus:"模拟已上架",price:second?"CA$39.99":"£29.99",stock:second?48:3,origin:"merchant"}]};
 }
 if(store!=="SIM-ADMIN-01"||platformStoreId!=="SIM-SHEIN-ADMIN-01")return null;
 const task=readShowcaseUploadTasks(org,"admin").find(t=>t.storeId===store&&t.id.startsWith("SHUOMI-AMZ-AI-5:")&&t.id.endsWith(":B0CFPJYX7P")&&t.productIds.length===1&&t.status==="模拟已提交"&&t.demoSubmission?.storeId===store&&t.demoSubmission.externalReceiptId===null&&(t.demoSubmission.listingStatus==="已上架"||t.demoSubmission.listingStatus==="已下架")&&t.demoSubmission.simulatedPlatformProductId&&t.demoSubmission.simulatedReceiptId&&t.demoProduct);
 if(!task?.demoProduct||!task.demoSubmission)return null;
 const base=typeof window!=="undefined"&&window.location.pathname.startsWith("/shuomi")?"/shuomi":"";
 const photo=task.imageEdits?.default?.main?.[0]||task.demoProduct.optimizedImages[0];
 const imageUrl=photo&&/^(https?:\/\/|\/)/.test(photo)?photo:listingDemoArtSet("ereader")[0];
 const simulatedReceipt={storeId:task.storeId,platformProductId:task.demoSubmission.simulatedPlatformProductId!,taskId:task.id,id:task.demoSubmission.simulatedReceiptId!};
 const platformRows:StoreProductSnapshotRow[]=[
  {platformProductId:simulatedReceipt.platformProductId,sku:"B0CFPJYX7P",name:task.textEdits?.title||task.demoProduct.optimizedName,imageUrl,platformStatus:task.demoSubmission.listingStatus==="已下架"?"模拟已下架":"模拟已上架",price:"US$129.99",stock:36,origin:"unknown"},
  {platformProductId:"SIM-SHEIN-ADMIN-01-MERCHANT-0001",sku:"MERCHANT-TEE-BLK-M",name:"Classic Black Cotton Crew Neck T-Shirt",imageUrl:base+"/assets/store-sync-demo/merchant-black-cotton-tee.webp",platformStatus:"模拟已上架",price:"US$12.99",stock:143,origin:"unknown"}
 ];
 return {organizationId:org,storeId:store,platformStoreId,syncedAt:task.demoSubmission.publishedAt||task.demoSubmission.submittedAt,simulated:true,rows:platformRows.map(row=>row.platformProductId===simulatedReceipt.platformProductId&&simulatedReceipt.storeId===store?{...row,origin:"shuomi",demoUploadTaskId:simulatedReceipt.taskId,demoReceiptId:simulatedReceipt.id}:{...row,origin:"merchant"})};
}

/** Explicit local demo action; keep the last sync timestamp and all unrelated rows. */
export function saveSimulatedStoreDelisting(snapshot:StoreProductSnapshot,ids:string[]):void{
 if(snapshot.simulated!==true)throw Error("真实平台下架接口未接入");
 const current=readStoreProductSnapshot(snapshot.organizationId,snapshot.storeId,snapshot.platformStoreId)??snapshot;
 if(current.simulated!==true)throw Error("不能修改真实快照");
 const targets=new Set(ids);
 const rows=current.rows.map(r=>targets.has(r.platformProductId)&&r.platformStatus==="模拟已上架"?{...r,platformStatus:"模拟已下架"}:r);
 saveVerifiedStoreProductSnapshot({...current,rows});
 const tasks=readShowcaseUploadTasks(snapshot.organizationId,"admin");
 const taskIds=new Set(rows.filter(r=>targets.has(r.platformProductId)&&r.platformStatus==="模拟已下架"&&r.demoUploadTaskId).map(r=>r.demoUploadTaskId));
 if(snapshot.organizationId==="SM-ENT-000001"&&snapshot.storeId==="SIM-ADMIN-01"&&taskIds.size){
 const next=tasks.map(t=>taskIds.has(t.id)&&t.storeId===snapshot.storeId&&t.demoSubmission?.listingStatus==="已上架"?{...t,demoSubmission:{...t.demoSubmission,listingStatus:"已下架" as const}}:t);
 persistShowcaseUploadTaskRecords(snapshot.organizationId,"admin",next);
 window.dispatchEvent(new CustomEvent(showcaseUploadTasksEvent,{detail:{organizationId:snapshot.organizationId,memberId:"admin"}}));
 }
}
