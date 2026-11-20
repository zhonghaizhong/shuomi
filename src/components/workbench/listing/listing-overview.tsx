"use client";

import {useRouter} from "next/navigation";
import styles from "./listing-overview.module.css";

const entrances=[
 {title:"商品数据",tag:"数据来源",description:"从「我的数据」选择商品来源：采集批次或自有商品库产品集。",scope:"选定批次 / 产品集后进入待上传",action:"进入我的数据",href:"/workbench/data/mine"},
 {title:"待上传配置",tag:"规则必选",description:"启用必选适配规则，智能体按需使用；配置目标平台、店铺及发布方式。",scope:"资料缺失到待补全 · 启用智能体后进入待审核",action:"进入待上传",href:"/workbench/listing/waiting"},
 {title:"上传记录",tag:"结果查看",description:"提交成功后查看商品资料、上传记录、目标渠道与发布方式。",scope:"平台提交 / 平台草稿，按店铺真实能力开放",action:"查看已上传",href:"/workbench/listing/uploaded"},
] as const;

const steps=[
 {title:"选择商品",detail:"采集批次或自有商品库"},
 {title:"选择目标店铺",detail:"先确定平台、站点及经营模式"},
 {title:"配置规则与智能体",detail:"适配规则必选；智能体按需使用"},
 {title:"确认提交",detail:"核对资料版本、发布方式及预算"},
] as const;

const branches=[
 {eyebrow:"条件分支 A · 资料缺失",title:"待补全 · 必填信息补齐后继续",description:"资料缺失先补全；如启用智能体，补全后再进入待审核。",href:"/workbench/listing/missing",action:"进入待补全"},
 {eyebrow:"条件分支 B · 智能体启用",title:"待审核 · 应用后明确继续上传",description:"AI 修改沿原审核及应用策略；完成后确认继续上传，未启用则跳过。",href:"/workbench/listing/review",action:"进入待审核"},
] as const;

export function ListingOverview({navigate,showHeading=true}:{navigate?:(href:string)=>void;showHeading?:boolean}){
 const router=useRouter();
 const go=(href:string)=>navigate?navigate(href):router.push(href);
 return <div className={styles.page} data-listing-management-overview>
  {showHeading?<header className={styles.header}>
    <p className={styles.eyebrow}>店铺中心 / 刊登管理</p>
    <h1>从商品数据到平台上传的统一管理</h1>
    <p>配置一次任务；缺失先补全，AI 按策略审核并应用，再明确继续原任务。</p>
  </header>:null}
  <section className={styles.entrances} aria-label="刊登管理主要入口">
    {entrances.map(item=><article className={styles.entry} key={item.title}>
      <header><h2>{item.title}</h2><span>{item.tag}</span></header>
      <p>{item.description}</p>
      <small>{item.scope}</small>
      <button type="button" onClick={()=>go(item.href)}>{item.action}</button>
    </article>)}
  </section>
  <section className={styles.flow} aria-labelledby="listing-main-flow">
    <header className={styles.sectionTitle}>
      <h2 id="listing-main-flow">上传主流程</h2>
      <p>选商品 · 先定目标 · 配规则与智能体 · 确认提交</p>
    </header>
    <div className={styles.steps}>{steps.map((step,index)=><article key={step.title}>
      <div><b>{String(index+1).padStart(2,"0")}</b><h3>{step.title}</h3></div>
      <p>{step.detail}</p>
    </article>)}</div>
  </section>
  <section className={styles.branches} aria-label="刊登任务的条件分支">
    {branches.map(branch=><article key={branch.title}>
      <span>{branch.eyebrow}</span><h3>{branch.title}</h3>
      <p>{branch.description}</p>
      <button type="button" onClick={()=>go(branch.href)}>{branch.action}</button>
    </article>)}
  </section>
  <p className={styles.note}>设计说明 · 平台原生定时上架按能力开放，系统定时发送未开放。已上传只读；后续上架从「店铺商品」继续。</p>
 </div>;
}
