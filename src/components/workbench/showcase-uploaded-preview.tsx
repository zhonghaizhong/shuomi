"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./showcase-uploaded-preview.module.css";
import {readShowcaseUploadTasks,showcaseUploadTasksEvent,showcaseUploadBatchKey,showcaseUploadBatchLabel,showcaseUploadBatchPreferenceKey} from "./listing/showcase-upload-tasks";

type Item={sku:string;name:string;batch:string;batchKey?:string;site:string;platform:string;method:string;time:string;productId:string};
const records:Item[]=[];
const stages=[["waiting","待上传"],["missing","待补全"],["review","待审核"],["uploaded","已上传"]] as const;
export function ShowcaseUploadedPreview({organizationId,memberId}:{organizationId:string;memberId:string}){
 const router=useRouter();
 const readPreferredBatch=()=>typeof window==="undefined"?"":sessionStorage.getItem(showcaseUploadBatchPreferenceKey(organizationId,memberId))||"";
 const [batch,setBatch]=useState(readPreferredBatch),[appliedBatch,setAppliedBatch]=useState(readPreferredBatch),[query,setQuery]=useState("");
 const [appliedQuery,setAppliedQuery]=useState("");
 const [taskVersion,setTaskVersion]=useState(0);
 useEffect(()=>{const refresh=(event:Event)=>{const d=(event as CustomEvent<{organizationId:string;memberId:string}>).detail;if(d?.organizationId===organizationId&&d.memberId===memberId)setTaskVersion(v=>v+1)};window.addEventListener(showcaseUploadTasksEvent,refresh);return()=>window.removeEventListener(showcaseUploadTasksEvent,refresh)},[organizationId,memberId]);
 const allTasks=useMemo(()=>readShowcaseUploadTasks(organizationId,memberId),[organizationId,memberId,taskVersion]);
 const batches=Array.from(new Map(allTasks.map(task=>[showcaseUploadBatchKey(task),{key:showcaseUploadBatchKey(task),label:showcaseUploadBatchLabel(task),name:task.batchName}])).values());
 const activeBatch=batches.find(option=>option.key===appliedBatch);
 const [page,setPage]=useState(1),[selected,setSelected]=useState<Item|null>(null);
 const closeDetail=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
   if(!selected)return;
   const previous=document.activeElement as HTMLElement|null;
   closeDetail.current?.focus();
   const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape"){e.preventDefault();setSelected(null);}};
   document.addEventListener("keydown",onKey);
   return()=>{document.removeEventListener("keydown",onKey);previous?.focus?.();};
 },[selected]);
 const filtered=records.filter(item=>
  (!appliedBatch||item.batchKey===appliedBatch)&&
  (item.name+" "+item.sku+" "+item.batch+" "+item.productId).toLowerCase().includes(appliedQuery.toLowerCase())
 );
 const visible=filtered.slice((page-1)*4,page*4);
 const apply=()=>{const selected=batches.some(item=>item.key===batch)?batch:"";setAppliedBatch(selected);setAppliedQuery(query.trim());sessionStorage.setItem(showcaseUploadBatchPreferenceKey(organizationId,memberId),selected);setPage(1);};
 const reset=()=>{setBatch("");setAppliedBatch("");setQuery("");setAppliedQuery("");sessionStorage.removeItem(showcaseUploadBatchPreferenceKey(organizationId,memberId));setPage(1);};
 const pages=Math.max(1,Math.ceil(filtered.length/4));
 return <div className={styles.page} data-showcase-uploaded>
  <header className={styles.heading}><div><small>店铺中心 / 刊登管理 / 已上传</small><h1>已上传</h1><p>查看原提交版本、目标店铺和真实平台状态；受理、审核、平台草稿及上架分别显示。</p></div></header>
  <section className={styles.metrics}>
   {[[String(records.length),"已上传商品","已同步的真实记录"],[String(records.filter(x=>x.method==="直接上架").length),"直接上架","提交方式记录，非平台已上架证明"],[String(records.filter(x=>x.method==="发布到草稿箱").length),"平台草稿","平台草稿不等于已上架"]].map(([value,title,sub],i)=><article key={title} data-tone={i}><strong>{value}</strong><span><b>{title}</b><small>{sub}</small></span></article>)}
  </section>
  <nav className={styles.stages} aria-label="刊登管理阶段">{stages.map(([id,label])=><button key={id} type="button" aria-current={id==="uploaded"?"page":undefined} onClick={()=>id==="uploaded"?undefined:router.push("/workbench/listing/"+id+"?preview=1")}>{label}</button>)}</nav>
  <section className={styles.panel}>
   <div className={styles.toolbar}>
    <div className={styles.filters}><label>商品批次<select aria-label="选择刊登批次" value={batch} onChange={e=>setBatch(e.target.value)}><option value="">全部批次</option>{batches.map(option=><option key={option.key} value={option.key}>{option.label}</option>)}</select></label></div>
    <div className={styles.search}><input aria-label="搜索已上传商品" placeholder="搜索商品名称 / SKU" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")apply()}}/><button onClick={reset} type="button">重置</button><button className={styles.primary} onClick={apply} type="button">确认</button></div>
   </div>
   {activeBatch?<div className={styles.batchContext} role="status"><strong>当前批次：{activeBatch.name}</strong><span>本阶段已确认上传 {filtered.length} 件商品 · 仅计入平台真实接收记录</span></div>:null}
   <div className={styles.listTitle}><h2>已上传商品</h2><span>共 {filtered.length} 条记录</span></div>
   <div className={styles.tableScroll}><div className={styles.table}>
    <div className={styles.columns}><span>商品名称 / SKU</span><span>批次</span><span>目标平台 / 站点</span><span>平台商品ID / 草稿</span><span>上传时间</span><span>提交方式 / 状态</span><span>操作</span></div>
    {visible.map(item=><div className={styles.item} key={item.sku}>
      <span><b>{item.name}</b><small>{item.sku}</small></span><span>{item.batch}</span><span>{item.platform}<small>{item.site}</small></span><span>{item.productId}</span><span>{item.time}</span><span className={styles.method} data-draft={item.method==="发布到草稿箱"}>{item.method}<small>{item.method==="发布到草稿箱"?"平台草稿 · 未上架":"提交平台 · 审核中（演示）"}</small></span><button type="button" onClick={()=>setSelected(item)}>查看商品</button>
    </div>)}
   </div></div>
   {!filtered.length?<div className={styles.empty}>{activeBatch?"当前批次暂无已被平台确认接收的商品；演示任务不计入已上传。":"暂无已上传商品记录。完成实际商品上传后，才会在这里显示记录。"}</div>:null}
   <footer className={styles.pagination}><span>第 {page} / {pages} 页 · 每页最多 4 条</span><div><button type="button" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>上一页</button><button type="button" disabled={page>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>下一页</button></div></footer>
  </section>
  <p className={styles.disclaimer}>规则：第三方平台确认接收商品后，即将本次优化内容保存到「我的数据 → 数据集」，初始状态为「待审核 / 未上架」；后续审核与上架状态独立同步。平台未接收、草稿未提交成功、提交失败或取消均不创建优化版本。原始资料、价格和库存始终不覆盖。当前演示未连接真实平台回执，不生成虚假已接收记录。</p>
  {selected&&<div className={styles.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null);}}><section className={styles.dialog} role="dialog" aria-modal="true" aria-label="查看商品详情"><header><div><small>已上传 / 查看商品</small><h2>{selected.name}</h2></div><button type="button" ref={closeDetail} aria-label="关闭商品详情" onClick={()=>setSelected(null)}>×</button></header><dl>{[["SKU",selected.sku],["批次",selected.batch],["平台与站点",selected.platform+" · "+selected.site],["平台商品ID",selected.productId],["上传时间",selected.time],["发布方式",selected.method],["平台状态",selected.method==="发布到草稿箱"?"平台草稿 · 未上架":"提交平台 · 审核中（演示）"]].map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><p>原提交版本与上传记录只读。演示数据未核验真实平台受理、审核或上架状态；后续上架请进入店铺商品。</p><footer><button type="button" onClick={()=>setSelected(null)}>返回商品列表</button></footer></section></div>}
 </div>;
}
