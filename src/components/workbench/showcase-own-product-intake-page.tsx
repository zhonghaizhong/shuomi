"use client";
import {useEffect,useMemo,useRef,useState,type ChangeEvent} from "react";
import {useRouter} from "next/navigation";
import {readOwnIntakeNavigation,type OwnIntakeStage} from "./showcase-own-product-intake-navigation";
import {readOwnProductBatches,readOwnProducts,checkOwnProductSkus,updateOwnProductAfterReview,approveOwnProductIntake,ownProductUpdated,type OwnProductRecord} from "./showcase-own-product-data";
import css from "./showcase-own-product-intake-page.module.css";

export function ShowcaseOwnProductIntakePage({stage}:{stage:OwnIntakeStage}){
 const router=useRouter();
 const [context,setContext]=useState<ReturnType<typeof readOwnIntakeNavigation>>(null);
 const [version,setVersion]=useState(0),[query,setQuery]=useState(""),[selectedId,setSelectedId]=useState<string|null>(null);
 const [draft,setDraft]=useState<OwnProductRecord["skus"]>([]),[skuId,setSkuId]=useState(1),[notice,setNotice]=useState("");
 const fileRef=useRef<HTMLInputElement>(null);
 useEffect(()=>{setContext(readOwnIntakeNavigation(stage));setSelectedId(null);setNotice("")},[stage]);
 useEffect(()=>{if(!context)return;const refresh=(e:Event)=>{const d=(e as CustomEvent<{organizationId:string;memberId:string}>).detail;if(d?.organizationId===context.organizationId&&d.memberId===context.memberId)setVersion(v=>v+1)};window.addEventListener(ownProductUpdated,refresh);return()=>window.removeEventListener(ownProductUpdated,refresh)},[context]);
 const records=useMemo(()=>context?readOwnProducts(context.organizationId,context.memberId):[],[context,version]);
 const batches=useMemo(()=>context?readOwnProductBatches(context.organizationId,context.memberId):[],[context,version]);
 const list=records.filter(p=>p.status===(stage==="pending"?"入库待完善":"待审核")&&(p.name+" "+p.id+" "+(batches.find(b=>b.id===p.batchId)?.name??"")).toLowerCase().includes(query.toLowerCase()));
 const selected=records.find(p=>p.id===selectedId);
 const currentSku=draft.find(s=>s.id===skuId)??draft[0];
 const missing=checkOwnProductSkus(draft);
 const select=(item:OwnProductRecord)=>{setSelectedId(item.id);setDraft(item.skus.map(s=>({...s,images:[...s.images]})));setSkuId(item.skus[0]?.id??1);setNotice("")};
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
  <header className={css.header}><div><small>我的工具 / 自有商品一键刊登 / {heading}</small><h1>{heading}</h1><p>{stage==="pending"?"首次适配发现资料缺失，在此补齐并重新检查；不会进入第三方平台的「刊登管理 → 待补全」。":"资料已通过硕米首次入库检查，逐项确认后写入「我的数据 → 自有商品库」。"}</p></div><button type="button" onClick={()=>router.push("/workbench/tools/mine?preview=1")}>返回我的工具</button></header>
  {!context?<section className={css.empty}>当前没有可读取的商品入库会话。请从「我的工具 → 自有商品一键刊登」中的「待完善」或「待审核」入口进入。</section>:<>
   <section className={css.toolbar}><label>搜索商品或批次<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="商品名称 / 批次" aria-label="搜索商品或批次"/></label><strong>共 {list.length} 件</strong></section>
   {notice?<p className={css.notice} role="status">{notice}</p>:null}
   <div className={css.layout}><section className={css.list}><h2>{stage==="pending"?"待完善商品":"待审核商品"}</h2>
    {list.map(item=><article className={css.row} key={item.id} data-selected={selectedId===item.id}><div><strong>{item.name}</strong><small>{batches.find(b=>b.id===item.batchId)?.name??"原始批次"} · {item.skus.length} 个 SKU</small><small>{stage==="pending"?"缺失 "+item.missing.length+" 项":"检查通过，等待入库确认"}</small></div><button type="button" onClick={()=>select(item)}>{stage==="pending"?"继续完善":"查看资料"}</button>{stage==="review"?<button type="button" className={css.primary} onClick={()=>approve(item)}>确认入库</button>:null}</article>)}
    {!list.length?<p className={css.empty}>暂无{heading.replace("自有商品","")}商品</p>:null}
   </section>
   <section className={css.editor}>
    {!selected?<div className={css.empty}>从左侧选择一件商品，{stage==="pending"?"继续补全缺失资料。":"核对完整资料后确认入库。"}</div>:<>
     <header><h2>{selected.name}</h2><span>{stage==="pending"?"首次入库补全":"首次入库审核"}</span></header>
     <div className={css.skus}>{draft.map(s=><button type="button" key={s.id} data-selected={skuId===s.id} onClick={()=>setSkuId(s.id)}>{s.name||"SKU "+s.id}</button>)}</div>
     {currentSku?<div className={css.fields}><label>SKU 名称<input value={currentSku.name} disabled={stage==="review"} onChange={e=>updateSku({name:e.target.value})}/></label><label>基础资料<textarea rows={4} value={currentSku.description} disabled={stage==="review"} onChange={e=>updateSku({description:e.target.value})}/></label>
       <div className={css.imagePanel}><strong>商品图片 ({currentSku.images.length}/8)</strong><div className={css.images}>{currentSku.images.map((src,i)=><img key={i} src={src} alt={"商品图片 "+(i+1)}/>)}</div>{stage==="pending"?<><button type="button" disabled={currentSku.images.length>=8} onClick={()=>fileRef.current?.click()}>补充图片</button><input ref={fileRef} type="file" multiple accept="image/*" hidden onChange={e=>void upload(e)}/></>:null}</div>
     </div>:null}
     <footer>{stage==="pending"?<><small>{missing.length?missing.join("、"):"资料已齐，可以重新检查"}</small><button className={css.primary} type="button" onClick={save}>保存并重新检测</button></>:<><span>当前版本只读，确认前请检查图片、名称和基础资料。</span><button className={css.primary} type="button" onClick={()=>approve(selected)}>确认入库</button></>}</footer>
    </>}
   </section></div>
  </>}
 </main>;
}
