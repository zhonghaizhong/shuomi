"use client";
import {useState} from "react";
import {RefreshCw,Plus,Info,Search,FileText,ShieldCheck} from "lucide-react";
import {useRouter,useSearchParams} from "next/navigation";
import styles from "./showcase-skill-library.module.css";

type Category="official"|"mine"|"team";
type DraftSkill={name:string;description:string;body:string;version:number};
const root="/workbench/agents/skills";
const tabs:[Category,string][]=[["official","官方模板"],["mine","我的技能"],["team","团队技能"]];
const purpose="保存可复用的方法；执行使用现有智能体的权限、预算与审核。";
const sample={name:"local-trial-title-normalization-20261015",description:"本地试用 2026-10-15：核对个人技能格式、版本保存和刷新读回；仅使用已有商品事实，本轮不调用模型。",version:1};
export function ShowcaseSkillLibrary({pathname}:{pathname:string}){
 const router=useRouter();
 const searchParams=useSearchParams();
 const category:Category=pathname.endsWith("/mine")?"mine":pathname.endsWith("/team")?"team":"official";
 const configurable=searchParams.get("permission")!=="readonly";
 const [admission,setAdmission]=useState(true);
 const [notice,setNotice]=useState("");
 const [selected,setSelected]=useState<"sample"|"draft"|null>(null);
 const [panel,setPanel]=useState<"none"|"edit"|"requests"|"version">("none");
 const [name,setName]=useState("");
 const [description,setDescription]=useState("");
 const [body,setBody]=useState("");
 const [filter,setFilter]=useState("");
 const [draft,setDraft]=useState<DraftSkill|null>(null);
 const [consent,setConsent]=useState(false);
 const [shareState,setShareState]=useState<"none"|"submitted"|"withdrawn">("none");
 const [validation,setValidation]=useState("");
 const label=tabs.find(([id])=>id===category)![1];
 const resetPanels=()=>{setSelected(null);setPanel("none");setValidation("");setNotice("")};
 const go=(id:Category)=>{resetPanels();router.push(`${root}/${id}?preview=1`)};
 const refresh=()=>{setNotice("已刷新当前演示视图。公开展示站不连接技能服务；真实列表需要登录正式控制台。");setFilter("")};
 const openEditor=(version=false)=>{setPanel(version?"version":"edit");setSelected(null);setValidation("");if(version&&draft){setName(draft.name);setDescription(draft.description);setBody(draft.body)}else{setName("");setDescription("");setBody("")}};
 const check=()=>{const msg=!name.trim()?"请输入技能名称。":!description.trim()?"请输入技能简介。":!body.trim()?"请输入技能方法内容。":"";setValidation(msg||"格式预检查通过（本地演示），正式保存还需服务端验证。");return !msg};
 const save=()=>{if(!check())return;setDraft({name:name.trim(),description:description.trim(),body:body.trim(),version:panel==="version"&&draft?draft.version+1:1});setPanel("none");setNotice("已在本页面生成演示草稿；没有写入服务器，刷新后不会保留。")};
 const showSample=(!filter||sample.name.toLowerCase().includes(filter.toLowerCase())||sample.description.toLowerCase().includes(filter.toLowerCase()));
 const showDraft=draft&&(!filter||draft.name.toLowerCase().includes(filter.toLowerCase())||draft.description.toLowerCase().includes(filter.toLowerCase()));
 return <main className={styles.shell} data-skill-showcase="true">
  <header className={styles.hero}><div><span className={styles.eyebrow}>AI工作台 / 技能库 / {label}</span><h1>技能库</h1><p>{category==="team"?"管理可复用的业务方法 · 当前企业：演示企业（非真实企业数据）":"查看官方模板，管理个人和团队技能，在业务操作中选择使用。"}</p></div></header>
  <nav className={styles.tabs} aria-label="技能库分类">{tabs.map(([id,title])=><button type="button" key={id} className={`${styles.tab} ${category===id?styles.active:""}`} aria-current={category===id?"page":undefined} onClick={()=>go(id)}>{title}</button>)}</nav>
  <section className={styles.toolbar} data-skill-management={category}>
   <div className={styles.managementTop}><h2 className={styles.sectionTitle}>{label}</h2><p className={styles.sectionSub}>{purpose}</p></div>
   <div className={styles.managementActions}>
    <button type="button" className={styles.secondary} onClick={refresh}><RefreshCw size={15} aria-hidden="true"/>刷新列表</button>
    {category!=="official"&&<div className={styles.actionBar}>
     <button type="button" className={styles.primary} onClick={()=>openEditor()}><Plus size={15} aria-hidden="true"/>新建技能</button>
     <button type="button" className={styles.secondary} disabled={category==="team"&&!configurable} onClick={()=>{setPanel("requests");setSelected(null);setNotice("")}}>{category==="mine"?"我的共享申请":"待审批的个人提交"}</button>
    </div>}
   </div>
   {category==="team"&&<div className={styles.policy}><div><strong>个人技能准入：{configurable&&admission?"允许本人启用的版本":"未准入"} · 策略版本 {configurable&&admission?"1":"0"}</strong><p>{configurable?"当前为 Figma 可配置权限的演示状态，不写入企业策略。":"当前为 Figma 无配置权限的演示状态，审批与设置不可执行。"}</p></div>{configurable&&<button type="button" className={styles.secondary} onClick={()=>{setAdmission(v=>!v);setNotice("已在当前页面切换演示状态，未更改企业的真实准入策略。")}}>{admission?"关闭个人技能准入":"开启个人技能准入"}</button>}</div>}
   {category==="official"&&<p className={styles.emptyText}>当前范围没有可读取的技能。官方模板由获授权维护者导入、发布并启用后提供。</p>}
   {category==="team"&&<p className={styles.emptyText}>当前范围没有可读取的技能。可以自建或复制允许复制的官方模板。</p>}
   {category==="mine"&&<>
    <div className={styles.searchFilters}><label className={styles.searchLabel}><Search size={16} aria-hidden="true"/><span className={styles.visuallyHidden}>搜索技能名称</span><input aria-label="搜索技能名称" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="搜索技能名称"/></label><button type="button" className={styles.secondary} onClick={()=>setFilter("")}>重置</button></div>
    <div className={styles.skillList} aria-label="我的技能列表">
     {showSample&&<article className={styles.skillRecord}><button type="button" className={styles.skillRecordButton} onClick={()=>{setSelected("sample");setPanel("none")}}><span><strong>{sample.name}</strong><small>{sample.description}</small></span><span className={styles.version}>v1 · 已启用 · 私有</span></button></article>}
     {showDraft&&<article className={styles.skillRecord}><button type="button" className={styles.skillRecordButton} onClick={()=>{setSelected("draft");setPanel("none")}}><span><strong>{draft.name}</strong><small>{draft.description}</small></span><span className={styles.version}>v{draft.version} · 演示草稿 · 私有</span></button></article>}
     {!showSample&&!showDraft&&<p className={styles.emptyText}>没有找到符合条件的技能。请调整检索条件。</p>}
    </div>
   </>}
   {selected&&category==="mine"&&<section className={styles.detail} role="region" aria-label="技能详情">
    <div className={styles.panelHeader}><h3>技能详情 · {selected==="sample"?sample.name:draft?.name}</h3><button className={styles.secondary} onClick={()=>setSelected(null)}>关闭</button></div>
    <p>版本：v{selected==="sample"?1:draft?.version} · {selected==="sample"?"Figma 示例记录":"当前页面演示草稿"} · 私有</p>
    <p>{selected==="sample"?sample.description:draft?.description}</p>
    {selected==="sample"?<p>这是原型中的参考技能，公开展示站不提供真实修改权限。</p>:<>
     <details><summary>技能内容</summary><pre className={styles.bodyPreview}>{draft?.body}</pre></details>
     <div className={styles.actionBar}><button className={styles.primary} onClick={()=>openEditor(true)}>保存为新版本</button><button className={styles.secondary} onClick={()=>setPanel("requests")}>管理共享申请</button><button className={styles.secondary} onClick={()=>{setNotice("此演示草稿未获服务端授权，不能作为真实版本导出。")}}>导出准确版本</button></div>
    </>}
   </section>}
   {panel==="edit"||panel==="version"?<form className={styles.editor} onSubmit={e=>{e.preventDefault();save()}} aria-label={panel==="version"?"保存为新版本":"新建技能"}>
    <div className={styles.panelHeader}><h3>{panel==="version"?"保存为新版本":"新建技能"}</h3><button type="button" className={styles.secondary} onClick={()=>setPanel("none")}>取消编辑</button></div>
    <p>这里是可交互的前端演示。提交仅更新当前浏览器中的预览状态，不会写入账户或企业。</p>
    <label>技能名称<input value={name} onChange={e=>setName(e.target.value)} maxLength={64} placeholder="输入技能名称" required/></label>
    <label>技能简介<textarea value={description} onChange={e=>setDescription(e.target.value)} rows={2} maxLength={2048} placeholder="说明这个技能解决什么问题" required/></label>
    <label>方法内容<textarea value={body} onChange={e=>setBody(e.target.value)} rows={6} placeholder="输入可复用的方法与规则" required/></label>
    {validation&&<p role="status">{validation}</p>}
    <div className={styles.actionBar}><button type="button" className={styles.secondary} onClick={check}>检查格式</button><button type="submit" className={styles.primary}>保存演示草稿</button></div>
   </form>:null}
   {panel==="requests"&&<section className={styles.detail} role="region" aria-label={category==="mine"?"我的共享申请":"待审批的个人提交"}>
    <div className={styles.panelHeader}><h3>{category==="mine"?"我的共享申请":"待审批的个人提交"}</h3><button type="button" className={styles.secondary} onClick={()=>setPanel("none")}>关闭</button></div>
    {category==="mine"?<>
     <p>仅可提交本人授权的准确版本。经企业审批后产生独立副本；展示站不发送真实申请。</p>
     {draft?<><p>可选择版本：{draft.name} · v{draft.version}（演示草稿）</p>
      <label className={styles.consent}><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>我明确同意向当前企业提交此准确版本供审核，并同意获批后生成独立副本。</label>
      <div className={styles.actionBar}><button type="button" className={styles.primary} disabled={!consent||shareState==="submitted"} onClick={()=>{setShareState("submitted");setNotice("已创建本地演示申请，没有向企业或服务器发送数据。")}}>提交演示共享申请</button>{shareState==="submitted"&&<button type="button" className={styles.secondary} onClick={()=>{setShareState("withdrawn");setConsent(false)}}>撤回演示申请</button>}</div>
      <p>状态：{shareState==="submitted"?"演示申请已提交":shareState==="withdrawn"?"演示申请已撤回":"尚未提交"}</p></>:<p>当前只有 Figma 参考记录。请先新建演示技能，或登录正式控制台提交自己的实际版本。</p>}
    </>:<><p>当前没有可读取的待审批申请。真实审核必须读取用户已授权提交的准确版本，并由有权限的成员决定批准或拒绝。</p><div className={styles.permissionNotice}><ShieldCheck size={18} aria-hidden="true"/>审批通过后生成企业独立副本，不应直接修改个人技能。</div></>}
   </section>}
  </section>
  {notice&&<aside className={styles.note} role="status"><Info size={18} aria-hidden="true"/><span>{notice}</span><button type="button" className={styles.secondary} onClick={()=>setNotice("")}>关闭提示</button></aside>}
 </main>;
}