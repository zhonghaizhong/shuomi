"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./chat-new-preview.module.css";
import {readPreviewProjects, createPreviewProject, savePreviewProject, projectTemplates} from "./showcase-project-data";
import {readEnabledPreviewSkills,readPersonalPreviewSkills,savePersonalPreviewSkill} from "./showcase-skill-library";
import {savePersonalKnowledge,readKnowledgeState} from "./showcase-knowledge-groups";
import {savePreviewReport,readPreviewReports} from "./showcase-report-center";

// Stable mode indices are used by existing tasks, schedules and project links.
// Presentation order is independent: task creation directly follows new chat.
const modeOrder=[0,6,1,2,3,4,5];
const modes = [
  { title: "创建会话", detail: "描述目标，硕米协助整理", action: "发送消息", placeholder: "向硕米提问，或描述你想完成的任务…", examples: [["每周汇总商品适配与上传进展", "进度、阻塞问题、关键变更与待决策事项"], ["找出可以退订的邮件", "识别订阅邮件及重复通知（需邮箱授权）"], ["准备下一场会议", "梳理议题、讨论重点与待确认事项"], ["分析最近店铺经营情况", "诊断利润、广告和订单异常并提出建议"]] },
  { title: "执行定时任务", detail: "描述任务、时间和提醒要求", action: "确认定时计划", placeholder: "例如：每周一至周五上午9点，检查待审核商品，发现异常时提醒我…", examples: [["每周一生成店铺经营周报", "按周整理销售、利润和异常变化"], ["每天早上检查待审核商品", "发现积压或异常时提醒我"], ["每周提醒我复盘广告投放效果", "汇总预算、点击和转化表现"], ["每月汇总商品上新与适配进度", "整理各店铺的上新进展"]] },
  { title: "加入我的项目", detail: "协助明确项目目标与安排", action: "生成项目计划", placeholder: "例如：为美国站新品创建90天项目，分阶段安排任务和负责人…", examples: [["创建SHEIN美国站30天利润提升项目", "关联经营分析、任务和阶段报告"], ["为美国站新品开发制定项目计划", "结合市场机会和开发方向"], ["将当前运营讨论关联到已有项目", "继续推进已有目标和任务"], ["为店铺季度增长建立执行项目", "拆分目标、里程碑与负责人"]] },
  { title: "加入我的知识库", detail: "描述资料用途，保存前确认", action: "整理知识条目", placeholder: "例如：把平台刊登要求整理成知识库内容，供运营团队使用…", examples: [["把商品适配规则整理成知识条目", "供后续刊登与审核时引用"], ["沉淀客服高频问题与标准回复", "整理成便于查找的规范"], ["将跨境选品培训资料加入知识库", "提炼要点并保留来源"], ["整理平台刊登要求作为知识规范", "按平台和站点归类"]] },
  { title: "保存为我的技能", detail: "描述流程和触发条件", action: "生成技能草案", placeholder: "例如：把商品标题优化流程做成可重复使用的技能…", examples: [["保存商品标题优化步骤为技能", "归纳判断标准和输出格式"], ["制作图片重构的标准操作流程", "列出检查步骤和交付要求"], ["整理商品利润测算的自动化技能", "明确成本、费用和利润口径"], ["制作店铺经营周报的自动化技能", "设定数据范围和报告结构"]] },
  { title: "加入我的报告", detail: "描述范围和周期，预览后再确认", action: "生成报告草案", placeholder: "例如：结合近30天销售、广告和利润数据生成经营分析报告…", examples: [["生成本月店铺利润分析报告", "按店铺拆分利润和变化"], ["汇总项目阶段进度与风险", "整理里程碑、延误和待办"], ["制作新品选品结果评估报告", "对照市场机会与利润目标"], ["分析各平台商品刊登效率", "汇总处理量、耗时和异常"]] },
  { title: "发起任务", detail: "描述需要执行的工作，核对后加入任务中心", action: "确认任务草案", placeholder: "例如：检查美国站商品的待补全问题，整理异常原因并提出处理建议…", examples: [["检查待补全商品", "汇总缺失信息并给出处理建议"], ["分析店铺经营问题", "结合已有资料明确待确认事项"], ["整理商品上新任务", "梳理需要处理的商品和业务范围"], ["跟进近期异常", "汇总异常原因及需要人工确认的事项"]] },
];

