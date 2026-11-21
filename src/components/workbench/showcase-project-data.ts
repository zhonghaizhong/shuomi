export type ProjectStatus="进行中"|"待确认"|"已完成"|"已归档";
export type PreviewProject={id:string;name:string;goal:string;scope:string;category:string;milestone:string;progress:number;status:ProjectStatus;updated:number;visited:number;archivedAt?:number;previousStatus?:Exclude<ProjectStatus,"已归档">;reports:string[];resources:string[];template?:string};
export const PROJECT_ROOT="/workbench/ai/projects";
const KEY="shuomi-preview-projects-v1";
const seed:PreviewProject[]=[
{id:"p1",name:"一号店经营提升",goal:"提升店铺转化率和广告投放效率",scope:"一号店",category:"店铺经营",milestone:"经营诊断进行中",progress:62,status:"待确认",updated:6,visited:6,reports:[],resources:[]},
{id:"p2",name:"美国站夏季女装开发",goal:"30 天内确定 10 个潜力商品",scope:"通用业务",category:"商品开发",milestone:"已确认 5 个开发方向",progress:48,status:"待确认",updated:5,visited:5,reports:[],resources:[]},
{id:"p3",name:"二号店商品内容优化",goal:"完成 20 个重点商品的内容升级",scope:"二号店",category:"商品优化",milestone:"12 个商品已完成优化",progress:75,status:"进行中",updated:4,visited:0,reports:[],resources:[]},
{id:"p4",name:"OPC跨境创业计划",goal:"完成从 0 到 1 的跨境创业方案",scope:"通用业务",category:"OPC创业",milestone:"首阶段创业任务执行中",progress:38,status:"进行中",updated:3,visited:0,reports:[],resources:[]},
{id:"p5",name:"2026春季POD产品测试",goal:"已完成全部产品测试",scope:"通用业务",category:"商品开发",milestone:"已完成全部产品测试",progress:100,status:"已归档",updated:2,visited:0,archivedAt:Date.UTC(2026,7,5),previousStatus:"已完成",reports:["产品测试阶段成果"],resources:[]},
{id:"p6",name:"一号店首月冷启动计划",goal:"首月经营目标已完成",scope:"一号店",category:"店铺经营",milestone:"首月经营目标已完成",progress:100,status:"已归档",updated:1,visited:0,archivedAt:Date.UTC(2026,6,28),previousStatus:"已完成",reports:["首月经营复盘"],resources:[]}
];
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
