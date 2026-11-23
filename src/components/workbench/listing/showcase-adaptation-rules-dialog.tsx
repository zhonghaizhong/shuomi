"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {readAdaptationRules,saveAdaptationRules,type AdaptationRule,type RuleCollection,type SkuMode,type PriceMode} from "./showcase-adaptation-rules";
import s from "./showcase-adaptation-rules-dialog.module.css";

const skuModes:SkuMode[]=["使用原货号","前后缀 + 原货号","哈希值"];
const priceModes:PriceMode[]=["固定值","原价 + 固定值","成本 × 倍数","使用定价工具"];
function priceDesc(rule:AdaptationRule){
 if(rule.priceMode==="成本 × 倍数")return "成本 × "+(rule.priceValue||"未设置");
 if(rule.priceMode==="原价 + 固定值")return "原价 + "+(rule.priceValue||"未设置");
 if(rule.priceMode==="固定值")return "固定值 "+(rule.priceValue||"未设置");
 return "使用定价工具";
}
export function AdaptationRulesDialog({organizationId,memberId,site,storeName,onClose,onSave}:{
 organizationId:string;memberId:string;site:string;storeName:string;
 onClose:()=>void;onSave:(rule:AdaptationRule)=>void
}){
 const ref=useRef<HTMLElement>(null);
 const [collection,setCollection]=useState<RuleCollection>(()=>readAdaptationRules(organizationId,memberId));
 const [editing,setEditing]=useState(collection.currentId);
 const [search,setSearch]=useState("");
 const [rename,setRename]=useState<string|null>(null);
 const [renameValue,setRenameValue]=useState("");
 const [message,setMessage]=useState("");
 const selected=collection.rules.find(x=>x.id===editing)??collection.rules[0];
 const current=collection.rules.find(x=>x.id===collection.currentId)??collection.rules[0];
 const shown=useMemo(()=>collection.rules.filter(x=>x.name.toLowerCase().includes(search.trim().toLowerCase())),[collection.rules,search]);
 useEffect(()=>{const earlier=document.activeElement;ref.current?.focus();const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape"){e.preventDefault();onClose()}};window.addEventListener("keydown",onKey);return()=>{window.removeEventListener("keydown",onKey);if(earlier instanceof HTMLElement&&earlier.isConnected)earlier.focus()}},[onClose]);
 const change=(part:Partial<AdaptationRule>)=>{setCollection(v=>({...v,rules:v.rules.map(r=>r.id===selected.id?{...r,...part}:r)}));setMessage("")};
 const add=(base?:AdaptationRule)=>{const id="rule-"+crypto.randomUUID();const data:AdaptationRule=base?{...base,id,name:base.name+"（副本）"}:{id,name:"新建适配规则",skuMode:"使用原货号",prefix:"",suffix:"",priceMode:"成本 × 倍数",priceValue:"1.8",currencyConversion:false,aiFill:false,aiScope:"required",brandMode:"authorized",brandName:""};setCollection(v=>({...v,rules:[...v.rules,data]}));setEditing(id);setRename(id);setRenameValue(data.name);setMessage("规则已添加到当前编辑列表，保存后生效。")};
 const renameRule=(id:string)=>{const v=renameValue.trim();if(!v){setMessage("请输入规则名称。");return}if(collection.rules.some(r=>r.id!==id&&r.name===v)){setMessage("规则名称不能重复。");return}setCollection(old=>({...old,rules:old.rules.map(r=>r.id===id?{...r,name:v}:r)}));setRename(null);setMessage("规则名称已修改，保存后生效。")};
 const remove=(id:string)=>{if(collection.currentId===id){setMessage("使用中的规则需先切换后才能删除。");return}if(collection.rules.length<=1){setMessage("至少保留一套规则。");return}const next=collection.rules.filter(r=>r.id!==id);setCollection(v=>({...v,rules:next}));if(editing===id)setEditing(collection.currentId);setMessage("已从当前编辑列表删除规则，保存后生效。")};
 const validate=():string|null=>{const names=collection.rules.map(r=>r.name.trim());if(names.some(n=>!n))return "规则名称不能为空。";if(new Set(names).size!==names.length)return "规则名称不能重复。";for(const r of collection.rules){if(r.priceMode!=="使用定价工具"){const n=Number(r.priceValue);if(!r.priceValue.trim()||!Number.isFinite(n)||n<0||(r.priceMode==="成本 × 倍数"&&n<=0))return `「${r.name}」的定价数值无效，请填写有效数字。`}}return null};
 const save=()=>{if(rename){setMessage("请先保存或取消规则重命名。");return}const error=validate();if(error){setMessage(error);return}if(!saveAdaptationRules(organizationId,memberId,collection)){setMessage("规则未能保存，请检查浏览器会话存储。");return}onSave(current)};
 return <div className={s.overlay} role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <section ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label="适配规则设置" className={s.dialog}>
   <header className={s.header}><div><small>刊登管理 / 待上传 / 适配规则设置</small><h2>适配规则设置</h2><p>创建并管理多套自定义规则，待上传时选择当前使用的规则。</p></div><button type="button" aria-label="关闭适配规则设置" onClick={onClose}>×</button></header>
   <div className={s.scope}><span>适配目标：<strong>{site||"暂未选择平台与站点"}</strong></span><span>目标店铺：<strong>{storeName||"待选择"}</strong></span><span>当前使用：<strong>{current?.name}</strong></span></div>
   <div className={s.workspace}>
    <aside className={s.sidebar}>
     <div className={s.panelTitle}><div><strong>我的规则</strong><small>{collection.rules.length} 套</small></div><button type="button" onClick={()=>add()}>＋ 新建规则</button></div>
     <input aria-label="搜索规则" placeholder="搜索规则" value={search} onChange={e=>setSearch(e.target.value)}/>
     <div className={s.rulesList}>
      {shown.map(r=><article key={r.id} className={editing===r.id?s.selectedRule:""}>
       <button type="button" className={s.ruleSelect} onClick={()=>{setEditing(r.id);setMessage("")}}><strong>{r.name}</strong><small>货号：{r.skuMode}</small><small>定价：{priceDesc(r)}</small></button>
       {rename===r.id?<div className={s.renameRow}><input aria-label="规则名称" maxLength={60} value={renameValue} onChange={e=>setRenameValue(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();renameRule(r.id)}}}/><button onClick={()=>renameRule(r.id)} type="button">保存</button><button onClick={()=>setRename(null)} type="button">取消</button></div>:null}
       <div className={s.ruleActions}>{collection.currentId===r.id?<span className={s.active}>使用中</span>:<button type="button" onClick={()=>{setCollection(v=>({...v,currentId:r.id}));setMessage("已选择当前使用规则，保存后生效。")}}>设为当前</button>}
        <button type="button" onClick={()=>add(r)}>复制</button><button type="button" onClick={()=>{setRename(r.id);setRenameValue(r.name)}}>重命名</button><button type="button" disabled={collection.currentId===r.id} onClick={()=>remove(r.id)}>删除</button>
       </div>
      </article>)}
      {shown.length===0?<p className={s.empty}>暂无匹配的规则。</p>:null}
     </div>
     <p className={s.help}>支持新建、复制、重命名与删除。使用中的规则需切换后再删除。</p>
    </aside>
    <div className={s.editor}><div className={s.editorHead}><h3>当前编辑</h3><span>{selected.name}</span><button type="button" className={s.inlineRename} onClick={()=>{setRename(selected.id);setRenameValue(selected.name)}}>修改名称</button>{selected.id===collection.currentId?<small>当前使用</small>:null}</div>
     <section className={s.block}><h4>货号规则</h4><p>商品适配时生成目标平台货号。</p><div className={s.options}>{skuModes.map(mode=><label key={mode}><input type="radio" name="sku-mode" checked={selected.skuMode===mode} onChange={()=>change({skuMode:mode})}/>{mode}</label>)}</div>
      {selected.skuMode==="前后缀 + 原货号"?<><p>规则说明：在原货号前后添加自定义前缀或后缀，原货号主体保持不变。</p><div className={s.pair}><label>前缀<input aria-label="货号前缀" maxLength={20} value={selected.prefix} onChange={e=>change({prefix:e.target.value})}/></label><label>后缀<input aria-label="货号后缀" maxLength={20} value={selected.suffix} onChange={e=>change({suffix:e.target.value})}/></label></div><div className={s.example}>生成示例：{selected.prefix}SM-240821-001{selected.suffix}</div></>:selected.skuMode==="哈希值"?<p>使用商品标识生成稳定的适配货号（演示规则，不会在这里修改原货号）。</p>:null}
     </section>
     <section className={s.block}><h4>定价规则</h4><p>选择一种定价方式，适配时计算目标售价。</p><div className={s.options}>{priceModes.map(mode=><label key={mode}><input type="radio" name="price-mode" checked={selected.priceMode===mode} onChange={()=>change({priceMode:mode,priceValue:mode==="成本 × 倍数"?"1.8":mode==="使用定价工具"?"":"0"})}/>{mode}</label>)}</div>
      {selected.priceMode==="成本 × 倍数"?<p>说明：按商品成本价乘以填写的倍数计算售价。</p>:null}
      {selected.priceMode!=="使用定价工具"?<label className={s.priceInput}>{selected.priceMode==="成本 × 倍数"?"倍数":selected.priceMode==="固定值"?"目标售价":"调整金额"}<input aria-label="规则定价数值" type="number" min={selected.priceMode==="成本 × 倍数"?"0.01":"0"} step="0.01" value={selected.priceValue} placeholder={selected.priceMode==="成本 × 倍数"?"请输入倍数，如 1.80":"请输入金额"} onChange={e=>change({priceValue:e.target.value})}/></label>:<p>定价工具尚未接入正式服务，本次仅保存选用方式。</p>}
      {selected.priceMode==="成本 × 倍数"&&Number(selected.priceValue)>0?<div className={s.example}>举例：成本 ¥50 × {Number(selected.priceValue).toFixed(2)} = 目标售价 ¥{(50*Number(selected.priceValue)).toFixed(2)}</div>:null}
     </section>
     <section className={s.block}>
      <div className={s.inlineSetting}><strong>目标货币转换</strong><span>按目标站点币种自动换算最终售价。</span><button type="button" className={selected.currencyConversion?s.onButton:""} aria-pressed={selected.currencyConversion} onClick={()=>change({currencyConversion:!selected.currencyConversion})}>{selected.currencyConversion?"已启用":"启用"}</button></div>
      <div className={s.inlineSetting}><strong>AI 自动补全信息</strong><div className={s.scopeChoices}>{([["required","补充必填信息"],["optional","可填信息"],["all","全部信息"]] as const).map(([value,name])=><button key={value} type="button" className={(selected.aiScope??"required")===value?s.chosen:""} aria-pressed={(selected.aiScope??"required")===value} onClick={()=>change({aiScope:value,aiFill:true})}>{name}</button>)}</div><button type="button" className={selected.aiFill?s.onButton:""} aria-pressed={selected.aiFill} onClick={()=>change({aiFill:!selected.aiFill})}>{selected.aiFill?"已启用":"启用"}</button></div>
      <div className={s.brandRow}><div><strong>品牌绑定</strong><small>仅支持绑定已授权品牌；手动填写的品牌名称将按平台规则校验。</small></div><div className={s.brandActions}><button type="button" className={(selected.brandMode??"authorized")==="authorized"?s.chosen:""} onClick={()=>change({brandMode:"authorized",brandName:""})}>选择授权品牌</button><button type="button" className={selected.brandMode==="manual"?s.chosen:""} onClick={()=>change({brandMode:"manual"})}>手动填写品牌名称</button></div>{selected.brandMode==="manual"?<input aria-label="品牌名称" placeholder="请填写已获授权的品牌名称" maxLength={80} value={selected.brandName??""} onChange={e=>change({brandName:e.target.value})}/>:null}</div>
     </section>
    </div>
   </div>
   {message?<p className={s.notice} role="status">{message}</p>:null}
   <footer className={s.footer}><span>本次规则配置不会覆盖「我的数据」中的原始商品。</span><button type="button" onClick={onClose}>取消</button><button type="button" className={s.primary} onClick={save}>保存并使用</button></footer>
  </section>
 </div>;
}
