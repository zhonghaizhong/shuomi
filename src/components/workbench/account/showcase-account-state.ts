"use client";
import {useEffect,useState} from "react";
import {showcaseTenant as tenant} from "./showcase-tenant";
import {resetLegacyAccountDemoOnce} from "./showcase-data-reset";
import {consoleNavigation, type ConsoleNavNode} from "@/lib/workbench/console-navigation";

export type Member={id:string;name:string;email:string;role:string;status:"正常"|"已停用";joined:number};
export type AccountEvent={id:string;at:number;actor:string;category:string;message:string};
export type ReferralItem={id:string;at:number;referred:string;amount:number;status:"已结算"|"已提现"};
export type Withdrawal={id:string;at:number;amount:number;account:string;status:"模拟审核通过"};
// Role permissions in Showcase mirror the actual sidebar. They are local demo
// settings, not authoritative server authorization grants.
export const permissionTree:readonly ConsoleNavNode[]=consoleNavigation;
export const permissionOptions=permissionTree.map(node=>node.label);
export type PermissionMode="view"|"operate";
export const permissionKey=(href:string,mode:PermissionMode)=>mode+":"+href;
export function descendants(node:ConsoleNavNode):ConsoleNavNode[]{
 return [node,...(node.children||[]).flatMap(descendants)];
}
const allNodes=permissionTree.flatMap(descendants);
const byName=(name:string)=>allNodes.filter(node=>node.label===name);
const legacyAliases:Record<string,string[]>={
 "商品中心":["/workbench/store-products"],"刊登管理":["/workbench/listing"],
 "店铺中心":["/workbench/store-center"],"AI工作台":["/workbench/ai"],
 "账户资料":["/workbench/account/profile"],"推广与收益":["/workbench/account/referrals"]
};
export function normalizeRolePermissions(values:readonly string[]):string[]{
 const allowed=new Set(allNodes.flatMap(node=>[permissionKey(node.href,"view"),permissionKey(node.href,"operate")]));
 const result=new Set<string>();
 for(const value of values){
  if(allowed.has(value)){result.add(value);continue}
  const targets=legacyAliases[value]?.map(href=>allNodes.find(node=>node.href===href)).filter((node):node is ConsoleNavNode=>!!node)
   ||byName(value).filter(node=>node.href.startsWith("/workbench/"));
  for(const node of targets)for(const child of descendants(node)){
   result.add(permissionKey(child.href,"view"));result.add(permissionKey(child.href,"operate"));
  }
 }
 // Actions require the corresponding page to remain visible.
 for(const key of [...result])if(key.startsWith("operate:"))result.add("view:"+key.slice(8));
 return [...result];
}
export function permissionSummary(values:readonly string[]):string{
 const selected=new Set(normalizeRolePermissions(values));
 const labels=permissionTree.flatMap(root=>{
  if(selected.has(permissionKey(root.href,"view")))return [root.label];
  return (root.children||[]).filter(child=>selected.has(permissionKey(child.href,"view"))).map(child=>child.label);
 });
 return [...new Set(labels)].join("、")||"尚未配置";
}
export function toggleRolePermission(values:readonly string[],node:ConsoleNavNode,mode:PermissionMode,checked:boolean):string[]{
 const next=new Set(normalizeRolePermissions(values));
 const key=permissionKey(node.href,mode);
 if(checked){next.add(key);if(mode==="operate")next.add(permissionKey(node.href,"view"))}
 else{next.delete(key);if(mode==="view")next.delete(permissionKey(node.href,"operate"))}
 return [...next];
}
export function togglePermissionGroup(values:readonly string[],node:ConsoleNavNode,checked:boolean):string[]{
 let result=normalizeRolePermissions(values);
 for(const child of descendants(node)){
  result=toggleRolePermission(result,child,"view",checked);
  result=toggleRolePermission(result,child,"operate",checked);
 }
 return result;
}
export type SuiteState={members:Member[];audit:AccountEvent[];roles:string[];rolePermissions:Record<string,string[]>;allocations:Record<string,number>;referrals:ReferralItem[];withdrawals:Withdrawal[];payoutAccount:string;referralCode:string};
const KEY="shuomi-demo-account-suite-SM-ENT-000001-v1";
export const initialSuite:SuiteState={members:[{id:"admin",name:tenant.admin,email:tenant.email,role:"管理员",status:"正常",joined:Date.UTC(2026,10,21)}],audit:[],roles:["管理员","运营负责人","商品运营","订单客服"],rolePermissions:{"管理员":[...permissionOptions],"运营负责人":["店铺中心","商品中心","刊登管理","供应市场","AI工作台"],"商品运营":["商品中心","刊登管理","供应市场"],"订单客服":["店铺中心"]},allocations:{},referrals:[],withdrawals:[],payoutAccount:"",referralCode:"SM-ENT-000001"};
const valid=(value:unknown):value is SuiteState=>!!value&&typeof value==="object"&&Array.isArray((value as SuiteState).members)&&Array.isArray((value as SuiteState).audit)&&Array.isArray((value as SuiteState).roles)&&Array.isArray((value as SuiteState).referrals)&&Array.isArray((value as SuiteState).withdrawals);
export function readSuite():SuiteState{resetLegacyAccountDemoOnce();try{const v=JSON.parse(localStorage.getItem(KEY)||"null");if(valid(v))return {...structuredClone(initialSuite),...v,rolePermissions:Object.fromEntries(Object.entries({...initialSuite.rolePermissions,...(v.rolePermissions||{})}).map(([role,permissions])=>[role,normalizeRolePermissions(Array.isArray(permissions)?permissions:[])])),allocations:{...(v.allocations||{})}}}catch{}return structuredClone(initialSuite)}
export function writeSuite(v:SuiteState):boolean{resetLegacyAccountDemoOnce();try{localStorage.setItem(KEY,JSON.stringify(v));window.dispatchEvent(new Event("shuomi-suite-updated"));return true}catch{return false}}
export function addAudit(state:SuiteState,category:string,message:string):SuiteState{return {...state,audit:[{id:crypto.randomUUID(),at:Date.now(),actor:tenant.admin,category,message},...state.audit]}}
export function useShowcaseSuite(){const [state,setState]=useState<SuiteState>(initialSuite);useEffect(()=>{const sync=()=>setState(readSuite());sync();window.addEventListener("shuomi-suite-updated",sync);return()=>window.removeEventListener("shuomi-suite-updated",sync)},[]);const commit=(newState:SuiteState)=>{if(!writeSuite(newState))return false;setState(newState);return true};return {state,commit}}
export const totalEarnings=(state:SuiteState)=>state.referrals.reduce((x,r)=>x+r.amount,0);
export const availableEarnings=(state:SuiteState)=>state.referrals.filter(r=>r.status==="已结算").reduce((x,r)=>x+r.amount,0);
