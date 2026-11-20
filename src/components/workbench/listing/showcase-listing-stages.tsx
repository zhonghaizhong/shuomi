"use client";
import {useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import styles from "./showcase-listing-stages.module.css";

type Stage="waiting"|"missing"|"review";
type Item={sku:string;name:string;source:string;store:string;status:string;missing:string[];ai:boolean};
const seed:Item[]=[
 {sku:"SM-240821-001",name:"复古水洗牛仔外套",source:"采集批次",store:"一号店 · SHEIN 美国站",status:"缺失 3 项",missing:["商品品牌","尺码属性","商品材质"],ai:false},
 {sku:"SM-240821-002",name:"便携式户外折叠收纳箱",source:"自有商品库",store:"一号店 · SHEIN 美国站",status:"AI已补全",missing:[],ai:true},
 {sku:"SM-240820-1688",name:"北欧风陶瓷餐具套装",source:"采集批次",store:"二号店 · SHEIN 美国站",status:"手动已补全",missing:[],ai:false},
 {sku:"SM-240820-PLG",name:"女士轻奢链条单肩包",source:"自有商品库",store:"一号店 · SHEIN 美国站",status:"缺失 2 项",missing:["商品材质","商品品牌"],ai:true},
];
const names:Record<Stage,string>={waiting:"待上传",missing:"待补全",review:"待审核"};
const descriptions:Record<Stage,string>={
 waiting:"配置一次上传任务，资料缺失先补全；审核及应用后，明确继续原任务。",
 missing:"补齐并保存资料后，核对原任务与准确版本，明确继续上传；未绑定草稿先选择目标。",
 review:"核对智能体建议，决定应用或退回；审核完成后明确继续原上传任务。"
};
const menu=[["waiting","待上传"],["missing","待补全"],["review","待审核"],["uploaded","已上传"]] as const;
export function ShowcaseListingStage({stage}:{stage:Stage}){
 const router=useRouter();
 const [source,setSource]=useState("采集批次"),[batch,setBatch]=useState(""),[store,setStore]=useState(""),[agent,setAgent]=useState(false),[rules,setRules]=useState(true),[mode,setMode]=useState("平台草稿");
 const [filter,setFilter]=useState(""),[applied,setApplied]=useState(""),[items,setItems]=useState(seed),[selected,setSelected]=useState<Item|null>(null),[notice,setNotice]=useState(""),[ruleDialog,setRuleDialog]=useState(false),[submitted,setSubmitted]=useState(false);
 const [form,setForm]=useState<Record<string,string>>({});
 const go=(s:string)=>router.push("/workbench/listing/"+s+"?preview=1");
 const filtered=useMemo(()=>items.filter(x=>(x.name+" "+x.sku+" "+x.source+" "+x.status).toLowerCase().includes(applied.toLowerCase())),[items,applied]);
 const selectedItem=selected?items.find(x=>x.sku===selected.sku)??selected:null;
 const action=(next:string)=>{setNotice(next);setSubmitted(true)};
 const save=()=>{
  if(!selectedItem)return;
  const allFilled=selectedItem.missing.every(field=>(form[field]??"").trim().length>0);
  if(!allFilled){setNotice("请补齐所有必填字段后保存。");return}
  setItems(arr=>arr.map(x=>x.sku===selectedItem.sku?{...x,missing:[],status:"手动已补全"}:x));
  setSelected(null);setForm({});action("资料已保存到演示记录。请核对原任务，确认继续上传；启用智能体时先进入待审核。");
 };
 return <div className={styles.page} data-listing-stage={stage}>
  <header className={styles.heading}><small>店铺中心 / 刊登管理 / {names[stage]}</small><h1>{names[stage]}</h1><p>{descriptions[stage]}</p></header>
  <nav className={styles.tabs} aria-label="刊登管理阶段">{menu.map(([key,label])=><button type="button" key={key} aria-current={key===stage?"page":undefined} onClick={()=>key!==stage&&go(key)}>{label}</button>)}</nav>
  {notice?<div className={styles.notice} role="status">{notice}<button type="button" onClick={()=>setNotice("")} aria-label="关闭提示">×</button></div>:null}
  {stage==="waiting"?<>
   <section className={styles.flowHeader}><div><h2>商品上传流程</h2><p>商品 · 规则必选 · 智能体按需 · 平台上传</p></div><div className={styles.flowSteps}>{["选择商品","平台与店铺","启用规则","启用智能体"].map((name,i)=><span key={name}><b>{i+1}</b>{name}</span>)}</div></section>
   <section className={styles.configuration}>
    <article><header><b>01</b><h2>选择商品</h2></header><p>从采集批次或自有商品库选取</p><label>商品来源<select value={source} onChange={e=>setSource(e.target.value)}><option>采集批次</option><option>自有商品库</option></select></label><label>本次批次 / 产品集<select value={batch} onChange={e=>setBatch(e.target.value)}><option value="">请选择商品</option><option value="美国站商品">美国站商品</option><option value="自有商品产品集">自有商品产品集</option></select></label><button type="button" onClick={()=>router.push("/workbench/data/mine?preview=1")}>进入我的数据</button></article>
    <article><header><b>02</b><h2>目标平台与店铺</h2></header><p>先确定平台、站点及经营模式</p><label>平台 / 站点<select disabled value="SHEIN · 美国站"><option>SHEIN · 美国站</option></select></label><label>本次目标店铺<select value={store} onChange={e=>setStore(e.target.value)}><option value="">请选择店铺</option><option>一号店 · 全托</option><option>二号店 · 半托</option></select></label><small>按目标平台校验资料：缺失先补全，启用智能体需审核</small></article>
    <article><header><b>03</b><h2>启用智能体</h2></header><p>按需重构商品后进入审核</p><label className={styles.switch}><input type="checkbox" checked={agent} onChange={e=>setAgent(e.target.checked)}/> 智能体（按需）</label><label>执行模板<select disabled={!agent}><option>{agent?"商品内容优化模板":"未启用，无需选择"}</option></select></label><small>{agent?"AI 处理结果进入待审核，由你确认应用":"未启用智能体 · 校验后直接上传"}</small></article>
    <article><header><b>04</b><h2>启用规则</h2></header><p>规则必须启用才能上传</p><label className={styles.switch}><input type="checkbox" checked={rules} onChange={e=>setRules(e.target.checked)}/> 标准适配规则（必选）</label><button type="button" onClick={()=>setRuleDialog(true)}>适配规则设置</button><small>本次规则生效，原始资料不变</small></article>
   </section>
   <section className={styles.submit}><div><h2>本次上传</h2><p>资料缺失先补全；完整商品启用智能体后待审核，未启用则直接提交平台。</p></div><label>提交方式<select value={mode} onChange={e=>setMode(e.target.value)}><option>平台草稿</option><option>直接上传到平台</option></select></label><button type="button" disabled={!batch||!store||!rules} onClick={()=>action(`演示任务已配置：${batch} · ${store} · ${mode}。需真实平台核验才能提交；资料不完整进入待补全${agent?"，启用 AI 的商品进入待审核":""}。`)}>确认提交</button></section>
   <p className={styles.hint}>平台原生定时上架按真实能力开放；系统定时发送目前未开放。仅演示配置，不会向平台实际上传。</p>
  </>:<>
   <section className={styles.summary}>{(stage==="missing"?[["12","全部商品"],["4","待补全"],["5","AI已补全"],["3","手动已补全"]]:[["8","待审核"],["5","AI建议待确认"],["3","已应用待继续"],["0","异常"]]).map(([n,label])=><article key={label}><b>{n}</b><span>{label}</span></article>)}</section>
   <section className={styles.listPanel}><div className={styles.filters}><input placeholder="搜索商品名称 / SKU / 批次名称" aria-label="搜索商品" value={filter} onChange={e=>setFilter(e.target.value)} onKeyDown={e=>e.key==="Enter"&&setApplied(filter)}/><select aria-label="商品来源"><option>全部来源</option><option>采集批次</option><option>自有商品库</option></select><button onClick={()=>{setFilter("");setApplied("")}}>重置</button><button className={styles.primary} onClick={()=>setApplied(filter)}>确认</button></div>
    <header className={styles.listHeader}><h2>商品列表（共 {filtered.length} 个演示商品）</h2><button type="button" onClick={()=>action(stage==="missing"?"批量 AI 补全需先选择真实商品、授权与策略；当前未执行。":"批量审核需逐项确认实际建议；当前未执行。")}>{stage==="missing"?"批量AI补全":"批量审核"}</button></header>
    <div className={styles.tableScroll}><div className={styles.table}><div className={styles.columns}><span>商品 / SKU</span><span>来源</span><span>目标店铺</span><span>状态</span><span>操作</span></div>
    {filtered.map(item=><div className={styles.item} key={item.sku}><span><strong>{item.name}</strong><small>{item.sku}</small></span><span>{item.source}</span><span>{item.store}</span><span>{item.status}</span><button type="button" onClick={()=>{setSelected(item);setForm({})}}>{stage==="missing"?(item.missing.length?"查看并补全":"查看结果"):"审核 AI 建议"}</button></div>)}</div></div>
    <footer className={styles.foot}>演示记录 · 按原任务与目标店铺继续处理，不自动执行上传</footer>
   </section>
   <section className={styles.explanation}><h2>{stage==="missing"?"为什么需要补全商品信息？":"为什么需要人工审核 AI 建议？"}</h2><p>{stage==="missing"?"补全目标平台必填信息，可减少审核退回并提高发布效率；补全后明确返回原任务继续。":"确认图片、属性、标题、描述等修改与平台要求一致，应用后明确继续上传；未启用智能体的商品不进入待审核。"}</p><button onClick={()=>go(stage==="missing"?"waiting":"uploaded")}>{stage==="missing"?"返回待上传":"查看已上传记录"}</button></section>
  </>}
  {ruleDialog?<div className={styles.overlay} role="presentation" onMouseDown={e=>e.target===e.currentTarget&&setRuleDialog(false)}><section role="dialog" aria-modal="true" aria-label="适配规则设置" className={styles.dialog}><h2>适配规则设置</h2><p>按 SHEIN 美国站的实际类目、属性、图片与价格要求校验。启用规则为上传前必选条件，不更改原始商品。</p><button onClick={()=>setRuleDialog(false)}>确认</button></section></div>:null}
  {selectedItem?<div className={styles.overlay} role="presentation" onMouseDown={e=>e.target===e.currentTarget&&setSelected(null)}><section role="dialog" aria-modal="true" aria-label={stage==="missing"?"查看并补全":"审核智能体建议"} className={styles.dialog}><h2>{stage==="missing"?"查看并补全":"审核智能体建议"}</h2><p>{selectedItem.name} · {selectedItem.sku} · {selectedItem.store}</p>{stage==="missing"?(selectedItem.missing.length?selectedItem.missing.map(field=><label key={field}>{field}（必填）<input value={form[field]??""} onChange={e=>setForm(prev=>({...prev,[field]:e.target.value}))}/></label>):<p>必填资料已补齐；核对原任务后可以继续。</p>):<><p>AI 生成内容必须审核并应用后才能继续原上传任务；不自动改动商品原始资料。</p><label className={styles.switch}><input type="checkbox"/> 已核对标题、属性、图片及适配规则</label></>}<footer><button onClick={()=>setSelected(null)}>返回列表</button><button className={styles.primary} onClick={stage==="missing"?(selectedItem.missing.length?save:()=>{setSelected(null);action("已补全。请确认继续原任务。")}):()=>{setSelected(null);action("AI 结果已在演示中确认；请回到原任务明确继续上传。")}}>{stage==="missing"?"保存并继续":"应用并确认继续"}</button></footer></section></div>:null}
 </div>;
}
