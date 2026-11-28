"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import styles from "./showcase-knowledge-groups.module.css";

export type KnowledgeItem={id:string;name:string;origin:"官方"|"我的";group:string;description:string;updated?:number};
type KnowledgeState={groups:string[];items:KnowledgeItem[]};
const prefix="shuomi-showcase-knowledge-groups-v1";
export const projectDemoKnowledge:KnowledgeItem[]=[
 {id:"demo-knowledge-profit",name:"SHEIN 经营指标与利润核对规范（演示）",origin:"我的",group:"",updated:Date.now()-86400000,description:`【适用项目】SHEIN 美国站30天利润提升项目。
【经营数据字段】销售金额、有效订单、退款金额、平台佣金、商品采购成本、物流成本、其他费用、汇率和统计日期。不同币种、站点的数据不得直接相加。
【处理约束】只有字段完整且来源可核验时计算净收入、单品毛利和净利润；缺成本不得推断利润。退款和订单取消须按同一口径处理。
【异常识别】商品成本缺失、净利率低于业务设定底线、退款异常时生成待人工复核任务。
【信息来源】本条为内部演示规范，不是SHEIN官方政策，也未连接一号店真实财务数据。`},
 {id:"demo-knowledge-pod",name:"POD 服装主图与变体审核规则（演示）",origin:"我的",group:"",updated:Date.now()-86400000,description:`【适用项目】POD 新品开发与刊登项目。
【输入范围】短袖、卫衣的各颜色尺码SKU，关联印花素材与对应商品图。
【图片验收】演示方案采用1:1画幅、白底、英文文案；主图和详情图各8张为目标要求，不表示已真实生成。
【映射规则】每个颜色的图片必须与对应变体匹配；错误颜色、印花越界、缺少正反面或资质时标记待审核或待补全。
【人工关口】图片审核通过后才能进入后续平台适配，素材许可未确认不可发布。
【说明】本条为演示业务规则，实际以目标平台最新要求和授权素材为准。`},
 {id:"demo-knowledge-selected",name:"硕米优选货盘SKU采集与刊登规范（演示）",origin:"我的",group:"",updated:Date.now()-86400000,description:`【适用项目】SHEIN 美国站30天新品开发与销售项目。
【现有样例】SMYX-DEMO-001纯棉圆领短袖T恤、SMYX-DEMO-002宽松连帽卫衣。
【选品检查】核对货盘ID、SKU、颜色、尺码、MOQ、库存、配送国家及版本；同名产品也不得丢失来源SKU。
【数据流转】通过硕米优选的「加入采集批次」进入我的数据，再执行商品内容优化与SHEIN站点适配。
【异常处理】字段不完整进入待补全；需要审核的商品进入待审核；未经确认不得标记已上传。
【边界】模拟供应商认证、库存、价格及配送条件仅供演示，不代表真实供货承诺。`},
 {id:"demo-knowledge-research",name:"美国站候选商品数据来源与选品评审规范（演示）",origin:"我的",group:"",updated:Date.now()-86400000,description:`【适用项目】美国站新品市场调研与选品项目。
【数据来源】本地演示货盘SKU和我的数据批次；数据市场服务仅作为待调用来源。
【比较维度】商品类别、SKU组合、报价币种、MOQ、货源与配送国家、供货时效、图片与信息完整程度。
【评审结论】样例SKU可做供货条件比较，不能从中推断美国站需求、销量或利润。
【报告要求】列出可证实信息、未验证假设、待采购或待授权的数据及下一步核实任务。
【边界】本条为演示规范，非外部真实市场研究资料。`}
];
const blank=():KnowledgeState=>({groups:[],items:[]});
const seeded=(org:string,member:string)=>org==="SM-ENT-000001"&&member==="admin"?projectDemoKnowledge.map(x=>({...x})):[];
const storageKey=(org:string,member:string)=>prefix+":"+org+":"+member;
export function readKnowledgeState(org:string,member:string):KnowledgeState{
 try{
  const raw=sessionStorage.getItem(storageKey(org,member));if(!raw)return {groups:[],items:seeded(org,member)};
  const value=JSON.parse(raw);
  if(!Array.isArray(value.groups)||!Array.isArray(value.items))return blank();
  const groups=value.groups.filter((g:unknown):g is string=>typeof g==="string"&&g.trim().length>0&&g.length<=40).slice(0,100);
  const items=value.items.filter((x:KnowledgeItem)=>x&&typeof x.id==="string"&&typeof x.name==="string"&&typeof x.description==="string"&&["官方","我的"].includes(x.origin)&&typeof x.group==="string").slice(0,200);
  const demo=seeded(org,member);return {groups,items:[...items.filter(x=>!demo.some(d=>d.id===x.id)),...demo.map(d=>items.find(x=>x.id===d.id)??d)]};
 }catch{return {groups:[],items:seeded(org,member)}}
}
export function writeKnowledgeState(org:string,member:string,value:KnowledgeState){
 sessionStorage.setItem(storageKey(org,member),JSON.stringify(value));
 window.dispatchEvent(new CustomEvent("shuomi-knowledge-changed"));
}
export function enableKnowledge(org:string,member:string,name:string,description:string){
 const value=readKnowledgeState(org,member);
 if(value.items.some(x=>x.id==="official:"+name))return false;
 writeKnowledgeState(org,member,{...value,items:[...value.items,{id:"official:"+name,name,description,origin:"官方",group:"",updated:Date.now()}]});
 return true;
}
export function savePersonalKnowledge(org:string,member:string,name:string,description:string){
 const value=readKnowledgeState(org,member);
 const cleaned=name.trim().slice(0,80);
 if(!cleaned)return false;
 if(value.items.some(x=>x.origin==="我的"&&x.name===cleaned))return false;
 writeKnowledgeState(org,member,{...value,items:[...value.items,{id:"personal:"+crypto.randomUUID(),name:cleaned,description,origin:"我的",group:"",updated:Date.now()}]});
 return true;
}
export function KnowledgeGroupManager({organizationId,memberId,onBrowse}:{organizationId:string;memberId:string;onBrowse:()=>void}){
 const router=useRouter();
 const [state,setState]=useState<KnowledgeState>(blank);
 const [filter,setFilter]=useState("全部分组");
 const [open,setOpen]=useState(false);
 const [draft,setDraft]=useState("");
 const [editing,setEditing]=useState("");
 const [rename,setRename]=useState("");
 const [notice,setNotice]=useState("");
 const [search,setSearch]=useState("");
 const [appliedSearch,setAppliedSearch]=useState("");
 const [editor,setEditor]=useState<string|null>(null);
 const [editName,setEditName]=useState("");
 const [editDescription,setEditDescription]=useState("");
 const [more,setMore]=useState<string|null>(null);
 const [reading,setReading]=useState<string|null>(null);
 const [moveTarget,setMoveTarget]=useState("");
 useEffect(()=>{
  const refresh=()=>setState(readKnowledgeState(organizationId,memberId));
  refresh();setFilter("全部分组");window.addEventListener("shuomi-knowledge-changed",refresh);
  return()=>window.removeEventListener("shuomi-knowledge-changed",refresh);
 },[organizationId,memberId]);
 const save=(next:KnowledgeState,message:string)=>{try{writeKnowledgeState(organizationId,memberId,next);setState(next);setNotice(message)}catch{setNotice("保存失败，请检查浏览器存储权限。")}};
 const create=()=>{const name=draft.trim();if(!name||name.length>40||state.groups.includes(name))return;save({...state,groups:[...state.groups,name]},"分组已创建");setDraft("")};
 const changeName=(old:string)=>{const next=rename.trim();if(!next||next.length>40||(next!==old&&state.groups.includes(next)))return;save({groups:state.groups.map(g=>g===old?next:g),items:state.items.map(i=>i.group===old?{...i,group:next}:i)},"分组已重命名");if(filter===old)setFilter(next);setEditing("");setRename("")};
 const removeGroup=(name:string)=>{save({groups:state.groups.filter(g=>g!==name),items:state.items.map(i=>i.group===name?{...i,group:""}:i)},"已删除分组；知识库内容保留为未分组");if(filter===name)setFilter("全部分组")};
 const visible=state.items.filter(x=>(x.name+" "+x.description).toLocaleLowerCase().includes(appliedSearch.toLocaleLowerCase()));
 const hasKnowledge=state.items.length>0;
 const editItem=state.items.find(x=>x.id===editor);
 const updateItem=(item:KnowledgeItem,changes:Partial<KnowledgeItem>,message:string)=>save({...state,items:state.items.map(x=>x.id===item.id?{...x,...changes,updated:Date.now()}:x)},message);
 return <div className={styles.root} data-my-knowledge-groups>
  <section className={styles.toolbar} aria-label="知识库操作">
   <form className={styles.leftFilters} onSubmit={e=>{e.preventDefault();setAppliedSearch(search.trim())}}>
    <input aria-label="搜索知识库名称" placeholder="搜索知识库名称" value={search} onChange={e=>setSearch(e.target.value)}/>
    <button type="submit" className={styles.primary}>确定</button>
   </form>
   <div className={styles.actions}><button type="button" onClick={()=>setOpen(true)}>管理分组</button></div>
  </section>
  {notice&&<p className={styles.notice} role="status">{notice}</p>}
  <div className={styles.tableWrap}><table className={styles.table}>
   <thead><tr><th>知识库名称</th><th>来源</th><th>所属分组</th><th>最近更新</th><th>操作</th></tr></thead>
   <tbody>{visible.map(item=><tr key={item.id}>
    <td><strong>{item.name}</strong></td><td>{item.origin}</td><td><span className={styles.groupLabel}>{item.group||"未分组"}</span></td>
    <td>{item.updated?new Date(item.updated).toLocaleDateString("zh-CN"):"—"}</td>
    <td><div className={styles.rowActions}>
     <button type="button" onClick={()=>router.push("/workbench/ai/chat/new?preview=1&knowledgeMode=reference&knowledgeName="+encodeURIComponent(item.name))}>使用</button>
     <button type="button" onClick={()=>setReading(item.id)}>查看内容</button>\n     {item.origin==="我的"&&<button type="button" onClick={()=>{setEditor(item.id);setEditName(item.name);setEditDescription(item.description)}}>编辑</button>}
     <button type="button" aria-label={item.name+"的更多操作"} onClick={()=>{setMore(more===item.id?null:item.id);setMoveTarget(item.group)}}>更多</button>
    </div></td>
   </tr>)}
   {!visible.length&&<tr><td colSpan={5} className={styles.emptyCell}>{hasKnowledge?"没有符合条件的知识库":"暂无知识库"}</td></tr>}
  </tbody></table></div>
  {reading&&state.items.some(x=>x.id===reading)&&<div className={styles.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setReading(null)}}><section className={styles.dialog} role="dialog" aria-modal="true" aria-label="知识库完整内容"><header><h2>{state.items.find(x=>x.id===reading)?.name}</h2><button type="button" aria-label="关闭知识内容" onClick={()=>setReading(null)}>×</button></header><p style={{whiteSpace:"pre-wrap",lineHeight:1.85,maxHeight:"65vh",overflowY:"auto"}}>{state.items.find(x=>x.id===reading)?.description}</p><footer><button className={styles.primary} type="button" onClick={()=>setReading(null)}>关闭</button></footer></section></div>}
  {more&&state.items.some(x=>x.id===more)&&<div className={styles.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setMore(null)}}>
   <section className={styles.dialog} role="dialog" aria-modal="true" aria-label="知识库更多操作">
    <header><h2>知识库操作</h2><button type="button" aria-label="关闭更多操作" onClick={()=>setMore(null)}>×</button></header>
    <p>{state.items.find(x=>x.id===more)?.name}</p>
    <label className={styles.editField}>移动到分组
     <select aria-label="移动到分组" value={moveTarget} onChange={e=>setMoveTarget(e.target.value)}>
      <option value="">未分组</option>{state.groups.map(g=><option key={g} value={g}>{g}</option>)}
     </select>
    </label>
    <footer>
     <button type="button" onClick={()=>setMore(null)}>取消</button>
     <button type="button" className={styles.primary} disabled={state.items.find(x=>x.id===more)?.group===moveTarget} onClick={()=>{
      if(moveTarget!==""&&!state.groups.includes(moveTarget)){setNotice("分组已不存在，请重新选择");return;}
      const item=state.items.find(x=>x.id===more);
      if(!item)return;
      updateItem(item,{group:moveTarget},"已移动到"+(moveTarget||"未分组"));
      setMore(null);
     }}>确认移动</button>
     <button type="button" onClick={()=>{save({...state,items:state.items.filter(x=>x.id!==more)},"已移出我的知识库");setMore(null)}}>移出我的知识库</button>
    </footer>
   </section>
  </div>}
  {editItem&&<div className={styles.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setEditor(null)}}>
   <form className={styles.dialog} role="dialog" aria-modal="true" aria-label="编辑知识库" onSubmit={e=>{e.preventDefault();const name=editName.trim();if(!name)return;updateItem(editItem,{name,description:editDescription.trim()},"知识库信息已更新");setEditor(null)}}>
    <header><h2>编辑知识库</h2><button type="button" aria-label="关闭编辑" onClick={()=>setEditor(null)}>×</button></header>
    <label className={styles.editField}>名称<input aria-label="知识库名称" maxLength={80} value={editName} onChange={e=>setEditName(e.target.value)}/></label>
    <label className={styles.editField}>说明<textarea aria-label="知识库说明" maxLength={500} value={editDescription} onChange={e=>setEditDescription(e.target.value)}/></label>
    <footer><button type="button" onClick={()=>setEditor(null)}>取消</button><button className={styles.primary} type="submit" disabled={!editName.trim()}>保存</button></footer>
   </form>
  </div>}
  {open&&<div className={styles.overlay} onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
    <section className={styles.dialog} role="dialog" aria-modal="true" aria-label="管理知识库分组">
      <header><h2>管理知识库分组</h2><button type="button" aria-label="关闭分组管理" onClick={()=>setOpen(false)}>×</button></header>
      <p>分组只用于整理我的知识库，不改变官方知识分类；删除分组不会删除知识内容。</p>
      <form onSubmit={e=>{e.preventDefault();create()}} className={styles.create}><input aria-label="分组名称" maxLength={40} placeholder="输入新分组名称" value={draft} onChange={e=>setDraft(e.target.value)}/><button className={styles.primary} disabled={!draft.trim()||state.groups.includes(draft.trim())}>创建分组</button></form>
      <div className={styles.groupList}>{state.groups.length?state.groups.map(g=><div className={styles.group} key={g}>
       {editing===g?<form className={styles.create} onSubmit={e=>{e.preventDefault();changeName(g)}}><input aria-label={"重命名"+g} maxLength={40} value={rename} onChange={e=>setRename(e.target.value)}/><button className={styles.primary}>保存</button><button type="button" onClick={()=>setEditing("")}>取消</button></form>:<><div><strong>{g}</strong><small>{state.items.filter(i=>i.group===g).length} 项知识</small></div><div className={styles.actions}><button type="button" onClick={()=>{setEditing(g);setRename(g)}}>重命名</button><button type="button" onClick={()=>removeGroup(g)}>删除分组</button></div></>}
       </div>):<p>暂无自定义分组。</p>}</div>
      <footer><button type="button" className={styles.primary} onClick={()=>setOpen(false)}>完成</button></footer>
    </section>
  </div>}
 </div>;
}