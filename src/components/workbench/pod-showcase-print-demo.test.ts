import {beforeEach,describe,expect,it} from "vitest";
import {readPodLibrary} from "./pod-asset-library";
import {readPodPrintLineage,registerPodPrint,reviewPodPrint} from "./pod-print-lineage";
import {isShowcasePODScope,showcasePODOriginalAsset,showcasePODReviewPrints} from "./pod-showcase-print-demo";

beforeEach(()=>sessionStorage.clear());

describe("GitHub-backed POD print demo",()=>{
 it("keeps exactly one source print in My Assets on every new browser session",()=>{
  expect(isShowcasePODScope("SM-ENT-000001","admin")).toBe(true);
  expect(readPodLibrary("SM-ENT-000001","admin").filter(x=>x.readonly)).toEqual([showcasePODOriginalAsset]);
  sessionStorage.clear();
  expect(readPodLibrary("SM-ENT-000001","admin").filter(x=>x.readonly)).toEqual([showcasePODOriginalAsset]);
  expect(readPodLibrary("ANOTHER-ORG","admin")).toEqual([]);
  expect(readPodLibrary("SM-ENT-000001","colleague01")).toEqual([]);
 });
 it("defines three distinct real 1254px archived fission designs, initially pending review",()=>{
  expect(showcasePODReviewPrints).toHaveLength(3);
  const uniqueFiles=new Set(showcasePODReviewPrints.map(p=>p.assetPath));
  expect(uniqueFiles.size).toBe(3);
  const uniqueHashes=new Set(showcasePODReviewPrints.map(p=>p.sha256));
  expect(uniqueHashes.size).toBe(3);
  for(const p of showcasePODReviewPrints){
   expect(p.originPrintId).toBe(showcasePODOriginalAsset.originPrintId);
   expect(p.assetPath).toMatch(/^\/assets\/pod-prints\/v1\/[-a-z]+\.webp$/);
   expect(p.sha256).toMatch(/^[a-f0-9]{64}$/);
   expect([p.width,p.height,p.version]).toEqual([1254,1254,1]);
   registerPodPrint("SM-ENT-000001","admin",p);
  }
  expect(readPodPrintLineage("SM-ENT-000001","admin").reviews.map(x=>x.status))
   .toEqual(["待审核","待审核","待审核"]);
  expect(readPodPrintLineage("ANOTHER-ORG","admin").prints).toHaveLength(0);
 });
 it("retains the same archived image when a review state changes locally",()=>{
  const first=showcasePODReviewPrints[0];
  registerPodPrint("SM-ENT-000001","admin",first);
  reviewPodPrint("SM-ENT-000001","admin",first.printId,1,"审核通过");
  const state=readPodPrintLineage("SM-ENT-000001","admin");
  expect(state.reviews[0].status).toBe("审核通过");
  expect(state.prints[0]).toEqual(first);
  expect(()=>registerPodPrint("SM-ENT-000001","admin",{...first,sha256:"f".repeat(64)})).toThrow(/不可覆盖/);
 });
});
