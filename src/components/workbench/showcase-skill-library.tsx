"use client";
import type {ReactNode} from "react";
import {useState,useEffect,useRef} from "react";
import {useRouter} from "next/navigation";
import {BookOpen, LibraryBig, Users, Info, Layers3, MessageSquare, Zap} from "lucide-react";
import styles from "./showcase-skill-library.module.css";
const root="/workbench/agents/skills";
export const officialSkills=[
 ["商品标题整理","规范商品标题的结构与关键词层次，突出核心卖点和重要信息，帮助消费者快速理解商品特点。","商品标题 · 文案优化","标题优化","核对关键词与平台规则"],
 ["标题本地化","结合目标市场的语言习惯与搜索表达，调整商品标题的措辞与排列顺序，提升本地阅读体验。","商品标题 · 多语言","标题优化","检查语言和规格准确性"],
 ["冗长标题精简","清理标题里的重复内容与冗余词语，保留重要卖点和关键词，让商品标题清晰易读。","商品标题 · 文案精简","标题优化","保留关键属性及商品参数"],
 ["标准商品套图","统一商品图片的构图、比例与展示方式，保持主图和套图风格一致，方便后续快速刊登。","商品图片 · 主图制作","图片制作","确保商品外观真实"],
 ["场景化商品展示","结合真实使用情境展现商品特点，突出场景价值与核心卖点，帮助消费者理解应用方式。","商品图片 · 场景展示","图片制作","避免误导商品实际用途"],
 ["卖点详情图编排","梳理商品核心卖点与图片展示顺序，合理组织详情图内容，让信息表达更加清楚。","商品图片 · 详情展示","图片制作","检查卖点与参数真实"]
] as const;
const enabledKey="shuomi-preview-enabled-skills";
const personalKey="shuomi-preview-personal-skills";
export type PersonalPreviewSkill={name:string;description:string;id?:string;projectIds?:string[];demo?:boolean};
export const projectDemoSkills:PersonalPreviewSkill[]=[
 {id:"demo-skill-profit",name:"SHEIN 店铺利润诊断流程（演示）",projectIds:["demo-project-shein-growth"],demo:true,description:`【目标】建立店铺经营成本核对与利润诊断步骤，属于方法草案，并不自动读取真实店铺数据。
【输入】店铺ID、日期范围、站点币种、销售明细、退款、采购成本、物流费用、平台佣金及其他已确认的费用字段。
【处理】1. 核对店铺权限和时间口径；2. 标记缺少成本或币种不一致的数据；3. 在具备全部必要字段时按净收入减去成本及费用核算利润；4. 对负利润或异常退款商品生成待核对列表；5. 人工确认后形成改善任务。
【输出】利润核对表、字段缺失清单、异常商品清单、阶段改善建议。
【边界】目前未连接自动计算服务，不生成真实利润数字；没有授权不得获取店铺数据。`},
 {id:"demo-skill-pod-review",name:"POD 多变体图片审核流程（演示）",projectIds:["demo-project-pod-images"],demo:true,description:`【目标】保证POD服装多颜色、多尺码的素材与目标站点规格一致。
【输入】批次ID、商品ID、变体SKU、原始商品图、印花素材、目标站点要求及预期输出数量。
【处理】1. 逐个变体核对颜色尺码；2. 对主图与详情图建立SKU映射；3. 检查1:1尺寸、背景、语言和主体完整性；4. 核对印花区域和素材授权；5. 图片缺失或内容错误时进入待确认，不得自动标记通过。
【输出】逐SKU审核清单、待补全项、审核结论以及拟刊登图片顺序。
【边界】本技能是可查看的演示方法；未调用图像生成模型，也不表示图片已生成或上传。`},
 {id:"demo-skill-selected-listing",name:"硕米优选选品与SHEIN刊登检查（演示）",projectIds:["demo-project-selected-sales"],demo:true,description:`【目标】让来自硕米优选的演示SKU经过可审计的采集与刊登准备流程。
【输入】货盘商品ID、所选SKU、供货国家、可配送国家、MOQ、供货价、目标SHEIN店铺。
【处理】1. 检查供货商品ID和版本；2. 按SKU核验库存、起订量、配送范围；3. 在我的数据中建立采集批次；4. 进行属性和图片适配；5. 缺失必填字段转待补全，审核通过后才可进入刊登。
【输出】SKU选择表、采集来源追溯、平台适配清单和异常待办。
【边界】当前只支持演示流程；不自动采购、不保证真实库存、不向SHEIN真实发布。`},
 {id:"demo-skill-market-compare",name:"美国站候选商品比较与报告整理（演示）",projectIds:["demo-project-market-research"],demo:true,description:`【目标】比较已有货盘样品的供货条件，形成有证据边界的选品研究材料。
【输入】研究国家、品类、候选SKU、报价、MOQ、发货地、物流条件、可调用的数据市场服务结果。
【处理】1. 核对数据来源和版本；2. 对候选SKU统一币种与条件；3. 分别评估供货、商品属性及待核实风险；4. 对没有市场需求证据的结论标记未知；5. 将可追溯比较结果整理成报告。
【输出】候选商品对比表、证据与缺失清单、待核实建议、归档材料。
【边界】未调取真实市场销量、竞争数据，不构成实际选品收益预测。`}
];
const scopedKey=(base:string,organizationId="SM-ENT-000001",memberId="admin")=>
 organizationId==="SM-ENT-000001"&&memberId==="admin"?base:base+":"+encodeURIComponent(organizationId)+":"+encodeURIComponent(memberId);
