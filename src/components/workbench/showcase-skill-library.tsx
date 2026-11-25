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
export type PersonalPreviewSkill={name:string;description:string};
const scopedKey=(base:string,organizationId="SM-ENT-000001",memberId="admin")=>
 organizationId==="SM-ENT-000001"&&memberId==="admin"?base:base+":"+encodeURIComponent(organizationId)+":"+encodeURIComponent(memberId);
export function readEnabledPreviewSkills(organizationId="SM-ENT-000001",memberId="admin"):string[]{
 try{const raw=JSON.parse(sessionStorage.getItem(scopedKey(enabledKey,organizationId,memberId))||"[]");
  return Array.isArray(raw)?raw.filter(x=>typeof x==="string"&&officialSkills.some(s=>s[0]===x)):[];
 }catch{return []}
}
export function readPersonalPreviewSkills(organizationId="SM-ENT-000001",memberId="admin"):PersonalPreviewSkill[]{
 try{const raw=sessionStorage.getItem(scopedKey(personalKey,organizationId,memberId));
  if(raw){const a=JSON.parse(raw);if(Array.isArray(a))return a.filter(x=>typeof x?.name==="string"&&typeof x?.description==="string")}
 }catch{}
 return [];
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
 const [intro,setIntro]=useState<string|null>(null);
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
 const mySkillRows=[...cards.map(s=>({key:"official:"+s[0],name:s[0],description:s[1],source:"官方技能",enabled:true})),...mine.map(s=>({key:"personal:"+s.name,name:s.name,description:s.description,source:"我的创建",enabled:true}))].filter(s=>groupFilter==="全部分组"||(groupFilter==="未分组"?!groupState.assignments[s.key]:groupState.assignments[s.key]===groupFilter));
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
   <div className={styles.mineFilters}>
    <nav className={styles.mineTypeTabs} aria-label="技能来源筛选">{["全部","官方技能","我的创建"].map(x=><button type="button" key={x} aria-pressed={filter===x} className={filter===x?styles.active:styles.tab} onClick={()=>setFilter(x)}>{x}</button>)}</nav>
    <label>分组 <select aria-label="按技能分组筛选" value={groupFilter} onChange={e=>setGroupFilter(e.target.value)}><option>全部分组</option><option>未分组</option>{groupState.groups.map(g=><option key={g}>{g}</option>)}</select></label>
    <input aria-label="搜索技能名称" value={query} placeholder="搜索技能名称" onChange={e=>{setQuery(e.target.value);setSearch(e.target.value.trim())}}/>
   </div>
   <div className={styles.mineActions}><button type="button" onClick={()=>{setGroupNotice("");setGroupOpen(true)}}>管理分组</button><span>共 {mySkillRows.length} 项</span></div>
  </section>
  <section className={styles.mineTableWrap}><table className={styles.mineTable}>
   <thead><tr><th>技能名称</th><th>来源</th><th>所属分组</th><th>状态</th><th>操作</th></tr></thead>
   <tbody>{mySkillRows.map(item=><tr key={item.key} data-skill-name={item.name}>
    <td><strong>{item.name}</strong><small>{item.description}</small></td><td>{item.source}</td>
    <td><select aria-label={item.name+"所属分组"} value={groupState.assignments[item.key]||""} onChange={e=>commitGroups({...groupState,assignments:{...groupState.assignments,[item.key]:e.target.value}},"所属分组已更新")}><option value="">未分组</option>{groupState.groups.map(g=><option key={g}>{g}</option>)}</select></td>
    <td><span className={styles.enabled}>已启用</span></td>
    <td><div className={styles.mineRowActions}>
     <button type="button" onClick={()=>chat("reference",item.name)}>去会话引用</button>
     {item.source==="我的创建"?<button type="button" onClick={()=>chat("edit",item.name)}>编辑</button>:<button type="button" onClick={()=>toggle(item.name)}>停用</button>}
    </div></td>
   </tr>)}
   {!mySkillRows.length&&<tr><td colSpan={5} className={styles.mineEmpty}>{search||filter!=="全部"||groupFilter!=="全部分组"?"没有符合条件的技能":"暂无已启用的技能"}</td></tr>}
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
 <dialog ref={dialog} className={styles.introDialog} onClose={()=>setIntro(null)} aria-label="官方技能介绍">{selected&&<><header><h2>官方技能介绍</h2><button onClick={()=>setIntro(null)} aria-label="关闭">×</button></header><h3>{selected[0]}</h3><p>{selected[1]}</p><dl><dt>技能来源</dt><dd>硕米官方</dd><dt>适用范围</dt><dd>{selected[2]}</dd><dt>使用提醒</dt><dd>{selected[4]}</dd></dl></>}</dialog>
 </main>
}
