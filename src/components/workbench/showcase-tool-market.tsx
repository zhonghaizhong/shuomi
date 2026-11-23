"use client";

import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import styles from "./showcase-tool-market.module.css";

type Tool = { name: string; description: string; category: string; tags: [string,string]; status: "ready" | "development"; color: string };
const tools: Tool[] = [
  {name:"商品采集插件",description:"采集支持平台的标题、图片和规格，整理数据用于后续商品适配。",category:"采集",tags:["商品采集","我的数据"],status:"ready",color:"#62a9ff"},
  {name:"POD素材管理工具",description:"管理贴图图案与审核流程，按订单检索素材并辅助打印。",category:"图片",tags:["自有素材","官方灵感市场"],status:"ready",color:"#4fd1bd"},
  {name:"自有商品刊登工具",description:"导入并管理自有商品资料，检查必填信息后进行适配。",category:"其他",tags:["自有商品","快速刊登"],status:"ready",color:"#ad8aff"},
  {name:"指纹浏览器",description:"规划隔离店铺登录环境，方便区分不同账号的使用。",category:"环境",tags:["环境隔离","多账号"],status:"development",color:"#4dc7dc"},
  {name:"图片处理工具",description:"规划提供批量裁剪与去背景，减少重复处理图片的工作。",category:"图片",tags:["图片处理","批量优化"],status:"development",color:"#f4bf64"},
  {name:"数据导入工具",description:"规划以表格批量导入资料，按字段规则检查映射内容。",category:"数据",tags:["表格导入","字段映射"],status:"development",color:"#62a9ff"},
  {name:"自动化工具",description:"规划按规则执行重复步骤，方便统一管理流程与任务。",category:"流程",tags:["流程自动化","定时执行"],status:"development",color:"#4fd1bd"},
  {name:"批量刊登工具",description:"规划批量整理并发布商品，辅助选择目标店铺进行刊登。",category:"其他",tags:["批量刊登","多店铺"],status:"development",color:"#ad8aff"},
  {name:"订单处理工具",description:"规划集中查看订单状态，辅助识别待处理与异常订单。",category:"其他",tags:["订单汇总","异常处理"],status:"development",color:"#f38eb3"},
  {name:"库存同步工具",description:"规划汇总多渠道库存变化，辅助识别数量差异与异常。",category:"数据",tags:["库存同步","异常提醒"],status:"development",color:"#4dc7dc"},
];
type Dialog = {type:"intro"|"download"|"disable"|"launch";name:string};
const activationStorage="shuomi:showcase-tools-demo";
function restoreEnabled():string[] {
  if(typeof window==="undefined")return ["POD素材管理工具"];
  try { const raw=sessionStorage.getItem(activationStorage);return raw?JSON.parse(raw) as string[]:["POD素材管理工具"]; }
  catch {return ["POD素材管理工具"];}
}
function ToolModal({info,onClose,onConfirm}:{info:Dialog;onClose:()=>void;onConfirm:()=>void}) {
  const ref=useRef<HTMLDialogElement>(null), id=useId();
  const tool=tools.find(x=>x.name===info.name);
  useEffect(()=>{const el=ref.current,prev=document.activeElement;el?.showModal();return ()=>{el?.close();if(prev instanceof HTMLElement&&prev.isConnected)prev.focus();};},[]);
  const title=info.type==="download"?"下载商品采集插件":info.type==="disable"?"确认停用工具":info.type==="launch"?"工具使用入口":info.name;
  return <dialog ref={ref} className={styles.dialog} aria-labelledby={id} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <header><h2 id={id}>{title}</h2><button type="button" onClick={onClose} aria-label="关闭弹窗">×</button></header>
    {info.type==="download"?<>
      <p>下载安装到自己的电脑，在商品页面直接使用。</p>
      <dl className={styles.downloadDetails}><div><dt>使用方式</dt><dd>电脑端安装插件</dd></div><div><dt>费用</dt><dd>免费 · 不消耗数据额度</dd></div><div><dt>采集方式</dt><dd>打开目标商品页后点击插件采集</dd></div><div><dt>结果去向</dt><dd>数据服务 — 我的数据</dd></div></dl>
      <p>下载后按安装提示完成浏览器插件安装。</p><p className={styles.demoNote}>当前公开展示未提供可验证的安装包，不能模拟下载成功。实际下载需在正式工具入口获取。</p>
    </>: info.type==="disable"?<><p>停用后，该工具将从当前演示的「我的工具」列表中移除，可在官方工具中重新启用。</p><p className={styles.demoNote}>只改变当前浏览器的演示状态，不影响正式账户。</p></>
    :info.type==="launch"?<><p>你选择了「{info.name}」。正式使用需在工作台完成授权、配置和相关业务操作。</p><p className={styles.demoNote}>公开原型不提供真实工具运行、附件处理或接口调用，不会假装执行成功。</p></>
    :<><p>{tool?.description}</p><div className={styles.tags}>{tool?.tags.map(tag=><span key={tag}>{tag}</span>)}</div><p>适用分类：{tool?.category} · 当前状态：{tool?.status==="development"?"开发中":"可按需启用"}</p><p className={styles.demoNote}>实际功能、授权和费用以正式工作台为准。</p></>}
    <footer><button type="button" onClick={onClose}>取消</button>{info.type==="disable"?<button type="button" className={styles.primary} onClick={onConfirm}>确认停用</button>:info.type==="download"?<button type="button" disabled title="当前演示未提供实际安装文件">暂无可下载文件</button>:<button type="button" className={styles.primary} onClick={onClose}>确定</button>}</footer>
  </dialog>;
}

