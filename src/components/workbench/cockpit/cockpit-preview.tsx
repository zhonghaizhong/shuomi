"use client";

import { Activity, ArrowRight, Search, ShoppingCart, Store, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./cockpit-preview.module.css";
import { SeamlessEarthGlobe } from "./seamless-earth-globe";

type StoreSummary={name:string;platform:string;site:string;type:string;gmv:string;profit:string;trend:string;status:string};
const stores:StoreSummary[]=[];
type AlertSummary={title:string;detail:string;level:string;tone:string};
const alerts:AlertSummary[]=[];

export function CockpitPreview() {
  const router = useRouter();
  const emptyFilters = { platform: "全部平台", site: "全部站点", type: "全部店铺类型", time: "全部时间", search: "" };
  const [filters, setFilters] = useState(emptyFilters);
  const [activeFilters, setActiveFilters] = useState(emptyFilters);
  const [tablePage, setTablePage] = useState(1);
  const visibleStores = stores.filter(store => {
    const query = activeFilters.search.trim().toLocaleLowerCase();
    return (activeFilters.platform === "全部平台" || store.platform === activeFilters.platform)
      && (activeFilters.site === "全部站点" || store.site === activeFilters.site)
      && (activeFilters.type === "全部店铺类型" || store.type === activeFilters.type)
      && (!query || [store.name, store.platform, store.site, store.type].some(value => value.toLocaleLowerCase().includes(query)));
  });
  const totalGmv = visibleStores.reduce((sum, store) => sum + Number(store.gmv.replace(/[^\d]/g, "")), 0);
  const totalProfit = visibleStores.reduce((sum, store) => sum + Number(store.profit.replace(/[^\d]/g, "")), 0);
  const formatAmount = (amount: number) => `¥${amount.toLocaleString("en-US")}`;
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(visibleStores.length / pageSize));
  const pageStores = visibleStores.slice((tablePage - 1) * pageSize, tablePage * pageSize);
  const updateFilter = (key: keyof typeof emptyFilters, value: string) => setFilters(current => ({ ...current, [key]: value }));
  const resetFilters = () => { setFilters(emptyFilters); setActiveFilters(emptyFilters); setTablePage(1); };

  return <section className={styles.page} data-dashboard="operations">
    <section className={styles.metrics} aria-label="经营指标">
      <article className={`${styles.featureMetric} ${styles.overviewFeature}`} data-tone="blue">
        <div className={styles.overviewMain}>
          <div className={styles.heroCopy}>
            <div className={styles.heroEyebrow}><span className={styles.heroPulse} aria-hidden="true" />运营总览 <span className={styles.heroEnglish}>OPERATIONS OVERVIEW</span></div>
            <h1>经营全局 · 一屏掌握</h1>
            <p className={styles.heroIntro}>汇聚多店铺经营表现、核心指标与风险动态，让每一次决策都有清晰依据。</p>
            <div className={styles.heroScope}>当前：全部 {visibleStores.length} 家店铺 <i aria-hidden="true" /> 全部时间 <i aria-hidden="true" /> 业务数据待接入</div>
            <div className={styles.heroHighlights} aria-label="经营总览能力"><span>多店数据统一查看</span><span>经营风险快速识别</span><span>AI 执行与待办追踪</span></div>
          </div>
          <div className={styles.overviewAside}>
            <div className={styles.overviewGlobe} aria-hidden="true">
              <SeamlessEarthGlobe />
            </div>
          </div>
        </div>
      </article>
      <article className={styles.aiTasksCard}>
        <header><h2>AI 执行与待办</h2><span>0 项待办</span></header>
        <div className={styles.aiTasksList}><p>暂无已关联的 AI 任务和经营待办，后续接入业务再展示。</p></div>
      </article>
    </section>
    <div className={styles.overviewFilters}>
      <div className={styles.filterSelects}>
        <select aria-label="平台" value={filters.platform} onChange={event => updateFilter("platform", event.target.value)}><option>全部平台</option><option>SHEIN</option><option>Amazon</option><option>TikTok Shop</option></select>
        <select aria-label="站点" value={filters.site} onChange={event => updateFilter("site", event.target.value)}><option>全部站点</option><option>美国站</option><option>加拿大站</option></select>
        <select aria-label="店铺类型" value={filters.type} onChange={event => updateFilter("type", event.target.value)}><option>全部店铺类型</option><option>自营店</option><option>合作店</option></select>
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
      <header className={styles.digestHeader}><div><h2>经营表现</h2><span>核心指标 · 按当前筛选汇总</span></div><button aria-label="更多经营表现选项">···</button></header>
      <div className={styles.digestMain}>
        <div className={styles.digestLead}><span>总 GMV</span><div><strong>{formatAmount(totalGmv)}</strong><small>暂未接入经营数据</small></div><p>{visibleStores.length} 家店铺 · 未配置 GMV 目标</p></div>
        <div className={styles.digestBars} role="img" aria-label="近一周 GMV 暂无数据">{[0, 0, 0, 0, 0, 0, 0].map((height, index) => <div key={index}><i style={{ height: `${height}%` }} /><span>{["周一", "周二", "周三", "周四", "周五", "周六", "周日"][index]}</span></div>)}</div>
      </div>
      <div className={styles.digestDetails}>
        <article><span className={styles.digestLabel}><ShoppingCart size={15}/>订单量</span><strong>—</strong><small>多店订单汇总待接入</small><div className={styles.digestProgress}><i data-tone="purple"/></div></article>
        <article><span className={styles.digestLabel}><Activity size={15}/>净利润</span><strong>{formatAmount(totalProfit)}</strong><small>净利率待业务接入</small><div className={styles.digestProgress}><i data-tone="cyan"/></div></article>
        <article><span className={styles.digestLabel}><Activity size={15}/>经营健康度</span><strong>—</strong><small>多店评分口径待接入</small><div className={styles.digestProgress}><i data-tone="red"/></div></article>
      </div>
    </section>
    <article className={styles.supportTracker}>
      <header><h2>经营预警</h2><button type="button" className={styles.alertLink} onClick={() => router.push("/workbench/overview/alerts")}>查看全部预警 <ArrowRight size={13}/></button></header>
      <div className={styles.supportTrackerBody}>
        <div className={styles.supportAlertSummary}>
          <div className={styles.alertCountSummary}><strong>{alerts.length}</strong><small>项</small><span>待处理预警</span></div>
          <ul>{alerts.length===0?<li>暂无经营预警，接入店铺与订单后再生成。</li>:null}{alerts.map(item => <li key={item.title} data-tone={item.tone}><i><TriangleAlert size={16}/></i><span><b>{item.title}</b><small>{item.detail}</small></span><em>{item.level}</em></li>)}</ul>
        </div>
        <div className={styles.supportGauge} role="img" aria-label="高风险预警占比暂无数据">
          <svg viewBox="0 0 200 200" aria-hidden="true">
            {Array.from({ length: 28 }, (_, index) => {
              const angle = -135 + index * (270 / 27);
              return <line key={index} x1="100" y1="19" x2="100" y2="34" transform={`rotate(${angle} 100 100)`} data-active={false ? "true" : "false"}/>;
            })}
          </svg>
          <span><small>高风险占比</small><strong>—</strong></span>
        </div>
      </div>
    </article>
    </section>

    <section className={`${styles.panel} ${styles.storeMatrixPanel}`}>
      <header><div><span>店铺矩阵</span><h2>{visibleStores.length} 家店铺 · GMV / 净利润 / 环比</h2></div><button className={styles.linkButton} onClick={() => router.push("/workbench/overview/stores")}>查看全部店铺 <ArrowRight size={13}/></button></header>
      <div className={styles.matrixTable} role="table" aria-label="店铺经营数据">
        <div className={styles.matrixHead} role="row"><span><input type="checkbox" aria-label="全选当前页店铺"/></span><b>店铺</b><b>平台 / 站点</b><b>GMV</b><b>净利润</b><b>环比</b><b>经营状态</b><b>GMV 占比</b></div>
        {pageStores.map(row => {
          const share = totalGmv ? Math.round(Number(row.gmv.replace(/[^\d]/g, "")) / totalGmv * 100) : 0;
          return <div className={styles.matrixRow} role="row" key={row.name}>
            <span><input type="checkbox" aria-label={`选择${row.name}`}/></span>
            <span className={styles.matrixStore}><i><Store size={15}/></i><strong>{row.name}<small>{row.type}</small></strong></span>
            <span>{row.platform} · {row.site}</span><b>{row.gmv}</b><b>{row.profit}</b>
            <b data-trend={row.trend.startsWith("+") ? "up" : "down"}>{row.trend}</b>
            <em data-status={row.status}>{row.status}</em>
            <span className={styles.matrixProgress}><i><b style={{ width: `${share}%` }}/></i><small>{share}%</small></span>
          </div>;
        })}
        {visibleStores.length === 0 ? <p className={styles.empty}>暂无已接入的店铺经营数据</p> : null}
      </div>
      <footer className={styles.matrixFooter}>
        <span>显示 {visibleStores.length ? (tablePage - 1) * pageSize + 1 : 0} 至 {Math.min(tablePage * pageSize, visibleStores.length)} 条，共 {visibleStores.length} 条</span>
        <nav aria-label="店铺表格分页">
          <button onClick={() => setTablePage(1)} disabled={tablePage === 1} aria-label="第一页">«</button>
          <button onClick={() => setTablePage(page => Math.max(1, page - 1))} disabled={tablePage === 1} aria-label="上一页">‹</button>
          {Array.from({ length: pageCount }, (_, index) => <button className={tablePage === index + 1 ? styles.currentPage : ""} key={index + 1} onClick={() => setTablePage(index + 1)}>{index + 1}</button>)}
          <button onClick={() => setTablePage(page => Math.min(pageCount, page + 1))} disabled={tablePage === pageCount} aria-label="下一页">›</button>
          <button onClick={() => setTablePage(pageCount)} disabled={tablePage === pageCount} aria-label="最后一页">»</button>
        </nav>
      </footer>
    </section>
  </section>;
}
