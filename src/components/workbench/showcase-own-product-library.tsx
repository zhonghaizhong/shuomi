"use client";
import {useEffect,useMemo,useState} from "react";
import {readOwnProductBatches,readOwnProducts,listOwnReadyProducts,ownProductUpdated,type OwnProductRecord} from "./showcase-own-product-data";
import css from "./showcase-own-product-library.module.css";
export function ShowcaseOwnProductLibrary({organizationId,memberId}:{organizationId:string;memberId:string}){
 const [version,setVersion]=useState(0),[batchId,setBatchId]=useState(""),[search,setSearch]=useState(""),[selected,setSelected]=useState<OwnProductRecord|null>(null),[image,setImage]=useState<string|null>(null);
 useEffect(()=>{const refresh=(e:Event)=>{const d=(e as CustomEvent<{organizationId:string;memberId:string}>).detail;if(d?.organizationId===organizationId&&d?.memberId===memberId)setVersion(v=>v+1)};window.addEventListener(ownProductUpdated,refresh);return()=>window.removeEventListener(ownProductUpdated,refresh)},[organizationId,memberId]);
 // version tracks the shared session store event; selecting tabs remounts this component.
 const batches=useMemo(()=>readOwnProductBatches(organizationId,memberId),[organizationId,memberId,version]);
 const products=useMemo(()=>listOwnReadyProducts(organizationId,memberId),[organizationId,memberId,version]);
 const pendingCount=useMemo(()=>readOwnProducts(organizationId,memberId).filter(p=>p.status==="入库待完善").length,[organizationId,memberId,version]);
 const filtered=products.filter(p=>(!batchId||p.batchId===batchId)&&(p.name+" "+p.skus.map(s=>s.name).join(" ")).toLowerCase().includes(search.trim().toLowerCase()));
 const current=selected?products.find(p=>p.id===selected.id):null;
 return <section className={css.library} aria-label="自有商品库">
  <header><div><h2>自有商品库</h2><p>自有商品刊登工具提交检测后保存到这里，只有通过统一检查的商品在这里展示；入库前资料不足的草稿仍保存在自有商品刊登工具。</p></div><div className={css.metrics}><span>批次 <strong>{batches.length}</strong></span><span>商品 <strong>{products.length}</strong></span><span>入库待完善 <strong>{pendingCount}</strong></span></div></header>
  <div className={css.filters}><label>选择自有商品批次<select aria-label="筛选自有商品批次" value={batchId} onChange={e=>setBatchId(e.target.value)}><option value="">全部批次</option>{batches.map(b=><option key={b.id} value={b.id}>{b.name}（{b.productCount}）</option>)}</select></label><label>搜索商品<input aria-label="搜索自有商品" placeholder="商品名称 / SKU" value={search} onChange={e=>setSearch(e.target.value)}/></label></div>
  <div className={css.tableWrap}><table><thead><tr><th>商品名称</th><th>所属批次</th><th>SKU 数量</th><th>图片数量</th><th>检测状态</th><th>提交时间</th><th>操作</th></tr></thead><tbody>
  {filtered.map(p=><tr key={p.id}><td><strong>{p.name}</strong></td><td>{batches.find(b=>b.id===p.batchId)?.name||"原批次不存在"}</td><td>{p.skus.length}</td><td>{p.skus.reduce((n,s)=>n+s.images.length,0)}</td><td><span className={p.status==="入库待完善"?css.missing:css.ready}>{p.status}</span></td><td>{p.createdAt}</td><td><button type="button" onClick={()=>setSelected(p)}>查看商品</button></td></tr>)}
  </tbody></table>{!filtered.length?<p className={css.empty}>暂无通过检测的商品。请先在「我的工具 → 自有商品刊登工具」完成统一检查。</p>:null}</div>
  {current?<div className={css.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><section className={css.modal} role="dialog" aria-modal="true" aria-label="自有商品详情"><header><div><h2>{current.name}</h2><p>{batches.find(b=>b.id===current.batchId)?.name} · {current.status} · {current.createdAt}</p></div><button type="button" onClick={()=>setSelected(null)}>关闭</button></header>
    {current.missing.length?<p className={css.warning}>首次适配缺项：{current.missing.join("、")}。需补齐后才能进入完整刊登流程。</p>:null}
    <div className={css.skus}>{current.skus.map(s=><article key={s.id}><h3>{s.name}</h3><p>{s.description||"基础资料未填写"}</p><div className={css.images}>{s.images.map((src,i)=><button type="button" key={i} onClick={()=>setImage(src)} aria-label={"放大 "+s.name+" 图片 "+(i+1)}><img src={src} alt={s.name+" 图片 "+(i+1)}/></button>)}</div></article>)}</div>
    <footer>原始商品数据不会因为后续店铺刊登规则而被覆盖。</footer>
   </section></div>:null}
  {image?<div className={css.imagePreview} role="dialog" aria-label="放大图片" onClick={()=>setImage(null)}><button type="button" onClick={()=>setImage(null)}>关闭</button><img src={image} alt="商品图片放大"/></div>:null}
 </section>;
}
