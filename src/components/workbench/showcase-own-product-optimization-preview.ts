"use client";
import {readAgentPreviewTemplates} from "./showcase-agent-template-store";
import {checkOwnProductSkus,type OwnProductRecord,type OwnProductSku} from "./showcase-own-product-data";
import type {AgentUseConfiguration,ImageTask} from "./agent-use-configuration-dialog";

/** Deterministic showcase preview based on the SAVED agent template, not a real AI execution. */
type Config={skills?:unknown;knowledge?:unknown;imageOptimization?:unknown;imageInstructions?:unknown;useConfig?:unknown};
type PictureSetting={label:string;value:string};
export type OwnOptimizationPreview={
 templateFound:boolean; agent:string; template:string;
 steps:Array<{name:string;result:string;status:"simulated"|"needs-input"|"not-enabled"}>;
 pictureSettings:PictureSetting[];
 proposed:Array<{skuId:number;title:string;copy:string;missing:string[];photos:number}>;
 remaining:string[]; readyForReview:boolean;
};
function labels(value:unknown):string[]{
 return Array.isArray(value)?value.filter((v):v is string=>typeof v==="string"&&v.trim().length>0):[];
}
const textValue=(v:unknown,fallback="未设置"):string=>typeof v==="string"&&v.trim()?v.trim():fallback;
const positions=(v:unknown):string=>Array.isArray(v)?v.filter((n):n is number=>Number.isInteger(n)&&n>=1&&n<=8).map(n=>"第"+n+"张").join("、")||"未选": "未选";
function pictureDetails(config:Config):PictureSetting[]{
 const raw=config.useConfig&&typeof config.useConfig==="object"?config.useConfig as AgentUseConfiguration:{};
 const language=textValue(raw.imageLanguage,"未设置（不指定语言）");
 const bg=textValue(raw.imageBackground,"未设置（不限制背景）");
 const background=bg==="自定义背景要求"?bg+"："+textValue(raw.imageBackgroundCustom,"未填写自定义内容"):bg;
 const source=textValue(raw.optimizationSource,"未选择");
 const use=textValue(raw.imageUse,"共用视觉素材");
 const scope=textValue(raw.imageProcessingScope,"未设置");
 const tasks=Array.isArray(raw.imageTasks)?raw.imageTasks.filter((v):v is ImageTask=>Boolean(v&&typeof v==="object")):[];
 const valid=tasks.filter(t=>Number.isInteger(t.position)&&t.position!>=1&&t.position!<=8&&t.prompt?.trim());
 const taskText=valid.map(t=>(t.target??"主图")+"第"+t.position+"张："+t.prompt.trim()).join("；");
 return [
  {label:"图片优化开关",value:config.imageOptimization===true?"已开启":"未开启"},
  {label:"生图语言",value:language},
  {label:"背景设置",value:background},
  {label:"优化来源",value:source},
  {label:"视觉素材策略",value:use+(use==="共用视觉素材"?" · 来源："+textValue(raw.sharedImageSource,"主图"):"")},
  {label:"图片处理范围",value:scope},
  {label:"主图图片位置",value:positions(raw.selectedMainImages??raw.selectedImages)},
  {label:"详情图图片位置",value:positions(raw.selectedDetailImages??raw.selectedImages)},
  {label:"逐张图片要求",value:source==="自定义指令"?taskText||"未填写有效的逐图要求":source==="官方方案"?"使用官方标准主图／详情图任务；仅处理所选位置":source==="引用技能"?"按已启用技能与所选位置匹配规则":taskText||"未设置"},
  {label:"补充图片指令",value:textValue(config.imageInstructions,"未填写")}
 ];
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
 const pictureSettings=saved?pictureDetails(c):[];
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
  {name:"图片优化配置",result:!saved?"无法读取配置":c.imageOptimization?"已读取语言、背景、图片来源与主图/详情图要求；仅展示模拟配置，未实际调用生图服务":"模板未启用图片优化；不应生成替换图片",status:!saved?"needs-input":c.imageOptimization?"simulated":"not-enabled"},
  {name:"入库缺项检测",result:needs.length?"仍需人工补全："+needs.join("、"):"资料必填项齐全，可进入待审核",status:needs.length?"needs-input":"simulated"}
 ];
 return {
  templateFound:!!saved,agent:record.agent,template:record.template,
  steps,pictureSettings,proposed:skus.map(s=>({skuId:s.id,title:s.name.trim(),copy:optimizeCopy(s),missing:checkOwnProductSkus([s]),photos:s.images.length})),
  remaining:needs,readyForReview:needs.length===0
 };
}
