"use client";
import {useEffect,useRef} from "react";
import {ShowcaseOwnProductIntakePage} from "./showcase-own-product-intake-page";
import type {OwnIntakeStage} from "./showcase-own-product-intake-navigation";
import css from "./showcase-own-product-intake-modal.module.css";

export function ShowcaseOwnProductIntakeModal({stage,onClose}:{stage:OwnIntakeStage;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  const node=ref.current;const previous=document.activeElement;
  if(node&&!node.open)node.showModal();
  return()=>{if(node?.open)node.close();if(previous instanceof HTMLElement&&previous.isConnected)previous.focus()};
 },[]);
 return <dialog ref={ref} className={css.dialog} aria-label={stage==="pending"?"自有商品待完善":"自有商品待审核"}
   onCancel={e=>{e.preventDefault();onClose()}}
   onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
  <ShowcaseOwnProductIntakePage stage={stage} onClose={onClose}/>
 </dialog>;
}
