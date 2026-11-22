"use client";
import {useCallback,useEffect,useState} from "react";
import {showcaseTenant as tenant} from "@/components/workbench/account/showcase-tenant";

export type DemoOrganization={id:string;name:string};
export type DemoIdentity={organizationId:string;memberId:string};
export type DemoMembership={organizationId:string;memberId:string;name:string;email:string;role:"管理员"|"子账号"};
export const colleagueId="SIM-COLLEAGUE-01";
export const demoOtherOrganizations:DemoOrganization[]=[
 {id:"SIM-ORG-COLLEAGUE-ADMIN",name:"模拟企业A（运营公司）"},
 {id:"SIM-ORG-COLLEAGUE-MEMBER",name:"模拟企业B（供应链公司）"}
];
export const colleagueOtherMemberships:DemoMembership[]=[
 {organizationId:demoOtherOrganizations[0].id,memberId:colleagueId,name:"模拟同事01",email:"colleague01@example.test",role:"管理员"},
 {organizationId:demoOtherOrganizations[1].id,memberId:colleagueId,name:"模拟同事01",email:"colleague01@example.test",role:"子账号"}
];
const KEY="shuomi-showcase-active-identity-v1";
const ORGS="shuomi-showcase-organizations-v1";
export const initialIdentity:DemoIdentity={organizationId:tenant.id,memberId:"admin"};
const primary:DemoOrganization={id:tenant.id,name:tenant.name};
const validMembership=(identity:DemoIdentity)=>identity.organizationId===tenant.id||colleagueOtherMemberships.some(m=>m.organizationId===identity.organizationId&&m.memberId===identity.memberId);
export function getDemoMembership(identity:DemoIdentity):DemoMembership|null{
 return colleagueOtherMemberships.find(m=>m.organizationId===identity.organizationId&&m.memberId===identity.memberId)||null;
}
const safeOrgs=(items:unknown):DemoOrganization[]=>{
 const extra=Array.isArray(items)?items.filter((o):o is DemoOrganization=>!!o&&typeof o.id==="string"&&o.id.startsWith("SIM-ORG-")&&typeof o.name==="string"&&o.name.trim().length>0).slice(0,8):[];
 return [primary,...demoOtherOrganizations,...extra.filter(o=>!demoOtherOrganizations.some(d=>d.id===o.id))];
};
export function useDemoIdentity(){
 const [identity,setIdentity]=useState<DemoIdentity>(initialIdentity);
 const [organizations,setOrganizations]=useState<DemoOrganization[]>(safeOrgs(null));
 useEffect(()=>{
  try{
   const orgs=safeOrgs(JSON.parse(localStorage.getItem(ORGS)||"null"));
   const selected=JSON.parse(sessionStorage.getItem(KEY)||"null") as Partial<DemoIdentity>|null;
   setOrganizations(orgs);
   if(selected&&typeof selected.organizationId==="string"&&typeof selected.memberId==="string"
    &&orgs.some(o=>o.id===selected.organizationId)
    &&validMembership({organizationId:selected.organizationId,memberId:selected.memberId})){
    setIdentity({organizationId:selected.organizationId,memberId:selected.memberId});
   }
  }catch{/* Keep the built-in demo identity. */}
 },[]);
 const switchIdentity=useCallback((next:DemoIdentity)=>{
  if(!validMembership(next))return;
  setIdentity(next);
  try{sessionStorage.setItem(KEY,JSON.stringify(next))}catch{}
 },[]);
 return {identity,organizations,switchIdentity};
}
