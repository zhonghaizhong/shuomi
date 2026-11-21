"use client";
import {useEffect,useState,type ChangeEvent} from "react";
import s from "./verification-document-card.module.css";

type Kind="business"|"identity";
type FileMeta={name:string;size:number;type:string;at:number};
type Archive=Record<string,FileMeta>;
const STORAGE="shuomi-demo-credential-files-SM-ENT-000001";
const labels={business:"营业执照",identity:"个人身份证"} as const;
const fields={business:["营业执照"],identity:["身份证人像面","身份证国徽面"]} as const;
function load():Archive{try{const obj=JSON.parse(localStorage.getItem(STORAGE)||"{}");return obj&&typeof obj==="object"&&!Array.isArray(obj)?obj:{}}catch{return {}}}
const stamp=(n:number)=>new Date(n).toLocaleString("zh-CN");
const format=(size:number)=>size<1024*1024?(size/1024).toFixed(1)+" KB":(size/1024/1024).toFixed(2)+" MB";
export function VerificationDocumentCard({kind,information}:{kind:Kind;information:readonly (readonly [string,string])[]}){
 const [archive,setArchive]=useState<Archive>({});
 const [modal,setModal]=useState<"view"|"replace"|null>(null);
 const [pending,setPending]=useState<Record<string,File>>({});
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");
 const [lastRecognized,setLastRecognized]=useState("");
 const [preview,setPreview]=useState<Record<string,string>>({});
 const label=labels[kind];
 const required=[...fields[kind]];
 useEffect(()=>{setArchive(load())},[]);
 useEffect(()=>()=>{Object.values(preview).forEach(x=>URL.revokeObjectURL(x))},[preview]);
 const close=()=>{setModal(null);setPending({});setError("")};
 const open=(mode:"view"|"replace")=>{setNotice("");setError("");setPending({});setModal(mode)};
 const pick=(key:string,event:ChangeEvent<HTMLInputElement>)=>{
  const file=event.target.files?.[0];if(!file)return;
  if(!["image/jpeg","image/png","application/pdf"].includes(file.type)){setError("仅支持 JPG、PNG、PDF 文件。");return}
  if(file.size>20*1024*1024){setError("单个文件不能超过 20 MB。");return}
  setError("");setPending(p=>({...p,[key]:file}));
 };
 const save=()=>{
  if(required.some(x=>!pending[x])){setError("请选择"+required.join("和")+"后确认。");return}
  const now=Date.now();const next={...archive};
  required.forEach(key=>{const f=pending[key];next[key]={name:f.name,size:f.size,type:f.type,at:now}});
  try{localStorage.setItem(STORAGE,JSON.stringify(next))}catch{setError("浏览器存储不可用，未保存修改。");return}
  setArchive(next);
  // The local preview exists only for this tab; never persist actual ID/license contents.
  setPreview(old=>{const nextPreview={...old};required.forEach(key=>{if(nextPreview[key])URL.revokeObjectURL(nextPreview[key]);nextPreview[key]=URL.createObjectURL(pending[key])});return nextPreview});
  close();setNotice("已更新本地演示资料，模拟识别和审核已通过。")
 };
 const recognize=()=>{setLastRecognized(stamp(Date.now()));setNotice("已完成模拟识别，企业与身份信息以当前演示档案为准；未向任何身份核验服务发送资料。")};
 return <section className={s.card} data-document-kind={kind}>
  <header className={s.heading}><div className={s.title}><span className={s.icon} aria-hidden="true">{kind==="business"?"▣":"▤"}</span><div><h3>{label}</h3><p>{kind==="business"?"企业主体资料已归档，供企业认证和经营服务引用。":"个人身份资料已归档，供账户安全与实名认证使用。"}</p></div></div><div className={s.statuses}><span>● 已归档（模拟）</span><span>● 已认证（模拟）</span></div></header>
  <div className={s.columns}><section className={s.info}><h4>识别信息</h4><dl>{information.map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl></section><aside className={s.filePanel}><div className={s.fileHead}><span className={s.documentIcon} aria-hidden="true">▤</span><div><strong>{kind==="business"?"企业证照资料":"身份证正反面资料"}</strong><small>识别完成 · 模拟审核通过</small></div></div><div className={s.fileDetails}>{required.map(key=><div key={key}><span>{key}</span><strong>{archive[key]?.name||"已归档示例资料（无真实文件）"}</strong><small>{archive[key]?"大小 "+format(archive[key].size)+" · "+stamp(archive[key].at):"模拟归档 · 未存储证件影像"}</small></div>)}</div><div className={s.actions}><button type="button" onClick={()=>open("view")}>查看{kind==="business"?"证照":"证件"}</button><button type="button" className={s.primary} onClick={()=>open("replace")}>更换文件</button><button type="button" onClick={recognize}>重新识别</button></div></aside></div>
  {lastRecognized&&<p className={s.recognition}>最近模拟识别：{lastRecognized}</p>}
  <footer className={s.foot}>演示环境默认审核通过；仅保存文件名称等本地演示信息，不上传真实证件，不发起真实核验。</footer>
  {notice&&<div className={s.notice} role="status">{notice}<button type="button" onClick={()=>setNotice("")} aria-label="关闭提示">×</button></div>}
  {modal&&<div className={s.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><section className={s.dialog} role="dialog" aria-modal="true" aria-label={modal==="view"?"查看"+label:"更换"+label}><header><h2>{modal==="view"?"查看"+label:"更换"+label}</h2><button type="button" onClick={close} aria-label="关闭弹窗">×</button></header>
   {modal==="view"?<><p>当前为模拟归档摘要。未上传文件时不生成虚假的证件影像；如本次会话已选择图片或 PDF，可在下方预览。</p><div className={s.previewGrid}>{required.map(key=><div className={s.previewTile} key={key}><strong>{key}</strong>{preview[key]?(archive[key]?.type==="application/pdf"?<a href={preview[key]} target="_blank" rel="noreferrer">打开本次选择的 PDF</a>:<img alt={key+"（本次浏览器选择）"} src={preview[key]}/>):<div className={s.noPreview}>模拟证件档案<br/>无可显示的真实影像</div>}<small>{archive[key]?.name||"已归档示例资料"}</small></div>)}</div><div className={s.info}><h4>信息摘要</h4><dl>{information.map(([a,b])=><div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl></div><footer><button type="button" onClick={close}>关闭</button><button type="button" className={s.primary} onClick={()=>open("replace")}>更换文件</button></footer></>:
   <><p>选择新的资料文件，演示系统自动视为识别及审核通过。文件内容只用于当前页面临时预览，不会上传或永久保存。</p><div className={s.uploadGrid}>{required.map(key=><label className={s.uploadItem} key={key}><strong>{key}</strong><span>{pending[key]?"已选择："+pending[key].name:"选择 JPG / PNG / PDF 文件"}</span><input type="file" accept=".jpg,.jpeg,.png,.pdf" aria-label={"选择"+key+"文件"} onChange={e=>pick(key,e)}/><small>单个文件不超过 20 MB</small></label>)}</div>{error&&<p role="alert" className={s.error}>{error}</p>}<footer><button type="button" onClick={close}>取消</button><button type="button" className={s.primary} onClick={save} disabled={required.some(x=>!pending[x])}>上传并更新（模拟）</button></footer></>}
  </section></div>}
 </section>;
}
