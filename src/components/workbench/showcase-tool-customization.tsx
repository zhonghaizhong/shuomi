"use client";

import {useEffect,useRef,useState,type FormEvent} from "react";
// Reuse the agent customization stylesheet so both customization pages stay visually identical.
import styles from "./showcase-agent-customization.module.css";

type ToolRequest={name:string;scenario:string;kind:string;description:string;contactName:string;contactMethod:string};
const storage="shuomi:showcase-tool-custom-demo";
const processSteps=[
 ["01","提交需求","说明工具目标、业务场景与基础信息"],
 ["02","技术可行性评估","确认数据来源、接口权限和运行条件"],
 ["03","方案与报价确认","明确功能范围、交付周期和费用"],
 ["04","开发联调与验收","完成开发、接口测试与验收确认"],
 ["05","授权配置与启用","完成授权后进入我的工具"]
] as const;
function restore():ToolRequest|null{
 if(typeof window==="undefined")return null;
 try{const raw=sessionStorage.getItem(storage);return raw?JSON.parse(raw) as ToolRequest:null}
 catch{return null}
}
export function ShowcaseToolCustomization({pathname,navigate}:{pathname:string;navigate:(href:string)=>void}){
 const isNew=pathname.endsWith("/new"),isProgress=pathname.endsWith("/progress");
 const route=(suffix:string)=>navigate("/workbench/tools/custom"+suffix+"?preview=1");
 const [form,setForm]=useState<ToolRequest>({name:"",scenario:"",kind:"数据采集",description:"",contactName:"",contactMethod:""});
 const [consent,setConsent]=useState(false),[saved,setSaved]=useState<ToolRequest|null>(restore);
 const [draft,setDraft]=useState<ToolRequest|null>(null),[example,setExample]=useState(true);
 const [files,setFiles]=useState<string[]>([]),[fileError,setFileError]=useState(""),[saveError,setSaveError]=useState("");
 const update=(key:keyof ToolRequest,value:string)=>setForm(p=>({...p,[key]:value}));
 const submit=(e:FormEvent<HTMLFormElement>)=>{
  e.preventDefault();
  if(!form.name.trim()||!form.scenario.trim()||!form.description.trim()||!form.contactName.trim()||!form.contactMethod.trim()||!consent||fileError)return;
  setSaveError("");setDraft({...form});
 };
 const confirm=()=>{
  if(!draft)return;
  try{sessionStorage.setItem(storage,JSON.stringify(draft))}
  catch{setSaveError("当前浏览器无法保存演示记录，请检查会话存储权限后重试。");return}
  setSaved(draft);setDraft(null);setExample(false);route("/progress");
 };
 const activeTab=isNew?"submit":isProgress?"progress":"intro";
 const tabs=[
  {id:"intro",label:"定制介绍",suffix:""},
  {id:"submit",label:"提交需求",suffix:"/new"},
  {id:"progress",label:"查看进度",suffix:"/progress"}
 ] as const;
 return <div className={styles.page} data-tool-custom-page={pathname}>
  <header className={styles.header}>
   <div><small>工具市场 / 工具定制</small><h1>工具定制</h1><p>面向特殊业务场景，按需定制专属采集、系统连接及自动化工具。</p></div>
  </header>
  <nav className={styles.customTabs} aria-label="工具定制页面">
   {tabs.map(tab=><button type="button" key={tab.id} aria-current={activeTab===tab.id?"page":undefined} onClick={()=>route(tab.suffix)}>{tab.label}</button>)}
  </nav>
  <div className={styles.tabContent} key={activeTab}>
   {!isNew&&!isProgress?<section className={styles.intro}>
    <div className={styles.introLead}>
     <div><span className={styles.eyebrow}>专属工具 · 按需定制</span><h2>让复杂业务流程成为可调用的工具</h2><p>根据你的业务目标、数据来源和现有系统，评估采集、连接与自动化能力，形成可落地的定制方案。</p></div>
     <div className={styles.introService}><strong>定制服务说明</strong><p>提交需求和初步评估不产生费用。实施范围、接口条件、报价和交付周期以双方确认的方案为准。</p></div>
    </div>
    <div className={styles.introSectionHeading}><h2>可定制内容</h2><p>围绕数据、系统与执行流程的四种能力</p></div>
    <div className={styles.introFeatures}>
     {[
      ["01","数据采集","按授权范围采集网页、接口与文件数据，完成提取、清洗和批次整理。"],
      ["02","系统连接","对接 ERP、OMS 和第三方系统，定义接口字段及数据交换规则。"],
      ["03","自动化流程","配置触发条件、执行步骤、异常处理与必要的人工确认节点。"],
      ["04","输出与权限","约定交付格式、授权范围、验收标准和后续维护方式。"]
     ].map(([num,title,body])=><article key={num}><span>{num}</span><h3>{title}</h3><p>{body}</p></article>)}
    </div>
    <div className={styles.introSectionHeading}><h2>定制流程</h2><p>从需求评估到授权使用，每个阶段清晰可追踪</p></div>
    <div className={styles.introProcess}>
     {processSteps.map(([num,title,body])=><article key={num}><b>{num}</b><div><strong>{title}</strong><p>{body}</p></div></article>)}
    </div>
    <div className={styles.introNote}><span>服务说明</span><p>工具定制属于有偿服务，需先评估技术可行性，再确认开发方案、费用和交付安排；确认前不进入开发阶段。</p></div>
   </section>:isNew?<section className={styles.formLayout}>
    <form className={styles.card} onSubmit={submit}>
     <div className={styles.formIntro}><h2>告诉我们你希望定制什么工具</h2><small>* 为必填项</small></div>
     <p>说明业务目标、数据来源和运行场景，具体技术方案由专员沟通确认。</p>
     <h3>基本信息</h3>
     <div className={styles.two}>
      <label>工具需求名称 *<input aria-label="工具需求名称" required maxLength={100} value={form.name} onChange={e=>update("name",e.target.value)} placeholder="例如：商品数据自动采集与 ERP 同步工具"/></label>
      <label>使用场景 *<input aria-label="使用场景" required maxLength={100} value={form.scenario} onChange={e=>update("scenario",e.target.value)} placeholder="例如：跨境商品信息采集"/></label>
     </div>
     <fieldset className={styles.directions}><legend>定制工具类型 *</legend>
      {["数据采集","系统连接","自动化流程","其他"].map(kind=><button type="button" key={kind} aria-pressed={form.kind===kind} onClick={()=>update("kind",kind)}>{kind}</button>)}
     </fieldset>
     <h3>需求描述</h3>
     <label>工具功能与执行规则 *<textarea aria-label="工具功能与执行规则" required value={form.description} onChange={e=>update("description",e.target.value)} placeholder="请描述数据来源或目标系统、执行步骤、运行频率和预期输出。"/></label>
     <label className={styles.upload}>＋ 上传参考资料<input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.csv,.txt" aria-label="上传参考资料" onChange={e=>{
      const list=Array.from(e.target.files??[]);
      const invalid=list.length>3||list.some(item=>item.size>2*1024*1024||!item.size);
      setFiles(invalid?[]:list.map(item=>item.name));
      setFileError(invalid?"最多3个附件，每个不超过2 MiB。":"");
     }}/></label>
     <p>支持流程文档、接口文档或相关截图，非必填。{files.length?" 已选择："+files.join("、"):""}</p>
     {fileError?<p role="alert">{fileError}</p>:null}
     <h3>联系信息</h3>
     <div className={styles.two}>
      <label>联系人 *<input aria-label="联系人" required value={form.contactName} onChange={e=>update("contactName",e.target.value)} placeholder="请输入联系人姓名"/></label>
      <label>手机或微信 *<input aria-label="手机或微信" required value={form.contactMethod} onChange={e=>update("contactMethod",e.target.value)} placeholder="请输入方便联系的方式"/></label>
     </div>
     <label className={styles.consent}><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>允许平台专员通过预留联系方式沟通工具需求、方案及报价。</span></label>
     <p className={styles.disclaimer}>此为网页交互原型，提交仅保存到当前浏览器的演示记录，不会向平台发送真实申请或附件。请勿填写真实敏感信息。</p>
     <div className={styles.actions}><button type="button" onClick={()=>route("")}>取消</button><button type="submit" className={styles.primary} disabled={!consent||!!fileError||!form.name.trim()||!form.scenario.trim()||!form.description.trim()||!form.contactName.trim()||!form.contactMethod.trim()}>提交定制需求</button></div>
    </form>
    <aside className={styles.sideCards}>
     <article className={styles.card}><h3>有偿定制服务</h3><h2>先评估，再确认方案与报价</h2><p>需求提交不收费。专员了解数据来源、接口权限与业务目标后，再与你确认实施范围、交付方式及报价。</p></article>
     <article className={styles.card}><h2>提交后会发生什么</h2><div className={styles.sideSteps}>{[["01","专员联系"],["02","技术评估"],["03","方案与报价"]].map(([num,title])=><p key={num}><b>{num}</b>{title}</p>)}</div></article>
     <article className={styles.card}><h2>填写建议</h2><p>请尽量说明工具的输入、输出及操作规则。接口凭证和敏感资料可在正式评估阶段另行安全提供。</p></article>
    </aside>
   </section>:<section className={styles.progressPage}>
    <div className={styles.progressToolbar}><h2>需求记录</h2><p>查看示例办理状态，真实办理记录需要接入业务系统。</p><div><button type="button" aria-pressed={example} onClick={()=>setExample(true)}>查看示例</button><button type="button" aria-pressed={!example} onClick={()=>setExample(false)}>{saved?"本地演示记录":"暂无记录"}</button></div></div>
    {example||saved?<><article className={styles.card}><span className={styles.demoLabel}>{example?"演示需求 · 非真实记录":"本地演示需求 · 未提交服务器"}</span><h3>{example?"商品数据采集与 ERP 自动同步工具":saved?.name}</h3><p>{example?"按既定条件采集数据，执行去重、筛选并定时同步到企业系统。":saved?.description}</p><small>工具类型：{example?"数据采集":saved?.kind} · 使用场景：{example?"商品与系统数据同步":saved?.scenario}</small></article>
     <div className={styles.split}>
      <article className={styles.card}><h2>办理进度</h2><p>{example?"当前示例：技术评估":"本地演示：待正式提交"}</p><div className={styles.progressSteps}>{processSteps.map(([num,title,body],i)=><div key={num}><b>{num}</b><span><strong>{title}</strong><small>{body}</small></span><em>{example?(i===0?"已完成":i===1?"进行中":"待开始"):(i===0?"本地记录":"未开始")}</em></div>)}</div></article>
      <aside className={styles.card}><h2>现在需要做什么</h2><div className={styles.sideSteps}><p><b>01</b>{example?"当前阶段：技术可行性评估":"当前阶段：尚未正式提交"}</p><p><b>02</b>整理业务流程、接口说明和授权要求。</p><p><b>03</b>评估后确认技术方案、报价和交付安排。</p></div></aside>
     </div>
    </>:<div className={styles.card}><h2>暂无记录</h2><p>当前浏览器尚未保存工具定制演示需求，你可以提交一个演示申请，或切换查看示例。</p><button type="button" className={styles.primary} onClick={()=>route("/new")}>提交新需求</button></div>}
   </section>}
  </div>
  {draft?<ToolCustomizationConfirm draft={draft} error={saveError} onCancel={()=>{setDraft(null);setSaveError("")}} onConfirm={confirm}/>:null}
 </div>;
}
function ToolCustomizationConfirm({draft,error,onCancel,onConfirm}:{draft:ToolRequest;error:string;onCancel:()=>void;onConfirm:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  const previous=document.activeElement,element=dialog.current;
  if(element&&!element.open)element.showModal();
  return()=>{element?.close();if(previous instanceof HTMLElement&&previous.isConnected)previous.focus()};
 },[]);
 return <dialog ref={dialog} className={styles.confirmDialog} aria-labelledby="tool-confirm-title"
  onCancel={event=>{event.preventDefault();onCancel()}}
  onClick={event=>{if(event.target===event.currentTarget)onCancel()}}>
  <h2 id="tool-confirm-title">确认保存工具定制演示需求</h2>
  <p>这次操作只会在当前浏览器保存演示记录，不向平台发送真实申请或附件，也不会通知专员。</p>
  <strong>{draft.name}</strong>
  {error?<p role="alert">{error}</p>:null}
  <div className={styles.actions}><button type="button" onClick={onCancel}>取消</button><button type="button" className={styles.primary} onClick={onConfirm}>确认保存演示记录</button></div>
 </dialog>;
}
