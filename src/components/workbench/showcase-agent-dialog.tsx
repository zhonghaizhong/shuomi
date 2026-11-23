"use client";

import {useEffect,useId,useRef,useState} from "react";
import styles from "./showcase-agent-dialog.module.css";
import {AgentUseConfigurationDialog,type AgentUseConfiguration,type ConfigurationMode} from "./agent-use-configuration-dialog";
import {ShowcasePODTaskDialog} from "./showcase-pod-task-dialog";
import {PodManagementWorkspace} from "./showcase-pod-management-dialog";

export type AgentPreviewDialog =
 | {kind:"introduction";title:string;description:string;tags:readonly string[];status:string}
 | {kind:"model";title:string;model:"official"|"custom"}
 | {kind:"use";title:string};
type CustomForm={provider:string;model:string;apiKey:string;endpoint:string};
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
 const [podChatPrompt,setPodChatPrompt]=useState("");
 const [podChatImage,setPodChatImage]=useState("");
 const [podChatNotice,setPodChatNotice]=useState("");
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
   if(data.useConfig&&typeof data.useConfig==="object")setUseConfig(data.useConfig);
  }catch{/* A missing or malformed browser draft never prevents opening the dialog. */}
 },[info,organizationId,memberId]);
 const isModel=info.kind==="model",isUse=info.kind==="use",isPod=info.title.includes("POD");
 const applyPodChatPrompt=()=>{if(!podChatPrompt.trim()){setPodChatNotice("请先填写希望用于贴图生成的指令。");return;}setPodPatternMode("自定义指令模式");setUseConfig(old=>({...old,patternPrompt:podChatPrompt.trim()}));setPodChatNotice("已将指令应用到贴图素材配置，可打开「自定义指令模式」继续编辑。")};
 const handlePodReference=(file?:File)=>{if(!file)return;if(!file.type.startsWith("image/")){setPodChatNotice("请上传图片文件。");return;}setPodChatImage(file.name);setPodChatNotice("参考图「"+file.name+"」已选择；当前演示未接入图片识别服务，请补充或编辑指令后应用。")};
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
  if(imageOptimization&&!imageConfigured){setMessage("已开启图片优化，请先填写图片优化设置。");return;}
  setSaveNameOpen(true);
 };
 const templateKey="shuomi:demo-agent-templates-v2:"+organizationId+":"+memberId+":"+info.title;
 const readTemplates=():Array<{id:string;name:string;createdAt:string;config:unknown}>=>{try{const raw=sessionStorage.getItem(templateKey);if(raw){const parsed=JSON.parse(raw);return Array.isArray(parsed)?parsed.filter(x=>x&&typeof x.id==="string"&&typeof x.name==="string"):[];}if(organizationId!=="SM-ENT-000001"||memberId!=="admin")return [];const existing=sessionStorage.getItem("shuomi-demo-agent-templates-"+info.title);if(existing){const parsed=JSON.parse(existing);return Array.isArray(parsed)?parsed.filter(x=>x&&typeof x.id==="string"&&typeof x.name==="string"):[]}const legacy=sessionStorage.getItem("shuomi-demo-agent-template-"+info.title);return legacy?[{id:"legacy-template",name:"已有演示模板",createdAt:"历史配置",config:JSON.parse(legacy)}]:[];}catch{return []}};
 const showTemplates=()=>{setTemplateItems(readTemplates());setTemplateManagerOpen(true);setShowPreview(true);};
 const templateFacts=(raw:unknown):Array<[string,string]>=>{
  if(!raw||typeof raw!=="object")return [["配置资料","没有可用的配置摘要"]];
  const c=raw as Record<string,unknown>,extra=c.useConfig&&typeof c.useConfig==="object"?c.useConfig as Record<string,unknown>:{};
  const labels=(value:unknown)=>Array.isArray(value)?value.filter((x):x is string=>typeof x==="string").join("、"):"";
  return isPod?[
   ["图片生成",typeof c.podImageMode==="string"?c.podImageMode:"未设置"],
   ["知识库",labels(c.knowledge)||"未启用"],
   ["执行技能",labels(c.skills)||"未启用"],
   ["贴图素材",typeof c.podPatternMode==="string"?c.podPatternMode:"AI自动模式"],
   ["生成数量",Number.isFinite(c.podQuantity)?String(c.podQuantity)+" / 商品":"按模板配置"],
   ["透明背景",c.podTransparent===true?"启用":"关闭"],
   ["生图语言",typeof extra.imageLanguage==="string"?extra.imageLanguage:"未设置"],
   ["图片底色",typeof extra.imageBackground==="string"?extra.imageBackground:"未设置"]
  ]:[
   ["执行技能",labels(c.skills)||"未启用"],
   ["知识库",labels(c.knowledge)||"未启用"],
   ["图片优化",c.imageOptimization?"启用":"未启用"]
  ];
 };
 const saveNamedTemplate=()=>{if(!templateName.trim()){setMessage("请填写模板名称。");return;}const config={skills,knowledge,imageOptimization,imageInstructions,podImageMode:isPod?podImageMode:undefined,podPatternMode:isPod?podPatternMode:undefined,podQuantity:isPod?podQuantity:undefined,podTransparent:isPod?podTransparent:undefined,useConfig};const next=[{id:crypto.randomUUID(),name:templateName.trim(),createdAt:new Date().toLocaleDateString("zh-CN"),config},...readTemplates()];try{sessionStorage.setItem(templateKey,JSON.stringify(next));}catch{}onSaveTemplate?.(info.title,config);setSaveNameOpen(false);onClose();};
 const renameTemplate=(id:string)=>{const next=templateItems.map(x=>x.id===id?{...x,name:templateRenameValue.trim()||x.name}:x);setTemplateItems(next);try{sessionStorage.setItem(templateKey,JSON.stringify(next));}catch{}setTemplateRename(null);};
 const deleteTemplate=(id:string)=>{const next=templateItems.filter(x=>x.id!==id);setTemplateItems(next);try{sessionStorage.setItem(templateKey,JSON.stringify(next));if(next.length){sessionStorage.setItem(templateKey,JSON.stringify(next));}else{sessionStorage.removeItem(templateKey);}}catch{}setTemplateDelete(null);setTemplateDetails(null);};
 return <dialog ref={ref} className={`${styles.dialog} ${isUse?styles.useDialog:""}`} aria-labelledby={id}
   onCancel={event=>{event.preventDefault();if(saveNameOpen){setSaveNameOpen(false);return;}if(templateManagerOpen){setTemplateManagerOpen(false);return;}onClose();}}
   onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
  {podTaskOpen?<ShowcasePODTaskDialog organizationId={organizationId} memberId={memberId} administrator={administrator} onClose={()=>setPodTaskOpen(false)} onTemplate={()=>setPodTaskOpen(false)}/>:null}
  {podMaterialsOpen?<PodManagementWorkspace onClose={()=>setPodMaterialsOpen(false)}/>:null}
  {configMode?<AgentUseConfigurationDialog mode={configMode} initial={{...useConfig,selectedSkills:skills,selectedKnowledge:knowledge}} onClose={()=>setConfigMode(null)} onSave={value=>{
   setUseConfig(prev=>({...prev,...value}));
   if(value.selectedSkills)setSkills(value.selectedSkills);
   if(value.selectedKnowledge)setKnowledge(value.selectedKnowledge);
   if(configMode==="product-image"){setImageConfigured(true);setMessage("");}
   if(configMode==="pod-pattern-custom"&&value.patternPrompt)setImageInstructions(value.patternPrompt);
   setConfigMode(null);
  }}/>:null}
  {saveNameOpen?<div className={styles.nestedOverlay} onMouseDown={e=>{if(e.target===e.currentTarget)setSaveNameOpen(false)}}><section className={styles.nestedDialog} role="dialog" aria-modal="true" aria-label="保存智能体模板"><header><div><h2>{isPod?"保存POD模板":"保存为模板"}</h2><p>为当前配置命名，之后可在对应智能体模板中复用。</p></div><button type="button" aria-label="关闭模板保存弹窗" onClick={()=>setSaveNameOpen(false)}>×</button></header><form onSubmit={e=>{e.preventDefault();saveNamedTemplate();}}><label>模板名称<input aria-label="模板名称" required maxLength={60} value={templateName} onChange={e=>setTemplateName(e.target.value)} placeholder={isPod?"例如：POD快速刊登":"请输入模板名称"}/></label><p>{isPod?"模板将保存图片生成、知识库、贴图素材和生成数量等配置。":"模板只保存当前演示会话中的配置。"} 不会自动执行任务或扣积分。</p><footer><button type="button" onClick={()=>setSaveNameOpen(false)}>取消</button><button className={styles.primary} type="submit">保存模板</button></footer></form></section></div>:null}
  {templateManagerOpen?<div className={styles.nestedOverlay} onMouseDown={e=>{if(e.target===e.currentTarget)setTemplateManagerOpen(false)}}><section className={styles.nestedDialog} role="dialog" aria-modal="true" aria-label="模板管理"><header><div><h2>{isPod?"POD刊登模板":"模板管理"}</h2><p>查看和管理当前智能体的配置模板，可查看配置、重命名或删除。</p></div><button type="button" aria-label="关闭模板管理弹窗" onClick={()=>setTemplateManagerOpen(false)}>×</button></header><div className={styles.templateList}>{templateItems.length?templateItems.map(item=><article key={item.id}><strong>{item.name}</strong><small>{isPod?templateFacts(item.config).slice(0,4).map(([,v])=>v).join(" · "):"保存时间："+item.createdAt}</small>{templateRename===item.id?<div className={styles.templateInline}><input aria-label="重命名模板" value={templateRenameValue} onChange={e=>setTemplateRenameValue(e.target.value)} maxLength={60}/><button type="button" onClick={()=>setTemplateRename(null)}>取消</button><button type="button" className={styles.primary} onClick={()=>renameTemplate(item.id)}>保存</button></div>:templateDelete===item.id?<div className={styles.templateInline}><span>确认删除此演示模板？</span><button type="button" onClick={()=>setTemplateDelete(null)}>取消</button><button type="button" className={styles.primary} onClick={()=>deleteTemplate(item.id)}>确认删除</button></div>:<div className={styles.templateInline}><button type="button" onClick={()=>setTemplateDetails(templateDetails===item.id?null:item.id)}>查看配置</button><button type="button" onClick={()=>{setTemplateRename(item.id);setTemplateRenameValue(item.name)}}>重命名</button><button type="button" onClick={()=>setTemplateDelete(item.id)}>删除</button></div>}{templateDetails===item.id?<div className={styles.templateSummary} role="region" aria-label={"配置详情："+item.name}><h3>{item.name} · 配置摘要</h3><dl>{templateFacts(item.config).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><small>以实际保存的模板记录为准；保存配置不会自动运行智能体。</small></div>:null}</article>):<p>暂无已保存模板。可返回当前智能体使用页创建模板。</p>}</div><footer><button className={styles.primary} type="button" onClick={()=>setTemplateManagerOpen(false)}>关闭</button></footer></section></div>:null}
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
   </div><aside className={styles.useHelp}><h3>硕米POD助手</h3><p>上传印花图后可整理生成指令；当前演示不调用 AI 识图，不会虚构识别结果。</p>
     <div className={styles.podHelpChat}>
      {podChatImage?<p>参考图片：{podChatImage}</p>:<p>可上传参考印花图，或者直接填写创作要求。</p>}
      <label>贴图生成指令<textarea aria-label="POD助手补充要求" value={podChatDraft} onChange={e=>setPodChatDraft(e.target.value)} placeholder="例如：美式手绘猫咪印花、简洁线条、透明背景、适合服装印制……" rows={4}/></label>
      <div className={styles.podHelpActions}><label className={styles.secondary}>上传印花图<input type="file" accept="image/*" aria-label="上传POD印花参考图" onChange={e=>handlePodReference(e.target.files?.[0])}/></label><button type="button" className={styles.primary} onClick={()=>{if(!podChatDraft.trim()){setPodChatNotice("请先填写创作要求。");return;}setPodChatPrompt(podChatDraft.trim());setPodChatNotice("已整理为待应用的用户指令；当前没有真实 AI 识别结果。")}}>整理指令</button></div>
      {podChatPrompt?<section className={styles.podHelpResult}><strong>待应用的贴图指令</strong><p>{podChatPrompt}</p><button type="button" onClick={applyPodChatPrompt}>应用到步骤 4</button></section>:null}
      {podChatNotice?<p role="status">{podChatNotice}</p>:null}
     </div>
     <p>确认后可继续进入「贴图素材 → 自定义指令模式」编辑。真实生成、扣积分和刊登尚未执行。</p>
    </aside>
  </div></>
  :<div className={styles.productLayout}>
   <div className={styles.productSteps}>
    <section className={styles.productStep}><h3>步骤 1 · 选择技能（可选）</h3><p>技能为可选项，可不选择；只运行实际启用的优化配置。</p><div className={styles.productConfigRow}><div className={styles.productRowText}><strong>启用执行技能</strong><small>按需选择技能；未选择也可以保存模板。</small></div><span className={styles.productStatus}>● {skills.length?"已启用 "+skills.length+" 项":"未启用"}</span><button type="button" className={styles.primary} onClick={()=>setConfigMode("skills")}>选择技能</button></div></section>
    <section className={styles.productStep}><h3>步骤 2 · 选择知识库（可选）</h3><p>按需引用平台规则、品牌规范和商品资料。</p><div className={styles.productConfigRow}><div className={styles.productRowText}><strong>使用知识库</strong><small>仅使用已选知识，不会自动引用整个知识库。</small></div><span className={styles.productStatus}>● {knowledge.length?"已启用 "+knowledge.length+" 项":"未启用"}</span><button type="button" className={styles.primary} onClick={()=>setConfigMode("knowledge")}>选择知识库</button></div></section>
    <section className={styles.productStep}><h3>步骤 3 · 配置图片优化（按需）</h3><p>按需开启图片优化；关闭时不会修改图片。</p><div className={styles.productConfigRow}><div className={styles.productRowText}><strong>AI 图片优化设置</strong><small>开启后可设置优化方式、图片策略，以及主图 / 详情图的具体位置。</small></div><button type="button" className={imageOptimization?styles.productEnabled:styles.productToggle} onClick={()=>setImageOptimization(v=>!v)}>{imageOptimization?"关闭":"开启"}</button><button type="button" className={styles.productSettings} onClick={()=>{setImageOptimization(true);setConfigMode("product-image");}}>设置</button></div>{imageOptimization&&imageConfigured?<p className={styles.productInlineHint}>图片优化规则已配置，可以点击「设置」修改。</p>:null}</section>
    <section className={styles.productStep}><h3>步骤 4 · 保存模板</h3><div className={styles.productFinalRow}><p>按需配置后保存模板；执行结果进入「待审核」。</p><div className={styles.productFinalActions}><button type="button" className={styles.secondary} onClick={()=>setShowPreview(v=>!v)}>预览优化范围</button><button type="button" className={styles.primary} onClick={saveTemplate}>保存为模板</button></div></div>{showPreview?<p role="status" className={styles.inlineNotice}>技能：{skills.join("、")||"未启用"}；知识库：{knowledge.join("、")||"未启用"}；图片优化：{imageOptimization?"开启":"关闭"}。此处仅保存演示配置，不会自动执行任务。</p>:null}</section>
    {message?<p role="status" className={styles.inlineNotice}>{message}</p>:null}
   </div>
   <aside className={styles.productHelp}><h3>使用说明</h3><p>技能可按需提供处理规则，知识库提供参考依据。</p><h4>配置说明</h4><div className={styles.productHelpCard}><strong>技能按需启用</strong><p>仅执行已选技能；未选择时不运行技能处理。</p></div><div className={styles.productHelpCard}><strong>知识库提供参考依据</strong><p>引用已选知识，不会加载全部资料。</p></div><div className={styles.productHelpCard}><strong>图片优化</strong><p>开启后可指定主图和详情图。</p></div><h4>职责边界</h4><div className={styles.productHelpCard}><p>商品属性、SKU 和变体关系统一由「待补全」管理。</p></div><h4>结果去向</h4><p className={styles.productResult}>已适配调用 · 待审核 · 发布</p></aside>
  </div>
  }
 </dialog>;
}
