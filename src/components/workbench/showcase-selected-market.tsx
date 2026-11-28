"use client";
import {useEffect,useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {PackageSearch,Search,ShieldCheck,CheckCircle2} from "lucide-react";
import {preferredApplicationChanged,readDemoSelectedCatalog} from "./preferred-application-store";
import {selectedCatalogFixtures,type SelectedCatalogProduct} from "./showcase-selected-catalog-fixtures";
import {readDemoCollectionBatches,addSelectedCatalogProducts,type DemoCollectedProduct,type DemoCollectionBatch} from "./showcase-collection-batches";
import css from "./showcase-selected-market.module.css";

const pagesize=8;
const formatMoney=(value:number,currency:string)=>currency==="CNY"?"¥"+value.toFixed(2):currency+" "+value.toFixed(2);
const packageVolume=(p:SelectedCatalogProduct)=>p.packagingLengthCm&&p.packagingWidthCm&&p.packagingHeightCm
 ?(p.packagingLengthCm*p.packagingWidthCm*p.packagingHeightCm/1000000).toFixed(4)+" m³":"待供应商提供";
type CollectionMode="supply"|"landed";
type CatalogSku=SelectedCatalogProduct["skus"][number];
const skuFees=(p:SelectedCatalogProduct,sku:CatalogSku)=>sku.serviceFees??p.serviceFees;
const skuShipping=(p:SelectedCatalogProduct,sku:CatalogSku)=>sku.shippingQuotes??p.shippingQuotes??[];
const skuCountries=(p:SelectedCatalogProduct,sku:CatalogSku)=>skuShipping(p,sku).length
 ?skuShipping(p,sku).map(q=>q.country):p.shipToCountries??[];
function costForCountry(product:SelectedCatalogProduct,sku:CatalogSku,country:string){
 const fees=skuFees(product,sku),freight=skuShipping(product,sku).find(q=>q.country===country);
 const currency=product.quotationCurrency||"CNY";
 const valid=sku.price>0&&Boolean(country)&&fees?.inspection!=null&&fees.packing!=null&&fees.labeling!=null
  &&fees.currency===currency&&freight?.freight!=null&&freight.currency===currency;
 return {skuId:sku.id,country,supplyPrice:sku.price,inspection:fees?.inspection??null,
  packing:fees?.packing??null,labeling:fees?.labeling??null,freight:freight?.freight??null,
  unitTotal:valid?Math.round((sku.price+fees!.inspection!+fees!.packing!+fees!.labeling!+freight!.freight!)*100)/100:null,
  currency,complete:valid,demo:Boolean(product.id.includes("DEMO")||fees?.demo||freight?.demo)};
}
function toCollected(product:SelectedCatalogProduct,mode:CollectionMode,selectedSkus:CatalogSku[]):DemoCollectedProduct{
 const currency=product.quotationCurrency||"CNY";
 if(!selectedSkus.length)throw Error(product.name+"：至少选择一个 SKU / 变体");
 const minSku=Math.min(...selectedSkus.map(s=>s.price));
 const countryCosts=selectedSkus.flatMap(s=>skuCountries(product,s).map(country=>costForCountry(product,s,country)));
 const supplyLabel=minSku>0?formatMoney(minSku,currency)+" 起":"待供应商报价";
 return {
  id:"COLLECT-"+product.id,sku:selectedSkus[0]?.id??product.id,
  name:product.name,originalTitle:product.name,description:product.description,
  source:"硕米优选（演示） · "+product.supplierName,
  supplyProductId:product.id,supplySkuId:selectedSkus[0]?.id,
  supplierId:product.supplierId,supplierName:product.supplierName,
  supplyVersion:product.version,supplyType:product.supplyType??"待确认",
  warehouseCountry:product.warehouseCountry??"",shipToCountries:[...new Set(countryCosts.map(q=>q.country))],
  moq:product.moq,dropship:product.dropship??null,price:supplyLabel,
  collectionPriceMode:mode,quoteCurrency:currency,
  // The price and variantDetails.price fields stay at supplier price; total landed
  // costs are country-specific, and cannot safely be represented as one price.
  destinationCosts:mode==="landed"?countryCosts:undefined,
  images:[...product.images],variants:selectedSkus.map(s=>s.label),variantCount:selectedSkus.length,
  variantDetails:selectedSkus.map(s=>({sku:s.id,label:s.label,color:s.color,size:s.size,
   image:s.images?.[0]||"",images:[...(s.images||[])],
   price:String(s.price),stock:String(s.stock),description:product.description})),
  status:"演示数据"
 };
}
export function ShowcaseSelectedMarket({organizationId,memberId}:{organizationId:string;memberId:string}){
 const router=useRouter();
 const [revision,setRevision]=useState(0);
 const [query,setQuery]=useState(""),[appliedQuery,setAppliedQuery]=useState("");
 const [category,setCategory]=useState("全部类目"),[page,setPage]=useState(1);
 const [country,setCountry]=useState("全部货源"),[destination,setDestination]=useState("全部国家");
 const [supplyType,setSupplyType]=useState("全部"),[moqLimit,setMoqLimit]=useState(100);
 const [singleOnly,setSingleOnly]=useState(false),[dropshipOnly,setDropshipOnly]=useState(false);
 const [sortBy,setSortBy]=useState("综合排序");
 const [active,setActive]=useState<string|null>(null),[chosen,setChosen]=useState<string[]>([]);
 const [activeSku,setActiveSku]=useState(""),[photoIndex,setPhotoIndex]=useState(0),[imageFailed,setImageFailed]=useState(false);
 const [collectOpen,setCollectOpen]=useState(false),[batchMode,setBatchMode]=useState<"new"|"existing">("new");
 // All variants are selected by default; only explicitly unchecked SKU keys are excluded.
 const [excludedSkus,setExcludedSkus]=useState<string[]>([]);
 const skuKey=(productId:string,skuId:string)=>productId+"::"+skuId;
 const isSkuIncluded=(productId:string,skuId:string)=>!excludedSkus.includes(skuKey(productId,skuId));
 const toggleSku=(productId:string,skuId:string)=>setExcludedSkus(previous=>{
  const key=skuKey(productId,skuId);return previous.includes(key)?previous.filter(x=>x!==key):[...previous,key];
 });
 const toggleAllSkus=(product:SelectedCatalogProduct,checked:boolean)=>setExcludedSkus(previous=>{
  const keys=product.skus.map(s=>skuKey(product.id,s.id));
  return checked?previous.filter(x=>!keys.includes(x)):[...new Set([...previous,...keys])];
 });
 const [targetCountry,setTargetCountry]=useState(""),[priceMode,setPriceMode]=useState<CollectionMode>("supply");
 const [batchName,setBatchName]=useState("硕米优选采集批次"),[batchId,setBatchId]=useState("");
 const [batches,setBatches]=useState<DemoCollectionBatch[]>([]);
 const [notice,setNotice]=useState(""),[error,setError]=useState("");
 const [purchase,setPurchase]=useState<{orderId:string;storeId:string;productId:string;skuId:string;quantity:number;source:string;org:string;member:string}|null>(null);
 useEffect(()=>{
  const refresh=()=>{setBatches(readDemoCollectionBatches(organizationId,memberId));setRevision(v=>v+1)};
  refresh();
  const onChanged=(event:Event)=>{
   const detail=(event as CustomEvent<{organizationId?:string}>).detail;
   if(!detail?.organizationId||detail.organizationId===organizationId)refresh();
  };
  window.addEventListener(preferredApplicationChanged,onChanged);
  window.addEventListener("shuomi:demo-batches-updated",onChanged);
  return()=>{window.removeEventListener(preferredApplicationChanged,onChanged);window.removeEventListener("shuomi:demo-batches-updated",onChanged)};
 },[organizationId,memberId]);
 const owned=useMemo(()=>readDemoSelectedCatalog(organizationId,memberId),[organizationId,memberId,revision]);
 // Shared fixtures are explicitly seeded into the demo, never claimed as
 // audited suppliers. Actual approvals remain in the owner's own session only.
 const items=useMemo(()=>{
  const own:SelectedCatalogProduct[]=owned.map((row,index)=>({
   id:"OWN-DEMO-"+row.product.sourceProductId,
   name:row.product.name,category:"其他",description:row.product.description,
   supplierId:"CURRENT-DEMO-"+organizationId,supplierName:"本账号已审核供货商（演示）",
   price:0,moq:Number(row.supply.moq)||1,stock:Number(row.supply.stock)||0,
   dispatch:row.supply.dispatch,origin:row.supply.origin,returns:row.supply.returns,
   supplyType:"待确认",warehouseCountry:"",shipToCountries:[],
   version:row.product.versionName,approved:"演示审核通过",images:[],
   skus:[{id:row.product.sku||"OWN-"+index,label:row.product.sku||"原始SKU",color:"待完善",size:"待完善",
    stock:Number(row.supply.stock)||0,price:0}]
  }));
  return [...selectedCatalogFixtures,...own];
 },[owned,organizationId]);
 useEffect(()=>{try{const k="shuomi:order-purchase:"+organizationId+":"+memberId;const raw=sessionStorage.getItem(k);if(!raw)return;const p=JSON.parse(raw);if(p.org!==organizationId||p.member!==memberId||p.source!=="硕米优选")return;const item=items.find(x=>x.id===p.productId&&x.skus.some(s=>s.id===p.skuId));if(!item){setNotice("订单关联的货盘商品或SKU已不可用，请核对供货来源。");sessionStorage.removeItem(k);return}setPurchase(p);setActive(item.id);setActiveSku(p.skuId);sessionStorage.removeItem(k)}catch{}},[organizationId,memberId,items]);
 const categories=["全部类目",...new Set(items.map(p=>p.category))];
 const origins=[...new Set(items.map(p=>p.warehouseCountry).filter((value):value is string=>Boolean(value)))].sort();
 const destinations=[...new Set(items.flatMap(p=>p.shipToCountries??[]))].sort();
 const filtered=items.filter(p=>(category==="全部类目"||p.category===category)&&
  (country==="全部货源"||p.warehouseCountry===country)&&
  (destination==="全部国家"||p.shipToCountries?.includes(destination))&&
  (supplyType==="全部"||p.supplyType===supplyType)&&
  (p.moq<=moqLimit)&&
  (!singleOnly||p.moq===1)&&(!dropshipOnly||p.dropship===true)&&
  (p.name+" "+p.id+" "+p.supplierName+" "+p.skus.map(s=>s.id).join(" ")).toLowerCase().includes(appliedQuery.toLowerCase()));
 const totalPages=Math.max(1,Math.ceil(filtered.length/pagesize));
 const sorted=[...filtered].sort((a,b)=>sortBy==="起订量升序"?a.moq-b.moq:sortBy==="价格升序"?a.price-b.price:sortBy==="价格降序"?b.price-a.price:0);
 const shown=sorted.slice((Math.min(page,totalPages)-1)*pagesize,Math.min(page,totalPages)*pagesize);
 const current=items.find(p=>p.id===active);
 const selectedForCollection=items.filter(p=>chosen.includes(p.id));
 const selectedSkusFor=(product:SelectedCatalogProduct)=>product.skus.filter(s=>isSkuIncluded(product.id,s.id));
 const selectedVariantCount=selectedForCollection.reduce((count,p)=>count+selectedSkusFor(p).length,0);
 const allDestinationCosts=selectedForCollection.flatMap(p=>selectedSkusFor(p).flatMap(s=>skuCountries(p,s).map(country=>costForCountry(p,s,country))));
 const incompleteCosts=allDestinationCosts.filter(q=>!q.complete);
 const collectionCostReady=allDestinationCosts.length>0&&incompleteCosts.length===0;
 const selectedSku=current?.skus.find(s=>s.id===activeSku)??current?.skus[0];
 const skuPhotos=selectedSku?.images?.length?selectedSku.images:(current?.images??[]);
 const activePhoto=skuPhotos.length?skuPhotos[Math.min(photoIndex,skuPhotos.length-1)]:null;
 const selectedCost=current&&selectedSku&&targetCountry?costForCountry(current,selectedSku,targetCountry):null;
 const terms=current&&selectedSku?{
  fees:skuFees(current,selectedSku),shipping:skuShipping(current,selectedSku),countries:skuCountries(current,selectedSku),
  origin:selectedSku.origin??current.origin,dispatch:selectedSku.dispatch??current.dispatch,
  warehouse:selectedSku.warehouseCountry??current.warehouseCountry,
  moq:selectedSku.moq??current.moq,dropship:selectedSku.dropship??current.dropship,
  weight:selectedSku.packagingWeightKg??current.packagingWeightKg,
  length:selectedSku.packagingLengthCm??current.packagingLengthCm,
  width:selectedSku.packagingWidthCm??current.packagingWidthCm,
  height:selectedSku.packagingHeightCm??current.packagingHeightCm
 }:null;
 const setSku=(id:string)=>{const next=current?.skus.find(s=>s.id===id);if(next&&current&&targetCountry&&!skuCountries(current,next).includes(targetCountry))setTargetCountry("");setActiveSku(id);setPhotoIndex(0);setImageFailed(false)};
 const openProduct=(id:string)=>{setActive(id);setActiveSku("");setPhotoIndex(0);setImageFailed(false);setTargetCountry("")};
 const ownedBatches=batches.filter(b=>b.source==="硕米优选");
 const confirmPurchase=()=>{if(!purchase||!current||current.id!==purchase.productId||selectedSku?.id!==purchase.skuId)return;if(current.moq>purchase.quantity||selectedSku.stock<purchase.quantity||selectedSku.price<=0){setNotice("当前供货条件不满足订单采购要求。");return}try{const key="shuomi:demo-orders:"+organizationId+":"+purchase.storeId;const rows=JSON.parse(localStorage.getItem(key)||"[]");const order=rows.find((o:{id:string;storeId:string;stage:number;purchaseId?:string})=>o.id===purchase.orderId&&o.storeId===purchase.storeId&&o.stage<3&&!o.purchaseId);if(!order)throw Error("订单不可采购或已采购");const id="SIM-PURCHASE-"+order.id;localStorage.setItem(key,JSON.stringify(rows.map((o:{id:string})=>o.id===order.id?{...o,fulfillmentSource:"硕米优选",supplyProductId:purchase.productId,supplySkuId:purchase.skuId,purchaseId:id,stage:1}:o)));window.dispatchEvent(new Event("shuomi:demo-orders-updated"));setPurchase(null);setActive(null);router.push("/workbench/store-orders?preview=1")}catch(e){setNotice(e instanceof Error?e.message:"采购保存失败")}};
 const submit=()=>{
  setError("");
  try{
   const selected=items.filter(p=>chosen.includes(p.id));
   if(selected.some(p=>!selectedSkusFor(p).length))throw Error("每款商品至少选择一个 SKU / 变体");
   const batch=addSelectedCatalogProducts(organizationId,memberId,selected.map(p=>toCollected(p,priceMode,selectedSkusFor(p))),
     batchMode==="new"?{kind:"new",name:batchName}:{kind:"existing",id:batchId});
   setCollectOpen(false);setActive(null);setChosen([]);setExcludedSkus([]);setTargetCountry("");setNotice("已将 "+selected.length+" 件商品、"+selectedVariantCount+" 个选定 SKU 保存到「我的数据 / 采集批次」："+batch.name+"。采集方式："+(priceMode==="landed"?"各国家总成本明细":"仅供货价格")+"；已保留货源与SKU关联。");
  }catch(e){setError(e instanceof Error?e.message:"保存失败")}
 };
 const choose=(id:string)=>setChosen(ids=>ids.includes(id)?ids.filter(v=>v!==id):[...ids,id]);
 useEffect(()=>{
  if(!active&&!collectOpen)return;
  const dismiss=(e:KeyboardEvent)=>{if(e.key==="Escape"){setActive(null);setCollectOpen(false)}};
  window.addEventListener("keydown",dismiss);return()=>window.removeEventListener("keydown",dismiss);
 },[active,collectOpen]);
 return <main className={css.page} aria-label="硕米优选" data-selected-market="true" data-organization={organizationId}>
  <header className={css.header}><div><small>供应市场 / 硕米优选</small><h1>硕米优选</h1><p>全球优质货源共享市场 · 现货、定制与 POD · 多仓供货 · 支持一件代发筛选</p></div><button type="button" onClick={()=>router.push("/workbench/supply/applications?preview=1")}>申请加入硕米优选</button></header>
  <section className={css.metrics} aria-label="货盘概览">
   {[["货盘商品",items.length],["供应商数量",new Set(items.map(p=>p.supplierId)).size],["货源国家",origins.length],["可配送国家",destinations.length]].map(([label,value])=><div key={label} className={css.metric}><strong>{value}</strong><span>{label}</span></div>)}
  </section>
  <section className={css.products} aria-label="货盘商品">
   <div className={css.toolbar}><div><h2>优选商品</h2><p>供货、配送与一件代发信息均为演示资料，正式业务以供应商审核的仓库履约规则为准。</p></div></div>
   <div className={css.filterPanel} aria-label="货盘筛选条件">
    <label className={css.filterField}>货源国家<select aria-label="货源国家" value={country} onChange={e=>{setCountry(e.target.value);setPage(1)}}><option>全部货源</option>{origins.map(v=><option key={v}>{v}</option>)}</select></label>
    <label className={css.filterField}>可配送国家<select aria-label="可配送国家" value={destination} onChange={e=>{setDestination(e.target.value);setPage(1)}}><option>全部国家</option>{destinations.map(v=><option key={v}>{v}</option>)}</select></label>
    <fieldset className={css.supplyTypeField}><legend>供货类型</legend><div className={css.segmented}>{["全部","现货","定制","POD"].map(t=><button type="button" key={t} className={supplyType===t?css.selected:""} aria-pressed={supplyType===t} onClick={()=>{setSupplyType(t);setPage(1)}}>{t}</button>)}</div></fieldset>
    <label className={css.moqSliderField}>起订量（MOQ） <strong>≤ {moqLimit} 件</strong><input type="range" aria-label="起订量" min="1" max="100" step="1" value={moqLimit} onChange={e=>{setMoqLimit(Number(e.target.value));setPage(1)}}/><span>1 件 <small>100 件</small></span></label>
    <div className={css.checkFilters}>
     <label><input type="checkbox" checked={singleOnly} onChange={e=>{setSingleOnly(e.target.checked);setPage(1)}}/>仅看 1 件起订</label>
     <label><input type="checkbox" checked={dropshipOnly} onChange={e=>{setDropshipOnly(e.target.checked);setPage(1)}}/>仅看支持一件代发</label>
    </div>
    <label className={css.filterField}>商品类目<select aria-label="商品类目" value={category} onChange={e=>{setCategory(e.target.value);setPage(1)}}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
    <div className={css.search}><Search size={17}/><input aria-label="搜索优选商品" placeholder="搜索商品、SKU或供货商" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){setAppliedQuery(query.trim());setPage(1)}}}/></div>
    <button type="button" className={css.primary} onClick={()=>{setAppliedQuery(query.trim());setPage(1)}}>确定</button>
   </div>
   <div className={css.listBar}>
    <nav className={css.typeTabs} aria-label="商品供货类型">{["全部","现货","定制","POD"].map(t=><button type="button" key={t} className={supplyType===t?css.selected:""} aria-pressed={supplyType===t} onClick={()=>{setSupplyType(t);setPage(1)}}>{t==="全部"?"全部商品":t}（{items.filter(p=>t==="全部"||p.supplyType===t).length}）</button>)}</nav>
    <select aria-label="商品排序" value={sortBy} onChange={e=>setSortBy(e.target.value)}><option>综合排序</option><option>起订量升序</option><option>价格升序</option><option>价格降序</option></select>
   </div>
   {filtered.length?<><div className={css.grid}>
    {shown.map(item=><article key={item.id} className={css.product} data-selected-product={item.id}>
     <div className={css.placeholder}><PackageSearch size={32}/><small>暂无商品图片</small><label className={css.selectItem}><input type="checkbox" aria-label={"选择"+item.name} checked={chosen.includes(item.id)} onChange={()=>choose(item.id)}/>选择</label></div>
     <div className={css.details}>
      <h3>{item.name}</h3>
      <div className={css.cardBadges}><span className={css.countryTag}>{item.warehouseCountry?item.warehouseCountry+"仓":"仓库待确认"}</span><span className={item.supplyType==="POD"?css.typePod:item.supplyType==="定制"?css.typeCustom:item.supplyType==="现货"?css.typeStock:css.typeUnknown}>{item.supplyType??"待确认"}</span></div>
      <p title={item.supplierName}>{item.supplierName}</p>
      <div className={css.offerInfo}><span>起订量 <strong>{item.moq} 件</strong></span><span className={item.dropship===true?css.dropshipYes:css.dropshipNeutral}>{item.dropship===true?"✓ 支持一件代发":item.dropship===false?"不支持一件代发":"一件代发待确认"}</span></div>
      <div className={css.price}>{item.price>0?"¥"+item.price.toFixed(2)+" 起":"供货价待核"}</div>
      <div className={css.shipping}>可配送：{item.shipToCountries?.length?item.shipToCountries.join("、"):"待确认"}</div>
      <div className={css.cardActions}><button type="button" onClick={()=>openProduct(item.id)}>查看详情</button><button type="button" className={css.primary} onClick={()=>{setChosen([item.id]);setTargetCountry("");setCollectOpen(true);setError("")}}>加入采集批次</button></div>
     </div></article>)}
   </div><div className={css.pagination}><span>共 {filtered.length} 件商品</span><div><button type="button" disabled={page<=1} onClick={()=>setPage(v=>v-1)}>上一页</button><span>{Math.min(page,totalPages)} / {totalPages}</span><button type="button" disabled={page>=totalPages} onClick={()=>setPage(v=>v+1)}>下一页</button></div></div></>:
   <div className={css.empty}><PackageSearch size={30}/><h3>没有找到符合条件的商品</h3><p>请调整货源、配送国家、供货类型或搜索条件。</p></div>}
  </section>
  {notice?<div className={css.notice} role="status"><CheckCircle2 size={18}/>{notice}<button type="button" onClick={()=>router.push("/workbench/data/mine?preview=1")}>前往我的数据</button></div>:null}
  {chosen.length?<div className={css.bulk}><span>已选择 {chosen.length} 件商品</span><button type="button" className={css.primary} onClick={()=>{setTargetCountry("");setCollectOpen(true);setError("")}}>加入我的采集批次</button><button type="button" onClick={()=>setChosen([])}>取消选择</button></div>:null}
  <p className={css.disclaimer}>本页为前端演示货盘。模拟审核、供应商、价格、库存和配送范围不代表真实认证；正式跨企业共享及供货交易须接入服务端权限、审核、库存和结算接口。当前只创建个人采集副本，不自动上架或采购。加入硕米优选不保证订单。</p>
  {current&&!collectOpen?<div className={css.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setActive(null)}}><section className={css.modal} role="dialog" aria-modal="true" aria-label="优选商品详情"><header><h2>商品与供货信息</h2><button type="button" onClick={()=>setActive(null)}>关闭</button></header>
   <div className={css.modalBody}><aside className={css.galleryColumn}>
    <div className={css.squareGallery} aria-label="商品图片轮播">
     {activePhoto&&!imageFailed?<img key={activePhoto} src={activePhoto} alt={current.name+" · "+(selectedSku?.label||"商品")+" · 图片 "+(photoIndex+1)} onError={()=>setImageFailed(true)}/>:<div className={css.emptySquare}><PackageSearch size={42}/><span>{skuPhotos.length?"图片暂不可用":"暂无商品图片"}</span></div>}
     {skuPhotos.length>1?<div className={css.galleryPaging}><button type="button" aria-label="上一张商品图片" onClick={()=>{setPhotoIndex(v=>(v+skuPhotos.length-1)%skuPhotos.length);setImageFailed(false)}}>上一张</button><span>{Math.min(photoIndex+1,skuPhotos.length)} / {skuPhotos.length}</span><button type="button" aria-label="下一张商品图片" onClick={()=>{setPhotoIndex(v=>(v+1)%skuPhotos.length);setImageFailed(false)}}>下一张</button></div>:null}
    </div>
    {skuPhotos.length>1?<div className={css.galleryThumbs}>{skuPhotos.map((src,i)=><button type="button" aria-label={"查看商品图片 "+(i+1)} key={src+"-"+i} aria-pressed={photoIndex===i} onClick={()=>{setPhotoIndex(i);setImageFailed(false)}}><img src={src} alt={"缩略图 "+(i+1)}/></button>)}</div>:null}
    <div className={css.variantPicker}><strong>选择 SKU / 变体</strong><div className={css.variantChoices}>{current.skus.map(s=><button type="button" aria-label={"选择变体 "+s.label} aria-pressed={selectedSku?.id===s.id} key={s.id} onClick={()=>setSku(s.id)}>{s.label}</button>)}</div>
     {selectedSku?<div className={css.variantFacts}><span>SKU：{selectedSku.id}</span><span>供货价：{selectedSku.price>0?formatMoney(selectedSku.price,current.quotationCurrency||"CNY"):"待供应商报价"}</span><span>库存：{selectedSku.stock}</span></div>:null}
    </div>

   </aside><div className={css.productOverview}><h3>{current.name}</h3><p>{current.description}</p><dl><dt>供货商</dt><dd>{current.supplierName}</dd><dt>认证状态</dt><dd>演示审核通过</dd><dt>货盘商品 ID</dt><dd>{current.id}</dd><dt>商品类目</dt><dd>{current.category}</dd><dt>供货类型</dt><dd>{current.supplyType??"待确认"}</dd><dt>货源国家</dt><dd>{terms?.warehouse||"待确认"}</dd><dt>一件代发</dt><dd>{terms?.dropship===true?"支持":terms?.dropship===false?"不支持":"待确认"}</dd><dt>来源版本</dt><dd>{current.version}</dd>
    
    <dt>当前 SKU</dt><dd>{selectedSku?.label||"待选择"} · {selectedSku?.id||"—"}</dd><dt>SKU 供货价</dt><dd>{selectedSku?.price?formatMoney(selectedSku.price,current.quotationCurrency||"CNY"):"待报价"}</dd><dt>SKU 库存</dt><dd>{selectedSku?.stock??"待提供"}</dd><dt>起订量</dt><dd>{terms?.moq??"待确认"}</dd><dt>发货地</dt><dd>{terms?.origin||"待确认"}</dd><dt>备货 / 出库时效</dt><dd>{terms?.dispatch||"待供应商提供"}</dd>
    <dt>包装重量</dt><dd>{terms?.weight!==undefined?terms.weight.toFixed(2)+" kg（演示）":"待供应商提供"}</dd>
    <dt>包装尺寸</dt><dd>{terms?.length&&terms.width&&terms.height?`${terms.length} × ${terms.width} × ${terms.height} cm（演示）`:"待供应商提供"}</dd>
    <dt>包装体积</dt><dd>{terms?.length&&terms.width&&terms.height?(terms.length*terms.width*terms.height/1000000).toFixed(4)+" m³（演示）":"待供应商提供"}</dd><dt>售后说明</dt><dd>{current.returns}</dd></dl></div></div>
   <section className={css.costEstimator} aria-label="目标国家成本测算">
    <header><h3>目标国家及成本</h3><label>目标国家<select aria-label="选择目标国家" value={targetCountry} onChange={e=>setTargetCountry(e.target.value)}><option value="">请选择配送国家</option>{(terms?.countries||[]).map(c=><option key={c} value={c}>{c}</option>)}</select></label></header>
    <div className={css.costBreakdown}>
     <div><span>SKU 供货价</span><strong>{selectedSku?.price?formatMoney(selectedSku.price,current.quotationCurrency||"CNY"):"待报价"}</strong></div>
     <div><span>质检 / 打包 / 贴标</span><strong>{terms?.fees?.inspection!=null&&terms.fees.packing!=null&&terms.fees.labeling!=null?formatMoney(terms.fees.inspection+terms.fees.packing+terms.fees.labeling,terms.fees.currency):"待报价"}</strong></div>
     <div><span>目标国家运费</span><strong>{targetCountry?(terms?.shipping.find(q=>q.country===targetCountry)?.freight!=null?formatMoney(terms.shipping.find(q=>q.country===targetCountry)!.freight!,terms.shipping.find(q=>q.country===targetCountry)!.currency):"待报价"):"请选择国家"}</strong></div>
     <div className={css.costTotal}><span>预计单件总成本</span><strong>{selectedCost?.unitTotal!=null?formatMoney(selectedCost.unitTotal,selectedCost.currency):"—"}</strong></div>
    </div>
    <small>演示测算，不含税费、平台佣金及其他未报价费用。切换国家或 SKU 自动更新。</small>
   </section>
   <section className={css.logisticsSection} aria-label="各国家物流报价"><header><h3>各国家运费与配送时效</h3><span>演示报价，正式以供应商确认及实际重量、体积为准</span></header>
    <div className={css.skuTable}><table><thead><tr><th>配送国家</th><th>运输方式</th><th>预计运费 / 件</th><th>运输时效</th></tr></thead><tbody>
    {(terms?.countries||[]).map(country=>{const quote=terms?.shipping.find(q=>q.country===country);return <tr key={country}><td>{country}</td><td>{quote?.method||"待确认"}</td><td>{quote?.freight===null||quote?.freight===undefined?"待供应商报价":formatMoney(quote.freight,quote.currency)+"（演示）"}</td><td>{quote?.transitDays||"待供应商提供"}</td></tr>})}
    {!terms?.countries.length?<tr><td colSpan={4}>当前 SKU 可配送国家及物流报价待供应商提供</td></tr>:null}
    </tbody></table></div><p>运输时效不包含备货 / 出库时间；具体费用需按 SKU、数量、目的地邮编与计费重量核算。</p></section>
   <footer><button type="button" onClick={()=>{setActive(null);setPurchase(null)}}>取消</button>{purchase&&purchase.productId===current.id?<><span>关联订单 {purchase.orderId} · {purchase.quantity} 件 · 模拟采购</span><button type="button" className={css.primary} disabled={selectedSku?.id!==purchase.skuId||!selectedSku||current.moq>purchase.quantity||selectedSku.stock<purchase.quantity||selectedSku.price<=0} onClick={confirmPurchase}>确认模拟采购</button></>:<button type="button" className={css.primary} onClick={()=>{setChosen([current.id]);setCollectOpen(true);setError("")}}>加入采集批次</button>}</footer>
  </section></div>:null}
  {collectOpen?<div className={css.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setCollectOpen(false)}}><section className={css.modal} role="dialog" aria-modal="true" aria-label="加入我的采集批次">
   <header><h2>加入我的采集批次</h2><button type="button" onClick={()=>setCollectOpen(false)}>关闭</button></header>
   <p>已选择 {chosen.length} 件商品、{selectedVariantCount} 个 SKU。默认采集全部变体，可取消不需要的颜色和规格；不修改共享货盘源数据。</p>
   <section className={css.collectionVariants} aria-label="选择采集变体">
    <div className={css.collectionVariantsTitle}><strong>选择采集的 SKU / 变体</strong><span>已选 {selectedVariantCount} / {selectedForCollection.reduce((n,p)=>n+p.skus.length,0)} 个</span></div>
    {selectedForCollection.map(product=><div className={css.collectionVariantGroup} key={product.id}>
     <div className={css.collectionVariantHead}><strong>{product.name}</strong><label><input type="checkbox" aria-label={"全选"+product.name+"变体"} checked={product.skus.every(s=>isSkuIncluded(product.id,s.id))} onChange={e=>toggleAllSkus(product,e.target.checked)}/>全选本商品</label></div>
     <div className={css.collectionVariantOptions}>{product.skus.map(s=><label key={s.id} className={css.collectionVariantOption}><input type="checkbox" aria-label={"采集变体 "+product.name+" "+s.label} checked={isSkuIncluded(product.id,s.id)} onChange={()=>toggleSku(product.id,s.id)}/><span><strong>{s.label}</strong><small>{s.id} · {s.price>0?formatMoney(s.price,product.quotationCurrency||"CNY"):"待报价"}</small></span></label>)}</div>
     {!selectedSkusFor(product).length?<small className={css.variantWarning}>请至少选择一个变体</small>:null}
    </div>)}
   </section>
   <div className={css.collectionPricing}>
    <fieldset><legend>采集价格方式</legend><label><input type="radio" name="collection-price-mode" checked={priceMode==="landed"} onChange={()=>setPriceMode("landed")}/>按总成本采集</label><label><input type="radio" name="collection-price-mode" checked={priceMode==="supply"} onChange={()=>setPriceMode("supply")}/>只采集供货价格</label></fieldset>
    <p>{priceMode==="landed"?"按已选 SKU 采集全部可配送国家的供货价、质检、打包、贴标、运费及单件总成本。": "采集已选 SKU 的供货价及其可配送国家资料，不以任何国家运费覆盖供货价。"}<br/>{priceMode==="landed"?(collectionCostReady?"全部已提供的国家报价完整，可分别保留。":"其中 "+incompleteCosts.length+" 条 SKU / 国家报价不完整，仍保留为“待报价”，不计算虚假总价。"):"不同国家运费作为供货资料保留，不计入采集价格。"} 演示报价仅供参考。</p>
   </div>
   <div className={css.modeChoices}><label><input type="radio" name="batch-mode" checked={batchMode==="new"} onChange={()=>setBatchMode("new")}/>创建新批次</label><label><input type="radio" name="batch-mode" checked={batchMode==="existing"} onChange={()=>setBatchMode("existing")}/>加入已有批次</label></div>
   {batchMode==="new"?<label className={css.inputField}>批次名称<input aria-label="新批次名称" maxLength={80} value={batchName} onChange={e=>setBatchName(e.target.value)}/></label>:
    <label className={css.inputField}>选择已有硕米优选批次<select aria-label="选择已有批次" value={batchId} onChange={e=>setBatchId(e.target.value)}><option value="">请选择批次</option>{ownedBatches.map(b=><option key={b.id} value={b.id}>{b.name}（{b.products.length} 件）</option>)}</select></label>}
   <p className={css.modalNote}>保存后在「我的数据 → 采集批次」查看，可继续按目标平台进行智能体优化、字段补全和刊登。没有自动购买或上架。</p>
   {error?<p className={css.error} role="alert">{error}</p>:null}
   <footer><button type="button" onClick={()=>setCollectOpen(false)}>取消</button><button type="button" className={css.primary} onClick={submit}>确认加入</button></footer>
  </section></div>:null}
 </main>;
}
