export type ProjectStatus="进行中"|"待确认"|"已完成"|"已归档";
export type PreviewProject={id:string;name:string;goal:string;scope:string;category:string;milestone:string;progress:number;status:ProjectStatus;updated:number;visited:number;archivedAt?:number;previousStatus?:Exclude<ProjectStatus,"已归档">;reports:string[];resources:string[];template?:string;group?:string};
export const PROJECT_ROOT="/workbench/ai/projects";
const KEY="shuomi-preview-projects-v1";
export const demoProjectScenarios:PreviewProject[]=[
{id:"demo-project-shein-growth",name:"SHEIN 美国站经营增长演示",goal:"梳理近30天经营表现，分析利润和低效商品并形成可执行优化方案",scope:"一号店 · SHEIN美国站",category:"店铺经营",milestone:"诊断复盘",progress:100,status:"已完成",updated:Date.now()-3600000*2,visited:Date.now()-3600000,reports:["演示成果：经营诊断摘要（示例数据，非真实店铺统计）","演示成果：阶段优化建议（待业务核实）"],resources:["商品利润测算技能","经营分析知识库"],template:"店铺经营增长"},
{id:"demo-project-pod-images",name:"POD 商品图片重构演示",goal:"以卫衣和短袖样品测试多变体图片重构、质量审核和刊登前检查",scope:"POD商品演示批次",category:"商品优化",milestone:"图片生成与人工复核",progress:65,status:"进行中",updated:Date.now()-3600000,visited:Date.now()-1200000,reports:["演示过程记录：已检查规格及变体映射，尚未生成真实 AI 图片"],resources:["POD刊登智能体","POD素材管理"],template:"商品内容优化"},
{id:"demo-project-supplier",name:"硕米优选供应商入驻演示",goal:"审核供货资料、SKU价格库存和起订量，并确认可进入优选货盘的商品",scope:"硕米优选 · 服装供应商",category:"供应链协作",milestone:"等待供应商资料确认",progress:45,status:"待确认",updated:Date.now()-7200000,visited:Date.now()-3600000,reports:[],resources:["供应商入驻规则","SKU资料校验"]},
{id:"demo-project-shein-sync",name:"SHEIN 刊登异常恢复演示",goal:"对演示商品执行平台适配、检查授权并处理刊登阻断",scope:"二号店 · SHEIN加拿大站",category:"商品刊登",milestone:"平台授权异常待修复",progress:30,status:"进行中",updated:Date.now()-10800000,visited:Date.now()-7200000,reports:["演示异常报告：店铺授权校验未通过（模拟，不代表真实店铺状态）"],resources:["自有商品快速上传","平台适配规则"]},
{id:"demo-project-market-research",name:"美国站新品选品阶段复盘演示",goal:"复盘品类调研、供应对比与样品评审，保留决策记录后结束项目",scope:"美国站 · 新品开发",category:"商品开发",milestone:"完成归档",progress:100,status:"已归档",previousStatus:"已完成",archivedAt:Date.now()-86400000,updated:Date.now()-86400000,visited:Date.now()-86400000,reports:["演示归档材料：候选商品比较记录","演示归档材料：阶段复盘摘要"],resources:["选品调研资料"],template:"新品开发与选品"}
];
export type DemoProjectTask={id:string;name:string;description:string;scope:string;state:"pending"|"running"|"completed"|"errors"|"scheduled"|"revision";time:string;progress?:number;frequency?:string;paused?:boolean;history?:{time:string;event:string}[];conversation?:{role:"user"|"assistant";text:string}[];result?:string;planId?:string;projectId?:string};
export const demoProjectTasks:DemoProjectTask[]=[
{id:"demo-task-growth-diagnosis",projectId:"demo-project-shein-growth",name:"经营数据结构检查与诊断演示",description:"已完成演示指标检查，所有指标仅为样例，不含真实店铺数据",scope:"一号店 · SHEIN美国站",state:"completed",time:"演示已完成",progress:100,result:"演示结果：检查了销售、订单、成本和利润的字段结构；尚未对接真实经营明细。",history:[{time:"演示时间",event:"完成字段结构检查并记录示例诊断"}]},
{id:"demo-task-growth-report",projectId:"demo-project-shein-growth",name:"经营优化建议报告演示",description:"根据模拟经营问题整理行动计划，需核对真实数据后使用",scope:"一号店 · SHEIN美国站",state:"completed",time:"演示已完成",progress:100,result:"演示报告：建议核实低利润商品、退款异常和费用结构。此为流程示例，不代表真实分析结论。"},
{id:"demo-task-pod-prepare",projectId:"demo-project-pod-images",name:"POD图片规格与变体资料检查",description:"检查短袖和卫衣演示变体的颜色、尺码、图片规格",scope:"POD商品演示批次",state:"completed",time:"演示已完成",progress:100,result:"示例审核：已检查颜色和尺码字段；真实图片生成结果尚未提供。"},
{id:"demo-task-pod-generate",projectId:"demo-project-pod-images",name:"POD主图与详情图重构流程",description:"处于模拟处理阶段，未调用真实图片生成服务",scope:"POD商品演示批次",state:"running",time:"模拟执行中",progress:55,history:[{time:"演示时间",event:"已完成输入结构检查，等待真实生成能力接入"}]},
{id:"demo-task-supplier-approval",projectId:"demo-project-supplier",name:"供应商SKU资料与起订量确认",description:"待供应商确认分尺码SKU价格、库存、重量和最小起订量",scope:"硕米优选 · 服装供应商",state:"pending",time:"等待人工确认",progress:45,history:[{time:"演示时间",event:"发现供应资料待确认项，未自动批准"}]},
{id:"demo-task-shein-error",projectId:"demo-project-shein-sync",name:"二号店刊登授权检查异常",description:"模拟第三方平台授权失效，需重新核对权限后重试",scope:"二号店 · SHEIN加拿大站",state:"errors",time:"阻断待处理",progress:30,history:[{time:"演示时间",event:"演示校验返回授权异常；未向平台提交实际操作"}]},
{id:"demo-task-shein-retry",projectId:"demo-project-shein-sync",name:"授权恢复后重新适配计划",description:"等待授权异常解除后再确认重试，避免重复上传",scope:"二号店 · SHEIN加拿大站",state:"revision",time:"待修改",progress:0},
{id:"demo-task-market-review",projectId:"demo-project-market-research",name:"新品选品评审复盘",description:"演示候选品对比与评审记录已归档",scope:"美国站 · 新品开发",state:"completed",time:"演示已归档",progress:100,result:"示例评审材料已整理，未生成真实供应商评审或成交结果。"},
{id:"demo-task-weekly-review",projectId:"demo-project-pod-images",name:"POD每周质量检查计划",description:"用于模拟每周检查审核积压，不会在后台真实调度",scope:"POD商品演示批次",state:"scheduled",time:"下次执行未实际调度",frequency:"每周一 09:00",paused:false,history:[{time:"演示时间",event:"已保存模拟周期计划，真实调度未启用"}]}
];
const seed:PreviewProject[]=demoProjectScenarios;
export const projectTemplates=[
{name:"店铺经营增长",category:"店铺经营",description:"结合经营诊断、商品优化与复盘，围绕店铺目标组织持续改进任务。",milestones:["经营诊断","优化计划","效果复盘"]},
{name:"新品开发与选品",category:"商品开发",description:"从市场机会、选品验证到上新准备，集中管理商品开发过程与阶段成果。",milestones:["市场机会","选品验证","上新准备"]},
{name:"商品内容优化",category:"商品优化",description:"围绕标题、图片及详情文案梳理任务，记录内容优化与审核发布进度。",milestones:["资料检查","内容优化","审核发布"]},
{name:"跨境 OPC 创业",category:"OPC创业",description:"梳理创业目标、平台与商品方向，将启动准备和阶段验证纳入项目。",milestones:["创业规划","启动准备","阶段验证"]}
] as const;
export function readPreviewProjects():PreviewProject[]{try{const raw=sessionStorage.getItem(KEY);if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed))return parsed}}catch{}return seed.map(p=>({...p,reports:[...p.reports],resources:[...p.resources]}))}
export function writePreviewProjects(p:PreviewProject[]){sessionStorage.setItem(KEY,JSON.stringify(p))}
export function savePreviewProject(p:PreviewProject){const records=readPreviewProjects();writePreviewProjects(records.some(x=>x.id===p.id)?records.map(x=>x.id===p.id?p:x):[p,...records]);return p}
export function createPreviewProject(input:{name:string;goal:string;scope:string;template?:string;resources:string[]}){const template=projectTemplates.find(x=>x.name===input.template);const now=Date.now();return savePreviewProject({id:crypto.randomUUID(),name:input.name.trim(),goal:input.goal.trim(),scope:input.scope||"通用业务",category:template?.category||"自定义项目",milestone:template?.milestones[0]||"明确目标和执行计划",progress:0,status:"进行中",updated:now,visited:now,reports:[],resources:input.resources,template:template?.name})}
export function projectChatUrl(mode:"create"|"reference",value=""){return "/workbench/ai/chat/new?preview=1&projectMode="+mode+(mode==="create"?"&projectTemplate=":"&projectId=")+encodeURIComponent(value)}

/** Browser-local project groups are independent of business template categories. */
const GROUP_KEY="shuomi-preview-project-groups-v1";
export function readPreviewProjectGroups():string[]{try{const x=JSON.parse(sessionStorage.getItem(GROUP_KEY)||"[]");if(Array.isArray(x))return x.filter((v):v is string=>typeof v==="string"&&v.trim().length>0&&v.length<=40).slice(0,100)}catch{}return []}
export function writePreviewProjectGroups(groups:string[]){sessionStorage.setItem(GROUP_KEY,JSON.stringify(groups))}
