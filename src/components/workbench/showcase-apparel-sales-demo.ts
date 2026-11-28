/** GitHub-backed simulation only: no real platform authorization, orders or receipts. */
import {selectedCatalogFixtures} from "./showcase-selected-catalog-fixtures";
import {readDemoStoreBindings,demoStoreServiceActive} from "./store-binding-demo";
export const apparelDemoBatchId="SIM-SHUOMI-APPAREL-20261128";
export const apparelDemoBatchName="硕米优选 · 服装采集测试批次";
export const apparelDemoTime="2026-11-28T13:42:00Z";
export const apparelDemoPlans=[
 {productId:"SMYX-DEMO-001",storeId:"SIM-ADMIN-01",region:"美国站",price:"US$19.99",stages:[0,0,1,1,2,3,3,4]},
 {productId:"SMYX-DEMO-002",storeId:"SIM-ADMIN-03",region:"英国站",price:"£29.99",stages:[0,1,2,3]}
] as const;
export function apparelDemoEntries(org:string,member="admin"){
 if(typeof window==="undefined"||org!=="SM-ENT-000001"||member!=="admin")return [];
 return apparelDemoPlans.flatMap(plan=>{
  const store=readDemoStoreBindings(org).find(s=>s.id===plan.storeId&&s.ownerMemberId===member&&s.region===plan.region&&s.platformStoreId==="SIM-SHEIN-ADMIN-"+s.id.slice(-2)&&!s.archived&&!s.connectionIssue&&s.platformIdStatus!=="获取失败"&&demoStoreServiceActive(s));
  const product=selectedCatalogFixtures.find(p=>p.id===plan.productId);
  if(!store||!product||!product.skus.length||!product.skus.every(s=>s.images?.length===4)||!product.shipToCountries?.includes(plan.region==="美国站"?"美国":"英国"))return [];
  const taskId="SIM-LIST-APPAREL-"+product.id;
  return [{plan,store,product,taskId,platformProductId:store.platformStoreId+"-"+product.id,receiptId:"SIM-RECEIPT-"+taskId}];
 });
}
