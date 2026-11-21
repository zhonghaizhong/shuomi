"use client";
import {useState} from "react";
import {BookOpen,Layers3,Users,LibraryBig,ShieldCheck,RefreshCw,Plus,Info,FileText,Sparkles} from "lucide-react";
import {useRouter} from "next/navigation";
import styles from "./showcase-skill-library.module.css";
type Category="overview"|"official"|"mine"|"team";
const entries=[
 {id:"official" as const,name:"官方模板",summary:"发现平台提供的标准化方法。查阅适用范围和版本权限，选择后可在支持的场景中复用。",button:"浏览官方模板",tag:"平台资源",Icon:BookOpen},
 {id:"mine" as const,name:"我的技能",summary:"管理个人沉淀的方法与版本，按许可复制、导出或提交企业审核。",button:"管理我的技能",tag:"个人空间",Icon:Layers3},
 {id:"team" as const,name:"团队技能",summary:"围绕当前企业共享技能，按身份权限管理审批、准入策略与版本。",button:"查看团队技能",tag:"企业协作",Icon:Users},
];
const root="/workbench/agents/skills";
export function ShowcaseSkillLibrary({pathname}:{pathname:string}){
 const router=useRouter();
 const [search,setSearch]=useState("");
 const [notice,setNotice]=useState("");
 const category:Category=pathname===root?"overview":pathname===root+"/official"?"official":pathname===root+"/mine"?"mine":"team";
 const label=category==="overview"?"技能库":entries.find(e=>e.id===category)?.name??"技能库";
 const go=(id:string)=>{setSearch("");setNotice("");router.push(id==="overview"?root:`${root}/${id}?preview=1`)};
 const refresh=()=>{setSearch("");setNotice("当前是静态设计展示，真实技能数据请在正式控制台查看。")};
 return <main className={styles.shell} data-skill-showcase="true">
  <header className={styles.hero}>
   <div><span className={styles.eyebrow}>智能市场 / 技能库</span><h1>{label}</h1><p>{category==="overview"?"将业务方法沉淀为可复用技能，统一浏览模板、管理个人版本，并在企业内按权限协作。":category==="official"?"查看平台提供的技能模板。可读取内容、可复制范围与版本由实际授权决定。":category==="mine"?"管理属于自己的技能及历史版本，按权限决定复制、导出和共享。":"管理当前企业的技能资源，审批与准入配置由企业权限决定。"}</p></div>
   <div className={styles.heroIcon}><LibraryBig size={31} strokeWidth={1.6}/></div>
  </header>
  <nav className={styles.tabs} aria-label="技能库分类"><button type="button" onClick={()=>go("overview")} className={`${styles.tab} ${category==="overview"?styles.active:""}`} aria-current={category==="overview"?"page":undefined}>技能库概览</button>{entries.map(e=><button type="button" key={e.id} className={`${styles.tab} ${category===e.id?styles.active:""}`} aria-current={category===e.id?"page":undefined} onClick={()=>go(e.id)}>{e.name}</button>)}</nav>
  {category==="overview"?<>
   <section><h2 className={styles.sectionTitle}>技能资产管理</h2><p className={styles.sectionSub}>三类技能独立管理，入口清晰，权限与归属不混淆。</p></section>
   <div className={styles.grid}>{entries.map(e=><article className={styles.feature} key={e.id}><div className={styles.featureTop}><span className={styles.featureGlyph}><e.Icon size={22} strokeWidth={1.7}/></span><span className={styles.tag}>{e.tag}</span></div><h3>{e.name}</h3><p>{e.summary}</p><button onClick={()=>go(e.id)}>{e.button}</button></article>)}</div>
   <section><h2 className={styles.sectionTitle}>使用路径</h2><p className={styles.sectionSub}>从发现、管理到使用，技能能力遵循当前用户及企业授权。</p></section>
   <div className={styles.steps}>{[["01","查找与选择","从官方、个人或企业空间找到适用技能，了解版本和使用范围。"],["02","创建与管理","可授权的成员保存草稿、管理版本，或提交团队共享申请。"],["03","复用到业务","在支持的工具、智能体和任务中按权限调用，并检查处理结果。"]].map(([n,t,d])=><article key={n} className={styles.step}><b>{n}</b><h3>{t}</h3><p>{d}</p></article>)}</div>
  </>:<>
   <section className={styles.toolbar}><div><h2 className={styles.sectionTitle}>{category==="official"?"模板目录":category==="mine"?"个人技能列表":"团队技能列表"}</h2><p className={styles.sectionSub}>{category==="team"?"按当前企业及配置权限展示真实技能和审批操作。":category==="mine"?"技能与版本属于个人，不随企业切换而改变。":"按实际返回的模板显示；没有数据时保持空态。"}</p></div><div className={styles.toolbarRight}><input className={styles.search} aria-label="搜索技能" placeholder="搜索技能名称" value={search} onChange={e=>setSearch(e.target.value)}/><button className={styles.secondary} onClick={refresh}><RefreshCw size={14} style={{display:"inline",verticalAlign:"-2px",marginRight:6}}/>刷新</button>{category!=="official"&&<button className={styles.primary} onClick={()=>setNotice("此处仅展示页面设计。请登录正式控制台创建技能，并按实际权限完成操作。")}><Plus size={15} style={{display:"inline",verticalAlign:"-3px",marginRight:5}}/>新建技能</button>}</div></section>
   {category==="team"&&<aside className={styles.note}><ShieldCheck size={20} style={{flexShrink:0,color:"var(--s-accent)"}}/><div><strong>企业权限控制</strong> — 只有具备配置权限的成员才可审批个人提交或切换个人技能准入；其他成员仅能使用其获授权的操作。</div></aside>}
   <section className={styles.empty}><span className={styles.emptyIcon}>{category==="official"?<BookOpen size={25}/>:category==="mine"?<FileText size={25}/>:<Users size={25}/>}</span><h3>{search?"没有符合搜索条件的技能":category==="official"?"暂无可展示的官方模板":category==="mine"?"个人技能由登录后实际数据展示":"团队技能由当前企业数据展示"}</h3><p>{search?"请尝试其他名称，或清空搜索条件。":"这是公开展示站，不连接个人或企业技能服务；不会用虚构的数量、模板或审批记录填充列表。"}</p>{search&&<button className={styles.secondary} onClick={()=>setSearch("")}>清空搜索</button>}</section>
   {category==="mine"&&<aside className={styles.note}><Info size={19} style={{flexShrink:0,color:"var(--s-accent)"}}/><div>个人技能可以管理版本，并在明确授权后向企业提交共享申请。审批通过后企业取得独立副本。</div></aside>}
  </>}
  {notice&&<div className={styles.note} role="status"><Sparkles size={18} style={{flexShrink:0,color:"var(--s-accent)"}}/>{notice}<button style={{marginLeft:"auto",color:"inherit"}} onClick={()=>setNotice("")} aria-label="关闭提示">×</button></div>}
 </main>;
}
