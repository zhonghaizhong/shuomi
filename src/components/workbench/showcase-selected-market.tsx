"use client";
import {useEffect,useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {BadgeCheck,PackageSearch,Search,ShieldCheck,Star,Users} from "lucide-react";
import {preferredApplicationChanged,readDemoSelectedCatalog} from "./preferred-application-store";
import css from "./showcase-selected-market.module.css";

export function ShowcaseSelectedMarket({organizationId,memberId}:{organizationId:string;memberId:string}){
 const router=useRouter();
 const [version,setVersion]=useState(0),[query,setQuery]=useState(""),[active,setActive]=useState<string|null>(null);
 useEffect(()=>{
  const refresh=(e:Event)=>{
   const d=(e as CustomEvent<{organizationId:string;memberId:string}>).detail;
   if(d?.organizationId===organizationId&&d.memberId===memberId)setVersion(v=>v+1);
  };
  window.addEventListener(preferredApplicationChanged,refresh);
  return()=>window.removeEventListener(preferredApplicationChanged,refresh);
 },[organizationId,memberId]);
 const rows=useMemo(()=>readDemoSelectedCatalog(organizationId,memberId),[organizationId,memberId,version]);
 const filtered=rows.filter(r=>(r.product.name+" "+r.product.sku+" "+r.product.platform).toLowerCase().includes(query.trim().toLowerCase()));
 const current=rows.find(r=>r.product.sourceProductId===active);
 useEffect(()=>{
  if(!active)return;
  const escape=(e:KeyboardEvent)=>{if(e.key==="Escape")setActive(null)};
  window.addEventListener("keydown",escape);return()=>window.removeEventListener("keydown",escape);
 },[active]);
 return <main className={css.page} aria-label="硕米优选" data-selected-market="true" data-organization={organizationId}>
  <header className={css.header}><div><small>供应市场 / 硕米优选</small><h1>硕米优选</h1><p>展示通过硕米优选审核的商品，帮助选品方了解商品特点与供货条件。</p></div><button type="button" onClick={()=>router.push("/workbench/supply/applications?preview=1")}>申请加入硕米优选</button></header>
  <section className={css.intro} aria-label="硕米优选价值">
   <article><Star size={21}/><div><strong>精选商品展示</strong><p>审核通过后进入优选展示区域，方便需求方发现商品。</p></div></article>
   <article><BadgeCheck size={21}/><div><strong>可核对商品信息</strong><p>展示商品版本、规格与供货要求，让选品判断更高效。</p></div></article>
   <article><Users size={21}/><div><strong>合作机会更清晰</strong><p>让有合作需求的用户了解供货能力，便于后续沟通。</p></div></article>
  </section>
  <section className={css.products} aria-label="已入选商品">
   <div className={css.toolbar}><div><h2>优选商品</h2><p>当前展示的是本账号演示审核通过的商品，平台全量优选资源需连接正式服务。</p></div><div className={css.search}><Search size={18}/><input aria-label="搜索优选商品" placeholder="搜索商品名称或SKU" value={query} onChange={e=>setQuery(e.target.value)}/></div></div>
   {filtered.length?<div className={css.grid}>
    {filtered.map(row=><article key={row.product.sourceProductId} className={css.product} data-selected-product={row.product.sourceProductId}>
     {row.product.image?<img src={row.product.image} alt={row.product.name}/>:<div className={css.placeholder}><PackageSearch size={36}/><small>暂无商品图片</small></div>}
     <div className={css.details}><span className={css.approved}><ShieldCheck size={15}/>演示审核通过</span><h3>{row.product.name}</h3><p>{row.product.versionName} · {row.product.platform} / {row.product.site}</p><div className={css.tags}><span>起订 {row.supply.moq}</span><span>库存 {row.supply.stock}</span><span>{row.supply.dispatch}</span></div><button type="button" onClick={()=>setActive(row.product.sourceProductId)}>查看商品与供货信息</button></div>
    </article>)}
   </div>:<div className={css.empty}><PackageSearch size={34}/><h3>{query?"没有匹配的优选商品":"暂无已审核通过的优选商品"}</h3><p>{query?"请更换商品名称或SKU关键词。":"自有商品完成首次适配和智能体优化后，可在「优选申请」中提交。审核通过的商品会显示在这里。"}</p><button type="button" onClick={()=>router.push("/workbench/supply/applications?preview=1")}>前往优选申请</button></div>}
  </section>
  <p className={css.disclaimer}>本页仅展示当前账号的浏览器演示记录。正式优选商品池、跨企业可见范围、供需对接和交易能力需由后台审核和授权服务实现；优选入驻不保证订单。</p>
  {current?<div className={css.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setActive(null)}}>
   <section className={css.modal} role="dialog" aria-modal="true" aria-label="优选商品详情"><header><h2>优选商品详情</h2><button type="button" onClick={()=>setActive(null)}>关闭</button></header><div className={css.modalBody}>{current.product.image?<img src={current.product.image} alt={current.product.name}/>:null}<div><h3>{current.product.name}</h3><p>{current.product.description}</p><dl><dt>商品版本</dt><dd>{current.product.versionName}</dd><dt>平台及站点</dt><dd>{current.product.platform} / {current.product.site}</dd><dt>SKU 数量</dt><dd>{current.product.skuCount}</dd><dt>可供库存</dt><dd>{current.supply.stock}</dd><dt>起订量</dt><dd>{current.supply.moq}</dd><dt>发货地</dt><dd>{current.supply.origin}</dd><dt>发货时效</dt><dd>{current.supply.dispatch}</dd><dt>供货价格说明</dt><dd>{current.supply.pricing||"待双方确认"}</dd><dt>售后保障</dt><dd>{current.supply.returns}</dd></dl></div></div><p className={css.modalNote}>仅供演示，暂无真实的采购、联系供应商或下单服务。</p></section>
  </div>:null}
 </main>;
}