"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import css from "./showcase-pod-management-dialog.module.css";
import {readPodLibrary,savePodLibrary,readPodAssetImage,podAssetPreviewSrc,type PodLibraryAsset} from "./pod-asset-library";
import {readPodPrintLineage,registerPodPrint,reviewPodPrint,reopenPodPrintReview,searchPodPrints,bindPodPrintToVariant} from "./pod-print-lineage";
import {isShowcasePODScope,showcasePODReviewPrints,SHOWCASE_SDS_POD_BATCH_ID,showcaseSDSPrintSourceProducts} from "./pod-showcase-print-demo";
import {readDemoCollectionBatches,type DemoCollectedProduct} from "./showcase-collection-batches";

type Tab="我的素材库"|"产品图审核"|"灵感市场";
type Asset=PodLibraryAsset;
const inspirationCategories=["复古花卉","趣味动物","Y2K潮流"] as const;
const ideas:Asset[]=[
 {id:21,name:"复古笑脸雏菊",category:"复古花卉",style:0,image:"retro-floral-1",prompt:"独立矢量贴图，一朵70年代复古雏菊，柔和奶油粉与蜜桃色花瓣，金黄笑脸花心，弧形绿叶，暖调复古花艺，清晰边缘，居中构图，透明背景，无文字无水印。"},
 {id:22,name:"野花植物手绘",category:"复古花卉",style:1,image:"retro-floral-2",prompt:"浪漫手绘野花植物印花，奶白色雏菊、粉色小花与鼠尾草绿色叶片，柔和复古配色，自然不对称花束构图，独立POD图案，透明背景，无水印。"},
 {id:23,name:"70年代撞色花朵",category:"复古花卉",style:2,image:"retro-floral-3",prompt:"70年代复古groovy花卉图案，超大橙粉撞色花朵、圆润花瓣和波浪叶片，奶油黄与赤陶红配色，复古俏皮，居中图形，透明背景。"},
 {id:24,name:"呆萌水豚",category:"趣味动物",style:3,image:"fun-animal-1",prompt:"原创可爱水豚卡通头像，暖棕色圆润造型，轻松表情，柔和米色背景配色，精致线条与轻微复古质感，单独主体，适合T恤贴图，透明背景。"},
 {id:25,name:"治愈系小青蛙",category:"趣味动物",style:4,image:"fun-animal-2",prompt:"原创治愈系青蛙表情贴图，鼠尾草绿与奶油白配色，圆润大眼睛、腮红、微笑，配少量雏菊装饰，年轻俏皮手绘风格，透明背景，无文字。"},
 {id:26,name:"暗黑甜酷猫咪",category:"趣味动物",style:5,image:"fun-animal-3",prompt:"原创黑猫卡通图案，圆脸尖耳、粉色鼻尖、明亮双眼，淡紫色与暗黑甜酷风格融合，精细描边，星形小装饰，独立主体，透明背景。"},
 {id:27,name:"千禧笑脸",category:"Y2K潮流",style:0,image:"y2k-1",prompt:"Y2K千禧潮流笑脸图案，亮黄色笑脸、粉色渐变、蓝色和紫色星星，粗圆描边、复古贴纸质感、夸张俏皮，高清独立印花，透明背景。"},
 {id:28,name:"千禧粉色蝴蝶",category:"Y2K潮流",style:1,image:"y2k-2",prompt:"Y2K复古粉色蝴蝶贴图，柔和紫蓝渐变、粗细层次线条、星星点缀、对称翅膀与高饱和千禧配色，独立居中图案，透明背景。"},
 {id:29,name:"复古爆闪星芒",category:"Y2K潮流",style:2,image:"y2k-3",prompt:"Y2K潮流几何星芒印花，珊瑚粉、亮金黄、紫色多层爆闪尖角，复古唱片封面气质，强烈视觉中心，简洁干净、可独立用于POD，透明背景。"}
];
const inspirationImageSrc=podAssetPreviewSrc;
const perPage=10;
export function PodManagementWorkspace({onClose,organizationId="SM-ENT-000001",memberId="admin"}:{onClose:()=>void;organizationId?:string;memberId?:string}){
 const ref=useRef<HTMLDialogElement>(null);
 const [tab,setTab]=useState<Tab>("我的素材库");
 const [assets,setAssets]=useState<Asset[]>(()=>readPodLibrary(organizationId,memberId));
 const [reviews,setReviews]=useState<Asset[]>([]);
 const [selectedPrint,setSelectedPrint]=useState<string|null>(null);
 const [bindings,setBindings]=useState<ReturnType<typeof readPodPrintLineage>["bindings"]>([]);
 const [previewNote,setPreviewNote]=useState("");
 const [zoomProduct,setZoomProduct]=useState<{src:string;title:string}|null>(null);
 const [previewProductId,setPreviewProductId]=useState<string|null>(null);
 const [skuProductId,setSkuProductId]=useState<string|null>(null);
 const [skuDraft,setSkuDraft]=useState<string[]>([]);
 const [approvalPrintId,setApprovalPrintId]=useState<number|null>(null);
 const [approvalMode,setApprovalMode]=useState<"部分通过"|"全部通过">("部分通过");
 const [approvalDraft,setApprovalDraft]=useState<Record<string,string[]>>({});
 const openProductZoom=(src:string|undefined,title:string)=>{if(src)setZoomProduct({src,title})};
 const [sourceProducts,setSourceProducts]=useState<DemoCollectedProduct[]>([]);
 // Staged SKU selections remain separate from immutable preview records and review status.
 const [pendingSkuSelections,setPendingSkuSelections]=useState<Record<string,string[]>>({});
 useEffect(()=>{
  if(!isShowcasePODScope(organizationId,memberId)){setSourceProducts([]);return;}
  const refresh=()=>{
   const batch=readDemoCollectionBatches(organizationId,memberId).find(b=>b.id===SHOWCASE_SDS_POD_BATCH_ID&&b.source==="SDS");
   setSourceProducts(batch?.products??[]);
  };
  refresh();window.addEventListener("shuomi:demo-batches-updated",refresh);
  return()=>window.removeEventListener("shuomi:demo-batches-updated",refresh);
 },[organizationId,memberId]);
 useEffect(()=>{
  if(isShowcasePODScope(organizationId,memberId)){
   // Seed only the approved demonstration tenant. The archive files are
   // checked into GitHub; browser session storage holds review state only.
   for(const print of showcasePODReviewPrints){
    try{registerPodPrint(organizationId,memberId,print)}
    catch(error){setNotice(error instanceof Error?error.message:"印花审核记录初始化失败")}
   }
  }
  // One-time, narrowly scoped recovery of the accidental approval visible on
  // the demo account. Preserve unrelated prints, versions, and image archives.
  if(isShowcasePODScope(organizationId,memberId)&&typeof window!=="undefined"){
   const undoKey="shuomi:pod:undo-accidental-fission-c-v1:"+organizationId+":"+memberId;
   try{
    if(sessionStorage.getItem(undoKey)!=="done"){
     const current=readPodPrintLineage(organizationId,memberId);
     if(current.reviews.some(x=>x.printId==="POD-BUTTERFLY-FISSION-C"&&x.version===1&&x.status==="审核通过")){
      reopenPodPrintReview(organizationId,memberId,"POD-BUTTERFLY-FISSION-C",1);
      sessionStorage.setItem(undoKey,"done");
     }
    }
   }catch(error){setNotice(error instanceof Error?error.message:"撤销演示审核失败")}
  }
  const refresh=()=>{
   const source=readPodPrintLineage(organizationId,memberId);
   setBindings(source.bindings);
   setReviews(source.reviews.map((r,i)=>{
    const print=source.prints.find(p=>p.printId===r.printId&&p.version===r.version);
    if(!print)return null;
    return {id:i+1,name:print.name,category:"裂变印花 · "+print.printId+" · v"+print.version,
     style:i%6,prompt:"关联原图："+print.originPrintId+"；批次："+print.sourceBatchId,
     archivePath:print.assetPath,lineagePrintId:print.printId,lineageVersion:print.version,status:r.status};
   }).filter(x=>x!==null) as Asset[]);
  };
  refresh();window.addEventListener("shuomi:pod:print-lineage:change",refresh);
  return()=>window.removeEventListener("shuomi:pod:print-lineage:change",refresh);
 },[organizationId,memberId]);
 const [categories,setCategories]=useState(["我的自定义分类"]);
 const [search,setSearch]=useState("");const [applied,setApplied]=useState("");
 const [category,setCategory]=useState("全部分类");const [status,setStatus]=useState("全部状态");
 const [page,setPage]=useState(1);
 const [panel,setPanel]=useState<"上传素材"|"分类管理"|"素材提示词"|"预览图片"|"加入素材"|null>(null);
 const [chosen,setChosen]=useState<Asset|null>(null);const [newCategory,setNewCategory]=useState("");
 const [chosenCategory,setChosenCategory]=useState("");const [newFiles,setNewFiles]=useState<File[]>([]);
 const [notice,setNotice]=useState("");
 useEffect(()=>{if(!savePodLibrary(organizationId,memberId,assets))setNotice("浏览器会话存储空间不足，素材未能持久保存。请减少图片数量。")},[assets,organizationId,memberId]);
 useEffect(()=>{const d=ref.current;const prev=document.activeElement;d?.showModal();return()=>{d?.close();if(prev instanceof HTMLElement&&prev.isConnected)prev.focus()}},[]);
 const data=tab==="我的素材库"?assets:tab==="产品图审核"?reviews:ideas;
 const filtered=useMemo(()=>{
  const matchedPrintKeys=tab==="产品图审核"&&applied
   ?new Set(searchPodPrints(organizationId,memberId,applied).map(hit=>hit.print.printId+"@"+hit.print.version))
   :null;
  return data.filter(x=>{
   if(applied){
    const basic=[x.name,x.category].join(" ").toLocaleLowerCase().includes(applied.toLocaleLowerCase());
    const linked=!!matchedPrintKeys&&!!x.lineagePrintId&&matchedPrintKeys.has(x.lineagePrintId+"@"+x.lineageVersion);
    if(!basic&&!linked)return false;
   }
   if(tab==="产品图审核")return status==="全部状态"||x.status===status;
   return category==="全部分类"||x.category===category;
  });
 },[data,applied,category,status,tab,organizationId,memberId]);
 const displayed=filtered.slice((page-1)*perPage,page*perPage);
 const activePrint=reviews.find(x=>x.lineagePrintId&&x.lineagePrintId+"@"+x.lineageVersion===selectedPrint)??null;
 const activeBindings=activePrint?bindings.filter(x=>x.printId===activePrint.lineagePrintId&&x.printVersion===activePrint.lineageVersion):[];
 const preReviewProductIds=activePrint&&isShowcasePODScope(organizationId,memberId)&&activePrint.lineagePrintId&&activePrint.lineageVersion===1?showcaseSDSPrintSourceProducts[activePrint.lineagePrintId]??[]:[];
 const sourceLinkedProducts=preReviewProductIds.map(id=>sourceProducts.find(product=>product.id===id)).filter((product):product is DemoCollectedProduct=>Boolean(product));
 const archivedPreviews:PodPreviewRecord[]=activePrint&&activePrint.lineagePrintId==="POD-BUTTERFLY-FISSION-B"&&activePrint.lineageVersion===1&&isShowcasePODScope(organizationId,memberId)?[{id:"warm-tee-black-s",productId:"SIM-SDS-POD-DTF-WOMEN-150G",productName:"DTF 150gsm 女款短袖",color:"Black",size:"S",sku:"SDS-DEMO-TEE-BK-S",scope:"sku" as const,src:(typeof window!=="undefined"&&window.location.pathname.startsWith("/shuomi")?"/shuomi":"")+"/assets/pod-previews/v1/butterfly-peony-warm-sds-tee-black-s.webp"}]:[];
 const previewProduct=sourceLinkedProducts.find(p=>p.id===previewProductId);
 const skuProduct=sourceLinkedProducts.find(p=>p.id===skuProductId);
 const skuSelectionKey=skuProduct&&activePrint?activePrint.lineagePrintId+"@"+activePrint.lineageVersion+":"+skuProduct.id:"";
 const relatedBindings=activePrint?activeBindings:[];
 const selectTab=(next:Tab)=>{setTab(next);setPreviewNote("");setSearch("");setApplied("");setCategory("全部分类");setStatus("全部状态");setPage(1);setPanel(null);setNotice("")};
 const open=(p:typeof panel,a?:Asset)=>{setPanel(p);setChosen(a??null);setNotice("")};
 const reset=()=>{setSearch("");setApplied("");setCategory("全部分类");setStatus("全部状态");setPage(1)};
 const promptFor=(asset:Asset)=>{setChosen(asset);setPanel("素材提示词")};
 const removeAsset=(id:number)=>{if(assets.some(x=>x.id===id&&x.readonly)){setNotice("该原始印花已关联裂变版本，为保证追溯不能删除。");return;}setAssets(v=>v.filter(x=>x.id!==id));setNotice("已从当前演示素材库删除。")};
 const audit=(id:number,next:"退回重做"|"驳回")=>{
  const record=reviews.find(x=>x.id===id);
  if(!record?.lineagePrintId||!record.lineageVersion){setNotice("印花缺少可追溯编号");return}
  try{
   reviewPodPrint(organizationId,memberId,record.lineagePrintId,record.lineageVersion,next);
   setNotice(next+" · 原印花与已生成预览均保留");
  }catch(error){setNotice(error instanceof Error?error.message:"审核未保存")}
 };
 const openApproval=(asset:Asset,mode:"部分通过"|"全部通过")=>{
  if(!asset.lineagePrintId||!asset.lineageVersion)return;
  const ids=isShowcasePODScope(organizationId,memberId)?showcaseSDSPrintSourceProducts[asset.lineagePrintId]??[]:[];
  const products=ids.map(id=>sourceProducts.find(x=>x.id===id)).filter((x):x is DemoCollectedProduct=>Boolean(x));
  const prefix=asset.lineagePrintId+"@"+asset.lineageVersion+":";
  const selected:Record<string,string[]>={};
  for(const p of products)selected[p.id]=mode==="全部通过"?(p.variantDetails??[]).map(v=>v.sku):[...(pendingSkuSelections[prefix+p.id]??[])];
  setApprovalDraft(selected);setApprovalMode(mode);setApprovalPrintId(asset.id);
  setSelectedPrint(asset.lineagePrintId+"@"+asset.lineageVersion);
 };
 const approveSelected=()=>{
  const asset=reviews.find(x=>x.id===approvalPrintId);
  if(!asset?.lineagePrintId||!asset.lineageVersion)return;
  const products=(showcaseSDSPrintSourceProducts[asset.lineagePrintId]??[]).map(id=>sourceProducts.find(p=>p.id===id)).filter((x):x is DemoCollectedProduct=>Boolean(x));
  const variants=products.flatMap(p=>(p.variantDetails??[]).filter(v=>(approvalDraft[p.id]??[]).includes(v.sku)).map(v=>({product:p,variant:v})));
  if(!variants.length){setNotice("请至少选择一个商品 SKU，再确认通过");return}
  try{
   const staged:Record<string,string[]>={};
   for(const p of products)staged[asset.lineagePrintId+"@"+asset.lineageVersion+":"+p.id]=[...(approvalDraft[p.id]??[])];
   reviewPodPrint(organizationId,memberId,asset.lineagePrintId,asset.lineageVersion,"审核通过",approvalMode+" · "+variants.length+" 个 SKU");
   for(const {product,variant} of variants)bindPodPrintToVariant(organizationId,memberId,product.id,variant.sku,asset.lineagePrintId,asset.lineageVersion,variant.sku);
   setPendingSkuSelections(prev=>({...prev,...staged}));
   setApprovalPrintId(null);
   setNotice(approvalMode+"成功：选定 "+new Set(variants.map(x=>x.product.id)).size+" 款商品、"+variants.length+" 个 SKU 已建立印花绑定（演示），未启动正式刊登。");
  }catch(error){setNotice(error instanceof Error?error.message:"确认通过失败")}
 };
 const approvalAsset=reviews.find(x=>x.id===approvalPrintId);
 const approvalProducts=approvalAsset?.lineagePrintId?(showcaseSDSPrintSourceProducts[approvalAsset.lineagePrintId]??[]).map(id=>sourceProducts.find(p=>p.id===id)).filter((x):x is DemoCollectedProduct=>Boolean(x)):[];
 const approvalSkuCount=Object.values(approvalDraft).reduce((total,ids)=>total+ids.length,0);
 return <dialog ref={ref} className={css.dialog} aria-label="POD素材管理" onCancel={e=>{e.preventDefault();if(zoomProduct)setZoomProduct(null);else if(previewProductId)setPreviewProductId(null);else if(skuProductId)setSkuProductId(null);else if(panel)setPanel(null);else onClose()}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
   <header className={css.header}><div><small>工具市场 / 我的工具 / POD素材管理</small><h2>POD 素材管理</h2><p>素材沉淀、生成图审核与创作灵感，形成可复用的 POD 创作闭环。</p></div><button type="button" aria-label="关闭POD素材管理" onClick={onClose} className={css.close}>×</button></header>
   <nav className={css.tabs} aria-label="POD素材管理模块">{([["我的素材库","上传、分类、复用素材"],["产品图审核","校验 POD 生成结果"],["灵感市场","趋势参考与生图提示词"]] as const).map(([t,sub])=><button type="button" key={t} className={tab===t?css.active:""} aria-current={tab===t?"page":undefined} onClick={()=>selectTab(t)}><strong>{t}</strong><small>{sub}</small></button>)}</nav>
   <div className={css.content}>
    <div className={css.topline}><div><h3>{tab}</h3><small>{tab==="我的素材库"?"上传、分类、复用个人素材":tab==="产品图审核"?"支持直接审核通过；生成效果预览为可选操作":"官方创意参考与可复制生图提示词"}</small></div>{tab==="我的素材库"?<div className={css.topactions}><button type="button" onClick={()=>open("分类管理")}>分类管理</button><button type="button" className={css.primary} onClick={()=>open("上传素材")}>上传素材</button></div>:null}</div>
    <form className={css.filters} onSubmit={e=>{e.preventDefault();setApplied(search.trim());setPage(1)}}>
      <input aria-label="搜索素材" placeholder={tab==="灵感市场"?"搜索风格 / 主题 / 元素":tab==="产品图审核"?"搜索印花编号、订单号、SKU、商品、批次或名称":"搜索素材名称或分类"} value={search} onChange={e=>setSearch(e.target.value)}/>
      {tab==="产品图审核"?<div className={css.statusSwitch} role="group" aria-label="按审核状态筛选">{["全部状态","待审核","审核通过","退回重做","驳回"].map(s=><button type="button" key={s} className={status===s?css.selectedStatus:""} aria-pressed={status===s} onClick={()=>{setStatus(s);setPage(1)}}>{s}</button>)}</div>:<select aria-label="素材分类" value={category} onChange={e=>{setCategory(e.target.value);setPage(1)}}><option>全部分类</option>{(tab==="我的素材库"?["未分类",...categories]:[...inspirationCategories]).map(s=><option key={s}>{s}</option>)}</select>}
      <button type="button" onClick={reset}>重置</button><button type="submit" className={css.primary}>确认</button>
    </form>
    {notice?<p className={css.notice} role="status">{notice}</p>:null}
    <div className={css.libraryHint}>{tab==="我的素材库"?"我的素材库 · 共 "+filtered.length+" 张图片（当前账号演示会话）":tab==="产品图审核"?"印花审核 · 共 "+filtered.length+" 张（GitHub已存档；产品效果预览不影响审核）":"灵感参考 · 共 "+filtered.length+" 条 · 每页最多 10 条"}</div>
    <div className={tab==="产品图审核"?css.reviewLayout:undefined}><div className={css.reviewList}>{displayed.length?<div className={css.grid}>{displayed.map(asset=><article className={css.assetCard+(tab==="产品图审核"&&selectedPrint===asset.lineagePrintId+"@"+asset.lineageVersion?" "+css.selectedCard:"")} key={asset.id}>
       <button type="button" className={css.imageButton} onClick={()=>{if(tab==="产品图审核"){setSelectedPrint(asset.lineagePrintId+"@"+asset.lineageVersion);setPreviewProductId(null);setSkuProductId(null);setPreviewNote("")}else open("预览图片",asset)}} aria-label={tab==="产品图审核"?"查看关联商品："+asset.name:"预览"+asset.name}>{inspirationImageSrc(asset)?<img className={css.patternImage} src={inspirationImageSrc(asset)} alt={asset.name+"原创图案"} loading="lazy"/>:<div className={css.artwork} data-variant={asset.style}><span>{["✿","🎀","≈","☾","◒","✦"][asset.style]}</span></div>}</button>
       <strong title={asset.name}>{asset.name}</strong>{tab==="产品图审核"&&asset.lineagePrintId==="POD-BUTTERFLY-FISSION-B"&&asset.lineageVersion===1&&isShowcasePODScope(organizationId,memberId)?<small className={css.printPreviewIndicator}>已生成预览 1 张 · 黑色短袖 S</small>:null}<small>{asset.status??asset.category}</small>{asset.originPrintId?<small title={asset.originPrintId}>原图编号：{asset.originPrintId}</small>:null}{tab==="产品图审核"&&asset.lineagePrintId?<small title={asset.lineagePrintId+" · V"+asset.lineageVersion}>编号：{asset.lineagePrintId} · V{asset.lineageVersion}</small>:null}
       {tab==="我的素材库"?<div className={css.cardActions}><button type="button" onClick={()=>promptFor(asset)}>查看提示词</button><button type="button" disabled={asset.readonly} title={asset.readonly?"已有裂变关联，不可删除原图":"删除当前素材"} onClick={()=>removeAsset(asset.id)}>删除</button>{asset.readonly?<span className={css.sourceLocked}>源图已关联 · 只读</span>:null}</div>:tab==="产品图审核"?<div className={css.cardActions}>{asset.status==="待审核"?<><button type="button" onClick={()=>openApproval(asset,"部分通过")}>部分通过</button><button type="button" onClick={()=>openApproval(asset,"全部通过")}>全部通过</button><button type="button" onClick={()=>audit(asset.id,"退回重做")}>退回</button><button type="button" onClick={()=>audit(asset.id,"驳回")}>驳回</button></>:<><button type="button" onClick={()=>open("预览图片",asset)}>查看详情</button>{asset.status==="审核通过"?<button type="button" onClick={()=>{try{reopenPodPrintReview(organizationId,memberId,asset.lineagePrintId!,asset.lineageVersion!);setNotice("已撤销误通过，恢复待审核；已有预览文件保留。")}catch(error){setNotice(error instanceof Error?error.message:"撤销失败")}}}>撤销通过</button>:null}</>}</div>:<div className={css.cardActions}><button type="button" onClick={()=>promptFor(asset)}>查看提示词</button><button type="button" onClick={()=>open("加入素材",asset)}>加入素材库</button></div>}
      </article>)}</div>:<div className={css.empty}>{tab==="我的素材库"?(assets.length?"当前筛选条件下暂无素材，请重置筛选。":"暂无素材，可点击右上角「上传素材」添加。"):tab==="产品图审核"?(reviews.length?"当前筛选条件下暂无印花审核记录，请重置筛选。":"暂无已归档的印花待审核；原图存入正式文件库并登记编号后才会显示。"):"当前筛选条件下暂无灵感内容，请重置筛选。"}</div>}
    </div>{tab==="产品图审核"?<aside className={css.relatedPanel} aria-label="关联产品与效果预览"><h3>关联产品与效果预览</h3>{activePrint?<><div className={css.selectedPrintHeader}><img src={inspirationImageSrc(activePrint)} alt={activePrint.name}/><div><strong>{activePrint.name}</strong><small>编号：{activePrint.lineagePrintId} · V{activePrint.lineageVersion}</small><small>状态：{activePrint.status}</small></div></div><div className={css.relatedTabs}><strong>关联产品（{sourceLinkedProducts.length+relatedBindings.filter(b=>!sourceLinkedProducts.some(p=>p.id===b.productId)).length}）</strong><span>来源关联 · 不等于审核通过</span></div>
{sourceLinkedProducts.length?<div className={css.relatedProducts}>{sourceLinkedProducts.map(p=><LinkedPodProduct key={activePrint.lineagePrintId+"@"+activePrint.lineageVersion+":"+p.id} product={p} selectedSkus={pendingSkuSelections[activePrint.lineagePrintId+"@"+activePrint.lineageVersion+":"+p.id]??[]} onZoom={openProductZoom} onSelectSku={()=>{setSkuProductId(p.id);setSkuDraft([...(pendingSkuSelections[activePrint.lineagePrintId+"@"+activePrint.lineageVersion+":"+p.id]??[])]);}} onOpenPreview={()=>setPreviewProductId(p.id)} onGeneratePreview={()=>setPreviewNote("当前仍未接入 AI 生图与积分计费接口。每次仅生成一张组合预览的规则已保留；不会虚构生图结果或扣费。")} previewCount={archivedPreviews.filter(x=>x.productId===p.id).length}/>)}</div>:null}
{relatedBindings.filter(b=>!sourceLinkedProducts.some(p=>p.id===b.productId)).length?<div className={css.relatedProducts}>{relatedBindings.filter(b=>!sourceLinkedProducts.some(p=>p.id===b.productId)).map((b,i)=><div key={b.productId+"/"+b.variantId+"/"+i} className={css.relatedProduct}><div className={css.productPlaceholder}>暂无商品图</div><div><strong>正式绑定：{b.productId}</strong><small>变体：{b.variantId}</small>{b.sku?<small>SKU：{b.sku}</small>:null}</div></div>)}</div>:null}
{!sourceLinkedProducts.length&&!relatedBindings.length?<div className={css.relatedEmpty}>该印花暂无可读取的关联商品。<small>演示数据仅在指定企业的管理员账号中显示；审核通过不强制要求生成效果图。</small></div>:null}{previewNote?<p role="status" className={css.previewNotice}>{previewNote}</p>:null}</>:<div className={css.relatedEmpty}>点击左侧任意印花图片，查看关联产品及效果预览。</div>}</aside>:null}</div>
    <div className={css.pagination}><span>共 {filtered.length} 条 · 第 {page} / {Math.max(1,Math.ceil(filtered.length/perPage))} 页</span><div><button type="button" disabled={page===1} onClick={()=>setPage(x=>Math.max(1,x-1))}>上一页</button><button type="button" disabled={page*perPage>=filtered.length} onClick={()=>setPage(x=>x+1)}>下一页</button></div></div>
   </div>
   {panel?<div className={css.overlay} onClick={e=>{if(e.target===e.currentTarget)setPanel(null)}}><section className={css.subDialog} role="dialog" aria-modal="true" aria-label={panel}>
      <header><div><h3>{panel}</h3><small>{panel==="上传素材"?"支持 PNG、JPG、SVG；请确保素材具有使用授权。":panel==="分类管理"?"为素材建立分类，便于后续检索和复用。":panel==="加入素材"?"选择分类后保存到我的素材库。":chosen?.name??"管理个人素材"}</small></div><button type="button" onClick={()=>setPanel(null)} aria-label="关闭子弹窗">×</button></header>
      {panel==="上传素材"?<div className={css.modalBody}><label className={css.upload}>添加素材图片 / 将文件拖入此处<input type="file" multiple accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e=>setNewFiles(Array.from(e.target.files??[]))}/></label><p>{newFiles.length?"已选择 "+newFiles.map(f=>f.name).join("、"):"请选择需要添加的图片。"}</p><button type="button" className={css.primary} disabled={!newFiles.length} onClick={async()=>{try{const stored=await Promise.all(newFiles.map(async(file,i)=>({id:Date.now()+i,name:file.name,category:"未分类",style:i%6,prompt:"此素材尚未生成提示词。",dataUrl:await readPodAssetImage(file)})));setAssets(v=>[...stored,...v]);setNewFiles([]);setPanel(null);setNotice("图片已保存到当前账号的演示素材库，可在智能体图片选择器中查看。不会上传服务器。");}catch(error){setNotice(error instanceof Error?error.message:"保存失败，请重新选择图片。")}}}>保存素材</button></div>
      :panel==="分类管理"?<div className={css.modalBody}><div className={css.categoryList}>{categories.map(c=><div key={c}><span>{c}</span><button type="button" onClick={()=>{setCategories(v=>v.filter(x=>x!==c));setAssets(v=>v.map(a=>a.category===c?{...a,category:"未分类"}:a))}}>删除</button></div>)}</div><label>新增分类<input placeholder="输入分类名称" value={newCategory} onChange={e=>setNewCategory(e.target.value)}/></label><button type="button" className={css.primary} onClick={()=>{const s=newCategory.trim();if(s&&!categories.includes(s)){setCategories(v=>[...v,s]);setNewCategory("")}}}>保存分类</button></div>
      :panel==="素材提示词"?<div className={css.modalBody}><p>提示词为创作参考，使用时可根据商品和图案进行调整。</p><textarea readOnly value={chosen?.prompt??""} rows={5}/><button type="button" className={css.primary} onClick={()=>{if(chosen?.prompt)void navigator.clipboard?.writeText(chosen.prompt);setNotice("提示词已请求复制到剪贴板。")}}>复制示例提示词</button></div>
      :panel==="加入素材"?<div className={css.modalBody}><p>先选择保存分类，再点击「保存到素材库」。</p><select value={chosenCategory} onChange={e=>setChosenCategory(e.target.value)}><option value="">选择分类</option><option value="未分类">未分类</option>{categories.map(c=><option key={c}>{c}</option>)}</select><button type="button" className={css.primary} disabled={!chosenCategory} onClick={()=>{if(chosen){setAssets(v=>[{...chosen,id:Date.now(),category:chosenCategory},...v]);setNotice("已保存到我的素材库（当前演示会话）。");setPanel(null)}}}>保存到素材库</button></div>
      :<div className={css.modalBody}>{chosen&&inspirationImageSrc(chosen)?<img className={css.patternLarge} src={inspirationImageSrc(chosen)} alt={chosen.name+"完整图案预览"}/>:<div className={css.largeArtwork} data-variant={chosen?.style??0}><span>{["✿","🎀","≈","☾","◒","✦"][chosen?.style??0]}</span></div>}<p>{chosen?.name} · 完整比例预览</p></div>}
    </section></div>:null}
   {approvalAsset?<div className={css.zoomOverlay} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setApprovalPrintId(null)}}>
    <section className={css.podActionDialog} role="dialog" aria-modal="true" aria-label={approvalMode+"选择商品规格"}>
     <header><div><strong>{approvalMode} · {approvalAsset.name}</strong><small>按商品、颜色和尺码确定哪些 SKU 绑定当前印花。没有实际绑定的 SKU 不会被推进后续流程。</small></div><button type="button" autoFocus onClick={()=>setApprovalPrintId(null)}>关闭</button></header>
     {approvalMode==="全部通过"?<p className={css.approvalExplanation}>当前关联的 {approvalProducts.length} 款商品、全部 {approvalSkuCount} 个 SKU 将使用此印花。请确认后提交。</p>:<p className={css.approvalExplanation}>勾选要通过的商品及其具体 SKU；可只选某款商品的一种颜色、一个或多个尺码。未选择的保持未绑定。</p>}
     <div className={css.approvalProducts}>{approvalProducts.map(p=><section key={p.id}><strong>{p.name}</strong><small>已选 {(approvalDraft[p.id]??[]).length} / {(p.variantDetails??[]).length} SKU</small><PodSkuPicker product={p} selected={approvalDraft[p.id]??[]} onChange={ids=>setApprovalDraft(v=>({...v,[p.id]:ids}))}/></section>)}</div>
     {!approvalProducts.length?<p role="alert">当前关联商品没有可用的 SKU 资料，无法执行部分或全部通过。请先恢复关联批次。</p>:null}
     <footer><span>本次将绑定 {approvalSkuCount} 个 SKU · 不自动生成预览、也不直接启动刊登</span><div><button type="button" onClick={()=>setApprovalPrintId(null)}>取消</button><button type="button" disabled={!approvalSkuCount} onClick={approveSelected}>确认{approvalMode}</button></div></footer>
    </section></div>:null}
   {previewProduct?<div className={css.zoomOverlay} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setPreviewProductId(null)}}>
    <section className={css.podActionDialog} role="dialog" aria-modal="true" aria-label={"产品效果预览："+previewProduct.name}>
     <header><div><strong>{previewProduct.name} · 已生成的产品效果预览</strong><small>左侧图片缩略图 · 右侧大图；仅展示已归档的预览，不影响审核</small></div><button type="button" autoFocus onClick={()=>setPreviewProductId(null)}>关闭</button></header>
     <PodPreviewBrowser key={activePrint?.lineagePrintId+"-"+previewProduct.id} previews={archivedPreviews.filter(x=>x.productId===previewProduct.id)} onZoom={openProductZoom}/>
    </section></div>:null}
   {skuProduct?<div className={css.zoomOverlay} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setSkuProductId(null)}}>
    <section className={css.podActionDialog} role="dialog" aria-modal="true" aria-label={"选择参与后续流程的 SKU："+skuProduct.name}>
     <header><div><strong>选择参与后续流程的 SKU</strong><small>{skuProduct.name} · 按颜色和尺码自由多选，不依赖预览图片</small></div><button type="button" autoFocus onClick={()=>setSkuProductId(null)}>关闭</button></header>
     <PodSkuPicker product={skuProduct} selected={skuDraft} onChange={setSkuDraft}/>
     <footer><span>已选择 {skuDraft.length} 个 SKU · 审核印花通过后才建立演示绑定，不会直接启动刊登任务</span><div><button type="button" onClick={()=>setSkuProductId(null)}>取消</button><button type="button" onClick={()=>{setPendingSkuSelections(v=>({...v,[skuSelectionKey]:skuDraft}));setSkuProductId(null);setNotice("已保存 "+skuDraft.length+" 个待用 SKU。请审核印花后再进入后续业务流程；当前不会创建刊登任务。")}}>保存 SKU 选择</button></div></footer>
    </section></div>:null}
   {zoomProduct?<div className={css.zoomOverlay} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setZoomProduct(null)}}><section className={css.zoomDialog} role="dialog" aria-modal="true" aria-label={"放大查看商品图片："+zoomProduct.title} onKeyDown={e=>{if(e.key==="Escape")setZoomProduct(null)}}><header><strong>{zoomProduct.title}</strong><button type="button" autoFocus onClick={()=>setZoomProduct(null)} aria-label="关闭图片预览">关闭</button></header><img src={zoomProduct.src} alt={zoomProduct.title+" 放大预览"}/><p>{zoomProduct.src.includes("/pod-previews/")?"GitHub 已归档的单张组合效果预览，仅辅助审核，不作为平台实际商品图。":"商品目录参考图，非平台实拍对应 SKU 的证明。"}</p></section></div>:null}
   <footer className={css.foot}><span>演示素材保存在当前账号的浏览器会话中，未上传服务器</span><button type="button" onClick={onClose}>关闭</button></footer>
  </dialog>;
}

