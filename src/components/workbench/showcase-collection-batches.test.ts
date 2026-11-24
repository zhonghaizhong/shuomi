// @vitest-environment jsdom
import {beforeEach,describe,expect,it} from "vitest";
import {addDemoCollectionBatch,readDemoCollectionBatches} from "./showcase-collection-batches";

describe("demo marketplace collection batches are private to each account and company",()=>{
 beforeEach(()=>sessionStorage.clear());
 it("seeds the 1688 ten-item batch and five identifiable Amazon US ASINs for the default admin only",()=>{
  const batches=readDemoCollectionBatches("SM-ENT-000001","admin");
  expect(batches).toHaveLength(2);
  const amazon=batches.find(b=>b.source==="Amazon");
  const sourced=batches.find(b=>b.source==="1688");
  expect(sourced?.products).toHaveLength(10);
  expect(amazon?.products).toHaveLength(5);
  expect(amazon?.demo).toBe(true);
  expect(amazon?.products.map(p=>p.sku)).toEqual(["B00TTD9BRC","B07WRKXQ8W","B00008GKD3","B0CFPJYX7P","B00NTCHCU2"]);
  expect(amazon?.products.every(p=>p.demoSourceLink==="https://www.amazon.com/dp/"+p.sku)).toBe(true);
  expect(readDemoCollectionBatches("SM-ENT-000001","colleague01")).toHaveLength(0);
  expect(readDemoCollectionBatches("SM-ENT-000002","admin")).toHaveLength(0);
 });
 it("adds the Amazon demo to an already-populated admin session only once",()=>{
  const key="shuomi:demo-collection-batches-v1:SM-ENT-000001";
  sessionStorage.setItem(key,JSON.stringify([{id:"EXISTING",organizationId:"SM-ENT-000001",ownerMemberId:"admin",source:"1688",method:"在线采集",name:"原有批次",createdAt:"2026-11-23 12:00",products:[],status:"已采集 · 待上传",demo:true}]));
  expect(readDemoCollectionBatches("SM-ENT-000001","admin").map(b=>b.id)).toEqual(["SIM-AMAZON-US-5-20261124","EXISTING"]);
  expect(readDemoCollectionBatches("SM-ENT-000001","admin")).toHaveLength(2);
  expect(readDemoCollectionBatches("SM-ENT-000001","colleague01")).toHaveLength(0);
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
