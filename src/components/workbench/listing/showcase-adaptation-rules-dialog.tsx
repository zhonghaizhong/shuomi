"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {readAdaptationRules,saveAdaptationRules,type AdaptationRule,type RuleCollection,type SkuMode,type PriceMode} from "./showcase-adaptation-rules";
import s from "./showcase-adaptation-rules-dialog.module.css";

const skuModes:SkuMode[]=["使用原货号","前后缀 + 原货号","哈希值"];
const priceModes:PriceMode[]=["固定值","原价 + 固定值","成本 × 倍数","使用定价工具"];
const pricingToolAvailable=false;
const priceDetails:Record<Exclude<PriceMode,"使用定价工具">,{description:string;example:string;field:string;placeholder:string}>={
 "固定值":{description:"所有商品统一使用你填写的固定售价。",example:"填写 ¥69.00 = 目标售价就是 ¥69.00",field:"固定售价",placeholder:"请输入固定售价"},
 "原价 + 固定值":{description:"在商品原价基础上统一增加一个固定金额。",example:"原售价 ¥50 + ¥10 = 目标售价 ¥60",field:"加价金额",placeholder:"请输入加价金额"},
 "成本 × 倍数":{description:"按商品成本价乘以你填写的倍数计算售价。",example:"成本 ¥50 × 1.80 = 目标售价 ¥90",field:"倍数",placeholder:"请输入倍数，如 1.80"}
};
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
 const remove=(id:string)=>{
  const next=collection.rules.filter(r=>r.id!==id);
  if(!next.length){
   const replacement:AdaptationRule={id:"rule-"+crypto.randomUUID(),name:"我的适配规则",skuMode:"使用原货号",prefix:"",suffix:"",priceMode:"固定值",priceValue:"0",currencyConversion:false,aiFill:false,aiScope:"required",brandMode:"authorized",brandName:""};
   setCollection({currentId:replacement.id,rules:[replacement]});setEditing(replacement.id);
   setMessage("示例规则已删除，系统保留一套可编辑的空白规则，以满足刊登时规则必选要求。保存后生效。");
  }else{
   const currentId=collection.currentId===id?next[0].id:collection.currentId;
   setCollection({currentId,rules:next});if(editing===id)setEditing(currentId);
   setMessage("规则已从编辑列表删除；保存后生效。");
  }
  if(rename===id)setRename(null);
 };
 const validate=():string|null=>{const names=collection.rules.map(r=>r.name.trim());if(names.some(n=>!n))return "规则名称不能为空。";if(new Set(names).size!==names.length)return "规则名称不能重复。";for(const r of collection.rules){if(r.priceMode==="使用定价工具")return `「${r.name}」选择的定价工具尚未开发，请改用其他定价方式。`;const n=Number(r.priceValue);if(!r.priceValue.trim()||!Number.isFinite(n)||n<0||(r.priceMode==="成本 × 倍数"&&n<=0))return `「${r.name}」的定价数值无效，请填写有效数字。`}return null};
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
        <button type="button" onClick={()=>add(r)}>复制</button><button type="button" onClick={()=>{setRename(r.id);setRenameValue(r.name)}}>重命名</button><button type="button" onClick={()=>remove(r.id)}>删除</button>
       </div>
      </article>)}
      {shown.length===0?<p className={s.empty}>暂无匹配的规则。</p>:null}
     </div>
     <p className={s.help}>示例规则可以删除。删除当前规则后会自动切换到另一套规则；保存后生效。</p>
    </aside>
    <div className={s.editor}><div className={s.editorHead}><h3>当前编辑</h3><span>{selected.name}</span><button type="button" className={s.inlineRename} onClick={()=>{setRename(selected.id);setRenameValue(selected.name)}}>修改名称</button>{selected.id===collection.currentId?<small>当前使用</small>:null}</div>
     <section className={s.block}><h4>货号规则</h4><p>商品适配时生成目标平台货号。</p><div className={s.options}>{skuModes.map(mode=><label key={mode}><input type="radio" name="sku-mode" checked={selected.skuMode===mode} onChange={()=>change({skuMode:mode})}/>{mode}</label>)}</div>
      {selected.skuMode==="前后缀 + 原货号"?<><p>规则说明：在原货号前后添加自定义前缀或后缀，原货号主体保持不变。</p><div className={s.pair}><label>前缀<input aria-label="货号前缀" maxLength={20} value={selected.prefix} onChange={e=>change({prefix:e.target.value})}/></label><label>后缀<input aria-label="货号后缀" maxLength={20} value={selected.suffix} onChange={e=>change({suffix:e.target.value})}/></label></div><div className={s.example}>生成示例：{selected.prefix}SM-240821-001{selected.suffix}</div></>:selected.skuMode==="哈希值"?<p>使用商品标识生成稳定的适配货号（演示规则，不会在这里修改原货号）。</p>:null}
     </section>
     <section className={s.block}>
      <div className={s.blockHeading}><h4>定价规则</h4><p>选择一种定价方式，适配时自动计算目标售价。</p></div>
      <div className={s.optionsPrice}>{priceModes.map(mode=><button key={mode} type="button" aria-pressed={selected.priceMode===mode} aria-disabled={mode==="使用定价工具"&&!pricingToolAvailable} className={selected.priceMode===mode?s.selectedOption:""} onClick={()=>{change({priceMode:mode,priceValue:mode==="成本 × 倍数"?"1.8":mode==="使用定价工具"?"":"0"});if(mode==="使用定价工具"&&!pricingToolAvailable)setMessage("定价工具尚未开发：可以预览说明，但不能保存为可执行的刊登规则。")}}>{mode}</button>)}</div>
      {selected.priceMode==="使用定价工具"?<div className={s.priceExplanation}><p>说明：使用已配置的定价工具自动计算售价。</p><p>举例：选择“智能利润定价器” = 系统按工具规则自动定价</p><div className={s.disabledPricing}><strong>定价工具</strong><span>尚未开发，暂不可使用</span></div><button type="button" onClick={()=>change({priceMode:"成本 × 倍数",priceValue:"1.8"})}>切换为成本 × 倍数</button></div>:<>
       <div className={s.priceExplanation}><p>说明：{priceDetails[selected.priceMode].description}</p><p>举例：{priceDetails[selected.priceMode].example}</p></div>
       <label className={s.priceInput}><strong>{priceDetails[selected.priceMode].field}</strong><input aria-label="规则定价数值" type="number" min="0" step={selected.priceMode==="成本 × 倍数"?"0.01":"0.01"} value={selected.priceValue} placeholder={priceDetails[selected.priceMode].placeholder} onChange={e=>change({priceValue:e.target.value})}/></label>
      </>}
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
