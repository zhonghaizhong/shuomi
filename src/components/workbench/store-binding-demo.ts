"use client";
import {useEffect,useState} from "react";

// Shared showcase-only store register. Binding is not platform authorization or a paid subscription.
export type DemoStoreBinding={id:string;name:string;platform:"SHEIN";region:string;type:string;status:"待授权";createdAt:string;group?:string;owner?:string;ownerMemberId:string;serviceStartedAt?:string;serviceExpiresAt?:string;servicePeriods?:number;archived?:boolean};
const prefix="shuomi-store-center-demo-ten-v2";
const eventName="shuomi-demo-store-bindings-changed";
const mainTenant="SM-ENT-000001";
const colleague="SIM-COLLEAGUE-01";
const sites=["美国站","加拿大站","英国站","德国站","法国站"];
export const demoStoreKey=(organizationId:string)=>prefix+"-"+organizationId;
export const DEMO_STORE_PERIOD_DAYS=30;
const periodMs=DEMO_STORE_PERIOD_DAYS*24*60*60*1000;
export function demoStoreServiceActive(store:DemoStoreBinding,now=Date.now()):boolean{
 return typeof store.serviceExpiresAt==="string"&&Number.isFinite(Date.parse(store.serviceExpiresAt))&&Date.parse(store.serviceExpiresAt)>now;
}
export function countConsumedStorePeriods(stores:readonly DemoStoreBinding[]):number{
 return stores.reduce((total,s)=>total+(Number.isSafeInteger(s.servicePeriods)&&Number(s.servicePeriods)>0?Number(s.servicePeriods):0),0);
}
export function startDemoStoreService(store:DemoStoreBinding,now=Date.now()):DemoStoreBinding{
 const wasActive=demoStoreServiceActive(store,now);
 const end=wasActive?Date.parse(store.serviceExpiresAt!):now;
 return {...store,serviceStartedAt:wasActive?(store.serviceStartedAt||new Date(now).toISOString()):new Date(now).toISOString(),serviceExpiresAt:new Date(end+periodMs).toISOString(),servicePeriods:(store.servicePeriods||0)+1};
}

function seeds(organizationId:string):DemoStoreBinding[]{
 if(organizationId!==mainTenant)return [];
 return ["admin",colleague].flatMap(memberId=>sites.map((region,index)=>({
  id:(memberId==="admin"?"SIM-ADMIN-":"SIM-C01-")+String(index+1).padStart(2,"0"),
  name:(memberId==="admin"?"管理员演示店铺":"同事01演示店铺")+String(index+1).padStart(2,"0"),
  platform:"SHEIN" as const,region,type:["全托管","半托管","自营","全托管","半托管"][index],
  status:"待授权" as const,createdAt:"2026-11-22 15:19",group:"未分组",
  owner:memberId==="admin"?"管理员":"模拟同事01",ownerMemberId:memberId
 })));
}
export function readDemoStoreBindings(organizationId:string):DemoStoreBinding[]{
 try{
  const raw=sessionStorage.getItem(demoStoreKey(organizationId));
  if(raw===null)return seeds(organizationId);
  const parsed:unknown=JSON.parse(raw);
  if(!Array.isArray(parsed))return [];
  return (parsed as DemoStoreBinding[]).filter((x:DemoStoreBinding)=>x&&typeof x.id==="string"&&typeof x.name==="string"&&x.platform==="SHEIN"&&x.status==="待授权"&&typeof x.ownerMemberId==="string");
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
 return {all,visible,organizationCount:current.length,memberCount:current.filter(item=>item.ownerMemberId===memberId).length,visibleCount:visible.length,authorizedCount:0,pendingCount:current.length};
}
