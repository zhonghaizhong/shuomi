"use client";
import {useState} from "react";
import {useQuery,useQueryClient} from "@tanstack/react-query";
import {usePathname,useRouter,useSearchParams} from "next/navigation";
import Link from "next/link";
import {AlertTriangle,ArrowUpRight,CheckCircle2,ChevronLeft,ChevronRight,FolderPlus,MoreHorizontal,Plus,RefreshCw,Search,SlidersHorizontal,Users} from "lucide-react";
import {useWorkbenchContext} from "@/components/providers/workbench-context-provider";
import {ConsolePage,ConsoleState} from "@/components/workbench/console/console-page";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {useStoreCatalog} from "@/lib/query/use-store-catalog";
import {catalogFiltersSchema,catalogSearch,type CatalogFilters,type CatalogItem,type StoreCenterScope} from "@/lib/api/store-center";
import {getMember} from "@/lib/api/members";
import {canCreateWorkbenchStore,canUpdateWorkbenchStore} from "@/lib/workbench/permissions";
import {findConsoleRoute} from "@/lib/workbench/console-navigation";
import {StoreLifecycleActions} from "./store-lifecycle-actions";
import {StoreCatalogDialogs,type CatalogDialog} from "./store-catalog-dialogs";
import {StoreReadinessNotice,useStoreReadiness} from "./store-readiness";
import styles from "./store-catalog.module.css";

