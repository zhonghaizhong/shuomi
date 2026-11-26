"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { BadgeCheck, Building2, ChartNoAxesCombined, CheckCircle2, ClipboardCheck, Clock3, Search, Store, X } from "lucide-react";
import styles from "./showcase-ecology-services.module.css";

type Service = {
  id: string; name: string; category: "企业服务" | "店铺服务"; description: string;
  points: readonly string[]; color: string; providerNote: string; Icon: typeof Building2;
};
const services: Service[] = [
  { id: "company", name: "公司注册", category: "企业服务", description: "协助梳理企业设立所需资料，了解办理事项与申请流程。", points: ["注册方案咨询", "申请资料指导", "办理进度跟进"], color: "#4fd1bd", providerNote: "根据企业注册地区和主体情况确认资料、流程与周期。", Icon: Building2 },
  { id: "trademark", name: "商标注册", category: "企业服务", description: "围绕品牌保护和注册需求，了解申请准备及办理事项。", points: ["注册前查询", "申请材料整理", "注册进度跟进"], color: "#4fd1bd", providerNote: "按注册国家、类别、商标状态确认方案和交付说明。", Icon: BadgeCheck },
  { id: "opening", name: "店铺开通服务", category: "店铺服务", description: "协助梳理平台开户入驻准备事项，跟进资料提交与开通流程。", points: ["开通流程指导", "申请资料准备", "开通过程协助"], color: "#62a9ff", providerNote: "以目标平台的资质、国家站点和最新审核规则为准。", Icon: Store },
  { id: "operation", name: "店铺代运营", category: "店铺服务", description: "围绕日常店铺运营与商品管理，了解可协作的服务内容。", points: ["商品与店铺管理", "日常运营执行", "经营数据分析"], color: "#ad8aff", providerNote: "合作范围、绩效指标、授权权限和服务费用需双方确认。", Icon: ChartNoAxesCombined },
];

type ServiceRecord = {
  id: string; service: string; status: "服务中" | "待确认" | "待验收" | "已完成";
  progress: string; updated: string; action: string; next: string; detail?: string; contact?: string; region?: string;
};
const records: ServiceRecord[] = [
  { id: "SV-20260801", service: "公司注册", status: "服务中", progress: "登记资料审核中", updated: "2026-08-06 10:30", action: "查看进度", next: "等待服务方完成登记资料审核，必要时补充资料。" },
  { id: "SV-20260726", service: "商标注册", status: "待确认", progress: "商标申请资料待核对", updated: "2026-08-05 09:15", action: "核对信息", next: "核对商标名称、注册类别和申请人信息后再确认。" },
  { id: "SV-20260718", service: "店铺开通服务", status: "待验收", progress: "店铺开通成果待验收", updated: "2026-08-04 16:40", action: "查看交付", next: "核对店铺权限、开通结果及交付资料，确认是否符合约定。" },
  { id: "SV-20260601", service: "店铺代运营", status: "已完成", progress: "本期运营成果已交付", updated: "2026-08-20 14:20", action: "查看成果", next: "可查看本期演示成果说明；真实交付资料须由服务方提供。" },
];

const ECO_DEMO_KEY="shuomi:eco-demo-requests-v1";
const ECO_JOIN_KEY="shuomi:eco-demo-provider-v1";
const stages:ServiceRecord["status"][]=["待确认","服务中","待验收","已完成"];
const stageLabel=(status:ServiceRecord["status"])=>status==="待确认"?"等待确认需求":status==="服务中"?"正在办理服务":status==="待验收"?"交付成果待验收":"服务已完成";
function readDemo<T>(key:string,fallback:T):T{if(typeof window==="undefined")return fallback;try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw) as T:fallback}catch{return fallback}}
type RequestDraft={region:string;details:string;contactName:string;contactWay:string};
type JoinDraft={company:string;contact:string;category:string;region:string;description:string};
type JoinRecord=JoinDraft&{id:string;status:"待审核"|"审核通过"};
type DialogState =
  | { kind: "service"; service: Service }
  | { kind: "request"; service: Service }
  | { kind: "record"; record: ServiceRecord }
  | { kind: "join"; tab: "requirements" | "preview" };

