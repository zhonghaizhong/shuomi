"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import styles from "./showcase-tool-market.module.css";
import {addDemoCollectionBatch} from "./showcase-collection-batches";

type Tool = { name: string; description: string; category: string; tags: [string,string]; status: "ready" | "development"; color: string };
const tools: Tool[] = [
  {name:"商品采集插件",description:"采集支持平台的标题、图片和规格，整理数据用于后续商品适配。",category:"采集",tags:["商品采集","我的数据"],status:"ready",color:"#62a9ff"},
  {name:"POD素材管理工具",description:"管理贴图图案与审核流程，按订单检索素材并辅助打印。",category:"图片",tags:["自有素材","官方灵感市场"],status:"ready",color:"#4fd1bd"},
  {name:"自有商品刊登工具",description:"导入并管理自有商品资料，检查必填信息后进行适配。",category:"其他",tags:["自有商品","快速刊登"],status:"ready",color:"#ad8aff"},
  {name:"指纹浏览器",description:"规划隔离店铺登录环境，方便区分不同账号的使用。",category:"环境",tags:["环境隔离","多账号"],status:"development",color:"#4dc7dc"},
  {name:"图片处理工具",description:"规划提供批量裁剪与去背景，减少重复处理图片的工作。",category:"图片",tags:["图片处理","批量优化"],status:"development",color:"#f4bf64"},
  {name:"数据导入工具",description:"规划以表格批量导入资料，按字段规则检查映射内容。",category:"数据",tags:["表格导入","字段映射"],status:"development",color:"#62a9ff"},
  {name:"自动化工具",description:"规划按规则执行重复步骤，方便统一管理流程与任务。",category:"流程",tags:["流程自动化","定时执行"],status:"development",color:"#4fd1bd"},
  {name:"批量刊登工具",description:"规划批量整理并发布商品，辅助选择目标店铺进行刊登。",category:"其他",tags:["批量刊登","多店铺"],status:"development",color:"#ad8aff"},
  {name:"订单处理工具",description:"规划集中查看订单状态，辅助识别待处理与异常订单。",category:"其他",tags:["订单汇总","异常处理"],status:"development",color:"#f38eb3"},
  {name:"库存同步工具",description:"规划汇总多渠道库存变化，辅助识别数量差异与异常。",category:"数据",tags:["库存同步","异常提醒"],status:"development",color:"#4dc7dc"},
];
type Dialog = {type:"intro"|"download"|"disable"|"launch";name:string};
const activationStorage="shuomi:showcase-tools-demo";
function restoreEnabled():string[] {
  if(typeof window==="undefined")return ["POD素材管理工具"];
  try { const raw=sessionStorage.getItem(activationStorage);return raw?JSON.parse(raw) as string[]:["POD素材管理工具"]; }
  catch {return ["POD素材管理工具"];}
}

