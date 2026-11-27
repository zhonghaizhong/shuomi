"use client";
import {useEffect,useRef,useState} from "react";
import {parseListingPhoto,listingPhotoAtlasUrl} from "./listing/showcase-listing-ai-images";
import type {OptimizedDataset} from "./showcase-optimized-datasets";
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
 const [index,setIndex]=useState(0),[photo,setPhoto]=useState(0);
 const product=dataset.products[index];
 useEffect(()=>{const el=ref.current,previous=document.activeElement;if(el&&!el.open)el.showModal();return()=>{el?.close();if(previous instanceof HTMLElement&&previous.isConnected)previous.focus()}},[]);
 const fields=[["目标平台 / 站点",dataset.platform+" / "+dataset.site],["目标店铺",dataset.storeName],["店铺类型",dataset.storeType??"未记录"],["适配语言",dataset.language],["接收时间",dateLabel(dataset.acceptedAt??dataset.createdAt)],["接收状态",dataset.demo?"平台已接收（演示）":"平台已接收"],["审核状态",(dataset.reviewStatus??"待审核")+(dataset.demo?"（演示）":"")],["上架状态",dataset.listingStatus??"未上架"]];
 return <dialog ref={ref} className={css.dialog} aria-label="优化版本商品详情" onCancel={e=>{e.preventDefault();onClose()}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
 <header className={css.header}><div><small>我的数据 / 优化版本</small><h2>V{dataset.version+1} · {dataset.platform} {dataset.site}优化版{dataset.demo?"（演示）":""}</h2><p>{dataset.sourceBatchName}</p></div><button type="button" onClick={onClose}>关闭</button></header>
 <div className={css.body}>
 <dl className={css.meta}>{fields.map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
 {dataset.products.length>1&&<label className={css.selector}>选择商品<select value={index} onChange={e=>{setIndex(Number(e.target.value));setPhoto(0)}}>{dataset.products.map((p,i)=><option key={p.sourceProductId+"-"+i} value={i}>{p.name}</option>)}</select></label>}
 {product?<div className={css.layout}><section className={css.gallery}><h3>商品图片 <small>{product.images.length} 张</small></h3><div className={css.hero}>{product.images[photo]?<Photo key={product.images[photo]} src={product.images[photo]} name={product.name+" 图片 "+(photo+1)}/>:<span className={css.emptyPhoto}>暂无已保存图片</span>}</div>{product.images.length>0&&<div className={css.thumbs}>{product.images.map((src,i)=><button type="button" key={src+"-"+i} aria-label={"查看图片 "+(i+1)} aria-pressed={photo===i} onClick={()=>setPhoto(i)}><Photo src={src} name={"图片 "+(i+1)}/></button>)}</div>}<p className={css.note}>点击缩略图切换大图 · {product.images.length?photo+1:0}/{product.images.length}</p></section>
 <section className={css.details}><h3>商品信息</h3><h4>{product.name}</h4><dl className={css.productMeta}><div><dt>原商品编号</dt><dd>{product.sourceProductId}</dd></div><div><dt>SKU 数量</dt><dd>{product.skuCodes.length}</dd></div></dl><h3>优化描述</h3><p className={css.description}>{product.description||"暂无已保存描述"}</p><h3>SKU 明细</h3><div className={css.skus}>{product.skuCodes.length?product.skuCodes.map((sku,i)=><div key={sku+"-"+i}><span>{i+1}</span><strong>{sku}</strong></div>):<p>暂无已保存 SKU</p>}</div><p className={css.note}>本版本仅展示已保存的优化资料；未记录的价格、库存及变体属性不补造，不覆盖原始数据。</p></section></div>:<p className={css.note}>当前版本没有商品。</p>}
 </div><footer className={css.footer}><span>共 {dataset.products.length} 件商品 · 原始批次保持不变</span><button type="button" onClick={()=>downloadOptimizedVersionCsv(dataset)}>下载 CSV</button><button type="button" onClick={onClose}>关闭</button></footer>
 </dialog>
}
