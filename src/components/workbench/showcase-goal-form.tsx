"use client";
import {useEffect,useMemo,useState,type FormEvent} from "react";
import type {DemoStoreBinding} from "./store-binding-demo";
import styles from "./showcase-action-dialog.module.css";

export type DemoGoal={
 name:string;metric:"订单量"|"销售额";store:string;storeIds:string[];
 period:"每周"|"每月";value:string;currencyTargets?:Record<string,string>;
};
const currencyBySite=(region:string):string=>{
 const site=region.toLowerCase();
 if(/美国|美区|usa|united states|us站/.test(site))return "USD";
 if(/加拿大|canada/.test(site))return "CAD";
 if(/英国|united kingdom|britain|uk站/.test(site))return "GBP";
 if(/德国|法国|意大利|西班牙|荷兰|欧盟|europe|germany|france|italy|spain/.test(site))return "EUR";
 if(/日本|japan/.test(site))return "JPY";
 if(/墨西哥|mexico/.test(site))return "MXN";
 if(/澳大利亚|australia/.test(site))return "AUD";
 if(/中国|china/.test(site))return "CNY";
 return "";
};
const pageSize=8;
export function ShowcaseGoalForm({stores,onCreateGoal,onClose}:{
 stores:DemoStoreBinding[];onCreateGoal:(goal:DemoGoal)=>void;onClose:()=>void;
}){
 const [name,setName]=useState("");
 const [metric,setMetric]=useState<DemoGoal["metric"]>("订单量");
 const [period,setPeriod]=useState<DemoGoal["period"]>("每月");
 const [selectedIds,setSelectedIds]=useState<string[]>([]);
 const [shopOpen,setShopOpen]=useState(false);
 useEffect(()=>{if(!shopOpen)return;const onEscape=(event:KeyboardEvent)=>{if(event.key==="Escape"){event.preventDefault();setShopOpen(false)}};document.addEventListener("keydown",onEscape);return()=>document.removeEventListener("keydown",onEscape)},[shopOpen]);
 const [search,setSearch]=useState("");
 const [site,setSite]=useState("全部站点");
 const [type,setType]=useState("全部类型");
 const [page,setPage]=useState(1);
 const [orderTarget,setOrderTarget]=useState("");
 const [currencyTargets,setCurrencyTargets]=useState<Record<string,string>>({});
 const [error,setError]=useState("");
 // Permission and archived-state filtering are enforced upstream; use only the existing scoped bindings.
 const available=useMemo(()=>stores.filter(s=>!s.archived&&s.platformStoreId&&s.platformIdStatus!=="获取失败"),[stores]);
 const selected=available.filter(s=>selectedIds.includes(s.id));
 const currencyGroups=useMemo(()=>{
  const map=new Map<string,DemoStoreBinding[]>();
  for(const store of selected){const currency=currencyBySite(store.region)||"未配置币种";map.set(currency,[...(map.get(currency)||[]),store]);}
  return [...map.entries()];
 },[selected]);
 const siteOptions=[...new Set(available.map(s=>s.region))];
 const typeOptions=[...new Set(available.map(s=>s.type))];
 const filtered=available.filter(s=>(site==="全部站点"||s.region===site)&&(type==="全部类型"||s.type===type)&&
  (s.name+" "+s.region+" "+s.type+" "+(s.platformStoreId||"")).toLowerCase().includes(search.trim().toLowerCase()));
 const count=Math.max(1,Math.ceil(filtered.length/pageSize));
 const currentPage=Math.min(page,count);
 const visible=filtered.slice((currentPage-1)*pageSize,currentPage*pageSize);
 const selectedAllVisible=visible.length>0&&visible.every(s=>selectedIds.includes(s.id));
 const toggle=(id:string)=>setSelectedIds(previous=>previous.includes(id)?previous.filter(x=>x!==id):[...previous,id]);
 const resetFilters=()=>{setSearch("");setSite("全部站点");setType("全部类型");setPage(1)};
 const save=(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();setError("");
  if(!name.trim()){setError("请输入目标名称");return}
  if(!selected.length){setError("请先选择至少一家已绑定店铺");return}
  if(metric==="订单量"){
   const n=Number(orderTarget);
   if(!Number.isSafeInteger(n)||n<=0){setError("订单目标必须是大于零的整数");return}
   onCreateGoal({name:name.trim(),metric,store:selected.map(s=>s.name).join("、"),storeIds:selected.map(s=>s.id),period,value:String(n)});
   return;
  }
  if(currencyGroups.some(([currency])=>currency==="未配置币种")){setError("所选站点有未配置币种的店铺，请先确认站点货币");return}
  if(currencyGroups.some(([currency])=>!Number.isFinite(Number(currencyTargets[currency]))||Number(currencyTargets[currency])<=0)){
   setError("请为每种站点货币分别设置大于零的销售额目标");return;
  }
  const targets=Object.fromEntries(currencyGroups.map(([currency])=>[currency,currencyTargets[currency].trim()]));
  onCreateGoal({name:name.trim(),metric,store:selected.map(s=>s.name).join("、"),storeIds:selected.map(s=>s.id),period,value:Object.entries(targets).map(([c,v])=>c+" "+v).join(" / "),currencyTargets:targets});
 };
 return <form className={styles.form} onSubmit={save}>
  <p className={styles.note}>关联当前账号可见的已绑定店铺。目标仅保存到本地演示数据，暂不从平台同步订单或销售额。</p>
  <label>目标名称<input aria-label="目标名称" maxLength={80} required value={name} placeholder="输入名称" onChange={e=>setName(e.target.value)}/></label>
  <div className={styles.fields}>
   <label>目标指标<select aria-label="目标指标" value={metric} onChange={e=>{setMetric(e.target.value as DemoGoal["metric"]);setError("")}}><option value="订单量">订单量</option><option value="销售额">销售额</option></select></label>
   <label>目标周期<select aria-label="目标周期" value={period} onChange={e=>setPeriod(e.target.value as DemoGoal["period"])}><option value="每周">按周</option><option value="每月">按月</option></select></label>
  </div>
  <div className={styles.goalPickerField}><span>适用店铺</span><button type="button" className={styles.goalSelectButton} onClick={()=>setShopOpen(true)} aria-label="选择适用店铺">{selected.length?"已选择 "+selected.length+" 家店铺 · 点击修改":"选择店铺（支持多选）"}</button>
   {selected.length>0?<div className={styles.goalChips}>{selected.slice(0,4).map(s=><span key={s.id}>{s.name}<button type="button" aria-label={"移除"+s.name} onClick={()=>toggle(s.id)}>×</button></span>)}{selected.length>4?<span>另有 {selected.length-4} 家</span>:null}</div>:<small>仅显示当前组织及账号有权访问的已绑定店铺</small>}
  </div>
  {metric==="订单量"?<label>目标值（订单量）<input aria-label="目标值" inputMode="numeric" type="number" min="1" step="1" value={orderTarget} onChange={e=>setOrderTarget(e.target.value)} placeholder="输入目标订单数"/><small className={styles.goalHint}>所选店铺的订单量合并统计，不区分站点币种。</small></label>:
   <div className={styles.goalCurrencyTargets}><strong>销售额目标值（按币种）</strong>
    {currencyGroups.length===0?<p className={styles.goalHint}>选择店铺后，按站点币种显示对应目标输入框。</p>:
     currencyGroups.map(([currency,group])=><label key={currency}>{currency} · {group.length} 家店铺
      <input aria-label={"目标值 "+currency} type="number" min="0.01" step="0.01" inputMode="decimal" value={currencyTargets[currency]||""} onChange={e=>setCurrencyTargets(v=>({...v,[currency]:e.target.value}))} placeholder={currency==="未配置币种"?"请先核实站点币种":"输入 "+currency+" 销售目标"}/>
      <small className={styles.goalHint}>{[...new Set(group.map(s=>s.region))].join("、")} · {currency==="未配置币种"?"暂不能设置销售额目标":"以站点原币种计价"}</small>
     </label>)}
    <p className={styles.goalHint}>不同币种不直接相加；分别设定与考核，日后配置汇率及折算基准币种后才可汇总。</p>
   </div>}
  {error?<p className={styles.goalError} role="alert">{error}</p>:null}
  <footer className={styles.actions}><button type="button" className={styles.secondary} onClick={onClose}>取消</button><button type="submit" className={styles.primary}>添加到演示列表</button></footer>
  {shopOpen?<div className={styles.goalPickerOverlay} onMouseDown={e=>{if(e.target===e.currentTarget)setShopOpen(false)}}>
   <section role="dialog" aria-modal="true" aria-label="选择目标店铺" className={styles.goalPickerPanel}>
    <header><div><strong>选择目标店铺</strong><small>已选择 {selected.length} 家 · 共 {available.length} 家可选店铺</small></div><button aria-label="关闭店铺选择" type="button" onClick={()=>setShopOpen(false)}>×</button></header>
    <div className={styles.goalPickerFilters}>
     <input aria-label="搜索目标店铺" placeholder="搜索店铺名称或平台ID" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/>
     <select aria-label="筛选站点" value={site} onChange={e=>{setSite(e.target.value);setPage(1)}}><option>全部站点</option>{siteOptions.map(v=><option key={v}>{v}</option>)}</select>
     <select aria-label="筛选店铺类型" value={type} onChange={e=>{setType(e.target.value);setPage(1)}}><option>全部类型</option>{typeOptions.map(v=><option key={v}>{v}</option>)}</select>
     <button type="button" onClick={resetFilters}>重置</button>
    </div>
    <div className={styles.goalPickerControls}><label><input type="checkbox" checked={selectedAllVisible} disabled={!visible.length} onChange={e=>{const ids=visible.map(s=>s.id);setSelectedIds(prev=>e.target.checked?[...new Set([...prev,...ids])]:prev.filter(id=>!ids.includes(id)))}}/>全选本页</label><span>已选 {selected.length} 家</span><button type="button" onClick={()=>setSelectedIds([])}>清空选择</button></div>
    <div className={styles.goalPickerResults}>
     {visible.map(s=><label key={s.id} className={styles.goalPickerStore}><input type="checkbox" checked={selectedIds.includes(s.id)} onChange={()=>toggle(s.id)}/><span><strong>{s.name}</strong><small>{s.platform} · {s.region} · {s.type} · {currencyBySite(s.region)||"币种待确认"}</small></span></label>)}
     {!visible.length?<p className={styles.goalHint}>没有匹配的已绑定店铺，请调整筛选条件。</p>:null}
    </div>
    <footer className={styles.goalPickerFooter}><span>第 {currentPage}/{count} 页 · 每页 {pageSize} 家</span><div><button type="button" disabled={currentPage===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>上一页</button><button type="button" disabled={currentPage===count} onClick={()=>setPage(p=>Math.min(count,p+1))}>下一页</button><button type="button" className={styles.primary} onClick={()=>{setShopOpen(false);setError("")}}>确定（{selected.length}）</button></div></footer>
   </section>
  </div>:null}
 </form>;
}
