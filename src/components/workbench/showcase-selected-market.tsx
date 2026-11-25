"use client";
import {useEffect,useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {PackageSearch,Search,ShieldCheck,CheckCircle2} from "lucide-react";
import {preferredApplicationChanged,readDemoSelectedCatalog} from "./preferred-application-store";
import {selectedCatalogFixtures,type SelectedCatalogProduct} from "./showcase-selected-catalog-fixtures";
import {readDemoCollectionBatches,addSelectedCatalogProducts,type DemoCollectedProduct,type DemoCollectionBatch} from "./showcase-collection-batches";
import css from "./showcase-selected-market.module.css";

const pagesize=8;
function toCollected(product:SelectedCatalogProduct):DemoCollectedProduct{
 return {
  id:"COLLECT-"+product.id,sku:product.skus[0]?.id??product.id,
  name:product.name,originalTitle:product.name,description:product.description,
  source:"硕米优选（演示） · "+product.supplierName,
  supplyProductId:product.id,supplySkuId:product.skus[0]?.id,
  supplierId:product.supplierId,supplierName:product.supplierName,
  supplyVersion:product.version,price:"¥"+product.price.toFixed(2)+" 起",
  images:[],variants:product.skus.map(s=>s.label),variantCount:product.skus.length,
  variantDetails:product.skus.map(s=>({sku:s.id,label:s.label,color:s.color,size:s.size,
   image:"",images:[],price:String(s.price),stock:String(s.stock),description:product.description})),
  status:"演示数据"
 };
}
export function ShowcaseSelectedMarket({organizationId,memberId}:{organizationId:string;memberId:string}){
 const router=useRouter();
 const [revision,setRevision]=useState(0);
 const [query,setQuery]=useState(""),[appliedQuery,setAppliedQuery]=useState("");
 const [category,setCategory]=useState("全部类目"),[page,setPage]=useState(1);
 const [active,setActive]=useState<string|null>(null),[chosen,setChosen]=useState<string[]>([]);
 const [collectOpen,setCollectOpen]=useState(false),[batchMode,setBatchMode]=useState<"new"|"existing">("new");
 const [batchName,setBatchName]=useState("硕米优选采集批次"),[batchId,setBatchId]=useState("");
 const [batches,setBatches]=useState<DemoCollectionBatch[]>([]);
 const [notice,setNotice]=useState(""),[error,setError]=useState("");
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
   version:row.product.versionName,approved:"演示审核通过",images:[],
   skus:[{id:row.product.sku||"OWN-"+index,label:row.product.sku||"原始SKU",color:"待完善",size:"待完善",
    stock:Number(row.supply.stock)||0,price:0}]
  }));
  return [...selectedCatalogFixtures,...own];
 },[owned,organizationId]);
 const categories=["全部类目",...new Set(items.map(p=>p.category))];
 const filtered=items.filter(p=>(category==="全部类目"||p.category===category)&&
  (p.name+" "+p.id+" "+p.supplierName+" "+p.skus.map(s=>s.id).join(" ")).toLowerCase().includes(appliedQuery.toLowerCase()));
 const totalPages=Math.max(1,Math.ceil(filtered.length/pagesize));
 const shown=filtered.slice((Math.min(page,totalPages)-1)*pagesize,Math.min(page,totalPages)*pagesize);
 const current=items.find(p=>p.id===active);
 const ownedBatches=batches.filter(b=>b.source==="硕米优选");
 const submit=()=>{
  setError("");
  try{
   const selected=items.filter(p=>chosen.includes(p.id));
   const batch=addSelectedCatalogProducts(organizationId,memberId,selected.map(toCollected),
     batchMode==="new"?{kind:"new",name:batchName}:{kind:"existing",id:batchId});
   setCollectOpen(false);setActive(null);setChosen([]);setNotice("已将 "+selected.length+" 件商品保存到「我的数据 / 采集批次」："+batch.name+"。保留供货商、来源商品ID和SKU关联。");
  }catch(e){setError(e instanceof Error?e.message:"保存失败")}
 };
 const choose=(id:string)=>setChosen(ids=>ids.includes(id)?ids.filter(v=>v!==id):[...ids,id]);
 useEffect(()=>{
  if(!active&&!collectOpen)return;
  const dismiss=(e:KeyboardEvent)=>{if(e.key==="Escape"){setActive(null);setCollectOpen(false)}};
  window.addEventListener("keydown",dismiss);return()=>window.removeEventListener("keydown",dismiss);
 },[active,collectOpen]);
 return <main className={css.page} aria-label="硕米优选" data-selected-market="true" data-organization={organizationId}>
  <header className={css.header}><div><small>供应市场 / 硕米优选</small><h1>硕米优选</h1><p>硕米优选共享货盘 · 已通过审核的供货商商品，面向平台卖家提供选品和数据采集。</p></div><button type="button" onClick={()=>router.push("/workbench/supply/applications?preview=1")}>申请加入硕米优选</button></header>
  <section className={css.metrics} aria-label="货盘概览">
   {[["共享商品",items.length],["演示供货商",new Set(items.map(p=>p.supplierId)).size],["商品类目",new Set(items.map(p=>p.category)).size],["已选商品",chosen.length]].map(([label,value])=><div key={label} className={css.metric}><strong>{value}</strong><span>{label}</span></div>)}
  </section>
  <section className={css.products} aria-label="共享货盘商品">
   <div className={css.toolbar}><div><h2>优选商品</h2><p>演示商品图片暂留空；供货价、库存和认证均为模拟，非正式跨企业商品数据。</p></div><div className={css.filters}>
    <div className={css.search}><Search size={17}/><input aria-label="搜索优选商品" placeholder="搜索商品、SKU或供货商" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){setAppliedQuery(query.trim());setPage(1)}}}/></div>
    <select aria-label="商品类目" value={category} onChange={e=>{setCategory(e.target.value);setPage(1)}}>{categories.map(c=><option key={c}>{c}</option>)}</select>
    <button type="button" className={css.primary} onClick={()=>{setAppliedQuery(query.trim());setPage(1)}}>确定</button>
   </div></div>
   {filtered.length?<><div className={css.grid}>
    {shown.map(item=><article key={item.id} className={css.product} data-selected-product={item.id}>
     <div className={css.placeholder}><PackageSearch size={32}/><small>暂无商品图片</small><label className={css.selectItem}><input type="checkbox" aria-label={"选择"+item.name} checked={chosen.includes(item.id)} onChange={()=>choose(item.id)}/>选择</label></div>
     <div className={css.details}><span className={css.approved}><ShieldCheck size={14}/>演示审核通过</span><h3>{item.name}</h3><p>{item.supplierName}</p><div className={css.price}>{item.price>0?"¥"+item.price.toFixed(2)+" 起":"供货价待核"}</div><div className={css.tags}><span>SKU {item.skus.length}</span><span>起订 {item.moq}</span><span>库存 {item.stock}</span></div>
      <div className={css.cardActions}><button type="button" onClick={()=>setActive(item.id)}>查看详情</button><button type="button" className={css.primary} onClick={()=>{setChosen([item.id]);setCollectOpen(true);setError("")}}>加入采集批次</button></div>
     </div></article>)}
   </div><div className={css.pagination}><span>共 {filtered.length} 件商品</span><div><button type="button" disabled={page<=1} onClick={()=>setPage(v=>v-1)}>上一页</button><span>{Math.min(page,totalPages)} / {totalPages}</span><button type="button" disabled={page>=totalPages} onClick={()=>setPage(v=>v+1)}>下一页</button></div></div></>:
   <div className={css.empty}><PackageSearch size={30}/><h3>没有找到符合条件的商品</h3><p>可以尝试更换商品名称或类目。</p></div>}
  </section>
  {notice?<div className={css.notice} role="status"><CheckCircle2 size={18}/>{notice}<button type="button" onClick={()=>router.push("/workbench/data/mine?preview=1")}>前往我的数据</button></div>:null}
  {chosen.length?<div className={css.bulk}><span>已选择 {chosen.length} 件商品</span><button type="button" className={css.primary} onClick={()=>{setCollectOpen(true);setError("")}}>加入我的采集批次</button><button type="button" onClick={()=>setChosen([])}>取消选择</button></div>:null}
  <p className={css.disclaimer}>本页为前端演示货盘。模拟审核、供应商、价格、库存不代表真实认证；正式跨企业共享及供货交易须接入服务端权限、审核、库存和结算接口。当前只创建个人采集副本，不自动上架或采购。</p>
  {current&&!collectOpen?<div className={css.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setActive(null)}}><section className={css.modal} role="dialog" aria-modal="true" aria-label="优选商品详情"><header><h2>商品与供货信息</h2><button type="button" onClick={()=>setActive(null)}>关闭</button></header>
   <div className={css.modalBody}><div className={css.modalPicture}><PackageSearch size={44}/><span>暂无商品图片</span></div><div><h3>{current.name}</h3><p>{current.description}</p><dl><dt>供货商</dt><dd>{current.supplierName}</dd><dt>认证状态</dt><dd>演示审核通过</dd><dt>货盘商品 ID</dt><dd>{current.id}</dd><dt>商品类目</dt><dd>{current.category}</dd><dt>来源版本</dt><dd>{current.version}</dd><dt>供货价</dt><dd>{current.price>0?"¥"+current.price.toFixed(2)+" 起":"待核"}</dd><dt>库存</dt><dd>{current.stock}</dd><dt>起订量</dt><dd>{current.moq}</dd><dt>发货地</dt><dd>{current.origin}</dd><dt>发货时效</dt><dd>{current.dispatch}</dd><dt>售后说明</dt><dd>{current.returns}</dd></dl></div></div>
   <h3 className={css.skuTitle}>供货 SKU 与变体</h3><div className={css.skuTable}><table><thead><tr><th>SKU</th><th>规格</th><th>供货价</th><th>演示库存</th></tr></thead><tbody>{current.skus.map(s=><tr key={s.id}><td>{s.id}</td><td>{s.label}</td><td>{s.price>0?"¥"+s.price.toFixed(2):"待核"}</td><td>{s.stock}</td></tr>)}</tbody></table></div>
   <footer><button type="button" onClick={()=>setActive(null)}>取消</button><button type="button" className={css.primary} onClick={()=>{setChosen([current.id]);setCollectOpen(true);setError("")}}>加入采集批次</button></footer>
  </section></div>:null}
  {collectOpen?<div className={css.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setCollectOpen(false)}}><section className={css.modal} role="dialog" aria-modal="true" aria-label="加入我的采集批次">
   <header><h2>加入我的采集批次</h2><button type="button" onClick={()=>setCollectOpen(false)}>关闭</button></header><p>已选择 {chosen.length} 件商品。将复制商品资料及关联 ID 到当前账号，不修改共享货盘源数据。</p>
   <div className={css.modeChoices}><label><input type="radio" name="batch-mode" checked={batchMode==="new"} onChange={()=>setBatchMode("new")}/>创建新批次</label><label><input type="radio" name="batch-mode" checked={batchMode==="existing"} onChange={()=>setBatchMode("existing")}/>加入已有批次</label></div>
   {batchMode==="new"?<label className={css.inputField}>批次名称<input aria-label="新批次名称" maxLength={80} value={batchName} onChange={e=>setBatchName(e.target.value)}/></label>:
    <label className={css.inputField}>选择已有硕米优选批次<select aria-label="选择已有批次" value={batchId} onChange={e=>setBatchId(e.target.value)}><option value="">请选择批次</option>{ownedBatches.map(b=><option key={b.id} value={b.id}>{b.name}（{b.products.length} 件）</option>)}</select></label>}
   <p className={css.modalNote}>保存后在「我的数据 → 采集批次」查看，可继续按目标平台进行智能体优化、字段补全和刊登。没有自动购买或上架。</p>
   {error?<p className={css.error} role="alert">{error}</p>:null}
   <footer><button type="button" onClick={()=>setCollectOpen(false)}>取消</button><button type="button" className={css.primary} onClick={submit}>确认加入</button></footer>
  </section></div>:null}
 </main>;
}
