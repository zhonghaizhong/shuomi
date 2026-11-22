"use client";
import {useEffect,useState} from "react";
import {showcaseTenant as tenant} from "./showcase-tenant";
import {resetLegacyAccountDemoOnce} from "./showcase-data-reset";
import {consoleNavigation, type ConsoleNavNode} from "@/lib/workbench/console-navigation";

export type Member={id:string;name:string;email:string;role:string;status:"正常"|"已停用";joined:number};
export type AccountEvent={id:string;at:number;actor:string;category:string;message:string};
export type ReferralItem={id:string;at:number;referred:string;amount:number;status:"已结算"|"已提现";orderId?:string;paidCny?:number;rate?:number};
export type ReferredCustomer={id:string;name:string;registeredAt:number;walletTopUpCny:number;storeId:string;storeOrderId:string;storeFeeCny:number;walletBalanceCny:number;commissionCny:number;status:"模拟绑定已消费"};
export type TrackedVisit={id:string;visitedAt:number;source:"推广链接"|"推广码"|"推广二维码";registeredAt?:number;verifiedAt?:number;registeredName?:string};
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
// The administrator is a protected system role. The former three sample business
// roles are retired from the fixture; existing custom roles are preserved.
export const retiredSampleRoles=["运营负责人","商品运营","订单客服"] as const;
export const subaccountRole="子账号";
const subaccountGrants:{path:string;mode:PermissionMode;children?:boolean}[]=[
 {path:"/workbench",mode:"view",children:true},
 {path:"/workbench/ai",mode:"view"},
 {path:"/workbench/ai/chat",mode:"operate",children:true},
 {path:"/workbench/ai/tasks",mode:"operate",children:true},
 {path:"/workbench/ai/projects",mode:"view",children:true},
 {path:"/workbench/ai/reports",mode:"view",children:true},
 {path:"/workbench/supply",mode:"view",children:true},
 {path:"/workbench/agents",mode:"view"},
 {path:"/workbench/agents/market",mode:"view"},
 {path:"/workbench/agents/mine",mode:"view"},
 {path:"/workbench/tools",mode:"view"},
 {path:"/workbench/tools/official",mode:"view"},
 {path:"/workbench/tools/mine",mode:"operate"},
 {path:"/workbench/data",mode:"view"},
 {path:"/workbench/data/market",mode:"view"},
 {path:"/workbench/data/mine",mode:"operate"},
 {path:"/workbench/store-center",mode:"view"},
 {path:"/workbench/stores",mode:"operate"},
 {path:"/workbench/listing",mode:"operate",children:true},
 {path:"/workbench/store-products",mode:"view"},
 {path:"/workbench/store-orders",mode:"view",children:true}
];
export const subaccountPreset=normalizeRolePermissions(subaccountGrants.flatMap(({path,mode,children})=>{
 const node=allNodes.find(item=>item.href===path);
 if(!node)return [];
 return (children?descendants(node):[node]).flatMap(item=>[
  permissionKey(item.href,"view"),
  ...(mode==="operate"?[permissionKey(item.href,"operate")]:[])
 ]);
}));
/** Isolated synthetic tenant transactions: no real payment, sign-up or store authorization. */
export const demoReferralRate=0.10;
export const demoStoreFeeCny=168;
export const demoCustomerTopUpCny=200;
export const demoColleagues:Member[]=Array.from({length:3},(_,index)=>({
 id:"SIM-COLLEAGUE-"+String(index+1).padStart(2,"0"),
 name:"模拟同事"+String(index+1).padStart(2,"0"),
 email:"colleague"+String(index+1).padStart(2,"0")+"@example.test",
 role:subaccountRole,status:"正常",joined:Date.UTC(2026,10,22,2,15+index)
}));
export const demoReferredCustomers:ReferredCustomer[]=Array.from({length:20},(_,index)=>{
 const serial=String(index+1).padStart(2,"0");
 return {
  id:"SIM-REF-USER-"+serial,name:"模拟新用户"+serial,
  registeredAt:Date.UTC(2026,10,22,2,20+index),
  walletTopUpCny:demoCustomerTopUpCny,
  storeId:"SIM-SHEIN-STORE-"+serial,
  storeOrderId:"SIM-ORDER-STORE-"+serial,
  storeFeeCny:demoStoreFeeCny,
  walletBalanceCny:demoCustomerTopUpCny-demoStoreFeeCny,
  commissionCny:Math.round(demoStoreFeeCny*demoReferralRate*100)/100,
  status:"模拟绑定已消费"
 };
});
// Synthetic attributed visits, NOT actual traffic analytics. Anonymous until registration.
// A distinct visit ID approximates one simulated visitor only for demonstration.
export const demoTrackedVisits:TrackedVisit[]=Array.from({length:10},(_,index)=>{
 const serial=String(index+1).padStart(2,"0");
 const registered=index>=5;
 return {
  id:"SIM-VISITOR-"+serial,
  visitedAt:Date.UTC(2026,10,21,8,index*4),
  source:index%3===0?"推广二维码":index%3===1?"推广码":"推广链接",
  ...(registered?{registeredAt:Date.UTC(2026,10,21,9,index*4),verifiedAt:Date.UTC(2026,10,21,10,index*4),registeredName:"模拟注册用户"+serial}:{})
 };
});
export const demoReferralEarnings:ReferralItem[]=demoReferredCustomers.map(customer=>({
 id:"SIM-COMMISSION-"+customer.id,
 at:customer.registeredAt+180000,
 referred:customer.name,
 amount:customer.commissionCny,
 status:"已结算",
 orderId:customer.storeOrderId,
 paidCny:customer.storeFeeCny,
 rate:demoReferralRate
}));
export const demoReferralSummary={
 visitors:demoReferredCustomers.length+demoTrackedVisits.length,
 registrations:demoReferredCustomers.length+demoTrackedVisits.filter(x=>!!x.registeredAt).length,
 paidCustomers:demoReferredCustomers.filter(x=>x.storeFeeCny>0).length,
 totalTopUpsCny:demoReferredCustomers.reduce((sum,item)=>sum+item.walletTopUpCny,0),
 totalStoreSpendCny:demoReferredCustomers.reduce((sum,item)=>sum+item.storeFeeCny,0),
 totalWalletBalanceCny:demoReferredCustomers.reduce((sum,item)=>sum+item.walletBalanceCny,0),
 totalCommissionCny:demoReferralEarnings.reduce((sum,item)=>sum+item.amount,0)
};
export type SuiteState={members:Member[];audit:AccountEvent[];roles:string[];rolePermissions:Record<string,string[]>;allocations:Record<string,number>;referredCustomers:ReferredCustomer[];trackedVisits:TrackedVisit[];referrals:ReferralItem[];withdrawals:Withdrawal[];payoutAccount:string;referralCode:string};

