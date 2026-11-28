"use client";

import { Eye, MousePointerClick, ArrowRight, Search, ShoppingCart, Store, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./cockpit-preview.module.css";
import { SeamlessEarthGlobe } from "./seamless-earth-globe";
import {useDemoStoreBindings,demoStoreServiceActive} from "../store-binding-demo";
import {getDemoMembership} from "../../../../showcase/demo-identity";
import {readDemoOrders} from "../stores/showcase-order-demo";

type StoreSummary={id:string;name:string;platform:string;site:string;type:string;impressions:string;clicks:string;status:string;issue?:string};

export function CockpitPreview({organizationId="SM-ENT-000001",memberId="admin"}:{organizationId?:string;memberId?:string}={}) {
  const administrator=memberId==="admin"||getDemoMembership({organizationId,memberId})?.role==="管理员";
  const bindings=useDemoStoreBindings(organizationId,memberId,administrator);
  const stores:StoreSummary[]=bindings.visible.filter(s=>Boolean(s.platformStoreId)).map(s=>({id:s.id,name:s.name,platform:s.platform,site:s.region,type:s.type,impressions:"—",clicks:"—",status:s.connectionIssue||!demoStoreServiceActive(s)?"需关注":"数据待接入",issue:s.connectionIssue??(!demoStoreServiceActive(s)?"店铺服务期已到期":undefined)}));
  const router = useRouter();
  const emptyFilters = { platform: "全部平台", site: "全部站点", type: "全部店铺类型", time: "全部时间", search: "" };
  const [filters, setFilters] = useState(emptyFilters);
  const [activeFilters, setActiveFilters] = useState(emptyFilters);
  const [tablePage, setTablePage] = useState(1);
  const [detailStoreId,setDetailStoreId]=useState<string|null>(null);
  const visibleStores = stores.filter(store => {
    const query = activeFilters.search.trim().toLocaleLowerCase();
    return (activeFilters.platform === "全部平台" || store.platform === activeFilters.platform)
      && (activeFilters.site === "全部站点" || store.site === activeFilters.site)
      && (activeFilters.type === "全部店铺类型" || store.type === activeFilters.type)
      && (!query || [store.name, store.platform, store.site, store.type].some(value => value.toLocaleLowerCase().includes(query)));
  });
  const [ordersRevision,setOrdersRevision]=useState(0);
  useEffect(()=>{
    const refresh=()=>setOrdersRevision(v=>v+1);
    window.addEventListener("focus",refresh);window.addEventListener("pageshow",refresh);window.addEventListener("storage",refresh);
    return()=>{window.removeEventListener("focus",refresh);window.removeEventListener("pageshow",refresh);window.removeEventListener("storage",refresh)};
  },[]);
  const demoOrders=useMemo(()=>readDemoOrders(organizationId,bindings.visible),[organizationId,bindings.visible,ordersRevision]);
  const timeStart=activeFilters.time==="最近7天"?Date.now()-7*86400000:activeFilters.time==="最近30天"?Date.now()-30*86400000:null;
  const visibleIds=new Set(visibleStores.map(store=>store.id));
  const scopedOrders=demoOrders.filter(order=>visibleIds.has(order.storeId)&&(timeStart===null||(Number.isFinite(Date.parse(order.created))&&Date.parse(order.created)>=timeStart)));
  const ordersByStore=new Map<string,number>();
  for(const order of scopedOrders)ordersByStore.set(order.storeId,(ordersByStore.get(order.storeId)??0)+1);
  const connectionIssues=visibleStores.filter(store=>store.issue);
  const scopeLabel=activeFilters.time;
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(visibleStores.length / pageSize));
  const currentPage=Math.min(tablePage,pageCount);
  const pageStores = visibleStores.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const detailStore=visibleStores.find(item=>item.id===detailStoreId);
  const detailDemoOrders=detailStore?ordersByStore.get(detailStore.id)??0:0;
  const updateFilter = (key: keyof typeof emptyFilters, value: string) => setFilters(current => ({ ...current, [key]: value }));
  const resetFilters = () => { setFilters(emptyFilters); setActiveFilters(emptyFilters); setTablePage(1); };

  return <section className={styles.page} data-dashboard="operations">
    <section className={styles.metrics} aria-label="经营指标">
      <article className={`${styles.featureMetric} ${styles.overviewFeature}`} data-tone="blue">
        <div className={styles.overviewMain}>
          <div className={styles.heroCopy}>
            <div className={styles.heroEyebrow}><span className={styles.heroPulse} aria-hidden="true" />运营总览 <span className={styles.heroEnglish}>OPERATIONS OVERVIEW</span></div>
            <h1>经营全局 · 一屏掌握</h1>
            <p className={styles.heroIntro}>按平台、站点及时间范围查看经营指标、演示订单和店铺连接情况。</p>
            <div className={styles.heroScope}>当前：{visibleStores.length} 家店铺 <i aria-hidden="true" /> {scopeLabel} <i aria-hidden="true" /> GMV / 曝光 / 点击待接入</div>
            <div className={styles.heroHighlights} aria-label="经营总览能力"><span>多店经营指标</span><span>店铺连接提醒</span><span>订单与流量分析</span></div>
          </div>
          <div className={styles.overviewAside}>
            <div className={styles.overviewGlobe} aria-hidden="true">
              <SeamlessEarthGlobe />
            </div>
          </div>
        </div>
      </article>
    </section>
    <div className={styles.overviewFilters}>
      <div className={styles.filterSelects}>
        <select aria-label="平台" value={filters.platform} onChange={event => setFilters(current=>({...current,platform:event.target.value,site:"全部站点",type:"全部店铺类型"}))}><option>全部平台</option>{[...new Set(stores.map(s=>s.platform))].map(x=><option key={x}>{x}</option>)}</select>
        <select aria-label="站点" value={filters.site} onChange={event => setFilters(current=>({...current,site:event.target.value,type:"全部店铺类型"}))}><option>全部站点</option>{[...new Set(stores.filter(s=>filters.platform==="全部平台"||s.platform===filters.platform).map(s=>s.site))].map(x=><option key={x}>{x}</option>)}</select>
        <select aria-label="店铺类型" value={filters.type} onChange={event => updateFilter("type", event.target.value)}><option>全部店铺类型</option>{[...new Set(stores.filter(s=>(filters.platform==="全部平台"||s.platform===filters.platform)&&(filters.site==="全部站点"||s.site===filters.site)).map(s=>s.type))].map(x=><option key={x}>{x}</option>)}</select>
        <select aria-label="时间" value={filters.time} onChange={event => updateFilter("time", event.target.value)}><option>全部时间</option><option>最近7天</option><option>最近30天</option></select>
      </div>
      <div className={styles.filterActions}>
        <label className={styles.search}>
          <span className={styles.visuallyHidden}>搜索店铺</span>
          <Search size={15} aria-hidden="true" />
          <input value={filters.search} onChange={event => updateFilter("search", event.target.value)} placeholder="搜索店铺" aria-label="搜索店铺" />
        </label>
        <button type="button" onClick={resetFilters}>重置</button>
        <button type="button" onClick={() => { setActiveFilters(filters); setTablePage(1); }}>确认</button>
      </div>
    </div>

    <section className={styles.digestRow} aria-label="经营表现与支持追踪">
    <section className={styles.metricsDigest} aria-label="核心经营指标">
      <header className={styles.digestHeader}><div><h2>经营表现</h2><span>核心指标 · {scopeLabel} · 按当前筛选汇总</span></div><button type="button" onClick={()=>router.push("/workbench/overview/stores")}>店铺详情</button></header>
      <div className={styles.digestMain}>
        <div className={styles.digestLead}><span>总 GMV</span><div><strong>—</strong><small>平台成交金额待接入</small></div><p>{visibleStores.length} 家店铺 · {scopeLabel} · 经营目标见目标管理</p></div>
        <div className={styles.digestNoTrend} role="status"><strong>经营趋势待接入</strong><span>暂未获得平台按日期返回的 GMV，不展示推测走势</span></div>
      </div>
      <div className={styles.digestDetails}>
        <article><span className={styles.digestLabel}><ShoppingCart size={15}/>订单量</span><strong>{scopedOrders.length?scopedOrders.length.toLocaleString("zh-CN"):"—"}</strong><small>{scopedOrders.length?"当前范围演示订单 · 非实时平台数据":"平台订单未接入，当前无演示订单"}</small><div className={styles.digestProgress}><i data-tone="purple"/></div></article>
        <article><span className={styles.digestLabel}><Eye size={15}/>曝光量</span><strong>—</strong><small>平台商品曝光统计待接入</small><div className={styles.digestProgress}><i data-tone="cyan"/></div></article>
        <article><span className={styles.digestLabel}><MousePointerClick size={15}/>点击量</span><strong>—</strong><small>平台商品点击统计待接入</small><div className={styles.digestProgress}><i data-tone="red"/></div></article>
      </div>
    </section>
    <article className={styles.supportTracker}>
      <header><h2>店铺连接提醒</h2><button type="button" className={styles.alertLink} onClick={() => router.push("/workbench/store-center")}>检查店铺 <ArrowRight size={13}/></button></header>
      <div className={styles.supportTrackerBody}>
        <div className={styles.supportAlertSummary}>
          <div className={styles.alertCountSummary}><strong>{connectionIssues.length||"—"}</strong><small>项</small><span>店铺连接需关注</span></div>
          <ul>{connectionIssues.length===0?<li>当前筛选没有已记录的店铺连接异常，经营风险评级仍待平台经营数据接入。</li>:null}{connectionIssues.map(item=><li key={item.id} data-tone="amber"><i><TriangleAlert size={16}/></i><span><b>{item.name}</b><small>{item.issue} · 请前往店铺中心检测连接</small></span><em>需关注</em></li>)}</ul>
        </div>
        <div className={styles.supportGauge} role="img" aria-label="经营风险占比暂无真实数据">
          <svg viewBox="0 0 200 200" aria-hidden="true">
            {Array.from({ length: 28 }, (_, index) => {
              const angle = -135 + index * (270 / 27);
              return <line key={index} x1="100" y1="19" x2="100" y2="34" transform={`rotate(${angle} 100 100)`} data-active="false"/>;
            })}
          </svg>
          <span><small>经营风险占比</small><strong>—</strong></span>
        </div>
      </div>
    </article>
    </section>

    <section className={`${styles.panel} ${styles.storeMatrixPanel}`}>
      <header><div><span>店铺矩阵</span><h2>{visibleStores.length} 家店铺 · 订单 / 曝光 / 点击</h2></div><button className={styles.linkButton} onClick={() => router.push("/workbench/stores")}>进入店铺中心 <ArrowRight size={13}/></button></header>
      <div className={styles.matrixTable} role="table" aria-label="店铺经营数据">
        <div className={styles.matrixHead} role="row"><b>店铺</b><b>平台 / 站点</b><b>订单量</b><b>曝光量</b><b>点击量</b><b>连接状态</b><b>操作</b></div>
        {pageStores.map(row=>{
          const demoOrderCount=ordersByStore.get(row.id)??0;
          return <div className={styles.matrixRow} role="row" key={row.id}>
            <span className={styles.matrixStore}><i><Store size={15}/></i><strong>{row.name}<small>{row.type}</small></strong></span>
            <span>{row.platform} · {row.site}</span>
            <span className={styles.matrixMetric}><strong>{demoOrderCount?demoOrderCount.toLocaleString("zh-CN"):"—"}</strong>{demoOrderCount?<small>演示</small>:null}</span>
            <span className={styles.matrixMetric}>—</span>
            <span className={styles.matrixMetric}>—</span>
            <span><em data-status={row.issue?"需关注":"待评估"} className={styles.matrixConnection}>{row.issue??"无已知异常"}</em></span>
            <span className={styles.matrixActions}><button type="button" onClick={()=>setDetailStoreId(row.id)}>查看详情</button>{row.issue?<button type="button" onClick={()=>router.push("/workbench/stores")}>去处理</button>:null}</span>
          </div>;
        })}
        {visibleStores.length===0?<p className={styles.empty}>当前筛选范围内没有已绑定并获取平台店铺 ID 的店铺。</p>:null}
      </div>
      <footer className={styles.matrixFooter}>
        <span>显示 {visibleStores.length ? (currentPage - 1) * pageSize + 1 : 0} 至 {Math.min(currentPage * pageSize, visibleStores.length)} 条，共 {visibleStores.length} 条</span>
        <nav aria-label="店铺表格分页">
          <button onClick={() => setTablePage(1)} disabled={tablePage === 1} aria-label="第一页">«</button>
          <button onClick={() => setTablePage(page => Math.max(1, page - 1))} disabled={tablePage === 1} aria-label="上一页">‹</button>
          {Array.from({ length: pageCount }, (_, index) => <button className={tablePage === index + 1 ? styles.currentPage : ""} key={index + 1} onClick={() => setTablePage(index + 1)}>{index + 1}</button>)}
          <button onClick={() => setTablePage(page => Math.min(pageCount, page + 1))} disabled={tablePage === pageCount} aria-label="下一页">›</button>
          <button onClick={() => setTablePage(pageCount)} disabled={tablePage === pageCount} aria-label="最后一页">»</button>
        </nav>
      </footer>
    </section>
    {detailStore?<div className={styles.cockpitStoreOverlay} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setDetailStoreId(null)}}>
      <section className={styles.cockpitStoreDialog} role="dialog" aria-modal="true" aria-label={detailStore.name+"经营详情"}>
        <header><div><h2>{detailStore.name}</h2><p>{detailStore.platform} · {detailStore.site} · {detailStore.type}</p></div><button type="button" onClick={()=>setDetailStoreId(null)}>关闭</button></header>
        <div className={styles.cockpitStoreStats}>
          <div><small>订单量</small><strong>{detailDemoOrders?detailDemoOrders.toLocaleString("zh-CN"):"—"}</strong><span>{detailDemoOrders?"演示订单，仅当前筛选范围":"平台真实订单未接入"}</span></div>
          <div><small>曝光量</small><strong>—</strong><span>平台指标待接入</span></div>
          <div><small>点击量</small><strong>—</strong><span>平台指标待接入</span></div>
        </div>
        <div className={styles.cockpitStoreConnection}><strong>连接状态</strong><span>{detailStore.issue??"未记录连接异常（不代表完成实时检测）"}</span></div>
        <p className={styles.cockpitStoreHint}>统计范围：{scopeLabel}。演示订单与平台真实数据分开标识；未接入的指标不按 0 处理。</p>
        <footer><button type="button" onClick={()=>setDetailStoreId(null)}>关闭</button><button type="button" onClick={()=>router.push("/workbench/stores")}>{detailStore.issue?"前往店铺中心处理":"进入店铺中心"}</button></footer>
      </section>
    </div>:null}
  </section>;
}
