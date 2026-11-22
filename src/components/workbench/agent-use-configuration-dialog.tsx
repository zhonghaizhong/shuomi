"use client";

import {useEffect,useId,useRef,useState} from "react";
import css from "./agent-use-configuration-dialog.module.css";

export type ConfigurationMode="product-image"|"pod-ai"|"pod-hybrid"|"pod-pattern-split"|"pod-pattern-custom"|"skills"|"knowledge";
export type ImageTask={id:number;name:string;prompt:string};
export type AgentUseConfiguration={
 imageUse?:"共用视觉素材"|"分别优化";
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
 splitStrength?:string;
 splitSource?:string;
 splitReference?:string;
 patternPrompt?:string;
 selectedSkills?:string[];
 selectedKnowledge?:string[];
};

const initialOfficial=["商品识别主图","核心购买理由","核心需求解决","产品结构确认","核心细节证据","核心使用场景","卖点选择理由","规格购买确认"];
const officialDetail=["核心购买理由","核心需求解决","核心使用场景","细节证据","功能卖点确认","使用体验延展","规格购买确认","购买理由总结"];
const availableSkills=["商品标题整理","商品描述优化","标准商品套图","场景化商品展示","POD图片生成","贴图优化","文案生成"];
const availableKnowledge=["平台规则","运营方法","合规参考"];
const languages=["不设置（默认关闭）","英语","中文","西班牙语","法语","德语","日语"];

