"use client";
import {useEffect,useMemo,useRef,useState,type ChangeEvent} from "react";
import {useRouter} from "next/navigation";
import {readOwnIntakeNavigation,type OwnIntakeStage} from "./showcase-own-product-intake-navigation";
import {readOwnProductBatches,readOwnProducts,checkOwnProductSkus,updateOwnProductAfterReview,approveOwnProductIntake,ownProductUpdated,type OwnProductRecord} from "./showcase-own-product-data";
import css from "./showcase-own-product-intake-page.module.css";

export function ShowcaseOwnProductIntakePage({stage,onClose}:{stage:OwnIntakeStage;onClose?:()=>void}){
 const router=useRouter();
 const [context,setContext]=useState<ReturnType<typeof readOwnIntakeNavigation>>(null);
 const [version,setVersion]=useState(0),[query,setQuery]=useState(""),[selectedId,setSelectedId]=useState<string|null>(null);
 const [draft,setDraft]=useState<OwnProductRecord["skus"]>([]),[skuId,setSkuId]=useState(1),[notice,setNotice]=useState("");
 const fileRef=useRef<HTMLInputElement>(null);
 const [imageIndex,setImageIndex]=useState(0),[previewSrc,setPreviewSrc]=useState<string|null>(null);
 useEffect(()=>{setContext(readOwnIntakeNavigation(stage));setSelectedId(null);setNotice("")},[stage]);
 useEffect(()=>{if(!context)return;const refresh=(e:Event)=>{const d=(e as CustomEvent<{organizationId:string;memberId:string}>).detail;if(d?.organizationId===context.organizationId&&d.memberId===context.memberId)setVersion(v=>v+1)};window.addEventListener(ownProductUpdated,refresh);return()=>window.removeEventListener(ownProductUpdated,refresh)},[context]);
 const records=useMemo(()=>context?readOwnProducts(context.organizationId,context.memberId):[],[context,version]);
 const batches=useMemo(()=>context?readOwnProductBatches(context.organizationId,context.memberId):[],[context,version]);
 const list=records.filter(p=>p.status===(stage==="pending"?"入库待完善":"待审核")&&(p.name+" "+p.id+" "+(batches.find(b=>b.id===p.batchId)?.name??"")).toLowerCase().includes(query.toLowerCase()));
 const selected=records.find(p=>p.id===selectedId);
 const currentSku=draft.find(s=>s.id===skuId)??draft[0];
 const missing=checkOwnProductSkus(draft);
 const skuMissing=currentSku?checkOwnProductSkus([currentSku]):[];
 const gallery=currentSku?.images??[];
 const activeImage=gallery.length?gallery[Math.min(imageIndex,gallery.length-1)]:null;
 const select=(item:OwnProductRecord)=>{setImageIndex(0);setPreviewSrc(null);setSelectedId(item.id);setDraft(item.skus.map(s=>({...s,images:[...s.images]})));setSkuId(item.skus[0]?.id??1);setNotice("")};
 useEffect(()=>{
  if(!context?.itemId||selectedId)return;
  const item=records.find(p=>p.id===context.itemId&&p.status===(stage==="pending"?"入库待完善":"待审核"));
  if(item){setSelectedId(item.id);setDraft(item.skus.map(s=>({...s,images:[...s.images]})));setSkuId(item.skus[0]?.id??1)}
 },[context,records,selectedId,stage]);
  const updateSku=(fields:Partial<OwnProductRecord["skus"][number]>)=>setDraft(old=>old.map(s=>s.id===skuId?{...s,...fields}:s));
 const upload=async(e:ChangeEvent<HTMLInputElement>)=>{
  if(!currentSku)return;
  const files=Array.from(e.target.files??[]).slice(0,Math.max(0,8-currentSku.images.length));
  e.target.value="";
  if(!files.length)return;
  try{
   const images=await Promise.all(files.map(file=>new Promise<string>((resolve,reject)=>{
    if(!file.type.startsWith("image/"))return reject(new Error("只能上传图片"));
    const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error("图片读取失败"));reader.readAsDataURL(file);
   })));
   updateSku({images:[...currentSku.images,...images].slice(0,8)});
  }catch(e){setNotice(e instanceof Error?e.message:"上传失败")}
 };
 const save=()=>{
  if(!selected||!context)return;
  try{
   const updated=updateOwnProductAfterReview(context.organizationId,context.memberId,selected.id,draft);
   setVersion(v=>v+1);setDraft(updated.skus);
   if(updated.status==="待审核"){setSelectedId(null);setNotice("首次入库检查通过，商品已转入「待审核」。请在待审核页面确认入库。")}
   else setNotice("还缺少 "+updated.missing.length+" 项资料，请在当前页面继续补全。");
  }catch(e){setNotice(e instanceof Error?e.message:"保存失败")}
 };
 const approve=(item:OwnProductRecord)=>{
  if(!context)return;
  try{
   approveOwnProductIntake(context.organizationId,context.memberId,item.id);
   setVersion(v=>v+1);setSelectedId(null);
   setNotice("已确认入库，可前往「我的数据 → 自有商品库」查看。");
  }catch(e){setNotice(e instanceof Error?e.message:"确认失败")}
 };
 const heading=stage==="pending"?"自有商品待完善":"自有商品待审核";
 return <main className={css.page}>
  <header className={css.header}><div><small>我的工具 / 自有商品一键刊登 / {heading}</small><h1>{heading}</h1><p>{stage==="pending"?"首次适配发现资料缺失，在此补齐并重新检查；不会进入第三方平台的「刊登管理 → 待补全」。":"资料已通过硕米首次入库检查，逐项确认后写入「我的数据 → 自有商品库」。"}</p></div><button type="button" onClick={()=>onClose?onClose():router.push("/workbench/tools/mine?preview=1")}>{onClose?"关闭":"返回我的工具"}</button></header>
  {!context?<section className={css.empty}>当前没有可读取的商品入库会话。请从「我的工具 → 自有商品一键刊登」中的「待完善」或「待审核」入口进入。</section>:<>
   <section className={css.toolbar}><label>搜索商品或批次<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="商品名称 / 批次" aria-label="搜索商品或批次"/></label><strong>共 {list.length} 件</strong></section>
   {notice?<p className={css.notice} role="status">{notice}</p>:null}
   <div className={css.layout}><section className={css.list}><h2>{stage==="pending"?"待完善商品":"待审核商品"}</h2>
    {list.map(item=>{const cover=item.skus.flatMap(s=>s.images)[0];return <article className={css.row} key={item.id} data-selected={selectedId===item.id}>
     <button type="button" className={css.thumb} aria-label={"放大 "+item.name+" 商品图片"} disabled={!cover} onClick={()=>cover&&setPreviewSrc(cover)}>{cover?<img src={cover} alt={item.name+" 缩略图"}/>:<span>暂无图片</span>}</button>
     <div className={css.rowInfo}><strong>{item.name}</strong><small>{batches.find(b=>b.id===item.batchId)?.name??"原始批次"} · {item.skus.length} 个 SKU</small><small className={stage==="pending"?css.warning:""}>{stage==="pending"?"待完善 "+item.missing.length+" 项":"资料齐全 · 待确认"}</small></div>
     <button type="button" className={css.rowAction} onClick={()=>select(item)}>{stage==="pending"?"继续完善":"查看资料"}</button>
    </article>})}
    {!list.length?<p className={css.empty}>暂无{heading.replace("自有商品","")}商品</p>:null}
   </section>
   <section className={css.editor}>
    {!selected?<div className={css.empty}>从左侧选择一件商品，{stage==="pending"?"继续补全缺失资料。":"核对完整资料后确认入库。"}</div>:<>
     <header><div><h2>{selected.name}</h2><p className={css.productMeta}>{batches.find(b=>b.id===selected.batchId)?.name??"原始批次"} · {selected.source} · {selected.createdAt}</p></div><span>{stage==="pending"?"首次入库补全":"首次入库审核"}</span></header>
     <section className={css.summary} aria-label="商品资料检查总览"><strong>资料检查</strong><span>{draft.length} 个 SKU</span><span className={missing.length?css.warning:css.ready}>{missing.length?("需要完善 "+missing.length+" 项"):"必填资料齐全"}</span></section>
     <div className={css.skus} aria-label="切换 SKU">{draft.map(s=><button type="button" key={s.id} data-selected={skuId===s.id} onClick={()=>{setSkuId(s.id);setImageIndex(0)}}>{s.name||"SKU "+s.id}{checkOwnProductSkus([s]).length?" · 待补全 "+checkOwnProductSkus([s]).length:" · 已完整"}</button>)}</div>
     {currentSku?<div className={css.details}>
      <section className={css.gallerySection} aria-label="商品图片轮播"><div className={css.sectionHeading}><strong>商品图片</strong><span>{gallery.length}/8 张 · {gallery.length?"点击放大查看":"缺少商品图片"}</span></div>
       <div className={css.galleryMain}>{activeImage?<button type="button" className={css.mainImageButton} onClick={()=>setPreviewSrc(activeImage)} aria-label="放大当前商品图片"><img src={activeImage} alt={currentSku.name+" 图片 "+(Math.min(imageIndex,gallery.length-1)+1)}/></button>:<div className={css.imageEmpty}>暂无商品图片，请补充至少一张真实商品图片</div>}</div>
       {gallery.length>1?<div className={css.galleryControls}><button type="button" onClick={()=>setImageIndex(i=>(i-1+gallery.length)%gallery.length)}>上一张</button><span>{Math.min(imageIndex,gallery.length-1)+1} / {gallery.length}</span><button type="button" onClick={()=>setImageIndex(i=>(i+1)%gallery.length)}>下一张</button></div>:null}
       <div className={css.galleryThumbnails}>{gallery.map((src,i)=><button key={i} type="button" data-selected={Math.min(imageIndex,gallery.length-1)===i} aria-label={"查看商品图片 "+(i+1)} onClick={()=>setImageIndex(i)}><img src={src} alt={"商品图片缩略图 "+(i+1)}/></button>)}</div>
       {stage==="pending"?<><button type="button" className={css.uploadButton} disabled={gallery.length>=8} onClick={()=>fileRef.current?.click()}>＋ {gallery.length?"补充商品图片":"上传商品图片"}</button><input ref={fileRef} type="file" multiple accept="image/*" hidden onChange={e=>void upload(e)}/></>:null}
      </section>
      <section className={css.information} aria-label="逐项商品资料"><div className={css.sectionHeading}><strong>商品资料逐项核对</strong><span>标记缺失项并在当前页面直接完善</span></div>
       <div className={css.fieldItem}><div className={css.fieldHeading}><strong>01 · SKU 名称</strong><span className={!currentSku.name.trim()?css.warning:css.ready}>{!currentSku.name.trim()?"需要完善":"已完整"}</span></div><input aria-label="SKU 名称" value={currentSku.name} disabled={stage==="review"} onChange={e=>updateSku({name:e.target.value})} placeholder="请输入商品 SKU 名称"/>{!currentSku.name.trim()?<small className={css.fieldHint}>缺少 SKU 名称，请填写准确的商品名称。</small>:null}</div>
       <div className={css.fieldItem}><div className={css.fieldHeading}><strong>02 · 基础资料</strong><span className={!currentSku.description.trim()?css.warning:css.ready}>{!currentSku.description.trim()?"需要完善":"已完整"}</span></div><textarea aria-label="基础资料" rows={5} value={currentSku.description} disabled={stage==="review"} onChange={e=>updateSku({description:e.target.value})} placeholder="填写商品材质、规格、用途及主要卖点"/>{!currentSku.description.trim()?<small className={css.fieldHint}>基础资料为空，请补充后重新检测。</small>:null}</div>
       <div className={css.fieldItem}><div className={css.fieldHeading}><strong>03 · 商品图片</strong><span className={!gallery.length?css.warning:css.ready}>{!gallery.length?"需要完善":"已完整"}</span></div><p>{gallery.length?("当前已上传 "+gallery.length+" 张，可在左侧轮播查看。"):"当前没有图片，请在左侧上传商品主图。"}</p></div>
       <div className={css.fieldItem}><div className={css.fieldHeading}><strong>04 · SKU 编码</strong><span>参考信息</span></div><input aria-label="SKU 编码" disabled={stage==="review"} value={currentSku.skuCode??""} onChange={e=>updateSku({skuCode:e.target.value})} placeholder="选填 SKU 编码"/></div>
       <div className={css.fieldColumns}><div className={css.fieldItem}><div className={css.fieldHeading}><strong>05 · 价格</strong><span>参考信息</span></div><input aria-label="商品价格" disabled={stage==="review"} value={currentSku.price??""} onChange={e=>updateSku({price:e.target.value})} placeholder="选填价格"/></div><div className={css.fieldItem}><div className={css.fieldHeading}><strong>06 · 库存</strong><span>参考信息</span></div><input aria-label="库存数量" type="number" min={0} disabled={stage==="review"} value={currentSku.stock??""} onChange={e=>updateSku({stock:e.target.value===""?undefined:Math.max(0,Number(e.target.value))})} placeholder="选填库存"/></div></div>
      </section>
     </div>:null}
     <section className={css.missingList} aria-label="待完善项目清单"><div className={css.sectionHeading}><strong>待完善项目清单</strong><span>{skuMissing.length} 项</span></div>{skuMissing.length?<ul>{skuMissing.map((name,i)=><li key={i}><span className={css.warning}>待完善</span>{name}</li>)}</ul>:<p className={css.ready}>当前 SKU 的必填资料均已齐全。</p>}{missing.length!==skuMissing.length?<small>当前商品其他 SKU 还有 {missing.length-skuMissing.length} 项待完善，可在上方切换 SKU 查看。</small>:null}</section>
     <footer>{stage==="pending"?<><small>{missing.length?missing.join("、"):"资料已齐，可以重新检查"}</small><button className={css.primary} type="button" onClick={save}>保存并重新检测</button></>:<><span>当前版本只读，确认前请检查图片、名称和基础资料。</span><button className={css.primary} type="button" onClick={()=>approve(selected)}>确认入库</button></>}</footer>
    </>}
   </section></div>
  </>}
  {previewSrc?<div className={css.lightbox} role="dialog" aria-modal="true" aria-label="商品图片放大预览" onClick={()=>setPreviewSrc(null)}><button type="button" onClick={()=>setPreviewSrc(null)}>关闭</button><img src={previewSrc} alt="商品图片放大" onClick={e=>e.stopPropagation()}/></div>:null}
 </main>;
}