export function StoreListPage(){
 const context=useWorkbenchContext(),org=context.effectiveOrganization?.id??"",user=context.user?.id??"";
 if(!org || !user || context.isSwitching)return <ConsoleState kind="loading" title="正在加载企业权限…"/>;
 return <ScopedStoreList key={JSON.stringify([org,user,context.permissions,context.roles])} scope={{organizationId:org,userId:user}}/>;
}
function ScopedStoreList({scope}:{scope:StoreCenterScope}){
 const router=useRouter(),pathname=usePathname()||"/workbench/stores",params=useSearchParams(),context=useWorkbenchContext(),queryClient=useQueryClient();
 const raw:Record<string,unknown>={page:1,pageSize:20};
 for(const key of ["page","pageSize","q","platform","region","applicationType","groupId","attention","status"]){const value=params?.getAll(key).length===1?params.get(key):null;if(params && params.getAll(key).length>1)raw.invalid=true;if(value!==null)raw[key]=key==="page" || key==="pageSize"?Number(value):value}
 const deleted=params?.getAll("notice").length===1&&params.get("notice")==="store-deleted";
 if(params)for(const key of params.keys()){if(!(key==="notice"&&deleted)&&!["page","pageSize","q","platform","region","applicationType","groupId","attention","status"].includes(key))raw.invalid=true;}
 const parsed=catalogFiltersSchema.safeParse(raw),filters:CatalogFilters=parsed.success?parsed.data:{page:1,pageSize:20};
 const query=useStoreCatalog(filters,parsed.success),data=parsed.success&&!query.isError&&!query.isPending?query.data:undefined,filterIdentity=catalogSearch(filters);
 const [draft,setDraft]=useState<CatalogFilters>(filters),[draftKey,setDraftKey]=useState(filterIdentity),[selected,setSelected]=useState<string[]>([]),[dialog,setDialog]=useState<CatalogDialog|null>(null);
 if(draftKey!==filterIdentity){setDraft(filters);setDraftKey(filterIdentity);setSelected([])}
 const scopeFailed=query.isError && ["PERMISSION_DENIED","STORE_NOT_FOUND","ORGANIZATION_CONTEXT_CHANGED","ORGANIZATION_ACCESS_REVOKED","ORGANIZATION_ACCESS_DENIED","IDENTITY_CONTEXT_CHANGED","AUTHENTICATION_REQUIRED","ORGANIZATION_SUSPENDED"].includes((query.error as {code?:string}|null)?.code??"");
 const missing=(id:string)=>Boolean(data&&!data.items.some(item=>item.id===id));
 if(selected.length&&(scopeFailed||selected.some(missing)))setSelected([]);
 if(dialog && (scopeFailed || "item" in dialog && missing(dialog.item.id) || "items" in dialog && dialog.items.some(item=>missing(item.id))))setDialog(null);
 const canWrite=canUpdateWorkbenchStore(context.permissions),canCreate=canCreateWorkbenchStore(context.permissions);
 const readiness=useStoreReadiness(scope,context.permissions,context.storeObservationsAvailable);
 const update=(next:CatalogFilters)=>router.push(`${pathname}?${catalogSearch(next)}`);
 const reset=()=>{const next={page:1,pageSize:filters.pageSize};setDraft(next);update(next)};
 const retry=async()=>{if(["ORGANIZATION_CONTEXT_CHANGED","ORGANIZATION_ACCESS_REVOKED","ORGANIZATION_ACCESS_DENIED","IDENTITY_CONTEXT_CHANGED"].includes((query.error as {code?:string}|null)?.code??"")){await context.retry();return;}await query.refetch()};
 const changed=async()=>{await queryClient.invalidateQueries({queryKey:["store-catalog",scope.organizationId,scope.userId]});await queryClient.invalidateQueries({queryKey:["workbench",scope.organizationId,"stores"]})};
 // Selection owns IDs only; capture the current catalog snapshot when opening a new intent.
 const selectedItems=data?.items.filter(item=>selected.includes(item.id))??[];
 const check=(item:CatalogItem,on:boolean)=>setSelected(current=>on?[...current.filter(id=>id!==item.id),item.id].slice(0,100):current.filter(id=>id!==item.id));
 const allSelected=Boolean(data?.items.length && data.items.every(item=>selected.includes(item.id))),errorCode=(query.error as {code?:string}|null)?.code,metrics=data?.metrics;
 const [localStatus,setLocalStatus]=useState<"all"|"expiring"|"expired">("all");
 const allItemsLoaded=Boolean(data&&data.items.length===data.pagination.total);
 const expiringCount=allItemsLoaded?data!.items.filter(item=>item.serviceStatus==="active"&&item.serviceExpiresAt&&Date.parse(item.serviceExpiresAt)-Date.now()<=7*86400000&&Date.parse(item.serviceExpiresAt)>Date.now()).length:null;
 const expiredCount=allItemsLoaded?data!.items.filter(item=>item.serviceStatus==="expired"||item.serviceExpiresAt&&Date.parse(item.serviceExpiresAt)<=Date.now()).length:null;
 const metricRows=[
 {label:"已绑定店铺",value:metrics?.total,hint:"当前授权范围",filter:"all",enabled:true},
 {label:"正常店铺",value:metrics?.normal,hint:"连接与服务有效",filter:"normal",enabled:typeof metrics?.normal==="number"},
 {label:"即将到期",value:expiringCount,hint:allItemsLoaded?"未来 7 天":"仅完整列表可统计",filter:"expiring",enabled:allItemsLoaded},
 {label:"已到期",value:expiredCount,hint:allItemsLoaded?"服务期已过":"仅完整列表可统计",filter:"expired",enabled:allItemsLoaded},
 {label:"待处理",value:metrics?.attention,hint:"授权或同步等异常",filter:"attention",enabled:typeof metrics?.attention==="number"}
 ] as const;
 const shownItems=(localStatus==="all"?data?.items:data?.items.filter(item=>localStatus==="expired"?(item.serviceStatus==="expired"||Boolean(item.serviceExpiresAt&&Date.parse(item.serviceExpiresAt)<=Date.now())):item.serviceStatus==="active"&&Boolean(item.serviceExpiresAt&&Date.parse(item.serviceExpiresAt)>Date.now()&&Date.parse(item.serviceExpiresAt)-Date.now()<=7*86400000)))??[];
 const openMetric=(filter:typeof metricRows[number]["filter"])=>{setSelected([]);if(filter==="expiring"||filter==="expired"){setLocalStatus(filter);return;}setLocalStatus("all");update({...filters,page:1,attention:filter==="normal"?"normal":filter==="attention"?"attention":undefined})};

 return <ConsolePage className={styles.page} title="我的店铺" breadcrumbs={findConsoleRoute("/workbench/stores")?.trail} description="统一管理店铺授权、分组与数据同步，让运营更清晰。" actions={canCreate?<Button className={styles.bind} onClick={()=>setDialog({kind:"bind"})}><Plus size={16}/>绑定新店铺</Button>:undefined}>
  <div className={styles.metrics} aria-label="店铺状态概览">{metricRows.map(({label,value,hint,filter,enabled})=><button type="button" className={styles.metric} key={label} disabled={!enabled} aria-pressed={filter===localStatus&&localStatus!=="all"||filter==="normal"&&filters.attention==="normal"||filter==="attention"&&filters.attention==="attention"} onClick={()=>openMetric(filter)}><div><span>{label}</span><strong>{value??"—"} <small>家</small></strong></div><span className={styles.metricNote}>{hint}</span></button>)}</div>
  {deleted?<p role="status">店铺已删除</p>:null}
  <StoreReadinessNotice caps={readiness} permissions={context.permissions}/>
  {metrics && !metrics.complete?<div className={styles.notice} role="status"><AlertTriangle size={16}/><span>{metrics.unknown} 家店铺状态尚未完整确认。授权、同步和库存缺项会显示未知。</span><Button variant="ghost" size="sm" onClick={()=>void query.refetch()}>刷新状态</Button></div>:metrics?.attention?<div className={styles.notice}><AlertTriangle size={16}/><span>有 {metrics.attention} 家店铺需要处理，请查看具体授权或同步原因。</span><Button variant="ghost" size="sm" onClick={()=>update({...filters,page:1,attention:"attention"})}>立即处理</Button></div>:<div className={styles.coverage}><CheckCircle2 size={14}/>{metrics?"当前筛选范围内暂无已确认异常":"正在读取当前店铺状态"}</div>}
  <form className={styles.filters} aria-label="店铺筛选" onSubmit={event=>{event.preventDefault();update({...draft,page:1,q:draft.q?.trim()||undefined})}}>
   <div className={styles.filterCriteria} aria-label="条件筛选">
    <Select aria-label="平台" value={draft.platform??""} onChange={event=>setDraft({...draft,platform:(event.target.value||undefined) as CatalogFilters["platform"]})}><option value="">全部平台</option><option value="shein">SHEIN</option><option value="temu">TEMU</option><option value="tiktokshop">TikTok Shop</option><option value="walmart">Walmart 美国站</option></Select>
    <Select aria-label="站点" value={draft.region??""} onChange={event=>setDraft({...draft,region:event.target.value||undefined})}><option value="">全部站点</option>{data?.facets.regions.map(region=><option key={region} value={region}>{region}</option>)}</Select>
    <Select aria-label="店铺类型" value={draft.applicationType??""} onChange={event=>setDraft({...draft,applicationType:(event.target.value||undefined) as CatalogFilters["applicationType"]})}><option value="">全部类型</option>{draft.applicationType&&!data?.facets.applicationTypes.includes(draft.applicationType)?<option value={draft.applicationType} disabled>{typeLabel(draft.applicationType)}（当前不可用）</option>:null}{data?.facets.applicationTypes.map(type=><option key={type} value={type}>{typeLabel(type)}</option>)}</Select>
    <Select aria-label="分组" value={draft.groupId??""} onChange={event=>setDraft({...draft,groupId:event.target.value||undefined})}><option value="">全部分组</option><option value="ungrouped">未分组</option>{data?.facets.groups.map(group=><option key={group.id} value={group.id}>{group.name}</option>)}</Select>
    <Select aria-label="店铺状态" value={draft.attention??""} onChange={event=>setDraft({...draft,attention:(event.target.value||undefined) as CatalogFilters["attention"]})}><option value="">全部状态</option><option value="normal">正常</option><option value="attention">需要处理</option><option value="unknown">待确认</option></Select>
   </div>
   <div className={styles.filterSearchActions} aria-label="搜索与操作">
    <label className={styles.search}><Search size={16}/><Input type="search" aria-label="搜索店铺" placeholder="输入店铺名称或 ID" value={draft.q??""} onChange={event=>setDraft({...draft,q:event.target.value})}/></label>
    <Button type="button" variant="outline" onClick={reset}>重置</Button>
    <Button type="submit">确认</Button>
   </div>
  </form>
  <div className={styles.listHeading}><div><h2>店铺列表</h2><span>共 {localStatus==="all"?data?.pagination.total??"—":shownItems.length} 家店铺</span></div><div>{canWrite && shownItems.length?<label><input type="checkbox" checked={Boolean(shownItems.length&&shownItems.every(item=>selected.includes(item.id)))} onChange={event=>setSelected(event.target.checked?shownItems.map(item=>item.id):[])}/>选择本页</label>:null}<Button variant="outline" size="sm" disabled={!data} onClick={()=>setDialog({kind:"groups"})}><FolderPlus size={14}/>分组管理</Button></div></div>
  {selected.length?<div className={styles.bulk}><span>已选择 {selected.length} 家店铺</span><Button size="sm" variant="outline" disabled={selectedItems.length!==selected.length} onClick={()=>setDialog({kind:"assign",items:selectedItems})}>加入分组</Button><Button size="sm" variant="outline" disabled={selectedItems.length!==selected.length||selectedItems.some(item=>item.serviceStatus!=="active"||item.connectionStatus!=="connected")} onClick={()=>setDialog({kind:"syncBatch",items:selectedItems})}>批量同步</Button><button onClick={()=>setSelected([])}>取消选择</button></div>:null}
  {!parsed.success?<ConsoleState kind="error" title="筛选参数无效"><Button onClick={reset} variant="outline">重置筛选</Button></ConsoleState>:query.isPending?<ConsoleState kind="loading" title="正在加载店铺…"/>:query.isError?<ConsoleState kind="error" title={errorCode==="CATALOG_SUMMARY_UNAVAILABLE"?"当前摘要不足，无法完整应用此状态或类型筛选":errorCode==="PERMISSION_DENIED"?"没有查看当前企业店铺的权限":errorCode?.startsWith("ORGANIZATION_")?"当前企业访问已不可用":"店铺服务暂时不可用"}><p>请刷新重试，或重置筛选查看基础店铺资料。</p><Button onClick={()=>void retry()} variant="outline">重试</Button><Button onClick={reset} variant="ghost">重置筛选</Button></ConsoleState>:!shownItems.length?<ConsoleState kind="empty" title={Object.keys(filters).length>2?"没有符合筛选条件的店铺":"还没有店铺"}><p>绑定官方店铺后，在这里管理授权、分组与同步。</p></ConsoleState>:<ul className={styles.list} aria-label="我的店铺列表">{shownItems.map(item=><li key={item.id} className={styles.card}>
   <div className={styles.compactRow}>
     <div className={styles.compactIdentity}>{canWrite?<input aria-label={`选择${item.name}`} type="checkbox" checked={selected.includes(item.id)} onChange={event=>check(item,event.target.checked)}/>:null}<div><h3>{item.name}</h3><p>店铺 ID：{item.externalStoreId||item.id}</p><p>负责人：<ResponsibleName id={item.profile.responsibleMemberId} scope={scope}/> · {data.facets.groups.find(group=>group.id===item.profile.groupId)?.name??"未分组"}</p></div></div>
     <div className={styles.compactTags}><span>{item.platform.toUpperCase()}</span><span>{item.region}</span><span>{typeLabel(item.signals.applicationType)}</span></div>
     <div className={styles.compactState}><strong data-tone={item.serviceStatus==="expired"?"expired":item.serviceStatus==="active"?"good":"unknown"}>{item.serviceStatus==="expired"?"服务已到期":item.serviceStatus==="active"?"服务有效":item.serviceStatus==="suspended"?"服务暂停":"服务待核实"}</strong><small>{connectionLabel(item.connectionStatus)} · {item.signals.syncHealthy?"同步正常":syncLabel(item.signals.productSync,item.signals.orderSync)}</small><small>服务期限：{item.serviceExpiresAt?new Date(item.serviceExpiresAt).toLocaleDateString("zh-CN"):"待核实"}</small></div>
     <div className={styles.compactActions}>{item.serviceStatus==="expired"?<Link className={styles.enter} href={`/workbench/stores/${item.id}`}>续费</Link>:null}<Link className={styles.outlineLink} href={`/workbench/stores/${item.id}`}>管理店铺</Link></div>
   </div>
  </li>)}</ul>}
  {data?<div className={styles.pagination}><span>第 {data.pagination.page} 页，共 {data.pagination.total} 家店铺</span><div><Select aria-label="每页店铺数" value={filters.pageSize} onChange={event=>update({...filters,page:1,pageSize:Number(event.target.value)})}>{[10,20,50,100].map(size=><option key={size} value={size}>{size} 条 / 页</option>)}</Select><Button size="sm" variant="outline" aria-label="上一页" disabled={data.pagination.page<=1} onClick={()=>update({...filters,page:filters.page-1})}><ChevronLeft size={14}/></Button><span>{filters.page}</span><Button size="sm" variant="outline" aria-label="下一页" disabled={data.pagination.page*data.pagination.pageSize>=data.pagination.total} onClick={()=>update({...filters,page:filters.page+1})}><ChevronRight size={14}/></Button></div></div>:null}
  {dialog?<StoreCatalogDialogs key={JSON.stringify([dialog.kind,"item"in dialog?dialog.item.id:""])} dialog={dialog} scope={scope} groups={data?.facets.groups??[]} canManageGroups={data?.facets.canManageGroups??false} onClose={()=>setDialog(null)} onChanged={changed}/>:null}
 </ConsolePage>;
}
function Fact({label,value,reason,unknown=0,warning=false}:{label:string;value:number|null;reason:string;unknown?:number;warning?:boolean}){return <div><span>{label}</span><strong data-warning={warning||undefined}>{value??(reason==="threshold_not_set"?"未设置":"未知")}</strong>{reason && reason!=="threshold_not_set"?<small>{unknown>0?`另 ${unknown} 项库存未知`:reason==="inventory_unknown"?"部分库存缺失":reason==="sync_incomplete"?"同步范围未完整":"暂无完整观察"}</small>:null}</div>}
function ResponsibleName({id,scope}:{id:string|null;scope:StoreCenterScope}){
 const context=useWorkbenchContext();const query=useQuery({queryKey:["store-responsible",scope.organizationId,scope.userId,id,context.permissions],queryFn:({signal})=>getMember({expectedUserId:scope.userId,expectedOrganizationId:scope.organizationId,signal},id!),enabled:Boolean(id && context.permissions.includes("workbench.organization_member.read")),retry:false,gcTime:0});
 if(!id)return <>未设置</>;const member=query.data?.items[0];if(member)return <>{member.displayName||id}{member.state!=="active"?"（已不可用）":""}</>;
 return <span title={id}>{(query.error as {status?:number}|null)?.status===404?"成员已不可用":id}</span>;
}
function typeLabel(type:string){return type==="semi_managed"?"半托管":type==="fully_managed"?"全托管":type==="self_operated"?"自运营":"类型未确认"}
function connectionLabel(status:string){return status==="connected"?"授权正常":status==="expired"?"授权已过期":status==="disconnected"?"未授权":"授权待确认"}
function syncLabel(products:string,orders:string){const statuses=[products,orders];return statuses.includes("failed")?"同步失败":statuses.includes("partial")?"部分同步":statuses.includes("suspended")?"同步暂停":statuses.includes("running")||statuses.includes("pending")?"同步中":"同步待确认"}