type AcquisitionRecord = {
  id: string; mode: "local" | "online"; url: string;
  title: string; price: string; sku: string; createdAt: string;
};
const demoAcquisitionKey="shuomi:showcase-acquisition-records-v1";
function restoreAcquisitions():AcquisitionRecord[] {
  try {
    const value=JSON.parse(sessionStorage.getItem(demoAcquisitionKey)||"[]") as unknown;
    return Array.isArray(value)?value.filter((x):x is AcquisitionRecord=>Boolean(x&&typeof x==="object"&&"id" in x&&"url" in x&&"mode" in x)).slice(0,30):[];
  }catch{return [];}
}
function AcquisitionSimulator({mode,onClose}:{mode:"local"|"online";onClose:()=>void}) {
  const ref=useRef<HTMLDialogElement>(null),id=useId();
  const [installed,setInstalled]=useState(false);
  const [url,setUrl]=useState("");
  const [title,setTitle]=useState("");
  const [price,setPrice]=useState("");
  const [sku,setSku]=useState("");
  const [records,setRecords]=useState<AcquisitionRecord[]>(restoreAcquisitions);
  const [view,setView]=useState<"capture"|"records">("capture");
  const [error,setError]=useState("");
  const [created,setCreated]=useState("");
  useEffect(()=>{
    const el=ref.current,prev=document.activeElement;
    el?.showModal();
    return ()=>{el?.close();if(prev instanceof HTMLElement&&prev.isConnected)prev.focus();};
  },[]);
  const submit=(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    setError("");
    if(mode==="local"&&!installed){setError("请先完成模拟插件安装。");return;}
    let parsed:URL;
    try{parsed=new URL(url.trim());}catch{setError("请输入完整的 http 或 https 商品链接。");return;}
    if(!["http:","https:"].includes(parsed.protocol)){setError("仅支持 http 或 https 商品链接。");return;}
    if(!title.trim()){setError("请填写用于演示的商品标题。");return;}
    if(price.trim()&&(!Number.isFinite(Number(price))||Number(price)<0)){setError("商品价格请输入有效的非负数字。");return;}
    const record:AcquisitionRecord={
      id:"MOCK-"+Date.now().toString(36),mode,url:parsed.toString(),
      title:title.trim(),price:price.trim()||"未填写",sku:sku.trim()||"未填写",
      createdAt:new Date().toLocaleString("zh-CN",{hour12:false})
    };
    const next=[record,...records].slice(0,30);
    setRecords(next);
    try{sessionStorage.setItem(demoAcquisitionKey,JSON.stringify(next));}catch{setError("采集已模拟完成，但浏览器禁止保存会话记录。");}
    setCreated(record.id);
    setView("records");
  };
  return <dialog ref={ref} className={`${styles.dialog} ${styles.launchDialog} ${styles.acquisitionDialog}`}
    aria-labelledby={id} onCancel={e=>{e.preventDefault();onClose();}}
    onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <header><h2 id={id}>{mode==="local"?"本地插件采集":"在线采集"}</h2>
      <button type="button" aria-label="关闭弹窗" onClick={onClose}>×</button></header>
    {mode==="online"?<section className={styles.acquisitionFigmaSummary} aria-label="在线采集说明">
      <p>由平台云端执行，无需客户电脑持续运行即可完成在线采集。</p>
      <div><span>按数据收费</span><strong>按实际采集数据条数扣除额度</strong></div>
      <p>采集结果统一保存至「数据服务 / 我的数据」</p>
    </section>:null}
    <p className={styles.acquisitionDemoNotice}>当前为操作演示：不会安装浏览器插件、访问第三方平台或扣除真实数据额度。</p>
    <div className={styles.acquisitionTabs} role="group" aria-label="采集功能">
      <button type="button" aria-pressed={view==="capture"} onClick={()=>setView("capture")}>采集商品</button>
      <button type="button" aria-pressed={view==="records"} onClick={()=>setView("records")}>我的数据（演示） {records.length}</button>
    </div>
    {view==="capture"?<div className={styles.acquisitionBody}>
      {mode==="local"?<p>安装在客户电脑本地运行，浏览商品时通过浏览器插件直接采集。</p>:<h3 className={styles.acquisitionFormTitle}>采集任务配置 <span>演示</span></h3>}
      {mode==="local"?<p className={styles.acquisitionPricing}>免费 · 不消耗数据额度</p>:null}
      {mode==="local"?<div className={styles.acquisitionInstall}>
        <div><strong>浏览器插件</strong><span>{installed?"已模拟安装，可进行采集":"尚未模拟安装"}</span></div>
        <button type="button" onClick={()=>setInstalled(true)} disabled={installed}>{installed?"模拟安装完成":"模拟安装插件"}</button>
      </div>:null}
      <form className={styles.acquisitionForm} onSubmit={submit}>
        <label>商品链接 *
          <input type="url" required value={url} onChange={e=>setUrl(e.target.value)}
            placeholder="https://example.com/product/123" />
        </label>
        <label>商品标题（演示） *
          <input required maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} placeholder="输入模拟商品标题" />
        </label>
        <div className={styles.acquisitionFields}>
          <label>商品价格（演示）
            <input type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} placeholder="例如 29.90" />
          </label>
          <label>SKU / 规格（演示）
            <input maxLength={80} value={sku} onChange={e=>setSku(e.target.value)} placeholder="例如 BLACK-M" />
          </label>
        </div>
        {error?<p role="alert" className={styles.acquisitionError}>{error}</p>:null}
        <button type="submit" className={styles.primary}>{mode==="local"?"模拟插件采集":"开始模拟在线采集"}</button>
      </form>
      <p className={styles.acquisitionDestination}>{mode==="online"?"本次模拟结果仅保存于当前浏览器会话，不写入正式「我的数据」。":"结果去向：数据服务 / 我的数据（仅当前浏览器演示记录）"}</p>
    </div>:<div className={styles.acquisitionBody}>
      {created?<p role="status" className={styles.acquisitionSuccess}>模拟采集已完成，记录 {created} 已加入我的数据（演示）。</p>:null}
      {records.length?<div className={styles.acquisitionRecords}>{records.map(x=>
        <article key={x.id} className={styles.acquisitionRecord}>
          <div><strong>{x.title}</strong><span>{x.mode==="local"?"本地插件":"在线采集"} · {x.createdAt}</span></div>
          <p>价格：{x.price} · SKU / 规格：{x.sku}</p>
          <p className={styles.acquisitionUrl}>{x.url}</p>
        </article>
      )}</div>:<p>暂无采集记录。可以返回采集商品，创建一条模拟数据。</p>}
      <button type="button" onClick={()=>{setCreated("");setView("capture")}}>继续采集</button>
    </div>}
    <footer><button type="button" onClick={onClose}>关闭</button></footer>
  </dialog>;
}


