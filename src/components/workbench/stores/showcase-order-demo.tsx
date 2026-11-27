"use client";
import {useEffect,useRef,useState} from "react";
import {Truck} from "lucide-react";
import type {DemoStoreBinding} from "../store-binding-demo";
import {buildAdminStoreSyncDemo,readStoreProductSnapshot} from "./store-product-snapshot-demo";
import css from "./showcase-store-center.module.css";
import orderCss from "./showcase-order-demo.module.css";
type Order={id:string;storeId:string;productId:string;sku:string;name:string;image?:string;origin:string;amount:string;created:string;stage:number};
const stages=["待处理","待采购 / 收货","待装箱 / 发货","物流运输中","已完成"];
const targetIds=["SIM-SHEIN-ADMIN-01-B0CFPJYX7P","SIM-SHEIN-ADMIN-01-MERCHANT-0001"];
function readOriginalOrders(org:string,stores:DemoStoreBinding[]):Order[]{
 if(typeof window==="undefined"||org!=="SM-ENT-000001"||!stores.some(s=>s.id==="SIM-ADMIN-01"&&s.platformStoreId==="SIM-SHEIN-ADMIN-01"))return [];
 const key="shuomi:demo-orders:"+org+":SIM-ADMIN-01";
 try{const raw=localStorage.getItem(key);if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed)&&parsed.length===4)return parsed}}
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
 });return [...original,...extra];
}
export function ShowcaseOrderDemo({organizationId,memberId,stores,onStores}:{organizationId:string;memberId:string;stores:DemoStoreBinding[];onStores:()=>void}){
 const [orders,setOrders]=useState<Order[]>(()=>readDemoOrders(organizationId,stores)),[query,setQuery]=useState(""),[search,setSearch]=useState(""),[filter,setFilter]=useState("全部状态"),[selected,setSelected]=useState<string|null>(null),[notice,setNotice]=useState("");
 const ref=useRef<HTMLDialogElement>(null);
 const allowed=organizationId==="SM-ENT-000001"&&stores.some(s=>/^SIM-ADMIN-0[1-3]$/.test(s.id)&&s.platformStoreId==="SIM-SHEIN-ADMIN-"+s.id.slice(-2));
 const scope=stores.map(s=>s.id).join(",");
 useEffect(()=>{setOrders(readDemoOrders(organizationId,stores));setSelected(null)},[organizationId,memberId,allowed,scope]);
 const visible=allowed?orders.filter(o=>stores.some(s=>s.id===o.storeId)):[],filtered=visible.filter(o=>(filter==="全部状态"||stages[o.stage]===filter)&&[o.id,o.name,o.sku].join(" ").toLowerCase().includes(search.toLowerCase())),record=visible.find(o=>o.id===selected);
 useEffect(()=>{const d=ref.current;if(selected&&d&&!d.open)d.showModal();else if(!selected&&d?.open)d.close()},[selected]);
 const advance=()=>{if(!record||record.stage>=4||!allowed)return;const next=orders.map(o=>o.id===record.id?{...o,stage:o.stage+1}:o);try{localStorage.setItem("shuomi:demo-orders:"+organizationId+":"+record.storeId,JSON.stringify(next.filter(o=>o.storeId===record.storeId)));setOrders(next);window.dispatchEvent(new Event("shuomi:demo-orders-updated"));setNotice("演示履约状态已更新")}catch{setNotice("保存失败，请检查浏览器存储")}};
 const date=(s:string)=>new Date(s).toLocaleString("zh-CN",{hour12:false});
 return <><section className={css.metrics}>{[["订单总数",visible.length],["待处理订单",visible.filter(o=>o.stage<3).length],["发货中",visible.filter(o=>o.stage===3).length],["履约异常",0]].map(([title,val])=><article key={title}><span>{title}</span><strong>{val}</strong></article>)}</section>
 <section className={css.panel}><header><h2>平台订单记录</h2><span>共 {visible.length} 条 · 模拟订单</span></header>
 <form className={orderCss.toolbar} onSubmit={e=>{e.preventDefault();setSearch(query.trim())}}><input aria-label="搜索订单" placeholder="搜索订单编号 / 商品名称 / SKU" value={query} onChange={e=>setQuery(e.target.value)}/><select aria-label="订单状态" value={filter} onChange={e=>setFilter(e.target.value)}>{["全部状态",...stages].map(v=><option key={v}>{v}</option>)}</select><button type="button" onClick={()=>{setQuery("");setSearch("");setFilter("全部状态")}}>重置</button><button type="submit" className={css.primary}>确认</button></form>
 {visible.length?<div className={css.productDataTable}><table><thead><tr><th>订单编号 / 时间</th><th>商品信息</th><th>所属店铺</th><th>数量</th><th>订单金额</th><th>履约状态</th><th>操作</th></tr></thead><tbody>{filtered.map(o=><tr key={o.id}><td><strong>{o.id}</strong><small className={orderCss.sub}>{date(o.created)}</small></td><td><div className={css.productCachedIdentity}>{o.image&&<img src={o.image} alt={o.name} onError={e=>{e.currentTarget.style.visibility="hidden"}}/>}<div><strong>{o.name}</strong><small>{o.sku} · {o.origin==="shuomi"?"硕米刊登":"商家原有"}</small></div></div></td><td>{stores.find(s=>s.id===o.storeId)?.name}</td><td>1</td><td>{o.amount}</td><td>{stages[o.stage]}（演示）</td><td><button type="button" onClick={()=>{setSelected(o.id);setNotice("")}}>查看</button></td></tr>)}{!filtered.length&&<tr><td colSpan={7}>没有符合筛选条件的订单</td></tr>}</tbody></table></div>:<div className={css.empty}><Truck size={34}/><h3>暂无平台订单</h3><p>当前账号暂无可查看的模拟订单。</p><button type="button" onClick={onStores}>前往我的店铺</button></div>}
 <p className={css.productSyncFootnote}>模拟订单不涉及真实消费者、扣款、采购、物流或库存扣减。</p></section>
 <dialog ref={ref} className={orderCss.dialog} aria-label="订单履约详情" onCancel={e=>{e.preventDefault();setSelected(null)}}>{record&&<><header><h2>订单履约详情</h2><button type="button" onClick={()=>setSelected(null)}>关闭</button></header><p>{record.id} · {date(record.created)}</p><div className={css.productCachedIdentity}>{record.image&&<img src={record.image} alt={record.name}/>}<div><strong>{record.name}</strong><small>{record.sku} · 数量 1 · {record.amount}</small></div></div><div className={orderCss.steps}>{stages.map((v,i)=><div key={v} data-active={i===record.stage}><b>0{i+1}</b> {v} <small>{i<record.stage?"已完成":i===record.stage?"当前":"待开始"}</small></div>)}</div>{notice&&<p role="status">{notice}</p>}<footer><button type="button" onClick={()=>setSelected(null)}>关闭</button>{record.stage<4&&<button type="button" className={css.primary} onClick={advance}>{["模拟处理订单","模拟采购收货","模拟装箱发货","模拟签收完成"][record.stage]}</button>}</footer></>}</dialog></>;
}