export function AgentUseConfigurationDialog({mode,initial,onClose,onSave}:{
 mode:ConfigurationMode;initial:AgentUseConfiguration;onClose:()=>void;onSave:(value:AgentUseConfiguration)=>void;
}){
 const dialogRef=useRef<HTMLDialogElement>(null);
 const id=useId();
 const [form,setForm]=useState<AgentUseConfiguration>(initial);
 const [child,setChild]=useState<""|"add-image"|"language"|"background"|"source">("");
 const [sourceTab,setSourceTab]=useState("应用技能");
 const [slotIndex,setSlotIndex]=useState(0);
 const [selectedFromPicker,setSelectedFromPicker]=useState<string[]>([]);
 const [message,setMessage]=useState("");
 const [assetName,setAssetName]=useState("");
 const [fileName,setFileName]=useState("");
 const [tasks,setTasks]=useState<ImageTask[]>(initial.imageTasks?.length?initial.imageTasks:[{id:1,name:"自定义图片 1",prompt:""}]);
 const [selectedImgs,setSelectedImgs]=useState<number[]>(initial.selectedImages??[]);
 const [slots,setSlots]=useState<(string|null)[]>(Array.from({length:8},(_,i)=>initial.hybridSlots?.[i]??null));
 const [selectedItems,setSelectedItems]=useState<string[]>(mode==="knowledge"?initial.selectedKnowledge??[]:initial.selectedSkills??[]);

 useEffect(()=>{
  const previous=document.activeElement;
  const el=dialogRef.current;
  if(el&&!el.open)el.showModal();
  return()=>{el?.close();if(previous instanceof HTMLElement&&previous.isConnected)previous.focus();};
 },[]);

 const set=<K extends keyof AgentUseConfiguration>(key:K,value:AgentUseConfiguration[K])=>setForm(old=>({...old,[key]:value}));
 const flip=(array:string[],value:string,callback:(next:string[])=>void)=>callback(array.includes(value)?array.filter(x=>x!==value):[...array,value]);
 const title=child==="add-image"?"添加图片":child==="language"?"选择生图语言":child==="background"?"统一图片底色":child==="source"?"选择参考素材":({
  "product-image":"AI图片优化设置","pod-ai":"AI重构图片设置","pod-hybrid":"混合模式设置","pod-pattern-split":"图片裂变模式","pod-pattern-custom":"自定义指令模式","skills":"选择技能","knowledge":"选择知识库"
 } as Record<ConfigurationMode,string>)[mode];
 const desc=child==="add-image"?"选择图片来源，再将图片加入当前编排位置。":child==="language"?"不设置时不指定生图语言；选择后生效。":child==="background"?"不设置时不限制背景；选择后生效。":child==="source"?"请选择参考图片的来源，再选定具体图片。":({
  "product-image":"选择优化方式，再配置主图或详情图。",
  "pod-ai":"选择优化方式，再配置主图或详情图。",
  "pod-hybrid":"从多种图片来源自由组合，按需完成最终刊登图片编排。",
  "pod-pattern-split":"基于 1 张参考图片，生成配色、元素及排版不同的设计方案。",
  "pod-pattern-custom":"按用户具体创作要求生成贴图素材。",
  "skills":"按需选择我的技能或团队技能，不选也可以保存模板。",
  "knowledge":"仅引用实际勾选的知识资料，不会自动读取整个知识库。"
 } as Record<ConfigurationMode,string>)[mode];
 const commit=(next:AgentUseConfiguration=form)=>onSave({...next,
  ...(mode==="product-image"||mode==="pod-ai"?{imageTasks:tasks,selectedImages:selectedImgs}:{}),
  ...(mode==="pod-hybrid"?{hybridSlots:slots}:{}),
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
 const isImage=mode==="product-image"||mode==="pod-ai";
 const choice=(items:string[],value:string,change:(v:string)=>void)=><div className={css.segment}>{items.map(v=><button key={v} type="button" aria-pressed={value===v} onClick={()=>change(v)}>{v}</button>)}</div>;
 const maybeNotice=message?<p role="status" className={css.notice}>{message}</p>:null;
 return <dialog ref={dialogRef} className={css.modal} aria-labelledby={id} onCancel={event=>{event.preventDefault();if(child){setChild("");setMessage("");}else onClose();}} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
  <header className={css.head}><div><h2 id={id}>{title}</h2><p>{desc}</p></div><button type="button" className={css.close} aria-label="关闭配置弹窗" onClick={()=>child?setChild(""):onClose()}>×</button></header>
  <main className={css.body}>
   {child==="language"?<div className={css.optionGrid}>{languages.map(x=><button key={x} aria-pressed={(form.imageLanguage??languages[0])===x} onClick={()=>{set("imageLanguage",x);setChild("");}}>{x}</button>)}</div>
   :child==="background"?<div className={css.stack}><h3>背景指令</h3>{choice(["不设置","白色背景","自定义背景要求"],form.imageBackground??"不设置",x=>set("imageBackground",x))}{form.imageBackground==="自定义背景要求"?<label>自定义背景要求<textarea aria-label="自定义背景要求" value={form.imageBackgroundCustom??""} onChange={e=>set("imageBackgroundCustom",e.target.value)} placeholder="例如：浅灰摄影棚背景、柔和自然光、保持商品主体不变……" /></label>:null}<p>所有主图和详情图都会遵循此配置。</p></div>
   :child==="source"?<div className={css.optionGrid}>{["本地上传","素材库"].map(x=><button key={x} onClick={()=>{set("splitSource",x);setChild("");setMessage(x==="素材库"?"素材库尚未接入，当前可保存来源选择。":"选择了本地图片来源。");}}>{x}</button>)}</div>
   :child==="add-image"?<>
    <div className={css.tabGrid}>{["应用技能","预设指令AI重构","从本地上传","自定义指令"].map(t=><button key={t} aria-pressed={sourceTab===t} onClick={()=>setSourceTab(t)}>{t}</button>)}</div>
    <section className={css.panel}><h3>{sourceTab}</h3>
     {sourceTab==="应用技能"?<><p>沿用步骤 3 已启用的技能，按图片所在位置匹配。</p><button type="button" onClick={()=>addSlot("技能·"+String(slotIndex+1).padStart(2,"0"))}>应用到当前编排位置</button></>
     :sourceTab==="预设指令AI重构"?<div className={css.optionGrid}>{(form.hybridTarget==="详情图"?officialDetail:initialOfficial).map((name,i)=><button key={name} onClick={()=>addSlot("AI·"+name)}>{String(i+1).padStart(2,"0")} · {name}</button>)}</div>
     :sourceTab==="从本地上传"?<><label>选择图片文件<input type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0];setFileName(file?.name??"");}}/></label><p>演示版不上传文件至服务器。</p><button type="button" disabled={!fileName} onClick={()=>addSlot("本地·"+fileName)}>确认添加所选图片</button></>
     :<><label>自定义图片指令<textarea value={assetName} onChange={e=>setAssetName(e.target.value)} placeholder="例如：服装产品主体、面料质感、英文卖点、1:1 构图"/></label><button type="button" disabled={!assetName.trim()} onClick={()=>addSlot("AI·自定义指令")}>应用当前指令</button></>}
    </section>
   </>
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
    <div className={css.inline}><span>配置对象</span>{choice(["主图","详情图"],form.hybridTarget??"主图",x=>set("hybridTarget",x as AgentUseConfiguration["hybridTarget"]))}<span>视觉策略</span>{choice(["共用视觉素材","分别生成"],form.hybridStrategy??"共用视觉素材",x=>set("hybridStrategy",x as AgentUseConfiguration["hybridStrategy"]))}</div>
    <section className={css.panel}><h3>图片添加说明</h3><p>图片来源：应用技能、预设指令AI重构、本地上传、自定义指令。</p><p>编排方式：点击图片位置的“＋”添加；已添加图片可更换或移除。</p></section>
    <h3>最终图片编排</h3><p>最多 8 张图片，按位置添加；支持更换和删除。</p>
    <div className={css.slotGrid}>{slots.map((v,i)=><div className={css.slot} key={i}><small>{String(i+1).padStart(2,"0")}</small><button type="button" aria-label={"添加第 "+(i+1)+" 张图片"} onClick={()=>{setSlotIndex(i);setSourceTab("应用技能");setChild("add-image");}}>{v?<span>{v}</span>:"＋"}</button>{v?<button type="button" aria-label={"移除第 "+(i+1)+" 张图片"} onClick={()=>setSlots(old=>old.map((x,j)=>j===i?null:x))}>×</button>:null}</div>)}</div>
    <div className={css.toolbar}><button type="button" onClick={()=>setChild("language")}>语言：{form.imageLanguage??"不设置"}</button><button type="button" onClick={()=>setChild("background")}>底色：{form.imageBackground??"不设置"}</button></div>
   </div>
   :mode==="pod-pattern-split"?<div className={css.stack}><label>参考素材<button type="button" className={css.sourceButton} onClick={()=>setChild("source")}>＋ 上传图片 / 从素材库选择</button></label><p>{form.splitSource?"当前来源："+form.splitSource:"从本地或素材库中选择 1 张参考图片"}</p>{form.splitSource==="本地上传"?<label>选择参考图片<input type="file" accept="image/*" onChange={e=>set("splitReference",e.target.files?.[0]?.name??"")}/></label>:null}<h3>裂变强度</h3><div className={css.optionGrid}>{["保守变化","适度创新","大胆裂变"].map(x=><button type="button" key={x} aria-pressed={(form.splitStrength??"适度创新")===x} onClick={()=>set("splitStrength",x)}>{x}</button>)}</div><p>保留主体关键特征，可调整色彩、细节和局部排版。</p></div>
   :mode==="pod-pattern-custom"?<div className={css.stack}><label>生成指令<textarea aria-label="生成指令" rows={5} placeholder="例如：黑色底，朋克风，加入不同样式的闪电和英文短句，适合腰部印刷……" value={form.patternPrompt??""} onChange={e=>set("patternPrompt",e.target.value)}/></label><p>AI 会优先遵循你的指令，同时自动做印刷适配与合规检查（实际能力待接入）。</p></div>
   :<div className={css.stack}><p>按需勾选，可多选，不选择也可以保存模板。</p><div className={css.optionGrid}>{(mode==="skills"?availableSkills:availableKnowledge).map(x=><label className={css.imageChoice} key={x}><input type="checkbox" checked={selectedItems.includes(x)} onChange={()=>flip(selectedItems,x,setSelectedItems)}/>{x}</label>)}</div></div>}
   {maybeNotice}
  </main>
  <footer className={css.footer}><button type="button" onClick={()=>{if(child){setChild("");setMessage("");}else onClose();}}> {child?"返回":"取消"}</button><button type="button" className={css.primary} onClick={()=>{
   if(child==="language"||child==="background"){setChild("");return;}
   if(child){setChild("");return;}
   if(mode==="pod-pattern-custom"&&!form.patternPrompt?.trim()){setMessage("请填写生成指令后保存配置。");return;}
   if(isImage&&form.generationRule==="自定义指令"&&!tasks.some(t=>t.prompt.trim())){setMessage("请至少填写一条独立生成指令。");return;}
   commit();
  }}>{child?"确认选择":mode==="pod-hybrid"?"保存组合":mode==="skills"||mode==="knowledge"?"确认选择":mode==="pod-ai"||mode==="product-image"?"确认选择":"保存配置"}</button></footer>
 </dialog>;
}
