"use client";
import {useEffect,useState,type FormEvent} from "react";
import {Building2,Package,Truck,Plus,Search,ShieldCheck,ClipboardList} from "lucide-react";
import css from "./showcase-store-center.module.css";

type Store={id:string;name:string;platform:"SHEIN";region:string;type:string;status:"待授权";createdAt:string;group?:string;owner?:string};
const key="shuomi-store-center-empty-v3";
// Never migrate old showcase fixtures or session drafts into the newly cleared store center.
const obsoleteKeys=["shuomi-store-center-empty-v2","shuomi-store-center-empty-v1"];
// The first three entry descriptions follow Figma's Store Center introduction (1220:359).
// Listing Management is the newer real second-level navigation item and is inserted
// without reworking the approved Vuexy visual tokens or other page layouts.
const areas=[
 {name:"我的店铺",path:"/workbench/stores",icon:Building2,description:"管理店铺授权、平台站点与经营类型，统一查看连接状态及近期商品同步情况。",labels:["授权与管理","授权状态","连接同步"],action:"管理我的店铺"},
 {name:"刊登管理",path:"/workbench/listing",icon:ClipboardList,description:"管理商品刊登资料与流程，依次处理待上传、待补全、待审核和已上传商品。",labels:["刊登准备","资料补全","上传管理"],action:"进入刊登管理"},
 {name:"店铺商品",path:"/workbench/store-products",icon:Package,description:"统一查看店铺已上架商品，核对刊登状态、库存变化及各店商品同步记录。",labels:["商品资产","刊登状态","库存同步"],action:"查看店铺商品"},
 {name:"订单管理",path:"/workbench/store-orders",icon:Truck,description:"集中处理订单待办、采购与收货、装箱发货、物流交接及平台订单记录。",labels:["订单处理","发货进度","物流跟踪"],action:"进入订单管理"},
] as const;
const steps=[
 ["01","绑定并授权店铺","选择平台、站点和店铺类型，完成连接与授权状态确认。"],
 ["02","准备并刊登商品","通过刊登管理完成商品资料上传、补全、审核与发布。"],
 ["03","同步店铺商品","拉取店铺商品及状态，核对刊登信息与库存。"],
 ["04","接收并处理订单","查看订单待办和异常，确认采购、发货及处理要求。"],
 ["05","完成发货履约","同步物流与发货状态，跟踪交付进度及异常。"],
] as const;
const collaboration=[
 {title:"我的店铺",detail:"授权与连接状态管理"},
 {title:"刊登管理",detail:"商品资料准备、审核及上传"},
 {title:"店铺商品",detail:"刊登状态、库存及数据同步"},
 {title:"订单管理",detail:"待办、采购、发货及物流跟踪"},
] as const;
function read():Store[]{try{for(const old of obsoleteKeys)sessionStorage.removeItem(old);const v=JSON.parse(sessionStorage.getItem(key)||"[]");return Array.isArray(v)?v.filter((x:Store)=>x&&typeof x.id==="string"&&typeof x.name==="string"&&x.platform==="SHEIN"&&x.status==="待授权"):[]}catch{return []}}
export function ShowcaseStoreCenter({pathname,navigate}:{pathname:string;navigate:(path:string)=>void}){
 const [stores,setStores]=useState<Store[]>([]);
 useEffect(()=>{setStores(read())},[]);
 const [dialog,setDialog]=useState(false),[name,setName]=useState(""),[region,setRegion]=useState("美国站"),[type,setType]=useState("半托管"),[newGroup,setNewGroup]=useState("未分组"),[newOwner,setNewOwner]=useState("");
 const [authAccount,setAuthAccount]=useState(""),[authPassword,setAuthPassword]=useState(""),[authCode,setAuthCode]=useState(""),[showPassword,setShowPassword]=useState(false),[fixedIp,setFixedIp]=useState(false),[codeNotice,setCodeNotice]=useState(""),[manageId,setManageId]=useState<string|null>(null),[moreId,setMoreId]=useState<string|null>(null),[groupRename,setGroupRename]=useState<string|null>(null),[groupRenameValue,setGroupRenameValue]=useState("");
 const [query,setQuery]=useState(""),[search,setSearch]=useState(""),[notice,setNotice]=useState("");
 const [editing,setEditing]=useState<string|null>(null),[confirmDelete,setConfirmDelete]=useState<string|null>(null);
 const [inspecting,setInspecting]=useState<string|null>(null),[authorizationHelp,setAuthorizationHelp]=useState(false);
 const [syncing,setSyncing]=useState<string|null>(null),[entered,setEntered]=useState<string|null>(null),[groupsOpen,setGroupsOpen]=useState(false),[groupFilter,setGroupFilter]=useState("全部分组"),[statusFilter,setStatusFilter]=useState("全部状态");
 const [detailTab,setDetailTab]=useState("店铺概览"),[groupName,setGroupName]=useState(""),[groups,setGroups]=useState<string[]>([]),[authorizationMethod,setAuthorizationMethod]=useState("子账户邮箱验证码");
 const [platformFilter,setPlatformFilter]=useState("全部平台"),[regionFilter,setRegionFilter]=useState("全部站点"),[typeFilter,setTypeFilter]=useState("全部类型");
 const [appliedFilters,setAppliedFilters]=useState({platform:"全部平台",region:"全部站点",type:"全部类型",group:"全部分组",status:"全部状态"});
 useEffect(()=>{try{sessionStorage.setItem(key,JSON.stringify(stores))}catch{}},[stores]);
 useEffect(()=>{try{const v=JSON.parse(sessionStorage.getItem(key+"-groups")||"[]");if(Array.isArray(v))setGroups(v.filter((x):x is string=>typeof x==="string"))}catch{}},[]);
 useEffect(()=>{try{sessionStorage.setItem(key+"-groups",JSON.stringify(groups))}catch{}},[groups]);
 useEffect(()=>{setQuery("");setSearch("");setNotice("");setDialog(false);setEditing(null);setConfirmDelete(null);setInspecting(null);setAuthorizationHelp(false);setSyncing(null);setEntered(null);setGroupsOpen(false);setManageId(null);setMoreId(null)},[pathname]);
 useEffect(()=>{if(!dialog&&!editing&&!confirmDelete&&!inspecting&&!authorizationHelp&&!syncing&&!entered&&!groupsOpen&&!manageId&&!moreId)return;const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape"){setDialog(false);setEditing(null);setConfirmDelete(null);setInspecting(null);setAuthorizationHelp(false);setSyncing(null);setEntered(null);setGroupsOpen(false);setManageId(null);setMoreId(null)}};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)},[dialog,editing,confirmDelete,inspecting,authorizationHelp,syncing,entered,groupsOpen,manageId,moreId]);
 const route=pathname==="/workbench/store-center"?"home":pathname==="/workbench/stores"?"stores":pathname==="/workbench/store-products"?"products":"orders";
 const heading=route==="home"?"店铺中心":route==="stores"?"我的店铺":route==="products"?"店铺商品":"订单履约";
 const intro=route==="home"?"围绕店铺授权、商品刊登、商品同步和订单交付形成业务闭环；经营分析与 AI 执行由对应模块负责。":route==="stores"?"绑定并授权店铺后，再同步商品与接收订单。":route==="products"?"商品必须来自实际已授权店铺的同步结果，不展示虚构商品。":"订单必须来自平台真实同步记录，不展示虚构交易或履约结果。";
 const link=(path:string)=>navigate(path+"?preview=1");
 function submitBinding(e:FormEvent){e.preventDefault();if(authorizationMethod==="API 授权（暂未开放）"){setCodeNotice("API 授权尚未开放，无法提交。");return;}if(!name.trim()){setCodeNotice("请先填写自定义名称。");return;}if(manageId){setStores(old=>old.map(x=>x.id===manageId?{...x,name:name.trim(),region,type,group:newGroup,owner:newOwner.trim()}:x));setManageId(null);setAuthPassword("");setAuthCode("");setNotice("已保存店铺资料；授权表单处于演示状态，未验证验证码，店铺仍保持待授权。");}else add(e);}
 function commitFilters(){setSearch(query.trim());setAppliedFilters({platform:platformFilter,region:regionFilter,type:typeFilter,group:groupFilter,status:statusFilter})}
 const detailStore=stores.find(s=>s.id===inspecting);
 const enteredStore=stores.find(s=>s.id===entered);
 const managedStore=stores.find(s=>s.id===manageId);
 function openBinding(id:string|null=null){const item=stores.find(s=>s.id===id);setManageId(id);setDialog(!id);setName(item?.name||"");setRegion(item?.region||"美国站");setType(item?.type||"半托管");setNewGroup(item?.group||"未分组");setNewOwner(item?.owner||"");setAuthorizationMethod("子账户邮箱验证码");setAuthAccount("");setAuthPassword("");setAuthCode("");setShowPassword(false);setFixedIp(false);setCodeNotice("");}
 const list=stores.filter(x=>[x.name,x.id,x.region,x.type].join(" ").toLowerCase().includes(search.toLowerCase())&&(appliedFilters.platform==="全部平台"||x.platform===appliedFilters.platform)&&(appliedFilters.region==="全部站点"||x.region===appliedFilters.region)&&(appliedFilters.type==="全部类型"||x.type===appliedFilters.type)&&(appliedFilters.group==="全部分组"||(x.group||"未分组")===appliedFilters.group)&&(appliedFilters.status==="全部状态"||appliedFilters.status==="待授权"||appliedFilters.status==="需要处理"));
 function resetFilters(){setQuery("");setSearch("");setPlatformFilter("全部平台");setRegionFilter("全部站点");setTypeFilter("全部类型");setGroupFilter("全部分组");setStatusFilter("全部状态");setAppliedFilters({platform:"全部平台",region:"全部站点",type:"全部类型",group:"全部分组",status:"全部状态"})}
 function saveRename(e:FormEvent){e.preventDefault();if(!editing||!name.trim())return;if(stores.some(s=>s.id!==editing&&s.name.trim().toLowerCase()===name.trim().toLowerCase())){setNotice("名称与现有演示店铺重复，请修改后再保存。");return;}setStores(old=>old.map(s=>s.id===editing?{...s,name:name.trim()}:s));setEditing(null);setName("");setNotice("店铺名称已保存在当前浏览器演示会话中。")}
 function deleteDemo(){if(!confirmDelete)return;setStores(old=>old.filter(s=>s.id!==confirmDelete));setConfirmDelete(null);setNotice("本地演示店铺已移除，未操作正式业务数据。")}
 function add(e:FormEvent){e.preventDefault();if(!name.trim())return;if(stores.some(s=>s.name.trim().toLowerCase()===name.trim().toLowerCase())){setNotice("已存在同名演示店铺，请修改名称后重试。");return;}const n:Store={id:"DEMO-"+crypto.randomUUID().slice(0,8).toUpperCase(),name:name.trim(),platform:"SHEIN",region,type,group:newGroup,owner:newOwner.trim(),status:"待授权",createdAt:new Date().toLocaleString("zh-CN")};setStores(old=>[...old,n]);setName("");setDialog(false);setAuthPassword("");setAuthCode("");setNotice("已保存待授权店铺资料。当前仅为交互演示，未发送验证码、未连接 SHEIN，授权状态仍是待授权。")}
 return <main className={css.page} data-store-center-showcase={route}>
  <header className={css.header}><div><span className={css.breadcrumb}>店铺中心{route==="home"?"":" / "+heading}{enteredStore?" / "+enteredStore.name:""}</span><h1>{enteredStore?enteredStore.name:heading}</h1><p>{enteredStore?`SHEIN · ${enteredStore.region} · ${enteredStore.type} · 待授权`:intro}</p></div>{route==="stores"?(enteredStore?<button onClick={()=>setEntered(null)}>返回我的店铺</button>:<button className={css.primary} onClick={()=>openBinding()}><Plus size={16}/>绑定新店铺</button>):route!=="home"?<button onClick={()=>link("/workbench/stores")}>管理我的店铺</button>:null}</header>
  {notice?<div className={css.notice} role="status">{notice}<button onClick={()=>setNotice("")} aria-label="关闭提示">×</button></div>:null}
  {route==="stores"&&enteredStore?<section className={css.detailPage} aria-label="店铺详情页面">
  <nav className={css.detailTabs} aria-label="店铺详情导航">{["店铺概览","授权信息","数据同步","网络环境","店铺设置"].map(tab=><button key={tab} aria-current={detailTab===tab?"page":undefined} className={detailTab===tab?css.activeTab:""} onClick={()=>setDetailTab(tab)}>{tab}</button>)}</nav>
  {detailTab==="店铺概览"?<><section className={css.panel}><header><h2>店铺基础信息</h2><span>用于跨模块筛选、管理与权限关联</span></header><dl className={css.detailList}><div><dt>平台</dt><dd>SHEIN</dd></div><div><dt>站点</dt><dd>{enteredStore.region}</dd></div><div><dt>店铺类型</dt><dd>{enteredStore.type}</dd></div><div><dt>负责人</dt><dd>{enteredStore.owner||"管理员"}</dd></div><div><dt>店铺分组</dt><dd>{enteredStore.group||"未分组"}</dd></div><div><dt>最近同步</dt><dd>尚未授权</dd></div></dl></section><section className={css.panel}><header><h2>经营摘要</h2><span>只有平台完成授权并成功同步后，才展示实际经营指标</span></header><div className={css.metrics}>{["在线商品","近30天订单","近30天销售额","近30天利润","进行中AI任务","待处理事项"].map(label=><article key={label}><span>{label}</span><strong>—</strong></article>)}</div></section><section className={css.panel}><header><h2>正在使用该店铺的 AI 能力</h2></header><p className={css.hint}>当前没有可验证的已启用智能体。授权后可在 AI 工作台关联本店。</p><button onClick={()=>link("/workbench/agents/mine")}>查看我的智能体</button></section></>:
  detailTab==="授权信息"?<section className={css.panel}><header><h2>授权信息</h2><span>本地演示店铺 · 待授权</span></header><dl className={css.detailList}><div><dt>平台</dt><dd>SHEIN</dd></div><div><dt>授权状态</dt><dd>待授权</dd></div><div><dt>授权方式</dt><dd>尚未完成</dd></div><div><dt>有效期</dt><dd>—</dd></div></dl><p className={css.hint}>正式平台授权未接通，不会展示模拟的成功状态。</p><button className={css.primary} onClick={()=>openBinding(enteredStore.id)}>重新授权</button></section>:
  detailTab==="数据同步"?<section className={css.panel}><header><h2>数据同步</h2><span>商品与订单同步结果</span></header><dl className={css.detailList}><div><dt>最近同步</dt><dd>尚未授权</dd></div><div><dt>商品同步</dt><dd>未开始</dd></div><div><dt>订单同步</dt><dd>未开始</dd></div></dl><button className={css.primary} onClick={()=>setSyncing(enteredStore.id)}>立即同步</button><button onClick={()=>link("/workbench/store-products")}>查看店铺商品</button><button onClick={()=>link("/workbench/store-orders")}>查看订单履约</button></section>:
  detailTab==="网络环境"?<section className={css.panel}><header><h2>网络环境</h2><span>授权网络出口及连接检测</span></header><dl className={css.detailList}><div><dt>固定IP状态</dt><dd>未配置</dd></div><div><dt>公网 IP</dt><dd>待检测</dd></div><div><dt>连接状态</dt><dd>未检测</dd></div></dl><p className={css.hint}>展示站未接入网络出口检测，不能生成虚构的 IP 信息。</p><button onClick={()=>openBinding(enteredStore.id)}>配置授权网络</button></section>:
  <section className={css.panel}><header><h2>店铺设置</h2><span>修改后立即保存至当前浏览器的演示会话</span></header><form className={css.detailSettings} onSubmit={e=>{e.preventDefault();setNotice("店铺设置已保存至本地演示会话。")}}><label>店铺分组<select aria-label="店铺所属分组" value={enteredStore.group||"未分组"} onChange={e=>setStores(old=>old.map(x=>x.id===enteredStore.id?{...x,group:e.target.value}:x))}><option>未分组</option>{groups.map(g=><option key={g}>{g}</option>)}</select></label><label>负责人<input aria-label="店铺负责人" value={enteredStore.owner||""} onChange={e=>setStores(old=>old.map(x=>x.id===enteredStore.id?{...x,owner:e.target.value}:x))} placeholder="未分配"/></label><footer><button type="button" onClick={()=>{setName(enteredStore.name);setEditing(enteredStore.id)}}>修改自定义名称</button><button type="button" onClick={()=>setGroupsOpen(true)}>管理分组</button><button className={css.primary} type="submit">保存设置</button></footer></form></section>}
 </section>:route==="home"?<>
   <section className={css.homeIntro} aria-label="店铺中心介绍">
    <p className={css.eyebrow}>店铺中心</p>
    <h2>统一管理店铺、刊登、商品与订单，让经营链路更清晰</h2>
    <p>围绕店铺授权、商品资料刊登、商品同步和订单交付形成业务闭环，经营分析及 AI 执行由对应模块负责。</p>
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
     <p>店铺授权 · 商品刊登 · 商品同步 · 订单履约</p>
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
   <section className={css.metrics} aria-label="店铺经营概览">{[["店铺总数",stores.length,"当前店铺资产"],["正常店铺",0,"已授权且同步正常"],["需要处理",stores.length,"等待平台授权"]].map(([title,val,subtitle])=><article key={title} className={css.metricCard}><strong>{val}</strong><div><span>{title}</span><small>{subtitle}</small></div></article>)}</section>
   {stores.length>0?<section className={css.attention}><span>有 {stores.length} 家店铺需要处理：尚未完成 SHEIN 官方授权。</span><button onClick={()=>{resetFilters();setStatusFilter("需要处理");setAppliedFilters(f=>({...f,status:"需要处理"}))}}>立即处理</button></section>:null}
   <form className={css.filters} onSubmit={e=>{e.preventDefault();commitFilters()}}><label><Search size={16}/><input aria-label="搜索店铺" value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索店铺名称或 ID"/></label><select aria-label="平台筛选" value={platformFilter} onChange={e=>setPlatformFilter(e.target.value)}><option>全部平台</option><option>SHEIN</option></select><select aria-label="站点筛选" value={regionFilter} onChange={e=>setRegionFilter(e.target.value)}><option>全部站点</option><option>美国站</option><option>加拿大站</option><option>其他站点</option></select><select aria-label="店铺类型筛选" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}><option>全部类型</option><option>半托管</option><option>全托管</option><option>自营</option></select><select aria-label="店铺状态筛选" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option>全部状态</option><option>正常</option><option>需要处理</option><option>待授权</option></select><select aria-label="店铺分组筛选" value={groupFilter} onChange={e=>setGroupFilter(e.target.value)}><option>全部分组</option><option>未分组</option>{groups.map(g=><option key={g}>{g}</option>)}</select><button type="button" onClick={resetFilters}>重置</button><button className={css.primary} type="submit">确认</button></form>
   <section className={css.panel}><header><h2>店铺列表</h2><span>共 {list.length} 家 · 当前开放平台：SHEIN</span><button onClick={()=>setGroupsOpen(true)}>管理分组</button></header>{list.length?<div className={css.storeList}>{list.map(s=><article className={css.storeCard} key={s.id}><div className={css.storeTop}><div className={css.storeIdentity}><span className={css.storeAvatar}>S</span><div><strong>{s.name}</strong><small>店铺 ID：{s.id}</small></div></div><div className={css.storeTags}><span>SHEIN</span><span>{s.region}</span><span>{s.type}</span><span>{s.group||"未分组"}</span></div><div className={css.storeStatus}><span>待授权</span><span>同步待确认</span></div></div><div className={css.storeFacts}><div><small>在线商品</small><strong>—</strong></div><div><small>待处理订单</small><strong>—</strong></div><div><small>库存预警</small><strong>—</strong></div><div><small>负责人</small><strong>{s.owner||"未分配"}</strong></div></div><footer className={css.storeBottom}><span>最近同步：尚未授权</span><div className={css.storeButtons}><button onClick={()=>openBinding(s.id)}>管理</button><button onClick={()=>setSyncing(s.id)}>立即同步</button><button className={css.primary} onClick={()=>setEntered(s.id)}>进入店铺</button><button aria-label={"更多操作 · "+s.name} onClick={()=>setMoreId(s.id)}>···</button></div></footer>{moreId===s.id?<div className={css.morePopover} role="menu" aria-label="店铺操作">
 <button role="menuitem" onClick={()=>{setName(s.name);setEditing(s.id);setMoreId(null)}}>修改自定义名称</button>
 <button role="menuitem" onClick={()=>{setEntered(s.id);setDetailTab("店铺设置");setMoreId(null)}}>调整负责人</button>
 <button role="menuitem" onClick={()=>{setEntered(s.id);setDetailTab("店铺设置");setMoreId(null)}}>调整分组</button>
 <button role="menuitem" onClick={()=>{setMoreId(null);openBinding(s.id)}}>重新授权</button>
 <button role="menuitem" className={css.danger} onClick={()=>{setConfirmDelete(s.id);setMoreId(null)}}>解绑店铺</button>
 </div>:null}</article>)}</div>:<div className={css.empty}><Building2 size={34}/><h3>{stores.length?"没有符合条件的店铺":"尚未绑定店铺"}</h3><p>{stores.length?"请调整筛选条件。":"当前没有店铺。绑定后需完成真实平台授权，才能同步商品和订单。"}</p><button className={css.primary} onClick={()=>stores.length?resetFilters():openBinding()}>{stores.length?"清空筛选":"绑定新店铺"}</button></div>}</section>
  </>:<>
   <section className={css.metrics}>{(route==="products"?[["已同步商品",0],["待处理",0],["同步异常",0],["已关联店铺",0]]:[["订单总数",0],["待处理订单",0],["发货中",0],["履约异常",0]]).map(([title,val])=><article key={title}><span>{title}</span><strong>{val}</strong></article>)}</section>
   <section className={css.panel}><header><h2>{route==="products"?"店铺商品列表":"平台订单记录"}</h2><span>共 0 条</span></header><div className={css.empty}>{route==="products"?<Package size={34}/>:<Truck size={34}/>}<h3>{route==="products"?"暂无已同步商品":"暂无平台订单"}</h3><p>{route==="products"?"店铺授权后才能同步真实商品；目前没有商品记录。":"绑定并授权店铺、同步业务数据后，订单才会出现在这里。没有订单时不显示虚构履约进度。"}</p><button className={css.primary} onClick={()=>link("/workbench/stores")}>前往我的店铺</button></div></section>
  </>}
  <p className={css.disclaimer}>展示页已清除旧版演示店铺和关联的虚构统计；本页不会删除正式业务系统中的店铺、商品、订单及授权。</p>
  {groupsOpen?<div className={css.backdrop+" "+css.groupBackdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setGroupsOpen(false)}}><section className={css.dialog} role="dialog" aria-modal="true" aria-label="管理分组"><header><div><h2>管理分组</h2><p>与 Figma 一致：新建分组、查看分组内店铺、移除空分组。仅保存到本地演示会话。</p></div><button aria-label="关闭弹窗" onClick={()=>setGroupsOpen(false)}>×</button></header><form onSubmit={e=>{e.preventDefault();const v=groupName.trim();if(!v||groups.includes(v))return;setGroups(old=>[...old,v]);setGroupName("");setNewGroup(v);setNotice("分组已创建，可在绑定和管理店铺时选择。")}}><label>新建分组<input aria-label="分组名称" maxLength={40} value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="输入分组名称"/></label><button className={css.primary} type="submit" disabled={!groupName.trim()||groups.includes(groupName.trim())}>创建分组</button></form><div className={css.groupList}>{["未分组",...groups].map(g=><div key={g}><strong>{g}</strong><span>{stores.filter(x=>(x.group||"未分组")===g).length} 家店铺</span>{g!=="未分组"?<button type="button" onClick={()=>{setGroupRename(g);setGroupRenameValue(g)}}>重命名</button>:null}{g!=="未分组"?<button onClick={()=>{setStores(old=>old.map(x=>x.group===g?{...x,group:"未分组"}:x));setGroups(old=>old.filter(x=>x!==g));if(groupFilter===g)resetFilters();setNotice("已移除分组，原店铺自动转入未分组，未解绑店铺。")}}>删除</button>:null}</div>)}</div><footer className={css.dialogActions}><button className={css.primary} onClick={()=>setGroupsOpen(false)}>完成</button></footer></section></div>:null}

  {groupRename?<div className={css.backdrop+" "+css.groupBackdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setGroupRename(null)}}><section className={css.dialog} role="dialog" aria-modal="true" aria-label="重命名分组"><header><h2>重命名分组</h2><button aria-label="关闭弹窗" onClick={()=>setGroupRename(null)}>×</button></header><form onSubmit={e=>{e.preventDefault();const v=groupRenameValue.trim();if(!v||groups.some(x=>x===v&&x!==groupRename))return;setGroups(old=>old.map(x=>x===groupRename?v:x));setStores(old=>old.map(x=>x.group===groupRename?{...x,group:v}:x));setGroupFilter(x=>x===groupRename?v:x);setGroupRename(null);setNotice("分组及组内店铺归属已更新。")}}><label>分组名称<input aria-label="重命名分组名称" value={groupRenameValue} onChange={e=>setGroupRenameValue(e.target.value)} required/></label><footer className={css.dialogActions}><button type="button" onClick={()=>setGroupRename(null)}>取消</button><button className={css.primary} type="submit">保存修改</button></footer></form></section></div>:null}
  {syncing?<div className={css.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setSyncing(null)}}><section className={css.dialog} role="dialog" aria-modal="true" aria-label="立即同步"><header><div><h2>立即同步</h2><p>必须先完成官方授权，并确认企业及店铺权限。</p></div><button aria-label="关闭弹窗" onClick={()=>setSyncing(null)}>×</button></header><p className={css.hint}>当前店铺尚未授权，不能同步商品或订单。展示版不会伪造成功结果。</p><footer className={css.dialogActions}><button onClick={()=>setSyncing(null)}>取消</button><button className={css.primary} onClick={()=>{setSyncing(null);setAuthorizationHelp(true)}}>查看授权要求</button></footer></section></div>:null}
  {detailStore?<div className={css.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setInspecting(null)}}><section className={css.dialog+" "+css.wideDialog} role="dialog" aria-modal="true" aria-label="店铺详情"><header><div><h2>{detailStore.name} · 店铺详情</h2><p>SHEIN · {detailStore.region} · {detailStore.type} · 待授权（本地演示资料）</p></div><button aria-label="关闭弹窗" onClick={()=>setInspecting(null)}>×</button></header>
  <nav className={css.detailTabs} aria-label="店铺详情导航">{["店铺概览","授权信息","数据同步","网络环境","店铺设置"].map(tab=><button key={tab} className={detailTab===tab?css.activeTab:""} aria-current={detailTab===tab?"page":undefined} onClick={()=>setDetailTab(tab)}>{tab}</button>)}</nav>
  {detailTab==="店铺概览"?<><dl className={css.detailList}><div><dt>店铺名称</dt><dd>{detailStore.name}</dd></div><div><dt>店铺编号</dt><dd>{detailStore.id}</dd></div><div><dt>平台与站点</dt><dd>{detailStore.platform} · {detailStore.region}</dd></div><div><dt>经营类型</dt><dd>{detailStore.type}</dd></div><div><dt>店铺分组</dt><dd>{detailStore.group||"未分组"}</dd></div><div><dt>负责人</dt><dd>{detailStore.owner||"未分配"}</dd></div><div><dt>创建时间</dt><dd>{detailStore.createdAt}</dd></div></dl><p className={css.hint}>商品、订单、库存统计需真实平台授权与同步后才能展示。</p></>:
  detailTab==="授权信息"?<><dl className={css.detailList}><div><dt>平台</dt><dd>SHEIN</dd></div><div><dt>授权状态</dt><dd>待授权</dd></div><div><dt>授权方式</dt><dd>尚未完成</dd></div><div><dt>授权有效期</dt><dd>—</dd></div></dl><p className={css.hint}>本地演示不能执行官方授权，也不会显示伪造的授权成功状态。</p><button onClick={()=>{setInspecting(null);setAuthorizationHelp(true)}}>查看授权方式</button></>:
  detailTab==="数据同步"?<><dl className={css.detailList}><div><dt>最近同步</dt><dd>尚未授权</dd></div><div><dt>商品同步</dt><dd>未开始</dd></div><div><dt>订单同步</dt><dd>未开始</dd></div></dl><button onClick={()=>{setInspecting(null);setSyncing(detailStore.id)}}>立即同步</button></>:
  detailTab==="网络环境"?<><dl className={css.detailList}><div><dt>网络环境</dt><dd>未检测</dd></div><div><dt>公网 IP</dt><dd>未获取</dd></div><div><dt>连接检测</dt><dd>需要正式服务支持</dd></div></dl><p className={css.hint}>未接入真实网络检测前，不展示模拟 IP 或“网络正常”状态。</p></>:
  <form onSubmit={e=>{e.preventDefault();setNotice("店铺设置已保存至当前浏览器演示会话。");setInspecting(null)}}><label>店铺分组<select aria-label="店铺所属分组" value={detailStore.group||"未分组"} onChange={e=>setStores(old=>old.map(x=>x.id===detailStore.id?{...x,group:e.target.value}:x))}><option>未分组</option>{groups.map(g=><option key={g}>{g}</option>)}</select></label><label>负责人<input aria-label="店铺负责人" maxLength={60} value={detailStore.owner||""} onChange={e=>setStores(old=>old.map(x=>x.id===detailStore.id?{...x,owner:e.target.value}:x))} placeholder="可留空"/></label><footer><button type="button" onClick={()=>{setEditing(detailStore.id);setName(detailStore.name);setInspecting(null)}}>修改名称</button><button className={css.primary} type="submit">保存设置</button></footer></form>}
  <footer className={css.dialogActions}><button onClick={()=>{setEditing(detailStore.id);setName(detailStore.name);setInspecting(null)}}>修改名称</button><button className={css.primary} onClick={()=>setInspecting(null)}>返回我的店铺</button></footer></section></div>:null}
    {authorizationHelp?<div className={css.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setAuthorizationHelp(false)}}><section className={css.dialog} role="dialog" aria-modal="true" aria-label="店铺授权说明"><header><div><h2>店铺授权说明</h2><p>先完成官方平台授权，才可以进行后续同步和履约。</p></div><button aria-label="关闭弹窗" onClick={()=>setAuthorizationHelp(false)}>×</button></header><div className={css.authorizationChoices}><label>授权方式<select aria-label="授权方式" value={authorizationMethod} onChange={e=>setAuthorizationMethod(e.target.value)}><option>子账户邮箱验证码</option><option>子账户手机验证码</option><option>API 授权（暂未开放）</option></select></label><p>{authorizationMethod==="API 授权（暂未开放）"?"当前原型标记 API 授权暂未开放。":authorizationMethod==="子账户邮箱验证码"?"使用已绑定的 SHEIN 子账户邮箱接收验证码，需在官方授权服务中验证。":"使用已绑定的 SHEIN 子账户手机号接收验证码，需在官方授权服务中验证。"}</p></div><ol className={css.helpSteps}><li>确认平台、站点与子账户身份。</li><li>在正式授权入口完成邮箱或手机验证。</li><li>授权成功后再执行商品及订单同步。</li></ol><p className={css.hint}>当前展示站没有 OAuth 接入能力，点击此处不会模拟已授权，也不会产生虚假商品或订单。</p><footer className={css.dialogActions}><button onClick={()=>setAuthorizationHelp(false)}>我知道了</button></footer></section></div>:null}
  {editing?<div className={css.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setEditing(null)}}><section className={css.dialog} role="dialog" aria-modal="true" aria-label="管理店铺名称"><header><div><h2>管理店铺名称</h2><p>只修改本地演示资料，不影响平台店铺。</p></div><button aria-label="关闭弹窗" onClick={()=>setEditing(null)}>×</button></header><form onSubmit={saveRename}><label>店铺名称<input required maxLength={80} autoFocus value={name} onChange={e=>setName(e.target.value)}/></label><footer><button type="button" onClick={()=>setEditing(null)}>取消</button><button className={css.primary} type="submit">保存修改</button></footer></form></section></div>:null}
  {confirmDelete?<div className={css.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setConfirmDelete(null)}}><section className={css.dialog} role="alertdialog" aria-modal="true" aria-label="确认移除演示店铺"><header><div><h2>移除演示店铺</h2><p>确认移除这条浏览器演示记录？不涉及正式平台授权、商品或订单。</p></div><button aria-label="关闭弹窗" onClick={()=>setConfirmDelete(null)}>×</button></header><footer className={css.dialogActions}><button onClick={()=>setConfirmDelete(null)}>取消</button><button className={css.primary} onClick={deleteDemo}>确认移除</button></footer></section></div>:null}

  {(dialog||managedStore)?<div className={css.backdrop} onMouseDown={e=>{if(e.target===e.currentTarget){setDialog(false);setManageId(null);setAuthPassword("");setAuthCode("")}}}><section className={css.dialog+" "+css.authDialog} role="dialog" aria-modal="true" aria-label={managedStore?"管理店铺":"绑定新店铺"}><header><div><h2>{managedStore?"管理店铺":"绑定新店铺"}</h2><p>按 Figma 原型填写平台、负责人、分组及授权信息。</p></div><button aria-label="关闭弹窗" onClick={()=>{setDialog(false);setManageId(null);setAuthPassword("");setAuthCode("")}}>×</button></header>
  <form onSubmit={submitBinding}>
    <div className={css.bindingGrid}>
      <label>平台<select aria-label="平台" value="SHEIN" disabled><option>SHEIN</option></select></label>
      <label>站点<select aria-label="站点" value={region} onChange={e=>setRegion(e.target.value)}><option>美国站</option><option>加拿大站</option><option>其他站点</option></select></label>
      <label>店铺类型<select aria-label="店铺类型" value={type} onChange={e=>setType(e.target.value)}><option>半托管</option><option>全托管</option><option>自营</option></select></label>
      <label>自定义名称<input aria-label="自定义名称" required maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="请输入店铺自定义名称"/><small>仅在系统内显示，不影响平台店铺原名。</small></label>
      <label>负责人<select aria-label="负责人" value={newOwner} onChange={e=>setNewOwner(e.target.value)}><option value="">管理员（默认）</option><option>管理员</option></select><small>用于任务分配和日常协作。</small></label>
      <label>店铺分组<select aria-label="绑定店铺分组" value={newGroup} onChange={e=>setNewGroup(e.target.value)}><option>未分组</option>{groups.map(g=><option key={g}>{g}</option>)}</select><small>便于分类筛选。<button type="button" className={css.inlineLink} onClick={()=>{setGroupsOpen(true);setGroupName("")}}>＋ 新建分组</button></small></label>
    </div>
    <div className={css.authSection}><strong>选择授权方式</strong><div className={css.authOptions}><button type="button" className={authorizationMethod!=="API 授权（暂未开放）"?css.authSelected:""} onClick={()=>setAuthorizationMethod("子账户邮箱验证码")} aria-pressed={authorizationMethod!=="API 授权（暂未开放）"}><b>子账户授权</b><small>填写平台子账户信息完成验证</small></button><button type="button" className={authorizationMethod==="API 授权（暂未开放）"?css.authSelected:""} onClick={()=>setAuthorizationMethod("API 授权（暂未开放）")} aria-pressed={authorizationMethod==="API 授权（暂未开放）"}><b>API 授权</b><small>适用于接口密钥授权 · 暂未开放</small></button></div>
    {authorizationMethod==="API 授权（暂未开放）"?<p className={css.hint}>API 授权暂未开放，请选择子账户授权。此处不会创建授权或访问令牌。</p>:<>
    <label>子账户账号<input aria-label="子账户账号" autoComplete="off" value={authAccount} onChange={e=>setAuthAccount(e.target.value)} placeholder="请输入子账户账号"/></label>
    <label>子账户密码<div className={css.passwordField}><input aria-label="子账户密码" autoComplete="new-password" type={showPassword?"text":"password"} value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="请输入子账户密码"/><button type="button" onClick={()=>setShowPassword(x=>!x)}>{showPassword?"隐藏":"显示"}</button></div></label>
    <div className={css.verification}><strong>验证码接收方式</strong><div className={css.codeModes}><button type="button" aria-pressed={authorizationMethod==="子账户邮箱验证码"} onClick={()=>setAuthorizationMethod("子账户邮箱验证码")}>邮箱验证码</button><button type="button" aria-pressed={authorizationMethod==="子账户手机验证码"} onClick={()=>setAuthorizationMethod("子账户手机验证码")}>手机验证码</button></div><small>验证码将发送至该子账户绑定{authorizationMethod==="子账户邮箱验证码"?"邮箱":"手机号"}（正式授权时）</small></div>
    <label>验证码<div className={css.passwordField}><input aria-label="验证码" autoComplete="one-time-code" value={authCode} onChange={e=>setAuthCode(e.target.value)} placeholder="请输入验证码"/><button type="button" onClick={()=>setCodeNotice("当前为演示展示，尚未接通 SHEIN 官方验证码发送服务，未发送验证码。")}>接收验证码</button></div></label>
    <p className={css.hint}>账户凭据仅用于正式平台授权验证。本展示站不会发送凭据，也不会持久化密码或验证码。</p></>}</div>
    <div className={css.fixedIp}><div><strong>启用固定IP</strong><p>通过指定网络出口发起授权，减少异地登录或平台风控；仅在需要固定网络环境时启用。</p></div><label className={css.toggleLabel}><input type="checkbox" aria-label="启用固定IP" checked={fixedIp} onChange={e=>setFixedIp(e.target.checked)}/><span>{fixedIp?"已启用（仅演示）":"未启用"}</span></label></div>
    {fixedIp?<p className={css.hint}>正式固定 IP 需要配置可用的代理网络出口；演示页面不会伪造 IP 或验证结果。</p>:null}
    {codeNotice?<p className={css.warning} role="status">{codeNotice}</p>:null}
    <footer className={css.dialogActions}><button type="button" onClick={()=>{setDialog(false);setManageId(null);setAuthPassword("");setAuthCode("")}}>取消</button><button className={css.primary} type="submit" disabled={authorizationMethod==="API 授权（暂未开放）"}>{managedStore?"保存修改":"提交授权"}</button></footer>
  </form></section></div>:null}

 </main>
}
