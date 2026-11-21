"use client";
import {useState,useEffect,useRef} from "react";
import {useRouter} from "next/navigation";
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
export function readEnabledPreviewSkills():string[]{try{const raw=JSON.parse(sessionStorage.getItem(enabledKey)||"[]");return Array.isArray(raw)?raw.filter(x=>typeof x==="string"&&officialSkills.some(s=>s[0]===x)):[]}catch{return []}}
export function readPersonalPreviewSkills():PersonalPreviewSkill[]{try{const raw=sessionStorage.getItem(personalKey);if(raw){const a=JSON.parse(raw);if(Array.isArray(a))return a.filter(x=>typeof x?.name==="string"&&typeof x?.description==="string")}}catch{}return [{name:"商品标题规范化（示例）",description:"个人整理的商品标题优化方法示例"}]}
export function savePersonalPreviewSkill(skill:PersonalPreviewSkill){try{sessionStorage.setItem(personalKey,JSON.stringify([...readPersonalPreviewSkills().filter(x=>x.name!==skill.name),skill]))}catch{}}
export function ShowcaseSkillLibrary({pathname}:{pathname:string}){
 const router=useRouter();
 const category=pathname.endsWith("/official")?"official":pathname.endsWith("/mine")?"mine":pathname.endsWith("/team")?"team":"home";
 const [enabled,setEnabled]=useState(readEnabledPreviewSkills);
 const [personal,setPersonal]=useState(readPersonalPreviewSkills);
 const [filter,setFilter]=useState("全部"),[query,setQuery]=useState(""),[search,setSearch]=useState("");
 const [intro,setIntro]=useState<string|null>(null);
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{setFilter("全部");setQuery("");setSearch("");setIntro(null);setEnabled(readEnabledPreviewSkills());setPersonal(readPersonalPreviewSkills())},[pathname]);
 useEffect(()=>{if(intro&&!dialog.current?.open)dialog.current?.showModal();else if(!intro&&dialog.current?.open)dialog.current.close()},[intro]);
 const go=(p:string)=>router.push(root+(p?"/"+p:"")+"?preview=1");
 const chat=(mode:string,name="")=>router.push("/workbench/ai/chat/new?preview=1&skillMode="+mode+"&skill="+encodeURIComponent(name));
 const toggle=(name:string)=>{const next=enabled.includes(name)?enabled.filter(x=>x!==name):[...enabled,name];setEnabled(next);try{sessionStorage.setItem(enabledKey,JSON.stringify(next))}catch{}};
 const title=category==="home"?"让技能成为可重复使用的工作能力":category==="official"?"官方模板":category==="mine"?"我的技能":"团队技能";
 const desc=category==="home"?"浏览官方模板、管理已启用技能，并在会话中按需调用；重复工作不必反复配置。":category==="official"?"按需查找和启用标准技能，启用后会出现在「我的技能」，使用时再关联到会话或任务。":category==="mine"?"管理已启用的官方技能和自己保存的技能，需要时直接带入会话。":"团队技能暂未开放。你可以先使用官方模板或我的技能。";
 const selected=officialSkills.find(s=>s[0]===intro);
 const match=(s:string)=>s.toLowerCase().includes(search.toLowerCase());
 const cards=officialSkills.filter(s=>(category==="official"?(filter==="全部"||s[3]===filter):enabled.includes(s[0])&&filter!=="我的创建")&&match(s.join(" ")));
 const mine=category==="mine"&&filter!=="官方技能"?personal.filter(s=>match(s.name+" "+s.description)):[];
 return <main className={styles.shell} data-skill-showcase="true" data-skill-flow={category}>
 <header className={styles.hero}><div className={styles.breadcrumb}>AI工作台 / <button onClick={()=>go("")}>技能库</button>{category!=="home"?" / "+title:""}</div><h1>{title}</h1><p>{desc}</p></header>
 {category==="home"?<>
 <div className={styles.grid}>{[
 ["官方模板","按业务需求选择标准技能，启用后统一管理并供会话引用。","按需启用","当前引用"+enabled.length+"个","浏览官方模板","official"],
 ["我的技能","统一管理已启用及保存的技能，需要时选择并带入会话。","集中管理","不会自动生成","查看我的技能","mine"],
 ["团队技能","团队技能暂未开放，目前不支持创建、管理或引用。","暂未开放","默认不自动引用","查看团队技能","team"]
 ].map(([t,d,a,b,action,p],i)=><article key={p} className={styles.feature}><h3>{t}</h3><p>{d}</p><div className={styles.chips}><span>{a}</span><span>{b}</span></div><button onClick={()=>go(p)}>{action}</button><small>0{i+1}</small></article>)}</div>
 <section className={styles.toolbar}><h2 className={styles.sectionTitle}>技能库可以帮你做什么</h2><p className={styles.sectionSub}>选择现成方法或沉淀个人经验，按任务需要调用</p><div className={styles.fourGrid}>{[["按来源分类","官方与自建技能分类管理，方便查找与使用。"],["启用后统一管理","启用的技能自动进入「我的技能」列表。"],["快速带入会话","点击技能，可自动带入对应会话。"],["持续沉淀方法","把常用工作方法保存为可复用的技能。"]].map(([t,d])=><article key={t}><h3>{t}</h3><p>{d}</p></article>)}</div></section>
 <section className={styles.toolbar}><h2 className={styles.sectionTitle}>如何开始使用</h2><p className={styles.sectionSub}>从找到技能到加入会话，四步完成</p><div className={styles.fourGrid}>{[["选择技能","按业务需要选择适合的官方技能"],["启用或保存","启用模板，或通过会话保存技能"],["去会话引用","点击具体技能，一键带入会话"],["按需管理","按需停用、重新启用或更新技能"]].map(([t,d],i)=><article key={t}><small>0{i+1}</small><h3>{t}</h3><p>{d}</p></article>)}</div></section>
 <section className={styles.toolbar}><h2 className={styles.sectionTitle}>使用前需要了解</h2><div className={styles.grid}>{[["不会自动执行","启用只代表加入我的技能，不会自动执行。"],["只关联所选技能","去会话时自动携带当前所选技能。"],["团队暂未开放","团队技能暂不支持创建、配置或调用。"]].map(([t,d])=><article key={t}><h3>{t}</h3><p>{d}</p></article>)}</div></section>
 </>:category==="team"?<section className={styles.empty} data-skill-management="team"><h2>暂未开放</h2><p>团队技能正在筹备中，暂不支持创建、管理、共享或调用。</p><button className={styles.primary} onClick={()=>go("")}>返回技能库</button><p>功能开放后，可在这里管理团队共享技能。</p></section>:<>
 {category==="mine"&&<div className={styles.actionBar}><button className={styles.secondary} onClick={()=>go("official")}>前往官方模板</button><button className={styles.primary} onClick={()=>chat("create")}>创建我的技能</button></div>}
 <section className={styles.toolbar} data-skill-management={category}>
 <h2 className={styles.sectionTitle}>{category==="official"?"官方技能列表":"已启用技能"}</h2>{category==="official"&&<p className={styles.sectionSub}>按分类浏览技能，查看介绍后启用需要的能力</p>}
 <div className={styles.filterRow}><nav className={styles.filterTabs} aria-label="技能筛选">{(category==="official"?["全部","标题优化","图片制作"]:["全部","官方技能","我的创建"]).map(x=><button key={x} className={filter===x?styles.active:styles.tab} aria-pressed={filter===x} onClick={()=>setFilter(x)}>{x}</button>)}</nav><form className={styles.searchForm} onSubmit={e=>{e.preventDefault();setSearch(query.trim())}}><input className={styles.search} aria-label="技能名称或关键词" placeholder="输入技能名称或关键词…" value={query} onChange={e=>setQuery(e.target.value)}/><button type="button" className={styles.secondary} onClick={()=>{setFilter("全部");setQuery("");setSearch("")}}>重置</button><button className={styles.primary}>搜索</button></form></div>
 <div className={styles.grid}>{cards.map(s=><article key={s[0]} className={styles.feature} data-skill-name={s[0]}><h3>{s[0]}</h3>{category==="mine"&&<small>来源：官方模板 · {s[4]}</small>}<p>{s[1]}</p><div className={styles.chips}><span>{s[2]}</span></div><div className={styles.cardActions}><span className={enabled.includes(s[0])?styles.enabled:styles.status}>{enabled.includes(s[0])?"已启用":"未启用"}</span><button className={styles.primary} onClick={()=>toggle(s[0])}>{enabled.includes(s[0])?"停用":"启用"}</button><button className={styles.secondary} onClick={()=>category==="official"?setIntro(s[0]):chat("reference",s[0])}>{category==="official"?"介绍":"去会话引用"}</button></div></article>)}
 {mine.map(s=><article key={s.name} className={styles.feature} data-skill-name={s.name}><h3>{s.name}</h3><small>来源：我的技能 · 示例技能可继续编辑</small><p>{s.description}</p><div className={styles.chips}><span>我的技能</span></div><div className={styles.cardActions}><span className={styles.enabled}>已启用</span><button onClick={()=>chat("edit",s.name)}>编辑技能</button><button onClick={()=>chat("reference",s.name)}>去会话引用</button></div></article>)}</div>
 {!cards.length&&!mine.length&&<p className={styles.emptyText}>{search?"未找到匹配技能":filter==="我的创建"?"还没有自建技能":"暂无已启用的技能"}</p>}
 </section></>}
 <dialog ref={dialog} className={styles.introDialog} onClose={()=>setIntro(null)} aria-label="官方技能介绍">{selected&&<><header><h2>官方技能介绍</h2><button onClick={()=>setIntro(null)} aria-label="关闭">×</button></header><h3>{selected[0]}</h3><p>{selected[1]}</p><dl><dt>技能来源</dt><dd>硕米官方</dd><dt>适用范围</dt><dd>{selected[2]}</dd><dt>使用提醒</dt><dd>{selected[4]}</dd></dl></>}</dialog>
 </main>
}
