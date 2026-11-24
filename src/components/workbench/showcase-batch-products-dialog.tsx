"use client";
import {useEffect,useId,useMemo,useRef,useState} from "react";
import type {DemoCollectionBatch,DemoCollectedProduct} from "./showcase-collection-batches";
import css from "./showcase-batch-products-dialog.module.css";

type ProductState={archived:string[];moved:Record<string,string>};
export type BatchProductView=Omit<DemoCollectionBatch,"source"|"products"> & {source:string;products:Array<Omit<DemoCollectedProduct,"status"> & {status:string}>};
const key=(org:string,member:string,batch:string)=>"shuomi:showcase-batch-product-actions-v1:"+org+":"+member+":"+batch;
function load(org:string,member:string,batch:string):ProductState{
 try{const raw=sessionStorage.getItem(key(org,member,batch));if(!raw)return {archived:[],moved:{}};const parsed=JSON.parse(raw);return {archived:Array.isArray(parsed.archived)?parsed.archived.filter((x:unknown):x is string=>typeof x==="string"):[],moved:parsed.moved&&typeof parsed.moved==="object"?parsed.moved:{}}}catch{return {archived:[],moved:{}}}
}
function csvCell(s:string){return '"'+s.replace(/"/g,'""')+'"'}
function downloadCsv(batch:BatchProductView,products:BatchProductView["products"]){
 const header=["SKU","商品名称","数据来源","演示价格","演示变体","数据标记"];
 const body=[header,...products.map(p=>[p.sku,p.name,p.source,p.price,(p.variants||[]).join("；"),p.status])];
 const csv="\ufeff"+body.map(row=>row.map(csvCell).join(",")).join("\r\n");
 const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=url;a.download=batch.id+".csv";a.click();URL.revokeObjectURL(url);
}
export function ShowcaseBatchProductsDialog({batch,organizationId,memberId,otherBatches,onClose,ownProductMode=false,onDownload}:{batch:BatchProductView;organizationId:string;memberId:string;otherBatches:BatchProductView[];onClose:()=>void;ownProductMode?:boolean;onDownload?:(products:BatchProductView["products"])=>void}){
 const dialog=useRef<HTMLDialogElement>(null),headingId=useId();
 const [state,setState]=useState<ProductState>(()=>load(organizationId,memberId,batch.id));
 const [tab,setTab]=useState<"当前商品"|"已归档">("当前商品");
 const [query,setQuery]=useState(""),[variant,setVariant]=useState("全部变体");
 const currency=batch.source==="Amazon"?"$":"¥";
 const exportProducts=(list:BatchProductView["products"])=>onDownload?onDownload(list):downloadCsv(batch,list);
 const priceCeiling=Math.max(100,Math.ceil(Math.max(...batch.products.map(p=>Number(p.price.match(/\d+(?:\.\d+)?/)?.[0]??0)),0)/50)*50);
 const [priceOpen,setPriceOpen]=useState(false),[minPrice,setMinPrice]=useState(0),[maxPrice,setMaxPrice]=useState(priceCeiling);
 const [chosen,setChosen]=useState<string[]>([]),[menu,setMenu]=useState<string|null>(null),[page,setPage]=useState(1);
 const [moveTarget,setMoveTarget]=useState(""),[message,setMessage]=useState("");
 const [moveOpen,setMoveOpen]=useState(false);
 const [detailId,setDetailId]=useState<string|null>(null);
 const [galleryIndex,setGalleryIndex]=useState(0);
 const products=useMemo(()=>batch.products.filter(p=>(state.archived.includes(p.id)===(tab==="已归档"))&&!state.moved[p.id]&&(p.name+" "+p.sku+" "+p.source).toLowerCase().includes(query.trim().toLowerCase())&&(variant==="全部变体"||(variant==="多变体"&&(p.variantCount||0)>1)||(variant==="单变体"&&(p.variantCount||0)<=1))&&(Number(p.price.match(/\d+(?:\.\d+)?/)?.[0]??0)>=minPrice&&Number(p.price.match(/\d+(?:\.\d+)?/)?.[0]??0)<=maxPrice)),[batch.products,state,tab,query,variant,minPrice,maxPrice]);
 const count=Math.max(1,Math.ceil(products.length/4)),current=Math.min(page,count),rows=products.slice((current-1)*4,current*4);
 const selectedAll=rows.length>0&&rows.every(p=>chosen.includes(p.id));
 useEffect(()=>{const node=dialog.current;if(node&&!node.open)node.showModal();return()=>node?.close()},[]);
 useEffect(()=>{setChosen([]);setPage(1);setMenu(null);},[tab,query,variant,minPrice,maxPrice]);
 function save(next:ProductState){setState(next);try{sessionStorage.setItem(key(organizationId,memberId,batch.id),JSON.stringify(next))}catch{setMessage("浏览器拒绝保存演示修改；刷新后可能恢复。")}}
 function archive(ids:string[],restore:boolean){const a=new Set(state.archived);ids.forEach(id=>restore?a.delete(id):a.add(id));save({...state,archived:[...a]});setChosen([]);setMenu(null);setPage(1);setMessage(restore?"已恢复所选演示商品。":"已归档所选演示商品，原始模拟采集数据保留。")}
 function move(){if(!moveTarget){setMessage("请选择目标批次。");return}const ids=chosen.length?chosen:menu?[menu]:[];if(!ids.length){setMessage("请选择需要移动的商品。");return}const moved={...state.moved};ids.forEach(id=>moved[id]=moveTarget);save({...state,moved});setMoveOpen(false);setMenu(null);setChosen([]);setPage(1);setMessage("已记录演示商品转移意向，未修改原始数据或其他批次。")}
 function chooseMove(id?:string){setChosen(id?[id]:chosen);setMenu(null);setMoveTarget("");setMoveOpen(true)}
 function openDetail(id:string){setDetailId(id);setGalleryIndex(0);setMenu(null)}
 const detailProduct=batch.products.find(p=>p.id===detailId);
 const allArchived=state.archived.length;
 return <dialog ref={dialog} className={css.dialog} aria-labelledby={headingId} onCancel={e=>{e.preventDefault();if(moveOpen)setMoveOpen(false);else if(detailId)setDetailId(null);else onClose()}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
  <header className={css.heading}><div><h2 id={headingId}>批次商品</h2><strong>{batch.name}</strong><p>{batch.method} · {ownProductMode?"自有商品资料":"原始采集商品"} · <span>{ownProductMode?"批次数据":"模拟数据"}</span></p></div><button type="button" onClick={onClose} aria-label="关闭批次商品弹窗">×</button></header>
  <section className={css.summary} aria-label="批次信息"><div><small>{ownProductMode?"商品来源":"来源平台"}</small><strong>{batch.source}</strong></div><div><small>商品数量</small><strong>{batch.products.length} 件</strong></div><div><small>创建时间</small><strong>{batch.createdAt}</strong></div><div><small>{ownProductMode?"商品状态":"上传状态"}</small><strong className={css.green}>{ownProductMode?"保留原状态":"未上传"}</strong></div><aside>原始资料保留<br/>{ownProductMode?"各商品状态独立管理":"上传记录可追溯"}</aside></section>
  <div className={css.toolbar} data-shuomi-filter="balanced" aria-label="批次商品筛选">
   <div data-shuomi-filter-left><label className={css.search}><span aria-hidden="true">⌕</span><input aria-label="搜索批次商品" placeholder={ownProductMode?"搜索商品名称 / SKU / 来源":"搜索商品名称 / SKU / 原始链接"} value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
   <div data-shuomi-filter-right><select aria-label="商品变体" value={variant} onChange={e=>setVariant(e.target.value)}><option>全部变体</option><option>多变体</option><option>单变体</option></select><div className={css.priceRangeHost}><button type="button" aria-label="价格区间" aria-expanded={priceOpen} onClick={()=>setPriceOpen(v=>!v)}>{minPrice===0&&maxPrice===priceCeiling?"价格区间":currency+minPrice+" – "+currency+maxPrice}</button>{priceOpen?<div className={css.pricePopover} role="group" aria-label="滑动筛选价格"><strong>选择价格范围</strong><div className={css.priceNumbers}><span>最低 {currency}{minPrice}</span><span>最高 {currency}{maxPrice}</span></div><label>最低价格<input type="range" aria-label="最低价格滑块" min={0} max={priceCeiling} step={1} value={minPrice} onChange={e=>setMinPrice(Math.min(Number(e.target.value),maxPrice))}/></label><label>最高价格<input type="range" aria-label="最高价格滑块" min={0} max={priceCeiling} step={1} value={maxPrice} onChange={e=>setMaxPrice(Math.max(Number(e.target.value),minPrice))}/></label><div className={css.priceActions}><button type="button" onClick={()=>{setMinPrice(0);setMaxPrice(priceCeiling)}}>重置</button><button type="button" onClick={()=>setPriceOpen(false)}>确定</button></div></div>:null}</div>
    <button type="button" onClick={()=>{setQuery("");setVariant("全部变体");setMinPrice(0);setMaxPrice(priceCeiling);setPriceOpen(false)}}>重置</button>
    <button type="button" onClick={()=>setPriceOpen(false)}>确认</button>
   </div>
  </div>
  <div className={css.bulkTools}><span className={css.chosen}>已选 {chosen.length} 件</span><button type="button" disabled={!chosen.length||!otherBatches.length} onClick={()=>chooseMove()}>批量移动批次</button><button type="button" className={css.archiveButton} disabled={!chosen.length} onClick={()=>archive(chosen,tab==="已归档")}>{tab==="已归档"?"批量恢复":"批量归档"}</button></div>
  <section className={css.productPanel}><header><div><strong>商品列表</strong><span>勾选商品后可批量移至其他批次或归档</span></div><nav aria-label="批次商品状态"><button type="button" aria-pressed={tab==="当前商品"} onClick={()=>setTab("当前商品")}>当前商品</button><button type="button" aria-pressed={tab==="已归档"} onClick={()=>setTab("已归档")}>已归档{allArchived?"（"+allArchived+"）":""}</button></nav></header>
   <div className={css.scroll}><table><thead><tr><th><input type="checkbox" aria-label="全选当前页商品" checked={selectedAll} disabled={!rows.length} onChange={e=>setChosen(old=>e.target.checked?[...new Set([...old,...rows.map(p=>p.id)])]:old.filter(id=>!rows.some(p=>p.id===id)))}/></th><th>商品信息</th><th>价格</th><th>变体</th><th>{ownProductMode?"商品来源":"原始链接"}</th><th>{ownProductMode?"创建时间":"采集时间"}</th><th>操作</th></tr></thead><tbody>{rows.map(p=><tr key={p.id}><td><input type="checkbox" aria-label={"选择商品 "+p.name} checked={chosen.includes(p.id)} onChange={e=>setChosen(old=>e.target.checked?[...old,p.id]:old.filter(id=>id!==p.id))}/></td><td><div className={css.productCell}><button type="button" className={css.thumbButton} aria-label={"放大商品图片 "+p.name} onClick={()=>openDetail(p.id)}>{p.images?.[0]?<img src={p.images[0]} alt={p.name+"的演示参考照片"} loading="lazy"/>:<span>商品图</span>}</button><div><strong>{p.name}</strong><span><em>{batch.source}</em> SKU {p.sku}</span></div></div></td><td><strong className={css.demoPrice}>{p.price}</strong><small className={css.demoNote}>{ownProductMode?p.status:batch.source==="Amazon"?"历史/品牌参考价 · 非实时":"模拟价格"}</small></td><td><span className={css.variantInfo}>{(p.variantCount||0)>1?"多变体 · "+p.variantCount+" 规格":"单变体"}</span></td><td>{p.demoSourceLink?.startsWith("https://")?<a className={css.muted} href={p.demoSourceLink} target="_blank" rel="noopener noreferrer" title="打开公开商品页面">{p.sku.startsWith("AMZ-US-")?"品牌商品资料":"Amazon 商品链接"} · {p.sku}</a>:<span className={css.muted}>{p.demoSourceLink||(ownProductMode?p.source:"仅演示数据")}</span>}</td><td>{batch.createdAt}</td><td><div className={css.menuWrap}><button type="button" aria-expanded={menu===p.id} onClick={()=>setMenu(x=>x===p.id?null:p.id)}>更多</button>{menu===p.id?<div className={css.dropdown} role="group" aria-label={"商品操作 "+p.sku}><button type="button" disabled={!otherBatches.length} onClick={()=>chooseMove(p.id)}>移动批次</button><button type="button" onClick={()=>openDetail(p.id)}>查看</button><button type="button" onClick={()=>archive([p.id],tab==="已归档")}>{tab==="已归档"?"恢复":"归档"}</button></div>:null}</div></td></tr>)}</tbody></table>{!rows.length?<p className={css.empty} role="status">暂无{tab}商品，请调整筛选条件或切换列表。</p>:null}</div>
   <footer className={css.pagination}><span>{rows.length?((current-1)*4+1)+"–"+((current-1)*4+rows.length):"0"} / {products.length}</span><div><button type="button" aria-label="上一页商品" disabled={current===1} onClick={()=>setPage(v=>v-1)}>‹</button><b>{current}</b><button type="button" aria-label="下一页商品" disabled={current===count} onClick={()=>setPage(v=>v+1)}>›</button></div></footer>
  </section>
  {message?<p role="status" className={css.message}>{message}</p>:null}
  <footer className={css.bottom}><span>{ownProductMode?"自有商品原始资料和入库状态保持不变；归档仅影响此列表。":"商品可单个或批量调整批次归属；归档不会删除原始数据。"}</span><button type="button" onClick={()=>exportProducts(batch.products)}>下载当前批次</button></footer>
  {detailProduct?<div className={css.detailOverlay} role="presentation">
    <div className={css.detailStage}>
     <div className={css.detailStageTop}><span>{ownProductMode?"自有商品图片 · 保留原资料":batch.source==="Amazon"?"公开产品参考图片 · 非实时抓取":"演示参考照片 · 非 1688 原始采集图片"}</span><span>{galleryIndex+1} / {detailProduct.images?.length||1}</span></div>
     {detailProduct.images?.length?<img className={css.largeImage} src={detailProduct.images[Math.min(galleryIndex,detailProduct.images.length-1)]} alt={detailProduct.name+"的放大演示参考图"}/>:<div className={css.emptyPhoto}>暂无可用照片</div>}
     <div className={css.gallery}>{(detailProduct.images||[]).map((url,i)=><button key={url} type="button" aria-label={"查看第"+(i+1)+"张图片"} aria-pressed={galleryIndex===i} onClick={()=>setGalleryIndex(i)}><img src={url} alt={detailProduct.name+"演示图 "+(i+1)}/></button>)}</div>
    </div>
    <aside className={css.detailPanel} role="dialog" aria-modal="true" aria-label="商品详情">
     <header><h2>商品详情</h2><button type="button" onClick={()=>setDetailId(null)} aria-label="关闭商品详情">×</button></header>
     <section className={css.detailIntro}><div className={css.detailCover}>{detailProduct.images?.[0]?<img src={detailProduct.images[0]} alt={detailProduct.name+"演示主图"}/>:<span>商品主图</span>}</div><div><h3>{detailProduct.name}</h3><div className={css.detailIdentity}><span>{ownProductMode?batch.source:batch.source+"（模拟）"}</span><small>SKU {detailProduct.sku}</small></div><strong className={css.detailPrice}>{detailProduct.price}</strong><small>{ownProductMode?detailProduct.status:"模拟参考价格，非真实供应商报价"}</small></div></section>
     <dl className={css.detailMetadata}>
      <div><dt>原始标题</dt><dd>{detailProduct.originalTitle||detailProduct.name}</dd></div>
      <div><dt>原始链接</dt><dd>{detailProduct.demoSourceLink?.startsWith("https://")?<a href={detailProduct.demoSourceLink} target="_blank" rel="noopener noreferrer">查看 Amazon 原始商品 · {detailProduct.sku}</a>:detailProduct.demoSourceLink||"演示数据，未接入真实商品链接"}</dd></div>
      <div><dt>变体信息</dt><dd>{(detailProduct.variantCount||0)>1?"多变体 · "+detailProduct.variantCount+" 个规格":"单变体"}<div className={css.variantChips}>{(detailProduct.variants||[]).map(v=><span key={v}>{v}</span>)}</div>
      {detailProduct.variantDetails?.length?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:9,marginTop:10}}>
       {detailProduct.variantDetails.map(v=><div key={v.sku} style={{border:"1px solid var(--stroke, #60657a)",borderRadius:8,padding:7,display:"flex",alignItems:"center",gap:7,minWidth:0}}>
        <img src={v.image} alt={v.label+" 对应实拍商品图"} loading="lazy" style={{width:50,height:50,objectFit:"contain",background:"#fff",borderRadius:6,flexShrink:0}}/>
        <span style={{fontSize:11,overflowWrap:"anywhere"}}>{v.label}<small style={{display:"block",opacity:.7}}>{v.sku}</small></span>
       </div>)}
      </div>:null}</dd></div>
      <div><dt>{ownProductMode?"来源方式":"采集方式"}</dt><dd>{ownProductMode?detailProduct.source:batch.method}</dd></div>
      <div><dt>{ownProductMode?"创建时间":"采集时间"}</dt><dd>{batch.createdAt}</dd></div>
     </dl>
     <div className={css.detailDescription}><strong>{ownProductMode?"商品描述":"原始描述（模拟）"}</strong><p>{detailProduct.description||"当前仅为演示采集数据。"}</p><p>{ownProductMode?"展示已保存的自有商品资料，原始 SKU、图片与入库状态不会被此弹窗修改。":batch.source==="Amazon"?"商品图片取自公开的产品参考图，商品资料为人工核对后用于演示；未调用 Amazon 官方采集 API，参考价格不代表实时价格或库存。":"商品图为实物摄影参考样图，不代表该 1688 商品的原始图或供应商信息。"}</p></div>
     <footer><span>{ownProductMode?"仅查看自有商品资料，不修改原始数据":"仅查看演示商品资料，不修改原始数据"}</span><button type="button" onClick={()=>exportProducts([detailProduct])}>下载商品数据</button></footer>
    </aside>
   </div>:null}
  {moveOpen?<div className={css.backdrop}><section className={css.moveDialog} role="dialog" aria-modal="true" aria-label="移动商品到其他批次"><h3>移动商品到其他批次</h3><p>演示模式只记录转移意向，不修改真实商品库。</p><label>目标批次<select aria-label="目标批次" value={moveTarget} onChange={e=>setMoveTarget(e.target.value)}><option value="">请选择批次</option>{otherBatches.map(b=><option value={b.id} key={b.id}>{b.name}</option>)}</select></label><footer><button type="button" onClick={()=>setMoveOpen(false)}>取消</button><button type="button" onClick={move} disabled={!moveTarget}>确认移动</button></footer></section></div>:null}
 </dialog>;
}
