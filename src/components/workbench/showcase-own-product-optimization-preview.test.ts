import {beforeEach,expect,it} from "vitest";
import {createOwnProductBatch,readOwnProducts,simulateFiveOwnProductIntakes,installSixProductOptimizationDemo,checkOwnProductSkus,updateOwnProductAfterReview,approveOwnProductIntake} from "./showcase-own-product-data";
import {previewOwnProductOptimization} from "./showcase-own-product-optimization-preview";
import {writeAgentPreviewTemplates} from "./showcase-agent-template-store";

beforeEach(()=>sessionStorage.clear());

it("simulates the selected saved template with four review and two missing products, without claiming real image generation",()=>{
 const org="fixture-org",member="fixture-member";
 const batch=createOwnProductBatch(org,member,"自有商品测试批次");
 writeAgentPreviewTemplates(org,member,"商品优化智能体",[{id:"template-1",name:"测试模板",createdAt:"2026-11-24",config:{skills:["商品标题规范"],knowledge:[],imageOptimization:true}}]);
 expect(simulateFiveOwnProductIntakes(org,member,batch.id,"测试模板")).toEqual({created:6,pending:2,review:4});
 const products=readOwnProducts(org,member);
 expect(products.filter(p=>p.status==="入库待完善")).toHaveLength(2);
 expect(products.filter(p=>p.status==="待审核")).toHaveLength(4);
 for(const product of products){
  const result=previewOwnProductOptimization(org,member,product);
  expect(result?.templateFound).toBe(true);
  expect(result?.template).toBe("测试模板");
  expect(result?.readyForReview).toBe(checkOwnProductSkus(product.skus).length===0);
  expect(result?.steps.find(s=>s.name==="图片优化配置")?.result).toContain("未生成或修复新图");
 }
 expect(simulateFiveOwnProductIntakes(org,member,batch.id,"测试模板").created).toBe(0);
 expect(readOwnProducts(org,member)).toHaveLength(6);
});

it("does not use a different member's template configuration or invent missing descriptions",()=>{
 const org="fixture-org",member="fixture-member";
 const batch=createOwnProductBatch(org,member,"自有商品测试批次");
 writeAgentPreviewTemplates(org,"another-member","商品优化智能体",[{id:"other",name:"测试模板",createdAt:"2026-11-24",config:{skills:["private"]}}]);
 simulateFiveOwnProductIntakes(org,member,batch.id,"测试模板");
 const cup=readOwnProducts(org,member).find(p=>p.skus.some(s=>s.skuCode==="SH-OPT-MUG-005"));
 expect(cup).toBeDefined();
 const result=previewOwnProductOptimization(org,member,cup!);
 expect(result?.templateFound).toBe(false);
 expect(result?.proposed[0]?.copy).toBe("");
 expect(result?.remaining.length).toBeGreaterThan(0);
});

it("keeps pending, review and approved statuses separate and never reopens an approved product",()=>{
 const org="state-org",member="state-member";
 const batch=createOwnProductBatch(org,member,"自有商品测试批次");
 simulateFiveOwnProductIntakes(org,member,batch.id,"测试模板");
 const items=readOwnProducts(org,member);
 const cup=items.find(p=>p.skus.some(s=>s.skuCode==="SH-DEMO-CUP-004"))!;
 const reviewed=items.find(p=>p.status==="待审核")!;
 expect(()=>updateOwnProductAfterReview(org,member,reviewed.id,reviewed.skus)).toThrow("只有待完善商品");
 expect(()=>approveOwnProductIntake(org,member,cup.id)).toThrow("待审核");
 const completed=updateOwnProductAfterReview(org,member,cup.id,cup.skus.map(s=>({...s,description:"由用户补充的商品实物说明"})));
 expect(completed.status).toBe("待审核");
 expect(completed.originalSkus?.[0]?.description).toBe("");
 expect(completed.skus[0]?.description).toBe("由用户补充的商品实物说明");
 expect(completed.missing).toEqual([]);
 expect(()=>updateOwnProductAfterReview(org,member,cup.id,cup.skus)).toThrow("只有待完善商品");
 expect(approveOwnProductIntake(org,member,cup.id).status).toBe("已入库");
 expect(()=>updateOwnProductAfterReview(org,member,cup.id,cup.skus)).toThrow("只有待完善商品");
 expect(()=>approveOwnProductIntake(org,member,cup.id)).toThrow("待审核");
 expect(readOwnProducts(org,member).find(p=>p.id===cup.id)?.status).toBe("已入库");
 expect(readOwnProducts(org,member).find(p=>p.id===cup.id)?.originalSkus?.[0]?.description).toBe("");
});