// Referral records belong to an individual demo member, never to the organization-wide account suite.
// The administrator's existing fixture stays in SuiteState for backwards compatibility.
export type ReferralPortfolio=Pick<SuiteState,"audit"|"referredCustomers"|"trackedVisits"|"referrals"|"withdrawals"|"payoutAccount"|"referralCode">;
export const colleague01Id="SIM-COLLEAGUE-01";
export function initialMemberReferralPortfolio(memberId:string):ReferralPortfolio{
 const code="SM-"+memberId.replace(/[^A-Z0-9]/gi,"").toUpperCase();
 if(memberId!==colleague01Id)return {audit:[],referredCustomers:[],trackedVisits:[],referrals:[],withdrawals:[],payoutAccount:"",referralCode:code};
 const customers:ReferredCustomer[]=Array.from({length:6},(_,index):ReferredCustomer=>{
  const n=String(index+1).padStart(2,"0");
  return {id:"SIM-C01-CUSTOMER-"+n,name:"同事01模拟客户"+n,
   registeredAt:Date.UTC(2026,10,22,3,10+index),walletTopUpCny:200,
   storeId:"SIM-C01-STORE-"+n,storeOrderId:"SIM-C01-ORDER-"+n,
   storeFeeCny:demoStoreFeeCny,walletBalanceCny:200-demoStoreFeeCny,
   commissionCny:Math.round(demoStoreFeeCny*demoReferralRate*100)/100,status:"模拟绑定已消费"};
 });
 const visitors:TrackedVisit[]=Array.from({length:4},(_,index):TrackedVisit=>{
  const n=String(index+7).padStart(2,"0");
  return {id:"SIM-C01-VISITOR-"+n,visitedAt:Date.UTC(2026,10,22,3,20+index),
   source:index%2===0?"推广链接":"推广码",
   ...(index<2?{registeredAt:Date.UTC(2026,10,22,3,40+index),verifiedAt:Date.UTC(2026,10,22,3,50+index),registeredName:"同事01模拟注册用户"+n}:{})};
 });
 const referrals:ReferralItem[]=customers.map(x=>({id:"SIM-C01-COMMISSION-"+x.id,at:x.registeredAt+180000,
  referred:x.name,amount:x.commissionCny,status:"已结算",orderId:x.storeOrderId,
  paidCny:x.storeFeeCny,rate:demoReferralRate}));
 return {audit:[],referredCustomers:customers,trackedVisits:visitors,referrals,withdrawals:[],
  payoutAccount:"",referralCode:code};
}
const REFERRAL_PREFIX="shuomi-demo-member-referrals-v1-";
function validReferralPortfolio(v:unknown):v is ReferralPortfolio{
 return !!v&&typeof v==="object"&&Array.isArray((v as ReferralPortfolio).audit)&&Array.isArray((v as ReferralPortfolio).referredCustomers)
 &&Array.isArray((v as ReferralPortfolio).trackedVisits)&&Array.isArray((v as ReferralPortfolio).referrals)
 &&Array.isArray((v as ReferralPortfolio).withdrawals)&&typeof (v as ReferralPortfolio).payoutAccount==="string"
 &&typeof (v as ReferralPortfolio).referralCode==="string";
}
export function readMemberReferralPortfolio(memberId:string):ReferralPortfolio{
 const initial=initialMemberReferralPortfolio(memberId);
 try{
  const raw=localStorage.getItem(REFERRAL_PREFIX+memberId);
  const saved=raw?JSON.parse(raw):null;
  return validReferralPortfolio(saved)?saved:initial;
 }catch{return initial}
}
export function writeMemberReferralPortfolio(memberId:string,portfolio:ReferralPortfolio):boolean{
 if(memberId==="admin"||!validReferralPortfolio(portfolio))return false;
 try{localStorage.setItem(REFERRAL_PREFIX+memberId,JSON.stringify(portfolio));
  window.dispatchEvent(new Event("shuomi-member-referrals-updated"));return true;
 }catch{return false}
}
export function useMemberReferralPortfolio(memberId:string){
 const [portfolio,setPortfolio]=useState<ReferralPortfolio>(()=>initialMemberReferralPortfolio(memberId));
 useEffect(()=>{
  const sync=()=>setPortfolio(readMemberReferralPortfolio(memberId));sync();
  window.addEventListener("shuomi-member-referrals-updated",sync);
  return()=>window.removeEventListener("shuomi-member-referrals-updated",sync);
 },[memberId]);
 const commitPortfolio=(next:ReferralPortfolio)=>{
  if(!writeMemberReferralPortfolio(memberId,next))return false;
  setPortfolio(next);return true;
 };
 return {portfolio,commitPortfolio};
}
const KEY="shuomi-demo-account-suite-SM-ENT-000001-v1";
export const initialSuite:SuiteState={members:[{id:"admin",name:tenant.admin,email:tenant.email,role:"管理员",status:"正常",joined:Date.UTC(2026,10,21)},...demoColleagues],audit:[],roles:["管理员",subaccountRole],rolePermissions:{"管理员":allNodes.flatMap(node=>[permissionKey(node.href,"view"),permissionKey(node.href,"operate")]),[subaccountRole]:subaccountPreset},allocations:{},referredCustomers:demoReferredCustomers,trackedVisits:demoTrackedVisits,referrals:demoReferralEarnings,withdrawals:[],payoutAccount:"",referralCode:"SM-ENT-000001"};
const valid=(value:unknown):value is SuiteState=>!!value&&typeof value==="object"&&Array.isArray((value as SuiteState).members)&&Array.isArray((value as SuiteState).audit)&&Array.isArray((value as SuiteState).roles)&&Array.isArray((value as SuiteState).referrals)&&Array.isArray((value as SuiteState).withdrawals);
export function readSuite():SuiteState{resetLegacyAccountDemoOnce();try{const v=JSON.parse(localStorage.getItem(KEY)||"null");if(valid(v)){
  const obsolete=new Set<string>(retiredSampleRoles);
  const roles=["管理员",subaccountRole,...(Array.isArray(v.roles)?v.roles:[]).filter((role:string)=>role!=="管理员"&&role!==subaccountRole&&!obsolete.has(role))];
  const allowedRoles=new Set(roles);
  const rolePermissions=Object.fromEntries(Object.entries({...initialSuite.rolePermissions,...(v.rolePermissions||{})})
    .filter(([role])=>allowedRoles.has(role))
    .map(([role,permissions])=>[role,normalizeRolePermissions(Array.isArray(permissions)?permissions:[])]));
  const originalMembers=(v.members as Member[]).map(member=>obsolete.has(member.role)?{...member,role:subaccountRole}:member);
  const memberIds=new Set(originalMembers.map(member=>member.id));
  const members=[...originalMembers,...demoColleagues.filter(member=>!memberIds.has(member.id)&&!originalMembers.some(existing=>existing.email===member.email))];
  const originalCustomers=Array.isArray(v.referredCustomers)?v.referredCustomers as ReferredCustomer[]:[];
  const customerIds=new Set(originalCustomers.map(customer=>customer.id));
  const referredCustomers=[...originalCustomers,...demoReferredCustomers.filter(customer=>!customerIds.has(customer.id))];
  // Replace obsolete local "targeted invitation" demo fixtures. Never import unregistered
  // user names from legacy invitations as identities of anonymous visitors.
  const trackedVisits=demoTrackedVisits.map(x=>({...x}));
  const originalReferrals=Array.isArray(v.referrals)?v.referrals as ReferralItem[]:[];
  const referralIds=new Set(originalReferrals.map(item=>item.id));
  const referrals=[...originalReferrals,...demoReferralEarnings.filter(item=>!referralIds.has(item.id))];
  return {...structuredClone(initialSuite),...v,roles,rolePermissions,members,referredCustomers,trackedVisits,referrals,allocations:{...(v.allocations||{})}};
 }}catch{}return structuredClone(initialSuite)}
export function writeSuite(v:SuiteState):boolean{resetLegacyAccountDemoOnce();try{localStorage.setItem(KEY,JSON.stringify(v));window.dispatchEvent(new Event("shuomi-suite-updated"));return true}catch{return false}}
export function addAudit(state:SuiteState,category:string,message:string):SuiteState{return {...state,audit:[{id:crypto.randomUUID(),at:Date.now(),actor:tenant.admin,category,message},...state.audit]}}
export function useShowcaseSuite(){const [state,setState]=useState<SuiteState>(initialSuite);useEffect(()=>{const sync=()=>setState(readSuite());sync();window.addEventListener("shuomi-suite-updated",sync);return()=>window.removeEventListener("shuomi-suite-updated",sync)},[]);const commit=(newState:SuiteState)=>{if(!writeSuite(newState))return false;setState(newState);return true};return {state,commit}}
export const totalEarnings=(state:SuiteState)=>state.referrals.reduce((x,r)=>x+r.amount,0);
export const availableEarnings=(state:SuiteState)=>state.referrals.filter(r=>r.status==="已结算").reduce((x,r)=>x+r.amount,0);
