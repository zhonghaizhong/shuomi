"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, Plus, RefreshCw, Search } from "lucide-react";
import { ConsolePage } from "@/components/workbench/console/console-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import styles from "./store-center-preview.module.css";

const stores: Array<{id:string;name:string;platform:string;region:string;type:string;group:string;products:string;orders:string;inventory:string;connection:string;sync:string;manager:string;synced:string}> = [];

export function StoreCenterPreview() {
  const initialFilters = { search: "", platform: "全部平台", region: "全部站点", type: "全部类型", status: "全部状态", group: "全部分组" };
  const [draft, setDraft] = useState(initialFilters);
  const [applied, setApplied] = useState(initialFilters);
  const visibleStores = useMemo(() => stores.filter(store =>
    (!applied.search || `${store.name} ${store.id}`.toLowerCase().includes(applied.search.toLowerCase())) &&
    (applied.platform === "全部平台" || store.platform === applied.platform) &&
    (applied.region === "全部站点" || store.region === applied.region) &&
    (applied.type === "全部类型" || store.type === applied.type) &&
    (applied.status === "全部状态" || (applied.status === "需要处理" ? store.sync === "同步 68%" : store.sync === "同步正常")) &&
    (applied.group === "全部分组" || store.group === applied.group)), [applied]);

  return <div className={styles.frame}>
    <aside className={styles.sidebar}>
      <div className={styles.brand}><Image src="/console/sumi-logo.png" alt="" width={42} height={42} unoptimized /><div><strong>硕米智能引擎</strong><small>SHUOMI AI ENGINE</small></div></div>
      <nav aria-label="工作台导航" className={styles.navigation}>
        {["运营驾驶舱", "AI工作台", "供应市场", "智能市场", "工具市场", "生态服务", "数据服务", "店铺中心", "　我的店铺", "　店铺商品", "　订单履约", "套餐与权益", "我的账户"].map((name, index) => <Link key={name} href="#" aria-current={index === 8 ? "page" : undefined} data-active={index === 8 || index === 7 || undefined}>{name}</Link>)}
      </nav>
      <small className={styles.sidebarFoot}>SHUOMI AI ENGINE · V1.0</small>
    </aside>
    <div className={styles.main}>
      <header className={styles.topbar}><strong>打造属于自己的 AI 电商团队</strong><span>SHUOMI AI ENGINE</span><div><button disabled>联系客服</button><button disabled>通知 3</button><button disabled>深色 ◉</button><button disabled>示例用户</button></div></header>
      <ConsolePage className={styles.page} title="我的店铺" breadcrumbs={[{ label: "店铺中心" }, { label: "我的店铺" }]} description="统一管理店铺连接、授权、网络环境和数据状态。" actions={<Button disabled className={styles.primary}><Plus size={16} />绑定新店铺</Button>}>
    <div className={styles.previewNotice}><span>本机设计预览</span><p>旧演示店铺数据已清理。真实店铺、授权和同步操作在登录后由正式服务处理。</p></div>
    <section className={styles.metrics} aria-label="店铺概览">
      {[{ label: "店铺总数", value: "0", hint: "已接入店铺", tone: "blue" }, { label: "正常店铺", value: "0", hint: "授权及数据正常", tone: "green" }, { label: "需要处理", value: "0", hint: "授权或同步异常", tone: "amber" }, { label: "同步正常", value: "0", hint: "当前连接正常", tone: "violet" }].map(item => <div className={styles.metric} data-tone={item.tone} key={item.label}><div><span>{item.label}</span><strong>{item.value}</strong></div><small>{item.hint}</small></div>)}
    </section>
    
    <form className={styles.toolbar} aria-label="店铺筛选" onSubmit={event => { event.preventDefault(); setApplied(draft); }}>
      <label className={styles.search}><Search size={16} /><Input aria-label="搜索店铺名称或 ID" placeholder="输入店铺名称 / ID" value={draft.search} onChange={event => setDraft({ ...draft, search: event.target.value })} /></label>
      <Select aria-label="平台筛选" value={draft.platform} onChange={event => setDraft({ ...draft, platform: event.target.value })}><option>全部平台</option><option>SHEIN</option></Select>
      <Select aria-label="站点筛选" value={draft.region} onChange={event => setDraft({ ...draft, region: event.target.value })}><option>全部站点</option><option>美国站</option><option>加拿大站</option></Select>
      <Select aria-label="店铺类型筛选" value={draft.type} onChange={event => setDraft({ ...draft, type: event.target.value })}><option>全部类型</option><option>半托管</option><option>全托管</option></Select>
      <Select aria-label="店铺状态筛选" value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value })}><option>全部状态</option><option>正常</option><option>需要处理</option></Select>
      <Select aria-label="店铺分组筛选" value={draft.group} onChange={event => setDraft({ ...draft, group: event.target.value })}><option>全部分组</option><option>核心店铺</option><option>新店</option></Select>
      <Button type="button" variant="outline" onClick={() => { setDraft(initialFilters); setApplied(initialFilters); }}>重置</Button>
      <Button type="submit">筛选</Button>
    </form>
    <div className={styles.listHeading}><div><h2>店铺列表</h2><span>显示 {visibleStores.length} 家店铺 · 当前开放平台：SHEIN</span></div><Button disabled variant="outline">管理分组</Button></div>
    <div className={styles.list}>
      {visibleStores.map((store, index) => <article className={styles.storeCard} key={store.id}>
        <header className={styles.cardTop}><div className={styles.storeIdentity}><span className={styles.platformMark}>S</span><div><h3>{store.name}</h3><p>店铺 ID：{store.id}</p></div></div><div className={styles.pills}><span>{store.platform}</span><span>{store.region}</span><span>{store.type}</span><span>{store.group}</span></div><div className={styles.connection}><span><i />{store.connection}</span><span data-warning={index === 1}><i />{store.sync}</span></div></header>
        <div className={styles.facts}>{[["在线商品", store.products], ["待处理订单", store.orders], ["库存预警", store.inventory], ["负责人", store.manager]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
        <footer className={styles.cardBottom}><span>最近同步：{store.synced}</span><div><Button disabled variant="outline">管理</Button><Button disabled variant="outline"><RefreshCw size={14} />立即同步</Button><Button disabled className={styles.enter}>进入店铺<ArrowUpRight size={14} /></Button></div></footer>
      </article>)}
      {visibleStores.length === 0 ? <div className={styles.empty}>暂无店铺记录。绑定并授权店铺后，才能同步真实商品与订单</div> : null}
    </div>
    <div className={styles.note}><Check size={15} />店铺分组与负责人可用于任务中心、数据中心和 AI 智能体的跨店筛选与权限管理。</div>
      </ConsolePage>
    </div>
  </div>;
}
