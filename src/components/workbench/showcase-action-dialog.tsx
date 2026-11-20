"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "./showcase-action-dialog.module.css";
export type DemoGoal={name:string;metric:string;store:string;period:string;value:string};
export type DemoDraft={kind:"task"|"project"|"knowledge"|"skill";name:string;description:string;store:string};
export type DemoDetail={title:string;description:string;state?:string;value?:string};
export function ShowcaseActionDialog({action,detail,onClose,onCreateGoal,onCreateDraft}:{
 action:string;detail?:DemoDetail|null;onClose:()=>void;onCreateGoal:(v:DemoGoal)=>void;onCreateDraft?:(v:DemoDraft)=>void;
}){
 const goal=action==="新建目标";
 const kind:DemoDraft["kind"]|null=action.includes("新建任务")?"task":action.includes("新建项目")?"project":
  action.includes("添加知识")||action.includes("新增知识")?"knowledge":action.includes("新建技能")?"skill":null;
 const [name,setName]=useState(""),[description,setDescription]=useState(""),[metric,setMetric]=useState("预计净利润");
 const [store,setStore]=useState("一号店"),[period,setPeriod]=useState("每月"),[value,setValue]=useState("");
 const first=useRef<HTMLButtonElement>(null),panel=useRef<HTMLElement>(null);
 useEffect(()=>{
   const previous=document.activeElement as HTMLElement|null;
   first.current?.focus();
   const onKey=(event:KeyboardEvent)=>{
     if(event.key==="Escape"){event.preventDefault();onClose();}
     if(event.key!=="Tab"||!panel.current)return;
     const items=Array.from(panel.current.querySelectorAll<HTMLElement>("button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]"));
     if(!items.length)return;
     if(event.shiftKey&&document.activeElement===items[0]){event.preventDefault();items[items.length-1].focus();}
     else if(!event.shiftKey&&document.activeElement===items[items.length-1]){event.preventDefault();items[0].focus();}
   };
   document.addEventListener("keydown",onKey);
   return()=>{document.removeEventListener("keydown",onKey);previous?.focus?.();};
 },[onClose]);
 const submit=(e:FormEvent<HTMLFormElement>)=>{
   e.preventDefault();
   if(!name.trim())return;
   if(goal){if(!Number.isFinite(Number(value))||Number(value)<=0)return;onCreateGoal({name:name.trim(),metric,store,period,value:value.trim()});}
   else if(kind&&onCreateDraft)onCreateDraft({kind,name:name.trim(),description:description.trim(),store});
 };
 return <div className={styles.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
   <section ref={panel} className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="showcase-action-heading">
     <header className={styles.header}><div><small>{goal?"运营驾驶舱 / 目标管理":detail?"业务记录 / 查看详情":"硕米智能引擎 / 演示交互"}</small><h2 id="showcase-action-heading">{detail?.title??action}</h2></div><button ref={first} type="button" className={styles.close} aria-label="关闭弹窗" onClick={onClose}>×</button></header>
     {goal||kind?<form onSubmit={submit} className={styles.form}>
       <p className={styles.note}>本次操作仅更新演示界面的本地数据，不会写入正式业务后台。</p>
       <label>{goal?"目标名称":kind==="task"?"任务名称":kind==="project"?"项目名称":kind==="knowledge"?"知识名称":"技能名称"}<input required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="输入名称"/></label>
       {goal?<div className={styles.fields}>
         <label>目标指标<select value={metric} onChange={e=>setMetric(e.target.value)}><option>预计净利润</option><option>销售额</option><option>成交订单数</option><option>净利润率</option></select></label>
         <label>适用店铺<select value={store} onChange={e=>setStore(e.target.value)}><option>一号店</option><option>二号店</option><option>三号店</option><option>全部店铺</option></select></label>
         <label>目标周期<select value={period} onChange={e=>setPeriod(e.target.value)}><option>每天</option><option>每周</option><option>每月</option></select></label>
         <label>目标值<input required type="number" min="0.01" step="any" value={value} onChange={e=>setValue(e.target.value)} placeholder="输入目标数值"/></label>
       </div>:<>
         <label>业务说明<textarea rows={4} maxLength={1000} value={description} onChange={e=>setDescription(e.target.value)} placeholder="描述业务目标或需要处理的内容"/></label>
         {(kind==="task"||kind==="project")&&<label>关联店铺<select value={store} onChange={e=>setStore(e.target.value)}><option>一号店</option><option>二号店</option><option>三号店</option><option>全部店铺</option></select></label>}
       </>}
       <footer className={styles.actions}><button type="button" className={styles.secondary} onClick={onClose}>取消</button><button type="submit" className={styles.primary}>{goal?"添加到演示列表":"创建演示草稿"}</button></footer>
     </form>:detail?<div className={styles.information}>
       <div className={styles.detail}><span>记录名称</span><strong>{detail.title}</strong></div>
       <div className={styles.detail}><span>业务说明</span><p>{detail.description}</p></div>
       {detail.state&&<div className={styles.detail}><span>当前状态</span><strong>{detail.state}</strong></div>}
       {detail.value&&<div className={styles.detail}><span>相关数据</span><strong>{detail.value}</strong></div>}
       <p className={styles.note}>此处为演示记录；操作真实业务数据需要正式工作台授权。</p>
       <footer className={styles.actions}><button className={styles.primary} type="button" onClick={onClose}>返回列表</button></footer>
     </div>:<div className={styles.information}>
       <p>此操作在当前 GitHub Pages 演示版中尚未连接对应的业务流程，因此不会提交、保存或执行真实操作。</p>
       <p>可继续查看当前页面的演示数据；正式交互需要逐项按照 Figma 对应页面实现。</p>
       <footer className={styles.actions}><button type="button" className={styles.primary} onClick={onClose}>知道了</button></footer>
     </div>}
   </section>
 </div>;
}