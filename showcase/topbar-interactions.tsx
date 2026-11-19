import { useEffect, useRef, useState } from "react";
import { Bell, Headset, LogOut, Mail, MoonStar, Sun, UserRound, X, ShieldAlert, UserCircle2, Send, ArrowLeft, CheckCheck, Clock3 } from "lucide-react";

export type Notice = { id:number; title:string; body:string; time:string; type:string; category:"official"|"business" };
export const demoNotices:Notice[] = [
 {id:1,title:"AI工作台 2.0 能力升级",body:"新增多店铺诊断、任务自动拆解与项目模板能力。",time:"今天 10:24",type:"产品更新",category:"official"},
 {id:2,title:"平台服务维护通知",body:"本周日 02:00–04:00 将进行数据服务升级，不影响已运行任务。",time:"昨天 18:30",type:"系统公告",category:"official"},
 {id:3,title:"OPC 电商社区线上分享会开放报名",body:"了解一人 + AI 团队的经营模式与优秀商家实践案例。",time:"8月10日",type:"活动通知",category:"official"},
 {id:4,title:"隐私政策与数据授权规则更新",body:"进一步明确店铺数据调用范围、授权期限与撤销方式。",time:"8月08日",type:"规则更新",category:"official"},
 {id:5,title:"店铺经营状态提醒",body:"有店铺经营指标需要关注，可前往运营驾驶舱查看详细信息。",time:"今天 09:40",type:"经营通知",category:"business"},
 {id:6,title:"企业资源用量提醒",body:"可前往套餐与权益查看资源使用情况和可用额度。",time:"昨天 16:20",type:"用量提醒",category:"business"}
];

export function ShowcaseTopbarActions({ navigate, pathname, light, onTheme, read }: {
 navigate:(path:string)=>void; pathname:string; light:boolean; onTheme:()=>void; read:number[]
}) {
 const [panel,setPanel]=useState<"support"|"account"|null>(null);
 const [step,setStep]=useState<"options"|"online"|"message">("options");
 const [message,setMessage]=useState("");
 const [safety,setSafety]=useState<"logout"|"delete"|null>(null);
 const wrapper=useRef<HTMLDivElement>(null);
 const previous=useRef(pathname);
 useEffect(()=>{if(previous.current!==pathname){previous.current=pathname;setPanel(null);setSafety(null)}},[pathname]);
 useEffect(()=>{
  if(!panel&&!safety)return;
  const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape"){e.preventDefault();if(safety)setSafety(null);else setPanel(null)}};
  const onClick=(e:MouseEvent)=>{if(!safety&&e.target instanceof Node&&!wrapper.current?.contains(e.target))setPanel(null)};
  document.addEventListener("keydown",onKey);document.addEventListener("mousedown",onClick);
  return()=>{document.removeEventListener("keydown",onKey);document.removeEventListener("mousedown",onClick)};
 },[panel,safety]);
 const toggle=(name:"support"|"account")=>{setPanel(old=>old===name?null:name);setStep("options");setSafety(null)};
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
    <button className="showcase-account-icon" type="button" aria-label="示例用户账户" title="示例用户" aria-expanded={panel==="account"} onClick={()=>toggle("account")}><UserRound size={21}/><i/></button>
    {panel==="account"&&<section className="showcase-popover showcase-account-menu" role="dialog" aria-label="账户快捷操作">
     <header className="showcase-menu-head"><span><strong>示例用户</strong><small>user@sumi.ai</small></span><button type="button" aria-label="关闭账户菜单" onClick={()=>setPanel(null)}><X size={16}/></button></header>
     <div className="showcase-account-links"><button type="button" onClick={()=>{setPanel(null);navigate("/workbench/account/profile")}}><UserCircle2 size={16}/>账户资料</button><button type="button" onClick={()=>setSafety("logout")}><LogOut size={16}/>退出登录</button><button className="showcase-danger-link" type="button" onClick={()=>setSafety("delete")}><ShieldAlert size={16}/>注销账号</button></div>
    </section>}
   </div>
  </div>
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
