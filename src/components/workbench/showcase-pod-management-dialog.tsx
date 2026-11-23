"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import css from "./showcase-pod-management-dialog.module.css";

type Tab="我的素材库"|"产品图审核"|"灵感市场";
type Asset={id:number;name:string;category:string;style:number;prompt:string;status?:string};
const ideas:Asset[]=[
 {id:21,name:"复古花卉",category:"复古风格",style:0,prompt:"复古花朵与字母结合，柔和奶油色背景，精致花瓣与装饰性衬线字体，适合POD贴图。"},
 {id:22,name:"缎带蝴蝶结",category:"甜美风格",style:1,prompt:"浅紫色缎带蝴蝶结，缎面高光，甜美复古，独立主体居中，透明背景。"},
 {id:23,name:"海洋浪花",category:"自然元素",style:2,prompt:"蓝色层叠波浪与白色浪花，清爽夏日抽象装饰，简洁线条，透明背景。"},
 {id:24,name:"星月童话",category:"梦幻风格",style:3,prompt:"弯月与闪亮星星，淡紫云朵，梦幻渐变，温柔童趣的独立插画。"},
 {id:25,name:"落日山峦",category:"复古风格",style:4,prompt:"太阳与层叠山丘，温暖复古配色，扁平图形，完整独立主体。"},
 {id:26,name:"水果派对",category:"趣味插画",style:5,prompt:"新鲜柠檬橙子与樱桃组成的趣味图案，清晰配色，年轻俏皮的POD素材。"}
];
const perPage=10;
export function PodManagementWorkspace({onClose}:{onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 const [tab,setTab]=useState<Tab>("我的素材库");
 const [assets,setAssets]=useState<Asset[]>([]);
 const [reviews,setReviews]=useState<Asset[]>([]);
 const [categories,setCategories]=useState(["我的自定义分类"]);
 const [search,setSearch]=useState("");const [applied,setApplied]=useState("");
 const [category,setCategory]=useState("全部分类");const [status,setStatus]=useState("全部状态");
 const [page,setPage]=useState(1);
 const [panel,setPanel]=useState<"上传素材"|"分类管理"|"素材提示词"|"预览图片"|"加入素材"|null>(null);
 const [chosen,setChosen]=useState<Asset|null>(null);const [newCategory,setNewCategory]=useState("");
 const [chosenCategory,setChosenCategory]=useState("");const [newFiles,setNewFiles]=useState<string[]>([]);
 const [notice,setNotice]=useState("");
 useEffect(()=>{const d=ref.current;const prev=document.activeElement;d?.showModal();return()=>{d?.close();if(prev instanceof HTMLElement&&prev.isConnected)prev.focus()}},[]);
 const data=tab==="我的素材库"?assets:tab==="产品图审核"?reviews:ideas;
 const filtered=useMemo(()=>data.filter(x=>{
  if(applied&&![x.name,x.category].join(" ").toLowerCase().includes(applied.toLowerCase()))return false;
  if(tab==="产品图审核")return status==="全部状态"||x.status===status;
  return category==="全部分类"||x.category===category;
 }),[data,applied,category,status,tab]);
 const displayed=filtered.slice((page-1)*perPage,page*perPage);
 const selectTab=(next:Tab)=>{setTab(next);setSearch("");setApplied("");setCategory("全部分类");setStatus("全部状态");setPage(1);setPanel(null);setNotice("")};
 const open=(p:typeof panel,a?:Asset)=>{setPanel(p);setChosen(a??null);setNotice("")};
 const reset=()=>{setSearch("");setApplied("");setCategory("全部分类");setStatus("全部状态");setPage(1)};
 const promptFor=(asset:Asset)=>{setChosen(asset);setPanel("素材提示词")};
 const removeAsset=(id:number)=>{setAssets(v=>v.filter(x=>x.id!==id));setNotice("已从当前演示素材库删除。")};
 const audit=(id:number,next:string)=>{setReviews(v=>v.map(x=>x.id===id?{...x,status:next}:x));setNotice(next==="审核通过"?"审核通过，已回传 POD 刊登流程":next==="退回重做"?"退回重做 · 等待重新生成":"已驳回 · 不再重做")};
 return <dialog ref={ref} className={css.dialog} aria-label="POD素材管理" onCancel={e=>{e.preventDefault();if(panel)setPanel(null);else onClose()}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
   <header className={css.header}><div><small>工具市场 / 我的工具 / POD素材管理</small><h2>POD 素材管理</h2><p>素材沉淀、生成图审核与创作灵感，形成可复用的 POD 创作闭环。</p></div><button type="button" aria-label="关闭POD素材管理" onClick={onClose} className={css.close}>×</button></header>
   <nav className={css.tabs} aria-label="POD素材管理模块">{([["我的素材库","上传、分类、复用素材"],["产品图审核","校验 POD 生成结果"],["灵感市场","趋势参考与生图提示词"]] as const).map(([t,sub])=><button type="button" key={t} className={tab===t?css.active:""} aria-current={tab===t?"page":undefined} onClick={()=>selectTab(t)}><strong>{t}</strong><small>{sub}</small></button>)}</nav>
   <div className={css.content}>
    <div className={css.topline}><div><h3>{tab}</h3><small>{tab==="我的素材库"?"上传、分类、复用个人素材":tab==="产品图审核"?"待审核 / 审核通过 / 退回重做 / 驳回":"官方创意参考与可复制生图提示词"}</small></div>{tab==="我的素材库"?<div className={css.topactions}><button type="button" onClick={()=>open("分类管理")}>分类管理</button><button type="button" className={css.primary} onClick={()=>open("上传素材")}>上传素材</button></div>:null}</div>
    <form className={css.filters} onSubmit={e=>{e.preventDefault();setApplied(search.trim());setPage(1)}}>
      <input aria-label="搜索素材" placeholder={tab==="灵感市场"?"搜索风格 / 主题 / 元素":tab==="产品图审核"?"搜索图片名称":"搜索素材名称或分类"} value={search} onChange={e=>setSearch(e.target.value)}/>
      {tab==="产品图审核"?<select aria-label="审核状态" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}>{["全部状态","待审核","审核通过","退回重做","驳回"].map(s=><option key={s}>{s}</option>)}</select>:<select aria-label="素材分类" value={category} onChange={e=>{setCategory(e.target.value);setPage(1)}}><option>全部分类</option>{(tab==="我的素材库"?["未分类",...categories]:["复古风格","甜美风格","自然元素","梦幻风格","趣味插画"]).map(s=><option key={s}>{s}</option>)}</select>}
      <button type="button" onClick={reset}>重置</button><button type="submit" className={css.primary}>确认</button>
    </form>
    {notice?<p className={css.notice} role="status">{notice}</p>:null}
    <div className={css.libraryHint}>{tab==="我的素材库"?"我的素材库 · 暂无素材，上传后将在这里显示":tab==="产品图审核"?"产品图审核 · 共"+filtered.length+"张":"灵感参考 · 共 "+filtered.length+" 条 · 每页最多 10 条"}</div>
    {displayed.length?<div className={css.grid}>{displayed.map(asset=><article className={css.assetCard} key={asset.id}>
       <button type="button" className={css.imageButton} onClick={()=>open("预览图片",asset)} aria-label={"预览"+asset.name}><div className={css.artwork} data-variant={asset.style}><span>{["✿","🎀","≈","☾","◒","✦"][asset.style]}</span></div></button>
       <strong title={asset.name}>{asset.name}</strong><small>{asset.status??asset.category}</small>
       {tab==="我的素材库"?<div className={css.cardActions}><button type="button" onClick={()=>promptFor(asset)}>查看提示词</button><button type="button" onClick={()=>{setNotice("演示入口：请在正式POD刊登工具中引用此素材。")}}>用于POD</button><button type="button" onClick={()=>removeAsset(asset.id)}>删除</button></div>:tab==="产品图审核"?<div className={css.cardActions}>{asset.status==="待审核"?<><button type="button" onClick={()=>audit(asset.id,"审核通过")}>通过</button><button type="button" onClick={()=>audit(asset.id,"退回重做")}>退回</button><button type="button" onClick={()=>audit(asset.id,"驳回")}>驳回</button></>:<button type="button" onClick={()=>open("预览图片",asset)}>查看详情</button>}</div>:<div className={css.cardActions}><button type="button" onClick={()=>promptFor(asset)}>查看提示词</button><button type="button" onClick={()=>open("加入素材",asset)}>加入素材库</button></div>}
      </article>)}</div>:<div className={css.empty}>{tab==="我的素材库"?(assets.length?"当前筛选条件下暂无素材，请重置筛选。":"暂无素材，可点击右上角「上传素材」添加。"):tab==="产品图审核"?(reviews.length?"当前筛选条件下暂无审核记录，请重置筛选。":"暂无产品图审核记录，待 POD 刊登生成图片后将在此显示。"):"当前筛选条件下暂无灵感内容，请重置筛选。"}</div>}
    <div className={css.pagination}><span>共 {filtered.length} 条 · 第 {page} / {Math.max(1,Math.ceil(filtered.length/perPage))} 页</span><div><button type="button" disabled={page===1} onClick={()=>setPage(x=>Math.max(1,x-1))}>上一页</button><button type="button" disabled={page*perPage>=filtered.length} onClick={()=>setPage(x=>x+1)}>下一页</button></div></div>
   </div>
   {panel?<div className={css.overlay} onClick={e=>{if(e.target===e.currentTarget)setPanel(null)}}><section className={css.subDialog} role="dialog" aria-modal="true" aria-label={panel}>
      <header><div><h3>{panel}</h3><small>{panel==="上传素材"?"支持 PNG、JPG、SVG；请确保素材具有使用授权。":panel==="分类管理"?"为素材建立分类，便于后续检索和复用。":panel==="加入素材"?"选择分类后保存到我的素材库。":chosen?.name??"管理个人素材"}</small></div><button type="button" onClick={()=>setPanel(null)} aria-label="关闭子弹窗">×</button></header>
      {panel==="上传素材"?<div className={css.modalBody}><label className={css.upload}>添加素材图片 / 将文件拖入此处<input type="file" multiple accept="image/png,image/jpeg,image/svg+xml" onChange={e=>setNewFiles(Array.from(e.target.files??[]).map(f=>f.name))}/></label><p>{newFiles.length?"已选择 "+newFiles.join("、"):"请选择需要添加的图片。"}</p><button type="button" className={css.primary} disabled={!newFiles.length} onClick={()=>{const next=Date.now();setAssets(v=>[...newFiles.map((name,i)=>({id:next+i,name,category:"未分类",style:i%6,prompt:"此素材尚未生成提示词。"})),...v]);setNewFiles([]);setPanel(null);setNotice("演示上传已加入当前会话列表，不会上传真实文件到服务器。")}}>保存素材</button></div>
      :panel==="分类管理"?<div className={css.modalBody}><div className={css.categoryList}>{categories.map(c=><div key={c}><span>{c}</span><button type="button" onClick={()=>{setCategories(v=>v.filter(x=>x!==c));setAssets(v=>v.map(a=>a.category===c?{...a,category:"未分类"}:a))}}>删除</button></div>)}</div><label>新增分类<input placeholder="输入分类名称" value={newCategory} onChange={e=>setNewCategory(e.target.value)}/></label><button type="button" className={css.primary} onClick={()=>{const s=newCategory.trim();if(s&&!categories.includes(s)){setCategories(v=>[...v,s]);setNewCategory("")}}}>保存分类</button></div>
      :panel==="素材提示词"?<div className={css.modalBody}><p>提示词为创作参考，使用时可根据商品和图案进行调整。</p><textarea readOnly value={chosen?.prompt??""} rows={5}/><button type="button" className={css.primary} onClick={()=>{if(chosen?.prompt)void navigator.clipboard?.writeText(chosen.prompt);setNotice("提示词已请求复制到剪贴板。")}}>复制示例提示词</button></div>
      :panel==="加入素材"?<div className={css.modalBody}><p>先选择保存分类，再点击「保存到素材库」。</p><select value={chosenCategory} onChange={e=>setChosenCategory(e.target.value)}><option value="">选择分类</option><option value="未分类">未分类</option>{categories.map(c=><option key={c}>{c}</option>)}</select><button type="button" className={css.primary} disabled={!chosenCategory} onClick={()=>{if(chosen){setAssets(v=>[{...chosen,id:Date.now(),category:chosenCategory},...v]);setNotice("已保存到我的素材库（当前演示会话）。");setPanel(null)}}}>保存到素材库</button></div>
      :<div className={css.modalBody}><div className={css.largeArtwork} data-variant={chosen?.style??0}><span>{["✿","🎀","≈","☾","◒","✦"][chosen?.style??0]}</span></div><p>{chosen?.name} · 完整比例预览</p></div>}
    </section></div>:null}
   <footer className={css.foot}><span>演示工作台 · 当前操作仅在此弹窗会话中生效</span><button type="button" onClick={onClose}>关闭</button></footer>
  </dialog>;
}
