"use client";
import Link from "next/link";
import {usePathname,useSearchParams} from "next/navigation";
import styles from "./section-page-tabs.module.css";
type Tab={label:string;href:string};
const groups:Record<string,{title:string;description:string;tabs:Tab[]}>={
 listing:{title:"刊登管理",description:"从商品数据开始，选择店铺并配置规则，资料缺失先补全；审核完成再查看上传结果。",tabs:[{label:"刊登总览",href:"/workbench/listing"},{label:"待上传",href:"/workbench/listing/waiting"},{label:"待补全",href:"/workbench/listing/missing"},{label:"待审核",href:"/workbench/listing/review"},{label:"已上传",href:"/workbench/listing/uploaded"}]},
 chat:{title:"硕米Chat",description:"新建会话提出需求；最近会话继续工作，收藏会话保存重要内容。",tabs:[{label:"会话首页",href:"/workbench/ai/chat"},{label:"＋ 新建会话",href:"/workbench/ai/chat/new"},{label:"最近会话",href:"/workbench/ai/chat/recent"},{label:"收藏会话",href:"/workbench/ai/chat/saved"}]},
 tasks:{title:"任务中心",description:"查看任务进度；待确认事项及时处理，异常任务查看原因后再继续。",tabs:[{label:"任务总览",href:"/workbench/ai/tasks"},{label:"进行中",href:"/workbench/ai/tasks/running"},{label:"待确认",href:"/workbench/ai/tasks/pending"},{label:"已完成",href:"/workbench/ai/tasks/completed"},{label:"异常任务",href:"/workbench/ai/tasks/errors"},{label:"定时任务",href:"/workbench/ai/tasks/scheduled"}]},
 projects:{title:"项目中心",description:"总览查看项目进度；在我的项目管理全部项目，按需查看进行中、最近访问、模板与归档。",tabs:[{label:"项目总览",href:"/workbench/ai/projects"},{label:"我的项目",href:"/workbench/ai/projects/mine"},{label:"进行中项目",href:"/workbench/ai/projects/active"},{label:"最近访问",href:"/workbench/ai/projects/recent"},{label:"项目模板",href:"/workbench/ai/projects/templates"},{label:"已归档",href:"/workbench/ai/projects/archived"}]},
 knowledge:{title:"知识库",description:"官方规则与自有资料统一管理；使用 AI 时按需选择引用。",tabs:[{label:"知识库介绍",href:"/workbench/ai/knowledge"},{label:"官方知识库",href:"/workbench/ai/knowledge/official"},{label:"我的知识库",href:"/workbench/ai/knowledge/mine"}]},
 skills:{title:"技能库",description:"先了解技能用途，再选择官方模板、个人或团队技能；技能不会自动执行。",tabs:[{label:"技能库介绍",href:"/workbench/agents/skills"},{label:"官方模板",href:"/workbench/agents/skills/official"},{label:"我的技能",href:"/workbench/agents/skills/mine"},{label:"团队技能",href:"/workbench/agents/skills/team"}]},
 reports:{title:"我的报告",description:"查阅业务成果、收藏常用报告；详情与下载继续使用原页面。",tabs:[{label:"报告概览",href:"/workbench/ai/reports"},{label:"最近报告",href:"/workbench/ai/reports/recent"},{label:"收藏报告",href:"/workbench/ai/reports/favorites"},{label:"全部报告",href:"/workbench/ai/reports/all"}]},
 catalogs:{title:"货盘集成",description:"先浏览可用货盘；需要新的货盘时再发起对接申请。",tabs:[{label:"货盘总览",href:"/workbench/supply/catalogs"},{label:"货盘选品",href:"/workbench/supply/catalogs/selection"},{label:"申请对接",href:"/workbench/supply/catalogs/apply"}]}
};
export type SectionTabsKey=keyof typeof groups;
export function sectionForPath(path:string):SectionTabsKey|undefined {return (Object.keys(groups) as SectionTabsKey[]).find(key=>groups[key].tabs.some(tab=>path===tab.href));}
export function SectionPageTabs({section,showHelp=false,activeHref,onSelect}:{section:SectionTabsKey;showHelp?:boolean;activeHref?:string;onSelect?:(href:string)=>void}){
 const pathname=usePathname(),query=useSearchParams();
 const group=groups[section];
 const preview=query?.get("preview")==="1";
 return <section className={styles.shell} data-section={section} aria-label={group.title+"页面导航"}>
  {showHelp?<p className={styles.help}>{group.description}</p>:null}
  <nav className={styles.tabs} aria-label={group.title+"分类"}>
   {group.tabs.map(tab=>onSelect
    ?<button key={tab.href} data-section-tab type="button" onClick={()=>onSelect(tab.href)} aria-current={(activeHref??pathname)===tab.href?"page":undefined}>{tab.label}</button>
    :<Link key={tab.href} href={tab.href+(preview?"?preview=1":"")} prefetch={false} aria-current={pathname===tab.href?"page":undefined}>{tab.label}</Link>)}
  </nav>
 </section>;
}
