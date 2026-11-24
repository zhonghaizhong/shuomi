"use client";
import {useEffect,useMemo,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {BadgeCheck,ClipboardList,Database,Info,PackageCheck,Search,Star,Workflow} from "lucide-react";
import {
 emptyPreferredSupply,preferredApplicationChanged,ownProductUpdated,optimizedDatasetsChanged,
 readPreferredCandidates,readPreferredApplications,submitPreferredDemoApplication,simulatePreferredReview,
 type PreferredApplicationRecord,type PreferredSupply,type PreferredCandidate
} from "./preferred-application-store";
import styles from "./preferred-application-preview.module.css";

type View="products"|"records";
const formatDate=(value:string)=>{try{return new Date(value).toLocaleString("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})}catch{return value}};
const displayStatus=(status:PreferredCandidate["status"])=>status==="已入选"?"已入选优选":status==="待首次适配"?"待首次适配":status==="待智能体优化"?"待智能优化":status;
function Status({value}:{value:string}){return <span className={styles.status} data-status={value}>{value}</span>;}
function ProductImage({src,name}:{src:string;name:string}){
 return src?<img className={styles.productImage} src={src} alt={name}/>:<div className={styles.productPlaceholder} aria-label="暂无商品图片"><PackageCheck size={23}/></div>;
}
export function PreferredApplicationPreview({pathname,organizationId="SM-ENT-000001",memberId="admin"}:{pathname:string;organizationId?:string;memberId?:string}){
 const router=useRouter();
 const [revision,setRevision]=useState(0);
 const [view,setView]=useState<View>(()=>pathname.endsWith("/progress")||pathname.endsWith("/records")?"records":"products");
 const [query,setQuery]=useState(""),[filter,setFilter]=useState("全部商品");
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
 const eligible=candidates.filter(c=>c.status==="可申请"),working=candidates.filter(c=>c.status==="审核中"),approved=candidates.filter(c=>c.status==="已入选");
 const filtered=candidates.filter(c=>{
  const q=query.trim().toLowerCase();
  if(q&&![c.product.name,c.product.batchId,...c.product.skus.map(s=>s.skuCode||s.name)].join(" ").toLowerCase().includes(q))return false;
  return filter==="全部商品"||filter==="可申请"&&c.status==="可申请"||
   filter==="审核中"&&c.status==="审核中"||filter==="已入选"&&c.status==="已入选"||
   filter==="待处理"&&["待首次适配","待智能体优化"].includes(c.status);
 });
 const visible=filtered.slice((page-1)*8,page*8);
 const filteredRecords=records.filter(r=>recordFilter==="全部状态"||r.status===recordFilter);
 const visibleRecords=filteredRecords.slice((recordPage-1)*8,recordPage*8);
 const pageCount=Math.max(1,Math.ceil(filtered.length/8)),recordPageCount=Math.max(1,Math.ceil(filteredRecords.length/8));
 const chosen=selected.filter(id=>candidates.some(c=>c.product.id===id&&c.status==="可申请"));
 const showApply=(ids?:string[])=>{
  const list=ids??chosen;
  if(!list.length){setNotice("请先勾选已完成首次适配与智能体优化的商品。");return}
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
   setNotice(decision==="已通过"?"仅演示审核通过：已同步到本账号的硕米优选页面。":"仅演示审核未通过：保留记录，可修改资料重新申请。");
  }catch(e){setError(e instanceof Error?e.message:"模拟审核失败")}
 };
 const openRecord=(record:PreferredApplicationRecord)=>{setRecordDetail(record.id);setError("");setReviewReason("")};
 return <main className={styles.page} data-preferred-application="unified" data-organization={organizationId} data-member={memberId} aria-label="优选申请">
  <header className={styles.heading}>
   <div><small>供应市场 / 优选申请</small><h1>优选申请</h1><p>自动读取自有商品库中完成首次适配和智能体优化的商品，申请审核通过后可进入硕米优选。</p></div>
   <button type="button" onClick={()=>router.push("/workbench/supply/selected?preview=1")}>查看硕米优选</button>
  </header>
  <section className={styles.benefits} aria-label="加入硕米优选的好处">
   <div className={styles.benefitHeading}><Star size={20}/><div><h2>加入硕米优选，给好商品更多被发现的机会</h2><p>让商品从自己的资料库走向平台优选展示与潜在合作场景。</p></div></div>
   <div className={styles.benefitGrid}>
    <article data-benefit="show"><BadgeCheck size={20}/><div><strong>进入优选展示池</strong><p>审核通过的商品可在硕米优选展示，让平台内选品用户查找。</p></div></article>
    <article data-benefit="supply"><PackageCheck size={20}/><div><strong>展示供货实力</strong><p>集中呈现商品图片、规格及供货条件，减少反复介绍。</p></div></article>
    <article data-benefit="connect"><Workflow size={20}/><div><strong>获得潜在对接机会</strong><p>便于有需求的用户了解商品并发起后续合作沟通。</p></div></article>
   </div>
   <small>加入优选不保证曝光量、客户询盘或成交；实际推荐、撮合和交易服务以平台正式开通及合作规则为准。</small>
  </section>
  <section className={styles.metrics} aria-label="优选申请概况">
   <article data-tone="cyan"><div><small>自有商品</small><strong>{candidates.length}</strong><span>当前账号商品库</span></div><Database size={22}/></article>
   <article data-tone="violet"><div><small>可申请</small><strong>{eligible.length}</strong><span>已完成适配和优化</span></div><BadgeCheck size={22}/></article>
   <article data-tone="orange"><div><small>审核中</small><strong>{working.length}</strong><span>等待审核结果</span></div><ClipboardList size={22}/></article>
   <article data-tone="green"><div><small>已入选</small><strong>{approved.length}</strong><span>审核通过商品</span></div><Star size={22}/></article>
  </section>
  <section className={styles.flowStrip} aria-label="优选申请流程">
   <div><Workflow size={19}/><strong>入选流程</strong></div>
   <ol><li><span>01</span>首次适配</li><li><span>02</span>智能体优化</li><li><span>03</span>提交申请</li><li><span>04</span>审核后入选</li></ol>
  </section>
  <section className={styles.mainPanel}>
   <div className={styles.tabs} role="tablist" aria-label="优选申请内容">
    <button type="button" role="tab" aria-selected={view==="products"} onClick={()=>setView("products")}>商品候选 <span>{candidates.length}</span></button>
    <button type="button" role="tab" aria-selected={view==="records"} onClick={()=>setView("records")}>申请记录 <span>{records.length}</span></button>
   </div>
   {view==="products"?<>
    <div className={styles.panelHeading}><div><h2>自有商品库 · 申请候选</h2><p>商品自动同步；没有优化版本或首次适配未完成的商品不会开放申请。</p></div><button type="button" className={styles.primary} disabled={!chosen.length} onClick={()=>showApply()}>申请已选商品（{chosen.length}）</button></div>
    <div className={styles.filters} aria-label="商品筛选">
     <label className={styles.searchBox}><Search size={17}/><input aria-label="搜索商品名称或SKU" value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder="搜索商品名称 / SKU / 批次"/></label>
     <select aria-label="筛选申请状态" value={filter} onChange={e=>{setFilter(e.target.value);setPage(1)}}>{["全部商品","可申请","待处理","审核中","已入选"].map(x=><option key={x}>{x}</option>)}</select>
     <button type="button" onClick={()=>{setQuery("");setFilter("全部商品");setPage(1)}}>重置</button>
    </div>
    <div className={styles.tableWrap}><table><thead><tr><th>选择</th><th>商品</th><th>适配与优化</th><th>申请状态</th><th>操作</th></tr></thead><tbody>
     {visible.map(c=><tr key={c.product.id} data-product-id={c.product.id}>
      <td><input type="checkbox" aria-label={"选择"+c.product.name} disabled={c.status!=="可申请"} checked={chosen.includes(c.product.id)} onChange={e=>setSelected(v=>e.target.checked?[...v,c.product.id]:v.filter(id=>id!==c.product.id))}/></td>
      <td><div className={styles.productCell}><ProductImage src={c.snapshot?.image||c.product.skus[0]?.images[0]||""} name={c.product.name}/><div><strong>{c.snapshot?.name||c.product.name}</strong><small>SKU {c.product.skus.map(s=>s.skuCode||s.id).join(" / ")}</small><small>自有商品库 · {c.product.batchId}</small></div></div></td>
      <td><div className={styles.versionCell}><strong>{c.product.status==="已入库"?"首次适配完成":"尚未通过首次适配"}</strong><small>{c.optimized?c.snapshot?.versionName+" · "+c.optimized.platform+" / "+c.optimized.site:"暂无已保存的智能体优化版本"}</small>{c.lastRejected?<small>上次审核反馈：{c.lastRejected}</small>:null}</div></td>
      <td><Status value={displayStatus(c.status)}/></td>
      <td>{c.status==="可申请"?<button type="button" className={styles.rowAction} onClick={()=>showApply([c.product.id])}>发起申请</button>:c.status==="审核中"?<button type="button" onClick={()=>setView("records")}>查看记录</button>:c.status==="已入选"?<button type="button" onClick={()=>router.push("/workbench/supply/selected?preview=1")}>查看优选</button>:<span className={styles.muted}>待完成条件</span>}</td>
     </tr>)}
     {!visible.length?<tr><td colSpan={5} className={styles.empty}>没有符合条件的商品。请先在「我的数据 · 自有商品库」完成首次入库，并保存对应的智能体优化版本。</td></tr>:null}
    </tbody></table></div>
    <footer className={styles.pagination}><span>共 {filtered.length} 件商品</span><div><button type="button" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>上一页</button><span>{Math.min(page,pageCount)} / {pageCount}</span><button type="button" disabled={page>=pageCount} onClick={()=>setPage(p=>p+1)}>下一页</button></div></footer>
   </>:<>
    <div className={styles.panelHeading}><div><h2>申请与审核记录</h2><p>提交后保留每次申请，未通过的记录不会被新申请覆盖。</p></div><select aria-label="筛选审核状态" value={recordFilter} onChange={e=>{setRecordFilter(e.target.value);setRecordPage(1)}}>{["全部状态","待审核","已通过","未通过"].map(x=><option key={x}>{x}</option>)}</select></div>
    <div className={styles.tableWrap}><table><thead><tr><th>申请编号</th><th>商品数量</th><th>提交时间</th><th>审核状态</th><th>操作</th></tr></thead><tbody>
     {visibleRecords.map(record=><tr key={record.id}><td><strong>{record.id}</strong></td><td>{record.products.length} 件</td><td>{formatDate(record.createdAt)}</td><td><Status value={record.status}/></td><td><button type="button" onClick={()=>openRecord(record)}>查看详情</button></td></tr>)}
     {!visibleRecords.length?<tr><td colSpan={5} className={styles.empty}>尚无申请记录。可在「商品候选」中选择符合条件的商品。</td></tr>:null}
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
    {activeRecord.status==="待审核"?<div className={styles.demoReview}><strong>仅供验收的模拟审核</strong><p>真实用户不能自行审批商品。这里的操作只演示申请结果如何同步到硕米优选。</p><textarea aria-label="演示驳回原因" value={reviewReason} onChange={e=>setReviewReason(e.target.value)} placeholder="未通过原因（选填）"/><div><button type="button" onClick={()=>review("未通过")}>演示审核不通过</button><button type="button" className={styles.primary} onClick={()=>review("已通过")}>演示审核通过</button></div></div>:null}
    {error?<p role="alert">{error}</p>:null}
   </section></div>:null}
 </main>;
}
