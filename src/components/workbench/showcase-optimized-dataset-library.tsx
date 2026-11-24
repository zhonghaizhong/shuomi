"use client";
import {useEffect,useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {z} from "zod";
import {useWorkbenchContext} from "@/components/providers/workbench-context-provider";
import {dataRequest,type DataScope} from "@/lib/api/data-services";
import {customSchema,customSummarySchema,type CustomRequest} from "@/lib/contracts/data-services";
import css from "./showcase-optimized-dataset-library.module.css";

type Summary=z.infer<typeof customSummarySchema>;
const stateName:Record<string,string>={SUBMITTED:"已提交",EVALUATING:"需求评估",SPEC_CONFIRMED:"规格已确认",PREPARING:"数据制作中",DELIVERED:"已交付",CLOSED:"已关闭"};
const formatDate=(value:string)=>{const time=new Date(value);return Number.isNaN(time.valueOf())?value:time.toLocaleString("zh-CN",{hour12:false})};
const groupKey=(item:Summary)=>item.name.trim().toLocaleLowerCase()+"|"+item.site;
type Group={key:string;name:string;site:string;items:Summary[]};

export function ShowcaseOptimizedDatasetLibrary({organizationId,memberId}:{organizationId:string;memberId:string}){
 const router=useRouter();
 const context=useWorkbenchContext();
 const userId=context.user?.id;
 const scope=useMemo<DataScope|null>(()=>userId?{userId,organizationId}:null,[userId,organizationId]);
 const [records,setRecords]=useState<Summary[]>([]);
 const [loading,setLoading]=useState(true),[error,setError]=useState("");
 const [query,setQuery]=useState(""),[appliedQuery,setAppliedQuery]=useState(""),[status,setStatus]=useState("全部状态"),[appliedStatus,setAppliedStatus]=useState("全部状态");
 const [expanded,setExpanded]=useState<string[]>([]);
 const [detailId,setDetailId]=useState<string|null>(null),[details,setDetails]=useState<Record<string,CustomRequest>>({});
 const [detailError,setDetailError]=useState(""),[detailLoading,setDetailLoading]=useState(false);
 const [page,setPage]=useState(1);
 const [revision,setRevision]=useState(0);
 useEffect(()=>{
  if(!scope){setRecords([]);setLoading(false);setError("请先确认当前用户和企业。");return}
  const controller=new AbortController();setLoading(true);setError("");
  dataRequest(scope,"custom",z.array(customSummarySchema).max(100),undefined,controller.signal)
   .then(data=>{if(!controller.signal.aborted)setRecords(data)})
   .catch(()=>{if(!controller.signal.aborted){setRecords([]);setError("定制数据集读取失败，请检查当前企业权限或刷新重试。")}})
   .finally(()=>{if(!controller.signal.aborted)setLoading(false)});
  return()=>controller.abort();
 },[scope,revision]);
 const groups=useMemo(()=>{
  const map=new Map<string,Group>();
  [...records].sort((a,b)=>a.createdAt.localeCompare(b.createdAt)).forEach(item=>{
   const key=groupKey(item);let group=map.get(key);
   if(!group){group={key,name:item.name,site:item.site,items:[]};map.set(key,group)}
   group.items.push(item);
  });
  return [...map.values()].sort((a,b)=>(b.items[b.items.length-1]?.createdAt||"").localeCompare(a.items[a.items.length-1]?.createdAt||""));
 },[records]);
 const filtered=groups.filter(g=>{
  const text=(g.name+" "+g.site+" "+g.items.map(x=>x.id+" "+x.state).join(" ")).toLowerCase();
  return text.includes(appliedQuery.toLowerCase())&&(appliedStatus==="全部状态"||g.items.some(x=>stateName[x.state]===appliedStatus));
 });
 const pageCount=Math.max(1,Math.ceil(filtered.length/10)),activePage=Math.min(page,pageCount);
 const rows=filtered.slice((activePage-1)*10,activePage*10);
 const deliveredCount=records.filter(x=>x.state==="DELIVERED").length;
 const openDetail=async(id:string)=>{
  setDetailId(id);setDetailError("");
  if(details[id]||!scope)return;
  setDetailLoading(true);
  try{const result=await dataRequest(scope,"custom/"+id,customSchema);setDetails(old=>({...old,[id]:result}))}
  catch{setDetailError("无法读取该定制订单的实际详情，请检查当前身份及服务状态。")}
  finally{setDetailLoading(false)}
 };
 const selected=detailId?details[detailId]:null;
 const apply=()=>{setAppliedQuery(query.trim());setAppliedStatus(status);setPage(1)};
 const reset=()=>{setQuery("");setAppliedQuery("");setStatus("全部状态");setAppliedStatus("全部状态");setPage(1)};
 return <section className={css.page} aria-label="用户定制数据集">
  <header className={css.heading}>
   <div><h2>数据集</h2><p>管理用户定制的数据集、交付记录和历史版本；同名同站点的交付按版本展示，原始交付保留。</p></div>
   <div className={css.headingStats}><span>定制数据集 <strong>{groups.length}</strong></span><span>已交付 <strong>{deliveredCount}</strong></span></div>
  </header>
  <div className={css.guide}><strong>数据来源说明</strong><span>采集批次 · 自行采集</span><span>自有商品库 · 自有商品资料</span><span>数据集 · 用户定制与交付</span></div>
  <section className={css.filterBar} data-shuomi-filter="balanced" aria-label="定制数据集筛选">
   <label className={css.search}><span aria-hidden="true">⌕</span><input aria-label="搜索定制数据集" placeholder="搜索数据集名称 / 站点 / 编号" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")apply()}}/></label>
   <div className={css.filterActions}><select aria-label="定制数据集状态" value={status} onChange={e=>setStatus(e.target.value)}><option>全部状态</option>{Object.values(stateName).map(v=><option key={v}>{v}</option>)}</select><button type="button" onClick={reset}>重置</button><button type="button" className={css.primary} onClick={apply}>确认</button></div>
  </section>
  <section className={css.panel}>
   <header className={css.panelHeading}><div><h3>定制数据集</h3><span>共 {filtered.length} 个数据集 · 按名称及站点归类</span></div><button type="button" onClick={()=>router.push("/workbench/data/market")}>前往数据定制</button></header>
   <div className={css.tableWrap}><table><thead><tr><th>数据集名称</th><th>数据来源</th><th>定制范围</th><th>已交付</th><th>最新版本</th><th>交付状态</th><th>创建时间</th><th>操作</th></tr></thead>
    {rows.map(g=>{
     const newest=g.items[g.items.length-1],done=g.items.filter(x=>x.state==="DELIVERED"),isOpen=expanded.includes(g.key);
     const versionOf=(item:Summary)=>g.items.indexOf(item)+1;
     return <tbody key={g.key} className={css.groupBody}>
      <tr><td><div className={css.datasetName}><strong>{g.name}</strong><small>定制数据集 · 版本独立保存</small></div></td>
       <td><span className={css.tag}>用户定制</span></td><td>{g.site.toUpperCase()} <small>Amazon · 按需定制</small></td>
       <td><b className={css.metric}>{done.length}</b></td><td><b className={css.version}>V{versionOf(newest)}</b></td>
       <td><span className={newest.state==="DELIVERED"?css.delivered:css.pending}>{stateName[newest.state]||newest.state}</span></td>
       <td className={css.date}>{formatDate(g.items[0].createdAt)}</td>
       <td><div className={css.actions}><button type="button" aria-expanded={isOpen} onClick={()=>setExpanded(old=>isOpen?old.filter(k=>k!==g.key):[...old,g.key])}>{isOpen?"收起":"展开"}</button><button type="button" onClick={()=>openDetail(newest.id)}>更多</button></div></td></tr>
      {isOpen?<tr className={css.expandedRow}><td colSpan={8}><section className={css.versions}><header><strong>数据集版本</strong><span>按真实定制订单记录版本 · 已交付的数据不会被后续版本覆盖</span></header>
       <div className={css.versionItems}>{[...g.items].reverse().map(item=><div className={css.versionItem} key={item.id}>
        <div className={css.versionInfo}><strong>V{versionOf(item)} · {item.name}</strong><small>{formatDate(item.createdAt)} · {item.site.toUpperCase()} · 定制订单 {item.id.slice(0,8)}</small></div>
        <span className={item.state==="DELIVERED"?css.delivered:css.pending}>{stateName[item.state]||item.state}</span>
        <div className={css.actions}><button type="button" onClick={()=>openDetail(item.id)}>查看详情</button></div>
       </div>)}</div>
      </section></td></tr>:null}
     </tbody>
    })}
   </table>
   {loading?<p className={css.empty} role="status">正在读取当前账号的定制数据集…</p>:error?<p className={css.empty} role="alert">{error}</p>:!filtered.length?<p className={css.empty} role="status">{records.length?"没有匹配的定制数据集。":"当前账号暂无定制数据集。请前往数据市场提交定制需求；只有真实交付记录才会显示为已交付。"}</p>:null}
   </div>
   <footer className={css.pagination}><span>显示 {rows.length} / {filtered.length} 个数据集 · 第 {activePage} / {pageCount} 页</span><div><button type="button" disabled={activePage===1} onClick={()=>setPage(v=>v-1)}>上一页</button><button type="button" disabled={activePage===pageCount} onClick={()=>setPage(v=>v+1)}>下一页</button><button type="button" onClick={()=>setRevision(v=>v+1)}>刷新</button></div></footer>
  </section>
  {detailId?<div className={css.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setDetailId(null)}}><section className={css.detail} role="dialog" aria-modal="true" aria-label="定制数据集版本详情">
   <header><div><h3>定制版本详情</h3><p>仅显示当前用户有权访问的真实定制记录。</p></div><button type="button" onClick={()=>setDetailId(null)}>关闭</button></header>
   {detailLoading?<p role="status">正在读取定制版本…</p>:detailError?<p role="alert">{detailError}</p>:selected?<div className={css.detailBody}>
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
