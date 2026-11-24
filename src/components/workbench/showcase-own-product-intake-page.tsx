"use client";
import {useEffect,useMemo,useRef,useState,type ChangeEvent} from "react";
import {useRouter} from "next/navigation";
import {readOwnIntakeNavigation,type OwnIntakeStage} from "./showcase-own-product-intake-navigation";
import {readOwnProductBatches,readOwnProducts,checkOwnProductSkus,updateOwnProductAfterReview,approveOwnProductIntake,installSixProductOptimizationDemo,ownProductUpdated,type OwnProductRecord} from "./showcase-own-product-data";
import css from "./showcase-own-product-intake-page.module.css";
import {previewOwnProductOptimization} from "./showcase-own-product-optimization-preview";

export function ShowcaseOwnProductIntakePage({stage,onClose}:{stage:OwnIntakeStage;onClose?:()=>void}){
 const router=useRouter();
 const [context,setContext]=useState<ReturnType<typeof readOwnIntakeNavigation>>(null);
 const [version,setVersion]=useState(0),[query,setQuery]=useState(""),[selectedId,setSelectedId]=useState<string|null>(null);
 const [batchFilter,setBatchFilter]=useState(""),[page,setPage]=useState(1),[checked,setChecked]=useState<string[]>([]),[showSource,setShowSource]=useState(false);
 const [draft,setDraft]=useState<OwnProductRecord["skus"]>([]),[skuId,setSkuId]=useState(1),[notice,setNotice]=useState("");
 const fileRef=useRef<HTMLInputElement>(null);
 const initialSelectionContext=useRef<string|null>(null);
 const activeUploadProduct=useRef<string|null>(null);
 const uploadGeneration=useRef(0);
 const [uploading,setUploading]=useState(false);
 useEffect(()=>{activeUploadProduct.current=selectedId},[selectedId]);
 const [imageIndex,setImageIndex]=useState(0),[previewSrc,setPreviewSrc]=useState<string|null>(null);
 useEffect(()=>{setContext(readOwnIntakeNavigation(stage));setSelectedId(null);setNotice("")},[stage]);
 useEffect(()=>{if(!context)return;const refresh=(e:Event)=>{const d=(e as CustomEvent<{organizationId:string;memberId:string}>).detail;if(d?.organizationId===context.organizationId&&d.memberId===context.memberId)setVersion(v=>v+1)};window.addEventListener(ownProductUpdated,refresh);return()=>window.removeEventListener(ownProductUpdated,refresh)},[context]);
 useEffect(()=>{
  if(!context)return;
  try{
   const result=installSixProductOptimizationDemo(context.organizationId,context.memberId);
   const target=readOwnProductBatches(context.organizationId,context.memberId).find(b=>b.name==="自有商品测试批次");
   if(target)setBatchFilter(target.id);
   if(!result.alreadyInstalled){
    setSelectedId(null);setPage(1);setChecked([]);setNotice("已重建自有商品测试批次：6 款模拟商品经测试模板规则处理，4 款待审核、2 款待完善。原始资料与优化稿分别保留。");
    setVersion(v=>v+1);
   }
  }catch(e){setNotice(e instanceof Error?e.message:"测试批次初始化失败");}
 },[context]);
 const records=useMemo(()=>context?readOwnProducts(context.organizationId,context.memberId):[],[context,version]);
 const batches=useMemo(()=>context?readOwnProductBatches(context.organizationId,context.memberId):[],[context,version]);
 const list=records.filter(p=>p.status===(stage==="pending"?"入库待完善":"待审核")&&(!batchFilter||p.batchId===batchFilter)&&(p.name+" "+p.id+" "+p.skus.map(s=>(s.name+" "+(s.skuCode??""))).join(" ")+" "+(batches.find(b=>b.id===p.batchId)?.name??"")).toLowerCase().includes(query.trim().toLowerCase()));
 const totalPages=Math.max(1,Math.ceil(list.length/15));
 const currentPage=Math.min(page,totalPages);
 const pagedList=list.slice((currentPage-1)*15,currentPage*15);
 const selected=records.find(p=>p.id===selectedId&&p.status===(stage==="pending"?"入库待完善":"待审核")&&pagedList.some(visible=>visible.id===p.id));
 const currentSku=draft.find(s=>s.id===skuId)??draft[0];
 const missing=checkOwnProductSkus(draft);
 const optimization=context&&selected?previewOwnProductOptimization(context.organizationId,context.memberId,selected,draft):null;
 const optimizedSku=optimization?.proposed.find(p=>p.skuId===currentSku?.id);
 const skuMissing=currentSku?checkOwnProductSkus([currentSku]):[];
 const gallery=currentSku?.images??[];
 const activeImage=gallery.length?gallery[Math.min(imageIndex,gallery.length-1)]:null;
 const select=(item:OwnProductRecord)=>{uploadGeneration.current++;setUploading(false);activeUploadProduct.current=item.id;setChecked([]);setShowSource(false);setImageIndex(0);setPreviewSrc(null);setSelectedId(item.id);setDraft(item.skus.map(s=>({...s,images:[...s.images]})));setSkuId(item.skus[0]?.id??1);setNotice("")};
 useEffect(()=>{
  if(!context)return;
  const contextKey=context.organizationId+":"+context.memberId+":"+stage+":"+(context.itemId??"");
  if(initialSelectionContext.current===contextKey)return;
  if(!context.itemId){initialSelectionContext.current=contextKey;return;}
  const item=records.find(p=>p.id===context.itemId&&p.status===(stage==="pending"?"入库待完善":"待审核"));
  if(item){const itemIndex=list.findIndex(p=>p.id===item.id);if(itemIndex<0)return;initialSelectionContext.current=contextKey;setPage(Math.floor(itemIndex/15)+1);uploadGeneration.current++;setUploading(false);activeUploadProduct.current=item.id;setChecked([]);setImageIndex(0);setSelectedId(item.id);setDraft(item.skus.map(s=>({...s,images:[...s.images]})));setSkuId(item.skus[0]?.id??1)}
 },[context,records,stage]);
  const updateSku=(fields:Partial<OwnProductRecord["skus"][number]>)=>setDraft(old=>old.map(s=>s.id===skuId?{...s,...fields}:s));
 const upload=async(e:ChangeEvent<HTMLInputElement>)=>{
  if(!currentSku||!selected)return;
  if(uploading)return;
  const targetProductId=selected.id,targetSkuId=currentSku.id;
  const currentGeneration=++uploadGeneration.current;
  const files=Array.from(e.target.files??[]).slice(0,Math.max(0,8-currentSku.images.length));
  e.target.value="";
  if(!files.length)return;
  setUploading(true);
  try{
   const images=await Promise.all(files.map(file=>new Promise<string>((resolve,reject)=>{
    if(!file.type.startsWith("image/"))return reject(new Error("只能上传图片"));
    const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error("图片读取失败"));reader.readAsDataURL(file);
   })));
   // Files are read asynchronously. Never assign images to a different product/SKU
   // if the user navigates while FileReader is still processing.
   if(activeUploadProduct.current!==targetProductId||uploadGeneration.current!==currentGeneration)return;
   setDraft(old=>old.map(s=>s.id===targetSkuId?{...s,images:[...s.images,...images].slice(0,8)}:s));
  }catch(e){if(activeUploadProduct.current===targetProductId&&uploadGeneration.current===currentGeneration)setNotice(e instanceof Error?e.message:"上传失败")}
  finally{if(uploadGeneration.current===currentGeneration)setUploading(false)}
 };
 const save=()=>{
  if(!selected||!context)return;
  if(uploading){setNotice("商品图片仍在读取中，请完成图片读取后再保存并检测。");return;}
  try{
   const updated=updateOwnProductAfterReview(context.organizationId,context.memberId,selected.id,draft);
   setVersion(v=>v+1);setDraft(updated.skus);
   if(updated.status==="待审核"){activeUploadProduct.current=null;setSelectedId(null);setNotice("首次入库检查通过，商品已转入「待审核」。请在待审核页面确认入库。")}
   else setNotice("还缺少 "+updated.missing.length+" 项资料，请在当前页面继续补全。");
  }catch(e){setNotice(e instanceof Error?e.message:"保存失败")}
 };
 const approve=(item:OwnProductRecord)=>{
  if(!context)return;
  if(item.skus.some(s=>!checked.includes(String(s.id)))){setNotice("请先逐一核对并确认所有 SKU，再确认入库。");return;}
  try{
   approveOwnProductIntake(context.organizationId,context.memberId,item.id);
   setVersion(v=>v+1);activeUploadProduct.current=null;setSelectedId(null);setChecked([]);
   setNotice("已确认入库，可前往「我的数据 → 自有商品库」查看。");
  }catch(e){setNotice(e instanceof Error?e.message:"确认失败")}
 };
 const heading=stage==="pending"?"自有商品待完善":"自有商品待审核";
 return <main className={css.page}>
  <header className={css.header}>
   <div><small>我的工具 / 自有商品刊登 / {heading}</small><h1>{heading}</h1><p>{stage==="pending"?"商品已按所选智能体模板生成模拟优化结果；这里只补充仍缺少的可信资料。":"逐项核对已整理的优化内容，确认后进入「我的数据 → 自有商品库」。"}</p></div>
   <button type="button" onClick={()=>onClose?onClose():router.push("/workbench/tools/mine?preview=1")}>{onClose?"关闭":"返回我的工具"}</button>
  </header>
  {!context?<section className={css.empty}>未找到当前入库会话，请从自有商品刊登工具的「待完善」或「待审核」进入。</section>:<>
   <section className={css.toolbar}>
    <label>搜索商品<input aria-label="搜索商品或批次" value={query} placeholder="商品名称 / SKU / 批次" onChange={e=>{setQuery(e.target.value);setPage(1);uploadGeneration.current++;setUploading(false);activeUploadProduct.current=null;setSelectedId(null);setChecked([]);setShowSource(false)}}/></label>
    <label>选择批次<select aria-label="筛选自有商品批次" value={batchFilter} onChange={e=>{setBatchFilter(e.target.value);setPage(1);uploadGeneration.current++;setUploading(false);activeUploadProduct.current=null;setSelectedId(null);setChecked([]);setShowSource(false)}}><option value="">全部批次</option>{batches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>
    <strong>共 {list.length} 件 · 每页最多 15 件</strong>
   </section>
   {notice?<p role="status" className={css.notice}>{notice}</p>:null}
   <div className={css.layout}>
    <section className={css.list} aria-label={heading+"商品列表"}>
     <div className={css.listHead}><h2>{stage==="pending"?"待完善商品":"待审核商品"}</h2><span>{list.length} 件</span></div>
     {pagedList.map(item=>{const cover=item.skus.flatMap(s=>s.images)[0];return <article key={item.id} className={css.row} data-selected={selectedId===item.id}>
      <button type="button" className={css.thumb} disabled={!cover} aria-label={"放大 "+item.name+" 图片"} onClick={()=>cover&&setPreviewSrc(cover)}>{cover?<img src={cover} alt={item.name+" 缩略图"}/>:<span>暂无图片</span>}</button>
      <button type="button" className={css.productPick} onClick={()=>select(item)} aria-pressed={selectedId===item.id}><strong>{item.name}</strong><small>{batches.find(b=>b.id===item.batchId)?.name??"原批次"} · {item.skus.length} SKU</small><small className={stage==="pending"?css.warning:css.ready}>{stage==="pending"?"需完善 "+item.missing.length+" 项":"待人工确认"}</small></button>
     </article>})}
     {!pagedList.length?<p className={css.empty}>当前筛选下没有{stage==="pending"?"待完善":"待审核"}商品。</p>:null}
     <footer className={css.listPagination}><span>第 {currentPage} / {totalPages} 页</span><div><button type="button" disabled={currentPage===1} onClick={()=>{setPage(p=>Math.max(1,p-1));uploadGeneration.current++;setUploading(false);activeUploadProduct.current=null;setSelectedId(null);setChecked([]);setShowSource(false)}}>上一页</button><button type="button" disabled={currentPage===totalPages} onClick={()=>{setPage(p=>Math.min(totalPages,p+1));uploadGeneration.current++;setUploading(false);activeUploadProduct.current=null;setSelectedId(null);setChecked([]);setShowSource(false)}}>下一页</button></div></footer>
    </section>
    <section className={css.editor} aria-label="商品优化详情">
     {!selected?<div className={css.empty}>选择左侧商品，查看智能体优化稿、图片和逐项处理结果。</div>:<>
      <header className={css.detailHeader}><div><h2>{selected.name}</h2><p className={css.productMeta}>{batches.find(b=>b.id===selected.batchId)?.name??"原始批次"} · 上传资料 · {selected.createdAt}</p></div><span className={stage==="pending"?css.warning:css.ready}>{stage==="pending"?"待补齐":"待确认"}</span></header>
      <div className={css.overviewStrip}><span>智能体：<strong>{selected.agent||"未启用"}</strong></span><span>模板：<strong>{selected.template||"未选择"}</strong></span><span>SKU：<strong>{draft.length}</strong></span><span className={missing.length?css.warning:css.ready}>{missing.length?"仍缺 "+missing.length+" 项":"必填项齐全"}</span></div>
      <div className={css.skus} aria-label="选择商品 SKU">{draft.map(s=><button type="button" key={s.id} data-selected={skuId===s.id} onClick={()=>{setSkuId(s.id);setImageIndex(0)}}>{s.name||"SKU "+s.id} · {checkOwnProductSkus([s]).length?"缺 "+checkOwnProductSkus([s]).length+" 项":"已完整"}</button>)}</div>
      {currentSku?<div className={css.details}>
       <section className={css.gallerySection} aria-label="商品图片轮播"><div className={css.sectionHeading}><strong>商品图片</strong><span>{gallery.length}/8 张</span></div>
        <div className={css.galleryMain}>{activeImage?<button type="button" className={css.mainImageButton} onClick={()=>setPreviewSrc(activeImage)} aria-label="点击放大图片"><img src={activeImage} alt={currentSku.name+" 第 "+(imageIndex+1)+" 张"}/></button>:<div className={css.imageEmpty}>暂无可靠商品图片，请补充原图。</div>}</div>
        {gallery.length>1?<div className={css.galleryControls}><button type="button" onClick={()=>setImageIndex(i=>(i+gallery.length-1)%gallery.length)}>上一张</button><span>{Math.min(imageIndex+1,gallery.length)} / {gallery.length}</span><button type="button" onClick={()=>setImageIndex(i=>(i+1)%gallery.length)}>下一张</button></div>:null}
        <div className={css.galleryThumbnails}>{gallery.map((src,i)=><button type="button" key={i} data-selected={i===imageIndex} onClick={()=>setImageIndex(i)} aria-label={"查看第 "+(i+1)+" 张图片"}><img src={src} alt={"缩略图 "+(i+1)}/></button>)}</div>
        {stage==="pending"?<><button type="button" className={css.uploadButton} disabled={gallery.length>=8||uploading} onClick={()=>fileRef.current?.click()}>{uploading?"图片读取中…":"补充图片"}</button><input type="file" ref={fileRef} accept="image/*" multiple hidden onChange={e=>void upload(e)}/></>:null}
        <small className={css.finePrint}>仅展示上传的原图。没有真实生成结果时，不把原图标记为 AI 新图。</small>
       </section>
       <section className={css.information} aria-label="优化后商品资料"><div className={css.sectionHeading}><strong>优化后商品资料</strong><span>逐项查看 · {stage==="pending"?"可完善":"只读审核"}</span></div>
        {[
         {title:"商品标题",field:"title",ok:!!currentSku.name.trim()},
         {title:"商品描述",field:"description",ok:!!currentSku.description.trim()},
         {title:"商品图片",field:"images",ok:gallery.length>0},
         {title:"SKU 编码",field:"code",ok:!!currentSku.skuCode},
         {title:"商品价格",field:"price",ok:!!currentSku.price},
         {title:"库存数量",field:"stock",ok:currentSku.stock!==undefined}
        ].map((entry,i)=><div className={css.reviewField} key={entry.field}>
         <div className={css.fieldHeading}><strong>{String(i+1).padStart(2,"0")} · {entry.title}</strong><span className={!entry.ok&&(i<3)?css.warning:entry.ok?css.ready:css.neutral}>{!entry.ok&&(i<3)?"必须完善":entry.ok?"已有资料":"选填"}</span></div>
         {entry.field==="title"?<input aria-label="SKU 名称" disabled={stage==="review"} value={currentSku.name} onChange={e=>updateSku({name:e.target.value})} placeholder="请填写可靠的商品标题"/>:
         entry.field==="description"?<textarea aria-label="基础资料" rows={4} disabled={stage==="review"} value={currentSku.description} onChange={e=>updateSku({description:e.target.value})} placeholder="请补充有依据的材质、规格、用途及卖点"/>:
         entry.field==="images"?<p>{gallery.length?gallery.length+" 张图片已保留，左侧可放大核对。":"缺少商品图片，请从左侧上传。"}</p>:
         entry.field==="code"?<input aria-label="SKU 编码" disabled={stage==="review"} value={currentSku.skuCode??""} onChange={e=>updateSku({skuCode:e.target.value})} placeholder="选填"/>:
         entry.field==="price"?<input aria-label="商品价格" disabled={stage==="review"} value={currentSku.price??""} onChange={e=>updateSku({price:e.target.value})} placeholder="选填"/>:
         <input type="number" min={0} aria-label="库存数量" disabled={stage==="review"} value={currentSku.stock??""} onChange={e=>updateSku({stock:e.target.value===""?undefined:Math.max(0,Number(e.target.value))})} placeholder="选填"/>}
        </div>)}
       </section>
      </div>:null}
      {optimization?<section className={css.agentReport} aria-label="智能体优化检查记录">
       <div className={css.sectionHeading}><strong>智能体优化与模板核对</strong><span>规则化模拟 · 非真实 AI 调用</span></div>
       <p className={css.reportIntro}>已引用「{optimization.template}」模板；此处展示模拟整理结果和可核对的配置，不伪造实际模型执行记录。</p>
       <div className={css.agentSteps}>{optimization.steps.map((step,i)=><div className={css.agentStep} key={i}><strong>{step.name}</strong><span className={step.status==="needs-input"?css.warning:step.status==="not-enabled"?css.neutral:css.ready}>{step.status==="needs-input"?"需要处理":step.status==="not-enabled"?"未启用":"模拟检查"}</span><p>{step.result}</p></div>)}</div>
       {optimization.pictureSettings.length?<div className={css.agentStep} aria-label="测试模板图片设置完整核对"><strong>图片设置 · 按当前账号保存的测试模板</strong>{optimization.pictureSettings.map(item=><p key={item.label}><strong>{item.label}：</strong>{item.value}</p>)}<small>只展示已保存的配置；未指定的参数不会自动假定为英语、白底或 8 张图片。</small></div>:null}
       {optimizedSku?<div className={css.agentOutcome}><strong>优化稿摘要</strong><span>{optimizedSku.title||"标题缺失"} · {optimizedSku.copy||"描述缺失，不能凭空补写"}</span></div>:null}
      </section>:<section className={css.agentReport}><strong>模板来源</strong><p className={css.reportIntro}>当前商品没有可读取的已保存模板；仅保留原始上传资料和必填项检查。</p></section>}
      <section className={css.missingList} aria-label={stage==="pending"?"待完善清单":"审核清单"}>
       <div className={css.sectionHeading}><strong>{stage==="pending"?"待完善清单":"人工审核清单"}</strong><span>{stage==="pending"?missing.length+" 项未完成":checked.length+" / "+draft.length+" 个 SKU 已确认"}</span></div>
       {stage==="pending"?<>{missing.length?<ul>{missing.map((item,i)=><li key={i}><span className={css.warning}>待完善</span>{item}</li>)}</ul>:<p className={css.ready}>必填项已补齐，可保存并重新检测。</p>}</>:
       <div className={css.reviewChecks}>{draft.map(s=><label key={s.id}><input type="checkbox" checked={checked.includes(String(s.id))} onChange={e=>setChecked(old=>e.target.checked?[...old,String(s.id)]:old.filter(v=>v!==String(s.id)))}/><span>已核对 {s.name||"SKU "+s.id} 的标题、描述、图片和必要资料</span></label>)}</div>}
      </section>
      <div className={css.sourceDisclosure}><button type="button" aria-expanded={showSource} onClick={()=>setShowSource(v=>!v)}>{showSource?"收起原始资料":"查看原始上传资料"}</button>{showSource?<div className={css.originalData}>{(selected.originalSkus??selected.skus).map(s=><article key={s.id}><strong>{s.name||"SKU "+s.id}</strong><p>{s.description||"原始描述缺失"}</p><small>原始图片 {s.images.length} 张 · SKU {s.skuCode||"未提供"}</small></article>)}</div>:null}</div>
      <footer className={css.actionFooter}><span>{stage==="pending"?"补全后统一检测，全部满足条件才进入待审核。":"确认后仅进入自有商品库，不代表已刊登到第三方平台。"}</span>{stage==="pending"?<button type="button" className={css.primary} disabled={uploading} onClick={save}>{uploading?"读取图片中…":"保存并重新检测"}</button>:<button type="button" className={css.primary} disabled={checked.length!==draft.length} onClick={()=>approve(selected)}>确认入库</button>}</footer>
     </>}
    </section>
   </div>
  </>}
  {previewSrc?<div className={css.lightbox} role="dialog" aria-label="商品图片放大预览" aria-modal="true" onClick={()=>setPreviewSrc(null)}><button type="button" onClick={()=>setPreviewSrc(null)}>关闭</button><img src={previewSrc} alt="商品图片放大" onClick={e=>e.stopPropagation()}/></div>:null}
 </main>;
}
