"use client";
import {readAgentPreviewTemplates} from "./showcase-agent-template-store";
import {checkOwnProductSkus,type OwnProductRecord,type OwnProductSku} from "./showcase-own-product-data";

/** Deterministic showcase preview based on the SAVED agent template, not a real AI execution. */
type Config={skills?:unknown;knowledge?:unknown;imageOptimization?:unknown;imageInstructions?:unknown;useConfig?:unknown};
export type OwnOptimizationPreview={
 templateFound:boolean; agent:string; template:string;
 steps:Array<{name:string;result:string;status:"simulated"|"needs-input"|"not-enabled"}>;
 proposed:Array<{skuId:number;title:string;copy:string;missing:string[];photos:number}>;
 remaining:string[]; readyForReview:boolean;
};
function labels(value:unknown):string[]{
 return Array.isArray(value)?value.filter((v):v is string=>typeof v==="string"&&v.trim().length>0):[];
}
function optimizeCopy(sku:OwnProductSku):string{
 const text=sku.description.trim();
 if(!text)return "";
 // Preserve every source claim: no model or service is invoked, and no dimensions/materials are fabricated.
 return "商品简介：" + text.replace(/\s+/g," ").replace(/^商品简介：/,"");
}
export function previewOwnProductOptimization(org:string,member:string,record:OwnProductRecord,skus:OwnProductSku[]=record.skus):OwnOptimizationPreview|null{
 if(record.agent!=="商品优化智能体"||!record.template)return null;
 const saved=readAgentPreviewTemplates(org,member,record.agent).find(t=>t.name===record.template);
 const c:Config=saved&&saved.config&&typeof saved.config==="object"?saved.config as Config:{};
 const skillNames=labels(c.skills),knowledgeNames=labels(c.knowledge);
 const needs=checkOwnProductSkus(skus);
 const original=record.originalSkus??record.skus;
 const titleChanges=skus.filter(s=>s.name.trim()!==(original.find(x=>x.id===s.id)?.name.trim()??"")).length;
 const copyChanges=skus.filter(s=>s.description.trim()!==(original.find(x=>x.id===s.id)?.description.trim()??"")).length;
 const missingImages=skus.filter(s=>!s.images.some(src=>src.trim())).length;
 const steps:OwnOptimizationPreview["steps"]=[
  {name:"模板关联",result:saved?"已读取当前账号保存的模板配置":"模板已改名、删除或当前账号不可访问；仅能展示商品资料检查",status:saved?"simulated":"needs-input"},
  {name:"商品信息整理",result:"模拟整理了 "+titleChanges+" 个 SKU 标题、"+copyChanges+" 个 SKU 描述；保留原始资料用于对比，不补造材质、规格或卖点。",status:"simulated"},
  {name:"SKU 与变体检查",result:"识别 "+skus.length+" 个 SKU；"+(missingImages?"有 "+missingImages+" 个 SKU 缺少有效图片，保留待完善":"图片字段齐全，保留原始图片来源；未执行真实图片生成"),status:missingImages?"needs-input":"simulated"},
  {name:"技能配置",result:!saved?"无法读取配置":skillNames.length?"模板选择："+skillNames.join("、"):"模板未启用技能",status:!saved?"needs-input":skillNames.length?"simulated":"not-enabled"},
  {name:"知识库配置",result:!saved?"无法读取配置":knowledgeNames.length?"模板引用："+knowledgeNames.join("、")+"（仅展示引用，未执行检索）":"模板未关联知识库",status:!saved?"needs-input":knowledgeNames.length?"simulated":"not-enabled"},
  {name:"图片优化配置",result:!saved?"无法读取配置":c.imageOptimization?"模板已启用图片优化；当前仅保留上传图片供预览，未生成或修复新图":"模板未启用图片优化",status:!saved?"needs-input":c.imageOptimization?"simulated":"not-enabled"},
  {name:"入库缺项检测",result:needs.length?"仍需人工补全："+needs.join("、"):"资料必填项齐全，可进入待审核",status:needs.length?"needs-input":"simulated"}
 ];
 return {
  templateFound:!!saved,agent:record.agent,template:record.template,
  steps,proposed:skus.map(s=>({skuId:s.id,title:s.name.trim(),copy:optimizeCopy(s),missing:checkOwnProductSkus([s]),photos:s.images.length})),
  remaining:needs,readyForReview:needs.length===0
 };
}
