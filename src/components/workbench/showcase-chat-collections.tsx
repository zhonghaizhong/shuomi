"use client";
import {useEffect,useMemo,useState} from "react";
import styles from "./showcase-chat-collections.module.css";

type Conversation={id:string;title:string;description:string;time:string;favorite:boolean;deleted?:boolean};
type Dialog={kind:"rename"|"delete"|"detail";id:string}|null;
const key="shuomi-showcase-chat-collections-v1";
const initial:Conversation[]=[
 {id:"c1",title:"一号店转化率下降分析",description:"一号店 · 已完成诊断，可继续讨论优化计划",time:"刚刚",favorite:false},
 {id:"c2",title:"美国宠物用品选品分析",description:"宠物用品选品项目 · 机会品和利润标准待确认",time:"今天 10:32",favorite:false},
 {id:"c3",title:"28个Listing批量优化",description:"北美家居店 · 21项已完成，7项待处理",time:"昨天",favorite:false},
 {id:"c4",title:"北美家居店广告预算调整",description:"北美家居店 · 广告预算调整建议已生成",time:"8月12日",favorite:false},
 {id:"c5",title:"加拿大站市场进入方案",description:"加拿大站 · 市场进入方案已整理",time:"8月10日",favorite:false},
 {id:"s1",title:"一号店转化率分析",description:"店铺经营 · 一号店 · 关键诊断结论与增长建议",time:"今天 09:40",favorite:true},
 {id:"s2",title:"美国站夏季女装选品建议",description:"商品开发 · 通用业务 · 市场机会与开发方向",time:"8月12日",favorite:true},
 {id:"s3",title:"OPC跨境创业方案讨论",description:"创业项目 · 通用业务 · 平台选择与首月计划",time:"8月10日",favorite:true},
 {id:"s4",title:"广告预算优化策略",description:"店铺经营 · 二号店 · 不同预算方案与预期回报",time:"8月8日",favorite:true},
];
function validRows(value:unknown):value is Conversation[]{
 return Array.isArray(value)&&value.length<=100&&value.every(v=>v&&typeof v==="object"&&typeof v.id==="string"&&typeof v.title==="string"&&typeof v.description==="string"&&typeof v.time==="string"&&typeof v.favorite==="boolean"&&(v.deleted===undefined||typeof v.deleted==="boolean"));
}
export function ShowcaseChatCollections({mode}:{mode:"recent"|"saved"}){
 const [items,setItems]=useState<Conversation[]>(initial);
 const [ready,setReady]=useState(false);
 const [query,setQuery]=useState("");
 const [menu,setMenu]=useState<string|null>(null);
 const [dialog,setDialog]=useState<Dialog>(null);
 const [draft,setDraft]=useState("");
 const [notice,setNotice]=useState("");
 useEffect(()=>{try{const raw=sessionStorage.getItem(key);if(raw){const parsed:unknown=JSON.parse(raw);if(validRows(parsed))setItems(parsed)}}catch{/* keep isolated demo values */}setReady(true)},[]);
 useEffect(()=>{if(!ready)return;try{sessionStorage.setItem(key,JSON.stringify(items))}catch{/* demo stays usable */}},[items,ready]);
 useEffect(()=>{if(!menu&&!dialog)return;const close=(event:KeyboardEvent)=>{if(event.key==="Escape"){setMenu(null);setDialog(null)}};document.addEventListener("keydown",close);return()=>document.removeEventListener("keydown",close)},[menu,dialog]);
 const rows=useMemo(()=>items.filter(x=>!x.deleted&&(mode!=="saved"||x.favorite)).filter(x=>(x.title+" "+x.description).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())),[items,mode,query]);
 const selected=dialog?items.find(item=>item.id===dialog.id):undefined;
 function update(id:string,change:Partial<Conversation>,feedback:string){setItems(current=>current.map(item=>item.id===id?{...item,...change}:item));setMenu(null);setDialog(null);setNotice(feedback)}
 function openRename(item:Conversation){setMenu(null);setDraft(item.title);setDialog({kind:"rename",id:item.id})}
 function saveRename(){if(!selected)return;const title=draft.trim();if(!title||new TextEncoder().encode(title).length>256)return;update(selected.id,{title},"会话名称已更新（仅演示）。")}
 function favorite(item:Conversation){update(item.id,{favorite:!item.favorite},item.favorite?"已取消收藏。原始会话仍保留在最近会话中。":"已加入收藏会话（仅演示）。")}
 return <section className={styles.root} data-chat-collection-preview={mode}>
   <div className={styles.filters}><label>搜索会话标题或内容<input value={query} onChange={e=>setQuery(e.target.value)} placeholder={mode==="saved"?"搜索收藏会话标题或内容":"搜索最近会话标题或内容"}/></label><button type="button" onClick={()=>setQuery("")}>重置</button><button type="button" className={styles.primary} onClick={()=>{setMenu(null);setNotice("已按当前关键词筛选演示会话。")}}>确定</button></div>
   {notice?<div className={styles.notice} role="status">{notice}<button type="button" aria-label="关闭提示" onClick={()=>setNotice("")}>×</button></div>:null}
   <div className={styles.list} aria-label={mode==="saved"?"收藏会话列表":"最近会话列表"}>
     {rows.length?rows.map(item=><article className={styles.row} key={item.id}>
       <button type="button" className={styles.mainAction} onClick={()=>{setMenu(null);setDialog({kind:"detail",id:item.id})}} aria-label={`查看会话：${item.title}`}>
         <span className={styles.clock} aria-hidden="true">{item.favorite?"★":"◷"}</span>
         <span className={styles.titleArea}><strong>{item.title}</strong><small>{item.description}</small></span>
         <time>{item.time}</time>
       </button>
       <div className={styles.menuHost}><button type="button" className={styles.dots} aria-label={`更多操作：${item.title}`} aria-expanded={menu===item.id} aria-haspopup="menu" onClick={()=>setMenu(current=>current===item.id?null:item.id)}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" style={{display:"block",flexShrink:0}}><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg></button>
         {menu===item.id?<div role="menu" className={styles.menu} aria-label={`会话操作：${item.title}`}>
           <button type="button" role="menuitem" onClick={()=>openRename(item)}>重命名</button>
           <button type="button" role="menuitem" onClick={()=>favorite(item)}>{item.favorite?"取消收藏":"加入收藏会话"}</button>
           <button type="button" role="menuitem" className={styles.danger} onClick={()=>{setMenu(null);setDialog({kind:"delete",id:item.id})}}>删除会话</button>
         </div>:null}
       </div>
     </article>):<div className={styles.empty}><strong>{mode==="saved"?"没有找到符合条件的收藏会话":"没有找到符合条件的最近会话"}</strong><p>试试其他关键词，或清空筛选条件。</p><button type="button" onClick={()=>setQuery("")}>清空筛选</button></div>}
   </div>
   <p className={styles.footnote}>{mode==="saved"?"取消收藏仅移出本列表，原始会话仍保留在最近会话中。":"选择会话可查看演示详情，右侧三点菜单可重命名、收藏或删除演示记录。"} 本页操作仅作用于当前浏览器的展示数据。</p>
   {menu?<button type="button" className={styles.dismiss} aria-label="关闭菜单" onClick={()=>setMenu(null)}/>:null}
   {dialog&&selected?<div className={styles.backdrop} onMouseDown={event=>{if(event.target===event.currentTarget)setDialog(null)}}>
     {dialog.kind==="rename"?<form className={styles.modal} role="dialog" aria-modal="true" aria-label="重命名会话" onSubmit={event=>{event.preventDefault();saveRename()}}>
       <div className={styles.modalHeader}><h2>重命名会话</h2><button type="button" aria-label="关闭重命名" onClick={()=>setDialog(null)}>×</button></div>
       <label>会话名称<input autoFocus value={draft} onChange={event=>setDraft(event.target.value)} maxLength={256}/></label>
       {new TextEncoder().encode(draft.trim()).length>256?<p>会话名称不得超过256字节。</p>:null}
       <footer><button type="button" onClick={()=>setDialog(null)}>取消</button><button type="submit" className={styles.primary} disabled={!draft.trim()||new TextEncoder().encode(draft.trim()).length>256}>保存</button></footer>
     </form>:dialog.kind==="delete"?<section className={styles.modal} role="alertdialog" aria-modal="true" aria-label="确认删除会话">
       <div className={styles.modalHeader}><h2>删除会话</h2><button type="button" aria-label="关闭删除确认" onClick={()=>setDialog(null)}>×</button></div>
       <p>确定删除「{selected.title}」吗？此操作会删除演示会话，而不只是取消收藏。</p><p>删除后将从本浏览器演示的最近会话与收藏会话中移除，不会影响任何真实业务数据。</p>
       <footer><button type="button" onClick={()=>setDialog(null)}>取消</button><button type="button" className={styles.dangerButton} onClick={()=>update(selected.id,{deleted:true},"已删除演示会话。")}>确认删除</button></footer>
     </section>:<section className={styles.modal} role="dialog" aria-modal="true" aria-label="查看会话演示">
       <div className={styles.modalHeader}><h2>{selected.title}</h2><button type="button" aria-label="关闭会话详情" onClick={()=>setDialog(null)}>×</button></div>
       <p>{selected.description}</p><p>这是 GitHub Pages 静态演示。正式对话与历史消息需登录业务工作台查看，当前预览不连接真实会话数据。</p>
       <footer><button type="button" onClick={()=>setDialog(null)}>返回列表</button></footer>
     </section>}
   </div>:null}
 </section>;
}
