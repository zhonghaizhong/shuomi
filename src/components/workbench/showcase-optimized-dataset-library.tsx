"use client";
import {useEffect,useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {z} from "zod";
import {dataRequest,type DataScope} from "@/lib/api/data-services";
import {customSchema,customSummarySchema,type CustomRequest} from "@/lib/contracts/data-services";
import css from "./showcase-optimized-dataset-library.module.css";
import batchCss from "./showcase-my-data-batches.module.css";
import {customDeliveryDemo,customDeliveryProducts,canSeeCustomDelivery,customDeliveryUrl,customDeliveryImage} from "./showcase-custom-delivery-demo";

type Summary=z.infer<typeof customSummarySchema>;
const stateName:Record<string,string>={SUBMITTED:"已提交",EVALUATING:"需求评估",SPEC_CONFIRMED:"规格已确认",PREPARING:"数据制作中",DELIVERED:"已交付",CLOSED:"已关闭"};
const formatDate=(value:string)=>{const time=new Date(value);return Number.isNaN(time.valueOf())?value:time.toLocaleString("zh-CN",{hour12:false})};
const groupKey=(item:Summary)=>item.name.trim().toLocaleLowerCase()+"|"+item.site;
type Group={key:string;name:string;site:string;items:Summary[]};

export function ShowcaseOptimizedDatasetLibrary({organizationId,memberId}:{organizationId:string;memberId:string}){
 const router=useRouter();
 // Showcase runs without WorkbenchContextProvider; use its isolated identity props.
 // Server authorization still decides whether this identity may read any data.
 const scope=useMemo<DataScope|null>(()=>memberId&&organizationId?{userId:memberId,organizationId}:null,[memberId,organizationId]);
 const [records,setRecords]=useState<Summary[]>([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState("");
 const [query,setQuery]=useState(""),[appliedQuery,setAppliedQuery]=useState(""),[status,setStatus]=useState("全部状态"),[appliedStatus,setAppliedStatus]=useState("全部状态");
 const [expanded,setExpanded]=useState<string[]>([]);
 const [detailId,setDetailId]=useState<string|null>(null),[details,setDetails]=useState<Record<string,CustomRequest>>({});
 const [detailError,setDetailError]=useState(""),[detailLoading,setDetailLoading]=useState(false);
 const [page,setPage]=useState(1);
 const [revision,setRevision]=useState(0);
 const archiveKey="shuomi:custom-dataset-library-v1:"+JSON.stringify([organizationId,memberId]);
 type Preferences={archived:string[];names:Record<string,string>};
 const readPreferences=():Preferences=>{try{const p=JSON.parse(localStorage.getItem(archiveKey)||"{}");return {archived:Array.isArray(p.archived)?p.archived.filter((x:unknown)=>typeof x==="string"):[],names:p.names&&typeof p.names==="object"&&!Array.isArray(p.names)?p.names:{}}}catch{return {archived:[],names:{}}}};
 const [prefs,setPrefs]=useState<Preferences>(readPreferences);
 const [archivedOnly,setArchivedOnly]=useState(false),[manage,setManage]=useState(false),[chosen,setChosen]=useState<string[]>([]),[menu,setMenu]=useState<string|null>(null);
 const [manageQuery,setManageQuery]=useState(""),[manageSearch,setManageSearch]=useState(""),[manageStatus,setManageStatus]=useState("全部状态"),[manageAppliedStatus,setManageAppliedStatus]=useState("全部状态"),[managePage,setManagePage]=useState(1);
 const [renaming,setRenaming]=useState<string|null>(null),[rename,setRename]=useState(""),[prefError,setPrefError]=useState("");
 useEffect(()=>{setPrefs(readPreferences());setArchivedOnly(false);setManage(false);setChosen([]);setMenu(null);setExpanded([]);setDetailId(null);setDetails({});setRecords([]);setPage(1);setPrefError("")},[archiveKey]);
 useEffect(()=>{const close=(e:KeyboardEvent)=>{if(e.key==="Escape"){setManage(false);setMenu(null);setDetailId(null)}};window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close)},[]);
 const savePrefs=(next:Preferences)=>{try{localStorage.setItem(archiveKey,JSON.stringify(next));setPrefs(next);setPrefError("");return true}catch{setPrefError("无法保存本地管理设置，请检查浏览器存储权限。");return false}};
 const archive=(keys:string[],value:boolean)=>{const next=new Set(prefs.archived);keys.forEach(k=>value?next.add(k):next.delete(k));if(savePrefs({...prefs,archived:[...next]})){setChosen([]);setMenu(null);setPage(1);setManagePage(1)}};
 const displayName=(g:Group)=>prefs.names[g.key]||g.name;
 const demoVisible=canSeeCustomDelivery(organizationId,memberId);
 const demoSummary:Summary={id:customDeliveryDemo.id,name:customDeliveryDemo.name,site:"us",mode:"keyword",state:"DELIVERED",createdAt:customDeliveryDemo.created};
 const visibleRecords=demoVisible?[demoSummary,...records.filter(x=>x.id!==customDeliveryDemo.id)]:records;
 useEffect(()=>{
  if(!scope){setRecords([]);setLoading(false);setError("请先确认当前用户和企业。");return}
  const controller=new AbortController();setLoading(true);setError("");
  dataRequest(scope,"custom",z.array(customSummarySchema).max(100),undefined,controller.signal)
   .then(data=>{if(!controller.signal.aborted)setRecords(data)})
   .catch(()=>{if(!controller.signal.aborted){setRecords([]);setError("正式定制记录读取失败，请检查当前企业权限或刷新重试。演示样本不受影响。")}})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return()=>controller.abort();
 },[scope,revision]);
 const groups=useMemo(()=>{
  const map=new Map<string,Group>();
  [...visibleRecords].sort((a,b)=>a.createdAt.localeCompare(b.createdAt)).forEach(item=>{
   const key=groupKey(item);let group=map.get(key);
   if(!group){group={key,name:item.name,site:item.site,items:[]};map.set(key,group)}
   group.items.push(item);
  });
  return [...map.values()].sort((a,b)=>(b.items[b.items.length-1]?.createdAt||"").localeCompare(a.items[a.items.length-1]?.createdAt||""));
 },[records,demoVisible]);
 const filtered=groups.filter(g=>{
  const text=(g.name+" "+g.site+" "+g.items.map(x=>x.id+" "+x.state).join(" ")).toLowerCase();
  return prefs.archived.includes(g.key)===archivedOnly&&(text+" "+displayName(g)).toLowerCase().includes(appliedQuery.toLowerCase())&&(appliedStatus==="全部状态"||g.items.some(x=>stateName[x.state]===appliedStatus));
 });
 const pageCount=Math.max(1,Math.ceil(filtered.length/10)),activePage=Math.min(page,pageCount);
 const rows=filtered.slice((activePage-1)*10,activePage*10);
 const managed=groups.filter(g=>displayName(g).toLowerCase().includes(manageSearch.toLowerCase())&&(manageAppliedStatus==="全部状态"||prefs.archived.includes(g.key)===(manageAppliedStatus==="已归档")));
 const managePages=Math.max(1,Math.ceil(managed.length/6)),mp=Math.min(managePage,managePages);
 const checkedAll=rows.length>0&&rows.every(g=>chosen.includes(g.key));
 const openDetail=async(id:string)=>{
  setDetailId(id);setDetailError("");
  if(id===customDeliveryDemo.id){setDetailLoading(false);return}if(details[id]||!scope)return;
  setDetailLoading(true);
  try{const result=await dataRequest(scope,"custom/"+id,customSchema);setDetails(old=>({...old,[id]:result}))}
  catch{setDetailError("无法读取该定制订单的实际详情，请检查当前身份及服务状态。")}
  finally{setDetailLoading(false)}
 };
 const selected=detailId?details[detailId]:null;
 const apply=()=>{setAppliedQuery(query.trim());setAppliedStatus(status);setPage(1)};
 const reset=()=>{setQuery("");setAppliedQuery("");setStatus("全部状态");setAppliedStatus("全部状态");setPage(1)};
 return <section className={css.page+" "+batchCss.wrapper} aria-label="用户定制数据集">
  <section className={css.filterBar} data-shuomi-filter="balanced" aria-label="定制数据集筛选">
   <label className={css.search}><span aria-hidden="true">⌕</span><input aria-label="搜索定制数据集" placeholder="搜索数据集名称 / 站点 / 编号" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")apply()}}/></label>
   <div className={css.filterActions}><select aria-label="定制数据集状态" value={status} onChange={e=>setStatus(e.target.value)}><option>全部状态</option>{Object.values(stateName).map(v=><option key={v}>{v}</option>)}</select><button type="button" onClick={reset}>重置</button><button type="button" className={css.primary} onClick={apply}>确认</button></div>
  </section>
  <section className={css.panel}>
   <header className={batchCss.heading}><div><h2>{archivedOnly?"已归档数据集":"定制数据集"}</h2><span>共 {filtered.length} 个数据集</span></div><div className={batchCss.headingActions}><button type="button" aria-pressed={archivedOnly} onClick={()=>{setArchivedOnly(v=>!v);setChosen([]);setMenu(null);setPage(1)}}>{archivedOnly?"返回批次":"已归档"}</button><button type="button" onClick={()=>{setManage(true);setManagePage(1);setManageQuery("");setManageSearch("");setManageStatus("全部状态");setManageAppliedStatus("全部状态");setRenaming(null)}}>管理批次</button></div></header>
   <div className={css.tableWrap}><table><thead><tr><th><label className={batchCss.batchTitle}><input type="checkbox" aria-label="选择当前页所有数据集" disabled={!rows.length} checked={checkedAll} onChange={e=>setChosen(old=>e.target.checked?[...new Set([...old,...rows.map(g=>g.key)])]:old.filter(k=>!rows.some(g=>g.key===k)))}/>数据集名称</label></th><th>数据来源</th><th>定制范围</th><th>已交付</th><th>最新版本</th><th>交付状态</th><th>创建时间</th><th>操作</th></tr></thead>
    {rows.map(g=>{
     const newest=g.items[g.items.length-1],done=g.items.filter(x=>x.state==="DELIVERED"),isOpen=expanded.includes(g.key);
     const versionOf=(item:Summary)=>g.items.indexOf(item)+1;
     return <tbody key={g.key} className={css.groupBody}>
      <tr><td><div className={batchCss.batchName}><input type="checkbox" aria-label={"选择数据集 "+displayName(g)} checked={chosen.includes(g.key)} onChange={e=>setChosen(old=>e.target.checked?[...old,g.key]:old.filter(k=>k!==g.key))}/><div className={css.datasetName}><strong>{displayName(g)}</strong><small>{newest.id===customDeliveryDemo.id?"演示订单 · 公开商品样本":"定制数据集 · 版本独立保存"}</small></div></div></td>
       <td><span className={css.tag}>{newest.id===customDeliveryDemo.id?"用户定制（演示）":"用户定制"}</span></td><td>{g.site.toUpperCase()} <small>Amazon · 按需定制</small></td>
       <td><b className={css.metric}>{newest.id===customDeliveryDemo.id?"3 条":done.length}</b></td><td><b className={css.version}>V{versionOf(newest)}</b></td>
       <td><span className={newest.state==="DELIVERED"?css.delivered:css.pending}>{stateName[newest.state]||newest.state}</span></td>
       <td className={css.date}>{formatDate(g.items[0].createdAt)}</td>
       <td><div className={css.actions}><button type="button" aria-expanded={isOpen} onClick={()=>setExpanded(old=>isOpen?old.filter(k=>k!==g.key):[...old,g.key])}>{isOpen?"收起":"展开"}</button><div className={css.menuHost}><button type="button" aria-expanded={menu===g.key} onClick={()=>setMenu(old=>old===g.key?null:g.key)}>更多</button>{menu===g.key&&<div className={css.rowMenu} role="group" aria-label={"数据集操作 "+displayName(g)}><button type="button" onClick={()=>{openDetail(newest.id);setMenu(null)}}>查看详情</button>{newest.id===customDeliveryDemo.id&&<a href={customDeliveryUrl("csv")} download="amazon-us-drinkware-v1.csv" onClick={()=>setMenu(null)}>下载文档（CSV）</a>}<button type="button" onClick={()=>archive([g.key],!archivedOnly)}>{archivedOnly?"恢复批次":"归档批次"}</button></div>}</div></div></td></tr>
      {isOpen?<tr className={css.expandedRow}><td colSpan={8}><section className={css.versions}><header><strong>数据集版本</strong><span>按真实定制订单记录版本 · 已交付的数据不会被后续版本覆盖</span></header>
       <div className={css.versionItems}>{[...g.items].reverse().map(item=><div className={css.versionItem} key={item.id}>
        <div className={css.versionInfo}><strong>V{versionOf(item)} · {item.name}</strong><small>{formatDate(item.createdAt)} · {item.site.toUpperCase()} · 定制订单 {item.id.slice(0,8)}</small></div>
        <span className={item.state==="DELIVERED"?css.delivered:css.pending}>{stateName[item.state]||item.state}</span>
        <div className={css.actions}><button type="button" onClick={()=>openDetail(item.id)}>查看详情</button>{item.id===customDeliveryDemo.id&&<a href={customDeliveryUrl("csv")} download="amazon-us-drinkware-v1.csv">下载数据</a>}</div>
       </div>)}</div>
      </section></td></tr>:null}
     </tbody>
    })}
   </table>
   {loading&&!visibleRecords.length?<p className={css.empty} role="status">正在读取当前账号的定制数据集…</p>:error&&!demoVisible?<p className={css.empty} role="alert">{error}</p>:!filtered.length?<p className={css.empty} role="status">{archivedOnly?"暂无已归档数据集":visibleRecords.length?"没有匹配的定制数据集。":"当前账号暂无定制数据集。"}</p>:null}
   </div>
   {chosen.length>0&&<div className={batchCss.bulkBar}><span>已选择 {chosen.length} 批</span><button type="button" onClick={()=>archive(chosen,!archivedOnly)}>{archivedOnly?"批量恢复":"批量归档"}</button><button type="button" onClick={()=>setChosen([])}>取消选择</button></div>}
   {prefError&&<p role="alert">{prefError}</p>}
   <footer className={css.pagination}><span>显示 {rows.length} / {filtered.length} 个数据集 · 第 {activePage} / {pageCount} 页</span><div><button type="button" disabled={activePage===1} onClick={()=>setPage(v=>v-1)}>上一页</button><button type="button" disabled={activePage===pageCount} onClick={()=>setPage(v=>v+1)}>下一页</button><button type="button" onClick={()=>setRevision(v=>v+1)}>刷新</button></div></footer>
  </section>
  {manage&&<div className={batchCss.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setManage(false)}}><section className={batchCss.manageDialog+" "+css.datasetManager} role="dialog" aria-modal="true" aria-label="管理数据集批次"><header className={batchCss.manageHeader}><div><h2>批次管理</h2><p>管理已交付数据集的显示名称及归档状态，原始文件和历史订单保持不变。</p></div><div className={batchCss.manageHeaderActions}><button type="button" className={batchCss.primary} onClick={()=>{setManage(false);router.push("/workbench/data/market")}}>前往数据定制</button><button type="button" onClick={()=>setManage(false)}>关闭</button></div></header><form data-dataset-manage-filter className={batchCss.manageFilters} onSubmit={e=>{e.preventDefault();setManageSearch(manageQuery.trim());setManageAppliedStatus(manageStatus);setManagePage(1)}}><label className={batchCss.manageSearch}><span aria-hidden="true">⌕</span><input aria-label="搜索批次名称" placeholder="搜索批次名称" value={manageQuery} onChange={e=>setManageQuery(e.target.value)}/></label><select aria-label="管理批次状态" value={manageStatus} onChange={e=>setManageStatus(e.target.value)}>{["全部状态","未归档","已归档"].map(s=><option key={s}>{s}</option>)}</select><button type="button" onClick={()=>{setManageQuery("");setManageSearch("");setManageStatus("全部状态");setManageAppliedStatus("全部状态");setManagePage(1)}}>重置</button><button className={batchCss.primary} type="submit">确认</button></form>{prefError&&<p role="alert">{prefError}</p>}<div className={batchCss.manageTableScroll}><table className={batchCss.manageTable}><thead><tr><th>批次名称</th><th>数据来源</th><th>站点</th><th>版本数</th><th>创建时间</th><th>状态</th><th>操作</th></tr></thead><tbody>{managed.slice((mp-1)*6,mp*6).map(g=><tr key={g.key}><td className={batchCss.manageNameCell}>{renaming===g.key?<form className={batchCss.manageRenameForm} onSubmit={e=>{e.preventDefault();if(rename.trim()&&savePrefs({...prefs,names:{...prefs.names,[g.key]:rename.trim()}}))setRenaming(null)}}><input aria-label="批次名称" required maxLength={100} value={rename} onChange={e=>setRename(e.target.value)}/><button type="submit">保存</button><button type="button" onClick={()=>setRenaming(null)}>取消</button></form>:<strong>{displayName(g)}</strong>}</td><td>用户定制</td><td>{g.site.toUpperCase()}</td><td>{g.items.length}</td><td>{formatDate(g.items[0].createdAt)}</td><td>{prefs.archived.includes(g.key)?"已归档":"未归档"}</td><td><div className={batchCss.manageActions}><button type="button" onClick={()=>{setRenaming(g.key);setRename(displayName(g))}}>重命名</button><button type="button" className={batchCss.archiveAction} onClick={()=>archive([g.key],!prefs.archived.includes(g.key))}>{prefs.archived.includes(g.key)?"恢复":"归档"}</button></div></td></tr>)}</tbody></table>{!managed.length&&<p className={batchCss.empty}>暂无符合条件的批次</p>}</div><footer className={batchCss.manageFooter}><span>共 {managed.length} 批 · 第 {mp} / {managePages} 页</span><div><button type="button" disabled={mp===1} onClick={()=>setManagePage(v=>v-1)}>上一页</button><button type="button" disabled={mp===managePages} onClick={()=>setManagePage(v=>v+1)}>下一页</button></div></footer></section></div>}
  {detailId?<div className={css.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setDetailId(null)}}><section className={css.detail} role="dialog" aria-modal="true" aria-label="定制数据集版本详情">
   <header><div><h3>定制版本详情</h3><p>正式记录按权限读取；演示交付明确标记。</p></div><button type="button" onClick={()=>setDetailId(null)}>关闭</button></header>
   {detailId===customDeliveryDemo.id&&demoVisible?<div className={css.detailBody}><div><span>数据集名称</span><strong>{customDeliveryDemo.name}</strong></div><div><span>交付状态</span><strong>已交付（演示）</strong></div><div><span>交付数量</span><strong>3 条 · V1</strong></div><div><span>订单编号</span><strong>{customDeliveryDemo.id}</strong></div><div><span>交付文件</span><a href={customDeliveryUrl("csv")} download="amazon-us-drinkware-v1.csv">下载 CSV</a><a href={customDeliveryUrl("json")} download="amazon-us-drinkware-v1.json">下载 JSON</a></div><div><span>交付日期</span><strong>2026-11-28</strong></div><div style={{gridColumn:"1 / -1"}}><span>数据预览</span>{customDeliveryProducts.map(p=><article key={p.asin} style={{display:"flex",gap:16,alignItems:"flex-start",padding:"12px 0",borderBottom:"1px solid currentColor"}}><a href={customDeliveryImage(p.imagePath)} target="_blank" rel="noreferrer"><img src={customDeliveryImage(p.imagePath)} alt={p.title+" AI演示商品图"} width={96} height={96} style={{objectFit:"contain",borderRadius:6,background:"#fff"}}/></a><section><strong>{p.title}</strong><p>{p.asin} · {p.brand} · {p.site.toUpperCase()} · {p.category}</p><p>{p.material} · {p.color} · {p.size_label}</p><p>{p.description}</p><p>USD {p.price.toFixed(2)} · 库存 {p.stock} 件（模拟） · {p.rating} 星 · {p.reviewCount} 条评价（样本）</p><a href={p.sourceUrl} target="_blank" rel="noreferrer">查看参考来源</a></section></article>)}</div><p className={css.detailNote}>商品参考公开页面；价格、库存为模拟值，图片为AI生成的演示素材。模拟订单、支付及验收不代表真实交易。公开文件不含私有数据。</p></div>:detailLoading?<p role="status">正在读取定制版本…</p>:detailError?<p role="alert">{detailError}</p>:selected?<div className={css.detailBody}>
    <div><span>数据集名称</span><strong>{selected.input.name}</strong></div>
    <div><span>交付状态</span><strong>{stateName[selected.state]||selected.state}</strong></div>
    <div><span>定制站点</span><strong>{selected.input.query.site.toUpperCase()}</strong></div>
    <div><span>数据量</span><strong>{selected.deliveredRows} 条已交付</strong></div>
    <div><span>交付格式</span><strong>{(selected.spec?.format||selected.input.format).toUpperCase()}</strong></div>
    <div><span>规格版本</span><strong>第 {selected.specRevision} 次规格确认</strong></div>
    <div><span>创建时间</span><strong>{formatDate(selected.createdAt)}</strong></div>
    <div><span>订单编号</span><strong>{selected.id}</strong></div>
    <p className={css.detailNote}>规格修订和新的交付订单均保留历史记录。此页面不伪造预览数据或下载地址；实际交付文件以数据定制服务的交付入口为准。</p>
   </div>:null}
  </section></div>:null}
 </section>;
}
