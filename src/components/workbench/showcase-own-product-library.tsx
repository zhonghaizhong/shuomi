"use client";
import {Fragment,useEffect,useMemo,useState,type MouseEvent} from "react";
import {readOwnProductBatches,readOwnProducts,ownProductUpdated,type OwnProductRecord} from "./showcase-own-product-data";
import {readOptimizedDatasets,optimizedDatasetsChanged} from "./showcase-optimized-datasets";
import {readArchivedOptimizedVersions,setOptimizedVersionArchived,downloadOptimizedVersionCsv} from "./showcase-dataset-version-actions";
import css from "./showcase-own-product-library.module.css";
import {ShowcaseBatchProductsDialog,type BatchProductView} from "./showcase-batch-products-dialog";

const archiveKey=(org:string,member:string)=>"shuomi:own-library-archived-batches-v1:"+org+":"+member;
const readArchived=(org:string,member:string):string[]=>{
 if(typeof window==="undefined")return [];
 try{const value:unknown=JSON.parse(sessionStorage.getItem(archiveKey(org,member))||"[]");return Array.isArray(value)?value.filter((v):v is string=>typeof v==="string"):[]}catch{return []}
};
const cell=(value:unknown)=>'"'+String(value??"").replace(/"/g,'""')+'"';
const downloadBatch=(name:string,records:OwnProductRecord[])=>{
 const heading=["批次名称","商品名称","SKU","SKU 名称","价格","库存","检测状态","提交时间","描述","图片地址"];
 const lines=records.flatMap(record=>record.skus.map(sku=>[name,record.name,sku.skuCode??sku.id,sku.name,sku.price??"",sku.stock??"",record.status,record.createdAt,sku.description,sku.images.join(" / ")]));
 const csv="\uFEFF"+[heading,...lines].map(row=>row.map(cell).join(",")).join("\r\n");
 const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
 const link=document.createElement("a");link.href=url;link.download="自有商品批次-"+name.replace(/[\\/:*?"<>|]/g,"_")+".csv";document.body.appendChild(link);link.click();link.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),1000);
};

export function ShowcaseOwnProductLibrary({organizationId,memberId}:{organizationId:string;memberId:string}){
 const [revision,setRevision]=useState(0),[versionRevision,setVersionRevision]=useState(0);
 const [query,setQuery]=useState(""),[search,setSearch]=useState(""),[status,setStatus]=useState("全部状态"),[appliedStatus,setAppliedStatus]=useState("全部状态");
 const [archivedIds,setArchivedIds]=useState<string[]>(()=>readArchived(organizationId,memberId));
 const [archivedOnly,setArchivedOnly]=useState(false),[expanded,setExpanded]=useState<string[]>([]);
 const [menu,setMenu]=useState<string|null>(null),[menuPosition,setMenuPosition]=useState({top:0,left:0});
 const [selectedBatch,setSelectedBatch]=useState<string|null>(null);
 const [versionDetailId,setVersionDetailId]=useState<string|null>(null);
 const [page,setPage]=useState(1),[checked,setChecked]=useState<string[]>([]),[managing,setManaging]=useState(false);
 const [manageError,setManageError]=useState("");
 const [manageQuery,setManageQuery]=useState(""),[manageApplied,setManageApplied]=useState(""),[manageStatus,setManageStatus]=useState("全部状态"),[managePage,setManagePage]=useState(1);
 useEffect(()=>{
  const refresh=(e:Event)=>{const d=(e as CustomEvent<{organizationId:string;memberId:string}>).detail;if(d?.organizationId===organizationId&&d.memberId===memberId)setRevision(v=>v+1)};
  const refreshVersions=(e:Event)=>{const d=(e as CustomEvent<{organizationId:string;memberId:string}>).detail;if(d?.organizationId===organizationId&&d.memberId===memberId)setVersionRevision(v=>v+1)};
  window.addEventListener(ownProductUpdated,refresh);window.addEventListener(optimizedDatasetsChanged,refreshVersions);
  setArchivedIds(readArchived(organizationId,memberId));setPage(1);setChecked([]);setSelectedBatch(null);
  return()=>{window.removeEventListener(ownProductUpdated,refresh);window.removeEventListener(optimizedDatasetsChanged,refreshVersions)};
 },[organizationId,memberId]);
 useEffect(()=>{
  if(!menu)return;
  const close=()=>setMenu(null);
  const dismiss=(event:PointerEvent)=>{if(!(event.target as Element)?.closest?.("[data-own-batch-menu]"))close()};
  document.addEventListener("pointerdown",dismiss);window.addEventListener("resize",close);window.addEventListener("scroll",close,true);
  return()=>{document.removeEventListener("pointerdown",dismiss);window.removeEventListener("resize",close);window.removeEventListener("scroll",close,true)};
 },[menu]);
 const batches=useMemo(()=>readOwnProductBatches(organizationId,memberId),[organizationId,memberId,revision]);
 const allProducts=useMemo(()=>readOwnProducts(organizationId,memberId),[organizationId,memberId,revision]);
 const versions=useMemo(()=>readOptimizedDatasets(organizationId,memberId),[organizationId,memberId,versionRevision]);
 const archivedVersions=useMemo(()=>new Set(readArchivedOptimizedVersions(organizationId,memberId)),[organizationId,memberId,versionRevision]);
 const archived=new Set(archivedIds);
 const counts=(id:string)=>{const rows=allProducts.filter(p=>p.batchId===id);return {ready:rows.filter(p=>p.status==="已入库").length,pending:rows.filter(p=>p.status==="入库待完善").length,review:rows.filter(p=>p.status==="待审核").length,total:rows.length}};
 const visible=useMemo(()=>batches.filter(b=>{
  if(archived.has(b.id)!==archivedOnly)return false;
  const records=allProducts.filter(p=>p.batchId===b.id);
  const text=(b.name+" "+b.id+" "+records.map(p=>p.name+" "+p.skus.map(s=>s.skuCode+" "+s.name).join(" ")).join(" ")).toLowerCase();
  return text.includes(search.toLowerCase())&&(appliedStatus==="全部状态"||records.some(p=>p.status===appliedStatus));
 }),[batches,allProducts,archivedIds,archivedOnly,search,appliedStatus]);
 const pageCount=Math.max(1,Math.ceil(visible.length/10)),currentPage=Math.min(page,pageCount),rows=visible.slice((currentPage-1)*10,currentPage*10);
 const checkedAll=rows.length>0&&rows.every(b=>checked.includes(b.id));
 const apply=()=>{setSearch(query.trim());setAppliedStatus(status);setPage(1);setMenu(null)};
 const reset=()=>{setQuery("");setSearch("");setStatus("全部状态");setAppliedStatus("全部状态");setPage(1);setMenu(null)};
 const toggleExpanded=(id:string)=>setExpanded(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);
 const archiveBatches=(ids:string[],archive:boolean)=>{
  try{
   const next=new Set(archivedIds);for(const id of ids){if(archive)next.add(id);else next.delete(id)}
   const value=[...next];sessionStorage.setItem(archiveKey(organizationId,memberId),JSON.stringify(value));
   setArchivedIds(value);setChecked([]);setMenu(null);setPage(1);setSelectedBatch(null);setManageError("");
  }catch{setManageError("批次归档状态保存失败，请重试")}
 };
 const toggleMenu=(event:MouseEvent<HTMLButtonElement>,id:string)=>{
  if(menu===id){setMenu(null);return}
  const box=event.currentTarget.getBoundingClientRect(),height=archivedOnly?164:135;
  setMenuPosition({top:box.bottom+height+8<window.innerHeight?box.bottom+6:Math.max(8,box.top-height-6),left:Math.max(8,Math.min(window.innerWidth-200,box.right-185))});setMenu(id);
 };
 const selectedVersion=versions.find(d=>d.id===versionDetailId);
 const viewBatches=useMemo<BatchProductView[]>(()=>batches.map(b=>({
  id:b.id,organizationId,ownerMemberId:memberId,source:"自有商品",method:"自有商品刊登工具",name:b.name,createdAt:b.createdAt,status:"已采集 · 待上传" as const,demo:true,
  products:allProducts.filter(p=>p.batchId===b.id).map(p=>({
   id:p.id,name:p.name,sku:p.skus.map(x=>x.skuCode||String(x.id)).join(" / ")||p.id,
   source:p.source,price:p.skus.find(x=>x.price)?.price||"—",status:p.status,
   images:p.skus.flatMap(x=>x.images),variantCount:p.skus.length,
   variants:p.skus.map(x=>x.name),originalTitle:p.name,
   description:p.skus.map(x=>x.description).filter(Boolean).join("\n"),demoSourceLink:p.source
  }))
 })),[batches,allProducts,organizationId,memberId]);
 const currentViewBatch=viewBatches.find(b=>b.id===selectedBatch);
 return <section className={css.library} aria-label="自有商品库">
  <section className={css.filterBar} data-shuomi-filter="balanced" aria-label="自有商品筛选">
   <div data-shuomi-filter-left className={css.searchBox}><span aria-hidden="true">⌕</span><input aria-label="搜索自有商品批次" placeholder="搜索批次名称 / 商品关键词 / SKU" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")apply()}}/></div>
   <div data-shuomi-filter-right className={css.filterActions}><select aria-label="自有商品状态" value={status} onChange={e=>setStatus(e.target.value)}><option>全部状态</option><option>已入库</option><option>入库待完善</option><option>待审核</option></select><button type="button" onClick={reset}>重置</button><button type="button" className={css.primary} onClick={apply}>确认</button></div>
  </section>
  <section className={css.batchSection} aria-label="自有商品批次列表">
   <header className={css.batchHeading}><div><h2>自有商品批次</h2><span>共 {archivedOnly?batches.filter(b=>archived.has(b.id)).length:batches.filter(b=>!archived.has(b.id)).length} 批</span></div><div className={css.headingActions}><button type="button" aria-pressed={archivedOnly} onClick={()=>{setArchivedOnly(v=>!v);setPage(1);setChecked([]);setMenu(null)}}>{archivedOnly?"返回批次":"已归档"}</button><button type="button" onClick={()=>setManaging(true)}>管理批次</button></div></header>
   <div className={css.tableWrap}><table className={css.batchTable}><thead><tr><th><label className={css.selectTitle}><input type="checkbox" aria-label="选择当前页所有自有商品批次" disabled={!rows.length} checked={checkedAll} onChange={e=>setChecked(old=>e.target.checked?[...new Set([...old,...rows.map(b=>b.id)])]:old.filter(id=>!rows.some(b=>b.id===id)))}/>批次名称</label></th><th>商品总数</th><th>已入库</th><th>入库待完善</th><th>待审核</th><th>创建时间</th><th>操作</th></tr></thead><tbody>
    {rows.map(b=>{
     const count=counts(b.id),open=expanded.includes(b.id);
     const later=versions.filter(v=>v.sourceKind==="自有商品库"&&v.sourceBatchId===b.id).sort((x,y)=>y.createdAt.localeCompare(x.createdAt));
     return <Fragment key={b.id}><tr className={css.batchRow}>
      <td><div className={css.batchName}><input type="checkbox" aria-label={"选择批次 "+b.name} checked={checked.includes(b.id)} onChange={e=>setChecked(old=>e.target.checked?[...old,b.id]:old.filter(x=>x!==b.id))}/><div><strong>{b.name}</strong><small>自有商品 · 原始批次</small></div><div className={css.originalVersion}><strong>V1 · 原始数据</strong><small>{b.createdAt}</small></div></div></td>
      <td><b className={css.metric}>{count.total}</b></td><td><b className={css.ready}>{count.ready}</b></td><td><b className={css.missing}>{count.pending}</b></td><td><b className={css.review}>{count.review}</b></td><td className={css.date}>{b.createdAt}</td>
      <td><div className={css.rowActions}><button type="button" className={css.expand} aria-expanded={open} aria-label={(open?"收起":"展开")+"批次版本 "+b.name} onClick={()=>toggleExpanded(b.id)}>{open?"收起":"展开"}</button><div data-own-batch-menu className={css.menuHost}><button type="button" aria-haspopup="true" aria-expanded={menu===b.id} onClick={e=>toggleMenu(e,b.id)}>更多</button>{menu===b.id?<div className={css.rowMenu} role="group" aria-label={"批次操作 "+b.name} style={menuPosition}><button type="button" onClick={()=>{setSelectedBatch(b.id);setMenu(null)}}>查看商品</button><button type="button" onClick={()=>{downloadBatch(b.name,allProducts.filter(p=>p.batchId===b.id&&p.status==="已入库"));setMenu(null)}}>下载文档（CSV）</button><button type="button" onClick={()=>archiveBatches([b.id],!archivedOnly)}>{archivedOnly?"恢复批次":"归档批次"}</button></div>:null}</div></div></td>
     </tr>
     {open?<tr className={css.expandedRow}><td colSpan={7}><section className={css.versionExpanded} aria-label={"数据版本 "+b.name}><div className={css.versionExpandedHeader}><strong>后续优化版本</strong><span>共 {later.length} 个优化版本 · V1 原始数据已显示在上方批次行</span></div><div className={css.versionItems}>{later.length===0?<p className={css.noNextVersion}>当前只有 V1 原始数据，暂无后续优化版本。优化结果保存后会在这里显示，可查看、下载或归档。</p>:later.map(d=><div className={css.versionItem} key={d.id} data-version-archived={archivedVersions.has(d.id)}><div className={css.versionInfo}><strong>V{d.version+1} · {d.platform} {d.site}优化版</strong><small>{d.language} · {d.createdAt} · {d.products.length} 件商品</small></div><span className={css.versionTag}>{archivedVersions.has(d.id)?"已归档":d.listingStatus??"已保存"}</span><div className={css.versionActions}><button type="button" onClick={()=>setVersionDetailId(d.id)}>查看商品</button><button type="button" onClick={()=>downloadOptimizedVersionCsv(d)}>下载 CSV</button><button type="button" onClick={()=>setOptimizedVersionArchived(organizationId,memberId,d.id,!archivedVersions.has(d.id))}>{archivedVersions.has(d.id)?"恢复":"归档"}</button></div></div>)}</div></section></td></tr>:null}
     </Fragment>;
    })}
   </tbody></table>{rows.length===0?<p role="status" className={css.empty}>{archivedOnly?"暂无符合条件的已归档批次":batches.length?"没有符合筛选条件的批次":"暂无自有商品批次。请先在「我的工具 → 自有商品刊登工具」创建批次。"}</p>:null}</div>
   {checked.length?<div className={css.bulkBar}><span>已选择 {checked.length} 批</span><button type="button" onClick={()=>archiveBatches(checked,!archivedOnly)}>{archivedOnly?"批量恢复":"批量归档"}</button><button type="button" onClick={()=>setChecked([])}>取消选择</button></div>:null}
   <footer className={css.pagination}><span>显示 {rows.length} / {visible.length} 批 · 第 {currentPage} / {pageCount} 页</span><div><button type="button" disabled={currentPage===1} onClick={()=>setPage(v=>v-1)}>上一页</button><button type="button" disabled={currentPage===pageCount} onClick={()=>setPage(v=>v+1)}>下一页</button></div></footer>
  </section>
  {manageError?<p role="alert" className={css.error}>{manageError}</p>:null}
  {managing?<div className={css.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setManaging(false)}}><section className={css.manageDialog} role="dialog" aria-modal="true" aria-label="管理自有商品批次" onKeyDown={e=>{if(e.key==="Escape")setManaging(false)}}>
   <header className={css.manageHeader}><div><h2>批次管理</h2><p>统一管理自有商品批次，支持筛选、归档与恢复；不会删除商品及历史版本。</p></div><div className={css.manageHeaderActions}><button type="button" onClick={()=>setManaging(false)}>关闭</button></div></header>
   <form className={css.manageFilters} onSubmit={e=>{e.preventDefault();setManageApplied(manageQuery.trim());setManagePage(1)}}>
    <label className={css.manageSearch}><span aria-hidden="true">⌕</span><input aria-label="搜索自有商品批次名称" placeholder="搜索批次名称" value={manageQuery} onChange={e=>setManageQuery(e.target.value)}/></label>
    <select aria-label="管理自有商品批次状态" value={manageStatus} onChange={e=>{setManageStatus(e.target.value);setManagePage(1)}}><option>全部状态</option><option>正常</option><option>已归档</option></select>
    <button type="button" onClick={()=>{setManageQuery("");setManageApplied("");setManageStatus("全部状态");setManagePage(1)}}>重置</button><button type="submit" className={css.managePrimary}>确认</button>
   </form>
   {manageError?<p className={css.error} role="alert">{manageError}</p>:null}
   {(()=>{const filtered=batches.filter(b=>(!manageApplied||b.name.toLowerCase().includes(manageApplied.toLowerCase()))&&(manageStatus==="全部状态"||(manageStatus==="已归档"?archived.has(b.id):!archived.has(b.id))));const totalPages=Math.max(1,Math.ceil(filtered.length/10)),current=Math.min(managePage,totalPages);
   return <><div className={css.manageTableScroll}><table className={css.manageTable}><thead><tr><th>批次名称</th><th>产品来源</th><th>总量</th><th>待完善</th><th>待审核</th><th>创建时间</th><th>批次状态</th><th>操作</th></tr></thead><tbody>{filtered.slice((current-1)*10,current*10).map(b=>{const count=counts(b.id);return <tr key={b.id}><td className={css.manageNameCell}><strong title={b.name}>{b.name}</strong></td><td><span className={css.managePill}>自有商品</span></td><td><span className={css.manageMetric}>{count.total}</span></td><td><span className={css.manageMetric}>{count.pending}</span></td><td><span className={css.manageMetric}>{count.review}</span></td><td>{b.createdAt}</td><td><span className={archived.has(b.id)?css.manageArchived:css.manageActive}>{archived.has(b.id)?"已归档":"正常"}</span></td><td><div className={css.manageActions}><button type="button" onClick={()=>archiveBatches([b.id],!archived.has(b.id))}>{archived.has(b.id)?"恢复":"归档"}</button></div></td></tr>})}</tbody></table>{filtered.length===0?<p className={css.empty}>暂无符合条件的批次</p>:null}</div><footer className={css.manageFooter}><span>共 {filtered.length} 批 · 第 {current} / {totalPages} 页</span><div><button type="button" disabled={current===1} onClick={()=>setManagePage(v=>Math.max(1,v-1))}>上一页</button><button type="button" disabled={current===totalPages} onClick={()=>setManagePage(v=>v+1)}>下一页</button></div></footer></>})()}
  </section></div>:null}
  {currentViewBatch?<ShowcaseBatchProductsDialog key={currentViewBatch.id} ownProductMode batch={currentViewBatch} organizationId={organizationId} memberId={memberId} otherBatches={viewBatches.filter(b=>b.id!==currentViewBatch.id)} onClose={()=>setSelectedBatch(null)} onDownload={products=>downloadBatch(currentViewBatch.name,allProducts.filter(p=>p.batchId===currentViewBatch.id&&products.some(v=>v.id===p.id)))}/>:null}
  {selectedVersion?<div className={css.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setVersionDetailId(null)}}><section className={css.modal} role="dialog" aria-modal="true" aria-label="优化版本商品详情" onKeyDown={e=>{if(e.key==="Escape")setVersionDetailId(null)}}><header><div><h2>{selectedVersion.name} · V{selectedVersion.version+1}</h2><p>{selectedVersion.sourceBatchName} · {selectedVersion.platform} / {selectedVersion.site} / {selectedVersion.language}</p></div><button type="button" onClick={()=>setVersionDetailId(null)}>关闭</button></header><p className={css.note}>保存的优化版本仅供查看和下载，不覆盖 V1 商品资料。</p><div className={css.innerScroll}><table className={css.productTable}><thead><tr><th>商品名称</th><th>原商品编号</th><th>SKU</th><th>图片</th><th>描述</th></tr></thead><tbody>{selectedVersion.products.map((p,i)=><tr key={p.sourceProductId+"-"+i}><td>{p.name}</td><td>{p.sourceProductId}</td><td>{p.skuCodes.join(" / ")||"—"}</td><td>{p.images.map((src,j)=><a key={src+j} href={src} target="_blank" rel="noopener noreferrer">图片 {j+1} </a>)}</td><td>{p.description||"—"}</td></tr>)}</tbody></table></div><footer className={css.dialogActions}><button type="button" onClick={()=>downloadOptimizedVersionCsv(selectedVersion)}>下载 CSV</button><button type="button" onClick={()=>setVersionDetailId(null)}>关闭</button></footer></section></div>:null}

 </section>;
}
