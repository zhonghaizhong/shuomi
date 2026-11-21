"use client";
import {useState} from "react";
import {RefreshCw,Plus,Info} from "lucide-react";
import {useRouter} from "next/navigation";
import styles from "./showcase-skill-library.module.css";

type Category="official"|"mine"|"team";
const root="/workbench/agents/skills";
const tabs:[Category,string][]=[["official","官方模板"],["mine","我的技能"],["team","团队技能"]];
const purpose="保存可复用的方法；执行使用现有智能体的权限、预算与审核。";
export function ShowcaseSkillLibrary({pathname}:{pathname:string}){
 const router=useRouter();
 const category:Category=pathname.endsWith("/mine")?"mine":pathname.endsWith("/team")?"team":"official";
 const [configurable,setConfigurable]=useState(true);
 const [admission,setAdmission]=useState(true);
 const [notice,setNotice]=useState("");
 const [detail,setDetail]=useState(false);
 const [requests,setRequests]=useState(false);
 const [draft,setDraft]=useState(false);
 const name=tabs.find(([id])=>id===category)![1];
 const go=(id:Category)=>{setNotice("");setDetail(false);setRequests(false);setDraft(false);router.push(`${root}/${id}?preview=1`)};
 const refresh=()=>setNotice("已刷新展示状态。公开展示站没有连接技能服务，真实列表需在正式控制台登录后读取。");
 const action=(label:string)=>setNotice(`${label}是需要登录、身份及技能服务权限的真实操作；此展示站仅展示入口，不执行服务端变更。`);
 return <main className={styles.shell} data-skill-showcase="true">
  <header className={styles.hero}>
   <div><span className={styles.eyebrow}>智能市场 / 技能库 / {name}</span><h1>技能库</h1><p>{category==="team"?"管理可复用的业务方法 · 当前企业：演示企业（非真实企业数据）":"查看官方模板，管理个人和团队技能，在业务操作中选择使用。"}</p></div>
  </header>
  <nav className={styles.tabs} aria-label="技能库分类">{tabs.map(([id,label])=><button type="button" key={id} className={`${styles.tab} ${id===category?styles.active:""}`} aria-current={id===category?"page":undefined} onClick={()=>go(id)}>{label}</button>)}</nav>
  <section className={styles.toolbar} data-skill-management={category}>
   <div className={styles.managementTop}><h2 className={styles.sectionTitle}>{name}</h2><p className={styles.sectionSub}>{purpose}</p></div>
   <div className={styles.managementActions}>
    <button type="button" className={styles.secondary} onClick={refresh}><RefreshCw size={15} aria-hidden="true"/>刷新列表</button>
    {category!=="official"&&<div className={styles.actionBar}>
     <button type="button" className={styles.primary} onClick={()=>{setDraft(true);setRequests(false);setDetail(false);action("新建技能")}}><Plus size={15} aria-hidden="true"/>新建技能</button>
     {category==="mine"?<button type="button" className={styles.secondary} onClick={()=>{setRequests(true);setDraft(false);setDetail(false)}}>我的共享申请</button>:<button type="button" className={styles.secondary} disabled={!configurable} onClick={()=>{setRequests(true);setDraft(false);setDetail(false)}}>待审批的个人提交</button>}
    </div>}
   </div>
   {category==="team"&&<>
    <div className={styles.policy}><div><strong>个人技能准入：{admission?"允许本人启用的版本":"未准入"} · 策略版本 {admission?"1":"0"}</strong><p>审批和准入设置由企业配置权限控制，此处仅演示两种权限下的界面。</p></div>{configurable&&<button type="button" className={styles.secondary} onClick={()=>setAdmission(x=>!x)}>{admission?"关闭个人技能准入":"开启个人技能准入"}</button>}</div>
    <div className={styles.previewPermission}><span>展示状态（非真实企业权限）</span><button type="button" aria-pressed={configurable} className={styles.secondary} onClick={()=>{setConfigurable(x=>!x);setRequests(false)}}>{configurable?"切换为无配置权限":"切换为可配置权限"}</button></div>
   </>}
   {category==="official"&&<p className={styles.emptyText}>当前范围没有可读取的技能。官方模板由获授权维护者导入、发布并启用后提供。</p>}
   {category==="mine"&&<div className={styles.skillRecord}>
    <button type="button" className={styles.skillRecordButton} onClick={()=>{setDetail(x=>!x);setRequests(false);setDraft(false)}} aria-expanded={detail}><span><strong>local-trial-title-normalization-20261015</strong><small>本地试用 2026-10-15：核对个人技能格式、版本保存和刷新读回；仅使用已有商品事实，本轮不调用模型。</small></span><span className={styles.version}>v1 · 已启用 · 私有</span></button>
    {detail&&<div className={styles.detail}><strong>个人技能版本 · v1（Figma 参考记录）</strong><p>此记录来自 Figma 设计稿，仅用于展示设计，不代表当前用户实际拥有该技能。</p><button type="button" className={styles.secondary} onClick={()=>action("版本管理")}>管理版本</button></div>}
   </div>}
   {category==="team"&&<p className={styles.emptyText}>当前范围没有可读取的技能。可以自建或复制允许复制的官方模板。</p>}
   {requests&&<div className={styles.detail} role="region" aria-label={category==="mine"?"我的共享申请":"待审批的个人提交"}><strong>{category==="mine"?"我的共享申请":"待审批的个人提交"}</strong><p>{category==="mine"?"提交共享必须由本人明确同意；企业审批通过后生成独立副本。":"待审批记录和审批权限需要正式业务服务验证；展示站不提供虚构申请。"}</p><button type="button" className={styles.secondary} onClick={()=>setRequests(false)}>关闭</button></div>}
   {draft&&<div className={styles.detail} role="region" aria-label="新建技能"><strong>新建技能</strong><p>需要使用真实身份及技能服务保存；当前是静态展示，尚未创建任何技能。</p><button type="button" className={styles.secondary} onClick={()=>setDraft(false)}>关闭</button></div>}
  </section>
  {notice&&<aside className={styles.note} role="status"><Info size={18} aria-hidden="true"/><span>{notice}</span><button type="button" className={styles.secondary} onClick={()=>setNotice("")}>关闭提示</button></aside>}
 </main>;
}