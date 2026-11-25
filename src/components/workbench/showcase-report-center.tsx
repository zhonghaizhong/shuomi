"use client";
import type {ReactNode} from "react";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import styles from "./showcase-report-center.module.css";

export type PreviewReport={id:string;title:string;type:string;createdAt:number;favorite:boolean;group:string;summary:string;projectId?:string};
type ReportStore={groups:string[];reports:PreviewReport[]};
const key=(org:string,member:string)=>"shuomi-reports-demo-v1:"+encodeURIComponent(org)+":"+encodeURIComponent(member);
export function readPreviewReports(org:string,member:string):ReportStore{
 try{const raw=sessionStorage.getItem(key(org,member));if(!raw)return {groups:[],reports:[]};const v=JSON.parse(raw);return {
  groups:Array.isArray(v.groups)?v.groups.filter((x:unknown):x is string=>typeof x==="string"&&x.length>0&&x.length<=40):[],
  reports:Array.isArray(v.reports)?v.reports.filter((r:PreviewReport)=>r&&typeof r.id==="string"&&typeof r.title==="string"&&typeof r.createdAt==="number"):[]};}
 catch{return {groups:[],reports:[]}}
}
export function writePreviewReports(org:string,member:string,data:ReportStore){sessionStorage.setItem(key(org,member),JSON.stringify(data));window.dispatchEvent(new CustomEvent("shuomi-reports-changed"))}
export function savePreviewReport(org:string,member:string,title:string,summary:string,projectId?:string){
 const previous=readPreviewReports(org,member);const report:PreviewReport={id:crypto.randomUUID(),title:title.trim().slice(0,100),type:"调研报告",createdAt:Date.now(),favorite:false,group:"",summary,projectId};
 if(!report.title)return null;
 writePreviewReports(org,member,{...previous,reports:[report,...previous.reports]});return report;
}
const format=(n:number)=>new Date(n).toLocaleDateString("zh-CN");
export function ShowcaseReportCenter({pathname,organizationId,memberId,tabNavigation}:{pathname:string;organizationId:string;memberId:string;tabNavigation?:ReactNode}){
 const router=useRouter();
 const [store,setStore]=useState<ReportStore>({groups:[],reports:[]});
 const [query,setQuery]=useState("");
 const [type,setType]=useState("全部类型");
 const [group,setGroup]=useState("全部分组");
 const [from,setFrom]=useState("");
 const [to,setTo]=useState("");
 const [showDate,setShowDate]=useState(false);
 const [showGroups,setShowGroups]=useState(false);
 const [groupName,setGroupName]=useState("");
 const [renaming,setRenaming]=useState("");
 const [renameText,setRenameText]=useState("");
 const [detail,setDetail]=useState<string|null>(null);
 const [notice,setNotice]=useState("");
 useEffect(()=>{const sync=()=>setStore(readPreviewReports(organizationId,memberId));sync();window.addEventListener("shuomi-reports-changed",sync);return()=>window.removeEventListener("shuomi-reports-changed",sync)},[organizationId,memberId]);
 const save=(next:ReportStore,message:string)=>{try{writePreviewReports(organizationId,memberId,next);setStore(next);setNotice(message)}catch{setNotice("演示数据保存失败，请检查浏览器存储权限")}};
 const updateReport=(id:string,changes:Partial<PreviewReport>)=>save({...store,reports:store.reports.map(r=>r.id===id?{...r,...changes}:r)},"已更新报告");
 const kind=pathname.endsWith("/favorites")?"favorites":pathname.endsWith("/recent")?"recent":"all";
 const visible=store.reports.filter(r=>(kind!=="favorites"||r.favorite)&&(type==="全部类型"||r.type===type)&&(group==="全部分组"||(group==="未分组"?!r.group:group===r.group))&&(!from||new Date(r.createdAt).toLocaleDateString("en-CA")>=from)&&(!to||new Date(r.createdAt).toLocaleDateString("en-CA")<=to)&&(r.title+" "+r.summary).toLowerCase().includes(query.trim().toLowerCase())).sort((a,b)=>b.createdAt-a.createdAt);
 const reset=()=>{setQuery("");setType("全部类型");setGroup("全部分组");setFrom("");setTo("");setShowDate(false)};
 const chosen=store.reports.find(r=>r.id===detail);
 return <main className={styles.page} data-report-center={kind}>
  <header className={styles.hero}><div><span>AI工作台 / 我的报告</span><h1>我的报告</h1><p>管理、收藏与复用 AI 生成的报告成果。</p></div><button type="button" className={styles.primary} onClick={()=>router.push("/workbench/ai/chat/new?preview=1&reportMode=create")}>生成调研报告</button></header>
  {tabNavigation}
  <section className={styles.toolbar} aria-label="报告筛选">
   <input aria-label="搜索报告" placeholder="搜索报告名称或关键词" value={query} onChange={e=>setQuery(e.target.value)}/>
   <div className={styles.controls}>
    <select aria-label="报告类型" value={type} onChange={e=>setType(e.target.value)}><option>全部类型</option><option>调研报告</option><option>经营报告</option><option>其他报告</option></select>
    <div className={styles.dateControl}><button type="button" aria-label="选择报告日期" aria-expanded={showDate} onClick={()=>setShowDate(!showDate)}>{from&&to?from+" 至 "+to:"全部时间"}</button>{showDate&&<div className={styles.calendar} role="group" aria-label="报告日期范围">
     <label>开始日期<input aria-label="开始日期" type="date" value={from} max={to||undefined} onChange={e=>setFrom(e.target.value)}/></label>
     <label>结束日期<input aria-label="结束日期" type="date" value={to} min={from||undefined} onChange={e=>setTo(e.target.value)}/></label>
     <div><button type="button" onClick={()=>{setFrom("");setTo("");setShowDate(false)}}>全部时间</button><button type="button" className={styles.primary} onClick={()=>setShowDate(false)} disabled={Boolean(from)!==Boolean(to)||!!(from&&to&&from>to)}>确定</button></div>
    </div>}</div>
    <select aria-label="报告分组" value={group} onChange={e=>setGroup(e.target.value)}><option>全部分组</option><option>未分组</option>{store.groups.map(g=><option key={g}>{g}</option>)}</select>
    <button type="button" onClick={()=>setShowGroups(true)}>管理分组</button>
    <button type="button" onClick={reset}>重置</button>
   </div>
  </section>
  {notice&&<p className={styles.notice} role="status">{notice}</p>}
  <section className={styles.results}><div className={styles.resultsHead}><strong>{kind==="favorites"?"收藏报告":kind==="recent"?"最近报告":"全部报告"}</strong><span>共 {visible.length} 项</span></div>
   <div className={styles.tableWrap}><table><thead><tr><th>报告名称</th><th>类型</th><th>所属分组</th><th>生成日期</th><th>操作</th></tr></thead><tbody>
    {visible.map(r=><tr key={r.id}><td><strong>{r.title}</strong></td><td>{r.type}</td><td><select aria-label={r.title+"所属分组"} value={r.group} onChange={e=>updateReport(r.id,{group:e.target.value})}><option value="">未分组</option>{store.groups.map(g=><option key={g}>{g}</option>)}</select></td><td>{format(r.createdAt)}</td><td className={styles.rowActions}><button type="button" onClick={()=>setDetail(r.id)}>查看</button><button type="button" onClick={()=>updateReport(r.id,{favorite:!r.favorite})}>{r.favorite?"取消收藏":"收藏"}</button></td></tr>)}
    {!visible.length&&<tr><td className={styles.empty} colSpan={5}>{kind==="favorites"?"暂无收藏报告":kind==="recent"?"暂无最近报告":"暂无报告"}</td></tr>}
   </tbody></table></div>
  </section>
  {showGroups&&<div className={styles.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setShowGroups(false)}}><section className={styles.dialog} role="dialog" aria-modal="true" aria-label="管理报告分组"><header><h2>管理报告分组</h2><button onClick={()=>setShowGroups(false)} aria-label="关闭分组管理">×</button></header>
   <form className={styles.create} onSubmit={e=>{e.preventDefault();const n=groupName.trim();if(n&&!store.groups.includes(n)&&n.length<=40){save({...store,groups:[...store.groups,n]},"分组已创建");setGroupName("")}}}><input aria-label="新分组名称" maxLength={40} placeholder="输入分组名称" value={groupName} onChange={e=>setGroupName(e.target.value)}/><button className={styles.primary} disabled={!groupName.trim()}>创建分组</button></form>
   <div className={styles.groupList}>{store.groups.length?store.groups.map(g=><div className={styles.groupRow} key={g}>{renaming===g?<form onSubmit={e=>{e.preventDefault();const n=renameText.trim();if(n&&(!store.groups.includes(n)||n===g)){save({groups:store.groups.map(x=>x===g?n:x),reports:store.reports.map(r=>r.group===g?{...r,group:n}:r)},"分组已重命名");if(group===g)setGroup(n);setRenaming("")}}}><input aria-label={"重命名"+g} value={renameText} onChange={e=>setRenameText(e.target.value)}/><button className={styles.primary}>保存</button></form>:<><span>{g} · {store.reports.filter(r=>r.group===g).length} 项</span><div><button onClick={()=>{setRenaming(g);setRenameText(g)}}>重命名</button><button onClick={()=>{save({groups:store.groups.filter(x=>x!==g),reports:store.reports.map(r=>r.group===g?{...r,group:""}:r)},"已删除分组，报告仍然保留");if(group===g)setGroup("全部分组")}}>删除分组</button></div></>}</div>):<p>暂无自定义分组</p>}</div>
   <footer><button className={styles.primary} onClick={()=>setShowGroups(false)}>完成</button></footer>
  </section></div>}
  {chosen&&<div className={styles.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setDetail(null)}}><section className={styles.dialog} role="dialog" aria-modal="true" aria-label="查看报告"><header><h2>{chosen.title}</h2><button aria-label="关闭报告" onClick={()=>setDetail(null)}>×</button></header><p className={styles.demoNotice}>演示报告草案 · 尚未执行真实调研或业务数据分析</p><p>{chosen.summary}</p><p>创建日期：{format(chosen.createdAt)}</p><footer><button className={styles.primary} onClick={()=>setDetail(null)}>关闭</button></footer></section></div>}
 </main>;
}
