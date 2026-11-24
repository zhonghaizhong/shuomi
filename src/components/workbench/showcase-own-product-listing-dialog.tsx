"use client";

import {useEffect,useId,useRef,useState,type ChangeEvent} from "react";
import {saveOwnIntakeNavigation,type OwnIntakeStage} from "./showcase-own-product-intake-navigation";
import {ShowcaseOwnProductIntakeModal} from "./showcase-own-product-intake-modal";
import {agentPreviewTemplatesChanged,readAgentPreviewTemplates} from "./showcase-agent-template-store";
import styles from "./showcase-own-product-listing-dialog.module.css";
import {readOwnProductBatches,createOwnProductBatch,saveOwnProduct,readOwnProducts,checkOwnProductSkus,updateOwnProductAfterReview,approveOwnProductIntake,type OwnProductBatch,type OwnProductRecord} from "./showcase-own-product-data";

type Source="img"|"sheet"|"link"|"api";
type Sku={id:number;name:string;draft:string;description:string;images:string[]};
const newSku=(id:number):Sku=>({id,name:"",draft:"",description:"",images:[]});
const availableAgents=():string[]=>{if(typeof window==="undefined")return [];try{const raw=sessionStorage.getItem("shuomi-demo-agents-enabled");if(raw===null)return ["商品优化智能体","POD刊登智能体"];const parsed:unknown=JSON.parse(raw);return Array.isArray(parsed)?parsed.filter((v):v is string=>typeof v==="string"):[]}catch{return []}};
const agentTemplates=(org:string,member:string,agent:string):string[]=>readAgentPreviewTemplates(org,member,agent).map(item=>item.name);
const sourceOptions:{value:Source;label:string}[]=[
 {value:"img",label:"上传资料"},{value:"sheet",label:"导入表格"},
 {value:"link",label:"商品链接"},{value:"api",label:"API 接入"}
];

