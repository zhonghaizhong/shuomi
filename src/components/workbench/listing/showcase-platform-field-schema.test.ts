// @vitest-environment jsdom
import {expect,it} from "vitest";
import {categoryFieldImpact,fieldSchemaMatches,scopedFieldKey,validatePlatformFields,findUnambiguousEnumOption,validateAiEnumSelection,type PlatformFieldSchema} from "./showcase-platform-field-schema";
const base:PlatformFieldSchema={
 platform:"SHEIN",region:"美国站",storeType:"全托店",categoryPath:"Shoes / Clogs",ruleVersion:"verified-2026-11",source:"verified-import",
 fields:[
  {id:"material",label:"材质",scope:"common",requirement:"required",kind:"text"},
  {id:"theme",label:"变体主题",scope:"shared",requirement:"required",kind:"enum",options:["Color-Size","Size"]},
  {id:"shade",label:"颜色名称",scope:"variant",requirement:"optional",kind:"text"},
  {id:"size",label:"平台尺码",scope:"sku",requirement:"required",kind:"enum",options:["M8","M9"]}
 ]
};
it("requires a verified matching platform/site/store/category schema",()=>{
 expect(fieldSchemaMatches(base,{platform:"SHEIN",region:"美国站",storeType:"全托店",categoryPath:"Shoes / Clogs"})).toBe(true);
 expect(fieldSchemaMatches(base,{platform:"Amazon",region:"美国站",storeType:"全托店",categoryPath:"Shoes / Clogs"})).toBe(false);
 expect(fieldSchemaMatches(base,{platform:"SHEIN",region:"美国站",storeType:"全托店",categoryPath:"Shoes / Sandals"})).toBe(false);
});
it("validates required and optional fields in four independent scopes",()=>{
 const v={
  [scopedFieldKey("common","material")]:"Cotton",
  [scopedFieldKey("shared","theme")]:"Color-Size",
  [scopedFieldKey("sku","size","A")]:"M8",
  [scopedFieldKey("sku","size","B")]:"M9"
 };
 const entities={variantIds:["black"],skuIds:["A","B"]};
 expect(validatePlatformFields(base,v,entities)).toEqual([]);
 expect(validatePlatformFields(base,{...v,[scopedFieldKey("sku","size","B")]:"invalid"},entities)).toContain("平台尺码：不属于平台合法选项");
 expect(validatePlatformFields(base,{...v,[scopedFieldKey("shared","theme")]:""},entities)).toContain("变体主题：必填");
});
it("previews category migrations without erasing incompatible historical values",()=>{
 const next:PlatformFieldSchema={...base,categoryPath:"Shoes / Sandals",ruleVersion:"new",fields:[
  base.fields[0],{...base.fields[1],options:["Size"]},{id:"sole",label:"鞋底",scope:"common",requirement:"required",kind:"text"}
 ]};
 const diff=categoryFieldImpact(base,next);
 expect(diff.ready).toBe(true);
 if(diff.ready){
  expect(diff.retained).toEqual(["material"]);
  expect(diff.added).toEqual(["theme","sole"]);
  expect(diff.removed).toEqual(["theme","shade","size"]);
 }
 expect(categoryFieldImpact(base,undefined).ready).toBe(false);
});

it("permits AI to choose ONLY an allowed platform dropdown option with evidence",()=>{
 const field={id:"package",label:"包装",scope:"common" as const,requirement:"optional" as const,kind:"enum" as const,aiEditable:true,options:["Single Pack","Bundle Pack"]};
 expect(validateAiEnumSelection(field,"Bundle Pack")).toBe("Bundle Pack");
 expect(validateAiEnumSelection(field,"Invented Pack")).toBe(null);
 expect(findUnambiguousEnumOption(field,"Product ships as Bundle Pack in a box")).toBe("Bundle Pack");
 expect(findUnambiguousEnumOption(field,"Single Pack and Bundle Pack both available")).toBe(null);
 expect(findUnambiguousEnumOption(field,"No packaging information")).toBe(null);
 expect(findUnambiguousEnumOption({...field,aiEditable:false},"Bundle Pack")).toBe(null);
});
