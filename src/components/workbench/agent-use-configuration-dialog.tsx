"use client";

import {useEffect,useId,useRef,useState} from "react";
import css from "./agent-use-configuration-dialog.module.css";

export type ConfigurationMode="product-image"|"pod-ai"|"pod-hybrid"|"pod-pattern-split"|"pod-pattern-custom"|"skills"|"knowledge";
export type ImageTask={id:number;name:string;prompt:string;position?:number;target?:"主图"|"详情图"};
export type AgentUseConfiguration={
 imageUse?:"共用视觉素材"|"分别优化";
 optimizationSource?:"引用技能"|"官方方案"|"自定义指令";
 sharedImageSource?:"主图"|"详情图";
 imageProcessingScope?:"手动选择"|"按技能设定";
 selectedMainImages?:number[];
 selectedDetailImages?:number[];
 generationRule?:"官方方案"|"自定义指令";
 imageTarget?:"主图"|"详情图";
 selectedImages?:number[];
 imageTasks?:ImageTask[];
 imageLanguage?:string;
 imageBackground?:string;
 imageBackgroundCustom?:string;
 hybridStrategy?:"共用视觉素材"|"分别生成";
 hybridTarget?:"主图"|"详情图";
 hybridSlots?:(string|null)[];
 hybridMainSlots?:(string|null)[];
 hybridDetailSlots?:(string|null)[];
 splitStrength?:string;
 splitSource?:string;
 splitReference?:string;
 patternPrompt?:string;
 selectedSkills?:string[];
 selectedKnowledge?:string[];
};

const initialOfficial=["商品识别主图","核心购买理由","核心需求解决","产品结构确认","核心细节证据","核心使用场景","卖点选择理由","规格购买确认"];
const officialDetail=["核心购买理由","核心需求解决","核心使用场景","细节证据","功能卖点确认","使用体验延展","规格购买确认","购买理由总结"];
function officialImageExampleUrl(target:"主图"|"详情图",index:number,extension:"png"|"svg"="png"){
 const base=typeof window!=="undefined"&&window.location.pathname.startsWith("/shuomi")?"/shuomi":"";
 return `${base}/assets/agent-image-examples/${target==="主图"?"main":"detail"}-${index+1}.${extension}`;
}

const officialExampleNotes={
 "主图":[["完整展示奶油色保温杯的杯身、杯盖、提手与整体轮廓。","主体完整、背景简洁、光线柔和"],["突出通勤便携与日常饮水的核心价值。","购买理由明确、产品保持主角"],["表现不同生活场景下随时饮水的需求。","场景真实、需求清晰"],["说明杯盖、密封结构、杯口与杯身的关系。","组件清晰、结构可辨"],["突出杯口边缘、杯盖接缝和表面质感。","细节聚焦、避免虚构材料规格"],["在工作或出行环境中展示产品。","使用场景自然、主体醒目"],["概括提手、宽口、外观等选择理由。","卖点精炼、避免未经核实的性能承诺"],["帮助购买者确认外观与需要核对的规格。","尺寸容量以实际商品资料为准"]],
 "详情图":[["从实用性和美观度解释购买价值。","围绕产品用途呈现购买理由"],["以办公和通勤说明日常饮水痛点。","场景与需求一一对应"],["通过桌面、休闲和出行场景展示用途。","让使用环境更具体"],["放大杯口、提手和杯盖的关键细节。","细节真实、重点突出"],["展示杯盖、提手和宽口的使用方式。","功能展示清楚，不虚构参数"],["表现轻松提拿和多场景携带体验。","动作自然、商品一致"],["提示核对容量、尺寸及材质等资料。","不展示未经确认的精确参数"],["总结外观、便携和日常使用价值。","收束信息，帮助购买判断"]]
} as const;

const availableSkills=["商品标题规范优化（示例）","商品图片优化（示例）"];
const availableKnowledge=["平台规则","运营方法","合规参考"];
const podSkillSamples=[
 {name:"POD图案生成规范（示例）",description:"用于演示内容与规则的规范化，实际版本以技能库为准"},
 {name:"POD图片优化（示例）",description:"可用于规范图片生成与优化，实际配置在图片设置中调整"}
];
const podKnowledgeSamples=[
 {name:"跨境平台规则",description:"已添加的站点政策、店铺规则与运营限制"},
 {name:"商品运营方法",description:"已添加的商品刊登、定价及运营指引"},
 {name:"跨境合规资料",description:"已添加的知识产权、税务与合规内容"}
];
const languages=["不设置（默认关闭）","英语","中文","西班牙语","法语","德语","日语"];

