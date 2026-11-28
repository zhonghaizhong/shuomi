export type ProjectStatus="进行中"|"待确认"|"已完成"|"已归档";
export type PreviewProject={id:string;name:string;goal:string;scope:string;category:string;milestone:string;progress:number;status:ProjectStatus;updated:number;visited:number;archivedAt?:number;previousStatus?:Exclude<ProjectStatus,"已归档">;reports:string[];resources:string[];template?:string;group?:string;links?:ProjectResourceLink[];stages?:ProjectStage[]};
export const PROJECT_ROOT="/workbench/ai/projects";
const KEY="shuomi-preview-projects-v1";
const RETIRED_DEMO_IDS=new Set(["demo-project-supplier","demo-project-shein-sync"]);
const LEGACY_PREVIEW_PROJECT_NAMES=new Set(["美国站夏季女装开发","二号店商品内容优化","OPC跨境创业计划","一号店经营提升","硕米优选供应商培育项目","硕米优选供应商入驻演示","SHEIN 刊登异常恢复演示"]);
export type ProjectResourceLink={kind:"store"|"batch"|"product"|"agent"|"tool"|"module"|"data"|"report"|"skill"|"knowledge";id:string;label:string;status:"演示可引用"|"待选择"|"待配置";path?:string;note?:string};
export type ProjectStage={title:string;state:"已完成"|"进行中"|"待确认"|"异常"|"待开始";detail:string};
const R=(kind:ProjectResourceLink["kind"],id:string,label:string,status:ProjectResourceLink["status"],path?:string,note?:string):ProjectResourceLink=>({kind,id,label,status,path,note});
const stages=(...parts:ProjectStage[]):ProjectStage[]=>parts;
export const demoProjectScenarios:PreviewProject[]=[
 {id:"demo-project-shein-growth",name:"SHEIN 美国站30天利润提升项目",goal:"以一号店为目标，核对可用经营数据，逐步诊断利润问题、落实优化任务并按周复盘；不将模拟数据当作实际店铺业绩。",scope:"一号店 · SHEIN美国站",category:"店铺经营",milestone:"经营诊断及数据核对",progress:30,status:"进行中",updated:Date.now()-3600000,visited:Date.now()-3600000,reports:[],resources:["一号店","运营驾驶舱","任务中心","我的报告"],links:[
 R("store","demo-shein-store-one","一号店（SHEIN 美国站）","待选择","/workbench/stores","请在店铺中心确认当前账号确有此店铺及其真实平台 ID"),
 R("module","cockpit","运营驾驶舱","演示可引用","/workbench/cockpit"),
 R("module","task-center","任务中心","演示可引用","/workbench/ai/tasks"),
 R("report","report-center","我的报告","演示可引用","/workbench/ai/reports"),
 R("skill","demo-skill-profit","SHEIN 店铺利润诊断流程（演示）","演示可引用","/workbench/agents/skills/mine","已创建具体技能定义，但不代表真实自动计算"),
 R("knowledge","demo-knowledge-profit","SHEIN 经营指标与利润核对规范（演示）","演示可引用","/workbench/ai/knowledge/mine"),
 R("report","demo-report-growth","利润诊断准备报告（演示）","演示可引用","/workbench/ai/reports","可查看完整章节，未使用真实经营数据")
 ],stages:stages(
 {title:"核对店铺与经营数据",state:"进行中",detail:"确认当前组织的一号店及经营数据访问范围"},
 {title:"分析利润问题",state:"待开始",detail:"数据可用后再执行经营诊断"},
 {title:"安排商品优化任务",state:"待开始",detail:"通过任务中心确认后执行"},
 {title:"周度复盘与报告",state:"待开始",detail:"只使用可核实的数据形成成果"})
 },
 {id:"demo-project-pod-images",name:"POD 新品开发与刊登项目",goal:"基于已有的POD短袖、卫衣演示产品，组织素材设计、图片处理、审核与刊登准备，不将前端模拟视为真实上传。",scope:"POD服装演示批次",category:"商品开发",milestone:"图片任务与人工审核",progress:55,status:"待确认",updated:Date.now()-7200000,visited:Date.now()-3600000,reports:[],resources:["POD商品演示批次","POD刊登智能体","POD素材管理工具","刊登管理"],links:[
 R("batch","pod-apparel-demo","POD 服装演示批次","待选择","/workbench/data/mine","具体批次 ID 需从当前账号我的数据中选取"),
 R("agent","pod.design.agent","POD刊登智能体","演示可引用","/workbench/agents/mine","当前演示默认已启用；执行需确认当前组织启用状态"),
 R("tool","pod-artwork","POD素材管理工具","演示可引用","/workbench/tools/mine"),
 R("module","listing","刊登管理","演示可引用","/workbench/supply/mine/procurement"),
 R("skill","demo-skill-pod-review","POD 多变体图片审核流程（演示）","演示可引用","/workbench/agents/skills/mine","规则已创建，真实图片处理尚未执行"),
 R("knowledge","demo-knowledge-pod","POD 服装主图与变体审核规则（演示）","演示可引用","/workbench/ai/knowledge/mine"),
 R("report","demo-report-pod","POD 新品开发阶段质量检查报告（演示）","演示可引用","/workbench/ai/reports"),
 R("store","pod-target","目标SHEIN店铺","待选择","/workbench/stores","需按目标站点确认店铺及平台 ID")
 ],stages:stages(
 {title:"选择演示商品及变体",state:"已完成",detail:"模拟检查短袖与卫衣SKU结构，不代表真实图片生成"},
 {title:"素材与图片重构",state:"进行中",detail:"模拟执行阶段，真实图像生成需要服务端能力"},
 {title:"人工审核",state:"待确认",detail:"确认每个变体的实际图片及内容"},
 {title:"平台适配与刊登",state:"待开始",detail:"审核通过后进入刊登管理"})
 },
 {id:"demo-project-selected-sales",name:"SHEIN 美国站30天新品开发与销售项目",goal:"从硕米优选演示货盘选择真实存在的演示SKU，加入采集批次、优化商品并跟踪刊登和销售样例。",scope:"硕米优选 → 一号店 · SHEIN美国站",category:"商品开发",milestone:"优选SKU选择和采集批次",progress:40,status:"进行中",updated:Date.now()-10800000,visited:Date.now()-5400000,reports:[],resources:["硕米优选","纯棉圆领短袖T恤","宽松连帽卫衣","我的数据","商品优化智能体","刊登管理"],links:[
 R("module","selected-market","硕米优选货盘","演示可引用","/workbench/supply/selected"),
 R("product","SMYX-DEMO-001","纯棉圆领短袖T恤 · SMYX-DEMO-001","演示可引用","/workbench/supply/selected"),
 R("product","SMYX-DEMO-002","宽松连帽卫衣 · SMYX-DEMO-002","演示可引用","/workbench/supply/selected"),
 R("batch","selected-collected","硕米优选采集批次","待选择","/workbench/data/mine","必须由当前账号在货盘选择具体 SKU 后创建，不能预设已生成"),
 R("agent","product.content.agent","商品优化智能体","演示可引用","/workbench/agents/mine","当前组织启用状态以智能体市场为准"),
 R("module","listing","刊登管理","演示可引用","/workbench/supply/mine/procurement"),
 R("skill","demo-skill-selected-listing","优选选品与SHEIN刊登检查（演示）","演示可引用","/workbench/agents/skills/mine"),
 R("knowledge","demo-knowledge-selected","优选SKU采集与刊登规范（演示）","演示可引用","/workbench/ai/knowledge/mine"),
 R("report","demo-report-selected","优选SKU选品与刊登风险记录（演示）","演示可引用","/workbench/ai/reports"),
 R("store","demo-shein-store-one","一号店","待选择","/workbench/stores","需确认真实店铺 ID 与平台授权")
 ],stages:stages(
 {title:"查看优选货源",state:"已完成",detail:"关联演示货盘中已有的两款SKU商品"},
 {title:"选择SKU并创建采集批次",state:"进行中",detail:"须在货盘实际点击加入采集批次"},
 {title:"商品优化及平台适配",state:"待开始",detail:"生成待补全或待审核任务"},
 {title:"刊登及销售跟踪",state:"待开始",detail:"不模拟真实刊登成功或实际成交"})
 },
 {id:"demo-project-market-research",name:"美国站新品市场调研与选品项目",goal:"以现有数据市场、我的数据和硕米优选演示SKU为候选，比较商品规格和供货条件，形成待核实的选品决策报告。",scope:"美国站 · 新品研究",category:"商品开发",milestone:"候选产品对比与报告复核",progress:100,status:"已归档",previousStatus:"已完成",archivedAt:Date.now()-86400000,updated:Date.now()-86400000,visited:Date.now()-86400000,reports:["演示调研结论：仅对比了现有货盘样例，非正式市场研究成果"],resources:["数据市场","我的数据","硕米优选","我的报告"],links:[
 R("data","data-market","数据市场","演示可引用","/workbench/data/market","仅表示可查看服务，不代表已购买或调用API"),
 R("module","my-data","我的数据","演示可引用","/workbench/data/mine"),
 R("module","selected-market","硕米优选","演示可引用","/workbench/supply/selected"),
 R("product","SMYX-DEMO-001","纯棉圆领短袖T恤","演示可引用","/workbench/supply/selected"),
 R("product","SMYX-DEMO-002","宽松连帽卫衣","演示可引用","/workbench/supply/selected"),
 R("skill","demo-skill-market-compare","候选商品比较与报告整理（演示）","演示可引用","/workbench/agents/skills/mine"),
 R("knowledge","demo-knowledge-research","候选商品数据来源与选品评审规范（演示）","演示可引用","/workbench/ai/knowledge/mine"),
 R("report","demo-report-market","选品阶段复盘报告（演示）","演示可引用","/workbench/ai/reports","已有可查看正文，但不是实时市场研究")
 ],stages:stages(
 {title:"选择研究范围",state:"已完成",detail:"美国站服装类目演示样本"},
 {title:"比较现有货盘样例",state:"已完成",detail:"仅核对已有商品字段及SKU供货条件"},
 {title:"整理结果与限制",state:"已完成",detail:"形成示例总结，外部市场数据仍需核验"},
 {title:"归档",state:"已完成",detail:"保留全部示例任务和限制声明"})
 }
];
export type DemoProjectTask={id:string;name:string;description:string;scope:string;state:"pending"|"running"|"completed"|"errors"|"scheduled"|"revision";time:string;progress?:number;frequency?:string;paused?:boolean;history?:{time:string;event:string}[];conversation?:{role:"user"|"assistant";text:string}[];result?:string;planId?:string;projectId?:string;resourceIds?:string[]};
export const demoProjectTasks:DemoProjectTask[]=[
 {id:"demo-task-growth-scope",resourceIds:["demo-knowledge-profit","demo-skill-profit","demo-report-growth"],projectId:"demo-project-shein-growth",name:"核对一号店与经营数据授权",description:"待确认当前登录账号是否有一号店及经营指标权限，未调用真实数据",scope:"SHEIN美国站 一号店",state:"running",time:"模拟准备中",progress:30,history:[{time:"演示",event:"创建权限与数据核对任务"}]},
 {id:"demo-task-growth-weekly",resourceIds:["demo-skill-profit","demo-report-growth"],projectId:"demo-project-shein-growth",name:"每周利润与经营复盘",description:"仅保存周期计划样例；后台调度尚未接通",scope:"SHEIN美国站 一号店",state:"scheduled",time:"未真实调度",frequency:"每周一 09:00"},
 {id:"demo-task-pod-check",resourceIds:["demo-skill-pod-review","demo-knowledge-pod"],projectId:"demo-project-pod-images",name:"POD 短袖与卫衣变体资料检查",description:"演示变体结构及图片要求核验，不代表已生成图片",scope:"POD 服装演示批次",state:"completed",time:"演示完成",progress:100,result:"演示结果：确认有待审核的变体资料；需选择真实批次后再次校验"},
 {id:"demo-task-pod-generate",resourceIds:["demo-skill-pod-review","demo-knowledge-pod"],projectId:"demo-project-pod-images",name:"POD 主图和详情图生成",description:"真实图片生成服务未连接，不能宣称已输出图片",scope:"POD 服装演示批次",state:"running",time:"模拟进行中",progress:55},
 {id:"demo-task-pod-approval",resourceIds:["demo-knowledge-pod","demo-report-pod"],projectId:"demo-project-pod-images",name:"人工确认图片与刊登规格",description:"等待检查变体图片、素材授权及目标站点刊登规格",scope:"POD 服装演示批次",state:"pending",time:"待人工确认"},
 {id:"demo-task-selected-pick",resourceIds:["demo-skill-selected-listing","demo-knowledge-selected"],projectId:"demo-project-selected-sales",name:"硕米优选演示SKU选品",description:"已定位SMYX-DEMO-001与SMYX-DEMO-002，实际采集需用户在货盘选择",scope:"硕米优选 → 一号店",state:"completed",time:"演示完成",progress:100,result:"演示SKU：SMYX-DEMO-001 纯棉圆领短袖T恤；SMYX-DEMO-002 宽松连帽卫衣"},
 {id:"demo-task-selected-collect",resourceIds:["demo-skill-selected-listing","demo-knowledge-selected"],projectId:"demo-project-selected-sales",name:"选择SKU并创建采集批次",description:"当前账号需确认SKU与目的国家后执行演示采集",scope:"硕米优选 → 我的数据",state:"pending",time:"等待选择商品"},
 {id:"demo-task-selected-adapt",resourceIds:["demo-knowledge-selected","demo-report-selected"],projectId:"demo-project-selected-sales",name:"商品适配与刊登异常示例",description:"示例模拟SKU属性不完整，需人工补齐后进入待审核；未实际提交SHEIN",scope:"刊登管理 · 一号店",state:"errors",time:"模拟阻断",progress:20},
 {id:"demo-task-market-compare",resourceIds:["demo-skill-market-compare","demo-knowledge-research","demo-report-market"],projectId:"demo-project-market-research",name:"已有候选商品规格与供应条件比较",description:"基于当前演示货盘商品比较SKU字段；未调用外部市场行情",scope:"美国站 新品调研",state:"completed",time:"演示已归档",progress:100,result:"已比较短袖和卫衣的样例供货条件；不构成市场需求或销量结论"},
 {id:"demo-task-market-summary",resourceIds:["demo-knowledge-research","demo-report-market"],projectId:"demo-project-market-research",name:"选品阶段复盘与归档",description:"保存演示结论；完整报告尚待真实数据来源",scope:"美国站 新品调研",state:"completed",time:"演示已归档",progress:100,result:"演示归档记录完成；未生成真实市场调查报告"}
];
export const projectTemplates=[
{name:"店铺经营增长",category:"店铺经营",description:"结合经营诊断、商品优化与复盘，围绕店铺目标组织持续改进任务。",milestones:["经营诊断","优化计划","效果复盘"]},
{name:"新品开发与选品",category:"商品开发",description:"从市场机会、选品验证到上新准备，集中管理商品开发过程与阶段成果。",milestones:["市场机会","选品验证","上新准备"]},
{name:"商品内容优化",category:"商品优化",description:"围绕标题、图片及详情文案梳理任务，记录内容优化与审核发布进度。",milestones:["资料检查","内容优化","审核发布"]},
{name:"跨境 OPC 创业",category:"OPC创业",description:"梳理创业目标、平台与商品方向，将启动准备和阶段验证纳入项目。",milestones:["创业规划","启动准备","阶段验证"]}
] as const;
const seed:PreviewProject[]=demoProjectScenarios.filter(p=>!RETIRED_DEMO_IDS.has(p.id));
export function readPreviewProjects():PreviewProject[]{try{const raw=sessionStorage.getItem(KEY);if(raw){const parsed:unknown=JSON.parse(raw);if(Array.isArray(parsed)){const custom=(parsed as PreviewProject[]).filter(p=>p&&typeof p.id==="string"&&!p.id.startsWith("demo-project-")&&!LEGACY_PREVIEW_PROJECT_NAMES.has(p.name));const existing=new Map((parsed as PreviewProject[]).filter(p=>p&&typeof p.id==="string"&&p.id.startsWith("demo-project-")&&!RETIRED_DEMO_IDS.has(p.id)).map(p=>[p.id,p]));return [...custom,...seed.map(p=>{const previous=existing.get(p.id);return previous?{...p,status:previous.status,progress:previous.progress,visited:previous.visited,updated:previous.updated,archivedAt:previous.archivedAt,previousStatus:previous.previousStatus,reports:[...new Set([...p.reports,...previous.reports])]}:p})]}}}catch{}return seed.map(p=>({...p,reports:[...p.reports],resources:[...p.resources],links:p.links?.map(x=>({...x})),stages:p.stages?.map(x=>({...x}))}))}
export function writePreviewProjects(p:PreviewProject[]){sessionStorage.setItem(KEY,JSON.stringify(p))}
export function savePreviewProject(p:PreviewProject){const records=readPreviewProjects();writePreviewProjects(records.some(x=>x.id===p.id)?records.map(x=>x.id===p.id?p:x):[p,...records]);return p}
export function createPreviewProject(input:{name:string;goal:string;scope:string;template?:string;resources:string[]}){const template=projectTemplates.find(x=>x.name===input.template);const now=Date.now();return savePreviewProject({id:crypto.randomUUID(),name:input.name.trim(),goal:input.goal.trim(),scope:input.scope||"通用业务",category:template?.category||"自定义项目",milestone:template?.milestones[0]||"明确目标和执行计划",progress:0,status:"进行中",updated:now,visited:now,reports:[],resources:input.resources,template:template?.name})}
export function projectChatUrl(mode:"create"|"reference",value=""){return "/workbench/ai/chat/new?preview=1&projectMode="+mode+(mode==="create"?"&projectTemplate=":"&projectId=")+encodeURIComponent(value)}

/** Browser-local project groups are independent of business template categories. */
const GROUP_KEY="shuomi-preview-project-groups-v1";
export function readPreviewProjectGroups():string[]{try{const x=JSON.parse(sessionStorage.getItem(GROUP_KEY)||"[]");if(Array.isArray(x))return x.filter((v):v is string=>typeof v==="string"&&v.trim().length>0&&v.length<=40).slice(0,100)}catch{}return []}
export function writePreviewProjectGroups(groups:string[]){sessionStorage.setItem(GROUP_KEY,JSON.stringify(groups))}