type ModeGuide={heading:string;summary:string;steps:[string,string,string];outcome:string;destination:string;url:string};
const modeGuides:Partial<Record<number,ModeGuide>>={
 0:{heading:"创建会话有什么作用？",summary:"直接向硕米描述目标，持续讨论，按需引用业务资源和店铺数据；会话只是协作入口，不代表任务已经自动执行。",steps:["在固定输入框描述目标或问题","根据需要引用资源并持续补充信息","确认具体业务草案，再从对应模块查看成果"],outcome:"保留本次对话及需要确认的草案；当前演示不执行外部操作。",destination:"当前会话",url:"/workbench/ai/chat"},
 1:{heading:"定时任务如何运行？",summary:"根据指定频率、时间与执行范围创建定时计划。正式运行需有后台调度器、有效授权及可用执行能力。",steps:["描述任务、选择频率与执行时间","核对任务权限、执行条件和通知方式","到时按授权执行，异常或重要操作请求确认"],outcome:"生成待确认的定时计划；当前演示不会在后台自动执行。",destination:"任务中心 · 定时任务",url:"/workbench/ai/tasks/scheduled"},
 6:{heading:"发起任务后如何执行？",summary:"任务中心负责管理待确认、执行中、异常及已完成事项，可在授权后调用具体智能体与工具。",steps:["描述任务目标、范围和交付标准","审查并确认任务草案及权限","在任务中心跟踪结果、异常和后续处理"],outcome:"生成待确认的任务记录；当前演示不会自动调用真实业务接口。",destination:"任务中心",url:"/workbench/ai/tasks"},
 2:{heading:"项目是什么？创建后怎么推进？",summary:"项目是一个长期目标的工作空间，用来集中管理目标、阶段进度、关联资料和成果。它不是点击创建后就自动执行全部工作。",
  steps:["描述目标并创建项目","围绕里程碑在当前会话中拆分、发起任务","在项目中心查看进度与报告，具体执行和确认在任务中心进行"],
  outcome:"得到项目名称、目标、阶段里程碑和关联资源；当前演示先保存项目记录，具体任务须另行发起。",destination:"进行中项目",url:"/workbench/ai/projects/active?preview=1"},
 3:{heading:"知识库是什么？建好后怎么用？",summary:"知识库保存平台规则、业务资料和可复用的知识条目，供后续会话或智能体引用，不会自行执行任务。",
  steps:["描述要沉淀的知识与资料来源","核对内容后保存到我的知识库","在资源与能力中选择知识库，让后续会话或任务参考"],
  outcome:"得到可管理的知识条目；演示内容不代表已检索或验证真实平台资料。",destination:"我的知识库",url:"/workbench/ai/knowledge/mine"},
 4:{heading:"技能是什么？保存后怎么执行？",summary:"技能是可重复使用的操作方法，描述适用场景、输入要求、处理步骤及结果标准；单独保存并不会自动运行。",
  steps:["描述希望复用的业务流程","确认触发条件、步骤及验收标准并保存","在资源与能力中引用技能，结合具体任务执行"],
  outcome:"得到一项我的技能；使用时需明确任务与所需资料，当前为交互演示。",destination:"我的技能",url:"/workbench/agents/skills/mine"},
 5:{heading:"报告是什么？生成后去哪查看？",summary:"报告用于整理分析结论和阶段成果，可查看、收藏及关联项目；需要明确分析范围与数据来源。",
  steps:["描述报告主题、时间和数据范围","核对草案后确认保存","在我的报告中查看、收藏或关联项目继续复盘"],
  outcome:"得到演示报告草案；未接入真实数据时不会假称已完成实际经营分析。",destination:"我的报告",url:"/workbench/ai/reports"}
};

