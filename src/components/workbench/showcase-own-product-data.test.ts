// @vitest-environment jsdom
import {beforeEach,describe,expect,it} from "vitest";
import {createOwnProductBatch,readOwnProductBatches,readOwnProducts,saveOwnProduct} from "./showcase-own-product-data";
describe("own product intake and batch visibility",()=>{
 beforeEach(()=>sessionStorage.clear());
 it("creates a batch, saves a multi-SKU product, and reads it through the same store",()=>{
  const batch=createOwnProductBatch("org-A","user-1","秋季新品");
  const saved=saveOwnProduct("org-A","user-1",batch.id,{
   name:"棉质T恤",source:"上传资料",status:"待补全",missing:["SKU 2 商品图片"],
   skus:[{id:1,name:"黑色 M",description:"纯棉",images:["data:image/png;base64,a"]},{id:2,name:"白色 L",description:"",images:[]}],
   agent:"",template:""
  });
  expect(readOwnProductBatches("org-A","user-1")[0].productCount).toBe(1);
  expect(readOwnProducts("org-A","user-1")[0]).toMatchObject({id:saved.id,batchId:batch.id,status:"待补全"});
  expect(readOwnProducts("org-A","user-1")[0].skus).toHaveLength(2);
 });
 it("does not disclose batches or products to other users or organizations",()=>{
  const b=createOwnProductBatch("org-A","user-1","专属批次");
  saveOwnProduct("org-A","user-1",b.id,{name:"杯子",source:"上传资料",status:"待上传",missing:[],skus:[{id:1,name:"单SKU",description:"500ml",images:["data:mock"]}],agent:"",template:""});
  expect(readOwnProductBatches("org-A","user-2")).toEqual([]);
  expect(readOwnProducts("org-A","user-2")).toEqual([]);
  expect(readOwnProductBatches("org-B","user-1")).toEqual([]);
  expect(readOwnProducts("org-B","user-1")).toEqual([]);
  expect(()=>saveOwnProduct("org-B","user-1",b.id,{name:"错误",source:"上传资料",status:"待上传",missing:[],skus:[{id:1,name:"单SKU",description:"",images:[]}],agent:"",template:""})).toThrow();
 });
 it("keeps an existing batch unchanged when an insert fails",()=>{
  const b=createOwnProductBatch("org-A","user-1","A");
  expect(()=>createOwnProductBatch("org-A","user-1","A")).toThrow();
  expect(readOwnProductBatches("org-A","user-1")).toHaveLength(1);
  expect(readOwnProducts("org-A","user-1")).toHaveLength(0);
  expect(b.productCount).toBe(0);
 });
});
