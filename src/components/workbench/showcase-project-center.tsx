"use client";
import type {ReactNode} from "react";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Plus,Target,MessagesSquare,ListChecks,FileCheck2} from "lucide-react";
import {PROJECT_ROOT,projectTemplates,projectChatUrl,readPreviewProjects,savePreviewProject,type PreviewProject,type ProjectStatus} from "./showcase-project-data";
import s from "./showcase-project-center.module.css";
const titles:Record<string,string>={home:"项目中心",active:"进行中项目",mine:"我的项目",recent:"最近访问",templates:"项目模板",archived:"已归档项目"};
const descriptions:Record<string,string>={home:"从目标到成果，掌握项目进度；具体任务执行在任务中心完成。",active:"查看项目进度与关联资源，管理目标和阶段成果。",mine:"查看项目进度与关联资源，创建、配置及管理项目执行计划。",recent:"继续查看近期打开的项目与当前执行进度。",templates:"按业务需求选择官方模板，查看介绍后创建项目。",archived:"归档项目的资料与报告将继续保留，查看详情后可申请恢复。"};
const fmt=(t:number)=>t>10000?new Date(t).toLocaleDateString("zh-CN"):"示例记录";
export function ShowcaseProjectCenter({pathname,onSectionSelect,tabNavigation}:{pathname:string;onSectionSelect?:(path:string)=>void;tabNavigation?:ReactNode}){
 const router=useRouter();const route=pathname===PROJECT_ROOT?"home":pathname.split("/").at(-1)||"home";
 const tab=titles[route]?route:"home";
 const [records,setRecords]=useState(readPreviewProjects);const [filter,setFilter]=useState("全部");const [query,setQuery]=useState("");const [search,setSearch]=useState("");
 const [detailId,setDetailId]=useState("");const [templateName,setTemplateName]=useState("");const [confirm,setConfirm]=useState<"archive"|"restore"|null>(null);const [milestone,setMilestone]=useState("");const [progress,setProgress]=useState(0);const [status,setStatus]=useState<Exclude<ProjectStatus,"已归档">>("进行中");const [report,setReport]=useState("");const [notice,setNotice]=useState("");
 const dialog=useRef<HTMLDialogElement>(null);
 const detail=records.find(p=>p.id===detailId);const template=projectTemplates.find(p=>p.name===templateName);
 const refresh=()=>setRecords(readPreviewProjects());
 useEffect(()=>{refresh();setDetailId("");setTemplateName("");setConfirm(null);setFilter(new URLSearchParams(location.hash.split("?")[1]||"").get("status")||"全部");setQuery("");setSearch("")},[pathname]);
 useEffect(()=>{if((detailId||templateName)&&!dialog.current?.open)dialog.current?.showModal();else if(!detailId&&!templateName&&dialog.current?.open)dialog.current.close()},[detailId,templateName]);
 const go=(suffix="",state="")=>{setDetailId("");setTemplateName("");const target=PROJECT_ROOT+(suffix?"/"+suffix:"");if(onSectionSelect)onSectionSelect(target);else router.push(target+"?preview=1"+(state?"&status="+encodeURIComponent(state):""));if(state||suffix===tab)setFilter(state||"全部")};
 const save=(p:PreviewProject)=>{try{savePreviewProject(p);refresh();return true}catch{setNotice("无法保存本地演示记录，请检查浏览器存储权限。");return false}};
 const open=(p:PreviewProject)=>{save({...p,visited:Date.now()});setDetailId(p.id);setMilestone(p.milestone);setProgress(p.progress);setStatus(p.status==="已归档"?p.previousStatus||"进行中":p.status);setReport("");setConfirm(null)};
 const close=()=>{setDetailId("");setTemplateName("");setConfirm(null)};
 const update=()=>{if(!detail||detail.status==="已归档"||!milestone.trim())return;const next={...detail,milestone:milestone.trim(),progress:status==="已完成"?100:Math.min(progress,99),status,updated:Date.now()};if(save(next))setNotice("项目进展已保存")};
 const archive=()=>{if(!detail)return;const now=Date.now();const next:PreviewProject=confirm==="restore"?{...detail,status:detail.previousStatus||"进行中",archivedAt:undefined,updated:now}:{...detail,status:"已归档",previousStatus:detail.status==="已归档"?detail.previousStatus:detail.status,archivedAt:now,updated:now};if(save(next)){setNotice(confirm==="restore"?"项目已恢复":"项目已归档，成果已保留");close()}};
 const chat=(mode:"create"|"reference",value="")=>{close();router.push(projectChatUrl(mode,value))};
 const view=records.filter(p=>tab==="archived"?p.status==="已归档":tab==="recent"?p.status!=="已归档"&&p.visited>0:tab==="active"?["进行中","待确认"].includes(p.status):p.status!=="已归档").filter(p=>(filter==="全部"||p.status===filter||p.category===filter)&&[p.name,p.goal,p.scope,p.category,p.milestone].join(" ").includes(search)).sort((a,b)=>tab==="recent"?b.visited-a.visited:b.updated-a.updated);
 const visible=tab==="home"?view.slice(0,4):view;
 const templates=projectTemplates.filter(p=>(filter==="全部"||p.category===filter)&&[p.name,p.description].join(" ").includes(search));
 const filters=tab==="templates"?["全部","店铺经营","商品开发","商品优化","OPC创业"]:tab==="archived"?["全部","店铺经营","商品开发","商品优化","OPC创业"]:tab==="active"?["全部","进行中","待确认"]:["全部","进行中","待确认","已完成"];
 return <main className={s.page} data-project-showcase="true">
 <header className={s.hero}><div><div className={s.breadcrumb}>AI工作台 / 项目中心</div><h1>项目中心</h1><p>查看项目进度、历史访问和模板，按需继续已有工作。</p></div>{tab!=="archived"&&<button className={s.primary} onClick={()=>chat("create")}><Plus size={16}/>新建项目</button>}</header>
 {tabNavigation}
 {notice&&<div className={s.notice} role="status">{notice}<button onClick={()=>setNotice("")} aria-label="关闭提示">×</button></div>}
 {tab==="home"&&<div className={s.guide} aria-label="项目指南">
  <section className={s.guideIntro}>
   <h2>一个项目，集中管理目标、AI会话、任务和成果</h2>
   <p>将相关工作放进同一个项目，持续追踪进度、保存讨论背景和阶段成果，不必反复查找。</p>
  </section>
  <section className={s.guideSection} aria-labelledby="project-guide-capabilities">
   <h2 id="project-guide-capabilities">项目可以帮你做什么？</h2>
   <div className={s.guideCapabilities}>
    {[
     {title:"明确项目目标",detail:"设定目标、业务范围和里程碑，知道每个阶段要完成什么。",Icon:Target},
     {title:"关联AI会话",detail:"将相关讨论归入项目，方便延续业务背景和决策过程。",Icon:MessagesSquare},
     {title:"跟踪执行任务",detail:"关联任务，在任务中心处理执行、待确认和异常事项。",Icon:ListChecks},
     {title:"沉淀项目成果",detail:"记录阶段成果和报告，方便回顾、复用与归档。",Icon:FileCheck2}
    ].map(({title,detail,Icon})=><article key={title}><div className={s.guideCapabilityTitle}><Icon size={20} aria-hidden="true"/><h3>{title}</h3></div><p>{detail}</p></article>)}
   </div>
  </section>
  <section className={s.guideSection} aria-labelledby="project-guide-start">
   <h2 id="project-guide-start">创建项目，只需要三步</h2>
   <div className={s.guideSteps}>{[
    ["01","创建项目","填写项目名称、目标和业务范围"],
    ["02","关联工作","关联AI会话、任务和相关资源"],
    ["03","持续推进","查看进度、处理确认并保存成果"]
   ].map(([number,title,description])=><article key={number}><b>{number}</b><h3>{title}</h3><p>{description}</p></article>)}</div>
   <div className={s.guideActions}><button type="button" onClick={()=>go("templates")}>查看项目模板</button></div>
  </section>
 </div>}
 {tab!=="home"&& <section className={s.panel}><header className={s.sectionHead}><div><h2>{tab==="home"?"最近项目":tab==="templates"?"官方模板列表":tab==="archived"?"项目列表":tab==="recent"?"最近访问":"我的项目列表"}</h2><p>{tab==="templates"?"按分类查找模板，先查看介绍，再决定使用。":tab==="home"?"按最近更新排序 · 显示 "+visible.length+" 项":visible.length+" 个项目 · 点击查看详情"}</p></div>{tab==="home"&&<div className={s.actions}><button onClick={()=>go("templates")}>项目模板</button><button onClick={()=>go("mine")}>查看全部项目</button></div>}</header>
 <form className={s.filters} onSubmit={e=>{e.preventDefault();setSearch(query.trim())}}><div className={s.tabs}>{filters.map(f=><button type="button" key={f} aria-pressed={filter===f} className={filter===f?s.selected:""} onClick={()=>setFilter(f)}>{f}</button>)}</div><div className={s.search}><input aria-label="搜索项目名称、业务或店铺" placeholder={tab==="templates"?"搜索模板名称或关键词":"搜索项目名称、业务或店铺"} value={query} onChange={e=>setQuery(e.target.value)}/><button type="button" onClick={()=>{setFilter("全部");setSearch("");setQuery("")}}>重置</button><button className={s.primary}>确定</button></div></form>
 {tab==="templates"?<div className={s.cards}>{templates.map((t,i)=><article className={s.card} data-tone={i} key={t.name}><h3>{t.name}</h3><p>{t.description}</p><span className={s.tag}>{t.category}</span><footer><button onClick={()=>setTemplateName(t.name)}>介绍</button><button className={s.primary} onClick={()=>chat("create",t.name)}>使用</button></footer></article>)}{!templates.length&&<p className={s.empty}>未找到匹配模板</p>}</div>:<div className={s.tableWrap}><table className={s.table}><thead><tr>{["项目与目标","关联范围","当前里程碑",tab==="archived"?"归档时间":"项目进展","操作"].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{visible.map(p=><tr key={p.id} data-project-id={p.id}><td><strong>{p.name}</strong><small>{p.goal}</small></td><td>{p.scope}<small>{p.category}</small></td><td>{p.milestone}</td><td>{tab==="archived"?<small>{fmt(p.archivedAt||0)}</small>:<div className={s.progress}><div><span style={{width:p.progress+"%"}}/></div><b>{p.progress}%</b></div>}<span className={s.status} data-status={p.status}>{p.status}</span></td><td><button onClick={()=>open(p)}>{tab==="recent"?"继续查看":"查看详情"}</button></td></tr>)}</tbody></table>{!visible.length&&<div className={s.empty}>暂无匹配项目，可重置筛选或新建项目。</div>}</div>}
 </section>}

 <dialog ref={dialog} className={s.dialog} onClose={close} aria-label={template?"模板介绍":"项目详情"}>{template?<><header><h2>模板介绍</h2><button aria-label="关闭" onClick={close}>×</button></header><h3>{template.name}</h3><p>{template.description}</p><div className={s.milestones}>{template.milestones.map((m,i)=><div key={m}><b>0{i+1}</b>{m}</div>)}</div><footer><button onClick={close}>返回</button><button className={s.primary} onClick={()=>chat("create",template.name)}>使用模板</button></footer></>:detail?<><header><h2>项目详情</h2><button aria-label="关闭" onClick={close}>×</button></header><h3>{detail.name}</h3><span className={s.status} data-status={detail.status}>{detail.status}</span><dl><dt>项目目标</dt><dd>{detail.goal}</dd><dt>关联范围</dt><dd>{detail.scope} · {detail.category}</dd><dt>模板来源</dt><dd>{detail.template||"自定义"}</dd><dt>项目资源</dt><dd>{detail.resources.join("、")||"暂无关联资源"}</dd></dl>
 <section className={s.detailSection}><h4>里程碑与进展</h4>{detail.status==="已归档"?<p>{detail.milestone} · {detail.progress}%</p>:<><label>当前里程碑<input value={milestone} onChange={e=>setMilestone(e.target.value)}/></label><label>项目进度 {progress}%<input type="range" min="0" max="100" value={progress} onChange={e=>setProgress(Number(e.target.value))}/></label><label>项目状态<select value={status} onChange={e=>setStatus(e.target.value as Exclude<ProjectStatus,"已归档">)}>{["进行中","待确认","已完成"].map(x=><option key={x}>{x}</option>)}</select></label><button className={s.primary} onClick={update}>保存进展</button></>}</section>
 <section className={s.detailSection}><h4>阶段成果</h4>{detail.reports.length?<ul>{detail.reports.map((r,i)=><li key={i}>{r}</li>)}</ul>:<p>暂无已保存成果</p>}{detail.status!=="已归档"&&<div className={s.search}><input aria-label="成果名称" placeholder="输入阶段成果名称" value={report} onChange={e=>setReport(e.target.value)}/><button disabled={!report.trim()} onClick={()=>{if(save({...detail,reports:[...detail.reports,report.trim()],updated:Date.now()}))setReport("")}}>记录成果</button></div>}</section>
 {confirm?<section className={s.detailSection}><p>{confirm==="archive"?"确认归档？项目资料及成果将保留。":"确认恢复该项目？"}</p><div className={s.actions}><button onClick={()=>setConfirm(null)}>取消</button><button className={s.primary} onClick={archive}>{confirm==="archive"?"确认归档":"确认恢复"}</button></div></section>:<footer>{detail.status==="已归档"?<button className={s.primary} onClick={()=>setConfirm("restore")}>恢复项目</button>:<><button onClick={()=>setConfirm("archive")}>归档项目</button><button onClick={()=>{close();router.push("/workbench/ai/tasks?preview=1")}}>前往任务中心</button><button className={s.primary} onClick={()=>chat("reference",detail.id)}>去会话</button></>}</footer>}</>:null}</dialog>
 </main>
}
