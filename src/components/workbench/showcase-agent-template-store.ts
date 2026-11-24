"use client";

/** One source of truth for preview agent templates.
 * All preview reads and writes are scoped to the same organization, member and agent.
 * Browser session storage is only a showcase; production permissions belong on the server.
 */
export type AgentPreviewTemplate={id:string;name:string;createdAt:string;config:unknown};
export const agentPreviewTemplatesChanged="shuomi:agent-preview-templates-changed";
export const agentPreviewTemplateKey=(org:string,member:string,agent:string)=>
 "shuomi:demo-agent-templates-v2:"+org+":"+member+":"+agent;

function valid(value:unknown):value is AgentPreviewTemplate{
 if(!value||typeof value!=="object")return false;
 const v=value as Record<string,unknown>;
 return typeof v.id==="string"&&typeof v.name==="string"&&v.name.trim().length>0;
}
export function readAgentPreviewTemplates(org:string,member:string,agent:string):AgentPreviewTemplate[]{
 if(typeof window==="undefined"||!org||!member||!agent)return [];
 try{
  const existing=sessionStorage.getItem(agentPreviewTemplateKey(org,member,agent));
  // An explicit empty array is meaningful after deleting the last template.
  if(existing!==null){
   const parsed:unknown=JSON.parse(existing);
   return Array.isArray(parsed)?parsed.filter(valid):[];
  }
  // Legacy data is strictly limited to the original administrator showcase.
  if(org!=="SM-ENT-000001"||member!=="admin")return [];
  const old=sessionStorage.getItem("shuomi-demo-agent-templates-"+agent);
  if(old!==null){
   const parsed:unknown=JSON.parse(old);
   return Array.isArray(parsed)?parsed.filter(valid):[];
  }
  const legacy=sessionStorage.getItem("shuomi-demo-agent-template-"+agent);
  if(!legacy)return [];
  return [{id:"legacy-template",name:"已有演示模板",createdAt:"历史配置",config:JSON.parse(legacy)}];
 }catch{return []}
}
export function writeAgentPreviewTemplates(org:string,member:string,agent:string,entries:AgentPreviewTemplate[]){
 if(typeof window==="undefined"||!org||!member||!agent)throw Error("模板所属账户信息不完整");
 // Keep [] instead of removing the scoped key, otherwise deleted legacy templates reappear.
 sessionStorage.setItem(agentPreviewTemplateKey(org,member,agent),JSON.stringify(entries));
 window.dispatchEvent(new CustomEvent(agentPreviewTemplatesChanged,{detail:{organizationId:org,memberId:member,agent}}));
}
