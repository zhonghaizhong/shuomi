"use client";

import {useEffect,useMemo,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import styles from "./preferred-application-preview.module.css";

type Status="可申请"|"待受理"|"审核中"|"已通过"|"未通过";
type Product={sku:string;name:string;group:string;source:string;category:string;status:Status};
type RecordRow={id:string;count:number;date:string;status:Exclude<Status,"可申请">;note:string};
const items:Product[]=[
 {sku:"OWN-240824-001",name:"轻量防晒连帽外套",group:"新品开发",source:"手动上传",category:"服装",status:"可申请"},
 {sku:"OWN-240824-002",name:"多功能折叠收纳箱",group:"核心商品",source:"企业商品库",category:"家居",status:"可申请"},
 {sku:"OWN-240824-003",name:"轻奢链条单肩包",group:"箱包配件",source:"手动上传",category:"箱包",status:"可申请"},
 {sku:"OWN-240823-004",name:"陶瓷餐具礼盒套装",group:"家居系列",source:"企业商品库",category:"家居",status:"可申请"},
 {sku:"OWN-240823-ERP",name:"示例审核中商品",group:"核心商品",source:"工具市场插件",category:"家居",status:"审核中"},
 {sku:"OWN-240823-PLG",name:"示例未通过商品",group:"家居系列",source:"手动上传",category:"家居",status:"未通过"}
];
const pending:RecordRow[]=[
 {id:"SQ-20260824-001",count:4,date:"08月24日 10:30",status:"审核中",note:"平台正在审核，请以正式业务系统反馈为准。"},
 {id:"SQ-20260823-009",count:2,date:"08月23日 16:20",status:"待受理",note:"等待平台处理。"},
 {id:"SQ-20260822-018",count:3,date:"08月22日",status:"未通过",note:"具体审核意见待平台同步。可修改原申请资料后再次申请。"},
 {id:"SQ-20260821-015",count:5,date:"08月21日",status:"未通过",note:"具体审核意见待平台同步。可修改原申请资料后再次申请。"},
 {id:"SQ-20260820-011",count:6,date:"08月20日",status:"已通过",note:"本条为原型演示记录。"}
];
const history:RecordRow[]=[
 {id:"SQ-20260820-011",count:6,date:"08月20日",status:"已通过",note:"审核已完成。历史记录只读。"},
 {id:"SQ-20260815-003",count:5,date:"08月15日",status:"未通过",note:"平台详细驳回原因尚未同步。可参考实际审核反馈修改资料，重新提交形成新审核记录。"},
 {id:"SQ-20260812-021",count:3,date:"08月12日",status:"已通过",note:"审核已完成。历史记录只读。"},
 {id:"SQ-20260808-014",count:2,date:"08月08日",status:"已通过",note:"审核已完成。历史记录只读。"},
 {id:"SQ-20260802-006",count:4,date:"08月02日",status:"已通过",note:"审核已完成。历史记录只读。"}
];
const base="/workbench/supply/applications";
const STORAGE="shuomi-preferred-application-draft";
type Supply={stock:string,moq:string,dispatch:string,origin:string,pricing:string,returns:string};
const emptySupply:Supply={stock:"",moq:"",dispatch:"",origin:"",pricing:"",returns:""};
function StatusLabel({status}:{status:Status}){return <span className={styles.status} data-status={status}>{status}</span>;}
function Tile({number,title,help,tone}:{number:string,title:string,help:string,tone:number}){return <article className={styles.metric} data-tone={tone}><strong>{number}</strong><div><b>{title}</b><small>{help}</small></div></article>;}
function SectionHead({title,description,children}:{title:string,description:string,children?:React.ReactNode}){return <header className={styles.heading}><div><small>供应市场 / 优选申请 {title==="发起申请"?"":"/ "+title}</small><h1>{title}</h1><p>{description}</p></div><div className={styles.headingActions}>{children}</div></header>;}
export function PreferredApplicationPreview({pathname}:{pathname:string}){
 const router=useRouter();
 const isRecord=pathname.endsWith("/records");
 const isProgress=pathname.endsWith("/progress");
 const isNew=pathname.endsWith("/new");
 const [step,setStep]=useState<"select"|"supply">("select");
 const [selected,setSelected]=useState<string[]>([]);
 const [draft,setDraft]=useState<Supply>(emptySupply);
 const [attachments,setAttachments]=useState<string[]>([]);
 const [notice,setNotice]=useState("");
 const [text,setText]=useState("");
 const [search,setSearch]=useState("");
 const [status,setStatus]=useState("全部状态");
 const [source,setSource]=useState("全部来源");
 const [category,setCategory]=useState("全部分类");
 const [group,setGroup]=useState("全部分组");
 const [filter,setFilter]=useState({search:"",status:"全部状态",source:"全部来源",category:"全部分类",group:"全部分组"});
 const [tab,setTab]=useState("全部");
 const records=isRecord?history:pending;
 const [focusedId,setFocusedId]=useState(isRecord?"SQ-20260815-003":"SQ-20260821-015");
 const [detailOpen,setDetailOpen]=useState<Product|null>(null);
 const [demoSubmitted,setDemoSubmitted]=useState(false);
 useEffect(()=>{try{const raw=sessionStorage.getItem(STORAGE);if(raw){const d=JSON.parse(raw);if(Array.isArray(d.selected))setSelected(d.selected);if(d.draft)setDraft(d.draft)}if(sessionStorage.getItem(STORAGE+"-edit")==="1"){setStep("supply");sessionStorage.removeItem(STORAGE+"-edit");}}catch{}},[]);
 const persist=(nextSelected:string[],nextSupply:Supply)=>{try{sessionStorage.setItem(STORAGE,JSON.stringify({selected:nextSelected,draft:nextSupply}))}catch{}};
 const go=(path:string)=>{setNotice("");router.push(base+path+"?preview=1")};
 const select=(sku:string)=>{const v=selected.includes(sku)?selected.filter(x=>x!==sku):[...selected,sku];setSelected(v);persist(v,draft);};
 const change=(key:keyof Supply,value:string)=>{const v={...draft,[key]:value};setDraft(v);persist(selected,v);};
 const rows=items.filter(p=>(filter.status==="全部状态"||p.status===filter.status)&&(filter.source==="全部来源"||p.source===filter.source)&&(filter.category==="全部分类"||p.category===filter.category)&&(filter.group==="全部分组"||p.group===filter.group)&&[p.name,p.sku,p.group,p.source].join(" ").toLowerCase().includes(filter.search.toLowerCase()));
 const visibleRecords=records.filter(r=>tab==="全部"||r.status===tab);
 const focused=records.find(r=>r.id===focusedId)??visibleRecords[0]??records[0];
 const chooseRecord=(id:string)=>setFocusedId(id);
 const reset=()=>{setSearch("");setStatus("全部状态");setSource("全部来源");setCategory("全部分类");setGroup("全部分组");setFilter({search:"",status:"全部状态",source:"全部来源",category:"全部分类",group:"全部分组"});};
 const advance=()=>{if(!selected.length){setNotice("请至少选择一件可申请商品，再填写供货信息。");return;}setNotice("");setStep("supply");};
 const saveDraft=()=>{persist(selected,draft);setNotice("已保存到当前浏览器的演示草稿，尚未向平台提交申请。");};
 const submit=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();if(!selected.length){setStep("select");setNotice("请先选择申请商品。");return;}setDemoSubmitted(true);setNotice("演示申请已完成表单校验，但未提交到正式业务系统。");};
 const metrics=isRecord?[["9","全部记录","历史审核记录"],["8","已通过","审核已完成"],["1","未通过","可修改后重申"]]:isProgress?[["5","全部申请","申请总记录"],["1","待受理","等待平台处理"],["1","审核中","平台正在审核"],["1","已通过","审核已完成"],["2","未通过","可修改后重申"]]:[["34","可申请商品","符合申请条件"],["3","审核中","平台审核进行中"],["1","未通过","可修改后再申请"],["8","已通过","审核已完成"]];
 const title=isRecord?"申请记录":isProgress?"申请进度":isNew?(step==="select"?"选择申请商品":"填写供货信息"):"发起申请";
 const description=isRecord?"仅记录已完成审核的申请；未通过可查看原因、修改资料后重新申请。":isProgress?"查看每笔申请的审核状态，未通过可修改资料后重新提交。":isNew?(step==="select"?"从「已上传 · 自有商品库」中按合集名称及申请状态查询，选择可申请商品。":"填写供货、交付及合作信息，完成后提交优选申请审核。"):"将「已上传 · 自有商品库」中符合条件的商品提交优选申请。";
 const edit=()=>{try{sessionStorage.setItem(STORAGE+"-edit","1")}catch{}go("/new");};
 return <div className={styles.page} data-preferred-application={isRecord?"records":isProgress?"progress":isNew?step:"overview"}>
   <SectionHead title={title} description={description}>
     {(isRecord||isProgress)?<button className={styles.primary} onClick={()=>{setStep("select");go("/new");}}>发起新申请</button>:
     isNew?<button onClick={()=>go("")}>返回优选申请</button>:<>
       <button onClick={()=>go("/records")}>查看申请记录</button>
       <button className={styles.primary} onClick={()=>{setStep("select");go("/new");}}>选择商品发起申请</button>
     </>}
   </SectionHead>
   {!isNew && <section className={styles.metrics}>{metrics.map(([n,t,h],i)=><Tile key={t} number={n} title={t} help={h} tone={i}/>)}</section>}
   {!isNew&&!isRecord&&!isProgress&&<>
      <section className={styles.infoColumns}>
        <article><h2>申请条件</h2><p>仅展示符合基本申请条件的已优化自有商品</p><div className={styles.conditions}>{["商品属于申请人或企业","已完成商品智能优化","具备稳定库存或生产能力","商品及相关资质符合平台要求"].map(t=><span key={t}><i/> {t}</span>)}</div></article>
        <article><h2>申请流程</h2><p>提交后由专员联系并完成评估</p><div className={styles.flow}>{["选择商品","供货信息","平台评估","确认合作"].map((t,i)=><div key={t}><b>{String(i+1).padStart(2,"0")}</b><span>{t}</span></div>)}</div></article>
      </section>
      <section className={styles.infoBanner}><div><b>服务说明</b><p>如涉及商品资料整理、系统技术对接或上架服务，将由专员确认具体服务内容及费用。</p></div><button onClick={()=>go("/progress")}>查看申请进度</button></section>
      <section className={styles.panel}><div className={styles.panelHeading}><h2>可申请商品</h2><span>仅显示自有商品库 · 已上传</span></div><div className={styles.tableScroll}><table><thead><tr><th>商品</th><th>所属分组</th><th>商品归属 / 上传状态</th><th>申请状态</th></tr></thead><tbody>{items.filter(p=>p.status==="可申请").slice(0,3).map(p=><tr key={p.sku}><td><strong>{p.name}</strong><small>SKU {p.sku}</small></td><td>{p.group}</td><td>自有商品库 · 已上传</td><td><StatusLabel status={p.status}/></td></tr>)}</tbody></table></div></section>
   </>}
   {isNew && (step==="select"?<>
     <section className={styles.filterPanel}><div className={styles.filters}>
       <label>商品来源<select value={source} onChange={e=>setSource(e.target.value)}>{["全部来源","手动上传","企业商品库","工具市场插件"].map(x=><option key={x}>{x}</option>)}</select></label>
       <label>自定义分类<select value={category} onChange={e=>setCategory(e.target.value)}>{["全部分类","服装","家居","箱包"].map(x=><option key={x}>{x}</option>)}</select></label>
       <label>所属分组<select value={group} onChange={e=>setGroup(e.target.value)}>{["全部分组","新品开发","核心商品","箱包配件","家居系列"].map(x=><option key={x}>{x}</option>)}</select></label>
       <label>申请状态<select value={status} onChange={e=>setStatus(e.target.value)}>{["全部状态","可申请","待受理","审核中","已通过","未通过"].map(x=><option key={x}>{x}</option>)}</select></label>
     </div><div className={styles.searchActions}><input aria-label="搜索商品名称或SKU" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")setFilter({search,status,source,category,group});}} placeholder="搜索合集名称、商品名称或SKU"/><button onClick={reset}>重置</button><button className={styles.primary} onClick={()=>setFilter({search,status,source,category,group})}>确认</button></div></section>
     <section className={styles.panel}><div className={styles.panelHeading}><h2>自有商品库 · 已上传</h2><span>符合条件 · 4 件示例</span></div>
       <div className={styles.selectionSummary}><strong>已选择 {selected.length} 件</strong><span>请点击商品右侧「发起申请」填写供货信息。</span><button className={styles.primary} onClick={advance} disabled={!selected.length}>填写供货信息</button></div>
       <div className={styles.tableScroll}><table><thead><tr><th className={styles.checkboxCol}><input type="checkbox" aria-label="全选可申请商品" checked={items.filter(p=>p.status==="可申请").every(p=>selected.includes(p.sku))} onChange={e=>{const skus=items.filter(p=>p.status==="可申请").map(p=>p.sku),v=e.target.checked?[...new Set([...selected,...skus])]:selected.filter(x=>!skus.includes(x));setSelected(v);persist(v,draft);}}/></th><th>商品（全选可申请）</th><th>上传状态 / 商品归属</th><th>所属分组</th><th>申请状态</th><th>操作</th></tr></thead>
       <tbody>{rows.map(p=><tr key={p.sku}><td><input type="checkbox" aria-label={"选择"+p.name} disabled={p.status!=="可申请"} checked={selected.includes(p.sku)} onChange={()=>select(p.sku)}/></td><td><strong>{p.name}</strong><small>SKU {p.sku}</small></td><td>已上传 · 自有商品库</td><td>{p.group}</td><td><StatusLabel status={p.status}/></td><td><button className={styles.textButton} onClick={()=>p.status==="可申请"?(select(p.sku),setNotice("已更新申请商品选择。")):setDetailOpen(p)}>{p.status==="可申请"?(selected.includes(p.sku)?"取消选择":"选择"):"查看详情"}</button></td></tr>)}</tbody></table>{!rows.length&&<p className={styles.empty}>无符合条件的商品，请重置筛选。</p>}</div>
     </section>
   </>:<form className={styles.form} onSubmit={submit}><div className={styles.selectionSummary}><strong>已选择 {selected.length} 件</strong><span>所选商品统一用于本次申请，请继续补充供货与合作信息。</span><button type="button" onClick={()=>setStep("select")}>返回修改商品</button></div>
     <div className={styles.formColumns}><section className={styles.panel}><h2>供货与交付</h2><p>填写本次申请统一适用的基础供货信息</p><div className={styles.fieldGrid}>
       <label>可供库存<input required type="number" min="1" value={draft.stock} onChange={e=>change("stock",e.target.value)} placeholder="请输入可供数量"/></label>
       <label>最小起订量<input required type="number" min="1" value={draft.moq} onChange={e=>change("moq",e.target.value)} placeholder="请输入起订数量"/></label>
       <label>发货时效<select required value={draft.dispatch} onChange={e=>change("dispatch",e.target.value)}><option value="">请选择，例如48小时内</option><option>24小时内</option><option>48小时内</option><option>3–5天</option></select></label>
       <label>发货地<input required value={draft.origin} onChange={e=>change("origin",e.target.value)} placeholder="请选择省 / 市"/></label>
       <label className={styles.full}>供货价说明<textarea value={draft.pricing} onChange={e=>change("pricing",e.target.value)} placeholder="例如：含税 / 不含运费，可由专员进一步确认"/></label>
     </div></section><section className={styles.panel}><h2>合作与资质</h2><p>只保留平台评估所需的必要信息</p><div className={styles.fieldGrid}>
       <label className={styles.full}>售后政策<textarea required value={draft.returns} onChange={e=>change("returns",e.target.value)} placeholder="简要说明退换货及质量保障"/></label>
       <label className={styles.full}>商品资质<input type="file" accept=".jpg,.jpeg,.png,.pdf" multiple onChange={e=>setAttachments(Array.from(e.currentTarget.files??[]).filter(x=>x.size<=20*1024*1024).map(x=>x.name))}/><small>支持 JPG / PNG / PDF，单个文件不超过 20MB</small>{attachments.length>0&&<small>已选择：{attachments.join("、")}</small>}</label>
       <aside><b>服务说明</b><p>如涉及资料整理、技术对接或上架服务，专员将另行确认内容与费用。</p></aside>
     </div></section></div>
     <footer className={styles.formActions}><span>提交前请核对资料；平台需要补充时可在申请进度中处理。</span><button type="button" onClick={saveDraft}>保存草稿</button><button type="button" onClick={()=>setStep("select")}>返回选择商品</button><button className={styles.primary} type="submit">提交申请</button></footer>
   </form>)}
   {(isRecord||isProgress)&&<>
      <section className={styles.recordLayout}>
        <article className={styles.panel}><div className={styles.panelHeading}><div><h2>{isRecord?"审核历史记录":"申请列表"}</h2>{isProgress&&<p>查看各申请的审核状态与处理事项</p>}</div></div>
          <div className={styles.tabs}>{(isRecord?["全部","已通过","未通过"]:["全部","待受理","审核中","已通过","未通过"]).map(t=><button key={t} aria-pressed={tab===t} onClick={()=>{setTab(t);const next=records.find(r=>t==="全部"||r.status===t);if(next)setFocusedId(next.id);}}>{t}</button>)}</div>
          <div className={styles.tableScroll}><table><thead><tr><th>申请编号</th><th>{isRecord?"商品数量":"商品"}</th><th>{isRecord?"审核日期":"提交时间"}</th><th>审核结果</th><th>操作</th></tr></thead><tbody>{visibleRecords.map(r=><tr key={r.id} data-selected={focused.id===r.id} onClick={()=>chooseRecord(r.id)}><td>{r.id}</td><td>{r.count} 件商品</td><td>{r.date}</td><td><StatusLabel status={r.status}/></td><td><button className={styles.textButton} onClick={e=>{e.stopPropagation();chooseRecord(r.id);}}>{r.status==="未通过"?"查看原因":isRecord?"查看结果":"查看进度"}</button></td></tr>)}</tbody></table></div>
        </article>
        <aside className={styles.panel}><h2>{isRecord?"申请记录详情":"申请处理"}</h2><p>选择一条{isRecord?"历史记录，直接查看审核结果":"申请即可查看并处理"}</p>
         <div className={styles.recordSummary}><strong>{focused.id}</strong><span>{focused.count} 件商品 · {focused.date}</span><StatusLabel status={focused.status}/></div>
         <h3>{isRecord?"审核说明":"审核与处理说明"}</h3><p className={styles.recordNote}>{focused.note}</p>
         <p className={styles.subtle}>{isRecord?"历史审核记录只读；重新申请保留原审核记录。":"本页为示例进度，实际状态以正式业务系统为准。"}</p>
         {focused.status==="未通过"&&<button className={styles.primary} onClick={edit}>修改资料并重新申请</button>}
        </aside>
      </section>
   </>}
   {notice&&<div className={styles.notice} role="status">{notice}<button aria-label="关闭提示" onClick={()=>setNotice("")}>×</button></div>}
   {demoSubmitted&&<div className={styles.notice} role="status">表单已校验完成，但没有连接正式提交接口。<button onClick={()=>{setDemoSubmitted(false);go("/progress");}}>查看演示申请进度</button><button onClick={()=>setDemoSubmitted(false)}>关闭</button></div>}
   {detailOpen&&<div className={styles.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setDetailOpen(null);}}><section className={styles.drawer} role="dialog" aria-modal="true" aria-label="商品申请详情"><header><h2>商品申请详情</h2><button onClick={()=>setDetailOpen(null)}>关闭</button></header><h3>{detailOpen.name}</h3><p>SKU {detailOpen.sku}</p><StatusLabel status={detailOpen.status}/><h3>审核反馈</h3><p>当前商品申请进度和审核信息仅供演示，真实状态以平台同步为准。</p><button onClick={()=>setDetailOpen(null)}>返回商品列表</button></section></div>}
   <small className={styles.disclaimer}>本页为 Figma 业务流程演示；示例数量与状态不代表真实提交或审核结果。</small>
 </div>;
}
