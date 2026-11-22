import { useEffect, useRef, useState } from "react";
import { Bell, Headset, LogOut, Mail, MoonStar, Sun, UserRound, X, ShieldAlert, UserCircle2, Send, ArrowLeft, CheckCheck, Clock3, UsersRound, Building2, Check, Search } from "lucide-react";
import {showcaseTenant as tenant} from "@/components/workbench/account/showcase-tenant";
import type {Member} from "@/components/workbench/account/showcase-account-state";
import type {DemoIdentity,DemoOrganization} from "./demo-identity";

export type Notice = { id:number; title:string; body:string; time:string; type:string; category:"official"|"business" };
export const demoNotices:Notice[] = [
 {id:1,title:"AI工作台 2.0 能力升级",body:"新增多店铺诊断、任务自动拆解与项目模板能力。",time:"今天 10:24",type:"产品更新",category:"official"},
 {id:2,title:"平台服务维护通知",body:"本周日 02:00–04:00 将进行数据服务升级，不影响已运行任务。",time:"昨天 18:30",type:"系统公告",category:"official"},
 {id:3,title:"OPC 电商社区线上分享会开放报名",body:"了解一人 + AI 团队的经营模式与优秀商家实践案例。",time:"8月10日",type:"活动通知",category:"official"},
 {id:4,title:"隐私政策与数据授权规则更新",body:"进一步明确店铺数据调用范围、授权期限与撤销方式。",time:"8月08日",type:"规则更新",category:"official"},
 {id:5,title:"店铺经营状态提醒",body:"有店铺经营指标需要关注，可前往运营驾驶舱查看详细信息。",time:"今天 09:40",type:"经营通知",category:"business"},
 {id:6,title:"企业资源用量提醒",body:"可前往套餐与权益查看资源使用情况和可用额度。",time:"昨天 16:20",type:"用量提醒",category:"business"}
];

