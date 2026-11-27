"use client";
import {useEffect,useRef,useState} from "react";
import {parseListingPhoto,listingPhotoAtlasUrl} from "./listing/showcase-listing-ai-images";
import type {OptimizedDataset,OptimizedDatasetProduct,VersionSkuSnapshot} from "./showcase-optimized-datasets";
import {downloadOptimizedVersionCsv} from "./showcase-dataset-version-actions";
import css from "./showcase-optimized-version-dialog.module.css";

function Photo({src,name}:{src:string;name:string}){
 const [failed,setFailed]=useState(false);
 const tile=parseListingPhoto(src);
 if(failed)return <span className={css.emptyPhoto}>图片暂不可用</span>;
 if(tile)return <span role="img" aria-label={name} className={css.atlas} style={{backgroundImage:'url("'+listingPhotoAtlasUrl()+'")',backgroundPosition:(tile.col*20)+"% "+(tile.row*25)+"%",backgroundSize:"600% 500%"}}/>;
 return <img src={src} alt={name} onError={()=>setFailed(true)}/>;
}
function dateLabel(value:string){const time=new Date(value);return Number.isNaN(time.valueOf())?value:time.toLocaleString("zh-CN",{hour12:false})}
export function ShowcaseOptimizedVersionDialog({dataset,onClose}:{dataset:OptimizedDataset;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 const [index,setIndex]=useState(0),[photo,setPhoto]=useState(0),[detail,setDetail]=useState(false),[query,setQuery]=useState(""),[search,setSearch]=useState(""),[page,setPage]=useState(1),[imageType,setImageType]=useState<"main"|"detail">("main");
 const product=dataset.products[index];
 const matches=dataset.products.map((p,i)=>({p,i})).filter(({p})=>[p.name,p.sourceProductId,...p.skuCodes].join(" ").toLowerCase().includes(search.toLowerCase()));
 const pages=Math.max(1,Math.ceil(matches.length/10));const currentPage=Math.min(page,pages);
 const visible=matches.slice((currentPage-1)*10,currentPage*10);
 const gallery=product?(imageType==="main"?product.images:product.detailImages??[]):[];
 const skuRows=(p:OptimizedDatasetProduct):VersionSkuSnapshot[]=>p.skuSnapshots?.length?p.skuSnapshots:p.skuCodes.map(sku=>({sku}));
 const value=(v?:string)=>v??"未记录";
 const summary=(p:OptimizedDatasetProduct,k:keyof VersionSkuSnapshot)=>{const vals=[...new Set(skuRows(p).map(v=>v[k]).filter(Boolean))];return vals.length?vals.length===1?vals[0]:vals.join(" / "):"未记录"};
 const priceKey=dataset.listingStatus==="已上架"?"listingPrice":"submittedPrice";const stockKey=dataset.listingStatus==="已上架"?"listingStock":"submittedStock";const priceLabel=dataset.listingStatus==="已上架"?"上架价格":"提交价格";const stockLabel=dataset.listingStatus==="已上架"?"上架库存":"提交库存";
 useEffect(()=>{const el=ref.current,previous=document.activeElement;if(el&&!el.open)el.showModal();return()=>{el?.close();if(previous instanceof HTMLElement&&previous.isConnected)previous.focus()}},[]);
 const fields=[["目标平台 / 站点",dataset.platform+" / "+dataset.site],["目标店铺",dataset.storeName],["店铺类型",dataset.storeType??"未记录"],["适配语言",dataset.language],["接收时间",dateLabel(dataset.acceptedAt??dataset.createdAt)],["接收状态",dataset.demo?"平台已接收（演示）":"平台已接收"],["审核状态",(dataset.reviewStatus??"待审核")+(dataset.demo?"（演示）":"")],["上架状态",dataset.versionListingSummary??dataset.listingStatus??"未上架"]];
 return <dialog ref={ref} className={css.dialog} aria-label="优化版本商品详情" onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
 <header className={css.header}><div><small>我的数据 / 优化版本 / {detail?"商品详情":"商品列表"}</small><h2>V{dataset.version+1} · {dataset.platform} {dataset.site}优化版{dataset.demo?"（演示）":""}</h2><p>{dataset.sourceBatchName}</p></div><button type="button" onClick={onClose}>关闭</button></header>
 <div className={css.body}>
 <dl className={css.meta}>{fields.map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>

 {!detail?<section className={css.listSection}><h3>商品列表 <small>共 {dataset.products.length} 件商品</small></h3>
 <form className={css.searchBar} onSubmit={e=>{e.preventDefault();setSearch(query.trim());setPage(1)}}><input aria-label="搜索版本商品" placeholder="搜索商品名称 / 原商品编号 / SKU" value={query} onChange={e=>setQuery(e.target.value)}/><button type="button" onClick={()=>{setQuery("");setSearch("");setPage(1)}}>重置</button><button type="submit" className={css.primary}>确认</button></form>
 <div className={css.listLayout}><div className={css.tableWrap}><table className={css.listTable}><thead><tr><th>商品信息</th><th>SKU 数量</th><th>原始价格</th><th>{priceLabel}</th><th>原始库存</th><th>{stockLabel}</th><th>操作</th></tr></thead><tbody>{visible.map(({p,i})=><tr key={p.sourceProductId+"-"+i} data-selected={index===i} onClick={()=>setIndex(i)}><td><div className={css.productCell}><button type="button" className={css.listThumb} aria-label={"预览 "+p.name} onClick={()=>setIndex(i)}>{p.images[0]?<Photo key={p.images[0]} src={p.images[0]} name={p.name}/>:<span className={css.emptyPhoto}>暂无图片</span>}</button><div><strong>{p.name}</strong><small>{p.sourceProductId}</small>{dataset.demo?<small>{p.demoListingStatus??"未上架"}（演示）</small>:null}</div></div></td><td>{p.skuCodes.length}</td><td>{summary(p,"originalPrice")}</td><td>{summary(p,priceKey)}</td><td>{summary(p,"originalStock")}</td><td>{summary(p,stockKey)}</td><td><button type="button" onClick={()=>{setIndex(i);setPhoto(0);setImageType("main");setDetail(true)}}>查看详情</button></td></tr>)}</tbody></table>{!visible.length&&<p className={css.note}>没有符合条件的商品</p>}</div>
 {product&&<aside className={css.preview}><h3>商品预览</h3><div className={css.hero}>{product.images[0]?<Photo key={product.images[0]} src={product.images[0]} name={product.name}/>:<span className={css.emptyPhoto}>暂无图片</span>}</div><strong>{product.name}</strong><small>{product.sourceProductId}</small><dl><dt>原始价格</dt><dd>{summary(product,"originalPrice")}</dd><dt>SKU 数量</dt><dd>{product.skuCodes.length}</dd></dl><button type="button" className={css.primary} onClick={()=>{setPhoto(0);setImageType("main");setDetail(true)}}>查看详情</button></aside>}</div>
 <div className={css.paging}><span>第 {currentPage} / {pages} 页 · 共 {matches.length} 件</span><button type="button" disabled={currentPage===1} onClick={()=>setPage(currentPage-1)}>上一页</button><button type="button" disabled={currentPage===pages} onClick={()=>setPage(currentPage+1)}>下一页</button></div></section>:product?<><div className={css.layout}><section className={css.gallery}><h3>商品图片 <small>{gallery.length} 张</small></h3><div className={css.tabs}>{(["main","detail"] as const).map(t=><button key={t} type="button" aria-pressed={imageType===t} onClick={()=>{setImageType(t);setPhoto(0)}}>{t==="main"?"主图":"详情图"}</button>)}</div><div className={css.hero}>{gallery[photo]?<Photo key={gallery[photo]} src={gallery[photo]} name={product.name+" 图片 "+(photo+1)}/>:<span className={css.emptyPhoto}>暂无已保存图片</span>}</div><div className={css.thumbs}>{gallery.map((src,i)=><button type="button" key={src+"-"+i} aria-label={"查看图片 "+(i+1)} aria-pressed={photo===i} onClick={()=>setPhoto(i)}><Photo src={src} name={"图片 "+(i+1)}/></button>)}</div></section>
 <section className={css.details}><h3>商品信息</h3><h4>{product.name}</h4><dl className={css.productMeta}><div><dt>原商品编号</dt><dd>{product.sourceProductId}</dd></div><div><dt>SKU 数量</dt><dd>{product.skuCodes.length}</dd></div><div><dt>上架状态</dt><dd>{product.demoListingStatus??dataset.listingStatus??"未上架"}{dataset.demo?"（演示）":""}</dd></div><div><dt>商品类目</dt><dd>{product.category??"未记录"}</dd></div></dl><h3>优化描述 / 卖点</h3><p className={css.description}>{product.description||"暂无已保存描述"}</p><h3>价格与库存</h3><dl className={css.productMeta}>{[["原始价格","originalPrice"],[priceLabel,priceKey],["原始库存","originalStock"],[stockLabel,stockKey]].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{summary(product,v as keyof VersionSkuSnapshot)}</dd></div>)}</dl><p className={css.note}>再次刊登时重新读取原始商品价格及库存，不沿用历史提交或上架值。</p><h3>商品属性</h3>{product.attributes&&Object.keys(product.attributes).length?<dl className={css.productMeta}>{Object.entries(product.attributes).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>:<p className={css.note}>暂无已保存属性</p>}</section></div>
 <section className={css.listSection}><h3>SKU 明细</h3><div className={css.tableWrap}><table className={css.listTable}><thead><tr>{["原始SKU","规格","原始价格",priceLabel,"原始库存",stockLabel,"商家SKU","平台SKU"].map(k=><th key={k}>{k}</th>)}</tr></thead><tbody>{skuRows(product).map((v,i)=><tr key={v.sku+"-"+i}>{[v.sku,v.spec,v.originalPrice,v[priceKey],v.originalStock,v[stockKey],v.merchantSku,v.platformSku].map((x,j)=><td key={j}>{value(x)}</td>)}</tr>)}</tbody></table></div></section></>:null}

 </div><footer className={css.footer}><span>共 {dataset.products.length} 件商品 · 原始批次保持不变</span>{detail&&<button type="button" onClick={()=>setDetail(false)}>返回商品列表</button>}<button type="button" className={css.primary} onClick={()=>downloadOptimizedVersionCsv(dataset)}>下载当前版本 CSV</button><button type="button" onClick={onClose}>关闭</button></footer>
 </dialog>
}