export function AgentUseConfigurationDialog({mode,initial,onClose,onSave,agentKind="product"}:{
 agentKind?:"pod"|"product";
 mode:ConfigurationMode;initial:AgentUseConfiguration;onClose:()=>void;onSave:(value:AgentUseConfiguration)=>void;
}){
 const dialogRef=useRef<HTMLDialogElement>(null);
 const id=useId();
 const [form,setForm]=useState<AgentUseConfiguration>(initial);
 const [child,setChild]=useState<""|"add-image"|"language"|"background"|"source"|"library"|"sort"|"slot-actions"|"official-images"|"ai-images"|"multi-adjust"|"restore">("");
 const [sourceTab,setSourceTab]=useState("应用技能");
 const [slotIndex,setSlotIndex]=useState(0);
 const [selectedFromPicker,setSelectedFromPicker]=useState<string[]>([]);
 const [message,setMessage]=useState("");
 const [example,setExample]=useState<{target:"主图"|"详情图";index:number}|null>(null);
 const [exampleZoom,setExampleZoom]=useState(false);
 const [assetName,setAssetName]=useState("");
 const [fileName,setFileName]=useState("");
 const [tasks,setTasks]=useState<ImageTask[]>(initial.imageTasks?.length?initial.imageTasks:mode==="product-image"?[{id:1,name:"",prompt:"",target:"主图"},{id:2,name:"",prompt:"",target:"主图"}]:[{id:1,name:"自定义图片 1",prompt:""}]);
 const [selectedImgs,setSelectedImgs]=useState<number[]>(initial.selectedImages??[]);
 const [mainImgs,setMainImgs]=useState<number[]>(initial.selectedMainImages??((mode==="product-image"||mode==="pod-ai")?[1,2,3,4,5,6,7,8]:initial.selectedImages??[]));
 const [detailImgs,setDetailImgs]=useState<number[]>(initial.selectedDetailImages??((mode==="product-image"||mode==="pod-ai")?[1,2,3,4,5,6,7,8]:initial.selectedImages??[]));
 const initialHybridSlots=(items?:(string|null)[])=>Array.from({length:8},(_,i)=>items?.[i]??null);
 const [sharedSlots,setSharedSlots]=useState<(string|null)[]>(()=>initialHybridSlots(initial.hybridSlots));
 const [mainSlots,setMainSlots]=useState<(string|null)[]>(()=>initialHybridSlots(initial.hybridMainSlots??initial.hybridSlots));
 const [detailSlots,setDetailSlots]=useState<(string|null)[]>(()=>initialHybridSlots(initial.hybridDetailSlots??initial.hybridSlots));
 const hybridShared=(form.hybridStrategy??"共用视觉素材")==="共用视觉素材";
 const hybridTarget=form.hybridTarget??"主图";
 const slots=hybridShared?sharedSlots:hybridTarget==="主图"?mainSlots:detailSlots;
 const setSlots=(next:(string|null)[])=>{
  if(hybridShared){setSharedSlots(next);setMainSlots(next.slice());setDetailSlots(next.slice());}
  else if(hybridTarget==="主图")setMainSlots(next);
  else setDetailSlots(next);
 };
 const [selectedItems,setSelectedItems]=useState<string[]>(mode==="knowledge"?initial.selectedKnowledge??[]:initial.selectedSkills??[]);
 const [skillTab,setSkillTab]=useState<"我的技能"|"团队技能">("我的技能");
 const [knowledgeTab,setKnowledgeTab]=useState<"我的知识库"|"团队知识库">("我的知识库");
 const [librarySelected,setLibrarySelected]=useState("");
 const [libraryQuery,setLibraryQuery]=useState("");
 const [multiSelected,setMultiSelected]=useState<number[]>([]);
 const [aiSelected,setAiSelected]=useState<string[]>([]);

 useEffect(()=>{
  const previous=document.activeElement;
  const el=dialogRef.current;
  if(el&&!el.open)el.showModal();
  return()=>{el?.close();if(previous instanceof HTMLElement&&previous.isConnected)previous.focus();};
 },[]);

 const set=<K extends keyof AgentUseConfiguration>(key:K,value:AgentUseConfiguration[K])=>setForm(old=>({...old,[key]:value}));
 const selectHybridStrategy=(strategy:"共用视觉素材"|"分别生成")=>{
  if(strategy===(form.hybridStrategy??"共用视觉素材"))return;
  if(strategy==="共用视觉素材"){
   const source=hybridTarget==="主图"?mainSlots:detailSlots;
   setSharedSlots(source.slice());setMainSlots(source.slice());setDetailSlots(source.slice());
  }else{
   setMainSlots(sharedSlots.slice());setDetailSlots(sharedSlots.slice());
  }
  set("hybridStrategy",strategy);
  setMultiSelected([]);setMessage("");
 };

 const flip=(array:string[],value:string,callback:(next:string[])=>void)=>callback(array.includes(value)?array.filter(x=>x!==value):[...array,value]);
 const title=child==="add-image"?"添加图片":child==="language"?"选择生图语言":child==="background"?"统一图片底色":child==="source"?"选择参考素材":child==="library"?"从我的素材库引用":child==="sort"?"智能排序":child==="slot-actions"?"图片快捷调整":child==="official-images"?"添加官方图片":child==="ai-images"?"选择 AI 渲染图片":child==="multi-adjust"?"多选调整":child==="restore"?"恢复上次顺序？":({
  "product-image":"AI图片优化设置","pod-ai":"AI重构图片设置","pod-hybrid":"混合模式设置","pod-pattern-split":"图片裂变模式","pod-pattern-custom":"自定义指令模式","skills":agentKind==="pod"?"选择执行技能":"选择技能","knowledge":agentKind==="pod"?"选择引用知识":"选择知识库"
 } as Record<ConfigurationMode,string>)[mode];
 const desc=child==="add-image"?"选择图片来源，再将图片加入当前编排位置。":child==="language"?"不设置时不指定生图语言；选择后生效。":child==="background"?"不设置时不限制背景；选择后生效。":child==="source"?"请选择参考图片的来源，再选定具体图片。":child==="library"?"来源：POD素材管理工具 / 我的素材库 · 图片裂变仅引用 1 张参考图。":child==="sort"?"选择一个排序策略，应用后仍可继续手动调整。":child==="slot-actions"?"不拖拽也能完成微调。":child==="official-images"?"从官方渲染结果中继续加入最终图片序列（原型示例）。":child==="ai-images"?"支持多选；AI 自动补全可与已选渲染结果同时使用。":child==="multi-adjust"?"选择多张图片后可一次性移动或移除。":child==="restore"?"将恢复到最近一次保存的图片组合与顺序。":({
  "product-image":"选择优化方式，再配置主图或详情图。",
  "pod-ai":"选择优化方式，再配置主图或详情图。",
  "pod-hybrid":"从多种图片来源自由组合，按需完成最终刊登图片编排。",
  "pod-pattern-split":"基于 1 张参考图片，生成配色、元素及排版不同的设计方案。",
  "pod-pattern-custom":"按用户具体创作要求生成贴图素材。",
  "skills":"按需选择我的技能或团队技能，不选也可以保存模板。",
  "knowledge":"仅引用实际勾选的知识资料，不会自动读取整个知识库。"
 } as Record<ConfigurationMode,string>)[mode];
 const commit=(next:AgentUseConfiguration=form)=>onSave({...next,
  ...((mode==="product-image"||mode==="pod-ai")?{imageTasks:tasks}:{}),
  ...(mode==="pod-hybrid"?{hybridStrategy:form.hybridStrategy??"共用视觉素材",hybridSlots:slots,hybridMainSlots:hybridShared?slots:mainSlots,hybridDetailSlots:hybridShared?slots:detailSlots}:{}),
  ...(mode==="skills"?{selectedSkills:selectedItems}:{}),
  ...(mode==="knowledge"?{selectedKnowledge:selectedItems}:{})
 });
 const addSlot=(value:string)=>{
  const updated=slots.slice();
  updated[slotIndex]=value;
  setSlots(updated);
  setChild("");
  setSelectedFromPicker([]);
  setMessage("");
 };
 const activeTarget=form.imageTarget??"主图";
 const compact=(v:(string|null)[])=>v.filter((x):x is string=>Boolean(x));
 const pad=(v:string[])=>Array.from({length:8},(_,i)=>v[i]??null);
 const reorderSlot=(action:"left"|"right"|"first"|"last"|"remove")=>{
  const current=slots.slice();
  const v=current[slotIndex];
  if(!v)return;
  if(action==="remove"){current[slotIndex]=null;setSlots(current);setChild("");return;}
  let next=slotIndex;
  if(action==="left")next=Math.max(0,slotIndex-1);
  if(action==="right")next=Math.min(7,slotIndex+1);
  if(action==="first")next=0;
  if(action==="last")next=7;
  current.splice(slotIndex,1);
  current.splice(next,0,v);
  setSlots(current.slice(0,8));setSlotIndex(next);setChild("");
 };
 const applyMulti=(action:"first"|"last"|"remove")=>{
  const chosen=slots.filter((v,i)=>v&&multiSelected.includes(i)) as string[];
  const other=slots.filter((v,i)=>v&&!multiSelected.includes(i)) as string[];
  const result=action==="remove"?other:action==="first"?[...chosen,...other]:[...other,...chosen];
  setSlots(pad(result));setMultiSelected([]);setChild("");
 };
 const addManyAi=()=>{
  if(!aiSelected.length){setMessage("请至少选择一张 AI 渲染图片。");return;}
  const next=slots.slice();let at=slotIndex;
  for(const label of aiSelected){while(at<8&&next[at])at++;if(at>=8)break;next[at]="AI·"+label;at++;}
  setSlots(next);setAiSelected([]);setChild("");setMessage("");
 };

 const isImage=mode==="product-image"||mode==="pod-ai";
 const isProductImage=mode==="product-image"||mode==="pod-ai";
 const optimizationSource=form.optimizationSource??(form.generationRule==="自定义指令"?"自定义指令":mode==="pod-ai"?"官方方案":"引用技能");
 const processingScope=optimizationSource==="官方方案"?"手动选择":form.imageProcessingScope??"手动选择";
 const productTarget=form.imageTarget??"主图";
 // In shared mode the image task list follows the selected source, not the configuration tab.

 const sharedVisual=(form.imageUse??"共用视觉素材")==="共用视觉素材";
 const visibleImageTarget=sharedVisual?(form.sharedImageSource??"主图"):productTarget;
 const currentImages=sharedVisual?((form.sharedImageSource??"主图")==="主图"?mainImgs:detailImgs):(productTarget==="主图"?mainImgs:detailImgs);
 const updateCurrentImages=(next:number[])=>{if(sharedVisual){setMainImgs(next);setDetailImgs(next);}else if(productTarget==="主图"){setMainImgs(next);}else{setDetailImgs(next);}};
 const selectVisualStrategy=(next:"共用视觉素材"|"分别优化")=>{if(next==="共用视觉素材"){const images=(form.sharedImageSource??"主图")==="主图"?mainImgs:detailImgs;setMainImgs(images);setDetailImgs(images);}set("imageUse",next);setMessage("");};
 const toggleProductImage=(number:number)=>{const next=currentImages.includes(number)?currentImages.filter(x=>x!==number):[...currentImages,number].sort((a,b)=>a-b);updateCurrentImages(next);};
 const selectProductSource=(source:"引用技能"|"官方方案"|"自定义指令")=>setForm(v=>({...v,optimizationSource:source,generationRule:source==="自定义指令"?"自定义指令":"官方方案"}));
 const visibleCustomTasks=tasks.filter(t=>(t.target??"主图")===productTarget);
 const customTasksReady=visibleCustomTasks.length>0&&visibleCustomTasks.every(t=>Boolean(t.position)&&Boolean(t.prompt.trim()))&&new Set(visibleCustomTasks.map(t=>t.position)).size===visibleCustomTasks.length;
 const productImageReady=optimizationSource==="自定义指令"?customTasksReady:(optimizationSource!=="引用技能"&&processingScope!=="按技能设定"||Boolean(form.selectedSkills?.length))&&(processingScope!=="手动选择"||currentImages.length>0);
 const saveProductImage=()=>{if(optimizationSource==="引用技能"&&!(form.selectedSkills?.length)){setMessage("请先在上一级选择至少一项技能，或改用官方方案。");return;}if(processingScope==="手动选择"&&!currentImages.length){setMessage("请至少勾选一张要处理的"+visibleImageTarget+"。");return;}if(optimizationSource==="自定义指令"&&!customTasksReady){setMessage("请为每条自定义任务选择不同图片位置，并填写独立优化要求。");return;}commit({...form,optimizationSource,imageProcessingScope:processingScope,sharedImageSource:form.sharedImageSource??"主图",selectedImages:currentImages,selectedMainImages:sharedVisual?currentImages:mainImgs,selectedDetailImages:sharedVisual?currentImages:detailImgs,imageTasks:tasks});};
 const choice=(items:string[],value:string,change:(v:string)=>void)=><div className={css.segment}>{items.map(v=><button key={v} type="button" aria-pressed={value===v} onClick={()=>change(v)}>{v}</button>)}</div>;
 const maybeNotice=message?<p role="status" className={css.notice}>{message}</p>:null;
 return <dialog ref={dialogRef} className={`${css.modal} ${mode==="product-image"&&!child?css.productImageModal:""}`} aria-labelledby={id} onCancel={event=>{event.preventDefault();if(exampleZoom){setExampleZoom(false);}else if(example){setExample(null);}else if(child){setChild("");setMessage("");}else onClose();}} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
  <header className={css.head}><div><h2 id={id}>{title}</h2><p>{desc}</p></div>{isProductImage&&!child?<div className={css.optimizerHeaderActions}><button type="button" onClick={()=>setChild("language")}>语言：{form.imageLanguage&&form.imageLanguage!==languages[0]?form.imageLanguage:"已关闭"}</button><button type="button" onClick={()=>setChild("background")}>背景：{form.imageBackground&&form.imageBackground!=="不设置"?form.imageBackground:"已关闭"}</button></div>:null}<button type="button" className={css.close} aria-label="关闭配置弹窗" onClick={()=>child?setChild(""):onClose()}>×</button></header>
  <main className={css.body}>
   {child==="language"?<div className={css.optionGrid}>{languages.map(x=><button key={x} aria-pressed={(form.imageLanguage??languages[0])===x} onClick={()=>{set("imageLanguage",x);setChild("");}}>{x}</button>)}</div>
   :child==="background"?<div className={css.stack}><h3>背景指令</h3>{choice(["不设置","白色背景","自定义背景要求"],form.imageBackground??"不设置",x=>set("imageBackground",x))}{form.imageBackground==="自定义背景要求"?<label>自定义背景要求<textarea aria-label="自定义背景要求" value={form.imageBackgroundCustom??""} onChange={e=>set("imageBackgroundCustom",e.target.value)} placeholder="例如：浅灰摄影棚背景、柔和自然光、保持商品主体不变……" /></label>:null}<p>所有主图和详情图都会遵循此配置。</p></div>
   :child==="source"?<div className={css.optionGrid}><button type="button" onClick={()=>{set("splitSource","本地上传");setChild("");}}>本地上传 · 从电脑选择图片</button><button type="button" onClick={()=>setChild("library")}>素材库 · 选择已保存图片</button></div>
   :child==="library"?<div className={css.stack}>
    <p className={css.tip}>以下为 Figma 原型示例；正式引用需要接入 POD 素材管理工具中真实的「我的素材库」。</p>
    <input aria-label="搜索素材名称或关键词" placeholder="搜索素材名称或关键词" value={libraryQuery} onChange={e=>setLibraryQuery(e.target.value)} />
    <div className={css.optionGrid}>{["复古花卉字母","宇宙猫咪图形","复古日落纹理","植物线描","蝴蝶结图案","阳光笑脸字样","波浪渐变装饰","宠物轮廓主题"].filter(x=>x.includes(libraryQuery)).map((x,i)=><button type="button" key={x} aria-pressed={librarySelected===x} onClick={()=>setLibrarySelected(x)}>{String(i+1).padStart(2,"0")} · {x}</button>)}</div>
    <p>当前已选：{librarySelected||"未选择参考素材"} · 单选 1 张 · 引用不移动或删除原素材</p>
   </div>
   :child==="sort"?<div className={css.stack}>{[["转化优先","把识别、购买理由、场景等高转化图片优先"],["官方图优先","优先展示官方渲染图片，再穿插 AI 图片"],["AI图优先","优先展示 AI 重构图片，再补充官方图片"]].map(([name,desc])=><button key={name} type="button" onClick={()=>{
    const priority=(v:string)=>name==="官方图优先"?(v.startsWith("官方")?0:1):name==="AI图优先"?(v.startsWith("AI")?0:1):/购买理由|场景|识别/.test(v)?0:1;
    const vals=compact(slots);setSlots(pad(vals.sort((a,b)=>priority(a)-priority(b))));setChild("");
   }}>{name} · {desc}</button>)}</div>
   :child==="slot-actions"?<div className={css.optionGrid}>{([["向左移动一位","left"],["向右移动一位","right"],["移到最前","first"],["移到最后","last"],["从最终序列移除","remove"]] as const).map(([name,action])=><button key={action} onClick={()=>reorderSlot(action)}>{name}</button>)}</div>
   :child==="official-images"?<div className={css.stack}><p className={css.tip}>仅显示 Figma 原型示例，尚未读取第三方平台的实际官方图片。</p><div className={css.optionGrid}>{["第一张","第二张","第三张","第四张","第五张","第六张","第七张","第八张"].map((name,i)=><button key={name} onClick={()=>addSlot("官方·"+name)}>{String(i+1).padStart(2,"0")} · {name} · 选择</button>)}</div></div>
   :child==="ai-images"?<div className={css.stack}><div className={css.optionGrid}>{officialDetail.map((name,i)=><label className={css.imageChoice} key={name}><input type="checkbox" checked={aiSelected.includes(name)} onChange={()=>flip(aiSelected,name,setAiSelected)}/>{String(i+1).padStart(2,"0")} · {name}</label>)}</div><p>可勾选多张，添加时自动放入未占用的编排位置，最多 8 张。</p></div>
   :child==="multi-adjust"?<div className={css.stack}><div className={css.optionGrid}>{slots.map((slot,i)=>slot?<label className={css.imageChoice} key={i}><input type="checkbox" checked={multiSelected.includes(i)} onChange={()=>setMultiSelected(old=>old.includes(i)?old.filter(x=>x!==i):[...old,i])}/>{String(i+1).padStart(2,"0")} · {slot}</label>:null)}</div><p>已选 {multiSelected.length} 张</p><div className={css.toolbar}><button onClick={()=>applyMulti("first")} disabled={!multiSelected.length}>移到最前</button><button onClick={()=>applyMulti("last")} disabled={!multiSelected.length}>移到最后</button><button onClick={()=>applyMulti("remove")} disabled={!multiSelected.length}>移除</button></div></div>
   :child==="restore"?<p>将恢复到最近一次保存的图片组合与顺序，未保存的调整会被覆盖。</p>
   :child==="add-image"?<>
    <div className={css.imageSourceCards} aria-label="图片来源">
     {([
      ["应用技能","沿用已启用技能"],
      ["预设指令AI重构","使用预设指令生成图片"],
      ["从本地上传","上传电脑中的图片"],
      ["自定义指令","按指令生成图片"]
     ] as const).map(([name,description])=><button type="button" key={name} aria-label={name} aria-pressed={sourceTab===name} onClick={()=>{setSourceTab(name);setMessage("");}}><strong>{name}</strong><small>{description}</small></button>)}
    </div>
    <section className={css.imageSourcePanel}>
     {sourceTab==="应用技能"?<>
      <div className={css.imageSourcePanelHeading}><div><h3>应用技能</h3><p>自动沿用步骤 3 已启用的技能，无需在这里重复选择。</p></div><span className={css.imageSkillStatus} data-enabled={Boolean(form.selectedSkills?.length)}>{form.selectedSkills?.length?"已启用 "+form.selectedSkills.length+" 项技能":"● 步骤 3 未启用技能"}</span></div>
      <div className={css.imageAutoMatch}><strong>图片位置自动匹配</strong><div className={css.imageAutoMatchGrid}>
       <div><small>当前编排位置</small><strong>{hybridShared?"主图 / 详情图":hybridTarget}第{slotIndex+1}张</strong></div>
       <span aria-hidden="true" className={css.imageAutoArrow}>→</span>
       <div className={css.imageAutoResult}><small>自动匹配来源</small><strong>{form.selectedSkills?.length?"已启用技能 · "+(hybridShared?"主图 / 详情图":hybridTarget)+"第"+(slotIndex+1)+"张":"尚无已启用技能"}</strong></div>
      </div><p>同类型、同序号自动匹配 · 主图对应主图，详情图对应详情图</p></div>
      <p className={css.imageSourceHelper}>{form.selectedSkills?.length?"将按已启用技能和当前图片位置建立引用；实际执行仍须校验技能规则。":"如技能缺少该序号的图片，将不会自动引用其他图片。请先在步骤 3 启用技能。"}</p>
     </>
     :sourceTab==="预设指令AI重构"?<>
      <h3>预设指令AI重构</h3><p>选择当前位置的图片优化任务，点击后加入最终编排序列。</p>
      <div className={css.optionGrid}>{(hybridTarget==="详情图"&&!hybridShared?officialDetail:initialOfficial).map((name,i)=><button key={name} type="button" onClick={()=>addSlot("AI·"+name)}>{String(i+1).padStart(2,"0")} · {name}</button>)}</div>
      <div className={css.imageOtherSources}><button type="button" onClick={()=>setChild("official-images")}>官方图片</button><button type="button" onClick={()=>setChild("ai-images")}>AI 渲染图片</button></div>
     </>
     :sourceTab==="从本地上传"?<><h3>从本地上传</h3><label>选择图片文件<input type="file" accept="image/*" onChange={e=>setFileName(e.target.files?.[0]?.name??"")}/></label><p>已选择：{fileName||"尚未选择文件"}。演示版不会上传文件至服务器。</p></>
     :<><h3>自定义指令</h3><label>自定义图片指令<textarea value={assetName} onChange={e=>setAssetName(e.target.value)} placeholder="例如：服装产品主体、面料质感、英文卖点、1:1 构图"/></label><p>按当前编排位置应用此指令，实际图片生成需连接模型。</p></>}
    </section>
   </>
   :isProductImage?<div className={css.optimizer}>
    <div className={css.optimizerRows}>
     <section className={css.optimizerRow}><div className={css.optimizerRowTitle}><span>1</span><div><strong>优化方式</strong><small>选择规则来源</small></div></div><div className={css.optimizerChoicesThree}>
      {([["引用技能","使用已选图片优化技能"],["官方方案","标准 8+8 优化任务模板"],["自定义指令","按需新增 · 单图独立要求"]] as const).map(([name,description])=><button type="button" key={name} aria-pressed={optimizationSource===name} onClick={()=>{selectProductSource(name);setMessage("");}}><strong>{name}</strong><small>{description}</small></button>)}
     </div></section>
     <section className={css.optimizerRow}><div className={css.optimizerRowTitle}><span>2</span><div><strong>图片策略</strong><small>决定是否复用素材</small></div></div><div className={css.optimizerChoices}>
      {([["共用视觉素材","减少重复优化"],["分别优化","主图详情图独立优化"]] as const).map(([name,description])=><button type="button" key={name} aria-pressed={(form.imageUse??"共用视觉素材")===name} onClick={()=>selectVisualStrategy(name)}><strong>{name}</strong><small>{description}</small></button>)}
     </div></section>
     <section className={css.optimizerRow}><div className={css.optimizerRowTitle}><span>3</span><div><strong>配置对象</strong><small>选择主图 / 详情图</small></div></div><div className={css.optimizerChoices}>
      {(["主图","详情图"] as const).map(name=><button type="button" key={name} aria-pressed={sharedVisual||productTarget===name} onClick={()=>{set("imageTarget",name);setMessage("");}}><strong>{name}</strong><small>配置{name}优化任务</small></button>)}
     </div></section>
     {sharedVisual&&optimizationSource!=="自定义指令"?<section className={css.optimizerRow}><div className={css.optimizerRowTitle}><span>4</span><div><strong>共用来源</strong><small>选择复用来源</small></div></div><div className={css.optimizerChoices}>
      {(["主图","详情图"] as const).map(name=><button type="button" key={name} aria-pressed={(form.sharedImageSource??"主图")===name} onClick={()=>{const selected=name==="主图"?mainImgs:detailImgs;setMainImgs([...selected]);setDetailImgs([...selected]);set("sharedImageSource",name);setMessage("");}}><strong>以{name}为准</strong><small>主图、详情图复用{name}侧配置</small></button>)}
     </div></section>:null}
     {optimizationSource==="引用技能"?<section className={css.optimizerRow}><div className={css.optimizerRowTitle}><div className={css.optimizerNoNumber}><strong>图片处理范围</strong><small>选择处理范围</small></div></div><div className={css.optimizerChoices}>
      {(["手动选择","按技能设定"] as const).map(name=><button type="button" key={name} aria-pressed={processingScope===name} onClick={()=>{set("imageProcessingScope",name);setMessage("");}}>{name}</button>)}
     </div></section>:null}
    </div>
    {optimizationSource==="自定义指令"?<section className={css.optimizerTasks}>
     <div className={css.optimizerTasksHeader}><div><h3>{productTarget}自定义优化任务</h3><p>每条任务选择图片位置，并填写独立优化要求。</p></div><button type="button" onClick={()=>setTasks(old=>[...old,{id:Math.max(0,...old.map(t=>t.id))+1,name:"",prompt:"",target:productTarget}])}>＋ 新增任务</button></div>
     <div className={css.optimizerTaskList}>{visibleCustomTasks.map((task,i)=><div className={css.optimizerTaskRow} key={task.id}><span className={css.optimizerTaskNumber}>{String(i+1).padStart(2,"0")}</span><select aria-label={"任务 "+(i+1)+" 图片位置"} value={task.position??""} onChange={e=>setTasks(old=>old.map(t=>t.id===task.id?{...t,position:e.target.value?Number(e.target.value):undefined}:t))}><option value="">选择图片位置</option>{Array.from({length:8},(_,n)=>n+1).map(n=><option key={n} value={n}>第 {n} 张</option>)}</select><input aria-label={"任务 "+(i+1)+" 优化要求"} value={task.prompt} onChange={e=>setTasks(old=>old.map(t=>t.id===task.id?{...t,prompt:e.target.value}:t))} placeholder="填写独立优化要求..." /><button type="button" className={css.optimizerTaskDelete} onClick={()=>setTasks(old=>old.filter(t=>t.id!==task.id))}>删除</button></div>)}</div>
     <p className={css.optimizerTaskHelp}>每条任务选择一个已有图片位置，并填写独立优化要求。</p>
    </section>:null}
    {optimizationSource!=="自定义指令"?<section className={css.optimizerImages}>
     <div className={css.optimizerImagesHeader}><strong>{optimizationSource==="官方方案"?"选择优化图片 · 可多选（"+visibleImageTarget+"方案）":visibleImageTarget+" · "+(processingScope==="手动选择"?"勾选需要处理的图片":"按技能设定范围")}</strong>{processingScope==="手动选择"?<div><button type="button" onClick={()=>updateCurrentImages([1,2,3,4,5,6,7,8])}>全选</button><button type="button" onClick={()=>updateCurrentImages([])}>清空</button></div>:null}</div>
     {processingScope==="手动选择"?<div className={css.optimizerImageGrid}>{Array.from({length:8},(_,i)=>i+1).map(n=><div className={css.optimizerImageChoice} key={n}><label className={css.optimizerImageCheck}><span>第 {n} 张</span><input type="checkbox" aria-label={visibleImageTarget+"第"+n+"张"} checked={currentImages.includes(n)} onChange={()=>toggleProductImage(n)}/></label>{optimizationSource==="官方方案"?<button type="button" className={css.optimizerExampleOpen} onClick={()=>{setExample({target:visibleImageTarget,index:n-1});setExampleZoom(false);}} aria-label={"查看"+visibleImageTarget+"第"+n+"张示例"}>{(visibleImageTarget==="主图"?initialOfficial:officialDetail)[n-1]} · 查看示例</button>:null}</div>)}</div>:<p className={css.optimizerSkillNotice}>运行时根据已启用的图片优化技能判断处理位置，不强制使用手动勾选结果。未启用技能时请先返回上一级选择技能。</p>}
     <p className={css.optimizerImageHint}>{optimizationSource==="官方方案"?"勾选需要优化的图片；未勾选保留原图。":"勾选的图片会按技能中对应位置的方案生成，未勾选的保持不变。例如：选中主图第 2 张，将采用技能预设的第 2 张主图方案；详情图同理。"}</p>
    </section>:null}
    <p className={css.optimizerBilling}>{optimizationSource==="自定义指令"?"费用说明：只有已添加并完成配置的自定义任务会创建 AI 优化任务，并按实际积分计费。":optimizationSource==="官方方案"?"计费说明：仅对已勾选图片执行 AI 重构并计费；选择图片越多，预计消耗积分越高。":"计费说明：仅对实际模型生成的新图片按实际消耗的 AI 积分计费；原型演示不扣积分。"}</p>
   </div>
   :isImage?<div className={css.stack}>
    <p className={css.tip}>计费说明：仅对实际生成图片按 AI 积分计费。当前演示不生成图片、不扣除积分。</p>
    <section className={css.panel}><h3>图片使用</h3><p>共用时不重复生成主图；分别优化时，两套图片独立生成。</p>{choice(["共用视觉素材","分别优化"],form.imageUse??"共用视觉素材",x=>set("imageUse",x as AgentUseConfiguration["imageUse"]))}</section>
    <section className={css.panel}><h3>生成规则</h3>{choice(["官方方案","自定义指令"],form.generationRule??"官方方案",x=>set("generationRule",x as AgentUseConfiguration["generationRule"]))}</section>
    {choice(["主图","详情图"],activeTarget,x=>set("imageTarget",x as AgentUseConfiguration["imageTarget"]))}
    {form.generationRule==="自定义指令"?<section className={css.panel}><h3>{activeTarget}自定义优化任务</h3><p>按需新增任务，每张图片单独填写指令。</p>{tasks.map((task,i)=><div className={css.task} key={task.id}><strong>{String(i+1).padStart(2,"0")}</strong><input aria-label={"图片任务名称 "+(i+1)} value={task.name} onChange={e=>setTasks(old=>old.map(t=>t.id===task.id?{...t,name:e.target.value}:t))}/><textarea aria-label={"图片任务指令 "+(i+1)} placeholder="输入这张图的独立生成指令…" value={task.prompt} onChange={e=>setTasks(old=>old.map(t=>t.id===task.id?{...t,prompt:e.target.value}:t))}/><button type="button" disabled={tasks.length===1} onClick={()=>setTasks(old=>old.filter(t=>t.id!==task.id))}>删除</button></div>)}<button type="button" onClick={()=>setTasks(old=>[...old,{id:Math.max(0,...old.map(x=>x.id))+1,name:"自定义图片 "+(old.length+1),prompt:""}])}>＋ 新增任务</button></section>
    :<section className={css.panel}><h3>选择优化图片 · 可多选</h3><p>勾选需要处理的图片，未勾选不处理。</p><div className={css.optionGrid}>{(activeTarget==="主图"?initialOfficial:officialDetail).map((name,i)=><label key={i} className={css.imageChoice}><input type="checkbox" checked={selectedImgs.includes(i+1)} onChange={()=>setSelectedImgs(old=>old.includes(i+1)?old.filter(x=>x!==i+1):[...old,i+1])}/><span>{String(i+1).padStart(2,"0")} · {name}</span></label>)}</div></section>}
    <div className={css.toolbar}><button type="button" onClick={()=>setChild("language")}>语言：{form.imageLanguage??"不设置"}</button><button type="button" onClick={()=>setChild("background")}>底色：{form.imageBackground??"不设置"}</button></div>
   </div>
   :mode==="pod-hybrid"?<div className={css.stack}>
    <p className={css.tip}>官方渲染仅支持已接入平台；AI 图片按实际使用积分计费。演示版不生成或上传图片。</p>
    <div className={css.hybridControls}>
     <div className={css.hybridControlRow}><strong>视觉策略</strong>{choice(["共用视觉素材","分别生成"],form.hybridStrategy??"共用视觉素材",x=>selectHybridStrategy(x as "共用视觉素材"|"分别生成"))}</div>
     <div className={css.hybridControlRow}><strong>配置对象</strong>
      {hybridShared?<div className={css.segment} aria-label="共用视觉素材同步应用对象"><span className={css.hybridBothSelected}>主图 ✓</span><span className={css.hybridBothSelected}>详情图 ✓</span><small>两侧共用以下 8 张图片编排</small></div>
      :choice(["主图","详情图"],hybridTarget,x=>{set("hybridTarget",x as AgentUseConfiguration["hybridTarget"]);setMultiSelected([]);})}
     </div>
    </div>
    <section className={css.panel}><h3>图片添加说明</h3><p>图片来源：应用技能、预设指令AI重构、本地上传、自定义指令。</p><p>编排方式：点击图片位置的“＋”添加；已添加图片可更换或移除。</p></section>
    <h3>最终图片编排{hybridShared?" · 主图及详情图共用":" · "+hybridTarget}</h3><p>{hybridShared?"主图、详情图共用同一组最多 8 张图片，修改后两侧同步生效。":"当前仅配置"+hybridTarget+"的最多 8 张图片，另一侧可独立设置。"} 按位置添加；支持更换和删除。</p>
    <div className={css.slotGrid}>{slots.map((v,i)=><div className={css.slot} key={i}><small>{String(i+1).padStart(2,"0")}</small><button type="button" aria-label={"添加第 "+(i+1)+" 张图片"} onClick={()=>{setSlotIndex(i);setSourceTab("应用技能");setChild("add-image");}}>{v?<span>{v}</span>:"＋"}</button>{v?<button type="button" aria-label={"调整第 "+(i+1)+" 张图片"} onClick={()=>{setSlotIndex(i);setChild("slot-actions");}}>···</button>:null}</div>)}</div>
    <div className={css.toolbar}><button type="button" onClick={()=>setChild("language")}>语言：{form.imageLanguage??"不设置"}</button><button type="button" onClick={()=>setChild("background")}>底色：{form.imageBackground??"不设置"}</button><button type="button" disabled={!compact(slots).length} onClick={()=>setChild("sort")}>智能排序</button><button type="button" disabled={!compact(slots).length} onClick={()=>setChild("multi-adjust")}>多选调整</button><button type="button" onClick={()=>setChild("restore")}>恢复上次顺序</button></div>
   </div>
   :mode==="pod-pattern-split"?<div className={css.stack}><label>参考素材<button type="button" className={css.sourceButton} aria-label="上传图片 / 从素材库选择" onClick={()=>setChild("source")}>＋ 上传图片 / 从素材库选择</button></label><p>{form.splitSource?"当前来源："+form.splitSource:"从本地或素材库中选择 1 张参考图片"}</p>{form.splitSource==="本地上传"?<label>选择参考图片<input type="file" accept="image/*" onChange={e=>set("splitReference",e.target.files?.[0]?.name??"")}/></label>:null}<h3>裂变强度</h3><div className={css.optionGrid}>{["保守变化","适度创新","大胆裂变"].map(x=><button type="button" key={x} aria-pressed={(form.splitStrength??"适度创新")===x} onClick={()=>set("splitStrength",x)}>{x}</button>)}</div><p>保留主体关键特征，可调整色彩、细节和局部排版。</p></div>
   :mode==="pod-pattern-custom"?<div className={css.stack}><label>生成指令<textarea aria-label="生成指令" rows={5} placeholder="例如：黑色底，朋克风，加入不同样式的闪电和英文短句，适合腰部印刷……" value={form.patternPrompt??""} onChange={e=>set("patternPrompt",e.target.value)}/></label><p>AI 会优先遵循你的指令，同时自动做印刷适配与合规检查（实际能力待接入）。</p></div>
   :mode==="skills"?<div className={css.stack}>
    <div className={css.segment}>{(["我的技能","团队技能"] as const).map(tab=><button key={tab} type="button" aria-pressed={skillTab===tab} onClick={()=>setSkillTab(tab)}>{tab}</button>)}</div>
    {skillTab==="我的技能"?<section className={css.panel}><h3>已启用的个人技能</h3>{(agentKind==="pod"?podSkillSamples:availableSkills.map((name,i)=>({name,description:i?"选择后可设置图片优化范围和方式":"演示商品标题格式规范化"}))).map(item=><label className={css.imageChoice} key={item.name}><input type="checkbox" checked={selectedItems.includes(item.name)} onChange={()=>flip(selectedItems,item.name,setSelectedItems)}/><span><strong>{item.name}</strong><small>v1 · 已启用 · 私有</small><small>{item.description}</small></span></label>)}<p>以上仅为原型示例技能；正式调用以技能库权限和可用版本为准。</p></section>:<section className={css.panel}><h3>可用团队技能</h3><p>当前原型没有配置可选择的团队技能。可在技能库核实团队技能审核状态和可用版本。</p></section>}
    <div className={css.inline}><strong>已选 {selectedItems.length} 项</strong><button type="button" onClick={()=>setSelectedItems([])}>清空</button></div>
   </div>
   :<div className={css.stack}>
    <p>仅引用已添加到我的知识库或团队知识库的内容，支持多选；不选择时不引用知识。</p>
    {agentKind==="pod"?<div className={css.segment}>{(["我的知识库","团队知识库"] as const).map(tab=><button type="button" key={tab} aria-pressed={knowledgeTab===tab} onClick={()=>setKnowledgeTab(tab)}>{tab}</button>)}</div>:null}
    {agentKind==="pod"&&knowledgeTab==="团队知识库"?<section className={css.panel}><h3>团队知识库</h3><p>当前演示没有可用的团队知识条目。正式使用需要按成员权限读取知识库。</p></section>:<section className={css.panel}><h3>{agentKind==="pod"?"我的知识库（示例）":"可用知识资料"}</h3>{(agentKind==="pod"?podKnowledgeSamples:availableKnowledge.map(name=>({name,description:"按需引用知识资料"}))).map(item=><label key={item.name} className={css.imageChoice}><input type="checkbox" checked={selectedItems.includes(item.name)} onChange={()=>flip(selectedItems,item.name,setSelectedItems)}/><span><strong>{item.name}</strong><small>{item.description}</small></span></label>)}</section>}
    <div className={css.inline}><strong>已选 {selectedItems.length} 项</strong><button type="button" onClick={()=>setSelectedItems([])}>清空</button></div>
    <p>示例仅供原型交互校验；正式引用以当前账号实际授权的知识库内容为准。</p>
   </div>}
   {maybeNotice}
  </main>
  {example?<div className={css.optimizerExampleOverlay} role="dialog" aria-modal="true" aria-label="优化任务示例说明">
   <div className={css.optimizerExampleWindow}>
    <header className={css.optimizerExampleHead}><div><strong>示例说明 · {example.target}第 {example.index+1} 张</strong><small>{(example.target==="主图"?initialOfficial:officialDetail)[example.index]} · 保温杯演示素材</small></div><button type="button" onClick={()=>{setExample(null);setExampleZoom(false);}} aria-label="关闭示例">×</button></header>
    <div className={css.optimizerExampleLayout}>
     <div className={css.optimizerExampleVisual}><button type="button" aria-label="点击放大示例图片" onClick={()=>setExampleZoom(true)}><img src={officialImageExampleUrl(example.target,example.index)} onError={event=>{const img=event.currentTarget;const fallback=officialImageExampleUrl(example.target,example.index,"svg");if(img.src!==new URL(fallback,window.location.href).href)img.src=fallback;}} alt={(example.target==="主图"?initialOfficial:officialDetail)[example.index]+"中文保温杯1:1示例"}/></button><small>1:1 中文演示图 · 点击图片放大查看</small></div>
     <aside className={css.optimizerExampleNotes}><h3>表达目标</h3><p>{officialExampleNotes[example.target][example.index][0]}</p><h3>示例重点</h3><p>{officialExampleNotes[example.target][example.index][1]}</p><p className={css.optimizerExampleCaution}>说明：此为演示保温杯示意图；材质、容量、保温时长等真实参数需依据实际商品资料核对。</p></aside>
    </div>
   </div>
   {exampleZoom?<div className={css.optimizerExampleZoom} role="dialog" aria-modal="true" aria-label="放大示例图片"><button type="button" onClick={()=>setExampleZoom(false)} aria-label="关闭放大图片">关闭放大</button><img src={officialImageExampleUrl(example.target,example.index)} onError={event=>{const img=event.currentTarget;const fallback=officialImageExampleUrl(example.target,example.index,"svg");if(img.src!==new URL(fallback,window.location.href).href)img.src=fallback;}} alt="放大后的1比1中文保温杯示例"/></div>:null}
  </div>:null}
  <footer className={css.footer}>{isProductImage&&!child?<><span className={css.optimizerFooterHint}>完成当前配置后确认选择</span><span className={css.optimizerFooterValidation}>{productImageReady?"已完成当前图片配置":"请先完成当前图片配置"}</span></>:null}<button type="button" onClick={()=>{if(child){setChild("");setMessage("");}else onClose();}}> {child==="add-image"?"取消":child?"返回":"取消"}</button><button type="button" className={css.primary} disabled={(isProductImage&&!child&&!productImageReady)||(child==="add-image"&&(sourceTab==="应用技能"?!form.selectedSkills?.length:sourceTab==="从本地上传"?!fileName:sourceTab==="自定义指令"?!assetName.trim():true))} onClick={()=>{
   if(child==="restore"){setSlots(initialHybridSlots(hybridShared?initial.hybridSlots:hybridTarget==="主图"?initial.hybridMainSlots??initial.hybridSlots:initial.hybridDetailSlots??initial.hybridSlots));setChild("");return;}
   if(child==="ai-images"){addManyAi();return;}
   if(child==="library"){
    if(!librarySelected){setMessage("请选择一张参考素材。");return;}
    setForm(v=>({...v,splitSource:"素材库",splitReference:librarySelected}));setChild("");setMessage("已选择原型素材示例；未读取真实素材库。");return;
   }
   if(child==="language"||child==="background"){setChild("");return;}
   if(child==="add-image"){
    if(sourceTab==="应用技能"){
     if(!form.selectedSkills?.length){setMessage("请先在步骤 3 启用技能。");return;}
     addSlot("技能·"+(hybridShared?"主图/详情图":hybridTarget)+"第"+(slotIndex+1)+"张");return;
    }
    if(sourceTab==="从本地上传"){
     if(!fileName){setMessage("请先选择本地图片。");return;}
     addSlot("本地·"+fileName);return;
    }
    if(sourceTab==="自定义指令"){
     if(!assetName.trim()){setMessage("请先填写生成指令。");return;}
     addSlot("AI·自定义指令");return;
    }
    setMessage("请从上方选择一项图片任务。");return;
   }
   if(child){setChild("");return;}
   if(isProductImage){saveProductImage();return;}
   if(mode==="pod-pattern-split"&&!form.splitReference?.trim()){setMessage("图片裂变需要先选择一张参考图片，不能空白保存。");return;}
   if(mode==="pod-pattern-custom"&&!form.patternPrompt?.trim()){setMessage("请填写生成指令后保存配置。");return;}
   if(isImage&&form.generationRule==="自定义指令"&&!tasks.some(t=>t.prompt.trim())){setMessage("请至少填写一条独立生成指令。");return;}
   commit();
  }}>{child==="add-image"?"确认应用":child?"确认选择":mode==="pod-hybrid"?"保存组合":mode==="skills"?"完成选择":mode==="knowledge"?"确认选择":mode==="product-image"?(productImageReady?"确认选择":"请先补全"):mode==="pod-ai"?"确认选择":"保存配置"}</button></footer>
 </dialog>;
}