export function ShowcaseTopbarActions({ navigate, pathname, light, onTheme, read, identity, organizations, members, onSwitchIdentity }: {
 navigate:(path:string)=>void; pathname:string; light:boolean; onTheme:()=>void; read:number[];
 identity:DemoIdentity; organizations:DemoOrganization[]; members:Member[];
 onSwitchIdentity:(next:DemoIdentity)=>void
}) {
 const [panel,setPanel]=useState<"support"|"account"|null>(null);
 const [accountView,setAccountView]=useState<"menu"|"switch">("menu");
 const [switchTab,setSwitchTab]=useState<"members"|"organizations">("members");
 const [pendingIdentity,setPendingIdentity]=useState<DemoIdentity>(identity);
 const [switchQuery,setSwitchQuery]=useState("");
 const [profileName,setProfileName]=useState(tenant.username);
 const [profileEmail,setProfileEmail]=useState(tenant.email);
 const [step,setStep]=useState<"options"|"online"|"message">("options");
 const [message,setMessage]=useState("");
 const [safety,setSafety]=useState<"logout"|"delete"|null>(null);
 const wrapper=useRef<HTMLDivElement>(null);
 const previous=useRef(pathname);
 useEffect(()=>{if(previous.current!==pathname){previous.current=pathname;setPanel(null);setSafety(null)}},[pathname]);
 useEffect(()=>{
  if(!panel&&!safety)return;
  const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape"){e.preventDefault();if(safety)setSafety(null);else if(accountView==="switch")setAccountView("menu");else setPanel(null)}};
  const onClick=(e:MouseEvent)=>{if(!safety&&e.target instanceof Node&&!wrapper.current?.contains(e.target))setPanel(null)};
  document.addEventListener("keydown",onKey);document.addEventListener("mousedown",onClick);
  return()=>{document.removeEventListener("keydown",onKey);document.removeEventListener("mousedown",onClick)};
 },[panel,safety,accountView]);
 const toggle=(name:"support"|"account")=>{setPanel(old=>old===name?null:name);setStep("options");setSafety(null);
  try{const profile=JSON.parse(sessionStorage.getItem("shuomi-demo-account-settings-"+tenant.id)||"null");setProfileName(typeof profile?.name==="string"&&profile.name.trim()?profile.name.trim():tenant.username)}catch{setProfileName(tenant.username)}
  try{const security=JSON.parse(localStorage.getItem("shuomi-demo-security-"+tenant.id)||"null");setProfileEmail(typeof security?.email==="string"&&security.email.trim()?security.email.trim():tenant.email)}catch{setProfileEmail(tenant.email)}
 };
 const selectedOrganization=organizations.find(o=>o.id===identity.organizationId);
 const selectedMember=identity.organizationId===tenant.id?members.find(m=>m.id===identity.memberId):null;
 const displayName=identity.organizationId===tenant.id?(identity.memberId==="admin"?profileName:selectedMember?.name||"无效子账号"):"演示组织管理员";
 const displayEmail=identity.organizationId===tenant.id?(identity.memberId==="admin"?profileEmail:selectedMember?.email||tenant.email):"独立演示空间";
 const canSwitch=identity.memberId==="admin";
 const selectIdentity=()=>{if(!canSwitch)return;onSwitchIdentity(pendingIdentity);setPanel(null);setAccountView("menu")};
 const openSwitcher=()=>{setPanel(null);setPendingIdentity(identity);setSwitchTab("members");setSwitchQuery("");setAccountView("switch")};
 const normalizedQuery=switchQuery.trim().toLocaleLowerCase();
 const matchedMembers=members.filter(m=>m.status==="正常"&&[m.id==="admin"?profileName:m.name,m.email,m.role].some(value=>value.toLocaleLowerCase().includes(normalizedQuery)));
 const matchedOrganizations=organizations.filter(org=>org.name.toLocaleLowerCase().includes(normalizedQuery));
 const mailHref="mailto:support@shuomiai.com?subject="+encodeURIComponent("硕米智能引擎 · 客服留言")+"&body="+encodeURIComponent(message);
 return <>
  <div ref={wrapper} className="showcase-top-actions" aria-label="全局操作">
   <div className="showcase-action-wrap">
    <button className="showcase-action-icon" type="button" aria-label="联系客服" title="联系客服" aria-expanded={panel==="support"} onClick={()=>toggle("support")}><Headset size={19}/></button>
    {panel==="support"&&<section className="showcase-popover showcase-support-menu" role="dialog" aria-label="硕米客服">
      <header className="showcase-menu-head"><span className="showcase-support-logo"><Headset size={18}/></span><span><strong>硕米客服</strong><small>服务入口 · 演示页面</small></span><button type="button" aria-label="关闭客服" onClick={()=>setPanel(null)}><X size={16}/></button></header>
      {step==="options"?<div className="showcase-menu-options">
       <button type="button" onClick={()=>setStep("online")}><strong>在线咨询</strong><small>了解在线服务接入方式</small></button>
       <button type="button" onClick={()=>setStep("message")}><strong>提交留言</strong><small>通过电子邮件提交问题</small></button>
       <p>客服服务时间：工作日 09:00–18:00（原型示意）</p>
      </div>:<div className="showcase-support-body">
       <button type="button" className="showcase-menu-back" onClick={()=>setStep("options")}><ArrowLeft size={14}/>返回服务方式</button>
       {step==="online"?<><h3>在线咨询</h3><p>演示版未连接实时客服，不能创建真实聊天。你可以通过邮件联系平台。</p><a href="mailto:support@shuomiai.com" className="showcase-menu-primary"><Mail size={15}/>邮件咨询</a></>
       :<><label htmlFor="showcase-support-message">留言内容</label><textarea id="showcase-support-message" rows={4} value={message} onChange={e=>setMessage(e.target.value)} placeholder="请描述遇到的问题或需要的帮助"/><a className="showcase-menu-primary" href={mailHref}><Send size={15}/>打开邮件程序</a><p>仅打开邮件程序，不会在演示页面内自动发送或保存。</p></>}
      </div>}
    </section>}
   </div>
   <button className="showcase-action-icon" type="button" aria-label="通知" title="通知中心" onClick={()=>{setPanel(null);navigate("/workbench/notifications")}}><Bell size={19}/>{demoNotices.some(n=>n.category==="official"&&!read.includes(n.id))&&<i className="showcase-notification-dot" aria-hidden="true"/>}</button>
   <button className="showcase-action-icon" type="button" aria-label={light?"切换深色主题":"切换浅色主题"} aria-pressed={light} title={light?"切换深色主题":"切换浅色主题"} onClick={onTheme}>{light?<Sun size={19}/>:<MoonStar size={19}/>}</button>
   <div className="showcase-action-wrap">
    <button className="showcase-account-icon" type="button" aria-label={displayName+"账户"} title={displayName} aria-expanded={panel==="account"} onClick={()=>{toggle("account");setAccountView("menu")}}><UserRound size={21}/><i/></button>
    {panel==="account"&&<section className="showcase-popover showcase-account-menu" role="dialog" aria-label="账户快捷操作">
     <header className="showcase-menu-head"><span><strong>{displayName}</strong><small>{displayEmail}</small><small>{selectedOrganization?.name||tenant.name} · {selectedMember?.role||"管理员"}（模拟）</small></span><button type="button" aria-label="关闭账户菜单" onClick={()=>setPanel(null)}><X size={16}/></button></header>
     <div className="showcase-account-links">
      <button type="button" onClick={()=>{setPanel(null);navigate("/workbench/account/profile")}}><UserCircle2 size={16}/>账户资料</button>
      <button type="button" onClick={openSwitcher}><UsersRound size={16}/>切换账户与企业组织</button>
      <button type="button" onClick={()=>setSafety("logout")}><LogOut size={16}/>退出登录</button>
      <button className="showcase-danger-link" type="button" onClick={()=>setSafety("delete")}><ShieldAlert size={16}/>注销账号</button>
     </div>
    </section>}
   </div>
  </div>
  {accountView==="switch"&&<div className="showcase-identity-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setAccountView("menu")}}>
   <section role="dialog" aria-modal="true" aria-label="切换账户与企业组织" className="showcase-identity-dialog">
    <header className="showcase-identity-head">
     <div><span className="showcase-identity-eyebrow">账户与组织</span><h2>切换工作身份</h2><p>选择要进入的成员或企业空间，确认后再切换。</p></div>
     <button type="button" className="showcase-identity-close" aria-label="关闭切换窗口" onClick={()=>setAccountView("menu")}><X size={19}/></button>
    </header>
    <div className="showcase-identity-current"><span className="showcase-identity-avatar"><UserRound size={20}/></span><div><small>当前身份</small><strong>{displayName} <span>· {selectedMember?.role||"管理员"}</span></strong><p>{selectedOrganization?.name||tenant.name}</p></div><span className="showcase-identity-active">使用中</span></div>
    <div className="showcase-identity-tabs" role="tablist" aria-label="切换类型">
     <button type="button" role="tab" aria-selected={switchTab==="members"} onClick={()=>{setSwitchTab("members");setSwitchQuery("")}}><UsersRound size={16}/>切换成员</button>
     <button type="button" role="tab" aria-selected={switchTab==="organizations"} onClick={()=>{setSwitchTab("organizations");setSwitchQuery("")}}><Building2 size={16}/>切换企业</button>
    </div>
    <div className="showcase-identity-search-row">
      <label htmlFor="showcase-identity-search-input">{switchTab==="members"?"搜索企业成员":"搜索关联企业"}</label>
     <div className="showcase-identity-search"><Search size={17} aria-hidden="true"/><input id="showcase-identity-search-input" type="search" aria-label={switchTab==="members"?"搜索成员":"搜索企业"} value={switchQuery} onChange={e=>setSwitchQuery(e.target.value)} placeholder={switchTab==="members"?"搜索姓名、邮箱或角色":"搜索企业名称"}/>{switchQuery&&<button type="button" aria-label="清空搜索" onClick={()=>setSwitchQuery("")}><X size={16}/></button>}</div>
    </div>
    <div className="showcase-identity-body">
     {switchTab==="members"?<>
      <div className="showcase-identity-section-head"><h3>选择企业成员</h3><small>{pendingIdentity.organizationId===tenant.id?"已启用的企业成员":"该组织暂无成员数据"}</small></div>
      {pendingIdentity.organizationId===tenant.id?<div className="showcase-identity-list">
       {matchedMembers.map(m=><button type="button" key={m.id} className="showcase-identity-option" aria-pressed={pendingIdentity.memberId===m.id} disabled={!canSwitch} onClick={()=>setPendingIdentity({organizationId:tenant.id,memberId:m.id})}>
        <span className="showcase-identity-member-icon"><UserRound size={17}/></span><span className="showcase-identity-option-copy"><strong>{m.id==="admin"?profileName:m.name}</strong><small>{m.role} · {m.id==="admin"?profileEmail:m.email}</small></span><span className="showcase-identity-radio">{pendingIdentity.memberId===m.id&&<span/>}</span>
       </button>)}
       {matchedMembers.length===0&&<div className="showcase-identity-empty">未找到匹配的成员</div>}
      </div>:<div className="showcase-identity-empty">其他演示企业尚未创建成员。请先切换回主企业，或直接以该企业管理员进入独立空白空间。</div>}
     </>:<>
      <div className="showcase-identity-section-head"><h3>选择企业组织</h3><small>仅显示已关联企业</small></div>
      <div className="showcase-identity-list">
       {matchedOrganizations.map(org=><button type="button" key={org.id} className="showcase-identity-option" aria-pressed={pendingIdentity.organizationId===org.id} disabled={!canSwitch} onClick={()=>setPendingIdentity({organizationId:org.id,memberId:"admin"})}>
        <span className="showcase-identity-member-icon"><Building2 size={17}/></span><span className="showcase-identity-option-copy"><strong>{org.name}</strong><small>{org.id===tenant.id?"已配置的主企业":"独立演示企业 · 未配置业务数据"}</small></span><span className="showcase-identity-radio">{pendingIdentity.organizationId===org.id&&<span/>}</span>
       </button>)}
       {matchedOrganizations.length===0&&<div className="showcase-identity-empty">未找到匹配的企业</div>}
      </div>
     </>}
    </div>
    <footer className="showcase-identity-footer">
     <p>{canSwitch?"演示切换不会执行真实登录或组织授权。":"当前为子账号演示身份，如需重新切换，请退出模拟身份。"}</p>
     <div><button type="button" className="showcase-identity-cancel" onClick={()=>setAccountView("menu")}>取消</button>
      {canSwitch?<button type="button" className="showcase-identity-confirm" disabled={pendingIdentity.organizationId===identity.organizationId&&pendingIdentity.memberId===identity.memberId} onClick={selectIdentity}>确认切换</button>
       :<button type="button" className="showcase-identity-confirm" onClick={()=>{onSwitchIdentity({organizationId:tenant.id,memberId:"admin"});setAccountView("menu")}}>退出模拟子账号</button>}</div>
    </footer>
   </section>
  </div>}
  {safety&&<div className="showcase-confirm-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setSafety(null)}}>
   <section role="alertdialog" aria-modal="true" aria-labelledby="showcase-safe-title" aria-describedby="showcase-safe-desc" className="showcase-confirm">
    <ShieldAlert size={23}/><h2 id="showcase-safe-title">{safety==="logout"?"退出登录":"注销账号"}</h2>
    <p id="showcase-safe-desc">当前为展示原型，未连接真实账户认证和安全验证，{safety==="logout"?"不会退出真实登录。":"不会注销账号或删除任何账户数据。"}</p>
    <button autoFocus type="button" onClick={()=>setSafety(null)}>返回账户菜单</button>
   </section>
  </div>}
 </>;
}

