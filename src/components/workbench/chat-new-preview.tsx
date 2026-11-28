"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./chat-new-preview.module.css";
import {readPreviewProjects, createPreviewProject, savePreviewProject, projectTemplates} from "./showcase-project-data";
import {useRouter} from "next/navigation";
import {readEnabledPreviewSkills,readPersonalPreviewSkills,savePersonalPreviewSkill} from "./showcase-skill-library";
import {savePersonalKnowledge} from "./showcase-knowledge-groups";
import {savePreviewReport} from "./showcase-report-center";

// Stable mode indices are used by existing tasks, schedules and project links.
// Presentation order is independent: task creation directly follows new chat.
const modeOrder=[0,6,1,2,3,4,5];
const modes = [
  { title: "创建会话", detail: "描述目标，硕米协助整理", action: "发送消息", placeholder: "向硕米提问，或描述你想完成的任务…", examples: [["每周汇总商品适配与上传进展", "进度、阻塞问题、关键变更与待决策事项"], ["找出可以退订的邮件", "识别订阅邮件及重复通知（需邮箱授权）"], ["准备下一场会议", "梳理议题、讨论重点与待确认事项"], ["分析最近店铺经营情况", "诊断利润、广告和订单异常并提出建议"]] },
  { title: "执行定时任务", detail: "描述任务、时间和提醒要求", action: "确认定时计划", placeholder: "例如：每周一至周五上午9点，检查待审核商品，发现异常时提醒我…", examples: [["每周一生成店铺经营周报", "按周整理销售、利润和异常变化"], ["每天早上检查待审核商品", "发现积压或异常时提醒我"], ["每周提醒我复盘广告投放效果", "汇总预算、点击和转化表现"], ["每月汇总商品上新与适配进度", "整理各店铺的上新进展"]] },
  { title: "加入我的项目", detail: "协助明确项目目标与安排", action: "生成项目计划", placeholder: "例如：为美国站新品创建90天项目，分阶段安排任务和负责人…", examples: [["创建90天的跨境 OPC 创业项目", "从启动准备到阶段验证"], ["为美国站新品开发制定项目计划", "结合市场机会和开发方向"], ["将当前运营讨论关联到已有项目", "继续推进已有目标和任务"], ["为店铺季度增长建立执行项目", "拆分目标、里程碑与负责人"]] },
  { title: "加入我的知识库", detail: "描述资料用途，保存前确认", action: "整理知识条目", placeholder: "例如：把平台刊登要求整理成知识库内容，供运营团队使用…", examples: [["把商品适配规则整理成知识条目", "供后续刊登与审核时引用"], ["沉淀客服高频问题与标准回复", "整理成便于查找的规范"], ["将跨境选品培训资料加入知识库", "提炼要点并保留来源"], ["整理平台刊登要求作为知识规范", "按平台和站点归类"]] },
  { title: "保存为我的技能", detail: "描述流程和触发条件", action: "生成技能草案", placeholder: "例如：把商品标题优化流程做成可重复使用的技能…", examples: [["保存商品标题优化步骤为技能", "归纳判断标准和输出格式"], ["制作图片重构的标准操作流程", "列出检查步骤和交付要求"], ["整理商品利润测算的自动化技能", "明确成本、费用和利润口径"], ["制作店铺经营周报的自动化技能", "设定数据范围和报告结构"]] },
  { title: "加入我的报告", detail: "描述范围和周期，预览后再确认", action: "生成报告草案", placeholder: "例如：结合近30天销售、广告和利润数据生成经营分析报告…", examples: [["生成本月店铺利润分析报告", "按店铺拆分利润和变化"], ["汇总项目阶段进度与风险", "整理里程碑、延误和待办"], ["制作新品选品结果评估报告", "对照市场机会与利润目标"], ["分析各平台商品刊登效率", "汇总处理量、耗时和异常"]] },
  { title: "发起任务", detail: "描述需要执行的工作，核对后加入任务中心", action: "确认任务草案", placeholder: "例如：检查美国站商品的待补全问题，整理异常原因并提出处理建议…", examples: [["检查待补全商品", "汇总缺失信息并给出处理建议"], ["分析店铺经营问题", "结合已有资料明确待确认事项"], ["整理商品上新任务", "梳理需要处理的商品和业务范围"], ["跟进近期异常", "汇总异常原因及需要人工确认的事项"]] },
];

