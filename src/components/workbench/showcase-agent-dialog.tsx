"use client";

import {useEffect,useId,useRef,useState} from "react";
import styles from "./showcase-agent-dialog.module.css";
import {readPodLibrary,savePodLibrary} from "./pod-asset-library";
import {AgentUseConfigurationDialog,type AgentUseConfiguration,type ConfigurationMode} from "./agent-use-configuration-dialog";
import {ShowcasePODTaskDialog} from "./showcase-pod-task-dialog";
import {PodManagementWorkspace} from "./showcase-pod-management-dialog";
import {readAgentPreviewTemplates,writeAgentPreviewTemplates,serializeAgentTemplateForSharing,isShuomiAdaptationTemplate,SHUOMI_ADAPTATION_TEMPLATE_NAME,type AgentPreviewTemplate} from "./showcase-agent-template-store";

export type AgentPreviewDialog =
 | {kind:"introduction";title:string;description:string;tags:readonly string[];status:string}
 | {kind:"model";title:string;model:"official"|"custom"}
 | {kind:"use";title:string};
type CustomForm={provider:string;model:string;apiKey:string;endpoint:string};
type PodChatMessage={
 id:number;
 role:"user"|"assistant";
 kind:"text"|"reference"|"prompt"|"artwork";
 text:string;
 src?:string;
 prompt?:string;
 saved?:boolean;
};
function readableReference(value:string){
 if(value.startsWith("preview:personal:"))return value.slice("preview:personal:".length);
 if(value.startsWith("preview:official:"))return value.slice("preview:official:".length);
 if(value.startsWith("skill:"))return "已关联技能准确版本";
 if(value.startsWith("knowledge:"))return "已关联企业知识库";
 return value;
}

/* Static Pages preview: produce a clearly labeled local SVG mockup.
 * This is NOT AI inference. Swap for an authenticated image-generation endpoint
 * when the real model and billing flow are available. */
function makePodDemoArtwork(prompt:string):string{
 const safe=(value:string)=>value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
 const flower=/花|flower|floral|daisy/i.test(prompt);
 const cat=/猫|cat|kitten/i.test(prompt);
 const motif=flower
  ? '<g fill="#f3b9d7" stroke="#7a467b" stroke-width="8"><ellipse cx="256" cy="178" rx="37" ry="90"/><ellipse cx="256" cy="336" rx="37" ry="90"/><ellipse cx="178" cy="256" rx="90" ry="37"/><ellipse cx="334" cy="256" rx="90" ry="37"/><circle cx="256" cy="256" r="58" fill="#ffcb5f"/></g>'
  : cat
  ? '<g fill="#ddc5fa" stroke="#554078" stroke-width="9"><path d="M150 225 L166 123 L221 171 Q256 160 291 171 L346 123 L362 225 Q391 355 256 380 Q121 355 150 225Z"/><ellipse cx="215" cy="266" rx="8" ry="14" fill="#554078"/><ellipse cx="297" cy="266" rx="8" ry="14" fill="#554078"/><path d="M244 298 Q256 312 268 298" fill="none"/></g>'
  : '<g fill="#9f94f6" stroke="#6358a5" stroke-width="7"><path d="M256 106 L287 211 L397 211 L307 273 L341 385 L256 318 L171 385 L205 273 L115 211 L225 211Z"/></g>';
 const excerpt=safe(prompt.slice(0,24));
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#fcf8ff"/><circle cx="256" cy="252" r="198" fill="#f7edff" stroke="#c4b1e9" stroke-width="5"/>'+motif+'<rect x="36" y="415" width="440" height="70" rx="12" fill="#30294c"/><text x="256" y="439" fill="#fff" font-family="sans-serif" font-size="17" text-anchor="middle">LOCAL DEMO · NOT AI GENERATED</text><text x="256" y="466" fill="#e4dcff" font-family="sans-serif" font-size="16" text-anchor="middle">'+excerpt+'</text></svg>';
 return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
}

