/** Versioned attribute schema supplied by an authorized platform/category integration.
 * This module deliberately contains NO invented marketplace category attributes. */
export type FieldScope="common"|"shared"|"variant"|"sku";
export type FieldRequirement="required"|"optional";
export type PlatformField={id:string;label:string;scope:FieldScope;requirement:FieldRequirement;kind:"text"|"number"|"enum";options?:string[];maxLength?:number;aiEditable?:boolean};
export type PlatformFieldSchema={
 platform:string;region:string;storeType:string;categoryPath:string;ruleVersion:string;
 source:"official"|"verified-import";fields:PlatformField[];
};
export type ScopedFieldValues=Record<string,string>;
export function scopedFieldKey(scope:FieldScope,fieldId:string,entityId="all"):string{
 return JSON.stringify([scope,entityId,fieldId]);
}
export function fieldSchemaMatches(schema:PlatformFieldSchema|undefined,target:{platform:string;region:string;storeType:string;categoryPath:string}):boolean{
 return Boolean(schema&&schema.ruleVersion&&schema.fields.length&&schema.platform===target.platform&&schema.region===target.region&&schema.storeType===target.storeType&&schema.categoryPath===target.categoryPath);
}
export function validatePlatformFields(schema:PlatformFieldSchema,values:ScopedFieldValues,entities:{variantIds:string[];skuIds:string[]}):string[]{
 const errors:string[]=[];
 const ids=new Set<string>();
 for(const field of schema.fields){
  if(!field.id||ids.has(field.id)||!["common","shared","variant","sku"].includes(field.scope)){errors.push("平台属性规则包含无效或重复的字段");continue}
  ids.add(field.id);
  const instances=field.scope==="variant"?entities.variantIds:field.scope==="sku"?entities.skuIds:["all"];
  for(const entityId of instances){
   const value=values[scopedFieldKey(field.scope,field.id,entityId)]?.trim()??"";
   if(field.requirement==="required"&&!value){errors.push(field.label+"：必填");continue}
   if(!value)continue;
   if(field.maxLength&&value.length>field.maxLength)errors.push(field.label+"：超出长度限制");
   if(field.kind==="number"&&!Number.isFinite(Number(value)))errors.push(field.label+"：必须是数字");
   if(field.kind==="enum"&&(!field.options?.length||!field.options.includes(value)))errors.push(field.label+"：不属于平台合法选项");
  }
 }
 return errors;
}
export function categoryFieldImpact(oldSchema:PlatformFieldSchema|undefined,newSchema:PlatformFieldSchema|undefined){
 if(!oldSchema||!newSchema)return {ready:false as const,retained:[],removed:[],added:[]};
 const source=new Map(oldSchema.fields.map(f=>[f.id,f]));
 const dest=new Map(newSchema.fields.map(f=>[f.id,f]));
 const compatible=(a:PlatformField,b:PlatformField)=>a.scope===b.scope&&a.kind===b.kind&&(a.kind!=="enum"||JSON.stringify(a.options??[])===JSON.stringify(b.options??[]));
 return {ready:true as const,retained:newSchema.fields.filter(f=>{const old=source.get(f.id);return old&&compatible(old,f)}).map(f=>f.id),
 removed:oldSchema.fields.filter(f=>{const next=dest.get(f.id);return !next||!compatible(f,next)}).map(f=>f.id),
 added:newSchema.fields.filter(f=>{const old=source.get(f.id);return !old||!compatible(old,f)}).map(f=>f.id)};
}
