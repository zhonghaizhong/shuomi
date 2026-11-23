"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./route-detail-preview.module.css";
import { plansDemoDisplay, plansDemoFacts, plansDemoWalletCredit, plansDemoPurchases, plansDemoRates } from "./plans-demo-facts";
import {readDemoPurchases,writeDemoPurchases,useDemoPurchases,type DemoPurchase} from "./showcase-purchases";
import {useShowcaseSuite} from "./account/showcase-account-state";
import {useDemoStoreBindings,countConsumedStorePeriods,countPoolConsumedStorePeriods,demoStoreServiceActive} from "./store-binding-demo";
import {getDemoMembership} from "../../../showcase/demo-identity";
import { ChatNewPreview } from "./chat-new-preview";
import { ShowcaseChatCollections } from "./showcase-chat-collections";
import { PreferredApplicationPreview } from "./preferred-application-preview";
import {ShowcaseMyDataBatches} from "./showcase-my-data-batches";
import { AccountProfilePreview } from "./account-profile-preview";

const routes: Record<string, { section: string; title: string; description: string }> = {
  "/workbench/ai/chat/new": { section: "AI工作台 / 硕米Chat", title: "新建会话", description: "有什么想交给硕米？直接描述问题或工作目标，硕米协助整理并回复。" },
  "/workbench/ai/chat/recent": { section: "AI工作台 / 硕米Chat", title: "最近会话", description: "选择一条会话，继续上次的交流。" },
  "/workbench/ai/chat/saved": { section: "AI工作台 / 硕米Chat", title: "收藏会话", description: "重要会话集中保存，点击可继续交流。" },
  "/workbench/ai/tasks/running": { section: "AI工作台 / 任务中心", title: "进行中任务", description: "按当前执行阶段查看任务进度与预计完成时间。" },
  "/workbench/ai/tasks/completed": { section: "AI工作台 / 任务中心", title: "已完成任务", description: "查看执行结果、报告和同步记录；完成任务保持只读。" },
  "/workbench/ai/tasks/errors": { section: "AI工作台 / 任务中心", title: "异常任务", description: "集中查看失败原因、权限问题及恢复建议。" },
  "/workbench/ai/tasks/scheduled": { section: "AI工作台 / 任务中心", title: "定时任务", description: "按设定时间自动运行；统一管理频率、授权范围与执行结果。" },
  "/workbench/ai/projects/active": { section: "AI工作台 / 项目中心", title: "进行中项目", description: "查看项目进度与关联资源，创建、配置及管理项目执行计划。" },
  "/workbench/ai/projects/recent": { section: "AI工作台 / 项目中心", title: "最近访问", description: "继续查看近期打开的项目与当前执行进度。" },
  "/workbench/ai/projects/templates": { section: "AI工作台 / 项目中心", title: "项目模板", description: "选择适用业务场景的官方模板，查看介绍后创建项目。" },
  "/workbench/ai/projects/archived": { section: "AI工作台 / 项目中心", title: "已归档项目", description: "归档项目的资料与报告将继续保留，查看详情后可申请恢复。" },
  "/workbench/ai/projects/mine": { section: "AI工作台 / 项目中心", title: "我的项目", description: "查看项目进度与关联资源，创建、配置及管理项目执行计划。" },
  "/workbench/ai/knowledge/official": { section: "AI工作台 / 知识库", title: "官方知识库", description: "按业务需求查找和启用官方参考知识，选择后可在会话或任务中主动引用。" },
  "/workbench/ai/knowledge/mine": { section: "AI工作台 / 知识库", title: "我的知识库", description: "管理已启用的官方知识和自行创建的知识库，需要时主动关联到会话或任务。" },
  "/workbench/ai/knowledge/team": { section: "AI工作台 / 知识库", title: "团队知识库", description: "团队知识库功能暂未开放。你可以先使用官方知识库或我的知识库。" },
  "/workbench/agents/skills/official": { section: "AI工作台 / 技能库", title: "官方模板", description: "按需查找和启用标准技能，启用后会出现在「我的技能」，使用时再关联到会话或任务。" },
  "/workbench/agents/skills/mine": { section: "AI工作台 / 技能库", title: "我的技能", description: "管理已启用的官方技能和自己保存的技能，需要时直接带入会话。" },
  "/workbench/agents/skills/team": { section: "AI工作台 / 技能库", title: "团队技能", description: "团队技能暂未开放。你可以先使用官方模板或我的技能。" },
  "/workbench/ai/reports/recent": { section: "AI工作台 / 我的报告", title: "最近生成", description: "按生成时间查看最新报告、方案和业务文件。" },
  "/workbench/ai/reports/favorites": { section: "AI工作台 / 我的报告", title: "已收藏", description: "集中查看值得反复使用的报告、方案与素材。" },
  "/workbench/ai/reports/all": { section: "AI工作台 / 我的报告", title: "全部成果", description: "按成果类型和关联业务查找全部已生成的工作成果。" },
  "/workbench/supply/catalogs": { section: "供应市场 / 货盘集成", title: "货盘集成", description: "浏览已接入货盘并选择商品，或提交未接入货盘的对接申请，统一衔接数据、适配与发布流程。" },
  "/workbench/supply/catalogs/selection": { section: "供应市场 / 货盘集成 / 货盘选品", title: "货盘选品", description: "选择货盘并使用商品采集插件获取商品，采集结果统一在「我的数据」查看。" },
  "/workbench/supply/catalogs/apply": { section: "供应市场 / 货盘集成 / 申请对接", title: "申请对接", description: "填写货盘基本信息并提交申请，硕米专员将与您联系确认对接安排。" },
  "/workbench/supply/applications": { section: "供应市场 / 优选申请", title: "优选申请", description: "管理提交至硕米优选的商品申请，查看审核状态及处理结果。" },
  "/workbench/supply/applications/new": { section: "供应市场 / 优选申请 / 发起申请", title: "发起申请", description: "选择符合条件的商品并提交资料，申请进入硕米优选商品池。" },
  "/workbench/supply/applications/progress": { section: "供应市场 / 优选申请 / 申请记录", title: "申请记录", description: "仅记录已完成审核的申请；未通过可查看原因、修改资料后重新申请。" },
  "/workbench/supply/applications/records": { section: "供应市场 / 优选申请 / 申请记录", title: "申请记录", description: "查看已提交的优选申请及其历史审核结果。" },
  "/workbench/data/market": { section: "数据服务 / 数据市场", title: "数据市场", description: "汇集主流电商平台产品数据，当前开放 Amazon，更多平台将陆续接入。" },
  "/workbench/data/api": { section: "数据服务 / API管理", title: "API管理", description: "管理 API 密钥、调用权限、额度限制和费用，让客户系统安全调用已开通的数据能力。" },
  "/workbench/data/mine": { section: "数据服务 / 我的数据", title: "我的数据", description: "统一管理采集的数据批次。可下载原始数据；需上架时可转入待上传，进一步整理商品资料。" },
  "/workbench/services/market": { section: "生态服务 / 服务市场", title: "服务市场", description: "围绕企业设立、品牌保护、店铺开通和日常运营，提供专业服务支持。" },
  "/workbench/services/mine": { section: "生态服务 / 我的服务", title: "我的服务", description: "统一查看已提交和正在交付的服务，跟进确认、交付与售后进度。" },
  "/workbench/tools/official": { section: "工具市场 / 官方工具", title: "官方工具", description: "浏览官方维护的电商工具，启用后可用于智能体与业务流程。" },
  "/workbench/tools/mine": { section: "工具市场 / 我的工具", title: "我的工具", description: "管理已启用工具的授权状态、配置和使用入口。" },
  "/workbench/tools/custom": { section: "工具市场 / 工具定制", title: "工具定制", description: "针对特殊采集、系统连接或自动化场景提交定制需求。" },
  "/workbench/tools/custom/new": { section: "工具市场 / 工具定制", title: "提交工具定制需求", description: "描述需要定制的工具及运行规则，由专员评估技术方案和报价。" },
  "/workbench/tools/custom/progress": { section: "工具市场 / 工具定制", title: "我的工具定制需求", description: "查看工具定制申请的状态、技术评估及后续交付安排。" },
  "/workbench/stores": { section: "店铺中心 / 我的店铺", title: "我的店铺", description: "管理已接入的店铺、授权状态和网络环境。" },
  "/workbench/store-products": { section: "店铺中心 / 店铺商品", title: "店铺商品", description: "管理已上架商品，按平台与店铺筛选，并同步商品、价格和库存状态。" },
  "/workbench/store-orders": { section: "店铺中心 / 订单履约", title: "订单履约", description: "统一查看各店铺订单、发货进度、物流与售后状态。" },
  "/workbench/plans/options": { section: "套餐与权益 / 套餐方案", title: "套餐方案", description: "企业基础服务、AI积分、数据额度与共享存储分别计量和结算。" },
  "/workbench/plans/entitlements": { section: "套餐与权益 / 我的权益", title: "我的权益", description: "汇总企业已购的店铺、积分、数据与存储资源。" },
  "/workbench/plans/usage": { section: "套餐与权益 / 用量明细", title: "用量明细", description: "查看店铺费用、充值到账、赠送到账与实际使用扣减的完整流水。" },
  "/workbench/plans/top-up": { section: "套餐与权益 / 充值中心", title: "充值中心", description: "统一管理钱包充值、店铺续费、积分、数据与企业存储扩容。" },
  "/workbench/plans/orders": { section: "套餐与权益 / 账单与订单", title: "账单与订单", description: "集中查看店铺续费、积分充值、数据充值、存储扩容及服务订单。" },
  "/workbench/account/organization": { section: "我的账户 / 企业空间", title: "企业空间", description: "统一查看企业成员、店铺与资源分配状态，并进入各项管理。" },
  "/workbench/account/organization/members": { section: "我的账户 / 企业空间 / 成员管理", title: "成员管理", description: "邀请和管理企业成员，查看成员状态与归属。" },
  "/workbench/account/organization/roles": { section: "我的账户 / 企业空间 / 角色权限", title: "角色权限", description: "配置业务角色和访问权限，控制页面与数据访问范围。" },
  "/workbench/account/organization/resources": { section: "我的账户 / 企业空间 / 资源与额度", title: "资源与额度", description: "统一管理企业存储、续费期数、AI积分与数据额度，并按角色分配资源。" },
  "/workbench/account/organization/audit": { section: "我的账户 / 企业空间 / 操作记录", title: "操作记录", description: "记录成员、角色权限、资源分配和续费的关键操作。" },
  "/workbench/account/profile/business": { section: "我的账户 / 账户资料 / 经营画像", title: "经营画像", description: "让系统理解你的经营阶段、资源条件和实际需求。" },
  "/workbench/account/profile/verification": { section: "我的账户 / 账户资料 / 认证信息", title: "认证信息", description: "完成个人或企业主体认证，便于后续业务服务与合作申请时核验主体信息。" },
  "/workbench/account/referrals": { section: "我的账户 / 推广与收益", title: "推广与收益", description: "查看推广入口、收益结算、提现进度与推广规则。" },
  "/workbench/account/referrals/center": { section: "我的账户 / 推广与收益 / 推广中心", title: "推广中心", description: "查看专属推广入口、邀请记录与推广进展。" },
  "/workbench/account/referrals/earnings": { section: "我的账户 / 推广与收益 / 收益明细", title: "收益明细", description: "查看推广收益、结算状态和关联记录。" },
  "/workbench/account/referrals/withdrawals": { section: "我的账户 / 推广与收益 / 提现管理", title: "提现管理", description: "查看可提现金额、申请记录和处理进度。" },
  "/workbench/account/referrals/rules": { section: "我的账户 / 推广与收益 / 推广规则", title: "推广规则", description: "了解推广关系、收益计算与结算说明。" },
};

const dataMarket = [
  ["商品数据", "覆盖商品信息、价格、类目、图片与变体等数据，按平台及站点获取。", "已开放", "商品信息 · 平台与站点"],
  ["市场趋势数据", "面向市场热度、品类变化和消费需求趋势的数据分析服务。", "暂未开放", "趋势分析 · 品类热度"],
  ["关键词数据", "围绕搜索关键词、趋势词和市场关注度的专题数据服务。", "暂未开放", "关键词 · 市场关注度"],
  ["店铺数据", "涵盖店铺商品结构、经营表现与业务分析相关的数据资源。", "暂未开放", "店铺经营 · 数据分析"],
  ["品牌数据", "提供品牌维度、市场表现和商品关联等数据服务能力。", "暂未开放", "品牌洞察 · 商品关联"],
  ["定制数据", "根据实际业务目标，自定义数据范围、字段、规模、更新与交付要求。", "按需定制", "专属数据 · 按需交付"],
];
const services = [
  ["公司注册", "协助梳理企业设立所需资料，了解办理事项与申请流程。", "注册方案咨询 · 申请资料指导 · 办理进度跟进", "企业服务"],
  ["商标注册", "围绕品牌保护和注册需求，了解申请准备及办理事项。", "注册前查询 · 申请材料整理 · 注册进度跟进", "企业服务"],
  ["店铺开通服务", "协助梳理平台开户入驻准备事项，跟进资料提交与开通流程。", "开通流程指导 · 申请资料准备 · 开通过程协助", "店铺服务"],
  ["店铺代运营", "围绕日常店铺运营与商品管理，了解可协作的服务内容。", "商品与店铺管理 · 日常运营执行 · 经营数据分析", "店铺服务"],
];
const products = ["复古水洗牛仔外套", "便携式户外折叠收纳箱", "北欧风陶瓷餐具套装", "女士轻奢链条单肩包", "无线蓝牙头戴式耳机", "大容量运动保温水壶"];

export function RouteDetailPreview({ pathname, organizationId="SM-ENT-000001", memberId="admin" }: { pathname: string;organizationId?:string;memberId?:string }) {
  const page = routes[pathname];
  if (!page) return null;
  if (pathname === "/workbench/supply/applications" || pathname.startsWith("/workbench/supply/applications/")) return <PreferredApplicationPreview key={pathname} pathname={pathname} />;
  if (pathname === "/workbench/account/profile/business" || pathname === "/workbench/account/profile/verification") return <AccountProfilePreview key={pathname+"-"+organizationId+"-"+memberId} pathname={pathname} organizationId={organizationId} memberId={memberId} />;
  return <RoutePage key={pathname+"-"+organizationId+"-"+memberId} page={page} pathname={pathname} organizationId={organizationId} memberId={memberId} />;
}

type DetailState = {
  active: string; setActive: (value: string) => void;
  query: string; setQuery: (value: string) => void;
  submit: (label: string) => void;
  filters: Record<string,string>;
  setFilter: (name: string, value: string) => void;
  resetFilters: () => void;
};
const filterChoices: Record<string, string[]> = {
  "全部平台": ["SHEIN"],
  "全部站点": ["美国站","加拿大站"],
  "全部店铺": ["一号店","二号店"],
  "全部状态": ["在售","审核中","已下架","待发货","运输中","已完成","异常订单","正常","授权正常","已支付","已到账","待结算","已结算","有效","邀请中"],
  "全部时间": ["今天","昨天","08-28","08-25","08-20"],
  "全部角色": ["管理员","运营负责人","商品运营"],
  "全部类型": ["半托管","全托管","店铺服务","积分充值","数据充值","商品优化","服务购买"],
  "全部分组": ["核心店铺","加拿大市场"],
  "时间：本月": ["今天","昨天"],
  "全部操作": ["成员与权限","资源与额度","店铺服务"],
  "全部成员": ["钟海忠","张琳"],
};
function FilterSelect({ label, filters, setFilter }: {
 label:string;filters:Record<string,string>;setFilter:(name:string,value:string)=>void
}) {
 return <select className={styles.filterSelect} aria-label={label} value={filters[label]||label} onChange={e=>setFilter(label,e.target.value)}>
   <option>{label}</option>{(filterChoices[label]||[]).map(v=><option key={v}>{v}</option>)}
 </select>;
}
function containsFilter(row: string[], filters: Record<string,string>, name:string) {
 const value=filters[name];return !value||value===name||row.join(" ").includes(value);
}
function downloadDemoCsv(name:string,rows:string[][]) {
  const escape = (value:string) => {
    const safe=/^[=+\-@\t\r]/.test(value)?"'"+value:value;
    return '"' + safe.replaceAll('"','""') + '"';
  };
  const csv="\uFEFF"+rows.map(row=>row.map(escape).join(",")).join("\r\n");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  const anchor=document.createElement("a");anchor.href=url;anchor.download=name;
  document.body.appendChild(anchor);anchor.click();anchor.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}


