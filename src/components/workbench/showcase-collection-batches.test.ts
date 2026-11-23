// @vitest-environment jsdom
import {beforeEach,describe,expect,it} from "vitest";
import {addDemoCollectionBatch,readDemoCollectionBatches} from "./showcase-collection-batches";

describe("demo 1688 collection batches are private to each account and company",()=>{
 beforeEach(()=>sessionStorage.clear());
 it("seeds exactly 10 preview products only for the default-enterprise admin",()=>{
  const batches=readDemoCollectionBatches("SM-ENT-000001","admin");
  expect(batches).toHaveLength(1);
  expect(batches[0].source).toBe("1688");
  expect(batches[0].products).toHaveLength(10);
  expect(batches[0].demo).toBe(true);
  expect(readDemoCollectionBatches("SM-ENT-000001","colleague01")).toHaveLength(0);
  expect(readDemoCollectionBatches("SM-ENT-000002","admin")).toHaveLength(0);
 });
 it("isolates batches by both enterprise and account, including admin access",()=>{
  const a=addDemoCollectionBatch("SM-ENT-000001","colleague01","1688","指定商品",["https://detail.1688.com/offer/1.html"]);
  const b=addDemoCollectionBatch("SM-ENT-000002","admin","1688","按关键词",["T恤"]);
  expect(a?.ownerMemberId).toBe("colleague01");
  expect(b?.organizationId).toBe("SM-ENT-000002");
  expect(readDemoCollectionBatches("SM-ENT-000001","colleague01").map(x=>x.id)).toContain(a?.id);
  expect(readDemoCollectionBatches("SM-ENT-000001","admin",true).map(x=>x.id)).not.toContain(a?.id);
  expect(readDemoCollectionBatches("SM-ENT-000002","admin").map(x=>x.id)).toEqual([b?.id]);
  expect(readDemoCollectionBatches("SM-ENT-000002","colleague01")).toHaveLength(0);
 });
});
