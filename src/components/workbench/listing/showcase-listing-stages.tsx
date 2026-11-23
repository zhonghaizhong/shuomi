"use client";
import {useEffect,useMemo,useState} from "react";
import {readOwnProductBatches,listOwnReadyProducts,ownProductUpdated} from "../showcase-own-product-data";
import {readOptimizedDatasets,optimizedDatasetsChanged} from "../showcase-optimized-datasets";
import {readDemoCollectionBatches} from "../showcase-collection-batches";
import {readShowcaseEnabledAgents,readShowcaseAgentTemplates,showcaseAgentId,showcaseAgentStateChanged} from "../showcase-agent-demo-state";
import {useDemoStoreBindings,demoStoreServiceActive} from "../store-binding-demo";
import {addShowcaseUploadTask,readShowcaseUploadTasks,showcaseUploadTasksEvent,type ShowcaseUploadTask} from "./showcase-upload-tasks";
import {useRouter} from "next/navigation";
import {AdaptationRulesDialog} from "./showcase-adaptation-rules-dialog";
import {readAdaptationRules,type AdaptationRule} from "./showcase-adaptation-rules";
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
 const [source,setSource]=useState("采集批次"),[batch,setBatch]=useState(""),[batchQuery,setBatchQuery]=useState(""),[store,setStore]=useState(""),[agent,setAgent]=useState(false),[agentId,setAgentId]=useState(""),[templateId,setTemplateId]=useState(""),[rules,setRules]=useState(true),[mode,setMode]=useState<"平台草稿"|"直接上传到平台"|"定时上传">("平台草稿");
 const [scheduledDate,setScheduledDate]=useState(""),[scheduledTime,setScheduledTime]=useState("");
 const [scheduleEnabled,setScheduleEnabled]=useState(false),[showTimeSettings,setShowTimeSettings]=useState(false);
 const [platformSite,setPlatformSite]=useState("");
 const [targetDialog,setTargetDialog]=useState(false),[draftSite,setDraftSite]=useState(""),[draftStore,setDraftStore]=useState("");
 const [currentRule,setCurrentRule]=useState<AdaptationRule>(()=>{const data=readAdaptationRules(organizationId,memberId);return data.rules.find(rule=>rule.id===data.currentId)??data.rules[0]});
 const {visible:availableStoreBindings}=useDemoStoreBindings(organizationId,memberId,memberId==="admin");
 const boundStores=availableStoreBindings.filter(s=>s.platformStoreId&&!s.archived&&!s.connectionIssue&&s.platformIdStatus!=="获取失败"&&demoStoreServiceActive(s));
 const siteChoices=Array.from(new Set(boundStores.map(s=>s.platform+" · "+s.region)));
 const siteStores=boundStores.filter(s=>s.platform+" · "+s.region===platformSite);
 const chosenStore=siteStores.find(s=>s.id===store);
 useEffect(()=>{if(platformSite&&!siteChoices.includes(platformSite)){setPlatformSite("");setStore("")}},[platformSite,siteChoices.join("|")]);
 const [agentDemoVersion,setAgentDemoVersion]=useState(0);
 useEffect(()=>{const refresh=(event:Event)=>{if((event as CustomEvent<{organizationId:string}>).detail?.organizationId===organizationId)setAgentDemoVersion(v=>v+1)};window.addEventListener(showcaseAgentStateChanged,refresh);return()=>window.removeEventListener(showcaseAgentStateChanged,refresh)},[organizationId]);
 const demoAgentNames=useMemo(()=>readShowcaseEnabledAgents(organizationId),[organizationId,agentDemoVersion]);
 const enabledAgents=demoAgentNames.map(name=>({id:showcaseAgentId(name),name}));
 const chosenAgent=enabledAgents.find(e=>e.id===agentId);
 const demoTemplates=useMemo(()=>chosenAgent?readShowcaseAgentTemplates(organizationId,memberId,chosenAgent.name):[],[organizationId,memberId,chosenAgent?.name,agentDemoVersion]);
 const availableTemplates=[{id:"default",name:"默认配置（演示）"},...demoTemplates];
 const chosenTemplate=availableTemplates.find(t=>t.id===templateId);
 const [filter,setFilter]=useState(""),[applied,setApplied]=useState(""),[sourceFilter,setSourceFilter]=useState("全部来源"),[appliedSource,setAppliedSource]=useState("全部来源"),[storeFilter,setStoreFilter]=useState("全部店铺"),[appliedStore,setAppliedStore]=useState("全部店铺"),[items,setItems]=useState(seed),[selected,setSelected]=useState<Item|null>(null),[notice,setNotice]=useState(""),[ruleDialog,setRuleDialog]=useState(false),[submitted,setSubmitted]=useState(false);
 const [form,setForm]=useState<Record<string,string>>({});
 const [dataVersion,setDataVersion]=useState(0);
 const [taskVersion,setTaskVersion]=useState(0);
 useEffect(()=>{const refresh=(event:Event)=>{const d=(event as CustomEvent<{organizationId:string}>).detail;if(!d||d.organizationId===organizationId)setDataVersion(v=>v+1)};window.addEventListener("shuomi:demo-batches-updated",refresh);window.addEventListener("focus",refresh);return()=>{window.removeEventListener("shuomi:demo-batches-updated",refresh);window.removeEventListener("focus",refresh)}},[organizationId]);
 useEffect(()=>{const onChange=(event:Event)=>{const d=(event as CustomEvent<{organizationId:string;memberId:string}>).detail;if(d?.organizationId===organizationId&&d.memberId===memberId)setTaskVersion(v=>v+1)};window.addEventListener(showcaseUploadTasksEvent,onChange);return()=>window.removeEventListener(showcaseUploadTasksEvent,onChange)},[organizationId,memberId]);
 useEffect(()=>{const handle=(e:Event)=>{const d=(e as CustomEvent<{organizationId:string;memberId:string}>).detail;if(d?.organizationId===organizationId&&d?.memberId===memberId)setDataVersion(n=>n+1)};window.addEventListener(ownProductUpdated,handle);return()=>window.removeEventListener(ownProductUpdated,handle)},[organizationId,memberId]);
 useEffect(()=>{const handle=(e:Event)=>{const d=(e as CustomEvent<{organizationId:string;memberId:string}>).detail;if(d?.organizationId===organizationId&&d.memberId===memberId)setDataVersion(v=>v+1)};window.addEventListener(optimizedDatasetsChanged,handle);return()=>window.removeEventListener(optimizedDatasetsChanged,handle)},[organizationId,memberId]);
 const optimizedSets=useMemo(()=>readOptimizedDatasets(organizationId,memberId),[organizationId,memberId,dataVersion]);
 useEffect(()=>{
  const key="shuomi:listing-dataset-prefill:"+organizationId+":"+memberId;
  const id=sessionStorage.getItem(key);
  if(id&&optimizedSets.some(d=>d.id===id)){setSource("数据集");setBatch(id);sessionStorage.removeItem(key)}
 },[organizationId,memberId,optimizedSets]);
 const ownBatches=useMemo(()=>readOwnProductBatches(organizationId,memberId),[organizationId,memberId,dataVersion]);
 const ownProducts=useMemo(()=>listOwnReadyProducts(organizationId,memberId),[organizationId,memberId,dataVersion]);
 const collectedBatches=useMemo(()=>readDemoCollectionBatches(organizationId,memberId),[organizationId,memberId,dataVersion]);
 const availableBatches=source==="数据集"?optimizedSets:source==="自有商品库"?ownBatches:collectedBatches;
 const visibleBatchOptions=availableBatches.filter(b=>{
  if(!batchQuery.trim()||b.id===batch)return true;
  const terms=("language" in b?b.name+" "+b.platform+" "+b.site+" "+b.language+" "+b.sourceBatchName:b.name).toLowerCase();
  return terms.includes(batchQuery.trim().toLowerCase());
 });
  const selectedOwnBatch=source==="自有商品库"?ownBatches.find(x=>x.id===batch):undefined;
 const selectedCollectedBatch=source==="采集批次"?collectedBatches.find(x=>x.id===batch):undefined;
 const selectedOptimizedSet=source==="数据集"?optimizedSets.find(x=>x.id===batch):undefined;
 const selectableProducts=selectedOwnBatch?ownProducts.filter(p=>p.batchId===selectedOwnBatch.id):[];
 const selectedProductIds=selectedOptimizedSet?selectedOptimizedSet.products.map(p=>p.sourceProductId):selectedCollectedBatch?selectedCollectedBatch.products.map(p=>p.id):selectableProducts.map(p=>p.id);
 const selectedCount=selectedProductIds.length;
 // First-stage intake is already complete; third-party missing fields are evaluated separately by the platform adapter.
 const missingCount=0;
 const savedTasks=useMemo(()=>readShowcaseUploadTasks(organizationId,memberId),[organizationId,memberId,taskVersion]);
 const taskItems:Item[]=savedTasks.filter(task=>stage==="missing"?task.status==="待补全":task.status==="待审核").flatMap(task=>task.productIds.map((id,i)=>({sku:id+" · "+task.id.slice(-8),name:task.batchName+(task.productCount>1?` · 商品 ${i+1}`:""),source:task.source,store:task.storeName,status:task.status,missing:task.status==="待补全"?["商品必填资料"]:[],ai:Boolean(task.agentId)})));
 const [reviewChecked,setReviewChecked]=useState(false),[reviewMode,setReviewMode]=useState<"compare"|"edit">("compare");
 const go=(s:string)=>router.push("/workbench/listing/"+s+"?preview=1");
 const filtered=useMemo(()=>(items.length?items:taskItems).filter(x=>(x.name+" "+x.sku+" "+x.source+" "+x.status).toLowerCase().includes(applied.toLowerCase())&&(appliedSource==="全部来源"||x.source===appliedSource)&&(appliedStore==="全部店铺"||x.store===appliedStore)),[items,taskItems,applied,appliedSource,appliedStore]);
 const selectedItem=selected?items.find(x=>x.sku===selected.sku)??selected:null;
 const action=(next:string)=>{setNotice(next);setSubmitted(true)};
 const submitUpload=(uploadMode:"平台草稿"|"直接上传到平台"|"定时上传")=>{
  if(!selectedCount||!chosenStore||!rules){setNotice("请先选择商品、有效目标店铺及适配规则。");return}
  if(agent&&(!chosenAgent||!chosenTemplate)){setNotice("请先选择当前企业已启用的智能体及执行模板。");return}
  if(uploadMode==="定时上传"){setNotice("定时上传尚未连接正式调度服务，已保留时间配置，但未创建自动执行任务。");return}
  if(selectedOptimizedSet&&selectedOptimizedSet.platform!==chosenStore.platform){setNotice("提示：优化版本源自 "+selectedOptimizedSet.platform+"，目标店铺为 "+chosenStore.platform+"。本演示未接入跨平台字段映射，不能把旧版内容直接提交为新平台数据。");return}
  const status:ShowcaseUploadTask["status"]=missingCount?"待补全":agent?"待执行智能体":"待平台提交";
  const record:ShowcaseUploadTask={id:"LIST-"+crypto.randomUUID(),organizationId,memberId,source:source as ShowcaseUploadTask["source"],batchId:batch,batchName:availableBatches.find(b=>b.id===batch)?.name??batch,productIds:selectedProductIds,productCount:selectedCount,missingCount,storeId:chosenStore.id,storeName:chosenStore.name,platform:"SHEIN",region:chosenStore.region,storeType:chosenStore.type,rule:currentRule.name,ruleConfig:{...currentRule},agentId:agent?agentId:null,agentName:agent?chosenAgent?.name??null:null,templateId:agent?templateId:null,mode:uploadMode,status,createdAt:new Date().toISOString(),demo:true};
  if(addShowcaseUploadTask(record)){setSubmitted(true);setNotice("已保存本次演示刊登任务（"+selectedCount+" 件，"+chosenStore.name+"，"+status+"）。原商品、店铺与规则保持关联，未执行真实平台上传。")}else setNotice("演示任务保存失败，请检查会话存储。");
 };
 const save=()=>{
  if(!selectedItem)return;
  const allFilled=selectedItem.missing.every(field=>(form[field]??"").trim().length>0);
  if(!allFilled){setNotice("请补齐所有必填字段后保存。");return}
  setItems(arr=>arr.map(x=>x.sku===selectedItem.sku?{...x,missing:[],status:"手动已补全"}:x));
  setSelected(null);setForm({});action("资料已保存到演示记录。请核对原任务，确认继续上传；启用智能体时先进入待审核。");
 };
 return <div className={styles.page} data-listing-stage={stage}>
  <header className={styles.heading}><small>店铺中心 / 刊登管理 / {names[stage]}</small><h1>{names[stage]}</h1><p>{descriptions[stage]}</p></header>
  {stage!=="waiting"?<nav className={styles.tabs} aria-label="刊登管理阶段">{menu.map(([key,label])=><button type="button" key={key} aria-current={key===stage?"page":undefined} onClick={()=>key!==stage&&go(key)}>{label}</button>)}</nav>:null}
  {notice?<div className={styles.notice} role="status">{notice}<button type="button" onClick={()=>setNotice("")} aria-label="关闭提示">×</button></div>:null}
  {stage==="waiting"?<>
   <section className={styles.flowHeader}><div><h2>商品上传流程</h2><p>商品 · 规则必选 · 智能体按需 · 平台上传</p></div><div className={styles.flowSteps}>{[["选择商品","待选择"],["平台与店铺","当前"],["启用智能体","按需"],["启用规则","必选"]].map(([name,state],i)=><span key={name}><b>{i+1}</b><strong>{name}</strong><small>{state}</small></span>)}</div></section>
   <section className={styles.configuration}>
    <article><header><b>01</b><h2>选择商品</h2></header><p>先确认数据类型，再选择批次，避免混用原始资料和优化版本。</p>
     <label>商品来源<select value={source} onChange={e=>{setSource(e.target.value);setBatch("");setBatchQuery("")}}><option value="采集批次">采集批次 · 原始采集</option><option value="自有商品库">自有商品库 · 自有原始</option><option value="数据集">数据集 · 已优化版本</option></select></label>
     <p className={styles.sourceGuide}>{source==="采集批次"?"原始采集资料：首次适配目标平台。":source==="自有商品库"?"原始自有商品：已通过硕米入库检查，待做目标平台适配。":"已优化版本：可以复用图片和文案，但更换平台或站点仍需重新检查。"}</p>
     {availableBatches.length>8?<label className={styles.batchLookup}>搜索当前分类的批次<input aria-label="搜索可选批次" value={batchQuery} onChange={e=>setBatchQuery(e.target.value)} placeholder="批次名称 / 平台 / 站点 / 语言"/></label>:null}
     <label>本次批次 / 产品集<select value={batch} onChange={e=>setBatch(e.target.value)}><option value="">{source==="数据集"?"请选择优化版本":"请选择原始批次"}</option>{visibleBatchOptions.map(b=><option key={b.id} value={b.id} disabled={source==="自有商品库"&&!ownProducts.some(p=>p.batchId===b.id)}>{source==="数据集"&&"language" in b?b.name+" · "+b.platform+" / "+b.site+" / "+b.language+" · V"+b.version:b.name+" · "+("products" in b?b.products.length:ownProducts.filter(p=>p.batchId===b.id).length)+" 个商品"}</option>)}</select></label>
     {selectedOptimizedSet?<div className={styles.datasetSelection} role="status"><strong>已选优化版本 · V{selectedOptimizedSet.version}</strong><span>来源：{selectedOptimizedSet.sourceKind} / {selectedOptimizedSet.sourceBatchName}</span><span>历史适配：{selectedOptimizedSet.platform} · {selectedOptimizedSet.site} · {selectedOptimizedSet.language}</span><span>商品：{selectedOptimizedSet.products.length} 件</span><em>此版本仅作为复用起点；目标店铺适配与原始价格、库存保持独立。</em></div>:selectedOwnBatch?<div className={styles.datasetSelection} role="status"><strong>自有原始批次</strong><span>{selectedOwnBatch.name} · 可用 {selectableProducts.length} 件</span><span>本批尚无目标平台适配版本</span></div>:selectedCollectedBatch?<div className={styles.datasetSelection} role="status"><strong>采集原始批次</strong><span>{selectedCollectedBatch.source} · {selectedCollectedBatch.products.length} 件商品</span><span>本批尚无目标平台适配版本</span></div>:null}
     <small>{selectedCount>0?`已选择 ${selectedCount} 个商品；原始资料保持不变`:availableBatches.length?"请先选择批次并确认来源信息。":source==="数据集"?"暂无成功上传后沉淀的优化版本，可先选择原始批次。":"当前账号无可用批次，请先在我的数据中采集或上传。"}</small>
     <button type="button" onClick={()=>router.push("/workbench/data/mine?preview=1")}>查看我的数据</button></article>
    <article><header><b>02</b><h2>目标平台与店铺</h2></header><p>选择平台站点及目标店铺</p><button type="button" onClick={()=>{setDraftSite(platformSite);setDraftStore(store);setTargetDialog(true)}}>{platformSite||"请选择店铺"}</button><button type="button" onClick={()=>{if(chosenStore){setNotice("已确认目标店铺："+chosenStore.name+"（"+chosenStore.region+"）")}else{setDraftSite(platformSite);setDraftStore(store);setTargetDialog(true)}}}>{chosenStore?"已确认："+chosenStore.name:"确认目标店铺"}</button><small>{chosenStore?`提交后将按 ${chosenStore.platform} · ${chosenStore.region} 的要求校验，目标店铺：${chosenStore.name}`:"提交后　资料完整后自动分流"}</small></article>
    <article><header><b>03</b><h2>智能体（按需）</h2></header><p>按需重构商品后进入审核</p>
     <label className={styles.agentToggleRow}><span>启用智能体</span><input aria-label="启用智能体" type="checkbox" checked={agent} onChange={e=>{setAgent(e.target.checked);setAgentId("");setTemplateId("")}}/></label>
     <div className={styles.agentStatusRow}><strong>智能体</strong><span>{agent?chosenAgent?.name??"请选择智能体":"未启用，无需选择"}</span></div>
     {agent?<><label>选择智能体<select aria-label="选择执行智能体" value={agentId} onChange={e=>{setAgentId(e.target.value);setTemplateId("")}}><option value="">请选择智能体</option>{enabledAgents.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label><label>执行模板<select aria-label="执行模板" disabled={!chosenAgent} value={templateId} onChange={e=>setTemplateId(e.target.value)}><option value="">{chosenAgent?"请选择模板":"请先选择智能体"}</option>{availableTemplates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label></>:null}
     <small>{agent&&!enabledAgents.length?"当前没有已启用的智能体。":chosenAgent?.id==="pod.design.agent"?"POD 成品图生成后进入素材管理审核":agent?"执行结果经审核后继续原任务":"开启后配置执行模板"}</small><button type="button" onClick={()=>router.push("/workbench/agents/mine?preview=1")}>前往我的智能体</button>
    </article>
    <article><header><b>04</b><h2>启用规则</h2></header><p>规则必须启用才能上传</p>
     <label className={styles.ruleRequiredRow}><span>标准适配规则</span><input aria-label="启用标准适配规则" type="checkbox" checked={rules} onChange={e=>setRules(e.target.checked)}/></label>
     <div className={styles.ruleSelectedRow}><strong>本次适配规则</strong><span>{rules?"必选启用":"未启用"}</span></div>
     <button type="button" className={styles.ruleSettingsButton} onClick={()=>setRuleDialog(true)}>适配规则设置</button>
     <small>适用范围　{currentRule.name} · 本次生效，原始资料不变</small>
    </article>
   </section>
   <section className={styles.submit}>
     <div className={styles.uploadSummary}><header><h2>本次上传</h2><p>按目标平台校验资料：缺失先补全，启用智能体需审核</p></header>
      <div className={styles.uploadFacts}>{[
       ["商品来源",source==="数据集"?"优化数据集 · 复用版":source==="自有商品库"?"自有原始商品":"原始采集批次"],["已选商品",selectedCount?selectedCount+" 个商品":"请选择商品"],["目标平台与店铺",chosenStore?.name??"请选择店铺"],
       ["智能体",agent?chosenAgent?.name??"请选择智能体":"未启用"],["适配规则",rules?currentRule.name:"必须启用"]
      ].map(([label,value],i)=><div key={label} className={styles.uploadFact} data-kind={i}><strong>{label}</strong><span>{value}</span></div>)}</div>
     </div>
     <div className={styles.uploadActions}><div className={styles.scheduleRow}><label>定时上传<input aria-label="启用定时上传" type="checkbox" checked={scheduleEnabled} onChange={e=>{setScheduleEnabled(e.target.checked);setMode(e.target.checked?"定时上传":"直接上传到平台")}}/></label><button type="button" onClick={()=>setShowTimeSettings(true)}>设置时间</button></div>
      {scheduleEnabled&&scheduledDate&&scheduledTime?<small>计划时间：{scheduledDate} {scheduledTime}（演示，未实际预约）</small>:null}
      <div className={styles.uploadActionButtons}><button type="button" disabled={!selectedCount||!chosenStore||!rules||(agent&&(!chosenAgent||!chosenTemplate))} onClick={()=>submitUpload("平台草稿")}>上传到草稿箱</button><button type="button" className={styles.primary} disabled={!selectedCount||!chosenStore||!rules||(agent&&(!chosenAgent||!chosenTemplate))||(scheduleEnabled&&(!scheduledDate||!scheduledTime))} onClick={()=>submitUpload(scheduleEnabled?"定时上传":"直接上传到平台")}>{scheduleEnabled?"确认定时上传":"直接上传到平台"}</button></div>
     </div>
   </section>
   {showTimeSettings?<div className={styles.overlay} role="presentation" onMouseDown={e=>e.target===e.currentTarget&&setShowTimeSettings(false)}><section className={styles.dialog} role="dialog" aria-modal="true" aria-label="设置上传时间"><h2>设置上传时间</h2><p>设置本次上传的执行日期与时间。演示模式不执行真实调度。</p><label>日期<input aria-label="定时上传日期" type="date" value={scheduledDate} onChange={e=>setScheduledDate(e.target.value)}/></label><label>时间<input aria-label="定时上传时间" type="time" value={scheduledTime} onChange={e=>setScheduledTime(e.target.value)}/></label><footer><button type="button" onClick={()=>setShowTimeSettings(false)}>取消</button><button type="button" className={styles.primary} disabled={!scheduledDate||!scheduledTime} onClick={()=>{setScheduleEnabled(true);setMode("定时上传");setShowTimeSettings(false)}}>确认</button></footer></section></div>:null}
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
  {targetDialog?<div className={styles.overlay} role="presentation" onMouseDown={e=>e.target===e.currentTarget&&setTargetDialog(false)}><section className={`${styles.dialog} ${styles.targetDialog}`} role="dialog" aria-modal="true" aria-label="选择目标平台与店铺"><header><h2>选择目标平台与店铺</h2><p>先选择平台及站点，再从当前账号可管理、连接正常且服务有效的店铺中选择。</p></header><label>平台 / 站点<select aria-label="选择平台与站点" value={draftSite} onChange={e=>{setDraftSite(e.target.value);setDraftStore("")}}><option value="">请选择平台与站点</option>{siteChoices.map(site=><option key={site} value={site}>{site}</option>)}</select></label><label>目标店铺<select aria-label="选择本次目标店铺" disabled={!draftSite} value={draftStore} onChange={e=>setDraftStore(e.target.value)}><option value="">请选择店铺</option>{boundStores.filter(s=>s.platform+" · "+s.region===draftSite).map(s=><option key={s.id} value={s.id}>{s.name} · {s.type}</option>)}</select></label><p>{draftSite?"仅列出该站点下可用的绑定店铺。":"请先选择平台与站点。"}</p><footer><button type="button" onClick={()=>setTargetDialog(false)}>取消</button><button type="button" className={styles.primary} disabled={!draftSite||!draftStore} onClick={()=>{setPlatformSite(draftSite);setStore(draftStore);setTargetDialog(false);setNotice("已确认本次上传的目标平台、站点和店铺。")}}>确认目标店铺</button></footer></section></div>:null}
   {ruleDialog?<AdaptationRulesDialog organizationId={organizationId} memberId={memberId} site={platformSite} storeName={chosenStore?.name??""} onClose={()=>setRuleDialog(false)} onSave={next=>{setCurrentRule(next);setRuleDialog(false);setNotice("适配规则已保存；将在本次上传任务中使用「"+next.name+"」，不会改动原始商品。")}}/>:null}
   {selectedItem?<div className={styles.overlay} role="presentation" onMouseDown={e=>e.target===e.currentTarget&&setSelected(null)}><section role="dialog" aria-modal="true" aria-label={stage==="missing"?"查看并补全":"审核智能体建议"} className={styles.dialog}><h2>{stage==="missing"?"查看并补全":"审核智能体建议"}</h2><p>{selectedItem.name} · {selectedItem.sku} · {selectedItem.store}</p>{stage==="missing"?(selectedItem.missing.length?selectedItem.missing.map(field=><label key={field}>{field}（必填）<input value={form[field]??""} onChange={e=>setForm(prev=>({...prev,[field]:e.target.value}))}/></label>):<p>必填资料已补齐；核对原任务后可以继续。</p>):<><p>只展示智能体本次修改内容；应用后才继续原上传任务，不直接覆盖原始商品数据。</p><div className={styles.compare}><div><b>标题</b><p>原：{selectedItem.name}</p><p>建议：{selectedItem.name} · 优化平台关键词与卖点</p></div><div><b>描述</b><p>原：基础商品描述</p><p>建议：补充使用场景、适用人群与核心卖点</p></div><div><b>图片</b><p>原图 4 张 · 重构图 6 张（演示）</p></div></div>{reviewMode==="edit"?<label>手动修改审核意见<input placeholder="填写修改建议" value={form.reviewNotes??""} onChange={e=>setForm(prev=>({...prev,reviewNotes:e.target.value}))}/></label>:null}<div className={styles.reviewActions}><button type="button" onClick={()=>setReviewMode(reviewMode==="edit"?"compare":"edit")}>手动修改</button><button type="button" onClick={()=>setNotice("演示模式：重新重构需实际授权智能体执行，此处没有生成新内容。")}>重新重构</button></div><label className={styles.switch}><input type="checkbox" checked={reviewChecked} onChange={e=>setReviewChecked(e.target.checked)}/> 已核对本次 AI 修改与目标平台规则</label></>}<footer><button onClick={()=>setSelected(null)}>返回列表</button><button className={styles.primary} disabled={stage==="review"&&!reviewChecked} onClick={stage==="missing"?(selectedItem.missing.length?save:()=>{setSelected(null);action("已补全。请确认继续原任务。")}):()=>{setSelected(null);action("AI 结果已在演示中确认；请回到原任务明确继续上传。")}}>{stage==="missing"?"保存并继续":"应用并确认继续"}</button></footer></section></div>:null}
 </div>;
}
