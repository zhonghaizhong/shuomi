"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "./showcase-agent-customization.module.css";

type Submitted = { name: string; scenario: string; direction: string; description: string; contact: string };
const STORAGE = "shuomi:showcase-agent-customization-demo";

export function ShowcaseAgentCustomization({ pathname, navigate }: { pathname: string; navigate: (path: string) => void }) {
  const [direction, setDirection] = useState("商品与供应链");
  const [consent, setConsent] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [fileError, setFileError] = useState("");
  const [data, setData] = useState<Submitted>({ name: "", scenario: "", direction: "商品与供应链", description: "", contact: "" });
  const [pending, setPending] = useState<Submitted | null>(null);
  const [saved, setSaved] = useState<Submitted | null>(() => {
    if (typeof window === "undefined") return null;
    try { const value = sessionStorage.getItem(STORAGE); return value ? JSON.parse(value) as Submitted : null; }
    catch { return null; }
  });
  const [example, setExample] = useState(true);
  const isNew = pathname.endsWith("/new"), isProgress = pathname.endsWith("/progress");
  const route = (suffix: string) => navigate("/workbench/agents/custom" + suffix + "?preview=1");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent || fileError || !data.name.trim() || !data.scenario.trim() || !data.description.trim() || !data.contact.trim()) return;
    setPending({ ...data, direction });
  }
  function confirm() {
    if (!pending) return;
    sessionStorage.setItem(STORAGE, JSON.stringify(pending));
    setSaved(pending);
    setPending(null);
    setExample(false);
    route("/progress");
  }
  const activeTab = isNew ? "submit" : isProgress ? "progress" : "intro";
  const tabs = [
    { id: "intro", label: "定制介绍", suffix: "" },
    { id: "submit", label: "提交需求", suffix: "/new" },
    { id: "progress", label: "查看进度", suffix: "/progress" },
  ] as const;
  return <div data-agent-customization={isNew ? "new" : isProgress ? "progress" : "overview"} className={styles.page}>
    <header className={styles.header}>
      <div><small>智能市场 / 智能体定制</small><h1>智能体定制</h1><p>针对独特业务场景，定制专属于你的 AI 电商智能体。</p></div>
    </header>
    <nav className={styles.customTabs} aria-label="智能体定制页面">
      {tabs.map(t => <button type="button" key={t.id} aria-current={activeTab === t.id ? "page" : undefined} onClick={() => route(t.suffix)}>{t.label}</button>)}
    </nav>
    <div className={styles.tabContent} key={activeTab}>
    {!isNew && !isProgress ? <section className={styles.intro}>
      <div className={styles.introLead}>
        <div><span className={styles.eyebrow}>专属智能体 · 按需定制</span><h2>让业务规则成为可执行的智能体</h2><p>面向标准智能体难以覆盖的业务场景，结合你的目标、数据和工作流程，评估专属能力与交付方案。</p></div>
        <div className={styles.introService}><strong>定制服务说明</strong><p>需求提交与初步评估不产生费用。实施范围、报价与交付周期以双方确认的方案为准。</p></div>
      </div>
      <div className={styles.introSectionHeading}><h2>可定制内容</h2><p>从业务目标到交付集成，围绕四个关键维度构建</p></div>
      <div className={styles.introFeatures}>
        {[
          ["01","任务目标","明确使用场景、触发条件与预期结果，约定必要的人工确认环节。"],
          ["02","数据与知识","梳理数据来源、业务规则、授权范围与专属知识库需求。"],
          ["03","执行流程","设计执行步骤、审批节点、异常处理及人机协作方式。"],
          ["04","输出与连接","确定交付格式、验收标准，评估第三方系统对接方式。"],
        ].map(([num,title,body]) => <article key={num}><span>{num}</span><h3>{title}</h3><p>{body}</p></article>)}
      </div>
      <div className={styles.introSectionHeading}><h2>定制流程</h2><p>四个阶段，进展清晰可追踪</p></div>
      <div className={styles.introProcess}>
        {[
          ["01","提交需求","描述业务目标和现有流程"],
          ["02","需求评估","确认范围、数据和实现条件"],
          ["03","方案与报价","明确实施周期和费用"],
          ["04","开发交付","完成开发、测试与成果交付"],
        ].map(([num,title,body]) => <article key={num}><b>{num}</b><div><strong>{title}</strong><p>{body}</p></div></article>)}
      </div>
      <div className={styles.introNote}><span>服务说明</span><p>具体开发范围、数据条件、第三方接入及交付方式，由专员评估后确认。确认方案和费用后再推进实施。</p></div>
    </section> : isNew ? <section className={styles.formLayout}>
      <form className={styles.card} onSubmit={submit}>
        <div className={styles.formIntro}><h2>告诉我们你希望智能体完成什么</h2><small>* 为必填项</small></div><p>先描述目标、具体实现方式由专员与你确认。</p>
        <h3>基本信息</h3>
        <div className={styles.two}>
          <label>需求名称 *<input aria-label="需求名称" required placeholder="例如：SHEIN商品批量优化智能体" maxLength={100} value={data.name} onChange={e=>setData(p=>({...p,name:e.target.value}))}/></label>
          <label>主要使用场景 *<select aria-label="主要使用场景" required value={data.scenario} onChange={e=>setData(p=>({...p,scenario:e.target.value}))}><option value="">请选择使用场景</option><option>商品与供应链管理</option><option>店铺经营与运营</option><option>数据分析与决策</option><option>其他业务流程</option></select></label>
        </div>
        <fieldset className={styles.directions}><legend>定制方向 *</legend>{["商品与供应链","店铺运营","数据分析","其他"].map(v=><button type="button" key={v} aria-pressed={direction===v} onClick={()=>setDirection(v)}>{v}</button>)}</fieldset>
        <h3>需求描述</h3>
        <label>希望智能体完成什么？ *<textarea aria-label="希望智能体完成什么？" required placeholder="请说明当前业务问题、希望自动完成的步骤及预期结果。\n例如：读取商品资料，优化标题与卖点，并生成可用于刊登的内容。" value={data.description} onChange={e=>setData(p=>({...p,description:e.target.value}))}/></label>
        <label className={styles.upload}>＋ 上传参考资料<input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.txt,.csv" aria-label="上传参考资料" onChange={e=>{const list=Array.from(e.target.files||[]);const invalid=list.length>3||list.some(f=>f.size>2*1024*1024||f.size===0);setFiles(invalid?[]:list.map(f=>f.name));setFileError(invalid?"最多3个附件，每个不超过2 MiB。":"");}}/></label>
        <p>支持流程文档、表格或页面截图，非必填。{files.length ? " 已选择：" + files.join("、") : ""}</p>
        {fileError ? <p role="alert">{fileError}</p> : null}
        <h3>联系信息</h3>
        <div className={styles.two}>
          <label>联系人 *<input aria-label="联系人" required placeholder="请输入联系人姓名" value={data.contact.split("|")[0]??""} onChange={e=>setData(p=>({...p,contact:e.target.value+"|"+(p.contact.split("|")[1]??"")}))}/></label>
          <label>手机或微信 *<input aria-label="手机或微信" required placeholder="请输入方便联系的方式" value={data.contact.split("|")[1]??""} onChange={e=>setData(p=>({...p,contact:(p.contact.split("|")[0]??"")+"|"+e.target.value}))}/></label>
        </div>
        <label className={styles.consent}><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>允许平台专员通过预留联系方式沟通需求、方案及报价。</span></label>
        <p className={styles.disclaimer}>此为网页交互原型，提交仅保存到当前浏览器的演示记录，不会向平台发送申请或附件。</p>
        <div className={styles.actions}><button type="button" onClick={()=>route("")}>取消</button><button type="submit" className={styles.primary} disabled={!consent||!!fileError||!data.name.trim()||!data.scenario.trim()||!data.description.trim()||!data.contact.split("|")[0]?.trim()||!data.contact.split("|")[1]?.trim()}>提交定制需求</button></div>
      </form>
      <aside className={styles.sideCards}>
        <article className={styles.card}><h3>有偿定制服务</h3><h2>先评估，再确认方案与报价</h2><p>提交需求不产生费用。专员了解业务场景，再与你确认服务范围、交付方式与报价。</p></article>
        <article className={styles.card}><h2>提交后会发生什么</h2><div className={styles.sideSteps}>{[["01","专员联系"],["02","需求评估"],["03","方案与报价"]].map(([num,txt])=><p key={num}><b>{num}</b>{txt}</p>)}</div></article>
        <article className={styles.card}><h2>填写建议</h2><p>说清当前问题与预期结果即可，无需提前准备技术方案。描述越具体，评估越准确。</p></article>
      </aside>
    </section> : <section className={styles.progressPage}>
      <div className={styles.progressToolbar}><h2>需求记录</h2><p>查看示例办理状态，真实数据需要接入业务系统。</p><div><button type="button" aria-pressed={example} onClick={()=>setExample(true)}>查看示例</button><button type="button" aria-pressed={!example} onClick={()=>setExample(false)}>{saved?"本地演示记录":"暂无记录"}</button></div></div>
      {example || saved ? <>
        <article className={styles.card}><span className={styles.demoLabel}>{example?"演示需求 · 非真实记录":"本地演示需求 · 未提交服务器"}</span><h3>{example?"商品资料智能处理与刊登辅助":saved?.name}</h3><p>{example?"按业务规则整理商品资料，辅助生成标准化刊登内容。":saved?.description}</p><small>定制方向：{example?"商品与供应链":saved?.direction}</small></article>
        <div className={styles.split}>
          <article className={styles.card}><h2>办理进度</h2><p>{example?"当前示例：需求评估":"本地演示：待正式提交"}</p><div className={styles.progressSteps}>{[["01","需求提交","提交业务目标和基础信息"],["02","需求评估","核对业务场景、数据条件与开发范围"],["03","确认方案与报价","明确功能范围、交付周期和费用"],["04","开发测试与交付","完成方案实施、测试与使用交付"]].map(([num,title,body],i)=><div key={num}><b>{num}</b><span><strong>{title}</strong><small>{body}</small></span><em>{example?(i===0?"已完成":i===1?"进行中":"待开始"):(i===0?"本地记录":"未开始")}</em></div>)}</div></article>
          <aside className={styles.card}><h2>现在需要做什么</h2><div className={styles.sideSteps}><p><b>01</b>{example?"当前阶段：需求评估":"当前阶段：尚未正式提交"}</p><p><b>02</b>你可以准备业务流程、规则说明与参考资料。</p><p><b>03</b>评估完成后，将确认方案、报价及交付安排。</p></div></aside>
        </div>
      </> : <div className={styles.card}><h2>暂无定制记录</h2><p>当前浏览器还没有本地演示需求；你可以提交一个演示申请，或切换查看示例。</p><button type="button" className={styles.primary} onClick={()=>route("/new")}>提交新需求</button></div>}
    </section>}

    </div>

    {pending ? <ShowcaseCustomizationConfirm draft={pending} onCancel={() => setPending(null)} onConfirm={confirm} /> : null}
  </div>;
}

function ShowcaseCustomizationConfirm({ draft, onCancel, onConfirm }: {
  draft: Submitted; onCancel: () => void; onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    return () => {
      element?.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  return <dialog ref={dialog} className={styles.confirmDialog}
    aria-labelledby="demo-confirm-title"
    onCancel={event => { event.preventDefault(); onCancel(); }}
    onClick={event => { if (event.target === event.currentTarget) onCancel(); }}>
    <h2 id="demo-confirm-title">确认保存演示需求</h2>
    <p>这次操作只在当前浏览器保存演示记录，不会向硕米平台真实提交，也不会通知专员。</p>
    <strong>{draft.name}</strong>
    <div className={styles.actions}>
      <button type="button" onClick={onCancel}>取消</button>
      <button type="button" className={styles.primary} onClick={onConfirm}>确认保存演示记录</button>
    </div>
  </dialog>;
}
