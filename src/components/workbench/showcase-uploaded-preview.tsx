"use client";
import type {ReactNode} from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./showcase-uploaded-preview.module.css";
import {ShowcaseListingStageHeader} from "./listing/showcase-listing-stage-header";
import {showcaseUploadBatchPreferenceKey,showcaseUploadTasksEvent,simulateApprovedKindleListing} from "./listing/showcase-upload-tasks";
import {readReusableOptimizedDatasets,optimizedDatasetsChanged} from "./showcase-optimized-datasets";
import {ShowcaseBatchVersionPicker,type PickBatch,type PickSource} from "./listing/showcase-batch-version-picker";
import {parseListingPhoto,listingPhotoAtlasUrl} from "./listing/showcase-listing-ai-images";

type Item={sku:string;name:string;batch:string;batchKey:string;batchVersion:string;site:string;platform:string;time:string;productId:string;reviewStatus:string;listingStatus:string;datasetId:string;receiptId:string;demo?:boolean;storeName?:string;storeType?:string;image?:string;acceptanceStatus:string};
const displayTime=(input:string)=>{
 const timestamp=Date.parse(input);
 if(!Number.isFinite(timestamp))return input.replace("T"," ");
 return new Date(timestamp).toLocaleString("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false});
};
function ProductThumb({src,name}:{src?:string;name:string}){
 if(!src)return <div className={styles.productThumbPlaceholder} aria-label="暂无商品图片">暂无图片</div>;
 const tile=parseListingPhoto(src);
 if(tile)return <span className={styles.productThumb} role="img" aria-label={name+"商品图"} style={{backgroundImage:`url("${listingPhotoAtlasUrl()}")`,backgroundPosition:`${tile.col*20}% ${tile.row*25}%`,backgroundSize:"600% 500%"}}/>;
 return <img className={styles.productThumb} src={src} alt={name+"商品图"} loading="lazy"/>;
}

export function ShowcaseUploadedPreview({organizationId,memberId,tabNavigation}:{organizationId:string;memberId:string;tabNavigation?:ReactNode}){
 const readPreferredBatch=()=>typeof window==="undefined"?"":sessionStorage.getItem(showcaseUploadBatchPreferenceKey(organizationId,memberId))||"";
 const [batch,setBatch]=useState(readPreferredBatch),[appliedBatch,setAppliedBatch]=useState(readPreferredBatch);
 const [batchDialog,setBatchDialog]=useState(false),[pickSource,setPickSource]=useState<PickSource>("采集批次");
 const [query,setQuery]=useState(""),[appliedQuery,setAppliedQuery]=useState("");
 const [revision,setRevision]=useState(0),[page,setPage]=useState(1),[selected,setSelected]=useState<Item|null>(null);
 useEffect(()=>{const refresh=(event:Event)=>{const d=(event as CustomEvent<{organizationId:string;memberId:string}>).detail;if(d?.organizationId===organizationId&&d.memberId===memberId)setRevision(v=>v+1)};window.addEventListener(optimizedDatasetsChanged,refresh);window.addEventListener(showcaseUploadTasksEvent,refresh);return()=>{window.removeEventListener(optimizedDatasetsChanged,refresh);window.removeEventListener(showcaseUploadTasksEvent,refresh)}},[organizationId,memberId]);
 useEffect(()=>{simulateApprovedKindleListing(organizationId,memberId,"SIM-ADMIN-01")},[organizationId,memberId]);
 const allDatasets=useMemo(()=>readReusableOptimizedDatasets(organizationId,memberId),[organizationId,memberId,revision]);
 const datasets=allDatasets.filter(d=>!d.demo);
 // Keep verified platform receipts separate from browser-only demo acceptances.
 const batches=datasets.map(d=>({key:JSON.stringify([d.sourceKind,d.sourceBatchId,d.id]),label:d.sourceBatchName+" · V"+d.version+" · "+d.platform+" "+d.site,name:d.sourceBatchName,source:d.sourceKind,version:d.id}));
 const demoBatches=allDatasets.filter(d=>d.demo).map(d=>({key:JSON.stringify([d.sourceKind,d.sourceBatchId,d.id]),label:d.sourceBatchName+" · V"+(d.version+1)+" · 演示",name:d.sourceBatchName,source:d.sourceKind,version:d.id}));
 const allBatches=[...batches,...demoBatches];
 const activeBatch=allBatches.find(option=>option.key===appliedBatch);
 const pickerBatches:PickBatch[]=allDatasets.filter(d=>d.sourceKind===pickSource).reduce<PickBatch[]>((acc,d)=>{
   let batch=acc.find(b=>b.id===d.sourceBatchId);
   if(!batch){batch={id:d.sourceBatchId,name:d.sourceBatchName,sourceName:d.sourceKind,date:d.createdAt,products:[],versions:[]};acc.push(batch)}
   for(const p of d.products)if(!batch.products.some(x=>x.id===p.sourceProductId))batch.products.push({id:p.sourceProductId,name:p.name});
   batch.versions.push({id:d.id,label:"V"+(d.version+1)+" · "+d.platform+" "+d.site+" 优化版",count:d.products.length,isOriginal:false,platform:d.platform,site:d.site,language:d.language,date:d.createdAt});
   return acc;
 },[]);
 const records:Item[]=datasets.flatMap(d=>d.products.map(p=>({
   sku:p.skuCodes.join(" / ")||p.sourceProductId,name:p.name,batch:d.sourceBatchName,batchVersion:"V"+(d.version+1)+" · 优化版本",
   batchKey:JSON.stringify([d.sourceKind,d.sourceBatchId,d.id]),site:d.site,platform:d.platform,
   time:d.acceptedAt||d.createdAt,productId:"未返回独立商品ID",reviewStatus:d.reviewStatus||"待审核",
   listingStatus:d.listingStatus||"未上架",datasetId:d.id,receiptId:d.externalReceiptId,storeName:d.storeName,image:p.images[0],acceptanceStatus:"平台已接收"
 })));
 const demoRecords:Item[]=allDatasets.filter(d=>d.demo).flatMap(d=>d.products.map(p=>({
  sku:p.sourceProductId,name:p.name,batch:d.sourceBatchName,batchVersion:"V"+(d.version+1)+" · 优化版本（演示）",
  batchKey:JSON.stringify([d.sourceKind,d.sourceBatchId,d.id]),platform:d.platform,site:d.site,time:d.acceptedAt||d.createdAt,
  productId:d.simulatedPlatformProductId||"无平台商品ID（演示）",reviewStatus:"审核通过（演示）",listingStatus:d.listingStatus||"未上架",datasetId:d.id,receiptId:d.simulatedReceiptId||"",
  demo:true,storeName:d.storeName,storeType:d.storeType,image:p.images[0],acceptanceStatus:"平台已接收（演示）"
 })));
 const allRecords=[...demoRecords,...records];
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
 const filtered=allRecords.filter(item=>
  (!activeBatch||item.batchKey===appliedBatch)&&
  (item.name+" "+item.sku+" "+item.batch+" "+item.productId+" "+(item.storeName||"")).toLowerCase().includes(appliedQuery.toLowerCase())
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
   {[[String(allRecords.length),"平台已接收（含演示）","真实 "+records.length+" · 演示 "+demoRecords.length],[String(records.filter(x=>x.reviewStatus==="审核通过").length+demoRecords.length),"审核通过（含演示）","演示 "+demoRecords.length+" · 真实 "+records.filter(x=>x.reviewStatus==="审核通过").length],[String(allRecords.filter(x=>x.listingStatus==="已上架").length),"已上架（含演示）","真实 "+records.filter(x=>x.listingStatus==="已上架").length+" · 演示 "+demoRecords.filter(x=>x.listingStatus==="已上架").length]].map(([value,title,sub],i)=><article key={title} data-tone={i}><strong>{value}</strong><span><b>{title}</b><small>{sub}</small></span></article>)}
  </section>

  <section className={styles.panel}>
   <div className={styles.toolbar}>
    <div className={styles.filters}><label>商品批次<button type="button" aria-label="选择刊登批次" onClick={()=>{setPickSource(activeBatch?.source==="自有商品库"?"自有商品库":"采集批次");setBatchDialog(true)}}>{activeBatch?.label||"全部批次"} · 选择批次与版本</button></label></div>
    <div className={styles.search}><input aria-label="搜索已上传商品" placeholder="搜索商品名称 / SKU" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")apply()}}/><button onClick={reset} type="button">重置</button><button className={styles.primary} onClick={apply} type="button">确认</button></div>
   </div>
   {activeBatch?<div className={styles.batchContext} role="status"><strong>当前批次：{activeBatch.name}</strong><span>{activeBatch.label} · 列表 {filtered.length} 件商品（含演示）</span></div>:null}
   <div className={styles.listTitle}><h2>已上传商品</h2><span>共 {filtered.length} 条记录</span></div>
   <div className={styles.tableScroll}><div className={styles.table}>
    <div className={styles.columns}><span>商品 / SKU</span><span>所属批次 / 版本</span><span>平台 / 站点</span><span>目标店铺 / 类型</span><span>平台商品ID</span><span>上传时间</span><span>审核 / 接收 / 上架</span><span>操作</span></div>
    {visible.map(item=><div className={styles.item} key={item.datasetId+item.sku}>
      <div className={styles.productCell}><ProductThumb src={item.image} name={item.name}/><div className={styles.productText}><b title={item.name}>{item.name}</b><small title={item.sku}>{item.sku}</small></div></div>
      <div className={styles.stackCell}><b title={item.batch}>{item.batch}</b><small>{item.batchVersion}</small></div>
      <div className={styles.stackCell}><b>{item.platform}</b><small>{item.site}</small></div>
      <div className={styles.stackCell}><b title={item.storeName||"—"}>{item.storeName||"未提供"}</b><small>{item.storeType||"店铺类型未提供"}</small></div>
      <div className={styles.stackCell}><span title={item.productId}>{item.productId}</span></div>
      <span className={styles.dateCell}>{displayTime(item.time)}</span>
      <div className={styles.statusCell}><span className={styles.statusSuccess}>{item.reviewStatus}</span><span className={styles.statusInfo}>{item.acceptanceStatus}</span><span className={styles.statusMuted}>{item.demo?item.listingStatus+"（演示）":item.listingStatus}</span></div>
      <button type="button" onClick={()=>setSelected(item)}>查看商品</button>
    </div>)}
   </div></div>
   {!filtered.length?<div className={styles.empty}>{activeBatch?"当前批次暂无已上传商品记录。":"暂无已上传商品记录。完成实际商品上传后，才会在这里显示记录。"}</div>:null}
   <footer className={styles.pagination}><span>第 {actualPage} / {pages} 页 · 每页最多 15 条</span><div><button type="button" disabled={actualPage<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>上一页</button><button type="button" disabled={actualPage>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>下一页</button></div></footer>
  </section>
  <p className={styles.disclaimer}>规则：第三方平台确认接收商品后，即将本次优化内容保存到「我的数据 → 数据集」，初始状态为「待审核 / 未上架」；后续审核与上架状态独立同步。平台未接收、草稿未提交成功、提交失败或取消均不创建优化版本。原始资料、价格和库存始终不覆盖。模拟接收仅在当前浏览器演示，明确标注（演示），会生成独立演示优化版本，但不会创建实际平台回执或平台商品 ID，模拟商品 ID 和上架状态仅供演示，与真实上架分开统计。</p>
  {batchDialog?<ShowcaseBatchVersionPicker source={pickSource} batches={pickerBatches} selected={activeBatch&&activeBatch.source===pickSource?{batchId:JSON.parse(activeBatch.key)[1],versionId:activeBatch.version}:null} onSourceChange={setPickSource} onClose={()=>setBatchDialog(false)} onConfirm={v=>chooseBatch(v.batchId,v.versionId)}/>:null}
  {selected&&<div className={styles.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null);}}><section className={styles.dialog} role="dialog" aria-modal="true" aria-label="查看商品详情"><header><div><small>已上传 / 查看商品</small><h2>{selected.name}</h2></div><button type="button" ref={closeDetail} aria-label="关闭商品详情" onClick={()=>setSelected(null)}>×</button></header><div className={styles.dialogProduct}><ProductThumb src={selected.image} name={selected.name}/><div><strong>{selected.name}</strong><small>{selected.sku}</small></div></div><dl>{[["SKU",selected.sku],["所属批次",selected.batch],["商品版本",selected.batchVersion],["目标平台 / 站点",selected.platform+" · "+selected.site],["目标店铺",selected.storeName||"—"],["店铺类型",selected.storeType||"未提供"],["平台商品ID",selected.productId],["上传时间",displayTime(selected.time)],["优化数据版本",allDatasets.find(d=>d.id===selected.datasetId)?.name||selected.datasetId],["平台受理回执",selected.demo?(selected.receiptId||"无")+"（本地演示）":selected.receiptId],["审核状态",selected.reviewStatus],["接收状态",selected.acceptanceStatus],["上架状态",selected.demo?selected.listingStatus+"（演示）":selected.listingStatus]].map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><p>{selected.demo?"这是演示平台接收状态，仅供流程演示；SHEIN 未实际接收商品，未返回任何真实回执或商品 ID。":"原提交版本与受理回执只读；审核、上架以单独的平台状态回执为准。"}</p><footer><button type="button" onClick={()=>setSelected(null)}>返回商品列表</button></footer></section></div>}
 </div>;
}
