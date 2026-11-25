"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import css from "./showcase-pod-management-dialog.module.css";
import {readPodLibrary,savePodLibrary,readPodAssetImage,podAssetPreviewSrc,type PodLibraryAsset} from "./pod-asset-library";
import {readPodPrintLineage,reviewPodPrint,searchPodPrints} from "./pod-print-lineage";

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
 useEffect(()=>{
  const refresh=()=>{
   const source=readPodPrintLineage(organizationId,memberId);
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
 const selectTab=(next:Tab)=>{setTab(next);setSearch("");setApplied("");setCategory("全部分类");setStatus("全部状态");setPage(1);setPanel(null);setNotice("")};
 const open=(p:typeof panel,a?:Asset)=>{setPanel(p);setChosen(a??null);setNotice("")};
 const reset=()=>{setSearch("");setApplied("");setCategory("全部分类");setStatus("全部状态");setPage(1)};
 const promptFor=(asset:Asset)=>{setChosen(asset);setPanel("素材提示词")};
 const removeAsset=(id:number)=>{setAssets(v=>v.filter(x=>x.id!==id));setNotice("已从当前演示素材库删除。")};
 const audit=(id:number,next:string)=>{
  const record=reviews.find(x=>x.id===id);
  if(!record?.lineagePrintId||!record.lineageVersion){setNotice("印花缺少可追溯编号，禁止直接审核");return;}
  try{
   reviewPodPrint(organizationId,memberId,record.lineagePrintId,record.lineageVersion,
    next as "审核通过"|"退回重做"|"驳回");
   setNotice(next==="审核通过"?"印花审核通过，已保留原图编号与文件版本；后续商品须引用该版本":next+" · 原印花记录已保留");
  }catch(error){setNotice(error instanceof Error?error.message:"审核未保存")}
 };
 return <dialog ref={ref} className={css.dialog} aria-label="POD素材管理" onCancel={e=>{e.preventDefault();if(panel)setPanel(null);else onClose()}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
   <header className={css.header}><div><small>工具市场 / 我的工具 / POD素材管理</small><h2>POD 素材管理</h2><p>素材沉淀、生成图审核与创作灵感，形成可复用的 POD 创作闭环。</p></div><button type="button" aria-label="关闭POD素材管理" onClick={onClose} className={css.close}>×</button></header>
   <nav className={css.tabs} aria-label="POD素材管理模块">{([["我的素材库","上传、分类、复用素材"],["产品图审核","校验 POD 生成结果"],["灵感市场","趋势参考与生图提示词"]] as const).map(([t,sub])=><button type="button" key={t} className={tab===t?css.active:""} aria-current={tab===t?"page":undefined} onClick={()=>selectTab(t)}><strong>{t}</strong><small>{sub}</small></button>)}</nav>
   <div className={css.content}>
    <div className={css.topline}><div><h3>{tab}</h3><small>{tab==="我的素材库"?"上传、分类、复用个人素材":tab==="产品图审核"?"待审核 / 审核通过 / 退回重做 / 驳回":"官方创意参考与可复制生图提示词"}</small></div>{tab==="我的素材库"?<div className={css.topactions}><button type="button" onClick={()=>open("分类管理")}>分类管理</button><button type="button" className={css.primary} onClick={()=>open("上传素材")}>上传素材</button></div>:null}</div>
    <form className={css.filters} onSubmit={e=>{e.preventDefault();setApplied(search.trim());setPage(1)}}>
      <input aria-label="搜索素材" placeholder={tab==="灵感市场"?"搜索风格 / 主题 / 元素":tab==="产品图审核"?"搜索印花编号、订单号、SKU、商品、批次或名称":"搜索素材名称或分类"} value={search} onChange={e=>setSearch(e.target.value)}/>
      {tab==="产品图审核"?<select aria-label="审核状态" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}>{["全部状态","待审核","审核通过","退回重做","驳回"].map(s=><option key={s}>{s}</option>)}</select>:<select aria-label="素材分类" value={category} onChange={e=>{setCategory(e.target.value);setPage(1)}}><option>全部分类</option>{(tab==="我的素材库"?["未分类",...categories]:[...inspirationCategories]).map(s=><option key={s}>{s}</option>)}</select>}
      <button type="button" onClick={reset}>重置</button><button type="submit" className={css.primary}>确认</button>
    </form>
    {notice?<p className={css.notice} role="status">{notice}</p>:null}
    <div className={css.libraryHint}>{tab==="我的素材库"?"我的素材库 · 共 "+filtered.length+" 张图片（当前账号演示会话）":tab==="产品图审核"?"印花审核 · 共"+filtered.length+"张（留存原图版本，暂不生成产品图）":"灵感参考 · 共 "+filtered.length+" 条 · 每页最多 10 条"}</div>
    {displayed.length?<div className={css.grid}>{displayed.map(asset=><article className={css.assetCard} key={asset.id}>
       <button type="button" className={css.imageButton} onClick={()=>open("预览图片",asset)} aria-label={"预览"+asset.name}>{inspirationImageSrc(asset)?<img className={css.patternImage} src={inspirationImageSrc(asset)} alt={asset.name+"原创图案"} loading="lazy"/>:<div className={css.artwork} data-variant={asset.style}><span>{["✿","🎀","≈","☾","◒","✦"][asset.style]}</span></div>}</button>
       <strong title={asset.name}>{asset.name}</strong><small>{asset.status??asset.category}</small>{tab==="产品图审核"&&asset.lineagePrintId?<small title={asset.lineagePrintId+" · V"+asset.lineageVersion}>编号：{asset.lineagePrintId} · V{asset.lineageVersion}</small>:null}
       {tab==="我的素材库"?<div className={css.cardActions}><button type="button" onClick={()=>promptFor(asset)}>查看提示词</button><button type="button" onClick={()=>{setNotice("演示入口：请在正式POD刊登工具中引用此素材。")}}>用于POD</button><button type="button" onClick={()=>removeAsset(asset.id)}>删除</button></div>:tab==="产品图审核"?<div className={css.cardActions}>{asset.status==="待审核"?<><button type="button" onClick={()=>audit(asset.id,"审核通过")}>通过</button><button type="button" onClick={()=>audit(asset.id,"退回重做")}>退回</button><button type="button" onClick={()=>audit(asset.id,"驳回")}>驳回</button></>:<button type="button" onClick={()=>open("预览图片",asset)}>查看详情</button>}</div>:<div className={css.cardActions}><button type="button" onClick={()=>promptFor(asset)}>查看提示词</button><button type="button" onClick={()=>open("加入素材",asset)}>加入素材库</button></div>}
      </article>)}</div>:<div className={css.empty}>{tab==="我的素材库"?(assets.length?"当前筛选条件下暂无素材，请重置筛选。":"暂无素材，可点击右上角「上传素材」添加。"):tab==="产品图审核"?(reviews.length?"当前筛选条件下暂无印花审核记录，请重置筛选。":"暂无已归档的印花待审核；原图存入正式文件库并登记编号后才会显示。"):"当前筛选条件下暂无灵感内容，请重置筛选。"}</div>}
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
   <footer className={css.foot}><span>演示素材保存在当前账号的浏览器会话中，未上传服务器</span><button type="button" onClick={onClose}>关闭</button></footer>
  </dialog>;
}