type OnlineSource = "amazon"|"1688";
type OnlineEntry = "source"|"configure"|"rules"|"done";
const amazonSites=["美国站","英国站","德国站","法国站","意大利站","西班牙站","日本站","加拿大站"];
function FigmaOnlineCollection({onClose,organizationId,memberId}:{onClose:()=>void;organizationId:string;memberId:string}) {
  const ref=useRef<HTMLDialogElement>(null),id=useId();
  const [step,setStep]=useState<OnlineEntry>("source");
  const [source,setSource]=useState<OnlineSource>("amazon");
  const [site,setSite]=useState("美国站");
  const [mode,setMode]=useState<"指定商品"|"按页采集"|"按关键词">("指定商品");
  const [inputMode,setInputMode]=useState<"商品链接"|"ASIN">("商品链接");
  const [entries,setEntries]=useState("");
  const [rule,setRule]=useState("");
  const [templates,setTemplates]=useState(source==="amazon"?["标准规则","低价高评分","高库存商品"]:["标准规则","低采购价","低起批量"]);
  const [activeTemplate,setActiveTemplate]=useState("标准规则");
  const [ruleName,setRuleName]=useState("标准规则");
  const [minPrice,setMinPrice]=useState("");
  const [maxPrice,setMaxPrice]=useState("");
  const [minStock,setMinStock]=useState("");
  const [minRating,setMinRating]=useState("");
  const [purchaseRange,setPurchaseRange]=useState("");
  const [batchQuantity,setBatchQuantity]=useState("");
  const [moreCondition,setMoreCondition]=useState(false);
  const [autoUpload,setAutoUpload]=useState(false);
  const [error,setError]=useState("");
  const [saved,setSaved]=useState(0);
  useEffect(()=>{
    const el=ref.current,prev=document.activeElement;
    el?.showModal();
    return ()=>{el?.close();if(prev instanceof HTMLElement&&prev.isConnected)prev.focus();};
  },[]);
  const choose=(next:OnlineSource)=>{
    setSource(next);setMode("指定商品");setInputMode("商品链接");setEntries("");setError("");
    setTemplates(next==="amazon"?["标准规则","低价高评分","高库存商品"]:["标准规则","低采购价","低起批量"]);
    setActiveTemplate("标准规则");setRuleName("标准规则");setRule("");
    setStep("configure");
  };
  const submit=(e:React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
    const values=entries.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
    if(!values.length){setError("请填写采集内容。");return;}
    if(mode==="指定商品"&&inputMode==="商品链接"){
      if(values.some(value=>{try{const u=new URL(value);return !["http:","https:"].includes(u.protocol)}catch{return true}})){setError("请输入完整的商品链接，每行一条。");return;}
    }
    if(values.length>30){setError("演示模式一次最多输入 30 条。");return;}
    const previous=restoreAcquisitions();
    const now=Date.now();
    const next=values.map((value,index):AcquisitionRecord=>({
      id:"MOCK-"+(now+index).toString(36),mode:"online",url:value,
      title:`${source==="amazon"?"亚马逊":"1688"} · ${mode} · 演示记录`,
      price:"未采集",sku:mode==="指定商品"&&inputMode==="ASIN"?value:"未采集",
      createdAt:new Date(now).toLocaleString("zh-CN",{hour12:false})
    }));
    const batch=addDemoCollectionBatch(organizationId,memberId,source==="1688"?"1688":"Amazon",mode,values);
    if(!batch){setError("保存到我的数据失败，请检查浏览器会话存储权限。");return;}
    try{sessionStorage.setItem(demoAcquisitionKey,JSON.stringify([...next,...previous].slice(0,30)));}catch{}
    setSaved(batch.products.length);setStep("done");setError("");
  };
  return <dialog ref={ref} className={`${styles.dialog} ${styles.launchDialog} ${styles.figmaAcquisitionDialog}`}
    aria-labelledby={id} onCancel={e=>{e.preventDefault();onClose();}}
    onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    {step==="source"?<div className={styles.figmaSource}>
      <div className={styles.figmaSourceTitle}><h2 id={id}>选择在线采集来源</h2><span>按数据收费</span></div>
      <p>当前支持亚马逊和1688，请选择对应商品来源。</p>
      <div className={styles.figmaSourceGrid}>
        <section><strong>亚马逊采集</strong><p>采集 Amazon 商品详情数据</p><p>支持亚马逊商品链接</p><button type="button" onClick={()=>choose("amazon")}>进入亚马逊采集</button></section>
        <section><strong>1688采集</strong><p>采集1688货源商品详情数据</p><p>支持1688商品链接</p><button type="button" onClick={()=>choose("1688")}>进入1688采集</button></section>
      </div>
      <p className={styles.figmaChargeNote}>两种在线采集均按实际采集的数据条数扣除数据额度。</p>
      <footer><button type="button" onClick={onClose}>取消</button></footer>
    </div>:step==="configure"?<form className={styles.figmaConfigure} onSubmit={submit}>
      <div className={styles.figmaSourceTitle}><h2 id={id}>{source==="amazon"?"亚马逊在线采集":"1688在线采集"}</h2><span>{source==="amazon"?"亚马逊":"1688"} · 按数据量计费</span></div>
      <p>{source==="amazon"?"请先选择站点，再选择采集方式。":"支持指定商品、按页、按关键词三种采集方式。"}</p>
      <div className={styles.figmaConfigGroup}>
        {source==="amazon"?<label className={styles.figmaRowLabel}>站点<select aria-label="站点" value={site} onChange={e=>setSite(e.target.value)}>{amazonSites.map(x=><option key={x}>{x}</option>)}</select></label>:null}
        <div className={styles.figmaModeRow}><span>采集方式</span><div className={styles.figmaSegments} role="group" aria-label="采集方式">{(["指定商品","按页采集","按关键词"] as const).map(x=><button type="button" key={x} aria-pressed={mode===x} onClick={()=>{setMode(x);setEntries("");setError("");}}>{x}</button>)}</div></div>
      </div>
      <div className={styles.figmaInputGroup}>
        <div className={styles.figmaInputHeading}><strong>{mode==="指定商品"?(source==="amazon"?"输入内容":"1688 商品链接"):mode==="按页采集"?"输入页面地址":"输入关键词"}</strong>
          {source==="amazon"&&mode==="指定商品"?<div className={styles.figmaSegments} role="group" aria-label="输入方式">{(["商品链接","ASIN"] as const).map(x=><button type="button" key={x} aria-pressed={inputMode===x} onClick={()=>{setInputMode(x);setEntries("");setError("");}}>{x}</button>)}</div>:null}
        </div>
        <textarea aria-label={mode==="指定商品"?(source==="amazon"&&inputMode==="ASIN"?"ASIN":"商品链接"):mode==="按页采集"?"页面链接":"关键词"}
          rows={4} value={entries} onChange={e=>setEntries(e.target.value)}
          placeholder={mode==="指定商品"?(source==="amazon"&&inputMode==="ASIN"?"输入亚马逊 ASIN，支持批量输入，每行一条":`粘贴${source==="amazon"?"亚马逊":"1688"}商品链接，支持批量输入，每行一条`):mode==="按页采集"?"输入商品列表页面链接，每行一条":"输入商品关键词，每行一条"}/>
      </div>
      <p className={styles.figmaBill}>按实际采集成功的数据条数扣除数据额度；采集规则不影响计费。</p>
      <div className={styles.figmaAfter}>
        <strong>采集后处理</strong>
        <p>采集结果全部保存至「数据服务 / 我的数据」</p>
        <label className={styles.figmaToggleRow}>采集后自动转入待上传<input type="checkbox" checked={autoUpload} onChange={e=>setAutoUpload(e.target.checked)}/></label>
        <small>开启后转入待上传；关闭后仅保存至「我的数据」。</small>
      </div>
      <div className={styles.figmaRules}>
        <label>采集规则<select aria-label="采集规则" value={rule} onChange={e=>setRule(e.target.value)}>
          <option value="">选择采集规则（可选）</option>{templates.map(name=><option key={name} value={name}>{name}</option>)}
        </select></label>
        <button type="button" onClick={()=>setStep("rules")}>设置规则</button>
      </div>
      <p className={styles.figmaDemoCaption}>演示模式：仅保存当前浏览器模拟记录，不调用真实采集接口或扣除额度；自动转入待上传不会写入正式业务数据。</p>
      {error?<p role="alert" className={styles.acquisitionError}>{error}</p>:null}
      <footer><button type="button" onClick={()=>{setError("");setStep("source");}}>取消</button><button type="submit" className={styles.primary}>开始采集</button></footer>
    </form>:step==="rules"?<div className={styles.figmaRulePage}>
      <div className={styles.figmaRuleHeader}>
        <h2 id={id}>{source==="amazon"?"亚马逊采集规则":"1688采集规则"}</h2>
        <p>{source==="amazon"?"管理并复用采集规则模板。":"设置1688采集后的筛选条件；规则只影响后续处理，不影响采集范围。"}</p>
      </div>
      {source==="amazon"?<div className={styles.figmaRuleColumns}>
        <aside className={styles.figmaTemplateList}>
          <strong>规则模板</strong>
          {templates.map(name=><button key={name} type="button" aria-pressed={activeTemplate===name} onClick={()=>{
            setActiveTemplate(name);setRuleName(name);
            if(name==="低价高评分"){setMinPrice("");setMaxPrice("20");setMinRating("4.5");setMinStock("");}
            else if(name==="高库存商品"){setMinPrice("");setMaxPrice("");setMinRating("");setMinStock("50");}
          }}><strong>{name}</strong><small>{name==="标准规则"?"价格 / 库存 / 评分":name==="低价高评分"?"价格≤20 · 评分≥4.5":name==="高库存商品"?"库存≥50":"自定义模板"}</small></button>)}
          <button type="button" onClick={()=>{const name="新建模板"+(templates.length+1);setTemplates([...templates,name]);setActiveTemplate(name);setRuleName(name);setMinPrice("");setMaxPrice("");setMinStock("");setMinRating("");}}>＋ 新建模板</button>
        </aside>
        <div className={styles.figmaTemplateSettings}>
          <div className={styles.figmaTemplateName}><label>模板名称<input value={ruleName} onChange={e=>setRuleName(e.target.value)} maxLength={30}/></label>
            <button type="button" onClick={()=>{if(!ruleName.trim())return;setTemplates(templates.map(x=>x===activeTemplate?ruleName.trim():x));setActiveTemplate(ruleName.trim());}}>保存名称</button>
            <button type="button" onClick={()=>{if(templates.length<=1)return;const list=templates.filter(x=>x!==activeTemplate);setTemplates(list);setActiveTemplate(list[0]);setRuleName(list[0]);}}>删除模板</button>
          </div>
          <div className={styles.figmaRuleHelp}><strong>规则说明</strong><p>在线采集先完整采集并正常计费，再按当前规则筛选进入后续处理。</p><p>不符合规则的商品仍保留在「我的数据」中。</p></div>
          <div className={styles.figmaRuleConditions}><div><strong>筛选条件</strong><span>同时满足</span></div>
            <label>价格<div><input aria-label="最低价" type="number" min="0" placeholder="最低价" value={minPrice} onChange={e=>setMinPrice(e.target.value)}/><span>—</span><input aria-label="最高价" type="number" min="0" placeholder="最高价" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)}/></div></label>
            <label>库存<input aria-label="最低库存" type="number" min="0" placeholder="请输入最低库存" value={minStock} onChange={e=>setMinStock(e.target.value)}/></label>
            <label>评分<input aria-label="最低评分" type="number" min="0" max="5" step="0.1" placeholder="最低评分，如 4.0" value={minRating} onChange={e=>setMinRating(e.target.value)}/></label>
            <p>未填写的条件不参与筛选。</p>
          </div>
        </div>
      </div>:<div className={styles.figma1688Rules}>
        <div className={styles.figmaRuleHelp}><strong>重要说明</strong><p>1688在线采集会先采集本次提交范围内的全部商品，并按实际采集数据正常计费。</p><p>采集完成后，再按以下规则筛选进入后续处理的商品。</p><p>不符合规则的商品仍会保留在「我的数据」中，可随时查看或再次使用。</p></div>
        <div className={styles.figmaRuleConditions}>
          <div><strong>筛选条件</strong><span>满足全部条件</span></div>
          <p>1688货源支持按采购价、起批量筛选。</p>
          <label>采购价 <span>介于</span><input aria-label="采购价范围" value={purchaseRange} onChange={e=>setPurchaseRange(e.target.value)} placeholder="10 - 100 RMB"/></label>
          <label>起批量 <span>小于等于</span><input aria-label="起批量" type="number" min="0" value={batchQuantity} onChange={e=>setBatchQuantity(e.target.value)} placeholder="5"/></label>
          {moreCondition?<label>采购价 <span>小于等于</span><input aria-label="附加采购价" placeholder="请输入采购价"/></label>:null}
          <button type="button" onClick={()=>setMoreCondition(!moreCondition)}>{moreCondition?"移除附加条件":"＋ 添加筛选条件"}</button>
          <p>未设置筛选条件时，采集结果将全部进入后续流程。</p>
        </div>
      </div>}
      <div className={styles.figmaRuleFooter}><button type="button" onClick={()=>setStep("configure")}>取消</button><button type="button" className={styles.primary} onClick={()=>{
        setRule(source==="amazon"?activeTemplate:"标准规则");setStep("configure");
      }}>{source==="amazon"?"保存模板":"保存设置"}</button></div>
    </div>:<div className={styles.figmaDone}>
      <h2 id={id}>采集任务已模拟完成</h2>
      <p role="status">已记录 {saved} 条{source==="amazon"?"亚马逊":"1688"}演示数据。</p>
      <p>已保存为当前账号专属的演示批次，可在「数据服务 / 我的数据 → 采集批次」查看。不会调用1688真实接口或扣费。</p>
      <footer><button type="button" onClick={()=>{setStep("configure");setEntries("");}}>继续采集</button><button type="button" className={styles.primary} onClick={onClose}>知道了</button></footer>
    </div>}
  </dialog>;
}

