"use client";
import {Fragment,useEffect,useMemo,useState} from "react";
import {readDemoCollectionBatches,createDemoCollectionBatch,renameDemoCollectionBatch,deleteDemoCollectionBatch,type DemoCollectionBatch} from "./showcase-collection-batches";
import css from "./showcase-my-data-batches.module.css";
import {ShowcaseBatchProductsDialog} from "./showcase-batch-products-dialog";
import {ShowcaseOwnProductLibrary} from "./showcase-own-product-library";
import {ShowcaseOptimizedDatasetLibrary} from "./showcase-optimized-dataset-library";
import {optimizedDatasetsChanged,readReusableOptimizedDatasets,type OptimizedDataset} from "./showcase-optimized-datasets";
import {downloadOptimizedVersionCsv,readArchivedOptimizedVersions,setOptimizedVersionArchived} from "./showcase-dataset-version-actions";
const csvCell=(value:string|number)=>'"'+String(value).replace(/"/g,'""')+'"';
const downloadBatch=(batch:DemoCollectionBatch)=>{
 const columns=["批次名称","产品来源","采集时间","商品编号","商品名称","SKU","价格","规格","来源说明"];
 const data=batch.products.map(p=>[batch.name,batch.source,batch.createdAt,p.id,p.name,p.sku,p.price,(p.variants||[]).join(" / "),p.source].map(csvCell).join(","));
 const csv="\uFEFF"+[columns.map(csvCell).join(","),...data].join("\r\n");
 const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8;"}));
 const link=document.createElement("a");link.href=url;link.download="采集批次-"+batch.id.replace(/[^a-zA-Z0-9_-]/g,"")+".csv";document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
};
const archiveKey=(org:string,member:string)=>"shuomi:my-data-archived-v1:"+org+":"+member;
const readArchived=(org:string,member:string):string[]=>{try{const v:unknown=JSON.parse(sessionStorage.getItem(archiveKey(org,member))||"[]");return Array.isArray(v)?v.filter((x):x is string=>typeof x==="string"):[]}catch{return []}};
export function ShowcaseMyDataBatches({organizationId,memberId}:{organizationId:string;memberId:string}){
 const [tab,setTab]=useState("采集批次"),[query,setQuery]=useState(""),[search,setSearch]=useState("");
 const [source,setSource]=useState("全部来源"),[status,setStatus]=useState("全部状态");
 const [appliedSource,setAppliedSource]=useState("全部来源"),[appliedStatus,setAppliedStatus]=useState("全部状态");
 const [archivedIds,setArchivedIds]=useState<string[]>(()=>typeof window==="undefined"?[]:readArchived(organizationId,memberId));
 const [archivedOnly,setArchivedOnly]=useState(false),[selected,setSelected]=useState<string|null>(null),[menu,setMenu]=useState<string|null>(null),[manage,setManage]=useState(false);
 const [menuPosition,setMenuPosition]=useState({top:0,left:0});
 const [chosen,setChosen]=useState<string[]>([]),[page,setPage]=useState(1),[deleteTarget,setDeleteTarget]=useState<string|null>(null);
 const [expanded,setExpanded]=useState<string[]>([]),[versionRevision,setVersionRevision]=useState(0),[versionDetailId,setVersionDetailId]=useState<string|null>(null);
 useEffect(()=>{const changed=(event:Event)=>{const detail=(event as CustomEvent<{organizationId:string;memberId:string}>).detail;if(detail?.organizationId===organizationId&&detail.memberId===memberId)setVersionRevision(v=>v+1)};window.addEventListener(optimizedDatasetsChanged,changed);return()=>window.removeEventListener(optimizedDatasetsChanged,changed)},[organizationId,memberId]);
 const versions=useMemo(()=>readReusableOptimizedDatasets(organizationId,memberId),[organizationId,memberId,versionRevision]);
 const archivedVersions=useMemo(()=>new Set(readArchivedOptimizedVersions(organizationId,memberId)),[organizationId,memberId,versionRevision]);
 const versionDetail=versions.find(d=>d.id===versionDetailId);
 const handleVersionArchive=(versionId:string,archive:boolean)=>{setOptimizedVersionArchived(organizationId,memberId,versionId,archive)};
 const toggleExpanded=(id:string)=>setExpanded(ids=>ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);
 const [manageQuery,setManageQuery]=useState(""),[manageSource,setManageSource]=useState("全部来源"),[manageStatus,setManageStatus]=useState("全部状态");
 const [manageApplied,setManageApplied]=useState({query:"",source:"全部来源",status:"全部状态"}),[managePage,setManagePage]=useState(1);
 const [createOpen,setCreateOpen]=useState(false),[newBatchName,setNewBatchName]=useState(""),[renaming,setRenaming]=useState<string|null>(null),[renameName,setRenameName]=useState(""),[manageError,setManageError]=useState("");
 const [batches,setBatches]=useState<DemoCollectionBatch[]>(()=>readDemoCollectionBatches(organizationId,memberId));
 useEffect(()=>{const refresh=()=>{setBatches(readDemoCollectionBatches(organizationId,memberId));setArchivedIds(readArchived(organizationId,memberId));setSelected(null);setChosen([]);setMenu(null)};refresh();const onChange=(e:Event)=>{const detail=(e as CustomEvent<{organizationId:string}>).detail;if(detail?.organizationId===organizationId)refresh()};window.addEventListener("shuomi:demo-batches-updated",onChange);return()=>window.removeEventListener("shuomi:demo-batches-updated",onChange)},[organizationId,memberId]);
 useEffect(()=>{
  if(!menu)return;
  const close=()=>setMenu(null);
  const dismiss=(event:PointerEvent)=>{
   if(!(event.target as Element)?.closest?.('[data-batch-menu]'))close();
  };
  window.addEventListener("resize",close);
  document.addEventListener("pointerdown",dismiss);
  return()=>{
   window.removeEventListener("resize",close);
   document.removeEventListener("pointerdown",dismiss);
  };
 },[menu]);
 const toggleRowMenu=(event:React.MouseEvent<HTMLButtonElement>,id:string)=>{
  if(menu===id){setMenu(null);return;}
  const rect=event.currentTarget.getBoundingClientRect();
  const estimatedHeight=archivedOnly?170:138;
  const top=rect.bottom+6+estimatedHeight<=window.innerHeight-10
   ?rect.bottom+6:Math.max(10,rect.top-estimatedHeight-6);
  setMenuPosition({top,left:Math.max(10,Math.min(window.innerWidth-198,rect.right-188))});
  setMenu(id);
 };
 const archived=new Set(archivedIds);
 const visible=useMemo(()=>batches.filter(b=>archived.has(b.id)===archivedOnly&&(appliedSource==="全部来源"||b.source===appliedSource)&&(appliedStatus==="全部状态"||(appliedStatus==="未上传"?b.status.includes("待上传"):b.status.includes("已上传")))&&(b.name+" "+b.id+" "+b.source+" "+b.products.map(p=>p.name).join(" ")).toLowerCase().includes(search.toLowerCase())),[batches,archivedIds,archivedOnly,appliedSource,appliedStatus,search]);
 const archivedCount=batches.filter(b=>archived.has(b.id)).length;
 const managedRows=batches.filter(b=>(manageApplied.source==="全部来源"||b.source===manageApplied.source)&&(manageApplied.status==="全部状态"||(manageApplied.status==="已归档"?archived.has(b.id):manageApplied.status==="未上传"?!archived.has(b.id)&&!b.status.includes("已上传"):!archived.has(b.id)&&b.status.includes("已上传")))&&b.name.toLowerCase().includes(manageApplied.query.toLowerCase()));
 const managePageCount=Math.max(1,Math.ceil(managedRows.length/6)),managedPage=Math.min(managePage,managePageCount),managedPagedRows=managedRows.slice((managedPage-1)*6,managedPage*6);
 const pageCount=Math.max(1,Math.ceil(visible.length/10)),currentPage=Math.min(page,pageCount),rows=visible.slice((currentPage-1)*10,currentPage*10);
 const picked=batches.find(b=>b.id===selected&&archived.has(b.id)===archivedOnly);
 const checkAll=rows.length>0&&rows.every(b=>chosen.includes(b.id));
 const apply=()=>{setSearch(query.trim());setAppliedSource(source);setAppliedStatus(status);setPage(1);setMenu(null)};
 const reset=()=>{setQuery("");setSearch("");setSource("全部来源");setAppliedSource("全部来源");setStatus("全部状态");setAppliedStatus("全部状态");setPage(1);setMenu(null)};
 const confirmDelete=()=>{const target=batches.find(b=>b.id===deleteTarget&&archived.has(b.id));if(!target)return; if(deleteDemoCollectionBatch(organizationId,memberId,target.id)){const next=archivedIds.filter(x=>x!==target.id);setArchivedIds(next);sessionStorage.setItem(archiveKey(organizationId,memberId),JSON.stringify(next));setDeleteTarget(null);setPage(1);setManagePage(1);setManageError("");}else{setManageError("删除失败，请重试");setDeleteTarget(null)}};
 const toggleArchive=(ids:string[],toArchive:boolean)=>{const next=new Set(archivedIds);ids.forEach(id=>toArchive?next.add(id):next.delete(id));const values=[...next];setArchivedIds(values);setChosen([]);setSelected(null);setMenu(null);setPage(1);try{sessionStorage.setItem(archiveKey(organizationId,memberId),JSON.stringify(values))}catch{}};
 return <div className={css.wrapper} data-my-data-owner={memberId} data-my-data-organization={organizationId}>
  <section className={css.flow} aria-label="采集批次流程说明"><strong>采集数据怎么用?</strong><div className={css.flowSteps}>{[["1","原始商品数据"],["2","转入待上传"],["3","整理商品资料"],["4","上架其他平台"]].map(([n,label],i)=><span key={n}><i data-step={i}>{n}</i>{label}</span>)}</div><p><b>也可直接下载</b><small>原始数据用于分析或其他业务</small></p></section>
  <nav className={css.tabs} aria-label="我的数据分类">{["采集批次","自有商品库","数据集"].map(name=><button type="button" key={name} aria-current={tab===name?"page":undefined} onClick={()=>{setTab(name);setPage(1);setSelected(null);setMenu(null)}}>{name}</button>)}</nav>
  {tab==="采集批次"?<>
  <section className={css.filterBar} data-shuomi-filter="balanced" aria-label="数据筛选"><div data-shuomi-filter-left><label className={css.searchBox}><span aria-hidden="true">⌕</span><input aria-label="搜索采集批次" placeholder="搜索批次名称 / 商品关键词" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")apply()}}/></label></div><div data-shuomi-filter-right><select aria-label="采集来源" value={source} onChange={e=>setSource(e.target.value)}>{["全部来源","1688","Amazon","SDS","硕米优选"].map(x=><option key={x}>{x}</option>)}</select><select aria-label="上传状态" value={status} onChange={e=>setStatus(e.target.value)}>{["全部状态","未上传","已上传"].map(x=><option key={x}>{x}</option>)}</select><button type="button" onClick={reset}>重置</button><button type="button" className={css.primary} onClick={apply}>确认</button></div></section>
  <section className={css.panel} aria-label={tab}><header className={css.heading}><div><h2>{tab==="采集批次"?"数据批次":tab}</h2><span>共 {tab==="采集批次"?(archivedOnly?archivedCount:batches.length-archivedCount):0} {tab==="采集批次"?"批":"条"}</span></div>{tab==="采集批次"?<div className={css.headingActions}><button type="button" aria-pressed={archivedOnly} onClick={()=>{setArchivedOnly(x=>!x);setPage(1);setSelected(null);setChosen([]);setMenu(null)}}>{archivedOnly?"返回批次":"已归档"}</button><button type="button" onClick={()=>setManage(true)}>管理批次</button></div>:null}</header>
  {tab==="采集批次"?<>
   <div className={css.tableScroll}><table className={css.batchTable}><thead><tr><th><label className={css.batchTitle}><input type="checkbox" aria-label="选择当前页所有批次" disabled={!rows.length} checked={checkAll} onChange={e=>setChosen(old=>e.target.checked?[...new Set([...old,...rows.map(b=>b.id)])]:old.filter(id=>!rows.some(b=>b.id===id)))}/>批次名称</label></th><th>产品来源</th><th>总量</th><th>符合</th><th>过滤</th><th>创建时间</th><th>采集时间</th><th>上传状态</th><th>操作</th></tr></thead><tbody>{rows.map(b=><Fragment key={b.id}><tr><td><div className={css.batchName}><input type="checkbox" aria-label={"选择批次 "+b.name} checked={chosen.includes(b.id)} onChange={e=>setChosen(old=>e.target.checked?[...old,b.id]:old.filter(id=>id!==b.id))}/><div><strong>{b.name}</strong><small>{b.method} · 演示批次</small></div><div className={css.originalVersionInRow}><strong>V1 · 原始数据</strong><small>{b.createdAt}</small></div></div></td><td><span className={css.sourcePill}>{b.source}</span></td><td><b className={css.metric}>{b.products.length}</b></td><td><b className={css.matchCount}>{b.products.length}</b></td><td><b className={css.filterCount}>0</b></td><td>{b.createdAt}</td><td className={css.collectionTime}>{b.method==="手动新建"?"尚未采集":b.createdAt}</td><td><span className={css.uploadStatus}><i/>{versions.some(d=>d.sourceKind==="采集批次"&&d.sourceBatchId===b.id)?"部分已接收":"未上传"}<small>{versions.some(d=>d.sourceKind==="采集批次"&&d.sourceBatchId===b.id)?"已生成优化版本":"未转入刊登"}</small></span></td><td><div className={css.batchRowActions}><button type="button" className={css.expandVersions} aria-label={(expanded.includes(b.id)?"收起":"展开")+"批次版本 "+b.name} aria-expanded={expanded.includes(b.id)} onClick={()=>toggleExpanded(b.id)}>{expanded.includes(b.id)?"收起":"展开"}</button><div className={css.menuHost} data-batch-menu><button type="button" aria-haspopup="true" aria-expanded={menu===b.id} onClick={e=>toggleRowMenu(e,b.id)}>更多</button>{menu===b.id?<div className={css.rowMenu} style={{top:menuPosition.top,left:menuPosition.left}} role="group" aria-label={"批次操作 "+b.name}><button type="button" onClick={()=>{setSelected(old=>old===b.id?null:b.id);setMenu(null)}}>查看商品</button><button type="button" onClick={()=>{downloadBatch(b);setMenu(null)}}>下载文档（CSV）</button><button type="button" onClick={()=>toggleArchive([b.id],!archivedOnly)}>{archivedOnly?"恢复批次":"归档批次"}</button>{archivedOnly?<button type="button" className={css.deleteAction} onClick={()=>{setDeleteTarget(b.id);setMenu(null)}}>删除批次</button>:null}</div>:null}</div></div></td></tr>
     {expanded.includes(b.id)?<tr className={css.versionExpandedRow}><td colSpan={9}>
      <section className={css.versionExpanded} aria-label={"数据版本 "+b.name}>
       <div className={css.versionExpandedHeader}><strong>后续优化版本</strong><span>共 {versions.filter(d=>d.sourceKind==="采集批次"&&d.sourceBatchId===b.id).length} 个优化版本 · V1 原始数据已显示在上方批次行</span></div>
       <div className={css.versionItems}>
        {!versions.some(d=>d.sourceKind==="采集批次"&&d.sourceBatchId===b.id)?<p className={css.noNextVersion}>当前只有 V1 原始数据，暂无后续优化版本。优化结果保存后会在这里显示，可查看、下载或归档。</p>:null}
        {versions.filter(d=>d.sourceKind==="采集批次"&&d.sourceBatchId===b.id).sort((a,z)=>z.createdAt.localeCompare(a.createdAt)).map(d=><div className={css.versionItem} key={d.id} data-version-archived={archivedVersions.has(d.id)}>
         <div className={css.versionInfo}><strong>V{d.version+1} · {d.platform} {d.site}优化版</strong><small>{d.language} · {d.createdAt} · {d.products.length} 件商品</small></div>
         <span className={css.versionTag}>{archivedVersions.has(d.id)?"已归档":d.demo?"平台已接收（演示） · 未上架":d.listingStatus??"已保存"}</span>
         <div className={css.versionActions}><button type="button" onClick={()=>setVersionDetailId(d.id)}>查看商品</button><button type="button" onClick={()=>downloadOptimizedVersionCsv(d)}>下载 CSV</button><button type="button" onClick={()=>handleVersionArchive(d.id,!archivedVersions.has(d.id))}>{archivedVersions.has(d.id)?"恢复":"归档"}</button></div>
        </div>)}
       </div>
      </section>
     </td></tr>:null}
    </Fragment>)}</tbody></table>{!rows.length?<p className={css.empty} role="status">{archivedOnly?"暂无已归档批次":search||appliedSource!=="全部来源"||appliedStatus!=="全部状态"?"没有符合筛选条件的批次":"暂无采集批次。请前往「我的工具 → 在线采集」创建。"}</p>:null}</div>

   {chosen.length?<div className={css.bulkBar}><span>已选择 {chosen.length} 批</span><button type="button" onClick={()=>toggleArchive(chosen,!archivedOnly)}>{archivedOnly?"批量恢复":"批量归档"}</button><button type="button" onClick={()=>setChosen([])}>取消选择</button></div>:null}
   <footer className={css.pagination}><span>显示 {rows.length} / {visible.length} 批 · 第 {currentPage} / {pageCount} 页</span><div><button type="button" disabled={currentPage===1} onClick={()=>setPage(v=>v-1)}>上一页</button><button type="button" disabled={currentPage===pageCount} onClick={()=>setPage(v=>v+1)}>下一页</button></div></footer>
  </>:<p role="status" className={css.empty}>暂无{tab}数据。采集批次不会自动写入此分类。</p>}</section>
  </>:tab==="自有商品库"?<ShowcaseOwnProductLibrary organizationId={organizationId} memberId={memberId}/>:<ShowcaseOptimizedDatasetLibrary organizationId={organizationId} memberId={memberId}/>}

  {versionDetail?<div className={css.backdrop} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setVersionDetailId(null)}}><section className={css.versionProductDialog} role="dialog" aria-modal="true" aria-label="优化版本商品详情" onKeyDown={e=>{if(e.key==="Escape")setVersionDetailId(null)}}>
    <header><div><h2>{versionDetail.name} · V{versionDetail.version+1}</h2><p>来源：{versionDetail.sourceBatchName} · {versionDetail.platform} / {versionDetail.site} / {versionDetail.language}</p></div><button type="button" onClick={()=>setVersionDetailId(null)}>关闭</button></header>
    <p className={css.versionHint}>这是当前批次的已保存优化版本。仅展示优化后的商品内容，不覆盖原始数据、价格或库存。</p>
    <div className={css.versionProductScroll}><table><thead><tr><th>商品名称</th><th>原商品编号</th><th>SKU</th><th>图片</th><th>优化描述</th></tr></thead><tbody>{versionDetail.products.map((product,i)=><tr key={product.sourceProductId+"-"+i}><td><strong>{product.name}</strong></td><td>{product.sourceProductId}</td><td>{product.skuCodes.join(" / ")||"—"}</td><td>{product.images.length?product.images.map((url,k)=><a key={url+"-"+k} href={url} target="_blank" rel="noopener noreferrer">图片 {k+1}</a>):"—"}</td><td>{product.description||"—"}</td></tr>)}</tbody></table></div>
    <footer><span>共 {versionDetail.products.length} 件商品 · 原始批次保持不变</span><button type="button" onClick={()=>downloadOptimizedVersionCsv(versionDetail)}>下载 CSV</button><button type="button" onClick={()=>setVersionDetailId(null)}>关闭</button></footer>
   </section></div>:null}
  {picked?<ShowcaseBatchProductsDialog key={picked.id} batch={picked} organizationId={organizationId} memberId={memberId} otherBatches={batches.filter(x=>x.id!==picked.id&&!archived.has(x.id))} onClose={()=>setSelected(null)}/>:null}
  {manage?<div className={css.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setManage(false)}}>
   <section className={css.manageDialog} role="dialog" aria-modal="true" aria-label="管理采集批次" onKeyDown={e=>{if(e.key==="Escape")setManage(false)}}>
    <header className={css.manageHeader}><div><h2>批次管理</h2><p>统一管理批次名称、产品来源和上传状态，支持新建、重命名与归档。</p></div>
     <div className={css.manageHeaderActions}><button type="button" className={css.primary} onClick={()=>{setCreateOpen(v=>!v);setManageError("");setRenaming(null)}}>新建批次</button><button type="button" onClick={()=>setManage(false)}>关闭</button></div>
    </header>
    {createOpen?<form className={css.manageInlineForm} onSubmit={e=>{e.preventDefault();if(createDemoCollectionBatch(organizationId,memberId,newBatchName)){setNewBatchName("");setCreateOpen(false);setManagePage(1);setManageError("")}else setManageError("新建失败，请填写名称后重试")}}>
      <label htmlFor="manage-new-name">新批次名称</label><input id="manage-new-name" maxLength={60} required placeholder="请输入批次名称" value={newBatchName} onChange={e=>setNewBatchName(e.target.value)}/><button type="submit" className={css.primary}>保存</button><button type="button" onClick={()=>setCreateOpen(false)}>取消</button>
     </form>:null}
    <form className={css.manageFilters} onSubmit={e=>{e.preventDefault();setManageApplied({query:manageQuery.trim(),source:manageSource,status:manageStatus});setManagePage(1)}}>
      <label className={css.manageSearch}><span aria-hidden="true">⌕</span><input aria-label="搜索批次名称" placeholder="搜索批次名称" value={manageQuery} onChange={e=>setManageQuery(e.target.value)}/></label>
      <select aria-label="管理批次产品来源" value={manageSource} onChange={e=>setManageSource(e.target.value)}><option>全部来源</option><option>Amazon</option><option>1688</option><option>硕米优选</option></select>
      <select aria-label="管理批次上传状态" value={manageStatus} onChange={e=>setManageStatus(e.target.value)}><option>全部状态</option><option>未上传</option><option>已上传</option><option>已归档</option></select>
      <button type="button" onClick={()=>{setManageQuery("");setManageSource("全部来源");setManageStatus("全部状态");setManageApplied({query:"",source:"全部来源",status:"全部状态"});setManagePage(1)}}>重置</button>
      <button type="submit" className={css.primary}>确认</button>
    </form>
    {manageError?<p className={css.manageError} role="alert">{manageError}</p>:null}
    <div className={css.manageTableScroll}><table className={css.manageTable}><thead><tr><th>批次名称</th><th>产品来源</th><th>总量</th><th>符合</th><th>过滤</th><th>创建时间</th><th>上传状态</th><th>操作</th></tr></thead>
     <tbody>{managedPagedRows.map(b=><tr key={b.id}>
      <td className={css.manageNameCell}>{renaming===b.id?<form className={css.manageRenameForm} onSubmit={e=>{e.preventDefault();if(renameDemoCollectionBatch(organizationId,memberId,b.id,renameName)){setRenaming(null);setManageError("")}else setManageError("重命名失败，请重试")}}><input aria-label={"重命名 "+b.name} maxLength={60} required value={renameName} onChange={e=>setRenameName(e.target.value)}/><button type="submit">保存</button><button type="button" onClick={()=>setRenaming(null)}>取消</button></form>:<strong title={b.name}>{b.name}</strong>}</td>
      <td><span className={css.manageSourcePill}>{b.source}</span></td>
      <td><span className={css.manageMetric}>{b.products.length.toLocaleString()}</span></td>
      <td><span className={css.manageMatch}>{b.products.length.toLocaleString()}</span></td>
      <td><span className={css.manageFiltered}>0</span></td>
      <td className={css.manageDate}>{b.createdAt}</td>
      <td><div className={css.manageStatusCell}><span className={b.status.includes("已上传")?css.isUploaded:css.isPending}><i/>{archived.has(b.id)?"已归档":b.status.includes("已上传")?"已上传":"未上传"}</span>{b.status.includes("已上传")&&!archived.has(b.id)?<small>SHEIN · 美国站</small>:null}</div></td>
      <td><div className={css.manageActions}><button type="button" disabled={renaming===b.id} onClick={()=>{setRenaming(b.id);setRenameName(b.name);setCreateOpen(false);setManageError("")}}>重命名</button><button type="button" className={css.archiveAction} onClick={()=>{toggleArchive([b.id],!archived.has(b.id));setManagePage(1)}}>{archived.has(b.id)?"恢复":"归档"}</button>{archived.has(b.id)?<button type="button" className={css.deleteAction} onClick={()=>{setDeleteTarget(b.id);setManageError("")}}>删除</button>:null}</div></td>
     </tr>)}</tbody></table>
     {!managedRows.length?<p className={css.empty} role="status">暂无符合条件的批次</p>:null}
    </div>
    <footer className={css.manageFooter}><span>共 {managedRows.length} 批 · 第 {managedPage} / {managePageCount} 页</span><div><button type="button" disabled={managedPage===1} onClick={()=>setManagePage(v=>v-1)}>上一页</button><button type="button" disabled={managedPage===managePageCount} onClick={()=>setManagePage(v=>v+1)}>下一页</button></div></footer>
   </section>
  </div>:null}
  {deleteTarget?<div className={css.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setDeleteTarget(null)}}><section className={css.deleteConfirm} role="alertdialog" aria-modal="true" aria-label="确认删除采集批次" aria-describedby="delete-batch-hint"><h2>确认删除批次？</h2><p id="delete-batch-hint">将永久删除当前演示会话中的「{batches.find(b=>b.id===deleteTarget)?.name}」及其采集商品记录，删除后无法恢复。</p><div><button type="button" onClick={()=>setDeleteTarget(null)}>取消</button><button type="button" className={css.deleteConfirmButton} onClick={confirmDelete}>确认删除</button></div></section></div>:null}
 </div>;
}