const resourceGroups: Record<string, string[]> = {
  我的知识库: ["跨境平台规则", "电商运营方法", "跨境合规参考", "品牌运营资料库"],
  我的技能: ["商品标题整理", "标题本地化", "冗长标题精简", "商品利润测算"],
  我的项目: ["一号店经营提升", "美国站夏季女装开发", "二号店商品内容优化", "OPC跨境创业计划"],
  我的智能体: ["商品优化智能体", "POD刊登智能体"],
  我的工具: ["商品采集工具", "表格处理工具", "邮件助手"],
  生态服务: ["品牌保护服务", "店铺开通服务"],
  我的数据: ["美国站商品数据", "店铺经营周报", "选品分析数据"],
};
const stores = [
  ["一号店", "SHEIN", "美国站", "半托管"], ["二号店", "SHEIN", "加拿大站", "全托管"],
  ["三号店", "Amazon", "美国站", "自营店"], ["新品测试店", "TikTok Shop", "美国站", "自营店"],
  ["品牌旗舰店", "Amazon", "英国站", "自营店"],
];

type Props = { onAction: (label: string) => void;organizationId?:string;memberId?:string };
type ApprovalKind = "knowledge" | "skill" | "report";
type PreviewMessage = { id: number; role: "user" | "assistant"; text: string; approval?: ApprovalKind };