/** Product card is compact; all preview images and SKU selection live in separate dialogs. */
function LinkedPodProduct({product,onZoom,onSelectSku,onOpenPreview,onGeneratePreview,selectedSkus,previewCount}:{product:DemoCollectedProduct;onZoom:(src:string|undefined,title:string)=>void;onSelectSku:()=>void;onOpenPreview:()=>void;onGeneratePreview:()=>void;selectedSkus:string[];previewCount:number}){
 const photo=product.images?.[0]??product.variantDetails?.[0]?.image;
 const chosen=product.variantDetails?.filter(v=>selectedSkus.includes(v.sku))??[];
 return <article className={css.relatedProduct}>
  <button type="button" className={css.productMainImageButton} aria-label={"放大查看"+product.name+"商品图片"} onClick={()=>onZoom(photo,product.name)}>
   {photo?<img className={css.productThumb} src={photo} alt={product.name+"商品参考图"} loading="lazy"/>:<span>暂无图片</span>}
   <span>点击放大</span>
  </button>
  <div className={css.productInformation}>
   <strong title={product.name}>{product.name}</strong>
   <small>批次：SDS POD · 2款公开目录商品（演示）</small>
   <small>商品编号：{product.id}</small>
   <div className={css.selectedSkuSummary}><span>待用 SKU：{selectedSkus.length} 个</span><span>{chosen.length?chosen.map(x=>x.label).join("、"):"尚未选择；不影响印花直接审核通过"}</span></div>
   <div className={css.productBottomRow}>
    <div className={css.productColors}>{product.images?.map((src,i)=><button type="button" key={src} aria-label={"放大查看"+product.name+"颜色参考图"+(i+1)} onClick={()=>onZoom(src,product.name+" · 颜色参考图 "+(i+1))}><img src={src} alt={product.name+"颜色参考图"+(i+1)} loading="lazy"/></button>)}</div>
    <div className={css.previewActions}><button type="button" onClick={onSelectSku}>选择后续 SKU{selectedSkus.length?" ("+selectedSkus.length+")":""}</button><button type="button" onClick={onOpenPreview}>查看预览{previewCount?" ("+previewCount+")":""}</button><button type="button" className={css.generatePreview} onClick={onGeneratePreview}>生成预览</button></div>
   </div>
  </div>
 </article>;
}
function PodSkuPicker({product,selected,onChange}:{product:DemoCollectedProduct;selected:string[];onChange:(ids:string[])=>void}){
 const details=product.variantDetails??[];
 const colors=[...new Set(details.map(v=>v.color).filter(Boolean))];
 return <div className={css.podSkuChoices}>
  <p>可以只选一个颜色的两个尺码，也可以跨颜色选任意 SKU。某颜色效果不好，不勾选即可；没有预览图也能选择。此处只保存待用选择，不直接提交平台。</p>
  {colors.map(color=><section key={color}><strong>{color}</strong><div>{details.filter(v=>v.color===color).map(v=><label key={v.sku}><input type="checkbox" checked={selected.includes(v.sku)} onChange={e=>onChange(e.target.checked?[...selected,v.sku]:selected.filter(x=>x!==v.sku))}/><span>{v.size} · {v.sku}</span></label>)}</div></section>)}
  <button type="button" onClick={()=>onChange([])}>清空选择</button>
 </div>;
}

