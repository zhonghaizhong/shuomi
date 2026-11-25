"use client";
import {useEffect,useState} from "react";
import styles from "./showcase-knowledge-groups.module.css";

export type KnowledgeItem={id:string;name:string;origin:"官方"|"我的";group:string;description:string};
type KnowledgeState={groups:string[];items:KnowledgeItem[]};
const prefix="shuomi-showcase-knowledge-groups-v1";
const blank=():KnowledgeState=>({groups:[],items:[]});
const storageKey=(org:string,member:string)=>prefix+":"+org+":"+member;
export function readKnowledgeState(org:string,member:string):KnowledgeState{
 try{
  const raw=sessionStorage.getItem(storageKey(org,member));if(!raw)return blank();
  const value=JSON.parse(raw);
  if(!Array.isArray(value.groups)||!Array.isArray(value.items))return blank();
  const groups=value.groups.filter((g:unknown):g is string=>typeof g==="string"&&g.trim().length>0&&g.length<=40).slice(0,100);
  const items=value.items.filter((x:KnowledgeItem)=>x&&typeof x.id==="string"&&typeof x.name==="string"&&typeof x.description==="string"&&["官方","我的"].includes(x.origin)&&typeof x.group==="string").slice(0,200);
  return {groups,items};
 }catch{return blank()}
}
export function writeKnowledgeState(org:string,member:string,value:KnowledgeState){
 sessionStorage.setItem(storageKey(org,member),JSON.stringify(value));
 window.dispatchEvent(new CustomEvent("shuomi-knowledge-changed"));
}
export function enableKnowledge(org:string,member:string,name:string,description:string){
 const value=readKnowledgeState(org,member);
 if(value.items.some(x=>x.id==="official:"+name))return false;
 writeKnowledgeState(org,member,{...value,items:[...value.items,{id:"official:"+name,name,description,origin:"官方",group:""}]});
 return true;
}
export function savePersonalKnowledge(org:string,member:string,name:string,description:string){
 const value=readKnowledgeState(org,member);
 const cleaned=name.trim().slice(0,80);
 if(!cleaned)return false;
 if(value.items.some(x=>x.origin==="我的"&&x.name===cleaned))return false;
 writeKnowledgeState(org,member,{...value,items:[...value.items,{id:"personal:"+crypto.randomUUID(),name:cleaned,description,origin:"我的",group:""}]});
 return true;
}
export function KnowledgeGroupManager({organizationId,memberId,onBrowse}:{organizationId:string;memberId:string;onBrowse:()=>void}){
 const [state,setState]=useState<KnowledgeState>(blank);
 const [filter,setFilter]=useState("全部分组");
 const [open,setOpen]=useState(false);
 const [draft,setDraft]=useState("");
 const [editing,setEditing]=useState("");
 const [rename,setRename]=useState("");
 const [notice,setNotice]=useState("");
 useEffect(()=>{
  const refresh=()=>setState(readKnowledgeState(organizationId,memberId));
  refresh();setFilter("全部分组");window.addEventListener("shuomi-knowledge-changed",refresh);
  return()=>window.removeEventListener("shuomi-knowledge-changed",refresh);
 },[organizationId,memberId]);
 const save=(next:KnowledgeState,message:string)=>{try{writeKnowledgeState(organizationId,memberId,next);setState(next);setNotice(message)}catch{setNotice("保存失败，请检查浏览器存储权限。")}};
 const create=()=>{const name=draft.trim();if(!name||name.length>40||state.groups.includes(name))return;save({...state,groups:[...state.groups,name]},"分组已创建");setDraft("")};
 const changeName=(old:string)=>{const next=rename.trim();if(!next||next.length>40||(next!==old&&state.groups.includes(next)))return;save({groups:state.groups.map(g=>g===old?next:g),items:state.items.map(i=>i.group===old?{...i,group:next}:i)},"分组已重命名");if(filter===old)setFilter(next);setEditing("");setRename("")};
 const removeGroup=(name:string)=>{save({groups:state.groups.filter(g=>g!==name),items:state.items.map(i=>i.group===name?{...i,group:""}:i)},"已删除分组；知识库内容保留为未分组");if(filter===name)setFilter("全部分组")};
 const visible=state.items.filter(x=>filter==="全部分组"||(filter==="未分组"?!x.group:x.group===filter));
 const hasKnowledge=state.items.length>0;
 return <div className={styles.root} data-my-knowledge-groups>
  <section className={styles.toolbar} aria-label="知识库操作">
   <div className={styles.actions}>{hasKnowledge&&<button type="button" onClick={()=>setOpen(true)}>管理分组</button>}<button type="button" className={styles.primary} onClick={onBrowse}>＋ 添加官方知识</button></div>
   {hasKnowledge&&<label>分组 <select aria-label="按知识库分组筛选" value={filter} onChange={e=>setFilter(e.target.value)}><option>全部分组</option><option>未分组</option>{state.groups.map(g=><option key={g}>{g}</option>)}</select></label>}
  </section>
  {notice&&<p className={styles.notice} role="status">{notice}</p>}
  {visible.length?<div className={styles.cards}>{visible.map(item=><article key={item.id}>
    <div><strong>{item.name}</strong><span>{item.origin}知识 · {item.group||"未分组"}</span></div><p>{item.description}</p>
    <label>所属分组 <select aria-label={item.name+"的所属分组"} value={item.group} onChange={e=>save({...state,items:state.items.map(x=>x.id===item.id?{...x,group:e.target.value}:x)},"分组已更新")}><option value="">未分组</option>{state.groups.map(g=><option key={g} value={g}>{g}</option>)}</select></label>
    <button type="button" onClick={()=>save({...state,items:state.items.filter(x=>x.id!==item.id)},"已从我的知识库移除，原始官方知识仍可再次启用")}>移出我的知识库</button>
   </article>)}</div>:<section className={styles.empty}><strong>{filter==="全部分组"?"暂无知识库":"该分组暂无知识库"}</strong>{filter!=="全部分组"&&<button type="button" onClick={()=>setFilter("全部分组")}>查看全部</button>}</section>}
  {open&&<div className={styles.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
    <section className={styles.dialog} role="dialog" aria-modal="true" aria-label="管理知识库分组">
      <header><h2>管理知识库分组</h2><button type="button" aria-label="关闭分组管理" onClick={()=>setOpen(false)}>×</button></header>
      <p>分组只用于整理我的知识库，不改变官方知识分类；删除分组不会删除知识内容。</p>
      <form onSubmit={e=>{e.preventDefault();create()}} className={styles.create}><input aria-label="分组名称" maxLength={40} placeholder="输入新分组名称" value={draft} onChange={e=>setDraft(e.target.value)}/><button className={styles.primary} disabled={!draft.trim()||state.groups.includes(draft.trim())}>创建分组</button></form>
      <div className={styles.groupList}>{state.groups.length?state.groups.map(g=><div className={styles.group} key={g}>
       {editing===g?<form className={styles.create} onSubmit={e=>{e.preventDefault();changeName(g)}}><input aria-label={"重命名"+g} maxLength={40} value={rename} onChange={e=>setRename(e.target.value)}/><button className={styles.primary}>保存</button><button type="button" onClick={()=>setEditing("")}>取消</button></form>:<><div><strong>{g}</strong><small>{state.items.filter(i=>i.group===g).length} 项知识</small></div><div className={styles.actions}><button type="button" onClick={()=>{setEditing(g);setRename(g)}}>重命名</button><button type="button" onClick={()=>removeGroup(g)}>删除分组</button></div></>}
       </div>):<p>暂无自定义分组。</p>}</div>
      <footer><button type="button" className={styles.primary} onClick={()=>setOpen(false)}>完成</button></footer>
    </section>
  </div>}
 </div>;
}