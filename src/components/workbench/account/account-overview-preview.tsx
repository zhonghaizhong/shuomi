"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "./account-overview-preview.module.css";
import {showcaseTenant as tenant} from "./showcase-tenant";
import {useShowcaseSuite,totalEarnings,availableEarnings} from "./showcase-account-state";

const entries = [
  { tone: "teal", title: "账户资料", status: "资料已完善", detail: "维护用户名、手机、邮箱、经营画像与认证信息。", fact: "实名认证", value: "已完成", action: "管理资料", href: "/workbench/account/profile?preview=1" },
  { tone: "blue", title: "企业空间", status: "企业已认证", detail: "管理成员与权限、资源与额度以及操作记录。", fact: "当前身份", value: "管理员", action: "进入空间", href: "/workbench/account/organization?preview=1" },
  { tone: "purple", title: "推广与收益", status: "暂无历史收益", detail: "管理推广入口、收益明细、提现与推广规则。", fact: "可提现", value: "¥0.00", action: "查看收益", href: "/workbench/account/referrals?preview=1" },
] as const;

export function AccountOverviewPreview() {
  const {state}=useShowcaseSuite();
  const available=availableEarnings(state);
  const total=totalEarnings(state);
  return <main className={styles.page}>
    <section className={styles.summary} aria-label="账户概览">
      <header><div><h2>账户概览</h2><p>查看当前账户、企业与收益状态</p></div></header>
      <div className={styles.summaryGrid}>
        <article><span>账号状态</span><strong>已实名认证（模拟）</strong><small>手机 / 邮箱已验证</small></article>
        <article><span>企业状态</span><strong>已认证（模拟）</strong><small>{tenant.name} · 管理员：{tenant.admin}</small></article>
        <article><span>推广收益</span><strong>可提现 ¥{available.toFixed(2)}</strong><small>暂无待结算收益</small></article>
      </div>
    </section>

    <section className={styles.management}>
      <header className={styles.sectionHeader}><h2>账户管理</h2><p>只保留当前真正需要的三个账户模块。</p></header>
      <div className={styles.entryGrid}>{entries.map(entry => <article className={styles.entry} data-tone={entry.tone} key={entry.title}>
        <div className={styles.entryHead}><h3>{entry.title}</h3><span>{entry.title==="推广与收益"?"累计收益 ¥"+total.toFixed(2):entry.status}</span></div>
        <p>{entry.detail}</p>
        <div className={styles.entryFooter}><span>{entry.fact}<strong>{entry.title==="推广与收益"?"¥"+available.toFixed(2):entry.value}</strong></span><Link href={entry.href}>{entry.action}<ArrowRight size={14}/></Link></div>
      </article>)}</div>
    </section>

    <div className={styles.bottomGrid}>
      <section className={styles.panel}><header><h2>最近动态</h2><p>账户相关的重要变化</p></header>
        <div className={styles.activity}><article><i data-tone="blue"/><time>2026-11-21</time><strong>企业入驻（模拟）</strong><span>{tenant.name} · 已认证</span></article><article><i data-tone="teal"/><time>2026-11-21</time><strong>管理员已开通</strong><span>{tenant.admin} · 当前成员 {state.members.filter(m=>m.status==="正常").length} 人</span></article></div>
      </section>
      <section className={styles.panel}><header><h2>待关注</h2><p>需要留意的账户事项</p></header>
        <div className={styles.notices}><article><div><strong>店铺服务</strong><span>0 家店铺即将到期</span></div><Link href="/workbench/plans/entitlements?preview=1">查看</Link></article><article><div><strong>推广收益</strong><span>暂无待结算收益</span></div><Link href="/workbench/account/referrals?preview=1">查看</Link></article></div>
      </section>
    </div>
  </main>;
}
