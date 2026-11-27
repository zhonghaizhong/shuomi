"use client";
import {useEffect,useState,type FormEvent} from "react";
import {Building2,Package,Truck,Plus,Search,ShieldCheck,ClipboardList} from "lucide-react";
import css from "./showcase-store-center.module.css";
import {useShowcaseSuite} from "../account/showcase-account-state";
import {getDemoMembership} from "../../../../showcase/demo-identity";
import {demoStoreKey,readDemoStoreBindings,saveDemoStoreBindings,startDemoStoreService,demoStoreServiceActive,countConsumedStorePeriods,countPoolConsumedStorePeriods,type DemoStoreBinding} from "../store-binding-demo";
import {useDemoPurchases} from "../showcase-purchases";
import {readStoreProductSnapshot,saveVerifiedStoreProductSnapshot,buildAdminStoreSyncDemo} from "./store-product-snapshot-demo";
import {simulateApprovedKindleListing} from "../listing/showcase-upload-tasks";

type Store=DemoStoreBinding;
const demoSites=["美国站","加拿大站","英国站","德国站","法国站"] as const;
const demoTenant="SM-ENT-000001";
const storeKey=demoStoreKey;
// Reset previous demo stores and groups once after deployment. Leave newly created v4 records intact.
const obsoleteKeys=["shuomi-store-center-empty-v3","shuomi-store-center-empty-v2","shuomi-store-center-empty-v1"];
// The first three entry descriptions follow Figma's Store Center introduction (1220:359).
// Listing Management is the newer real second-level navigation item and is inserted
// without reworking the approved Vuexy visual tokens or other page layouts.
const areas=[
  {name:"我的店铺",path:"/workbench/stores",icon:Building2,description:"绑定店铺后即可管理，按30天服务期使用并查看商品、订单同步状态。",labels:["店铺管理","服务状态","数据同步"],action:"管理我的店铺"},
 {name:"刊登管理",path:"/workbench/listing",icon:ClipboardList,description:"管理商品刊登资料与流程，依次处理待上传、待补全、待审核和已上传商品。",labels:["刊登准备","资料补全","上传管理"],action:"进入刊登管理"},
 {name:"店铺商品",path:"/workbench/store-products",icon:Package,description:"统一查看店铺已上架商品，核对刊登状态、库存变化及各店商品同步记录。",labels:["商品资产","刊登状态","库存同步"],action:"查看店铺商品"},
 {name:"订单管理",path:"/workbench/store-orders",icon:Truck,description:"集中处理订单待办、采购与收货、装箱发货、物流交接及平台订单记录。",labels:["订单处理","发货进度","物流跟踪"],action:"进入订单管理"},
] as const;
const steps=[
  ["01","绑定店铺","选择平台、站点和店铺类型，绑定后即可开始使用；服务按30天一期计费。"],
 ["02","准备并刊登商品","通过刊登管理完成商品资料上传、补全、审核与发布。"],
 ["03","同步店铺商品","拉取店铺商品及状态，核对刊登信息与库存。"],
 ["04","接收并处理订单","查看订单待办和异常，确认采购、发货及处理要求。"],
 ["05","完成发货履约","同步物流与发货状态，跟踪交付进度及异常。"],
] as const;
const collaboration=[
  {title:"我的店铺",detail:"绑定管理与服务期管理"},
 {title:"刊登管理",detail:"商品资料准备、审核及上传"},
 {title:"店铺商品",detail:"刊登状态、库存及数据同步"},
 {title:"订单管理",detail:"待办、采购、发货及物流跟踪"},
] as const;
function read(organizationId:string):Store[]{
 try{for(const old of obsoleteKeys){sessionStorage.removeItem(old);sessionStorage.removeItem(old+"-groups");}}catch{}
 return readDemoStoreBindings(organizationId);
}
export function ShowcaseStoreCenter({pathname,navigate,memberId="admin",organizationId=demoTenant}:{pathname:string;navigate:(path:string)=>void;memberId?:string;organizationId?:string}){
 const key=storeKey(organizationId);
 const administrator=memberId==="admin"||getDemoMembership({organizationId,memberId})?.role==="管理员";
 const {state:enterpriseState,commit:commitEnterprise}=useShowcaseSuite();
 const {totals:resourceTotals}=useDemoPurchases(organizationId);
 const ownerMembers=enterpriseState.members.filter(member=>member.status==="正常"&&(organizationId===demoTenant||member.id===memberId||Boolean(getDemoMembership({organizationId,memberId:member.id}))));
 const owners=[...new Set(ownerMembers.map(member=>member.name))];
 const ownerName=(s:Store)=>ownerMembers.find(m=>m.id===s.ownerMemberId)?.name||s.owner||"未分配成员";
 const [allStores,setAllStores]=useState<Store[]>(()=>read(organizationId));
 const stores=administrator?allStores.filter(s=>!s.archived):allStores.filter(s=>s.ownerMemberId===memberId&&!s.archived);
 const deletedStores=allStores.filter(s=>s.archived&&Boolean(s.platformStoreId)&&Number(s.servicePeriods)>0&&(administrator||s.ownerMemberId===memberId));
 const isMainTenant=organizationId===demoTenant;
 const consumedPeriods=countPoolConsumedStorePeriods(allStores);
 const allocatedPeriods=Object.values(enterpriseState.storeAllocations).reduce((total,v)=>total+(Number(v)||0),0);
 const ownAssignedPeriods=enterpriseState.storeAllocations[memberId]||0;
 const availablePeriods=administrator?(isMainTenant?Math.max(0,resourceTotals.renewalPeriods-consumedPeriods-allocatedPeriods):Math.max(0,resourceTotals.renewalPeriods-consumedPeriods)):(isMainTenant?Math.max(0,ownAssignedPeriods):0);
 const validBinding=(s:Store)=>Boolean(s.platformStoreId&&Number(s.servicePeriods)>0);
 const isExpired=(s:Store)=>validBinding(s)&&!demoStoreServiceActive(s);
 const hasConnectionIssue=(s:Store)=>validBinding(s)&&demoStoreServiceActive(s)&&Boolean(s.connectionIssue);
 const isNormal=(s:Store)=>validBinding(s)&&demoStoreServiceActive(s)&&!hasConnectionIssue(s)&&!isExpiring(s);
 const isExpiring=(s:Store)=>validBinding(s)&&demoStoreServiceActive(s)&&!s.connectionIssue&&Date.parse(s.serviceExpiresAt!)-Date.now()<=7*86400000;
 // Only previously bound, paid and still-in-service stores with a confirmed connection fault need reconnection.
 const needsAttention=(s:Store)=>hasConnectionIssue(s);
 const activeServiceStores=stores.filter(isNormal).length;
 const expiredServiceStores=stores.filter(isExpired).length;
 const connectionIssueStores=stores.filter(needsAttention).length;
 const expiringServiceStores=stores.filter(isExpiring).length;
 const [metricFilter,setMetricFilter]=useState<"all"|"normal"|"expiring"|"expired"|"attention"|"deleted">("all");
 const [selectedStores,setSelectedStores]=useState<string[]>([]);
 const [groupAssignOpen,setGroupAssignOpen]=useState(false);
 const [moveStoreId,setMoveStoreId]=useState<string|null>(null);
 const [moveGroup,setMoveGroup]=useState("未分组");
 const [checkConnectionId,setCheckConnectionId]=useState<string|null>(null);
 const [ipDialogOpen,setIpDialogOpen]=useState(false);
 const [ipAddress,setIpAddress]=useState("");
 const [ipPort,setIpPort]=useState("");
 const [ipUser,setIpUser]=useState("");
 const [ipPassword,setIpPassword]=useState("");
 const [ipShowPassword,setIpShowPassword]=useState(false);
 const [ipError,setIpError]=useState("");
 const [bulkGroup,setBulkGroup]=useState("未分组");
 const [pageNumber,setPageNumber]=useState(1);
 const pageSize=10;
 const [renewalId,setRenewalId]=useState<string|null>(null);
 const [renewalPeriods,setRenewalPeriods]=useState(1);
 const [renewalError,setRenewalError]=useState("");
 function consumePeriod(quantity=1):boolean{
  if(!Number.isSafeInteger(quantity)||quantity<1||availablePeriods<quantity)return false;
  if(!administrator&&isMainTenant)return commitEnterprise({...enterpriseState,storeAllocations:{...enterpriseState.storeAllocations,[memberId]:ownAssignedPeriods-quantity}});
  return true;
 }
 function openRenewal(id:string){setRenewalId(id);setRenewalPeriods(1);setRenewalError("");}
 function activateStore(id:string,quantity=1){
  const store=stores.find(s=>s.id===id);
  if(!store)return;
  if(!store.platformStoreId||!Number(store.servicePeriods)){setRenewalError("历史记录缺少平台店铺 ID 或已付服务期，不能通过续费补开通。");return;}
  if(!Number.isSafeInteger(quantity)||quantity<1||quantity>100){setRenewalError("请输入 1–100 之间的续费期数。");return;}
  if(availablePeriods<quantity){setRenewalError("当前可用期数不足，请先在套餐与权益购买并完成分配。");return;}
  if(!consumePeriod(quantity)){setRenewalError("期数扣减失败，服务期未修改。");return;}
  const now=Date.now();
  setStores(old=>old.map(s=>{if(s.id!==id)return s;let value=s;for(let i=0;i<quantity;i++)value=startDemoStoreService(value,now);return value;}));
  setRenewalId(null);setRenewalPeriods(1);setRenewalError("");
  setNotice("已为「"+store.name+"」续费 "+quantity+" 期（"+quantity*30+" 天），到期日已更新。");
 }

 function setStores(next:Store[]|((current:Store[])=>Store[])){
  setAllStores(previous=>{
   const visible=administrator?previous:previous.filter(s=>s.ownerMemberId===memberId);
   const changed=typeof next==="function"?next(visible):next;
   if(administrator)return changed;
   return [...previous.filter(s=>s.ownerMemberId!==memberId),...changed];
  });
 }
 const [dialog,setDialog]=useState(false),[name,setName]=useState(""),[region,setRegion]=useState("美国站"),[type,setType]=useState("半托管"),[newGroup,setNewGroup]=useState("未分组"),[newOwner,setNewOwner]=useState("");
 const [authAccount,setAuthAccount]=useState(""),[authPassword,setAuthPassword]=useState(""),[authCode,setAuthCode]=useState(""),[showPassword,setShowPassword]=useState(false),[fixedIp,setFixedIp]=useState(false),[codeNotice,setCodeNotice]=useState(""),[manageId,setManageId]=useState<string|null>(null),[moreId,setMoreId]=useState<string|null>(null),[groupRename,setGroupRename]=useState<string|null>(null),[groupRenameValue,setGroupRenameValue]=useState("");
 const [query,setQuery]=useState(""),[search,setSearch]=useState(""),[notice,setNotice]=useState("");
 const [productStoreId,setProductStoreId]=useState("");
 const [storePickerOpen,setStorePickerOpen]=useState(false);
 const [storePickerSearch,setStorePickerSearch]=useState("");
 const [storePickerAdvanced,setStorePickerAdvanced]=useState(false);
 const [storePickerRegion,setStorePickerRegion]=useState("全部站点");
 const [storePickerStatus,setStorePickerStatus]=useState("全部状态");
 const [storePickerPage,setStorePickerPage]=useState(1);
 const [productSource,setProductSource]=useState<"all"|"merchant"|"shuomi">("all");
 const [productKeyword,setProductKeyword]=useState("");
 const [productSyncNotice,setProductSyncNotice]=useState("");
 const [productSnapshotRevision,setProductSnapshotRevision]=useState(0);
 useEffect(()=>{const refresh=()=>setProductSnapshotRevision(n=>n+1);window.addEventListener("storage",refresh);window.addEventListener("shuomi:store-product-snapshot-updated",refresh);return()=>{window.removeEventListener("storage",refresh);window.removeEventListener("shuomi:store-product-snapshot-updated",refresh)}},[]);
 // Read the last verified snapshot from local browser storage. Opening this page
 // must never initiate a remote sync or mutate previously saved product rows.
 useEffect(()=>{if(pathname==="/workbench/store-products"&&simulateApprovedKindleListing(organizationId,memberId,"SIM-ADMIN-01"))setProductSnapshotRevision(n=>n+1)},[pathname,organizationId,memberId]);
 const eligibleProductStores=stores.filter(x=>Boolean(x.platformStoreId));
 const selectedProductStore=eligibleProductStores.find(x=>x.id===productStoreId)??eligibleProductStores[0];
 const visibleProductStores=selectedProductStore?[selectedProductStore]:[];
 const storePickerRegions=[...new Set(eligibleProductStores.map(x=>x.region))];
 const storePickerMatches=eligibleProductStores.filter(x=>
  (!storePickerSearch.trim()||[x.name,x.platformStoreId,x.region,x.owner].join(" ").toLowerCase().includes(storePickerSearch.trim().toLowerCase()))&&
  (storePickerRegion==="全部站点"||x.region===storePickerRegion)&&
  (storePickerStatus==="全部状态"||storePickerStatus==="连接异常"&&Boolean(x.connectionIssue)||storePickerStatus==="服务已到期"&&!demoStoreServiceActive(x)||storePickerStatus==="服务有效"&&demoStoreServiceActive(x)&&!x.connectionIssue)
 );
 const storePickerPageCount=Math.max(1,Math.ceil(storePickerMatches.length/6));
 const storePickerCurrentPage=Math.min(storePickerPage,storePickerPageCount);
 const storePickerRows=storePickerMatches.slice((storePickerCurrentPage-1)*6,storePickerCurrentPage*6);
 void productSnapshotRevision;
 const productSnapshots=visibleProductStores.flatMap(x=>{
  const prior=readStoreProductSnapshot(organizationId,x.id,x.platformStoreId!);
  const legacy=prior?.simulated&&prior.rows.some(row=>row.platformProductId==="SIM-SHEIN-ADMIN-01-B00008GKD3");
  const saved=legacy?buildAdminStoreSyncDemo(organizationId,x.id,x.platformStoreId!):prior??buildAdminStoreSyncDemo(organizationId,x.id,x.platformStoreId!);
  return saved?[{store:x,snapshot:saved}]:[];
 });
 const lastProductSync=productSnapshots.map(x=>x.snapshot.syncedAt).sort().at(-1);
 const allCachedProducts=productSnapshots.flatMap(x=>x.snapshot.rows.map(row=>({...row,store:x.store})));
 const cachedProducts=allCachedProducts.filter(row=>(productSource==="all"||row.origin===productSource)&&(!productKeyword.trim()||[row.name,row.sku,row.platformProductId].join(" ").toLowerCase().includes(productKeyword.trim().toLowerCase())));
 const cachedOriginCount=(origin:"merchant"|"shuomi")=>allCachedProducts.filter(row=>row.origin===origin).length;
 const [editing,setEditing]=useState<string|null>(null),[confirmDelete,setConfirmDelete]=useState<string|null>(null);
  const [inspecting,setInspecting]=useState<string|null>(null);
 const [syncing,setSyncing]=useState<string|null>(null),[entered,setEntered]=useState<string|null>(null),[groupsOpen,setGroupsOpen]=useState(false);
 const [detailTab,setDetailTab]=useState("店铺概览"),[groupName,setGroupName]=useState(""),[groups,setGroups]=useState<string[]>(()=>{try{const value=JSON.parse(sessionStorage.getItem(key+"-groups")||"[]");return Array.isArray(value)?value.filter((x):x is string=>typeof x==="string"):[]}catch{return []}}),[authorizationMethod,setAuthorizationMethod]=useState("子账户邮箱验证码");
 const [creatingGroup,setCreatingGroup]=useState(false),[addingOwner,setAddingOwner]=useState(false),[groupError,setGroupError]=useState("");
 const [settingsDraft,setSettingsDraft]=useState({group:"未分组",owner:""});
 const [platformFilter,setPlatformFilter]=useState("全部平台"),[regionFilter,setRegionFilter]=useState("全部站点"),[typeFilter,setTypeFilter]=useState("全部类型");
 const [appliedFilters,setAppliedFilters]=useState({platform:"全部平台",region:"全部站点",type:"全部类型"});
 useEffect(()=>{saveDemoStoreBindings(organizationId,allStores)},[allStores,organizationId]);
 useEffect(()=>{try{sessionStorage.setItem(key+"-groups",JSON.stringify(groups))}catch{}},[groups]);
 useEffect(()=>{setQuery("");setSearch("");setNotice("");setDialog(false);setEditing(null);setConfirmDelete(null);setInspecting(null);setSyncing(null);setRenewalId(null);setRenewalPeriods(1);setRenewalError("");setEntered(null);setGroupsOpen(false);setManageId(null);setMoreId(null);setIpDialogOpen(false);setCheckConnectionId(null);setCreatingGroup(false);setAddingOwner(false);setGroupError("");setDetailTab("店铺概览");setSelectedStores([]);setMetricFilter("all");setPageNumber(1);setGroupAssignOpen(false);setMoveStoreId(null)},[pathname]);
 useEffect(()=>{if(!dialog&&!editing&&!confirmDelete&&!inspecting&&!syncing&&!renewalId&&!moveStoreId&&!ipDialogOpen&&!groupAssignOpen&&!checkConnectionId&&!groupsOpen&&!manageId&&!moreId&&!creatingGroup&&!addingOwner&&!groupRename)return;const onKey=(e:KeyboardEvent)=>{if(e.key!=="Escape")return;if(ipDialogOpen){setIpDialogOpen(false);setIpError("");return;}if(groupAssignOpen){setGroupAssignOpen(false);return;}if(checkConnectionId){setCheckConnectionId(null);return;}if(creatingGroup){setCreatingGroup(false);return;}if(addingOwner){setAddingOwner(false);return;}if(groupRename){setGroupRename(null);return;}if(groupsOpen){setGroupsOpen(false);return;}if(confirmDelete){setConfirmDelete(null);return;}if(editing){setEditing(null);return;}if(inspecting){setInspecting(null);return;}if(syncing){setSyncing(null);return;}if(renewalId){setRenewalId(null);setRenewalError("");return;}if(moveStoreId){setMoveStoreId(null);return;}if(dialog||manageId){setDialog(false);setManageId(null);return;}if(moreId)setMoreId(null)};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[dialog,editing,confirmDelete,inspecting,syncing,renewalId,moveStoreId,ipDialogOpen,groupAssignOpen,checkConnectionId,groupsOpen,manageId,moreId,creatingGroup,addingOwner,groupRename]);
 useEffect(()=>{if(!moreId)return;const dismiss=(event:PointerEvent)=>{const target=event.target;if(!(target instanceof Element))return;if(target.closest('[role="menu"][aria-label="店铺操作"],button[aria-label^="更多操作 · "]'))return;setMoreId(null)};document.addEventListener("pointerdown",dismiss);return()=>document.removeEventListener("pointerdown",dismiss)},[moreId]);
 const route=pathname==="/workbench/store-center"?"home":pathname==="/workbench/stores"?"stores":pathname==="/workbench/store-products"?"products":"orders";
 const heading=route==="home"?"店铺中心":route==="stores"?"我的店铺":route==="products"?"店铺商品":"订单履约";
  const intro=route==="home"?"围绕店铺绑定、商品刊登、数据同步和订单交付形成业务闭环；经营分析与 AI 执行由对应模块负责。":route==="stores"?"统一管理店铺连接、授权、网络环境和数据状态。":route==="products"?"关联当前账号已绑定店铺，按店铺查看商品同步状态；未取得平台记录时不虚构商品。":"订单来自实际同步记录，不展示虚构交易或履约结果。";
 const link=(path:string)=>navigate(path+"?preview=1");
 function submitBinding(e:FormEvent){e.preventDefault();if(authorizationMethod==="API 授权（暂未开放）"){setCodeNotice("API 授权暂未开放，请选择子账户授权方式。");return;}if(!name.trim()){setCodeNotice("请先填写自定义名称。");return;}if(manageId){const original=stores.find(s=>s.id===manageId);if(!original?.platformStoreId){setCodeNotice("未找到原绑定的平台店铺 ID，请重新核验，不能修改绑定身份。");return;}if(stores.some(s=>s.id!==manageId&&s.name.trim().toLowerCase()===name.trim().toLowerCase())){setCodeNotice("店铺名称已存在，请修改后保存。");return;}const selectedMember=newOwner?ownerMembers.find(m=>m.name===newOwner):ownerMembers.find(m=>m.id==="admin");if(!selectedMember){setCodeNotice("请选择本组织内状态正常的负责人，不能转移给其他组织。");return;}if(!administrator&&selectedMember.id!==memberId){setCodeNotice("跨成员转移店铺需要本组织管理员操作。");return;}if(!isMainTenant&&selectedMember.id!==memberId&&!getDemoMembership({organizationId,memberId:selectedMember.id})){setCodeNotice("目标负责人不属于当前组织，不能转移店铺。");return;}setAllStores(old=>old.map(x=>x.id===manageId?{...x,name:name.trim(),group:newGroup,owner:selectedMember.name,ownerMemberId:selectedMember.id,bindingAccount:authAccount.trim(),demoPassword:authPassword,fixedIpPreference:fixedIp,proxyIpAddress:fixedIp?ipAddress:undefined,proxyIpPort:fixedIp?ipPort:undefined,proxyIpUser:fixedIp?ipUser:undefined}:x));setManageId(null);setAuthPassword("");setAuthCode("");setNotice("保存成功：所属权已更新，平台店铺 ID、服务期限及连接状态保持原样。");}else add(e);}
 function commitFilters(){setPageNumber(1);setSelectedStores([]);setSearch(query.trim());setAppliedFilters({platform:platformFilter,region:regionFilter,type:typeFilter})}
 const detailStore=stores.find(s=>s.id===inspecting);
 const enteredStore=stores.find(s=>s.id===entered);
 const managedStore=stores.find(s=>s.id===manageId);
 const connectionStore=stores.find(s=>s.id===checkConnectionId);
 const movingStore=stores.find(s=>s.id===moveStoreId);
 const renewalStore=stores.find(s=>s.id===renewalId);
 const renewStart=renewalStore?(demoStoreServiceActive(renewalStore)?Date.parse(renewalStore.serviceExpiresAt!):Date.now()):Date.now();
 const renewEnd=renewStart+(Number.isSafeInteger(renewalPeriods)&&renewalPeriods>0?renewalPeriods:0)*30*86400000;
 function enterStore(id:string,tab="店铺概览"){const store=stores.find(x=>x.id===id);if(!store)return;setSettingsDraft({group:store.group||"未分组",owner:store.ownerMemberId==="admin"?"":ownerName(store)});setMoreId(null);setInspecting(null);setDetailTab(tab);setEntered(id)}
 function createBindingGroup(e:FormEvent){e.preventDefault();const v=groupName.trim();if(!v){setGroupError("请输入分组名称。");return;}if(v==="未分组"||groups.includes(v)){setGroupError("分组名称已存在，请更换名称。");return;}setGroups(old=>[...old,v]);setNewGroup(v);setGroupName("");setGroupError("");setCreatingGroup(false);setNotice("已新建分组，并自动选中该分组；绑定店铺信息仍保留。")}
 function openBinding(id:string|null=null){const item=stores.find(s=>s.id===id);setManageId(id);setDialog(!id);setName(item?.name||"");setRegion(item?.region||"美国站");setType(item?.type||"半托管");setNewGroup(item?.group||"未分组");setNewOwner(item?(item.ownerMemberId==="admin"?"":ownerMembers.find(m=>m.id===item.ownerMemberId)?.name||item.owner||""):"");setAuthorizationMethod(item?.authorizationMethod||"子账户邮箱验证码");setAuthAccount(item?.bindingAccount||"");setAuthPassword(item?.demoPassword||"");setAuthCode("");setShowPassword(false);setFixedIp(item?.fixedIpPreference||false);setIpAddress(item?.proxyIpAddress||"");setIpPort(item?.proxyIpPort||"");setIpUser(item?.proxyIpUser||"");setIpPassword("");setIpError("");setIpDialogOpen(false);setCheckConnectionId(null);setCodeNotice("");}
 function saveIpConfiguration(e:FormEvent){e.preventDefault();const parts=ipAddress.trim().split(".");if(parts.length!==4||parts.some(x=>!/^(0|[1-9][0-9]{0,2})$/.test(x)||Number(x)>255)){setIpError("请输入有效的 IPv4 地址。");return;}const port=Number(ipPort);if(!Number.isSafeInteger(port)||port<1||port>65535){setIpError("端口须为 1–65535。");return;}setIpAddress(ipAddress.trim());setIpPort(String(port));setFixedIp(true);setIpDialogOpen(false);setIpPassword("");setIpError("");setCodeNotice("已保存固定 IP 演示配置。平台请求需要真实代理出口接入才可实现防关联，不会将未验证的代理标记为已生效。");}
  const list=(metricFilter==="deleted"?deletedStores:stores).filter(x=>[x.name,x.id,x.region,x.type].join(" ").toLowerCase().includes(search.toLowerCase())&&(appliedFilters.platform==="全部平台"||x.platform===appliedFilters.platform)&&(appliedFilters.region==="全部站点"||x.region===appliedFilters.region)&&(appliedFilters.type==="全部类型"||x.type===appliedFilters.type)&&(metricFilter==="deleted"||metricFilter==="all"||metricFilter==="normal"&&isNormal(x)||metricFilter==="expiring"&&isExpiring(x)||metricFilter==="expired"&&isExpired(x)||metricFilter==="attention"&&needsAttention(x)));
 const pageCount=Math.max(1,Math.ceil(list.length/pageSize));
 const currentPage=Math.min(pageNumber,pageCount);
 const visibleStores=list.slice((currentPage-1)*pageSize,currentPage*pageSize);
 const checkedStores=visibleStores.filter(x=>selectedStores.includes(x.id));
 const allChecked=visibleStores.length>0&&visibleStores.every(x=>selectedStores.includes(x.id));
 function chooseMetric(value:typeof metricFilter){setMetricFilter(value);setSelectedStores([]);setPageNumber(1)}
 function applyGroupToSelection(){if(!checkedStores.length)return;setStores(old=>old.map(s=>selectedStores.includes(s.id)?{...s,group:bulkGroup}:s));setGroupAssignOpen(false);setSelectedStores([]);setNotice("已将选中店铺加入「"+bulkGroup+"」，店铺绑定和服务期保持不变。");}
 function moveSingleStore(){if(!movingStore)return;setStores(old=>old.map(s=>s.id===movingStore.id?{...s,group:moveGroup}:s));setMoveStoreId(null);setNotice("店铺已移动至「"+moveGroup+"」，原平台店铺 ID 和服务期保持不变。");}
 function bulkSync(){const latest=readDemoStoreBindings(organizationId);const selected=new Set(checkedStores.map(s=>s.id));const refreshed=latest.filter(s=>selected.has(s.id));setAllStores(latest);const normal=refreshed.filter(s=>validBinding(s)&&demoStoreServiceActive(s)&&!s.connectionIssue&&Date.parse(s.serviceExpiresAt!)-Date.now()>7*86400000).length;const expiring=refreshed.filter(s=>validBinding(s)&&demoStoreServiceActive(s)&&!s.connectionIssue&&Date.parse(s.serviceExpiresAt!)-Date.now()<=7*86400000).length;const expired=refreshed.filter(s=>validBinding(s)&&!demoStoreServiceActive(s)).length;const abnormal=refreshed.filter(s=>validBinding(s)&&demoStoreServiceActive(s)&&Boolean(s.connectionIssue)).length;setNotice("已重新读取 "+refreshed.length+" 家店铺的已保存状态，并按当前时间重新核算服务期：正常 "+normal+" 家、即将到期 "+expiring+" 家、已到期 "+expired+" 家、连接异常 "+abnormal+" 家。未接入 SHEIN 实时状态接口，以上是本地状态刷新，不代表平台核验成功。");}

 function resetFilters(){setMetricFilter("all");setPageNumber(1);setSelectedStores([]);setQuery("");setSearch("");setPlatformFilter("全部平台");setRegionFilter("全部站点");setTypeFilter("全部类型");setAppliedFilters({platform:"全部平台",region:"全部站点",type:"全部类型"})}
 function saveRename(e:FormEvent){e.preventDefault();if(!editing||!name.trim())return;if(stores.some(s=>s.id!==editing&&s.name.trim().toLowerCase()===name.trim().toLowerCase())){setNotice("名称与现有演示店铺重复，请修改后再保存。");return;}setStores(old=>old.map(s=>s.id===editing?{...s,name:name.trim()}:s));setEditing(null);setName("");setNotice("店铺名称已保存在当前浏览器演示会话中。")}
 function deleteDemo(){if(!confirmDelete)return;setStores(old=>old.map(s=>s.id===confirmDelete?{...s,archived:true}:s));setConfirmDelete(null);setNotice("店铺已移至已删除，可恢复；平台店铺 ID、服务期和原所属权均保留，不退款。")}
 function restoreStore(id:string){setAllStores(old=>old.map(s=>s.id===id&&(administrator||s.ownerMemberId===memberId)?{...s,archived:false}:s));setNotice("店铺已恢复原负责人、平台店铺 ID、服务期限和连接状态。");}
 function add(e:FormEvent){
  e.preventDefault();
  if(!name.trim())return;
  if(stores.some(s=>s.name.trim().toLowerCase()===name.trim().toLowerCase())){setCodeNotice("已存在同名店铺，请修改名称后重试。");return;}
  if(availablePeriods<1){setCodeNotice("当前可用店铺服务期数为 0，无法绑定新店铺。请先购买续费期数；子账号需由本组织管理员分配至少 1 期。");return;}
  if(authAccount.trim()&&allStores.some(s=>!s.archived&&s.platform==="SHEIN"&&s.bindingAccount?.trim().toLowerCase()===authAccount.trim().toLowerCase())){setCodeNotice("此平台子账户已关联当前组织的绑定记录。不能为同一身份重复开通服务期；请管理原店铺。");return;}
  // The provider response below is a mock. A real SHEIN platform ID must come from its API.
  // MOCK-FAIL tests binding failure without writing a store or charging a period.
  const providerId=authAccount.trim().toUpperCase()==="MOCK-FAIL"?"":"SIM-SHEIN-"+crypto.randomUUID().slice(0,12).toUpperCase();
  if(!providerId){setCodeNotice("模拟获取平台店铺 ID 失败，绑定未完成，未扣期数；请检查账号并重试。");return;}
  if(allStores.some(s=>s.platform==="SHEIN"&&s.platformStoreId===providerId)){setCodeNotice("此平台店铺 ID 已存在绑定记录，不允许重复绑定；请管理原店铺。");return;}
  const bindingOwner=newOwner.trim()?ownerMembers.find(m=>m.name===newOwner.trim()):ownerMembers.find(m=>m.id===memberId);if(!bindingOwner||(!administrator&&bindingOwner.id!==memberId)){setCodeNotice("请选择本组织内有权限的负责人。");return;}
  const n:Store={id:"DEMO-"+crypto.randomUUID().slice(0,8).toUpperCase(),name:name.trim(),platform:"SHEIN",region,type,group:newGroup,owner:bindingOwner.name,status:"已绑定",ownerMemberId:bindingOwner.id,demoPassword:authPassword||undefined,createdAt:new Date().toLocaleString("zh-CN"),platformStoreId:providerId,bindingAccount:authAccount.trim(),authorizationMethod,fixedIpPreference:fixedIp,proxyIpAddress:fixedIp?ipAddress:undefined,proxyIpPort:fixedIp?ipPort:undefined,proxyIpUser:fixedIp?ipUser:undefined};
  const next=[...allStores,startDemoStoreService(n)];
  if(!saveDemoStoreBindings(organizationId,next)){setCodeNotice("保存绑定记录失败，未扣期数。");return;}
  if(!consumePeriod()){saveDemoStoreBindings(organizationId,allStores);setCodeNotice("扣减期数失败，店铺绑定已回滚。");return;}
  setAllStores(next);setName("");setDialog(false);
  setNotice("模拟获取平台店铺 ID 成功，绑定完成；已扣减 1 期，30 天服务从绑定成功开始。尚未接入真实 SHEIN 接口。");
 }
 return <main className={css.page} data-store-center-showcase={route}>
  <header className={css.header}><div><span className={css.breadcrumb}>店铺中心{route==="home"?"":" / "+heading}{enteredStore?" / "+enteredStore.name:""}</span><h1>{enteredStore?enteredStore.name:heading}</h1><p>{enteredStore?`SHEIN · ${enteredStore.region} · ${enteredStore.type} · ${demoStoreServiceActive(enteredStore)?"服务中":enteredStore.servicePeriods?"已到期":"历史数据待核实"}`:intro}</p></div>{route==="stores"?(enteredStore?<button onClick={()=>setEntered(null)}>返回我的店铺</button>:<div className={css.headerActions}><button type="button" onClick={()=>setGroupsOpen(true)}>管理分组</button><button className={css.primary} onClick={()=>openBinding()}><Plus size={16}/>绑定新店铺</button></div>):route!=="home"?<button onClick={()=>link("/workbench/stores")}>管理我的店铺</button>:null}</header>
  {notice?<div className={css.notice} role="status">{notice}<button onClick={()=>setNotice("")} aria-label="关闭提示">×</button></div>:null}
  {route==="stores"&&enteredStore?<section className={css.detailPage} aria-label="店铺详情页面">
  <nav className={css.detailTabs} aria-label="店铺详情导航">{["店铺概览","服务信息","数据同步","网络环境","店铺设置"].map(tab=><button key={tab} aria-current={detailTab===tab?"page":undefined} className={detailTab===tab?css.activeTab:""} onClick={()=>{if(tab==="店铺设置")setSettingsDraft({group:enteredStore.group||"未分组",owner:enteredStore.ownerMemberId==="admin"?"":ownerName(enteredStore)});setDetailTab(tab)}}>{tab}</button>)}</nav>
  {detailTab==="店铺概览"?<><section className={css.panel}><header><h2>店铺基础信息</h2><span>用于跨模块筛选、管理与权限关联</span></header><dl className={css.detailList}><div><dt>平台</dt><dd>SHEIN</dd></div><div><dt>站点</dt><dd>{enteredStore.region}</dd></div><div><dt>店铺类型</dt><dd>{enteredStore.type}</dd></div><div><dt>负责人</dt><dd>{ownerName(enteredStore)}</dd></div><div><dt>店铺分组</dt><dd>{enteredStore.group||"未分组"}</dd></div><div><dt>最近同步</dt><dd>暂无同步数据</dd></div><div><dt>店铺服务</dt><dd>{demoStoreServiceActive(enteredStore)?"服务中":enteredStore.servicePeriods?"已到期":"历史数据待核实"}</dd></div><div><dt>服务到期日</dt><dd>{enteredStore.serviceExpiresAt?new Date(enteredStore.serviceExpiresAt).toLocaleDateString("zh-CN"):"—"}</dd></div></dl>{enteredStore.platformStoreId&&Number(enteredStore.servicePeriods)>0?<button onClick={()=>openRenewal(enteredStore.id)}>续费 1 期（30 天）</button>:<p className={css.hint}>历史演示记录缺少平台 ID 或计费信息，不能通过续费补开通。</p>}</section><section className={css.panel}><header><h2>经营摘要</h2><span>只有平台完成授权并成功同步后，才展示实际经营指标</span></header><div className={css.metrics}>{["在线商品","近30天订单","近30天销售额","近30天利润","进行中AI任务","待处理事项"].map(label=><article key={label}><span>{label}</span><strong>—</strong></article>)}</div></section><section className={css.panel}><header><h2>正在使用该店铺的 AI 能力</h2></header><p className={css.hint}>当前没有可验证的已启用智能体。授权后可在 AI 工作台关联本店。</p><button onClick={()=>link("/workbench/agents/mine")}>查看我的智能体</button></section></>:
   detailTab==="服务信息"?<section className={css.panel}><header><h2>服务信息</h2><span>店铺绑定后即可管理，服务按30天一期</span></header><dl className={css.detailList}><div><dt>平台</dt><dd>SHEIN</dd></div><div><dt>绑定状态</dt><dd>已绑定</dd></div><div><dt>服务状态</dt><dd>{demoStoreServiceActive(enteredStore)?"服务中":enteredStore.servicePeriods?"已到期":"历史数据待核实"}</dd></div><div><dt>到期日期</dt><dd>{enteredStore.serviceExpiresAt?new Date(enteredStore.serviceExpiresAt).toLocaleDateString("zh-CN"):"—"}</dd></div></dl>{enteredStore.platformStoreId&&Number(enteredStore.servicePeriods)>0?<button className={css.primary} onClick={()=>openRenewal(enteredStore.id)}>续费30天</button>:<p className={css.hint}>历史演示数据未完成绑定与计费，不能通过续费补开通。</p>}</section>:
  detailTab==="数据同步"?<section className={css.panel}><header><h2>数据同步</h2><span>商品与订单同步结果</span></header><dl className={css.detailList}><div><dt>最近同步</dt><dd>暂无同步数据</dd></div><div><dt>商品同步</dt><dd>未开始</dd></div><div><dt>订单同步</dt><dd>未开始</dd></div></dl><button className={css.primary} onClick={()=>setSyncing(enteredStore.id)}>立即同步</button><button onClick={()=>link("/workbench/store-products")}>查看店铺商品</button><button onClick={()=>link("/workbench/store-orders")}>查看订单履约</button></section>:
  detailTab==="网络环境"?<section className={css.panel}><header><h2>网络环境</h2><span>网络环境配置与连接检测</span></header><dl className={css.detailList}><div><dt>固定IP状态</dt><dd>未配置</dd></div><div><dt>公网 IP</dt><dd>待检测</dd></div><div><dt>连接状态</dt><dd>未检测</dd></div></dl><p className={css.hint}>展示站未接入网络出口检测，不能生成虚构的 IP 信息。</p><button onClick={()=>openBinding(enteredStore.id)}>配置网络环境</button></section>:
  <section className={css.panel}><header><h2>店铺设置</h2><span>调整负责人和分组，点击保存后才更新店铺资料</span></header><form className={css.detailSettings} onSubmit={e=>{e.preventDefault();const selected=ownerMembers.find(m=>m.name===settingsDraft.owner.trim())||ownerMembers.find(m=>m.id==="admin");if(!selected||(settingsDraft.owner.trim()&&selected.name!==settingsDraft.owner.trim())||(!administrator&&selected.id!==memberId)){setNotice("请选择本组织内有权限的负责人。");return;}setAllStores(old=>old.map(x=>x.id===enteredStore.id?{...x,group:settingsDraft.group,owner:settingsDraft.owner.trim(),ownerMemberId:selected.id}:x));setNotice("店铺设置已保存至本地演示会话。")}}><label>店铺分组<select aria-label="店铺所属分组" value={settingsDraft.group} onChange={e=>setSettingsDraft(old=>({...old,group:e.target.value}))}><option>未分组</option>{groups.map(g=><option key={g}>{g}</option>)}</select></label><label>负责人<select aria-label="店铺负责人" value={settingsDraft.owner} onChange={e=>setSettingsDraft(old=>({...old,owner:e.target.value}))}><option value="">管理员（默认）</option>{settingsDraft.owner&&!owners.includes(settingsDraft.owner)?<option value={settingsDraft.owner}>{settingsDraft.owner}（原设置）</option>:null}{owners.map(owner=><option key={owner} value={owner}>{owner}</option>)}</select></label><footer><button type="button" onClick={()=>{setName(enteredStore.name);setEditing(enteredStore.id)}}>修改自定义名称</button><button type="button" onClick={()=>setGroupsOpen(true)}>管理分组</button><button type="button" onClick={()=>openBinding(enteredStore.id)}>编辑店铺资料</button><button type="button" onClick={()=>setConfirmDelete(enteredStore.id)}>解绑店铺</button><button className={css.primary} type="submit">保存设置</button></footer></form></section>}
 </section>:route==="home"?<>
   <section className={css.homeIntro} aria-label="店铺中心介绍">
    <p className={css.eyebrow}>店铺中心</p>
    <h2>统一管理店铺、刊登、商品与订单，让经营链路更清晰</h2>
    <p>围绕店铺绑定、商品资料刊登、商品同步和订单交付形成业务闭环，经营分析及 AI 执行由对应模块负责。</p>
   </section>
   <section className={css.homeSection} aria-label="核心业务入口">
    <header><h2>核心业务入口</h2><p>四个二级菜单各自承担明确职责，点击进入对应的业务页面。</p></header>
    <div className={css.entries}>{areas.map(a=><article key={a.path}>
     <span className={css.icon}><a.icon size={22}/></span>
     <h3>{a.name}</h3><p>{a.description}</p>
     <div className={css.entryLabels}>{a.labels.map(label=><span key={label}>{label}</span>)}</div>
     <button className={css.entryButton} onClick={()=>link(a.path)}>{a.action}</button>
    </article>)}</div>
   </section>
   <section className={css.homeSection} aria-label="店铺业务流程">
    <header><h2>店铺业务如何流转</h2><p>参考 Figma 原型四步业务链路，并补充新增的「刊登管理」操作环节。</p></header>
    <div className={css.steps}>{steps.map(([n,title,desc])=><article key={n}><b>{n}</b><h3>{title}</h3><p>{desc}</p></article>)}</div>
   </section>
   <div className={css.homeNotes}>
    <section className={css.noteCard}>
     <span className={css.noteLabel}>业务协同</span>
     <h2>四个业务模块如何协同</h2>
     <p>店铺绑定 · 商品刊登 · 商品同步 · 订单履约</p>
     <div className={css.noteItems}>{collaboration.map(a=><div key={a.title}><strong>{a.title}</strong><span>{a.detail}</span></div>)}</div>
    </section>
    <section className={css.noteCard}>
     <span className={css.noteLabel}>使用边界</span>
     <h2>经营分析与 AI 执行明确分工</h2>
     <p>业务管理与智能运营分工明确，各自提供独立入口。</p>
     <div className={css.noteItems}>
      <div><strong>店铺中心</strong><span>店铺、刊登、商品与订单</span></div>
      <div><strong>运营驾驶舱</strong><span>销售趋势及经营预警</span></div>
      <div><strong>AI 工作台</strong><span>商品优化与运营任务</span></div>
     </div>
    </section>
   </div>
  </>:route==="stores"?<>
    <section className={css.storeMetrics} aria-label="店铺运营概览">{([
      ["all","已绑定店铺",stores.filter(validBinding).length,"当前账户"],
      ["normal","正常店铺",activeServiceStores,"连接与服务正常"],
      ["expiring","即将到期",expiringServiceStores,"未来 7 天"],
      ["expired","已到期",expiredServiceStores,"服务期已过"],
      ["attention","待处理",connectionIssueStores,"连接异常"],
      ["deleted","已删除",deletedStores.length,"可恢复"]
    ] as const).map(([key,title,value,subtitle])=><button type="button" key={key} className={css.storeMetric} data-tone={key} aria-pressed={metricFilter===key} onClick={()=>chooseMetric(key)}><span>{title}</span><small>{subtitle}</small><strong>{value} <em>家</em></strong></button>)}</section>
    {connectionIssueStores>0?<section className={css.attention}><span>有 {connectionIssueStores} 家已绑定且服务有效的店铺连接异常，需检查授权或平台接口。</span><button onClick={()=>chooseMetric("attention")}>查看待处理</button></section>:null}
   <form className={css.filters} data-shuomi-filter="balanced" aria-label="店铺筛选" onSubmit={e=>{e.preventDefault();commitFilters()}}>
    <div data-shuomi-filter-left><label className={css.storeSearchField}><span className={css.searchControl}><Search size={16}/><input aria-label="搜索店铺" value={query} onChange={e=>setQuery(e.target.value)} placeholder="输入店铺名称或 ID"/></span></label></div>
    <div data-shuomi-filter-right aria-label="筛选条件、重置与确认">
     <select aria-label="平台筛选" value={platformFilter} onChange={e=>setPlatformFilter(e.target.value)}><option>全部平台</option><option>SHEIN</option></select>
     <select aria-label="站点筛选" value={regionFilter} onChange={e=>setRegionFilter(e.target.value)}><option>全部站点</option>{demoSites.map(site=><option key={site}>{site}</option>)}<option>其他站点</option></select>
     <select aria-label="店铺类型筛选" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}><option>全部类型</option><option>半托管</option><option>全托管</option><option>自营</option></select>
     <button type="button" onClick={resetFilters}>重置</button><button className={css.primary} type="submit">确认</button>
    </div>
   </form>
   <section className={css.panel}>
    <header className={css.storeListHeader}><div className={css.storeListTitle}><label className={css.checkAll}><input type="checkbox" aria-label="全选本页店铺" checked={allChecked} disabled={!visibleStores.length} onChange={e=>setSelectedStores(e.target.checked?visibleStores.map(s=>s.id):[])}/>全选</label><h2>店铺列表</h2><span>共 {list.length} 家店铺</span></div></header>
    {selectedStores.length>0?<div className={css.storeBulk} role="region" aria-label="批量操作"><span>已选择 {checkedStores.length} 家店铺</span><div><button type="button" disabled={!checkedStores.length} onClick={()=>{setBulkGroup("未分组");setGroupAssignOpen(true)}}>加入分组</button><button type="button" disabled={!checkedStores.length} onClick={bulkSync}>批量刷新状态</button><button type="button" onClick={()=>{setSelectedStores([]);setGroupAssignOpen(false)}}>取消选择</button></div></div>:null}
    {list.length?<div className={css.storeList}>{visibleStores.map(s=><article className={css.storeCard} key={s.id}>
     <div className={css.storeRow}>
      <div className={css.storeIdentity}><input type="checkbox" aria-label={"选择"+s.name} checked={selectedStores.includes(s.id)} onChange={e=>setSelectedStores(current=>e.target.checked?[...current.filter(id=>id!==s.id),s.id]:current.filter(id=>id!==s.id))}/><div><strong>{s.name}</strong><small>店铺 ID：{s.platformStoreId||s.id}</small><small>{ownerName(s)} · {s.group||"未分组"}</small></div></div>
      <div className={css.storeRowTags}><span>SHEIN</span><span>{s.region}</span><span>{s.type}</span></div>
      <div className={css.storeRowState}><strong data-state={isNormal(s)?"active":isExpired(s)?"expired":hasConnectionIssue(s)?"expired":isExpiring(s)?"expiring":"unknown"}>{s.archived?"已删除":isExpired(s)?"服务已到期":hasConnectionIssue(s)?"连接异常":isExpiring(s)?"即将到期":isNormal(s)?"服务有效":"资料待核实"}</strong><small>{hasConnectionIssue(s)?s.connectionIssue:isExpiring(s)?"剩余 "+Math.ceil((Date.parse(s.serviceExpiresAt!)-Date.now())/86400000)+" 天 · 可续费":s.platformStoreId?"平台 ID 已获取 · 同步未接入":"平台 ID 待核实"}</small><small>服务期限：{s.serviceExpiresAt?new Date(s.serviceExpiresAt).toLocaleDateString("zh-CN"):"待核实"}</small></div>
      <div className={css.storeRowButtons}>{metricFilter==="deleted"?<button type="button" className={css.primary} onClick={()=>restoreStore(s.id)}>恢复店铺</button>:<><button type="button" onClick={()=>{setMoveStoreId(s.id);setMoveGroup(s.group||"未分组")}}>移动分组</button><button type="button" className={css.dangerAction} onClick={()=>setConfirmDelete(s.id)}>删除店铺</button><button type="button" className={css.renewAction} disabled={!validBinding(s)} onClick={()=>openRenewal(s.id)}>续费</button><button type="button" onClick={()=>openBinding(s.id)}>管理店铺</button></>}</div>
     </div>
    </article>)}</div>:<div className={css.empty}><Building2 size={34}/><h3>{stores.length?"没有符合条件的店铺":"尚未绑定店铺"}</h3><p>{stores.length?"请调整筛选条件。":"当前没有店铺。绑定后即可管理店铺。商品与订单仅在实际同步后显示。"}</p><button className={css.primary} onClick={()=>stores.length?resetFilters():openBinding()}>{stores.length?"清空筛选":"绑定新店铺"}</button></div>}
    {list.length>pageSize?<nav aria-label="店铺列表分页" className={css.storePages}><span>第 {currentPage} / {pageCount} 页</span><button type="button" disabled={currentPage<=1} onClick={()=>{setPageNumber(currentPage-1);setSelectedStores([])}}>上一页</button><button type="button" disabled={currentPage>=pageCount} onClick={()=>{setPageNumber(currentPage+1);setSelectedStores([])}}>下一页</button></nav>:null}
   </section>
  </>:<>
   {route==="products"?<>
    <section className={css.metrics}>{[["已同步商品",allCachedProducts.length],["商家原有",cachedOriginCount("merchant")],["硕米刊登",cachedOriginCount("shuomi")],["已关联店铺",eligibleProductStores.length]].map(([title,val])=><article key={title}><span>{title}</span><strong>{val}</strong></article>)}</section>
    <section className={css.panel} aria-label="店铺商品同步">
     <header><h2>选择店铺与同步商品</h2><span>打开页面优先显示上次同步结果 · 仅手动同步获取平台最新数据</span></header>
     <div className={css.productSyncToolbar}>
      <div className={css.productCurrentStore}><span>当前店铺</span><strong>{selectedProductStore?selectedProductStore.name+" · "+selectedProductStore.region:"暂无已绑定店铺"}</strong></div>
      <button type="button" disabled={!eligibleProductStores.length} onClick={()=>{setStorePickerSearch("");setStorePickerRegion("全部站点");setStorePickerStatus("全部状态");setStorePickerAdvanced(false);setStorePickerPage(1);setStorePickerOpen(true)}}>选择店铺（{eligibleProductStores.length}）</button>
      <button type="button" className={css.productSyncPrimary} disabled={!selectedProductStore} onClick={()=>{if(!selectedProductStore?.platformStoreId)return;const existing=readStoreProductSnapshot(organizationId,selectedProductStore.id,selectedProductStore.platformStoreId);const demo=buildAdminStoreSyncDemo(organizationId,selectedProductStore.id,selectedProductStore.platformStoreId);if(demo&&(!existing||existing.simulated)){if(!demoStoreServiceActive(selectedProductStore)||selectedProductStore.connectionIssue){setProductSyncNotice("店铺服务已到期或连接异常，已保留上次同步记录。");return}try{saveVerifiedStoreProductSnapshot({...demo,syncedAt:new Date().toISOString()});setProductSyncNotice("模拟同步成功：共 2 款商品，硕米刊登 1 款、商家原有 1 款。未请求真实平台。")}catch{setProductSyncNotice("模拟同步保存失败，已保留原有记录。")}return}setProductSyncNotice("当前未接入 SHEIN 真实商品同步接口；已保存的历史商品不会被清空。")}}>同步商品</button>
      
     </div>
     {storePickerOpen?<div className={css.productPickerBackdrop} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setStorePickerOpen(false)}}>
      <section className={css.productPickerDialog} role="dialog" aria-modal="true" aria-label="选择已绑定店铺">
       <header><div><h2>选择店铺</h2><p>只显示当前企业及账号有权限的已绑定店铺 · 共 {eligibleProductStores.length} 家</p></div><button type="button" onClick={()=>setStorePickerOpen(false)}>关闭</button></header>
       <div className={css.productPickerSearch}>
        <input autoFocus aria-label="搜索店铺名称或平台 ID" placeholder="搜索店铺名称、负责人、站点或平台 ID" value={storePickerSearch} onChange={e=>{setStorePickerSearch(e.target.value);setStorePickerPage(1)}}/>
        <button type="button" aria-expanded={storePickerAdvanced} onClick={()=>setStorePickerAdvanced(x=>!x)}>筛选{storePickerAdvanced?"（收起）":""}</button>
        <button type="button" onClick={()=>{setStorePickerSearch("");setStorePickerRegion("全部站点");setStorePickerStatus("全部状态");setStorePickerPage(1)}}>重置</button>
       </div>
       {storePickerAdvanced?<div className={css.productPickerFilters}>
        <label>站点<select value={storePickerRegion} onChange={e=>{setStorePickerRegion(e.target.value);setStorePickerPage(1)}}><option>全部站点</option>{storePickerRegions.map(region=><option key={region}>{region}</option>)}</select></label>
        <label>状态<select value={storePickerStatus} onChange={e=>{setStorePickerStatus(e.target.value);setStorePickerPage(1)}}><option>全部状态</option><option>服务有效</option><option>连接异常</option><option>服务已到期</option></select></label>
       </div>:null}
       <div className={css.productPickerResults}>
        {storePickerRows.map(store=><button type="button" key={store.id} aria-pressed={selectedProductStore?.id===store.id} onClick={()=>{setProductStoreId(store.id);setProductSyncNotice("");setStorePickerOpen(false)}}>
         <span><strong>{store.name}</strong><small>SHEIN · {store.region} · {store.type}</small><small>平台 ID：{store.platformStoreId}</small></span>
         <span><strong>{!demoStoreServiceActive(store)?"服务已到期":store.connectionIssue?"连接需处理":"已绑定"}</strong><small>{store.owner||"未分配负责人"}</small></span>
         <span>{selectedProductStore?.id===store.id?"当前选择":"选择"}</span>
        </button>)}
        {!storePickerRows.length?<p>没有匹配的店铺，请调整搜索或筛选条件。</p>:null}
       </div>
       <footer><span>共 {storePickerMatches.length} 家 · 第 {storePickerCurrentPage} / {storePickerPageCount} 页</span><div><button type="button" disabled={storePickerCurrentPage<=1} onClick={()=>setStorePickerPage(x=>x-1)}>上一页</button><button type="button" disabled={storePickerCurrentPage>=storePickerPageCount} onClick={()=>setStorePickerPage(x=>x+1)}>下一页</button></div></footer>
      </section>
     </div>:null}
     {productSyncNotice?<p role="status" className={css.productSyncNotice}>{productSyncNotice}</p>:null}
     <div className={css.productSyncStoreSummary}>
      {selectedProductStore?[selectedProductStore].map(s=><div key={s.id} className={css.productSyncSelected}>
       <div><strong>{s.name}</strong><small>SHEIN · {s.region} · {s.type} · {s.owner||"未分配负责人"}</small><small>平台店铺 ID：{s.platformStoreId}</small></div>
       <div><strong>{!demoStoreServiceActive(s)?"服务已到期":s.connectionIssue?"连接需处理":"已绑定店铺"}</strong><small>最近商品同步：{productSnapshots.find(x=>x.store.id===s.id)?.snapshot.syncedAt?new Date(productSnapshots.find(x=>x.store.id===s.id)!.snapshot.syncedAt).toLocaleString("zh-CN",{hour12:false}):"从未成功同步"}</small></div>
      </div>):<p>当前账号暂无可选择的已绑定店铺。请先在「我的店铺」完成绑定。</p>}
     </div>
    </section>
    <section className={css.panel} aria-label="已同步商品与来源">
     <header><h2>店铺商品</h2><span>共 {cachedProducts.length} 条 · {lastProductSync?(productSnapshots.some(x=>x.snapshot.simulated)?"模拟同步：":"最近同步：")+new Date(lastProductSync).toLocaleString("zh-CN",{hour12:false}):"暂无已保存的同步记录"}</span></header>
     <div className={css.productSourceToolbar}>
      <div className={css.productSourceTabs} role="group" aria-label="商品来源筛选">
       {([["all","全部商品"],["merchant","商家原有"],["shuomi","硕米刊登"]] as const).map(([value,label])=><button type="button" key={value} aria-pressed={productSource===value} onClick={()=>setProductSource(value)}>{label}</button>)}
      </div>
      <input aria-label="搜索已同步商品" placeholder="搜索商品名称 / 平台商品 ID / SKU" value={productKeyword} onChange={e=>setProductKeyword(e.target.value)}/>
      <button type="button" onClick={()=>{setProductSource("all");setProductKeyword("")}}>重置</button>
     </div>
     <div className={css.productOriginInfo}>
      <div><strong>商家原有</strong><small>平台同步到商品，但没有匹配到经验证的硕米上传回执</small></div>
      <div><strong>硕米刊登</strong><small>平台商品 ID 与硕米上传任务、平台接收回执匹配成功</small></div>
     </div>
     <div className={css.productDataTable}><table><thead><tr><th>商品信息</th><th>所属店铺</th><th>商品来源</th><th>平台状态</th><th>售价 / 库存</th><th>最近同步</th><th>操作</th></tr></thead><tbody>{cachedProducts.length?cachedProducts.map(row=><tr key={row.store.id+":"+row.platformProductId+":"+row.sku}><td><div className={css.productCachedIdentity}>{row.imageUrl?<img src={row.imageUrl} alt={row.name} loading="lazy"/>:null}<div><strong>{row.name}</strong><small>平台商品 ID：{row.platformProductId} · SKU：{row.sku}</small></div></div></td><td>{row.store.name}</td><td>{row.origin==="shuomi"?"硕米刊登":row.origin==="merchant"?"商家原有":"来源待核实"}</td><td>{row.platformStatus}</td><td>{row.price??"—"} / {row.stock??"—"}</td><td>{new Date(productSnapshots.find(x=>x.store.id===row.store.id)!.snapshot.syncedAt).toLocaleString("zh-CN",{hour12:false})}</td><td>查看</td></tr>):<tr><td colSpan={7}><div className={css.productDataEmpty}><Package size={30}/><h3>{allCachedProducts.length?"当前筛选没有匹配商品":"暂无已保存的同步商品"}</h3><span>{allCachedProducts.length?"切换来源或清空搜索条件查看上次同步记录。":"首次成功同步后会保留商品快照；再次打开页面不自动同步或清空旧结果。"}</span></div></td></tr>}</tbody></table></div>
     <p className={css.productSyncFootnote}>演示店铺支持模拟同步，真实商品快照仅在接口接通并成功同步后更新。同步失败必须保留上一次成功结果；已保存商品不保证是实时状态。来源判定以店铺 ID、平台商品 ID 和已核实上传回执为准；没有对应回执的商品暂归为「商家原有 / 来源待核实」，不因商品名称相同就标记为硕米刊登。待刊登、已提交不等于已上架。</p>
    </section>
   </>:<>
    <section className={css.metrics}>{[["订单总数",0],["待处理订单",0],["发货中",0],["履约异常",0]].map(([title,val])=><article key={title}><span>{title}</span><strong>{val}</strong></article>)}</section>
    <section className={css.panel}><header><h2>平台订单记录</h2><span>共 0 条</span></header><div className={css.empty}><Truck size={34}/><h3>暂无平台订单</h3><p>绑定店铺并同步业务数据后，订单才会出现在这里。没有订单时不显示虚构履约进度。</p><button className={css.orderEmptyAction} style={{backgroundColor:"#6254d9",color:"#fff",borderColor:"#6254d9"}} onClick={()=>link("/workbench/stores")}>前往我的店铺</button></div></section>
   </>}
  </>}
  <p className={css.disclaimer}>{route==="stores"?"店铺分组与负责人可用于任务中心、数据中心和 AI 智能体的跨店筛选与权限管理。":"每个演示账号展示各自独立的已绑定店铺资料；当前未接入真实 SHEIN 数据同步，不产生商品、订单、销售或库存数据。"}</p>
  {groupAssignOpen?<div className={css.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setGroupAssignOpen(false)}}><section className={css.dialog} role="dialog" aria-modal="true" aria-label="批量加入分组"><header><div><h2>批量加入分组</h2><p>已选择 {checkedStores.length} 家店铺。确认后统一更新所属分组，不改变负责人、平台店铺 ID 和服务期。</p></div><button type="button" aria-label="关闭弹窗" onClick={()=>setGroupAssignOpen(false)}>×</button></header><label>目标分组<select aria-label="选择批量分组" value={bulkGroup} onChange={e=>setBulkGroup(e.target.value)}><option>未分组</option>{groups.map(g=><option key={g}>{g}</option>)}</select></label><footer className={css.dialogActions}><button type="button" onClick={()=>setGroupAssignOpen(false)}>取消</button><button type="button" className={css.primary} disabled={!checkedStores.length} onClick={applyGroupToSelection}>确认加入</button></footer></section></div>:null}
  {groupsOpen?<div className={css.backdrop+" "+css.groupBackdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setGroupsOpen(false)}}><section className={css.dialog} role="dialog" aria-modal="true" aria-label="管理分组"><header><div><h2>管理分组</h2><p>与 Figma 一致：新建分组、查看分组内店铺、移除空分组。仅保存到本地演示会话。</p></div><button aria-label="关闭弹窗" onClick={()=>setGroupsOpen(false)}>×</button></header><form onSubmit={e=>{e.preventDefault();const v=groupName.trim();if(!v||groups.includes(v))return;setGroups(old=>[...old,v]);setGroupName("");setNewGroup(v);setNotice("分组已创建，可在绑定和管理店铺时选择。")}}><label>新建分组<input aria-label="分组名称" maxLength={40} value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="输入分组名称"/></label><button className={css.primary} type="submit" disabled={!groupName.trim()||groups.includes(groupName.trim())}>创建分组</button></form><div className={css.groupList}>{["未分组",...groups].map(g=><div key={g}><strong>{g}</strong><span>{stores.filter(x=>(x.group||"未分组")===g).length} 家店铺</span>{g!=="未分组"?<button type="button" onClick={()=>{setGroupRename(g);setGroupRenameValue(g)}}>重命名</button>:null}{g!=="未分组"?<button onClick={()=>{setStores(old=>old.map(x=>x.group===g?{...x,group:"未分组"}:x));setGroups(old=>old.filter(x=>x!==g));setSettingsDraft(old=>({...old,group:old.group===g?"未分组":old.group}));setNotice("已移除分组，原店铺自动转入未分组，未解绑店铺。")}}>删除</button>:null}</div>)}</div><footer className={css.dialogActions}><button className={css.primary} onClick={()=>setGroupsOpen(false)}>完成</button></footer></section></div>:null}

  {creatingGroup?<div className={css.backdrop+" "+css.groupBackdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setCreatingGroup(false)}}><section className={css.dialog} role="dialog" aria-modal="true" aria-label="新建店铺分组"><header><div><h2>新建店铺分组</h2><p>创建后会自动加入当前绑定表单的店铺分组，不会清除已填写的信息。</p></div><button aria-label="关闭弹窗" onClick={()=>setCreatingGroup(false)}>×</button></header><form onSubmit={createBindingGroup}><label>分组名称<input required aria-label="新建店铺分组名称" autoFocus maxLength={40} value={groupName} onChange={e=>{setGroupName(e.target.value);setGroupError("")}} placeholder="请输入分组名称"/></label>{groupError?<p role="alert" className={css.warning}>{groupError}</p>:null}<footer className={css.dialogActions}><button type="button" onClick={()=>setCreatingGroup(false)}>取消</button><button className={css.primary} type="submit">创建分组</button></footer></form></section></div>:null}
  {addingOwner?<div className={css.backdrop+" "+css.groupBackdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setAddingOwner(false)}}><section className={css.dialog} role="dialog" aria-modal="true" aria-label="添加负责人"><header><div><h2>添加负责人</h2><p>负责人需要先成为企业空间成员，再在这里选择。不能通过店铺绑定表单直接创建权限成员。</p></div><button aria-label="关闭弹窗" onClick={()=>setAddingOwner(false)}>×</button></header><p className={css.hint}>前往「企业空间 · 成员与权限」添加成员及配置权限后，再回到绑定店铺选择负责人。</p><footer className={css.dialogActions}><button type="button" onClick={()=>setAddingOwner(false)}>暂不添加</button><button className={css.primary} onClick={()=>{setAddingOwner(false);setDialog(false);setManageId(null);link("/workbench/account/organization/members")}}>成员与权限</button></footer></section></div>:null}
  {groupRename?<div className={css.backdrop+" "+css.groupBackdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setGroupRename(null)}}><section className={css.dialog} role="dialog" aria-modal="true" aria-label="重命名分组"><header><h2>重命名分组</h2><button aria-label="关闭弹窗" onClick={()=>setGroupRename(null)}>×</button></header><form onSubmit={e=>{e.preventDefault();const v=groupRenameValue.trim();if(!v||groups.some(x=>x===v&&x!==groupRename))return;setGroups(old=>old.map(x=>x===groupRename?v:x));setStores(old=>old.map(x=>x.group===groupRename?{...x,group:v}:x));setSettingsDraft(old=>({...old,group:old.group===groupRename?v:old.group}));setGroupRename(null);setNotice("分组及组内店铺归属已更新。")}}><label>分组名称<input aria-label="重命名分组名称" value={groupRenameValue} onChange={e=>setGroupRenameValue(e.target.value)} required/></label><footer className={css.dialogActions}><button type="button" onClick={()=>setGroupRename(null)}>取消</button><button className={css.primary} type="submit">保存修改</button></footer></form></section></div>:null}
   {syncing?<div className={css.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setSyncing(null)}}><section className={css.dialog} role="dialog" aria-modal="true" aria-label="立即同步"><header><div><h2>立即同步</h2><p>店铺绑定后即可使用；同步功能需要实际业务数据接口。</p></div><button aria-label="关闭弹窗" onClick={()=>setSyncing(null)}>×</button></header><p className={css.hint}>{(()=>{const item=stores.find(store=>store.id===syncing);return item&&!demoStoreServiceActive(item)?"此店铺服务已到期或资料未完成，请先确认服务期。":"演示站尚未接入真实商品与订单同步接口，不会伪造同步结果。"})()}</p><footer className={css.dialogActions}><button className={css.primary} onClick={()=>setSyncing(null)}>我知道了</button></footer></section></div>:null}
  {detailStore?<div className={css.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setInspecting(null)}}><section className={css.dialog+" "+css.wideDialog} role="dialog" aria-modal="true" aria-label="店铺详情"><header><div><h2>{detailStore.name} · 店铺详情</h2><p>SHEIN · {detailStore.region} · {detailStore.type} · 已绑定（本地演示资料）</p></div><button aria-label="关闭弹窗" onClick={()=>setInspecting(null)}>×</button></header>
  <nav className={css.detailTabs} aria-label="店铺详情导航">{["店铺概览","服务信息","数据同步","网络环境","店铺设置"].map(tab=><button key={tab} className={detailTab===tab?css.activeTab:""} aria-current={detailTab===tab?"page":undefined} onClick={()=>setDetailTab(tab)}>{tab}</button>)}</nav>
  {detailTab==="店铺概览"?<><dl className={css.detailList}><div><dt>店铺名称</dt><dd>{detailStore.name}</dd></div><div><dt>店铺编号</dt><dd>{detailStore.id}</dd></div><div><dt>平台与站点</dt><dd>{detailStore.platform} · {detailStore.region}</dd></div><div><dt>经营类型</dt><dd>{detailStore.type}</dd></div><div><dt>店铺分组</dt><dd>{detailStore.group||"未分组"}</dd></div><div><dt>负责人</dt><dd>{detailStore.owner||"未分配"}</dd></div><div><dt>创建时间</dt><dd>{detailStore.createdAt}</dd></div></dl><p className={css.hint}>商品、订单与库存统计仅在实际业务同步后展示。</p></>:
   detailTab==="服务信息"?<><dl className={css.detailList}><div><dt>绑定状态</dt><dd>已绑定</dd></div><div><dt>服务状态</dt><dd>{demoStoreServiceActive(detailStore)?"服务中":detailStore.servicePeriods?"已到期":"历史数据待核实"}</dd></div><div><dt>到期日期</dt><dd>{detailStore.serviceExpiresAt?new Date(detailStore.serviceExpiresAt).toLocaleDateString("zh-CN"):"—"}</dd></div></dl>{detailStore.platformStoreId&&Number(detailStore.servicePeriods)>0?<button onClick={()=>{setInspecting(null);activateStore(detailStore.id)}}>续费30天</button>:<p className={css.hint}>此历史模拟店铺缺少平台 ID 或计费信息，不能续费。</p>}</>:
  detailTab==="数据同步"?<><dl className={css.detailList}><div><dt>最近同步</dt><dd>暂无同步数据</dd></div><div><dt>商品同步</dt><dd>未开始</dd></div><div><dt>订单同步</dt><dd>未开始</dd></div></dl><button onClick={()=>{setInspecting(null);setSyncing(detailStore.id)}}>立即同步</button></>:
  detailTab==="网络环境"?<><dl className={css.detailList}><div><dt>网络环境</dt><dd>未检测</dd></div><div><dt>公网 IP</dt><dd>未获取</dd></div><div><dt>连接检测</dt><dd>需要正式服务支持</dd></div></dl><p className={css.hint}>未接入真实网络检测前，不展示模拟 IP 或“网络正常”状态。</p></>:
  <form onSubmit={e=>{e.preventDefault();setNotice("店铺设置已保存至当前浏览器演示会话。");setInspecting(null)}}><label>店铺分组<select aria-label="店铺所属分组" value={detailStore.group||"未分组"} onChange={e=>setStores(old=>old.map(x=>x.id===detailStore.id?{...x,group:e.target.value}:x))}><option>未分组</option>{groups.map(g=><option key={g}>{g}</option>)}</select></label><label>负责人<input aria-label="店铺负责人" maxLength={60} value={detailStore.owner||""} onChange={e=>setStores(old=>old.map(x=>x.id===detailStore.id?{...x,owner:e.target.value}:x))} placeholder="可留空"/></label><footer><button type="button" onClick={()=>{setEditing(detailStore.id);setName(detailStore.name);setInspecting(null)}}>修改名称</button><button className={css.primary} type="submit">保存设置</button></footer></form>}
  <footer className={css.dialogActions}><button onClick={()=>{setEditing(detailStore.id);setName(detailStore.name);setInspecting(null)}}>修改名称</button><button className={css.primary} onClick={()=>setInspecting(null)}>返回我的店铺</button></footer></section></div>:null}

  {editing?<div className={css.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setEditing(null)}}><section className={css.dialog} role="dialog" aria-modal="true" aria-label="管理店铺名称"><header><div><h2>管理店铺名称</h2><p>只修改本地演示资料，不影响平台店铺。</p></div><button aria-label="关闭弹窗" onClick={()=>setEditing(null)}>×</button></header><form onSubmit={saveRename}><label>店铺名称<input required maxLength={80} autoFocus value={name} onChange={e=>setName(e.target.value)}/></label><footer><button type="button" onClick={()=>setEditing(null)}>取消</button><button className={css.primary} type="submit">保存修改</button></footer></form></section></div>:null}
  {confirmDelete?<div className={css.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setConfirmDelete(null)}}><section className={css.dialog} role="alertdialog" aria-modal="true" aria-label="确认移除演示店铺"><header><div><h2>移除演示店铺</h2><p>确认移至「已删除」？平台店铺 ID、原负责人、服务期限与连接状态都会保留，可随时恢复；已使用服务期不退回。</p></div><button aria-label="关闭弹窗" onClick={()=>setConfirmDelete(null)}>×</button></header><footer className={css.dialogActions}><button onClick={()=>setConfirmDelete(null)}>取消</button><button className={css.primary} onClick={deleteDemo}>确认移除</button></footer></section></div>:null}

  {movingStore?<div className={css.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setMoveStoreId(null)}}><section className={css.dialog+" "+css.moveDialog} role="dialog" aria-modal="true" aria-label="移动店铺分组"><header><div><h2>移动分组</h2><p>{movingStore.name}</p></div><button type="button" aria-label="关闭弹窗" onClick={()=>setMoveStoreId(null)}>×</button></header><label className={css.moveGroupLabel}>目标分组<select aria-label="目标分组" value={moveGroup} onChange={e=>setMoveGroup(e.target.value)}><option>未分组</option>{groups.map(g=><option key={g}>{g}</option>)}</select></label><p className={css.hint}>只调整分组，不影响平台店铺 ID、授权身份和服务期限。</p><footer className={css.dialogActions}><button type="button" onClick={()=>setMoveStoreId(null)}>取消</button><button className={css.primary} type="button" onClick={moveSingleStore}>确认移动</button></footer></section></div>:null}
  {connectionStore?<div className={css.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setCheckConnectionId(null)}}><section className={css.dialog+" "+css.connectionCheckDialog} role="dialog" aria-modal="true" aria-label="连接检测结果"><header><div><h2>检测连接</h2><p>{connectionStore.name} · {connectionStore.platformStoreId||"平台 ID 待确认"}</p></div><button type="button" aria-label="关闭弹窗" onClick={()=>setCheckConnectionId(null)}>×</button></header><div className={css.connectionChecks}><div><span>平台店铺 ID</span><strong>{connectionStore.platformStoreId?"原 ID 已锁定":"缺少原 ID"}</strong></div><div><span>服务期</span><strong>{demoStoreServiceActive(connectionStore)?"服务有效":"已到期"}</strong></div><div><span>历史连接状态</span><strong>{connectionStore.connectionIssue||"无已登记异常"}</strong></div><div><span>实时平台连接检测</span><strong>未接入 SHEIN 官方验证接口</strong></div></div><p className={css.hint}>此处只核对已保存的资料，不伪造网络请求或“连接正常”。正式检测须实际连接平台并比较返回的平台店铺 ID；与原 ID 不一致必须拒绝连接。</p><footer className={css.dialogActions}><button type="button" onClick={()=>setCheckConnectionId(null)}>关闭</button><button type="button" className={css.primary} onClick={()=>{const id=connectionStore.id;setCheckConnectionId(null);enterStore(id,"店铺概览")}}>进入店铺详情</button></footer></section></div>:null}
  {ipDialogOpen?<div className={css.backdrop+" "+css.ipBackdrop} onMouseDown={e=>{if(e.target===e.currentTarget){setIpDialogOpen(false);setIpError("");setIpPassword("")}}}><section className={css.dialog+" "+css.ipConfigurationDialog} role="dialog" aria-modal="true" aria-label="固定IP配置"><header><div><h2>固定IP配置</h2><p>填写IP服务商提供的连接信息，保存后用于本次店铺授权。</p></div><button type="button" aria-label="关闭弹窗" onClick={()=>{setIpDialogOpen(false);setIpError("");setIpPassword("")}}>×</button></header><form onSubmit={saveIpConfiguration} className={css.ipConfigForm}><div className={css.ipExplainer}><strong>IP的作用 · 防关联</strong><p>让授权请求通过指定的独立网络出口发起，降低多个店铺共用出口造成的关联风险，并减少异地登录提示和平台风控。仅填写资料不代表已接入代理。</p></div><div className={css.ipFormGrid}><label>IP地址<input aria-label="IP地址" value={ipAddress} placeholder="例如：192.168.1.10" onChange={e=>{setIpAddress(e.target.value);setIpError("")}} required/></label><label>端口<input aria-label="端口" value={ipPort} inputMode="numeric" placeholder="例如：8080" onChange={e=>{setIpPort(e.target.value);setIpError("")}} required/></label><label>IP账号<input aria-label="IP账号" autoComplete="off" value={ipUser} placeholder="请输入IP账号" onChange={e=>setIpUser(e.target.value)}/></label><label>IP密码<span className={css.ipSecretField}><input aria-label="IP密码" autoComplete="new-password" type={ipShowPassword?"text":"password"} value={ipPassword} onChange={e=>setIpPassword(e.target.value)} placeholder="请输入IP密码"/><button type="button" onClick={()=>setIpShowPassword(v=>!v)}>{ipShowPassword?"隐藏":"显示"}</button></span></label></div><p className={css.hint}>如果IP无需账号和密码，可留空。密码不会保存在演示数据中，平台授权与防关联功能需要服务端网络能力。</p>{ipError?<p className={css.warning} role="alert">{ipError}</p>:null}<footer className={css.dialogActions}><button type="button" onClick={()=>{setIpDialogOpen(false);setIpError("");setIpPassword("")}}>取消</button><button className={css.primary} type="submit">保存并启用</button></footer></form></section></div>:null}
  {renewalStore?<div className={css.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget){setRenewalId(null);setRenewalError("");}}}><section className={css.dialog+" "+css.renewalDialog} role="dialog" aria-modal="true" aria-label="店铺续费"><header className={css.renewalHeading}><div><h2>店铺续费</h2><p>{renewalStore.name} · SHEIN · {renewalStore.region}</p></div><button type="button" aria-label="关闭续费弹窗" onClick={()=>{setRenewalId(null);setRenewalError("")}}>×</button></header>
   <div className={css.renewalFacts}><div><span>当前服务到期</span><strong>{renewalStore.serviceExpiresAt?new Date(renewalStore.serviceExpiresAt).toLocaleDateString("zh-CN"):"待核实"}</strong></div><div><span>当前状态</span><strong className={demoStoreServiceActive(renewalStore)?css.renewalValid:css.renewalExpired}>{demoStoreServiceActive(renewalStore)?"服务有效":"已到期"}</strong><small>{demoStoreServiceActive(renewalStore)?"到期日顺延":"续费后从当前日期开始"}</small></div></div>
   <label className={css.renewalQuantity}>续费周期 <small>可用 {availablePeriods} 期，每期 30 天</small><span className={css.renewalInput}><input aria-label="续费周期" inputMode="numeric" type="number" min={1} max={100} step={1} value={renewalPeriods} onChange={e=>{setRenewalPeriods(Number(e.target.value));setRenewalError("")}}/><em>30 天 / 期</em></span></label>
   <div className={css.renewalPreview}><div><span>已选周期</span><strong>{renewalPeriods>0&&Number.isSafeInteger(renewalPeriods)?renewalPeriods:0} 期</strong></div><div><span>续费后到期</span><strong>{Number.isSafeInteger(renewalPeriods)&&renewalPeriods>0&&renewalPeriods<=100?new Date(renewEnd).toLocaleDateString("zh-CN"):"—"}</strong></div></div>
   {renewalError?<p className={css.warning} role="alert">{renewalError}</p>:availablePeriods<renewalPeriods?<p className={css.warning} role="status">服务期数不足：可用 {availablePeriods} 期，请先购买或向管理员申请分配。</p>:null}
   <footer className={css.dialogActions}><button type="button" onClick={()=>{setRenewalId(null);setRenewalError("")}}>取消</button><button type="button" className={css.primary} disabled={!Number.isSafeInteger(renewalPeriods)||renewalPeriods<1||renewalPeriods>100||availablePeriods<renewalPeriods||!renewalStore.platformStoreId} onClick={()=>activateStore(renewalStore.id,renewalPeriods)}>确认续费</button></footer>
  </section></div>:null}
  {(dialog||managedStore)?<div className={css.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget){setDialog(false);setManageId(null);setAuthPassword("");setAuthCode("")}}}><section className={css.dialog+" "+css.authDialog} role="dialog" aria-modal="true" aria-label={managedStore?"管理店铺":"绑定新店铺"}><header><div><h2>{managedStore?"管理店铺":"绑定新店铺"}</h2><p>{managedStore?"修改基础资料及授权设置；未提交的更改不会保存。":"选择平台与授权方式，取得平台店铺 ID 后完成绑定并开始 30 天服务。"}</p></div><button aria-label="关闭弹窗" onClick={()=>{setDialog(false);setManageId(null);setAuthPassword("");setAuthCode("")}}>×</button></header>
  {!managedStore?<div className={css.hint} role="status">当前可用店铺服务：{availablePeriods} 期。{availablePeriods<1?"额度不足，不能绑定新店铺。请先购买服务期数，子账号请联系本组织管理员分配。":"获取平台店铺 ID 成功后才完成绑定、扣减 1 期并开始 30 天服务。"}</div>:null}
  {managedStore?<div className={css.bindingIdentity} role="group" aria-label="已绑定平台身份"><div><span>平台店铺 ID（唯一且不可修改）</span><strong data-testid="locked-platform-store-id">{managedStore.platformStoreId||"平台 ID 未获取"}</strong></div><p>该 ID 在首次成功绑定后锁定，续费只延长本店铺服务期，不能转移到另一家平台店铺。站点和店铺类型也随绑定身份锁定；需更换店铺请重新购买服务期并绑定。</p></div>:null}
  {managedStore&&!managedStore.bindingAccount?<p className={css.hint}>原账号未登记，可补充演示账号资料；平台店铺 ID 仍保持锁定，修改资料不代表重新授权成功。</p>:null}
  {managedStore?.connectionIssue?<div className={css.manageWarning} role="status"><strong>连接异常 · {managedStore.connectionIssue}</strong><span>此店已绑定且服务有效。保存资料不会自动恢复连接，需经平台接口实际检测确认。</span></div>:null}
  <form className={css.manageForm} onSubmit={submitBinding}>
    <div className={css.bindingGrid}>
      <label>平台<select aria-label="平台" value="SHEIN" disabled><option>SHEIN</option></select></label>
      <label>站点<select aria-label="站点" value={region} disabled={Boolean(managedStore)} onChange={e=>setRegion(e.target.value)}>{demoSites.map(site=><option key={site}>{site}</option>)}<option>其他站点</option></select></label>
      <label>店铺类型<select aria-label="店铺类型" value={type} disabled={Boolean(managedStore)} onChange={e=>setType(e.target.value)}><option>半托管</option><option>全托管</option><option>自营</option></select></label>
      <label>自定义名称<input aria-label="自定义名称" required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="请输入店铺自定义名称"/><small>仅在系统内显示，不影响平台店铺原名。</small></label>
      <label>负责人<select aria-label="负责人" value={newOwner} onChange={e=>setNewOwner(e.target.value)}><option value="">{ownerMembers.find(m=>m.id==="admin")?.name||"管理员"}（默认）</option>{owners.filter(owner=>owner!==ownerMembers.find(m=>m.id==="admin")?.name).map(owner=><option key={owner} value={owner}>{owner}</option>)}</select><small>用于任务分配和日常协作。<button type="button" className={css.inlineLink} onClick={()=>setAddingOwner(true)}>＋ 添加负责人</button></small></label>
      <label>店铺分组<select aria-label="绑定店铺分组" value={newGroup} onChange={e=>setNewGroup(e.target.value)}><option>未分组</option>{groups.map(g=><option key={g}>{g}</option>)}</select><small>便于分类筛选。<button type="button" className={css.inlineLink} onClick={()=>{setCreatingGroup(true);setGroupName("");setGroupError("")}}>＋ 新建分组</button></small></label>
    </div>
    <div className={css.authSection}><strong>{managedStore?"子账户授权资料（可修改）":"选择授权方式"}</strong>{managedStore?<p className={css.hint}>可修改本地演示子账号及模拟密码。保存不会完成 SHEIN 重授权，原平台店铺 ID 和服务期保持不变；真实重授权必须核对返回的店铺 ID 一致。</p>:null}<fieldset className={css.authLock}><div className={css.authOptions}><button type="button" className={authorizationMethod!=="API 授权（暂未开放）"?css.authSelected:""} onClick={()=>setAuthorizationMethod("子账户邮箱验证码")} aria-pressed={authorizationMethod!=="API 授权（暂未开放）"}><b>子账户授权</b><small>填写平台子账户信息完成验证</small></button><button type="button" className={authorizationMethod==="API 授权（暂未开放）"?css.authSelected:""} onClick={()=>setAuthorizationMethod("API 授权（暂未开放）")} aria-pressed={authorizationMethod==="API 授权（暂未开放）"}><b>API 授权</b><small>适用于接口密钥授权 · 暂未开放</small></button></div>
    {authorizationMethod==="API 授权（暂未开放）"?<p className={css.hint}>API 授权暂未开放，请选择子账户授权。此处不会创建授权或访问令牌。</p>:<>
    <label>子账户账号<input aria-label="子账户账号" autoComplete="off" maxLength={100} value={authAccount} onChange={e=>setAuthAccount(e.target.value)} placeholder="请输入子账户账号"/></label>
    <label>子账户密码（仅演示）<div className={css.passwordField}><input aria-label="子账户密码" autoComplete="new-password" maxLength={100} type={showPassword?"text":"password"} value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="请输入子账户密码"/><button type="button" onClick={()=>setShowPassword(x=>!x)}>{showPassword?"隐藏":"显示"}</button></div></label>
    
    <div className={css.verification}><strong>验证码接收方式</strong><div className={css.codeModes}><button type="button" aria-pressed={authorizationMethod==="子账户邮箱验证码"} onClick={()=>setAuthorizationMethod("子账户邮箱验证码")}>邮箱验证码</button><button type="button" aria-pressed={authorizationMethod==="子账户手机验证码"} onClick={()=>setAuthorizationMethod("子账户手机验证码")}>手机验证码</button></div><small>验证码将发送至该子账户绑定{authorizationMethod==="子账户邮箱验证码"?"邮箱":"手机号"}（正式授权时）</small></div>
    <label>验证码<div className={css.passwordField}><input aria-label="验证码" autoComplete="one-time-code" value={authCode} onChange={e=>setAuthCode(e.target.value)} placeholder="请输入验证码"/><button type="button" onClick={()=>setCodeNotice("当前为演示展示，尚未接通 SHEIN 官方验证码发送服务，未发送验证码。")}>接收验证码</button></div></label>
    <p className={css.hint}>只可填写模拟账号及模拟密码，切勿输入真实凭据。演示密码仅保存在当前浏览器会话，不接入 SHEIN；验证码不保存。</p></>}
    {fixedIp?<p className={css.hint}>正式固定 IP 需要配置可用的代理网络出口；演示页面不会伪造 IP 或验证结果。</p>:null}
    </fieldset><div className={css.fixedIp}><div><strong>启用固定IP · 防关联</strong><p>使用独立代理出口减少多店铺共用网络环境导致的关联风险；实际生效以正式网络服务为准。</p></div><label className={css.toggleLabel}><input type="checkbox" aria-label="启用固定IP" checked={fixedIp} onChange={e=>{if(e.target.checked){setFixedIp(true);setIpDialogOpen(true);setIpError("")}else{setFixedIp(false);setIpDialogOpen(false)}}}/><span>{fixedIp?"已配置（演示）":"未启用"}</span></label>{fixedIp?<button type="button" className={css.inlineLink} onClick={()=>setIpDialogOpen(true)}>配置IP</button>:null}</div></div>
    {codeNotice?<p className={css.warning} role="status">{codeNotice}</p>:null}
    <footer className={css.dialogActions}>{managedStore?<button type="button" className={css.inlineLink} onClick={()=>{const id=managedStore.id;setManageId(null);setAuthPassword("");setAuthCode("");setCheckConnectionId(id)}}>检测连接</button>:null}<button type="button" onClick={()=>{setDialog(false);setManageId(null);setAuthPassword("");setAuthCode("")}}>取消</button><button className={css.primary} type="submit" disabled={authorizationMethod==="API 授权（暂未开放）"||(!managedStore&&availablePeriods<1)}>{managedStore?"保存修改":"确认绑定"}</button></footer>
  </form></section></div>:null}

 </main>
}
