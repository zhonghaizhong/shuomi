"use client";
import {useEffect,useState} from "react";
import {plansDemoFacts,plansDemoRates} from "./plans-demo-facts";

/** Shared ledger for the single configured showcase tenant. Not a real payment system. */
export const DEMO_PURCHASES_KEY="shuomi-showcase-plans-direct-purchases-v1";
export const DEMO_PURCHASES_EVENT="shuomi-demo-purchases-changed";
export const PRIMARY_DEMO_ORG="SM-ENT-000001";
export function demoPurchaseKey(organizationId=PRIMARY_DEMO_ORG){return organizationId===PRIMARY_DEMO_ORG?DEMO_PURCHASES_KEY:DEMO_PURCHASES_KEY+"-"+organizationId;}
export type DemoPurchase={id:string;at:string;type:string;quantity:number;amountCny:number;detail:string;balanceAfter:number;status:"模拟购买成功"|"模拟充值成功"};
export function readDemoPurchases(organizationId=PRIMARY_DEMO_ORG):DemoPurchase[]{
 if(typeof window==="undefined")return [];
 try{
  const raw=JSON.parse(window.localStorage.getItem(demoPurchaseKey(organizationId))||"[]");
  return Array.isArray(raw)?raw.filter((x):x is DemoPurchase=>Boolean(x)&&typeof x.id==="string"&&typeof x.type==="string"&&Number.isFinite(x.amountCny)&&Number.isFinite(x.quantity)&&x.quantity>0&&Number.isFinite(x.balanceAfter)).slice(0,200):[];
 }catch{return []}
}
export function writeDemoPurchases(purchases:DemoPurchase[],organizationId=PRIMARY_DEMO_ORG):boolean{
 try{
  window.localStorage.setItem(demoPurchaseKey(organizationId),JSON.stringify(purchases.slice(0,200)));
  window.dispatchEvent(new CustomEvent(DEMO_PURCHASES_EVENT,{detail:organizationId}));
  return true;
 }catch{return false}
}
export function demoResourceTotals(purchases:readonly DemoPurchase[],organizationId=PRIMARY_DEMO_ORG){
 const primary=organizationId===PRIMARY_DEMO_ORG;
 const purchased=(name:string)=>purchases.filter(p=>p.type===name&&p.status==="模拟购买成功").reduce((total,p)=>total+p.quantity,0);
 const money=(name:string)=>purchased(name);
 return {
  renewalPeriods:(primary?plansDemoFacts.renewalPeriods:0)+purchased("店铺服务"),
  aiPoints:(primary?plansDemoFacts.aiPoints:0)+Math.round(money("token 积分")*plansDemoRates.aiPointsPerCny),
  dataRows:(primary?plansDemoFacts.dataRows:0)+Math.round(money("数据资源")/plansDemoRates.dataCnyPerRow),
  storageGiB:(primary?plansDemoFacts.storageCapacityGiB:5)+purchased("企业存储")
 };
}
export function useDemoPurchases(organizationId=PRIMARY_DEMO_ORG){
 const [purchases,setPurchases]=useState<DemoPurchase[]>([]);
 useEffect(()=>{
  const refresh=()=>setPurchases(readDemoPurchases(organizationId));
  refresh();
  const onStorage=(event:StorageEvent)=>{if(event.key===demoPurchaseKey(organizationId))refresh()};
  window.addEventListener("storage",onStorage);
  const onChange=(event:Event)=>{if((event as CustomEvent<string>).detail===organizationId)refresh()};
  window.addEventListener(DEMO_PURCHASES_EVENT,onChange);
  return()=>{window.removeEventListener("storage",onStorage);window.removeEventListener(DEMO_PURCHASES_EVENT,onChange)};
 },[organizationId]);
 return {purchases,setPurchases,totals:demoResourceTotals(purchases,organizationId)};
}
