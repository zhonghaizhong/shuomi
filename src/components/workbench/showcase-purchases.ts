"use client";
import {useEffect,useState} from "react";
import {plansDemoFacts,plansDemoRates} from "./plans-demo-facts";

/** Shared ledger for the single configured showcase tenant. Not a real payment system. */
export const DEMO_PURCHASES_KEY="shuomi-showcase-plans-direct-purchases-v1";
export const DEMO_PURCHASES_EVENT="shuomi-demo-purchases-changed";
export type DemoPurchase={id:string;at:string;type:string;quantity:number;amountCny:number;detail:string;balanceAfter:number;status:"模拟购买成功"|"模拟充值成功"};
export function readDemoPurchases():DemoPurchase[]{
 if(typeof window==="undefined")return [];
 try{
  const raw=JSON.parse(window.localStorage.getItem(DEMO_PURCHASES_KEY)||"[]");
  return Array.isArray(raw)?raw.filter((x):x is DemoPurchase=>Boolean(x)&&typeof x.id==="string"&&typeof x.type==="string"&&Number.isFinite(x.amountCny)&&Number.isFinite(x.quantity)&&x.quantity>0&&Number.isFinite(x.balanceAfter)).slice(0,200):[];
 }catch{return []}
}
export function writeDemoPurchases(purchases:DemoPurchase[]):boolean{
 try{
  window.localStorage.setItem(DEMO_PURCHASES_KEY,JSON.stringify(purchases.slice(0,200)));
  window.dispatchEvent(new Event(DEMO_PURCHASES_EVENT));
  return true;
 }catch{return false}
}
export function demoResourceTotals(purchases:readonly DemoPurchase[]){
 const purchased=(name:string)=>purchases.filter(p=>p.type===name&&p.status==="模拟购买成功").reduce((total,p)=>total+p.quantity,0);
 const money=(name:string)=>purchased(name);
 return {
  renewalPeriods:plansDemoFacts.renewalPeriods+purchased("店铺服务"),
  aiPoints:plansDemoFacts.aiPoints+Math.round(money("token 积分")*plansDemoRates.aiPointsPerCny),
  dataRows:plansDemoFacts.dataRows+Math.round(money("数据资源")/plansDemoRates.dataCnyPerRow),
  storageGiB:plansDemoFacts.storageCapacityGiB+purchased("企业存储")
 };
}
export function useDemoPurchases(){
 const [purchases,setPurchases]=useState<DemoPurchase[]>([]);
 useEffect(()=>{
  const refresh=()=>setPurchases(readDemoPurchases());
  refresh();
  const onStorage=(event:StorageEvent)=>{if(event.key===DEMO_PURCHASES_KEY)refresh()};
  window.addEventListener("storage",onStorage);
  window.addEventListener(DEMO_PURCHASES_EVENT,refresh);
  return()=>{window.removeEventListener("storage",onStorage);window.removeEventListener(DEMO_PURCHASES_EVENT,refresh)};
 },[]);
 return {purchases,setPurchases,totals:demoResourceTotals(purchases)};
}
