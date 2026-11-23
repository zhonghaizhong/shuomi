"use client";
export type SkuMode="使用原货号"|"前后缀 + 原货号"|"哈希值";
export type PriceMode="固定值"|"原价 + 固定值"|"成本 × 倍数"|"使用定价工具";
export type AdaptationRule={id:string;name:string;skuMode:SkuMode;prefix:string;suffix:string;priceMode:PriceMode;priceValue:string;currencyConversion:boolean;aiFill:boolean;aiScope?:"required"|"optional"|"all";brandMode?:"authorized"|"manual";brandName?:string};
export type RuleCollection={currentId:string;rules:AdaptationRule[]};
const key=(organizationId:string,memberId:string)=>"shuomi:adaptation-rules-v1:"+organizationId+":"+memberId;
const defaults:AdaptationRule[]=[
 {id:"rule-shein",name:"SHEIN服装规则",skuMode:"前后缀 + 原货号",prefix:"SKU-",suffix:"-US",priceMode:"成本 × 倍数",priceValue:"1.8",currencyConversion:true,aiFill:false,aiScope:"required",brandMode:"authorized",brandName:""},
 {id:"rule-amazon",name:"亚马逊家居规则",skuMode:"哈希值",prefix:"",suffix:"",priceMode:"使用定价工具",priceValue:"",currencyConversion:true,aiFill:false},
 {id:"rule-fast",name:"低价快速适配",skuMode:"使用原货号",prefix:"",suffix:"",priceMode:"原价 + 固定值",priceValue:"5",currencyConversion:false,aiFill:false,aiScope:"required",brandMode:"authorized",brandName:""}
];
export function readAdaptationRules(organizationId:string,memberId:string):RuleCollection{
 const fallback=():RuleCollection=>({currentId:defaults[0].id,rules:defaults.map(r=>({...r}))});
 if(typeof window==="undefined")return fallback();
 try{
  const raw=sessionStorage.getItem(key(organizationId,memberId));
  if(!raw)return fallback();
  const value:unknown=JSON.parse(raw);
  if(!value||typeof value!=="object"||!("rules"in value)||!Array.isArray(value.rules))return fallback();
  const rules=value.rules.filter((r):r is AdaptationRule=>Boolean(r&&typeof r==="object"&&typeof r.id==="string"&&typeof r.name==="string"&&["使用原货号","前后缀 + 原货号","哈希值"].includes(r.skuMode)&&["固定值","原价 + 固定值","成本 × 倍数","使用定价工具"].includes(r.priceMode)));
  if(!rules.length)return fallback();
  const currentId="currentId"in value&&typeof value.currentId==="string"&&rules.some(r=>r.id===value.currentId)?value.currentId:rules[0].id;
  return {rules,currentId};
 }catch{return fallback()}
}
export function saveAdaptationRules(organizationId:string,memberId:string,value:RuleCollection):boolean{
 if(typeof window==="undefined"||!value.rules.length||!value.rules.some(x=>x.id===value.currentId))return false;
 try{sessionStorage.setItem(key(organizationId,memberId),JSON.stringify(value));return true}catch{return false}
}