export function ShowcaseToolMarket({pathname,navigate}:{pathname:string;navigate:(route:string)=>void}) {
  const [category,setCategory]=useState("全部"),[search,setSearch]=useState(""),[applied,setApplied]=useState(""),[dialog,setDialog]=useState<Dialog|null>(null);
  const [enabled,setEnabled]=useState<string[]>(restoreEnabled);
  const [notice,setNotice]=useState("");
  const goto=(x:string)=>navigate("/workbench/tools"+x+"?preview=1");
  const persist=(names:string[])=>{setEnabled(names);try{sessionStorage.setItem(activationStorage,JSON.stringify(names));}catch{}};
  const enable=(name:string)=>{persist([...enabled.filter(x=>x!==name),name]);setNotice(name+"：仅在此浏览器的演示列表中启用。");};
  const visible=useMemo(()=>tools.filter(x=>(category==="全部"||x.category===category)&&[x.name,x.description,...x.tags].join(" ").toLowerCase().includes(applied.trim().toLowerCase())),[category,applied]);
  const myTools=tools.filter(x=>enabled.includes(x.name));
  const header=(title:string,subtitle:string,right?:ReactNode)=><header className={styles.header}><div><small>工具市场 / {title}</small><h1>{title}</h1><p>{subtitle}</p></div><div className={styles.headerActions}>{right}</div></header>;
  return <div className={styles.page} data-tool-market-page={pathname}>
    {notice?<div className={styles.notice} role="status">{notice}<button type="button" aria-label="关闭通知" onClick={()=>setNotice("")}>×</button></div>:null}
    {pathname.endsWith("/official")?<>{header("官方工具","浏览官方维护的电商工具，启用后可用于智能体与业务流程。",<button className={styles.primary} onClick={()=>goto("/mine")}>我的工具</button>)}
      <section className={styles.sectionHeading}><h2>官方工具列表</h2><p>按分类查找所需工具，查看详情后按需启用。</p></section>
      <div className={styles.toolbar}><div className={styles.categories}>{["全部","采集","图片","环境","数据","流程","其他"].map(x=><button type="button" key={x} aria-pressed={category===x} onClick={()=>setCategory(x)}>{x}</button>)}</div><div className={styles.searchTools}><input aria-label="搜索官方工具" placeholder="输入工具名称或关键词…" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")setApplied(search)}}/><button type="button" onClick={()=>{setSearch("");setApplied("");setCategory("全部");}}>重置</button><button type="button" className={styles.primary} onClick={()=>setApplied(search)}>确认</button></div></div>
      {visible.length?<div className={styles.toolGrid}>{visible.map(x=><article key={x.name} style={{"--accent":x.color} as React.CSSProperties} className={styles.toolCard}><h3>{x.name}</h3><p>{x.description}</p><div className={styles.tags}>{x.tags.map(tag=><span key={tag}>{tag}</span>)}</div><footer>{x.status==="development"?<span className={styles.developing}>开发中</span>:<><span className={enabled.includes(x.name)?styles.enabled:styles.disabled}>{enabled.includes(x.name)?"已启用":"未启用"}</span><button type="button" className={styles.primary} onClick={()=>enabled.includes(x.name)?goto("/mine"):enable(x.name)}>{enabled.includes(x.name)?"管理":"启用"}</button><button type="button" onClick={()=>setDialog({type:x.name==="商品采集插件"?"download":"intro",name:x.name})}>介绍</button></>}</footer></article>)}</div>:<div className={styles.empty}>没有匹配的官方工具，请修改关键词或重置条件。</div>}
    </>:pathname.endsWith("/mine")?<div className={styles.figmaMine}>
      {header("我的工具","管理已启用工具，选择本地插件或在线服务快速使用。",<button type="button" className={styles.primary} onClick={()=>goto("/official")}>前往官方工具</button>)}
      <div className={styles.mineBar}>
        <strong>已启用工具</strong>
        <div className={styles.mineSearchControls}>
          <input aria-label="搜索我的工具" placeholder="输入工具名称或关键词…" value={search}
            onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")setApplied(search.trim())}} />
          <button type="button" onClick={()=>{setSearch("");setApplied("")}}>重置</button>
          <button type="button" className={styles.primary} onClick={()=>setApplied(search.trim())}>确认</button>
        </div>
      </div>
      {myTools.filter(x=>[x.name,x.description].join(" ").toLowerCase().includes(applied.toLowerCase())).length?
        <div className={styles.mineGrid}>{myTools.filter(x=>[x.name,x.description].join(" ").toLowerCase().includes(applied.toLowerCase())).map(x=>
          <div className={styles.mineRow} key={x.name} data-figma-tool={x.name}>
            {x.name==="商品采集插件"?<>
              <article className={styles.mineCard}>
                <header><h2>{x.name}</h2><button type="button" onClick={()=>setDialog({type:"disable",name:x.name})}>停用</button></header>
                <p>采集商品的标题、主图、规格与价格等信息；结果统一保存到「数据服务 / 我的数据」。</p>
                <h3 className={styles.acquisitionLabel}>选择采集方式</h3>
                <div className={styles.acquisitionChoices}>
                  <section><div className={styles.choiceHeading}><strong>本地插件采集</strong><span>免费</span></div>
                    <p>安装在客户电脑本地运行，浏览商品时通过浏览器插件直接采集。</p>
                    <b>免费 · 不消耗数据额度</b>
                    <button type="button" onClick={()=>setDialog({type:"download",name:x.name})}>下载插件</button>
                  </section>
                  <section><div className={styles.choiceHeading}><strong>在线采集</strong><span>按数据收费</span></div>
                    <p>由平台云端执行，无需客户电脑持续运行即可完成在线采集。</p>
                    <b>按实际采集数据条数扣除额度</b>
                    <button type="button" onClick={()=>setDialog({type:"launch",name:x.name})}>在线采集</button>
                  </section>
                </div>
                <div className={styles.acquisitionResult}>采集结果统一保存至「数据服务 / 我的数据」</div>
              </article>
              <aside className={styles.mineGuide}>
                <h3>采集方式说明</h3>
                <p className={styles.guideIntro}>根据运行环境选择采集方式，两种方式的结果都会进入「我的数据」。</p>
                <div><strong>本地插件采集</strong><p>适合：客户电脑本地运行，通过浏览器插件采集商品</p><p>费用：免费，不消耗数据额度</p></div>
                <div><strong>在线采集</strong><p>适合：平台云端执行，无需客户电脑持续运行</p><p>费用：按实际采集数据条数扣除额度</p></div>
                <p className={styles.guideTip}>本地插件免费；在线采集按实际数据量计费</p>
              </aside>
            </>:<>
              <article className={styles.mineCard}>
                <header><h2>{x.name}</h2><button type="button" onClick={()=>setDialog({type:"disable",name:x.name})}>停用</button></header>
                {x.name==="POD素材管理工具"?<div className={styles.mineDescription}>
                  <p>从贴图生成、审核应用到订单打印，统一管理 POD 设计素材。</p>
                  <p>贴图审核通过后才能用于商品，订单产生后可按订单号或 SKU 找回原图。</p>
                  <p>支持个人素材上传与图片裂变复用，官方灵感市场提供图片和生成指令。</p>
                </div>:x.name==="自有商品刊登工具"?<div className={styles.mineDescription}>
                  <p>导入并管理自有商品资料，检查必填信息后进行适配。</p>
                  <p>支持自有商品导入、商品信息适配和批量刊登。</p>
                </div>:<p>{x.description}</p>}
                <footer><span className={styles.enabled}>已启用</span><button type="button" onClick={()=>setDialog({type:"launch",name:x.name})}>{x.name==="POD素材管理工具"?"前往POD素材管理":x.name==="自有商品刊登工具"?"进入自有商品刊登":"进入使用"}</button></footer>
              </article>
              <aside className={styles.mineGuide}><h3>功能介绍</h3>
                {(x.name==="POD素材管理工具"?
                  [["贴图审核与打印","审核通过后贴到商品；下单可检索原图"],["我的素材","上传、分类管理个人素材，支持图片裂变"],["灵感市场","官方维护示例图片及生成指令"]]:
                  x.name==="自有商品刊登工具"?
                  [["自有商品导入","导入自有商品资料"],["商品信息适配","核对并完善商品信息"],["批量刊登","批量处理商品刊登"]]:
                  [["功能说明",x.description],["使用范围",x.tags.join(" · ")]]
                ).map(([title,body])=><div key={title}><strong>{title}</strong><p>{body}</p></div>)}
              </aside>
            </>}
          </div>
        )}</div>
        :<div className={styles.empty}>当前没有匹配的已启用工具。你可以前往官方工具启用。</div>}
      </div>    </>:null}
    {dialog?<ToolModal key={dialog.type+dialog.name} info={dialog} onClose={()=>setDialog(null)} onConfirm={()=>{persist(enabled.filter(x=>x!==dialog.name));setDialog(null);setNotice(dialog.name+"：已在当前演示中停用。");}}/>:null}
  </div>;
}
