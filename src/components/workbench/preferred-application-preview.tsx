"use client";
import {useEffect,useMemo,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {BadgeCheck,ClipboardList,Database,Info,PackageCheck,Search,Star,Workflow,CheckCircle2} from "lucide-react";
import {
 emptyPreferredSupply,preferredApplicationChanged,ownProductUpdated,optimizedDatasetsChanged,
 readPreferredCandidates,readPreferredApplications,submitPreferredDemoApplication,simulatePreferredReview,completePreferredSecondaryOptimizationDemo,
 type PreferredApplicationRecord,type PreferredSupply,type PreferredCandidate
} from "./preferred-application-store";
import styles from "./preferred-application-preview.module.css";

type View="products"|"records";
const formatDate=(value:string)=>{try{return new Date(value).toLocaleString("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})}catch{return value}};
const displayStatus=(status:PreferredCandidate["status"])=>status==="已入选"?"已入选优选":status;
function Status({value}:{value:string}){return <span className={styles.status} data-status={value}>{value}</span>;}
function ProductImage({src,name}:{src:string;name:string}){
 return src?<img className={styles.productImage} src={src} alt={name}/>:<div className={styles.productPlaceholder} aria-label="暂无商品图片"><PackageCheck size={23}/></div>;
}
export function PreferredApplicationPreview({pathname,organizationId="SM-ENT-000001",memberId="admin"}:{pathname:string;organizationId?:string;memberId?:string}){
 const router=useRouter();
 const [revision,setRevision]=useState(0);
 const [view,setView]=useState<View>(()=>pathname.endsWith("/progress")||pathname.endsWith("/records")?"records":"products");
 const [query,setQuery]=useState(""),[appliedQuery,setAppliedQuery]=useState(""),[filter,setFilter]=useState("全部商品");
 const [recordFilter,setRecordFilter]=useState("全部状态");
 const [selected,setSelected]=useState<string[]>([]);
 const [supply,setSupply]=useState<PreferredSupply>(emptyPreferredSupply);
 const [applicationOpen,setApplicationOpen]=useState(false);
 const [recordDetail,setRecordDetail]=useState<string|null>(null);
 const [reviewReason,setReviewReason]=useState("");
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const [page,setPage]=useState(1),[recordPage,setRecordPage]=useState(1);
 useEffect(()=>{
  const refresh=(event:Event)=>{
   const scope=(event as CustomEvent<{organizationId:string;memberId:string}>).detail;
   if(scope?.organizationId===organizationId&&scope?.memberId===memberId)setRevision(v=>v+1);
  };
  for(const name of [preferredApplicationChanged,ownProductUpdated,optimizedDatasetsChanged])window.addEventListener(name,refresh);
  return()=>{for(const name of [preferredApplicationChanged,ownProductUpdated,optimizedDatasetsChanged])window.removeEventListener(name,refresh)};
 },[organizationId,memberId]);
 useEffect(()=>{setView(pathname.endsWith("/progress")||pathname.endsWith("/records")?"records":"products")},[pathname]);
 useEffect(()=>{
  if(!applicationOpen&&!recordDetail)return;
  const escape=(e:KeyboardEvent)=>{if(e.key==="Escape"){setApplicationOpen(false);setRecordDetail(null);setError("")}};
  window.addEventListener("keydown",escape);return()=>window.removeEventListener("keydown",escape);
 },[applicationOpen,recordDetail]);
 const candidates=useMemo(()=>readPreferredCandidates(organizationId,memberId),[organizationId,memberId,revision]);
 const records=useMemo(()=>readPreferredApplications(organizationId,memberId),[organizationId,memberId,revision]);
 const activeRecord=records.find(row=>row.id===recordDetail);
 const eligible=candidates.filter(c=>c.status==="待申请"),working=candidates.filter(c=>c.status==="审核中"),approved=candidates.filter(c=>c.status==="已入选");
 const filtered=candidates.filter(c=>{
  const q=appliedQuery.trim().toLowerCase();
  if(q&&![c.product.name,c.product.batchId,...c.product.skus.map(s=>s.skuCode||s.name)].join(" ").toLowerCase().includes(q))return false;
  return filter==="全部商品"||filter==="待申请"&&c.status==="待申请"||
   filter==="审核中"&&c.status==="审核中"||filter==="已入选"&&c.status==="已入选"||
   filter==="待处理"&&["审核未通过","待二次优化"].includes(c.status);
 });
 const visible=filtered.slice((page-1)*8,page*8);
 const filteredRecords=records.filter(r=>recordFilter==="全部状态"||r.status===recordFilter);
 const visibleRecords=filteredRecords.slice((recordPage-1)*8,recordPage*8);
 const pageCount=Math.max(1,Math.ceil(filtered.length/8)),recordPageCount=Math.max(1,Math.ceil(filteredRecords.length/8));
 const chosen=selected.filter(id=>candidates.some(c=>c.product.id===id&&(c.status==="待申请"||c.status==="审核未通过")));
 const showApply=(ids?:string[])=>{
  const list=ids??chosen;
  if(!list.length){setNotice("只有已入库的自有商品可以申请，优选审核通过后再使用官方模板进行二次优化。");return}
  setSelected(list);setSupply(emptyPreferredSupply);setNotice("");setError("");setApplicationOpen(true);
 };
 const submit=(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  try{
   const record=submitPreferredDemoApplication(organizationId,memberId,chosen,supply);
   setApplicationOpen(false);setSelected([]);setSupply(emptyPreferredSupply);
   setView("records");setRecordFilter("全部状态");setRecordPage(1);setRecordDetail(record.id);
   setNotice("演示申请 "+record.id+" 已保存为「待审核」，正式审批仍需平台后台完成。");setError("");
  }catch(e){setError(e instanceof Error?e.message:"申请校验未通过")}
 };
 const review=(decision:"已通过"|"未通过")=>{
  if(!activeRecord)return;
  try{
   simulatePreferredReview(organizationId,memberId,activeRecord.id,decision,reviewReason);
   setReviewReason("");setError("");
   setNotice(decision==="已通过"?"仅演示审核通过：待执行官方模板二次优化，完成后才展示到硕米优选。":"仅演示审核未通过：保留记录，可修改资料重新申请。");
  }catch(e){setError(e instanceof Error?e.message:"模拟审核失败")}
 };
 const runSecondary=()=>{if(!activeRecord)return;try{
  completePreferredSecondaryOptimizationDemo(organizationId,memberId,activeRecord.id);
  setNotice("已完成官方「硕米适配」模板的本地二次整理演示；不是实际 AI 处理。");
  setError("");
 }catch(e){setError(e instanceof Error?e.message:"二次优化失败")}};
 const openRecord=(record:PreferredApplicationRecord)=>{setRecordDetail(record.id);setError("");setReviewReason("")};
 return <main className={styles.page} data-preferred-application="unified" data-organization={organizationId} data-member={memberId} aria-label="优选申请">
  <section className={styles.compactHero} aria-label="硕米优选介绍">
   <div className={styles.heroSymbol}><Star size={38} strokeWidth={1.8}/></div>
   <div className={styles.heroContent}>
    <div className={styles.heroTitle}><h1>加入硕米优选</h1><span>精选商品池</span></div>
    <p>让优质商品进入平台优选展示，获得更多被发现和合作的机会。</p>
    <div className={styles.heroHighlights}><span><CheckCircle2 size={17}/>优选展示</span><span><CheckCircle2 size={17}/>供货信息清晰</span><span><CheckCircle2 size={17}/>潜在合作对接</span></div>
    <small>审核通过后展示；曝光、询盘及成交不作保证，具体以平台正式服务为准。</small>
   </div>
   <button type="button" className={styles.heroAction} onClick={()=>router.push("/workbench/supply/selected?preview=1")}>查看硕米优选</button>
  </section>
  <section className={styles.mainPanel}>
   <div className={styles.tabs} role="tablist" aria-label="优选申请内容">
    <button type="button" role="tab" aria-selected={view==="products"} onClick={()=>setView("products")}>商品候选 <span>{candidates.length}</span></button>
    <button type="button" role="tab" aria-selected={view==="records"} onClick={()=>setView("records")}>申请记录 <span>{records.length}</span></button>
   </div>
   {view==="products"?<>
    <section className={styles.candidateSummary} aria-label="商品候选状态概览">
     <div className={styles.candidateSummaryTitle}><h2>商品候选</h2><p>仅显示自有商品库中已入库的商品</p></div>
     <div className={styles.metrics} aria-label="按状态筛选商品">
      {([
       {key:"全部商品",tone:"cyan",label:"自有商品",count:candidates.length,description:"当前账号商品库",Icon:Database},
       {key:"待申请",tone:"violet",label:"待申请",count:eligible.length,description:"已入库，可发起申请",Icon:BadgeCheck},
       {key:"审核中",tone:"orange",label:"审核中",count:working.length,description:"等待审核结果",Icon:ClipboardList},
       {key:"已入选",tone:"green",label:"已入选",count:approved.length,description:"审核通过商品",Icon:Star}
      ] as const).map(({key,tone,label,count,description,Icon})=>
       <button type="button" key={key} data-tone={tone} className={styles.metricCard} aria-pressed={filter===key} onClick={()=>{setFilter(key);setPage(1)}}>
        <span className={styles.metricValue}>{count}</span>
        <span className={styles.metricCopy}><strong>{label}</strong><small>{description}</small></span>
        <Icon className={styles.metricIcon} size={18} aria-hidden="true"/>
       </button>
      )}
     </div>
    </section>
    <div className={styles.panelHeading}><div><h2>自有商品库 · 申请候选</h2><p>申请流程：自有商品已入库 → 优选申请审核 → 官方模板二次优化 → 进入硕米优选。</p></div><button type="button" className={styles.primary} disabled={!chosen.length} onClick={()=>showApply()}>申请已选商品（{chosen.length}）</button></div>
    <form className={styles.filters} aria-label="商品筛选" onSubmit={e=>{e.preventDefault();setAppliedQuery(query);setPage(1)}}>
     <label className={styles.searchBox}><Search size={17}/><input aria-label="搜索商品名称或SKU" value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索商品名称 / SKU / 批次"/></label>
     <button type="submit" className={styles.confirmSearch}>确定</button>
    </form>
    <div className={styles.tableWrap}><table><thead><tr><th>选择</th><th>商品</th><th>适配与优化</th><th>申请状态</th><th>操作</th></tr></thead><tbody>
     {visible.map(c=><tr key={c.product.id} data-product-id={c.product.id}>
      <td><input type="checkbox" aria-label={"选择"+c.product.name} disabled={c.status!=="可申请"} checked={chosen.includes(c.product.id)} onChange={e=>setSelected(v=>e.target.checked?[...v,c.product.id]:v.filter(id=>id!==c.product.id))}/></td>
      <td><div className={styles.productCell}><ProductImage src={c.snapshot?.image||c.product.skus[0]?.images[0]||""} name={c.product.name}/><div><strong>{c.snapshot?.name||c.product.name}</strong><small>SKU {c.product.skus.map(s=>s.skuCode||s.id).join(" / ")}</small><small>自有商品库 · {c.product.batchId}</small></div></div></td>
      <td><div className={styles.versionCell}><strong>自有商品已入库</strong><small>{c.status==="待二次优化"?"优选审核通过 · 待官方模板二次优化":c.status==="已入选"?"官方模板二次优化已完成":c.status==="审核中"?"优选申请审核中":c.status==="审核未通过"?"上次申请未通过，可重新申请":"审核通过后再进行二次智能体优化"}</small>{c.lastRejected?<small>上次优选审核反馈：{c.lastRejected}</small>:null}</div></td>
      <td><Status value={displayStatus(c.status)}/></td>
      <td>{c.status==="待申请"||c.status==="审核未通过"?<button type="button" className={styles.rowAction} onClick={()=>showApply([c.product.id])}>{c.status==="审核未通过"?"重新申请":"发起申请"}</button>:c.status==="审核中"?<button type="button" onClick={()=>setView("records")}>查看记录</button>:c.status==="已入选"?<button type="button" onClick={()=>router.push("/workbench/supply/selected?preview=1")}>查看优选</button>:<button type="button" className={styles.rowAction} onClick={()=>{const record=records.find(r=>r.status==="已通过"&&r.secondaryOptimization!=="已完成"&&r.products.some(p=>p.sourceProductId===c.product.id));if(record)setRecordDetail(record.id)}}>去二次优化</button>}</td>
     </tr>)}
     {!visible.length?<tr><td colSpan={5} className={styles.empty}>暂无已入库的自有商品，完成自有商品入库审核后将在这里显示。</td></tr>:null}
    </tbody></table></div>
    <footer className={styles.pagination}><span>共 {filtered.length} 件商品</span><div><button type="button" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>上一页</button><span>{Math.min(page,pageCount)} / {pageCount}</span><button type="button" disabled={page>=pageCount} onClick={()=>setPage(p=>p+1)}>下一页</button></div></footer>
   </>:<>
    <div className={styles.panelHeading}><div><h2>申请与审核记录</h2><p>审核通过后执行官方模板二次优化，所有申请历史均保留。</p></div><select aria-label="筛选审核状态" value={recordFilter} onChange={e=>{setRecordFilter(e.target.value);setRecordPage(1)}}>{["全部状态","待审核","已通过","未通过"].map(x=><option key={x}>{x}</option>)}</select></div>
    <div className={styles.tableWrap}><table><thead><tr><th>申请编号</th><th>商品数量</th><th>提交时间</th><th>审核状态</th><th>操作</th></tr></thead><tbody>
     {visibleRecords.map(record=><tr key={record.id}><td><strong>{record.id}</strong></td><td>{record.products.length} 件</td><td>{formatDate(record.createdAt)}</td><td><Status value={record.status}/></td><td><button type="button" onClick={()=>openRecord(record)}>查看详情</button></td></tr>)}
     {!visibleRecords.length?<tr><td colSpan={5} className={styles.empty}>尚无申请记录。可从已入库商品中发起申请。</td></tr>:null}
    </tbody></table></div>
    <footer className={styles.pagination}><span>共 {filteredRecords.length} 条申请</span><div><button type="button" disabled={recordPage<=1} onClick={()=>setRecordPage(p=>p-1)}>上一页</button><span>{recordPage} / {recordPageCount}</span><button type="button" disabled={recordPage>=recordPageCount} onClick={()=>setRecordPage(p=>p+1)}>下一页</button></div></footer>
   </>}
  </section>
  <p className={styles.disclaimer}><Info size={14}/> 当前为浏览器会话演示，申请仅保存在当前账号本地会话；正式审核、企业间共享优选和真实询盘仍需连接后台服务。</p>
  {notice?<p role="status" className={styles.notice}>{notice}</p>:null}
  {applicationOpen?<div className={styles.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setApplicationOpen(false)}}>
   <section className={styles.modal} role="dialog" aria-modal="true" aria-label="发起优选申请">
    <header><div><small>优选合作申请 · {chosen.length} 件商品</small><h2>填写供货与合作信息</h2><p>一次填写本次申请统一的供货条件，提交后进入待审核。</p></div><button type="button" onClick={()=>setApplicationOpen(false)}>关闭</button></header>
    <form onSubmit={submit}><div className={styles.fields}>
     <label>可供库存<input aria-label="可供库存" required min="1" type="number" value={supply.stock} onChange={e=>setSupply(v=>({...v,stock:e.target.value}))}/></label>
     <label>最小起订量<input aria-label="最小起订量" required min="1" type="number" value={supply.moq} onChange={e=>setSupply(v=>({...v,moq:e.target.value}))}/></label>
     <label>发货时效<select aria-label="发货时效" required value={supply.dispatch} onChange={e=>setSupply(v=>({...v,dispatch:e.target.value}))}><option value="">请选择</option><option>24小时内</option><option>48小时内</option><option>3–5天</option><option>另行协商</option></select></label>
     <label>发货地<input aria-label="发货地" required value={supply.origin} onChange={e=>setSupply(v=>({...v,origin:e.target.value}))} placeholder="省、市"/></label>
     <label className={styles.full}>供货价说明<textarea aria-label="供货价说明" value={supply.pricing} onChange={e=>setSupply(v=>({...v,pricing:e.target.value}))} placeholder="例如：含税情况、批量优惠、运费说明"/></label>
     <label className={styles.full}>售后政策<textarea aria-label="售后政策" required value={supply.returns} onChange={e=>setSupply(v=>({...v,returns:e.target.value}))} placeholder="说明质量问题、退换货及售后安排"/></label>
    </div><div className={styles.modalTip}>提交不会自动通过审核，也不会产生平台曝光或成交保证。</div>
    {error?<p role="alert">{error}</p>:null}
    <footer><button type="button" onClick={()=>setApplicationOpen(false)}>取消</button><button type="submit" className={styles.primary}>提交演示申请</button></footer></form>
   </section></div>:null}
  {activeRecord?<div className={styles.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setRecordDetail(null)}}>
   <section className={styles.modal} role="dialog" aria-modal="true" aria-label="优选申请详情">
    <header><div><small>{activeRecord.id}</small><h2>申请审核详情</h2><p>申请时间：{formatDate(activeRecord.createdAt)}</p></div><button type="button" onClick={()=>setRecordDetail(null)}>关闭</button></header>
    <div className={styles.recordDetail}><Status value={activeRecord.status}/><p>{activeRecord.reviewNote}</p><strong>申请商品（{activeRecord.products.length}）</strong>{activeRecord.products.map(p=><div key={p.sourceProductId}><span>{p.name}</span><small>{p.versionName} · {p.platform} / {p.site}</small></div>)}<p>可供库存 {activeRecord.supply.stock} · 起订量 {activeRecord.supply.moq} · {activeRecord.supply.dispatch}</p></div>
    {activeRecord.status==="已通过"&&activeRecord.secondaryOptimization!=="已完成"?<div className={styles.demoReview}><strong>通过审核后 · 二次优化</strong><p>使用官方「硕米适配」模板进行演示字段整理，完成后才进入硕米优选。真实模型执行尚未接入。</p><button type="button" className={styles.primary} onClick={runSecondary}>执行官方模板二次优化（演示）</button></div>:null}
    {activeRecord.status==="待审核"?<div className={styles.demoReview}><strong>仅供验收的模拟审核</strong><p>真实用户不能自行审批商品。这里的操作只演示申请结果如何同步到硕米优选。</p><textarea aria-label="演示驳回原因" value={reviewReason} onChange={e=>setReviewReason(e.target.value)} placeholder="未通过原因（选填）"/><div><button type="button" onClick={()=>review("未通过")}>演示审核不通过</button><button type="button" className={styles.primary} onClick={()=>review("已通过")}>演示审核通过</button></div></div>:null}
    {error?<p role="alert">{error}</p>:null}
   </section></div>:null}
 </main>;
}
