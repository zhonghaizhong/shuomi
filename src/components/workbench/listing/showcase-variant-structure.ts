import type {ListingVariantDetail} from "./showcase-upload-tasks";

/** Edits are layered on top of immutable source SKU IDs / photo groups.
 * Deletion is a proposed SKU retirement, never a destructive source mutation. */
export type VariantValueDraft={id:string;label:string;sourceId?:string};
export type VariantDimensionDraft={id:"first"|"second";name:string;values:VariantValueDraft[]};
export type VariantStructureDraft={dimensions:VariantDimensionDraft[];revision:number};
const unique=(values:string[])=>[...new Set(values.filter(Boolean))];
export function initialVariantStructure(details:ListingVariantDetail[]):VariantStructureDraft{
 if(!details.length)return {revision:0,dimensions:[]};
 return {revision:0,dimensions:[
  {id:"first",name:"颜色",values:unique(details.map(x=>x.color)).map(label=>({id:"color:"+label.trim().toLowerCase(),label,sourceId:label.trim().toLowerCase()}))},
  ...(unique(details.map(x=>x.size)).length?[{id:"second" as const,name:"尺码",values:unique(details.map(x=>x.size)).map(label=>({id:"size:"+label,label,sourceId:label}))}]:[])
 ]};
}
export function variantStructureValidation(value:VariantStructureDraft):string[]{
 const problems:string[]=[];
 if(value.dimensions.length>2)problems.push("目前仅支持一层或两层变体");
 for(const layer of value.dimensions){
  if(!layer.name.trim())problems.push("变体名称不能为空");
  if(!layer.values.length)problems.push(layer.name+"至少保留一个值");
  if(layer.values.some(v=>!v.label.trim()))problems.push(layer.name+"存在未命名的变体值");
  if(new Set(layer.values.map(v=>v.label.trim().toLocaleLowerCase())).size!==layer.values.length)problems.push(layer.name+"存在重复的变体值");
 }
 return problems;
}
export function variantStructureImpact(original:ListingVariantDetail[],draft:VariantStructureDraft){
 const source=initialVariantStructure(original);
 const originalKeys=new Set(original.map(x=>JSON.stringify([x.color.trim().toLowerCase(),x.size.trim()])));
 const first=draft.dimensions[0]?.values??[];
 const second=draft.dimensions[1]?.values??[{id:"single",label:"",sourceId:""}];
 const currentIds=new Set<string>();
 const added:string[]=[];
 let retained=0;
 for(const a of first)for(const b of second){
  const pair=JSON.stringify([a.sourceId??"new:"+a.id,b.sourceId??"new:"+b.id]);
  if(currentIds.has(pair))continue;
  currentIds.add(pair);
  if(originalKeys.has(pair))retained++;else added.push(a.label+(b.label?" / "+b.label:""));
 }
 const removed=original.filter(x=>!currentIds.has(JSON.stringify([x.color.trim().toLowerCase(),x.size.trim()]))).map(x=>x.sku);
 const renamed=draft.dimensions.some((d,i)=>d.name!==source.dimensions[i]?.name||d.values.some(v=>v.sourceId&&v.label!==source.dimensions[i]?.values.find(x=>x.sourceId===v.sourceId)?.label));
 return {retained,added,removed,renamed,changed:Boolean(added.length||removed.length||renamed)};
}