type PodPreviewRecord={
 id:string;productId:string;productName:string;color:string;size?:string;sku?:string;
 /** A colour-level image cannot be claimed to illustrate a size-dependent variation. */
 scope:"sku"|"color";src:string;
};
function PodPreviewBrowser({previews,onZoom}:{previews:PodPreviewRecord[];onZoom:(src:string|undefined,title:string)=>void}){
 const [chosenId,setChosenId]=useState<string|null>(null);
 const current=previews.find(p=>p.id===chosenId)??previews[0];
 return <div className={css.previewBrowser}>
  <div className={css.previewIndex}>
   <strong>预览记录（{previews.length}）</strong>
   {previews.length?<div className={css.previewThumbnailGrid}>{previews.map(p=><button type="button" key={p.id} aria-label={"选择预览："+p.productName+" "+p.color+(p.size?" / "+p.size:"")} aria-pressed={p.id===current?.id} className={p.id===current?.id?css.previewIndexActive:""} onClick={()=>setChosenId(p.id)}>
    <img src={p.src} alt={p.productName+" · "+p.color+(p.size?" / "+p.size:"")+"组合预览"} loading="lazy"/>
    <span>{p.color}{p.scope==="sku"&&p.size?" / "+p.size:""} · {p.scope==="color"?"颜色预览":"规格预览"}</span>
   </button>)}</div>:<p>当前印花没有已归档的产品预览。可直接审核通过，无需生成。</p>}
  </div>
  <div className={css.previewDetail}>
   {current?<><button type="button" className={css.previewLargeButton} onClick={()=>onZoom(current.src,current.productName+" · "+current.color+(current.size?"/"+current.size:"")+" · 组合预览")} aria-label="点击放大已生成的组合预览"><img src={current.src} alt={current.productName+" · "+current.color+" · 已归档单张组合预览"} loading="lazy"/></button><strong>{current.productName} · {current.color}{current.size?" / "+current.size:""}</strong><small>{current.scope==="sku"?"此图仅代表 SKU："+current.sku:"此图为颜色级预览，不保证适用于不同尺码"}</small><small>点击图片放大 · GitHub 已归档</small></>:<div className={css.previewBlank}>选中左侧预览记录后，在这里查看组合图。不同尺寸的图片可独立保存。</div>}
  </div>
 </div>;
}
