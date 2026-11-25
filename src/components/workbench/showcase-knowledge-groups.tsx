"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import styles from "./showcase-knowledge-groups.module.css";

export type KnowledgeItem={id:string;name:string;origin:"官方"|"我的";group:string;description:string;updated?:number};
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
 writeKnowledgeState(org,member,{...value,items:[...value.items,{id:"official:"+name,name,description,origin:"官方",group:"",updated:Date.now()}]});
 return true;
}
export function savePersonalKnowledge(org:string,member:string,name:string,description:string){
 const value=readKnowledgeState(org,member);
 const cleaned=name.trim().slice(0,80);
 if(!cleaned)return false;
 if(value.items.some(x=>x.origin==="我的"&&x.name===cleaned))return false;
 writeKnowledgeState(org,member,{...value,items:[...value.items,{id:"personal:"+crypto.randomUUID(),name:cleaned,description,origin:"我的",group:"",updated:Date.now()}]});
 return true;
}
export function KnowledgeGroupManager({organizationId,memberId,onBrowse}:{organizationId:string;memberId:string;onBrowse:()=>void}){
 const router=useRouter();
 const [state,setState]=useState<KnowledgeState>(blank);
 const [filter,setFilter]=useState("全部分组");
 const [open,setOpen]=useState(false);
 const [draft,setDraft]=useState("");
 const [editing,setEditing]=useState("");
 const [rename,setRename]=useState("");
 const [notice,setNotice]=useState("");
 const [search,setSearch]=useState("");
 const [editor,setEditor]=useState<string|null>(null);
 const [editName,setEditName]=useState("");
 const [editDescription,setEditDescription]=useState("");
 const [more,setMore]=useState<string|null>(null);
 useEffect(()=>{
  const refresh=()=>setState(readKnowledgeState(organizationId,memberId));
  refresh();setFilter("全部分组");window.addEventListener("shuomi-knowledge-changed",refresh);
  return()=>window.removeEventListener("shuomi-knowledge-changed",refresh);
 },[organizationId,memberId]);
 const save=(next:KnowledgeState,message:string)=>{try{writeKnowledgeState(organizationId,memberId,next);setState(next);setNotice(message)}catch{setNotice("保存失败，请检查浏览器存储权限。")}};
 const create=()=>{const name=draft.trim();if(!name||name.length>40||state.groups.includes(name))return;save({...state,groups:[...state.groups,name]},"分组已创建");setDraft("")};
 const changeName=(old:string)=>{const next=rename.trim();if(!next||next.length>40||(next!==old&&state.groups.includes(next)))return;save({groups:state.groups.map(g=>g===old?next:g),items:state.items.map(i=>i.group===old?{...i,group:next}:i)},"分组已重命名");if(filter===old)setFilter(next);setEditing("");setRename("")};
 const removeGroup=(name:string)=>{save({groups:state.groups.filter(g=>g!==name),items:state.items.map(i=>i.group===name?{...i,group:""}:i)},"已删除分组；知识库内容保留为未分组");if(filter===name)setFilter("全部分组")};
 const visible=state.items.filter(x=>(filter==="全部分组"||(filter==="未分组"?!x.group:x.group===filter))&&(x.name+" "+x.description).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
 const hasKnowledge=state.items.length>0;
 const editItem=state.items.find(x=>x.id===editor);
 const updateItem=(item:KnowledgeItem,changes:Partial<KnowledgeItem>,message:string)=>save({...state,items:state.items.map(x=>x.id===item.id?{...x,...changes,updated:Date.now()}:x)},message);
 return <div className={styles.root} data-my-knowledge-groups>
  <section className={styles.toolbar} aria-label="知识库操作">
   <div className={styles.leftFilters}>
    <label>分组 <select aria-label="按知识库分组筛选" value={filter} onChange={e=>setFilter(e.target.value)}><option>全部分组</option><option>未分组</option>{state.groups.map(g=><option key={g}>{g}</option>)}</select></label>
    <input aria-label="搜索知识库名称" placeholder="搜索知识库名称" value={search} onChange={e=>setSearch(e.target.value)}/>
   </div>
   <div className={styles.actions}><button type="button" onClick={()=>setOpen(true)}>管理分组</button><span className={styles.count}>共 {visible.length} 项</span></div>
  </section>
  {notice&&<p className={styles.notice} role="status">{notice}</p>}
  <div className={styles.tableWrap}><table className={styles.table}>
   <thead><tr><th>知识库名称</th><th>来源</th><th>所属分组</th><th>最近更新</th><th>操作</th></tr></thead>
   <tbody>{visible.map(item=><tr key={item.id}>
    <td><strong>{item.name}</strong></td><td>{item.origin}</td><td><select aria-label={item.name+"的所属分组"} value={item.group} onChange={e=>updateItem(item,{group:e.target.value},"分组已更新")}><option value="">未分组</option>{state.groups.map(g=><option key={g} value={g}>{g}</option>)}</select></td>
    <td>{item.updated?new Date(item.updated).toLocaleDateString("zh-CN"):"—"}</td>
    <td><div className={styles.rowActions}>
     <button type="button" onClick={()=>router.push("/workbench/ai/chat/new?preview=1&knowledgeMode=reference&knowledgeName="+encodeURIComponent(item.name))}>使用</button>
     {item.origin==="我的"&&<button type="button" onClick={()=>{setEditor(item.id);setEditName(item.name);setEditDescription(item.description)}}>编辑</button>}
     <button type="button" aria-label={item.name+"的更多操作"} onClick={()=>setMore(more===item.id?null:item.id)}>更多</button>
}
    </div></td>
   </tr>)}</tbody>
   {!visible.length&&<tr><td colSpan={5} className={styles.emptyCell}>{hasKnowledge?"没有符合条件的知识库":"暂无知识库"}</td></tr>}
  </table></div>
  {more&&state.items.some(x=>x.id===more)&&<div className={styles.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setMore(null)}}>
   <section className={styles.dialog} role="dialog" aria-modal="true" aria-label="知识库更多操作">
    <header><h2>知识库操作</h2><button type="button" aria-label="关闭更多操作" onClick={()=>setMore(null)}>×</button></header>
    <p>{state.items.find(x=>x.id===more)?.name}</p>
    <footer><button type="button" onClick={()=>setMore(null)}>取消</button><button type="button" onClick={()=>{save({...state,items:state.items.filter(x=>x.id!==more)},"已移出我的知识库");setMore(null)}}>移出我的知识库</button></footer>
   </section>
  </div>}
  {editItem&&<div className={styles.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setEditor(null)}}>
   <form className={styles.dialog} role="dialog" aria-modal="true" aria-label="编辑知识库" onSubmit={e=>{e.preventDefault();const name=editName.trim();if(!name)return;updateItem(editItem,{name,description:editDescription.trim()},"知识库信息已更新");setEditor(null)}}>
    <header><h2>编辑知识库</h2><button type="button" aria-label="关闭编辑" onClick={()=>setEditor(null)}>×</button></header>
    <label className={styles.editField}>名称<input aria-label="知识库名称" maxLength={80} value={editName} onChange={e=>setEditName(e.target.value)}/></label>
    <label className={styles.editField}>说明<textarea aria-label="知识库说明" maxLength={500} value={editDescription} onChange={e=>setEditDescription(e.target.value)}/></label>
    <footer><button type="button" onClick={()=>setEditor(null)}>取消</button><button className={styles.primary} type="submit" disabled={!editName.trim()}>保存</button></footer>
   </form>
  </div>}
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