"use client";
const key=(organizationId:string)=>"shuomi:demo-agents-enabled-v2:"+organizationId;
export const showcaseAgentStateChanged="shuomi:demo-agent-state-updated";
const defaultAgents=["商品优化智能体","POD刊登智能体"];
export function readShowcaseEnabledAgents(organizationId:string):string[]{
 if(typeof window==="undefined")return organizationId==="SM-ENT-000001"?defaultAgents:[];
 try{
  const scoped=sessionStorage.getItem(key(organizationId));
  if(scoped){const x:unknown=JSON.parse(scoped);return Array.isArray(x)?x.filter((item):item is string=>typeof item==="string"):[]}
  // Preserve existing primary-enterprise showcase activation; never leak it to another enterprise.
  if(organizationId==="SM-ENT-000001"){
   const legacy=sessionStorage.getItem("shuomi-demo-agents-enabled");
   if(legacy){const data:unknown=JSON.parse(legacy);const names=Array.isArray(data)?data.filter((item):item is string=>typeof item==="string"):defaultAgents;sessionStorage.setItem(key(organizationId),JSON.stringify(names));return names}
   sessionStorage.setItem(key(organizationId),JSON.stringify(defaultAgents));return defaultAgents;
  }
  return [];
 }catch{return organizationId==="SM-ENT-000001"?defaultAgents:[];}
}
export function saveShowcaseEnabledAgents(organizationId:string,names:string[]):boolean{
 if(typeof window==="undefined")return false;
 try{
  sessionStorage.setItem(key(organizationId),JSON.stringify([...new Set(names)]));
  window.dispatchEvent(new CustomEvent(showcaseAgentStateChanged,{detail:{organizationId}}));
  return true;
 }catch{return false}
}
export const showcaseAgentName=(id:string)=>id==="pod.design.agent"?"POD刊登智能体":id==="product.content.agent"?"商品优化智能体":id;
export const showcaseAgentId=(name:string)=>name==="POD刊登智能体"?"pod.design.agent":name==="商品优化智能体"?"product.content.agent":name;
export function readShowcaseAgentTemplates(organizationId:string,memberId:string,name:string):Array<{id:string;name:string}>{
 if(typeof window==="undefined")return [];
 try{
  const scoped=sessionStorage.getItem("shuomi:demo-agent-templates-v2:"+organizationId+":"+memberId+":"+name);
  const legacy=organizationId==="SM-ENT-000001"&&memberId==="admin"?sessionStorage.getItem("shuomi-demo-agent-templates-"+name):null;
  const value:unknown=JSON.parse(scoped??legacy??"[]");
  return Array.isArray(value)?value.filter((x):x is {id:string;name:string}=>Boolean(x&&typeof x==="object"&&"id"in x&&typeof x.id==="string"&&"name"in x&&typeof x.name==="string")):[];
 }catch{return []}
}
