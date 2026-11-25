"use client";

/** One source of truth for preview agent templates.
 * All preview reads and writes are scoped to the same organization, member and agent.
 * Browser session storage is only a showcase; production permissions belong on the server.
 */
export type AgentPreviewTemplate={id:string;name:string;createdAt:string;config:unknown};
export const SHUOMI_ADAPTATION_AGENT="商品优化智能体";
export const SHUOMI_ADAPTATION_TEMPLATE_ID="shuomi-official-adaptation-v1";
export const SHUOMI_ADAPTATION_TEMPLATE_NAME="硕米适配";
export const isShuomiAdaptationTemplate=(agent:string,id:string)=>agent===SHUOMI_ADAPTATION_AGENT&&id===SHUOMI_ADAPTATION_TEMPLATE_ID;
const officialAdaptationTemplate:AgentPreviewTemplate={
 id:SHUOMI_ADAPTATION_TEMPLATE_ID,name:SHUOMI_ADAPTATION_TEMPLATE_NAME,createdAt:"官方模板",
 config:{
  systemTemplate:true,targetPlatform:"硕米平台",
  purpose:"优选申请审核通过后，对已入库自有商品开展二次规范化适配；完成后进入硕米优选。正式处理需要服务端执行记录。",
  skills:["商品标题与描述规范化","SKU和变体一致性检测","图片与资料完整性检测","硕米平台字段适配"],
  knowledge:[],imageOptimization:false,imageInstructions:"",
  useConfig:{optimizationSource:"官方方案",imageLanguage:"按原商品语言",imageBackground:"保持原始来源"}
 }
};
const withOfficialTemplate=(agent:string,items:AgentPreviewTemplate[]):AgentPreviewTemplate[]=>{
 if(agent!==SHUOMI_ADAPTATION_AGENT)return items;
 return [officialAdaptationTemplate,...items.filter(item=>item.id!==SHUOMI_ADAPTATION_TEMPLATE_ID&&item.name!==SHUOMI_ADAPTATION_TEMPLATE_NAME)];
};
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
   return withOfficialTemplate(agent,Array.isArray(parsed)?parsed.filter(valid):[]);
  }
  // Legacy data is strictly limited to the original administrator showcase.
  if(org!=="SM-ENT-000001"||member!=="admin")return withOfficialTemplate(agent,[]);
  const old=sessionStorage.getItem("shuomi-demo-agent-templates-"+agent);
  if(old!==null){
   const parsed:unknown=JSON.parse(old);
   return withOfficialTemplate(agent,Array.isArray(parsed)?parsed.filter(valid):[]);
  }
  const legacy=sessionStorage.getItem("shuomi-demo-agent-template-"+agent);
  if(!legacy)return withOfficialTemplate(agent,[]);
  return withOfficialTemplate(agent,[{id:"legacy-template",name:"已有演示模板",createdAt:"历史配置",config:JSON.parse(legacy)}]);
 }catch{return withOfficialTemplate(agent,[])}
}
export function writeAgentPreviewTemplates(org:string,member:string,agent:string,entries:AgentPreviewTemplate[]){
 if(typeof window==="undefined"||!org||!member||!agent)throw Error("模板所属账户信息不完整");
 // Keep [] instead of removing the scoped key, otherwise deleted legacy templates reappear.
 sessionStorage.setItem(agentPreviewTemplateKey(org,member,agent),JSON.stringify(withOfficialTemplate(agent,entries)));
 window.dispatchEvent(new CustomEvent(agentPreviewTemplatesChanged,{detail:{organizationId:org,memberId:member,agent}}));
}

/** Complete, portable template snapshot. Never claim this gives an external assistant browser access.
 * Do not include account identifiers or unrelated browser storage.
 */
export function serializeAgentTemplateForSharing(agent:string,template:AgentPreviewTemplate):string{
 if(!agent.trim()||!valid(template))throw Error("无法导出无效模板");
 const payload={
  format:"shuomi-agent-template",version:1,
  agent,templateName:template.name,savedAt:template.createdAt,
  config:template.config??null
 };
 return JSON.stringify(payload,null,2);
}
