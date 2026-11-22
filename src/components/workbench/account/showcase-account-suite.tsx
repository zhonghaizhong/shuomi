"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {Store, Sparkles, Database, HardDrive} from "lucide-react";
import {showcaseTenant as tenant} from "./showcase-tenant";
import {useDemoPurchases} from "../showcase-purchases";
import {useDemoStoreBindings,countConsumedStorePeriods,demoStoreServiceActive} from "../store-binding-demo";
import {useShowcaseSuite,useMemberReferralPortfolio,addAudit,totalEarnings,availableEarnings,permissionTree,permissionKey,permissionSummary,normalizeRolePermissions,toggleRolePermission,togglePermissionGroup,descendants,type PermissionMode,type Member,type SuiteState} from "./showcase-account-state";
import type {ConsoleNavNode} from "@/lib/workbench/console-navigation";
import s from "./showcase-account-suite.module.css";
import {PayoutConfigurator} from "./showcase-payout-configurator";
const root="/workbench/account";
const goPath=(path:string)=>root+path+"?preview=1";
const money=(n:number)=>"¥"+n.toLocaleString("zh-CN",{minimumFractionDigits:2,maximumFractionDigits:2});
const timestamp=(n:number)=>new Date(n).toLocaleString("zh-CN");
const screens:Record<string,[string,string]>={
 "/organization":["企业空间","统一管理当前企业的成员、角色、资源及操作记录。"],
 "/organization/members":["成员与权限","通过手机号或邮箱邀请成员；接受邀请后才正式启用。"],
 "/organization/roles":["角色权限","设置企业内的业务角色，权限修改同步到成员记录。"],
 "/organization/resources":["资源与额度","查看店铺、积分、数据与存储资源，资源不足时不可分配。"],
 "/organization/audit":["操作记录","查询当前企业的演示操作记录，支持筛选与查看。"],
 "/referrals":["推广与收益","创建推广入口，查看邀请、收益、结算与提现记录。"],
 "/referrals/center":["推广中心","分享专属推广入口，查看访问、注册与消费转化。"],
 "/referrals/earnings":["收益明细","查看模拟收益来源、时间与结算状态。"],
 "/referrals/withdrawals":["提现管理","管理可提现余额、收款账户与提现记录。"],
 "/referrals/rules":["推广规则","当前有效的推广、收益、结算与提现规则统一在本页说明。"]
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
export function ShowcaseAccountSuite({pathname,memberId="admin",organizationId=tenant.id,organizationName=tenant.name}:{pathname:string;memberId?:string;organizationId?:string;organizationName?:string}){
 const router=useRouter();
 const primary=useShowcaseSuite();
 const {totals:enterpriseTotals}=useDemoPurchases();
 const boundStores=useDemoStoreBindings(organizationId,memberId,memberId==="admin");
 const scoped=useMemberReferralPortfolio(memberId,organizationId);
 const colleagueReferral=pathname.includes("/referrals")&&(memberId!=="admin"||organizationId!==tenant.id);
 const state:SuiteState=colleagueReferral?{...primary.state,...scoped.portfolio}:primary.state;
 const commit=(next:SuiteState):boolean=>colleagueReferral?scoped.commitPortfolio({
  audit:next.audit,referredCustomers:next.referredCustomers,trackedVisits:next.trackedVisits,referrals:next.referrals,
  withdrawals:next.withdrawals,payoutAccount:next.payoutAccount,referralCode:next.referralCode
 }):primary.commit(next);
 const suffix=pathname.slice(root.length)||"/organization";const [title,desc]=screens[suffix]||screens["/organization"];
 const [storeAmount,setStoreAmount]=useState("0");const [pointAmount,setPointAmount]=useState("0");const [dataAmount,setDataAmount]=useState("0");const [modal,setModal]=useState<Modal>(null);const [permissions,setPermissions]=useState<string[]>([]);const [name,setName]=useState("");const [email,setEmail]=useState("");const [phone,setPhone]=useState("");const [role,setRole]=useState("子账号");const [selected,setSelected]=useState("");const [amount,setAmount]=useState("100");const [account,setAccount]=useState("");const [query,setQuery]=useState("");const [applied,setApplied]=useState("");const [notice,setNotice]=useState("");const [error,setError]=useState("");const [customerPage,setCustomerPage]=useState(1);const [earningsPage,setEarningsPage]=useState(1);const [promotionStatus,setPromotionStatus]=useState("all");const [promotionSearch,setPromotionSearch]=useState("");const [promotionPage,setPromotionPage]=useState(1);const [promotionDetail,setPromotionDetail]=useState<string|null>(null);const [memberSearch,setMemberSearch]=useState("");const [memberStatus,setMemberStatus]=useState("all");const [memberPageSize,setMemberPageSize]=useState(10);const [memberPage,setMemberPage]=useState(1);
 const enterprise=suffix.startsWith("/organization"),overview=suffix==="/organization",referral=suffix.startsWith("/referrals");
 const sectionMenu=enterprise?menu.slice(0,5):menu.slice(5);
 useEffect(()=>{if(!promotionDetail)return;const onEscape=(event:KeyboardEvent)=>{if(event.key==="Escape")setPromotionDetail(null)};document.addEventListener("keydown",onEscape);return()=>document.removeEventListener("keydown",onEscape)},[promotionDetail]);
 useEffect(()=>{if(!modal)return;const onEscape=(event:KeyboardEvent)=>{if(event.key==="Escape")setModal(null)};document.addEventListener("keydown",onEscape);return()=>document.removeEventListener("keydown",onEscape)},[modal]);
 const currentMember=state.members.find(x=>x.id===selected);
 const activeMembers=state.members.filter(x=>x.status==="正常");
 const pendingMembers=state.members.filter(x=>x.status==="邀请中");
 const disabledMembers=state.members.filter(x=>x.status==="已停用");
 const filteredMembers=state.members.filter(m=>{
  const search=memberSearch.trim().toLocaleLowerCase();
  return (memberStatus==="all"||m.status===memberStatus)
   &&(!search||[m.name,m.email,m.phone||""].some(value=>value.toLocaleLowerCase().includes(search)));
 });
 const memberPageCount=Math.max(1,Math.ceil(filteredMembers.length/memberPageSize));
 const currentMemberPage=Math.min(memberPage,memberPageCount);
 const pagedMembers=filteredMembers.slice((currentMemberPage-1)*memberPageSize,currentMemberPage*memberPageSize);
 const balance=availableEarnings(state);
 const usedStorage=Object.values(state.allocations).reduce((sum,n)=>sum+(Number(n)||0),0);
 const storageRemaining=Math.max(0,enterpriseTotals.storageGiB-usedStorage);
  const storeQuota=enterpriseTotals.renewalPeriods;
  const usedStores=Object.values(state.storeAllocations).reduce((sum,n)=>sum+(Number(n)||0),0);
  const consumedStorePeriods=countConsumedStorePeriods(boundStores.all);
  const usedPoints=Object.values(state.pointAllocations).reduce((sum,n)=>sum+(Number(n)||0),0);
  const usedData=Object.values(state.dataAllocations).reduce((sum,n)=>sum+(Number(n)||0),0);
  const storeRemaining=Math.max(0,storeQuota-usedStores-consumedStorePeriods);
  const pointRemaining=Math.max(0,enterpriseTotals.aiPoints-usedPoints);
  const dataRemaining=Math.max(0,enterpriseTotals.dataRows-usedData);
 const referralAudit=(next:SuiteState,category:string,message:string):SuiteState=>colleagueReferral?{...next,audit:[{id:crypto.randomUUID(),at:Date.now(),actor:(primary.state.members.find(m=>m.id===memberId)?.name||memberId)+" · "+organizationName,category,message},...next.audit]}:addAudit(next,category,message);
 const change=(next:SuiteState,message:string)=>{if(commit(next)){setNotice(message);setError("");setModal(null);return true}setError("当前浏览器存储不可用，操作未保存。");return false};
 const close=()=>{setModal(null);setError("");setSelected("");setName("");setEmail("");setPhone("");setRole("子账号");setAmount("100");setStoreAmount("0");setPointAmount("0");setDataAmount("0");setAccount("");setPermissions([])};
 const open=(target:Modal,id="")=>{close();setModal(target);setSelected(id);if(target==="member"){const m=state.members.find(x=>x.id===id);if(m)setRole(m.role)}if(target==="permissions")setPermissions(normalizeRolePermissions(state.rolePermissions[id]||[]));if(target==="storage"){setAmount("0");setStoreAmount("0");setPointAmount("0");setDataAmount("0")}};
 const addMember=()=>{
  const value=email.trim().toLowerCase();
  const mobile=phone.trim().replace(/[\s()-]/g,"");
  if(!value&&!mobile){setError("请至少填写手机号或邮箱。");return}
  if(value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)){setError("请输入有效的邮箱地址。");return}
  if(mobile&&!/^\+?[1-9]\d{6,14}$/.test(mobile)){setError("手机号格式无效，请填写包含国家或地区区号的有效号码。");return}
  if(value&&state.members.some(m=>m.email.toLowerCase()===value)){setError("该邮箱已属于当前企业或正在邀请中。");return}
  if(mobile&&state.members.some(m=>m.phone===mobile)){setError("该手机号已属于当前企业或正在邀请中。");return}
  const label=value||mobile;
  const member:Member={id:crypto.randomUUID(),name:label,email:value,phone:mobile||undefined,role,status:"邀请中",joined:Date.now()};
  change(addAudit({...state,members:[...state.members,member]},"成员与权限","创建模拟邀请："+label+"（"+role+"）"),"邀请已记录，等待成员接受（演示模式未发送真实短信或邮件）。");
 };
 const updateMember=()=>{if(!currentMember||currentMember.id==="admin")return;change(addAudit({...state,members:state.members.map(m=>m.id===currentMember.id?{...m,role}:m)},"成员与权限","调整成员 "+currentMember.name+" 角色为 "+role),"成员角色已更新。")};
 const toggleMember=(m:Member)=>{
  if(m.id==="admin"||m.status==="邀请中")return;
  const suspending=m.status==="正常",target=suspending?"已停用":"正常";
  const reclaim={renewal:state.storeAllocations[m.id]||0,points:state.pointAllocations[m.id]||0,data:state.dataAllocations[m.id]||0,storage:state.allocations[m.id]||0};
  const next:SuiteState={...state,members:state.members.map(x=>x.id===m.id?{...x,status:target as Member["status"]}:x)};
  if(suspending){
   // Synthetic resource usage is always zero in this showcase. Reclaim only its
   // remaining grants, never the organization's purchased quota or other members' grants.
   next.storeAllocations={...state.storeAllocations,[m.id]:0};
   next.pointAllocations={...state.pointAllocations,[m.id]:0};
   next.dataAllocations={...state.dataAllocations,[m.id]:0};
   next.allocations={...state.allocations,[m.id]:0};
  }
  const detail=suspending?"；已回收未使用额度：续费 "+reclaim.renewal+" 期、AI 积分 "+reclaim.points+"、数据 "+reclaim.data+" 条、存储 "+reclaim.storage.toFixed(1)+" GiB":"；原配额保持 0，管理员可重新分配";
  change(addAudit(next,"成员与权限",m.name+" 已"+target+detail),suspending?"子账号已停用，未使用的四项资源已归还组织，可再次分配。":"成员已重新启用，资源不会自动恢复，请按需重新分配。");
 };
 const acceptInvitation=(m:Member)=>{if(m.status!=="邀请中")return;change(addAudit({...state,members:state.members.map(x=>x.id===m.id?{...x,status:"正常" as const,joined:Date.now()}:x)},"成员与权限","模拟接受成员邀请："+m.name),"邀请已在演示模式中接受，成员现在已启用。")};
 const cancelInvitation=(m:Member)=>{if(m.status!=="邀请中")return;change(addAudit({...state,members:state.members.filter(x=>x.id!==m.id)},"成员与权限","取消模拟邀请："+m.name),"邀请已取消。")};
 const addRole=()=>{const value=name.trim();if(!value||state.roles.includes(value)){setError("请输入未使用的角色名称。");return}change(addAudit({...state,roles:[...state.roles,value],rolePermissions:{...state.rolePermissions,[value]:[]}},"角色权限","新建角色："+value),"新角色已加入企业角色列表。")};
 const savePermissions=()=>{if(selected==="管理员")return;const list=normalizeRolePermissions(permissions);change(addAudit({...state,rolePermissions:{...state.rolePermissions,[selected]:list}},"角色权限","更新角色 "+selected+" 权限："+permissionSummary(list)),"角色权限已保存，关联成员同步使用此配置（仅演示）。")};
 const saveResources=()=>{
   const stores=Number(storeAmount),points=Number(pointAmount),data=Number(dataAmount),storage=Number(amount);
   if(![stores,points,data].every(n=>Number.isSafeInteger(n)&&n>=0)||!Number.isFinite(storage)||storage<0||Math.round(storage*10)!==storage*10){
    setError("店铺、AI 积分、数据条数请输入非负整数，存储上限精确到 0.1 GiB。");return;
   }
   if(stores===0&&points===0&&data===0&&storage===0){setError("请填写至少一项本次新增的资源数量。");return}
   if(stores>storeRemaining){setError("续费期数超出企业可分配额度。");return}
   if(points>pointRemaining){setError("AI 积分超出企业可分配额度。");return}
   if(data>dataRemaining){setError("数据条数超出企业可分配额度。");return}
   if(storage>storageRemaining+0.00001){setError("存储上限超出企业可分配容量。");return}
   const member=state.members.find(m=>m.id===selected);if(!member||member.status!=="正常"||member.id==="admin"){setError("当前成员不可分配资源。");return}
   change(addAudit({...state,
    storeAllocations:{...state.storeAllocations,[selected]:(state.storeAllocations[selected]||0)+stores},
    pointAllocations:{...state.pointAllocations,[selected]:(state.pointAllocations[selected]||0)+points},
    dataAllocations:{...state.dataAllocations,[selected]:(state.dataAllocations[selected]||0)+data},
    allocations:{...state.allocations,[selected]:Math.round(((state.allocations[selected]||0)+storage)*10)/10}
   },"资源与额度","追加分配成员 "+member.name+" 资源额度：续费期数 "+stores+"，AI 积分 "+points+"，数据 "+data+" 条，存储 "+storage.toFixed(1)+" GiB"),"新增资源已累计到该成员原有额度，企业剩余额度已同步扣减。");
  };
 const referralLink=()=>typeof location==="undefined"?"":location.origin+"/shuomi/#/workbench/account/referrals/center?preview=1&ref="+encodeURIComponent(state.referralCode);
 const copyReferral=()=>{navigator.clipboard?.writeText(referralLink()).then(()=>setNotice("推广链接已复制。")).catch(()=>setNotice("复制失败，可直接选中链接复制。"))};
 const copyReferralCode=()=>{navigator.clipboard?.writeText(state.referralCode).then(()=>setNotice("推广码已复制。")).catch(()=>setNotice("复制失败，请手动复制推广码。"))};
 const addEarning=()=>{const value=Number(amount);if(!Number.isFinite(value)||value<=0||value>100000){setError("请输入大于0且不超过100000的模拟佣金。");return}if(!email.trim()){setError("请填写模拟客户标识。");return}
  change(referralAudit({...state,referrals:[{id:crypto.randomUUID(),at:Date.now(),referred:email.trim(),amount:Math.round(value*100)/100,status:"已结算"},...state.referrals]},"推广与收益","模拟推广收益已审核并结算："+money(value)),"一笔模拟推广佣金已结算，余额已同步。")
 };
 const saveConfiguredPayout=(configured:string)=>change(referralAudit({...state,payoutAccount:configured},"提现管理","已通过演示安全验证，配置默认收款账户："+configured),"默认收款账户已保存（模拟验证，无真实转账）。");
 const withdraw=()=>{const cents=Math.round(Number(amount)*100);const availableCents=Math.round(balance*100);if(!state.payoutAccount){setError("请先设置收款方式。");return}if(!Number.isSafeInteger(cents)||cents<=0||cents>availableCents){setError("提现金额必须大于0且不超过可提现余额。");return}
 let remaining=cents;const after=state.referrals.flatMap(item=>{if(item.status!=="已结算"||remaining<=0)return [item];const itemCents=Math.round(item.amount*100),taken=Math.min(itemCents,remaining);remaining-=taken;if(taken===itemCents)return [{...item,status:"已提现" as const}];return [{...item,id:crypto.randomUUID(),amount:taken/100,status:"已提现" as const},{...item,amount:(itemCents-taken)/100,status:"已结算" as const}]});
 if(remaining!==0){setError("可提现余额核对失败，未生成提现记录。");return}const n=cents/100;const item={id:crypto.randomUUID(),at:Date.now(),amount:n,account:state.payoutAccount,status:"模拟审核通过" as const};change(referralAudit({...state,referrals:after,withdrawals:[item,...state.withdrawals]},"提现管理","模拟提现并审核通过："+money(n)),"模拟提现申请已审核通过，剩余收益保留；未发起实际转账。")
 };
 const viewAudit=state.audit.filter(a=>(a.actor+" "+a.message+" "+a.category).includes(applied));
 const nav=(path:string)=>{close();setPromotionDetail(null);setNotice("");setQuery("");setApplied("");router.push(goPath(path))};
 const referralPageSize=suffix==="/referrals"?5:10;
 const customerPageCount=Math.max(1,Math.ceil(state.referredCustomers.length/referralPageSize));
 const earningsPageCount=Math.max(1,Math.ceil(state.referrals.length/referralPageSize));
 const visibleCustomerPage=Math.min(customerPage,customerPageCount);
 const visibleEarningsPage=Math.min(earningsPage,earningsPageCount);
 const visibleCustomers=state.referredCustomers.slice((visibleCustomerPage-1)*referralPageSize,visibleCustomerPage*referralPageSize);
 const visibleEarnings=state.referrals.slice((visibleEarningsPage-1)*referralPageSize,visibleEarningsPage*referralPageSize);
 const recent30Day=Date.now()-30*24*60*60*1000;
 const recentReferralCustomers=state.referredCustomers.filter(x=>x.registeredAt>=recent30Day);
 const recentRegistrations=recentReferralCustomers.length+state.trackedVisits.filter(x=>!!x.registeredAt&&x.registeredAt>=recent30Day).length;
 const recentPaidCustomers=recentReferralCustomers.filter(x=>x.storeFeeCny>0).length;
 const recentEarned=state.referrals.filter(x=>x.at>=recent30Day).reduce((sum,x)=>sum+x.amount,0);
 const promotionRows=[
  ...state.referredCustomers.map(x=>({id:x.id,name:x.name,visitedAt:x.registeredAt-5*60*1000,registeredAt:x.registeredAt,verifiedAt:x.registeredAt+60*1000,source:"推广链接",status:"paid",spent:x.storeFeeCny,commission:state.referrals.filter(item=>item.referred===x.name).reduce((sum,item)=>sum+item.amount,0),orderId:x.storeOrderId,storeId:x.storeId})),
  ...state.trackedVisits.map(x=>({id:x.id,name:x.registeredAt?(x.registeredName||"模拟注册用户"):"匿名访客",visitedAt:x.visitedAt,registeredAt:x.registeredAt,verifiedAt:x.verifiedAt,source:x.source,status:x.registeredAt?(x.verifiedAt?"verified":"registered"):"pending",spent:0,commission:0,orderId:"",storeId:""}))
 ].sort((a,b)=>b.visitedAt-a.visitedAt);
 const filteredPromotions=promotionRows.filter(x=>(promotionStatus==="all"||promotionStatus==="registered"&&!!x.registeredAt||promotionStatus==="verified"&&!!x.verifiedAt||promotionStatus==="unpaid"&&!!x.registeredAt&&x.status!=="paid"||promotionStatus===x.status&&promotionStatus!=="registered"&&promotionStatus!=="verified")&&([x.id,x.name,x.source,x.orderId].join(" ").toLowerCase().includes(promotionSearch.trim().toLowerCase())));
 const promotionsPerPage=10;
 const promotionPages=Math.max(1,Math.ceil(filteredPromotions.length/promotionsPerPage));
 const selectedPromotionPage=Math.min(promotionPage,promotionPages);
 const pagedPromotions=filteredPromotions.slice((selectedPromotionPage-1)*promotionsPerPage,selectedPromotionPage*promotionsPerPage);
 const selectedPromotion=promotionRows.find(x=>x.id===promotionDetail);
 const promotionStateText=(status:string)=>({pending:"访问未注册",registered:"已注册",verified:"已验证",paid:"已消费"})[status as "pending"|"registered"|"verified"|"paid"]||status;
 const knownRegistered=promotionRows.filter(x=>!!x.registeredAt).length;
 const knownPaid=promotionRows.filter(x=>x.status==="paid").length;


 const pagination=(label:string,total:number,page:number,pages:number,onPage:(value:number)=>void)=><div className={s.recordPager} role="navigation" aria-label={label+"分页"}>
  <span>共 {total} 条 · 每页 {referralPageSize} 条 · 第 {page} / {pages} 页</span>
  <div><button type="button" disabled={page<=1} onClick={()=>onPage(Math.max(1,page-1))}>上一页</button>
  <button type="button" disabled={page>=pages} onClick={()=>onPage(Math.min(pages,page+1))}>下一页</button></div>
 </div>;
 const tiles=(items:[string,string,string][]) => <div className={s.metrics}>{items.map(([label,value,hint],i)=><article key={label} data-tone={i}><span>{label}</span><strong>{value}</strong><small>{hint}</small></article>)}</div>;
 return <main className={s.page} data-account-suite={suffix}>
  <header className={s.hero}><div><small>我的账户 / {enterprise?"企业空间":"推广与收益"}{overview||suffix==="/referrals"?"":" / "+title}</small><h1>{title}</h1><p>{desc}</p></div>{(suffix==="/organization/members"||suffix==="/organization/roles")&&<div className={s.heroActions}>{suffix==="/organization/members"&&<button className={s.primary} onClick={()=>open("invite")}>邀请成员</button>}{suffix==="/organization/roles"&&<button className={s.primary} onClick={()=>open("role")}>新建角色</button>}</div>}</header>
  <nav className={s.subNavigation} aria-label={enterprise?"企业空间业务导航":"推广与收益业务导航"}>{sectionMenu.map(([label,path])=><button key={path} type="button" aria-current={suffix===path?"page":undefined} onClick={()=>nav(path)}>{label}</button>)}</nav>
  {colleagueReferral&&<p className={s.disclaimer} role="note">当前推广空间：{organizationName} · {primary.state.members.find(m=>m.id===memberId)?.name||"模拟成员"}（{primary.state.members.find(m=>m.id===memberId)?.email||memberId}）。当前组织的推广记录、收益、收款账户与提现记录独立保存，不与其他组织合并。</p>}
  {notice&&<div className={s.notice} role="status">{notice}<button onClick={()=>setNotice("")} aria-label="关闭消息">×</button></div>}
  <section className={s.identity}><div className={s.avatar}>硕</div><div className={s.identityInfo}><h2>{tenant.name}</h2><p><span className={s.approved}>已认证（模拟）</span> 企业编号：{tenant.id} · 管理员：{tenant.admin}</p></div><span className={s.mode}>演示企业空间 · 不影响真实账户</span></section>
  {overview&&<>
    <div className={s.enterpriseStats} role="region" aria-label="企业空间概览"><div className={s.metrics}>{([["企业成员",String(activeMembers.length),"当前启用的企业成员"],["已绑定店铺",String(boundStores.organizationCount),"本组织登记店铺；待授权 "+boundStores.pendingCount+" 家"],["邀请中",String(pendingMembers.length),"等待成员接受邀请"]] as const).map(([label,value,hint],i)=><article key={label} data-tone={i}><span className={s.enterpriseMetricNumber}>{value}</span><div className={s.enterpriseMetricText}><strong>{label}</strong><small>{hint}</small></div></article>)}</div></div>
    <section className={s.panel} aria-label="企业资源"><header><h2>企业资源</h2><p>展示当前企业可用资源与共享容量情况</p></header><div className={s.resourceSummary}>
      {([
       {label:"店铺",value:String(boundStores.organizationCount)+" 家",hint:boundStores.organizationCount?"当前绑定 "+boundStores.organizationCount+" 家 · 已授权 0 家":"当前未绑定店铺",Icon:Store,tone:"store"},
       {label:"AI 积分",value:enterpriseTotals.aiPoints.toLocaleString("zh-CN"),hint:enterpriseTotals.aiPoints?"可用积分余额":"当前无可用积分",Icon:Sparkles,tone:"points"},
       {label:"数据额度",value:enterpriseTotals.dataRows.toLocaleString("zh-CN")+" 条",hint:enterpriseTotals.dataRows?"剩余可用数据条数":"暂无剩余额度",Icon:Database,tone:"data"},
       {label:"企业存储",value:enterpriseTotals.storageGiB+" GiB",hint: "免费 5 GiB + 扩容 "+(enterpriseTotals.storageGiB-5).toFixed(1)+" GiB · 已分配 "+usedStorage.toFixed(1)+" GiB",Icon:HardDrive,tone:"storage"}
      ] as const).map(({label,value,hint,Icon,tone})=><article key={label} data-tone={tone}><div className={s.resourceIcon}><Icon size={21} strokeWidth={1.9} aria-hidden="true"/></div><span className={s.resourceLabel}>{label}</span><strong>{value}</strong><small>{hint}</small>{tone==="storage"&&<div className={s.storageTrack} role="progressbar" aria-label="已分配企业存储" aria-valuemin={0} aria-valuemax={enterpriseTotals.storageGiB} aria-valuenow={Math.min(enterpriseTotals.storageGiB,usedStorage)}><div style={{width:Math.max(0,Math.min(100,enterpriseTotals.storageGiB?usedStorage/enterpriseTotals.storageGiB*100:0))+"%"}}/></div>}</article>)}
    </div></section>

  </>}
  {suffix==="/organization/members"&&<>{tiles([["启用成员",String(activeMembers.length),"包含管理员"],["管理员",String(state.members.filter(m=>m.role==="管理员"&&m.status==="正常").length),"拥有全部权限"],["已停用成员",String(disabledMembers.length),"可按需重新启用"],["邀请中",String(pendingMembers.length),"等待成员接受"]])}
   <section className={`${s.panel} ${s.memberManagement}`} aria-label="成员列表">
    <header><h2>成员列表</h2><p>管理当前企业成员、角色及状态，支持搜索与分页。</p></header>
    <div className={s.memberFilters}>
     <label>搜索成员<input type="search" aria-label="搜索成员" placeholder="搜索手机号或邮箱" value={memberSearch} onChange={e=>{setMemberSearch(e.target.value);setMemberPage(1)}}/></label>
     <label>状态<select aria-label="筛选成员状态" value={memberStatus} onChange={e=>{setMemberStatus(e.target.value);setMemberPage(1)}}><option value="all">全部状态</option><option value="正常">正常</option><option value="已停用">已停用</option><option value="邀请中">邀请中</option></select></label>
    </div>
    <div className={`${s.tableWrap} ${s.memberTable}`}><table><thead><tr>{["成员 / 联系方式","邮箱","角色","状态","加入 / 邀请时间","操作"].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{pagedMembers.map(m=><tr key={m.id}><td><strong>{m.name}</strong>{m.phone&&m.name!==m.phone&&<small> · {m.phone}</small>}</td><td>{m.email||"—"}</td><td>{m.role}</td><td><span className={m.status==="正常"?s.approved:s.memberInactive}>{m.status}</span></td><td>{timestamp(m.joined)}</td><td><div className={s.rowActions}><button onClick={()=>open("member",m.id)}>查看{m.id==="admin"?"":" / 调整"}</button>{m.status==="邀请中"?<><button onClick={()=>acceptInvitation(m)}>模拟接受</button><button onClick={()=>cancelInvitation(m)}>取消邀请</button></>:m.id!=="admin"&&<button onClick={()=>toggleMember(m)}>{m.status==="正常"?"停用":"启用"}</button>}</div></td></tr>)}</tbody></table>{!filteredMembers.length&&<div className={s.empty}>没有符合条件的成员。</div>}</div>
    <div className={s.memberPagination}>
     <div><label htmlFor="members-page-size">每页显示</label><select id="members-page-size" value={memberPageSize} onChange={e=>{setMemberPageSize(Number(e.target.value));setMemberPage(1)}}><option value={10}>10 条</option><option value={20}>20 条</option><option value={50}>50 条</option></select><span>共 {filteredMembers.length} 位成员</span></div>
     <div><span aria-live="polite">第 {currentMemberPage} / {memberPageCount} 页</span><button type="button" aria-label="成员上一页" disabled={currentMemberPage<=1} onClick={()=>setMemberPage(p=>Math.max(1,p-1))}>上一页</button><button type="button" aria-label="成员下一页" disabled={currentMemberPage>=memberPageCount} onClick={()=>setMemberPage(p=>Math.min(memberPageCount,p+1))}>下一页</button></div>
    </div>
   </section>
  </>}
  {suffix==="/organization/roles"&&<>{tiles([["系统角色","1","管理员不可删除"],["业务角色",String(state.roles.length-1),"可继续新建"],["企业成员",String(activeMembers.length),"角色生效人数"],["待审核事项","0","模拟审核全部通过"]])}
   <section className={s.panel}><header><h2>角色权限</h2><p>新增角色可以在邀请成员及调整成员时直接使用。</p></header><div className={s.tableWrap}><table><thead><tr><th>角色名称</th><th>权限范围</th><th>关联成员</th><th>性质</th><th>操作</th></tr></thead><tbody>{state.roles.map(r=><tr key={r}><td><strong>{r}</strong></td><td>{r==="管理员"?"全部权限":permissionSummary(state.rolePermissions[r]||[])}</td><td>{state.members.filter(m=>m.role===r&&m.status==="正常").length} 人</td><td>{r==="管理员"?"系统角色":"业务角色"}</td><td><button disabled={r==="管理员"} onClick={()=>open("permissions",r)}>配置权限</button></td></tr>)}</tbody></table></div><div className={s.quicklinks}><button onClick={()=>nav("/organization/members")}>管理成员角色</button></div></section>
  </>}
  {suffix==="/organization/resources"&&<>{tiles([["剩余可分配续费期数",String(storeRemaining),"已登记 "+boundStores.organizationCount+" 家店铺 · 已使用 "+consumedStorePeriods+" 期 · 总计 "+storeQuota+" 期 · 已分配 "+usedStores+" 期"],["剩余可分配 AI 积分",pointRemaining.toLocaleString("zh-CN"),"总计 "+enterpriseTotals.aiPoints.toLocaleString("zh-CN")+" · 已分配 "+usedPoints.toLocaleString("zh-CN")],["剩余可分配数据额度",dataRemaining.toLocaleString("zh-CN"),"总计 "+enterpriseTotals.dataRows.toLocaleString("zh-CN")+" · 已分配 "+usedData.toLocaleString("zh-CN")],["剩余可分配共享存储",storageRemaining.toFixed(1)+" GiB", "总计 "+enterpriseTotals.storageGiB+" GiB（免费 5 GiB） · 已分配 "+usedStorage.toFixed(1)+" GiB"]])}
   <section className={s.panel}><header><h2>成员资源分配</h2><p>为成员追加分配店铺续费期数、AI 积分、数据条数和存储容量。每次分配累加，不覆盖历史额度，不能超出组织剩余。</p></header><div className={s.tableWrap}><table><thead><tr><th>成员</th><th>角色</th><th>已绑定店铺</th><th>续费期数</th><th>AI 积分</th><th>数据条数</th><th>存储上限</th><th>操作</th></tr></thead><tbody>{activeMembers.map(m=><tr key={m.id}><td><strong>{m.name}</strong></td><td>{m.role}</td><td><strong>{boundStores.all.filter(store=>store.ownerMemberId===m.id).length} 家</strong><small style={{display:"block",marginTop:4,whiteSpace:"nowrap",opacity:0.72}}>服务中 {boundStores.all.filter(store=>store.ownerMemberId===m.id&&demoStoreServiceActive(store)).length} 家 · 每期30天</small></td><td><strong>{state.storeAllocations[m.id]||0}</strong><small style={{display:"block",marginTop:4,whiteSpace:"nowrap",opacity:0.72}}>已用 0 · 剩余 {state.storeAllocations[m.id]||0}</small></td><td><strong>{(state.pointAllocations[m.id]||0).toLocaleString("zh-CN")}</strong><small style={{display:"block",marginTop:4,whiteSpace:"nowrap",opacity:0.72}}>已用 0 · 剩余 {(state.pointAllocations[m.id]||0).toLocaleString("zh-CN")}</small></td><td><strong>{(state.dataAllocations[m.id]||0).toLocaleString("zh-CN")}</strong><small style={{display:"block",marginTop:4,whiteSpace:"nowrap",opacity:0.72}}>已用 0 · 剩余 {(state.dataAllocations[m.id]||0).toLocaleString("zh-CN")}</small></td><td><strong>{(state.allocations[m.id]||0).toFixed(1)} GiB</strong><small style={{display:"block",marginTop:4,whiteSpace:"nowrap",opacity:0.72}}>已用 0 · 剩余 {(state.allocations[m.id]||0).toFixed(1)} GiB</small></td><td><button disabled={m.id==="admin"} onClick={()=>open("storage",m.id)}>分配资源</button></td></tr>)}</tbody></table></div><div className={s.quicklinks}><button onClick={()=>router.push("/workbench/plans/top-up?preview=1")}>前往充值中心</button><button onClick={()=>router.push("/workbench/store-center?preview=1")}>前往店铺中心</button></div></section>
  </>}
  {suffix==="/organization/audit"&&<>{tiles([["操作记录",String(state.audit.length),"本企业模拟事件"],["成员变更",String(state.audit.filter(x=>x.category==="成员与权限").length),"成员邀请、状态、角色"],["角色配置",String(state.audit.filter(x=>x.category==="角色权限").length),"企业角色调整"],["推广与收益",String(state.audit.filter(x=>x.category.includes("推广")||x.category.includes("提现")).length),"模拟收益与提现"]])}
   <section className={s.panel}><header><h2>操作记录</h2><p>所有在本次模拟中确认的变更都在这里留痕。</p></header><div className={s.toolbar}><input value={query} aria-label="搜索操作记录" onChange={e=>setQuery(e.target.value)} placeholder="搜索操作人、类型、内容"/><button onClick={()=>{setQuery("");setApplied("")}}>重置</button><button className={s.primary} onClick={()=>setApplied(query.trim())}>确定</button></div><div className={s.tableWrap}><table><thead><tr><th>操作时间</th><th>操作人</th><th>所属模块</th><th>操作内容</th><th>结果</th></tr></thead><tbody>{viewAudit.map(x=><tr key={x.id}><td>{timestamp(x.at)}</td><td>{x.actor}</td><td>{x.category}</td><td>{x.message}</td><td>模拟完成</td></tr>)}</tbody></table>{!viewAudit.length&&<div className={s.empty}>暂无相关操作记录。</div>}</div></section>
  </>}
  {referral&&<>{suffix!=="/referrals/center"&&tiles([["累计推广收益",money(totalEarnings(state)),"本企业模拟收益"],["可提现余额",money(balance),"模拟已结算金额"],["已提现",money(state.withdrawals.reduce((sum,x)=>sum+x.amount,0)),"只记模拟记录"],["模拟推广访客",String(state.referredCustomers.length+state.trackedVisits.length),"包含访问未注册、注册及消费记录"]])}

   {suffix==="/referrals/center"&&<>
    <div className={s.metrics} role="region" aria-label="推广中心核心指标">{([
     ["推广访问用户",String(promotionRows.length),"模拟归因访客，非真实流量统计"],
     ["有效注册",String(knownRegistered),"模拟注册且已完成验证"],
     ["付费用户",String(knownPaid),"已产生基础店铺服务消费"],
     ["累计收益",money(totalEarnings(state)),"按已消费订单计算的模拟佣金"]
    ] as [string,string,string][]).map(([label,value,hint],i)=><article key={label} data-tone={i}><span>{label}</span><strong>{value}</strong><small>{hint}</small></article>)}</div>
    <div className={s.referralDesignGrid}>
     <section className={s.panel} aria-label="我的推广">
      <header><h2>我的推广</h2><p>分享专属链接、推广码或二维码，关联注册与消费转化。</p></header>
      <div className={s.referralShareLayout}>
       <div className={s.referralShareFields}>
        <div><span>推广链接</span><div className={s.referralCopyField}><span title={referralLink()}>{referralLink()}</span><button type="button" onClick={copyReferral}>复制</button></div></div>
        <div><span>推广码</span><div className={s.referralCopyField}><strong>{state.referralCode}</strong><button type="button" onClick={copyReferralCode}>复制</button></div></div>
       </div>
       <div className={s.referralQrArea} aria-label="推广二维码"><div className={s.referralQrPlaceholder}>二维码<br/>待接入</div><span>推广二维码</span><small>请先使用推广链接或推广码</small></div>
      </div>
     </section>
     <section className={s.panel} aria-label="近30天推广转化">
      <header><h2>近30天推广转化</h2><p>近30天模拟访问、注册、付费与收益；未接入真实流量追踪。</p></header>
      <div className={s.referralFunnel}>
       {([["访问",String(promotionRows.filter(x=>x.visitedAt>=recent30Day).length),"模拟归因访客；真实访问埋点未接入"],["注册",String(recentRegistrations),"已记录模拟注册"],["付费",String(recentPaidCustomers),"已产生店铺服务扣款"],["收益",money(recentEarned),"模拟佣金收益"]] as const).map(([label,value,hint])=><div className={s.referralFunnelStep} key={label}><span>{label}</span><strong>{value}</strong><small>{hint}</small></div>)}
      </div>
     </section>
    </div>
    <section className={s.panel} aria-label="推广明细">
     <header><h2>推广明细</h2><p>按访问状态筛选记录，点击查看详情了解注册、验证、消费进度。匿名访客仅显示编号，数据为模拟示例。</p></header>
     <div className={s.promotionFilters}>
      <div className={s.promotionTabs} role="group" aria-label="推广访客状态筛选">
       {([["all","全部"],["pending","访问未注册"],["registered","已注册"],["verified","已验证"],["unpaid","未消费"],["paid","已消费"]] as const).map(([id,label])=><button key={id} type="button" aria-pressed={promotionStatus===id} onClick={()=>{setPromotionStatus(id);setPromotionPage(1)}}>{label}</button>)}
      </div>
      <input aria-label="搜索推广访客" value={promotionSearch} onChange={e=>{setPromotionSearch(e.target.value);setPromotionPage(1)}} placeholder="搜索访客编号、注册用户或订单" />
     </div>
     <div className={s.tableWrap}><table><thead><tr><th>访客 / 注册用户</th><th>访问时间</th><th>推广来源</th><th>转化状态</th><th>消费金额</th><th>累计佣金</th><th>操作</th></tr></thead>
      <tbody>{pagedPromotions.map(x=><tr key={x.id}>
       <td><strong>{x.name}</strong><small>{x.id}</small></td><td>{timestamp(x.visitedAt)}</td><td>{x.source}</td>
       <td><span className={s.promotionStatus} data-status={x.status}>{promotionStateText(x.status)}</span></td>
       <td>{x.spent?money(x.spent):"—"}</td><td>{x.commission?money(x.commission):"—"}</td>
       <td><button type="button" onClick={()=>setPromotionDetail(x.id)}>查看详情</button></td>
      </tr>)}</tbody></table>{!filteredPromotions.length&&<div className={s.empty}>当前筛选下暂无记录，可调整筛选条件或关键词。</div>}</div>
     <div className={s.recordPager} role="navigation" aria-label="推广明细分页">
      <span>共 {filteredPromotions.length} 条 · 每页 10 条 · 第 {selectedPromotionPage} / {promotionPages} 页</span>
      <div><button type="button" disabled={selectedPromotionPage<=1} onClick={()=>setPromotionPage(x=>Math.max(1,x-1))}>上一页</button><button type="button" disabled={selectedPromotionPage>=promotionPages} onClick={()=>setPromotionPage(x=>Math.min(promotionPages,x+1))}>下一页</button></div>
     </div>
    </section>
   </>}
   {suffix==="/referrals"&&<section className={s.panel}><header><h2>推广入口与业务概览</h2><p>推广链接、推广码、推广二维码、30 天转化漏斗及推广访客明细统一在推广中心管理。</p></header><div className={s.recordMore}><button type="button" className={s.primary} onClick={()=>nav("/referrals/center")}>进入推广中心</button></div></section>}
   {suffix==="/referrals/earnings"&&<div className={s.referralManualActions}><button type="button" onClick={()=>open("earning")}>模拟一笔推广成交并结算</button></div>}
   {(suffix==="/referrals/earnings"||suffix==="/referrals")&&<section className={s.panel}><header><h2>收益明细</h2><p>本次模拟按已支付的基础店铺服务费 × 10% 产生佣金；用户钱包充值和未消费余额不产生佣金。所有数据仅用于演示。</p></header><div className={s.tableWrap}><table><thead><tr><th>时间</th><th>模拟客户</th><th>消费订单</th><th>已消费金额</th><th>佣金比例</th><th>收益金额</th><th>结算状态</th></tr></thead><tbody>{visibleEarnings.map(x=><tr key={x.id}><td>{timestamp(x.at)}</td><td>{x.referred}</td><td>{x.orderId||"手动模拟"}</td><td>{x.paidCny===undefined?"—":money(x.paidCny)}</td><td>{x.rate===undefined?"手动模拟":(x.rate*100).toFixed(0)+"%"}</td><td>{money(x.amount)}</td><td>{x.status}（模拟）</td></tr>)}</tbody></table>{!state.referrals.length&&<div className={s.empty}>暂无推广收益。</div>}</div>{pagination("推广收益明细",state.referrals.length,visibleEarningsPage,earningsPageCount,setEarningsPage)}{suffix==="/referrals"&&<div className={s.recordMore}><button type="button" onClick={()=>nav("/referrals/earnings")}>查看全部收益记录</button></div>}</section>}
      {suffix==="/referrals/withdrawals"&&<><section className={s.panel}><header><h2>收款账户</h2><p>提现前需配置收款账户；演示仅保存收款标识，不会真实转账。</p></header><div className={s.linkRow}><div><span>当前收款方式</span><strong>{state.payoutAccount||"尚未配置"}</strong></div><div className={s.payoutActions}><button type="button" onClick={()=>{open("payout");setAccount(state.payoutAccount)}}>配置账户</button><button type="button" className={s.primary} disabled={!balance||!state.payoutAccount} onClick={()=>open("withdraw")}>申请提现</button></div></div>{!state.payoutAccount&&<p className={s.dialogHint}>请先配置账户，再申请提现。</p>}</section><section className={s.panel}><header><h2>提现记录</h2><p>仅已结算收益可申请提现，演示审核自动通过，不发起真实打款。</p></header><div className={s.tableWrap}><table><thead><tr><th>申请时间</th><th>金额</th><th>收款标识</th><th>状态</th></tr></thead><tbody>{state.withdrawals.map(x=><tr key={x.id}><td>{timestamp(x.at)}</td><td>{money(x.amount)}</td><td>{x.account}</td><td>{x.status}</td></tr>)}</tbody></table>{!state.withdrawals.length&&<div className={s.empty}>暂无提现记录。</div>}</div></section></>}
   {suffix==="/referrals/rules"&&<>
    <section className={s.panel} aria-label="推广规则生效说明">
     <header><h2>当前规则以平台实际生效版本为准</h2><p>以下内容为当前完整规则说明；佣金比例、结算周期及可推广业务由平台统一配置，规则变更后以最新生效版本执行。</p></header>
     <p className={s.ruleDemoNotice}>当前页面为功能演示，尚未连接正式规则配置与支付结算服务。下面展示 Figma 原型的规则文案，不表示这些政策已经对真实用户生效。</p>
    </section>
    <section className={s.referralRuleGrid} aria-label="推广规则条款">
     {([
      ["推广关系如何建立","用户通过推广链接、推广码或二维码首次注册并完成账号验证后建立推广关系。推广关系以系统最终记录为准，重复注册、无效账号不计入有效推广。"],
      ["哪些订单产生收益","符合平台推广政策并完成支付的套餐、token 积分充值、数据服务、店铺续费等订单可产生收益；退款、撤销、异常或违规订单不计入有效收益。"],
      ["收益如何计算","收益按订单所属业务及下单时生效的佣金规则自动计算，不同业务的收益比例可以不同，最终金额以系统收益明细和实际结算结果为准。"],
      ["结算与退款处理","订单达到结算条件后由待结算转为已结算；发生退款、撤销或风控判定异常时，未结算收益取消，已结算收益可按规则冲正或扣回。"],
      ["提现规则","仅已结算并进入可提现余额的收益可以申请提现。提现前需绑定有效收款账户，到账时间以平台处理状态和实际支付渠道为准。"],
      ["违规推广处理","禁止虚假注册、刷单、自买自返、批量账号等违规推广行为。异常推广关系、订单及收益可被取消，严重违规时平台可限制推广或提现功能。"]
     ] as const).map(([heading,description])=><article className={s.referralRuleCard} key={heading}><h3>{heading}</h3><p>{description}</p></article>)}
    </section>
   </>}
  </>}
  {selectedPromotion&&<div className={s.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setPromotionDetail(null)}}>
   <section className={s.dialog} role="dialog" aria-modal="true" aria-label="推广用户详情">
    <header><h2>推广用户详情</h2><button type="button" aria-label="关闭推广用户详情" onClick={()=>setPromotionDetail(null)}>×</button></header>
    <p className={s.dialogHint}>模拟推广访客记录 · {selectedPromotion.name} · {selectedPromotion.id}</p>
    <div className={s.promotionDetailSummary}>
     <div><span>转化状态</span><strong>{promotionStateText(selectedPromotion.status)}</strong></div>
     <div><span>推广来源</span><strong>{selectedPromotion.source}</strong></div>
     <div><span>累计消费</span><strong>{money(selectedPromotion.spent)}</strong></div>
     <div><span>累计佣金</span><strong>{money(selectedPromotion.commission)}</strong></div>
    </div>
    <h3>转化进度</h3>
    <ol className={s.promotionTimeline}>
     <li><strong>首次记录推广访问</strong><small>{timestamp(selectedPromotion.visitedAt)}</small></li>
     <li><strong>注册成功</strong><small>{selectedPromotion.registeredAt?timestamp(selectedPromotion.registeredAt):"尚未注册"}</small></li>
     <li><strong>账号验证</strong><small>{selectedPromotion.verifiedAt?timestamp(selectedPromotion.verifiedAt):"尚未验证"}</small></li>
     <li><strong>首次消费</strong><small>{selectedPromotion.spent?money(selectedPromotion.spent)+" · "+selectedPromotion.orderId:"尚无有效消费记录"}</small></li>
     <li><strong>收益记录</strong><small>{selectedPromotion.commission?money(selectedPromotion.commission)+" · 已产生模拟收益":"尚未产生收益"}</small></li>
    </ol>
    {selectedPromotion.spent>0&&<p className={s.dialogHint}>订单及结算流水可在「收益明细」查询。</p>}
    <footer><button type="button" onClick={()=>setPromotionDetail(null)}>关闭</button>{selectedPromotion.spent>0&&<button type="button" className={s.primary} onClick={()=>nav("/referrals/earnings")}>查看收益明细</button>}</footer>
   </section>
  </div>}
  {modal&&<div className={s.overlay} onMouseDown={e=>e.target===e.currentTarget&&close()}><section className={modal==="permissions"?`${s.dialog} ${s.permissionDialog}`:modal==="payout"?`${s.dialog} ${s.payoutDialog}`:s.dialog} role="dialog" aria-modal="true" aria-label={{invite:"邀请成员",member:"管理成员",role:"新建角色",permissions:"配置角色权限",storage:"分配成员资源",earning:"模拟推广收益",payout:"配置收款账户",withdraw:"申请提现"}[modal]}><header><h2>{{invite:"邀请成员",member:"管理成员",role:"新建角色",permissions:"配置角色权限",storage:"分配成员存储",earning:"模拟推广收益",payout:"配置收款账户",withdraw:"申请提现"}[modal]}</h2><button aria-label="关闭弹窗" onClick={close}>×</button></header><p className={s.dialogHint}>{modal==="invite"?"填写手机号或邮箱，至少一项必填。演示邀请会记录为“邀请中”，不会发送真实短信或邮件。":"此处操作仅作用于当前演示数据，变更会记录在操作日志中。"}</p>
    {modal==="invite"&&<><label>手机号（可选）<input aria-label="成员手机号" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="例如 +8613800138000"/></label><label>邮箱（可选）<input aria-label="成员邮箱" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="例如 colleague@example.com"/></label></>}
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
    {modal==="storage"&&<><p>成员：{currentMember?.name} · 请填写本次新增数量，默认为 0；确认后累加到已有额度，不会重置原有分配。</p>
      <div className={s.resourceAllocationFields}>
       <label>新增店铺续费期数 <small>剩余可分配：{storeRemaining} 期 · 本成员已分配：{state.storeAllocations[selected]||0} 期</small><input type="number" aria-label="分配店铺续费期数" min="0" max={storeRemaining} step="1" value={storeAmount} onChange={e=>setStoreAmount(e.target.value)}/></label>
       <label>新增 AI 积分 <small>剩余可分配：{pointRemaining.toLocaleString("zh-CN")} · 本成员已分配：{(state.pointAllocations[selected]||0).toLocaleString("zh-CN")}</small><input type="number" aria-label="分配AI积分" min="0" max={pointRemaining} step="1" value={pointAmount} onChange={e=>setPointAmount(e.target.value)}/></label>
       <label>新增数据条数 <small>剩余可分配：{dataRemaining.toLocaleString("zh-CN")} 条 · 本成员已分配：{(state.dataAllocations[selected]||0).toLocaleString("zh-CN")} 条</small><input type="number" aria-label="分配数据条数" min="0" max={dataRemaining} step="1" value={dataAmount} onChange={e=>setDataAmount(e.target.value)}/></label>
       <label>新增存储容量（GiB）<small>剩余可分配：{storageRemaining.toFixed(1)} GiB · 本成员已分配：{(state.allocations[selected]||0).toFixed(1)} GiB</small><input type="number" aria-label="成员存储上限" min="0" max={storageRemaining} step="0.1" value={amount} onChange={e=>setAmount(e.target.value)}/></label>
      </div>
     </>}
    {modal==="role"&&<label>角色名称<input aria-label="角色名称" value={name} onChange={e=>setName(e.target.value)} placeholder="例如：运营专员"/></label>}
    {modal==="earning"&&<><label>模拟客户标识<input aria-label="模拟客户标识" value={email} onChange={e=>setEmail(e.target.value)} placeholder="例如：TEST-CUSTOMER-001"/></label><label>模拟佣金金额（元）<input type="number" min="0.01" step="0.01" aria-label="模拟佣金金额" value={amount} onChange={e=>setAmount(e.target.value)}/></label></>}
    {modal==="payout"&&<PayoutConfigurator organizationId={organizationId} memberId={memberId} current={state.payoutAccount} onSave={saveConfiguredPayout}/>}
    {modal==="withdraw"&&<><p>当前可提现金额：{money(balance)}。支持部分提现，剩余收益继续保留为可提现余额。</p><label>模拟提现金额<input type="number" step="0.01" aria-label="模拟提现金额" value={amount} onChange={e=>setAmount(e.target.value)}/></label></>}
    {error&&<p role="alert" className={s.error}>{error}</p>}{modal!=="payout"&&<footer><button onClick={close}>取消</button><button className={s.primary} onClick={()=>({invite:addMember,member:updateMember,role:addRole,permissions:savePermissions,storage:saveResources,earning:addEarning,withdraw}[modal])()} disabled={modal==="member"&&selected==="admin"}>{modal==="invite"?"确认邀请":modal==="withdraw"?"确认提现":"确认并模拟通过"}</button></footer>}
   </section></div>}
  <p className={s.disclaimer}>所有账户、权限、收益和审核操作均为本地演示数据，非真实身份认证、平台授权、支付或转账。成员推广数据按演示账号分别保存。</p>
 </main>;
}
