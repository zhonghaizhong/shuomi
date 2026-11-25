// @vitest-environment jsdom
import {beforeEach,describe,expect,it} from "vitest";
import {addDemoCollectionBatch,addSelectedCatalogProducts,readDemoCollectionBatches} from "./showcase-collection-batches";
import {selectedCatalogFixtures} from "./showcase-selected-catalog-fixtures";

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
 it("collects selected approved-catalog demos into this member's batch while keeping source and SKU identifiers",()=>{
  const p=selectedCatalogFixtures[0];
  const entry={
   id:"COLLECT-"+p.id,sku:p.skus[0].id,name:p.name,source:"硕米优选（演示） · "+p.supplierName,
   price:"¥"+p.price.toFixed(2)+" 起",status:"演示数据" as const,
   supplyProductId:p.id,supplySkuId:p.skus[0].id,supplierId:p.supplierId,supplierName:p.supplierName,
   supplyVersion:p.version,images:[] as string[],variants:p.skus.map(v=>v.label)
  };
  const first=addSelectedCatalogProducts("tenant-A","seller-1",[entry],{kind:"new",name:"我的优选采集批次"});
  expect(first.source).toBe("硕米优选");
  expect(first.products[0]).toMatchObject({supplyProductId:p.id,supplierId:p.supplierId,supplySkuId:p.skus[0].id});
  expect(first.products[0].images).toEqual([]);
  expect(readDemoCollectionBatches("tenant-A","seller-1").map(b=>b.id)).toContain(first.id);
  expect(readDemoCollectionBatches("tenant-A","seller-2")).toHaveLength(0);
  expect(readDemoCollectionBatches("tenant-B","seller-1")).toHaveLength(0);
  expect(()=>addSelectedCatalogProducts("tenant-A","seller-1",[entry],{kind:"existing",id:first.id})).toThrow("已经存在");
  expect(()=>addSelectedCatalogProducts("tenant-A","seller-2",[entry],{kind:"existing",id:first.id})).toThrow("无权操作");
  const second=selectedCatalogFixtures[1];
  const copied={...entry,id:"COLLECT-"+second.id,name:second.name,sku:second.skus[0].id,
   supplyProductId:second.id,supplySkuId:second.skus[0].id};
  const next=addSelectedCatalogProducts("tenant-A","seller-1",[copied],{kind:"existing",id:first.id});
  expect(next.products).toHaveLength(2);
  expect(readDemoCollectionBatches("tenant-A","seller-1")).toHaveLength(1);
 });

});
