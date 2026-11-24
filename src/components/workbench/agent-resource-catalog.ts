"use client";
import {skillRequest,skillError} from "@/lib/api/skill";
import {skillPageSchema} from "@/lib/contracts/skill";
import {knowledgeRequest,basesSchema,KnowledgeError} from "@/lib/api/knowledge";
import {readEnabledPreviewSkills,readPersonalPreviewSkills,officialSkills} from "./showcase-skill-library";

export type AgentCatalogItem={key:string;name:string;description:string;source:"我的技能"|"团队技能"|"我的知识库"|"团队知识库";revision?:string};
export type AgentCatalog={items:AgentCatalogItem[];notice?:string};
export type AgentCatalogScope={organizationId:string;memberId:string;preview:boolean};

/** Read exactly the active user's permitted catalog. No demo fallback for a failed production API. */
export async function loadAgentCatalog(kind:"skills"|"knowledge",scope:AgentCatalogScope,signal:AbortSignal):Promise<AgentCatalog>{
 if(scope.preview){
  if(kind==="knowledge")return {items:[],notice:"当前展示站点尚未连接正式知识库服务，无法读取「我的知识库」。请在已登录的正式工作台中关联。"};
  const enabled=readEnabledPreviewSkills(scope.organizationId,scope.memberId);
  const personal=readPersonalPreviewSkills(scope.organizationId,scope.memberId);
  const items:AgentCatalogItem[]=[
   ...enabled.map(name=>({key:"preview:official:"+name,name,description:officialSkills.find(s=>s[0]===name)?.[1]??"已启用官方模板",source:"我的技能" as const})),
   ...personal.map(skill=>({key:"preview:personal:"+skill.name,name:skill.name,description:skill.description,source:"我的技能" as const}))
  ];
  return {items,notice:"已关联当前账号展示版「我的技能」，只用于原型配置，尚未创建可执行的正式技能任务。"};
 }
 const userId=scope.memberId,organizationId=scope.organizationId;
 if(kind==="skills"){
  const items:AgentCatalogItem[]=[];
  for(const [space,source] of [["personal","我的技能"],["organization","团队技能"]] as const){
   let cursor="";
   for(let page=0;page<5;page++){
    const data=await skillRequest({userId,organizationId},space+"?limit=50"+(cursor?"&cursor="+encodeURIComponent(cursor):""),skillPageSchema,{signal});
    if(signal.aborted)return {items:[]};
    for(const row of data.items){
     const v=row.version;
     if(!row.canUse||v.state!=="ENABLED")continue;
     items.push({key:"skill:"+v.skill.id+":"+v.version+":"+v.package.digest,name:v.package.displayName||v.package.name,
      description:v.package.description,source,revision:"v"+v.version});
    }
    if(!data.nextCursor)break;
    cursor=data.nextCursor;
   }
  }
  return {items};
 }
 const items:AgentCatalogItem[]=[];
 for(let page=1;page<=5;page++){
  const data=await knowledgeRequest({userId,organizationId},"knowledge-bases?page="+page+"&pageSize=100",basesSchema,{signal});
  if(signal.aborted)return {items:[]};
  for(const base of data.items)if(base.state==="ACTIVE")items.push({key:"knowledge:"+base.id,name:base.name,description:"当前企业知识库 · 已启用",source:"我的知识库",revision:"v"+base.version});
  if(page*100>=data.pagination.total)break;
 }
 return {items};
}
export function agentCatalogError(error:unknown,kind:"skills"|"knowledge"){
 if(kind==="skills")return skillError(error);
 if(error instanceof KnowledgeError){
  if(error.code==="PERMISSION_DENIED")return "当前账户没有此知识库的读取权限。";
  if(error.code==="IDENTITY_CONTEXT_CHANGED"||error.code==="ORGANIZATION_CONTEXT_CHANGED")return "登录身份或所属企业发生变化，请重新确认账户。";
 }
 return "无法读取当前企业知识库，请检查服务连接或权限后重试。";
}
