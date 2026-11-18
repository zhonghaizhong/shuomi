"use client";

import { Activity, ArrowRight, Search, ShoppingCart, Store, TriangleAlert } from "lucide-react";
import { useState } from "react";
import styles from "./cockpit-preview.module.css";

const stores = [
  { name: "一号店", platform: "SHEIN", site: "美国站", type: "自营店", gmv: "¥41,320", profit: "¥7,354", trend: "+12.8%", status: "正常" },
  { name: "二号店", platform: "SHEIN", site: "美国站", type: "合作店", gmv: "¥28,600", profit: "¥3,920", trend: "-6.2%", status: "需关注" },
  { name: "三号店", platform: "SHEIN", site: "加拿大站", type: "自营店", gmv: "¥19,850", profit: "¥1,760", trend: "-15.4%", status: "异常" },
  { name: "四号店", platform: "Amazon", site: "美国站", type: "自营店", gmv: "¥36,480", profit: "¥6,210", trend: "+9.6%", status: "正常" },
  { name: "五号店", platform: "Amazon", site: "加拿大站", type: "合作店", gmv: "¥24,760", profit: "¥3,145", trend: "+4.3%", status: "正常" },
  { name: "六号店", platform: "TikTok Shop", site: "美国站", type: "自营店", gmv: "¥18,920", profit: "¥2,680", trend: "+16.2%", status: "正常" },
  { name: "七号店", platform: "SHEIN", site: "美国站", type: "合作店", gmv: "¥15,340", profit: "¥1,420", trend: "-3.8%", status: "需关注" },
  { name: "八号店", platform: "Amazon", site: "美国站", type: "自营店", gmv: "¥31,680", profit: "¥5,270", trend: "+7.1%", status: "正常" },
];

const alerts = [
  { title: "库存不足", detail: "一号店 · 6 个 SKU 低于安全库存", level: "高风险", tone: "high" },
  { title: "店铺转化下降", detail: "二号店 · 近 7 日转化率下降 18%", level: "中风险", tone: "medium" },
  { title: "商品详情待优化", detail: "一号店 · 4 个商品待优化", level: "中风险", tone: "medium" },
] as const;