const resourceGroups: Record<string, string[]> = {
  我的知识库: [],
  我的技能: [],
  我的项目: [],
  我的智能体: ["商品优化智能体", "POD刊登智能体"],
  我的工具: ["商品采集插件", "自有商品快速上传", "POD素材管理工具"],
  生态服务: [],
  我的数据: [],
  我的报告: [],
};
const stores = [
  ["一号店", "SHEIN", "美国站", "半托管"], ["二号店", "SHEIN", "加拿大站", "全托管"],

];

type Props = { organizationId?:string;memberId?:string };
type ApprovalKind = "knowledge" | "skill" | "report";
type OutcomeSection={heading:string;content:string};
type OutcomeJobStatus="waiting"|"running"|"ready"|"blocked"|"failed";
type PreviewMessage = { id: number; role: "user" | "assistant"; text: string; approval?: ApprovalKind; jobId?:string; jobStatus?:OutcomeJobStatus; outcomeSections?:OutcomeSection[] };
type SavedChat={messages:PreviewMessage[];chatActive:boolean};
const outcomeApi=(process.env.NEXT_PUBLIC_SHUOMI_OUTCOME_API||(typeof window!=="undefined"?document.querySelector<HTMLMetaElement>('meta[name="shuomi-outcome-api"]')?.content:"")||"").replace(/\/$/,"");
function chatStorageKey(organizationId:string,memberId:string){return "shuomi-chat-outcomes-v2:"+organizationId+":"+memberId}
function readChatState(key:string):SavedChat|null{if(typeof window==="undefined")return null;try{const raw=localStorage.getItem(key);if(!raw)return null;const value=JSON.parse(raw) as SavedChat;if(!Array.isArray(value.messages))return null;return {messages:value.messages.filter(m=>m&&typeof m.id==="number"&&(m.role==="user"||m.role==="assistant")),chatActive:Boolean(value.chatActive)}}catch{return null}}
function validSections(value:unknown):OutcomeSection[]|null{if(!Array.isArray(value)||!value.length)return null;const sections=value.filter((s):s is OutcomeSection=>Boolean(s&&typeof s.heading==="string"&&typeof s.content==="string"&&s.heading.trim()&&s.content.trim()));return sections.length===value.length?sections:null}