function StoreProductsPage({ active, setActive, query, setQuery, submit, filters, setFilter, resetFilters }: DetailState) {
  const items = [["春季家居收纳套装", "HOME-001", "美国站", "一号店", "$19.99", "238", "在售", "已同步", "#4f8cd8"], ["蕾丝居家睡衣套装", "SLEEP-016", "美国站", "一号店", "$15.99", "126", "在售", "已同步", "#9160bb"], ["户外便携收纳袋", "BAG-028", "加拿大站", "二号店", "$18.99", "84", "审核中", "同步中", "#28a694"], ["厨房硅胶工具套装", "KIT-032", "加拿大站", "二号店", "$12.99", "196", "在售", "已同步", "#c3943b"], ["旅行压缩收纳袋", "TRAVEL-045", "美国站", "一号店", "$9.99", "0", "已下架", "已同步", "#bc5960"]];
  return <><section className={styles.productMetrics}>{[["全部商品", "1,286", "已同步"], ["在售商品", "1,142", "88.8%"], ["审核中", "24", "等待平台"], ["已下架", "120", "可重新上架"], ["同步异常", "—", "待统计"]].map(([a,b,c],i)=><article data-step={i} key={a}><div><span>{a}</span><small>{c}</small></div><strong>{b}</strong></article>)}</section><section className={styles.productTabs}>{["全部商品", "在售", "审核中", "已下架", "同步异常"].map(x=><button key={x} className={active===x||active==="全部"&&x==="成员管理"?styles.selected:""} onClick={()=>setActive(x)}>{x}</button>)}<small>仅展示已发布到店铺的商品</small></section><section className={styles.productFilters}><div className={styles.commerceFilterSelects}>{["全部平台","全部站点","全部店铺","全部状态"].map(x=><FilterSelect key={x} label={x} filters={filters} setFilter={setFilter}/>)}</div><div className={styles.commerceFilterActions}><input aria-label="搜索商品标题或SKU" value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索商品标题、SKU或商品ID"/><button onClick={()=>{setQuery("");resetFilters()}}>重置</button><button className={styles.primary} onClick={()=>submit("确认筛选")}>确认</button></div></section><section className={styles.productTable}><header><h2>商品列表 <small>共 1,286 件商品</small></h2><small>每页 100 条</small></header><div className={styles.productTableHead}><span>□</span><b>商品信息</b><b>平台 / 站点</b><b>店铺</b><b>售价</b><b>库存</b><b>在售状态</b><b>同步状态</b><b>操作</b></div>{items.filter(r=>(active==="全部商品"||active==="全部"||r[6]===active)&&r.join(" ").includes(query)&&containsFilter(r,filters,"全部站点")&&containsFilter(r,filters,"全部店铺")&&containsFilter(r,filters,"全部状态")).map(r=><div className={styles.productTableRow} key={r[1]}><input type="checkbox" aria-label={`选择${r[0]}`}/><span className={styles.productName}><i style={{background:r[8]}}/><span><b>{r[0]}</b><small>SKU: {r[1]}</small></span></span><span><b className={styles.platformTag}>SHEIN</b>　{r[2]}</span><span>{r[3]}</span><span>{r[4]}</span><span className={r[5]==="0"?styles.danger:""}>{r[5]}</span><span><b className={styles.statusTag} data-state={r[6]}>{r[6]}</b></span><span><b className={styles.statusTag} data-state={r[7]}>{r[7]}</b></span><button onClick={()=>submit(`查看${r[0]}详情`)}>查看详情</button></div>)}</section></>;
}

function OrderFulfillmentPage({ active, setActive, query, setQuery, submit, filters, setFilter, resetFilters }: DetailState) {
  const items = [["SO-20260825-0086", "春季家居收纳套装 ×2", "美国站", "一号店", "$39.98", "今天 12:32", "待发货", "待揽收"], ["SO-20260825-0085", "蕾丝居家睡衣 ×1", "美国站", "一号店", "$15.99", "今天 11:46", "待发货", "面单已建"], ["SO-20260825-0084", "户外便携收纳袋 ×1", "加拿大站", "二号店", "$18.99", "今天 10:28", "运输中", "运输中"], ["SO-20260824-0083", "厨房硅胶工具套装 ×1", "加拿大站", "二号店", "$12.99", "昨天 18:57", "已完成", "已签收"], ["SO-20260824-0082", "旅行压缩收纳袋 ×2", "美国站", "一号店", "$19.98", "昨天 16:32", "异常订单", "地址异常"]];
  return <><section className={styles.orderMetrics}>{[["今日订单", "86", "较昨日 +12"], ["待处理", "—", "持续统计"], ["待发货", "12", "需处理"], ["运输中", "43", "物流正常"], ["已完成", "—", "持续统计"], ["售后中", "—", "持续统计"], ["异常订单", "2", "优先处理"]].map(([a,b,c],i)=><article data-step={i} key={a}><div><span>{a}</span><small>{c}</small></div><strong>{b}</strong></article>)}</section><section className={styles.orderTabs}>{["全部订单", "待处理", "待发货", "运输中", "已完成", "售后中", "异常订单"].map(x=><button key={x} className={active===x?styles.selected:""} onClick={()=>setActive(x)}>{x}</button>)}<small>当前开放平台： SHEIN</small></section><section className={styles.productFilters}><div className={styles.commerceFilterSelects}>{["全部平台","全部站点","全部店铺","全部状态","全部时间"].map(x=><FilterSelect key={x} label={x} filters={filters} setFilter={setFilter}/>)}</div><div className={styles.commerceFilterActions}><input aria-label="搜索订单号或商品" value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索订单号或商品名称"/><button onClick={()=>{setQuery("");resetFilters()}}>重置</button><button className={styles.primary} onClick={()=>submit("确认筛选")}>确认</button><button onClick={()=>submit("批量发货")}>批量发货</button></div></section><section className={styles.orderTable}><header><h2>订单与履约列表 <small>共86笔今日订单</small></h2><small>每页100条</small></header><div className={styles.orderTableHead}><span>□</span><b>订单 / 商品</b><b>平台 / 站点</b><b>店铺</b><b>金额</b><b>下单时间</b><b>履约状态</b><b>物流状态</b><b>发货时限</b><b>操作</b></div>{items.filter(r=>(active==="全部订单"||active==="全部"||r[6]===active)&&r.join(" ").includes(query)&&containsFilter(r,filters,"全部站点")&&containsFilter(r,filters,"全部店铺")&&containsFilter(r,filters,"全部状态")&&containsFilter(r,filters,"全部时间")).map((r,i)=><div className={styles.orderTableRow} key={r[0]}><input type="checkbox" aria-label={`选择订单${r[0]}`}/><span><b>{r[0]}</b><small>{r[1]}</small></span><span><b className={styles.platformTag}>SHEIN</b>　{r[2]}</span><span>{r[3]}</span><strong>{r[4]}</strong><span>{r[5]}</span><b className={styles.statusTag} data-state={r[6]}>{r[6]}</b><b className={styles.statusTag} data-state={r[7]}>{r[7]}</b><small>{i<2?i===0?"06:18:42":"12:40:10":"—"}</small><button onClick={()=>submit(r[6]==="待发货"?"开始发货":"查看订单")}>{r[6]==="待发货"?"去发货":"查看"}</button></div>)}</section></>;
}

