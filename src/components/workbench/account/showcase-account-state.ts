"use client";
import {useEffect,useState} from "react";
import {showcaseTenant as tenant} from "./showcase-tenant";
import {resetLegacyAccountDemoOnce} from "./showcase-data-reset";

export type Member={id:string;name:string;email:string;role:string;status:"正常"|"已停用";joined:number};
export type AccountEvent={id:string;at:number;actor:string;category:string;message:string};
export type ReferralItem={id:string;at:number;referred:string;amount:number;status:"已结算"|"已提现"};
export type Withdrawal={id:string;at:number;amount:number;account:string;status:"模拟审核通过"};
export const permissionOptions=["账户资料","店铺中心","商品中心","刊登管理","供应市场","数据服务","AI工作台","推广与收益"] as const;
export type SuiteState={members:Member[];audit:AccountEvent[];roles:string[];rolePermissions:Record<string,string[]>;allocations:Record<string,number>;referrals:ReferralItem[];withdrawals:Withdrawal[];payoutAccount:string;referralCode:string};
const KEY="shuomi-demo-account-suite-SM-ENT-000001-v1";
export const initialSuite:SuiteState={members:[{id:"admin",name:tenant.admin,email:tenant.email,role:"管理员",status:"正常",joined:Date.UTC(2026,10,21)}],audit:[],roles:["管理员","运营负责人","商品运营","订单客服"],rolePermissions:{"管理员":[...permissionOptions],"运营负责人":["店铺中心","商品中心","刊登管理","供应市场","AI工作台"],"商品运营":["商品中心","刊登管理","供应市场"],"订单客服":["店铺中心"]},allocations:{},referrals:[],withdrawals:[],payoutAccount:"",referralCode:"SM-ENT-000001"};
const valid=(value:unknown):value is SuiteState=>!!value&&typeof value==="object"&&Array.isArray((value as SuiteState).members)&&Array.isArray((value as SuiteState).audit)&&Array.isArray((value as SuiteState).roles)&&Array.isArray((value as SuiteState).referrals)&&Array.isArray((value as SuiteState).withdrawals);
export function readSuite():SuiteState{resetLegacyAccountDemoOnce();try{const v=JSON.parse(localStorage.getItem(KEY)||"null");if(valid(v))return {...structuredClone(initialSuite),...v,rolePermissions:{...initialSuite.rolePermissions,...(v.rolePermissions||{})},allocations:{...(v.allocations||{})}}}catch{}return structuredClone(initialSuite)}
export function writeSuite(v:SuiteState):boolean{resetLegacyAccountDemoOnce();try{localStorage.setItem(KEY,JSON.stringify(v));window.dispatchEvent(new Event("shuomi-suite-updated"));return true}catch{return false}}
export function addAudit(state:SuiteState,category:string,message:string):SuiteState{return {...state,audit:[{id:crypto.randomUUID(),at:Date.now(),actor:tenant.admin,category,message},...state.audit]}}
export function useShowcaseSuite(){const [state,setState]=useState<SuiteState>(initialSuite);useEffect(()=>{const sync=()=>setState(readSuite());sync();window.addEventListener("shuomi-suite-updated",sync);return()=>window.removeEventListener("shuomi-suite-updated",sync)},[]);const commit=(newState:SuiteState)=>{if(!writeSuite(newState))return false;setState(newState);return true};return {state,commit}}
export const totalEarnings=(state:SuiteState)=>state.referrals.reduce((x,r)=>x+r.amount,0);
export const availableEarnings=(state:SuiteState)=>state.referrals.filter(r=>r.status==="已结算").reduce((x,r)=>x+r.amount,0);
