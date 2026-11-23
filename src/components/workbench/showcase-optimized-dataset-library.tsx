"use client";
import {useEffect,useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {optimizedDatasetsChanged,readOptimizedDatasets} from "./showcase-optimized-datasets";
import css from "./showcase-optimized-dataset-library.module.css";
export function ShowcaseOptimizedDatasetLibrary({organizationId,memberId}:{organizationId:string;memberId:string}){
 const router=useRouter();
 const [revision,setRevision]=useState(0),[search,setSearch]=useState(""),[selectedId,setSelectedId]=useState("");
 useEffect(()=>{const onUpdated=(event:Event)=>{const detail=(event as CustomEvent<{organizationId:string;memberId:string}>).detail;if(detail?.organizationId===organizationId&&detail?.memberId===memberId)setRevision(v=>v+1)};window.addEventListener(optimizedDatasetsChanged,onUpdated);return()=>window.removeEventListener(optimizedDatasetsChanged,onUpdated)},[organizationId,memberId]);
 const datasets=useMemo(()=>readOptimizedDatasets(organizationId,memberId),[organizationId,memberId,revision]);
 const filtered=datasets.filter(d=>(d.name+" "+d.sourceBatchName+" "+d.platform+" "+d.site+" "+d.language).toLowerCase().includes(search.toLowerCase()));
 const selected=datasets.find(x=>x.id===selectedId);
 return <section className={css.page} aria-label="优化数据集">
  <header className={css.heading}><div><h2>数据集</h2><p>已验证上传成功的优化版本保存在这里。原始商品保持不变，可以跨平台复用，但每次仍须重新适配目标站点。</p></div><span>优化版本 <strong>{datasets.length}</strong></span></header>
  <div className={css.guide}><strong>区分三种数据</strong><div><span>采集批次 · 原始采集资料</span><span>自有商品库 · 自有原始资料</span><span>数据集 · 已优化的可复用版本</span></div></div>
  <label className={css.search}>搜索优化版本<input aria-label="搜索优化版本" placeholder="批次名称 / 来源 / 适配站点 / 语言" value={search} onChange={e=>setSearch(e.target.value)}/></label>
  <div className={css.tableWrap}><table><thead><tr><th>优化数据集</th><th>原始来源</th><th>原适配站点 / 语言</th><th>商品数</th><th>版本</th><th>操作</th></tr></thead><tbody>{filtered.map(d=><tr key={d.id}><td><strong>{d.name}</strong><small>{d.createdAt}</small></td><td>{d.sourceKind}<small>{d.sourceBatchName}</small></td><td>{d.platform} · {d.site}<small>{d.language}</small></td><td>{d.products.length}</td><td>V{d.version}</td><td><button type="button" onClick={()=>setSelectedId(d.id)}>查看来源与版本</button><button type="button" onClick={()=>{sessionStorage.setItem("shuomi:listing-dataset-prefill:"+organizationId+":"+memberId,d.id);router.push("/workbench/listing/waiting?preview=1");}}>再次刊登</button></td></tr>)}</tbody></table>{!filtered.length?<p role="status" className={css.empty}>{datasets.length?"没有匹配的优化版本。":"暂无优化数据集。必须先完成平台适配并收到真实上传成功回执，才会保存优化版本；这里不会伪造批次。"}</p>:null}</div>
  {selected?<div className={css.overlay} onClick={e=>{if(e.target===e.currentTarget)setSelectedId("")}}><section className={css.detail} role="dialog" aria-modal="true" aria-label="优化版本详情"><header><div><h3>{selected.name} · V{selected.version}</h3><p>来源：{selected.sourceKind} / {selected.sourceBatchName}</p></div><button type="button" onClick={()=>setSelectedId("")}>关闭</button></header><p>原平台：{selected.platform} · {selected.site} · {selected.language} · {selected.storeName}</p><p>包含 {selected.products.length} 件商品。再次刊登会复用此版本的内容作为起点，自动适配仍须根据目标平台规则重新检查。</p><div className={css.products}>{selected.products.slice(0,20).map(p=><span key={p.sourceProductId}>{p.name}</span>)}</div><footer>原始批次、价格、库存与既有历史版本不被修改。</footer></section></div>:null}
 </section>;
}
