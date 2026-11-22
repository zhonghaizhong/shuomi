"use client";
import {useEffect,useState} from "react";
import styles from "./showcase-payout-configurator.module.css";

type Kind="微信"|"支付宝"|"银行卡";
type SavedAccount={kind:Kind;masked:string;bank?:string;id:string};
type Stage="choose"|"edit"|"verify";
const methods:Kind[]=["微信","支付宝","银行卡"];
const storageKey=(organizationId:string,memberId:string)=>"shuomi-demo-payout-methods-v1-"+encodeURIComponent(organizationId)+"::"+encodeURIComponent(memberId);
function readAccounts(key:string,legacy:string):SavedAccount[]{
 try{
  const raw=localStorage.getItem(key);
  if(raw){
   const a=JSON.parse(raw);
   if(Array.isArray(a))return a.filter(x=>methods.includes(x.kind)&&typeof x.masked==="string"&&typeof x.id==="string");
  }
 }catch{}
 // Existing demo identifier is not discarded on migration.
 return legacy?[{kind:"支付宝",masked:legacy,id:"legacy"}]:[];
}
const mask=(v:string)=>{
 const value=v.trim();if(value.length<=4)return "*".repeat(value.length);
 return value.slice(0,2)+"*".repeat(Math.min(6,value.length-4))+value.slice(-2);
};
export function PayoutConfigurator({organizationId,memberId,current,onSave}:{organizationId:string;memberId:string;current:string;onSave:(value:string)=>boolean}){
 const key=storageKey(organizationId,memberId);
 const [accounts,setAccounts]=useState<SavedAccount[]>([]);
 const [stage,setStage]=useState<Stage>("choose");
 const [kind,setKind]=useState<Kind>("微信");
 const [editingId,setEditingId]=useState<string|null>(null);
 const [recipient,setRecipient]=useState("");
 const [identifier,setIdentifier]=useState("");
 const [bank,setBank]=useState("");
 const [defaultChoice,setDefaultChoice]=useState(true);
 const [file,setFile]=useState<File|null>(null);
 const [verification,setVerification]=useState<"手机验证"|"邮箱验证"|null>(null);
 const [error,setError]=useState("");
 useEffect(()=>{setAccounts(readAccounts(key,current))},[key,current]);
 const label=(a:SavedAccount)=>a.kind+" · "+a.masked;
 const begin=(target:Kind,id:string|null=null)=>{
  setKind(target);setEditingId(id);setStage("edit");setRecipient("");setIdentifier("");setBank("");
  setFile(null);setDefaultChoice(!current||accounts.some(a=>a.id===id&&label(a)===current));setError("");
 };
 const chooseDefault=(a:SavedAccount)=>{
  const next=label(a);
  if(!onSave(next)){setError("账户设置保存失败，请重试。");return}
  setError("");setAccounts(old=>old.slice());
 };
 const validate=()=>{
  if(recipient.trim().length<2){setError("请输入收款人姓名（演示请使用虚构信息）。");return}
  if(kind==="银行卡"){
   if(!/^\d{12,19}$/.test(identifier.trim())){setError("请输入12至19位演示银行卡号。");return}
   if(bank.trim().length<2){setError("请输入开户银行。");return}
  }else if(identifier.trim().length<4){setError(kind==="微信"?"请输入微信号。":"请输入支付宝账号。");return}
  if(file&&(!["image/png","image/jpeg"].includes(file.type)||file.size>1024*1024)){setError("收款码仅支持1MB以内的 JPG / PNG。");return}
  setStage("verify");setVerification(null);setError("");
 };
 const complete=()=>{
  if(!verification){setError("请选择手机验证或邮箱验证。");return}
  const item:SavedAccount={kind,masked:mask(identifier),id:editingId||("demo-"+Date.now()),...(kind==="银行卡"?{bank:bank.trim()}: {})};
  const next=editingId?accounts.map(a=>a.id===editingId?item:a):[...accounts,item];
  const chosen=defaultChoice||!current?label(item):current;
  if(!onSave(chosen)){setError("演示账户保存失败，请重试。");return}
  try{localStorage.setItem(key,JSON.stringify(next));setAccounts(next);setStage("choose");setError("")}
  catch{setError("当前浏览器无法保存账户列表，请检查存储空间。")}
 };
 if(stage==="choose")return <div className={styles.container}>
  <p className={styles.explanation}>选择一种提现到账方式进行配置。可以保存多个演示收款账户，并将其中一个设为默认。</p>
  <div className={styles.methodList}>{methods.map(m=>{
   const saved=accounts.filter(a=>a.kind===m);
   return <section key={m} className={styles.method}>
    <div className={styles.methodHeading}><strong>{m}</strong><span>{saved.length?saved.length+" 个已配置":"未配置"}</span></div>
    {saved.map(a=><div className={styles.account} key={a.id}>
      <div><span>{label(a)}</span>{current===label(a)&&<small>默认收款</small>}</div>
      <div className={styles.actions}><button type="button" onClick={()=>begin(m,a.id)}>修改</button><button type="button" disabled={current===label(a)} onClick={()=>chooseDefault(a)}>{current===label(a)?"默认":"设为默认"}</button></div>
    </div>)}
    <button type="button" className={styles.add} onClick={()=>begin(m)}> {saved.length?"添加其他"+m+"账户":"设置"+m+"账户"}</button>
   </section>;
  })}</div>
  <p className={styles.tip}>演示模式：不会发起真实转账、短信或邮箱验证。请勿填写真实姓名、银行卡号或支付账号。</p>
  {error&&<p role="alert" className={styles.error}>{error}</p>}
 </div>;
 if(stage==="edit")return <div className={styles.container}>
  <p className={styles.explanation}>配置{kind}账户 · 填写并确认收款信息</p>
  <div role="group" aria-label="收款方式" className={styles.tabs}>{methods.map(m=><button key={m} type="button" aria-pressed={kind===m} onClick={()=>begin(m)}>{m}</button>)}</div>
  <label className={styles.field}>{kind==="银行卡"?"持卡人姓名":"收款人姓名"}<input aria-label={kind==="银行卡"?"持卡人姓名":"收款人姓名"} value={recipient} onChange={e=>setRecipient(e.target.value)} placeholder={kind==="银行卡"?"请输入持卡人姓名":"请输入实名姓名"} autoComplete="off"/></label>
  <label className={styles.field}>{kind==="银行卡"?"银行卡号":kind==="微信"?"微信号":"支付宝账号"}<input aria-label={kind==="银行卡"?"银行卡号":kind==="微信"?"微信号":"支付宝账号"} value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder={kind==="银行卡"?"请输入银行卡号":kind==="微信"?"请输入微信号":"请输入手机号或邮箱"} autoComplete="off"/></label>
  {kind==="银行卡"&&<label className={styles.field}>开户银行<input aria-label="开户银行" value={bank} onChange={e=>setBank(e.target.value)} placeholder="请输入开户银行"/></label>}
  {kind!=="银行卡"&&<label className={styles.field}>收款码图片（可选）<input aria-label="收款码图片" type="file" accept="image/png,image/jpeg" onChange={e=>setFile(e.target.files?.[0]||null)}/><small>{file?"已选择："+file.name:"支持 JPG / PNG，仅本次配置展示，不存储原始图片"}</small></label>}
  <label className={styles.check}><input type="checkbox" checked={defaultChoice} onChange={e=>setDefaultChoice(e.target.checked)}/><span>设为默认收款方式<small>提现时优先使用此账户</small></span></label>
  <p className={styles.tip}>请确保收款账户与实名认证信息一致。演示模式不校验真实身份，请使用虚构数据。</p>
  {error&&<p role="alert" className={styles.error}>{error}</p>}
  <div className={styles.footer}><button type="button" onClick={()=>{setStage("choose");setError("")}}>取消</button><button type="button" className={styles.primary} onClick={validate}>保存并验证</button></div>
 </div>;
 return <div className={styles.container}>
  <h3 className={styles.verifyTitle}>安全验证</h3><p className={styles.explanation}>修改收款账户前，请验证当前账号身份。</p>
  <div className={styles.security}>{(["手机验证","邮箱验证"] as const).map(x=><div className={styles.verifyRow} key={x}><span>{x}<small>演示验证，不发送真实验证码</small></span><button type="button" onClick={()=>{setVerification(x);setError("")}}>{verification===x?"已选择":"去验证"}</button></div>)}</div>
  <p className={styles.tip}>选择演示验证方式后，确认即视为本次模拟通过；正式环境必须由服务端完成真实身份验证。</p>
  {error&&<p role="alert" className={styles.error}>{error}</p>}
  <div className={styles.footer}><button type="button" onClick={()=>{setStage("edit");setError("")}}>返回修改</button><button type="button" className={styles.primary} disabled={!verification} onClick={complete}>确认模拟验证并保存</button></div>
 </div>;
}
