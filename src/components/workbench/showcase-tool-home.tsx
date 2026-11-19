"use client";

import { useState, type CSSProperties, type KeyboardEvent } from "react";
import styles from "./showcase-tool-home.module.css";

const entries = [
  { title: "官方工具", description: "浏览平台维护的官方工具，了解商品采集、POD素材等能力，以及适用范围与使用要求。", action: "浏览官方工具", path: "/workbench/tools/official", accent: "#8ebbff" },
  { title: "我的工具", description: "集中管理已启用的工具，查看授权状态、配置与使用入口，并按实际业务需要调用。", action: "管理我的工具", path: "/workbench/tools/mine", accent: "#74ddcb" },
  { title: "工具定制", description: "针对特殊采集、系统连接或自动化场景，提交定制需求，说明目标、数据来源和预期成果。", action: "了解定制服务", path: "/workbench/tools/custom", accent: "#c8a7f8" },
] as const;

const capabilities = [
  { title: "商品与数据采集", description: "采集并整理商品资料，为后续适配提供来源。", color: "#8ebbff" },
  { title: "素材及内容管理", description: "集中处理图片、贴图及订单关联素材。", color: "#74ddcb" },
  { title: "商品快速刊登", description: "核对必填资料，提升自有商品刊登效率。", color: "#c8a7f8" },
  { title: "系统连接与定制", description: "按业务需求连接系统并配置执行流程。", color: "#ffb957" },
] as const;

const steps = [
  { title: "发现工具", description: "按业务需要浏览适合的工具", color: "#8ebbff" },
  { title: "了解能力", description: "确认适用范围、权限及费用", color: "#74ddcb" },
  { title: "启用与配置", description: "完成必要授权和使用配置", color: "#c8a7f8" },
  { title: "按需使用", description: "在支持的业务流程中调用", color: "#ffb957" },
] as const;

export function ShowcaseToolHome({ navigate }: { navigate: (href: string) => void }) {
  const [selected, setSelected] = useState<number | null>(null);

  function open(path: string) {
    navigate(path + "?preview=1");
  }

  function onCardKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelected(index);
    }
  }

  return <main className={styles.page} data-tool-home>
    <header className={styles.hero}>
      <span className={styles.eyebrow}>工具市场</span>
      <h1>连接工具能力，让业务流程更高效</h1>
      <p>发现官方工具、管理已启用能力，或申请专属定制服务，让工具按需参与实际业务。</p>
    </header>

    <section className={styles.entries} aria-label="工具市场核心入口">
      {entries.map((entry, index) => <article key={entry.title} className={styles.entry} data-selected={selected === index} style={{ "--accent": entry.accent } as CSSProperties}>
        <button type="button" className={styles.selectCard} aria-label={"选择" + entry.title + "卡片"} aria-pressed={selected === index} onClick={() => setSelected(index)} onKeyDown={event => onCardKeyDown(event, index)}>
          <span className={styles.entryTitle}>{entry.title}</span>
          <span className={styles.entryDescription}>{entry.description}</span>
        </button>
        <button type="button" className={styles.entryAction} onClick={() => open(entry.path)}>{entry.action}</button>
      </article>)}
    </section>

    <section className={styles.capabilities} aria-labelledby="tool-capabilities">
      <div className={styles.sectionHeading}>
        <h2 id="tool-capabilities">面向日常运营的工具能力</h2>
        <p>按采集、内容、刊登和业务连接组织工具能力</p>
      </div>
      <div className={styles.capabilityGrid}>
        {capabilities.map(cap => <article key={cap.title} className={styles.capability} style={{ "--accent": cap.color } as CSSProperties}>
          <h3>{cap.title}</h3><p>{cap.description}</p>
        </article>)}
      </div>
    </section>

    <div className={styles.bottom}>
      <section className={styles.process} aria-labelledby="tool-process">
        <div className={styles.sectionHeading}>
          <h2 id="tool-process">标准工具使用流程</h2>
          <p>从了解工具到正式调用，按实际权限与配置要求完成</p>
        </div>
        <ol className={styles.steps}>
          {steps.map((step, i) => <li key={step.title} className={styles.step} style={{ "--accent": step.color } as CSSProperties}>
            <span className={styles.number}>{String(i + 1).padStart(2, "0")}</span>
            <div><h3>{step.title}</h3><p>{step.description}</p></div>
          </li>)}
        </ol>
      </section>
      <aside className={styles.notes} aria-label="工具使用说明">
        <section className={styles.note}>
          <span>使用与管理</span>
          <h2>工具启用后在哪里使用</h2>
          <p>启用后可在「我的工具」管理和配置。支持的工具可在任务或智能体中调用。</p>
        </section>
        <section className={styles.note}>
          <span>权限与计费</span>
          <h2>了解授权要求与服务费用</h2>
          <p>工具权限、额度与费用以服务规则为准。定制服务需评估报价、验收并完成授权。</p>
        </section>
      </aside>
    </div>
  </main>;
}
