"use client";

import {useEffect,useRef,useState} from "react";
import styles from "./showcase-data-service-dialog.module.css";

type View="catalog"|"details"|"api";
type ApiTab="access"|"records";

/** Data-market catalog preview, not an authenticated data API client. */
export function ShowcaseDataServiceDialog({category,onClose}:{category:string;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 const [view,setView]=useState<View>("catalog");
 const [apiTab,setApiTab]=useState<ApiTab>("access");
 const hasAmazon=category==="商品数据";
 useEffect(()=>{
  const previous=document.activeElement;
  const dialog=ref.current;
  if(dialog&&!dialog.open)dialog.showModal();
  return()=>{
   if(dialog?.open)dialog.close();
   if(previous instanceof HTMLElement&&previous.isConnected)previous.focus();
  };
 },[]);
 const heading=view==="catalog"?category+" · 相关数据服务":view==="details"?"Amazon 商品数据 · 服务详情":"Amazon 商品数据 · API管理";
 return <dialog ref={ref} className={styles.dialog} aria-label={category+"相关数据服务"}
  onCancel={event=>{event.preventDefault();onClose()}}
  onClick={event=>{if(event.target===event.currentTarget)onClose()}}>
  <header className={styles.header}>
   <div><small>数据服务 / 数据市场 / {category}</small><h2>{heading}</h2><p>选择具体服务，查看数据能力与 API 接入方式</p></div>
   <button type="button" className={styles.close} onClick={onClose} aria-label="关闭数据服务弹窗">×</button>
  </header>
  <div className={styles.body}>
   {view==="catalog"?<section className={styles.catalog}>
    {hasAmazon?<><div className={styles.sectionTitle}><h3>可用数据服务</h3><p>API 按具体数据服务管理，不在分类卡片上重复展示</p></div>
     <article className={styles.service}>
      <div className={styles.icon} aria-hidden="true">A</div>
      <div className={styles.serviceMain}><div className={styles.serviceTitle}><h4>Amazon 商品数据</h4><span className={styles.available}>目录已开放</span></div>
       <p>商品信息、价格、类目、图片和变体等数据，支持按已开放站点查询。</p>
       <div className={styles.tags}><span>商品信息</span><span>价格与变体</span><span>图片数据</span></div>
      </div>
      <div className={styles.actions}><button type="button" onClick={()=>setView("details")}>查看详情</button><button type="button" className={styles.primary} onClick={()=>{setApiTab("access");setView("api")}}>API管理</button></div>
     </article>
     <article className={styles.future}><div><h4>更多平台商品数据</h4><p>后续按实际授权和开放情况接入，不代表目前可以调用。</p></div><span>暂未开放</span></article>
    </>:<div className={styles.empty}><h3>暂无已开放的相关 API 服务</h3><p>该数据分类尚未开放具体 API。正式开放后会在此列出可使用的服务。</p></div>}
   </section>:view==="details"?<section className={styles.detail}>
    <div className={styles.serviceTitle}><h3>Amazon 商品数据</h3><span className={styles.available}>目录已开放</span></div>
    <p>用于按授权范围查询 Amazon 商品相关资料。可用字段、站点、更新周期和收费规则，以具体服务的正式配置为准。</p>
    <dl className={styles.facts}>
     <div><dt>数据范围</dt><dd>商品信息、价格、类目、图片及变体</dd></div>
     <div><dt>适用站点</dt><dd>按实际服务开放范围</dd></div>
     <div><dt>获取方式</dt><dd>数据查询 / API（需正式接入）</dd></div>
     <div><dt>计费规则</dt><dd>以服务开通时展示的计费标准为准</dd></div>
    </dl>
    <div className={styles.inlineActions}><button type="button" onClick={()=>setView("catalog")}>返回服务列表</button><button type="button" className={styles.primary} onClick={()=>{setApiTab("access");setView("api")}}>API管理</button></div>
   </section>:<section className={styles.api}>
    <div className={styles.serviceTitle}><h3>Amazon 商品数据 API</h3><span className={styles.pending}>正式接口待接入</span></div>
    <div className={styles.apiTabs} role="group" aria-label="API管理内容"><button type="button" aria-pressed={apiTab==="access"} onClick={()=>setApiTab("access")}>接入信息</button><button type="button" aria-pressed={apiTab==="records"} onClick={()=>setApiTab("records")}>调用记录</button></div>
    {apiTab==="access"?<div className={styles.apiContent}>
     <dl className={styles.facts}>
      <div><dt>所属服务</dt><dd>Amazon 商品数据</dd></div>
      <div><dt>API 密钥</dt><dd>尚未连接真实密钥服务</dd></div>
      <div><dt>接口地址与参数</dt><dd>正式接入后提供</dd></div>
      <div><dt>授权与费用</dt><dd>按服务权限和实际计费配置</dd></div>
     </dl>
     <p className={styles.note}>当前为 GitHub Pages 演示页面，不会生成真实 API 密钥、发送请求或产生费用；正式接入后，这里再提供密钥创建与接入文档。</p>
    </div>:<div className={styles.empty}><h4>暂无真实调用记录</h4><p>完成正式 API 接入并产生调用后，在此显示调用时间、数量、费用和状态。</p></div>}
    <div className={styles.inlineActions}><button type="button" onClick={()=>setView("catalog")}>返回服务列表</button><button type="button" onClick={()=>setView("details")}>服务详情</button></div>
   </section>}
  </div>
 </dialog>;
}