export function ShowcaseOwnProductListingDialog({onClose,organizationId,memberId}:{onClose:()=>void;organizationId:string;memberId:string}){
 const ref=useRef<HTMLDialogElement>(null),fileRef=useRef<HTMLInputElement>(null),headingId=useId();
 const openStage=(stage:OwnIntakeStage,itemId?:string)=>{saveOwnIntakeNavigation({organizationId,memberId,stage,itemId});setIntakeTab(stage)};
 const reviewPanelRef=useRef<HTMLElement>(null);
 const [source,setSource]=useState<Source>("img"),[skuType,setSkuType]=useState<"single"|"multi">("multi");
 const [skus,setSkus]=useState<Sku[]>([newSku(1),newSku(2)]),[currentId,setCurrentId]=useState(1);
 const [activeImage,setActiveImage]=useState<string|null>(null),[agent,setAgent]=useState(""),[template,setTemplate]=useState("");
 const [link,setLink]=useState(""),[sheetName,setSheetName]=useState(""),[status,setStatus]=useState("");
 const [loadingImages,setLoadingImages]=useState(false);
 const [reviewProduct,setReviewProduct]=useState<OwnProductRecord|null>(null),[reviewSkus,setReviewSkus]=useState<OwnProductRecord["skus"]>([]),[reviewSkuId,setReviewSkuId]=useState(1);
 const [reviewUploadId,setReviewUploadId]=useState<number|null>(null);
 const [intakeTab,setIntakeTab]=useState<"pending"|"review"|null>(null);
 const [intakeRefresh,setIntakeRefresh]=useState(0);
 const intakeRecords=readOwnProducts(organizationId,memberId);
 const pendingRecords=intakeRecords.filter(p=>p.status==="入库待完善");
 const awaitingRecords=intakeRecords.filter(p=>p.status==="待审核");
 const [enabledAgents,setEnabledAgents]=useState<string[]>(availableAgents);
 const [templates,setTemplates]=useState<string[]>([]);
 useEffect(()=>{setEnabledAgents(availableAgents())},[]);
 useEffect(()=>{
  const refresh=()=>setTemplates(agentTemplates(organizationId,memberId,agent));
  refresh();
  setTemplate("");
  const onChange=(event:Event)=>{
   const detail=(event as CustomEvent<{organizationId:string;memberId:string;agent:string}>).detail;
   if(detail?.organizationId!==organizationId||detail?.memberId!==memberId||detail?.agent!==agent)return;
   const updated=agentTemplates(organizationId,memberId,agent);
   setTemplates(updated);
   setTemplate(current=>updated.includes(current)?current:"");
  };
  window.addEventListener(agentPreviewTemplatesChanged,onChange);
  return()=>window.removeEventListener(agentPreviewTemplatesChanged,onChange);
 },[agent,organizationId,memberId]);
 const [batches,setBatches]=useState<OwnProductBatch[]>(()=>readOwnProductBatches(organizationId,memberId));
 const [batchId,setBatchId]=useState(""),[batchMode,setBatchMode]=useState<"create"|"select"|null>(null),[batchName,setBatchName]=useState("");
 const currentBatch=batches.find(b=>b.id===batchId);
 const saveBatch=()=>{try{const next=createOwnProductBatch(organizationId,memberId,batchName);setBatches(readOwnProductBatches(organizationId,memberId));setBatchId(next.id);setBatchMode(null);setBatchName("");setStatus("已创建批次「"+next.name+"」，可以提交商品检测。")}catch(e){setStatus(e instanceof Error?e.message:"无法创建批次")}};

 useEffect(()=>{const el=ref.current,previous=document.activeElement;el?.showModal();return()=>{el?.close();if(previous instanceof HTMLElement&&previous.isConnected)previous.focus()}},[]);
 const active=skus.find(x=>x.id===currentId)||skus[0];
 const patch=(id:number,fields:Partial<Sku>)=>setSkus(prev=>prev.map(x=>x.id===id?{...x,...fields}:x));
 const onSource=(next:Source)=>{setSource(next);setStatus("");setActiveImage(null)};
 const onSkuType=(next:"single"|"multi")=>{setSkuType(next);setCurrentId(1);setStatus("")};
 const addSku=()=>{const next=Math.max(...skus.map(x=>x.id))+1;setSkus(v=>[...v,newSku(next)]);setCurrentId(next);setStatus("")};
 const onFiles=async(e:ChangeEvent<HTMLInputElement>)=>{
  const files=Array.from(e.target.files||[]).slice(0,Math.max(0,8-active.images.length));
  if(!files.length)return;
  setLoadingImages(true);
  try{
   const images=await Promise.all(files.map(file=>new Promise<string>((resolve,reject)=>{
    if(!file.type.startsWith("image/")){reject(new Error("请选择图片文件"));return;}
    const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error("读取失败"));reader.readAsDataURL(file);
   })));
   setSkus(prev=>prev.map(s=>s.id===active.id?{...s,images:[...s.images,...images].slice(0,8)}:s));
   setStatus("");
  }catch{setStatus("部分图片无法读取，请重新选择有效的图片文件。")}
  finally{setLoadingImages(false);if(fileRef.current)fileRef.current.value="";}
 };
 const validate=()=>{
  if(!currentBatch){setStatus("请先创建或选择自有商品批次，再提交检测。");return;}
  if(source!=="img"){setStatus(source==="sheet"?(sheetName?"表格已选择；字段映射未接入，不能保存伪造商品。":"请先选择商品表格。"):source==="link"?(link.trim()?"商品链接解析尚未接入，不能保存伪造商品。":"请填写商品链接。"):"API 授权和商品读取尚未接入，不能保存伪造商品。");return;}
  const entries=skuType==="multi"?skus:[skus[0]];
  const normalized=entries.map(x=>({id:x.id,name:x.name||x.draft.trim(),description:x.description,images:x.images}));
  if(normalized.every(x=>!x.images.length&&!x.description.trim()&&!x.name.trim())){setStatus("请先填写商品资料或上传商品图片。");return;}
  const missing=checkOwnProductSkus(normalized);
  try{
   const item=saveOwnProduct(organizationId,memberId,currentBatch.id,{
    name:normalized[0]?.name||"自有商品 · "+new Date().toLocaleDateString("zh-CN"),
    source:"上传资料",status:missing.length?"入库待完善":"待审核",missing,agent,template,skus:normalized
   });
   setBatches(readOwnProductBatches(organizationId,memberId));setIntakeRefresh(v=>v+1);
   openStage(missing.length?"pending":"review",item.id);
  }catch(e){setStatus(e instanceof Error?"保存失败："+e.message:"保存失败，请检查浏览器会话存储容量。");}
 };
 useEffect(()=>{if(reviewProduct){reviewPanelRef.current?.scrollIntoView({block:"start",behavior:"instant"});}},[reviewProduct?.id]);
 const currentReviewSku=reviewSkus.find(s=>s.id===reviewSkuId)||reviewSkus[0];
 const reviewMissing=checkOwnProductSkus(reviewSkus);
 const completeReview=()=>{
  if(!reviewProduct)return;
  try{
   const updated=updateOwnProductAfterReview(organizationId,memberId,reviewProduct.id,reviewSkus);
   setReviewProduct(updated);setReviewSkus(updated.skus);setBatches(readOwnProductBatches(organizationId,memberId));setIntakeRefresh(v=>v+1);
   setStatus(updated.status==="待审核"?"硕米平台入库检查通过，已转入本工具「待审核」；确认后进入自有商品库。":"仍有 "+updated.missing.length+" 项缺失，请继续补全，草稿仍保存在本工具内，不会进入刊登管理的待补全。");
  }catch(e){setStatus(e instanceof Error?e.message:"检查失败");}
 };
 const reviewUpload=async(e:ChangeEvent<HTMLInputElement>)=>{
  const files=Array.from(e.target.files||[]).filter(file=>file.type.startsWith("image/"));
  const id=reviewUploadId;
  if(id===null||!files.length)return;
  try{
   const images=await Promise.all(files.slice(0,8).map(file=>new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error("图片读取失败"));reader.readAsDataURL(file)})));
   setReviewSkus(prev=>prev.map(x=>x.id===id?{...x,images:[...x.images,...images].slice(0,8)}:x));
  }catch{setStatus("图片读取失败，请重试");}
  finally{e.target.value="";}
 };
 const confirmIntake=(id:string)=>{try{const item=approveOwnProductIntake(organizationId,memberId,id);setIntakeRefresh(v=>v+1);setBatches(readOwnProductBatches(organizationId,memberId));if(reviewProduct?.id===id)setReviewProduct(item);setStatus("已确认入库："+item.name+"，可前往「我的数据 → 自有商品库」查看。")}catch(e){setStatus(e instanceof Error?e.message:"入库确认失败")}};
 const openIntake=(item:OwnProductRecord)=>{setReviewProduct(item);setReviewSkus(item.skus);setReviewSkuId(item.skus[0]?.id||1);setIntakeTab(null);setStatus("")};
 void intakeRefresh;
 const btnText=(id:number)=>skus.find(x=>x.id===id)?.name||`SKU ${id}`;
 return <dialog ref={ref} className={styles.dialog} aria-labelledby={headingId} onCancel={e=>{e.preventDefault();if(activeImage)setActiveImage(null);else onClose()}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
  <header className={styles.header}><div><h2 id={headingId}>自有商品一键刊登</h2><p>上传商品资料，按 SKU 整理图片及基础信息，提交后统一检测。</p></div><button type="button" onClick={onClose}>关闭</button></header>
  <div className={styles.content}>

   {reviewProduct?<section ref={reviewPanelRef} className={styles.reviewPanel} aria-label="商品检测承接区">
    <div className={styles.reviewHead}><div><h3>首次适配 · 硕米商品入库检查</h3><p>本次批次：{batches.find(b=>b.id===reviewProduct.batchId)?.name} · {reviewProduct.status==="已入库"?"已通过统一检查":"需完善 "+reviewMissing.length+" 项"}</p></div><button type="button" onClick={()=>{setReviewProduct(null);setReviewSkus([]);setStatus("")}}>继续导入商品</button></div>
    {status?<p role="status" className={styles.feedback}>{status}</p>:null}
    {reviewProduct.status==="入库待完善"?<>
     <div className={styles.reviewList}>{reviewSkus.map(x=><button type="button" key={x.id} className={reviewSkuId===x.id?styles.reviewActive:""} onClick={()=>setReviewSkuId(x.id)}>{x.name||"SKU "+x.id}<small>{checkOwnProductSkus([x]).length?checkOwnProductSkus([x]).length+" 项缺失":"资料齐全"}</small></button>)}</div>
     {currentReviewSku?<div className={styles.reviewEditor}>
      <label>SKU 名称<input aria-label="补全 SKU 名称" value={currentReviewSku.name} onChange={e=>setReviewSkus(old=>old.map(x=>x.id===currentReviewSku.id?{...x,name:e.target.value}:x))}/></label>
      <label>基础资料<textarea aria-label="补全 SKU 基础资料" rows={3} value={currentReviewSku.description} placeholder="填写材质、规格、售价、商品卖点等必填资料" onChange={e=>setReviewSkus(old=>old.map(x=>x.id===currentReviewSku.id?{...x,description:e.target.value}:x))}/></label>
      <div className={styles.reviewImages}><strong>商品图片 {currentReviewSku.images.length}/8</strong><div>{currentReviewSku.images.map((src,i)=><img key={i} src={src} alt={"商品图片 "+(i+1)}/>)}</div><button type="button" disabled={currentReviewSku.images.length>=8} onClick={()=>{setReviewUploadId(currentReviewSku.id);document.getElementById("own-review-images-"+headingId)?.click()}}>补充图片</button><input id={"own-review-images-"+headingId} type="file" accept="image/*" multiple onChange={e=>void reviewUpload(e)} className={styles.visuallyHidden}/></div>
     </div>:null}
     <p className={styles.reviewMissing}>本次硕米入库检查缺项：{reviewMissing.length?reviewMissing.join("、"):"资料齐全，可以统一检查"}</p>
     <button type="button" className={styles.reviewCheck} onClick={completeReview}>完成硕米入库检查</button>
    </>:reviewProduct.status==="待审核"?<div className={styles.reviewSuccess}><p>首次入库检查已通过，等待确认入库；不属于第三方平台「待审核」。</p><button type="button" className={styles.reviewCheck} onClick={()=>confirmIntake(reviewProduct.id)}>确认入库</button></div>:<p className={styles.reviewSuccess}>已确认入库，可在「我的数据 → 自有商品库」查看。后续第三方平台适配缺项才进入「刊登管理 → 待补全」。</p>}
   </section>:null}
   {!reviewProduct?<><section className={styles.panel}><div className={styles.heading}><h3>01&nbsp; 选择导入方式</h3></div>
    <div className={styles.sources} role="radiogroup" aria-label="选择导入方式">{sourceOptions.map(x=><button type="button" key={x.value} role="radio" aria-checked={source===x.value} onClick={()=>onSource(x.value)}>{x.label}<span className={styles.selectDot}/></button>)}</div>
   </section>
   <section className={styles.panel}>
    <div className={styles.heading}><h3>02&nbsp; 商品资料</h3>{source==="img"?<div className={styles.skuSwitch}><span>SKU 类型</span>{[["single","单 SKU"],["multi","多 SKU"]].map(([value,label])=><button type="button" key={value} aria-pressed={skuType===value} onClick={()=>onSkuType(value as "single"|"multi")}>{label}</button>)}</div>:null}</div>
    {source==="img"?<div className={styles.productGrid}>
     {skuType==="multi"?<aside className={styles.skuList}><strong>SKU 列表</strong><small>直接输入名称，点击保存</small>
      <div className={styles.skuItems}>{skus.map(s=><div key={s.id} className={styles.skuItem} data-active={currentId===s.id}>
       <div className={styles.skuItemRow}>
        <button type="button" className={styles.skuSelect} aria-label={`选择 SKU ${s.id}`} onClick={()=>setCurrentId(s.id)}>{String(s.id).padStart(2,"0")}</button>
        <input aria-label={`SKU ${s.id} 名称`} placeholder="输入 SKU 名称" maxLength={60} value={s.draft} onFocus={()=>setCurrentId(s.id)} onChange={e=>patch(s.id,{draft:e.target.value})}/>
        <button type="button" className={styles.skuSave} onClick={()=>{patch(s.id,{name:s.draft.trim()});setCurrentId(s.id)}}>保存</button>
       </div>
       <small className={styles.skuItemStatus}>{s.images.length?"已上传 "+s.images.length+" 张图片":"未上传图片"}</small>
      </div>)}</div>
      <button type="button" className={styles.addSku} onClick={addSku}>＋ 添加 SKU</button>
     </aside>:null}
     <div className={styles.images}><div className={styles.paneTitle}><strong>商品图片</strong><small>最多 8 张 · 点击可放大</small></div>
      <div className={styles.imageGrid}>
       <button type="button" className={styles.addImage} onClick={()=>fileRef.current?.click()} disabled={active.images.length>=8||loadingImages}><b>＋</b><span>添加图片</span></button>
       {Array.from({length:8},(_,i)=><button key={i} type="button" className={styles.imageSlot} onClick={()=>active.images[i]?setActiveImage(active.images[i]):fileRef.current?.click()} aria-label={active.images[i]?`放大商品图片 ${i+1}`:`上传商品图片 ${i+1}`}>
        {active.images[i]?<img alt={`商品图片 ${i+1}`} src={active.images[i]}/>:i===0?"主图 · 01":`图片 ${String(i+1).padStart(2,"0")}`}
       </button>)}
      </div><input ref={fileRef} className={styles.visuallyHidden} type="file" accept="image/*" multiple onChange={e=>void onFiles(e)}/>
      <p className={styles.imageHint}>支持手机拍照 · 点击图片放大 · 图片按 SKU 分别保存</p>
     </div>
     <div className={styles.details}><strong>基础资料 · {skuType==="multi"?btnText(active.id):"单 SKU"}</strong>
      <textarea aria-label="当前 SKU 基础资料" value={active.description} onChange={e=>patch(active.id,{description:e.target.value})} placeholder="填写当前 SKU 的售价、材质、编码、规格和卖点。&#10;例如：白色款，500ml，售价 ¥99。"/>
      <small>图片包含说明文字时，后续可通过 AI 识别并填写当前 SKU 的基础资料。</small>
     </div>
    </div>:source==="sheet"?<div className={styles.otherInput}><label>上传商品表格<input type="file" accept=".xlsx,.xls,.csv" onChange={e=>setSheetName(e.target.files?.[0]?.name||"")}/></label><p>{sheetName||"Excel / CSV 批量导入；需在正式业务接口完成字段映射与预览。"}</p></div>:source==="link"?<div className={styles.otherInput}><label>商品链接<input type="url" value={link} onChange={e=>setLink(e.target.value)} placeholder="仅限已接入货盘的商品链接"/></label><p>链接解析需使用授权的货盘数据接口。</p></div>:<div className={styles.otherInput}><strong>通过 API 接入商品数据</strong><p>请在正式工作台选择已经授权的 API 连接，并完成权限与字段校验。</p></div>}
   </section>
   <section className={styles.panel}><div className={styles.heading}><h3>03&nbsp; AI 能力与生成</h3><span>首次入库在本工具内完成；资料缺失在「待完善」处理，检查通过在「待审核」确认。</span></div>
    <div className={styles.aiRow}><div className={styles.aiOptions}>
     <label>智能体<select aria-label="智能体" value={agent} onChange={e=>{setAgent(e.target.value);setTemplate("")}}><option value="">{enabledAgents.length?"未选择 · 点击选择":"我的智能体暂无已启用项"}</option>{enabledAgents.map(name=><option key={name} value={name}>{name}</option>)}</select></label>
     <label>智能体模板<select aria-label="智能体模板" disabled={!agent} value={template} onChange={e=>setTemplate(e.target.value)}><option value="">{!agent?"请先选择智能体":templates.length?"请选择智能体模板":"该智能体暂无已保存模板"}</option>{templates.map(name=><option key={name} value={name}>{name}</option>)}</select></label>
    </div>
    <div className={styles.batchControls}>
      <button type="button" aria-expanded={batchMode==="create"} onClick={()=>{setBatchMode(batchMode==="create"?null:"create");setStatus("")}}>＋ 创建自有商品批次</button>
      <button type="button" aria-expanded={batchMode==="select"} onClick={()=>{setBatchMode(batchMode==="select"?null:"select");setStatus("")}}>选择自有商品批次</button>
    </div>
    <button type="button" className={styles.submit} onClick={validate}>提交检测</button>
    <button type="button" className={`${styles.intakeAction} ${styles.intakePending}`} onClick={()=>openStage("pending")}>待完善 <b>{pendingRecords.length}</b></button>
    <button type="button" className={`${styles.intakeAction} ${styles.intakeReview}`} onClick={()=>openStage("review")}>待审核 <b>{awaitingRecords.length}</b></button></div>
    {batchMode==="create"?<div className={styles.batchEditor}><label>新批次名称<input aria-label="新建自有商品批次名称" maxLength={60} placeholder="输入批次名称" value={batchName} onChange={e=>setBatchName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();saveBatch()}}}/></label><button type="button" onClick={saveBatch}>创建并选择</button><button type="button" onClick={()=>setBatchMode(null)}>取消</button></div>:null}
    {batchMode==="select"?<div className={styles.batchEditor}><label>已有自有商品批次<select aria-label="选择已有自有商品批次" value={batchId} onChange={e=>{setBatchId(e.target.value);setBatchMode(null);setStatus("")}}><option value="">请选择批次</option>{batches.map(batch=><option key={batch.id} value={batch.id}>{batch.name} · {batch.createdAt}</option>)}</select></label>{!batches.length?<span>暂无批次，请先创建自有商品批次。</span>:null}<button type="button" onClick={()=>setBatchMode(null)}>关闭</button></div>:null}
    {currentBatch?<p className={styles.batchSelected}>当前批次：<strong>{currentBatch.name}</strong><span>已保存 {currentBatch.productCount} 个商品 · 当前企业成员专属演示数据</span></p>:null}
    <p className={styles.footerHint}>首次入库缺项在「待完善」弹窗处理；通过检测后在「待审核」弹窗确认入库。第三方平台缺项才进入「刊登管理 → 待补全」。</p>
    {status?<p role="status" className={styles.feedback}>{status}</p>:null}
   </section></>:null}
  </div>
  {intakeTab?<ShowcaseOwnProductIntakeModal key={intakeTab} stage={intakeTab} onClose={()=>{setIntakeTab(null);setIntakeRefresh(v=>v+1);setBatches(readOwnProductBatches(organizationId,memberId))}}/>:null}
  {activeImage?<div className={styles.preview} role="dialog" aria-label="图片放大预览" onClick={()=>setActiveImage(null)}><button type="button" onClick={()=>setActiveImage(null)}>关闭预览</button><img alt="商品图片放大预览" src={activeImage}/></div>:null}
 </dialog>;
}
