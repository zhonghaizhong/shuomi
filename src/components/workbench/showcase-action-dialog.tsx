"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "./showcase-action-dialog.module.css";

export type DemoGoal = {
  name: string;
  metric: string;
  store: string;
  period: string;
  value: string;
};
export function ShowcaseActionDialog({
  action, onClose, onCreateGoal,
}: {
  action: string;
  onClose: () => void;
  onCreateGoal: (goal: DemoGoal) => void;
}) {
  const isGoal = action === "新建目标";
  const [name, setName] = useState("");
  const [metric, setMetric] = useState("预计净利润");
  const [store, setStore] = useState("一号店");
  const [period, setPeriod] = useState("每月");
  const [value, setValue] = useState("");
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeButton.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [onClose]);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !Number.isFinite(Number(value)) || Number(value) <= 0) return;
    onCreateGoal({ name: name.trim(), metric, store, period, value: value.trim() });
  };
  return <div className={styles.overlay} onMouseDown={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <section className={styles.panel} role="dialog" aria-modal="true" aria-labelledby="showcase-action-heading">
      <header className={styles.header}>
        <div><small>{isGoal ? "运营驾驶舱 / 目标管理" : "硕米智能引擎 / 演示交互"}</small><h2 id="showcase-action-heading">{action}</h2></div>
        <button className={styles.close} aria-label="关闭弹窗" type="button" onClick={onClose} ref={closeButton}>×</button>
      </header>
      {isGoal ? <form onSubmit={submit} className={styles.form}>
        <p className={styles.note}>填写目标后可加入当前演示列表。本页面不会写入正式业务数据。</p>
        <label>目标名称<input required maxLength={60} value={name} onChange={event => setName(event.target.value)} placeholder="例如：十一月店铺利润目标" /></label>
        <div className={styles.fields}>
          <label>目标指标<select value={metric} onChange={event => setMetric(event.target.value)}><option>预计净利润</option><option>销售额</option><option>成交订单数</option><option>净利润率</option></select></label>
          <label>适用店铺<select value={store} onChange={event => setStore(event.target.value)}><option>一号店</option><option>二号店</option><option>三号店</option><option>全部店铺</option></select></label>
          <label>目标周期<select value={period} onChange={event => setPeriod(event.target.value)}><option>每天</option><option>每周</option><option>每月</option></select></label>
          <label>目标值<input required type="number" min="0.01" step="any" value={value} onChange={event => setValue(event.target.value)} placeholder="输入目标数值" /></label>
        </div>
        <footer className={styles.actions}><button type="button" className={styles.secondary} onClick={onClose}>取消</button><button className={styles.primary} type="submit">添加到演示列表</button></footer>
      </form> : <div className={styles.information}>
        <p>此操作在当前 GitHub Pages 演示版中尚未连接对应的业务流程，因此不会提交、保存或执行真实操作。</p>
        <p>可继续查看当前页面的演示数据；正式交互需要逐项按照 Figma 对应页面实现。</p>
        <footer className={styles.actions}><button type="button" className={styles.primary} onClick={onClose}>知道了</button></footer>
      </div>}
    </section>
  </div>;
}
