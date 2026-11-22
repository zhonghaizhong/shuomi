"use client";
import {useCallback,useEffect,useState} from "react";
import {showcaseTenant as tenant} from "@/components/workbench/account/showcase-tenant";

export type DemoOrganization={id:string;name:string};
export type DemoIdentity={organizationId:string;memberId:string};
const KEY="shuomi-showcase-active-identity-v1";
const ORGS="shuomi-showcase-organizations-v1";
export const initialIdentity:DemoIdentity={organizationId:tenant.id,memberId:"admin"};
const primary:DemoOrganization={id:tenant.id,name:tenant.name};
const safeOrgs=(items:unknown):DemoOrganization[]=>{
 const extra=Array.isArray(items)?items.filter((o):o is DemoOrganization=>!!o&&typeof o.id==="string"&&o.id.startsWith("SIM-ORG-")&&typeof o.name==="string"&&o.name.trim().length>0).slice(0,8):[];
 return [primary,...extra];
};
export function useDemoIdentity(){
 const [identity,setIdentity]=useState<DemoIdentity>(initialIdentity);
 const [organizations,setOrganizations]=useState<DemoOrganization[]>([primary]);
 useEffect(()=>{
  try{
   const orgs=safeOrgs(JSON.parse(localStorage.getItem(ORGS)||"null"));
   const selected=JSON.parse(sessionStorage.getItem(KEY)||"null") as Partial<DemoIdentity>|null;
   setOrganizations(orgs);
   if(selected&&orgs.some(o=>o.id===selected.organizationId)&&typeof selected.memberId==="string"){
    setIdentity({organizationId:selected.organizationId!,memberId:selected.organizationId===tenant.id?selected.memberId:"admin"});
   }
  }catch{/* Use the real primary demo context as the safe default. */}
 },[]);
 const switchIdentity=useCallback((next:DemoIdentity)=>{
  const selected=next.organizationId===tenant.id?next:{organizationId:next.organizationId,memberId:"admin"};
  setIdentity(selected);
  try{sessionStorage.setItem(KEY,JSON.stringify(selected))}catch{}
 },[]);
 const addOrganization=useCallback((name:string)=>{
  const label=name.trim().slice(0,60);
  if(!label||organizations.some(o=>o.name===label)||organizations.length>=9)return false;
  const org={id:"SIM-ORG-"+crypto.randomUUID(),name:label};
  const next=[...organizations,org];
  try{localStorage.setItem(ORGS,JSON.stringify(next))}catch{return false}
  setOrganizations(next);return true;
 },[organizations]);
 return {identity,organizations,switchIdentity,addOrganization};
}
