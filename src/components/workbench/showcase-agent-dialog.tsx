"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./showcase-agent-dialog.module.css";

export type AgentPreviewDialog =
  | { kind: "introduction"; title: string; description: string; tags: readonly string[]; status: string }
  | { kind: "model"; title: string; model: "official" | "custom" };

export function ShowcaseAgentDialog({ dialog: info, onClose, onSaveModel }: {
  dialog: AgentPreviewDialog;
  onClose: () => void;
  onSaveModel: (title: string, model: "official" | "custom") => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [selected, setSelected] = useState<"official" | "custom">(info.kind === "model" ? info.model : "official");
  useEffect(() => {
    const previous = document.activeElement;
    const element = ref.current;
    if (element && !element.open) element.showModal();
    return () => {
      element?.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  const isModel = info.kind === "model";
  return <dialog ref={ref} className={styles.dialog} aria-labelledby={id} onCancel={event => {
    event.preventDefault();
    onClose();
  }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <header className={styles.heading}>
      <h2 id={id}>{isModel ? "模型设置" : info.title}</h2>
      <button type="button" aria-label="关闭弹窗" className={styles.close} onClick={onClose}>×</button>
      <p>{isModel ? "选择该智能体执行任务时使用的模型来源。" : info.description}</p>
    </header>
    {info.kind === "introduction" ? <>
      <section aria-label="智能体能力与状态" className={styles.info}>
        <h3>智能体介绍</h3>
        <div className={styles.tags}>{info.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
        <p>当前状态：{info.status}</p>
        <p className={styles.demoNote}>此处展示原型中的能力介绍，不会直接创建任务或变更企业配置。</p>
      </section>
      <footer className={styles.footer}><button type="button" className={styles.primary} onClick={onClose}>关闭</button></footer>
    </> : <>
      <section className={styles.modelOptions} aria-label="模型来源">
        <h3>模型来源</h3>
        <button type="button" className={styles.modelOption} aria-pressed={selected === "official"} onClick={() => setSelected("official")}>
          <span><strong>官方模型</strong><small>由硕米提供并维护，开箱即用，无需配置 API。</small></span>
          <b>{selected === "official" ? "已选中" : "选择"}</b>
        </button>
        <button type="button" className={styles.modelOption} aria-pressed={selected === "custom"} onClick={() => setSelected("custom")}>
          <span><strong>自定义模型</strong><small>使用自己的模型服务与 API，可按需要切换。</small></span>
          <b>{selected === "custom" ? "已选中" : "配置并启用"}</b>
        </button>
        <div className={styles.current}>
          <strong>当前使用：{selected === "official" ? "硕米官方推荐模型" : "自定义模型（演示选择）"}</strong>
          <p>{selected === "official" ? "如切换到自定义模型，可随时恢复官方模型。" : "真实 API 配置只在正式工作台中进行；本预览不会收集模型密钥。"}</p>
        </div>
      </section>
      <footer className={styles.footer}>
        <button type="button" className={styles.secondary} onClick={onClose}>取消</button>
        <button type="button" className={styles.primary} onClick={() => onSaveModel(info.title, selected)}>保存设置</button>
      </footer>
    </>}
  </dialog>;
}
