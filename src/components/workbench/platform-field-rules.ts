/** Platform-aware field rules for the product and shared variant layers.
 * Rule sets are versioned and scoped to platform/site/category. The Shuomi
 * preview is a starter configuration, NOT a claim about external API schemas.
 * A production adapter must load approved per-platform rules from the server.
 */
export type FieldRequirement="必填"|"选填";
export type FieldLevel="商品公用信息"|"变体公用信息";
export type PlatformField={
 key:string;label:string;level:FieldLevel;requirement:FieldRequirement;
 description?:string;
};
export type PlatformFieldRules={
 platform:string;site:string;category:string;version:string;
 source:"系统演示规则"|"平台已核实规则";
 fields:PlatformField[];
};
export type PlatformFieldIssues={product:string[];variants:Array<{skuId:number;missing:string[]}>};
export type AdaptationInput={
 product:{name:string;description:string;images:string[];category?:string;brand?:string};
 variants:Array<{id:number;name:string;description:string;images:string[];skuCode?:string;price?:string;stock?:number}>;
};
const starterFields:PlatformField[]=[
 {key:"name",label:"商品名称",level:"商品公用信息",requirement:"必填"},
 {key:"description",label:"商品描述",level:"商品公用信息",requirement:"必填"},
 {key:"images",label:"商品图片",level:"商品公用信息",requirement:"必填"},
 {key:"category",label:"商品类目",level:"商品公用信息",requirement:"选填",description:"需以目标平台实际类目规则为准"},
 {key:"brand",label:"品牌",level:"商品公用信息",requirement:"选填"},
 {key:"name",label:"变体名称",level:"变体公用信息",requirement:"必填"},
 {key:"images",label:"变体图片",level:"变体公用信息",requirement:"必填"},
 {key:"skuCode",label:"SKU编码",level:"变体公用信息",requirement:"选填"},
 {key:"price",label:"变体价格",level:"变体公用信息",requirement:"选填"},
 {key:"stock",label:"变体库存",level:"变体公用信息",requirement:"选填"}
];
export function getPlatformFieldRules(platform:string,site="默认站点",category="通用类目"):PlatformFieldRules{
 // Do not reuse Shuomi rules for SHEIN or any other external destination.
 return {
  platform,site,category,version:"preview-1",
  source:"系统演示规则",
  fields:platform==="硕米平台"?starterFields.map(field=>({...field})):[]
 };
}
export function validatePlatformFieldRules(input:AdaptationInput,rules:PlatformFieldRules):PlatformFieldIssues{
 if(!rules.fields.length)return {product:["目标平台缺少已配置的字段规则，不能确认完成适配"],variants:[]};
 const present=(value:unknown)=>Array.isArray(value)?value.some(x=>typeof x==="string"&&x.trim().length>0):
  typeof value==="string"?value.trim().length>0:
  typeof value==="number"?Number.isFinite(value):value!==null&&value!==undefined;
 const product=rules.fields.filter(f=>f.level==="商品公用信息"&&f.requirement==="必填")
  .filter(f=>!present(input.product[f.key as keyof AdaptationInput["product"]])).map(f=>f.label);
 const variants=input.variants.map(sku=>({
  skuId:sku.id,
  missing:rules.fields.filter(f=>f.level==="变体公用信息"&&f.requirement==="必填")
   .filter(f=>!present(sku[f.key as keyof typeof sku])).map(f=>f.label)
 }));
 if(!input.variants.length)product.push("至少一个变体");
 return {product,variants:variants.filter(s=>s.missing.length>0)};
}
export function isPlatformAdaptationComplete(issues:PlatformFieldIssues):boolean{
 return issues.product.length===0&&issues.variants.length===0;
}
