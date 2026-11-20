"use client";

import Link from "next/link";
import {useQuery} from "@tanstack/react-query";
import {useWorkbenchContext} from "@/components/providers/workbench-context-provider";
import {ConsolePage} from "@/components/workbench/console/console-page";
import {Card} from "@/components/ui/card";
import {readApplicationOverview} from "@/lib/api/supply-market";
import styles from "./supply-overview.module.css";

const steps=[
 {title:"发现货源",detail:"浏览硕米自营、硕米优选及第三方货盘"},
 {title:"筛选商品",detail:"查看商品信息、供货条件与货盘特点"},
 {title:"货盘对接",detail:"按需申请接入尚未开放的第三方货盘"},
 {title:"优选合作",detail:"符合条件的商品可提交优选申请"},
];

export function SupplyOverview({marketAvailable,preparationAvailable}:{marketAvailable:boolean;preparationAvailable:boolean}){
 const context=useWorkbenchContext();
 const scope=context.user&&context.effectiveOrganization?{userId:context.user.id,organizationId:context.effectiveOrganization.id}:null;
 const ready=marketAvailable&&!!scope&&!context.isLoading&&!context.isSwitching&&!context.selectionRequired&&!context.error&&!context.blockingError;
 const summary=useQuery({queryKey:["supply-market",scope?.userId,scope?.organizationId,"application-overview"],queryFn:({signal})=>readApplicationOverview(scope!,signal),enabled:ready,retry:false});
 const facts=ready&&!summary.isError?summary.data:undefined;
 const features=[
  {title:"硕米自营",tone:"teal",label:"平台自营货源",description:"平台自有工厂与自营商品资源，开放后可浏览、筛选和了解供货条件。",href:"/workbench/supply/official",available:marketAvailable},
  {title:"硕米优选",tone:"blue",label:"平台优选货源",description:"平台审核的优质供应商与商品资源，开放后可查看商品及供货能力。",href:"/workbench/supply/selected",available:marketAvailable},
  {title:"货盘集成",tone:"green",label:"官方接入货盘选品",description:"浏览硕米已接入的第三方货盘，查看类目、成本、库存和供货服务；也可申请新的货盘对接。",href:"/workbench/supply/catalogs",available:marketAvailable},
  {title:"优选申请",tone:"pink",label:"可提交申请",description:"符合条件的商品可申请进入硕米优选，集中查看申请进度、审核状态与结果。",href:"/workbench/supply/applications",available:marketAvailable},
 ];
 return <ConsolePage className={styles.overview} title="发现优质货源，连接多元供货渠道" description="浏览硕米自营、硕米优选及第三方货盘，按需求选品、申请货盘对接或提交优选合作申请。" breadcrumbs={[{label:"供应市场"}]}>
  <Card className={styles.flow}><ol aria-label="从货源到店铺">{steps.map(step=><li key={step.title}><h2>{step.title}</h2><p>{step.detail}</p></li>)}</ol></Card>
  <div className={styles.features}>{features.map((feature,index)=><Card key={feature.title} className={`${styles.feature} ${styles[feature.tone]}`}>
   <p className={styles.kicker}><span>{String(index+1).padStart(2,"0")}</span>{feature.available?feature.label:"暂未开放"}</p>
   <h2>{feature.title}</h2><p className={styles.copy}>{feature.description}</p>
   {feature.available?<Link href={feature.href} prefetch={false} aria-label={`进入功能：${feature.title}`}>进入功能 <span aria-hidden="true">→</span></Link>:<span className={styles.unavailable}>暂未开放</span>}
  </Card>)}</div>
  <Card className={styles.usage}>
   <header><h2>我的使用情况</h2><p>只展示真实业务数据，数据未接入时统一显示 —</p></header>
   <div className={styles.summaries}>
    <Card className={`${styles.summary} ${styles.green}`}><h3>货盘选品</h3><Metrics items={[{label:"官方接入货盘"},{label:"可选商品"}]}/></Card>
    <Card className={`${styles.summary} ${styles.pink}`}><h3>优选申请</h3><Metrics items={[{label:"待提交"},{label:"审核中",value:facts?.reviewing},{label:"已通过",value:facts?.approved}]}/></Card>
   </div>
  </Card>
 </ConsolePage>;
}

function Metrics({items}:{items:{label:string;value?:number}[]}){
 return <dl className={styles.metrics}>{items.map(item=><div key={item.label}><dt>{item.label}</dt><dd aria-label={item.label+"数量"}>{item.value??"—"}</dd></div>)}</dl>;
}
