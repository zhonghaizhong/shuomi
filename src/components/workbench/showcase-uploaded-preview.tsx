import type {ReactNode} from "react";
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./showcase-uploaded-preview.module.css";
import {ShowcaseListingStageHeader} from "./listing/showcase-listing-stage-header";
import {showcaseUploadBatchPreferenceKey} from "./listing/showcase-upload-tasks";
import {readOptimizedDatasets,optimizedDatasetsChanged} from "./showcase-optimized-datasets";
import {ShowcaseBatchVersionPicker,type PickBatch,type PickSource} from "./listing/showcase-batch-version-picker";

type Item={sku:string;name:string;batch:string;batchKey:string;site:string;platform:string;time:string;productId:string;reviewStatus:string;listingStatus:string;datasetId:string;receiptId:string};

export function ShowcaseUploadedPreview({organizationId,memberId,tabNavigation}:{organizationId:string;memberId:string;tabNavigation?:ReactNode}){
 const readPreferredBatch=()=>typeof window==="undefined"?"":sessionStorage.getItem(showcaseUploadBatchPreferenceKey(organizationId,memberId))||"";
 const [batch,setBatch]=useState(readPreferredBatch),[appliedBatch,setAppliedBatch]=useState(readPreferredBatch);
 const [batchDialog,setBatchDialog]=useState(false),[pickSource,setPickSource]=useState<PickSource>("采集批次");
 const [query,setQuery]=useState(""),[appliedQuery,setAppliedQuery]=useState("");
 const [revision,setRevision]=useState(0),[page,setPage]=useState(1),[selected,setSelected]=useState<Item|null>(null);
 useEffect(()=>{const refresh=(event:Event)=>{const d=(event as CustomEvent<{organizationId:string;memberId:string}>).detail;if(d?.organizationId===organizationId&&d.memberId===memberId)setRevision(v=>v+1)};window.addEventListener(optimizedDatasetsChanged,refresh);return()=>window.removeEventListener(optimizedDatasetsChanged,refresh)},[organizationId,memberId]);
 const datasets=useMemo(()=>readOptimizedDatasets(organizationId,memberId),[organizationId,memberId,revision]);
 // Only verified platform-accepted datasets are uploaded; demo tasks have no receipt.
 const batches=datasets.map(d=>({key:JSON.stringify([d.sourceKind,d.sourceBatchId,d.id]),label:d.sourceBatchName+" · V"+d.version+" · "+d.platform+" "+d.site,name:d.sourceBatchName,source:d.sourceKind,version:d.id}));
 const activeBatch=batches.find(option=>option.key===appliedBatch);
 const pickerBatches:PickBatch[]=datasets.filter(d=>d.sourceKind===pickSource).reduce<PickBatch[]>((acc,d)=>{
   let batch=acc.find(b=>b.id===d.sourceBatchId);
   if(!batch){batch={id:d.sourceBatchId,name:d.sourceBatchName,sourceName:d.sourceKind,date:d.createdAt,products:[],versions:[]};acc.push(batch)}
   for(const p of d.products)if(!batch.products.some(x=>x.id===p.sourceProductId))batch.products.push({id:p.sourceProductId,name:p.name});
   batch.versions.push({id:d.id,label:"V"+d.version+" · "+d.platform+" "+d.site+" 优化版",count:d.products.length,isOriginal:false,platform:d.platform,site:d.site,language:d.language,date:d.createdAt});
   return acc;
 },[]);
 const records:Item[]=datasets.flatMap(d=>d.products.map(p=>({
   sku:p.skuCodes.join(" / ")||p.sourceProductId,name:p.name,batch:d.sourceBatchName,
   batchKey:JSON.stringify([d.sourceKind,d.sourceBatchId,d.id]),site:d.site,platform:d.platform,
   time:d.acceptedAt||d.createdAt,productId:"未返回独立商品ID",reviewStatus:d.reviewStatus||"待审核",
   listingStatus:d.listingStatus||"未上架",datasetId:d.id,receiptId:d.externalReceiptId
 })));
 const chooseBatch=(id:string,versionId:string)=>{const key=JSON.stringify([pickSource,id,versionId]);setBatch(key);setAppliedBatch(key);setPage(1);sessionStorage.setItem(showcaseUploadBatchPreferenceKey(organizationId,memberId),key);setBatchDialog(false)};
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
 const pages=Math.max(1,Math.ceil(filtered.length/15));
 const actualPage=Math.min(page,pages);
 const visible=filtered.slice((actualPage-1)*15,actualPage*15);
 const apply=()=>{setAppliedQuery(query.trim());setPage(1);};
 const reset=()=>{setBatch("");setAppliedBatch("");setQuery("");setAppliedQuery("");sessionStorage.removeItem(showcaseUploadBatchPreferenceKey(organizationId,memberId));setPage(1);};

 return <div className={styles.page} data-showcase-uploaded>
  <ShowcaseListingStageHeader stage="uploaded"/>
  {tabNavigation}
  <section className={styles.metrics}>
   {[[String(records.length),"平台已接收商品","仅来自已验证的平台回执"],[String(records.filter(x=>x.reviewStatus==="审核通过").length),"审核通过","审核通过不等于已上架"],[String(records.filter(x=>x.listingStatus==="已上架").length),"已上架","以平台状态回执为准"]].map(([value,title,sub],i)=><article key={title} data-tone={i}><strong>{value}</strong><span><b>{title}</b><small>{sub}</small></span></article>)}
  </section>

  <section className={styles.panel}>
   <div className={styles.toolbar}>
    <div className={styles.filters}><label>商品批次<button type="button" aria-label="选择刊登批次" onClick={()=>{setPickSource(activeBatch?.source==="自有商品库"?"自有商品库":"采集批次");setBatchDialog(true)}}>{activeBatch?.label||"全部批次"} · 选择批次与版本</button></label></div>
    <div className={styles.search}><input aria-label="搜索已上传商品" placeholder="搜索商品名称 / SKU" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")apply()}}/><button onClick={reset} type="button">重置</button><button className={styles.primary} onClick={apply} type="button">确认</button></div>
   </div>
   {activeBatch?<div className={styles.batchContext} role="status"><strong>当前批次：{activeBatch.name}</strong><span>{activeBatch.label} · 已确认接收 {filtered.length} 件商品</span></div>:null}
   <div className={styles.listTitle}><h2>已上传商品</h2><span>共 {filtered.length} 条记录</span></div>
   <div className={styles.tableScroll}><div className={styles.table}>
    <div className={styles.columns}><span>商品名称 / SKU</span><span>批次</span><span>目标平台 / 站点</span><span>平台商品ID / 草稿</span><span>上传时间</span><span>审核 / 上架状态</span><span>操作</span></div>
    {visible.map(item=><div className={styles.item} key={item.sku}>
      <span><b>{item.name}</b><small>{item.sku}</small></span><span>{item.batch}</span><span>{item.platform}<small>{item.site}</small></span><span>{item.productId}</span><span>{item.time}</span><span className={styles.method}>{item.reviewStatus}<small>{item.listingStatus}</small></span><button type="button" onClick={()=>setSelected(item)}>查看商品</button>
    </div>)}
   </div></div>
   {!filtered.length?<div className={styles.empty}>{activeBatch?"当前批次暂无已被平台确认接收的商品；演示任务不计入已上传。":"暂无已上传商品记录。完成实际商品上传后，才会在这里显示记录。"}</div>:null}
   <footer className={styles.pagination}><span>第 {actualPage} / {pages} 页 · 每页最多 15 条</span><div><button type="button" disabled={actualPage<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>上一页</button><button type="button" disabled={actualPage>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>下一页</button></div></footer>
  </section>
  <p className={styles.disclaimer}>规则：第三方平台确认接收商品后，即将本次优化内容保存到「我的数据 → 数据集」，初始状态为「待审核 / 未上架」；后续审核与上架状态独立同步。平台未接收、草稿未提交成功、提交失败或取消均不创建优化版本。原始资料、价格和库存始终不覆盖。当前演示未连接真实平台回执，不生成虚假已接收记录。</p>
  {batchDialog?<ShowcaseBatchVersionPicker source={pickSource} batches={pickerBatches} selected={activeBatch&&activeBatch.source===pickSource?{batchId:JSON.parse(activeBatch.key)[1],versionId:activeBatch.version}:null} onSourceChange={setPickSource} onClose={()=>setBatchDialog(false)} onConfirm={v=>chooseBatch(v.batchId,v.versionId)}/>:null}
  {selected&&<div className={styles.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null);}}><section className={styles.dialog} role="dialog" aria-modal="true" aria-label="查看商品详情"><header><div><small>已上传 / 查看商品</small><h2>{selected.name}</h2></div><button type="button" ref={closeDetail} aria-label="关闭商品详情" onClick={()=>setSelected(null)}>×</button></header><dl>{[["SKU",selected.sku],["批次",selected.batch],["平台与站点",selected.platform+" · "+selected.site],["平台商品ID",selected.productId],["上传时间",selected.time],["优化版本",datasets.find(d=>d.id===selected.datasetId)?.name||selected.datasetId],["平台受理回执",selected.receiptId],["审核状态",selected.reviewStatus],["上架状态",selected.listingStatus]].map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><p>原提交版本与受理回执只读。此处仅展示已验证的平台接收记录；审核、上架以单独的平台状态回执为准。</p><footer><button type="button" onClick={()=>setSelected(null)}>返回商品列表</button></footer></section></div>}
 </div>;
}