export function ShowcaseAgentDialog({dialog:info,onClose,onSaveModel,onSaveTemplate,organizationId="SM-ENT-000001",memberId="admin",administrator=true}:{
 dialog:AgentPreviewDialog;onClose:()=>void;organizationId?:string;memberId?:string;administrator?:boolean;
 onSaveModel:(title:string,model:"official"|"custom")=>void;
 onSaveTemplate?:(title:string,configuration:{skills:string[];knowledge:string[];imageOptimization:boolean;imageInstructions:string;podImageMode?:string;podPatternMode?:string;podQuantity?:number;podTransparent?:boolean;useConfig?:AgentUseConfiguration})=>void;
}){
 const ref=useRef<HTMLDialogElement>(null);
 const id=useId();
 const [selected,setSelected]=useState<"official"|"custom">(info.kind==="model"?info.model:"official");
 const [step,setStep]=useState<"source"|"custom">("source");
 const [custom,setCustom]=useState<CustomForm>({provider:"",model:"",apiKey:"",endpoint:""});
 const [message,setMessage]=useState("");
 const [skills,setSkills]=useState<string[]>([]);
 const [knowledge,setKnowledge]=useState<string[]>([]);
 const [imageOptimization,setImageOptimization]=useState(false);
 const [imageInstructions,setImageInstructions]=useState("");
 const [imageConfigured,setImageConfigured]=useState(false);
 const [showPreview,setShowPreview]=useState(false);
 const [saveNameOpen,setSaveNameOpen]=useState(false);
 const [templateManagerOpen,setTemplateManagerOpen]=useState(false);
 const [templateName,setTemplateName]=useState("");
 const [templateRename,setTemplateRename]=useState<string|null>(null);
 const [templateRenameValue,setTemplateRenameValue]=useState("");
 const [templateDelete,setTemplateDelete]=useState<string|null>(null);
 const [templateDetails,setTemplateDetails]=useState<string|null>(null);
 const [templateItems,setTemplateItems]=useState<Array<{id:string;name:string;createdAt:string;config:unknown}>>([]);
 const [podTaskOpen,setPodTaskOpen]=useState(false);
 const [podMaterialsOpen,setPodMaterialsOpen]=useState(false);
 const [podImageMode,setPodImageMode]=useState("AI重构模式");
 const [podPatternMode,setPodPatternMode]=useState("AI自动模式");
 const [podQuantity,setPodQuantity]=useState(3);
 const [podTransparent,setPodTransparent]=useState(false);
 const [podChatDraft,setPodChatDraft]=useState("");
 const [podChatImage,setPodChatImage]=useState("");
 const [podChatNotice,setPodChatNotice]=useState("");
 const [podMessages,setPodMessages]=useState<PodChatMessage[]>([]);
 const [podZoom,setPodZoom]=useState<{src:string;alt:string}|null>(null);
 const podMessageId=useRef(0);
 const podInputRef=useRef<HTMLTextAreaElement>(null);
 const podThreadRef=useRef<HTMLDivElement>(null);
 const podObjectUrls=useRef<string[]>([]);
 const [configMode,setConfigMode]=useState<ConfigurationMode|null>(null);
 const [useConfig,setUseConfig]=useState<AgentUseConfiguration>({});

 useEffect(()=>{
  const previous=document.activeElement;
  const element=ref.current;
  if(element&&!element.open)element.showModal();
  return()=>{element?.close();if(previous instanceof HTMLElement&&previous.isConnected)previous.focus();};
 },[]);

 useEffect(()=>{
  if(info.kind!=="use")return;
  try{
   const raw=sessionStorage.getItem("shuomi:demo-agent-template-v2:"+organizationId+":"+memberId+":"+info.title)??(organizationId==="SM-ENT-000001"&&memberId==="admin"?sessionStorage.getItem("shuomi-demo-agent-template-"+info.title):null);
   if(!raw)return;
   const data=JSON.parse(raw);
   if(Array.isArray(data.skills))setSkills(data.skills.filter((v:unknown)=>typeof v==="string"));
   if(Array.isArray(data.knowledge))setKnowledge(data.knowledge.filter((v:unknown)=>typeof v==="string"));
   if(typeof data.imageOptimization==="boolean")setImageOptimization(data.imageOptimization);
   if(typeof data.imageInstructions==="string"){setImageInstructions(data.imageInstructions);setImageConfigured(Boolean(data.imageInstructions.trim()));}
   if(typeof data.podImageMode==="string")setPodImageMode(data.podImageMode);
   if(typeof data.podPatternMode==="string")setPodPatternMode(data.podPatternMode);
   if(Number.isSafeInteger(data.podQuantity)&&data.podQuantity>=1&&data.podQuantity<=20)setPodQuantity(data.podQuantity);
   if(typeof data.podTransparent==="boolean")setPodTransparent(data.podTransparent);
   if(data.useConfig&&typeof data.useConfig==="object"){setUseConfig(data.useConfig);const cfg=data.useConfig as Record<string,unknown>;if(["optimizationSource","imageLanguage","imageBackground","selectedMainImages","selectedDetailImages","imageTasks"].some(key=>cfg[key]!==undefined))setImageConfigured(true);}
  }catch{/* A missing or malformed browser draft never prevents opening the dialog. */}
 },[info,organizationId,memberId]);
 useEffect(()=>()=>{for(const url of podObjectUrls.current)URL.revokeObjectURL(url);podObjectUrls.current=[];},[]);
 useEffect(()=>{if(podMessages.length)podThreadRef.current?.scrollTo({top:podThreadRef.current.scrollHeight,behavior:"smooth"});},[podMessages]);
 const isModel=info.kind==="model",isUse=info.kind==="use",isPod=info.title.includes("POD");
 const appendPodMessages=(entries:Omit<PodChatMessage,"id">[])=>{
  const next=entries.map(entry=>({...entry,id:++podMessageId.current}));
  setPodMessages(previous=>[...previous,...next]);
 };
 const applyPodChatPrompt=(prompt:string)=>{
  if(!prompt.trim()){setPodChatNotice("请先填写希望用于贴图生成的指令。");return;}
  setPodPatternMode("自定义指令模式");
  setUseConfig(old=>({...old,patternPrompt:prompt.trim()}));
  setPodChatNotice("已将指令应用到步骤 4 的自定义指令模式。");
 };
 const handlePodReference=(file?:File)=>{
  if(!file)return;
  if(!file.type.startsWith("image/")){setPodChatNotice("请上传图片文件。");return;}
  if(file.size>10*1024*1024){setPodChatNotice("参考图不能超过 10 MB。");return;}
  const url=URL.createObjectURL(file);
  podObjectUrls.current.push(url);
  setPodChatImage(file.name);
  appendPodMessages([{role:"user",kind:"reference",text:file.name,src:url}]);
  setPodChatNotice("已添加参考图。请描述图案、颜色与风格后整理指令；当前不支持自动识图。");
 };
 const organizeImagePrompt=()=>{
  if(!podChatImage){setPodChatNotice("请先上传印花参考图片。");return;}
  const prompt=podChatDraft.trim();
  if(!prompt){setPodChatNotice("图片已上传，请描述图案、颜色和风格后整理指令；当前不支持自动识图。");return;}
  appendPodMessages([
   {role:"user",kind:"text",text:prompt},
   {role:"assistant",kind:"prompt",text:prompt}
  ]);
  setPodChatDraft("");
  setPodChatNotice("已将你填写的参考图描述整理为可复制的指令，尚未执行 AI 图片识别。");
 };
 const generatePodArtwork=(input?:string)=>{
  const prompt=(input??podChatDraft).trim();
  if(!prompt){setPodChatNotice("请先输入印花设计指令。");return;}
  appendPodMessages([
   {role:"user",kind:"text",text:prompt},
   {role:"assistant",kind:"artwork",text:"印花图 · 本地演示（非 AI 生成）",src:makePodDemoArtwork(prompt),prompt,saved:false}
  ]);
  setPodChatDraft("");
  setPodChatNotice("已在聊天记录中显示本地印花示意。正式生图服务尚未接入。");
 };
 const savePodArtwork=(entry:PodChatMessage)=>{
  if(entry.kind!=="artwork"||!entry.src||!entry.prompt||entry.saved)return;
  const existing=readPodLibrary(organizationId,memberId);
  const asset={id:Date.now(),name:"POD本地示意图-"+new Date().toLocaleDateString("zh-CN"),category:"我的自定义分类",style:0,prompt:entry.prompt,dataUrl:entry.src,status:"演示预览"};
  const ok=savePodLibrary(organizationId,memberId,[...existing,asset]);
  if(ok)setPodMessages(previous=>previous.map(message=>message.id===entry.id?{...message,saved:true}:message));
  setPodChatNotice(ok?"已加入当前企业及成员的「我的素材库」（浏览器会话演示数据）。":"保存失败：浏览器会话存储空间不足或不可用。");
 };
 const copyPodPrompt=async(prompt:string)=>{
  try{
   if(!navigator.clipboard?.writeText)throw new Error("Clipboard unavailable");
   await navigator.clipboard.writeText(prompt);
   setPodChatNotice("指令已复制到剪贴板。");
  }catch{
   const input=document.createElement("textarea");
   input.value=prompt;
   input.setAttribute("readonly","");
   input.style.position="fixed";
   input.style.left="-9999px";
   document.body.appendChild(input);
   input.select();
   const copied=document.execCommand("copy");
   input.remove();
   setPodChatNotice(copied?"指令已复制到剪贴板。":"复制失败，请手动选择指令文本复制。");
  }
 };
 const editPodPrompt=(prompt:string)=>{
  setPodChatDraft(prompt);
  podInputRef.current?.focus();
  setPodChatNotice("已将指令放回输入框，可以继续修改。");
 };
 const toggle=(items:string[],set:(value:string[])=>void,item:string)=>set(items.includes(item)?items.filter(v=>v!==item):[...items,item]);
 const validCustom=custom.provider.trim()&&custom.model.trim()&&custom.apiKey.trim();
 const customSubmit=()=>{
  if(!validCustom){setMessage("请填写模型服务商、模型名称和 API Key。");return;}
  if(custom.endpoint.trim()){try{const url=new URL(custom.endpoint);if(url.protocol!=="https:")throw Error("HTTPS");}catch{setMessage("请输入有效的 HTTPS API 地址。");return;}}
  // This static showcase has no backend model verification. Never claim a real connection.
  setMessage("已检查必填项与地址格式。当前为演示页面，尚未连接模型服务，不能进行真实连接测试。");
 };
 const chooseCustom=()=>{setSelected("custom");setStep("custom");setMessage("");};
 const saveCustom=()=>{
  customSubmit();
  if(!validCustom)return;
  if(custom.endpoint.trim()){try{const url=new URL(custom.endpoint);if(url.protocol!=="https:")return;}catch{return;}}
  // Never store the key or endpoint in local or session storage.
  onSaveModel(info.title,"custom");
 };
 const saveTemplate=()=>{
  if(imageOptimization&&!imageConfigured&&!Object.keys(useConfig).some(k=>["optimizationSource","imageLanguage","imageBackground","selectedMainImages","selectedDetailImages","imageTasks"].includes(k))){setMessage("已开启图片优化，请先配置图片处理范围与要求。");return;}
  setSaveNameOpen(true);
 };
 const readTemplates=()=>readAgentPreviewTemplates(organizationId,memberId,info.title);
 const showTemplates=()=>{setTemplateItems(readTemplates());setTemplateManagerOpen(true);setShowPreview(true);};
 const templateFacts=(raw:unknown):Array<[string,string]>=>{
  if(!raw||typeof raw!=="object")return [["配置资料","没有可用的配置摘要"]];
  const c=raw as Record<string,unknown>,extra=c.useConfig&&typeof c.useConfig==="object"?c.useConfig as Record<string,unknown>:{};
  const labels=(value:unknown)=>Array.isArray(value)?value.filter((x):x is string=>typeof x==="string").join("、"):"";
  const option=(v:unknown,defaultValue="未设置")=>typeof v==="string"&&v.trim()?v:defaultValue;
  const selected=(v:unknown)=>Array.isArray(v)?v.filter((n):n is number=>Number.isInteger(n)&&n>=1&&n<=8).map(n=>"第"+n+"张").join("、")||"未选":"未选";
  const tasks=Array.isArray(extra.imageTasks)?extra.imageTasks.filter((v):v is Record<string,unknown>=>Boolean(v&&typeof v==="object")):[];
  const taskText=tasks.filter(t=>typeof t.prompt==="string"&&t.prompt.trim()&&Number.isInteger(t.position)&&Number(t.position)>=1&&Number(t.position)<=8).map(t=>option(t.target,"主图")+"第"+t.position+"张："+t.prompt).join("；")||"未设置";
  const imageFacts:Array<[string,string]>=[
   ["生图语言",option(extra.imageLanguage,"未设置（不指定）")],
   ["图片背景",option(extra.imageBackground,"不设置")+(extra.imageBackground==="自定义背景要求"?"："+option(extra.imageBackgroundCustom,"未填写"):"")],
   ["图片优化来源",option(extra.optimizationSource)],
   ["图片使用策略",option(extra.imageUse,"共用视觉素材")],
   ["共用素材来源",option(extra.sharedImageSource,"主图")],
   ["处理范围",option(extra.imageProcessingScope)],
   ["主图图片位置",selected(extra.selectedMainImages??extra.selectedImages)],
   ["详情图图片位置",selected(extra.selectedDetailImages??extra.selectedImages)],
   ["逐张图片要求",taskText],
   ["补充优化指令",option(c.imageInstructions)]
  ];
  return isPod?[
   ["图片生成",option(c.podImageMode)],
   ["知识库",labels(c.knowledge)||"未启用"],
   ["执行技能",labels(c.skills)||"未启用"],
   ["贴图素材",option(c.podPatternMode,"AI自动模式")],
   ["生成数量",typeof c.podQuantity==="number"&&Number.isFinite(c.podQuantity)?String(c.podQuantity)+" / 商品":"按模板配置"],
   ["透明背景",c.podTransparent===true?"启用":"关闭"],
   ...imageFacts
  ]:[
   ["执行技能",labels(c.skills)||"未启用"],
   ["知识库",labels(c.knowledge)||"未启用"],
   ["图片优化",c.imageOptimization?"启用":"未启用"],
   ...(c.imageOptimization?imageFacts:[])
  ];
 };
 const saveNamedTemplate=()=>{if(!templateName.trim()){setMessage("请填写模板名称。");return;}if(info.title==="商品优化智能体"&&templateName.trim()===SHUOMI_ADAPTATION_TEMPLATE_NAME){setMessage("「硕米适配」为系统内置模板，不能新建同名模板。");return;}const config={skills,knowledge,imageOptimization,imageInstructions,podImageMode:isPod?podImageMode:undefined,podPatternMode:isPod?podPatternMode:undefined,podQuantity:isPod?podQuantity:undefined,podTransparent:isPod?podTransparent:undefined,useConfig};const next=[{id:crypto.randomUUID(),name:templateName.trim(),createdAt:new Date().toLocaleDateString("zh-CN"),config},...readTemplates()];try{writeAgentPreviewTemplates(organizationId,memberId,info.title,next);}catch{setMessage("模板保存失败，请检查浏览器存储空间。");return;}onSaveTemplate?.(info.title,config);setSaveNameOpen(false);onClose();};
 const copyFullTemplate=async(item:AgentPreviewTemplate)=>{
  try{
   if(!navigator.clipboard?.writeText)throw Error("当前浏览器不支持直接复制，请改用下载配置");
   await navigator.clipboard.writeText(serializeAgentTemplateForSharing(info.title,item));
   setMessage("已复制「"+item.name+"」的完整保存配置，可直接粘贴到 ChatGPT；不会自动发送。");
  }catch{setMessage("复制失败：请使用「下载配置 JSON」并将文件发送到 ChatGPT。");}
 };
 const downloadFullTemplate=(item:AgentPreviewTemplate)=>{
  try{
   const content=serializeAgentTemplateForSharing(info.title,item);
   const blob=new Blob([content],{type:"application/json;charset=utf-8"});
   const url=URL.createObjectURL(blob);
   const link=document.createElement("a");
   link.href=url;link.download="shuomi-agent-template-"+item.id.replace(/[^a-zA-Z0-9_-]/g,"_")+".json";
   document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
   setMessage("已准备「"+item.name+"」的配置文件，请将下载的 JSON 上传到 ChatGPT。");
  }catch{setMessage("配置下载失败，请重新尝试。");}
 };
 const renameTemplate=(id:string)=>{if(isShuomiAdaptationTemplate(info.title,id)){setMessage("系统内置「硕米适配」模板不可重命名。");return;}const next=templateItems.map(x=>x.id===id?{...x,name:templateRenameValue.trim()||x.name}:x);setTemplateItems(next);try{writeAgentPreviewTemplates(organizationId,memberId,info.title,next);}catch{setMessage("模板重命名未保存。");return;}setTemplateRename(null);};
 const deleteTemplate=(id:string)=>{if(isShuomiAdaptationTemplate(info.title,id)){setMessage("系统内置「硕米适配」模板不可删除。");return;}const next=templateItems.filter(x=>x.id!==id);setTemplateItems(next);try{writeAgentPreviewTemplates(organizationId,memberId,info.title,next);}catch{setMessage("模板删除未保存。");return;}setTemplateDelete(null);setTemplateDetails(null);};
 return <dialog ref={ref} className={`${styles.dialog} ${isUse?styles.useDialog:""}`} aria-labelledby={id}
   onCancel={event=>{event.preventDefault();if(podZoom){setPodZoom(null);return;}if(saveNameOpen){setSaveNameOpen(false);return;}if(templateManagerOpen){setTemplateManagerOpen(false);return;}onClose();}}
   onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
  {podZoom?<div className={styles.podZoomOverlay} onClick={event=>{if(event.target===event.currentTarget)setPodZoom(null);}}><section className={styles.podZoomPanel} role="dialog" aria-modal="true" aria-label="POD图片放大预览"><header><strong>图片预览</strong><button type="button" aria-label="关闭图片预览" onClick={()=>setPodZoom(null)}>关闭</button></header><img src={podZoom.src} alt={podZoom.alt}/><small>点击关闭返回聊天记录，演示图不是 AI 生成结果。</small></section></div>:null}
  {podTaskOpen?<ShowcasePODTaskDialog organizationId={organizationId} memberId={memberId} administrator={administrator} onClose={()=>setPodTaskOpen(false)} onTemplate={()=>setPodTaskOpen(false)}/>:null}
  {podMaterialsOpen?<PodManagementWorkspace organizationId={organizationId} memberId={memberId} onClose={()=>setPodMaterialsOpen(false)}/>:null}
  {configMode?<AgentUseConfigurationDialog mode={configMode} agentKind={isPod?"pod":"product"} organizationId={organizationId} memberId={memberId} initial={{...useConfig,selectedSkills:skills,selectedKnowledge:knowledge}} onClose={()=>setConfigMode(null)} onSave={value=>{
   setUseConfig(prev=>({...prev,...value}));
   if(value.selectedSkills)setSkills(value.selectedSkills);
   if(value.selectedKnowledge)setKnowledge(value.selectedKnowledge);
   if(configMode==="product-image"){setImageOptimization(true);setImageConfigured(true);setMessage("");}
   if(configMode==="pod-pattern-custom"&&value.patternPrompt)setImageInstructions(value.patternPrompt);
   setConfigMode(null);
  }}/>:null}
  {saveNameOpen?<div className={styles.nestedOverlay} onMouseDown={e=>{if(e.target===e.currentTarget)setSaveNameOpen(false)}}><section className={styles.nestedDialog} role="dialog" aria-modal="true" aria-label="保存智能体模板"><header><div><h2>{isPod?"保存POD模板":"保存为模板"}</h2><p>为当前配置命名，之后可在对应智能体模板中复用。</p></div><button type="button" aria-label="关闭模板保存弹窗" onClick={()=>setSaveNameOpen(false)}>×</button></header><form onSubmit={e=>{e.preventDefault();saveNamedTemplate();}}><label>模板名称<input aria-label="模板名称" required maxLength={60} value={templateName} onChange={e=>setTemplateName(e.target.value)} placeholder={isPod?"例如：POD快速刊登":"请输入模板名称"}/></label><p>{isPod?"模板将保存图片生成、知识库、贴图素材和生成数量等配置。":"模板只保存当前演示会话中的配置。"} 不会自动执行任务或扣积分。</p><footer><button type="button" onClick={()=>setSaveNameOpen(false)}>取消</button><button className={styles.primary} type="submit">保存模板</button></footer></form></section></div>:null}
  {templateManagerOpen?<div className={styles.nestedOverlay} onMouseDown={e=>{if(e.target===e.currentTarget)setTemplateManagerOpen(false)}}><section className={styles.nestedDialog} role="dialog" aria-modal="true" aria-label="模板管理"><header><div><h2>{isPod?"POD刊登模板":"模板管理"}</h2><p>查看和管理当前智能体的配置模板，可查看配置、重命名或删除。</p></div><button type="button" aria-label="关闭模板管理弹窗" onClick={()=>setTemplateManagerOpen(false)}>×</button></header><div className={styles.templateList}>{templateItems.length?templateItems.map(item=><article key={item.id}><strong>{item.name}</strong><small>{isPod?templateFacts(item.config).slice(0,4).map(([,v])=>v).join(" · "):"保存时间："+item.createdAt}</small>{templateRename===item.id?<div className={styles.templateInline}><input aria-label="重命名模板" value={templateRenameValue} onChange={e=>setTemplateRenameValue(e.target.value)} maxLength={60}/><button type="button" onClick={()=>setTemplateRename(null)}>取消</button><button type="button" className={styles.primary} onClick={()=>renameTemplate(item.id)}>保存</button></div>:templateDelete===item.id?<div className={styles.templateInline}><span>确认删除此演示模板？</span><button type="button" onClick={()=>setTemplateDelete(null)}>取消</button><button type="button" className={styles.primary} onClick={()=>deleteTemplate(item.id)}>确认删除</button></div>:<div className={styles.templateInline}><button type="button" onClick={()=>setTemplateDetails(templateDetails===item.id?null:item.id)}>查看配置</button><button type="button" onClick={()=>void copyFullTemplate(item)}>复制完整配置</button><button type="button" onClick={()=>downloadFullTemplate(item)}>下载配置 JSON</button>{isShuomiAdaptationTemplate(info.title,item.id)?<small>系统内置 · 不可重命名、不可删除</small>:<><button type="button" onClick={()=>{setTemplateRename(item.id);setTemplateRenameValue(item.name)}}>重命名</button><button type="button" onClick={()=>setTemplateDelete(item.id)}>删除</button></>}</div>}{templateDetails===item.id?<div className={styles.templateSummary} role="region" aria-label={"配置详情："+item.name}><h3>{item.name} · 配置摘要</h3><dl>{templateFacts(item.config).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><small>以下为完整配置摘要；使用「复制完整配置」或「下载配置 JSON」可保留所有原始字段，供核对、备份或发送至 ChatGPT。不会自动上传到外部服务。</small></div>:null}</article>):<p>暂无已保存模板。可返回当前智能体使用页创建模板。</p>}</div>{message?<p role="status" className={styles.inlineNotice}>{message}</p>:null}<footer><button className={styles.primary} type="button" onClick={()=>setTemplateManagerOpen(false)}>关闭</button></footer></section></div>:null}
  <header className={`${styles.heading} ${isUse&&!isPod?styles.productHeading:""}`}>
   {isUse&&!isPod?<small className={styles.productBreadcrumb}>我的智能体 / 商品优化智能体</small>:null}<h2 id={id}>{isUse?info.title:isModel?(step==="custom"?"自定义模型":"模型设置"):info.title}</h2>
   {isUse&&!isPod?<button type="button" className={`${styles.primary} ${styles.productViewTemplate}`} onClick={showTemplates}>查看模板</button>:null}
   <button type="button" aria-label="关闭弹窗" className={styles.close} onClick={onClose}>×</button>
   <p>{isUse?(info.title.includes("POD")?"按需配置POD图片、文案与技能；保存后进入刊登流程使用。":"技能、知识库和图片优化均可按需配置；保存后可在「已适配」流程中调用。"):isModel?(step==="custom"?"接入自己的模型服务，保存后该智能体优先使用此配置。":"选择该智能体执行任务时使用的模型来源。"):info.description}</p>
  </header>
  {info.kind==="introduction"?<>
   <section aria-label="智能体能力与状态" className={styles.info}>
    <h3>智能体介绍</h3><div className={styles.tags}>{info.tags.map(tag=><span key={tag}>{tag}</span>)}</div>
    <p>当前状态：{info.status}</p><p className={styles.demoNote}>此处展示原型中的能力介绍，不会直接创建任务或变更企业配置。</p>
   </section><footer className={styles.footer}><button className={styles.primary} type="button" onClick={onClose}>关闭</button></footer>
  </>:info.kind==="model"?step==="custom"?<>
   <form className={styles.customForm} onSubmit={e=>{e.preventDefault();saveCustom();}}>
    <label>模型服务商<input aria-label="模型服务商" autoComplete="off" placeholder="例如：OpenAI / Anthropic / 自建服务" value={custom.provider} onChange={e=>setCustom(v=>({...v,provider:e.target.value}))} required/></label>
    <label>模型名称<input aria-label="模型名称" autoComplete="off" placeholder="例如：gpt-5 / claude / 自定义模型名" value={custom.model} onChange={e=>setCustom(v=>({...v,model:e.target.value}))} required/></label>
    <label>API Key<input aria-label="API Key" type="password" autoComplete="new-password" placeholder="请输入 API Key" value={custom.apiKey} onChange={e=>setCustom(v=>({...v,apiKey:e.target.value}))} required/></label>
    <label>API 地址（可选）<input aria-label="API 地址（可选）" type="url" autoComplete="off" placeholder="使用自定义服务地址时填写" value={custom.endpoint} onChange={e=>setCustom(v=>({...v,endpoint:e.target.value}))}/></label>
    <button className={styles.secondary} type="button" onClick={customSubmit}>测试连接</button>
    {message?<p role="status" className={styles.inlineNotice}>{message}</p>:null}
    <p className={styles.securityNote}>此演示不会发送 API 请求，也不会存储 API Key；保存仅记录自定义模型的选择，不代表真实接入成功。</p>
    <footer className={styles.footer}><button type="button" className={styles.secondary} onClick={()=>{setStep("source");setMessage("");}}>返回</button><button type="submit" className={styles.primary}>保存并启用</button></footer>
   </form>
  </>:<>
   <section className={styles.modelOptions} aria-label="模型来源">
    <h3>模型来源</h3>
    <button type="button" className={styles.modelOption} aria-pressed={selected==="official"} onClick={()=>setSelected("official")}>
     <span><strong>官方模型</strong><small>由硕米提供并维护，开箱即用，无需配置 API。</small></span><b>{selected==="official"?"已启用":"选择"}</b>
    </button>
    <button type="button" className={styles.modelOption} aria-pressed={selected==="custom"} onClick={chooseCustom}>
     <span><strong>自定义模型</strong><small>使用自己的模型服务与 API，可按需要切换。</small></span><b>配置并启用</b>
    </button>
    <div className={styles.current}><strong>当前使用：{selected==="official"?"硕米官方推荐模型":"自定义模型（演示选择）"}</strong><p>{selected==="official"?"如切换到自定义模型，可随时恢复官方模型。":"自定义模型需完成配置，真实 API 连接尚未开放。"}</p></div>
   </section>
   <footer className={styles.footer}><button type="button" className={styles.secondary} onClick={onClose}>取消</button><button type="button" className={styles.primary} onClick={()=>selected==="custom"?chooseCustom():onSaveModel(info.title,"official")}>保存设置</button></footer>
  </>
  :isPod?<><div className={styles.savedTemplate}><button className={styles.secondary} type="button" onClick={()=>setPodMaterialsOpen(true)}>POD素材管理工具</button><button className={styles.secondary} type="button" onClick={showTemplates}>查看模板</button><button className={styles.primary} type="button" onClick={()=>setPodTaskOpen(true)}>创建POD刊登任务</button><small>素材、模板与刊登任务分别管理，创建刊登任务需要选择店铺和真实商品。</small></div><div className={styles.useLayout}>
   <div className={styles.useSteps}>
    <section className={styles.useStep}><h3>步骤 1 · 图片生成方式</h3><p>选择本次 POD 商品图片的生成方式，可在生成刊登方案前调整。</p><div className={styles.podModes}>{[["AI重构模式","引用技能 · 官方方案 · 自定义指令"],["混合模式","支持固定图片 + AI 生成，灵活组合主图与详情图"]].map(([name,desc])=><button key={name} type="button" aria-pressed={podImageMode===name} onClick={()=>{setPodImageMode(name);setConfigMode(name==="混合模式"?"pod-hybrid":"pod-ai");}}><strong>{name}</strong><small>{desc}</small></button>)}</div><p>AI 相关能力按积分计费（实际计费未接入）。</p></section>
    <section className={styles.useStep}><h3>步骤 2 · 是否启用知识库</h3><div className={styles.productConfigRow}><div className={styles.productRowText}><strong>使用知识库</strong><small>按需引用已选择的知识资料；未选择时 AI 不读取知识库。</small></div><span className={styles.productStatus}>● {knowledge.length?"已选 "+knowledge.length+" 项":"未启用"}</span><button type="button" className={styles.primary} onClick={()=>setConfigMode("knowledge")}>选择知识库</button></div></section>
    <section className={styles.useStep}><h3>步骤 3 · 启用技能</h3><div className={styles.productConfigRow}><div className={styles.productRowText}><strong>启用执行技能</strong><small>只应用实际选择的我的技能或团队技能，未选择时不自动运行。</small></div><span className={styles.productStatus}>● {skills.length?"已选 "+skills.length+" 项":"未启用"}</span><button type="button" className={styles.primary} onClick={()=>setConfigMode("skills")}>选择技能</button></div></section>
    <section className={styles.useStep}><h3>步骤 4 · 贴图素材</h3><p>选择本次贴图素材的生成方式，点击模式卡进入配置。</p><div className={styles.podModes}>{[["AI自动模式","AI自动确定主题、风格、元素与排版"],["图片裂变模式","根据参考图片裂变多套新贴图"],["自定义指令模式","依据创作指令生成个性化贴图"]].map(([name,desc])=><button type="button" key={name} aria-pressed={podPatternMode===name} onClick={()=>{setPodPatternMode(name);if(name==="图片裂变模式")setConfigMode("pod-pattern-split");else if(name==="自定义指令模式")setConfigMode("pod-pattern-custom");}}><strong>{name}</strong><small>{desc}</small></button>)}</div><div className={styles.imageInstructions}><p>当前配置：{podPatternMode}{useConfig.splitStrength&&podPatternMode==="图片裂变模式"?" · "+useConfig.splitStrength:""}{useConfig.patternPrompt&&podPatternMode==="自定义指令模式"?" · 自定义指令已填写":""}</p>{podPatternMode!=="AI自动模式"?<button className={styles.secondary} type="button" onClick={()=>setConfigMode(podPatternMode==="图片裂变模式"?"pod-pattern-split":"pod-pattern-custom")}>配置当前模式</button>:null}</div><label className={styles.podCheck}><input type="checkbox" checked={podTransparent} onChange={e=>setPodTransparent(e.target.checked)}/>生成透明背景</label></section>
    <section className={styles.useStep}><h3>步骤 5 · 生成数量</h3><p>执行时按批次商品数量自动计算。</p><div className={styles.podCount}><span>每个商品生成</span><button aria-label="减少生成数量" type="button" onClick={()=>setPodQuantity(v=>Math.max(1,v-1))}>−</button><strong>{podQuantity}</strong><button aria-label="增加生成数量" type="button" onClick={()=>setPodQuantity(v=>Math.min(20,v+1))}>+</button><span>个</span></div><div className={styles.actionsRow}><button type="button" className={styles.secondary} onClick={()=>setShowPreview(v=>!v)}>预览配置</button><button type="button" className={styles.primary} onClick={saveTemplate}>保存为模板</button></div>{showPreview?<p role="status" className={styles.inlineNotice}>{podImageMode} · {podPatternMode} · {podQuantity} 个 · {podTransparent?"透明 PNG":"普通背景"} · 已选技能 {skills.length} 项 · 已选知识 {knowledge.length} 项</p>:null}</section>
   </div><aside className={styles.useHelp}><h3>硕米POD助手</h3><p>上传参考图并描述图案，或直接输入印花指令。图片与指令统一在聊天记录中展示。</p>
     <div className={styles.podHelpChat}>
      <div className={styles.podChatThread} ref={podThreadRef} role="log" aria-label="POD助手聊天记录" aria-live="polite">
       {podMessages.length===0?<p className={styles.podChatEmpty}>在下方输入指令，生成结果会显示在这里。图片可放大，指令可复制。</p>:podMessages.map(entry=>
        <article key={entry.id} className={`${styles.podChatBubble} ${entry.role==="user"?styles.podChatUser:styles.podChatAssistant}`} data-pod-message={entry.kind}>
         <small>{entry.role==="user"?"我":"硕米POD助手"}</small>
         {entry.kind==="reference"?<><span>上传了参考图：{entry.text}</span><button type="button" className={styles.podChatImageButton} aria-label={"放大参考图："+entry.text} onClick={()=>entry.src&&setPodZoom({src:entry.src,alt:"参考图片："+entry.text})}><img src={entry.src} alt={"参考图片："+entry.text}/></button></>
         :entry.kind==="artwork"?<><strong>{entry.text}</strong><button type="button" className={styles.podChatImageButton} aria-label={"放大印花图："+entry.id} onClick={()=>entry.src&&setPodZoom({src:entry.src,alt:"本地演示印花图"})}><img src={entry.src} alt="本地示意印花图（非 AI 生成），点击放大"/></button><div className={styles.podChatMessageActions}><button type="button" disabled={entry.saved} onClick={()=>savePodArtwork(entry)}>{entry.saved?"已加入我的素材库":"加入我的素材库"}</button><button type="button" onClick={()=>editPodPrompt(entry.prompt??"")}>重新设计</button></div></>
         :entry.kind==="prompt"?<div className={styles.podChatPrompt}><div><strong>整理后的印花指令</strong><button type="button" onClick={()=>void copyPodPrompt(entry.text)}>复制指令</button></div><p>{entry.text}</p><div className={styles.podChatMessageActions}><button type="button" onClick={()=>editPodPrompt(entry.text)}>继续编辑</button><button type="button" onClick={()=>applyPodChatPrompt(entry.text)}>应用到步骤 4</button></div></div>
         :<p>{entry.text}</p>}
        </article>
       )}
      </div>
      <div className={styles.podChatComposer}>
       <label>贴图生成指令<textarea ref={podInputRef} aria-label="POD助手补充要求" value={podChatDraft} onChange={e=>setPodChatDraft(e.target.value)} placeholder="例如：美式手绘猫咪印花、简洁线条、透明背景……" rows={4}/></label>
       <div className={styles.podHelpActions}><label className={styles.secondary}>上传参考图<input type="file" accept="image/*" aria-label="上传POD印花参考图" onChange={e=>{handlePodReference(e.target.files?.[0]);e.target.value="";}}/></label><button type="button" className={styles.secondary} onClick={organizeImagePrompt}>整理图片指令</button><button type="button" className={styles.primary} onClick={()=>generatePodArtwork()}>生成印花图（演示）</button></div>
       {podChatNotice?<p role="status" className={styles.podChatNotice}>{podChatNotice}</p>:null}
      </div>
     </div>
     <p>图片为本地示意，非 AI 生成；真实识图、生图和扣积分尚未接入。</p>
    </aside>
  </div></>
  :<div className={styles.productLayout}>
   <div className={styles.productSteps}>
    <section className={styles.productStep}><h3>步骤 1 · 选择技能（可选）</h3><p>技能为可选项，可不选择；只运行实际启用的优化配置。</p><div className={styles.productConfigRow}><div className={styles.productRowText}><strong>启用执行技能</strong><small>按需选择技能；未选择也可以保存模板。</small></div><span className={styles.productStatus}>● {skills.length?"已启用 "+skills.length+" 项":"未启用"}</span><button type="button" className={styles.primary} onClick={()=>setConfigMode("skills")}>选择技能</button></div></section>
    <section className={styles.productStep}><h3>步骤 2 · 选择知识库（可选）</h3><p>按需引用平台规则、品牌规范和商品资料。</p><div className={styles.productConfigRow}><div className={styles.productRowText}><strong>使用知识库</strong><small>仅使用已选知识，不会自动引用整个知识库。</small></div><span className={styles.productStatus}>● {knowledge.length?"已启用 "+knowledge.length+" 项":"未启用"}</span><button type="button" className={styles.primary} onClick={()=>setConfigMode("knowledge")}>选择知识库</button></div></section>
    <section className={styles.productStep}><h3>步骤 3 · 配置图片优化（按需）</h3><p>按需开启图片优化；关闭时不会修改图片。</p><div className={styles.productConfigRow}><div className={styles.productRowText}><strong>AI 图片优化设置</strong><small>开启后可设置优化方式、图片策略，以及主图 / 详情图的具体位置。</small></div><button type="button" className={imageOptimization?styles.productEnabled:styles.productToggle} onClick={()=>setImageOptimization(v=>!v)}>{imageOptimization?"关闭":"开启"}</button><button type="button" className={styles.productSettings} onClick={()=>setConfigMode("product-image")}>设置</button></div>{imageOptimization&&imageConfigured?<p className={styles.productInlineHint}>图片优化规则已配置，可以点击「设置」修改。</p>:null}</section>
    <section className={styles.productStep}><h3>步骤 4 · 保存模板</h3><div className={styles.productFinalRow}><p>按需配置后保存模板；执行结果进入「待审核」。</p><div className={styles.productFinalActions}><button type="button" className={styles.secondary} onClick={()=>setShowPreview(v=>!v)}>预览优化范围</button><button type="button" className={styles.primary} onClick={saveTemplate}>保存为模板</button></div></div>{showPreview?<p role="status" className={styles.inlineNotice}>技能：{skills.map(readableReference).join("、")||"未启用"}；知识库：{knowledge.map(readableReference).join("、")||"未启用"}；图片优化：{imageOptimization?"开启":"关闭"}。此处仅保存演示配置，不会自动执行任务。</p>:null}</section>
    {message?<p role="status" className={styles.inlineNotice}>{message}</p>:null}
   </div>
   <aside className={styles.productHelp}><h3>使用说明</h3><p>技能可按需提供处理规则，知识库提供参考依据。</p><h4>配置说明</h4><div className={styles.productHelpCard}><strong>技能按需启用</strong><p>仅执行已选技能；未选择时不运行技能处理。</p></div><div className={styles.productHelpCard}><strong>知识库提供参考依据</strong><p>引用已选知识，不会加载全部资料。</p></div><div className={styles.productHelpCard}><strong>图片优化</strong><p>开启后可指定主图和详情图。</p></div><h4>职责边界</h4><div className={styles.productHelpCard}><p>商品属性、SKU 和变体关系统一由「待补全」管理。</p></div><h4>结果去向</h4><p className={styles.productResult}>已适配调用 · 待审核 · 发布</p></aside>
  </div>
  }
 </dialog>;
}