function ToolModal({info,onClose,onConfirm,organizationId,memberId}:{info:Dialog;onClose:()=>void;onConfirm:()=>void;organizationId:string;memberId:string}) {
  const ref=useRef<HTMLDialogElement>(null), id=useId();
  const [selectedFeature,setSelectedFeature]=useState(0);
  const tool=tools.find(x=>x.name===info.name);
  useEffect(()=>{const el=ref.current,prev=document.activeElement;el?.showModal();return ()=>{el?.close();if(prev instanceof HTMLElement&&prev.isConnected)prev.focus();};},[]);
  const isAcquisition=info.name==="商品采集插件";
  const features=info.name==="POD素材管理工具"?[
    ["我的素材","上传、分类管理个人素材，支持图片裂变"],
    ["产品图审核","审核通过后贴到商品；下单可检索原图"],
    ["灵感市场","官方维护示例图片及生成指令"]
  ]:info.name==="自有商品刊登工具"?[
    ["自有商品导入","导入自有商品资料"],
    ["商品信息适配","核对并完善商品信息"],
    ["批量刊登","批量处理商品刊登"]
  ]:isAcquisition?[
    ["本地插件采集","安装在客户电脑本地运行，浏览商品时通过浏览器插件直接采集。"],
    ["在线采集","由平台云端执行，无需客户电脑持续运行即可完成在线采集。"]
  ]:[["功能说明",tool?.description??"请选择工具功能"]];
  const title=info.type==="download"?"下载商品采集插件":info.type==="disable"?"确认停用工具":info.type==="launch"?info.name:info.name;
  if(isAcquisition&&info.type==="download")return <AcquisitionSimulator mode="local" onClose={onClose}/>;
  if(isAcquisition&&info.type==="launch")return <FigmaOnlineCollection onClose={onClose} organizationId={organizationId} memberId={memberId}/>;
  return <dialog ref={ref} className={`${styles.dialog} ${info.type==="launch"?styles.launchDialog:""} ${info.type==="launch"&&(info.name==="POD素材管理工具"||info.name==="自有商品刊登工具")?styles.figmaToolDialog:""}`} aria-labelledby={id} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <header><h2 id={id}>{title}</h2><button type="button" onClick={onClose} aria-label="关闭弹窗">×</button></header>
    {info.type==="download"?<>
      <p>下载安装到自己的电脑，在商品页面直接使用。</p>
      <dl className={styles.downloadDetails}><div><dt>使用方式</dt><dd>电脑端安装插件</dd></div><div><dt>费用</dt><dd>免费 · 不消耗数据额度</dd></div><div><dt>采集方式</dt><dd>打开目标商品页后点击插件采集</dd></div><div><dt>结果去向</dt><dd>数据服务 — 我的数据</dd></div></dl>
      <p>下载后按安装提示完成浏览器插件安装。</p><p className={styles.demoNote}>当前公开展示未提供可验证的安装包，不能模拟下载成功。实际下载需在正式工具入口获取。</p>
    </>: info.type==="disable"?<><p>停用后，该工具将从当前演示的「我的工具」列表中移除，可在官方工具中重新启用。</p><p className={styles.demoNote}>只改变当前浏览器的演示状态，不影响正式账户。</p></>
    :info.type==="launch"&&info.name==="POD素材管理工具"?<div className={styles.figmaToolIntro}>
      <p className={styles.figmaToolSubtitle}>贴图审核、素材复用与官方灵感，一处管理</p>
      <div className={styles.figmaToolProcess}><strong>业务流程</strong><span>生成 → 暂存待审 → 审核通过后贴图 → 订单查图打印</span></div>
      <div className={styles.figmaToolFeatures}>
        {[
          ["01","贴图审核与打印","生成后暂存审核，通过后再贴图；下单后可找原图打印。"],
          ["02","我的素材","上传、分类管理个人素材，支持在 POD 图片裂变中引用。"],
          ["03","灵感市场","官方提供示例图片及生成指令，帮助寻找设计灵感。"]
        ].map(([number,title,detail])=><div key={number}><span className={styles.figmaFeatureNumber}>{number}</span><section><strong>{title}</strong><p>{detail}</p></section></div>)}
      </div>
      <div className={styles.figmaToolBottom}><span>功能介绍原型，实际业务功能以开发接入为准</span></div>
    </div>
    :info.type==="launch"&&info.name==="自有商品刊登工具"?<div className={styles.figmaToolIntro}>
      <p className={styles.figmaToolSubtitle}>自有商品导入 · 平台适配 · 快速刊登</p>
      <div className={styles.figmaListingDescription}><p>支持自有商品信息导入、校验与批量整理。</p><p>沿用现有商品适配流程，无需重复录入。</p></div>
      <div className={styles.figmaListingCards}>
        <section><strong>本地商品</strong><p>导入自有商品信息</p></section>
        <section><strong>信息校验</strong><p>检查字段与图片</p></section>
        <section><strong>平台适配</strong><p>进入刊登工作流</p></section>
      </div>
      <p className={styles.figmaListingHint}>启用后在「我的工具」进入自有商品待上传流程。</p>
    </div>
    :info.type==="launch"?<div className={styles.launchBody}>
      <p>选择需要了解的功能，查看对应的使用说明。</p>
      <div className={styles.launchChoices} role="group" aria-label="选择工具功能">{features.map(([name],index)=><button type="button" key={name} aria-pressed={selectedFeature===index} onClick={()=>setSelectedFeature(index)}>{name}</button>)}</div>
      <div className={styles.launchFeature}><strong>{features[selectedFeature]?.[0]}</strong><p>{features[selectedFeature]?.[1]}</p></div>
      <p className={styles.launchAvailability}>当前展示页仅提供功能介绍，实际操作请在正式工作台使用。</p>
    </div>
    :<><p>{tool?.description}</p><div className={styles.tags}>{tool?.tags.map(tag=><span key={tag}>{tag}</span>)}</div><p>适用分类：{tool?.category} · 当前状态：{tool?.status==="development"?"开发中":"可按需启用"}</p><p className={styles.demoNote}>实际功能、授权和费用以正式工作台为准。</p></>}
    <footer>{info.type!=="launch"?<button type="button" onClick={onClose}>取消</button>:null}{info.type==="disable"?<button type="button" className={styles.primary} onClick={onConfirm}>确认停用</button>:info.type==="download"?<button type="button" disabled title="当前演示未提供实际安装文件">暂无可下载文件</button>:<button type="button" className={styles.primary} onClick={onClose}>{info.type==="launch"&&(info.name==="POD素材管理工具"||info.name==="自有商品刊登工具")?"知道了":"确定"}</button>}</footer>
  </dialog>;
}

