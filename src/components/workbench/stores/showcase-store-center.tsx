"use client";
import {useEffect,useState,type FormEvent} from "react";
import {Building2,Package,Truck,Plus,CheckCircle2,Link2,Search,ShieldCheck} from "lucide-react";
import css from "./showcase-store-center.module.css";

type Store={id:string;name:string;platform:"SHEIN";region:string;type:string;status:"待授权";createdAt:string};
const key="shuomi-store-center-empty-v2";
const steps=[["01","绑定并授权店铺","创建店铺资料，完成平台授权后才可同步商品"],["02","同步店铺商品","授权成功后获取平台商品，并核对同步结果"],["03","接收并处理订单","有订单后进行来源确认、采购和履约处理"],["04","完成发货履约","记录装箱、发货、物流交接与最终结果"]] as const;
const areas=[{name:"我的店铺",path:"/workbench/stores",icon:Building2,description:"管理店铺资料、平台授权与连接状态"},{name:"店铺商品",path:"/workbench/store-products",icon:Package,description:"查看授权后同步的店铺商品及状态"},{name:"订单履约",path:"/workbench/store-orders",icon:Truck,description:"接收订单并追踪采购、发货和物流"}];
function read():Store[]{try{const v=JSON.parse(sessionStorage.getItem(key)||"[]");return Array.isArray(v)?v.filter((x:Store)=>x&&typeof x.id==="string"&&typeof x.name==="string"&&x.platform==="SHEIN"&&x.status==="待授权"):[]}catch{return []}}
export function ShowcaseStoreCenter({pathname,navigate}:{pathname:string;navigate:(path:string)=>void}){
 const [stores,setStores]=useState<Store[]>(read);
 const [dialog,setDialog]=useState(false),[name,setName]=useState(""),[region,setRegion]=useState("美国站"),[type,setType]=useState("半托管");
 const [query,setQuery]=useState(""),[search,setSearch]=useState(""),[notice,setNotice]=useState("");
 useEffect(()=>{try{sessionStorage.setItem(key,JSON.stringify(stores))}catch{}},[stores]);
 useEffect(()=>{setQuery("");setSearch("");setNotice("");setDialog(false)},[pathname]);
 const route=pathname==="/workbench/store-center"?"home":pathname==="/workbench/stores"?"stores":pathname==="/workbench/store-products"?"products":"orders";
 const heading=route==="home"?"店铺中心":route==="stores"?"我的店铺":route==="products"?"店铺商品":"订单履约";
 const intro=route==="home"?"统一管理店铺、商品和订单，从绑定授权到发货履约形成完整经营流程。":route==="stores"?"绑定并授权店铺后，再同步商品与接收订单。":route==="products"?"商品必须来自实际已授权店铺的同步结果，不展示虚构商品。":"订单必须来自平台真实同步记录，不展示虚构交易或履约结果。";
 const link=(path:string)=>navigate(path+"?preview=1");
 const list=stores.filter(x=>[x.name,x.id,x.region,x.type].join(" ").toLowerCase().includes(search.toLowerCase()));
 function add(e:FormEvent){e.preventDefault();if(!name.trim())return;const n:Store={id:"DEMO-"+crypto.randomUUID().slice(0,8).toUpperCase(),name:name.trim(),platform:"SHEIN",region,type,status:"待授权",createdAt:new Date().toLocaleString("zh-CN")};setStores(old=>[...old,n]);setName("");setDialog(false);setNotice("已新增本地演示店铺资料。平台授权未完成，不会同步商品或订单。")}
 return <main className={css.page} data-store-center-showcase={route}>
  <header className={css.header}><div><span className={css.breadcrumb}>店铺中心{route==="home"?"":" / "+heading}</span><h1>{heading}</h1><p>{intro}</p></div>{route==="stores"?<button className={css.primary} onClick={()=>setDialog(true)}><Plus size={16}/>绑定新店铺</button>:route!=="home"?<button onClick={()=>link("/workbench/stores")}>管理我的店铺</button>:null}</header>
  {notice?<div className={css.notice} role="status">{notice}<button onClick={()=>setNotice("")} aria-label="关闭提示">×</button></div>:null}
  {route==="home"?<>
   <section className={css.entries}>{areas.map(a=><article key={a.path}><span className={css.icon}><a.icon size={22}/></span><h2>{a.name}</h2><p>{a.description}</p><button onClick={()=>link(a.path)}>进入{a.name}</button></article>)}</section>
   <section className={css.panel}><header><h2>店铺经营流程</h2><p>先完成店铺绑定与平台授权，再逐步产生商品、订单及履约记录。</p></header><div className={css.steps}>{steps.map(([n,title,desc])=><article key={n}><b>{n}</b><h3>{title}</h3><p>{desc}</p></article>)}</div></section>
   <section className={css.panel}><header><h2>当前经营状态</h2><span>初始数据已清理</span></header><div className={css.metrics}>{[["已绑定店铺",stores.length],["已授权店铺",0],["已同步商品",0],["订单记录",0]].map(([title,val])=><div key={title}><span>{title}</span><strong>{val}</strong></div>)}</div><p className={css.hint}>该页为演示展示，任何新建店铺仍需完成正式平台授权，才可获得真实业务数据。</p></section>
  </>:route==="stores"?<>
   <section className={css.metrics}>{[["店铺总数",stores.length],["已授权",0],["待授权",stores.length],["同步正常",0]].map(([title,val])=><article key={title}><span>{title}</span><strong>{val}</strong></article>)}</section>
   <form className={css.filters} onSubmit={e=>{e.preventDefault();setSearch(query.trim())}}><label><Search size={16}/><input aria-label="搜索店铺" value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索店铺名称、编号或站点"/></label><button type="button" onClick={()=>{setQuery("");setSearch("")}}>重置</button><button className={css.primary} type="submit">确定</button></form>
   <section className={css.panel}><header><h2>店铺列表</h2><span>共 {list.length} 家 · 仅展示本地新建记录</span></header>{list.length?<div className={css.storeList}>{list.map(s=><article key={s.id}><div><strong>{s.name}</strong><small>{s.id} · {s.platform} · {s.region} · {s.type}</small></div><span className={css.pending}><ShieldCheck size={15}/>待授权</span><button onClick={()=>setNotice("展示站无法完成平台 OAuth 授权。请在已登录的正式工作台中绑定并授权。")}>授权说明</button></article>)}</div>:<div className={css.empty}><Building2 size={34}/><h3>{stores.length?"没有符合条件的店铺":"尚未绑定店铺"}</h3><p>{stores.length?"请调整搜索条件。":"清理旧演示店铺后，目前没有任何店铺记录。先绑定并授权店铺，再同步商品与订单。"}</p><button className={css.primary} onClick={()=>stores.length?(setQuery(""),setSearch("")):setDialog(true)}>{stores.length?"清空筛选":"绑定新店铺"}</button></div>}</section>
  </>:<>
   <section className={css.metrics}>{(route==="products"?[["已同步商品",0],["待处理",0],["同步异常",0],["已关联店铺",0]]:[["订单总数",0],["待处理订单",0],["发货中",0],["履约异常",0]]).map(([title,val])=><article key={title}><span>{title}</span><strong>{val}</strong></article>)}</section>
   <section className={css.panel}><header><h2>{route==="products"?"店铺商品列表":"平台订单记录"}</h2><span>共 0 条</span></header><div className={css.empty}>{route==="products"?<Package size={34}/>:<Truck size={34}/>}<h3>{route==="products"?"暂无已同步商品":"暂无平台订单"}</h3><p>{route==="products"?"店铺授权后才能同步真实商品；目前没有商品记录。":"绑定并授权店铺、同步业务数据后，订单才会出现在这里。没有订单时不显示虚构履约进度。"}</p><button className={css.primary} onClick={()=>link("/workbench/stores")}>前往我的店铺</button></div></section>
  </>}
  <p className={css.disclaimer}>展示站数据已从空状态开始；本页不会删除正式业务系统中的店铺、商品、订单及授权。</p>
  {dialog?<div className={css.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setDialog(false)}}><section className={css.dialog} role="dialog" aria-modal="true" aria-label="绑定新店铺"><header><div><h2>绑定新店铺</h2><p>演示资料创建后仍需在正式工作台完成平台授权。</p></div><button aria-label="关闭弹窗" onClick={()=>setDialog(false)}>×</button></header><form onSubmit={add}><label>店铺名称<input required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="输入店铺名称"/></label><label>接入平台<select value="SHEIN" disabled><option>SHEIN</option></select></label><label>站点<select value={region} onChange={e=>setRegion(e.target.value)}><option>美国站</option><option>加拿大站</option><option>其他站点</option></select></label><label>店铺类型<select value={type} onChange={e=>setType(e.target.value)}><option>半托管</option><option>全托管</option><option>自营</option></select></label><footer><button type="button" onClick={()=>setDialog(false)}>取消</button><button className={css.primary} type="submit">创建演示店铺</button></footer></form></section></div>:null}
 </main>
}
