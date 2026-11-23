"use client";
import {useEffect,useId,useRef,useState} from "react";
import {readDemoStoreBindings,demoStoreServiceActive} from "./store-binding-demo";
import css from "./showcase-pod-task-dialog.module.css";

type Source="我的选品"|"自有商品";
type TaskStore={id:string;name:string;region:string;platformStoreId?:string;serviceExpiresAt?:string};
// Figma sample rows: preview-only, not actual product data or connected inventory.
const figmaExamples=[{id:"POD-T001",name:"女士基础款圆领T恤",category:"服饰"},{id:"POD-H008",name:"女士宽松连帽卫衣",category:"服饰"},{id:"POD-B016",name:"纯棉帆布购物袋",category:"配件"},{id:"POD-T023",name:"女士短款休闲上衣",category:"服饰"}];
export function ShowcasePODTaskDialog({onClose,onTemplate,organizationId,memberId,administrator}:{onClose:()=>void;onTemplate:()=>void;organizationId:string;memberId:string;administrator:boolean}){
 const ref=useRef<HTMLDialogElement>(null);
 const id=useId();
 const [stores]=useState<TaskStore[]>(()=>typeof window==="undefined"?[]:readDemoStoreBindings(organizationId).filter(s=>!s.archived&&!!s.platformStoreId&&demoStoreServiceActive(s)&&(administrator||s.ownerMemberId===memberId)).map(s=>({id:s.id,name:s.name,region:s.region,platformStoreId:s.platformStoreId,serviceExpiresAt:s.serviceExpiresAt})));
 const [region,setRegion]=useState("");
 const [storeId,setStoreId]=useState("");
 const [source,setSource]=useState<Source>("我的选品");
 const [picker,setPicker]=useState(false);
 const [query,setQuery]=useState("");
 const [category,setCategory]=useState("全部分类");
 const [selectedProducts,setSelectedProducts]=useState<string[]>([]);
 const [draftSelection,setDraftSelection]=useState<string[]>([]);
 const [planReady,setPlanReady]=useState(false);
 const [notes,setNotes]=useState("");
 const [message,setMessage]=useState("");
 const [assistantText,setAssistantText]=useState("");
 const regions=[...new Set(stores.map(s=>s.region))];
 const eligible=stores.filter(s=>!region||s.region===region);
 const exampleResults=figmaExamples.filter(x=>(category==="全部分类"||x.category===category)&&(`${x.name} ${x.id}`).toLowerCase().includes(query.toLowerCase()));
 useEffect(()=>{const dialog=ref.current;if(dialog&&!dialog.open)dialog.showModal();return()=>dialog?.close()},[]);
 const addRequirement=(value:string)=>setNotes(old=>old.trim()?old.trim()+"；"+value:value);
 const openPicker=(value:Source)=>{setSource(value);setQuery("");setCategory("全部分类");setDraftSelection(selectedProducts);setPicker(true);};
 const submit=()=>{if(!storeId){setMessage("请先选择有有效服务期的刊登店铺。");return;}if(!selectedProducts.length){setMessage("请先从真实商品资料中选择商品；当前演示未接入可选择的商品记录，不能虚构商品或生成刊登方案。");return;}setPlanReady(true);setMessage("已生成仅供演示的刊登方案摘要：选定店铺和原型示例商品，不会调用模型、扣积分、创建真实任务或刊登。");};
 return <dialog ref={ref} className={css.dialog} aria-labelledby={id} onCancel={event=>{event.preventDefault();if(picker)setPicker(false);else onClose();}} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
  <header className={css.header}><div><small>我的智能体 / POD刊登智能体</small><h2 id={id}>创建 POD 刊登任务</h2><p>先选择刊登店铺，再选择商品，智能生成刊登内容并在平台上架前统一检查。</p></div><button type="button" aria-label="关闭弹窗" onClick={onClose}>×</button></header>
  <div className={css.columns}><div className={css.sections}>
   <section><h3>步骤 1 · 选择刊登店铺 <em>必选</em></h3><p>仅显示当前演示企业中已绑定且服务期有效的店铺。</p><div className={css.fields}><label>平台<select aria-label="刊登平台" value="SHEIN" disabled><option>SHEIN</option></select></label><label>站点<select aria-label="刊登站点" value={region} onChange={e=>{setRegion(e.target.value);setStoreId("");}}><option value="">全部站点</option>{regions.map(x=><option key={x}>{x}</option>)}</select></label><label>店铺<select aria-label="刊登店铺" value={storeId} onChange={e=>{setStoreId(e.target.value);setMessage("");}}><option value="">请选择店铺</option>{eligible.map(s=><option key={s.id} value={s.id}>{s.name} · {s.region}</option>)}</select></label></div>{!stores.length?<p role="status">没有可用店铺，请先在「我的店铺」完成绑定及服务期配置。</p>:null}</section>
   <section><h3>步骤 2 · 选择商品</h3><p>从「我的选品」或「自有商品」的实际资料中选择需要刊登的商品。</p><div className={css.choice}><button type="button" onClick={()=>openPicker("我的选品")}><strong>从我的选品选择</strong><small>我的供应链 · 我的选品 · 待优化</small></button><button type="button" onClick={()=>openPicker("自有商品")}><strong>从自有商品选择</strong><small>我的供应链 · 自有商品 · 待优化</small></button></div><small>已选择 {selectedProducts.length} 个原型示例商品（不写入真实商品库）</small><h4>POD 设置</h4><div className={css.facts}><div>印刷位置<strong>智能识别</strong></div><div>设计尺寸<strong>智能适配</strong></div><div>目标市场<strong>{region||"按所选店铺"}</strong></div><div>内容生成<strong>智能生成</strong></div></div><h4>AI 生成商品内容</h4><div className={css.chips}>{["商品标题","卖点","商品描述","关键词","商品属性","商品分类"].map(x=><span key={x}>{x}</span>)}</div><label className={css.longField}>补充要求<textarea aria-label="刊登补充要求" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="例如：突出 POD 设计，标题避免敏感词，目标利润率不低于 30%。"/></label><div className={css.actions}><button type="button" onClick={onTemplate}>查看 POD 模板配置</button><button type="button" className={css.primary} onClick={submit}>生成刊登方案</button></div>{message?<p role="status" className={css.notice}>{message}</p>:null}{planReady?<div className={css.notice}><strong>待确认的演示方案</strong><p>店铺：{stores.find(s=>s.id===storeId)?.name||"未选择"} · 商品：{selectedProducts.join("、")||"无"} · 内容：标题、卖点、描述、关键词、属性与分类</p><p>不会执行真实刊登。实际执行须连接商品记录、平台授权与任务服务。</p><button type="button" onClick={()=>setPlanReady(false)}>返回修改</button></div>:null}</section>
  </div><aside className={css.assistant}><h3>POD 刊登助手</h3><p>告诉我刊登要求，我会同步调整任务配置。</p><p>快捷要求</p><div className={css.chips}>{["偏美国市场","突出POD设计","利润率30%+"].map(x=><button type="button" key={x} onClick={()=>addRequirement(x)}>{x}</button>)}</div><label>特殊要求<textarea aria-label="POD助手特殊要求" value={assistantText} onChange={e=>setAssistantText(e.target.value)} placeholder="输入你的特殊要求…"/></label><button type="button" onClick={()=>{if(assistantText.trim()){addRequirement(assistantText.trim());setAssistantText("");}}}>应用要求</button><p>此处是配置演示，不会生成商品、扣积分或真实刊登。</p></aside></div>
  {picker?<div className={css.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setPicker(false);}}><section role="dialog" aria-modal="true" aria-label="选择POD商品" className={css.picker}><header><div><h2>选择商品</h2><p>来源：{source} · 以下为 Figma 原型示例，不属于实际商品库</p></div><button type="button" aria-label="关闭选择商品弹窗" onClick={()=>setPicker(false)}>×</button></header><div className={css.pickerFilters}><input aria-label="搜索POD商品" value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索商品名称或 SKU"/><select aria-label="POD商品分类" value={category} onChange={e=>setCategory(e.target.value)}><option>全部分类</option><option>服饰</option><option>配件</option></select></div><p>演示记录共 {exampleResults.length} 条 · 请在接入实际商品数据后替换示例</p><div className={css.productRows}>{exampleResults.length?exampleResults.map(x=><label key={x.id}><input type="checkbox" checked={draftSelection.includes(x.id)} onChange={e=>setDraftSelection(old=>e.target.checked?[...old,x.id]:old.filter(v=>v!==x.id))}/><span><strong>{x.name}</strong><small>SKU：{x.id} · {x.category} · 原型示例</small></span></label>):<div className={css.empty}>没有符合搜索条件的示例商品</div>}</div><footer><button type="button" onClick={()=>setPicker(false)}>取消</button><button type="button" className={css.primary} onClick={()=>{setSelectedProducts(draftSelection);setPlanReady(false);setPicker(false);}}>确认选择（{draftSelection.length}）</button></footer></section></div>:null}
 </dialog>
}
