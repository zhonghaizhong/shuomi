"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {Store, Sparkles, Database, HardDrive} from "lucide-react";
import {showcaseTenant as tenant} from "./showcase-tenant";
import {useShowcaseSuite,addAudit,totalEarnings,availableEarnings,permissionTree,permissionKey,permissionSummary,normalizeRolePermissions,toggleRolePermission,togglePermissionGroup,descendants,type PermissionMode,type Member,type SuiteState} from "./showcase-account-state";
import type {ConsoleNavNode} from "@/lib/workbench/console-navigation";
import s from "./showcase-account-suite.module.css";
const root="/workbench/account";
const goPath=(path:string)=>root+path+"?preview=1";
const money=(n:number)=>"¥"+n.toLocaleString("zh-CN",{minimumFractionDigits:2,maximumFractionDigits:2});
const timestamp=(n:number)=>new Date(n).toLocaleString("zh-CN");
const screens:Record<string,[string,string]>={
 "/organization":["企业空间","统一管理当前企业的成员、角色、资源及操作记录。"],
 "/organization/members":["成员与权限","管理真实的演示成员记录；新增成员在模拟审核通过后加入企业。"],
 "/organization/roles":["角色权限","设置企业内的业务角色，权限修改同步到成员记录。"],
 "/organization/resources":["资源与额度","查看店铺、积分、数据与存储资源，资源不足时不可分配。"],
 "/organization/audit":["操作记录","查询当前企业的演示操作记录，支持筛选与查看。"],
 "/referrals":["推广与收益","创建推广入口，查看邀请、收益、结算与提现记录。"],
 "/referrals/center":["推广中心","分享专属推广链接，跟进模拟邀请及推广转化。"],
 "/referrals/earnings":["收益明细","查看模拟收益来源、时间与结算状态。"],
 "/referrals/withdrawals":["提现管理","模拟登记收款方式并提交提现，审核自动通过。"],
 "/referrals/rules":["推广规则","了解推广关系、收益记录及模拟结算方式。"]
};
type Modal="invite"|"member"|"role"|"permissions"|"storage"|"earning"|"payout"|"withdraw"|null;
const menu=[["企业空间","/organization"],["成员管理","/organization/members"],["角色权限","/organization/roles"],["资源与额度","/organization/resources"],["操作记录","/organization/audit"],["推广与收益","/referrals"],["推广中心","/referrals/center"],["收益明细","/referrals/earnings"],["提现管理","/referrals/withdrawals"],["推广规则","/referrals/rules"]] as const;
function PermissionBranch({node,depth,grants,onChange}:{node:ConsoleNavNode;depth:number;grants:readonly string[];onChange:(node:ConsoleNavNode,mode:PermissionMode,checked:boolean)=>void}){
 return <><div className={s.permissionRow} style={{paddingLeft:Math.min(depth,3)*18+12}}>
  <span className={s.permissionNodeName}>{node.label}</span>
  <label><input type="checkbox" aria-label={node.label+" 查看"} checked={grants.includes(permissionKey(node.href,"view"))} onChange={e=>onChange(node,"view",e.target.checked)}/><span>查看</span></label>
  <label><input type="checkbox" aria-label={node.label+" 操作"} checked={grants.includes(permissionKey(node.href,"operate"))} onChange={e=>onChange(node,"operate",e.target.checked)}/><span>操作</span></label>
 </div>{node.children?.map(child=><PermissionBranch key={child.href} node={child} depth={depth+1} grants={grants} onChange={onChange}/>)}</>;
}
export function ShowcaseAccountSuite({pathname}:{pathname:string}){
 const router=useRouter();const {state,commit}=useShowcaseSuite();
 const suffix=pathname.slice(root.length)||"/organization";const [title,desc]=screens[suffix]||screens["/organization"];
 const [modal,setModal]=useState<Modal>(null);const [permissions,setPermissions]=useState<string[]>([]);const [name,setName]=useState("");const [email,setEmail]=useState("");const [role,setRole]=useState("子账号");const [selected,setSelected]=useState("");const [amount,setAmount]=useState("100");const [account,setAccount]=useState("");const [query,setQuery]=useState("");const [applied,setApplied]=useState("");const [notice,setNotice]=useState("");const [error,setError]=useState("");
 const enterprise=suffix.startsWith("/organization"),overview=suffix==="/organization",referral=suffix.startsWith("/referrals");
 const sectionMenu=enterprise?menu.slice(0,5):menu.slice(5);
 useEffect(()=>{if(!modal)return;const onEscape=(event:KeyboardEvent)=>{if(event.key==="Escape")setModal(null)};document.addEventListener("keydown",onEscape);return()=>document.removeEventListener("keydown",onEscape)},[modal]);
 const currentMember=state.members.find(x=>x.id===selected);
 const activeMembers=state.members.filter(x=>x.status==="正常");
 const balance=availableEarnings(state);
 const usedStorage=Object.values(state.allocations).reduce((sum,n)=>sum+(Number(n)||0),0);
 const storageRemaining=Math.max(0,tenant.storageGiB-usedStorage);
 const change=(next:SuiteState,message:string)=>{if(commit(next)){setNotice(message);setError("");setModal(null);return true}setError("当前浏览器存储不可用，操作未保存。");return false};
 const close=()=>{setModal(null);setError("");setSelected("");setName("");setEmail("");setRole("子账号");setAmount("100");setAccount("");setPermissions([])};
 const open=(target:Modal,id="")=>{close();setModal(target);setSelected(id);if(target==="member"){const m=state.members.find(x=>x.id===id);if(m)setRole(m.role)}if(target==="permissions")setPermissions(normalizeRolePermissions(state.rolePermissions[id]||[]));if(target==="storage")setAmount(String(state.allocations[id]||0))};
 const addMember=()=>{const value=email.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)){setError("请输入有效的成员邮箱地址。");return}if(state.members.some(m=>m.email.toLowerCase()===value)){setError("该邮箱已经属于当前企业。");return}if(!name.trim()){setError("请输入成员姓名。");return}
  const member:Member={id:crypto.randomUUID(),name:name.trim(),email:value,role,status:"正常",joined:Date.now()};
  change(addAudit({...state,members:[...state.members,member]},"成员与权限","邀请并模拟审核通过："+member.name+"（"+role+"）"),"成员已加入企业（模拟审核通过）。")
 };
 const updateMember=()=>{if(!currentMember||currentMember.id==="admin")return;change(addAudit({...state,members:state.members.map(m=>m.id===currentMember.id?{...m,role}:m)},"成员与权限","调整成员 "+currentMember.name+" 角色为 "+role),"成员角色已更新。")};
 const toggleMember=(m:Member)=>{if(m.id==="admin")return;const target=m.status==="正常"?"已停用":"正常";change(addAudit({...state,members:state.members.map(x=>x.id===m.id?{...x,status:target}:x)},"成员与权限",m.name+" 已"+target),"成员状态已更新。")};
 const addRole=()=>{const value=name.trim();if(!value||state.roles.includes(value)){setError("请输入未使用的角色名称。");return}change(addAudit({...state,roles:[...state.roles,value],rolePermissions:{...state.rolePermissions,[value]:[]}},"角色权限","新建角色："+value),"新角色已加入企业角色列表。")};
 const savePermissions=()=>{if(selected==="管理员")return;const list=normalizeRolePermissions(permissions);change(addAudit({...state,rolePermissions:{...state.rolePermissions,[selected]:list}},"角色权限","更新角色 "+selected+" 权限："+permissionSummary(list)),"角色权限已保存，关联成员同步使用此配置（仅演示）。")};
 const saveStorage=()=>{const n=Number(amount);if(!Number.isFinite(n)||n<0||Math.round(n*10)!==n*10){setError("请输入0至5 GiB之间、精确到0.1 GiB的容量。");return}const previous=state.allocations[selected]||0;if(n>storageRemaining+previous+0.00001){setError("本次设置超出企业可分配存储容量。");return}change(addAudit({...state,allocations:{...state.allocations,[selected]:n}},"资源与额度","设置成员 "+(state.members.find(m=>m.id===selected)?.name||selected)+" 存储上限："+n+" GiB"),"成员存储上限已更新，剩余额度同步调整。")};
 const referralLink=()=>typeof location==="undefined"?"":location.origin+"/shuomi/#/workbench/account/referrals/center?preview=1&ref="+encodeURIComponent(state.referralCode);
 const copyReferral=()=>{navigator.clipboard?.writeText(referralLink()).then(()=>setNotice("推广链接已复制。")).catch(()=>setNotice("复制失败，可直接选中链接复制。"))};
 const addEarning=()=>{const value=Number(amount);if(!Number.isFinite(value)||value<=0||value>100000){setError("请输入大于0且不超过100000的模拟佣金。");return}if(!email.trim()){setError("请填写模拟客户标识。");return}
  change(addAudit({...state,referrals:[{id:crypto.randomUUID(),at:Date.now(),referred:email.trim(),amount:Math.round(value*100)/100,status:"已结算"},...state.referrals]},"推广与收益","模拟推广收益已审核并结算："+money(value)),"一笔模拟推广佣金已结算，余额已同步。")
 };
 const savePayout=()=>{if(account.trim().length<4){setError("请输入至少4位的演示收款标识。");return}change(addAudit({...state,payoutAccount:account.trim()},"提现管理","更新模拟收款方式"),"模拟收款方式已保存。")};
 const withdraw=()=>{const cents=Math.round(Number(amount)*100);const availableCents=Math.round(balance*100);if(!state.payoutAccount){setError("请先设置收款方式。");return}if(!Number.isSafeInteger(cents)||cents<=0||cents>availableCents){setError("提现金额必须大于0且不超过可提现余额。");return}
 let remaining=cents;const after=state.referrals.flatMap(item=>{if(item.status!=="已结算"||remaining<=0)return [item];const itemCents=Math.round(item.amount*100),taken=Math.min(itemCents,remaining);remaining-=taken;if(taken===itemCents)return [{...item,status:"已提现" as const}];return [{...item,id:crypto.randomUUID(),amount:taken/100,status:"已提现" as const},{...item,amount:(itemCents-taken)/100,status:"已结算" as const}]});
 if(remaining!==0){setError("可提现余额核对失败，未生成提现记录。");return}const n=cents/100;const item={id:crypto.randomUUID(),at:Date.now(),amount:n,account:state.payoutAccount,status:"模拟审核通过" as const};change(addAudit({...state,referrals:after,withdrawals:[item,...state.withdrawals]},"提现管理","模拟提现并审核通过："+money(n)),"模拟提现申请已审核通过，剩余收益保留；未发起实际转账。")
 };
 const viewMember=state.members.filter(m=>(m.name+" "+m.email+" "+m.role+" "+m.status).includes(applied));
 const viewAudit=state.audit.filter(a=>(a.actor+" "+a.message+" "+a.category).includes(applied));
 const nav=(path:string)=>{close();setNotice("");setQuery("");setApplied("");router.push(goPath(path))};
 const tiles=(items:[string,string,string][]) => <div className={s.metrics}>{items.map(([label,value,hint],i)=><article key={label} data-tone={i}><span>{label}</span><strong>{value}</strong><small>{hint}</small></article>)}</div>;
 return <main className={s.page} data-account-suite={suffix}>
  <header className={s.hero}><div><small>我的账户 / {enterprise?"企业空间":"推广与收益"}{overview||suffix==="/referrals"?"":" / "+title}</small><h1>{title}</h1><p>{desc}</p></div>{(suffix==="/organization/members"||suffix==="/organization/roles"||suffix==="/referrals/withdrawals")&&<div className={s.heroActions}>{suffix==="/organization/members"&&<button className={s.primary} onClick={()=>open("invite")}>邀请成员</button>}{suffix==="/organization/roles"&&<button className={s.primary} onClick={()=>open("role")}>新建角色</button>}{suffix==="/referrals/withdrawals"&&<button className={s.primary} disabled={!balance||!state.payoutAccount} onClick={()=>open("withdraw")}>申请模拟提现</button>}</div>}</header>
  <nav className={s.subNavigation} aria-label={enterprise?"企业空间业务导航":"推广与收益业务导航"}>{sectionMenu.map(([label,path])=><button key={path} type="button" aria-current={suffix===path?"page":undefined} onClick={()=>nav(path)}>{label}</button>)}</nav>
  {notice&&<div className={s.notice} role="status">{notice}<button onClick={()=>setNotice("")} aria-label="关闭消息">×</button></div>}
  <section className={s.identity}><div className={s.avatar}>硕</div><div className={s.identityInfo}><h2>{tenant.name}</h2><p><span className={s.approved}>已认证（模拟）</span> 企业编号：{tenant.id} · 管理员：{tenant.admin}</p></div><span className={s.mode}>演示企业空间 · 不影响真实账户</span></section>
  {overview&&<>
    <div className={s.enterpriseStats} role="region" aria-label="企业空间概览"><div className={s.metrics}>{([["企业成员",String(activeMembers.length),"当前启用的企业成员"],["已绑定店铺",String(tenant.stores),"当前企业已授权店铺"],["待处理邀请","0","模拟入驻审核均已完成"]] as const).map(([label,value,hint],i)=><article key={label} data-tone={i}><span className={s.enterpriseMetricNumber}>{value}</span><div className={s.enterpriseMetricText}><strong>{label}</strong><small>{hint}</small></div></article>)}</div></div>
    <section className={s.panel} aria-label="企业资源"><header><h2>企业资源</h2><p>展示当前企业可用资源与共享容量情况</p></header><div className={s.resourceSummary}>
      {([
       {label:"店铺",value:String(tenant.stores)+" 家",hint:tenant.stores?"当前已绑定店铺":"未绑定店铺",Icon:Store,tone:"store"},
       {label:"AI 积分",value:tenant.points.toLocaleString("zh-CN"),hint:tenant.points?"可用积分余额":"当前无可用积分",Icon:Sparkles,tone:"points"},
       {label:"数据额度",value:tenant.data.toLocaleString("zh-CN")+" 条",hint:tenant.data?"剩余可用数据条数":"暂无剩余额度",Icon:Database,tone:"data"},
       {label:"企业存储",value:tenant.storageGiB+" GiB",hint:"免费 5 GiB + 模拟扩容 3 GiB · 已分配 "+usedStorage.toFixed(1)+" GiB",Icon:HardDrive,tone:"storage"}
      ] as const).map(({label,value,hint,Icon,tone})=><article key={label} data-tone={tone}><div className={s.resourceIcon}><Icon size={21} strokeWidth={1.9} aria-hidden="true"/></div><span className={s.resourceLabel}>{label}</span><strong>{value}</strong><small>{hint}</small>{tone==="storage"&&<div className={s.storageTrack} role="progressbar" aria-label="已分配企业存储" aria-valuemin={0} aria-valuemax={tenant.storageGiB} aria-valuenow={Math.min(tenant.storageGiB,usedStorage)}><div style={{width:Math.max(0,Math.min(100,tenant.storageGiB?usedStorage/tenant.storageGiB*100:0))+"%"}}/></div>}</article>)}
    </div></section>
    <section className={s.panel} aria-label="成员资源分配"><header><h2>成员资源分配</h2><p>企业存储为共享容量，可按成员设置上限；未授权的店铺及未充值的额度不预置分配。</p></header><div className={s.tableWrap}><table><thead><tr><th>成员 / 角色</th><th>已绑定店铺</th><th>AI 积分余额</th><th>数据额度（条）</th><th>存储上限（GiB）</th></tr></thead><tbody>{activeMembers.map(m=><tr key={m.id}><td><strong>{m.name}</strong><small className={s.memberRole}>{m.role}</small></td><td>0</td><td>0</td><td>0</td><td>{(state.allocations[m.id]||0).toFixed(1)}</td></tr>)}</tbody></table>{!activeMembers.length&&<div className={s.empty}>暂无企业成员，邀请后可分配资源。</div>}</div></section>
  </>}
  {suffix==="/organization/members"&&<>{tiles([["启用成员",String(activeMembers.length),"包含管理员"],["管理员","1","拥有全部权限"],["已停用成员",String(state.members.length-activeMembers.length),"可按需重新启用"],["模拟审核","自动通过","添加后立即生效"]])}
   <section className={s.panel}><header><h2>成员列表</h2><p>邀请成员后即按模拟后台审核通过加入。</p></header><div className={s.toolbar}><input aria-label="搜索成员" placeholder="搜索成员、邮箱或角色" value={query} onChange={e=>setQuery(e.target.value)}/><button onClick={()=>{setQuery("");setApplied("")}}>重置</button><button className={s.primary} onClick={()=>setApplied(query.trim())}>确定</button></div><div className={s.tableWrap}><table><thead><tr>{["成员","登录邮箱","角色","状态","加入时间","操作"].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{viewMember.map(m=><tr key={m.id}><td><strong>{m.name}</strong></td><td>{m.email}</td><td>{m.role}</td><td><span className={s.approved}>{m.status}</span></td><td>{timestamp(m.joined)}</td><td><div className={s.rowActions}><button onClick={()=>open("member",m.id)}>查看{m.id==="admin"?"":" / 调整"}</button>{m.id!=="admin"&&<button onClick={()=>toggleMember(m)}>{m.status==="正常"?"停用":"启用"}</button>}</div></td></tr>)}</tbody></table></div></section>
  </>}
  {suffix==="/organization/roles"&&<>{tiles([["系统角色","1","管理员不可删除"],["业务角色",String(state.roles.length-1),"可继续新建"],["企业成员",String(activeMembers.length),"角色生效人数"],["待审核事项","0","模拟审核全部通过"]])}
   <section className={s.panel}><header><h2>角色权限</h2><p>新增角色可以在邀请成员及调整成员时直接使用。</p></header><div className={s.tableWrap}><table><thead><tr><th>角色名称</th><th>权限范围</th><th>关联成员</th><th>性质</th><th>操作</th></tr></thead><tbody>{state.roles.map(r=><tr key={r}><td><strong>{r}</strong></td><td>{r==="管理员"?"全部权限":permissionSummary(state.rolePermissions[r]||[])}</td><td>{state.members.filter(m=>m.role===r&&m.status==="正常").length} 人</td><td>{r==="管理员"?"系统角色":"业务角色"}</td><td><button disabled={r==="管理员"} onClick={()=>open("permissions",r)}>配置权限</button></td></tr>)}</tbody></table></div><div className={s.quicklinks}><button onClick={()=>nav("/organization/members")}>管理成员角色</button></div></section>
  </>}
  {suffix==="/organization/resources"&&<>{tiles([["已绑定店铺",String(tenant.stores),"可分配店铺"],["AI 积分",String(tenant.points),"¥1 = 10,000 积分 · 模拟已到账"],["数据额度",String(tenant.data),"¥0.01/条 · 模拟已到账"],["共享存储",tenant.storageGiB+" GiB","免费 5 GiB + 扩容 3 GiB · 已分配 "+usedStorage.toFixed(1)+" GiB · 剩余 "+storageRemaining.toFixed(1)+" GiB"]])}
   <section className={s.panel}><header><h2>成员资源分配</h2><p>模拟购买店铺服务 2 期待分配；企业 AI 积分 10,000,000、数据额度 50,000 条按模拟规则到账，成员分配暂为 0。</p></header><div className={s.tableWrap}><table><thead><tr><th>成员</th><th>角色</th><th>店铺</th><th>AI 积分</th><th>数据条数</th><th>存储上限</th><th>操作</th></tr></thead><tbody>{activeMembers.map(m=><tr key={m.id}><td><strong>{m.name}</strong></td><td>{m.role}</td><td>0</td><td>0</td><td>0</td><td>{(state.allocations[m.id]||0).toFixed(1)} GiB</td><td><button disabled={m.id==="admin"} onClick={()=>open("storage",m.id)}>分配存储</button></td></tr>)}</tbody></table></div><div className={s.quicklinks}><button onClick={()=>router.push("/workbench/plans/top-up?preview=1")}>前往充值中心</button><button onClick={()=>router.push("/workbench/store-center?preview=1")}>前往店铺中心</button></div></section>
  </>}
  {suffix==="/organization/audit"&&<>{tiles([["操作记录",String(state.audit.length),"本企业模拟事件"],["成员变更",String(state.audit.filter(x=>x.category==="成员与权限").length),"成员邀请、状态、角色"],["角色配置",String(state.audit.filter(x=>x.category==="角色权限").length),"企业角色调整"],["推广与收益",String(state.audit.filter(x=>x.category.includes("推广")||x.category.includes("提现")).length),"模拟收益与提现"]])}
   <section className={s.panel}><header><h2>操作记录</h2><p>所有在本次模拟中确认的变更都在这里留痕。</p></header><div className={s.toolbar}><input value={query} aria-label="搜索操作记录" onChange={e=>setQuery(e.target.value)} placeholder="搜索操作人、类型、内容"/><button onClick={()=>{setQuery("");setApplied("")}}>重置</button><button className={s.primary} onClick={()=>setApplied(query.trim())}>确定</button></div><div className={s.tableWrap}><table><thead><tr><th>操作时间</th><th>操作人</th><th>所属模块</th><th>操作内容</th><th>结果</th></tr></thead><tbody>{viewAudit.map(x=><tr key={x.id}><td>{timestamp(x.at)}</td><td>{x.actor}</td><td>{x.category}</td><td>{x.message}</td><td>模拟完成</td></tr>)}</tbody></table>{!viewAudit.length&&<div className={s.empty}>暂无相关操作记录。</div>}</div></section>
  </>}
  {referral&&<>{tiles([["累计推广收益",money(totalEarnings(state)),"本企业模拟收益"],["可提现余额",money(balance),"模拟已结算金额"],["已提现",money(state.withdrawals.reduce((sum,x)=>sum+x.amount,0)),"只记模拟记录"],["模拟邀请用户",String(state.referredCustomers.length),"用户充值后产生独立店铺服务订单"]])}
   {(suffix==="/referrals/center"||suffix==="/referrals")&&<section className={s.panel}><header><h2>专属推广入口</h2><p>已生成独立的 20 位新用户演示数据及充值、店铺扣费、10% 收益记录；不会创建真实客户或资金流水。</p></header><div className={s.linkRow}><div><span>推广代码</span><strong>{state.referralCode}</strong><small>{referralLink()}</small></div><button className={s.primary} onClick={copyReferral}>复制推广链接</button></div><div className={s.quicklinks}><button onClick={()=>open("earning")}>模拟一笔推广成交并结算</button></div></section>}
   {(suffix==="/referrals/center"||suffix==="/referrals")&&<section className={s.panel} aria-label="邀请新用户消费记录">
    <header><h2>新用户邀请与消费记录（模拟）</h2><p>每位用户演示充值 ¥200，绑定 1 家 SHEIN 模拟店铺并实际扣减演示钱包 ¥168 / 30 天；按已消费金额的 10% 结算演示收益，不按充值金额计佣。</p></header>
    {tiles([["邀请注册",String(state.referredCustomers.length)+" 位","演示注册成功"],["模拟用户充值",money(state.referredCustomers.reduce((sum,x)=>sum+x.walletTopUpCny,0)),"各用户独立钱包"],["模拟店铺消费",money(state.referredCustomers.reduce((sum,x)=>sum+x.storeFeeCny,0)),"已扣减店铺基础服务费"],["剩余用户余额",money(state.referredCustomers.reduce((sum,x)=>sum+x.walletBalanceCny,0)),"未消费部分不计佣"]])}
    <div className={s.tableWrap}><table><thead><tr><th>邀请用户</th><th>充值到账</th><th>绑定店铺</th><th>订单及服务</th><th>钱包扣费</th><th>剩余余额</th><th>10% 佣金</th><th>状态</th></tr></thead>
     <tbody>{state.referredCustomers.map(customer=><tr key={customer.id}><td><strong>{customer.name}</strong><small>{customer.id}</small></td><td>{money(customer.walletTopUpCny)}<small>模拟到账</small></td><td>{customer.storeId}<small>SHEIN · 模拟绑定</small></td><td>{customer.storeOrderId}<small>基础店铺服务 · 30 天</small></td><td>{money(customer.storeFeeCny)}</td><td>{money(customer.walletBalanceCny)}</td><td>{money(customer.commissionCny)}</td><td><span className={s.approved}>{customer.status}</span></td></tr>)}</tbody>
    </table></div></section>}
   {(suffix==="/referrals/earnings"||suffix==="/referrals")&&<section className={s.panel}><header><h2>收益明细</h2><p>本次模拟按已支付的基础店铺服务费 × 10% 产生佣金；用户钱包充值和未消费余额不产生佣金。所有数据仅用于演示。</p></header><div className={s.tableWrap}><table><thead><tr><th>时间</th><th>模拟客户</th><th>消费订单</th><th>已消费金额</th><th>佣金比例</th><th>收益金额</th><th>结算状态</th></tr></thead><tbody>{state.referrals.map(x=><tr key={x.id}><td>{timestamp(x.at)}</td><td>{x.referred}</td><td>{x.orderId||"手动模拟"}</td><td>{x.paidCny===undefined?"—":money(x.paidCny)}</td><td>{x.rate===undefined?"手动模拟":(x.rate*100).toFixed(0)+"%"}</td><td>{money(x.amount)}</td><td>{x.status}（模拟）</td></tr>)}</tbody></table>{!state.referrals.length&&<div className={s.empty}>暂无推广收益。</div>}</div></section>}
      {suffix==="/referrals/withdrawals"&&<><section className={s.panel}><header><h2>模拟收款方式</h2><p>不输入真实银行卡号；只保存演示标识。</p></header><div className={s.linkRow}><div><span>当前收款方式</span><strong>{state.payoutAccount||"尚未设置"}</strong></div><button onClick={()=>{open("payout");setAccount(state.payoutAccount)}}>设置收款方式</button></div></section><section className={s.panel}><header><h2>提现记录</h2><p>审核环节全部模拟通过，不发起真实打款。</p></header><div className={s.tableWrap}><table><thead><tr><th>申请时间</th><th>金额</th><th>收款标识</th><th>状态</th></tr></thead><tbody>{state.withdrawals.map(x=><tr key={x.id}><td>{timestamp(x.at)}</td><td>{money(x.amount)}</td><td>{x.account}</td><td>{x.status}</td></tr>)}</tbody></table>{!state.withdrawals.length&&<div className={s.empty}>暂无提现记录。</div>}</div></section></>}
   {suffix==="/referrals/rules"&&<section className={s.panel}><header><h2>推广结算与审核说明</h2><p>当前仅用于闭环验收，不代表正式佣金标准或真实支付义务。</p></header><div className={s.rules}><article><b>01</b><h3>推广归因</h3><p>推广码归属当前模拟企业。正式系统需要真实访问和订单归因数据。</p></article><article><b>02</b><h3>收益结算</h3><p>本次演示邀请 20 位新用户，按已扣费的基础店铺服务费 × 10% 自动产生模拟佣金；充值与未消费余额不计佣。也可手工模拟额外收益。</p></article><article><b>03</b><h3>提现处理</h3><p>演示收款账户完成设置后，可模拟完整记录提现，系统记录审核通过，不会转账。</p></article><article><b>04</b><h3>数据边界</h3><p>所有收益、客户标识和提现均为模拟，不能视为真实经营数据。</p></article></div></section>}
  </>}
  {modal&&<div className={s.overlay} onMouseDown={e=>e.target===e.currentTarget&&close()}><section className={modal==="permissions"?`${s.dialog} ${s.permissionDialog}`:s.dialog} role="dialog" aria-modal="true" aria-label={{invite:"邀请成员",member:"管理成员",role:"新建角色",permissions:"配置角色权限",storage:"分配成员存储",earning:"模拟推广收益",payout:"设置收款方式",withdraw:"模拟提现"}[modal]}><header><h2>{{invite:"邀请成员",member:"管理成员",role:"新建角色",permissions:"配置角色权限",storage:"分配成员存储",earning:"模拟推广收益",payout:"设置收款方式",withdraw:"模拟提现"}[modal]}</h2><button aria-label="关闭弹窗" onClick={close}>×</button></header><p className={s.dialogHint}>模拟企业后台审核自动通过，确认后会在当前浏览器档案和操作记录中留存。</p>
    {modal==="invite"&&<><label>成员姓名<input aria-label="成员姓名" value={name} onChange={e=>setName(e.target.value)} placeholder="输入成员姓名"/></label><label>成员邮箱<input aria-label="成员邮箱" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="输入测试邮箱"/></label></>}
    {modal==="member"&&<p>成员：{currentMember?.name||"未找到成员"} · {currentMember?.email}</p>}
    {(modal==="invite"||modal==="member")&&<label>业务角色<select aria-label="业务角色" disabled={modal==="member"&&selected==="admin"} value={role} onChange={e=>setRole(e.target.value)}>{state.roles.map(x=><option key={x}>{x}</option>)}</select></label>}
    {modal==="permissions"&&<fieldset className={s.permissionList}><legend>权限范围 · {selected}</legend>
     <p className={s.permissionHelp}>权限项与左侧当前功能导航对应。一级模块可批量勾选；二、三级功能分别设置查看与操作。操作权限自动包含查看权限。</p>
     <div className={s.permissionTree}>
      {permissionTree.map(node=>{
       const nodes=descendants(node);
       const granted=nodes.filter(child=>permissions.includes(permissionKey(child.href,"view"))).length;
       const all=nodes.every(child=>permissions.includes(permissionKey(child.href,"view"))&&permissions.includes(permissionKey(child.href,"operate")));
       return <section className={s.permissionGroup} key={node.href}>
        <div className={s.permissionGroupHeading}>
         <label><input type="checkbox" aria-label={node.label} checked={all} onChange={e=>setPermissions(v=>togglePermissionGroup(v,node,e.target.checked))}/><strong>{node.label}</strong></label>
         <small>{granted}/{nodes.length} 个功能可查看</small>
        </div>
        <div className={s.permissionChildren}>
         {node.children?.length?node.children.map(child=><PermissionBranch key={child.href} node={child} depth={0} grants={permissions} onChange={(target,mode,checked)=>setPermissions(v=>toggleRolePermission(v,target,mode,checked))}/>)
          :<PermissionBranch node={node} depth={0} grants={permissions} onChange={(target,mode,checked)=>setPermissions(v=>toggleRolePermission(v,target,mode,checked))}/>}
        </div>
       </section>;
      })}
     </div>
     <p className={s.permissionHelp}>仅保存到当前演示企业；真实导航可见性、页面访问和接口操作权限需由正式服务端鉴权接管，不能以此作为安全授权。</p>
    </fieldset>}
    {modal==="storage"&&<><p>企业存储总容量 {tenant.storageGiB} GiB，当前剩余可分配 {storageRemaining.toFixed(1)} GiB。</p><label>成员存储上限（GiB）<input type="number" aria-label="成员存储上限" min="0" max={tenant.storageGiB} step="0.1" value={amount} onChange={e=>setAmount(e.target.value)}/></label></>}
    {modal==="role"&&<label>角色名称<input aria-label="角色名称" value={name} onChange={e=>setName(e.target.value)} placeholder="例如：运营专员"/></label>}
    {modal==="earning"&&<><label>模拟客户标识<input aria-label="模拟客户标识" value={email} onChange={e=>setEmail(e.target.value)} placeholder="例如：TEST-CUSTOMER-001"/></label><label>模拟佣金金额（元）<input type="number" min="0.01" step="0.01" aria-label="模拟佣金金额" value={amount} onChange={e=>setAmount(e.target.value)}/></label></>}
    {modal==="payout"&&<label>演示收款标识<input aria-label="演示收款标识" value={account} onChange={e=>setAccount(e.target.value)} placeholder="不要输入真实银行账号"/></label>}
    {modal==="withdraw"&&<><p>当前可提现金额：{money(balance)}。支持部分提现，剩余收益继续保留为可提现余额。</p><label>模拟提现金额<input type="number" step="0.01" aria-label="模拟提现金额" value={amount} onChange={e=>setAmount(e.target.value)}/></label></>}
    {error&&<p role="alert" className={s.error}>{error}</p>}<footer><button onClick={close}>取消</button><button className={s.primary} onClick={()=>({invite:addMember,member:updateMember,role:addRole,permissions:savePermissions,storage:saveStorage,earning:addEarning,payout:savePayout,withdraw}[modal])()} disabled={modal==="member"&&selected==="admin"}>确认并模拟通过</button></footer>
   </section></div>}
  <p className={s.disclaimer}>所有账户、权限、收益和审核操作均为当前演示企业的本地模拟记录，非真实身份认证、平台授权、支付或转账。</p>
 </main>;
}
