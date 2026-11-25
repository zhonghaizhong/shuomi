// @vitest-environment jsdom
import {beforeEach,describe,expect,it} from "vitest";
import {readPreferredCandidates,submitPreferredDemoApplication,simulatePreferredReview,completePreferredSecondaryOptimizationDemo,readDemoSelectedCatalog} from "./preferred-application-store";
import {SHUOMI_ADAPTATION_TEMPLATE_NAME,SHUOMI_ADAPTATION_TEMPLATE_ID} from "./showcase-agent-template-store";
import {createOwnProductBatch,readOwnProductBatches,readOwnProducts,saveOwnProduct,listOwnPendingProducts,listOwnReadyProducts,updateOwnProductAfterReview,approveOwnProductIntake,mergeOptimizedOwnProduct,applyConfirmedSourceOptimization} from "./showcase-own-product-data";
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
  expect(ready.status).toBe("待审核");
  expect(listOwnReadyProducts("org-A","user-1")).toHaveLength(0);
  const approved=approveOwnProductIntake("org-A","user-1",item.id);
  expect(approved.status).toBe("已入库");
  expect(listOwnReadyProducts("org-A","user-1").map(x=>x.id)).toContain(item.id);
  expect(listOwnPendingProducts("org-A","user-1")).toHaveLength(0);
 });

 it("requires review approval after complete first-stage intake and isolates account permissions",()=>{
  const batch=createOwnProductBatch("org-A","user-1","待审核新款");
  const draft=saveOwnProduct("org-A","user-1",batch.id,{name:"白色T恤",source:"上传资料",status:"待审核",missing:[],skus:[{id:1,name:"白色M",description:"纯棉",images:["image"]}],agent:"",template:""});
  expect(()=>approveOwnProductIntake("org-A","user-2",draft.id)).toThrow();
  expect(listOwnReadyProducts("org-A","user-1")).toEqual([]);
  expect(approveOwnProductIntake("org-A","user-1",draft.id).status).toBe("已入库");
  expect(()=>approveOwnProductIntake("org-A","user-1",draft.id)).toThrow();
  expect(listOwnReadyProducts("org-A","user-1")).toHaveLength(1);
 });
 it("allows all approved own products to apply before official secondary optimization",()=>{
  const org="org-A",member="user-1";
  const batch=createOwnProductBatch(org,member,"优选资质");
  const sourceSku={id:1,name:"  棉质 T恤  ",description:"100%棉，黑色",images:["product-image"]};
  const builtIn=saveOwnProduct(org,member,batch.id,{
   name:"棉质 T 恤",source:"上传资料",status:"待审核",missing:[],
   skus:[sourceSku],agent:"商品优化智能体",template:SHUOMI_ADAPTATION_TEMPLATE_NAME
  });
  expect(builtIn.templateId).toBe(SHUOMI_ADAPTATION_TEMPLATE_ID);
  expect(builtIn.optimizationMode).toBe("shuomi-template-demo");
  expect(builtIn.originalSkus?.[0].description).toBe(sourceSku.description);
  expect(builtIn.skus[0].description).toBe("商品简介："+sourceSku.description);
  expect(readPreferredCandidates(org,member).find(x=>x.product.id===builtIn.id)).toBeUndefined();
  approveOwnProductIntake(org,member,builtIn.id);
  expect(readPreferredCandidates(org,member).find(x=>x.product.id===builtIn.id)?.status).toBe("待申请");
  const unrelated=saveOwnProduct(org,member,batch.id,{
   name:"另一个模板",source:"上传资料",status:"待审核",missing:[],
   skus:[sourceSku],agent:"商品优化智能体",template:"测试模板"
  });
  approveOwnProductIntake(org,member,unrelated.id);
  expect(readPreferredCandidates(org,member).find(x=>x.product.id===unrelated.id)?.status).toBe("待申请");
  const forged=saveOwnProduct(org,member,batch.id,{
   name:"伪造ID",source:"上传资料",status:"待审核",missing:[],
   skus:[sourceSku],agent:"商品优化智能体",template:"测试模板",templateId:SHUOMI_ADAPTATION_TEMPLATE_ID,
   optimizationMode:"shuomi-template-demo"
  });
  approveOwnProductIntake(org,member,forged.id);
  expect(readPreferredCandidates(org,member).find(x=>x.product.id===forged.id)?.status).toBe("待申请");
 });
 it("only promotes approved application after its separate official secondary optimization",()=>{
  const org="org-second",member="user-1";
  const batch=createOwnProductBatch(org,member,"二次优化测试");
  const product=saveOwnProduct(org,member,batch.id,{
   name:"待申请商品",source:"上传资料",status:"待审核",missing:[],
   agent:"",template:"",skus:[{id:1,name:"商品主款",description:"商品资料",images:["image"]}]
  });
  approveOwnProductIntake(org,member,product.id);
  expect(readPreferredCandidates(org,member).find(c=>c.product.id===product.id)?.status).toBe("待申请");
  const application=submitPreferredDemoApplication(org,member,[product.id],{
   stock:"200",moq:"1",dispatch:"48小时内",origin:"浙江",pricing:"",returns:"质量问题可换货"
  });
  expect(readPreferredCandidates(org,member).find(c=>c.product.id===product.id)?.status).toBe("审核中");
  expect(readDemoSelectedCatalog(org,member)).toHaveLength(0);
  simulatePreferredReview(org,member,application.id,"已通过");
  expect(readPreferredCandidates(org,member).find(c=>c.product.id===product.id)?.status).toBe("待二次优化");
  expect(readDemoSelectedCatalog(org,member)).toHaveLength(0);
  const optimized=completePreferredSecondaryOptimizationDemo(org,member,application.id);
  expect(optimized.secondaryOptimization).toBe("已完成");
  expect(optimized.products[0].versionName).toContain("硕米适配");
  expect(readPreferredCandidates(org,member).find(c=>c.product.id===product.id)?.status).toBe("已入选");
  expect(readDemoSelectedCatalog(org,member)).toHaveLength(1);
  expect(readOwnProducts(org,member)[0].skus[0].description).toBe("商品资料");
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
  expect(result.updated).toBe(false);
  expect(result.reason).toContain("独立的数据集版本");
  expect(readOwnProducts("org-A","user-1")[0].name).toBe("原标题");
  expect(readOwnProducts("org-A","user-1")[0].skus[0]).toMatchObject({price:"99",stock:4,description:"99元",images:["original"]});
 });

});