export function CockpitPreview() {
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
          <div className={styles.heroCopy}><span>运营总览</span><h1>经营全局 · 一屏掌握</h1><p>当前：全部 {visibleStores.length} 家店铺 · 全部时间 · 演示数据</p></div>
          <div className={styles.overviewAside}>
            <div className={styles.overviewGlobe} aria-hidden="true">
            <svg viewBox="0 0 200 200" fill="none">
              <defs>
                <linearGradient id="cockpit-globe-line" x1="28" y1="28" x2="172" y2="172"><stop stopColor="#ECFCFF"/><stop offset=".48" stopColor="#9AE8FF"/><stop offset="1" stopColor="#C0B7FF"/></linearGradient>
                <clipPath id="cockpit-globe-clip"><circle cx="100" cy="100" r="78"/></clipPath>
                <filter id="cockpit-globe-line-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.4"/></filter>
              </defs>
              <circle cx="100" cy="100" r="78" stroke="url(#cockpit-globe-line)" strokeWidth="1.8" strokeOpacity=".9"/>
              <g className={styles.globeWire} clipPath="url(#cockpit-globe-clip)" fill="none" stroke="url(#cockpit-globe-line)" strokeLinecap="round">
                <path d="M30 59c20-10 42-15 70-15s50 5 70 15M25 76c20-12 45-18 75-18s55 6 75 18M22 100c22-8 48-12 78-12s56 4 78 12M25 124c20 12 45 18 75 18s55-6 75-18M30 141c20 10 42 15 70 15s50-5 70-15" strokeWidth="1" strokeDasharray="2 4" opacity=".26"/>
                <path d="M24 100c20-16 46-24 76-24s56 8 76 24M24 100c20 16 46 24 76 24s56-8 76-24" strokeWidth="2.8" opacity=".36" filter="url(#cockpit-globe-line-glow)"/>
                <path d="M24 100c20-16 46-24 76-24s56 8 76 24M24 100c20 16 46 24 76 24s56-8 76-24" strokeWidth="1.3" opacity=".85"/>
                <path d="M22 100h156" strokeWidth="1.6" opacity=".82"/>
              </g>
              <g className={styles.globeMeridians} clipPath="url(#cockpit-globe-clip)" fill="none" stroke="url(#cockpit-globe-line)" strokeLinecap="round">
                <ellipse cx="100" cy="100" rx="68" ry="78" strokeWidth="1" strokeDasharray="2 4" opacity=".25"/>
                <ellipse cx="100" cy="100" rx="54" ry="78" strokeWidth="1" strokeDasharray="2 4" opacity=".2"/>
                <ellipse cx="100" cy="100" rx="42" ry="78" strokeWidth="2.8" opacity=".38" filter="url(#cockpit-globe-line-glow)"/>
                <ellipse cx="100" cy="100" rx="42" ry="78" strokeWidth="1.35" opacity=".94"/>
                <ellipse cx="100" cy="100" rx="22" ry="78" strokeWidth="1.2" opacity=".68"/>
                <path d="M100 22v156" strokeWidth="1" opacity=".46"/>
              </g>
            </svg>
            </div>
          </div>
        </div>
      </article>
      <article className={styles.aiTasksCard}>
        <header><h2>AI 执行与待办</h2><span>3 项重点待办</span></header>
        <div className={styles.aiTasksList}>
          <div data-tone="running"><i/><span><strong>AI 正在执行</strong><small>春季广告投放优化</small></span><button type="button">查看进度</button></div>
          <div data-tone="pending"><i/><span><strong>等待你确认</strong><small>当前项目待确认任务</small></span><button type="button">去确认</button></div>
          <div data-tone="risk"><i/><span><strong>建议立即处理</strong><small>一号店库存补货风险</small></span><button type="button">去处理</button></div>
        </div>
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
        <div className={styles.digestLead}><span>总 GMV</span><div><strong>{formatAmount(totalGmv)}</strong><small>演示汇总</small></div><p>{visibleStores.length} 家店铺 · 未配置 GMV 目标</p></div>
        <div className={styles.digestBars} role="img" aria-label="近一周 GMV 走势示意图">{[42, 57, 48, 68, 55, 88, 73].map((height, index) => <div key={index}><i style={{ height: `${height}%` }} /><span>{["周一", "周二", "周三", "周四", "周五", "周六", "周日"][index]}</span></div>)}</div>
      </div>
      <div className={styles.digestDetails}>
        <article><span className={styles.digestLabel}><ShoppingCart size={15}/>订单量</span><strong>—</strong><small>多店订单汇总待接入</small><div className={styles.digestProgress}><i data-tone="purple"/></div></article>
        <article><span className={styles.digestLabel}><Activity size={15}/>净利润</span><strong>{formatAmount(totalProfit)}</strong><small>演示净利率 14.5%</small><div className={styles.digestProgress}><i data-tone="cyan"/></div></article>
        <article><span className={styles.digestLabel}><Activity size={15}/>经营健康度</span><strong>—</strong><small>多店评分口径待接入</small><div className={styles.digestProgress}><i data-tone="red"/></div></article>
      </div>
    </section>
    <article className={styles.supportTracker}>
      <header><h2>经营预警</h2><button type="button" className={styles.alertLink}>查看全部预警 <ArrowRight size={13}/></button></header>
      <div className={styles.supportTrackerBody}>
        <div className={styles.supportAlertSummary}>
          <div className={styles.alertCountSummary}><strong>{alerts.length}</strong><small>项</small><span>待处理预警</span></div>
          <ul>{alerts.map(item => <li key={item.title} data-tone={item.tone}><i><TriangleAlert size={16}/></i><span><b>{item.title}</b><small>{item.detail}</small></span><em>{item.level}</em></li>)}</ul>
        </div>
        <div className={styles.supportGauge} role="img" aria-label="高风险预警占比 33%">
          <svg viewBox="0 0 200 200" aria-hidden="true">
            {Array.from({ length: 28 }, (_, index) => {
              const angle = -135 + index * (270 / 27);
              return <line key={index} x1="100" y1="19" x2="100" y2="34" transform={`rotate(${angle} 100 100)`} data-active={index < 9 ? "true" : "false"}/>;
            })}
          </svg>
          <span><small>高风险占比</small><strong>33%</strong></span>
        </div>
      </div>
    </article>
    </section>

    <section className={`${styles.panel} ${styles.storeMatrixPanel}`}>
      <header><div><span>店铺矩阵</span><h2>{visibleStores.length} 家店铺 · GMV / 净利润 / 环比</h2></div><button className={styles.linkButton}>查看全部店铺 <ArrowRight size={13}/></button></header>
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
        {visibleStores.length === 0 ? <p className={styles.empty}>没有匹配的店铺</p> : null}
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
