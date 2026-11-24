"use client";
import {useRouter} from "next/navigation";
import css from "./showcase-listing-stage-header.module.css";

export type ShowcaseListingStageKey="waiting"|"missing"|"review"|"uploaded";
const stageEntries=[
 {key:"waiting",label:"待上传",description:"选择商品批次和版本，配置目标店铺与规则，提交检测后进入后续处理。"},
 {key:"missing",label:"待补全",description:"补齐并保存资料后，核对原任务与准确版本，明确继续上传；未绑定草稿先选择目标。"},
 {key:"review",label:"待审核",description:"核对智能体优化结果与平台规则，确认后继续原上传任务。"},
 {key:"uploaded",label:"已上传",description:"查看平台确认接收的商品、所选批次与优化版本，以及独立的审核和上架状态。"},
] as const;
export function ShowcaseListingStageHeader({stage}:{stage:ShowcaseListingStageKey}){
 const router=useRouter();
 const current=stageEntries.find(item=>item.key===stage)!;
 return <>
  <header className={css.heading}>
   <small>店铺中心 / 刊登管理 / {current.label}</small>
   <h1>{current.label}</h1>
   <p>{current.description}</p>
  </header>
  <nav className={css.tabs} aria-label="刊登管理阶段">
   {stageEntries.map(item=><button key={item.key} type="button" aria-current={item.key===stage?"page":undefined} onClick={()=>{if(item.key!==stage)router.push("/workbench/listing/"+item.key+"?preview=1")}}>{item.label}</button>)}
  </nav>
 </>;
}