function priceOf(type:string,quantity:number):number{
 return Math.round((type==="店铺服务"?quantity*168:type==="企业存储"?quantity:quantity)*100)/100;
}
type TablePageState={page:number;size:number};
function LedgerPagination({name,total,page,size,onPage,onSize}:{name:string;total:number;page:number;size:number;onPage:(page:number)=>void;onSize:(size:number)=>void}){
 const count=Math.max(1,Math.ceil(total/size));
 const current=Math.min(Math.max(1,page),count);
 return <div className={styles.ledgerPagination} role="navigation" aria-label={name+"分页"}>
  <div className={styles.ledgerPageSize}><label htmlFor={"ledger-size-"+name}>每页显示</label><select id={"ledger-size-"+name} aria-label={name+"每页显示"} value={size} onChange={e=>onSize(Number(e.target.value))}>{[10,20,50].map(n=><option key={n} value={n}>{n} 条</option>)}</select><span>共 {total} 条记录</span></div>
  <div className={styles.ledgerPageActions}><span aria-live="polite">第 {current} / {count} 页</span><button type="button" aria-label={name+"上一页"} disabled={current<=1} onClick={()=>onPage(current-1)}>上一页</button><button type="button" aria-label={name+"下一页"} disabled={current>=count} onClick={()=>onPage(current+1)}>下一页</button></div>
 </div>;
}
function PlanDetail({ pathname, active, setActive, query, setQuery, submit, filters, setFilter, resetFilters, router, organizationId,memberId }: DetailState & { pathname: string; router: ReturnType<typeof useRouter>;organizationId:string;memberId:string }) {
  const [purchaseAmounts,setPurchaseAmounts]=useState<Record<string,string>>({});
  const {purchases:demoPurchases,setPurchases:setDemoPurchases,totals:demoTotals}=useDemoPurchases(organizationId);
  const {state:enterpriseSuite}=useShowcaseSuite();
  const organizationAdmin=memberId==="admin"||getDemoMembership({organizationId,memberId})?.role==="管理员";
  const bindingSummary=useDemoStoreBindings(organizationId,memberId,organizationAdmin);
  const memberVisibleStores=organizationAdmin?bindingSummary.organizationCount:bindingSummary.visibleCount;
  const assignedStorePeriods=organizationId==="SM-ENT-000001"?Object.values(enterpriseSuite.storeAllocations).reduce((sum,value)=>sum+(Number(value)||0),0):0;
  const consumedStorePeriods=countPoolConsumedStorePeriods(bindingSummary.all);
  const activeServiceCount=bindingSummary.visible.filter(store=>demoStoreServiceActive(store)).length;
  const availableStorePeriods=organizationAdmin?Math.max(0,demoTotals.renewalPeriods-assignedStorePeriods-consumedStorePeriods):Math.max(0,organizationId==="SM-ENT-000001"?(enterpriseSuite.storeAllocations[memberId]||0):0);
  // Consumption is intentionally zero until the corresponding business modules are connected.
  const allocated=(items:Record<string,number>)=>Object.values(items).reduce((sum,value)=>sum+(Number(value)||0),0);
  const assignedAi=organizationId==="SM-ENT-000001"?allocated(enterpriseSuite.pointAllocations):0;
  const assignedData=organizationId==="SM-ENT-000001"?allocated(enterpriseSuite.dataAllocations):0;
  const assignedStorage=organizationId==="SM-ENT-000001"?allocated(enterpriseSuite.allocations):0;
  const availableAi=organizationAdmin?Math.max(0,demoTotals.aiPoints-assignedAi):Math.max(0,enterpriseSuite.pointAllocations[memberId]||0);
  const availableData=organizationAdmin?Math.max(0,demoTotals.dataRows-assignedData):Math.max(0,enterpriseSuite.dataAllocations[memberId]||0);
  const availableStorage=organizationAdmin?Math.max(0,demoTotals.storageGiB-assignedStorage):Math.max(0,enterpriseSuite.allocations[memberId]||0);
  const physicalStorageRemaining=Math.max(0,demoTotals.storageGiB-plansDemoFacts.storageUsedGiB);
  const purchaseSubmitting=useRef(false);
  const [requestReview,setRequestReview]=useState<{type:string;quantity:number;quote:string}|null>(null);
  const [walletAmount,setWalletAmount]=useState("");
  const [invoiceOpen,setInvoiceOpen]=useState(false);
  const [requestNotice,setRequestNotice]=useState("");
  useEffect(()=>{
   if(!invoiceOpen)return;
   const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape")setInvoiceOpen(false)};
   window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
  },[invoiceOpen]);
  useEffect(()=>{
   if(!requestReview)return;
   const onKey=(event:KeyboardEvent)=>{if(event.key==="Escape"){event.preventDefault();setRequestReview(null)}};
   window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
  },[requestReview]);
  const currentWallet=demoPurchases.length?demoPurchases[0].balanceAfter:(organizationId==="SM-ENT-000001"?plansDemoFacts.walletBalanceCny:0);
  const extraFor=(type:string)=>demoPurchases.filter(p=>p.type===type).reduce((sum,p)=>sum+p.quantity,0);
  const additionalSpent=demoPurchases.filter(p=>p.type!=="账户充值").reduce((sum,p)=>sum+p.amountCny,0);
  const additionalTopups=demoPurchases.filter(p=>p.type==="账户充值").reduce((sum,p)=>sum+p.amountCny,0);
  const openReview=(type:string,quantity:number,quote:string)=>{
   setRequestNotice("");purchaseSubmitting.current=false;
   if(!organizationAdmin){setRequestNotice("当前身份是企业子账号，不能使用企业钱包购买或充值。请联系本组织管理员购买并分配资源。");return;}
   if(!Number.isFinite(quantity)||quantity<=0){setRequestNotice("请输入大于 0 的有效数量或金额。");return}
   if(!Number.isSafeInteger(Math.round(quantity*100))||Math.abs(Math.round(quantity*100)-quantity*100)>0.000001){setRequestNotice("金额最多保留两位小数。");return}
   if((type==="店铺服务"||type==="企业存储")&&!Number.isInteger(quantity)){setRequestNotice("店铺续费期数和扩容 GiB 必须为整数。");return}
   if(type!=="账户充值"&&priceOf(type,quantity)>currentWallet){setRequestNotice("演示钱包余额不足，请调整购买数量。");return}
   setRequestReview({type,quantity,quote});
  };
  const confirmPurchase=()=>{
   if(!requestReview||purchaseSubmitting.current)return;
   if(!organizationAdmin){setRequestNotice("只有当前组织管理员才能确认企业模拟交易。");setRequestReview(null);return;}
   const {type,quantity}=requestReview;
   const amount=priceOf(type,quantity);
   const fresh=readDemoPurchases(organizationId);
   const freshBalance=fresh.length?fresh[0].balanceAfter:(organizationId==="SM-ENT-000001"?plansDemoFacts.walletBalanceCny:0);
   if(type!=="账户充值"&&amount>freshBalance){setRequestNotice("钱包余额不足，未执行购买。");setRequestReview(null);return}
   const detail=type==="店铺服务"?quantity+" 期（每期 30 天）":type==="token 积分"?Math.round(quantity*plansDemoRates.aiPointsPerCny).toLocaleString("zh-CN")+" 积分":type==="数据资源"?Math.round(quantity/plansDemoRates.dataCnyPerRow).toLocaleString("zh-CN")+" 条":type==="企业存储"?quantity+" GiB / 30 天":"模拟钱包充值";
   const entry:DemoPurchase={id:crypto.randomUUID(),at:new Date().toLocaleString("zh-CN",{hour12:false}),type,quantity,amountCny:amount,detail,balanceAfter:Math.round((freshBalance+(type==="账户充值"?amount:-amount))*100)/100,status:type==="账户充值"?"模拟充值成功":"模拟购买成功"};
   const next=[entry,...fresh].slice(0,200);
   purchaseSubmitting.current=true;
   if(!writeDemoPurchases(next,organizationId)){purchaseSubmitting.current=false;setRequestNotice("当前浏览器无法保存交易，未扣款。");return}
   setDemoPurchases(next);setRequestReview(null);setRequestNotice(type==="账户充值"?"模拟充值已到账（非真实付款）。":"模拟购买成功，权益已更新（非真实付款）。");
   setPurchaseAmounts(v=>({...v,[type]:""}));if(type==="账户充值")setWalletAmount("");
  };
  const [planDetail,setPlanDetail]=useState<{kind:"usage"|"order";row:string[]}|null>(null);
  const [walletPage,setWalletPage]=useState<TablePageState>({page:1,size:10});
  const [ordersPage,setOrdersPage]=useState<TablePageState>({page:1,size:10});
  const [usagePage,setUsagePage]=useState<TablePageState>({page:1,size:10});

  const [usageMovement,setUsageMovement]=useState("全部变动");
  const [usageStore,setUsageStore]=useState("全部店铺");
  const [usageTime,setUsageTime]=useState("全部时间");
  const [usageFrom,setUsageFrom]=useState("");
  const [usageUntil,setUsageUntil]=useState("");
  const [usageFiltersOpen,setUsageFiltersOpen]=useState(false);
  const [usageStoreSearch,setUsageStoreSearch]=useState("");
  const [usageFilterError,setUsageFilterError]=useState("");
  const [appliedUsage,setAppliedUsage]=useState({query:"",movement:"全部变动",store:"全部店铺",tab:"全部流水",time:"全部时间",from:"",until:""});
  type BillFilters={query:string;time:string;from:string;until:string;types:string[]};
  const emptyBillFilters=():BillFilters=>({query:"",time:"全部时间",from:"",until:"",types:[]});
  const [orderDraft,setOrderDraft]=useState<BillFilters>(emptyBillFilters);
  const [appliedOrder,setAppliedOrder]=useState<BillFilters>(emptyBillFilters);
  const [orderAdvancedOpen,setOrderAdvancedOpen]=useState(false);
  const [billTypeSearch,setBillTypeSearch]=useState("");
  const [billFilterError,setBillFilterError]=useState("");
  const activeOrderFilterCount=Number(orderDraft.time!=="全部时间")+Number(orderDraft.types.length>0);
  const appliedOrderFilterCount=Number(appliedOrder.time!=="全部时间")+Number(appliedOrder.types.length>0);
  const billDay=(input:string)=>{
    const match=input.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})|(?:^|\D)(\d{1,2})[-/](\d{1,2})(?:\D|$)/);
    if(!match)return "";
    if(match[1])return [match[1],match[2].padStart(2,"0"),match[3].padStart(2,"0")].join("-");
    const year=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Shanghai",year:"numeric"}).format(new Date());
    return [year,(match[4]||"").padStart(2,"0"),(match[5]||"").padStart(2,"0")].join("-");
  };
  const todayShanghai=()=>new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const billDateMatches=(raw:string,f:BillFilters)=>{
    if(f.time==="全部时间")return true;
    const date=billDay(raw);if(!date)return false;
    const today=todayShanghai();
    if(f.time==="自定义")return (!f.from||date>=f.from)&&(!f.until||date<=f.until);
    if(f.time==="本月")return date.slice(0,7)===today.slice(0,7);
    if(f.time==="今天")return date===today;
    const duration=f.time==="近7天"?7:f.time==="近30天"?30:0;
    if(!duration)return true;
    const start=new Date(today+"T00:00:00Z");start.setUTCDate(start.getUTCDate()-duration+1);
    return date>=start.toISOString().slice(0,10)&&date<=today;
  };
  const orderMatches=(r:string[])=>r.join(" ").toLowerCase().includes(appliedOrder.query.toLowerCase())&&
    billDateMatches(r[0],appliedOrder)&&
    (!appliedOrder.types.length||appliedOrder.types.includes(r[1]));

  const purchaseValue=(label:string)=>Number(purchaseAmounts[label]||0);
  const positivePurchase=(label:string)=>Number.isFinite(purchaseValue(label))&&purchaseValue(label)>0;
  const purchaseEstimate=(label:string)=>!positivePurchase(label)?"请先输入数量或金额":label==="店铺服务"?"预计扣款：¥"+(purchaseValue(label)*168).toFixed(2)+" · 计入企业续费期数余额":label==="企业存储"?"预计费用：¥"+purchaseValue(label).toFixed(2)+" · 有效期 30 天":label==="token 积分"?"可兑换 "+Math.round(purchaseValue(label)*plansDemoRates.aiPointsPerCny).toLocaleString("en-US")+" 积分":label==="数据资源"?"可兑换 "+Math.round(purchaseValue(label)/plansDemoRates.dataCnyPerRow).toLocaleString("en-US")+" 条数据":"按资源规则计算";
  const usageRowMatches=(r:string[])=>r.join(" ").toLowerCase().includes(appliedUsage.query.toLowerCase())&&(appliedUsage.tab==="全部"||appliedUsage.tab==="全部流水"||r[1].includes(appliedUsage.tab))&&(appliedUsage.movement==="全部变动"||(appliedUsage.movement==="扣减"?r[4].startsWith("-"):appliedUsage.movement==="充值"?r[4].startsWith("+"):r[3].includes("赠送")))&&(appliedUsage.store==="全部店铺"||r.join(" ").includes(appliedUsage.store))&&billDateMatches(r[0],{time:appliedUsage.time,from:appliedUsage.from,until:appliedUsage.until,query:"",types:[]});
  const primaryOrganization=organizationId==="SM-ENT-000001";
  const historicalPurchases=primaryOrganization?plansDemoPurchases:[];
  const historicalCredit=primaryOrganization?plansDemoWalletCredit:null;
  const rows: string[][] = pathname.endsWith("usage") ? [] : [...(historicalCredit?[[historicalCredit.occurredAt,"钱包充值",historicalCredit.description,`¥${historicalCredit.amountCny.toLocaleString("zh-CN")}.00`,historicalCredit.status]]:[]),...historicalPurchases.map(p=>[p.at,p.type,p.detail,`¥${p.amountCny.toLocaleString("zh-CN")}.00`,p.status]),...demoPurchases.map(p=>[p.at,p.type,p.detail,"¥"+p.amountCny.toFixed(2),p.status])];
  const walletRows=[
   ...(historicalCredit?[{id:"credit",at:historicalCredit.occurredAt,type:"模拟充值",detail:historicalCredit.description,amount:"+"+"¥"+historicalCredit.amountCny.toLocaleString("zh-CN")+".00",balance:"¥10,000.00"}]:[]),
   ...historicalPurchases.map((p,i)=>({id:p.id,at:p.at,type:"模拟购买",detail:p.type+" · "+p.detail,amount:"-¥"+p.amountCny.toLocaleString("zh-CN")+".00",balance:"¥"+((historicalCredit?.amountCny||0)-historicalPurchases.slice(0,i+1).reduce((v,item)=>v+item.amountCny,0)).toLocaleString("zh-CN")+".00"})),
   ...demoPurchases.map(p=>({id:p.id,at:p.at,type:p.status,detail:p.type+" · "+p.detail,amount:(p.type==="账户充值"?"+":"-")+"¥"+p.amountCny.toFixed(2),balance:"¥"+p.balanceAfter.toFixed(2)}))
  ];
  const billTypes=[...new Set(rows.map(r=>r[1]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"zh-CN"));
  const toggleBillChoice=(value:string)=>setOrderDraft(v=>({...v,types:v.types.includes(value)?v.types.filter(x=>x!==value):[...v.types,value]}));
  const applyBillFilters=()=>{
    if(orderDraft.time==="自定义"&&(!orderDraft.from||!orderDraft.until||orderDraft.from>orderDraft.until)){setBillFilterError("请选择完整且有效的起止日期。");setOrderAdvancedOpen(true);return;}
    setBillFilterError("");setAppliedOrder({...orderDraft,query:orderDraft.query.trim()});setOrdersPage(v=>({...v,page:1}));setOrderAdvancedOpen(false);
  };
  const filteredOrderRows=rows.filter(orderMatches);
  const filteredUsageRows=rows.filter(usageRowMatches);
  const pageSlice=<T,>(items:T[],pager:TablePageState):T[]=>items.slice((Math.min(pager.page,Math.max(1,Math.ceil(items.length/pager.size)))-1)*pager.size,Math.min(pager.page,Math.max(1,Math.ceil(items.length/pager.size)))*pager.size);
  const updatePage=(set:React.Dispatch<React.SetStateAction<TablePageState>>)=>(page:number)=>set(v=>({...v,page}));
  const updateSize=(set:React.Dispatch<React.SetStateAction<TablePageState>>)=>(size:number)=>set({page:1,size});
  const reviewDialog=requestReview?<div className={styles.planDetailBackdrop} onMouseDown={event=>{if(event.target===event.currentTarget)setRequestReview(null)}}>
   <section className={styles.planDetailDialog} role="dialog" aria-modal="true" aria-label="确认模拟购买">
    <header><div><h2>确认{requestReview.type==="账户充值"?"模拟充值":"模拟购买"}</h2><p>仅使用演示钱包和本地模拟权益，不会扣除真实资金，也不会创建真实支付订单。</p></div><button type="button" aria-label="关闭申请弹窗" onClick={()=>setRequestReview(null)}>×</button></header>
    <dl><div><dt>资源类型</dt><dd>{requestReview.type}</dd></div><div><dt>数量或金额</dt><dd>{requestReview.quantity}{requestReview.type==="店铺服务"?" 期":requestReview.type==="企业存储"?" GiB":" 元"}</dd></div><div><dt>本次金额</dt><dd>¥{priceOf(requestReview.type,requestReview.quantity).toFixed(2)}</dd></div><div><dt>当前演示钱包余额</dt><dd>¥{currentWallet.toFixed(2)}</dd></div><div><dt>购买说明</dt><dd>{requestReview.quote}</dd></div></dl>
    <footer><button type="button" onClick={()=>setRequestReview(null)}>返回修改</button><button type="button" className={styles.primary} onClick={confirmPurchase}>确认{requestReview.type==="账户充值"?"模拟充值":"购买并扣除演示余额"}</button></footer>
   </section>
  </div>:null;
  const draftAlert=requestNotice?<p className={styles.planEmpty} role="status">{requestNotice}</p>:null;

  if (pathname.endsWith("options")) return <><section className={styles.noticeBar}><b>基础方案 · 按需使用</b><span>店铺服务按期购买，AI 积分、数据与企业存储扩容按需计费。</span></section><section className={`${styles.cards} ${styles.fourCards}`}>{[["店铺服务", "¥168 / 店 / 期", "每期为 30 天；各店铺独立计时，到期未续费停止使用。", "多店优惠按当前配置计算"], ["AI 积分", "¥1 = 10,000 积分", "充值后按模型与任务类型扣减，余额长期保留。", "按实际使用量扣除"], ["数据服务", "¥0.01 / 条", "按当前单价换算，按成功调用的数据条数扣减。", "余额长期保留"], ["企业存储", "¥1 / GiB / 30天", "默认共享 5 GiB；扩容按 GiB 计价，激活后独立计算 30 天。", "到期不自动续费"]].map(([title,price,description,note],i)=><article className={styles.card} data-tone={i} key={title}><h3>{title}</h3><h2>{price}</h2><p>{description}</p><small>{note}</small></article>)}</section></>;
  if (pathname.endsWith("entitlements")) return <>
  <section className={`${styles.cards} ${styles.fourCards} ${styles.planEntitlementCards}`}>
    <article className={styles.card} data-tone={0}>
      <div className={styles.cardTitle}><h3>店铺服务</h3><span>剩余可分配</span></div>
      <div className={styles.planEntitlementStoreSplit}>
        <div><small>已绑定店铺</small><strong>{memberVisibleStores}<em>家</em></strong></div>
        <div><small>剩余可分配期数</small><strong>{availableStorePeriods}<em>期</em></strong></div>
      </div>
      <div className={styles.planEntitlementNotes}><span>{organizationAdmin?`企业总期数：${demoTotals.renewalPeriods} 期 · 已分配：${assignedStorePeriods} 期`:`本人剩余可用期数：${availableStorePeriods} 期`}</span><span>已授权：0 家 · 待授权：{memberVisibleStores} 家 · 服务中：{activeServiceCount} 家 · 已使用：{organizationAdmin?consumedStorePeriods:countConsumedStorePeriods(bindingSummary.visible)} 期</span><span>剩余可分配：{availableStorePeriods} 期 · 每店 30 天/期，开通或续费消耗 1 期</span><span>{organizationAdmin?"可在企业空间 → 资源与额度分配给成员":"续费期数由本组织管理员分配"}</span></div>
    </article>
    <article className={styles.card} data-tone={1}>
      <div className={styles.cardTitle}><h3>token 积分</h3><span>剩余可分配</span></div>
      <strong className={styles.planEntitlementValue}>{availableAi.toLocaleString("zh-CN")}</strong>
      <div className={styles.planEntitlementNotes}><span>兑换标准：¥1 = 10,000 积分</span><span>{organizationAdmin?`企业总额：${demoTotals.aiPoints.toLocaleString("zh-CN")} · 已分配：${assignedAi.toLocaleString("zh-CN")}`:`本人已分配：${availableAi.toLocaleString("zh-CN")}`}</span><span>已使用：0 · 剩余：{availableAi.toLocaleString("zh-CN")}</span></div>
    </article>
    <article className={styles.card} data-tone={2}>
      <div className={styles.cardTitle}><h3>数据服务</h3><span>剩余可分配</span></div>
      <strong className={styles.planEntitlementValue}>{availableData.toLocaleString("zh-CN")} 条</strong>
      <div className={styles.planEntitlementNotes}><span>兑换标准：¥0.01 / 条</span><span>{organizationAdmin?`企业总额：${demoTotals.dataRows.toLocaleString("zh-CN")} 条 · 已分配：${assignedData.toLocaleString("zh-CN")} 条`:`本人已分配：${availableData.toLocaleString("zh-CN")} 条`}</span><span>已使用：0 条 · 剩余：{availableData.toLocaleString("zh-CN")} 条</span></div>
    </article>
    <article className={styles.card} data-tone={3}>
      <div className={styles.cardTitle}><h3>企业存储</h3><span>剩余可分配</span></div>
      <strong className={styles.planEntitlementValue}>{availableStorage.toFixed(2)} GiB</strong>
      <div className={styles.planEntitlementStorageDetails}>
        <div><span>免费容量</span><strong>{organizationAdmin?"5.00 GiB":"企业共享，不直接归属个人"}</strong></div>
        <div><span>扩容容量</span><strong>{((organizationId==="SM-ENT-000001"?3:0)+extraFor("企业存储")).toFixed(2)} GiB</strong></div>
        <div><span>已分配上限</span><strong>{(organizationAdmin?assignedStorage:availableStorage).toFixed(2)} GiB</strong></div>
        <div><span>实际已用</span><strong>{plansDemoFacts.storageUsedGiB.toFixed(2)} GiB</strong></div>
        <div><span>实际剩余空间</span><strong>{physicalStorageRemaining.toFixed(2)} GiB</strong></div>
      </div>
    </article>
  </section>
  <section className={styles.planResourceLink}><div><h2>企业资源管理</h2><p>成员资源分配、共享存储及扩容状态可在企业空间查看。</p></div><button onClick={()=>router.push("/workbench/account/organization/resources?preview=1")}>前往资源与额度</button></section>
  </>;
    if (pathname.endsWith("usage")) return <><section className={styles.metrics}>{[["店铺费用", "¥0.00", "本月没有店铺费用"], ["AI 积分消耗", "0", "本月消耗 0 积分"], ["数据消耗", "0 条", "本月使用 0 条数据"], ["企业存储占用", plansDemoDisplay.storageUsed, `总容量 ${plansDemoDisplay.storageCapacity}`]].map(([a,b,c])=><article key={a} className={styles.planMetricCard}><strong className={styles.planMetricValue}>{b}</strong><div className={styles.planMetricCopy}><span>{a}</span><small>{c}</small></div></article>)}</section><section className={styles.tabs}>{["全部流水", "店铺费用", "token 积分", "数据额度", "企业存储"].map(x=><button key={x} className={active===x?styles.selected:""} onClick={()=>{setActive(x);setAppliedUsage(v=>({...v,tab:x}));setUsagePage(v=>({...v,page:1}))}}>{x}</button>)}</section><section className={styles.billingFilterShell} aria-label="用量流水筛选">
    <form className={styles.billingFilterToolbar} onSubmit={e=>{e.preventDefault();if(usageTime==="自定义"&&(!usageFrom||!usageUntil||usageFrom>usageUntil)){setUsageFilterError("请选择完整且有效的起止日期。");setUsageFiltersOpen(true);return;}setUsageFilterError("");setAppliedUsage({query:query.trim(),movement:usageMovement,store:usageStore,tab:active==="全部"?"全部流水":active,time:usageTime,from:usageFrom,until:usageUntil});setUsagePage(v=>({...v,page:1}));setUsageFiltersOpen(false)}}>
      <input aria-label="搜索流水" value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索流水单号或说明"/>
      <button type="button" className={usageFiltersOpen||usageTime!=="全部时间"||usageMovement!=="全部变动"||usageStore!=="全部店铺"?styles.billingFilterActive:""} aria-label="用量筛选条件" aria-expanded={usageFiltersOpen} aria-controls="usage-advanced-filters" onClick={()=>setUsageFiltersOpen(v=>!v)}>筛选条件</button>
      <div className={styles.billingFilterActions}>
        <button type="button" onClick={()=>{setQuery("");setUsageMovement("全部变动");setUsageStore("全部店铺");setUsageTime("全部时间");setUsageFrom("");setUsageUntil("");setUsageStoreSearch("");setUsageFilterError("");setUsageFiltersOpen(false);setActive("全部流水");setAppliedUsage({query:"",movement:"全部变动",store:"全部店铺",tab:"全部流水",time:"全部时间",from:"",until:""});setUsagePage(v=>({...v,page:1}))}}>重置</button>
        <button className={styles.primary} type="submit">确定</button>
        <button type="button" disabled={!rows.some(usageRowMatches)} onClick={()=>downloadDemoCsv("用量明细-演示.csv",rows.filter(usageRowMatches))}>导出明细</button>
      </div>
    </form>
    {usageFiltersOpen?<div id="usage-advanced-filters" className={styles.billingAdvancedFilters} role="group" aria-label="用量高级筛选">
      <div className={styles.billingFilterSection}>
        <span className={styles.billingFilterLabel}>时间范围</span>
        <div className={styles.billingTimePresets} role="group" aria-label="用量快捷时间">{["全部时间","今天","近7天","近30天","本月","自定义"].map(t=><button key={t} type="button" aria-pressed={usageTime===t} onClick={()=>{setUsageTime(t);setUsageFilterError("")}}>{t}</button>)}</div>
        {usageTime==="自定义"?<div className={styles.billingDateRange}><label>开始日期<input aria-label="用量开始日期" type="date" max={usageUntil||undefined} value={usageFrom} onChange={e=>{setUsageFrom(e.target.value);setUsageFilterError("")}}/></label><span>至</span><label>结束日期<input aria-label="用量结束日期" type="date" min={usageFrom||undefined} value={usageUntil} onChange={e=>{setUsageUntil(e.target.value);setUsageFilterError("")}}/></label></div>:null}
      </div>
      <div className={styles.billingFilterSection}>
        <span className={styles.billingFilterLabel}>变动类型</span>
        <div className={styles.billingTimePresets} role="group" aria-label="用量变动类型">{["全部变动","扣减","充值","赠送"].map(t=><button key={t} type="button" aria-pressed={usageMovement===t} onClick={()=>setUsageMovement(t)}>{t}</button>)}</div>
      </div>
      <div className={styles.billingFilterSection}>
        <span className={styles.billingFilterLabel}>关联店铺</span>
        <input aria-label="搜索关联店铺" type="search" value={usageStoreSearch} onChange={e=>setUsageStoreSearch(e.target.value)} placeholder="搜索店铺名称..."/>
        <div className={styles.billingChoiceList} role="group" aria-label="关联店铺选项">
          {["全部店铺",...Array.from(new Set(rows.map(row=>row[2]).filter(value=>value&&/店铺|店$/.test(value))))].filter(x=>x.includes(usageStoreSearch.trim())).map(s=><label key={s}><input type="radio" name="usage-store" checked={usageStore===s} onChange={()=>setUsageStore(s)}/><span>{s}</span></label>)}
        </div>
      </div>
      {usageFilterError?<p className={styles.billingFilterError} role="alert">{usageFilterError}</p>:null}
      <p className={styles.billingFilterHelp}>店铺选项根据实际流水动态更新，搜索后选择；时间支持自定义日期区间。更细的记录可使用主搜索框查找。</p>
    </div>:null}
   </section><section className={styles.table}><header><h2>流水明细</h2></header><div className={styles.planTableScroll}><div className={`${styles.tableHead} ${styles.planUsageColumns}`}>{["时间","类型","业务对象","变动说明","变动","变动后余额","操作"].map(label=><span key={label}>{label}</span>)}</div>{pageSlice(filteredUsageRows,usagePage).map((r,i)=><div className={`${styles.serviceRow} ${styles.planUsageColumns}`} key={i}>{r.map((x,j)=><span key={j}>{x}</span>)}<button onClick={()=>setPlanDetail({kind:"usage",row:r})}>详情</button></div>)}</div>{!filteredUsageRows.length&&<p className={styles.planEmpty}>暂无用量流水。充值或使用资源后将在此显示记录。</p>}<LedgerPagination name="流水明细" total={filteredUsageRows.length} page={usagePage.page} size={usagePage.size} onPage={updatePage(setUsagePage)} onSize={updateSize(setUsagePage)}/></section>{planDetail?.kind==="usage"&&<div className={styles.planDetailBackdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setPlanDetail(null)}}><section className={styles.planDetailDialog} role="dialog" aria-modal="true" aria-label="流水详情"><header><div><h2>流水详情</h2><p>演示流水，不涉及真实扣费或账务。</p></div><button type="button" aria-label="关闭流水详情" onClick={()=>setPlanDetail(null)}>×</button></header><div className={styles.planDetailHighlight}><span>变动金额或额度</span><strong>{planDetail.row[4]}</strong><small>{planDetail.row[1]} · {planDetail.row[2]}</small></div><dl>{[["时间",planDetail.row[0]],["资源类型",planDetail.row[1]],["业务对象",planDetail.row[2]],["变动说明",planDetail.row[3]],["变动金额或额度",planDetail.row[4]],["变动后余额",planDetail.row[5]]].map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><footer><button type="button" onClick={()=>setPlanDetail(null)}>关闭</button></footer></section></div>}</>;
  if (!organizationAdmin&&(pathname.endsWith("top-up")||pathname.endsWith("orders"))) return <section className={styles.noticeBar}><b>企业账务仅管理员可管理</b><span>当前子账号只能查看个人已分配权益与店铺服务期。请联系本组织管理员购买、充值或分配资源。</span><button type="button" onClick={()=>router.push("/workbench/plans/entitlements?preview=1")}>查看我的权益</button></section>;
  if (pathname.endsWith("top-up")) return <><section className={styles.noticeBar}><b>账户可用余额</b><span><strong>¥{currentWallet.toLocaleString("zh-CN",{minimumFractionDigits:2,maximumFractionDigits:2})}</strong>　累计模拟充值 ¥{((primaryOrganization?plansDemoFacts.walletTopUpsCny:0)+additionalTopups).toLocaleString("zh-CN")} · 累计模拟支出 ¥{((primaryOrganization?plansDemoFacts.walletSpentCny:0)+additionalSpent).toLocaleString("zh-CN")}。余额用于续费、积分与数据兑换，存储扩容独立购买。</span><label>充值金额（元）<input type="number" aria-label="充值金额（元）" min="0.01" step="0.01" value={walletAmount} onChange={e=>setWalletAmount(e.target.value)} placeholder="输入充值金额"/></label><button className={styles.primary} disabled={!Number.isFinite(Number(walletAmount))||Number(walletAmount)<=0} onClick={()=>openReview("账户充值",Number(walletAmount),"仅模拟钱包到账，不发起真实支付")}>账户充值</button></section><section className={styles.planSectionHeading}><h2>使用充值余额</h2><p>选择资源类型并填写金额或期数。确认后直接扣除演示钱包余额并增加模拟权益；不涉及真实支付或实际开通。</p></section><section className={`${styles.cards} ${styles.fourCards} ${styles.planPurchaseCards}`}>{([
 {name:"店铺服务",type:"续费",rate:"¥168 / 期",description:"每期 30 天 · 购买后进入企业期数池",unit:"购买期数",placeholder:"请填写续费期数",action:"购买续费期数"},
 {name:"token 积分",type:"资源兑换",rate:"¥1 = 10,000 积分",description:"按金额兑换 · 积分余额长期有效",unit:"使用金额（元）",placeholder:"请输入使用金额（元）",action:"使用充值余额"},
 {name:"数据资源",type:"资源兑换",rate:"¥0.01 / 条",description:"按成功调用的数据条数扣减",unit:"使用金额（元）",placeholder:"请输入使用金额（元）",action:"使用充值余额"},
 {name:"企业存储",type:"独立扩容",rate:"¥1 / GiB / 30天",description:"默认免费 5 GiB · 扩容包独立计时",unit:"扩容容量（GiB）",placeholder:"请输入扩容容量（GiB）",action:"购买扩容"}
] as const).map(({name,type,rate,description,unit,placeholder,action},i)=><article className={styles.card} data-tone={i} key={name}><div className={styles.cardTitle}><h3>{name}</h3><span>{type}</span></div><div className={styles.planPurchaseOffer}><span className={styles.planPurchaseEyebrow}>计费标准</span><strong className={styles.planPurchaseRate}>{rate}</strong><p className={styles.planPurchaseIntro}>{description}</p></div><div className={styles.planPurchaseAction}><label>{unit}<input aria-label={unit+" · "+name} placeholder={placeholder} type="number" min="0.01" step={name==="店铺服务"?"1":name==="企业存储"?"1":"0.01"} value={purchaseAmounts[name]||""} onChange={e=>setPurchaseAmounts(v=>({...v,[name]:e.target.value}))}/></label><small role="status">{purchaseEstimate(name)}</small><button className={styles.primary} disabled={!positivePurchase(name)||(name==="店铺服务"&&!Number.isInteger(purchaseValue(name)))||(name==="企业存储"&&!Number.isInteger(purchaseValue(name)))} onClick={()=>openReview(name,purchaseValue(name),purchaseEstimate(name))}>{action}</button></div></article>)}</section>
 <section className={styles.table} aria-label="模拟钱包充值流水">
  <header><div><h2>钱包充值流水</h2><small>本页仅显示演示到账记录；不代表真实资金流水</small></div></header>
  <div className={styles.planTableScroll}>
   <div className={`${styles.tableHead} ${styles.planWalletColumns}`}>{["时间","类型","说明","金额","余额"].map(x=><span key={x}>{x}</span>)}</div>
   {pageSlice(walletRows,walletPage).map(p=><div className={`${styles.serviceRow} ${styles.planWalletColumns}`} key={p.id}>
    <span>{p.at}</span><span>{p.type}</span><span>{p.detail}</span><span>{p.amount}</span><span>{p.balance}</span>
   </div>)}
  </div>
  <LedgerPagination name="钱包充值流水" total={walletRows.length} page={walletPage.page} size={walletPage.size} onPage={updatePage(setWalletPage)} onSize={updateSize(setWalletPage)}/>
 </section>{draftAlert}{reviewDialog}</>;

  return <><section className={styles.metrics}>{(primaryOrganization?[["近30天支出", "¥1,839.00", "四笔模拟购买"], ["店铺服务", "¥336.00", "模拟购买 2 期"], ["token 积分", "¥1,000.00", "模拟到账 10,000,000 积分"], ["数据与存储", "¥503.00", "50,000 条数据 + 3 GiB 扩容"]]:[["模拟累计支出","¥"+additionalSpent.toFixed(2),"仅当前组织"],["店铺服务",String(demoTotals.renewalPeriods)+" 期","本组织购买期数"],["token 积分",demoTotals.aiPoints.toLocaleString("zh-CN"),"本组织积分余额"],["数据与存储",demoTotals.dataRows.toLocaleString("zh-CN")+" 条", "本组织数据额度"]]).map(([a,b,c])=><article key={a} className={styles.planMetricCard}><strong className={styles.planMetricValue}>{b}</strong><div className={styles.planMetricCopy}><span>{a}</span><small>{c}</small></div></article>)}</section><section className={styles.billingFilterShell} aria-label="账单筛选">
    <form className={styles.billingFilterToolbar} onSubmit={e=>{e.preventDefault();applyBillFilters()}}>
     <input aria-label="搜索账单" value={orderDraft.query} onChange={e=>setOrderDraft(v=>({...v,query:e.target.value}))} placeholder="搜索账单号或费用内容"/>
     <button type="button" className={orderAdvancedOpen||activeOrderFilterCount?styles.billingFilterActive:""} aria-label="筛选条件" aria-expanded={orderAdvancedOpen} aria-controls="billing-advanced-filters" onClick={()=>setOrderAdvancedOpen(v=>!v)}>筛选条件{activeOrderFilterCount?` · ${activeOrderFilterCount}`:""}</button>
     <div className={styles.billingFilterActions}>
      <button type="button" onClick={()=>{setOrderDraft(emptyBillFilters());setAppliedOrder(emptyBillFilters());setBillTypeSearch("");setBillFilterError("");setOrdersPage(v=>({...v,page:1}));setOrderAdvancedOpen(false)}}>重置</button>
      <button type="submit" className={styles.primary}>确定</button>
      <button type="button" disabled={!rows.some(orderMatches)} onClick={()=>downloadDemoCsv("账单与订单-演示.csv",rows.filter(orderMatches))}>导出账单</button>
     </div>
    </form>
    {orderAdvancedOpen?<div id="billing-advanced-filters" className={styles.billingAdvancedFilters} role="group" aria-label="高级筛选条件">
      <div className={styles.billingFilterSection}>
        <span className={styles.billingFilterLabel}>时间范围</span>
        <div className={styles.billingTimePresets} role="group" aria-label="快捷时间">
          {["全部时间","今天","近7天","近30天","本月","自定义"].map(t=><button type="button" key={t} aria-pressed={orderDraft.time===t} onClick={()=>{setOrderDraft(v=>({...v,time:t}));setBillFilterError("")}}>{t}</button>)}
        </div>
        {orderDraft.time==="自定义"?<div className={styles.billingDateRange}>
          <label>开始日期<input aria-label="账单开始日期" type="date" value={orderDraft.from} max={orderDraft.until||undefined} onChange={e=>{setOrderDraft(v=>({...v,from:e.target.value}));setBillFilterError("")}}/></label>
          <span aria-hidden="true">至</span>
          <label>结束日期<input aria-label="账单结束日期" type="date" min={orderDraft.from||undefined} value={orderDraft.until} onChange={e=>{setOrderDraft(v=>({...v,until:e.target.value}));setBillFilterError("")}}/></label>
        </div>:null}
      </div>
      <div className={styles.billingFilterSection}>
        <span className={styles.billingFilterLabel}>费用类型 <small>{orderDraft.types.length?`已选 ${orderDraft.types.length} 项`:"可多选"}</small></span>
        <input aria-label="搜索费用类型" type="search" value={billTypeSearch} onChange={e=>setBillTypeSearch(e.target.value)} placeholder="搜索费用类型..."/>
        <div className={styles.billingChoiceList} role="group" aria-label="费用类型选项">
          {billTypes.filter(x=>x.toLowerCase().includes(billTypeSearch.trim().toLowerCase())).map(option=><label key={option}><input type="checkbox" checked={orderDraft.types.includes(option)} onChange={()=>toggleBillChoice(option)}/><span>{option}</span></label>)}
          {!billTypes.some(x=>x.toLowerCase().includes(billTypeSearch.trim().toLowerCase()))?<p>没有匹配的选项</p>:null}
        </div>
        {orderDraft.types.length>0?<button className={styles.billingClearChoice} type="button" onClick={()=>setOrderDraft(v=>({...v,types:[]}))}>清除此项</button>:null}
      </div>
      {billFilterError?<p className={styles.billingFilterError} role="alert">{billFilterError}</p>:null}
      <p className={styles.billingFilterHelp}>费用类型按实际账单动态生成，支持搜索和多选；时间可自行选择日期区间。设置完成后点击上方「确定」。</p>
    </div>:null}
    {appliedOrderFilterCount>0?<div className={styles.billingAppliedFilters}><span>已筛选 {appliedOrderFilterCount} 类条件</span>
     {appliedOrder.time!=="全部时间"?<button type="button" onClick={()=>{setAppliedOrder(v=>({...v,time:"全部时间",from:"",until:""}));setOrderDraft(v=>({...v,time:"全部时间",from:"",until:""}));setOrdersPage(v=>({...v,page:1}))}}>{appliedOrder.time==="自定义"?`${appliedOrder.from} 至 ${appliedOrder.until}`:appliedOrder.time} ×</button>:null}
     {appliedOrder.types.map(value=><button key={value} type="button" onClick={()=>{setAppliedOrder(v=>({...v,types:v.types.filter(x=>x!==value)}));setOrderDraft(v=>({...v,types:v.types.filter(x=>x!==value)}));setOrdersPage(v=>({...v,page:1}))}}>{value} ×</button>)}
    </div>:null}
   </section><section className={styles.table}><header><h2>账单与订单</h2><button onClick={()=>setInvoiceOpen(true)}>发票管理</button></header><div className={styles.planTableScroll}><div className={`${styles.tableHead} ${styles.planOrderColumns}`}>{["时间","类型","内容","金额","状态","操作"].map(x=><span key={x}>{x}</span>)}</div>{pageSlice(filteredOrderRows,ordersPage).map((r,i)=><div className={`${styles.serviceRow} ${styles.planOrderColumns}`} key={i}>{r.slice(0,5).map((x,j)=><span key={j}>{x}</span>)}<button onClick={()=>setPlanDetail({kind:"order",row:r})}>详情</button></div>)}{!filteredOrderRows.length&&<p className={styles.planEmpty}>暂无符合条件的账单与订单记录。</p>}</div><LedgerPagination name="账单与订单" total={filteredOrderRows.length} page={ordersPage.page} size={ordersPage.size} onPage={updatePage(setOrdersPage)} onSize={updateSize(setOrdersPage)}/></section>
{draftAlert}{planDetail?.kind==="order"&&<div className={styles.planDetailBackdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setPlanDetail(null)}}><section className={styles.planDetailDialog} role="dialog" aria-modal="true" aria-label="订单详情"><header><div><h2>订单详情</h2><p>这只是演示钱包的模拟充值或服务购买记录，不是实际付款凭证，不可用于报销或开票。</p></div><button type="button" aria-label="关闭订单详情" onClick={()=>setPlanDetail(null)}>×</button></header><div className={styles.planDetailHighlight}><span>订单金额</span><strong>{planDetail.row[3]}</strong><small>{planDetail.row[4]} · {planDetail.row[1]}</small></div><dl>{[["时间",planDetail.row[0]],["费用类型",planDetail.row[1]],["订单内容",planDetail.row[2]],["金额",planDetail.row[3]],["状态",planDetail.row[4]]].map(([key,value])=><div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl><footer><button type="button" onClick={()=>setPlanDetail(null)}>关闭</button></footer></section></div>}
 {invoiceOpen?<div className={styles.planDetailBackdrop} onMouseDown={event=>{if(event.target===event.currentTarget)setInvoiceOpen(false)}}>
  <section className={styles.planDetailDialog} role="dialog" aria-modal="true" aria-label="发票管理">
   <header><div><h2>发票管理</h2><p>真实付款成功且符合开票规则的交易才可开票；模拟充值不属于真实交易。</p></div><button type="button" aria-label="关闭发票管理" onClick={()=>setInvoiceOpen(false)}>×</button></header>
   <p className={styles.planEmpty}>暂无可开票的真实已支付订单；所有模拟充值和模拟购买都不能开票。</p>
   <footer><button type="button" onClick={()=>setInvoiceOpen(false)}>关闭</button></footer>
  </section>
 </div>:null}{reviewDialog}</>;
}

function AccountDetail({ pathname, active, setActive, query, setQuery, submit, filters, setFilter, resetFilters }: DetailState & { pathname: string }) {
  const members = [["钟海忠", "138****6688", "管理员", "全部权限", "正常", "刚刚"], ["张琳", "zhanglin@***", "运营负责人", "运营业务", "正常", "10分钟前"], ["李明", "139****2256", "商品运营", "商品、供应链", "正常", "昨天"], ["陈佳", "chenjia@***", "订单客服", "订单履约", "正常", "昨天"]];
  const rows = pathname.endsWith("members") ? members : pathname.endsWith("resources") ? [["钟海忠", "管理员", "5家店铺", "8,650", "300,000条", "2 GiB"], ["张琳", "运营负责人", "3家店铺", "100", "50,000条", "1 GiB"]] : [["今天 10:32", "钟海忠", "调整“运营负责人”角色权限", "成员与权限", "已完成"], ["今天 09:18", "钟海忠", "为张琳分配续费期数 8 期", "资源与额度", "已完成"], ["昨天 18:42", "张琳", "为一号店续费 2 期", "店铺服务", "已完成"]];
  if (pathname.endsWith("/roles")) return <><section className={styles.metrics}>{[["角色总数","4","管理员及业务角色"],["系统角色","1","管理员权限"],["自定义角色","3","按业务范围维护"],["关联成员","3","演示配置"]].map(([a,b,c])=><article key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></article>)}</section><section className={styles.rolePermissions} aria-label="角色权限管理"><header><strong>企业角色与访问权限</strong><small>管理员拥有全部权限；业务角色可分别配置模块与数据范围</small><button className={styles.primary} type="button" onClick={()=>submit("新建角色")}>新建角色</button></header><div>{[["管理员","全部权限","系统角色"],["运营负责人","运营业务","自定义角色"],["商品运营","商品、供应链","自定义角色"],["订单客服","订单履约","自定义角色"]].map(([name,scope,type])=><article key={name}><strong>{name}</strong><span>{scope}</span><small>{type}</small><button type="button" onClick={()=>submit("查看角色权限")}>查看权限</button></article>)}</div></section></>;
  if (pathname.endsWith("members")) return <><section className={styles.metrics}>{[["正式成员","3","不含管理员"],["管理员","1","全部权限"],["邀请中","1","等待成员接受"],["已停用","0","当前无停用成员"]].map(([name,value,desc])=><article key={name}><span>{name}</span><strong>{value}</strong><small>{desc}</small></article>)}</section><section className={styles.tabs}>{["成员管理", "角色权限"].map(x=><button key={x} className={active===x?styles.selected:""} onClick={()=>setActive(x)}>{x}</button>)}<b>3 位正式成员　·　1 位管理员</b><button className={styles.primary} onClick={()=>submit("邀请成员")}>邀请成员</button></section>{active==="角色权限"&&<section className={styles.rolePermissions} aria-label="角色权限说明"><header><strong>角色与权限范围</strong><small>本页为示例权限展示；实际授权须在正式工作台确认</small></header><div>{members.map(row=><article key={row[2]}><strong>{row[2]}</strong><span>{row[3]}</span><small>查看权限和关联成员的演示配置</small></article>)}</div></section>}<section className={styles.toolbar}><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索姓名、手机号或邮箱"/><FilterSelect label="全部角色" filters={filters} setFilter={setFilter}/><FilterSelect label="全部状态" filters={filters} setFilter={setFilter}/><button onClick={()=>{setQuery("");resetFilters()}}>重置</button><button className={styles.primary} onClick={()=>submit("确认筛选")}>确认</button></section><section className={styles.table}><div className={`${styles.tableHead} ${styles.accountMembersGrid}`}>{["成员","账号","角色","权限范围","状态","最近活跃","操作"].map(label=><span key={label}>{label}</span>)}</div>{rows.filter(r=>r.join(" ").includes(query)&&containsFilter(r,filters,"全部角色")&&containsFilter(r,filters,"全部状态")).map(r=><div className={`${styles.serviceRow} ${styles.accountMembersGrid}`} key={r[0]}>{r.map(x=><span key={x}>{x}</span>)}<button onClick={()=>submit("修改成员权限")}>修改</button></div>)}</section></>;
  if (pathname.endsWith("resources")) return <><section className={styles.metrics}>{[["续费期数", "120 期", "已分配 8期 · 剩余112期"], ["AI 积分", "8,650", "已分配150 · 剩余8,500"], ["数据额度", "300,000 条", "已分配80,000条"], ["企业存储", "2.75 GiB", "已用2.00 · 总量5.00"]].map(([a,b,c])=><article key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></article>)}</section><section className={styles.toolbar}><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索成员姓名 / 角色"/><FilterSelect label="全部角色" filters={filters} setFilter={setFilter}/><button onClick={()=>{setQuery("");resetFilters()}}>重置</button><button className={styles.primary} onClick={()=>submit("确认筛选")}>确定</button></section><section className={styles.table}><header><h2>成员资源分配</h2><small>企业存储全员共享 · 按容量扩容</small></header><div className={`${styles.tableHead} ${styles.accountResourcesGrid}`}>{["成员","角色","店铺","续费期数","token积分余额","数据余额","操作"].map(label=><span key={label}>{label}</span>)}</div>{rows.filter(r=>r.join(" ").includes(query)&&containsFilter(r,filters,"全部角色")).map(r=><div className={`${styles.serviceRow} ${styles.accountResourcesGrid}`} key={r[0]}>{r.map(x=><span key={x}>{x}</span>)}<button onClick={()=>submit("分配资源")}>分配</button></div>)}</section><section className={styles.accountResourceInfo}><header><h2>企业存储</h2><p>全体成员共享 · 默认 5 GiB · 按实际保留文件计量</p></header><p>占用来源：商品素材 1.20 GiB · AI 图片 0.50 GiB · 知识文档 0.30 GiB</p><p>扩容单价：¥1 / GiB / 30 天 · 扣款并激活后计时，各包分别到期，不自动续费</p><small>以上容量均为原型演示。正式系统显示当前企业的真实数据和观察时间；到期或超限不自动删除已有数据。</small></section></>;
  return <><section className={styles.accountAuditRecent}><header><h2>最近操作</h2><small>记录关键变更，重要操作的确认仍在原功能页完成。</small></header>{[["10:32 · 张琳","调整“运营负责人”角色权限 · 已完成"],["09:18 · 钟海忠","邀请新成员加入企业空间 · 待接受"],["昨天 18:42 · 李明","调整“商品运营”角色权限 · 已完成"],["昨天 16:10 · 系统","关键权限变更已确认 · 已完成"]].map(([who,what])=><article key={who}><b>{who}</b><span>{what}</span></article>)}</section><section className={styles.metrics}>{[["近30天操作", "86", "全部操作留痕"], ["成员变更", "3", "加入 / 停用 / 角色调整"], ["权限变更", "2", "角色与权限配置"], ["资源与续费", "12", "额度分配与店铺续费"]].map(([a,b,c])=><article key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></article>)}</section><section className={styles.toolbar}><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索操作内容 / 对象"/><FilterSelect label="时间：本月" filters={filters} setFilter={setFilter}/><FilterSelect label="全部操作" filters={filters} setFilter={setFilter}/><FilterSelect label="全部成员" filters={filters} setFilter={setFilter}/><button onClick={()=>{setQuery("");resetFilters()}}>重置</button><button className={styles.primary} onClick={()=>submit("确认筛选")}>确定</button><button onClick={()=>downloadDemoCsv("操作记录-演示.csv",rows)}>导出记录</button></section><section className={styles.table}><div className={`${styles.tableHead} ${styles.accountAuditGrid}`}>{["时间","操作人","操作内容","模块","结果","操作"].map(label=><span key={label}>{label}</span>)}</div>{rows.filter(r=>r.join(" ").includes(query)&&containsFilter(r,filters,"时间：本月")&&containsFilter(r,filters,"全部操作")&&containsFilter(r,filters,"全部成员")).map(r=><div className={`${styles.serviceRow} ${styles.accountAuditGrid}`} key={r[2]}>{r.map(x=><span key={x}>{x}</span>)}<button onClick={()=>submit("查看记录详情")}>详情</button></div>)}</section></>;
}

function ReferralDetail({ pathname, query, setQuery, submit, filters, setFilter, resetFilters }: DetailState & { pathname: string }) {
 const router=useRouter();
 const [copied,setCopied]=useState(false);
 const [withdrawalTab,setWithdrawalTab]=useState("全部状态");
 const earningsRows=[
  ["08-31 10:32","zhang***","套餐购买","¥1,368","¥136.80","已结算"],
  ["08-30 18:20","chen***","token 积分充值","¥500","¥50.00","待结算"],
  ["08-29 14:05","li***","店铺续费","¥300","¥30.00","已结算"],
  ["08-28 11:40","wang***","套餐购买","¥200","¥20.00","待结算"],
  ["08-26 09:15","sun***","套餐退款","¥1,368","-¥136.80","已失效"],
 ];
 const metric=(items:readonly (readonly string[])[])=><section className={styles.metrics}>{items.map(([title,value,description])=><article key={title}><span>{title}</span><strong>{value}</strong><small>{description}</small></article>)}</section>;
 const search=()=><section className={styles.toolbar}><FilterSelect label="全部时间" filters={filters} setFilter={setFilter}/><FilterSelect label="全部来源" filters={filters} setFilter={setFilter}/><FilterSelect label="全部状态" filters={filters} setFilter={setFilter}/><input aria-label="搜索来源用户或订单号" placeholder="搜索来源用户 / 订单号" value={query} onChange={e=>setQuery(e.target.value)}/><button type="button" onClick={()=>{setQuery("");resetFilters()}}>重置</button><button className={styles.primary} type="button" onClick={()=>submit("确认筛选")}>确认</button></section>;
 const earningsTable=(title:string)=><section className={styles.table}><header><h2>{title}</h2><small>原型演示记录 · 实际金额以正式系统为准</small></header><div className={styles.accountTableColumns}><span>时间</span><span>来源用户</span><span>收益来源</span><span>订单金额</span><span>收益金额</span><span>状态</span></div>{earningsRows.filter(r=>r.join(" ").toLowerCase().includes(query.toLowerCase())).map(r=><div className={styles.accountTableRow} key={r[0]}>{r.map((x,i)=><span key={i}>{x}</span>)}</div>)}{earningsRows.filter(r=>r.join(" ").toLowerCase().includes(query.toLowerCase())).length===0?<p className={styles.accountEmpty}>暂无符合条件的收益记录，可重置筛选重新查看。</p>:null}</section>;
 if(pathname.endsWith("/rules")) return <><section className={styles.noticeBar}><div><b>当前规则以平台实际生效版本为准</b><span>以下内容为原型说明；佣金比例、结算周期及可推广业务由平台统一配置。</span></div></section><section className={styles.referralRules}>{[
 ["推广关系如何建立","用户通过推广链接、推广码或二维码首次注册并完成账号验证后建立推广关系。推广关系以系统最终记录为准，重复注册、无效账号不计入有效推广。"],
 ["哪些订单产生收益","符合平台推广政策并完成支付的套餐、token 积分充值、数据服务、店铺续费等订单可产生收益；退款、撤销、异常或违规订单不计入有效收益。"],
 ["收益如何计算","收益按订单所属业务及下单时生效的佣金规则自动计算，不同业务的收益比例可以不同，最终金额以系统收益明细和实际结算结果为准。"],
 ["结算与退款处理","订单达到结算条件后由待结算转为已结算；发生退款、撤销或风控判定异常时，未结算收益取消，已结算收益可按规则冲正或扣回。"],
 ["提现规则","仅已结算并进入可提现余额的收益可以申请提现。提现前需绑定有效收款账户，到账时间以平台处理状态和实际支付渠道为准。"],
 ["违规推广处理","禁止虚假注册、刷单、自买自返、批量账号等违规推广行为。异常推广关系、订单及收益可被取消，严重违规时平台可限制推广或提现功能。"]
 ].map(([name,content])=><article key={name}><h3>{name}</h3><p>{content}</p></article>)}</section></>;
 if(pathname.endsWith("/withdrawals")) return <>{metric([["可提现余额","¥3,260","可立即申请提现"],["待到账金额","¥860","处理中提现申请"],["累计提现","¥8,720","历史累计到账"]])}<section className={styles.noticeBar}><div><b>收款账户</b><span>当前收款方式：支付宝 · zh***@example.com · 已验证（演示）</span></div><button type="button" onClick={()=>submit("配置收款账户")}>配置账户</button><button className={styles.primary} type="button" onClick={()=>submit("申请提现")}>申请提现</button></section><section className={styles.toolbar}><button type="button" className={withdrawalTab==="全部状态"?styles.selected:""} onClick={()=>setWithdrawalTab("全部状态")}>全部状态</button><button type="button" className={withdrawalTab==="处理中"?styles.selected:""} onClick={()=>setWithdrawalTab("处理中")}>处理中</button><button type="button" className={withdrawalTab==="已到账"?styles.selected:""} onClick={()=>setWithdrawalTab("已到账")}>已到账</button></section><section className={styles.table}><header><h2>提现记录</h2><small>演示记录，正式页面须核对平台状态</small></header><div className={styles.accountTableColumns}><span>申请时间</span><span>提现金额</span><span>到账方式</span><span>状态</span><span>到账时间</span><span>操作</span></div>{[["08-28 15:20","¥860","支付宝","处理中","—"],["08-15 10:02","¥2,000","支付宝","已到账","08-16 14:18"],["07-30 09:46","¥1,500","银行卡","已到账","07-31 16:05"],["07-12 17:22","¥1,200","支付宝","已到账","07-13 11:34"]].filter(r=>withdrawalTab==="全部状态"||r[3]===withdrawalTab).map(r=><div className={styles.accountTableRow} key={r[0]}>{r.map((x,i)=><span key={i}>{x}</span>)}<button type="button" onClick={()=>submit("查看提现详情")}>详情</button></div>)}</section></>;
 if(pathname.endsWith("/earnings"))return <>{metric([["累计收益","¥12,860","历史累计收益"],["待结算","¥1,580","等待结算确认"],["已结算","¥11,120","已计入可提现余额"],["已失效","¥160","退款或无效订单"]])}{search()}{earningsTable("收益明细")}</>;
 if(pathname.endsWith("/center"))return <>{metric([["累计推广人数","82 人","历史累计有效推广"],["有效注册","36 人","已完成注册验证"],["付费用户","18 人","产生有效付费行为"],["累计收益","¥12,860","累计已产生推广收益"]])}<section className={styles.noticeBar}><div><b>我的推广</b><span>好友通过推广链接或推广码完成注册及有效付费后，可获得相应收益。</span></div></section><section className={styles.accountReferralLink}><article><h2>推广链接</h2><p>https://sumi.ai/invite/SUMI8F26</p><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText("https://sumi.ai/invite/SUMI8F26");setCopied(true)}catch{submit("复制链接失败")}}}>{copied?"已复制":"复制"}</button></article><article><h2>推广码</h2><p>SUMI8F26</p><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText("SUMI8F26");setCopied(true)}catch{submit("复制推广码失败")}}}>复制</button></article><article><h2>推广二维码</h2><p>二维码示例 · 正式系统按真实推广关系生成</p><button type="button" onClick={()=>submit("查看推广二维码")}>查看</button></article></section><section className={styles.metrics}>{[["访问","268","近30天"],["注册","82","近30天"],["付费","36","近30天"],["收益","¥4,260","近30天"]].map(([a,b,c])=><article key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></article>)}</section>{earningsTable("最近收益")}</>;
 return <>{metric([["累计收益","¥12,860","历史累计推广收益"],["可提现","¥3,260","当前可申请提现"],["待结算","¥1,580","等待订单完成结算"],["有效付费用户","36 人","已产生有效推广收益"]])}<section className={styles.accountOrgManagement}><header><h2>推广与收益管理</h2><p>从推广获客到收益结算、提现与规则，一处完成。</p></header><div>{[["01","推广中心","创建推广链接及推广码，查看推广渠道转化效果。","/workbench/account/referrals/center"],["02","收益明细","查看每笔推广收益、来源与结算状态。","/workbench/account/referrals/earnings"],["03","提现管理","管理可提现余额、收款账户与提现记录。","/workbench/account/referrals/withdrawals"],["04","推广规则","查看推广关系、结算与提现规则。","/workbench/account/referrals/rules"]].map(([num,title,body,href])=><article key={title}><b>{num}</b><h3>{title}</h3><p>{body}</p><button type="button" onClick={()=>router.push(href+"?preview=1")}>进入</button></article>)}</div></section>{earningsTable("最近收益动态")}<section className={styles.noticeBar}><div><b>结算与提现</b><span>可提现 ¥3,260 · 待结算 ¥1,580 · 收款账户已绑定（演示）</span></div><button className={styles.primary} type="button" onClick={()=>router.push("/workbench/account/referrals/withdrawals?preview=1")}>申请提现</button></section></>;
}

export function hasRouteDetailPreview(pathname: string) { return pathname in routes; }

function RoutePage({ page, pathname,organizationId,memberId }: { page: { section: string; title: string; description: string }; pathname: string;organizationId:string;memberId:string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("全部");
  const [message, setMessage] = useState("");
  const [operation,setOperation] = useState<string|null>(null);
  const [filters, setFilters] = useState<Record<string,string>>({});
  const setFilter = (name:string, value:string) => setFilters(old=>({...old,[name]:value}));
  const resetFilters = () => setFilters({});
  const submit = (label:string) => {
    // Filters are local and immediately update the visible collection.
    // Every other action must open a scoped dialog rather than fake a save.
    if(/确认筛选|筛选$|^确定$/.test(label)){
      setMessage("已根据当前筛选条件更新演示列表，未请求真实业务数据。");
      return;
    }
    setMessage("");
    setOperation(label);
  };
  useEffect(()=>{
    if(!operation)return;
    const handle=(event:KeyboardEvent)=>{if(event.key==="Escape"){event.preventDefault();setOperation(null)}};
    document.addEventListener("keydown",handle);return()=>document.removeEventListener("keydown",handle);
  },[operation]);
  const header = <header className={styles.header}><div><div>{page.section}</div><h1>{page.title}</h1><p>{page.description}</p></div><div className={styles.headerActions}>{pathname === "/workbench/store-products" ? <button className={styles.primary} onClick={() => submit("同步平台商品")}>同步平台商品</button> : pathname === "/workbench/store-orders" ? <button className={styles.primary} onClick={() => submit("同步平台订单")}>同步平台订单</button> : pathname === "/workbench/data/market" ? <><button onClick={() => router.push("/workbench/data/api?preview=1")}>API管理</button><button onClick={() => router.push("/workbench/data/mine?preview=1")}>我的数据</button></> : pathname === "/workbench/data/api" ? <><button onClick={() => submit("开发文档")}>开发文档</button><button className={styles.primary} onClick={() => submit("创建API密钥")}>创建API密钥</button></> : pathname === "/workbench/services/market" ? null : null}</div></header>;
  const toolbar = (tabs: string[]) => <div className={styles.toolbar}>{tabs.map(tab => <button key={tab} className={active === tab ? styles.selected : ""} onClick={() => setActive(tab)}>{tab}</button>)}<input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索名称或关键词"/><button onClick={() => { setQuery(""); setActive("全部"); }}>重置</button><button className={styles.primary} onClick={() => submit("筛选")} >确认</button></div>;
  const isChatNew = pathname === "/workbench/ai/chat/new";
  const chatCollectionPage = pathname === "/workbench/ai/chat/recent" || pathname === "/workbench/ai/chat/saved";
  const isLibraryPage = pathname.startsWith("/workbench/ai/projects/") || pathname.startsWith("/workbench/ai/knowledge/") || pathname.startsWith("/workbench/agents/skills/") || pathname.startsWith("/workbench/ai/reports/"); const isTaskDetail = pathname.startsWith("/workbench/ai/tasks/");
  const isSupplyPage = pathname.startsWith("/workbench/supply/catalogs") || pathname.startsWith("/workbench/supply/applications");
  const commerceArea = pathname.startsWith("/workbench/data/") ? "data" : pathname === "/workbench/stores" || pathname === "/workbench/store-products" || pathname.startsWith("/workbench/store-orders") ? "stores" : pathname.startsWith("/workbench/plans/") ? "plans" : pathname.startsWith("/workbench/account/") ? "account" : undefined;
  const libraryPage = pathname === "/workbench/ai/projects/templates" ? "project-templates" : pathname === "/workbench/ai/knowledge/official" ? "knowledge-official" : pathname === "/workbench/ai/knowledge/mine" ? "knowledge-mine" : pathname === "/workbench/ai/knowledge/team" ? "knowledge-team" : pathname === "/workbench/agents/skills/official" ? "skills-official" : pathname === "/workbench/agents/skills/mine" ? "skills-mine" : pathname === "/workbench/agents/skills/team" ? "skills-team" : pathname.startsWith("/workbench/ai/reports/") ? "report-list" : undefined;
  return <main data-commerce-unified={commerceArea} data-library-page={libraryPage} data-task-detail={isTaskDetail ? pathname.split("/").at(-1) : undefined} className={`${styles.page} ${isChatNew ? styles.chatNewPage : ""} ${chatCollectionPage ? styles.chatCollectionPage : ""} ${isLibraryPage ? styles.libraryDetailPreview : ""} ${isSupplyPage ? styles.supplyDetailPreview : ""} ${isTaskDetail ? styles.taskDetailPreview : ""}`}>{message && <div className={styles.message} role="status">{message}<button type="button" aria-label="关闭提示" onClick={() => setMessage("")}>×</button></div>}
    {operation&&<div className={styles.operationBackdrop} onMouseDown={e=>{if(e.target===e.currentTarget)setOperation(null)}}>
      <section role="dialog" aria-modal="true" aria-label={operation} className={styles.operationDialog}>
        <div className={styles.operationHead}><div><small>业务操作 · 演示预览</small><h2>{operation}</h2></div><button type="button" aria-label="关闭操作弹窗" onClick={()=>setOperation(null)}>×</button></div>
        <p>此入口已响应点击，但 GitHub Pages 版本不连接真实业务服务。正式流程需要在已授权的工作台中完成，演示版不会提交申请、生成密钥、修改店铺或产生费用。</p>
        <div className={styles.operationSummary}><b>当前所在页面</b><span>{page.section}</span><b>操作</b><span>{operation}</span><b>执行状态</b><span>未执行 · 等待正式业务系统接入</span></div>
        <footer><button type="button" autoFocus onClick={()=>setOperation(null)}>返回页面</button></footer>
      </section>
    </div>}
    {header}
    {pathname === "/workbench/stores" && <><section className={styles.metrics}>{[["已绑定店铺", "2 家", "当前账户"], ["正常店铺", "2 家", "授权连接正常"], ["即将到期", "0 家", "未来7天"], ["已到期", "2 家", "使用期限已过"], ["待处理", "2 家", "续期或异常"]].map(([a,b,c])=><article key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></article>)}</section><section className={styles.productFilters}><div className={styles.commerceFilterSelects}>{["全部站点","全部类型","全部分组","全部状态"].map(x=><FilterSelect key={x} label={x} filters={filters} setFilter={setFilter}/>)}</div><div className={styles.commerceFilterActions}><input aria-label="搜索店铺名称" placeholder="搜索店铺名称" value={query} onChange={e=>setQuery(e.target.value)}/><button onClick={()=>{setQuery("");resetFilters()}}>重置</button><button className={styles.primary} onClick={()=>submit("确认筛选")}>确认</button></div></section><section className={styles.table}><header><h2>店铺列表 <small>共 2 家店铺</small></h2><button onClick={()=>submit("绑定新店铺")}>＋ 绑定新店铺</button></header><div className={styles.serviceRow}><span>店铺与平台</span><span>站点 / 类型</span><span>授权与网络</span><span>使用期限</span><span>管理操作</span></div>{[["一号店", "SHEIN · 美国站 · 半托管", "授权正常 · 网络正常", "月付 · 至 2026-09-30"], ["二号店", "SHEIN · 加拿大站 · 全托管", "授权正常 · 网络正常", "月付 · 至 2026-09-18"]].filter(row=>row.join(" ").includes(query)&&containsFilter(row,filters,"全部站点")&&containsFilter(row,filters,"全部类型")&&containsFilter(row,filters,"全部状态")&&(!filters["全部分组"]||filters["全部分组"]==="全部分组"||(filters["全部分组"]==="核心店铺"&&row[0]==="一号店")||(filters["全部分组"]==="加拿大市场"&&row[0]==="二号店"))).map((row,i)=><div className={styles.serviceRow} key={row[0]}><span><b>{row[0]}</b><small>店铺ID：SHEIN-{i?"CA-002":"US-001"}　·　{ i?"加拿大市场":"核心店铺"}</small></span><span>{row[1]}</span><span>{row[2]}</span><span>{row[3]}</span><span><button onClick={()=>submit("续费店铺")}>续费</button> <button onClick={()=>submit("管理店铺")}>管理</button></span></div>)}</section></>}
    {pathname === "/workbench/store-products" && <StoreProductsPage active={active} setActive={setActive} query={query} setQuery={setQuery} submit={submit} filters={filters} setFilter={setFilter} resetFilters={resetFilters}/>}
    {pathname === "/workbench/store-orders" && <OrderFulfillmentPage active={active} setActive={setActive} query={query} setQuery={setQuery} submit={submit} filters={filters} setFilter={setFilter} resetFilters={resetFilters}/>}
    {pathname.startsWith("/workbench/plans/") && <PlanDetail organizationId={organizationId} memberId={memberId} pathname={pathname} active={active} setActive={setActive} query={query} setQuery={setQuery} submit={submit} filters={filters} setFilter={setFilter} resetFilters={resetFilters} router={router}/>}
    {pathname === "/workbench/account/organization" && <><section className={styles.accountOrgIdentity}><div className={styles.accountOrgAvatar}>硕</div><div><h2>硕米智能科技</h2><p>空间编号：SUMI-ENT-20260812 · 管理员：钟海忠</p></div><span>已企业认证 · 演示</span></section><section className={styles.metrics}>{[["企业成员","6","当前空间成员"],["已绑定店铺","2","当前授权店铺"],["待处理邀请","1","等待接受"]].map(([a,b,c])=><article key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></article>)}</section><section className={styles.accountOrgManagement}><header><h2>企业管理</h2><p>分工协作与资源管理，各入口分别负责明确的业务范围。</p></header><div>{[["01","成员管理","邀请和管理企业成员，查看账户状态与成员归属。","/workbench/account/organization/members"],["02","角色权限","配置业务角色和访问权限，控制页面与数据访问范围。","/workbench/account/organization/roles"],["03","资源与额度","分配店铺、积分与数据额度，设置成员存储使用上限。","/workbench/account/organization/resources"],["04","操作记录","查询成员的重要操作，追溯权限及资源变更记录。","/workbench/account/organization/audit"]].map(([num,name,detail,href])=><article key={name}><b>{num}</b><h3>{name}</h3><p>{detail}</p><button type="button" onClick={()=>router.push(href+"?preview=1")}>{name==="成员管理"?"管理成员":name==="角色权限"?"管理权限":name==="资源与额度"?"管理资源":"查看记录"}</button></article>)}</div></section><section className={styles.metrics}>{[["店铺","2 家","当前已绑定"],["AI 积分","8,650","按实际余额"],["数据额度","300,000 条","可用数据"],["企业存储","5 GiB","企业共享容量"]].map(([a,b,c])=><article key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></article>)}</section><section className={styles.table}><header><h2>成员资源分配</h2><small>积分与数据额度不按月清零；存储为企业共享容量</small></header><div className={styles.tableHead}>成员 / 角色　　AI 积分余额　　数据额度（条）　　存储上限（GiB）</div>{[["张琳 · 运营负责人","100","50,000","2 GiB"],["李明 · 商品运营","30","—","1 GiB"],["陈佳 · 订单客服","20","—","—"]].map(row=><div className={styles.serviceRow} key={row[0]}>{row.map(x=><span key={x}>{x}</span>)}</div>)}</section></>}
    {pathname.startsWith("/workbench/account/organization/") && <AccountDetail pathname={pathname} active={active} setActive={setActive} query={query} setQuery={setQuery} submit={submit} filters={filters} setFilter={setFilter} resetFilters={resetFilters}/>}
    {pathname.startsWith("/workbench/account/referrals") && <ReferralDetail pathname={pathname} active={active} setActive={setActive} query={query} setQuery={setQuery} submit={submit} filters={filters} setFilter={setFilter} resetFilters={resetFilters}/>}
    {pathname === "/workbench/account/profile/business" && <><section className={styles.noticeBar}><div><b>完善经营画像，让系统知道如何为你工作</b><span>画像不会改变首页，也不会自动替你做决定；用于业务分类、统计分析和服务沟通，让智能体与服务贴近真实经营情况。</span></div></section><section className={styles.accountOrgManagement}><header><h2>维护经营画像</h2><p>经营信息帮助你减少重复说明，可随时调整。</p></header><div>{[["01","让智能体更懂你的业务","结合角色、店铺阶段、平台与站点，减少重复说明。"],["02","让执行建议更符合实际","根据店铺类型、工厂与供应链条件判断可执行范围。"],["03","让服务沟通更高效","提前了解所需服务，减少无关信息和重复沟通。"]].map(([n,title,desc])=><article key={n}><b>{n}</b><h3>{title}</h3><p>{desc}</p></article>)}</div></section><section className={styles.split}><article><h2>经营情况</h2><p>这些信息帮助硕米理解你的业务背景，提供更贴合的经营建议。</p><div className={styles.formGrid}><label>用户角色<select><option>跨境电商卖家</option><option>电商创业者</option><option>工厂与供应商</option><option>企业客户</option></select></label><label>经营阶段<select><option>已有店铺，正在增长</option><option>刚开始创业</option><option>准备拓展新市场</option></select></label><label>经营平台<input defaultValue="Amazon、TikTok Shop"/></label><label>主要站点<input defaultValue="美国站"/></label><label>店铺类型<select><option>自营店</option><option>半托管</option><option>全托管</option></select></label><label>工厂情况<select><option>自有工厂</option><option>合作供应商</option><option>暂无稳定供应链</option></select></label></div><button className={styles.primary} onClick={()=>submit("保存经营画像")}>保存经营画像</button></article><article><h2>当前经营目标</h2><p>重点关注</p>{["商品选品与市场机会", "店铺日常运营与增长", "稳定供应链与商品开发", "AI团队协同执行"].map(x=><p key={x}><label><input type="checkbox" defaultChecked/>{x}</label></p>)}</article></section></>}
    {pathname === "/workbench/account/profile/verification" && <><section className={styles.tabs} aria-label="主体认证类型"><button type="button" className={active!=="企业认证"?styles.selected:""} onClick={()=>setActive("个人认证")}>个人认证</button><button type="button" className={active==="企业认证"?styles.selected:""} onClick={()=>setActive("企业认证")}>企业认证</button></section><section className={styles.noticeBar}><div><b>{active==="企业认证"?"适用于公司或其他企业主体认证":"适用于个人账户主体认证"} · 当前状态：未认证（演示）</b><span>认证流程：提交资料 · 信息审核 · 认证完成。请确保信息与真实证件一致，演示环境不会上传或保存材料。</span></div></section><section className={styles.split}><article><h2>{active==="企业认证"?"企业主体信息":"个人身份信息"}</h2><p>{active==="企业认证"?"请确保企业名称、信用代码与营业执照一致":"请确保身份信息与证件内容一致"}</p><form className={styles.accountVerificationForm} onSubmit={e=>{e.preventDefault();submit(active==="企业认证"?"提交企业认证":"提交个人认证")}}>{active==="企业认证"?<><label>企业名称<input required placeholder="请输入营业执照上的企业名称"/></label><label>统一社会信用代码<input required placeholder="请输入统一社会信用代码"/></label><label>法定代表人<input required placeholder="请输入法定代表人姓名"/></label><label>营业执照<input type="file" accept="image/*,.pdf" required/></label></>:<><label>真实姓名<input required placeholder="请输入真实姓名"/></label><label>身份证号码<input required placeholder="请输入身份证号码"/></label><label>身份证照片 · 人像面<input type="file" accept="image/*" required/></label><label>身份证照片 · 国徽面<input type="file" accept="image/*" required/></label></>}<p>{active==="企业认证"?"支持识别营业执照信息；上传后请核对企业名称、信用代码及法定代表人。":"支持识别身份证信息；上传后请核对姓名、证件号码及照片内容。"}</p><button type="submit" className={styles.primary}>提交认证</button><small>提交即表示已阅读并同意认证信息使用说明。当前为演示，不会上传资料或产生真实认证申请。</small></form></article><article><h2>认证说明</h2><p>个人认证和企业认证分别处理，完成后可在正式系统中查看真实认证状态。</p><p>演示界面不会保存输入的姓名、身份证号码或营业执照。</p><p>正式认证需要登录已授权工作台，并由后端完成资料校验与审核。</p></article></section></>}
    {isChatNew && <ChatNewPreview onAction={submit}/>}
    {chatCollectionPage && <ShowcaseChatCollections mode={pathname.endsWith("/saved")?"saved":"recent"} />}
    {pathname.startsWith("/workbench/ai/tasks/") && <>{pathname.endsWith("scheduled")&&<section className={`${styles.metrics} ${styles.scheduledMetrics}`}>{[["启用中", "3", "按设定频率运行"], ["已暂停", "1", "可随时恢复计划"], ["今日待执行", "2", "点击查看下方清单"]].map(([a,b,c])=><article key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></article>)}</section>}<section className={styles.toolbar}>{pathname.endsWith("scheduled")&&<button onClick={()=>setActive(active==="已启用"?"全部":"已启用")}>状态：{active==="全部"?"全部":active}</button>}<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索任务名称、店铺或项目"/><button onClick={()=>{setQuery("");setActive("全部")}}>重置</button><button className={styles.primary} onClick={()=>submit("确认筛选")}>确定</button></section><section className={styles.table}><header><h2>{pathname.endsWith("scheduled")?"执行计划":"任务列表"}</h2>{pathname.endsWith("scheduled")&&<button onClick={()=>submit("新建定时任务")}>＋ 新建定时任务</button>}</header><div className={styles.taskDetailHead}><span>任务名称</span><span>{pathname.endsWith("scheduled") ? "执行频率" : "关联范围"}</span><span>{pathname.endsWith("scheduled") ? "关联范围" : "状态与进度"}</span><span>{pathname.endsWith("scheduled") ? "下次执行" : "时间信息"}</span><span>{pathname.endsWith("scheduled") ? "状态 / 操作" : "操作"}</span></div>{(pathname.endsWith("running")?[["美国宠物用品机会与供应匹配", "通用业务", "执行中 · 5%", "预计20分钟完成", "查看"], ["春季广告投放优化", "一号店", "执行中 · 68%", "预计18:30完成", "查看"], ["美国站夏季新品机会分析", "美国站夏季女装开发", "执行中 · 42%", "预计明日10:00完成", "查看"], ["竞品价格与评价监测", "Temu美国站", "执行中 · 81%", "预计16:20完成", "查看"], ["商品详情页批量优化", "TikTok Shop英国站", "执行中 · 24%", "预计明日14:00完成", "查看"]]:pathname.endsWith("completed")?[["生成店铺经营诊断报告", "一号店", "已完成", "今天 10:12", "查看"], ["完成12个商品标题优化", "二号店", "已完成", "昨天 18:40", "查看"], ["分析美国站夏季女装趋势", "通用业务", "已完成", "8月11日", "查看"]]:pathname.endsWith("errors")?[["同步二号店商品数据", "二号店", "需要处理", "10分钟前", "去处理"]]:pathname.endsWith("scheduled")?[["每周商品适配与上传进展", "每周一 09:00", "商品中心 · 团队", "10月26日 09:00", "已启用 · 暂停 · 详情"], ["每日店铺经营简报", "每天 08:30", "一号店 · 运营数据", "10月26日 08:30", "已启用 · 暂停 · 详情"], ["店铺订单异常提醒", "每2小时", "二号店 · 订单", "10月25日 20:00", "已启用 · 暂停 · 详情"], ["每月选品复盘", "每月1日 10:00", "选品项目 · 我的项目", "暂停中", "已暂停 · 恢复 · 详情"]]:[["确认广告预算调整方案", "一号店", "待你确认", "剩余5小时", "去确认"], ["确认新品开发方向", "美国站夏季女装开发", "待你确认", "剩余1天", "去确认"]]).filter(row=>row.join(" ").includes(query)).map(row=><div className={styles.taskDetailRow} key={row[0]}>{row.map((x,i)=><span key={i} data-column={i} data-status={((pathname.endsWith("scheduled") && i===4) || (!pathname.endsWith("scheduled") && i===2)) ? x : undefined}>{x}</span>)}</div>)}</section><p>{pathname.endsWith("pending")?"只显示尚未确认的任务；确认后自动移出，退回的任务转至待重做。":pathname.endsWith("errors")?"异常任务优先检查失败原因、店铺授权及关联资源，确认后再恢复。":pathname.endsWith("completed")?"已完成任务可查看执行记录和结果报告，不在这里重复发起执行。":""}</p></>}
    {pathname.startsWith("/workbench/ai/projects/") && <>{pathname.endsWith("templates")?<><section className={styles.category}><div><h2>官方模板列表</h2><p>按业务分类查找模板，先查看介绍，再决定使用。</p></div>{["全部", "店铺经营", "商品开发", "商品优化", "OPC创业"].map(x=><button onClick={()=>setActive(x)} className={active===x?styles.selected:""} key={x}>{x}</button>)}</section>{toolbar([])}<section className={styles.cards}>{[["店铺经营增长", "结合经营诊断、商品优化与复盘，围绕店铺目标组织持续改进任务。"], ["新品开发与选品", "从市场机会、选品验证到上新准备，集中管理商品开发过程与阶段成果。"], ["商品内容优化", "围绕标题、图片及详情文案梳理任务，记录内容优化与审核发布进度。"], ["跨境 OPC 创业", "梳理创业目标、平台与商品方向，将启动准备和阶段验证纳入项目。"]].map(([a,b])=><article className={styles.card} key={a}><h3>{a}</h3><p>{b}</p><div className={styles.cardActions}><button className={styles.primary} onClick={()=>submit("使用模板")}>使用</button><button onClick={()=>submit("模板介绍")}>介绍</button></div></article>)}</section></>:<section className={styles.table}><header><h2>{page.title}</h2><button className={styles.primary} onClick={()=>submit("新建项目")}>＋ 新建项目</button></header><div className={styles.searchRow}><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索项目名称、业务或店铺"/><button onClick={()=>submit("确认筛选")}>确定</button><button onClick={()=>setQuery("")}>重置</button></div><div className={styles.projectTableHead}><span>项目与目标</span><span>关联范围</span><span>当前里程碑</span><span>项目进度</span><span>操作</span></div>{(pathname.endsWith("archived")?[["2026春季POD产品测试", "通用业务 · 商品开发", "已完成全部产品测试", "8月5日归档", "查看详情"], ["一号店首月冷启动计划", "一号店 · 店铺经营", "首月经营目标已完成", "7月28日归档", "查看详情"]]:pathname.endsWith("recent")?[["一号店经营提升", "一号店 · 店铺经营 · 最近访问 今天 10:32", "正在推进广告预算优化", "62%", "继续查看"], ["美国站夏季女装开发", "通用业务 · 商品开发 · 最近访问 昨天 16:40", "已确认5个开发方向", "48%", "继续查看"]]:pathname.endsWith("completed")?[]:[["美国站夏季女装开发", "通用业务 · 商品开发", "已确认5个开发方向", "48%", "查看详情"], ["二号店商品内容优化", "二号店 · 商品优化", "12个商品已完成优化", "75%", "查看详情"], ["OPC跨境创业计划", "通用业务 · OPC创业", "首阶段创业任务执行中", "38%", "查看详情"]]).filter(row=>row.join(" ").includes(query)).map(row=><div className={styles.projectRow} key={row[0]}>{row.map((x,i)=>i===4?<button key={x} data-column={i} onClick={()=>submit(x)}>{x}</button>:<span key={x} data-column={i}>{x}</span>)}</div>)}{pathname.endsWith("completed")&&<div className={styles.emptyState}><h3>当前没有已完成的活跃项目</h3><p>已归档成果可以到「已归档」查看，不与任务中心的已完成任务混合。</p></div>}</section>}</>}
    {pathname.startsWith("/workbench/ai/knowledge/") && (pathname.endsWith("team")?<section className={styles.knowledgeTeamEmpty}><div><span>团队空间</span><h2>团队知识库暂未开放</h2><p>团队知识库正在筹备中。你可以先启用官方资料，或查看个人已启用的知识。</p><div className={styles.cardActions}><button className={styles.primary} onClick={()=>router.push("/workbench/ai/knowledge/official?preview=1")}>浏览官方知识</button><button onClick={()=>router.push("/workbench/ai/knowledge/mine?preview=1")}>查看我的知识库</button></div></div></section>:pathname.endsWith("mine")?<><section className={styles.category}><div><h2>已启用知识库</h2><p>启用的官方资料与个人创建内容会集中显示在这里</p></div><button className={styles.primary} onClick={()=>router.push("/workbench/ai/knowledge/official?preview=1")}>＋ 添加官方知识</button></section><section className={styles.knowledgeMineEmpty}><div><h2>暂时没有已启用的知识库</h2><p>启用官方知识后会显示在这里，也可以在会话或任务中按需引用。</p></div><button className={styles.primary} onClick={()=>router.push("/workbench/ai/knowledge/official?preview=1")}>前往官方知识库</button></section></>:<><section className={styles.category}><div><h2>官方知识列表</h2><p>按分类查找知识，查看介绍后按需启用</p></div>{["全部", "平台规则", "运营方法", "合规参考", "AI应用"].map(x=><button onClick={()=>setActive(x)} className={active===x?styles.selected:""} key={x}>{x}</button>)}<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="输入知识名称或关键词"/></section><section className={styles.cards}>{[["跨境平台规则", "汇总平台政策、入驻要求与限制，方便按业务需要查找参考资料。", "平台规则"], ["电商运营方法", "围绕选品、商品和店铺日常运营，整理常用方法与实践资料。", "运营方法"], ["跨境合规参考", "归集知识产权与税务合规资料，帮助了解跨境经营的基本要求。", "合规参考"], ["AI电商应用指南", "介绍 AI 工具与任务使用方法，帮助快速掌握常见工作流程。", "AI应用"]].filter(([a,b,c])=>(`${a} ${b}`.includes(query))&&(active==="全部"||active===c)).map(([a,b,c])=><article className={styles.card} key={a}><span className={styles.knowledgeTag}>{c}</span><h3>{a}</h3><p>{b}</p><div className={styles.cardActions}><button className={styles.primary} onClick={()=>submit("启用知识")}>启用</button><button onClick={()=>submit("知识介绍")}>介绍</button></div></article>)}</section></>)}
    {pathname.startsWith("/workbench/agents/skills/") && (pathname.endsWith("team")?<section className={styles.skillTeamEmpty}><div><span>团队空间</span><h2>团队技能暂未开放</h2><p>团队技能正在筹备中。目前可浏览官方模板，或管理你保存的个人技能。</p><div className={styles.cardActions}><button className={styles.primary} onClick={()=>router.push("/workbench/agents/skills/official?preview=1")}>浏览官方技能</button><button onClick={()=>router.push("/workbench/agents/skills/mine?preview=1")}>查看我的技能</button></div></div></section>:pathname.endsWith("mine")?<section className={styles.skillMineList}><div className={styles.skillListHeading}><div><span>已保存 · 1 项</span><h2>我的技能</h2><p>管理个人方法，使用时可带入会话或任务。</p></div><button className={styles.primary} onClick={()=>router.push("/workbench/agents/skills/official?preview=1")}>浏览官方技能</button></div><article className={styles.skillItem}><div className={styles.skillItemMark} aria-hidden="true">S</div><div className={styles.skillItemBody}><div><h3>商品标题规范化</h3><span className={styles.knowledgeTag}>个人技能 · 示例</span></div><p>规范标题结构并突出商品核心卖点，便于在商品优化任务中复用。</p></div><div className={styles.cardActions}><button onClick={()=>submit("编辑技能")}>编辑</button><button className={styles.primary} onClick={()=>submit("去会话引用")}>在会话中使用</button></div></article></section>:<><section className={styles.category}><div><h2>官方技能列表</h2><p>按分类浏览技能，查看介绍后启用需要的能力</p></div>{["全部", "标题优化", "图片制作"].map(x=><button onClick={()=>setActive(x)} className={active===x?styles.selected:""} key={x}>{x}</button>)}<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="输入技能名称或关键词"/></section><section className={styles.cards}>{[["商品标题整理", "规范商品标题的结构与关键词层次，突出核心卖点和重要信息，帮助消费者快速理解商品特点。", "标题优化"], ["标题本地化", "结合目标市场的语言习惯与搜索表达，调整商品标题的措辞与排列顺序，提升本地阅读体验。", "标题优化"], ["冗长标题精简", "清理标题里的重复内容与冗余词语，保留重要卖点和关键词，让商品标题清晰易读。", "标题优化"], ["标准商品套图", "统一商品图片的构图、比例与展示方式，保持主图和套图风格一致。", "图片制作"], ["场景化商品展示", "结合真实使用情境展现商品特点，突出场景价值与核心卖点。", "图片制作"], ["卖点详情图编排", "梳理商品核心卖点与图片展示顺序，合理组织详情图内容。", "图片制作"]].filter(([a,b,c])=>(`${a} ${b}`.includes(query))&&(active==="全部"||active===c)).map(([a,b,c])=><article className={styles.card} data-skill-group={c} key={a}><span className={styles.knowledgeTag}>{c}</span><h3>{a}</h3><p>{b}</p><div className={styles.cardActions}><button className={styles.primary} onClick={()=>submit("启用技能")}>启用</button><button onClick={()=>submit("技能介绍")}>介绍</button></div></article>)}</section></>)}
    {pathname.startsWith("/workbench/ai/reports/") && <><section className={styles.searchRow}><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="点击输入：一号店经营诊断报告"/><button onClick={()=>submit("筛选成果")}>确定</button><button onClick={()=>setQuery("")}>重置</button></section><section className={styles.table}><header><h2>成果列表</h2></header><div className={styles.reportTableHead}><span>成果名称</span><span>关联业务</span><span>成果类型 / 格式</span><span>生成时间</span><span>操作</span></div>{[["一号店经营诊断报告", "一号店经营提升", "运营报告 · PDF文件", "今天 10:12"], ["美国站夏季女装市场分析", "美国站夏季女装开发", "市场报告 · PDF文件", "昨天 16:30"], ["商品标题优化结果", "二号店商品内容优化", "商品文件 · XLSX文件", "8月11日"], ["OPC跨境创业执行方案", "OPC跨境创业计划", "创业方案 · DOCX文件", "8月10日"], ["夏季女装视觉素材包", "美国站夏季女装开发", "图片素材 · ZIP文件", "8月9日"]].filter(row=>row.join(" ").includes(query)&&(pathname.endsWith("favorites")?row[0].includes("一号店")||row[0].includes("OPC"):true)).map(row=><div className={styles.reportRow} key={row[0]}>{row.map(x=><span key={x}>{x}</span>)}<div className={styles.reportActions}><button onClick={()=>submit("查看报告")}>查看</button><button onClick={()=>submit("下载报告")}>下载</button><button onClick={()=>submit("收藏状态已更新")}>收藏</button></div></div>)}</section></>}
    {pathname === "/workbench/data/market" && <><section className={styles.sectionTitle}><div><h2>选择数据类型</h2><p>按需选择数据资源，已开放的类型可以进入服务详情；其他类型将逐步接入。</p></div></section>{toolbar(["全部", "已开放", "暂未开放", "定制数据"])}<section className={styles.cards}>{dataMarket.filter(([name, body, status]) => `${name} ${body}`.includes(query) && (active === "全部" || active === status)).map(([name, body, status, tags], index) => <article key={name} className={styles.card} data-tone={index % 4}><div className={styles.cardTitle}><h3>{name}</h3><span>{status}</span></div><p>{body}</p><div className={styles.tags}>{tags.split(" · ").map(tag => <small key={tag}>{tag}</small>)}</div><button className={status === "已开放" || status === "按需定制" ? styles.primary : ""} onClick={() => submit(name === "定制数据" ? "定制服务申请" : `${name}详情`)}>{status === "已开放" ? "查看详情" : status === "按需定制" ? "定制服务" : "暂未开放"}</button></article>)}</section><section className={styles.split}><article><small>开放状态</small><h3>按开放状态选择数据</h3><p>当前开放 · 商品数据可查看详情　　其他类型 · 以页面开放状态为准</p></article><article><small>使用路径</small><h3>数据选用后的处理流程</h3><p>查看字段与站点　 →　 授权获取数据　 →　 进入「我的数据」管理</p></article></section></>}
    {pathname === "/workbench/data/api" && <><nav className={styles.tabs}>{["API概览", "API密钥", "调用记录", "用量与费用"].map(x => <button className={active === x ? styles.selected : ""} onClick={() => setActive(x)} key={x}>{x}</button>)}<b>Amazon产品数据 API · 已开通</b></nav><section className={styles.metrics}>{[["可用API密钥", "2", "1个生产"], ["今日成功数据", "1,142", "成功返回"], ["本月调用费用", "¥386.40", "上限40%"], ["调用成功率", "88.8%", "近24小时"]].map(([a,b,c]) => <article key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></article>)}</section><section className={styles.split}><article><header><div><h2>API接入与密钥</h2><p>当前已开通的数据能力与可用密钥</p></div><button onClick={() => setActive("API密钥")}>管理API密钥</button></header><div className={styles.serviceLine}><b>正常</b><span><strong>Amazon产品数据 API</strong><small>按成功返回的数据条数计费</small></span><span>产品数据 · 多国家站点<br/>已开通 · 可正常调用</span></div><div className={styles.keyRow}><b>密钥名称</b><b>API Key</b><b>权限与限制</b><b>状态</b></div><div className={styles.keyRow}><span>生产环境</span><span>sk_live_••••••••7A2D</span><span>Amazon产品数据 · 每日5万条</span><b>正常</b></div><small>Secret仅在创建成功时完整显示一次；建议设置IP白名单并定期更换密钥。</small></article><article><header><div><small>用量与费用</small><h3>额度正常</h3></div></header><p>今日成功数据 <b>1,142 / 50,000 条</b></p><progress value="1142" max="50000"/><p>本月调用费用 <b>¥386.40 / ¥1,000</b></p><progress value="386" max="1000"/><hr/><p>每日调用上限　50,000条</p><p>月度费用上限　¥1,000</p><em>余额不足、异常调用和费用达到80%时提醒</em></article></section><section className={styles.table}><header><h2>最近调用记录</h2><button onClick={() => setActive("调用记录")}>查看全部记录</button></header><div className={styles.tableHead}>调用时间　　API名称　　使用密钥　　请求数量　　成功数据　　本次费用　　状态</div>{["今天 14:32　Amazon产品数据　生产环境　1,000条　862条　¥17.24　调用成功", "今天 11:08　Amazon产品数据　生产环境　500条　240条　¥4.80　部分成功", "昨天 18:46　Amazon产品数据　测试环境　50条　40条　¥0.80　调用成功"].map(row => <div key={row}>{row}</div>)}</section></>}
    {pathname === "/workbench/data/mine" && <ShowcaseMyDataBatches key={organizationId+"::"+memberId} organizationId={organizationId} memberId={memberId} />}
    {pathname === "/workbench/services/market" && <><section className={styles.category}><div><h2>服务分类</h2><p>按服务类型快速查看当前开放的专业服务</p></div>{["全部服务 4", "企业服务 2", "店铺服务 2"].map((x,i)=><button className={active===["全部服务","企业服务","店铺服务"][i]?styles.selected:""} onClick={()=>setActive(["全部服务","企业服务","店铺服务"][i])} key={x}>{x}</button>)}</section>{toolbar([])}<section className={styles.cards}>{services.filter(([name,body,tags,kind])=>`${name} ${body} ${tags}`.includes(query)&&(active==="全部"||active==="全部服务"||active===kind)).map(([name,body,tags,kind],i)=><article className={styles.card} data-tone={i%4} key={name}><h3>{name}</h3><p>{body}</p><hr/><strong>服务要点</strong><div className={styles.serviceTags}>{tags.split(" · ").map(tag=><span key={tag}>•　{tag}</span>)}</div><button onClick={()=>submit(`${name}详情`)}>查看详情</button></article>)}</section><section className={styles.split}><article><h3>服务流程</h3><p>了解方案　　确认需求　　服务交付</p><small>办理与交付进展，可在「我的服务」中查看。</small></article><article><h3>服务说明</h3><p>服务范围　　费用标准　　办理周期</p><small>服务地区、适用条件及报价由服务方确认；具体以方案为准。</small></article></section></>}
    {pathname === "/workbench/services/mine" && <><section className={styles.category}><div><h2>服务状态</h2><p>按当前状态快速查看需要跟进的服务</p></div>{["全部服务 4", "待确认 1", "服务中 1", "待验收 1", "已完成 1"].map(x=><button onClick={()=>setActive(x.split(" ")[0])} className={active===x.split(" ")[0]?styles.selected:""} key={x}>{x}</button>)}</section>{toolbar(["服务类型", "更新时间"])}<section className={styles.table}><header><h2>服务记录</h2><small>示例服务 · 共 4 项</small></header><div className={styles.tableHead}>服务名称　　服务状态　　当前进度　　更新时间　　操作</div>{[["公司注册", "服务中", "登记资料审核中", "2026-08-06 10:30", "查看进度"], ["商标注册", "待确认", "商标申请资料待核对", "2026-08-05 09:15", "核对信息"], ["店铺开通服务", "待验收", "店铺开通成果待验收", "2026-08-04 16:40", "查看交付"], ["店铺代运营", "已完成", "本期运营成果已交付", "2026-08-20 14:20", "查看成果"]].filter(row=>row.join(" ").includes(query)&&(active==="全部"||active==="全部服务"||row[1]===active)).map(row=><div className={styles.serviceRow} key={row[0]}>{row.map((c,i)=><span key={i}>{c}</span>)}</div>)}</section></>}
    {pathname === "/workbench/supply/applications" && <>
      <section className={styles.twoCards}>
        <article>
          <div><h2>发起优选申请</h2><b>自有商品 · 资格核对</b><p>从已上传的自有商品中选择符合条件的商品，查看申请要求与资料准备说明，发起进入硕米优选的申请。</p>
            <button className={styles.primary} onClick={()=>router.push("/workbench/supply/applications/new?preview=1")}>发起申请</button>
          </div>
          <aside><h3>申请前准备</h3><p>• 自有商品及归属资料<br/>• 库存或生产能力<br/>• 商品与合规信息</p><hr/><p>提交申请前请核对资料完整性</p></aside>
        </article>
        <article>
          <div><h2>申请记录</h2><b>审核结果 · 历史追溯</b><p>集中查看提交记录、审核结果以及未通过原因，并根据已有反馈修改资料后重新发起申请。</p>
            <button className={styles.primary} onClick={()=>router.push("/workbench/supply/applications/records?preview=1")}>查看申请记录</button>
          </div>
          <aside><h3>审核与后续处理</h3><p>• 查询历史申请<br/>• 查看审核说明<br/>• 修改资料重新申请</p><hr/><p>实际状态以正式业务系统返回为准</p></aside>
        </article>
      </section>
      <section className={styles.noticeBar}><b>优选申请说明</b><span>本页用于了解申请流程和演示入口；当前展示站不提交正式申请，也不代表平台审核通过。</span>
        <button onClick={()=>router.push("/workbench/supply/applications/new?preview=1")}>查看申请条件</button>
      </section>
    </>}
    {pathname === "/workbench/supply/applications/new" && <><section className={styles.metrics}>{[["可申请商品", "34", "符合申请条件"], ["审核中", "3", "平台审核进行中"], ["未通过", "1", "可修改后再申请"], ["已通过", "8", "审核已完成"]].map(([a,b,c])=><article key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></article>)}</section><section className={styles.split}><article><h2>申请条件</h2><p>仅展示符合基本申请条件的已优化自有商品</p><p>● 商品属于申请人或企业　　● 已完成商品智能优化</p><p>● 具备稳定库存或生产能力　　● 商品及相关资质符合平台要求</p></article><article><h2>申请流程</h2><p>提交后由专员联系并完成评估</p><div className={styles.sourceTiles}>{["01 选择商品", "02 供货信息", "03 平台评估", "04 确认合作"].map(x=><span key={x}>{x}</span>)}</div></article></section><section className={styles.noticeBar}><b>服务说明</b><span>如涉及商品资料整理、系统技术对接或上架服务，将由专员确认具体服务内容及费用。</span><button onClick={()=>submit("联系专员")}>提交后专员联系</button></section><section className={styles.table}><header><h2>可申请商品</h2><small>仅显示自有商品库 · 已上传</small><button onClick={()=>submit("选择商品")}>选择商品发起申请</button></header><div className={styles.tableHead}>商品　　所属分组　　商品归属 / 上传状态　　申请状态</div>{[["轻量防晒遮阳外套", "SKU OWN-240824-001", "新品开发"], ["多功能折叠收纳箱", "SKU OWN-240824-002", "核心商品"], ["轻奢链条单肩包", "SKU OWN-240824-003", "箱包配件"]].map(([name,sku,group])=><div key={sku}><span>▧　{name}<small>　{sku}</small></span><span>{group}</span><span>自有商品库 · 已上传</span><b>可申请</b></div>)}</section></>}
    {(pathname === "/workbench/supply/applications/records" || pathname === "/workbench/supply/applications/progress") && <><section className={styles.metrics}>{[["全部记录", "9", "历史审核记录"], ["已通过", "8", "审核已完成"], ["未通过", "1", "可修改后重申"]].map(([a,b,c])=><article key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></article>)}</section><section className={styles.split}><article><header><div><h2>审核历史记录</h2><p>选择一条历史记录，直接查看审核结果</p></div></header>{["全部", "已通过", "未通过"].map(x=><button key={x} className={active===x?styles.selected:""} onClick={()=>setActive(x)}>{x}</button>)}<div className={styles.tableHead}>申请编号　　商品数量　　审核日期　　审核结果　　操作</div>{[["SQ-20260820-011", "6件商品", "08月20日", "已通过"], ["SQ-20260815-003", "5件商品", "08月15日", "未通过"], ["SQ-20260812-021", "3件商品", "08月12日", "已通过"], ["SQ-20260808-014", "2件商品", "08月08日", "已通过"], ["SQ-20260802-006", "4件商品", "08月02日", "已通过"]].filter(row=>active==="全部"||row[3]===active).map(row=><div className={styles.serviceRow} key={row[0]}>{row.map(x=><span key={x}>{x}</span>)}<button onClick={()=>submit("查看审核结果")}>查看{row[3]==="未通过"?"原因":"结果"}</button></div>)}</article><article><h2>申请记录详情</h2><p>选择一条历史记录，直接查看审核结果</p><aside><b>SQ-20260815-003 · 5件商品</b><p>2026-08-15 · 未通过</p><hr/><h3>审核说明</h3><p>平台详细驳回原因尚未同步。可参考实际审核反馈修改资料，重新提交形成新审核记录。</p></aside><button className={styles.primary} onClick={()=>submit("修改资料并重新申请")}>修改资料并重新申请</button></article></section></>}
    {pathname === "/workbench/supply/catalogs" && <><section className={styles.twoCards}>{[["货盘选品", "已接入货盘 · 可选品", "查看已接入的第三方货盘及发货地，进入对应货盘筛选商品，所选商品统一进入后续数据和适配流程。", "进入货盘选品"], ["申请对接", "未接入货盘 · 可申请", "未找到需要的货盘时，可提交基本信息；平台将按业务评估，数据校验和技术对接流程确认接入安排。", "申请对接货盘"]].map(([title,badge,body,action])=><article key={title}><div><h2>{title}</h2><b>{badge}</b><p>{body}</p><button className={styles.primary} onClick={()=>router.push(`${pathname}/${title==="货盘选品"?"selection":"apply"}?preview=1`)}>{action}</button></div><aside><h3>{title==="货盘选品"?"选品能力":"对接事项"}</h3><p>{title==="货盘选品"?"• 货盘浏览　 • 发货地筛选\n• 选择商品　 • 转入数据":"• 提交资料　 • 业务评估\n• 数据校验　 • 技术接入"}</p><hr/>{title==="货盘选品"?"商品获取 · 选品入口":"对接申请 · 接入服务"}</aside></article>)}</section><section className={styles.split}><article><h2>商品进入供应链流程</h2><p>选择货盘商品或使用采集工具，统一进入「我的数据」，完成平台适配、审核和上传。</p><h3>商品来源</h3><div className={styles.sourceTiles}><span>官方货盘选品<br/><small>选择已接入货盘的商品</small></span><span>商品采集<br/><small>从采集工具引入商品</small></span></div><h3>后续处理阶段</h3><p>01 进入我的数据　　02 适配与审核　　03 上传关联店铺</p></article><article><h2>申请对接流程</h2><p>所需货盘尚未接入时，提交资料并由平台完成评估与对接。</p><p>01 提交货盘资料　→　02 业务能力评估　→　03 数据接口校验　→　04 完成接入选品</p></article></section></>}
    {pathname === "/workbench/supply/catalogs/selection" && <><section className={styles.filterBox}><h2>货盘筛选</h2><p>按实际发货地、对接方式筛选；当前4家货盘均为插件采集，商品发货地以采集数据为准。</p>{toolbar(["全部国家", "全部方式"])}</section><h2>插件采集货盘 · 4</h2><div className={styles.warehouses}>{[["1688 货盘", "中国货源", "国内产业带与工厂货源平台", "连接工厂、批发商与产业带货源，适合国内采购、商品开发与供应链整合。"], ["SDS 货盘", "全球配送", "POD 柔性定制供应链平台", "提供POD按需定制、一件代发与全球配送服务；具体商品发货地以平台说明为准。"], ["CJ 货盘", "全球货源", "跨境商品与履约服务", "浏览可用商品与履约方案，采集后统一进入我的数据。"], ["亿迈货盘", "跨境配送", "跨境物流与供货资源", "按业务需要筛选商品与配送方式。"]].filter(x=>x.join(" ").includes(query)).map(([name,tag,sub,body])=><article key={name}><b>{tag} · 插件采集</b><h2>{name}</h2><strong>{sub}</strong><p>{body}</p><hr/><p>货盘特点　 工厂与批发商资源</p><p>适合场景　 国内采购、商品开发、供应链整合</p><p>使用方式　 访问货盘，使用商品采集插件采集商品</p><button className={styles.primary} onClick={()=>submit(`进入${name}选品`)}>进入 {name.split(" ")[0]} 选品</button></article>)}</div></>}
    {pathname === "/workbench/supply/catalogs/apply" && <section className={styles.split}><article><h2>货盘基本资料</h2><p>请填写货盘及联系人的基本信息，便于专员快速与您取得联系。</p><div className={styles.formGrid}>{["货盘名称", "货盘网址", "对接联系人", "主要商品类目"].map((x,i)=><label key={x}>{x}<input placeholder={["请输入货盘或供应商名称", "请输入官网、商品库或开放平台地址", "姓名 / 手机 / 邮箱", "如：家居、宠物、3C配件"][i]}/></label>)}</div><aside><b>使用说明 · 技术对接为有偿服务</b><p>提交申请后，硕米专员将与您联系，确认对接方案、服务费用及实施安排。完成对接后，您可以调用硕米智能体与工具，对货盘商品进行采集、智能优化和快速上架。</p></aside><button className={styles.primary} onClick={()=>submit("提交对接申请")}>提交对接申请</button></article><article><h2>对接流程</h2><p>专员将联系您，确认对接方案、服务费用及实施排期。</p>{["提交申请 · 填写货盘名称、网址、联系人和商品类目", "专员联系 · 确认对接方案、服务费用及实施安排", "技术对接 · 完成接口联调、字段映射与数据校验", "接入完成 · 使用智能体与工具，并可申请加入硕米优选"].map((x,i)=><p key={x}><b>0{i+1}</b>　{x}</p>)}</article></section>}
    {pathname === "/workbench/tools/mine" && <><section className={styles.searchRow}><strong>已启用工具</strong><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="输入工具名称或关键词"/><button onClick={()=>{setQuery("");submit("重置")}}>重置</button><button className={styles.primary} onClick={()=>submit("确认筛选")}>确认</button></section><section className={styles.split}><article><header><h2>POD素材管理工具</h2><button onClick={()=>submit("停用工具")}>停用</button></header><p>从贴图生成、审核应用到订单打印，统一管理 POD 设计素材。</p><p>贴图审核通过后才能用于商品，订单产生后可按订单号或 SKU 找回原图。</p><p>支持个人素材上传与图片裂变复用，官方灵感市场提供图片和生成指令。</p><hr/><b>● 已启用</b><button onClick={()=>submit("前往POD素材管理")}>前往POD素材管理</button></article><article><h2>功能介绍</h2>{[["贴图审核与打印", "审核通过后贴到商品；下单可检索原图"], ["我的素材", "上传、分类管理个人素材，支持图片裂变"], ["灵感市场", "官方维护示例图片及生成指令"]].map(([a,b])=><p key={a}><b>{a}</b><br/>{b}</p>)}</article></section></>}
    {pathname === "/workbench/tools/official" && <>{toolbar(["全部", "采集", "图片", "环境", "数据", "流程", "其他"])}<section className={styles.cards}>{[["商品采集插件", "采集支持平台的标题、图片和规格，整理数据用于后续商品适配。", "商品采集 · 我的数据", "未启用"], ["POD素材管理工具", "管理贴图图案存与审核流程，按订单检索素材并辅助打印。", "自有素材 · 官方灵感市场", "已启用"], ["自有商品刊登工具", "导入并管理自有商品资料，检查必填信息后进行适配。", "自有商品 · 快速刊登", "未启用"], ["指纹浏览器", "规划隔离店铺登录环境，方便区分不同账号的使用。", "环境隔离 · 多账号", "开发中"], ["图片处理工具", "规划提供批量裁剪与去背景，减少重复处理图片的工作。", "图片处理 · 批量优化", "开发中"], ["数据导入工具", "规划以表格批量导入资料，按字段规则检查映射内容。", "表格导入 · 字段映射", "开发中"], ["自动化工具", "规划按规则执行重复步骤，方便统一管理流程与任务。", "流程自动化 · 定时执行", "开发中"], ["批量刊登工具", "规划批量整理并发布商品，辅助选择目标店铺进行刊登。", "批量刊登 · 多店铺", "开发中"], ["订单处理工具", "规划集中查看订单状态，辅助识别待处理与异常订单。", "订单汇总 · 异常处理", "开发中"], ["库存同步工具", "规划汇总多渠道库存变化，辅助识别数量差异与异常。", "库存同步 · 异常提醒", "开发中"]].filter(([name,body,tags,status])=>`${name} ${body} ${tags}`.includes(query)&&(active==="全部"||`${name} ${tags}`.includes(active))).map(([name,body,tags,status],i)=><article key={name} className={styles.card} data-tone={i%4}><h3>{name}</h3><p>{body}</p><div className={styles.tags}>{tags.split(" · ").map(x=><small key={x}>{x}</small>)}</div><button className={status==="开发中"?"":styles.primary} onClick={()=>submit(status==="开发中"?"暂未开放":name)}>{status==="已启用"?"已启用":status==="开发中"?"开发中":"启用"}</button><button onClick={()=>submit(`${name}介绍`)}>介绍</button></article>)}</section></>}
    {pathname === "/workbench/tools/custom" && <><section className={styles.split}><article><h2>把业务需求变成可调用的工具</h2><p>面向特殊业务场景，按需评估采集规则、系统接口与自动化处理方式，形成明确的定制需求。</p><p>提交前可准备：业务目标 · 数据来源 · 期望输出</p></article><article><h2>可定制内容</h2><p>数据采集　·　系统连接　·　自动化流程　·　输出与权限</p><button onClick={()=>router.push("/workbench/tools/custom/new?preview=1")}>提交定制需求</button></article></section><section className={styles.cards}>{[["数据采集", "采集网页、接口和文件数据，支持字段提取、清洗与批次整理。"], ["系统连接", "连接 ERP、OMS 和第三方系统，明确接口字段与数据交换规则。"], ["自动化流程", "配置触发条件和执行步骤，实现同步、规则判断与批量任务。"], ["输出与权限", "约定结果格式、使用账号及授权范围，便于验收与后续维护。"]].map(([a,b])=><article className={styles.card} key={a}><h3>{a}</h3><p>{b}</p></article>)}</section><section className={styles.split}><article><h2>定制流程</h2>{["提交需求 · 说明目标与业务场景", "技术评估 · 确认接口与运行条件", "方案报价 · 明确范围、周期和费用", "开发验收 · 完成联调测试与验收", "授权启用 · 完成授权后进入我的工具"].map((x,i)=><p key={x}>0{i+1}　{x}</p>)}</article><article><h2>有偿定制服务</h2><p>专员将沟通业务场景、接口条件和预期成果，再评估定制范围与实施方式。</p><p>评估范围 · 确认方案 · 提供报价</p></article></section></>}
    {pathname === "/workbench/tools/custom/new" && <section className={styles.split}><article><h2>告诉我们你需要怎样的工具</h2><p>描述工具目标与运行场景，具体技术方案由专员沟通确认。</p><div className={styles.formGrid}>{["工具需求名称", "使用场景", "联系人", "手机或微信"].map((x,i)=><label key={x}>{x} *<input placeholder={["例如：商品数据自动采集与ERP同步工具", "请选择工具使用场景", "请输入联系人姓名", "请输入方便联系的方式"][i]}/></label>)}</div><h3>定制工具类型 *</h3>{["数据采集", "系统连接", "自动化流程", "其他"].map(x=><button key={x} onClick={()=>setActive(x)} className={active===x?styles.selected:""}>{x}</button>)}<label>工具功能与执行规则 *<textarea placeholder="请描述数据来源或目标系统、执行步骤、运行频率和预期输出。"/></label><button onClick={()=>submit("上传参考资料")}>＋ 上传参考资料</button><button className={styles.primary} onClick={()=>submit("提交前请先授权联系")}>请先授权联系</button></article><article><h2>有偿定制服务</h2><p>提交需求无需付费，评估完成后再确认方案与报价。</p><h3>提交后会怎样</h3><p>01 专员联系 · 02 需求评估 · 03 方案与报价</p><h3>填写建议</h3><p>请说明数据来源、目标系统及运行规则。接口和授权资料可在评估阶段补充。</p></article></section>}
    {pathname === "/workbench/tools/custom/progress" && <><section className={styles.category}><h2>定制申请</h2><button onClick={()=>submit("查看示例")}>查看示例</button><span className={styles.disabledStatus} aria-label="暂无记录">暂无记录</span></section><section className={styles.split}><article><h2>商品数据采集与ERP自动同步工具</h2><p>示例需求 · 非真实记录　　按既定条件采集数据，执行去重、筛选并定时同步到企业系统。</p><p>工具类型：数据采集 · 目标系统：ERP</p><h3>办理进度 · 当前示例：技术评估</h3>{["提交需求 · 已完成", "技术可行性评估 · 进行中", "方案与报价确认 · 待开始", "开发联调与验收 · 待开始", "授权配置与启用 · 待开始"].map((x,i)=><p key={x}>0{i+1}　{x}</p>)}</article><article><h2>现在需要做什么</h2><p>当前阶段：技术评估。专员正在核对数据来源、接口权限和技术可行性。</p><p>你可以准备：整理业务流程、接口说明和授权要求。</p><p>接下来：完成评估后，确认实施方案、报价与交付安排。</p></article></section></>}
    {message && null}
  </main>;
}