// Each preview is based on the actual generated draft text. Missing business data stays
// explicitly unverified; a display-only preview must never invent analysis or execution.
function draftField(text:string, label:string) {
  return text.split("\n").find(line=>line.startsWith(label+"："))?.slice(label.length+1).trim()||"";
}
function previewSections(message:PreviewMessage):{heading:string;content:string}[] {
  if(message.outcomeSections?.length)return message.outcomeSections;
  const kind=message.approval;
  if(kind==="report"){
    const title=draftField(message.text,"报告主题")||"未命名报告";
    const scope=draftField(message.text,"统计范围")||"范围尚未确定";
    return [
      {heading:"报告摘要",content:"本报告围绕「"+title+"」展开。当前仅有报告需求和章节规划，尚无经核实的经营数据，因此不能提供销售额、利润或趋势结论。"},
      {heading:"一、研究范围与数据来源",content:"主题："+title+"\n统计范围："+scope+"\n数据来源：未接入或未经核验；正式分析前需确认数据集和统计口径。"},
      {heading:"二、经营概览",content:"待生成：经营指标汇总、同比或环比变化。当前没有可靠指标，暂不绘制图表。"},
      {heading:"三、销售与利润分析",content:"待生成：销售构成、订单、费用、利润、净利率及对应的数据表。"},
      {heading:"四、异常与风险",content:"待生成：基于真实经营数据定位异常、说明影响范围与证据。"},
      {heading:"五、结论和行动建议",content:"待分析完成后填写；任何建议均应对应可追溯的数据和判断依据。"}
    ];
  }
  if(kind==="skill"){
    const goal=draftField(message.text,"技能目标")||"待明确技能目标";
    const resource=draftField(message.text,"关联资源")||"未关联";
    const image=/图片|重构|主图|详情图|图像/.test(goal);
    const profit=/利润|成本|定价|核价/.test(goal);
    const steps=image
      ?["接收原图与目标图片规格，确认商品及颜色变体","识别商品主体和原始素材，标记模糊、缺失或不一致信息","按照确认的尺寸、背景、语言和构图规则重构图片","逐张检查主体完整性、颜色一致性和图片规格","输出重构图片、逐张检查结果与需要人工确认的问题"]
      :profit
      ?["接收售价、采购成本、运费及适用费用项目","检查币种、税费口径、缺失成本与适用平台","按经确认的公式计算利润和利润率","校验异常值并列出无法计算的项目","输出计算表、关键假设和需要复核的数据"]
      :["接收任务输入并校验完整性","读取已明确的业务规则和授权资源","依照确认的操作规则处理内容","按验收标准检查并记录异常","输出结果、执行记录及待人工确认事项"];
    return [
      {heading:"一、技能目标与适用场景",content:goal+"\n适用范围：以用户确认的需求为准。"},
      {heading:"二、输入参数",content:image?"原始图片（必填）；目标尺寸、背景、语言、变体与输出数量（待确认）。":profit?"售价、成本、费用、币种与计算口径（待确认）。":"任务输入、所需资料、输出格式和触发条件（待补充）。"},
      {heading:"三、执行流程（待审核草案）",content:steps.map((step,i)=>String(i+1)+". "+step).join("\n")},
      {heading:"四、关联资源与权限",content:"当前关联："+resource+"\n调用前需要核对资源实际可用性和访问授权。"},
      {heading:"五、输出及验收规则",content:image?"输出：逐张重构图片和检查结果；验收：图片规格、主体完整、商品颜色及变体一致。":profit?"输出：明细计算表、利润率及假设；验收：数据完整、计算口径一致、可复算。":"输出：结构化处理结果、异常清单及执行记录；具体验收阈值仍需确认。"},
      {heading:"六、异常与执行边界",content:"缺少关键输入或必要权限时中止相应操作并请求确认。此处展示的是可审核的流程草案，并非已接入的自动执行程序。"}
    ];
  }
  const title=draftField(message.text,"主题")||"未命名知识条目";
  return [
    {heading:"知识条目",content:title},
    {heading:"正文内容",content:"当前只收到知识整理主题，尚未提供经过核验的知识正文。请补充资料或原文后再整理具体条目。"},
    {heading:"引用资料",content:draftField(message.text,"引用资料")||"未提供来源"},
    {heading:"检索与引用方式",content:"保存后可在知识库管理并供后续会话引用；来源、适用范围和版本需随实际资料补全。"}
  ];
}

