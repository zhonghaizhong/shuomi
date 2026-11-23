// @vitest-environment jsdom
import {beforeEach,describe,expect,it} from "vitest";
import {createOwnProductBatch,readOwnProductBatches,readOwnProducts,saveOwnProduct,listOwnPendingProducts,listOwnReadyProducts,updateOwnProductAfterReview,mergeOptimizedOwnProduct,applyConfirmedSourceOptimization} from "./showcase-own-product-data";
describe("own product intake and batch visibility",()=>{
 beforeEach(()=>sessionStorage.clear());
 it("creates a batch, saves a multi-SKU product, and reads it through the same store",()=>{
  const batch=createOwnProductBatch("org-A","user-1","秋季新品");
  const saved=saveOwnProduct("org-A","user-1",batch.id,{
   name:"棉质T恤",source:"上传资料",status:"入库待完善",missing:["SKU 2 商品图片"],
   skus:[{id:1,name:"黑色 M",description:"纯棉",images:["data:image/png;base64,a"]},{id:2,name:"白色 L",description:"",images:[]}],
   agent:"",template:""
  });
  expect(readOwnProductBatches("org-A","user-1")[0].productCount).toBe(1);
  expect(readOwnProducts("org-A","user-1")[0]).toMatchObject({id:saved.id,batchId:batch.id,status:"入库待完善"});
  expect(readOwnProducts("org-A","user-1")[0].skus).toHaveLength(2);
 });
 it("does not disclose batches or products to other users or organizations",()=>{
  const b=createOwnProductBatch("org-A","user-1","专属批次");
  saveOwnProduct("org-A","user-1",b.id,{name:"杯子",source:"上传资料",status:"已入库",missing:[],skus:[{id:1,name:"单SKU",description:"500ml",images:["data:mock"]}],agent:"",template:""});
  expect(readOwnProductBatches("org-A","user-2")).toEqual([]);
  expect(readOwnProducts("org-A","user-2")).toEqual([]);
  expect(readOwnProductBatches("org-B","user-1")).toEqual([]);
  expect(readOwnProducts("org-B","user-1")).toEqual([]);
  expect(()=>saveOwnProduct("org-B","user-1",b.id,{name:"错误",source:"上传资料",status:"已入库",missing:[],skus:[{id:1,name:"单SKU",description:"",images:[]}],agent:"",template:""})).toThrow();
 });
 it("keeps an existing batch unchanged when an insert fails",()=>{
  const b=createOwnProductBatch("org-A","user-1","A");
  expect(()=>createOwnProductBatch("org-A","user-1","A")).toThrow();
  expect(readOwnProductBatches("org-A","user-1")).toHaveLength(1);
  expect(readOwnProducts("org-A","user-1")).toHaveLength(0);
  expect(b.productCount).toBe(0);
 });
 it("keeps initial Shuomi intake drafts separate from platform missing stage",()=>{
  const b=createOwnProductBatch("org-A","user-1","待检测");
  const item=saveOwnProduct("org-A","user-1",b.id,{name:"保温杯",source:"上传资料",status:"入库待完善",missing:["SKU 1 基础资料"],skus:[{id:1,name:"500ml",description:"",images:["data:mock"]}],agent:"",template:""});
  expect(listOwnPendingProducts("org-A","user-1").map(x=>x.id)).toContain(item.id);
  expect(listOwnReadyProducts("org-A","user-1")).toHaveLength(0);
  const stillPending=updateOwnProductAfterReview("org-A","user-1",item.id,[{id:1,name:"500ml",description:"",images:["data:mock"]}]);
  expect(stillPending.status).toBe("入库待完善");
  const ready=updateOwnProductAfterReview("org-A","user-1",item.id,[{id:1,name:"500ml",description:"不锈钢 500ml，售价99元",images:["data:mock"]}]);
  expect(ready.status).toBe("已入库");
  expect(listOwnReadyProducts("org-A","user-1").map(x=>x.id)).toContain(item.id);
  expect(listOwnPendingProducts("org-A","user-1")).toHaveLength(0);
 });

 it("protects price, stock, SKU identity, mixed price text, and intake metadata during optimization",()=>{
  const b=createOwnProductBatch("org-A","user-1","迭代商品");
  const p=saveOwnProduct("org-A","user-1",b.id,{name:"原商品",source:"上传资料",status:"已入库",missing:[],agent:"",template:"",skus:[
   {id:1,name:"旧标题",description:"纯棉，价格99元，现货10件",images:["old-image"],price:"99",stock:10,skuCode:"SKU-A"}
  ]});
  const merged=mergeOptimizedOwnProduct(p,{name:"优化标题",skus:[{id:1,name:"新标题",description:"售价2元，库存0",images:["optimized-image"],price:"2",stock:0,skuCode:"REPLACED"}]});
  expect(merged).toMatchObject({id:p.id,batchId:b.id,name:"优化标题",status:"已入库"});
  expect(merged.skus[0]).toMatchObject({name:"新标题",images:["optimized-image"],description:"纯棉，价格99元，现货10件",price:"99",stock:10,skuCode:"SKU-A"});
 });
 it("never rewrites on missing, invalid or premature success proof",()=>{
  const b=createOwnProductBatch("org-A","user-1","安全测试");
  const p=saveOwnProduct("org-A","user-1",b.id,{name:"原标题",source:"上传资料",status:"已入库",missing:[],agent:"",template:"",skus:[{id:1,name:"SKU",description:"99元",images:["original"],price:"99",stock:4}]});
  const proposed={name:"新标题",skus:[{id:1,name:"新SKU",price:"0",stock:0,images:["optimized"]}]};
  expect(()=>applyConfirmedSourceOptimization("org-A","user-1",p.id,proposed,null)).toThrow();
  expect(()=>applyConfirmedSourceOptimization("org-A","user-1",p.id,proposed,{taskId:"TASK",externalProductId:"",acceptedAt:new Date().toISOString(),platform:"SHEIN",verifiedBy:"platform-callback"})).toThrow();
  expect(readOwnProducts("org-A","user-1")[0].name).toBe("原标题");
  const verified={taskId:"TASK",externalProductId:"SHEIN-PRODUCT",acceptedAt:new Date().toISOString(),platform:"SHEIN" as const,verifiedBy:"platform-callback" as const};
  expect(()=>applyConfirmedSourceOptimization("org-A","user-2",p.id,proposed,verified)).toThrow();
  const result=applyConfirmedSourceOptimization("org-A","user-1",p.id,proposed,verified);
  expect(result.updated).toBe(true);
  expect(readOwnProducts("org-A","user-1")[0].skus[0]).toMatchObject({price:"99",stock:4,description:"99元",images:["optimized"]});
 });

});
