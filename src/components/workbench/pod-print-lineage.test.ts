import {beforeEach,describe,expect,it,vi} from "vitest";
import {bindPodPrintToVariant,findPodPrintForOrderLine,freezePodOrderLine,
 readPodPrintLineage,registerPodPrint,reviewPodPrint,type PodPrintVersion} from "./pod-print-lineage";
const org="POD-ORG-TEST",member="member-1";
const image=(id:string,hash:string):PodPrintVersion=>({
 printId:id,version:1,originPrintId:"butterfly-peony-original",
 name:id,sourceBatchId:"POD 服装演示批次",sourceKind:"图片裂变",
 assetPath:"/assets/pod-prints/"+id+".png",sha256:hash.repeat(64),
 mimeType:"image/png",width:1024,height:1024,createdAt:"2026-11-26T00:00:00.000Z"
});
beforeEach(()=>sessionStorage.clear());
describe("POD print identity and fulfillment lineage",()=>{
 it("stores 3 distinct fission prints and gates them independently",()=>{
  const names=["mono","warm","cluster"];
  for(const [i,name] of names.entries())registerPodPrint(org,member,image(name,String(i+1)));
  expect(readPodPrintLineage(org,member).reviews.map(r=>r.status)).toEqual(["待审核","待审核","待审核"]);
  expect(()=>bindPodPrintToVariant(org,member,"hoodie","black-m","mono",1)).toThrow(/尚未通过审核/);
  reviewPodPrint(org,member,"mono",1,"审核通过");
  bindPodPrintToVariant(org,member,"hoodie","black-m","mono",1);
  bindPodPrintToVariant(org,member,"tee","black-m","mono",1);
  expect(readPodPrintLineage(org,member).bindings).toHaveLength(2);
  expect(()=>registerPodPrint(org,member,{...image("mono","9"),printId:"mono"})).toThrow(/不可覆盖/);
  expect(()=>reviewPodPrint(org,member,"mono",1,"退回重做")).toThrow(/不可覆盖/);
 });
 it("keeps order snapshot stable after variant print changes",()=>{
  registerPodPrint(org,member,image("mono","a"));
  registerPodPrint(org,member,image("warm","b"));
  reviewPodPrint(org,member,"mono",1,"审核通过");
  reviewPodPrint(org,member,"warm",1,"审核通过");
  bindPodPrintToVariant(org,member,"tee","black-m","mono",1);
  const before=freezePodOrderLine(org,member,{orderId:"O-12",orderLineId:"L-1",
   platform:"SHEIN",externalOrderId:"S-123",productId:"tee",variantId:"black-m"});
  bindPodPrintToVariant(org,member,"tee","black-m","warm",1);
  const fromOrder=findPodPrintForOrderLine(org,member,"O-12","L-1");
  expect(fromOrder?.print.printId).toBe("mono");
  expect(fromOrder?.order.sha256).toBe("a".repeat(64));
  expect(freezePodOrderLine(org,member,{orderId:"O-12",orderLineId:"L-1",
   platform:"SHEIN",externalOrderId:"S-123",productId:"tee",variantId:"black-m"})).toEqual(before);
  expect(readPodPrintLineage(org,member).bindings[0].printId).toBe("warm");
 });
 it("keeps two organizations isolated and fails closed on unknown order",()=>{
  registerPodPrint(org,member,image("mono","f"));
  expect(readPodPrintLineage("OTHER",member).prints).toHaveLength(0);
  expect(findPodPrintForOrderLine(org,member,"missing","line")).toBeNull();
 });
});