export function ChatNewPreview({ organizationId="SM-ENT-000001",memberId="admin" }: Props) {
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
  const [chatActive, setChatActive] = useState(()=>Boolean(readChatState(chatStorageKey(organizationId,memberId))?.chatActive));
  
  const storageKey=chatStorageKey(organizationId,memberId);
  const [messages, setMessages] = useState<PreviewMessage[]>(()=>readChatState(storageKey)?.messages||[]);

  const [feedback,onAction]=useState("");
  const [guideFor,setGuideFor]=useState<number|null>(null);
  const [expandedDraftId,setExpandedDraftId]=useState<number|null>(null);
  const [confirmDetailsOpen,setConfirmDetailsOpen]=useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const mode = modes[modeIndex];
  const modeGuide=guideFor===null?null:modeGuides[guideFor];
  const jobMessages=messages.filter(message=>message.jobId&&message.jobStatus!=="ready"&&message.jobStatus!=="failed"&&message.jobStatus!=="blocked");
  useEffect(()=>{try{localStorage.setItem(storageKey,JSON.stringify({messages:messages.slice(-100),chatActive}))}catch{/* Browser storage may be disabled. */}},[storageKey,messages,chatActive]);
  // A configured service owns the work, and is polled by job id. Closing the dialog
  // does not cancel it; after reload the persisted job ids can be checked again.
  useEffect(()=>{
    if(!outcomeApi||!jobMessages.length)return;
    let stopped=false;
    const check=async()=>{
      for(const msg of jobMessages){
        if(stopped||!msg.jobId)break;
        try{
          const response=await fetch(outcomeApi+"/"+encodeURIComponent(msg.jobId),{headers:{"Accept":"application/json"},cache:"no-store"});
          if(!response.ok)throw new Error("HTTP "+response.status);
          const result=await response.json() as {status?:string;sections?:unknown;error?:string};
          if(stopped)return;
          if(result.status==="completed"){
            const sections=validSections(result.sections);
            setMessages(current=>current.map(m=>m.id===msg.id?{...m,jobStatus:sections?"ready":"failed",outcomeSections:sections||undefined,text:sections?"完整成果已生成，可以打开预览并审核。":"生成服务未返回完整成果，无法确认保存。"}:m));
          }else if(result.status==="failed"){
            setMessages(current=>current.map(m=>m.id===msg.id?{...m,jobStatus:"failed",text:"成果生成失败："+(result.error||"请稍后重试。")}:m));
          }else if(result.status==="running"){
            setMessages(current=>current.map(m=>m.id===msg.id&&m.jobStatus!=="running"?{...m,jobStatus:"running",text:"正在生成具体内容。可关闭弹窗，任务由生成服务继续处理。"}:m));
          }
        }catch{/* Temporary polling failure must not discard an existing server job. */}
      }
    };
    void check();
    const interval=window.setInterval(()=>{void check()},10000);
    return()=>{stopped=true;window.clearInterval(interval)};
  // Depend only on the pending id list to avoid restarting polling on status text changes.
  },[jobMessages.map(m=>m.jobId).join("|")]);
  const requestOutcome=async(index:number,request:string)=>{
    const kind:ApprovalKind=index===3?"knowledge":index===4?"skill":"report";
    const id=Date.now()+1;
    const title=kind==="skill"?"技能":kind==="report"?"报告":"知识条目";
    const input:PreviewMessage={id:id-1,role:"user",text:request};
    const placeholder:PreviewMessage={id,role:"assistant",approval:kind,jobStatus:"waiting",text:"已收到"+title+"生成请求，准备提交生成服务。"};
    setMessages(current=>[...current,input,placeholder]);
    setChatActive(true);setDraft("");
    if(!outcomeApi){
      setMessages(current=>current.map(m=>m.id===id?{...m,jobStatus:"blocked",text:"生成请求已保存在当前浏览器，但尚未配置服务端成果生成服务；没有实际启动后台生成，也没有可审核成果。"}:m));
      return;
    }
    try{
      const response=await fetch(outcomeApi,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind,prompt:request,organizationId,memberId,stores:selectedStores,resources:selectedResources})});
      if(!response.ok)throw new Error("HTTP "+response.status);
      const data=await response.json() as {jobId?:string};
      if(!data.jobId)throw new Error("未返回任务编号");
      setMessages(current=>current.map(m=>m.id===id?{...m,jobId:data.jobId,jobStatus:"running",text:"服务端已接收生成任务。可关闭弹窗或切换页面，完成后在此查看具体内容。"}:m));
    }catch(error){
      setMessages(current=>current.map(m=>m.id===id?{...m,jobStatus:"failed",text:"未能启动后台生成："+String(error instanceof Error?error.message:error)+"。请检查生成服务。"}:m));
    }
  };

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [chatActive, messages, feedback, confirmation]);

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
      if(modeIndex===1||modeIndex===2||modeIndex===6){setConfirmDetailsOpen(false);setConfirmation(true);return;}
      const sent = draft.trim();
      const nextId = Date.now();
      if(modeIndex===3||modeIndex===4||modeIndex===5){void requestOutcome(modeIndex,sent);return;}
      setMessages(current => [...current,{id:nextId,role:"user",text:sent},{id:nextId+1,role:"assistant",text:"已收到补充信息，当前为页面交互演示。"}]);
      setDraft("");return;
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
      void requestOutcome(modeIndex,sent);
      return;
    }
    setConfirmation(true);
  };
  const visibleResources = (
    resourceTab==="我的项目" ? readPreviewProjects().map(p=>p.name) :
    resourceTab==="我的技能" ? [...readEnabledPreviewSkills(organizationId,memberId),...readPersonalPreviewSkills(organizationId,memberId).map(skill=>skill.name)] :
    resourceTab==="我的知识库" ? readKnowledgeState(organizationId,memberId).items.map(item=>item.name) :
    resourceTab==="我的报告" ? readPreviewReports(organizationId,memberId).reports.map(report=>report.title) :
    resourceGroups[resourceTab]??[]
  ).filter((item,index,items)=>items.indexOf(item)===index&&item.toLowerCase().includes(resourceSearch.toLowerCase()));
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
  const resumeGeneration=(item:PreviewMessage)=>{
    if(!item.approval)return;
    const index=item.approval==="knowledge"?3:item.approval==="skill"?4:5;
    const original=messages.slice(0,messages.findIndex(m=>m.id===item.id)).reverse().find(m=>m.role==="user");
    if(original)void requestOutcome(index,original.text);
  };
  const startNewConversation = () => { onAction(""); setChatActive(false); setMessages(current=>current.filter(message=>message.jobId&&message.jobStatus!=="ready"&&message.jobStatus!=="failed"));setGuideFor(null);setExpandedDraftId(null);setConfirmDetailsOpen(false); setDraft(""); setConfirmation(false); setModeIndex(0); setSelectedResources([]); setSelectedStores([]); setFiles([]); setLinkedProjectId("");setProjectName(""); };
  const handleApproval = (message: PreviewMessage, confirm: boolean) => {
    if (!message.approval) return;
    if(confirm&&!(message.jobStatus==="ready"&&message.outcomeSections?.length)){onAction("尚未生成完整成果，无法确认保存");return;}
    const labels: Record<ApprovalKind, string> = { knowledge: "知识库", skill: "技能", report: "报告" };
    const label = labels[message.approval];
    if(confirm&&message.approval==="report"){
      const title=message.outcomeSections?.[0]?.heading||message.text.split("\n").find(line=>line.startsWith("报告主题："))?.slice(5).trim();
      if(title){try{
        const saved=savePreviewReport(organizationId,memberId,title,(message.outcomeSections||[]).map(section=>section.heading+"\n"+section.content).join("\n\n"),linkedProjectId||undefined);
        if(!saved){onAction("报告主题为空，未保存演示报告");return;}
      }catch{onAction("报告演示数据保存失败，请检查浏览器存储权限");return}}
    }
    if(confirm&&message.approval==="report"&&linkedProjectId){const p=readPreviewProjects().find(p=>p.id===linkedProjectId&&p.status!=="已归档");const name=message.outcomeSections?.[0]?.heading||message.text.split("\n").find(x=>x.startsWith("报告主题："))?.slice(5).trim();if(p&&name){try{savePreviewProject({...p,reports:[...p.reports,name],updated:Date.now()})}catch{onAction("本地成果保存失败");return}}}
    if(confirm&&message.approval==="knowledge"){
      const name=message.outcomeSections?.[0]?.heading||message.text.split("\n").find(line=>line.startsWith("主题：")||line.startsWith("整理主题："))?.replace(/^(主题：|整理主题：)/,"").trim();
      if(name){try{savePersonalKnowledge(organizationId,memberId,name,(message.outcomeSections||[]).map(section=>section.heading+"\n"+section.content).join("\n\n"))}catch{onAction("知识库演示记录保存失败");return}}
    }
    if(confirm&&message.approval==="skill"){const goal=message.outcomeSections?.[0]?.heading||message.text.split("\n").find(line=>line.startsWith("技能目标："))?.slice(5).trim();if(goal)savePersonalPreviewSkill({name:skillEntry.mode==="edit"&&skillEntry.name?skillEntry.name:goal,description:(message.outcomeSections||[]).map(section=>section.heading+"\n"+section.content).join("\n\n")||goal},organizationId,memberId);}
    setMessages(current => current.map(item => item.id === message.id ? { ...item, approval: undefined } : item).concat({
      id: Date.now(),
      role: "assistant",
      text: confirm ? "已在本次演示中确认加入" + label + "。"+(message.approval==="knowledge"?"可在「我的知识库」管理，后续通过「资源与能力」引用；知识库不会自行执行任务。":message.approval==="skill"?"可在「我的技能」查看，后续在会话中引用并指定具体任务；保存技能不会自动运行。":"可在「我的报告」查看或收藏，必要时关联项目继续复盘。")+" 当前为本地演示，未写入真实业务服务。" : "好的，请在下方告诉我需要调整的内容，我会更新这份" + label + "草案。",
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
      try{const p=createPreviewProject({name:projectName,goal:request,scope:selectedStores.join("、"),template:projectEntry.template?.name,resources:selectedResources});setLinkedProjectId(p.id);setSelectedResources(old=>[...new Set([...old,p.name])]);setMessages(current=>[...current,{id:Date.now(),role:"user",text:request},{id:Date.now()+1,role:"assistant",text:"已创建本地演示项目："+p.name+"。\n如何推进：①在当前会话继续描述项目阶段目标；②针对每个阶段发起任务并在任务中心确认执行；③在「进行中项目」查看进度、关联资料和报告。项目本身不会自动执行任务。"}]);setConfirmation(false);setChatActive(true);setModeIndex(0);setDraft("");return;}catch{onAction("本地项目保存失败，请检查浏览器存储权限");return;}
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
        <div className={styles.thread} ref={threadRef} aria-label="聊天记录" aria-live="polite">{!chatActive && !confirmation && <p className={styles.threadEmpty}>在下方输入需求，消息和处理结果会持续显示在这里。</p>}{messages.map(item => <article key={item.id} className={item.role === "user" ? styles.userTurn : styles.assistantTurn}><span>{item.role === "user" ? "我" : "硕米 · 演示回复"}</span><p>{item.text}</p>{item.approval && <div className={styles.approvalActions}><span>{item.jobStatus==="ready"?"完整成果已生成，请打开审核":item.jobStatus==="running"?"服务端正在生成，可关闭页面后回来查看":item.jobStatus==="blocked"?"尚未接入生成服务，未启动后台任务":item.jobStatus==="failed"?"生成失败，需要重试":"生成请求待处理"}</span><div>{item.jobStatus==="ready"?<><button className={styles.approveButton} onClick={()=>setExpandedDraftId(item.id)}>查看完整{item.approval==="skill"?"技能":item.approval==="report"?"报告":"知识条目"}</button><button onClick={()=>handleApproval(item,false)}>继续修改</button></>:item.jobStatus==="blocked"||item.jobStatus==="failed"?<button onClick={()=>resumeGeneration(item)}>重试生成</button>:<button type="button" disabled>生成中</button>}</div></div>}</article>)}
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
        <footer className={styles.drawerFooter}><button onClick={() => setConfirmation(false)}>返回修改</button><button type="button" aria-expanded={confirmDetailsOpen} onClick={()=>setConfirmDetailsOpen(value=>!value)}>{confirmDetailsOpen?"收起详情":"查看详情"}</button><button className={styles.primary} onClick={confirmAction}>确认并继续</button></footer>
        {confirmDetailsOpen&&<section className={styles.draftDetails} aria-label="当前任务计划完整详情">
          <header><strong>{mode.title} · 草案详情</strong><small>核对信息及执行边界</small></header>
          <dl><div><dt>工作目标</dt><dd>{draft||"待补充"}</dd></div>
           {modeIndex===2&&<div><dt>项目名称</dt><dd>{projectName||"待填写"}</dd></div>}
           {modeIndex===1&&<div><dt>执行频率</dt><dd>{scheduleDescription}</dd></div>}
           <div><dt>业务范围</dt><dd>{selectedStores.length?selectedStores.join("、"):"尚未指定店铺"}</dd></div>
           <div><dt>关联资源</dt><dd>{selectedResources.length?selectedResources.join("、"):"未手动关联，需执行时确认可用资源"}</dd></div>
           <div><dt>当前状态</dt><dd>等待确认 · 本地交互演示</dd></div></dl>
          <div className={styles.draftDetailsUsage}><strong>确认后如何处理</strong>
           <span>{modeIndex===2?"仅保存演示项目与关联资料；不会自动启动后台持续执行。需在任务中心发起和确认具体任务。":modeIndex===1?"生成定时计划演示草案，尚未建立后台定时调度或真实自动执行。":"保存到任务中心待确认；具体执行仍需在任务中心审核，不会自动修改业务。"}</span></div>
        </section>}
        </section>}
        {feedback && <p role="status" className={styles.threadEmpty}>{feedback}</p>}
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
        <><section className={styles.modePicker}><header className={styles.modePickerIntro}><h2>选择工作方式</h2><p>选择最符合当前需求的入口</p></header><div className={styles.modeList}>{modeOrder.map(index => {const item=modes[index];return <div key={item.title} className={styles.modeOptionRow}>
          <button type="button" className={index === modeIndex ? styles.modeSelected : ""} onClick={() => {setModeIndex(index);setConfirmation(false)}} aria-pressed={index === modeIndex}>
            <i data-tone={index} /><span><strong>{item.title}</strong></span>
          </button>
          <button type="button" className={styles.modeViewButton} aria-label={"介绍"+item.title} onClick={()=>setGuideFor(index)}>介绍</button>
        </div>})}</div></section><section className={styles.examples}>
        <header><h2>试试这样说</h2><span>·</span><p>点击示例可放入输入区</p></header>
        <div>{mode.examples.map(([title, detail], index) => <button key={title} onClick={() => choosePrompt(title)}>
          <b data-tone={index}>0{index + 1}</b><span><strong>{title}</strong><small>{detail}</small></span>
        </button>)}</div>
      </section></>
      </aside>


    {expandedDraftId!==null&&(()=>{const item=messages.find(message=>message.id===expandedDraftId&&message.approval);if(!item||item.jobStatus!=="ready"||!item.outcomeSections?.length)return null;const kind=item.approval!;const title=kind==="report"?draftField(item.text,"报告主题"):kind==="skill"?draftField(item.text,"技能目标"):draftField(item.text,"主题");return <div className={styles.outcomeBackdrop} onMouseDown={event=>{if(event.target===event.currentTarget)setExpandedDraftId(null)}}><section className={styles.outcomeDialog} role="dialog" aria-modal="true" aria-labelledby="outcome-preview-title"><header><div><small>{kind==="report"?"报告预览":kind==="skill"?"技能定义":"知识条目"} · 待确认草案</small><h2 id="outcome-preview-title">{item.outcomeSections?.[0]?.heading||title||"未命名成果"}</h2><p>内容来自成果生成服务返回的具体章节。请审核后再保存，生成完成不等于业务执行完成。</p></div><button type="button" aria-label="关闭成果预览" onClick={()=>setExpandedDraftId(null)}>×</button></header><div className={styles.outcomeBody}>{previewSections(item).map(section=><section key={section.heading}><h3>{section.heading}</h3><p>{section.content}</p></section>)}</div><footer><button type="button" onClick={()=>{setExpandedDraftId(null);document.getElementById("chat-new-prompt")?.focus()}}>继续修改</button><button className={styles.primary} type="button" onClick={()=>{setExpandedDraftId(null);handleApproval(item,true)}}>{kind==="report"?"确认加入报告":kind==="skill"?"确认保存技能":"确认加入知识库"}</button></footer></section></div>})()}

    {modeGuide&&guideFor!==null&&<div className={styles.guideBackdrop} onMouseDown={event=>{if(event.target===event.currentTarget)setGuideFor(null)}}>
      <section className={styles.guideDialog} role="dialog" aria-modal="true" aria-label={modes[guideFor].title+"功能介绍"}>
        <header><div><small>功能介绍 · {modes[guideFor].title}</small><h2>{modeGuide.heading}</h2></div><button type="button" aria-label="关闭功能介绍" onClick={()=>setGuideFor(null)}>关闭</button></header>
        <p>{modeGuide.summary}</p>
        <h3>使用流程</h3>
        <div className={styles.guideSteps}>{modeGuide.steps.map((step,i)=><div key={step}><b>{String(i+1).padStart(2,"0")}</b><span>{step}</span></div>)}</div>
        <div className={styles.guideOutcome}><strong>完成后会得到什么</strong><p>{modeGuide.outcome}</p><span>后续查看位置：{modeGuide.destination}</span></div>
        <footer><button className={styles.primary} type="button" onClick={()=>setGuideFor(null)}>我知道了</button></footer>
      </section>
    </div>}

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
