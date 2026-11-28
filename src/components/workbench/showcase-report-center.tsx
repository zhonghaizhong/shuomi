"use client";
import type {ReactNode} from "react";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import styles from "./showcase-report-center.module.css";
import {WorkbenchDateRange} from "./workbench-date-picker";

export type PreviewReport={id:string;title:string;type:string;createdAt:number;favorite:boolean;group:string;summary:string;projectId?:string;documentPath?:string};
type ReportStore={groups:string[];reports:PreviewReport[]};
export const projectDemoReports:PreviewReport[]=[
 {id:"demo-report-growth",title:"SHEIN 美国站利润诊断准备报告（演示）",type:"经营报告",projectId:"demo-project-shein-growth",createdAt:Date.now()-7200000,favorite:false,group:"",summary:`一、报告定位
本报告记录SHEIN美国站30天利润提升项目的诊断准备情况，不代表已获取一号店真实经营数据。

二、分析目标和数据口径
需取得按店铺和日期过滤的销售、订单、退款、采购成本、物流费用、佣金和其他费用。币种、税费和结算周期必须统一后才可计算利润。

三、演示检查结果
已形成经营数据核对清单、利润诊断流程与经营指标规范。实际销售额、成本、利润率均未核验，不填造数值。

四、当前风险
缺少真实经营明细、各项费用和店铺授权状态。没有这些前提，不能得出低利润商品排名或利润提升幅度。

五、后续任务
先核对一号店授权；获取经营数据；按SKU分析盈利结构；输出待确认优化方案；在项目内记录每周复盘。状态：仅完成演示资料准备。`},
 {id:"demo-report-pod",title:"POD 新品开发阶段质量检查报告（演示）",type:"其他报告",projectId:"demo-project-pod-images",createdAt:Date.now()-6300000,favorite:false,group:"",summary:`一、项目范围
演示服装批次的短袖和卫衣，多颜色、多尺码，涉及POD印花素材、主图、详情图、文案及平台适配。

二、已建立检查流程
SKU和颜色映射、素材来源、图像尺寸与背景、主图和详情图顺序、目标站点属性检查。

三、当前模拟状态
变体结构检查：演示已完成。
图片生成：模拟执行中，尚无可验证的真实图像生成输出。
人工审核：等待真实生成物及素材授权证据。

四、待确认事项
具体批次ID、各SKU对应图片、素材商用许可、上架站点和刊登规则。

五、下一阶段
图片准备齐全后执行人工审核；只有审核通过才可提交至刊登管理。此报告不能作为已生成或已刊登证明。`},
 {id:"demo-report-selected",title:"硕米优选SKU选品与刊登风险记录（演示）",type:"其他报告",projectId:"demo-project-selected-sales",createdAt:Date.now()-5200000,favorite:false,group:"",summary:`一、项目范围
SHEIN美国站30天新品开发与销售项目，以硕米优选演示货盘为来源。

二、候选商品
SMYX-DEMO-001：纯棉圆领短袖T恤。
SMYX-DEMO-002：宽松连帽卫衣。
两款均来自现有演示货盘，商品和SKU编号为演示数据。

三、采集与刊登流程
选定SKU及配送国家 → 创建当前账号采集批次 → 我的数据 → 商品优化 → SHEIN属性适配 → 待补全或待审核 → 刊登。

四、模拟异常
当SKU属性、素材或授权信息缺失时，生成异常待办，不自动认定上架成功。

五、风险与待确认
MOQ、库存、供货价、运费、平台费和真实店铺授权都须进一步核实。不存在真实成交或销售统计结论。

六、后续任务
确认SKU、采集批次和目标店铺，再处理缺失信息及刊登审核。`},
 {id:"demo-report-market",documentPath:"/demo-documents/SMYX-demo-selection-review.md",title:"美国站候选商品比较与选品阶段复盘（演示）",type:"调研报告",projectId:"demo-project-market-research",createdAt:Date.now()-86400000,favorite:false,group:"",summary:`一、研究任务
比较当前硕米优选演示货盘中可用的服装候选商品，并记录尚缺的市场证据。

二、候选品
SMYX-DEMO-001 纯棉圆领短袖T恤：多颜色与尺码SKU，适用于基础服装方向。
SMYX-DEMO-002 宽松连帽卫衣：多颜色与尺码SKU，适用于外套/休闲服装方向。
以上为演示货盘信息，不代表真实美国市场表现。

三、比较维度
SKU覆盖、MOQ、演示供货价、演示库存、供货发货地、可配送国家和图片信息完整度。

四、阶段发现
两款商品均可做上架准备案例；但无法据现有演示字段判断市场需求、竞争强度、真实销量或最终利润。

五、待补证据
数据市场可用数据集、目标SHEIN店铺历史销售、物流成本、平台费、供应商报价及合规资料。

六、结论
现阶段只完成了演示候选品资料对照和方法复盘。项目按模拟场景归档，未形成真实市场选品投资决策。`}
];
const scopedDemoReports=(org:string,member:string)=>org==="SM-ENT-000001"&&member==="admin"?projectDemoReports.map(r=>({...r})):[];
const key=(org:string,member:string)=>"shuomi-reports-demo-v1:"+encodeURIComponent(org)+":"+encodeURIComponent(member);
export function readPreviewReports(org:string,member:string):ReportStore{
 try{const raw=sessionStorage.getItem(key(org,member));if(!raw)return {groups:[],reports:scopedDemoReports(org,member)};const v=JSON.parse(raw);return {
  groups:Array.isArray(v.groups)?v.groups.filter((x:unknown):x is string=>typeof x==="string"&&x.length>0&&x.length<=40):[],
  reports:(()=>{const own:Array<PreviewReport>=Array.isArray(v.reports)?v.reports.filter((r:PreviewReport)=>r&&typeof r.id==="string"&&typeof r.title==="string"&&typeof r.createdAt==="number"):[];const seed=scopedDemoReports(org,member);return [...own.filter(r=>!seed.some(d=>d.id===r.id)),...seed.map(d=>own.find(r=>r.id===d.id)??d)]})()};}
 catch{return {groups:[],reports:scopedDemoReports(org,member)}}
}
export function writePreviewReports(org:string,member:string,data:ReportStore){sessionStorage.setItem(key(org,member),JSON.stringify(data));window.dispatchEvent(new CustomEvent("shuomi-reports-changed"))}
export function savePreviewReport(org:string,member:string,title:string,summary:string,projectId?:string){
 const previous=readPreviewReports(org,member);const report:PreviewReport={id:crypto.randomUUID(),title:title.trim().slice(0,100),type:"调研报告",createdAt:Date.now(),favorite:false,group:"",summary,projectId};
 if(!report.title)return null;
 writePreviewReports(org,member,{...previous,reports:[report,...previous.reports]});return report;
}
const format=(n:number)=>new Date(n).toLocaleDateString("zh-CN");
export function ShowcaseReportCenter({pathname,organizationId,memberId,tabNavigation}:{pathname:string;organizationId:string;memberId:string;tabNavigation?:ReactNode}){
 const router=useRouter();
 const [store,setStore]=useState<ReportStore>({groups:[],reports:[]});
 const [query,setQuery]=useState("");
 const [type,setType]=useState("全部类型");
 const [group,setGroup]=useState("全部分组");
 const [from,setFrom]=useState("");
 const [to,setTo]=useState("");
 const [showGroups,setShowGroups]=useState(false);
 const [groupName,setGroupName]=useState("");
 const [renaming,setRenaming]=useState("");
 const [renameText,setRenameText]=useState("");
 const [detail,setDetail]=useState<string|null>(null);
 const [notice,setNotice]=useState("");
 useEffect(()=>{const sync=()=>setStore(readPreviewReports(organizationId,memberId));sync();window.addEventListener("shuomi-reports-changed",sync);return()=>window.removeEventListener("shuomi-reports-changed",sync)},[organizationId,memberId]);
 const save=(next:ReportStore,message:string)=>{try{writePreviewReports(organizationId,memberId,next);setStore(next);setNotice(message)}catch{setNotice("演示数据保存失败，请检查浏览器存储权限")}};
 const updateReport=(id:string,changes:Partial<PreviewReport>)=>save({...store,reports:store.reports.map(r=>r.id===id?{...r,...changes}:r)},"已更新报告");
 const kind=pathname.endsWith("/favorites")?"favorites":pathname.endsWith("/recent")?"recent":"all";
 const visible=store.reports.filter(r=>(kind!=="favorites"||r.favorite)&&(type==="全部类型"||r.type===type)&&(!from||new Date(r.createdAt).toLocaleDateString("en-CA")>=from)&&(!to||new Date(r.createdAt).toLocaleDateString("en-CA")<=to)&&(r.title+" "+r.summary).toLowerCase().includes(query.trim().toLowerCase())).sort((a,b)=>b.createdAt-a.createdAt);
 const reset=()=>{setQuery("");setType("全部类型");setGroup("全部分组");setFrom("");setTo("")};
 const chosen=store.reports.find(r=>r.id===detail);
 return <main className={styles.page} data-report-center={kind}>
  <header className={styles.hero}><div><span>AI工作台 / 我的报告</span><h1>我的报告</h1><p>管理、收藏与复用 AI 生成的报告成果。</p></div><button type="button" className={styles.primary} onClick={()=>router.push("/workbench/ai/chat/new?preview=1&reportMode=create")}>生成调研报告</button></header>
  {tabNavigation}
  <section className={styles.toolbar} aria-label="报告筛选">
   <input aria-label="搜索报告" placeholder="搜索报告名称或关键词" value={query} onChange={e=>setQuery(e.target.value)}/>
   <div className={styles.controls}>
    <select aria-label="报告类型" value={type} onChange={e=>setType(e.target.value)}><option>全部类型</option><option>调研报告</option><option>经营报告</option><option>其他报告</option></select>
    <WorkbenchDateRange label="选择报告日期" from={from} to={to} onChange={(start,end)=>{setFrom(start);setTo(end)}}/>
        <button type="button" onClick={()=>setShowGroups(true)}>管理分组</button>
    <button type="button" onClick={reset}>重置</button>
   </div>
  </section>
  {notice&&<p className={styles.notice} role="status">{notice}</p>}
  <section className={styles.results}><div className={styles.resultsHead}><strong>{kind==="favorites"?"收藏报告":kind==="recent"?"最近报告":"全部报告"}</strong><span>共 {visible.length} 项</span></div>
   <div className={styles.tableWrap}><table><thead><tr><th>报告名称</th><th>类型</th><th>所属分组</th><th>生成日期</th><th>操作</th></tr></thead><tbody>
    {visible.map(r=><tr key={r.id}><td><strong>{r.title}</strong></td><td>{r.type}</td><td><select aria-label={r.title+"所属分组"} value={r.group} onChange={e=>updateReport(r.id,{group:e.target.value})}><option value="">未分组</option>{store.groups.map(g=><option key={g}>{g}</option>)}</select></td><td>{format(r.createdAt)}</td><td className={styles.rowActions}><button type="button" onClick={()=>setDetail(r.id)}>查看</button><button type="button" onClick={()=>updateReport(r.id,{favorite:!r.favorite})}>{r.favorite?"取消收藏":"收藏"}</button></td></tr>)}
    {!visible.length&&<tr><td className={styles.empty} colSpan={5}>{kind==="favorites"?"暂无收藏报告":kind==="recent"?"暂无最近报告":"暂无报告"}</td></tr>}
   </tbody></table></div>
  </section>
  {showGroups&&<div className={styles.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setShowGroups(false)}}><section className={styles.dialog} role="dialog" aria-modal="true" aria-label="管理报告分组"><header><h2>管理报告分组</h2><button onClick={()=>setShowGroups(false)} aria-label="关闭分组管理">×</button></header>
   <form className={styles.create} onSubmit={e=>{e.preventDefault();const n=groupName.trim();if(n&&!store.groups.includes(n)&&n.length<=40){save({...store,groups:[...store.groups,n]},"分组已创建");setGroupName("")}}}><input aria-label="新分组名称" maxLength={40} placeholder="输入分组名称" value={groupName} onChange={e=>setGroupName(e.target.value)}/><button className={styles.primary} disabled={!groupName.trim()}>创建分组</button></form>
   <div className={styles.groupList}>{store.groups.length?store.groups.map(g=><div className={styles.groupRow} key={g}>{renaming===g?<form onSubmit={e=>{e.preventDefault();const n=renameText.trim();if(n&&(!store.groups.includes(n)||n===g)){save({groups:store.groups.map(x=>x===g?n:x),reports:store.reports.map(r=>r.group===g?{...r,group:n}:r)},"分组已重命名");if(group===g)setGroup(n);setRenaming("")}}}><input aria-label={"重命名"+g} value={renameText} onChange={e=>setRenameText(e.target.value)}/><button className={styles.primary}>保存</button></form>:<><span>{g} · {store.reports.filter(r=>r.group===g).length} 项</span><div><button onClick={()=>{setRenaming(g);setRenameText(g)}}>重命名</button><button onClick={()=>{save({groups:store.groups.filter(x=>x!==g),reports:store.reports.map(r=>r.group===g?{...r,group:""}:r)},"已删除分组，报告仍然保留");if(group===g)setGroup("全部分组")}}>删除分组</button></div></>}</div>):<p>暂无自定义分组</p>}</div>
   <footer><button className={styles.primary} onClick={()=>setShowGroups(false)}>完成</button></footer>
  </section></div>}
  {chosen&&<div className={styles.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setDetail(null)}}><section className={styles.dialog} role="dialog" aria-modal="true" aria-label="查看报告"><header><h2>{chosen.title}</h2><button aria-label="关闭报告" onClick={()=>setDetail(null)}>×</button></header><p className={styles.demoNotice}>演示报告 · 本报告内容为流程模拟，不代表真实调研或经营数据结果</p><p style={{whiteSpace:"pre-wrap",lineHeight:1.85}}>{chosen.summary}</p><p>创建日期：{format(chosen.createdAt)}</p>{chosen.documentPath?<p><a target="_blank" rel="noopener noreferrer" href={"https://github.com/zhonghaizhong/shuomi/blob/main/public"+chosen.documentPath}>查看完整报告文档（GitHub 存储）</a></p>:null}<footer><button className={styles.primary} onClick={()=>setDetail(null)}>关闭</button></footer></section></div>}
 </main>;
}