export function readEnabledPreviewSkills(organizationId="SM-ENT-000001",memberId="admin"):string[]{
 try{const raw=JSON.parse(sessionStorage.getItem(scopedKey(enabledKey,organizationId,memberId))||"[]");
  return Array.isArray(raw)?raw.filter(x=>typeof x==="string"&&officialSkills.some(s=>s[0]===x)):[];
 }catch{return []}
}
export function readPersonalPreviewSkills(organizationId="SM-ENT-000001",memberId="admin"):PersonalPreviewSkill[]{
 try{const raw=sessionStorage.getItem(scopedKey(personalKey,organizationId,memberId));
  if(raw){const a=JSON.parse(raw);if(Array.isArray(a)){const own=a.filter(x=>typeof x?.name==="string"&&typeof x?.description==="string") as PersonalPreviewSkill[];return organizationId==="SM-ENT-000001"&&memberId==="admin"?[...own.filter(x=>!projectDemoSkills.some(d=>d.id===x.id)),...projectDemoSkills.map(d=>own.find(x=>x.id===d.id)??d)]:own}}
 }catch{}
 return organizationId==="SM-ENT-000001"&&memberId==="admin"?projectDemoSkills.map(x=>({...x})):[];
}
export function savePersonalPreviewSkill(skill:PersonalPreviewSkill,organizationId="SM-ENT-000001",memberId="admin"){
 try{sessionStorage.setItem(scopedKey(personalKey,organizationId,memberId),JSON.stringify([...readPersonalPreviewSkills(organizationId,memberId).filter(x=>x.name!==skill.name),skill]))}catch{}
}
const groupKey=(organizationId:string,memberId:string)=>"shuomi-preview-skill-groups-v1:"+encodeURIComponent(organizationId)+":"+encodeURIComponent(memberId);
type SkillGroups={groups:string[];assignments:Record<string,string>};
const emptyGroups=():SkillGroups=>({groups:[],assignments:{}});
function readSkillGroups(org:string,member:string):SkillGroups{
 try{const raw=JSON.parse(sessionStorage.getItem(groupKey(org,member))||"null");if(raw&&Array.isArray(raw.groups)&&raw.assignments&&typeof raw.assignments==="object"){return {groups:raw.groups.filter((g:unknown):g is string=>typeof g==="string"&&!!g.trim()).slice(0,100),assignments:raw.assignments}}}catch{}
 return emptyGroups();
}
function saveSkillGroups(org:string,member:string,value:SkillGroups){sessionStorage.setItem(groupKey(org,member),JSON.stringify(value))}
export function ShowcaseSkillLibrary({pathname,organizationId="SM-ENT-000001",memberId="admin",onSectionSelect,tabNavigation}:{pathname:string;organizationId?:string;memberId?:string;onSectionSelect?:(path:string)=>void;tabNavigation?:ReactNode}){
 const router=useRouter();
 const category=pathname.endsWith("/official")?"official":pathname.endsWith("/mine")?"mine":pathname.endsWith("/team")?"team":"home";
 const [enabled,setEnabled]=useState(()=>readEnabledPreviewSkills(organizationId,memberId));
 const [personal,setPersonal]=useState(()=>readPersonalPreviewSkills(organizationId,memberId));
 const [filter,setFilter]=useState("全部"),[query,setQuery]=useState(""),[search,setSearch]=useState("");
 const [intro,setIntro]=useState<string|null>(null);\n const [detailSkill,setDetailSkill]=useState<string|null>(null);
 const [groupState,setGroupState]=useState<SkillGroups>(()=>readSkillGroups(organizationId,memberId));
 const [groupFilter,setGroupFilter]=useState("全部分组");
 const [groupOpen,setGroupOpen]=useState(false);
 const [groupDraft,setGroupDraft]=useState("");
 const [groupEditing,setGroupEditing]=useState("");
 const [groupRename,setGroupRename]=useState("");
 const [groupNotice,setGroupNotice]=useState("");
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{setFilter("全部");setQuery("");setSearch("");setIntro(null);setEnabled(readEnabledPreviewSkills(organizationId,memberId));setPersonal(readPersonalPreviewSkills(organizationId,memberId));setGroupState(readSkillGroups(organizationId,memberId));setGroupFilter("全部分组")},[pathname,organizationId,memberId]);
 useEffect(()=>{if(intro&&!dialog.current?.open)dialog.current?.showModal();else if(!intro&&dialog.current?.open)dialog.current.close()},[intro]);
 const go=(p:string)=>{const href=root+(p?"/"+p:"");if(onSectionSelect)onSectionSelect(href);else router.push(href+"?preview=1")};
 const chat=(mode:string,name="")=>router.push("/workbench/ai/chat/new?preview=1&skillMode="+mode+"&skill="+encodeURIComponent(name));
 const toggle=(name:string)=>{const next=enabled.includes(name)?enabled.filter(x=>x!==name):[...enabled,name];setEnabled(next);try{sessionStorage.setItem(scopedKey(enabledKey,organizationId,memberId),JSON.stringify(next))}catch{}};
 const commitGroups=(next:SkillGroups,notice:string)=>{try{saveSkillGroups(organizationId,memberId,next);setGroupState(next);setGroupNotice(notice)}catch{setGroupNotice("保存分组失败，请检查浏览器存储权限")}};
 const addGroup=()=>{const n=groupDraft.trim();if(!n||n.length>40||groupState.groups.includes(n))return;commitGroups({...groupState,groups:[...groupState.groups,n]},"分组已创建");setGroupDraft("")};
 const renameGroup=(old:string)=>{const n=groupRename.trim();if(!n||n.length>40||(n!==old&&groupState.groups.includes(n)))return;commitGroups({groups:groupState.groups.map(g=>g===old?n:g),assignments:Object.fromEntries(Object.entries(groupState.assignments).map(([key,val])=>[key,val===old?n:val]))},"分组已重命名");if(groupFilter===old)setGroupFilter(n);setGroupEditing("")};
 const deleteGroup=(name:string)=>{commitGroups({groups:groupState.groups.filter(g=>g!==name),assignments:Object.fromEntries(Object.entries(groupState.assignments).map(([key,val])=>[key,val===name?"":val]))},"分组已删除，技能仍然保留");if(groupFilter===name)setGroupFilter("全部分组")};
 const title=category==="home"?"技能库":category==="official"?"官方模板":category==="mine"?"我的技能":"团队技能";
 const desc=category==="home"?"把常用的工作方法保存成技能，需要时让 AI 按要求处理任务。":category==="official"?"按需查找和启用标准技能，启用后会出现在「我的技能」，使用时再关联到会话或任务。":category==="mine"?"管理已启用的官方技能和自己保存的技能，需要时直接带入会话。":"团队技能暂未开放。你可以先使用官方模板或我的技能。";
 const selected=officialSkills.find(s=>s[0]===intro);
 const match=(s:string)=>s.toLowerCase().includes(search.toLowerCase());
 const cards=officialSkills.filter(s=>(category==="official"?(filter==="全部"||s[3]===filter):enabled.includes(s[0])&&filter!=="我的创建")&&match(s.join(" ")));
 const mine=category==="mine"&&filter!=="官方技能"?personal.filter(s=>match(s.name+" "+s.description)):[];
 const detailPreview=personal.find(item=>item.name===detailSkill);\n const mySkillRows=[...officialSkills.filter(item=>enabled.includes(item[0])).map(item=>({key:"official:"+item[0],name:item[0],description:item[1],source:"官方技能",enabled:true})),...personal.map(item=>({key:"personal:"+item.name,name:item.name,description:item.description,source:"我的创建",enabled:true}))].filter(item=>(item.name+" "+item.description).toLocaleLowerCase().includes(search.toLocaleLowerCase()));
 return <main className={styles.shell} data-skill-showcase="true" data-skill-flow={category}>
 <header className={styles.hero}><div className={styles.heroCopy}><div className={styles.breadcrumb}>AI工作台 / 技能库</div><h1>技能库</h1><p>选择官方模板、我的技能或团队技能；需要时再在 AI 会话中调用。</p></div><button type="button" className={styles.primary} onClick={()=>chat("create")}>创建我的技能</button></header>
 {tabNavigation}
 {category==="home"?<>
 <section className={styles.skillIntroGrid} aria-label="选择技能库入口">
  <article className={styles.skillIntroCard} data-skill-entry="official">
   <div className={styles.skillIntroTop}>
    <span className={styles.skillIntroIcon} aria-hidden="true"><BookOpen size={23}/></span>
    <div className={styles.skillIntroHeading}>
     <span className={styles.skillIntroType}>平台预设</span>
     <h2>官方模板</h2>
     <p>平台已经准备好的商品运营和内容处理方法。选择并启用后，可以在支持的 AI 会话中按需引用。</p>
    </div>
   </div>
   <div className={styles.skillIntroExample}><strong>例如：</strong><p>优化 SHEIN 商品标题时，启用标题整理技能，让 AI 参考固定方法梳理卖点和关键词。</p></div>
   <div className={styles.skillIntroTags}><span>商品标题</span><span>图片制作</span><span>快速启用</span></div>
   <button type="button" onClick={()=>go("official")}>浏览官方模板</button>
  </article>
  <article className={styles.skillIntroCard} data-skill-entry="mine">
   <div className={styles.skillIntroTop}>
    <span className={styles.skillIntroIcon} aria-hidden="true"><LibraryBig size={23}/></span>
    <div className={styles.skillIntroHeading}>
     <span className={styles.skillIntroType}>自己管理</span>
     <h2>我的技能</h2>
     <p>集中管理已经启用的官方技能，以及自己保存的工作方法，使用时选择并带入 AI 会话。</p>
    </div>
   </div>
   <div className={styles.skillIntroExample}><strong>例如：</strong><p>把常用的品牌文案要求保存成技能，下次处理商品内容时直接选择引用。</p></div>
   <div className={styles.skillIntroTags}><span>已启用模板</span><span>我的创建</span><span>按需引用</span></div>
   <button type="button" onClick={()=>go("mine")}>查看我的技能</button>
  </article>
  <article className={styles.skillIntroCard} data-skill-entry="team">
   <div className={styles.skillIntroTop}>
    <span className={styles.skillIntroIcon} aria-hidden="true"><Users size={23}/></span>
    <div className={styles.skillIntroHeading}>
     <span className={styles.skillIntroType}>暂未开放</span>
     <h2>团队技能</h2>
     <p>计划用于企业内部共享和管理常用工作方法。目前不支持创建、审批、启用或调用团队技能。</p>
    </div>
   </div>
   <div className={styles.skillIntroExample}><strong>开放后可用于：</strong><p>统一团队商品内容的处理规范，让有权限的成员按同一套方法开展工作。</p></div>
   <div className={styles.skillIntroTags}><span>团队共享</span><span>统一规则</span><span>规划中</span></div>
   <button type="button" onClick={()=>go("team")}>查看团队技能</button>
  </article>
 </section>
 <aside className={styles.skillIntroFlow} aria-label="技能使用说明">
  <div className={styles.skillIntroFlowHeading}><Info size={20} aria-hidden="true"/><strong>技能如何帮助 AI？</strong></div>
  <div className={styles.skillIntroFlowContent}>
   <ol className={styles.skillIntroFlowSteps}>
    <li><Layers3 size={19} aria-hidden="true"/><span>选择或保存技能</span><small>启用官方模板，或保存自己的方法</small></li>
    <li><MessageSquare size={19} aria-hidden="true"/><span>在会话中引用</span><small>只使用你选择的技能</small></li>
    <li><Zap size={19} aria-hidden="true"/><span>AI 按方法辅助处理</span><small>在支持的功能中应用所选规则</small></li>
   </ol>
   <p>技能告诉 AI 如何处理工作；知识库提供参考资料。两者可以按需配合使用，不会因为启用就自动执行。</p>
  </div>
 </aside> </>:category==="team"?<section className={styles.empty} data-skill-management="team"><h2>暂未开放</h2><p>团队技能正在筹备中，暂不支持创建、管理、共享或调用。</p><button className={styles.primary} onClick={()=>go("")}>返回技能库</button><p>功能开放后，可在这里管理团队共享技能。</p></section>:<>

 {category==="mine"?<>
  <section className={styles.mineToolbar} data-skill-management="mine" aria-label="我的技能筛选">
   <form className={styles.mineFilters} onSubmit={e=>{e.preventDefault();setSearch(query.trim())}}>
    <input aria-label="搜索技能名称" value={query} placeholder="搜索技能名称" onChange={e=>setQuery(e.target.value)}/>
    <button type="submit" className={styles.primary}>确定</button>
   </form>
   <div className={styles.mineActions}><button type="button" onClick={()=>{setGroupNotice("");setGroupOpen(true)}}>管理分组</button></div>
  </section>
  <section className={styles.mineTableWrap}><table className={styles.mineTable}>
   <thead><tr><th>技能名称</th><th>来源</th><th>所属分组</th><th>状态</th><th>操作</th></tr></thead>
   <tbody>{mySkillRows.map(item=><tr key={item.key} data-skill-name={item.name}>
    <td><strong>{item.name}</strong><small>{item.description}</small></td><td>{item.source}</td>
    <td><select aria-label={item.name+"所属分组"} value={groupState.assignments[item.key]||""} onChange={e=>commitGroups({...groupState,assignments:{...groupState.assignments,[item.key]:e.target.value}},"所属分组已更新")}><option value="">未分组</option>{groupState.groups.map(g=><option key={g}>{g}</option>)}</select></td>
    <td><span className={styles.enabled}>已启用</span></td>
    <td><div className={styles.mineRowActions}>
     <button type="button" onClick={()=>chat("reference",item.name)}>去会话引用</button>
     {item.source==="我的创建"?<><button type="button" onClick={()=>setDetailSkill(item.name)}>查看完整技能</button><button type="button" onClick={()=>chat("edit",item.name)}>编辑</button></>:<button type="button" onClick={()=>toggle(item.name)}>停用</button>}
    </div></td>
   </tr>)}
   {!mySkillRows.length&&<tr><td colSpan={5} className={styles.mineEmpty}>{search?"没有符合条件的技能":"暂无已启用的技能"}</td></tr>}
   </tbody>
  </table></section>
  {groupOpen&&<div className={styles.groupOverlay} onMouseDown={e=>{if(e.target===e.currentTarget)setGroupOpen(false)}}>
   <section className={styles.groupDialog} role="dialog" aria-modal="true" aria-label="管理技能分组">
    <header><h2>管理技能分组</h2><button type="button" aria-label="关闭技能分组管理" onClick={()=>setGroupOpen(false)}>×</button></header>
    <form className={styles.groupCreate} onSubmit={e=>{e.preventDefault();addGroup()}}><input aria-label="新技能分组名称" maxLength={40} placeholder="输入分组名称" value={groupDraft} onChange={e=>setGroupDraft(e.target.value)}/><button type="submit" className={styles.primary} disabled={!groupDraft.trim()||groupState.groups.includes(groupDraft.trim())}>创建分组</button></form>
    {groupNotice&&<p role="status">{groupNotice}</p>}
    <div className={styles.groupList}>{groupState.groups.length?groupState.groups.map(g=><div key={g} className={styles.groupRow}>{groupEditing===g?<form className={styles.groupCreate} onSubmit={e=>{e.preventDefault();renameGroup(g)}}><input aria-label={"重命名"+g} value={groupRename} maxLength={40} onChange={e=>setGroupRename(e.target.value)}/><button className={styles.primary}>保存</button><button type="button" onClick={()=>setGroupEditing("")}>取消</button></form>:<><span>{g} · {Object.values(groupState.assignments).filter(v=>v===g).length} 项</span><div><button type="button" onClick={()=>{setGroupEditing(g);setGroupRename(g)}}>重命名</button><button type="button" onClick={()=>deleteGroup(g)}>删除分组</button></div></>}</div>):<p>暂无自定义分组</p>}</div>
    <footer><button className={styles.primary} type="button" onClick={()=>setGroupOpen(false)}>完成</button></footer>
   </section>
  </div>}
 </>:<section className={styles.toolbar} data-skill-management={category}>
 <h2 className={styles.sectionTitle}>{category==="official"?"官方技能列表":"已启用技能"}</h2>{category==="official"&&<p className={styles.sectionSub}>按分类浏览技能，查看介绍后启用需要的能力</p>}
 <div className={styles.filterRow}><nav className={styles.filterTabs} aria-label="技能筛选">{(category==="official"?["全部","标题优化","图片制作"]:["全部","官方技能","我的创建"]).map(x=><button key={x} className={filter===x?styles.active:styles.tab} aria-pressed={filter===x} onClick={()=>setFilter(x)}>{x}</button>)}</nav><form className={styles.searchForm} onSubmit={e=>{e.preventDefault();setSearch(query.trim())}}><input className={styles.search} aria-label="技能名称或关键词" placeholder="输入技能名称或关键词…" value={query} onChange={e=>setQuery(e.target.value)}/><button type="button" className={styles.secondary} onClick={()=>{setFilter("全部");setQuery("");setSearch("")}}>重置</button><button className={styles.primary}>搜索</button></form></div>
 <div className={styles.grid}>{cards.map(s=><article key={s[0]} className={styles.feature} data-skill-name={s[0]}><h3>{s[0]}</h3><p>{s[1]}</p><div className={styles.chips}><span>{s[2]}</span></div><div className={styles.cardActions}><span className={enabled.includes(s[0])?styles.enabled:styles.status}>{enabled.includes(s[0])?"已启用":"未启用"}</span><button className={styles.primary} onClick={()=>toggle(s[0])}>{enabled.includes(s[0])?"停用":"启用"}</button><button className={styles.secondary} onClick={()=>category==="official"?setIntro(s[0]):chat("reference",s[0])}>{category==="official"?"介绍":"去会话引用"}</button></div></article>)}
 {mine.map(s=><article key={s.name} className={styles.feature} data-skill-name={s.name}><h3>{s.name}</h3><small>来源：我的技能 · 示例技能可继续编辑</small><p>{s.description}</p><div className={styles.chips}><span>我的技能</span></div><div className={styles.cardActions}><span className={styles.enabled}>已启用</span><button onClick={()=>chat("edit",s.name)}>编辑技能</button><button onClick={()=>chat("reference",s.name)}>去会话引用</button></div></article>)}</div>
 {!cards.length&&!mine.length&&<p className={styles.emptyText}>{search?"未找到匹配技能":filter==="我的创建"?"还没有自建技能":"暂无已启用的技能"}</p>}
 </section>}
 </>}
 {detailPreview&&<div className={styles.groupOverlay} onMouseDown={e=>{if(e.target===e.currentTarget)setDetailSkill(null)}}><section className={styles.groupDialog} role="dialog" aria-modal="true" aria-label="完整技能定义"><header><h2>{detailPreview.name}</h2><button type="button" aria-label="关闭技能详情" onClick={()=>setDetailSkill(null)}>×</button></header><p style={{whiteSpace:"pre-wrap",lineHeight:1.8,maxHeight:"65vh",overflowY:"auto"}}>{detailPreview.description}</p><footer><button className={styles.primary} onClick={()=>setDetailSkill(null)}>关闭</button></footer></section></div>}
 <dialog ref={dialog} className={styles.introDialog} onClose={()=>setIntro(null)} aria-label="官方技能介绍">{selected&&<><header><h2>官方技能介绍</h2><button onClick={()=>setIntro(null)} aria-label="关闭">×</button></header><h3>{selected[0]}</h3><p>{selected[1]}</p><dl><dt>技能来源</dt><dd>硕米官方</dd><dt>适用范围</dt><dd>{selected[2]}</dd><dt>使用提醒</dt><dd>{selected[4]}</dd></dl></>}</dialog>
 </main>
}
