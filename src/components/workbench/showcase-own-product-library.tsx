"use client";
import {Fragment,useEffect,useMemo,useState} from "react";
import {readOwnProductBatches,readOwnProducts,listOwnReadyProducts,ownProductUpdated,type OwnProductRecord} from "./showcase-own-product-data";
import css from "./showcase-own-product-library.module.css";
export function ShowcaseOwnProductLibrary({organizationId,memberId}:{organizationId:string;memberId:string}){
 const [version,setVersion]=useState(0),[batchId,setBatchId]=useState(""),[search,setSearch]=useState(""),[selected,setSelected]=useState<OwnProductRecord|null>(null),[image,setImage]=useState<string|null>(null);
 useEffect(()=>{const refresh=(e:Event)=>{const d=(e as CustomEvent<{organizationId:string;memberId:string}>).detail;if(d?.organizationId===organizationId&&d?.memberId===memberId)setVersion(v=>v+1)};window.addEventListener(ownProductUpdated,refresh);return()=>window.removeEventListener(ownProductUpdated,refresh)},[organizationId,memberId]);
 // version tracks the shared session store event; selecting tabs remounts this component.
 const batches=useMemo(()=>readOwnProductBatches(organizationId,memberId),[organizationId,memberId,version]);
 const products=useMemo(()=>listOwnReadyProducts(organizationId,memberId),[organizationId,memberId,version]);
 const pendingCount=useMemo(()=>readOwnProducts(organizationId,memberId).filter(p=>p.status==="入库待完善").length,[organizationId,memberId,version]);
 const allProducts=useMemo(()=>readOwnProducts(organizationId,memberId),[organizationId,memberId,version]);
 const filtered=products.filter(p=>(!batchId||p.batchId===batchId)&&(p.name+" "+p.skus.map(s=>s.name).join(" ")).toLowerCase().includes(search.trim().toLowerCase()));
 const visibleBatches=batches.filter(b=>(!batchId||b.id===batchId)&&(!search.trim()||b.name.toLowerCase().includes(search.trim().toLowerCase())||filtered.some(p=>p.batchId===b.id)));
 const [expanded,setExpanded]=useState<string[]>([]);
 const toggleExpanded=(id:string)=>setExpanded(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id]);
 const current=selected?products.find(p=>p.id===selected.id):null;
 return <section className={css.library} aria-label="自有商品库">
  <header><div><h2>自有商品库</h2><p>自有商品刊登工具提交检测后保存到这里，只有通过统一检查的商品在这里展示；入库前资料不足的草稿仍保存在自有商品刊登工具。</p></div><div className={css.metrics}><span>批次 <strong>{batches.length}</strong></span><span>商品 <strong>{products.length}</strong></span><span>入库待完善 <strong>{pendingCount}</strong></span></div></header>
  <section aria-label="自有商品批次列表" className={css.batchSection}>
   <header className={css.batchHeading}><h3>自有商品批次</h3><span>共 {batches.length} 批 · 展开批次查看商品</span></header>
   <div className={css.filters}><label>选择自有商品批次<select aria-label="筛选自有商品批次" value={batchId} onChange={e=>setBatchId(e.target.value)}><option value="">全部批次</option>{batches.map(b=><option key={b.id} value={b.id}>{b.name}（{b.productCount}）</option>)}</select></label><label>搜索批次或商品<input aria-label="搜索批次或商品" placeholder="批次名称 / 商品名称 / SKU" value={search} onChange={e=>setSearch(e.target.value)}/></label></div>
   <div className={css.tableWrap}><table className={css.batchTable}><thead><tr><th>批次名称</th><th>商品总数</th><th>已入库</th><th>入库待完善</th><th>创建时间</th><th>操作</th></tr></thead><tbody>
    {visibleBatches.map(b=>{
     const ready=filtered.filter(p=>p.batchId===b.id);
     const pending=allProducts.filter(p=>p.batchId===b.id&&p.status!=="已入库");
     const isOpen=expanded.includes(b.id);
     return <Fragment key={b.id}><tr><td><div className={css.batchName}><strong>{b.name}</strong><small>自有商品 · 原始批次</small></div></td><td><strong className={css.metric}>{b.productCount}</strong></td><td><strong className={css.ready}>{allProducts.filter(p=>p.batchId===b.id&&p.status==="已入库").length}</strong></td><td><strong className={css.missing}>{pending.length}</strong></td><td>{b.createdAt}</td><td><button type="button" aria-expanded={isOpen} aria-label={(isOpen?"收起":"展开")+"批次 "+b.name} onClick={()=>toggleExpanded(b.id)}>{isOpen?"收起":"查看商品"}</button></td></tr>
      {isOpen?<tr className={css.expandedRow}><td colSpan={6}><div className={css.batchDetails}><div className={css.batchDetailHeading}><strong>{b.name} · 已入库商品</strong><span>{ready.length} 件商品</span></div>
       {ready.length?<div className={css.innerScroll}><table className={css.productTable}><thead><tr><th>商品名称</th><th>SKU 数量</th><th>图片数量</th><th>检测状态</th><th>提交时间</th><th>操作</th></tr></thead><tbody>{ready.map(p=><tr key={p.id}><td><strong>{p.name}</strong></td><td>{p.skus.length}</td><td>{p.skus.reduce((n,sku)=>n+sku.images.length,0)}</td><td><span className={css.ready}>{p.status}</span></td><td>{p.createdAt}</td><td><button type="button" onClick={()=>setSelected(p)}>查看商品</button></td></tr>)}</tbody></table></div>:<p className={css.empty}>该批次暂无已入库商品。批次已保存，商品完成统一检查后会显示在这里。</p>}
       {pending.length>0?<p className={css.pendingNote}>另有 {pending.length} 件商品正在入库处理，请到「我的工具 → 自有商品刊登工具」完成待完善或待审核。</p>:null}
      </div></td></tr>:null}
     </Fragment>;
    })}
   </tbody></table>{!visibleBatches.length?<p role="status" className={css.empty}>{batches.length?"没有符合筛选条件的批次":"暂无自有商品批次。请先在「我的工具 → 自有商品刊登工具」创建批次。"}</p>:null}</div>
  </section>
  {current?<div className={css.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><section className={css.modal} role="dialog" aria-modal="true" aria-label="自有商品详情"><header><div><h2>{current.name}</h2><p>{batches.find(b=>b.id===current.batchId)?.name} · {current.status} · {current.createdAt}</p></div><button type="button" onClick={()=>setSelected(null)}>关闭</button></header>
    {current.missing.length?<p className={css.warning}>首次适配缺项：{current.missing.join("、")}。需补齐后才能进入完整刊登流程。</p>:null}
    <div className={css.skus}>{current.skus.map(s=><article key={s.id}><h3>{s.name}</h3><p>{s.description||"基础资料未填写"}</p><div className={css.images}>{s.images.map((src,i)=><button type="button" key={i} onClick={()=>setImage(src)} aria-label={"放大 "+s.name+" 图片 "+(i+1)}><img src={src} alt={s.name+" 图片 "+(i+1)}/></button>)}</div></article>)}</div>
    <footer>原始商品数据不会因为后续店铺刊登规则而被覆盖。</footer>
   </section></div>:null}
  {image?<div className={css.imagePreview} role="dialog" aria-label="放大图片" onClick={()=>setImage(null)}><button type="button" onClick={()=>setImage(null)}>关闭</button><img src={image} alt="商品图片放大"/></div>:null}
 </section>;
}
