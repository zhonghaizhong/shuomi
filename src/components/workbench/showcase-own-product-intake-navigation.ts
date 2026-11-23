"use client";
/** Scoped browser-session handoff for the own-product intake showcase.
 * This is NOT an authorization credential. Production pages must use authenticated server scope.
 */
export type OwnIntakeStage="pending"|"review";
export type OwnIntakeNavigation={organizationId:string;memberId:string;stage:OwnIntakeStage;itemId?:string};
const storageKey="shuomi:own-product-intake-navigation-v1";
export function saveOwnIntakeNavigation(value:OwnIntakeNavigation){
 if(typeof window==="undefined")return;
 sessionStorage.setItem(storageKey,JSON.stringify(value));
}
export function readOwnIntakeNavigation(stage:OwnIntakeStage):OwnIntakeNavigation|null{
 if(typeof window==="undefined")return null;
 try{
  const raw:unknown=JSON.parse(sessionStorage.getItem(storageKey)||"null");
  if(!raw||typeof raw!=="object")return null;
  const p=raw as Record<string,unknown>;
  if(p.stage!==stage||typeof p.organizationId!=="string"||!p.organizationId||typeof p.memberId!=="string"||!p.memberId)return null;
  return {organizationId:p.organizationId,memberId:p.memberId,stage,itemId:typeof p.itemId==="string"?p.itemId:undefined};
 }catch{return null}
}
