"use client";

import {useEffect,useId,useRef,useState} from "react";
import styles from "./showcase-agent-dialog.module.css";

export type AgentPreviewDialog =
 | {kind:"introduction";title:string;description:string;tags:readonly string[];status:string}
 | {kind:"model";title:string;model:"official"|"custom"}
 | {kind:"use";title:string};
type CustomForm={provider:string;model:string;apiKey:string;endpoint:string};
export function ShowcaseAgentDialog({dialog:info,onClose,onSaveModel,onSaveTemplate}:{
 dialog:AgentPreviewDialog;onClose:()=>void;
 onSaveModel:(title:string,model:"official"|"custom")=>void;
 onSaveTemplate?:(title:string,configuration:{skills:string[];knowledge:string[];imageOptimization:boolean;imageInstructions:string})=>void;
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
 useEffect(()=>{
  const previous=document.activeElement;
  const element=ref.current;
  if(element&&!element.open)element.showModal();
  return()=>{element?.close();if(previous instanceof HTMLElement&&previous.isConnected)previous.focus();};
 },[]);
 const isModel=info.kind==="model",isUse=info.kind==="use";
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
  onSaveTemplate?.(info.title,{skills,knowledge,imageOptimization,imageInstructions});
  onClose();
 };
 return <dialog ref={ref} className={`${styles.dialog} ${isUse?styles.useDialog:""}`} aria-labelledby={id}
   onCancel={event=>{event.preventDefault();onClose();}}
   onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
  <header className={styles.heading}>
   <h2 id={id}>{isUse?info.title:isModel?(step==="custom"?"自定义模型":"模型设置"):info.title}</h2>
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
  :<>
   <div className={styles.useLayout}>
    <div className={styles.useSteps}>
     <section className={styles.useStep}><h3>步骤 1 · 选择技能（可选）</h3><p>技能为可选项，可不选择；只运行实际启用的优化配置。</p><div className={styles.choiceRow}><div><strong>启用执行技能</strong><small>按需选择技能；未选择也可以保存模板。</small></div><span>{skills.length?`已启用 ${skills.length} 项`:"未启用"}</span></div><div className={styles.picks}>{["标题优化","商品描述优化","图片优化"].map(item=><label key={item}><input type="checkbox" checked={skills.includes(item)} onChange={()=>toggle(skills,setSkills,item)}/>{item}</label>)}</div></section>
     <section className={styles.useStep}><h3>步骤 2 · 选择知识库（可选）</h3><p>按需引用平台规则、品牌规范和商品资料。</p><div className={styles.choiceRow}><div><strong>使用知识库</strong><small>仅使用已选知识，不会自动引用整个知识库。</small></div><span>{knowledge.length?`已启用 ${knowledge.length} 项`:"未启用"}</span></div><div className={styles.picks}>{["平台规则","运营方法","合规参考"].map(item=><label key={item}><input type="checkbox" checked={knowledge.includes(item)} onChange={()=>toggle(knowledge,setKnowledge,item)}/>{item}</label>)}</div></section>
     <section className={styles.useStep}><h3>步骤 3 · 配置图片优化（按需）</h3><p>按需开启图片优化；关闭时不会修改图片。</p><div className={styles.choiceRow}><div><strong>AI 图片优化设置</strong><small>开启后可设置图片策略，以及主图 / 详情图的具体位置。</small></div><div className={styles.toggleButtons}><button className={imageOptimization?styles.activeToggle:""} type="button" onClick={()=>setImageOptimization(true)}>开启</button><button className={!imageOptimization?styles.activeToggle:""} type="button" onClick={()=>{setImageOptimization(false);setImageConfigured(false);}}>关闭</button></div></div>{imageOptimization?<label className={styles.imageInstructions}>图片优化指令（主图 / 详情图）<textarea aria-label="图片优化指令" rows={2} placeholder="输入图片处理范围和要求，示例预览不修改实际商品图片。" value={imageInstructions} onChange={e=>{setImageInstructions(e.target.value);setImageConfigured(false);}}/><button type="button" className={styles.secondary} onClick={()=>{if(imageInstructions.trim()){setImageConfigured(true);setMessage("");}else setMessage("请先填写图片优化指令。");}}>设置图片优化</button></label>:null}</section>
     <section className={styles.useStep}><h3>步骤 4 · 保存模板</h3><p>按需配置后保存模板；执行结果进入「待审核」。</p><div className={styles.actionsRow}><button className={styles.secondary} type="button" onClick={()=>setShowPreview(v=>!v)}>预览优化范围</button><button className={styles.primary} type="button" onClick={saveTemplate}>保存为模板</button></div>{showPreview?<p role="status" className={styles.inlineNotice}>技能：{skills.join("、")||"未启用"}；知识库：{knowledge.join("、")||"未启用"}；图片优化：{imageOptimization?"开启":"关闭"}。此处仅保存演示配置，不会自动执行任务。</p>:null}</section>
     {message?<p role="status" className={styles.inlineNotice}>{message}</p>:null}
    </div>
    <aside className={styles.useHelp}><h3>使用说明</h3><p>技能可按需提供处理规则，知识库提供参考依据。</p><h4>配置说明</h4><strong>技能按需启用</strong><p>仅执行已选技能；未选择时不运行技能处理。</p><strong>知识库提供参考依据</strong><p>引用已选知识，不会加载全部资料。</p><strong>图片优化</strong><p>开启后可指定主图和详情图。</p><h4>职责边界</h4><p>商品属性、SKU 和变体关系统一由「待补全」管理。</p><h4>结果去向</h4><p>已适配调用 · 待审核 · 发布</p></aside>
   </div>
  </>
  }
 </dialog>;
}
