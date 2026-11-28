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
 const [supplierSaved,setSupplierSaved]=useState(false);
 const [warehouseOptions,setWarehouseOptions]=useState<Array<{id:string;name:string;address:string;status:"已验证"|"待验证"|"验证失效"}>>([]);
 const [editSupplier,setEditSupplier]=useState(false);
 const [showSkuPricing,setShowSkuPricing]=useState(false);
 const [skuEditing,setSkuEditing]=useState<string[]>([]);
 const [showPackagingOverrides,setShowPackagingOverrides]=useState(false);
 const [showTierPricing,setShowTierPricing]=useState(false);
 const [applicationOpen,setApplicationOpen]=useState(false);
 const [recordDetail,setRecordDetail]=useState<string|null>(null);
 const [reviewReason,setReviewReason]=useState("");
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const [page,setPage]=useState(1),[recordPage,setRecordPage]=useState(1);
 const supplierKey="shuomi:preferred-supplier-profile-demo-v1:"+encodeURIComponent(organizationId);
 const warehousesKey="shuomi:preferred-warehouse-register-demo-v1:"+encodeURIComponent(organizationId);
 useEffect(()=>{
  try{
   const saved=JSON.parse(localStorage.getItem(supplierKey)||"null") as {name?:string;contact?:string;phone?:string;location?:string;agreement?:boolean}|null;
   setSupplierSaved(Boolean(saved?.name&&saved?.contact&&saved?.agreement));
  }catch{setSupplierSaved(false)}
  try{
   const rows:unknown=JSON.parse(localStorage.getItem(warehousesKey)||"[]");
   setWarehouseOptions(Array.isArray(rows)?rows.filter((x):x is {id:string;name:string;address:string;status:"已验证"|"待验证"|"验证失效"}=>Boolean(x&&typeof x==="object"&&typeof x.id==="string"&&typeof x.name==="string"&&["已验证","待验证","验证失效"].includes(x.status))):[]);
  }catch{setWarehouseOptions([])}
 },[supplierKey,warehousesKey]);
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
 const eligible=candidates.filter(c=>["待申请","审核未通过"].includes(c.status)),working=candidates.filter(c=>c.status==="审核中"),approved=candidates.filter(c=>c.status==="已入选");
 const filtered=candidates.filter(c=>{
  const q=appliedQuery.trim().toLowerCase();
  if(q&&![c.product.name,c.product.batchId,...c.product.skus.map(s=>s.skuCode||s.name)].join(" ").toLowerCase().includes(q))return false;
  return filter==="全部商品"||filter==="待申请"&&["待申请","审核未通过"].includes(c.status)||
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
  const available=candidates.filter(c=>list.includes(c.product.id));
  const skuPrices:Record<string,{price:string;quantity:string}>={};
  for(const c of available)for(const sku of c.product.skus){
   const key=c.product.id+":"+String(sku.id);
   const raw=sku.price??"";
   skuPrices[key]={price:raw&&Number(raw)>0?String(raw):"",quantity:String(sku.stock??0)};
  }
  let profile:{name?:string;contact?:string;phone?:string;location?:string;agreement?:boolean}|null=null;
  try{profile=JSON.parse(localStorage.getItem(supplierKey)||"null")}catch{/* first-time application */}
  const sourceSkus=available.flatMap(c=>c.product.skus.map(sku=>({key:c.product.id+":"+String(sku.id),sku})));
  const firstPrice=sourceSkus.find(v=>v.sku.price&&Number(v.sku.price)>0)?.sku.price??"";
  const firstQuantity=sourceSkus.find(v=>Number(v.sku.stock)>0)?.sku.stock;
  const skuOverrides:NonNullable<PreferredSupply["skuOverrides"]>={};
  for(const {key,sku} of sourceSkus){
   if(sku.price&&Number(sku.price)>0&&sku.price!==firstPrice)skuOverrides[key]={...skuOverrides[key],price:String(sku.price)};
   if(sku.stock!==undefined&&sku.stock!==firstQuantity)skuOverrides[key]={...skuOverrides[key],quantity:String(sku.stock)};
  }
  const previous=records[0]?.supply;
  setSelected(list);
  setSkuEditing(Object.keys(skuOverrides));setShowPackagingOverrides(false);
  setSupply({...emptyPreferredSupply,supplyKind:"现货",warehouseMode:"硕米仓库",currency:"CNY",dropship:true,skuPrices,skuOverrides,defaultSkuQuantity:firstQuantity===undefined?"":String(firstQuantity),
   supplierName:profile?.name??"",supplierContact:profile?.contact??"",supplierPhone:profile?.phone??"",supplierLocation:profile?.location??"",supplierAgreement:Boolean(profile?.agreement),
   unitPrice:firstPrice||previous?.unitPrice||"",packageWeight:previous?.packageWeight??"",packageSize:previous?.packageSize??"",shippingCountries:previous?.shippingCountries??"",origin:previous?.origin??"",dispatch:previous?.dispatch??"",returns:previous?.returns??"",maxQuantity:previous?.maxQuantity??"",stock:String(sourceSkus.reduce((sum,v)=>sum+(v.sku.stock??0),0)),moq:previous?.moq??"1"});
  setEditSupplier(!profile?.name);setShowSkuPricing(false);setShowTierPricing(false);
  setNotice("");setError("");setApplicationOpen(true);
 };
 const submit=(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  try{
   const skuPrices:NonNullable<PreferredSupply["skuPrices"]>={};
   for(const c of candidates.filter(c=>chosen.includes(c.product.id)))for(const sku of c.product.skus){
    const id=c.product.id+":"+String(sku.id);
    const override=supply.skuOverrides?.[id];
    skuPrices[id]={
     price:override?.price??supply.unitPrice??"",
     quantity:override?.quantity??supply.defaultSkuQuantity??"",
     moq:override?.moq??supply.moq,
     weight:showPackagingOverrides?override?.weight??supply.packageWeight:supply.packageWeight,
     size:showPackagingOverrides?override?.size??supply.packageSize:supply.packageSize
    };
   }
   const total=Object.values(skuPrices).reduce((sum,v)=>sum+Math.max(0,Number(v.quantity)||0),0);
   const record=submitPreferredDemoApplication(organizationId,memberId,chosen,{...supply,stock:String(total),skuPrices});
   try{
    localStorage.setItem(supplierKey,JSON.stringify({name:supply.supplierName,contact:supply.supplierContact,phone:supply.supplierPhone,location:supply.supplierLocation,agreement:supply.supplierAgreement,status:"资料已提交·待后台审核"}));
    setSupplierSaved(true);
    if(supply.supplyKind==="现货"&&supply.warehouseMode==="新增自有仓"){
     const next={id:"WH-DEMO-"+Date.now().toString(36),name:supply.warehouseName?.trim()||"",address:supply.warehouseAddress?.trim()||"",status:"待验证" as const};
     const updated=[...warehouseOptions,next];localStorage.setItem(warehousesKey,JSON.stringify(updated));setWarehouseOptions(updated);
    }
   }catch{/* Application record remains in scoped browser session; no backend onboarding claim. */}
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
      <td><input type="checkbox" aria-label={"选择"+c.product.name} disabled={c.status!=="待申请"&&c.status!=="审核未通过"} checked={chosen.includes(c.product.id)} onChange={e=>setSelected(v=>e.target.checked?[...v,c.product.id]:v.filter(id=>id!==c.product.id))}/></td>
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
     {visibleRecords.map(record=><tr key={record.id}><td><strong>{record.id}</strong></td><td>{record.products.length} 件</td><td>{formatDate(record.createdAt)}</td><td><Status value={record.status}/>{record.status==="已通过"?<small>{record.secondaryOptimization==="已完成"?"已完成官方模板二次优化":"待官方模板二次优化"}</small>:null}</td><td><button type="button" onClick={()=>openRecord(record)}>查看详情</button></td></tr>)}
     {!visibleRecords.length?<tr><td colSpan={5} className={styles.empty}>尚无申请记录。可从已入库商品中发起申请。</td></tr>:null}
    </tbody></table></div>
    <footer className={styles.pagination}><span>共 {filteredRecords.length} 条申请</span><div><button type="button" disabled={recordPage<=1} onClick={()=>setRecordPage(p=>p-1)}>上一页</button><span>{recordPage} / {recordPageCount}</span><button type="button" disabled={recordPage>=recordPageCount} onClick={()=>setRecordPage(p=>p+1)}>下一页</button></div></footer>
   </>}
  </section>
  <p className={styles.disclaimer}><Info size={14}/> 当前为浏览器会话演示：优选申请、审核和官方模板二次整理均为本地操作，不代表真实 AI 执行或正式入选。</p>
  {notice?<p role="status" className={styles.notice}>{notice}</p>:null}
  {applicationOpen?<div className={styles.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setApplicationOpen(false)}}>
   <section className={styles.modal+" "+styles.preferredApplyModal} role="dialog" aria-modal="true" aria-label="申请加入硕米优选">
    <header><div><small>硕米优选 · {chosen.length} 件商品</small><h2>申请加入硕米优选</h2><p>已有资料直接复用；先填写统一规则，只有不同的 SKU 才需单独调整。</p></div><button type="button" onClick={()=>setApplicationOpen(false)}>关闭</button></header>
    <form onSubmit={submit} className={styles.applyForm}>
     <div className={styles.applyScroll}>
      <section className={styles.applySection}>
       <div className={styles.applySectionHeading}><strong>供应商资料</strong><span className={styles.applyPill}>{supplierSaved?"已保存资料 · 可复用":"首次入驻 · 建立档案"}</span>{supplierSaved?<button type="button" className={styles.linkAction} onClick={()=>setEditSupplier(v=>!v)}>{editSupplier?"收起资料":"编辑资料"}</button>:null}</div>
       {!supplierSaved||editSupplier?<div className={styles.fields}>
        <label>供应商名称<input required aria-label="供应商名称" value={supply.supplierName??""} onChange={e=>setSupply(v=>({...v,supplierName:e.target.value}))} placeholder="企业名称 / 合作主体"/></label>
        <label>联系人<input required aria-label="供应商联系人" value={supply.supplierContact??""} onChange={e=>setSupply(v=>({...v,supplierContact:e.target.value}))} placeholder="联系人姓名"/></label>
        <label>联系电话<input required aria-label="供应商联系电话" value={supply.supplierPhone??""} onChange={e=>setSupply(v=>({...v,supplierPhone:e.target.value}))} placeholder="联系电话"/></label>
        <label>经营所在地<input aria-label="供应商经营所在地" value={supply.supplierLocation??""} onChange={e=>setSupply(v=>({...v,supplierLocation:e.target.value}))} placeholder="国家 / 省市"/></label>
        <label className={styles.full}><span className={styles.checkboxLine}><input type="checkbox" checked={Boolean(supply.supplierAgreement)} onChange={e=>setSupply(v=>({...v,supplierAgreement:e.target.checked}))}/>已阅读并同意硕米优选供应商合作规则（演示确认，不构成正式签约）</span></label>
       </div>:<p className={styles.applyHint}>当前企业已填写供应商资料：{supply.supplierName} · {supply.supplierContact}。资料可复用，供应商资格仍以硕米后台审核为准。</p>}
      </section>
      <section className={styles.applySection}>
       <div className={styles.applySectionHeading}><strong>商品与供货类型</strong><span className={styles.applyPill}>{chosen.length} 件商品</span></div>
       <div className={styles.chosenProducts}>{candidates.filter(c=>chosen.includes(c.product.id)).map(c=><div key={c.product.id} className={styles.chosenProduct}><ProductImage src={c.snapshot?.image??""} name={c.product.name}/><div><strong>{c.product.name}</strong><small>{c.product.skus.length} 个 SKU · 自有商品库 · {c.product.batchId}</small></div></div>)}</div>
       <div className={styles.choiceRow} role="group" aria-label="供货类型">
        {(["现货","定制","POD"] as const).map(kind=><button type="button" key={kind} className={styles.choiceButton} aria-pressed={supply.supplyKind===kind} onClick={()=>setSupply(v=>({...v,supplyKind:kind,warehouseMode:kind==="现货"?(v.warehouseMode??"硕米仓库"):undefined}))}>{kind}</button>)}
       </div>
      </section>
      <section className={styles.applySection}>
       <div className={styles.applySectionHeading}><strong>统一供货规则</strong><span className={styles.applyMeta}>默认应用到所有 SKU · 运费与处理费由硕米后台核算</span></div>
       <div className={styles.fields}>
        <label>结算币种<select aria-label="结算币种" value={supply.currency??"CNY"} onChange={e=>setSupply(v=>({...v,currency:e.target.value}))}><option value="CNY">CNY · 人民币</option><option value="USD">USD · 美元</option></select></label>
        <label>默认供货价<input required type="number" step="0.01" min="0.01" aria-label="基础供货价" value={supply.unitPrice??""} onChange={e=>setSupply(v=>({...v,unitPrice:e.target.value}))} placeholder="统一供货单价"/></label>
        <label>默认起订量<input required type="number" min="1" aria-label="最小起订量" value={supply.moq} onChange={e=>setSupply(v=>({...v,moq:e.target.value}))}/></label>
        <label>{supply.supplyKind==="现货"?"每个 SKU 默认可售库存":"每个 SKU 默认可接单量"}<input required type="number" min="0" aria-label="SKU默认库存" value={supply.defaultSkuQuantity??""} onChange={e=>setSupply(v=>({...v,defaultSkuQuantity:e.target.value}))} placeholder="统一数量"/></label>
        <label>单次最大采购量（选填）<input type="number" min="1" aria-label="单次最大可采购量" value={supply.maxQuantity??""} onChange={e=>setSupply(v=>({...v,maxQuantity:e.target.value}))}/></label>
        <label><span className={styles.checkboxLine}><input type="checkbox" checked={Boolean(supply.dropship)} onChange={e=>setSupply(v=>({...v,dropship:e.target.checked}))}/>支持一件代发</span></label>
       </div>
       <div className={styles.applyTools}><strong>SKU 差异配置</strong><span>{skuEditing.length} 个单独设置 · 其余采用上方默认值</span><button type="button" onClick={()=>setShowSkuPricing(v=>!v)}>{showSkuPricing?"收起差异":"调整差异 SKU"}</button></div>
       {showSkuPricing?<div className={styles.skuExceptions}>
        {candidates.filter(c=>chosen.includes(c.product.id)).flatMap(c=>c.product.skus.map(sku=>{
         const key=c.product.id+":"+String(sku.id),override=supply.skuOverrides?.[key]??{},editing=skuEditing.includes(key);
         const update=(field:"price"|"quantity"|"moq"|"weight"|"size",value:string)=>setSupply(v=>({...v,skuOverrides:{...v.skuOverrides,[key]:{...v.skuOverrides?.[key],[field]:value}}}));
         return <div className={styles.skuException} key={key}>
          <div className={styles.skuExceptionHead}><div><strong>{sku.name}</strong><small>{sku.skuCode||sku.id}</small></div><span>{editing?"独立设置":"使用默认值"}</span><button type="button" onClick={()=>{
           if(editing){setSkuEditing(old=>old.filter(x=>x!==key));setSupply(v=>{const next={...v.skuOverrides};delete next[key];return {...v,skuOverrides:next}})}
           else setSkuEditing(old=>[...old,key]);
          }}>{editing?"恢复默认":"单独调整"}</button></div>
          {editing?<div className={styles.skuExceptionFields}>
           <label>供货价<input type="number" step="0.01" min="0.01" aria-label={"SKU供货价 "+key} value={override.price??supply.unitPrice??""} onChange={e=>update("price",e.target.value)}/></label>
           <label>{supply.supplyKind==="现货"?"库存":"可接单量"}<input type="number" min="0" aria-label={"SKU库存 "+key} value={override.quantity??supply.defaultSkuQuantity??""} onChange={e=>update("quantity",e.target.value)}/></label>
           <label>起订量<input type="number" min="1" aria-label={"SKU起订量 "+key} value={override.moq??supply.moq} onChange={e=>update("moq",e.target.value)}/></label>
           {showPackagingOverrides?<><label>包装重量 kg<input type="number" min="0.001" step="0.001" aria-label={"SKU包装重量 "+key} value={override.weight??supply.packageWeight??""} onChange={e=>update("weight",e.target.value)}/></label><label>包装尺寸 cm<input aria-label={"SKU包装尺寸 "+key} value={override.size??supply.packageSize??""} onChange={e=>update("size",e.target.value)} placeholder="长×宽×高"/></label></>:null}
          </div>:null}
         </div>
        }))}</div>:null}
       <div className={styles.applyTools}><label className={styles.checkboxLine}><input type="checkbox" checked={showTierPricing} onChange={e=>setShowTierPricing(e.target.checked)}/>阶梯供货报价</label></div>
       {showTierPricing?<label className={styles.applyTextLabel}>阶梯报价说明<textarea aria-label="阶梯报价规则" value={supply.tierPrices??""} onChange={e=>setSupply(v=>({...v,tierPrices:e.target.value}))} placeholder="例如 10–49 件 11.80；50 件以上 10.90"/></label>:null}
      </section>
      <section className={styles.applySection}>
       <div className={styles.applySectionHeading}><strong>仓储与履约信息</strong>{supply.supplyKind!=="现货"?<span className={styles.applyPill}>按单生产 · 无需提前备货</span>:null}</div>
       {supply.supplyKind==="现货"?<div className={styles.warehouseOptions}>
        {([["硕米仓库","备货到硕米仓库（后续入库验收）"],["已验证自有仓","选择已通过验证的自有仓库"],["新增自有仓","新增自有仓库（后台待验证）"]] as const).map(([value,label])=><label key={value} className={styles.warehouseOption}><input type="radio" name="preferredWarehouseMode" checked={supply.warehouseMode===value} onChange={()=>setSupply(v=>({...v,warehouseMode:value,warehouseId:""}))}/>{label}</label>)}
        {supply.warehouseMode==="已验证自有仓"?<div className={styles.warehouseDetail}>{warehouseOptions.filter(x=>x.status==="已验证").length?<select aria-label="选择已验证仓库" required value={supply.warehouseId??""} onChange={e=>{const wh=warehouseOptions.find(x=>x.id===e.target.value);setSupply(v=>({...v,warehouseId:e.target.value,warehouseName:wh?.name,warehouseAddress:wh?.address}))}}><option value="">选择已有已验证仓库</option>{warehouseOptions.filter(x=>x.status==="已验证").map(wh=><option key={wh.id} value={wh.id}>{wh.name} · {wh.address}</option>)}</select>:<p className={styles.applyHint}>当前暂无已验证的自有仓库。可选择「新增自有仓」提交验证，或选择硕米仓库。</p>}</div>:null}
        {supply.warehouseMode==="新增自有仓"?<div className={styles.fields+" "+styles.warehouseDetail}><label>仓库名称<input required aria-label="新仓库名称" value={supply.warehouseName??""} onChange={e=>setSupply(v=>({...v,warehouseName:e.target.value}))} placeholder="填写仓库名称"/></label><label>仓库地址<input required aria-label="新仓库地址" value={supply.warehouseAddress??""} onChange={e=>setSupply(v=>({...v,warehouseAddress:e.target.value}))} placeholder="详细仓库地址"/></label><p className={styles.applyHint}>允许先提交商品申请，仓库进入待验证状态；仓库认证通过后可在后续申请中直接复用。</p></div>:null}
        {supply.warehouseMode==="硕米仓库"?<p className={styles.applyHint}>不要求商家验证硕米仓库，但现货商品须完成备货与入库验收才可正式开放采购。</p>:null}
        {warehouseOptions.some(x=>x.status==="待验证")?<p className={styles.applyHint}>已有 {warehouseOptions.filter(x=>x.status==="待验证").length} 个待验证仓库；审核完成前不能作为已验证仓库使用。</p>:null}
       </div>:<p className={styles.applyHint}>按订单生产，无须提前入库；由硕米后台审核生产能力、质量及履约条件。</p>}
       <div className={styles.fields}>
        <label>发货地<input required aria-label="发货地" value={supply.origin} onChange={e=>setSupply(v=>({...v,origin:e.target.value}))} placeholder="国家 / 省市"/></label>
        <label>{supply.supplyKind==="现货"?"出库时效":"生产与发货时效"}<input required aria-label="发货时效" value={supply.dispatch} onChange={e=>setSupply(v=>({...v,dispatch:e.target.value}))} placeholder="例如 1–3 个工作日"/></label>
        <label>默认包装重量（kg）<input required type="number" min="0.001" step="0.001" aria-label="包装重量" value={supply.packageWeight??""} onChange={e=>setSupply(v=>({...v,packageWeight:e.target.value}))} placeholder="例如 0.35"/></label>
        <label>默认包装尺寸（cm）<input required aria-label="包装尺寸" value={supply.packageSize??""} onChange={e=>setSupply(v=>({...v,packageSize:e.target.value}))} placeholder="长×宽×高"/></label>
        <label className={styles.full}><span className={styles.checkboxLine}><input type="checkbox" checked={showPackagingOverrides} onChange={e=>{setShowPackagingOverrides(e.target.checked);if(e.target.checked)setShowSkuPricing(true)}}/>部分 SKU 的包装重量或尺寸不同（在「SKU 差异配置」中调整）</span></label>
        <label className={styles.full}>可配送国家 / 地区<input required aria-label="可配送国家" value={supply.shippingCountries??""} onChange={e=>setSupply(v=>({...v,shippingCountries:e.target.value}))} placeholder="例如 美国、加拿大、英国"/></label>
        <label className={styles.full}>售后与质量处理规则<textarea required aria-label="售后政策" value={supply.returns} onChange={e=>setSupply(v=>({...v,returns:e.target.value}))} placeholder="质量问题及退换货责任划分"/></label>
        <label className={styles.full}>供货补充说明（可选）<textarea aria-label="供货价说明" value={supply.pricing} onChange={e=>setSupply(v=>({...v,pricing:e.target.value}))} placeholder="供货特殊要求、报价备注等；无需填写运费或处理费"/></label>
       </div>
      </section>
      <p className={styles.modalTip}>提交后直接进入后台审核，无需等待运费、质检、打包及贴标费用评估。此页面仅演示本地申请记录，不执行真实平台入选或仓库认证。</p>
      {error?<p role="alert">{error}</p>:null}
     </div>
     <footer className={styles.applyFooter}><span>已选 {chosen.length} 件商品 · {Object.keys(supply.skuPrices??{}).length} 个 SKU</span><div><button type="button" onClick={()=>setApplicationOpen(false)}>取消</button><button type="submit" className={styles.primary}>提交优选申请（演示）</button></div></footer>
    </form>
   </section></div>:null}
  {activeRecord?<div className={styles.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setRecordDetail(null)}}>
   <section className={styles.modal} role="dialog" aria-modal="true" aria-label="优选申请详情">
    <header><div><small>{activeRecord.id}</small><h2>申请审核详情</h2><p>申请时间：{formatDate(activeRecord.createdAt)}</p></div><button type="button" onClick={()=>setRecordDetail(null)}>关闭</button></header>
    <div className={styles.recordDetail}><Status value={activeRecord.status}/><p>{activeRecord.reviewNote}</p><strong>申请商品（{activeRecord.products.length}）</strong>{activeRecord.products.map(p=><div key={p.sourceProductId}><span>{p.name}</span><small>{p.versionName} · {p.platform} / {p.site}</small></div>)}<p>供货类型：{activeRecord.supply.supplyKind??"未分类"} · 可售 / 可接单量 {activeRecord.supply.stock} · 起订量 {activeRecord.supply.moq} · {activeRecord.supply.dispatch}</p><p>仓储方式：{activeRecord.supply.warehouseMode??"按单生产"}{activeRecord.supply.warehouseName?" · "+activeRecord.supply.warehouseName:""} · 结算币种：{activeRecord.supply.currency??"—"} · 起始供货价：{activeRecord.supply.unitPrice??"—"}</p></div>
    {activeRecord.status==="已通过"&&activeRecord.secondaryOptimization!=="已完成"?<div className={styles.demoReview}><strong>通过审核后 · 二次优化</strong><p>使用官方「硕米适配」模板进行演示字段整理，完成后才进入硕米优选。真实模型执行尚未接入。</p><button type="button" className={styles.primary} onClick={runSecondary}>执行官方模板二次优化（演示）</button></div>:null}
    {activeRecord.status==="待审核"?<div className={styles.demoReview}><strong>仅供验收的模拟审核</strong><p>真实用户不能自行审批商品。此操作仅演示优选申请审核，审核通过后仍须完成官方模板二次优化。</p><textarea aria-label="演示驳回原因" value={reviewReason} onChange={e=>setReviewReason(e.target.value)} placeholder="未通过原因（选填）"/><div><button type="button" onClick={()=>review("未通过")}>演示审核不通过</button><button type="button" className={styles.primary} onClick={()=>review("已通过")}>演示审核通过</button></div></div>:null}
    {error?<p role="alert">{error}</p>:null}
   </section></div>:null}
 </main>;
}
