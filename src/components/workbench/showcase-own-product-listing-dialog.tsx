"use client";

import {useEffect,useId,useRef,useState,type ChangeEvent} from "react";
import styles from "./showcase-own-product-listing-dialog.module.css";

type Source="img"|"sheet"|"link"|"api";
type Sku={id:number;name:string;draft:string;description:string;images:string[]};
const newSku=(id:number):Sku=>({id,name:"",draft:"",description:"",images:[]});
const sourceOptions:{value:Source;label:string}[]=[
 {value:"img",label:"上传资料"},{value:"sheet",label:"导入表格"},
 {value:"link",label:"商品链接"},{value:"api",label:"API 接入"}
];

export function ShowcaseOwnProductListingDialog({onClose}:{onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null),fileRef=useRef<HTMLInputElement>(null),headingId=useId();
 const [source,setSource]=useState<Source>("img"),[skuType,setSkuType]=useState<"single"|"multi">("multi");
 const [skus,setSkus]=useState<Sku[]>([newSku(1),newSku(2)]),[currentId,setCurrentId]=useState(1);
 const [activeImage,setActiveImage]=useState<string|null>(null),[agent,setAgent]=useState(""),[template,setTemplate]=useState("");
 const [link,setLink]=useState(""),[sheetName,setSheetName]=useState(""),[status,setStatus]=useState("");
 const [loadingImages,setLoadingImages]=useState(false);
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
  if(source==="img"){
   const entries=skuType==="multi"?skus:[skus[0]];
   if(skuType==="multi"&&entries.some(x=>!x.name.trim())){setStatus("请先保存每个 SKU 的名称与规格。");return}
   if(entries.some(x=>x.images.length===0)){setStatus("有 SKU 尚未上传图片，请为每个 SKU 至少上传 1 张图片。");return}
   if(entries.some(x=>!x.description.trim())){setStatus("发现商品基础资料缺项。请在商品管理中统一补全并检查。");return}
   setStatus("前端检测通过：图片与资料已填写。当前为演示环境，不会实际创建或刊登商品。");return;
  }
  if(source==="sheet"){setStatus(sheetName?"已选择表格；字段映射和数据检测需由正式业务接口完成。":"请先选择 Excel 或 CSV 商品表格。");return}
  if(source==="link"){setStatus(link.trim()?"当前演示尚未接入商品链接解析，不会伪造采集结果。":"请填写已接入货盘的商品链接。");return}
  setStatus("当前演示尚未接入真实 API 授权与商品读取服务。");
 };
 const btnText=(id:number)=>skus.find(x=>x.id===id)?.name||`SKU ${id}`;
 return <dialog ref={ref} className={styles.dialog} aria-labelledby={headingId} onCancel={e=>{e.preventDefault();if(activeImage)setActiveImage(null);else onClose()}} onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
  <header className={styles.header}><div><h2 id={headingId}>自有商品一键刊登</h2><p>上传商品资料，按 SKU 整理图片及基础信息，提交后统一检测。</p></div><button type="button" onClick={onClose}>关闭</button></header>
  <div className={styles.content}>
   <section className={styles.panel}><div className={styles.heading}><h3>01&nbsp; 选择导入方式</h3></div>
    <div className={styles.sources} role="radiogroup" aria-label="选择导入方式">{sourceOptions.map(x=><button type="button" key={x.value} role="radio" aria-checked={source===x.value} onClick={()=>onSource(x.value)}>{x.label}<span className={styles.selectDot}/></button>)}</div>
   </section>
   <section className={styles.panel}>
    <div className={styles.heading}><h3>02&nbsp; 商品资料</h3>{source==="img"?<div className={styles.skuSwitch}><span>SKU 类型</span>{[["single","单 SKU"],["multi","多 SKU"]].map(([value,label])=><button type="button" key={value} aria-pressed={skuType===value} onClick={()=>onSkuType(value as "single"|"multi")}>{label}</button>)}</div>:null}</div>
    {source==="img"?<div className={styles.productGrid}>
     {skuType==="multi"?<aside className={styles.skuList}><strong>SKU 列表</strong><small>直接输入名称，点击保存</small>
      <div className={styles.skuItems}>{skus.map(s=><div key={s.id} className={styles.skuItem} data-active={currentId===s.id}>
       <button type="button" className={styles.skuSelect} onClick={()=>setCurrentId(s.id)}>{String(s.id).padStart(2,"0")}</button>
       <input aria-label={`SKU ${s.id} 名称`} placeholder="输入 SKU 名称" maxLength={60} value={s.draft} onFocus={()=>setCurrentId(s.id)} onChange={e=>patch(s.id,{draft:e.target.value})}/>
       <button type="button" onClick={()=>{patch(s.id,{name:s.draft.trim()});setCurrentId(s.id)}}>保存</button>
       <small>{s.images.length?"已上传 "+s.images.length+" 张图片":"未上传图片"}</small>
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
   <section className={styles.panel}><div className={styles.heading}><h3>03&nbsp; AI 能力与生成</h3><span>提交商品进行校验，缺失必填信息统一在商品管理中补全。</span></div>
    <div className={styles.aiRow}><div className={styles.aiOptions}>
     <label>智能体<select aria-label="智能体" value={agent} onChange={e=>{setAgent(e.target.value);setTemplate("")}}><option value="">未选择 · 点击选择</option><option value="商品优化智能体">商品优化智能体</option><option value="POD刊登智能体">POD刊登智能体</option><option value="平台适配智能体">平台适配智能体</option></select></label>
     <label>智能体模板<select aria-label="智能体模板" disabled={!agent} value={template} onChange={e=>setTemplate(e.target.value)}><option value="">请选择智能体模板</option><option value="标准商品优化">标准商品优化</option><option value="基础资料补全">基础资料补全</option></select></label>
    </div><button type="button" className={styles.submit} onClick={validate}>提交检测</button></div>
    <p className={styles.footerHint}>点击检查后自动判断缺项；可批量添加商品并统一检查。</p>
    {status?<p role="status" className={styles.feedback}>{status}</p>:null}
   </section>
  </div>
  {activeImage?<div className={styles.preview} role="dialog" aria-label="图片放大预览" onClick={()=>setActiveImage(null)}><button type="button" onClick={()=>setActiveImage(null)}>关闭预览</button><img alt="商品图片放大预览" src={activeImage}/></div>:null}
 </dialog>;
}
