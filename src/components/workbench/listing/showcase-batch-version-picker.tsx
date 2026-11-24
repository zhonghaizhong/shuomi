"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import css from "./showcase-batch-version-picker.module.css";

export type PickSource="采集批次"|"自有商品库";
export type PickVersion={id:string;label:string;platform?:string;site?:string;language?:string;date?:string;count:number;isOriginal:boolean};
export type PickBatch={id:string;name:string;sourceName:string;date:string;products:{id:string;name:string}[];versions:PickVersion[]};
export type PickResult={batchId:string;versionId:string};

export function ShowcaseBatchVersionPicker({source,batches,selected,onClose,onConfirm,onSourceChange}:{
 source:PickSource;batches:PickBatch[];selected:PickResult|null;onClose:()=>void;onConfirm:(value:PickResult)=>void;onSourceChange?:(value:PickSource)=>void
}){
 const dialog=useRef<HTMLDialogElement>(null);
 const [query,setQuery]=useState(""),[applied,setApplied]=useState("");
 const [page,setPage]=useState(1),[batchId,setBatchId]=useState(selected?.batchId??"");
 const [versionId,setVersionId]=useState(selected?.versionId??"original");
 const [showProducts,setShowProducts]=useState(false);
 useEffect(()=>{const node=dialog.current;if(node&&!node.open)node.showModal();return()=>node?.close()},[]);
 const filtered=useMemo(()=>batches.filter(b=>(b.name+" "+b.id+" "+b.sourceName+" "+b.date).toLowerCase().includes(applied.toLowerCase())),[batches,applied]);
 const size=6,pages=Math.max(1,Math.ceil(filtered.length/size)),pageNum=Math.min(page,pages);
 const rows=filtered.slice((pageNum-1)*size,pageNum*size);
 const chosen=batches.find(b=>b.id===batchId),version=chosen?.versions.find(v=>v.id===versionId);
 const pickBatch=(id:string)=>{setBatchId(id);setVersionId("original");setShowProducts(false)};
 const confirm=()=>{if(!chosen||!version||!version.count)return;onConfirm({batchId:chosen.id,versionId:version.id})};
 return <dialog ref={dialog} className={css.dialog} aria-label="选择商品批次与版本" onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
   <header className={css.header}><div><small>我的数据 / {source} / 选择使用版本</small><h2>选择商品批次与版本</h2><p>选择一个商品批次，再确认本次刊登使用的原始或历史优化版本。</p></div><button type="button" aria-label="关闭批次选择" onClick={onClose}>×</button></header>
   <div className={css.content}>
    <section className={css.topline}><div><h3>{source}</h3><small>共 {batches.length} 个批次 · 当前账号可访问的数据</small>{onSourceChange?<label>商品来源 <select aria-label="选择商品来源" value={source} onChange={e=>{onSourceChange(e.target.value as PickSource);setBatchId("");setVersionId("original");setPage(1)}}><option value="采集批次">采集批次</option><option value="自有商品库">自有商品库</option></select></label>:null}</div><div className={css.filters}><input aria-label="搜索批次名称" placeholder="搜索批次名称 / 商品来源" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){setApplied(query.trim());setPage(1)}}}/><button type="button" onClick={()=>{setQuery("");setApplied("");setPage(1)}}>重置</button><button type="button" className={css.primary} onClick={()=>{setApplied(query.trim());setPage(1)}}>确认</button></div></section>
    <div className={css.columns}><span>选择</span><span>商品批次</span><span>来源</span><span>商品数量</span><span>版本数量</span><span>创建时间</span></div>
    <div className={css.rows}>{rows.map(b=><button type="button" key={b.id} className={css.tableRow} aria-pressed={batchId===b.id} onClick={()=>pickBatch(b.id)}><span className={css.radio} aria-hidden="true"/><strong>{b.name}<small>{b.id}</small></strong><span>{b.sourceName}</span><span>{b.products.length} 件</span><span>{b.versions.length} 个</span><span>{b.date}</span></button>)}{!rows.length?<p className={css.empty}>暂无可选批次，请先在「我的数据」采集或上传商品。</p>:null}</div>
    <div className={css.pagination}><span>共 {filtered.length} 条 · 第 {pageNum} / {pages} 页</span><div><button type="button" disabled={pageNum===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>上一页</button><button type="button" disabled={pageNum>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>下一页</button></div></div>
    {chosen?<section className={css.versionPanel}><header><div><h3>选择数据版本</h3><small>{chosen.name} · {chosen.products.length} 件原始商品</small></div><button type="button" onClick={()=>setShowProducts(v=>!v)}>{showProducts?"收起商品":"查看商品"}</button></header>
     <div className={css.versionGrid}>{chosen.versions.map(v=><label key={v.id} className={css.versionOption} data-selected={versionId===v.id}><input type="radio" name="batch-version" value={v.id} checked={versionId===v.id} onChange={()=>setVersionId(v.id)}/><span><strong>{v.label}</strong><small>{v.isOriginal?"原始商品资料 · 首次适配":`${v.platform} / ${v.site} / ${v.language} · 历史适配参考`}</small><small>{v.count} 件商品{v.date?` · ${v.date}`:""}</small></span></label>)}</div>
     {showProducts?<div className={css.products}><strong>批次商品预览</strong><div>{chosen.products.slice(0,30).map((p,i)=><span key={p.id}>{i+1}. {p.name}</span>)}{chosen.products.length>30?<small>仅展示前 30 件商品</small>:null}</div></div>:null}
     <p className={css.versionHint}>历史优化版本仅复用商品展示内容；本次目标平台仍需重新适配，原始资料、库存和价格不会被覆盖。</p>
    </section>:<div className={css.emptySelection}>请选择一个商品批次，查看它对应的可用版本。</div>}
   </div>
   <footer className={css.footer}><span>{chosen&&version?`已选：${chosen.name} · ${version.label}`:"请选择批次和版本"}</span><button type="button" onClick={onClose}>取消</button><button type="button" className={css.primary} disabled={!chosen||!version||version.count===0} onClick={confirm}>确认使用</button></footer>
 </dialog>
}
