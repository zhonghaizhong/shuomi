import {beforeEach,expect,it} from "vitest";
import {createOwnProductBatch,readOwnProducts,simulateFiveOwnProductIntakes,checkOwnProductSkus,updateOwnProductAfterReview,approveOwnProductIntake} from "./showcase-own-product-data";
import {previewOwnProductOptimization} from "./showcase-own-product-optimization-preview";
import {writeAgentPreviewTemplates} from "./showcase-agent-template-store";

beforeEach(()=>sessionStorage.clear());

it("simulates the selected saved template with three review and two missing products, without claiming real image generation",()=>{
 const org="fixture-org",member="fixture-member";
 const batch=createOwnProductBatch(org,member,"自有商品测试批次");
 writeAgentPreviewTemplates(org,member,"商品优化智能体",[{id:"template-1",name:"测试模板",createdAt:"2026-11-24",config:{skills:["商品标题规范"],knowledge:[],imageOptimization:true}}]);
 expect(simulateFiveOwnProductIntakes(org,member,batch.id,"测试模板")).toEqual({created:5,pending:2,review:3});
 const products=readOwnProducts(org,member);
 expect(products.filter(p=>p.status==="入库待完善")).toHaveLength(2);
 expect(products.filter(p=>p.status==="待审核")).toHaveLength(3);
 for(const product of products){
  const result=previewOwnProductOptimization(org,member,product);
  expect(result?.templateFound).toBe(true);
  expect(result?.template).toBe("测试模板");
  expect(result?.readyForReview).toBe(checkOwnProductSkus(product.skus).length===0);
  expect(result?.steps.find(s=>s.name==="图片优化配置")?.result).toContain("未生成或修复新图");
 }
 expect(simulateFiveOwnProductIntakes(org,member,batch.id,"测试模板").created).toBe(0);
 expect(readOwnProducts(org,member)).toHaveLength(5);
});

it("does not use a different member's template configuration or invent missing descriptions",()=>{
 const org="fixture-org",member="fixture-member";
 const batch=createOwnProductBatch(org,member,"自有商品测试批次");
 writeAgentPreviewTemplates(org,"another-member","商品优化智能体",[{id:"other",name:"测试模板",createdAt:"2026-11-24",config:{skills:["private"]}}]);
 simulateFiveOwnProductIntakes(org,member,batch.id,"测试模板");
 const cup=readOwnProducts(org,member).find(p=>p.skus.some(s=>s.skuCode==="SH-DEMO-CUP-004"));
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
