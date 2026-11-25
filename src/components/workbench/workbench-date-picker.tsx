"use client";
import {useState} from "react";
import styles from "./workbench-date-picker.module.css";

/** Shared date-range dropdown: matching the Reports date control across the workbench.
 * Date fields are exposed only inside the popover; callers retain their own filter state.
 */
export function WorkbenchDateRange({label="选择日期",from,to,onChange,utc=false,maxDate}:{label?:string;from:string;to:string;onChange:(from:string,to:string)=>void;utc?:boolean;maxDate?:string}){
 const [open,setOpen]=useState(false);
 const [draftFrom,setDraftFrom]=useState(from);
 const [draftTo,setDraftTo]=useState(to);
 const show=()=>{setDraftFrom(from);setDraftTo(to);setOpen(v=>!v)};
 const valid=(!draftFrom&&!draftTo)||Boolean(draftFrom&&draftTo&&draftFrom<=draftTo&&(!maxDate||draftTo<=maxDate));
 return <div className={styles.control} data-workbench-date-range>
  <button type="button" className={styles.trigger} aria-label={label} aria-expanded={open} onClick={show}>{from&&to?from+" 至 "+to:"全部时间"}</button>
  {open&&<div className={styles.popover} role="group" aria-label={(label.startsWith("选择")?label.slice(2):label)+"范围"}>
   <label>开始日期<input type="date" aria-label={utc?"开始日期（UTC）":"开始日期"} value={draftFrom} max={draftTo||maxDate||undefined} onChange={e=>setDraftFrom(e.target.value)}/></label>
   <label>结束日期<input type="date" aria-label={utc?"结束日期（UTC）":"结束日期"} value={draftTo} min={draftFrom||undefined} max={maxDate||undefined} onChange={e=>setDraftTo(e.target.value)}/></label>
   {!valid&&<p role="alert">请选择完整的日期范围，结束日期不能早于开始日期。</p>}
   <footer><button type="button" onClick={()=>{onChange("","");setOpen(false)}}>全部时间</button><button type="button" className={styles.primary} disabled={!valid} onClick={()=>{onChange(draftFrom,draftTo);setOpen(false)}}>确定</button></footer>
  </div>}
 </div>;
}

/** For schedule configuration: date or clock value remains editable only in the popup. */
export function WorkbenchDateTime({label,value,onChange,kind="datetime-local",disabled=false,optional=false}:{label:string;value:string;onChange:(value:string)=>void;kind?:"date"|"time"|"datetime-local";disabled?:boolean;optional?:boolean}){
 const [open,setOpen]=useState(false);
 const [draft,setDraft]=useState(value);
 const display=value?value.replace("T"," "):"请选择"+label;
 return <div className={styles.control} data-workbench-date-time>
  <button type="button" className={styles.trigger} disabled={disabled} aria-label={"选择"+label} aria-expanded={open} onClick={()=>{setDraft(value);setOpen(v=>!v)}}>{display}</button>
  {open&&!disabled&&<div className={styles.popover} role="group" aria-label={label+"选择"}>
   <label>{label}<input type={kind} aria-label={label} value={draft} onChange={e=>setDraft(e.target.value)}/></label>
   <footer>{optional&&<button type="button" onClick={()=>{onChange("");setOpen(false)}}>清空</button>}<button type="button" className={styles.primary} disabled={!draft&&!optional} onClick={()=>{onChange(draft);setOpen(false)}}>确定</button></footer>
  </div>}
 </div>;
}