export function ChatNewPreview({ onAction,organizationId="SM-ENT-000001",memberId="admin" }: Props) {
  const router=useRouter();
  const [projectEntry]=useState(()=>{const q=new URLSearchParams(typeof window==="undefined"?"":window.location.hash.split("?").slice(1).join("?"));const id=q.get("projectId");const template=projectTemplates.find(t=>t.name===q.get("projectTemplate"));const project=readPreviewProjects().find(p=>p.id===id&&p.status!=="已归档");return {mode:q.get("projectMode"),template,project}});
  const [linkedProjectId,setLinkedProjectId]=useState(projectEntry.project?.id||"");
  const [projectName,setProjectName]=useState(projectEntry.template?.name||"");
  const [skillEntry] = useState(()=>{const query=new URLSearchParams(typeof window==="undefined"?"":window.location.hash.split("?").slice(1).join("?"));const mode=query.get("skillMode");const name=query.get("skill")||"";return {mode,name}});
  const [taskEntry] = useState(()=>new URLSearchParams(typeof window==="undefined"?"":window.location.hash.split("?").slice(1).join("?")).get("taskMode"));
  const [knowledgeEntry] = useState(()=>new URLSearchParams(typeof window==="undefined"?"":window.location.hash.split("?").slice(1).join("?")).get("knowledgeMode"));
  const [reportEntry] = useState(()=>new URLSearchParams(typeof window==="undefined"?"":window.location.hash.split("?").slice(1).join("?")).get("reportMode"));
  const [modeIndex, setModeIndex] = useState(taskEntry==="task"?6:taskEntry==="scheduled"?1:reportEntry==="create"?5:knowledgeEntry==="create"?3:projectEntry.mode==="create"?2:skillEntry.mode==="create"||skillEntry.mode==="edit"?4:0);
  const [draft, setDraft] = useState(skillEntry.mode==="edit"&&readPersonalPreviewSkills(organizationId,memberId).some(s=>s.name===skillEntry.name)?"编辑技能："+skillEntry.name:projectEntry.template?projectEntry.template.description:projectEntry.project?"继续推进："+projectEntry.project.name:"");
  const [drawer, setDrawer] = useState<"resources" | "stores" | null>(null);
  const [resourceTab, setResourceTab] = useState("我的知识库");
  const [resourceSearch, setResourceSearch] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  const [storePlatform, setStorePlatform] = useState("");
  const [storeSite, setStoreSite] = useState("");
  const [storeType, setStoreType] = useState("");
  const [scheduleFrequency, setScheduleFrequency] = useState("weekly");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleWeekday, setScheduleWeekday] = useState("1");
  const [scheduleMonthday, setScheduleMonthday] = useState("1");
  const [selectedResources, setSelectedResources] = useState<string[]>(()=>{const params=new URLSearchParams(typeof window==="undefined"?"":window.location.hash.split("?").slice(1).join("?"));const linkedKnowledge=params.get("knowledgeMode")==="reference"?params.get("knowledgeName"):null;return linkedKnowledge?[linkedKnowledge]:skillEntry.mode==="reference"&&[...readEnabledPreviewSkills(organizationId,memberId),...readPersonalPreviewSkills(organizationId,memberId).map(s=>s.name)].includes(skillEntry.name)?[skillEntry.name]:projectEntry.project?[projectEntry.project.name]:[]});
  const [selectedStores, setSelectedStores] = useState<string[]>(projectEntry.project&&projectEntry.project.scope!=="通用业务"?projectEntry.project.scope.split("、"):[]);
  const [pendingResources, setPendingResources] = useState<string[]>([]);
  const [pendingStores, setPendingStores] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [confirmation, setConfirmation] = useState(false);
  const [chatActive, setChatActive] = useState(false);
  
  const [messages, setMessages] = useState<PreviewMessage[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const mode = modes[modeIndex];
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [chatActive, messages]);

  const toggle = (values: string[], value: string, setter: (v: string[]) => void) => {
    setter(values.includes(value) ? values.filter(item => item !== value) : [...values, value]);
  };
  const choosePrompt = (prompt: string) => {
    setDraft(prompt);
    document.getElementById("chat-new-prompt")?.focus();
  };
  const submit = () => {
    if (!draft.trim()) {
      onAction("先描述一下希望硕米完成的工作");
      document.getElementById("chat-new-prompt")?.focus();
      return;
    }
    if (chatActive) {
      // Work modes remain available in the same right-hand panel. Operations that
      // need confirmation must continue in this composer, even after prior turns.
      if(modeIndex===1||modeIndex===2||modeIndex===6){setConfirmation(true);return;}
      const sent = draft.trim();
      const nextId = Date.now();
      const revised = buildApprovalPreview(modeIndex, sent);
      setMessages(current => [...current, { id: nextId, role: "user", text: sent }, revised ? { ...revised, id: nextId + 1 } : { id: nextId + 1, role: "assistant", text: "已收到补充信息。我会结合「" + mode.title + "」继续完善当前内容；这是页面交互演示，不会提交到真实业务。" }]);
      setDraft("");
      onAction("演示对话已继续");
      return;
    }
    if (modeIndex === 0) {
      const sent = draft.trim();
      setMessages(current => [...current, { id: Date.now(), role: "user", text: sent }, { id: Date.now() + 1, role: "assistant", text: "收到，我会先根据你的描述梳理目标和关键信息，再继续给出建议。你可以补充细节，我会结合前面的对话继续处理。这是页面交互演示，不会提交到真实业务。" }]);
      setChatActive(true);
      setDraft("");
      onAction("演示对话已继续");
      return;
    }
    if (modeIndex === 3 || modeIndex === 4 || modeIndex === 5) {
      const sent = draft.trim();
      const nextId = Date.now();
      const preview = buildApprovalPreview(modeIndex, sent);
      if (preview) setMessages([{ id: nextId, role: "user", text: sent }, { ...preview, id: nextId + 1 }]);
      setChatActive(true);
      setDraft("");
      onAction("演示草案已生成，请在聊天中确认");
      return;
    }
    setConfirmation(true);
  };
  const visibleResources = (resourceTab==="我的项目"?readPreviewProjects().filter(p=>p.status!=="已归档").map(p=>p.name):resourceTab==="我的技能"?[...readEnabledPreviewSkills(organizationId,memberId),...readPersonalPreviewSkills(organizationId,memberId).map(s=>s.name)]:resourceGroups[resourceTab] ?? []).filter(item => item.toLowerCase().includes(resourceSearch.toLowerCase()));
  const visibleStores = stores.filter(row =>
    row.join(" ").toLowerCase().includes(storeSearch.toLowerCase()) &&
    (!storePlatform || row[1] === storePlatform) &&
    (!storeSite || row[2] === storeSite) &&
    (!storeType || row[3] === storeType)
  );
  const weekdayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const scheduleDescription = scheduleFrequency === "daily"
    ? "每天 " + scheduleTime
    : scheduleFrequency === "weekly"
      ? "每" + weekdayNames[Number(scheduleWeekday)] + " " + scheduleTime
      : "每月 " + scheduleMonthday + " 日 " + scheduleTime;
  const startNewConversation = () => { setChatActive(false); setMessages([]); setDraft(""); setConfirmation(false); setModeIndex(0); setSelectedResources([]); setSelectedStores([]); setFiles([]); setLinkedProjectId("");setProjectName(""); };
  const buildApprovalPreview = (index: number, request: string): Omit<PreviewMessage, "id"> | null => {
    if (index === 3) return {
      role: "assistant",
      approval: "knowledge",
      text: ["【知识条目草案】", "主题：" + request, "整理内容：已根据你的描述归纳为可检索的知识条目。", "引用资料：" + (selectedResources.length ? selectedResources.join("、") : "由硕米自动匹配"), "当前状态：待确认加入我的知识库", "本页为交互演示，确认后不会写入真实知识库。"].join("\n"),
    };
    if (index === 4) return {
      role: "assistant",
      approval: "skill",
      text: ["【技能草案】", "技能目标：" + request, "执行步骤：明确输入 → 按规则处理 → 检查结果 → 输出内容", "关联资源：" + (selectedResources.length ? selectedResources.join("、") : "由硕米自动匹配"), "当前状态：待确认保存为我的技能", "本页为交互演示，确认后不会创建真实技能。"].join("\n"),
    };
    if (index === 5) return {
      role: "assistant",
      approval: "report",
      text: ["【经营报告草案】", "报告主题：" + request, "统计范围：" + (selectedStores.length ? selectedStores.join("、") : "全部关联店铺") + " · 近30天", "报告章节：经营概览、销售与利润表现、异常变化及建议", "当前状态：待确认加入我的报告", "本页为交互演示，不含真实业务数据；确认后会保存演示报告草案。"].join("\n"),
    };
    return null;
  };
  const handleApproval = (message: PreviewMessage, confirm: boolean) => {
    if (!message.approval) return;
    const labels: Record<ApprovalKind, string> = { knowledge: "知识库", skill: "技能", report: "报告" };
    const label = labels[message.approval];
    if(confirm&&message.approval==="report"){
      const title=message.text.split("\n").find(line=>line.startsWith("报告主题："))?.slice(5).trim();
      if(title){try{
        const saved=savePreviewReport(organizationId,memberId,title,"报告需求："+title+"。当前仅生成演示结构与待确认事项，没有检索或分析真实业务数据。",linkedProjectId||undefined);
        if(!saved){onAction("报告主题为空，未保存演示报告");return;}
      }catch{onAction("报告演示数据保存失败，请检查浏览器存储权限");return}}
    }
    if(confirm&&message.approval==="report"&&linkedProjectId){const p=readPreviewProjects().find(p=>p.id===linkedProjectId&&p.status!=="已归档");const name=message.text.split("\n").find(x=>x.startsWith("报告主题："))?.slice(5).trim();if(p&&name){try{savePreviewProject({...p,reports:[...p.reports,name],updated:Date.now()})}catch{onAction("本地成果保存失败");return}}}
    if(confirm&&message.approval==="knowledge"){
      const name=message.text.split("\n").find(line=>line.startsWith("主题：")||line.startsWith("整理主题："))?.replace(/^(主题：|整理主题：)/,"").trim();
      if(name){try{savePersonalKnowledge(organizationId,memberId,name,"经硕米Chat确认保存的演示知识条目，可在我的知识库中分组管理。")}catch{onAction("知识库演示记录保存失败");return}}
    }
    if(confirm&&message.approval==="skill"){const goal=message.text.split("\n").find(line=>line.startsWith("技能目标："))?.slice(5).trim();if(goal)savePersonalPreviewSkill({name:skillEntry.mode==="edit"&&skillEntry.name?skillEntry.name:goal,description:goal},organizationId,memberId);}
    setMessages(current => current.map(item => item.id === message.id ? { ...item, approval: undefined } : item).concat({
      id: Date.now(),
      role: "assistant",
      text: confirm ? "已在本次演示中确认加入" + label + "。你可以继续补充内容；此操作不会写入真实业务数据。" : "好的，请在下方告诉我需要调整的内容，我会更新这份" + label + "草案。",
    }));
    onAction(confirm ? "演示确认加入" + label : "继续修改" + label + "草案");
  };
  const confirmAction = () => {
    const request = draft.trim();
    const storeLabel = selectedStores.length ? selectedStores.join("、") : "未指定店铺";
    const resourceLabel = selectedResources.length ? selectedResources.join("、") : "由硕米自动匹配";
    if(modeIndex===6){
      try{
        const key="shuomi-task-center-demo-v1";
        const existing=JSON.parse(sessionStorage.getItem(key)||"[]");
        const rows=Array.isArray(existing)?existing:[];
        const item={id:crypto.randomUUID(),name:request.slice(0,60),description:"通过硕米Chat创建的任务草案，待人工确认执行",scope:selectedStores.join("、")||"通用业务",state:"pending",time:"刚刚创建"};
        sessionStorage.setItem(key,JSON.stringify([item,...rows]));
        setMessages(current=>[...current,{id:Date.now(),role:"user",text:request},{id:Date.now()+1,role:"assistant",text:"已保存任务草案至任务中心「待确认」。当前仅为本地演示数据，尚未实际执行。可前往任务中心查看并确认。"}]);
        setChatActive(true);setConfirmation(false);setDraft("");onAction("任务草案已加入任务中心待确认（演示）");return;
      }catch{onAction("演示任务保存失败，请检查浏览器存储权限");return;}
    }
    if(modeIndex===2){
      if(linkedProjectId){onAction("当前会话已经关联项目，请继续描述工作或新建会话。");setConfirmation(false);return;}
      if(!projectName.trim()){onAction("请填写项目名称");return;}
      try{const p=createPreviewProject({name:projectName,goal:request,scope:selectedStores.join("、"),template:projectEntry.template?.name,resources:selectedResources});setLinkedProjectId(p.id);setSelectedResources(old=>[...new Set([...old,p.name])]);setMessages(current=>[...current,{id:Date.now(),role:"user",text:request},{id:Date.now()+1,role:"assistant",text:"已创建本地演示项目："+p.name+"。当前会话已关联该项目，可返回项目中心查看目标、里程碑及进展。"}]);setConfirmation(false);setChatActive(true);setModeIndex(0);setDraft("");return;}catch{onAction("本地项目保存失败，请检查浏览器存储权限");return;}
    }
    const replyByMode = [
      "",
      ["【定时任务演示草案】", "任务：" + request, "执行安排：" + scheduleDescription, "监控范围：" + storeLabel, "你可以继续补充时间、频率或异常提醒规则。"].join("\n"),
      ["【项目计划演示草案】", "项目目标：" + request, "关联范围：" + storeLabel, "建议下一步：拆分阶段目标、里程碑和负责人。"].join("\n"),
      ["【知识条目演示草案】", "整理主题：" + request, "参考资料：" + resourceLabel, "内容已整理为待校对草案，可继续补充来源和适用范围。"].join("\n"),
      ["【技能演示草案】", "技能目标：" + request, "关联资源：" + resourceLabel, "建议补充触发条件、执行步骤和验收标准。"].join("\n"),
      ["【经营报告演示草案】", "报告需求：" + request, "店铺范围：" + storeLabel, "报告结构：经营概览、销售与利润表现、异常变化及建议。"].join("\n"),
    ];
    setMessages(current=>[...current,{ id: Date.now(), role: "user", text: request }, { id: Date.now() + 1, role: "assistant", text: replyByMode[modeIndex] }]);
    setConfirmation(false);
    setChatActive(true);
    setDraft("");
    onAction(mode.action + " · 演示草案已生成");
  };

  return <div className={styles.workspace} data-chat-active={chatActive}>
      <section className={styles.composer} aria-label={chatActive ? "会话消息与输入区" : "新建会话输入区"} data-conversation-composer="stable">
        <header className={styles.composerIntro}><div><h2>有什么想交给硕米？</h2><p>{chatActive ? "当前会话的消息和处理结果在这里继续显示，不切换页面。" : "直接描述问题或工作目标，硕米协助整理并回复。"}</p></div>{chatActive && <button className={styles.newConversation} onClick={startNewConversation}>＋ 新会话</button>}</header>
        <div className={styles.thread} ref={threadRef} aria-label="聊天记录" aria-live="polite">{!chatActive && !confirmation && <p className={styles.threadEmpty}>在下方输入需求，消息和处理结果会持续显示在这里。</p>}{messages.map(item => <article key={item.id} className={item.role === "user" ? styles.userTurn : styles.assistantTurn}><span>{item.role === "user" ? "我" : "硕米 · 演示回复"}</span><p>{item.text}</p>{item.approval && <div className={styles.approvalActions}><span>草案已生成，请确认是否加入</span><div><button className={styles.approveButton} onClick={() => handleApproval(item, true)}>{item.approval === "knowledge" ? "确认加入知识库" : item.approval === "skill" ? "确认保存技能" : "确认加入报告"}</button><button onClick={() => handleApproval(item, false)}>继续修改</button></div></div>}</article>)}
        {confirmation && <section className={styles.inlineConfirmation} aria-label="会话内确认任务">
        <header><div><h2 id="chat-confirm-title">确认{mode.title}</h2><p>请核对当前内容和关联范围，再继续下一步。</p></div><button aria-label="关闭" onClick={() => setConfirmation(false)}>×</button></header>
        {modeIndex === 1 && <section className={styles.scheduleFields} aria-label="定时安排">
          <label><span>执行频率</span><select value={scheduleFrequency} onChange={event => setScheduleFrequency(event.target.value)}><option value="daily">每天</option><option value="weekly">每周</option><option value="monthly">每月</option></select></label>
          {scheduleFrequency === "weekly" && <label><span>执行星期</span><select value={scheduleWeekday} onChange={event => setScheduleWeekday(event.target.value)}>{weekdayNames.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label>}
          {scheduleFrequency === "monthly" && <label><span>每月几号</span><select value={scheduleMonthday} onChange={event => setScheduleMonthday(event.target.value)}>{Array.from({ length: 28 }, (_, index) => String(index + 1)).map(day => <option key={day} value={day}>{day} 日</option>)}</select></label>}
          <label><span>执行时间</span><input type="time" value={scheduleTime} onChange={event => setScheduleTime(event.target.value)} /></label>
          <p>确认后会生成定时任务演示草案，不会真实创建任务。</p>
        </section>}
        {modeIndex===2&&<section className={styles.scheduleFields}><label><span>项目名称</span><input aria-label="项目名称" value={projectName} onChange={e=>setProjectName(e.target.value)} placeholder="请输入项目名称" required/></label>{projectEntry.template&&<p>项目模板：{projectEntry.template.name}</p>}<p>确认后保存本地演示项目并自动关联会话。</p></section>}
        <div className={styles.confirmSummary}>{modeIndex === 1 && <><span>执行安排</span><strong>{scheduleDescription}</strong></>}<span>执行方式</span><strong>{mode.title}</strong><span>工作内容</span><p>{draft}</p><span>关联店铺</span><p>{selectedStores.length ? selectedStores.join("、") : "未关联店铺"}</p><span>引用资源</span><p>{selectedResources.length ? selectedResources.join("、") : "由硕米自动匹配"}</p></div>
        <footer className={styles.drawerFooter}><button onClick={() => setConfirmation(false)}>返回修改</button><button className={styles.primary} onClick={confirmAction}>确认并继续</button></footer>
        </section>}
        </div>
        <label className={styles.srOnly} htmlFor="chat-new-prompt">描述你的业务目标</label>
        <textarea id="chat-new-prompt" maxLength={2000} value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); submit(); } }} placeholder={modeIndex===0?"向硕米提问，或描述你想完成的任务…":mode.placeholder} />
        {(selectedResources.length > 0 || selectedStores.length > 0 || files.length > 0) && <div className={styles.selectedTags}>
          {selectedStores.map(item => <span key={`store-${item}`}>店铺 · {item}<button aria-label={`移除${item}`} onClick={() => setSelectedStores(selectedStores.filter(value => value !== item))}>×</button></span>)}
          {selectedResources.map(item => <span key={`resource-${item}`}>资源 · {item}<button aria-label={`移除${item}`} onClick={() => setSelectedResources(selectedResources.filter(value => value !== item))}>×</button></span>)}
          {files.map(item => <span key={`file-${item}`}>资料 · {item}<button aria-label={`移除${item}`} onClick={() => setFiles(files.filter(value => value !== item))}>×</button></span>)}
        </div>}
        <input ref={fileInput} className={styles.srOnly} type="file" multiple onChange={event => {
          const next = Array.from(event.target.files ?? []).map(file => file.name);
          setFiles(current => [...current, ...next]);
          event.target.value = "";
        }} />
        <footer className={styles.composerFooter}>
          <div className={styles.composerTools}>
            <button className={styles.iconButton} aria-label="上传资料" title="上传资料" onClick={() => fileInput.current?.click()}>＋</button>
            <button onClick={() => { setPendingResources(selectedResources); setDrawer("resources"); }}>资源与能力</button>
            <button onClick={() => { setPendingStores(selectedStores); setDrawer("stores"); }}>关联店铺{selectedStores.length ? ` · ${selectedStores.length}` : ""}</button>
          </div>
          <div className={styles.sendGroup}><button className={styles.primary} onClick={submit}>{modeIndex===0?"发送消息":mode.action}</button></div>
        </footer>
      </section>
      <aside className={styles.modePanel} aria-label="选择执行方式">
        <><section className={styles.modePicker}><header className={styles.modePickerIntro}><h2>选择工作方式</h2><p>选择最符合当前需求的入口</p></header><div className={styles.modeList}>{modeOrder.map(index => {const item=modes[index];return <button key={item.title} className={index === modeIndex ? styles.modeSelected : ""} onClick={() => {setModeIndex(index);setConfirmation(false)}} aria-pressed={index === modeIndex}>
          <i data-tone={index} /><span><strong>{item.title}</strong></span>
        </button>})}</div></section><section className={styles.examples}>
        <header><h2>试试这样说</h2><span>·</span><p>点击示例可放入输入区</p></header>
        <div>{mode.examples.map(([title, detail], index) => <button key={title} onClick={() => choosePrompt(title)}>
          <b data-tone={index}>0{index + 1}</b><span><strong>{title}</strong><small>{detail}</small></span>
        </button>)}</div>
      </section></>
      </aside>

    {drawer && <div className={styles.overlay} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setDrawer(null); }}>
      <section className={styles.drawer} role="dialog" aria-modal="true" aria-labelledby="chat-drawer-title">
        <header><div><h2 id="chat-drawer-title">{drawer === "resources" ? "选择资源与能力" : "关联店铺"}</h2><p>{drawer === "resources" ? "按需添加到当前会话；未选择时由硕米自动匹配。" : "选择业务范围，硕米将只使用所选店铺的数据。"}</p></div><button aria-label="关闭" onClick={() => setDrawer(null)}>×</button></header>
        {drawer === "resources" ? <>
          <nav className={styles.resourceTabs}>{Object.keys(resourceGroups).map(tab => <button key={tab} className={resourceTab === tab ? styles.tabSelected : ""} onClick={() => { setResourceTab(tab); setResourceSearch(""); }}>{tab}</button>)}</nav>
          <div className={styles.drawerSearch}><input value={resourceSearch} onChange={event => setResourceSearch(event.target.value)} placeholder="搜索资源名称或关键词"/><span>{visibleResources.length} 项</span></div>
          <div className={styles.resourceList}>{visibleResources.map((item, index) => <label key={item}><input type="checkbox" checked={pendingResources.includes(item)} onChange={() => toggle(pendingResources, item, setPendingResources)}/><span><strong>{item}</strong><small>{resourceTab} · 可在当前会话中引用</small></span><b data-tone={index}>可用</b></label>)}</div>
          <footer className={styles.drawerFooter}><span>已选择 {pendingResources.length} 项</span><button onClick={() => setPendingResources([])}>清空</button><button className={styles.primary} onClick={() => { setSelectedResources(pendingResources); setDrawer(null); }}>确认引用</button></footer>
        </> : <>
          <div className={styles.storeFilters}><select aria-label="平台" value={storePlatform} onChange={event => setStorePlatform(event.target.value)}><option value="">全部平台</option><option>SHEIN</option><option>Amazon</option><option>TikTok Shop</option></select><select aria-label="站点" value={storeSite} onChange={event => setStoreSite(event.target.value)}><option value="">全部站点</option><option>美国站</option><option>加拿大站</option><option>英国站</option></select><select aria-label="店铺类型" value={storeType} onChange={event => setStoreType(event.target.value)}><option value="">全部类型</option><option>自营店</option><option>半托管</option><option>全托管</option></select></div>
          <div className={styles.drawerSearch}><input value={storeSearch} onChange={event => setStoreSearch(event.target.value)} placeholder="搜索店铺名称"/><span>{visibleStores.length} 家</span></div>
          <div className={styles.storeList}>{visibleStores.map(row => <label key={row[0]}><input type="checkbox" checked={pendingStores.includes(row[0])} onChange={() => toggle(pendingStores, row[0], setPendingStores)}/><span><strong>{row[0]}</strong><small>{row[1]} · {row[2]} · {row[3]}</small></span><i>正常</i></label>)}</div>
          <footer className={styles.drawerFooter}><span>已选择 {pendingStores.length} 家店铺</span><button onClick={() => { setPendingStores([]); setStorePlatform(""); setStoreSite(""); setStoreType(""); setStoreSearch(""); }}>重置</button><button className={styles.primary} onClick={() => { setSelectedStores(pendingStores); setDrawer(null); }}>确认关联</button></footer>
        </>}
      </section>
    </div>}



  </div>;
}
