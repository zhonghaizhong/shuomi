"use client";
import {useEffect,useMemo,useState} from "react";
import {readOwnProductBatches,readOwnProducts,ownProductUpdated} from "../showcase-own-product-data";
import {readDemoCollectionBatches} from "../showcase-collection-batches";
import {useDemoStoreBindings,demoStoreServiceActive} from "../store-binding-demo";
import {useWorkbenchContext} from "@/components/providers/workbench-context-provider";
import {useConfigurationRead} from "../agents/agent-configuration-hooks";
import {catalogPageSchema,templatesPageSchema} from "@/lib/contracts/agent-configuration";
import {addShowcaseUploadTask,readShowcaseUploadTasks,showcaseUploadTasksEvent,type ShowcaseUploadTask} from "./showcase-upload-tasks";
import {useRouter} from "next/navigation";
import styles from "./showcase-listing-stages.module.css";

type Stage="waiting"|"missing"|"review";
type Item={sku:string;name:string;source:string;store:string;status:string;missing:string[];ai:boolean};
const seed:Item[]=[];
const names:Record<Stage,string>={waiting:"待上传",missing:"待补全",review:"待审核"};
const descriptions:Record<Stage,string>={
 waiting:"配置一次上传任务，资料缺失先补全；审核及应用后，明确继续原任务。",
 missing:"补齐并保存资料后，核对原任务与准确版本，明确继续上传；未绑定草稿先选择目标。",
 review:"核对智能体建议，决定应用或退回；审核完成后明确继续原上传任务。"
};
const menu=[["waiting","待上传"],["missing","待补全"],["review","待审核"],["uploaded","已上传"]] as const;
export function ShowcaseListingStage({stage,organizationId,memberId}:{stage:Stage;organizationId:string;memberId:string}){
 const router=useRouter();
 const [source,setSource]=useState("采集批次"),[batch,setBatch]=useState(""),[store,setStore]=useState(""),[agent,setAgent]=useState(false),[agentId,setAgentId]=useState(""),[templateId,setTemplateId]=useState(""),[rules,setRules]=useState(true),[mode,setMode]=useState<"平台草稿"|"直接上传到平台"|"定时上传">("平台草稿");
 const [scheduledDate,setScheduledDate]=useState(""),[scheduledTime,setScheduledTime]=useState("");
 const context=useWorkbenchContext();
 const {visible:availableStoreBindings}=useDemoStoreBindings(organizationId,memberId,memberId==="admin");
 const boundStores=availableStoreBindings.filter(s=>s.platformStoreId&&!s.archived&&!s.connectionIssue&&s.platformIdStatus!=="获取失败"&&demoStoreServiceActive(s));
 const chosenStore=boundStores.find(s=>s.id===store);
 const scope={userId:context.user?.id??"",organizationId:context.effectiveOrganization?.id??""};
 const agentResults=useConfigurationRead(scope,"mine?pageSize=100",catalogPageSchema,0,Boolean(scope.userId&&scope.organizationId===organizationId));
 const enabledAgents=(agentResults.data?.items??[]).filter(e=>e.agent.activation==="ENABLED"&&e.canUse);
 const chosenAgent=enabledAgents.find(e=>e.agent.agentId===agentId);
 const templatesResult=useConfigurationRead(scope,`${agentId}/templates?pageSize=100`,templatesPageSchema,0,Boolean(agent&&chosenAgent));
 const availableTemplates=(templatesResult.data?.items??[]).filter(t=>t.lifecycle==="ACTIVE");
 const chosenTemplate=availableTemplates.find(t=>t.templateId===templateId);
 const [filter,setFilter]=useState(""),[applied,setApplied]=useState(""),[sourceFilter,setSourceFilter]=useState("全部来源"),[appliedSource,setAppliedSource]=useState("全部来源"),[storeFilter,setStoreFilter]=useState("全部店铺"),[appliedStore,setAppliedStore]=useState("全部店铺"),[items,setItems]=useState(seed),[selected,setSelected]=useState<Item|null>(null),[notice,setNotice]=useState(""),[ruleDialog,setRuleDialog]=useState(false),[submitted,setSubmitted]=useState(false);
 const [form,setForm]=useState<Record<string,string>>({});
 const [dataVersion,setDataVersion]=useState(0);
 const [taskVersion,setTaskVersion]=useState(0);
 useEffect(()=>{const refresh=(event:Event)=>{const d=(event as CustomEvent<{organizationId:string}>).detail;if(!d||d.organizationId===organizationId)setDataVersion(v=>v+1)};window.addEventListener("shuomi:demo-batches-updated",refresh);window.addEventListener("focus",refresh);return()=>{window.removeEventListener("shuomi:demo-batches-updated",refresh);window.removeEventListener("focus",refresh)}},[organizationId]);
 useEffect(()=>{const onChange=(event:Event)=>{const d=(event as CustomEvent<{organizationId:string;memberId:string}>).detail;if(d?.organizationId===organizationId&&d.memberId===memberId)setTaskVersion(v=>v+1)};window.addEventListener(showcaseUploadTasksEvent,onChange);return()=>window.removeEventListener(showcaseUploadTasksEvent,onChange)},[organizationId,memberId]);
 useEffect(()=>{const handle=(e:Event)=>{const d=(e as CustomEvent<{organizationId:string;memberId:string}>).detail;if(d?.organizationId===organizationId&&d?.memberId===memberId)setDataVersion(n=>n+1)};window.addEventListener(ownProductUpdated,handle);return()=>window.removeEventListener(ownProductUpdated,handle)},[organizationId,memberId]);
 const ownBatches=useMemo(()=>readOwnProductBatches(organizationId,memberId),[organizationId,memberId,dataVersion]);
 const ownProducts=useMemo(()=>readOwnProducts(organizationId,memberId),[organizationId,memberId,dataVersion]);
 const collectedBatches=useMemo(()=>readDemoCollectionBatches(organizationId,memberId),[organizationId,memberId,dataVersion]);
 const availableBatches=source==="自有商品库"?ownBatches:collectedBatches;
 const selectedOwnBatch=source==="自有商品库"?ownBatches.find(x=>x.id===batch):undefined;
 const selectedCollectedBatch=source==="采集批次"?collectedBatches.find(x=>x.id===batch):undefined;
 const selectedBatch=selectedOwnBatch;
 const selectableProducts=selectedOwnBatch?ownProducts.filter(p=>p.batchId===selectedOwnBatch.id):[];
 const selectedProductIds=selectedCollectedBatch?selectedCollectedBatch.products.map(p=>p.id):selectableProducts.map(p=>p.id);
 const selectedCount=selectedProductIds.length;
 const missingCount=selectableProducts.filter(p=>p.status==="待补全"||p.missing.length>0).length;
 const savedTasks=useMemo(()=>readShowcaseUploadTasks(organizationId,memberId),[organizationId,memberId,taskVersion]);
 const taskItems:Item[]=savedTasks.flatMap(task=>task.productIds.map((id,i)=>({sku:id,name:task.batchName+(task.productCount>1?` · 商品 ${i+1}`:""),source:task.source,store:task.storeName,status:task.status,missing:task.status==="待补全"?["商品必填资料"]:[],ai:Boolean(task.agentId)})));
 const [reviewChecked,setReviewChecked]=useState(false),[reviewMode,setReviewMode]=useState<"compare"|"edit">("compare");
 const go=(s:string)=>router.push("/workbench/listing/"+s+"?preview=1");
 const filtered=useMemo(()=>(items.length?items:taskItems).filter(x=>(x.name+" "+x.sku+" "+x.source+" "+x.status).toLowerCase().includes(applied.toLowerCase())&&(appliedSource==="全部来源"||x.source===appliedSource)&&(appliedStore==="全部店铺"||x.store===appliedStore)),[items,taskItems,applied,appliedSource,appliedStore]);
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
    <article><header><b>01</b><h2>选择商品</h2></header><p>从我的数据中选择采集批次或自有商品批次</p><label>商品来源<select value={source} onChange={e=>{setSource(e.target.value);setBatch("")}}><option>采集批次</option><option>自有商品库</option></select></label><label>本次批次 / 产品集<select value={batch} onChange={e=>setBatch(e.target.value)}><option value="">请选择商品</option>{availableBatches.map(b=><option key={b.id} value={b.id}>{b.name} · {"products" in b?b.products.length:b.productCount} 个商品</option>)}</select></label><small>{selectedCount>0?`已选择 ${selectedCount} 个商品${missingCount?`，其中 ${missingCount} 个需要补全`:""}；原始商品数据不修改`:availableBatches.length?"请选择本次商品批次":"当前账号没有可选批次，请先在我的数据中采集或上传。"}</small><button type="button" onClick={()=>router.push("/workbench/data/mine?preview=1")}>进入我的数据</button></article>
    <article><header><b>02</b><h2>目标平台与店铺</h2></header><p>平台、站点与经营模式以绑定店铺为准</p><label>平台 / 站点<select value={chosenStore?`${chosenStore.platform} · ${chosenStore.region}`:""} disabled><option value="">{boundStores.length?"请先选择目标店铺":"暂无可用店铺"}</option>{chosenStore?<option value={`${chosenStore.platform} · ${chosenStore.region}`}>{chosenStore.platform} · {chosenStore.region}</option>:null}</select></label><label>本次目标店铺<select value={store} onChange={e=>setStore(e.target.value)}><option value="">请选择店铺</option>{boundStores.map(s=><option key={s.id} value={s.id}>{s.name} · {s.region} · {s.type}</option>)}</select></label><small>{chosenStore?`已绑定 · ${chosenStore.type} · 服务有效`:"只显示当前账户可管理、连接正常且服务有效的店铺"}</small><button type="button" onClick={()=>router.push("/workbench/stores?preview=1")}>进入我的店铺</button></article>
    <article><header><b>03</b><h2>启用规则</h2></header><p>规则必须启用才能上传</p><label className={styles.switch}><input type="checkbox" checked={rules} onChange={e=>setRules(e.target.checked)}/> 标准适配规则（必选）</label><button type="button" onClick={()=>setRuleDialog(true)}>适配规则设置</button><small>按所选店铺平台 / 站点校验商品字段，原始资料保持不变</small></article>
    <article><header><b>04</b><h2>启用智能体</h2></header><p>从本企业「我的智能体」选择已启用能力</p><label className={styles.switch}><input type="checkbox" checked={agent} onChange={e=>{setAgent(e.target.checked);setAgentId("");setTemplateId("")}}/> 智能体（按需）</label><label>选择智能体<select disabled={!agent} value={agentId} onChange={e=>{setAgentId(e.target.value);setTemplateId("")}}><option value="">{agent?"请选择智能体":"未启用，无需选择"}</option>{enabledAgents.map(e=><option key={e.agent.agentId} value={e.agent.agentId}>{e.name}</option>)}</select></label><label>执行模板<select disabled={!agent||!chosenAgent} value={templateId} onChange={e=>setTemplateId(e.target.value)}><option value="">{!agent?"未启用，无需选择":!chosenAgent?"请先选择智能体":availableTemplates.length?"请选择模板":"无可用模板"}</option>{availableTemplates.map(t=><option key={t.templateId} value={t.templateId}>{t.name}</option>)}</select></label><small>{agentResults.error?"暂时无法读取智能体配置，请到我的智能体检查授权。":agent&&!enabledAgents.length?"当前没有已启用且可使用的智能体。":chosenAgent?.agent.agentId==="pod.design.agent"?"POD 成品图生成后须进入 POD 素材管理进行人工审核":agent?"AI 处理结果需审核后继续原任务":"未启用智能体 · 资料校验后进入平台提交"}</small><button type="button" onClick={()=>router.push("/workbench/agents/mine?preview=1")}>前往我的智能体</button></article>
   </section>
   <section className={styles.submit}><div><h2>本次上传</h2><p>资料缺失先进入待补全；启用智能体后等待执行，POD 成品图审核通过后才能继续原任务。</p></div><label>提交方式<select value={mode} onChange={e=>setMode(e.target.value as typeof mode)}><option>平台草稿</option><option>直接上传到平台</option><option>定时上传</option></select></label>{mode==="定时上传"?<div className={styles.scheduleFields}><label>日期<input aria-label="定时上传日期" type="date" value={scheduledDate} onChange={e=>setScheduledDate(e.target.value)}/></label><label>时间<input aria-label="定时上传时间" type="time" value={scheduledTime} onChange={e=>setScheduledTime(e.target.value)}/></label></div>:null}<button type="button" disabled={!selectedCount||!chosenStore||!rules||(agent&&(!chosenAgent||!chosenTemplate))||(mode==="定时上传"&&(!scheduledDate||!scheduledTime))} onClick={()=>{
    if(!selectedCount||!chosenStore||!rules)return;
    if(agent&&(!chosenAgent||!chosenTemplate)){setNotice("请先选择当前企业已启用的智能体及执行模板。");return}
    if(mode==="定时上传"){setNotice("定时上传需要平台授权及可用的调度服务，当前演示未执行预约。");return}
    const status:ShowcaseUploadTask["status"]=missingCount?"待补全":agent?"待执行智能体":"待平台提交";
    const record:ShowcaseUploadTask={id:"LIST-"+crypto.randomUUID(),organizationId,memberId,source:source as ShowcaseUploadTask["source"],batchId:batch,batchName:availableBatches.find(b=>b.id===batch)?.name??batch,productIds:selectedProductIds,productCount:selectedCount,missingCount,storeId:chosenStore.id,storeName:chosenStore.name,platform:"SHEIN",region:chosenStore.region,storeType:chosenStore.type,rule:"标准适配规则",agentId:agent?agentId:null,agentName:agent?chosenAgent?.name??null:null,templateId:agent?templateId:null,mode,status,createdAt:new Date().toISOString(),demo:true};
    if(addShowcaseUploadTask(record)){setSubmitted(true);setNotice(`已保存本次演示刊登任务（${selectedCount} 件，${chosenStore.name}，${status}）。配置与原批次已关联；未执行真实 AI、POD 图片生成或平台上传。`)}else setNotice("本次配置保存失败，请检查会话存储并重试。");
   }}>确认提交</button></section>
   <p className={styles.hint}>按照 Figma 保留平台草稿、直接上传和定时上传配置入口；当前展示只创建本账号任务记录，不模拟真实平台提交或智能体执行。</p>
  </>:<>
   <section className={styles.summary}>{(stage==="missing"?[["0","全部商品"],["0","待补全"],["0","AI已补全"],["0","手动已补全"]]:[["0","待审核"],["0","AI建议待确认"],["0","已应用待继续"],["0","异常"]]).map(([n,label])=><article key={label}><b>{n}</b><span>{label}</span></article>)}</section>
   <section className={styles.listPanel}><div className={styles.filters}><div className={styles.filterChoices}><label>来源<select aria-label="商品来源" value={sourceFilter} onChange={e=>setSourceFilter(e.target.value)}><option>全部来源</option><option>采集批次</option><option>自有商品库</option></select></label><label>目标店铺<select aria-label="目标店铺筛选" value={storeFilter} onChange={e=>setStoreFilter(e.target.value)}><option>全部店铺</option></select></label></div><div className={styles.filterSearch}><input placeholder="搜索商品名称 / SKU / 批次名称" aria-label="搜索商品" value={filter} onChange={e=>setFilter(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){setApplied(filter);setAppliedSource(sourceFilter);setAppliedStore(storeFilter)}}}/><button type="button" onClick={()=>{setFilter("");setApplied("");setSourceFilter("全部来源");setAppliedSource("全部来源");setStoreFilter("全部店铺");setAppliedStore("全部店铺")}}>重置</button><button type="button" className={styles.primary} onClick={()=>{setApplied(filter);setAppliedSource(sourceFilter);setAppliedStore(storeFilter)}}>确认</button></div></div>
    <header className={styles.listHeader}><h2>商品列表（共 {filtered.length} 个商品）</h2><button type="button" onClick={()=>action(stage==="missing"?"批量 AI 补全需先选择真实商品、授权与策略；当前未执行。":"批量审核需逐项确认实际建议；当前未执行。")}>{stage==="missing"?"批量AI补全":"批量审核"}</button></header>
    <div className={styles.tableScroll}><div className={styles.table}><div className={styles.columns}><span>商品 / SKU</span><span>来源</span><span>目标店铺</span><span>状态</span><span>操作</span></div>
    {filtered.length===0?<div className={styles.item} role="status">暂无商品记录，请先从「我的数据」选择真实商品，并完成目标店铺授权。</div>:null}
    {filtered.map(item=><div className={styles.item} key={item.sku}><span><strong>{item.name}</strong><small>{item.sku}</small></span><span>{item.source}</span><span>{item.store}</span><span>{item.status}</span><button type="button" onClick={()=>{setSelected(item);setForm({});setReviewChecked(false);setReviewMode("compare")}}>{stage==="missing"?(item.missing.length?"查看并补全":"查看结果"):"审核 AI 建议"}</button></div>)}</div></div>
    <footer className={styles.foot}>演示记录 · 按原任务与目标店铺继续处理，不自动执行上传</footer>
   </section>
   <section className={styles.explanation}><h2>{stage==="missing"?"为什么需要补全商品信息？":"为什么需要人工审核 AI 建议？"}</h2><p>{stage==="missing"?"补全目标平台必填信息，可减少审核退回并提高发布效率；补全后明确返回原任务继续。":"确认图片、属性、标题、描述等修改与平台要求一致，应用后明确继续上传；未启用智能体的商品不进入待审核。"}</p><button onClick={()=>go(stage==="missing"?"waiting":"uploaded")}>{stage==="missing"?"返回待上传":"查看已上传记录"}</button></section>
  </>}
  {ruleDialog?<div className={styles.overlay} role="presentation" onMouseDown={e=>e.target===e.currentTarget&&setRuleDialog(false)}><section role="dialog" aria-modal="true" aria-label="适配规则设置" className={styles.dialog}><h2>适配规则设置</h2><p>按 SHEIN 美国站的实际类目、属性、图片与价格要求校验。启用规则为上传前必选条件，不更改原始商品。</p><button onClick={()=>setRuleDialog(false)}>确认</button></section></div>:null}
  {selectedItem?<div className={styles.overlay} role="presentation" onMouseDown={e=>e.target===e.currentTarget&&setSelected(null)}><section role="dialog" aria-modal="true" aria-label={stage==="missing"?"查看并补全":"审核智能体建议"} className={styles.dialog}><h2>{stage==="missing"?"查看并补全":"审核智能体建议"}</h2><p>{selectedItem.name} · {selectedItem.sku} · {selectedItem.store}</p>{stage==="missing"?(selectedItem.missing.length?selectedItem.missing.map(field=><label key={field}>{field}（必填）<input value={form[field]??""} onChange={e=>setForm(prev=>({...prev,[field]:e.target.value}))}/></label>):<p>必填资料已补齐；核对原任务后可以继续。</p>):<><p>只展示智能体本次修改内容；应用后才继续原上传任务，不直接覆盖原始商品数据。</p><div className={styles.compare}><div><b>标题</b><p>原：{selectedItem.name}</p><p>建议：{selectedItem.name} · 优化平台关键词与卖点</p></div><div><b>描述</b><p>原：基础商品描述</p><p>建议：补充使用场景、适用人群与核心卖点</p></div><div><b>图片</b><p>原图 4 张 · 重构图 6 张（演示）</p></div></div>{reviewMode==="edit"?<label>手动修改审核意见<input placeholder="填写修改建议" value={form.reviewNotes??""} onChange={e=>setForm(prev=>({...prev,reviewNotes:e.target.value}))}/></label>:null}<div className={styles.reviewActions}><button type="button" onClick={()=>setReviewMode(reviewMode==="edit"?"compare":"edit")}>手动修改</button><button type="button" onClick={()=>setNotice("演示模式：重新重构需实际授权智能体执行，此处没有生成新内容。")}>重新重构</button></div><label className={styles.switch}><input type="checkbox" checked={reviewChecked} onChange={e=>setReviewChecked(e.target.checked)}/> 已核对本次 AI 修改与目标平台规则</label></>}<footer><button onClick={()=>setSelected(null)}>返回列表</button><button className={styles.primary} disabled={stage==="review"&&!reviewChecked} onClick={stage==="missing"?(selectedItem.missing.length?save:()=>{setSelected(null);action("已补全。请确认继续原任务。")}):()=>{setSelected(null);action("AI 结果已在演示中确认；请回到原任务明确继续上传。")}}>{stage==="missing"?"保存并继续":"应用并确认继续"}</button></footer></section></div>:null}
 </div>;
}
