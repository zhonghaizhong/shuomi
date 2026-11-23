"use client";
import {useEffect,useMemo,useState} from "react";
import {readDemoCollectionBatches,type DemoCollectionBatch} from "./showcase-collection-batches";
import css from "./showcase-my-data-batches.module.css";

export function ShowcaseMyDataBatches({organizationId,memberId}:{organizationId:string;memberId:string}){
 const [tab,setTab]=useState("采集批次");
 const [query,setQuery]=useState("");
 const [source,setSource]=useState("全部来源");
 const [selected,setSelected]=useState<string|null>(null);
 const [batches,setBatches]=useState<DemoCollectionBatch[]>(()=>readDemoCollectionBatches(organizationId,memberId));
 const [page,setPage]=useState(1);
 useEffect(()=>{
  const refresh=()=>setBatches(readDemoCollectionBatches(organizationId,memberId));
  refresh();
  const onUpdate=(event:Event)=>{const detail=(event as CustomEvent<{organizationId:string}>).detail;if(detail?.organizationId===organizationId)refresh();};
  window.addEventListener("shuomi:demo-batches-updated",onUpdate);
  return()=>window.removeEventListener("shuomi:demo-batches-updated",onUpdate);
 },[organizationId,memberId]);
 const visible=useMemo(()=>batches.filter(b=>(source==="全部来源"||b.source===source)&&(b.name+" "+b.id+" "+b.source+" "+b.products.map(p=>p.name).join(" ")).toLowerCase().includes(query.toLowerCase())),[batches,source,query]);
 const chosen=visible.find(b=>b.id===selected);
 const pageSize=10;
 const pageCount=Math.max(1,Math.ceil(visible.length/pageSize));
 const currentPage=Math.min(page,pageCount);
 const rows=visible.slice((currentPage-1)*pageSize,currentPage*pageSize);
 return <div className={css.wrapper} data-my-data-owner={memberId} data-my-data-organization={organizationId}>
  <section className={css.flow}><strong>采集批次怎么用？</strong><div><span>原始商品数据</span><span>转入待上传</span><span>整理商品资料</span><span>上架其他平台</span></div><small>演示数据可查看，不会写入真实商品库</small></section>
  <nav className={css.tabs} aria-label="我的数据分类">{["采集批次","自有商品库","数据集"].map(name=><button type="button" key={name} aria-current={tab===name?"page":undefined} onClick={()=>{setTab(name);setSelected(null);setPage(1);}}>{name}</button>)}</nav>
  <section className={css.panel} aria-label={tab}>
   <header className={css.heading}><div><h2>{tab==="采集批次"?"采集批次":tab}<span>{tab==="采集批次"?batches.length:0} {tab==="采集批次"?"批":"条"}</span></h2><p>仅显示当前登录账号在当前企业下采集的记录，企业管理员也不查看他人采集的数据。</p></div></header>
   {tab==="采集批次"?<>
    <div className={css.filters}><select aria-label="采集来源" value={source} onChange={e=>{setSource(e.target.value);setSelected(null);setPage(1);}}>{["全部来源","1688","Amazon"].map(item=><option key={item}>{item}</option>)}</select><input aria-label="搜索采集批次" value={query} onChange={e=>{setQuery(e.target.value);setSelected(null);setPage(1);}} placeholder="搜索批次、商品或编号"/><button type="button" onClick={()=>{setSource("全部来源");setQuery("");setSelected(null);setPage(1);}}>重置</button></div>
    <div className={css.tableScroll}><table><thead><tr><th>批次名称</th><th>来源</th><th>产品数</th><th>创建时间</th><th>上传状态</th><th>操作</th></tr></thead><tbody>{rows.map(b=><tr key={b.id}><td><strong>{b.name}</strong><small>{b.id}</small></td><td>{b.source} · {b.method}</td><td>{b.products.length} 个</td><td>{b.createdAt}</td><td><span className={css.status}>{b.status}</span></td><td><button type="button" onClick={()=>setSelected(old=>old===b.id?null:b.id)}>{selected===b.id?"收起":"查看产品"}</button></td></tr>)}</tbody></table>{!rows.length?<p className={css.empty} role="status">暂无采集批次。前往「我的工具 → 商品采集插件 → 在线采集」创建本账号的采集任务。</p>:null}</div>
    {chosen?<section className={css.details} aria-label="批次产品明细"><header><div><h3>{chosen.name}</h3><p>采集人：当前账号 · {chosen.products.length} 个模拟商品 · 不代表真实1688数据</p></div><button type="button" onClick={()=>setSelected(null)}>关闭明细</button></header><div className={css.tableScroll}><table><thead><tr><th>序号</th><th>商品名称</th><th>演示 SKU</th><th>来源</th><th>参考价格</th><th>数据标记</th></tr></thead><tbody>{chosen.products.map((item,i)=><tr key={item.id}><td>{i+1}</td><td>{item.name}</td><td>{item.sku}</td><td>{item.source}</td><td>{item.price}</td><td>{item.status}</td></tr>)}</tbody></table></div></section>:null}
    <footer className={css.pagination}><span>共 {visible.length} 个批次 · 第 {currentPage}/{pageCount} 页</span><div><button type="button" disabled={currentPage===1} onClick={()=>setPage(p=>p-1)}>上一页</button><button type="button" disabled={currentPage===pageCount} onClick={()=>setPage(p=>p+1)}>下一页</button></div></footer>
   </>:<p className={css.empty} role="status">暂无{tab}数据。采集批次不会自动写入此分类。</p>}
  </section>
 </div>;
}
