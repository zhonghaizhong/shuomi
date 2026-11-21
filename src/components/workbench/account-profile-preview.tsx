"use client";

import {useEffect,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import styles from "./account-profile-preview.module.css";
import {showcaseTenant as tenant} from "./account/showcase-tenant";
import {resetLegacyAccountDemoOnce} from "./account/showcase-data-reset";
import {VerificationDocumentCard} from "./account/verification-document-card";

const base="/workbench/account/profile";
type Business={roles:string[];shops:string;platforms:string[];sites:string[];types:string[];supply:string[];services:string[];other:string};
type Account={name:string;country:string;province:string;city:string};
const defaultAccount:Account={name:tenant.username,country:"中国大陆",province:"湖北省",city:"武汉市"};
const defaultBusiness:Business={roles:["跨境电商创业者"],shops:"暂时没有店铺",platforms:[],sites:[],types:[],supply:["暂时没有工厂或供应链资源"],services:[],other:"企业已入驻，尚未开始经营"};
const keys={account:"shuomi-demo-account-settings-SM-ENT-000001",business:"shuomi-demo-business-profile-SM-ENT-000001",security:"shuomi-demo-security-SM-ENT-000001",verification:"shuomi-demo-verification-SM-ENT-000001-v1"};
type Security={phone:string;email:string;passwordUpdated:string};
const defaultSecurity:Security={phone:"测试手机号",email:tenant.email,passwordUpdated:"2026年11月21日（模拟）"};
const readSecurity=():Security=>{try{const raw=localStorage.getItem(keys.security);return raw?{...defaultSecurity,...JSON.parse(raw)}:defaultSecurity}catch{return defaultSecurity}};
const saveSecurity=(data:Security)=>{try{localStorage.setItem(keys.security,JSON.stringify(data));return true}catch{return false}};
const read=<T,>(key:string,fallback:T):T=>{try{const v=sessionStorage.getItem(key);return v?{...fallback,...JSON.parse(v)}:fallback}catch{return fallback}};
const write=(key:string,v:unknown)=>{try{sessionStorage.setItem(key,JSON.stringify(v))}catch{}};
const toggled=(list:string[],entry:string,checked:boolean)=>checked?[...new Set([...list,entry])]:list.filter(x=>x!==entry);
type Mode="overview"|"settings"|"business"|"verification";

function Options({label,values,selected,onChange}:{label:string;values:string[];selected:string[];onChange:(next:string[])=>void}){
 return <fieldset className={styles.options}><legend>{label}</legend><div>{values.map(v=><label key={v}><input type="checkbox" checked={selected.includes(v)} onChange={e=>onChange(toggled(selected,v,e.target.checked))}/><span>{v}</span></label>)}</div></fieldset>;
}
function Header({mode}:{mode:Mode}){
 const title={overview:"账户资料",settings:"账户设置",business:"经营画像",verification:"认证信息"}[mode];
 const desc={overview:"管理个人资料、联系方式和经营画像",settings:"修改账户信息、联系方式与登录安全",business:"让系统理解你的经营阶段、资源条件和实际需求",verification:"完成个人或企业主体认证，便于后续业务服务与合作申请时核验主体信息。"}[mode];
 return <header className={styles.header}><div><small>我的账户 / 账户资料{mode==="overview"?"":" / "+title}</small><h1>{title}</h1><p>{desc}</p></div></header>;
}
function DemoNote({children}:{children:React.ReactNode}){return <p className={styles.note}>{children??"这里仅展示本地演示数据，不会写入真实账户。"}</p>;}
export function AccountProfilePreview({pathname}:{pathname:string}){
 const router=useRouter();
 const mode:Mode=pathname.endsWith("/settings")?"settings":pathname.endsWith("/business")?"business":pathname.endsWith("/verification")?"verification":"overview";
 const go=(path:string)=>router.push(base+path+"?preview=1");
 const [account,setAccount]=useState<Account>(defaultAccount);
 const [business,setBusiness]=useState<Business>(defaultBusiness);
 const [savedAccount,setSavedAccount]=useState<Account>(defaultAccount);
 const [savedBusiness,setSavedBusiness]=useState<Business>(defaultBusiness);
 const [editingBusiness,setEditingBusiness]=useState(false);
 const [identityType,setIdentityType]=useState<"个人认证"|"企业认证">("企业认证");
 const [notice,setNotice]=useState("");
 const [changeContact,setChangeContact]=useState<"更换手机号"|"更换邮箱"|"修改密码"|null>(null);
 const [security,setSecurity]=useState<Security>(defaultSecurity);
 const [securityDraft,setSecurityDraft]=useState("");
 const [securityConfirm,setSecurityConfirm]=useState("");
 const [securityChecked,setSecurityChecked]=useState(false);
 const [securityError,setSecurityError]=useState("");
 const [verificationFiles,setVerificationFiles]=useState<Record<string,string>>({});
 const [personal,setPersonal]=useState({name:tenant.admin as string,id:tenant.identity as string});
 const [enterprise,setEnterprise]=useState({name:tenant.name as string,credit:tenant.credit as string,representative:tenant.admin as string});
 useEffect(()=>{resetLegacyAccountDemoOnce();const a=read(keys.account,defaultAccount),b=read(keys.business,defaultBusiness);setAccount(a);setSavedAccount(a);setBusiness(b);setSavedBusiness(b);setSecurity(readSecurity());try{const record=JSON.parse(localStorage.getItem(keys.verification)||"null");if(record?.personal?.name&&record?.personal?.id)setPersonal(record.personal);if(record?.enterprise?.name&&record?.enterprise?.credit&&record?.enterprise?.representative)setEnterprise(record.enterprise)}catch{}},[]);
 useEffect(()=>{setNotice("");setChangeContact(null);setEditingBusiness(false)},[pathname]);
 useEffect(()=>{if(!changeContact)return;const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")setChangeContact(null)};document.addEventListener("keydown",onKey);return()=>document.removeEventListener("keydown",onKey)},[changeContact]);
 const saveAccount=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();const v={...account,name:account.name.trim()};if(!v.name){setNotice("用户名不能为空");return;}write(keys.account,v);setSavedAccount(v);setNotice("账户展示资料已保存到本次演示浏览器，不会修改真实账户。");};
 const saveBusiness=(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();write(keys.business,business);setSavedBusiness(business);setEditingBusiness(false);setNotice("经营画像已保存在本地演示中，真实资料未更改。");};
 const saveFile=(label:string,files:FileList|null)=>{
   if(!files?.length)return;
   const f=files[0];
   if(f.size>20*1024*1024){setNotice("文件过大：单个文件不得超过20MB。");return;}
   if(!["image/jpeg","image/png","application/pdf"].includes(f.type)){setNotice("请上传 JPG、PNG 或 PDF。");return;}
   setVerificationFiles(v=>({...v,[label]:f.name}));
 };
 const verify=(event:FormEvent<HTMLFormElement>)=>{
   event.preventDefault();
   if(!personal.name.trim()||!personal.id.trim()||!enterprise.name.trim()||!enterprise.credit.trim()||!enterprise.representative.trim()){setNotice("请填写完整的身份和企业资料。");return}
   try{localStorage.setItem(keys.verification,JSON.stringify({personal,enterprise}))}catch{setNotice("浏览器本地保存失败，本次资料未归档。");return}
   setNotice("模拟认证资料已核对并保存；个人与企业审核视为通过，未发起真实认证。");
 };
 const closeContact=()=>{setChangeContact(null);setSecurityDraft("");setSecurityConfirm("");setSecurityChecked(false);setSecurityError("")};
 const openSecurity=(action:"更换手机号"|"更换邮箱"|"修改密码")=>{setSecurityDraft("");setSecurityConfirm("");setSecurityChecked(false);setSecurityError("");setChangeContact(action)};
 const validSecurity=()=>{
   if(changeContact==="更换手机号"){
     if(!/^\+?[0-9][0-9\s-]{6,19}$/.test(securityDraft.trim()))return "请输入有效的手机号（至少 7 位数字）。";
     if(securityDraft.trim()===security.phone)return "新手机号不能与当前号码相同。";
   }else if(changeContact==="更换邮箱"){
     if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(securityDraft.trim()))return "请输入有效的电子邮箱地址。";
     if(securityDraft.trim().toLowerCase()===security.email.toLowerCase())return "新邮箱不能与当前邮箱相同。";
   }else if(changeContact==="修改密码"){
     if(securityDraft.length<8)return "新密码不得少于 8 个字符。";
     if(securityDraft!==securityConfirm)return "两次输入的密码不一致。";
   }
   return "";
 };
 const simulateSecurityCheck=()=>{const error=validSecurity();setSecurityError(error);setSecurityChecked(!error)};
 const commitSecurity=(event:FormEvent<HTMLFormElement>)=>{
   event.preventDefault();
   const error=validSecurity();if(error){setSecurityError(error);setSecurityChecked(false);return}
   if(!securityChecked){setSecurityError("请先完成模拟验证。");return}
   const next:Security=changeContact==="更换手机号"?{...security,phone:securityDraft.trim()}:changeContact==="更换邮箱"?{...security,email:securityDraft.trim()}:{...security,passwordUpdated:new Date().toLocaleString("zh-CN")};
   if(!saveSecurity(next)){setSecurityError("本地浏览器存储不可用，本次修改未保存。");return}
   setSecurity(next);
   setNotice(changeContact==="修改密码"?"模拟密码修改成功；未保存真实密码，也不会影响登录。":changeContact+"已模拟完成，账户资料已同步更新；不会修改真实账号。");
   closeContact();
 };
 return <div className={styles.page} data-account-profile-page={mode}>
   <Header mode={mode}/>
   <nav className={styles.profileSubnav} aria-label="账户资料二级导航">{([["账户概览",""],["账户设置","/settings"],["经营画像","/business"],["认证信息","/verification"]] as const).map(([title,route])=><button key={title} type="button" aria-current={pathname===base+route?"page":undefined} onClick={()=>go(route)}>{title}</button>)}</nav>
   {mode==="overview"&&<>
     <section className={styles.profileTop}><div><div className={styles.avatar} aria-hidden="true">S</div><div><h2>{tenant.admin}</h2><p>用户名：{savedAccount.name} · 手机号已验证</p><span className={styles.success}>已实名认证 · 示例状态</span></div></div><dl><div><dt>用户编号</dt><dd>{tenant.userId}</dd></div><div><dt>注册时间</dt><dd>2026年11月21日</dd></div><div><dt>最近登录</dt><dd>演示时间 14:32</dd></div></dl></section>
     <div className={styles.overviewGrid}><section className={styles.panel}><header className={styles.panelHeader}><div><h2>账户设置</h2><p>用于账户识别与联系方式管理</p></div><button className={styles.primary} onClick={()=>go("/settings")}>编辑资料</button></header><dl className={styles.facts}>{[["用户名",savedAccount.name],["手机号码",security.phone+" · 已验证（模拟）"],["邮箱地址",security.email+" · 已验证（模拟）"],["所在地区",[savedAccount.country,savedAccount.province,savedAccount.city].filter(Boolean).join(" · ")],["注册时间","2026年11月21日"]].map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>
      <h3>账号状态</h3><div className={styles.stateGrid}>{[["手机验证","已完成","用于验证码登录与安全验证"],["邮箱地址","已验证","用于接收账户与安全通知"],["登录密码","已设置","上次修改："+security.passwordUpdated]].map(([name,state,hint])=><article key={name}><strong>{name}</strong><b className={styles.success}>{state}</b><small>{hint}</small></article>)}</div></section>
      <section className={styles.panel}><header className={styles.panelHeader}><div><h2>经营画像</h2><p>帮助系统理解你的业务背景</p></div><button onClick={()=>go("/business")}>编辑画像</button></header><dl className={styles.pairs}>{[["用户角色",savedBusiness.roles.join("、")],["店铺情况",savedBusiness.shops],["工厂情况",savedBusiness.supply.join("、")],["经营平台",savedBusiness.platforms.join("、")],["经营站点",savedBusiness.sites.join("、")],["店铺类型",savedBusiness.types.join("、")],["所需服务",savedBusiness.services.join("、")]].map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value||"未设置"}</dd></div>)}</dl></section></div>
     <section className={styles.linkPanel}><h2>认证信息</h2><p>按个人或企业主体分别核对认证资料与状态。</p><button onClick={()=>go("/verification")}>查看认证信息</button></section>
   </>}
   {mode==="settings"&&<form className={styles.settings} onSubmit={saveAccount} onReset={()=>{setAccount(savedAccount);setNotice("");}}>
      <section className={styles.panel}><header className={styles.panelHeader}><h2>账户信息</h2><p>用户名用于平台内展示；地区信息用于本地化服务</p></header><div className={styles.fields}>
       <label>用户名<input aria-label="用户名" required value={account.name} onChange={e=>setAccount(v=>({...v,name:e.target.value}))} maxLength={45}/><small>用于平台内展示，不作为登录账号</small></label>
       <label>国家 / 地区<input aria-label="国家 / 地区" value={account.country} onChange={e=>setAccount(v=>({...v,country:e.target.value}))}/></label>
       <label>省 / 州<input aria-label="省 / 州" value={account.province} onChange={e=>setAccount(v=>({...v,province:e.target.value}))}/></label>
       <label>城市<input aria-label="城市" value={account.city} onChange={e=>setAccount(v=>({...v,city:e.target.value}))}/></label>
      </div></section>
      <section className={styles.panel}><header className={styles.panelHeader}><h2>联系方式</h2><p>更换手机号或邮箱时，需要单独完成身份验证</p></header><div className={styles.contacts}>{[["手机号",security.phone,"用于验证码登录与安全验证","更换手机号"],["邮箱",security.email,"用于接收账户与安全通知","更换邮箱"]].map(([name,value,description,action])=><article key={name}><div className={styles.identityIcon} aria-hidden="true">{name==="手机号"?"M":"@"}</div><div><strong>{name} <span className={styles.success}>已验证</span></strong><p>{value}</p><small>{description}</small></div><button type="button" onClick={()=>openSecurity(action as "更换手机号"|"更换邮箱")}>{action}</button></article>)}</div></section>
      <section className={styles.panel}><header className={styles.panelHeader}><h2>登录与安全</h2><p>通过手机验证码修改登录密码</p></header><div className={styles.contacts}><article><div className={styles.identityIcon} aria-hidden="true">••</div><div><strong>登录密码 <span className={styles.success}>已设置</span></strong><small>上次修改：{security.passwordUpdated}</small></div><button type="button" onClick={()=>openSecurity("修改密码")}>修改密码</button></article></div></section>
      <div className={styles.actions}><span>联系方式及密码操作均为模拟，验证自动通过后保存到当前浏览器，不影响真实登录。</span><button type="reset">取消</button><button className={styles.primary} type="submit">保存更改</button></div>
   </form>}
   {mode==="business"&&<>
      <section className={styles.intro}><h2>完善经营画像，让系统知道如何为你工作</h2><p>画像不会改变首页，也不会自动替你做决定；它用于业务分类、统计分析和服务沟通，让智能体与服务更贴近你的真实经营情况。</p></section>
      {!editingBusiness?<><div className={styles.toolbar}><h2>当前画像资料</h2><button className={styles.primary} onClick={()=>setEditingBusiness(true)}>维护经营画像</button></div>
      <div className={styles.benefits}>{[["01","让智能体更懂你的业务","结合角色、店铺阶段、平台与站点，减少重复说明。"],["02","让执行建议更符合实际","根据店铺类型、工厂与供应链条件判断可执行范围。"],["03","让服务沟通更高效","提前了解所需服务，减少无关信息和重复沟通。"]].map(([n,title,desc])=><article key={n}><b>{n}</b><h3>{title}</h3><p>{desc}</p></article>)}</div>
      <section className={styles.panel}><header className={styles.panelHeader}><h2>当前经营画像</h2><small>可随业务变化重新维护 · 演示资料</small></header><dl className={styles.businessSummary}>{[["角色",savedBusiness.roles],["店铺",savedBusiness.shops],["平台",savedBusiness.platforms],["站点",savedBusiness.sites],["工厂 / 供应链",savedBusiness.supply],["服务需求",savedBusiness.services]].map(([name,value])=><div key={String(name)}><dt>{name}</dt><dd>{Array.isArray(value)?value.join("、"):value||"未设置"}</dd></div>)}</dl></section></>:<form className={styles.panel} onSubmit={saveBusiness}><header className={styles.panelHeader}><div><h2>维护经营画像</h2><p>按当前经营情况选择，支持多选，可随时调整</p></div></header><div className={styles.businessForm}>
        <Options label="1. 你是什么角色？" values={["跨境电商创业者","跨境电商卖家","工厂或供应商","企业电商团队","OPC电商社区或园区","电商服务商","其他"]} selected={business.roles} onChange={v=>setBusiness(x=>({...x,roles:v}))}/>
        <fieldset className={styles.options}><legend>2. 你目前有没有店铺？</legend><div>{["暂时没有店铺","正在准备开店","已有店铺","有多个店铺或店群"].map(x=><label key={x}><input type="radio" name="shop-status" checked={business.shops===x} onChange={()=>setBusiness(v=>({...v,shops:x}))}/>{x}</label>)}</div></fieldset>
        <div className={styles.optionStack}><h3>3. 选择店铺平台、经营站点与店铺类型</h3><Options label="店铺平台（可多选）" values={["Amazon","SHEIN","Temu","TikTok Shop","Walmart","Shopee","Lazada","AliExpress","Etsy","独立站"]} selected={business.platforms} onChange={v=>setBusiness(x=>({...x,platforms:v}))}/><Options label="经营站点（可多选）" values={["美国站","加拿大站","日本站","英国站","欧洲站"]} selected={business.sites} onChange={v=>setBusiness(x=>({...x,sites:v}))}/><Options label="店铺类型（可多选）" values={["全托店","半托店","自营店"]} selected={business.types} onChange={v=>setBusiness(x=>({...x,types:v}))}/></div>
        <div className={styles.optionStack}><Options label="4. 你是否拥有工厂或供应链？" values={["有自有工厂","有长期合作工厂","有稳定供应链资源","暂时没有工厂或供应链资源","其他"]} selected={business.supply} onChange={v=>setBusiness(x=>({...x,supply:v}))}/><label>其他情况<input value={business.other} onChange={e=>setBusiness(v=>({...v,other:e.target.value}))} placeholder="按需填写其他情况"/></label></div>
        <Options label="5. 你目前需要什么服务？" values={["选品分析","店铺运营","智能商品优化","供应链对接","AI团队协作","商品刊登"]} selected={business.services} onChange={v=>setBusiness(x=>({...x,services:v}))}/>
       </div><DemoNote>经营画像仅用于需求识别与服务推荐，不会自动修改店铺设置或替你执行操作。</DemoNote><footer className={styles.actions}><button type="button" onClick={()=>{setBusiness(savedBusiness);setEditingBusiness(false)}}>取消</button><button className={styles.primary} type="submit">保存修改</button></footer></form>}
   </>}
   {mode==="verification"&&<>
      <div className={styles.tabs} role="tablist" aria-label="主体认证类型">{(["个人认证","企业认证"] as const).map(v=><button role="tab" key={v} aria-selected={identityType===v} onClick={()=>{setIdentityType(v);setNotice("");setVerificationFiles({})}}>{v}</button>)}<span>{identityType==="个人认证"?"适用于个人账户主体认证":"适用于公司或其他企业主体认证"}</span></div>
      <section className={styles.panel}><header className={styles.panelHeader}><div><h2>{identityType}</h2><p>认证流程：提交资料 · 信息审核 · 认证完成</p></div><span className={styles.success}>当前状态：已认证（模拟）</span></header>
       <form onSubmit={verify} className={styles.verifyForm}><DemoNote>已入驻测试企业，以下为已认证的虚构资料，不是实际实名或工商核验结果。</DemoNote><h3>{identityType==="个人认证"?"个人身份信息":"企业主体信息"}</h3><p>{identityType==="个人认证"?"请确保身份信息与证件内容一致":"请确保企业名称、信用代码与营业执照一致"}</p>
       {identityType==="个人认证"?<><div className={styles.fields}><label>真实姓名<input autoComplete="off" required placeholder="请输入真实姓名" value={personal.name} onChange={e=>setPersonal(v=>({...v,name:e.target.value}))}/></label><label>身份证号码<input autoComplete="off" required placeholder="请输入身份证号码" value={personal.id} onChange={e=>setPersonal(v=>({...v,id:e.target.value}))}/></label></div><VerificationDocumentCard kind="identity" information={[["真实姓名",personal.name],["身份证号码",personal.id],["归档状态","已归档（模拟）"],["实名状态","已认证（模拟）"]]}/><p>个人身份归档信息已同步到演示档案；如需变更证件，可使用上方更换文件操作。</p></>:<><div className={styles.fields}><label>企业名称<input required value={enterprise.name} onChange={e=>setEnterprise(v=>({...v,name:e.target.value}))} placeholder="请输入营业执照上的企业名称"/></label><label>统一社会信用代码<input required value={enterprise.credit} onChange={e=>setEnterprise(v=>({...v,credit:e.target.value}))} placeholder="请输入统一社会信用代码"/></label><label>法定代表人<input required value={enterprise.representative} onChange={e=>setEnterprise(v=>({...v,representative:e.target.value}))} placeholder="请输入法定代表人姓名"/></label></div><dl className={styles.facts}>{[["企业类型",tenant.type],["注册资本",tenant.capital],["注册地址",tenant.address],["经营范围",tenant.scope],["营业期限",tenant.term]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><VerificationDocumentCard kind="business" information={[["企业名称",enterprise.name],["统一社会信用代码",enterprise.credit],["法定代表人",enterprise.representative],["企业类型",tenant.type],["注册资本",tenant.capital],["营业期限",tenant.term],["经营范围",tenant.scope]]}/><p>企业证照归档信息已同步到演示档案；如需变更证照，可使用上方更换文件操作。</p></>}
       <footer className={styles.actions}><span>当前认证状态为模拟通过；文件更换与重新识别仅影响演示档案，不会发起真实后台审核。</span><button className={styles.primary} type="submit">核对认证资料</button></footer></form>
      </section>
   </>}
   {notice&&<div role="status" className={styles.feedback}>{notice}<button onClick={()=>setNotice("")}>关闭</button></div>}
   {changeContact&&<div className={styles.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)closeContact()}}><section className={styles.dialog} role="dialog" aria-modal="true" aria-label={changeContact}><header><h2>{changeContact}</h2><button type="button" onClick={closeContact} aria-label="关闭操作">×</button></header>
    <form className={styles.securityForm} onSubmit={commitSecurity}>
      <p>填写信息后点击模拟验证；系统将假设安全审核通过，不会发送真实验证码或修改真实账户。</p>
      {changeContact!=="修改密码"&&<div className={styles.securityCurrent}><span>当前{changeContact==="更换手机号"?"手机号":"邮箱地址"}</span><strong>{changeContact==="更换手机号"?security.phone:security.email}</strong></div>}
      <label>{changeContact==="更换手机号"?"新手机号":changeContact==="更换邮箱"?"新邮箱地址":"新密码"}
        <input aria-label={changeContact==="更换手机号"?"新手机号":changeContact==="更换邮箱"?"新邮箱地址":"新密码"} autoComplete="off" type={changeContact==="修改密码"?"password":changeContact==="更换邮箱"?"email":"tel"} value={securityDraft} onChange={e=>{setSecurityDraft(e.target.value);setSecurityChecked(false);setSecurityError("")}} required placeholder={changeContact==="修改密码"?"至少 8 位，不保存真实密码":"请输入需要绑定的新资料"}/>
      </label>
      {changeContact==="修改密码"&&<label>确认新密码<input type="password" autoComplete="off" aria-label="确认新密码" value={securityConfirm} onChange={e=>{setSecurityConfirm(e.target.value);setSecurityChecked(false);setSecurityError("")}} required/></label>}
      <div className={styles.securityCheck}><button type="button" onClick={simulateSecurityCheck}>{securityChecked?"重新模拟验证":"模拟验证通过"}</button><span className={securityChecked?styles.success:""}>{securityChecked?"✓ 模拟安全审核已通过":"验证状态：待验证"}</span></div>
      {securityError&&<p className={styles.securityError} role="alert">{securityError}</p>}
      <footer><button type="button" onClick={closeContact}>取消</button><button className={styles.primary} type="submit" disabled={!securityChecked}>确认{changeContact==="修改密码"?"修改":"更换"}</button></footer>
    </form>
  </section></div>}
  </div>;
}
