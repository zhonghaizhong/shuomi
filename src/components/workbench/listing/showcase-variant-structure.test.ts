import {expect,it} from "vitest";
import {initialVariantStructure,variantStructureImpact,variantStructureValidation} from "./showcase-variant-structure";
const original=[
 {sku:"a",label:"Navy 8",color:"Navy",size:"US 8",image:"/assets/navy.jpg"},
 {sku:"b",label:"Navy 9",color:"Navy",size:"US 9",image:"/assets/navy.jpg"},
 {sku:"c",label:"Black 8",color:"Black",size:"US 8",image:"/assets/black.jpg"},
 {sku:"d",label:"Black 9",color:"Black",size:"US 9",image:"/assets/black.jpg"}
];
it("preserves source SKU identities when changing a variant display name",()=>{
 const draft=initialVariantStructure(original);
 const renamed={...draft,dimensions:draft.dimensions.map((g,i)=>i?g:{...g,values:g.values.map(v=>v.label==="Navy"?{...v,label:"Dark Navy"}:v)})};
 expect(variantStructureValidation(renamed)).toEqual([]);
 expect(variantStructureImpact(original,renamed)).toEqual({retained:4,added:[],removed:[],renamed:true,changed:true});
 expect(original[0].color).toBe("Navy");
});
it("previews additions and retirement without deleting original SKU records",()=>{
 const draft=initialVariantStructure(original);
 const changed={...draft,dimensions:draft.dimensions.map((g,i)=>i?g:{...g,values:[...g.values.filter(v=>v.label!=="Black"),{id:"new:red",label:"Red"}]})};
 const impact=variantStructureImpact(original,changed);
 expect(impact.retained).toBe(2);
 expect(impact.added).toEqual(["Red / US 8","Red / US 9"]);
 expect(impact.removed).toEqual(["c","d"]);
 expect(original).toHaveLength(4);
});
it("rejects duplicate, empty and missing variant values",()=>{
 const originalDraft=initialVariantStructure(original);
 expect(variantStructureValidation(originalDraft)).toEqual([]);
 const repeated={...originalDraft,dimensions:originalDraft.dimensions.map((g,i)=>i?g:{...g,values:[...g.values,{id:"new",label:"navy"}]})};
 expect(variantStructureValidation(repeated)).toContain("颜色存在重复的变体值");
 const empty={...originalDraft,dimensions:originalDraft.dimensions.map((g,i)=>i?{...g,values:[]}:g)};
 expect(variantStructureValidation(empty)).toContain("尺码至少保留一个值");
});
