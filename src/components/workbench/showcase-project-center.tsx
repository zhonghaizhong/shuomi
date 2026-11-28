"use client";
import type {ReactNode} from "react";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Plus,Target,MessagesSquare,ListChecks,FileCheck2} from "lucide-react";
import {PROJECT_ROOT,projectTemplates,projectChatUrl,readPreviewProjects,savePreviewProject,readPreviewProjectGroups,writePreviewProjectGroups,demoProjectTasks,type DemoProjectTask,type PreviewProject,type ProjectStatus} from "./showcase-project-data";
import s from "./showcase-project-center.module.css";
import {projectDemoSkills} from "./showcase-skill-library";
import {projectDemoKnowledge} from "./showcase-knowledge-groups";
import {projectDemoReports} from "./showcase-report-center";
const titles:Record<string,string>={home:"项目中心",active:"进行中项目",mine:"我的项目",recent:"最近访问",templates:"项目模板",archived:"已归档项目"};
const descriptions:Record<string,string>={home:"从目标到成果，掌握项目进度；具体任务执行在任务中心完成。",active:"查看项目进度与关联资源，管理目标和阶段成果。",mine:"查看项目进度与关联资源，创建、配置及管理项目执行计划。",recent:"继续查看近期打开的项目与当前执行进度。",templates:"按业务需求选择官方模板，查看介绍后创建项目。",archived:"归档项目的资料与报告将继续保留，查看详情后可申请恢复。"};
const fmt=(t:number)=>t>10000?new Date(t).toLocaleDateString("zh-CN"):"示例记录";
export function ShowcaseProjectCenter({pathname,onSectionSelect,tabNavigation}:{pathname:string;onSectionSelect?:(path:string)=>void;tabNavigation?:ReactNode}){
 const router=useRouter();const route=pathname===PROJECT_ROOT?"home":pathname.split("/").at(-1)||"home";
 const tab=titles[route]?route:"home";
 const [records,setRecords]=useState(readPreviewProjects);const [filter,setFilter]=useState("全部");const [query,setQuery]=useState("");const [search,setSearch]=useState("");
 const [groups,setGroups]=useState<string[]>(readPreviewProjectGroups);const [groupFilter,setGroupFilter]=useState("全部分组");const [groupManager,setGroupManager]=useState(false);const [groupDraft,setGroupDraft]=useState("");const [groupRename,setGroupRename]=useState("");const [editingGroup,setEditingGroup]=useState("");
 const [resourcePreview,setResourcePreview]=useState<{title:string;content:string}|null>(null);
 const [taskRevision,setTaskRevision]=useState(0);
 const [detailId,setDetailId]=useState("");const [templateName,setTemplateName]=useState("");const [confirm,setConfirm]=useState<"archive"|"restore"|null>(null);const [milestone,setMilestone]=useState("");const [progress,setProgress]=useState(0);const [status,setStatus]=useState<Exclude<ProjectStatus,"已归档">>("进行中");const [report,setReport]=useState("");const [notice,setNotice]=useState("");
 const dialog=useRef<HTMLDialogElement>(null);const groupsDialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(groupManager&&!groupsDialog.current?.open)groupsDialog.current?.showModal();else if(!groupManager&&groupsDialog.current?.open)groupsDialog.current.close()},[groupManager]);
 const detail=records.find(p=>p.id===detailId);const template=projectTemplates.find(p=>p.name===templateName);
 const linkedTasks:DemoProjectTask[]=detail?(()=>{void taskRevision;try{const raw=sessionStorage.getItem("shuomi-task-center-demo-v1");const x:unknown=raw?JSON.parse(raw):null;if(Array.isArray(x)){const saved=x.filter((t):t is DemoProjectTask=>Boolean(t&&typeof t.id==="string"&&typeof t.projectId==="string"));const byId=new Map(saved.map(t=>[t.id,t]));return demoProjectTasks.filter(t=>t.projectId===detail.id).map(t=>byId.get(t.id)??t)}}catch{}return demoProjectTasks.filter(t=>t.projectId===detail.id)})():[];
 const taskCounters={completed:linkedTasks.filter(t=>t.state==="completed").length,pending:linkedTasks.filter(t=>t.state==="pending").length,errors:linkedTasks.filter(t=>t.state==="errors").length,running:linkedTasks.filter(t=>t.state==="running").length};
 const taskLabel=(state:DemoProjectTask["state"])=>({pending:"待确认",running:"进行中",completed:"已完成",errors:"异常阻断",scheduled:"定时计划",revision:"待修改"}[state]);
 const goProjectTasks=(id:string)=>{close();router.push("/workbench/ai/tasks?preview=1&projectId="+encodeURIComponent(id))};
 const previewResource=(kind:string,id:string)=>{
  if(kind==="skill"){const item=projectDemoSkills.find(s=>s.id===id);if(item){setResourcePreview({title:item.name,content:item.description});return;}}
  if(kind==="knowledge"){const item=projectDemoKnowledge.find(k=>k.id===id);if(item){setResourcePreview({title:item.name,content:item.description});return;}}
  if(kind==="report"){const item=projectDemoReports.find(r=>r.id===id);if(item){setResourcePreview({title:item.title,content:item.summary});return;}}
 };

 const refresh=()=>setRecords(readPreviewProjects());
 useEffect(()=>{const handler=()=>setTaskRevision(x=>x+1);window.addEventListener("shuomi-project-tasks-changed",handler);return()=>window.removeEventListener("shuomi-project-tasks-changed",handler)},[]);
 const persistGroups=(next:string[])=>{try{writePreviewProjectGroups(next);setGroups(next);return true}catch{setNotice("分组保存失败，请检查浏览器存储权限。");return false}};
 const addGroup=()=>{const name=groupDraft.trim();if(!name||name.length>40||groups.includes(name))return;if(persistGroups([...groups,name])){setGroupDraft("");setNotice("已创建分组，可在项目详情中分配项目。")}};
 const renameGroup=(old:string)=>{const name=groupRename.trim();if(!name||name.length>40||groups.some(g=>g===name&&g!==old))return;try{const next=readPreviewProjects().map(p=>p.group===old?{...p,group:name}:p);writePreviewProjectGroups(groups.map(g=>g===old?name:g));for(const row of next.filter(p=>p.group===name))savePreviewProject(row);setGroups(groups.map(g=>g===old?name:g));refresh();setGroupFilter(v=>v===old?name:v);setEditingGroup("");setGroupRename("");setNotice("分组名称已更新，关联项目仍保留。")}catch{setNotice("分组重命名失败，请重试。")}};
 const deleteGroup=(name:string)=>{try{for(const project of readPreviewProjects().filter(p=>p.group===name))savePreviewProject({...project,group:undefined});if(persistGroups(groups.filter(g=>g!==name))){refresh();setGroupFilter(v=>v===name?"全部分组":v);setNotice("分组已删除，所属项目已转为未分组，没有删除项目。")}}catch{setNotice("分组删除失败，请重试。")}};
 useEffect(()=>{refresh();setDetailId("");setTemplateName("");setConfirm(null);setFilter(new URLSearchParams(location.hash.split("?")[1]||"").get("status")||"全部");setGroupFilter("全部分组");setGroups(readPreviewProjectGroups());setGroupManager(false);setQuery("");setSearch("")},[pathname]);
 useEffect(()=>{if((detailId||templateName)&&!dialog.current?.open)dialog.current?.showModal();else if(!detailId&&!templateName&&dialog.current?.open)dialog.current.close()},[detailId,templateName]);
 const go=(suffix="",state="")=>{setDetailId("");setTemplateName("");const target=PROJECT_ROOT+(suffix?"/"+suffix:"");if(onSectionSelect)onSectionSelect(target);else router.push(target+"?preview=1"+(state?"&status="+encodeURIComponent(state):""));if(state||suffix===tab)setFilter(state||"全部")};
 const save=(p:PreviewProject)=>{try{savePreviewProject(p);refresh();return true}catch{setNotice("无法保存本地演示记录，请检查浏览器存储权限。");return false}};
 const open=(p:PreviewProject)=>{save({...p,visited:Date.now()});setDetailId(p.id);setMilestone(p.milestone);setProgress(p.progress);setStatus(p.status==="已归档"?p.previousStatus||"进行中":p.status);setReport("");setConfirm(null)};
 const close=()=>{setDetailId("");setTemplateName("");setConfirm(null)};
 const update=()=>{if(!detail||detail.status==="已归档"||!milestone.trim())return;const next={...detail,milestone:milestone.trim(),progress:status==="已完成"?100:Math.min(progress,99),status,updated:Date.now()};if(save(next))setNotice("项目进展已保存")};
 const archive=()=>{if(!detail)return;const now=Date.now();const next:PreviewProject=confirm==="restore"?{...detail,status:detail.previousStatus||"进行中",archivedAt:undefined,updated:now}:{...detail,status:"已归档",previousStatus:detail.status==="已归档"?detail.previousStatus:detail.status,archivedAt:now,updated:now};if(save(next)){setNotice(confirm==="restore"?"项目已恢复":"项目已归档，成果已保留");close()}};
 const chat=(mode:"create"|"reference",value="")=>{close();router.push(projectChatUrl(mode,value))};
 const view=records.filter(p=>tab==="archived"?p.status==="已归档":tab==="recent"?p.status!=="已归档"&&p.visited>0:tab==="active"?["进行中","待确认"].includes(p.status):p.status!=="已归档").filter(p=>(filter==="全部"||(filter==="最近访问"?p.visited>0:p.status===filter||p.category===filter))&&[p.name,p.goal,p.scope,p.category,p.milestone].join(" ").includes(search)).sort((a,b)=>(tab==="recent"||filter==="最近访问")?b.visited-a.visited:b.updated-a.updated);
 const visible=tab==="home"?view.slice(0,4):view;
 const templates=projectTemplates.filter(p=>(filter==="全部"||p.category===filter)&&[p.name,p.description].join(" ").includes(search));
 const archivedCategories=[...new Set(records.filter(p=>p.status==="已归档").map(p=>p.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"zh-CN"));
 const filters=tab==="templates"?["全部","店铺经营","商品开发","商品优化","OPC创业"]:tab==="archived"?(archivedCategories.length>1?["全部",...archivedCategories]:[]):tab==="active"?["全部","进行中","待确认"]:["全部","进行中","待确认","已完成","最近访问"];
 return <main className={s.page} data-project-showcase="true">
 <header className={s.hero}><div><div className={s.breadcrumb}>AI工作台 / 项目中心</div><h1>项目中心</h1><p>查看项目进度、历史访问和模板，按需继续已有工作。</p></div><button className={s.primary} onClick={()=>chat("create")}><Plus size={16}/>新建项目</button></header>
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
 {tab!=="home"&& <section className={s.panel}><header className={s.sectionHead}><div><h2>{tab==="templates"?"官方模板列表":tab==="archived"?"已归档项目":tab==="recent"?"最近访问":"我的项目"}</h2><p>{tab==="templates"?"按分类查找模板，先查看介绍，再决定使用。":tab==="home"?"按最近更新排序 · 显示 "+visible.length+" 项":visible.length+" 个项目 · 点击查看详情"}</p></div>{tab==="mine"&&<div className={s.actions}><button type="button" onClick={()=>{setGroupDraft("");setGroupManager(true)}}>管理分组</button></div>}</header>
 <form className={s.filters} onSubmit={e=>{e.preventDefault();setSearch(query.trim())}}>{filters.length>0&&<div className={s.tabs}>{filters.map(f=><button type="button" key={f} aria-pressed={filter===f} className={filter===f?s.selected:""} onClick={()=>setFilter(f)}>{f}</button>)}</div>}<div className={s.search}><input aria-label="搜索项目名称、业务或店铺" placeholder={tab==="templates"?"搜索模板名称或关键词":"搜索项目名称、业务或店铺"} value={query} onChange={e=>setQuery(e.target.value)}/><button type="button" onClick={()=>{setFilter("全部");setGroupFilter("全部分组");setSearch("");setQuery("")}}>重置</button><button className={s.primary}>确定</button></div></form>
 {tab==="templates"?<div className={s.cards}>{templates.map((t,i)=><article className={s.card} data-tone={i} key={t.name}><h3>{t.name}</h3><p>{t.description}</p><span className={s.tag}>{t.category}</span><footer><button onClick={()=>setTemplateName(t.name)}>介绍</button><button className={s.primary} onClick={()=>chat("create",t.name)}>使用</button></footer></article>)}{!templates.length&&<p className={s.empty}>未找到匹配模板</p>}</div>:<div className={s.tableWrap}><table className={s.table}><thead><tr>{["项目与目标","关联范围","当前里程碑",tab==="archived"?"归档时间":"项目进展","操作"].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{visible.map(p=><tr key={p.id} data-project-id={p.id}><td><strong>{p.name}</strong><small>{p.goal}</small></td><td>{p.scope}<small>{p.category}{p.group?" · "+p.group:""}</small></td><td>{p.milestone}</td><td>{tab==="archived"?<small>{fmt(p.archivedAt||0)}</small>:<div className={s.progress}><div><span style={{width:p.progress+"%"}}/></div><b>{p.progress}%</b></div>}<span className={s.status} data-status={p.status}>{p.status}</span></td><td><button onClick={()=>open(p)}>{tab==="recent"?"继续查看":"查看详情"}</button></td></tr>)}</tbody></table>{!visible.length&&<div className={s.empty}>暂无匹配项目，可重置筛选或新建项目。</div>}</div>}
 </section>}

 <dialog ref={dialog} className={s.dialog} onClose={close} aria-label={template?"模板介绍":"项目详情"}>{template?<><header><h2>模板介绍</h2><button aria-label="关闭" onClick={close}>×</button></header><h3>{template.name}</h3><p>{template.description}</p><div className={s.milestones}>{template.milestones.map((m,i)=><div key={m}><b>0{i+1}</b>{m}</div>)}</div><footer><button onClick={close}>返回</button><button className={s.primary} onClick={()=>chat("create",template.name)}>使用模板</button></footer></>:detail?<><header><h2>项目详情</h2><button aria-label="关闭" onClick={close}>×</button></header><h3>{detail.name}</h3><span className={s.status} data-status={detail.status}>{detail.status}</span><dl><dt>项目目标</dt><dd>{detail.goal}</dd><dt>关联范围</dt><dd>{detail.scope} · {detail.category}</dd><dt>模板来源</dt><dd>{detail.template||"自定义"}</dd><dt>自定义分组</dt><dd>{detail.group||"未分组"}</dd><dt>项目资源</dt><dd>{detail.resources.join("、")||"暂无关联资源"}</dd></dl>
 {detail.links?.length?<section className={s.detailSection}><h4>已核对关联资源</h4><p>已核实的演示模块、SKU可查看；店铺、批次、外部服务未完成身份或权限校验时保持待选择/待配置，不代表已经调用。</p><ul>{detail.links.map(link=><li key={link.kind+":"+link.id}><strong>{link.label}</strong> · {link.status}{link.note?" · "+link.note:""} {["skill","knowledge","report"].includes(link.kind)&&link.id.startsWith("demo-")?<button type="button" onClick={()=>previewResource(link.kind,link.id)}>查看具体内容</button>:null} {link.path?<button type="button" onClick={()=>router.push(link.path+"?preview=1")}>前往管理</button>:null}</li>)}</ul></section>:null}
 {detail.stages?.length?<section className={s.detailSection}><h4>项目执行阶段（演示）</h4><ul>{detail.stages.map((step,i)=><li key={i}><strong>{step.title}</strong> · {step.state}<p>{step.detail}</p></li>)}</ul></section>:null}
 {linkedTasks.length?<section className={s.detailSection}><h4>关联任务 · {linkedTasks.length} 项</h4><p>演示任务状态：已完成 {taskCounters.completed} · 进行中 {taskCounters.running} · 待确认 {taskCounters.pending} · 异常 {taskCounters.errors}。项目进度与任务进度分别记录，不自动伪造业务完成率。</p><ul>{linkedTasks.map(t=><li key={t.id}><strong>{t.name}</strong> · {taskLabel(t.state)}<p>{t.description}</p></li>)}</ul><button type="button" onClick={()=>goProjectTasks(detail.id)}>查看该项目任务</button></section>:null}
 <section className={s.detailSection}><h4>所属分组</h4><label>选择分组<select aria-label="项目所属分组" value={detail.group||""} onChange={e=>{if(save({...detail,group:e.target.value||undefined,updated:Date.now()}))setNotice("项目分组已更新")}}><option value="">未分组</option>{groups.map(g=><option key={g} value={g}>{g}</option>)}</select></label></section><section className={s.detailSection}><h4>里程碑与进展</h4>{detail.status==="已归档"?<p>{detail.milestone} · {detail.progress}%</p>:<><label>当前里程碑<input value={milestone} onChange={e=>setMilestone(e.target.value)}/></label><label>项目进度 {progress}%<input type="range" min="0" max="100" value={progress} onChange={e=>setProgress(Number(e.target.value))}/></label><label>项目状态<select value={status} onChange={e=>setStatus(e.target.value as Exclude<ProjectStatus,"已归档">)}>{["进行中","待确认","已完成"].map(x=><option key={x}>{x}</option>)}</select></label><button className={s.primary} onClick={update}>保存进展</button></>}</section>
 <section className={s.detailSection}><h4>阶段成果</h4>{detail.reports.length?<ul>{detail.reports.map((r,i)=><li key={i}>{r}</li>)}</ul>:<p>暂无已保存成果</p>}{detail.status!=="已归档"&&<div className={s.search}><input aria-label="成果名称" placeholder="输入阶段成果名称" value={report} onChange={e=>setReport(e.target.value)}/><button disabled={!report.trim()} onClick={()=>{if(save({...detail,reports:[...detail.reports,report.trim()],updated:Date.now()}))setReport("")}}>记录成果</button></div>}</section>
 {confirm?<section className={s.detailSection}><p>{confirm==="archive"?"确认归档？项目资料及成果将保留。":"确认恢复该项目？"}</p><div className={s.actions}><button onClick={()=>setConfirm(null)}>取消</button><button className={s.primary} onClick={archive}>{confirm==="archive"?"确认归档":"确认恢复"}</button></div></section>:<footer>{detail.status==="已归档"?<button className={s.primary} onClick={()=>setConfirm("restore")}>恢复项目</button>:<><button onClick={()=>setConfirm("archive")}>归档项目</button><button onClick={()=>{close();router.push("/workbench/ai/tasks?preview=1")}}>前往任务中心</button><button className={s.primary} onClick={()=>chat("reference",detail.id)}>去会话</button></>}</footer>}</>:null}</dialog>
 {resourcePreview&&<div style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(0,0,0,.65)",display:"grid",placeItems:"center",padding:16}} onMouseDown={e=>{if(e.target===e.currentTarget)setResourcePreview(null)}}><section role="dialog" aria-modal="true" aria-label="项目关联资源具体内容" style={{width:"min(1100px,96vw)",maxHeight:"90vh",display:"flex",flexDirection:"column",background:"var(--cn-surface,var(--card,#142237))",color:"var(--cn-text,inherit)",border:"1px solid var(--cn-border,#415064)",borderRadius:12,overflow:"hidden"}}><header style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,padding:"18px 22px",borderBottom:"1px solid var(--cn-border,#415064)"}}><h2 style={{margin:0,fontSize:20}}>{resourcePreview.title}</h2><button type="button" aria-label="关闭资源内容" onClick={()=>setResourcePreview(null)}>×</button></header><div style={{padding:"24px",overflowY:"auto",whiteSpace:"pre-wrap",lineHeight:1.9,fontSize:14}}>{resourcePreview.content}</div><footer style={{padding:"15px 22px",borderTop:"1px solid var(--cn-border,#415064)",textAlign:"right"}}><button type="button" onClick={()=>setResourcePreview(null)}>关闭</button></footer></section></div>}
 <dialog ref={groupsDialog} className={s.dialog} aria-label="管理项目分组" onClose={()=>setGroupManager(false)}>
  <header><h2>管理项目分组</h2><button type="button" aria-label="关闭分组管理" onClick={()=>setGroupManager(false)}>×</button></header>
  <p>分组用于整理我的项目，不改变项目模板、执行状态或归档记录。</p>
  <form className={s.groupCreate} onSubmit={e=>{e.preventDefault();addGroup()}}>
    <input aria-label="新分组名称" maxLength={40} placeholder="输入分组名称" value={groupDraft} onChange={e=>setGroupDraft(e.target.value)}/>
    <button type="submit" className={s.primary} disabled={!groupDraft.trim()||groups.includes(groupDraft.trim())}>创建分组</button>
  </form>
  <div className={s.groupRows}>
    {groups.length?groups.map(name=><div className={s.groupRow} key={name}>
      {editingGroup===name?<form className={s.groupRename} onSubmit={e=>{e.preventDefault();renameGroup(name)}}>
        <input aria-label={"重命名"+name} maxLength={40} value={groupRename} onChange={e=>setGroupRename(e.target.value)}/>
        <button className={s.primary} disabled={!groupRename.trim()||(groups.includes(groupRename.trim())&&groupRename.trim()!==name)}>保存</button>
        <button type="button" onClick={()=>setEditingGroup("")}>取消</button>
      </form>:<><div><strong>{name}</strong><small>{records.filter(p=>p.group===name).length} 个项目（含已归档）</small></div><div className={s.actions}><button type="button" onClick={()=>{setEditingGroup(name);setGroupRename(name)}}>重命名</button><button type="button" onClick={()=>deleteGroup(name)}>删除分组</button></div></>}
    </div>):<p>尚无自定义分组。创建后可在项目详情中选择所属分组。</p>}
  </div>
  <footer><button type="button" className={s.primary} onClick={()=>setGroupManager(false)}>完成</button></footer>
 </dialog>
 </main>
}