export function ShowcaseToolMarket({pathname,navigate,organizationId,memberId}:{pathname:string;navigate:(route:string)=>void;organizationId:string;memberId:string}) {
  const [category,setCategory]=useState("全部"),[search,setSearch]=useState(""),[applied,setApplied]=useState(""),[dialog,setDialog]=useState<Dialog|null>(null);
  const [enabled,setEnabled]=useState<string[]>(restoreEnabled);
  const [notice,setNotice]=useState("");
  const goto=(x:string)=>navigate("/workbench/tools"+x+"?preview=1");
  const persist=(names:string[])=>{setEnabled(names);try{sessionStorage.setItem(activationStorage,JSON.stringify(names));}catch{}};
  const enable=(name:string)=>{persist([...enabled.filter(x=>x!==name),name]);setNotice(name+"：仅在此浏览器的演示列表中启用。");};
  const visible=useMemo(()=>tools.filter(x=>(category==="全部"||x.category===category)&&[x.name,x.description,...x.tags].join(" ").toLowerCase().includes(applied.trim().toLowerCase())),[category,applied]);
  const myTools=tools.filter(x=>enabled.includes(x.name));
  const header=(title:string,subtitle:string,right?:ReactNode)=><header className={styles.header}><div><small>工具市场 / {title}</small><h1>{title}</h1><p>{subtitle}</p></div><div className={styles.headerActions}>{right}</div></header>;
  return <div className={styles.page} data-tool-market-page={pathname}>
    {notice?<div className={styles.notice} role="status">{notice}<button type="button" aria-label="关闭通知" onClick={()=>setNotice("")}>×</button></div>:null}
    {pathname.endsWith("/official")?<>{header("官方工具","浏览官方维护的电商工具，启用后可用于智能体与业务流程。",<button className={styles.primary} onClick={()=>goto("/mine")}>我的工具</button>)}
      <section className={styles.sectionHeading}><h2>官方工具列表</h2><p>按分类查找所需工具，查看详情后按需启用。</p></section>
      <div className={styles.toolbar}><div className={styles.categories}>{["全部","采集","图片","环境","数据","流程","其他"].map(x=><button type="button" key={x} aria-pressed={category===x} onClick={()=>setCategory(x)}>{x}</button>)}</div><div className={styles.searchTools}><input aria-label="搜索官方工具" placeholder="输入工具名称或关键词…" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")setApplied(search)}}/><button type="button" onClick={()=>{setSearch("");setApplied("");setCategory("全部");}}>重置</button><button type="button" className={styles.primary} onClick={()=>setApplied(search)}>确认</button></div></div>
      {visible.length?<div className={styles.toolGrid}>{visible.map(x=><article key={x.name} style={{"--accent":x.color} as React.CSSProperties} className={styles.toolCard}><h3>{x.name}</h3><p>{x.description}</p><div className={styles.tags}>{x.tags.map(tag=><span key={tag}>{tag}</span>)}</div><footer>{x.status==="development"?<span className={styles.developing}>开发中</span>:<><span className={enabled.includes(x.name)?styles.enabled:styles.disabled}>{enabled.includes(x.name)?"已启用":"未启用"}</span><button type="button" className={styles.primary} onClick={()=>enabled.includes(x.name)?goto("/mine"):enable(x.name)}>{enabled.includes(x.name)?"管理":"启用"}</button><button type="button" onClick={()=>setDialog({type:x.name==="商品采集插件"?"download":"intro",name:x.name})}>介绍</button></>}</footer></article>)}</div>:<div className={styles.empty}>没有匹配的官方工具，请修改关键词或重置条件。</div>}
    </>:pathname.endsWith("/mine")?<div className={styles.figmaMine}>
      {header("我的工具","管理已启用工具，选择本地插件或在线服务快速使用。",<button type="button" className={styles.primary} onClick={()=>goto("/official")}>前往官方工具</button>)}
      <div className={styles.mineBar}>
        <strong>已启用工具</strong>
        <div className={styles.mineSearchControls}>
          <input aria-label="搜索我的工具" placeholder="输入工具名称或关键词…" value={search}
            onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")setApplied(search.trim())}} />
          <button type="button" onClick={()=>{setSearch("");setApplied("")}}>重置</button>
          <button type="button" className={styles.primary} onClick={()=>setApplied(search.trim())}>确认</button>
        </div>
      </div>
      {myTools.filter(x=>[x.name,x.description].join(" ").toLowerCase().includes(applied.toLowerCase())).length?
        <div className={styles.mineGrid}>{myTools.filter(x=>[x.name,x.description].join(" ").toLowerCase().includes(applied.toLowerCase())).map(x=>
          <div className={styles.mineRow} key={x.name} data-figma-tool={x.name}>
            {x.name==="商品采集插件"?<>
              <article className={styles.mineCard}>
                <header><h2>{x.name}</h2><button type="button" onClick={()=>setDialog({type:"disable",name:x.name})}>停用</button></header>
                <p>采集商品的标题、主图、规格与价格等信息；结果统一保存到「数据服务 / 我的数据」。</p>
                <h3 className={styles.acquisitionLabel}>选择采集方式</h3>
                <div className={styles.acquisitionChoices}>
                  <section><div className={styles.choiceHeading}><strong>本地插件采集</strong><span>免费</span></div>
                    <p>安装在客户电脑本地运行，浏览商品时通过浏览器插件直接采集。</p>
                    <b>免费 · 不消耗数据额度</b>
                    <button type="button" onClick={()=>setDialog({type:"download",name:x.name})}>下载插件</button>
                  </section>
                  <section><div className={styles.choiceHeading}><strong>在线采集</strong><span>按数据收费</span></div>
                    <p>由平台云端执行，无需客户电脑持续运行即可完成在线采集。</p>
                    <b>按实际采集数据条数扣除额度</b>
                    <button type="button" onClick={()=>setDialog({type:"launch",name:x.name})}>在线采集</button>
                  </section>
                </div>
                <div className={styles.acquisitionResult}>采集结果统一保存至「数据服务 / 我的数据」</div>
              </article>
              <aside className={styles.mineGuide}>
                <h3>采集方式说明</h3>
                <p className={styles.guideIntro}>根据运行环境选择采集方式，两种方式的结果都会进入「我的数据」。</p>
                <div><strong>本地插件采集</strong><p>适合：客户电脑本地运行，通过浏览器插件采集商品</p><p>费用：免费，不消耗数据额度</p></div>
                <div><strong>在线采集</strong><p>适合：平台云端执行，无需客户电脑持续运行</p><p>费用：按实际采集数据条数扣除额度</p></div>
                <p className={styles.guideTip}>本地插件免费；在线采集按实际数据量计费</p>
              </aside>
            </>:<>
              <article className={styles.mineCard}>
                <header><h2>{x.name}</h2><button type="button" onClick={()=>setDialog({type:"disable",name:x.name})}>停用</button></header>
                {x.name==="POD素材管理工具"?<div className={styles.mineDescription}>
                  <p>从贴图生成、审核应用到订单打印，统一管理 POD 设计素材。</p>
                  <p>贴图审核通过后才能用于商品，订单产生后可按订单号或 SKU 找回原图。</p>
                  <p>支持个人素材上传与图片裂变复用，官方灵感市场提供图片和生成指令。</p>
                </div>:x.name==="自有商品刊登工具"?<div className={styles.mineDescription}>
                  <p>导入并管理自有商品资料，检查必填信息后进行适配。</p>
                  <p>支持自有商品导入、商品信息适配和批量刊登。</p>
                </div>:<p>{x.description}</p>}
                <footer><span className={styles.enabled}>已启用</span><button type="button" onClick={()=>setDialog({type:"launch",name:x.name})}>{x.name==="POD素材管理工具"?"前往POD素材管理":x.name==="自有商品刊登工具"?"进入自有商品刊登":"进入使用"}</button></footer>
              </article>
              <aside className={styles.mineGuide}><h3>功能介绍</h3>
                {(x.name==="POD素材管理工具"?
                  [["贴图审核与打印","审核通过后贴到商品；下单可检索原图"],["我的素材","上传、分类管理个人素材，支持图片裂变"],["灵感市场","官方维护示例图片及生成指令"]]:
                  x.name==="自有商品刊登工具"?
                  [["自有商品导入","导入自有商品资料"],["商品信息适配","核对并完善商品信息"],["批量刊登","批量处理商品刊登"]]:
                  [["功能说明",x.description],["使用范围",x.tags.join(" · ")]]
                ).map(([title,body])=><div key={title}><strong>{title}</strong><p>{body}</p></div>)}
              </aside>
            </>}
          </div>
        )}</div>
        :<div className={styles.empty}>当前没有匹配的已启用工具。你可以前往官方工具启用。</div>}
      </div>:null}
    {dialog?<ToolModal key={dialog.type+dialog.name} info={dialog} organizationId={organizationId} memberId={memberId} onClose={()=>setDialog(null)} onConfirm={()=>{persist(enabled.filter(x=>x!==dialog.name));setDialog(null);setNotice(dialog.name+"：已在当前演示中停用。");}}/>:null}
  </div>;
}