export function ShowcaseNotifications({ navigate, read, markRead, markAll }: {
 navigate:(path:string)=>void;read:number[];markRead:(id:number)=>void;markAll:(ids:number[])=>void
}) {
 const [tab,setTab]=useState<"official"|"business">("official");
 const [detail,setDetail]=useState<number|null>(null);
 const [onlyUnread,setOnlyUnread]=useState(false);
 const items=demoNotices.filter(n=>n.category===tab);
 const visible=items.filter(n=>!onlyUnread||!read.includes(n.id));
 const current=demoNotices.find(n=>n.id===detail);
 const unread=items.filter(n=>!read.includes(n.id)).length;
 return <main className="showcase-notifications" data-showcase-notifications>
  <header className="showcase-notification-heading"><small>通知中心 / {tab==="official"?"硕米官方通知":"商家经营触发通知"}</small><h1>通知中心</h1><p>集中查看平台公告、产品更新与商家经营触发消息。</p></header>
  <section className="showcase-notification-board">
   <div className="showcase-notice-tabs" role="tablist" aria-label="通知分类">
    <button type="button" role="tab" aria-selected={tab==="official"} onClick={()=>{setTab("official");setDetail(null);setOnlyUnread(false)}}>硕米官方通知</button>
    <button type="button" role="tab" aria-selected={tab==="business"} onClick={()=>{setTab("business");setDetail(null);setOnlyUnread(false)}}>商家经营触发通知</button><span>{unread} 条未读</span>
   </div>
   {current?<><div className="showcase-notice-controls"><button type="button" onClick={()=>setDetail(null)}><ArrowLeft size={15}/>返回列表</button><span>{current.type}</span></div><article className="showcase-notice-detail"><h2>{current.title}</h2><small><Clock3 size={14}/>{current.time} · 演示消息</small><p>{current.body}</p></article></>
   :<><div className="showcase-notice-controls"><strong>最新通知</strong><div><label><input type="checkbox" checked={onlyUnread} onChange={e=>setOnlyUnread(e.target.checked)}/>仅看未读</label><button type="button" disabled={unread===0} onClick={()=>markAll(items.map(n=>n.id))}><CheckCheck size={15}/>全部标为已读</button></div></div>
    {visible.length?<div className="showcase-notice-list">{visible.map((n,i)=><button key={n.id} type="button" className="showcase-notice-row" data-read={read.includes(n.id)} onClick={()=>{markRead(n.id);setDetail(n.id)}}>
     <i data-color={i%4}/><span><strong>{n.title}</strong><small>{n.body}</small></span><span><time>{n.time}</time><em>{n.type}</em></span>
    </button>)}</div>:<p className="showcase-notice-empty">当前筛选下暂无通知。</p>}</>}
  </section>
  <p className="showcase-notice-note">仅为 GitHub Pages 演示消息，阅读状态在本次会话生效；不代表真实通知数量。</p>
  <button className="showcase-notice-return" type="button" onClick={()=>navigate("/workbench")}><ArrowLeft size={15}/>返回运营驾驶舱</button>
 </main>;
}