function AccessibleDialog({ title, children, onClose, side = false }: {
  title: string; children: ReactNode; onClose: () => void; side?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const label = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const element = ref.current;
    if (element && !element.open) element.showModal();
    return () => {
      element?.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  return <dialog ref={ref} className={side ? styles.drawer : styles.dialog} aria-labelledby={label}
    onCancel={e => { e.preventDefault(); onClose(); }}
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <header className={styles.dialogHead}><h2 id={label}>{title}</h2><button type="button" aria-label="关闭弹窗" onClick={onClose}><X size={18} /></button></header>
    <div className={styles.dialogBody}>{children}</div>
  </dialog>;
}

export function ShowcaseEcologyServices({ pathname, navigate }: {
  pathname: string; navigate: (path: string) => void;
}) {
  const isHome = pathname === "/workbench/services";
  const isMarket = pathname.endsWith("/market");
  const isMine = pathname.endsWith("/mine");
  const isJoin = pathname.endsWith("/join");
  const [category, setCategory] = useState("全部服务");
  const [status, setStatus] = useState("全部服务");
  const [draftSearch, setDraftSearch] = useState("");
  const [search, setSearch] = useState("");
  const [serviceType, setServiceType] = useState("全部类型");
  const [order, setOrder] = useState("更新时间");
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [extraRecords,setExtraRecords]=useState<ServiceRecord[]>(()=>readDemo(ECO_DEMO_KEY,[]));
  const [requestDraft,setRequestDraft]=useState<RequestDraft>({region:"",details:"",contactName:"",contactWay:""});
  const [joinDraft,setJoinDraft]=useState<JoinDraft>({company:"",contact:"",category:"企业服务",region:"",description:""});
  const [joinRecord,setJoinRecord]=useState<JoinRecord|null>(()=>readDemo(ECO_JOIN_KEY,null));
  const [showExamples,setShowExamples]=useState(true);
  const allRecords=useMemo(()=>[...extraRecords,...(showExamples?records:[])],[extraRecords,showExamples]);
  const saveRecords=(next:ServiceRecord[])=>{setExtraRecords(next);try{localStorage.setItem(ECO_DEMO_KEY,JSON.stringify(next))}catch{}};
  const saveJoin=(next:JoinRecord)=>{setJoinRecord(next);try{localStorage.setItem(ECO_JOIN_KEY,JSON.stringify(next))}catch{}};
  const createRequest=()=>{
    if(!dialog||dialog.kind!=="request"||!requestDraft.region.trim()||!requestDraft.details.trim()||!requestDraft.contactName.trim()||!requestDraft.contactWay.trim())return;
    const now=new Date();const record:ServiceRecord={id:"DEMO-"+now.getTime(),service:dialog.service.name,status:"待确认",progress:stageLabel("待确认"),updated:now.toLocaleString("sv-SE").slice(0,16),action:"查看进度",next:"需求已保存，等待演示确认。",detail:requestDraft.details,contact:requestDraft.contactName+" · "+requestDraft.contactWay,region:requestDraft.region};
    saveRecords([record,...extraRecords]);setRequestDraft({region:"",details:"",contactName:"",contactWay:""});setDialog({kind:"record",record});go("/mine");
  };
  const advanceRecord=(record:ServiceRecord)=>{
    if(record.status==="已完成")return;
    const next=stages[Math.min(stages.length-1,stages.indexOf(record.status)+1)];
    const updated={...record,status:next,progress:stageLabel(next),updated:new Date().toLocaleString("sv-SE").slice(0,16),next:next==="已完成"?"演示服务已完成，可查看过程记录。":"进入下一阶段，可继续模拟办理进度。"};
    saveRecords(extraRecords.map(r=>r.id===record.id?updated:r));setDialog({kind:"record",record:updated});
  };
  const go = (route: string) => navigate("/workbench/services" + route + "?preview=1");
  const reset = () => {
    setCategory("全部服务"); setStatus("全部服务");
    setDraftSearch(""); setSearch(""); setServiceType("全部类型"); setOrder("更新时间");
  };
  const filteredServices = useMemo(() => services.filter(s =>
    (category === "全部服务" || category === s.category) &&
    [s.name, s.description, s.category, ...s.points].join(" ").toLowerCase().includes(search.trim().toLowerCase())), [category, search]);
  const filteredRecords = useMemo(() => allRecords.filter(r =>
    (status === "全部服务" || r.status === status) &&
    (serviceType === "全部类型" || r.service === serviceType) &&
    [r.service, r.id, r.progress, r.status].join(" ").toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => order === "最早更新" ? a.updated.localeCompare(b.updated) : b.updated.localeCompare(a.updated)), [allRecords,status, serviceType, order, search]);

  function Header({ section, title, description }: { section: string; title: string; description: string }) {
    return <header className={styles.head}><small>生态服务 / {section}</small><h1>{title}</h1><p>{description}</p></header>;
  }
  return <main className={styles.page} data-eco-page={isHome ? "home" : isMarket ? "market" : isMine ? "mine" : "join"}>
    {isHome && <>
      <Header section="总览" title="连接专业服务资源，补齐跨境经营关键环节" description="连接企业设立、品牌保护和店铺运营等专业服务资源，支持需求对接、交付跟进与统一管理。" />
      <section className={styles.homeCards} aria-label="生态服务入口">
        {[
          ["服务市场", "汇集企业设立、品牌保护与店铺运营服务，可查看服务范围、办理周期及费用说明。", "专业服务", "浏览服务市场", "/market", "#62a9ff"],
          ["我的服务", "集中管理已提交和正在交付的服务需求，及时查看确认进度、交付节点及售后状态。", "需求管理", "查看我的服务", "/mine", "#4fd1bd"],
          ["申请加入", "面向具备专业能力的机构与服务团队，了解入驻条件，申请审核并发布服务。", "生态合作", "了解入驻要求", "/join", "#ad8aff"],
        ].map(([title, body, tag, button, route, color]) => <article key={title} className={styles.homeCard} style={{ "--accent": color } as CSSProperties}>
          <div className={styles.cardHead}><h2>{title}</h2><span>{tag}</span></div><p>{body}</p><button type="button" onClick={() => go(route)}>{button}</button>
        </article>)}
      </section>
      <section className={styles.howto}><header><h2>如何获取服务</h2><p>按需选择服务，确认方案后提交需求，并持续跟进服务交付</p></header>
        <div className={styles.howtoGrid}>{[
          ["01", "查找服务", "按企业设立、品牌保护与店铺运营等业务场景筛选适合的服务，核对服务内容与适用地区。"],
          ["02", "了解方案", "了解服务范围、办理周期与费用，对关键交付条件进行确认，避免后续理解偏差。"],
          ["03", "提交需求", "填写业务目标、地区及具体要求，确认联系方式和需求范围，由服务方进一步评估方案。"],
          ["04", "跟进交付", "在「我的服务」查看办理阶段，跟进交付成果及待确认事项，必要时联系服务方。"],
        ].map(([n, name, desc], i) => <article data-step={i} key={n}><b>{n}</b><h3>{name}</h3><p>{desc}</p></article>)}</div>
      </section>
      <section className={styles.homeNotes}>
        <article><small>服务管理</small><h3>在哪里查看进度</h3><p>进入「我的服务」后，可按服务状态跟进确认事项、办理节点及交付结果，必要时与服务方核对。</p></article>
        <article><small>费用与资质</small><h3>服务信息如何确认</h3><p>申请前重点核对服务范围、报价与办理周期，并确认机构资质、资料要求和交付方式。</p></article>
      </section>
    </>}

    {isMarket && <>
      <Header section="服务市场" title="服务市场" description="围绕企业设立、品牌保护、店铺开通和日常运营，提供专业服务支持。" />
      <div className={styles.marketControls}>
        <div className={styles.segmentRow}><div><strong>服务分类</strong><small>按业务类型筛选专业服务</small></div>
          <div className={styles.segments}>{[["全部服务", "全部服务 4"], ["企业服务", "企业服务 2"], ["店铺服务", "店铺服务 2"]].map(([value,label])=><button type="button" key={value} aria-pressed={category===value} onClick={()=>setCategory(value)}>{label}</button>)}</div>
        </div>
        <form className={styles.filterBar} onSubmit={e=>{e.preventDefault();setSearch(draftSearch);}}>
          <label className={styles.searchBox}><Search size={16} aria-hidden="true" /><input aria-label="搜索服务名称或关键词" placeholder="搜索服务名称或关键词" value={draftSearch} onChange={e=>setDraftSearch(e.target.value)}/></label>
          <button type="button" onClick={reset}>重置</button><button type="submit" className={styles.primary}>确认</button>
        </form>
      </div>
      {filteredServices.length ? <section className={styles.serviceGrid} aria-label="服务列表">
        {filteredServices.map(s => <article key={s.id} className={styles.serviceCard} style={{ "--accent": s.color } as CSSProperties}>
          <div className={styles.serviceCardTop}><span className={styles.serviceIcon}><s.Icon size={23} aria-hidden="true" /></span><div><div className={styles.serviceCardTitle}><h2>{s.name}</h2></div><p>{s.description}</p></div></div>
          <div className={styles.points}><strong>服务要点</strong><ul>{s.points.map(point=><li key={point}>{point}</li>)}</ul></div>
          <button type="button" onClick={()=>setDialog({kind:"service",service:s})}>查看详情</button>
        </article>)}
      </section> : <p className={styles.empty}>没有找到匹配的服务，请调整分类或搜索条件。</p>}
      <section className={styles.marketNotes}>
        <article><h2>服务流程</h2><div><span>了解方案</span><span>确认需求</span><span>服务交付</span></div><p>办理与交付进展，可在「我的服务」中查看。</p></article>
        <article><h2>服务说明</h2><div><span>服务范围</span><span>费用标准</span><span>办理周期</span></div><p>服务地区、适用条件及报价由服务方确认；具体以方案为准。</p></article>
      </section>
    </>}

    {isMine && <>
      <Header section="我的服务" title="我的服务" description="统一查看已提交和正在交付的服务，跟进确认、交付与售后进度。" />
      <section className={styles.segmentRow}><div><strong>服务状态</strong><small>按当前状态快速查看需要跟进的服务</small></div>
        <div className={styles.segments}>{[["全部服务","全部服务 4"],["待确认","待确认 1"],["服务中","服务中 1"],["待验收","待验收 1"],["已完成","已完成 1"]].map(([val,label])=><button type="button" key={val} aria-pressed={status===val} onClick={()=>setStatus(val)}>{label}</button>)}</div>
      </section>
      <form className={styles.filterBar} onSubmit={e=>{e.preventDefault();setSearch(draftSearch);}}>
        <label className={styles.searchBox}><Search size={16} aria-hidden="true"/><input aria-label="搜索服务名称或服务编号" placeholder="搜索服务名称或服务编号" value={draftSearch} onChange={e=>setDraftSearch(e.target.value)}/></label>
        <select aria-label="服务类型" value={serviceType} onChange={e=>setServiceType(e.target.value)}>{["全部类型",...services.map(s=>s.name)].map(x=><option key={x}>{x}</option>)}</select>
        <select aria-label="更新时间" value={order} onChange={e=>setOrder(e.target.value)}><option>更新时间</option><option>最近更新</option><option>最早更新</option></select>
        <button type="button" onClick={reset}>重置</button><button type="submit" className={styles.primary}>确定</button>
      </form>
      <section className={styles.recordsPanel} aria-label="服务记录">
        <header><h2>服务记录</h2><div className={styles.recordOptions}><small>共 {filteredRecords.length} 项 · 本地演示</small><label><input type="checkbox" checked={showExamples} onChange={e=>setShowExamples(e.target.checked)}/> 显示预置案例</label></div></header>
        <div className={styles.tableScroll}><div className={styles.records}>
          <div className={styles.tableHeader}><span>服务名称</span><span>服务状态</span><span>当前进度</span><span>更新时间</span><span>操作</span></div>
          {filteredRecords.map(r=><div className={styles.recordRow} key={r.id}>
            <div><strong>{r.service}</strong><small>{r.id}</small></div>
            <div><span className={styles.status} data-status={r.status}>{r.status}</span></div>
            <div>{r.progress}</div><time dateTime={r.updated.replace(" ","T")}>{r.updated}</time>
            <button type="button" onClick={()=>setDialog({kind:"record",record:r})}>{r.action}</button>
          </div>)}
          {!filteredRecords.length&&<p className={styles.empty}>没有符合筛选条件的服务记录。</p>}
        </div></div>
      </section>
    </>}

    {isJoin && <>
      <Header section="申请加入" title="申请加入" description="面向专业服务机构与团队开放入驻，成为硕米认证生态服务商。" />
      <section className={styles.joinHero}><div><small>生态合作</small><h2>成为硕米认证服务商</h2><p>提供机构资质、服务范围与案例信息，经审核后可申请上架生态服务。</p></div>
        <aside><span>审核周期</span><strong>预计 3–7 个工作日</strong><small>以资料完整性及实际审核情况为准</small></aside>
      </section>
      <section className={styles.joinGrid}>
        <article className={styles.joinFlow}><h2>入驻流程</h2>
          {[
            ["01","提交机构资料","填写机构信息、服务领域与主要覆盖区域","资料准备"],
            ["02","资质与案例审核","上传资质证明、团队介绍及代表服务案例","资质审核"],
            ["03","签署合作协议","确认服务规范、交付标准与平台合作规则","合作确认"],
            ["04","上线服务","配置服务内容、价格与交付周期后正式发布","服务上线"],
          ].map(([n,title,detail,state],i)=><div className={styles.joinStep} key={n} data-step={i}><b>{n}</b><span><strong>{title}</strong><small>{detail}</small></span><em>{state}</em></div>)}
        </article>
        <aside className={styles.joinAside}><h2>申请入口</h2>
          <div className={styles.joinInfo}><strong>入驻要求</strong><p>主体资质、服务能力与交付条件</p></div>
          <div className={styles.joinInfo}><strong>申请资料</strong><p>机构信息、资质证明及服务案例</p></div>
          <button type="button" className={styles.primary} onClick={()=>setDialog({kind:"join",tab:"requirements"})}>提交入驻申请</button>
          <section className={styles.joinNotice}><strong>合作说明</strong><p>审核通过后，可在服务市场展示已确认的服务。应明确服务范围、交付要求及费用方式，并跟进客户需求、验收和后续服务。</p></section>
        </aside>
      </section>
    </>}

    {dialog?.kind==="service" && <AccessibleDialog key={"service:"+dialog.service.id} title={dialog.service.name+" · 服务详情"} onClose={()=>setDialog(null)}>
      <div className={styles.serviceDetailLead}>
        <span className={styles.serviceDetailIcon} style={{"--service-accent":dialog.service.color} as CSSProperties}><dialog.service.Icon size={27} aria-hidden="true"/></span>
        <div><span className={styles.serviceCategory}>{dialog.service.category}</span><h3>{dialog.service.name}</h3><p>{dialog.service.description}</p></div>
      </div>
      <div className={styles.serviceDetailTags}><span>专业服务</span><span>方案评估</span><span>按需交付</span></div>
      <div className={styles.serviceDetailGrid}>
        <section className={styles.serviceDetailPanel}><h3>服务要点</h3><ul className={styles.dialogList}>{dialog.service.points.map(t=><li key={t}><CheckCircle2 size={16}/>{t}</li>)}</ul></section>
        <div className={styles.serviceDetailAside}>
          <section className={styles.serviceDetailPanel}><h3>服务范围</h3><p>{dialog.service.providerNote}</p></section>
          <section className={styles.serviceDetailPanel}><h3>办理周期与费用</h3><p>办理周期及服务费用由服务方根据具体需求评估，并在双方确认方案后提供。</p></section>
        </div>
      </div>
      <p className={styles.disclaimer}>服务信息为演示介绍，具体服务范围、资质、报价及交付条件以服务方正式确认为准。</p>
      <footer className={styles.dialogActions}><button type="button" onClick={()=>setDialog(null)}>关闭</button><button type="button" className={styles.primary} onClick={()=>setDialog({kind:"request",service:dialog.service})}>提交需求</button></footer>
    </AccessibleDialog>}
    {dialog?.kind==="request" && <AccessibleDialog key={"request:"+dialog.service.id} title="提交服务需求" onClose={()=>setDialog(null)}>
      <div className={styles.requestIntro}><strong>{dialog.service.name}</strong><p>填写业务需求，创建服务申请并在「我的服务」追踪办理进度。</p></div>
      <form className={styles.ecoForm} onSubmit={e=>{e.preventDefault();createRequest()}}>
        <label>服务地区 *<input required value={requestDraft.region} onChange={e=>setRequestDraft(p=>({...p,region:e.target.value}))} placeholder="例如：美国 / 加利福尼亚"/></label>
        <label>需求说明 *<textarea required rows={4} value={requestDraft.details} onChange={e=>setRequestDraft(p=>({...p,details:e.target.value}))} placeholder="说明业务目标、当前情况及希望交付的成果"/></label>
        <div className={styles.ecoFormRow}><label>联系人 *<input required value={requestDraft.contactName} onChange={e=>setRequestDraft(p=>({...p,contactName:e.target.value}))} placeholder="联系人姓名"/></label><label>联系方式 *<input required value={requestDraft.contactWay} onChange={e=>setRequestDraft(p=>({...p,contactWay:e.target.value}))} placeholder="邮箱、手机或微信"/></label></div>
        <p className={styles.demoHint}>演示申请保存在当前浏览器，不会向实际服务商发送信息或产生费用。</p>
        <footer className={styles.dialogActions}><button type="button" onClick={()=>setDialog({kind:"service",service:dialog.service})}>返回详情</button><button type="submit" className={styles.primary}>确认提交需求</button></footer>
      </form>
    </AccessibleDialog>}
    {dialog?.kind==="record" && <AccessibleDialog key={"record:"+dialog.record.id} title="服务办理进度" side onClose={()=>setDialog(null)}>
      <div className={styles.drawerSummary}><small>{dialog.record.id}</small><h3>{dialog.record.service}</h3><span className={styles.status} data-status={dialog.record.status}>{dialog.record.status}</span><p>{dialog.record.progress}</p></div>
      <h3>办理阶段</h3>
      <div className={styles.progressSteps}>{["需求提交","需求确认","服务办理","交付验收"].map((step,i)=>{
        const current=dialog.record.status==="待确认"?1:dialog.record.status==="服务中"?2:dialog.record.status==="待验收"?3:4;
        return <div key={step} data-complete={i<current} data-active={i===Math.min(current-1,3)}><b>{i+1}</b><span><strong>{step}</strong><small>{i<current?"示例阶段":"待开始"}</small></span></div>;
      })}</div>
      <h3>当前事项</h3><p>{dialog.record.next}</p><p className={styles.disclaimer}>以上为演示记录。真实办理数据、资料确认和交付验收需接入服务系统。</p>
      <footer className={styles.dialogActions}><button type="button" className={styles.primary} onClick={()=>setDialog(null)}>关闭</button></footer>
    </AccessibleDialog>}
    {dialog?.kind==="join" && <AccessibleDialog key={"join:"+dialog.tab} title="申请加入 · 入驻资料" side onClose={()=>setDialog(null)}>
      <div className={styles.drawerTabs}><button type="button" aria-pressed={dialog.tab==="requirements"} onClick={()=>setDialog({kind:"join",tab:"requirements"})}>申请资料</button><button type="button" aria-pressed={dialog.tab==="preview"} onClick={()=>setDialog({kind:"join",tab:"preview"})}>后续流程</button></div>
      {dialog.tab==="requirements"?<>
        <h3>申请资料清单</h3>
        <p>申请时需准备主体信息及与所提供服务对应的资质、人员与交付能力说明。</p>
        <ul className={styles.dialogList}>{["机构基本信息及联系人","企业主体与相关资质证明","主要服务领域、覆盖地区和交付说明","团队介绍及代表服务案例"].map(x=><li key={x}><CheckCircle2 size={16}/>{x}</li>)}</ul>
        <p className={styles.disclaimer}>正式入驻表单暂未接入。此处仅展示申请资料要求，不会上传、保存或提交信息。</p>
        <footer className={styles.dialogActions}><button type="button" onClick={()=>setDialog(null)}>关闭</button><button type="button" className={styles.primary} onClick={()=>setDialog({kind:"join",tab:"preview"})}>了解后续流程</button></footer>
      </>:<>
        <h3>审核与服务上线</h3>
        <div className={styles.progressSteps}>{["提交机构资料","资质与案例审核","签署合作协议","配置并上线服务"].map((x,i)=><div key={x}><b>{i+1}</b><span><strong>{x}</strong><small>{i===0?"准备资料并核对主体信息":"审核或确认后推进"}</small></span></div>)}</div>
        <p className={styles.disclaimer}>这是流程说明，不代表已提交或审核通过。正式申请功能尚未接入。</p>
        <footer className={styles.dialogActions}><button type="button" onClick={()=>setDialog({kind:"join",tab:"requirements"})}>返回资料清单</button><button type="button" className={styles.primary} onClick={()=>setDialog(null)}>完成查看</button></footer>
      </>}
    </AccessibleDialog>}
  </main>;
}