it("rejects an empty image URL as missing and prevents advancing to review",()=>{
 const org="image-org",member="image-member";
 const batch=createOwnProductBatch(org,member,"自有商品测试批次");
 simulateFiveOwnProductIntakes(org,member,batch.id,"测试模板");
 const pending=readOwnProducts(org,member).find(p=>p.status==="入库待完善")!;
 const incomplete=pending.skus.map(s=>({...s,name:"商品名",description:"可信商品描述",images:["  "]}));
 expect(checkOwnProductSkus(incomplete)).toContain("商品名 商品图片");
 const saved=updateOwnProductAfterReview(org,member,pending.id,incomplete);
 expect(saved.status).toBe("入库待完善");
 expect(()=>approveOwnProductIntake(org,member,pending.id)).toThrow("待审核");
});

it("never approves a malformed review product with zero SKUs",()=>{
 const org="empty-org",member="empty-member";
 const batch=createOwnProductBatch(org,member,"自有商品测试批次");
 simulateFiveOwnProductIntakes(org,member,batch.id,"测试模板");
 const review=readOwnProducts(org,member).find(p=>p.status==="待审核")!;
 expect(checkOwnProductSkus([])).toEqual(["至少添加一个 SKU"]);
 const key="shuomi:own-product-records-v1:"+org+":"+member;
 const all=readOwnProducts(org,member).map(p=>p.id===review.id?{...p,skus:[]}:p);
 sessionStorage.setItem(key,JSON.stringify(all));
 expect(()=>approveOwnProductIntake(org,member,review.id)).toThrow("禁止空商品入库");
 expect(readOwnProducts(org,member).find(p=>p.id===review.id)?.status).toBe("待审核");
});

it("refreshes only the requested demo batch and preserves approved products and other batches",()=>{
 const org="refresh-org",member="refresh-member";
 const demoBatch=createOwnProductBatch(org,member,"自有商品测试批次");
 const otherBatch=createOwnProductBatch(org,member,"非测试批次");
 // Preserve an unrelated pending product, plus an approved demo-batch product.
 const key="shuomi:own-product-records-v1:"+org+":"+member;
 const oldSku={id:1,name:"原商品",description:"资料",images:["https://example.test/image.jpg"],skuCode:"OLD-1"};
 const old=(id:string,batchId:string,status:"入库待完善"|"待审核"|"已入库")=>({
  id,batchId,name:"原商品",source:"上传资料",createdAt:"2026-11-24",checkedAt:"2026-11-24",status,
  missing:[],skus:[oldSku],agent:"商品优化智能体",template:"测试模板"
 });
 sessionStorage.setItem(key,JSON.stringify([
  old("demo-pending",demoBatch.id,"入库待完善"),
  old("demo-review",demoBatch.id,"待审核"),
  old("demo-approved",demoBatch.id,"已入库"),
  old("other-pending",otherBatch.id,"入库待完善")
 ]));
 const changed=installSixProductOptimizationDemo(org,member);
 expect(changed).toEqual({created:6,pending:2,review:4,alreadyInstalled:false});
 const products=readOwnProducts(org,member);
 expect(products.filter(p=>p.batchId===demoBatch.id&&p.status==="待审核")).toHaveLength(4);
 expect(products.filter(p=>p.batchId===demoBatch.id&&p.status==="入库待完善")).toHaveLength(2);
 expect(products.some(p=>p.id==="demo-pending")).toBe(false);
 expect(products.some(p=>p.id==="demo-review")).toBe(false);
 expect(products.some(p=>p.id==="demo-approved")).toBe(true);
 expect(products.some(p=>p.id==="other-pending")).toBe(true);
 expect(installSixProductOptimizationDemo(org,member).alreadyInstalled).toBe(true);
 expect(readOwnProducts(org,member)).toHaveLength(8);
 const tee=products.find(p=>p.skus.some(s=>s.skuCode==="SH-OPT-TEE-001"))!;
 expect(tee.skus[0].name).not.toBe(tee.originalSkus?.[0]?.name);
 expect(tee.skus[0].description).not.toBe(tee.originalSkus?.[0]?.description);
 const mug=products.find(p=>p.skus.some(s=>s.skuCode==="SH-OPT-MUG-005"))!;
 expect(mug.missing.some(m=>m.includes("基础资料"))).toBe(true);
 const pouch=products.find(p=>p.skus.some(s=>s.skuCode==="SH-OPT-TRAVEL-006"))!;
 expect(pouch.missing.some(m=>m.includes("商品图片"))).toBe(true);
 expect(pouch.skus).toHaveLength(2);
});
