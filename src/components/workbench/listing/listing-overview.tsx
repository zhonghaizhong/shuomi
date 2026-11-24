"use client";

import {useRouter} from "next/navigation";
import styles from "./listing-overview.module.css";

const entrances=[
 {title:"第一步：选择商品数据",tag:"数据准备",description:"从「我的数据」选择采集批次或自有商品。",action:"进入我的数据",href:"/workbench/data/mine"},
 {title:"第二步：配置上传规则",tag:"规则配置",description:"选择目标店铺与发布方式，配置必选规则，按需启用智能体。",action:"进入待上传",href:"/workbench/listing/waiting"},
 {title:"第三步：查看上传结果",tag:"结果查看",description:"在「已上传」查看商品、上传记录及处理状态。",action:"查看已上传",href:"/workbench/listing/uploaded"},
] as const;

const steps=[
 {title:"选择商品",detail:"从我的数据选择商品"},
 {title:"选择目标店铺",detail:"确定平台、站点和店铺"},
 {title:"配置规则与智能体",detail:"规则必选，智能体按需启用"},
 {title:"确认提交",detail:"核对资料并提交上传任务"},
] as const;

const branches=[
 {eyebrow:"资料缺失",title:"资料缺失 → 进入待补全",description:"缺少必填信息时，先补全再继续上传。",href:"/workbench/listing/missing",action:"进入待补全"},
 {eyebrow:"智能体处理",title:"启用智能体 → 进入待审核",description:"启用智能体后，先确认处理结果，再继续上传。",href:"/workbench/listing/review",action:"进入待审核"},
] as const;

export function ListingOverview({navigate,showHeading=true,showTabs=true}:{navigate?:(href:string)=>void;showHeading?:boolean;showTabs?:boolean}){
 const router=useRouter();
 const go=(href:string)=>{const preview=typeof window!=="undefined"&&new URLSearchParams(window.location.search).get("preview")==="1";const target=preview?href+(href.includes("?")?"&":"?")+"preview=1":href;navigate?navigate(target):router.push(target)};
 return <div className={styles.page} data-listing-management-overview>
  {showHeading?<header className={styles.header}>
    <p className={styles.eyebrow}>店铺中心 / 刊登管理</p>
    <h1>刊登管理</h1>
    <p>统一管理商品从数据准备到平台上传的全过程。</p>
  </header>:null}
  {showTabs?<nav className={styles.stageTabs} aria-label="刊登管理阶段">
   {[{label:"刊登总览",href:"/workbench/listing"},{label:"待上传",href:"/workbench/listing/waiting"},{label:"待补全",href:"/workbench/listing/missing"},{label:"待审核",href:"/workbench/listing/review"},{label:"已上传",href:"/workbench/listing/uploaded"}].map(item=><button key={item.href} type="button" aria-current={item.href==="/workbench/listing"?"page":undefined} onClick={()=>go(item.href)}>{item.label}</button>)}
  </nav>:null}
  <section className={styles.entrances} aria-label="刊登管理主要入口">
    {entrances.map(item=><article className={styles.entry} key={item.title}>
      <header><h2>{item.title}</h2><span>{item.tag}</span></header>
      <p>{item.description}</p>
      <button type="button" onClick={()=>go(item.href)}>{item.action}</button>
    </article>)}
  </section>
  <section className={styles.flow} aria-labelledby="listing-main-flow">
    <header className={styles.sectionTitle}>
      <h2 id="listing-main-flow">上传流程</h2>
    </header>
    <div className={styles.steps}>{steps.map((step,index)=><article key={step.title}>
      <div><b>{String(index+1).padStart(2,"0")}</b><h3>{step.title}</h3></div>
      <p>{step.detail}</p>
    </article>)}</div>
  </section>
  <h2 className={styles.continueTitle}>需要继续处理</h2>
  <section className={styles.branches} aria-label="刊登任务的条件分支">
    {branches.map(branch=><article key={branch.title}>
      <span>{branch.eyebrow}</span><h3>{branch.title}</h3>
      <p>{branch.description}</p>
      <button type="button" onClick={()=>go(branch.href)}>{branch.action}</button>
    </article>)}
    <aside className={styles.quickStart}><h3>你可以这样开始</h3><p>新商品先进入「我的数据」</p><p>已选商品进入「待上传」</p><p>提交后在「已上传」查看结果和记录</p></aside>
  </section>
  <p className={styles.note}>上传后可在「已上传」中查看商品状态和上传记录。</p>
 </div>;
}
