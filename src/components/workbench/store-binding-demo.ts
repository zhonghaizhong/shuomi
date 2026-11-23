"use client";
import {useEffect,useState} from "react";

// Shared showcase-only store register. Binding is not platform authorization or a paid subscription.
// demoPassword is a clearly synthetic fixture value, never a production credential.
export type DemoStoreBinding={id:string;name:string;platform:"SHEIN";region:string;type:string;status:"已绑定";createdAt:string;group?:string;owner?:string;ownerMemberId:string;serviceStartedAt?:string;serviceExpiresAt?:string;servicePeriods?:number;platformStoreId?:string;bindingAccount?:string;demoPassword?:string;authorizationMethod?:string;fixedIpPreference?:boolean;proxyIpAddress?:string;proxyIpPort?:string;proxyIpUser?:string;platformIdStatus?:"已激活"|"获取失败";connectionIssue?:"授权失效"|"连接失败"|"平台接口异常";archived?:boolean};
const prefix="shuomi-store-center-demo-ten-v2";
const eventName="shuomi-demo-store-bindings-changed";
const mainTenant="SM-ENT-000001";
const colleague="SIM-COLLEAGUE-01";
const sites=["美国站","加拿大站","英国站","德国站","法国站"];
const historicalStart="2026-11-22T07:19:00.000Z";
const historicalExpiry="2026-12-22T07:19:00.000Z";
const demoCredentials=(id:string)=>({bindingAccount:"demo_"+id.toLowerCase().replace(/[^a-z0-9]/g,"_"),demoPassword:"DEMO_ONLY_"+id.replace(/[^A-Z0-9]/gi,"_")});
const isSeededStore=(id:string)=>/^SIM-(?:ADMIN-0[1-5]|C01-0[1-5]|ADMIN-EXPIRED-01|C01-EXPIRED-01)$/.test(id);
const expiredDemoStores:DemoStoreBinding[]=[
 {id:"SIM-ADMIN-EXPIRED-01",name:"管理员已到期测试店铺",platform:"SHEIN",region:"美国站",type:"全托管",status:"已绑定",createdAt:"2026-10-01 10:00",group:"未分组",owner:"管理员",ownerMemberId:"admin",serviceStartedAt:"2026-10-01T00:00:00.000Z",serviceExpiresAt:"2026-10-31T00:00:00.000Z",servicePeriods:1,platformStoreId:"SIM-SHEIN-ADMIN-EXPIRED-01"},
 {id:"SIM-C01-EXPIRED-01",name:"同事01已到期测试店铺",platform:"SHEIN",region:"英国站",type:"半托管",status:"已绑定",createdAt:"2026-10-01 10:00",group:"未分组",owner:"模拟同事01",ownerMemberId:colleague,serviceStartedAt:"2026-10-01T00:00:00.000Z",serviceExpiresAt:"2026-10-31T00:00:00.000Z",servicePeriods:1,platformStoreId:"SIM-SHEIN-C01-EXPIRED-01"}
];
export const demoStoreKey=(organizationId:string)=>prefix+"-"+organizationId;
export const DEMO_STORE_PERIOD_DAYS=30;
const periodMs=DEMO_STORE_PERIOD_DAYS*24*60*60*1000;
export function demoStoreServiceActive(store:DemoStoreBinding,now=Date.now()):boolean{
 return typeof store.serviceExpiresAt==="string"&&Number.isFinite(Date.parse(store.serviceExpiresAt))&&Date.parse(store.serviceExpiresAt)>now;
}
export function countConsumedStorePeriods(stores:readonly DemoStoreBinding[]):number{
 return stores.reduce((total,s)=>total+(Number.isSafeInteger(s.servicePeriods)&&Number(s.servicePeriods)>0?Number(s.servicePeriods):0),0);
}
/** Four successful colleague fixture bindings were paid before this demo ledger existed.
 * Their first period belongs to historical paid service, not the newly purchased
 * enterprise period pool. Later renewals on these stores do consume the pool.
 * Ordinary bindings, including expired fixtures and new stores, consume normally.
 */
export function countPoolConsumedStorePeriods(stores:readonly DemoStoreBinding[]):number{
 return stores.reduce((total,store)=>{
  const periods=Number.isSafeInteger(store.servicePeriods)&&Number(store.servicePeriods)>0?Number(store.servicePeriods):0;
  const previouslyPaid=Boolean(store.platformStoreId)&&(/^SIM-C01-0[1-4]$/.test(store.id)||/^SIM-ADMIN-0[1-5]$/.test(store.id));
  return total+Math.max(0,periods-(previouslyPaid?1:0));
 },0);
}
export function startDemoStoreService(store:DemoStoreBinding,now=Date.now()):DemoStoreBinding{
 const wasActive=demoStoreServiceActive(store,now);
 const end=wasActive?Date.parse(store.serviceExpiresAt!):now;
 return {...store,serviceStartedAt:wasActive?(store.serviceStartedAt||new Date(now).toISOString()):new Date(now).toISOString(),serviceExpiresAt:new Date(end+periodMs).toISOString(),servicePeriods:(store.servicePeriods||0)+1};
}

