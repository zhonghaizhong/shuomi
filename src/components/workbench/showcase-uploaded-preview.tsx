"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./showcase-uploaded-preview.module.css";

type Item={sku:string;name:string;batch:string;site:string;platform:string;method:string;time:string;productId:string};
const records:Item[]=[
 {sku:"SM-240819-006",name:"示例商品 A",batch:"240819",site:"美国站",platform:"SHEIN",method:"直接上架",time:"2026-08-19",productId:"示例记录 006"},
 {sku:"SM-240819-017",name:"示例商品 B",batch:"240819",site:"加拿大站",platform:"SHEIN",method:"发布到草稿箱",time:"2026-08-19",productId:"示例记录 017"},
 {sku:"SM-240818-045",name:"示例商品 C",batch:"240818",site:"美国站",platform:"SHEIN",method:"直接上架",time:"2026-08-18",productId:"示例记录 045"},
 {sku:"SM-240818-062",name:"示例商品 D",batch:"240818",site:"加拿大站",platform:"SHEIN",method:"发布到草稿箱",time:"2026-08-18",productId:"示例记录 062"},
 {sku:"SM-240817-033",name:"示例商品 E",batch:"240817",site:"美国站",platform:"SHEIN",method:"直接上架",time:"2026-08-17",productId:"示例记录 033"},
 {sku:"SM-240817-079",name:"示例商品 F",batch:"240817",site:"加拿大站",platform:"SHEIN",method:"发布到草稿箱",time:"2026-08-17",productId:"示例记录 079"}
];
const stages=[["waiting","待上传"],["missing","待补全"],["review","待审核"],["uploaded","已上传"]] as const;
export function ShowcaseUploadedPreview(){
 const router=useRouter();
 const [platform,setPlatform]=useState("全部平台"),[site,setSite]=useState("全部站点"),[method,setMethod]=useState("全部方式"),[query,setQuery]=useState("");
 const [filters,setFilters]=useState({platform:"全部平台",site:"全部站点",method:"全部方式",query:""});
 const [page,setPage]=useState(1),[selected,setSelected]=useState<Item|null>(null);
 const closeDetail=useRef<HTMLButtonElement>(null);
 useEffect(()=>{
   if(!selected)return;
   const previous=document.activeElement as HTMLElement|null;
   closeDetail.current?.focus();
   const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape"){e.preventDefault();setSelected(null);}};
   document.addEventListener("keydown",onKey);
   return()=>{document.removeEventListener("keydown",onKey);previous?.focus?.();};
 },[selected]);
 const filtered=useMemo(()=>records.filter(item=>
  (filters.platform==="全部平台"||item.platform===filters.platform)&&
  (filters.site==="全部站点"||item.site===filters.site)&&
  (filters.method==="全部方式"||item.method===filters.method)&&
  (item.name+" "+item.sku+" "+item.batch+" "+item.productId).toLowerCase().includes(filters.query.toLowerCase())
 ),[filters]);
 const visible=filtered.slice((page-1)*4,page*4);
 const apply=()=>{setFilters({platform,site,method,query});setPage(1);};
 const reset=()=>{setPlatform("全部平台");setSite("全部站点");setMethod("全部方式");setQuery("");setFilters({platform:"全部平台",site:"全部站点",method:"全部方式",query:""});setPage(1);};
 const pages=Math.max(1,Math.ceil(filtered.length/4));
 return <div className={styles.page} data-showcase-uploaded>
  <header className={styles.heading}><div><small>商品刊登 / 我的供应链 / 已上传</small><h1>已上传</h1><p>查看已提交的商品、目标平台与发布方式，核对平台记录和上传时间。</p></div></header>
  <section className={styles.metrics}>
   {[[String(records.length),"已上传商品","当前演示记录"],[String(records.filter(x=>x.method==="直接上架").length),"直接上架","已提交上架方式"],[String(records.filter(x=>x.method==="发布到草稿箱").length),"平台草稿","已提交至草稿箱"]].map(([value,title,sub],i)=><article key={title} data-tone={i}><strong>{value}</strong><span><b>{title}</b><small>{sub}</small></span></article>)}
  </section>
  <nav className={styles.stages} aria-label="商品刊登阶段">{stages.map(([id,label])=><button key={id} type="button" aria-current={id==="uploaded"?"page":undefined} onClick={()=>id==="uploaded"?undefined:router.push("/workbench/listing/"+id+"?preview=1")}>{label}</button>)}</nav>
  <section className={styles.panel}>
   <div className={styles.toolbar}>
    <div className={styles.filters}>
     <label>平台<select aria-label="已发布平台" value={platform} onChange={e=>setPlatform(e.target.value)}><option>全部平台</option><option>SHEIN</option></select></label>
     <label>站点<select aria-label="已发布站点" value={site} onChange={e=>setSite(e.target.value)}><option>全部站点</option><option>美国站</option><option>加拿大站</option></select></label>
     <label>发布方式<select aria-label="发布方式" value={method} onChange={e=>setMethod(e.target.value)}><option>全部方式</option><option>直接上架</option><option>发布到草稿箱</option></select></label>
    </div>
    <div className={styles.search}><input aria-label="搜索已上传商品" placeholder="搜索商品名称、SKU、批次" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")apply();}}/><button onClick={reset} type="button">重置</button><button className={styles.primary} onClick={apply} type="button">确认</button></div>
   </div>
   <div className={styles.listTitle}><h2>已上传商品</h2><span>共 {filtered.length} 条演示记录</span></div>
   <div className={styles.tableScroll}><div className={styles.table}>
    <div className={styles.columns}><span>商品名称 / SKU</span><span>批次</span><span>目标平台 / 站点</span><span>平台商品ID</span><span>上传时间</span><span>发布方式</span><span>操作</span></div>
    {visible.map(item=><div className={styles.item} key={item.sku}>
      <span><b>{item.name}</b><small>{item.sku}</small></span><span>{item.batch}</span><span>{item.platform}<small>{item.site}</small></span><span>{item.productId}</span><span>{item.time}</span><span className={styles.method} data-draft={item.method==="发布到草稿箱"}>{item.method}</span><button type="button" onClick={()=>setSelected(item)}>查看商品</button>
    </div>)}
   </div></div>
   {!filtered.length?<div className={styles.empty}>没有符合筛选条件的商品。可重置筛选后重新查看。</div>:null}
   <footer className={styles.pagination}><span>第 {page} / {pages} 页 · 每页最多 4 条</span><div><button type="button" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>上一页</button><button type="button" disabled={page>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>下一页</button></div></footer>
  </section>
  <p className={styles.disclaimer}>此页面展示的商品及时间均为原型演示记录，并非真实店铺上传状态。</p>
  {selected&&<div className={styles.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null);}}><section className={styles.dialog} role="dialog" aria-modal="true" aria-label="查看商品详情"><header><div><small>已上传 / 查看商品</small><h2>{selected.name}</h2></div><button type="button" ref={closeDetail} aria-label="关闭商品详情" onClick={()=>setSelected(null)}>×</button></header><dl>{[["SKU",selected.sku],["批次",selected.batch],["平台与站点",selected.platform+" · "+selected.site],["平台商品ID",selected.productId],["上传时间",selected.time],["发布方式",selected.method]].map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><p>演示详情仅用于核对字段布局，不会打开真实的平台商品或修改上传记录。</p><footer><button type="button" onClick={()=>setSelected(null)}>返回商品列表</button></footer></section></div>}
 </div>;
}
