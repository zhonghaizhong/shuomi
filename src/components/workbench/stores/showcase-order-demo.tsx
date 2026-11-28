"use client";
import {useEffect,useRef,useState} from "react";
import {Truck} from "lucide-react";
import type {DemoStoreBinding} from "../store-binding-demo";
import {buildAdminStoreSyncDemo,readStoreProductSnapshot} from "./store-product-snapshot-demo";
import {readShowcaseUploadTasks} from "../listing/showcase-upload-tasks";
import {apparelDemoEntries,apparelDemoTime} from "../showcase-apparel-sales-demo";
import {readDemoCollectionBatches} from "../showcase-collection-batches";
import css from "./showcase-store-center.module.css";
import orderCss from "./showcase-order-demo.module.css";
export type Order={id:string;storeId:string;productId:string;sku:string;name:string;image?:string;origin:string;amount:string;created:string;stage:number;fulfillmentSource?:"硕米自营"|"硕米优选"|"商家自行供货";supplyProductId?:string;supplySkuId?:string;carrier?:string;trackingNumber?:string;shippedAt?:string;platformSync?:"模拟同步成功";purchaseId?:string};
const stages=["待处理","待采购 / 收货","待装箱 / 发货","物流运输中","已完成"];
function supplyFor(org:string,o:Order):{source:"硕米自营"|"硕米优选"|"商家自行供货";productId?:string;skuId?:string}{
 if(o.fulfillmentSource)return {source:o.fulfillmentSource,productId:o.supplyProductId,skuId:o.supplySkuId};
 if(o.origin!=="shuomi")return {source:"商家自行供货"};
 // Listing attribution is not supply provenance. Only exact task/product/SKU lineage qualifies.
 const task=readShowcaseUploadTasks(org,"admin").find(t=>t.storeId===o.storeId&&t.demoSubmission?.simulatedPlatformProductId===o.productId&&t.productIds.length===1);
 const batch=task&&readDemoCollectionBatches(org,"admin").find(b=>b.id===task.batchId);
 const p=batch?.products.find(p=>task?.productIds.includes(p.id));
 if(p?.supplyProductId&&p.supplySkuId&&batch?.source==="硕米优选")return {source:"硕米优选",productId:p.supplyProductId,skuId:p.supplySkuId};
 return {source:"商家自行供货"};
}
const targetIds=["SIM-SHEIN-ADMIN-01-B0CFPJYX7P","SIM-SHEIN-ADMIN-01-MERCHANT-0001"];
function readOriginalOrders(org:string,stores:DemoStoreBinding[]):Order[]{
 if(typeof window==="undefined"||org!=="SM-ENT-000001"||!stores.some(s=>s.id==="SIM-ADMIN-01"&&s.platformStoreId==="SIM-SHEIN-ADMIN-01"))return [];
 const key="shuomi:demo-orders:"+org+":SIM-ADMIN-01";
 try{const raw=localStorage.getItem(key);if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed)&&parsed.every(o=>o.storeId==="SIM-ADMIN-01"))return parsed}}
 catch{}
 const snapshot=readStoreProductSnapshot(org,"SIM-ADMIN-01","SIM-SHEIN-ADMIN-01")??buildAdminStoreSyncDemo(org,"SIM-ADMIN-01","SIM-SHEIN-ADMIN-01");
 const rows=targetIds.map(id=>snapshot?.rows.find(r=>r.platformProductId===id));
 if(!rows.every(Boolean))return [];
 const orders=rows.flatMap((r,i)=>[0,1].map(j=>({id:"SIM-ORDER-20261127-"+String(i*2+j+1).padStart(3,"0"),storeId:"SIM-ADMIN-01",productId:r!.platformProductId,sku:r!.sku,name:r!.name,image:r!.imageUrl,origin:r!.origin,amount:r!.price??"未记录",created:"2026-11-27T"+(i===0?"08":"09")+":"+(j===0?"10":"25")+":00Z",stage:0})));
 try{localStorage.setItem(key,JSON.stringify(orders))}catch{}
 return orders;
}
export function readDemoOrders(org:string,stores:DemoStoreBinding[]):Order[]{
 const original=readOriginalOrders(org,stores);
 if(typeof window==="undefined"||org!=="SM-ENT-000001")return original;
 const extra=stores.filter(s=>["SIM-ADMIN-02","SIM-ADMIN-03"].includes(s.id)&&s.platformStoreId==="SIM-SHEIN-ADMIN-"+s.id.slice(-2)).flatMap(s=>{
 const key="shuomi:demo-orders:"+org+":"+s.id;
 try{const saved=JSON.parse(localStorage.getItem(key)||"null");if(Array.isArray(saved)&&saved.every(o=>o.storeId===s.id))return saved as Order[]}catch{}
 const snapshot=readStoreProductSnapshot(org,s.id,s.platformStoreId!)??buildAdminStoreSyncDemo(org,s.id,s.platformStoreId!);
 const p=snapshot?.rows.find(r=>r.origin==="merchant");if(!p)return [];
 const rows:Order[]=Array.from({length:s.id.endsWith("02")?6:2},(_,i)=>({id:"SIM-ORDER-"+s.id.slice(-2)+"-"+String(i+1).padStart(3,"0"),storeId:s.id,productId:p.platformProductId,sku:p.sku,name:p.name,image:p.imageUrl,origin:p.origin,amount:p.price??"未记录",created:"2026-11-"+(24+i%4)+"T09:00:00Z",stage:s.id.endsWith("02")?i%5:0}));
 try{localStorage.setItem(key,JSON.stringify(rows))}catch{}return rows;
 });const all=[...original,...extra];
 for(const e of apparelDemoEntries(org).filter(e=>stores.some(s=>s.id===e.store.id))){
  const snapshot=buildAdminStoreSyncDemo(org,e.store.id,e.store.platformStoreId!);
  const row=snapshot?.rows.find(r=>r.platformProductId===e.platformProductId);
  if(!row)continue;
  const key="shuomi:demo-orders:"+org+":"+e.store.id;
  let saved:Order[]=[];try{const raw=JSON.parse(localStorage.getItem(key)||"[]");if(Array.isArray(raw))saved=raw.filter(o=>o.storeId===e.store.id)}catch{}
  const additions:Order[]=e.plan.stages.map((stage,i):Order=>{
   const sku=e.product.skus[i%e.product.skus.length];
   const id="SIM-APPAREL-ORDER-"+e.store.id.slice(-2)+"-"+String(i+1).padStart(3,"0");
   return {id,storeId:e.store.id,productId:e.platformProductId,sku:sku.id,name:e.product.name,image:sku.images?.[0],origin:"shuomi",amount:e.plan.price,created:apparelDemoTime,stage,fulfillmentSource:"硕米优选",supplyProductId:e.product.id,supplySkuId:sku.id,...(stage>=2?{purchaseId:"SIM-PURCHASE-"+id}:{}),...(stage>=3?{carrier:"演示物流",trackingNumber:"SIM-TRACK-"+id,shippedAt:apparelDemoTime,platformSync:"模拟同步成功" as const}:{})};
  }).filter(x=>!saved.some(y=>y.id===x.id));
  const merged=[...saved,...additions];try{localStorage.setItem(key,JSON.stringify(merged))}catch{}
  for(const item of merged)if(!all.some(x=>x.id===item.id))all.push(item);
 }
 return all;
}
export function ShowcaseOrderDemo({organizationId,memberId,stores,onStores,onPurchase}:{organizationId:string;memberId:string;stores:DemoStoreBinding[];onStores:()=>void;onPurchase:(path:string)=>void}){
 const [orders,setOrders]=useState<Order[]>(()=>readDemoOrders(organizationId,stores)),[query,setQuery]=useState(""),[search,setSearch]=useState(""),[filter,setFilter]=useState("全部状态"),[selected,setSelected]=useState<string|null>(null),[notice,setNotice]=useState("");
 const ref=useRef<HTMLDialogElement>(null);
 const [sourceFilter,setSourceFilter]=useState("全部来源"),[carrier,setCarrier]=useState(""),[tracking,setTracking]=useState("");
 const [page,setPage]=useState(1);
 const [shipping,setShipping]=useState(false);
 const allowed=organizationId==="SM-ENT-000001"&&stores.some(s=>/^SIM-ADMIN-0[1-3]$/.test(s.id)&&s.platformStoreId==="SIM-SHEIN-ADMIN-"+s.id.slice(-2));
 const scope=stores.map(s=>s.id).join(",");
 useEffect(()=>{setOrders(readDemoOrders(organizationId,stores));setSelected(null)},[organizationId,memberId,allowed,scope]);
 const visible=allowed?orders.filter(o=>stores.some(s=>s.id===o.storeId)):[],filtered=visible.filter(o=>(filter==="全部状态"||stages[o.stage]===filter)&&[o.id,o.name,o.sku].join(" ").toLowerCase().includes(search.toLowerCase())&&(sourceFilter==="全部来源"||supplyFor(organizationId,o).source===sourceFilter)),record=visible.find(o=>o.id===selected);
 useEffect(()=>{const d=ref.current;if(selected&&d&&!d.open)d.showModal();else if(!selected&&d?.open)d.close()},[selected]);
 const saveShipment=()=>{
  if(!record||!allowed||record.stage>=3||!carrier.trim()||!tracking.trim())return;
  const source=supplyFor(organizationId,record);if(source.source!=="商家自行供货")return;
  const next=orders.map(o=>o.id===record.id?{...o,fulfillmentSource:source.source,stage:3,carrier:carrier.trim(),trackingNumber:tracking.trim(),shippedAt:new Date().toISOString(),platformSync:"模拟同步成功" as const}:o);
  try{localStorage.setItem("shuomi:demo-orders:"+organizationId+":"+record.storeId,JSON.stringify(next.filter(o=>o.storeId===record.storeId)));setOrders(next);window.dispatchEvent(new Event("shuomi:demo-orders-updated"));setNotice("发货信息已保存，模拟平台订单同步成功。");setShipping(false)}catch{setNotice("保存失败，请检查浏览器存储后重试")}
 };
 const openShipment=(o:Order)=>{setSelected(o.id);setCarrier(o.carrier??"");setTracking(o.trackingNumber??"");setNotice("");setShipping(true)};
 const purchase=(o:Order)=>{const supply=supplyFor(organizationId,o);const store=stores.find(s=>s.id===o.storeId);if(!supply.productId||!supply.skuId||!store)return;try{sessionStorage.setItem("shuomi:order-purchase:"+organizationId+":"+memberId,JSON.stringify({orderId:o.id,storeId:o.storeId,productId:supply.productId,skuId:supply.skuId,quantity:1,source:supply.source,org:organizationId,member:memberId,storeName:store.name,region:store.region,destinationCountry:store.region.replace(/站$/,""),orderAmount:o.amount,orderCreated:o.created}))}catch{return}onPurchase(supply.source==="硕米自营"?"/workbench/supply/official":"/workbench/supply/selected")};
 const pageCount=Math.max(1,Math.ceil(filtered.length/10)),currentPage=Math.min(page,pageCount);
 const recordSource=record?supplyFor(organizationId,record):null;
 const date=(s:string)=>new Date(s).toLocaleString("zh-CN",{hour12:false});
 return <><section className={css.metrics}>{[["订单总数",visible.length],["待处理订单",visible.filter(o=>o.stage<3).length],["发货中",visible.filter(o=>o.stage===3).length],["履约异常",0]].map(([title,val])=><article key={title}><span>{title}</span><strong>{val}</strong></article>)}</section>
 <section className={css.panel}><header><h2>平台订单记录</h2><span>共 {visible.length} 条 · 模拟订单</span></header>
 <form className={orderCss.toolbar} onSubmit={e=>{e.preventDefault();setSearch(query.trim());setPage(1)}}><input aria-label="搜索订单" placeholder="搜索订单编号 / 商品名称 / SKU" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="供货来源" value={sourceFilter} onChange={e=>{setSourceFilter(e.target.value);setPage(1)}}>{["全部来源","硕米自营","硕米优选","商家自行供货"].map(v=><option key={v}>{v}</option>)}</select><select aria-label="订单状态" value={filter} onChange={e=>setFilter(e.target.value)}>{["全部状态",...stages].map(v=><option key={v}>{v}</option>)}</select><button type="button" onClick={()=>{setQuery("");setSearch("");setFilter("全部状态");setSourceFilter("全部来源");setPage(1)}}>重置</button><button type="submit" className={css.primary}>确认</button></form>
 {visible.length?<div className={css.productDataTable}><table><thead><tr><th>订单编号 / 时间</th><th>商品信息</th><th>所属店铺</th><th>供货来源</th><th>数量</th><th>订单金额</th><th>履约状态</th><th>操作</th></tr></thead><tbody>{filtered.slice((currentPage-1)*10,currentPage*10).map(o=><tr key={o.id}><td><strong>{o.id}</strong><small className={orderCss.sub}>{date(o.created)}</small></td><td><div className={css.productCachedIdentity}>{o.image&&<img src={o.image} alt={o.name} onError={e=>{e.currentTarget.style.visibility="hidden"}}/>}<div><strong>{o.name}</strong><small>{o.sku} · {o.origin==="shuomi"?"硕米刊登":"商家原有"}</small></div></div></td><td>{stores.find(s=>s.id===o.storeId)?.name}</td><td>{supplyFor(organizationId,o).source}</td><td>1</td><td>{o.amount}</td><td>{stages[o.stage]}（演示）</td><td>{o.stage<3?(supplyFor(organizationId,o).source==="商家自行供货"?<button type="button" className={css.primary} onClick={()=>openShipment(o)}>发货</button>:<button type="button" className={css.primary} disabled={!supplyFor(organizationId,o).productId||!supplyFor(organizationId,o).skuId||Boolean(o.purchaseId)} onClick={()=>purchase(o)}>{o.purchaseId?"已采购":"去采购"}</button>):<button type="button" onClick={()=>{setSelected(o.id);setShipping(false);setNotice("")}}>查看物流</button>}</td></tr>)}{!filtered.length&&<tr><td colSpan={8}>没有符合筛选条件的订单</td></tr>}</tbody></table><div className={orderCss.pagination}><span>共 {filtered.length} 条 · 第 {currentPage} / {pageCount} 页</span><button type="button" disabled={currentPage<=1} onClick={()=>setPage(currentPage-1)}>上一页</button><button type="button" disabled={currentPage>=pageCount} onClick={()=>setPage(currentPage+1)}>下一页</button></div></div>:<div className={css.empty}><Truck size={34}/><h3>暂无平台订单</h3><p>当前账号暂无可查看的模拟订单。</p><button type="button" onClick={onStores}>前往我的店铺</button></div>}
 <p className={css.productSyncFootnote}>模拟订单支持本地发货及平台同步演示；未接入真实 SHEIN 发货接口，不产生真实物流、扣款或库存扣减。</p></section>
 <dialog ref={ref} className={orderCss.dialog} aria-label={shipping?"订单发货":"订单物流详情"} onCancel={e=>{e.preventDefault();setSelected(null);setShipping(false)}}>{record&&<><header><h2>{shipping?"订单发货":"订单物流详情"}</h2><button type="button" onClick={()=>setSelected(null)}>关闭</button></header><p>{record.id} · {recordSource?.source}</p><div className={css.productCachedIdentity}>{record.image&&<img src={record.image} alt={record.name}/>}<div><strong>{record.name}</strong><small>{record.sku} · 数量 1 · {record.amount}</small></div></div>{shipping?<form className={orderCss.shipForm} onSubmit={e=>{e.preventDefault();saveShipment()}}><label>物流商<input required maxLength={80} value={carrier} onChange={e=>setCarrier(e.target.value)} placeholder="例如 UPS、DHL、USPS"/></label><label>运单号<input required maxLength={100} value={tracking} onChange={e=>setTracking(e.target.value)} placeholder="请输入物流运单号"/></label><p>确认后保存发货记录，并模拟同步平台订单；真实接口尚未接入。</p><footer><button type="button" onClick={()=>setSelected(null)}>取消</button><button type="submit" className={css.primary} disabled={!carrier.trim()||!tracking.trim()}>确认发货</button></footer></form>:<><dl className={css.detailList}>{[["履约状态",stages[record.stage]],["物流商",record.carrier||"未记录"],["运单号",record.trackingNumber||"未记录"],["发货时间",record.shippedAt?date(record.shippedAt):"未记录"],["平台同步",record.platformSync||"未记录"]].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><footer><button type="button" onClick={()=>setSelected(null)}>关闭</button></footer></>}{notice&&<p role="status">{notice}</p>}</>}</dialog></>;
}