function seeds(organizationId:string):DemoStoreBinding[]{
 if(organizationId!==mainTenant)return [];
 return [...["admin",colleague].flatMap(memberId=>sites.map((region,index)=>({
  ...demoCredentials((memberId==="admin"?"SIM-ADMIN-":"SIM-C01-")+String(index+1).padStart(2,"0")),
  id:(memberId==="admin"?"SIM-ADMIN-":"SIM-C01-")+String(index+1).padStart(2,"0"),
  name:(memberId==="admin"?"管理员演示店铺":"同事01演示店铺")+String(index+1).padStart(2,"0"),
  platform:"SHEIN" as const,region,type:["全托管","半托管","自营","全托管","半托管"][index],
  status:"已绑定" as const,createdAt:"2026-11-22 15:19",group:"未分组",
  owner:memberId==="admin"?"管理员":"模拟同事01",ownerMemberId:memberId,
  ...(memberId===colleague?index===4?{platformIdStatus:"获取失败" as const,archived:true}:{platformIdStatus:"已激活" as const,platformStoreId:"SIM-SHEIN-C01-"+String(index+1).padStart(2,"0"),serviceStartedAt:historicalStart,serviceExpiresAt:historicalExpiry,servicePeriods:1}:{platformIdStatus:"已激活" as const,platformStoreId:"SIM-SHEIN-ADMIN-"+String(index+1).padStart(2,"0"),serviceStartedAt:historicalStart,serviceExpiresAt:historicalExpiry,servicePeriods:1,...(index===3?{connectionIssue:"平台接口异常" as const}:index===4?{connectionIssue:"授权失效" as const}:{})})
 }))),...expiredDemoStores].map(s=>({...demoCredentials(s.id),...s})).map(s=>s.id==="SIM-ADMIN-01"?{...s,serviceExpiresAt:new Date(Date.now()+5*periodMs/30).toISOString()}:s.id==="SIM-C01-01"?{...s,serviceExpiresAt:new Date(Date.now()+6*periodMs/30).toISOString()}:s);
}
export function readDemoStoreBindings(organizationId:string):DemoStoreBinding[]{
 try{
  const raw=sessionStorage.getItem(demoStoreKey(organizationId));
  if(raw===null){if(organizationId===mainTenant){sessionStorage.setItem(demoStoreKey(organizationId)+"-admin-status-v1","1");sessionStorage.setItem(demoStoreKey(organizationId)+"-expired-fixture-v1","1");sessionStorage.setItem(demoStoreKey(organizationId)+"-expiring-v1","1");}return seeds(organizationId);}
  const parsed:unknown=JSON.parse(raw);
  if(!Array.isArray(parsed))return [];
  const valid=(parsed as DemoStoreBinding[]).filter((x:DemoStoreBinding)=>x&&typeof x.id==="string"&&typeof x.name==="string"&&x.platform==="SHEIN"&&(x.status==="已绑定"||String(x.status)==="待授权")&&typeof x.ownerMemberId==="string");
  // Only update the five known synthetic colleague fixtures; never invent platform IDs for real bindings.
  // A preexisting explicit activation state (including retry success) must be preserved.
  const migrated=organizationId===mainTenant?valid.map(store=>{
   if(isSeededStore(store.id)&&(!store.bindingAccount||!store.demoPassword))store={...store,bindingAccount:store.bindingAccount||demoCredentials(store.id).bindingAccount,demoPassword:store.demoPassword||demoCredentials(store.id).demoPassword};
   // Only backfill synthetic IDs for the known, already paid historical test fixtures.
   if(store.id==="SIM-ADMIN-EXPIRED-01"&&!store.platformStoreId)return {...store,platformStoreId:"SIM-SHEIN-ADMIN-EXPIRED-01"};
   if(store.id==="SIM-C01-EXPIRED-01"&&!store.platformStoreId)return {...store,platformStoreId:"SIM-SHEIN-C01-EXPIRED-01"};
   // A failed ID lookup is a failed binding attempt, never an active bound store.
   if(store.id==="SIM-C01-05"&&(!store.servicePeriods||store.platformIdStatus==="获取失败"))return {...store,platformIdStatus:"获取失败" as const,platformStoreId:undefined,archived:true};
   // Legacy fixture bindings already succeeded; preserve the historical charge rather than charging when allocations are added later.
   if(/^SIM-C01-0[1-4]$/.test(store.id)&&store.platformStoreId&&!Number(store.servicePeriods))return {...store,serviceStartedAt:historicalStart,serviceExpiresAt:historicalExpiry,servicePeriods:1};
   const match=/^SIM-C01-0([1-5])$/.exec(store.id);
   if(!match||store.platformIdStatus)return store;
   const index=Number(match[1]);
   return index===5?{...store,platformIdStatus:"获取失败" as const,archived:true}:{...store,platformIdStatus:"已激活" as const,platformStoreId:"SIM-SHEIN-C01-"+String(index).padStart(2,"0"),serviceStartedAt:historicalStart,serviceExpiresAt:historicalExpiry,servicePeriods:1};
  }):valid;
  // One-time update for the five administrator demo fixtures, never user-created stores.
  // Keep older sessions consistent with the agreed three normal / two connection-fault examples.
  const adminKey=demoStoreKey(organizationId)+"-admin-status-v1";
  if(organizationId===mainTenant&&!sessionStorage.getItem(adminKey)){
   const revised=migrated.map(s=>{
    const m=/^SIM-ADMIN-0([1-5])$/.exec(s.id);
    if(!m||s.ownerMemberId!=="admin")return s;
    const index=Number(m[1]);
    return {...s,platformIdStatus:"已激活" as const,platformStoreId:s.platformStoreId||"SIM-SHEIN-ADMIN-"+m[1].padStart(2,"0"),serviceStartedAt:s.serviceStartedAt||historicalStart,serviceExpiresAt:s.serviceExpiresAt&&Date.parse(s.serviceExpiresAt)>Date.parse(historicalStart)?s.serviceExpiresAt:historicalExpiry,servicePeriods:Math.max(1,s.servicePeriods||0),connectionIssue:index===4?"平台接口异常" as const:index===5?"授权失效" as const:undefined};
   });
   sessionStorage.setItem(adminKey,"1");
   sessionStorage.setItem(demoStoreKey(organizationId),JSON.stringify(revised));
   // Existing expired fixture migration below remains additive.
   migrated.splice(0,migrated.length,...revised);
  }
  // One-time migration of two existing, paid, healthy demo shops into the last seven days.
  // Never repeat after renewal, deletion or manual edits.
  const expiringKey=demoStoreKey(organizationId)+"-expiring-v1";
  if(organizationId===mainTenant&&!sessionStorage.getItem(expiringKey)){
   const revised=migrated.map(s=>{
    const offset=s.id==="SIM-ADMIN-01"?5:s.id==="SIM-C01-01"?6:0;
    return offset&&s.platformStoreId&&s.servicePeriods&&!s.connectionIssue&&!s.archived
      ?{...s,serviceExpiresAt:new Date(Date.now()+offset*86400000).toISOString()}:s;
   });
   migrated.splice(0,migrated.length,...revised);
   sessionStorage.setItem(expiringKey,"1");
   sessionStorage.setItem(demoStoreKey(organizationId),JSON.stringify(revised));
  }
  // One-time additive migration for existing browser sessions; never recreate stores after a user removes them.
  const migrationKey=demoStoreKey(organizationId)+"-expired-fixture-v1";
  if(organizationId===mainTenant&&!sessionStorage.getItem(migrationKey)){
   const ids=new Set(migrated.map(x=>x.id));
   const updated=[...migrated,...expiredDemoStores.filter(x=>!ids.has(x.id)).map(x=>({...demoCredentials(x.id),...x}))];
   sessionStorage.setItem(demoStoreKey(organizationId),JSON.stringify(updated));
   sessionStorage.setItem(migrationKey,"1");
   return updated.map(x=>({...x,status:"已绑定"}));
  }
  if(migrated.some((store,index)=>store!==valid[index]))sessionStorage.setItem(demoStoreKey(organizationId),JSON.stringify(migrated));
  return migrated.map(x=>({...x,status:"已绑定"}));
 }catch{return seeds(organizationId);}
}
export function saveDemoStoreBindings(organizationId:string,items:DemoStoreBinding[]):boolean{
 try{
  sessionStorage.setItem(demoStoreKey(organizationId),JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(eventName,{detail:organizationId}));
  return true;
 }catch{return false;}
}
export function useDemoStoreBindings(organizationId:string,memberId="admin",isAdministrator=memberId==="admin"){
 const [all,setAll]=useState<DemoStoreBinding[]>(()=>readDemoStoreBindings(organizationId));
 useEffect(()=>{
  const refresh=()=>setAll(readDemoStoreBindings(organizationId));
  const onChange=(event:Event)=>{if((event as CustomEvent<string>).detail===organizationId)refresh();};
  window.addEventListener(eventName,onChange);
  window.addEventListener("pageshow",refresh);
  window.addEventListener("focus",refresh);
  refresh();
  return ()=>{window.removeEventListener(eventName,onChange);window.removeEventListener("pageshow",refresh);window.removeEventListener("focus",refresh);};
 },[organizationId]);
 const current=all.filter(item=>!item.archived);
 const visible=isAdministrator?current:current.filter(item=>item.ownerMemberId===memberId);
 return {all,visible,organizationCount:current.length,memberCount:current.filter(item=>item.ownerMemberId===memberId).length,visibleCount:visible.length,authorizedCount:current.length,pendingCount:0};
}
