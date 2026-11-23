"use client";
import {useEffect,useId,useMemo,useRef,useState} from "react";
import type {DemoCollectionBatch,DemoCollectedProduct} from "./showcase-collection-batches";
import css from "./showcase-batch-products-dialog.module.css";

type ProductState={archived:string[];moved:Record<string,string>};
const key=(org:string,member:string,batch:string)=>"shuomi:showcase-batch-product-actions-v1:"+org+":"+member+":"+batch;
function load(org:string,member:string,batch:string):ProductState{
 try{const raw=sessionStorage.getItem(key(org,member,batch));if(!raw)return {archived:[],moved:{}};const parsed=JSON.parse(raw);return {archived:Array.isArray(parsed.archived)?parsed.archived.filter((x:unknown):x is string=>typeof x==="string"):[],moved:parsed.moved&&typeof parsed.moved==="object"?parsed.moved:{}}}catch{return {archived:[],moved:{}}}
}
function csvCell(s:string){return '"'+s.replace(/"/g,'""')+'"'}
function downloadCsv(batch:DemoCollectionBatch,products:DemoCollectedProduct[]){
 const header=["SKU","商品名称","数据来源","价格","数据标记"];
 const body=[header,...products.map(p=>[p.sku,p.name,p.source,p.price,p.status])];
 const csv="\ufeff"+body.map(row=>row.map(csvCell).join(",")).join("\r\n");
 const blob=new Blob([csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=url;a.download=batch.id+".csv";a.click();URL.revokeObjectURL(url);
}
export function ShowcaseBatchProductsDialog({batch,organizationId,memberId,otherBatches,onClose}:{batch:DemoCollectionBatch;organizationId:string;memberId:string;otherBatches:DemoCollectionBatch[];onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),headingId=useId();
 const [state,setState]=useState<ProductState>(()=>load(organizationId,memberId,batch.id));
 const [tab,setTab]=useState<"当前商品"|"已归档">("当前商品");
 const [query,setQuery]=useState(""),[variant,setVariant]=useState("全部变体"),[price,setPrice]=useState("价格区间");
 const [chosen,setChosen]=useState<string[]>([]),[menu,setMenu]=useState<string|null>(null),[page,setPage]=useState(1);
 const [moveTarget,setMoveTarget]=useState(""),[message,setMessage]=useState("");
 const [moveOpen,setMoveOpen]=useState(false);
 const [detailId,setDetailId]=useState<string|null>(null);
 const products=useMemo(()=>batch.products.filter(p=>(state.archived.includes(p.id)===(tab==="已归档"))&&!state.moved[p.id]&&(p.name+" "+p.sku+" "+p.source).toLowerCase().includes(query.trim().toLowerCase())&&(variant==="全部变体"||variant==="无变体")&&(price==="价格区间"||price==="全部价格")),[batch.products,state,tab,query,variant,price]);
 const count=Math.max(1,Math.ceil(products.length/4)),current=Math.min(page,count),rows=products.slice((current-1)*4,current*4);
 const selectedAll=rows.length>0&&rows.every(p=>chosen.includes(p.id));
 useEffect(()=>{const node=dialog.current;if(node&&!node.open)node.showModal();return()=>node?.close()},[]);
 useEffect(()=>{setChosen([]);setPage(1);setMenu(null);},[tab,query,variant,price]);
 function save(next:ProductState){setState(next);try{sessionStorage.setItem(key(organizationId,memberId,batch.id),JSON.stringify(next))}catch{setMessage("浏览器拒绝保存演示修改；刷新后可能恢复。")}}
 function archive(ids:string[],restore:boolean){const a=new Set(state.archived);ids.forEach(id=>restore?a.delete(id):a.add(id));save({...state,archived:[...a]});setChosen([]);setMenu(null);setPage(1);setMessage(restore?"已恢复所选演示商品。":"已归档所选演示商品，原始模拟采集数据保留。")}
 function move(){if(!moveTarget){setMessage("请选择目标批次。");return}const ids=chosen.length?chosen:menu?[menu]:[];if(!ids.length){setMessage("请选择需要移动的商品。");return}const moved={...state.moved};ids.forEach(id=>moved[id]=moveTarget);save({...state,moved});setMoveOpen(false);setMenu(null);setChosen([]);setPage(1);setMessage("已记录演示商品转移意向，未修改原始数据或其他批次。")}
 function chooseMove(id?:string){setChosen(id?[id]:chosen);setMenu(null);setMoveTarget("");setMoveOpen(true)}
 const allArchived=state.archived.length;
 return <dialog ref={dialog} className={css.dialog} aria-labelledby={headingId} onCancel={e=>{e.preventDefault();if(moveOpen)setMoveOpen(false);else onClose()}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
  <header className={css.heading}><div><h2 id={headingId}>批次商品</h2><strong>{batch.name}</strong><p>{batch.method} · 原始采集商品 · <span>模拟数据</span></p></div><button type="button" onClick={onClose} aria-label="关闭批次商品弹窗">×</button></header>
  <section className={css.summary} aria-label="批次信息"><div><small>来源平台</small><strong>{batch.source}</strong></div><div><small>商品数量</small><strong>{batch.products.length} 件</strong></div><div><small>创建时间</small><strong>{batch.createdAt}</strong></div><div><small>上传状态</small><strong className={css.green}>未上传</strong></div><aside>原始资料保留<br/>上传记录可追溯</aside></section>
  <div className={css.toolbar}><label className={css.search}><span aria-hidden="true">⌕</span><input aria-label="搜索批次商品" placeholder="搜索商品名称 / SKU / 原始链接" value={query} onChange={e=>setQuery(e.target.value)}/></label><select aria-label="商品变体" value={variant} onChange={e=>setVariant(e.target.value)}><option>全部变体</option><option>无变体</option></select><select aria-label="商品价格区间" value={price} onChange={e=>setPrice(e.target.value)}><option>价格区间</option><option>全部价格</option></select><span className={css.chosen}>已选 {chosen.length} 件</span><button type="button" disabled={!chosen.length||!otherBatches.length} onClick={()=>chooseMove()}>批量移动批次</button><button type="button" className={css.archiveButton} disabled={!chosen.length} onClick={()=>archive(chosen,tab==="已归档")}>{tab==="已归档"?"批量恢复":"批量归档"}</button></div>
  <section className={css.productPanel}><header><div><strong>商品列表</strong><span>勾选商品后可批量移至其他批次或归档</span></div><nav aria-label="批次商品状态"><button type="button" aria-pressed={tab==="当前商品"} onClick={()=>setTab("当前商品")}>当前商品</button><button type="button" aria-pressed={tab==="已归档"} onClick={()=>setTab("已归档")}>已归档{allArchived?"（"+allArchived+"）":""}</button></nav></header>
   <div className={css.scroll}><table><thead><tr><th><input type="checkbox" aria-label="全选当前页商品" checked={selectedAll} disabled={!rows.length} onChange={e=>setChosen(old=>e.target.checked?[...new Set([...old,...rows.map(p=>p.id)])]:old.filter(id=>!rows.some(p=>p.id===id)))}/></th><th>商品信息</th><th>价格</th><th>变体</th><th>原始链接</th><th>采集时间</th><th>操作</th></tr></thead><tbody>{rows.map(p=><tr key={p.id}><td><input type="checkbox" aria-label={"选择商品 "+p.name} checked={chosen.includes(p.id)} onChange={e=>setChosen(old=>e.target.checked?[...old,p.id]:old.filter(id=>id!==p.id))}/></td><td><div className={css.productCell}><div className={css.thumb}>商品图</div><div><strong>{p.name}</strong><span><em>{batch.source}</em> SKU {p.sku}</span></div></div></td><td>{p.price}</td><td>未获取</td><td><span className={css.muted}>演示数据无真实链接</span></td><td>{batch.createdAt}</td><td><div className={css.menuWrap}><button type="button" aria-expanded={menu===p.id} onClick={()=>setMenu(x=>x===p.id?null:p.id)}>更多</button>{menu===p.id?<div className={css.dropdown} role="group" aria-label={"商品操作 "+p.sku}><button type="button" disabled={!otherBatches.length} onClick={()=>chooseMove(p.id)}>移动批次</button><button type="button" onClick={()=>{setDetailId(p.id);setMenu(null)}}>查看</button><button type="button" onClick={()=>archive([p.id],tab==="已归档")}>{tab==="已归档"?"恢复":"归档"}</button></div>:null}</div></td></tr>)}</tbody></table>{!rows.length?<p className={css.empty} role="status">暂无{tab}商品，请调整筛选条件或切换列表。</p>:null}</div>
   <footer className={css.pagination}><span>{rows.length?((current-1)*4+1)+"–"+((current-1)*4+rows.length):"0"} / {products.length}</span><div><button type="button" aria-label="上一页商品" disabled={current===1} onClick={()=>setPage(v=>v-1)}>‹</button><b>{current}</b><button type="button" aria-label="下一页商品" disabled={current===count} onClick={()=>setPage(v=>v+1)}>›</button></div></footer>
  </section>
  {message?<p role="status" className={css.message}>{message}</p>:null}
  <footer className={css.bottom}><span>商品可单个或批量调整批次归属；归档不会删除原始数据。</span><button type="button" onClick={()=>downloadCsv(batch,batch.products)}>下载当前批次</button></footer>
  {detailId?<div className={css.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setDetailId(null)}}><section className={css.moveDialog} role="dialog" aria-modal="true" aria-label="查看采集商品详情"><h3>商品资料</h3>{batch.products.filter(item=>item.id===detailId).map(item=><div className={css.detailFields} key={item.id}><p><strong>商品名称</strong><span>{item.name}</span></p><p><strong>模拟 SKU</strong><span>{item.sku}</span></p><p><strong>来源</strong><span>{item.source}</span></p><p><strong>价格</strong><span>{item.price}</span></p><p><strong>数据标记</strong><span>{item.status}</span></p></div>)}<p>当前批次为演示采集，不包含真实图片、供应商链接或 SKU 变体。</p><footer><button type="button" onClick={()=>setDetailId(null)}>关闭</button></footer></section></div>:null}
  {moveOpen?<div className={css.backdrop}><section className={css.moveDialog} role="dialog" aria-modal="true" aria-label="移动商品到其他批次"><h3>移动商品到其他批次</h3><p>演示模式只记录转移意向，不修改真实商品库。</p><label>目标批次<select aria-label="目标批次" value={moveTarget} onChange={e=>setMoveTarget(e.target.value)}><option value="">请选择批次</option>{otherBatches.map(b=><option value={b.id} key={b.id}>{b.name}</option>)}</select></label><footer><button type="button" onClick={()=>setMoveOpen(false)}>取消</button><button type="button" onClick={move} disabled={!moveTarget}>确认移动</button></footer></section></div>:null}
 </dialog>;
}
