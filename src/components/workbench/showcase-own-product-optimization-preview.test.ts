import {beforeEach,expect,it,vi} from "vitest";
import {createOwnProductBatch,readOwnProducts,simulateFiveOwnProductIntakes,installSixProductOptimizationDemo,importOwnProductDemoImagePack,installGeneratedOwnProductDemoImages,checkOwnProductSkus,updateOwnProductAfterReview,approveOwnProductIntake} from "./showcase-own-product-data";
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
  expect(result?.steps.find(s=>s.name==="图片优化配置")?.result).toContain("未实际调用生图服务");
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
 expect(result?.templateFound).toBe(true);
 expect(result?.steps.find(s=>s.name==="技能配置")?.result).not.toContain("private");
 expect(result?.proposed[0]?.copy).toBe("");
 expect(result?.remaining.length).toBeGreaterThan(0);
});

it("keeps pending, review and approved statuses separate and never reopens an approved product",()=>{
 const org="state-org",member="state-member";
 const batch=createOwnProductBatch(org,member,"自有商品测试批次");
 simulateFiveOwnProductIntakes(org,member,batch.id,"测试模板");
 const items=readOwnProducts(org,member);
 const cup=items.find(p=>p.skus.some(s=>s.skuCode==="SH-OPT-MUG-005"))!;
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

it("reads all real saved product-image template settings instead of guessing language or background",()=>{
 const org="image-config-org",member="image-config-member";
 const batch=createOwnProductBatch(org,member,"自有商品测试批次");
 writeAgentPreviewTemplates(org,member,"商品优化智能体",[{
  id:"configured-template",name:"图片配置验收",createdAt:"2026-11-24",
  config:{skills:[],knowledge:[],imageOptimization:true,imageInstructions:"产品主体不可变形",
   useConfig:{
    imageLanguage:"西班牙语",imageBackground:"自定义背景要求",
    imageBackgroundCustom:"柔和浅灰摄影棚背景",optimizationSource:"自定义指令",
    imageUse:"分别优化",imageProcessingScope:"手动选择",
    selectedMainImages:[1,3],selectedDetailImages:[2],
    imageTasks:[
     {id:1,target:"主图",position:1,name:"hero",prompt:"主体完整居中"},
     {id:2,target:"详情图",position:2,name:"detail",prompt:"展示可信材质纹理"}
    ]
   }}
 }]);
 simulateFiveOwnProductIntakes(org,member,batch.id,"测试模板");
 const record={...readOwnProducts(org,member)[0],template:"图片配置验收"};
 const result=previewOwnProductOptimization(org,member,record)!;
 expect(result.templateFound).toBe(true);
 const setting=(name:string)=>result.pictureSettings.find(x=>x.label===name)?.value;
 expect(setting("生图语言")).toBe("西班牙语");
 expect(setting("背景设置")).toContain("柔和浅灰摄影棚背景");
 expect(setting("优化来源")).toBe("自定义指令");
 expect(setting("视觉素材策略")).toBe("分别优化");
 expect(setting("主图图片位置")).toBe("第1张、第3张");
 expect(setting("详情图图片位置")).toBe("第2张");
 expect(setting("逐张图片要求")).toContain("详情图第2张：展示可信材质纹理");
 expect(setting("补充图片指令")).toBe("产品主体不可变形");
});

it("does not invent image settings when a saved template omits them",()=>{
 const org="unset-config-org",member="unset-config-member";
 const batch=createOwnProductBatch(org,member,"自有商品测试批次");
 writeAgentPreviewTemplates(org,member,"商品优化智能体",[{
  id:"unset-template",name:"不指定图片",createdAt:"2026-11-24",
  config:{imageOptimization:false,skills:[],knowledge:[],useConfig:{}}
 }]);
 simulateFiveOwnProductIntakes(org,member,batch.id,"测试模板");
 const record={...readOwnProducts(org,member)[0],template:"不指定图片"};
 const result=previewOwnProductOptimization(org,member,record)!;
 expect(result.pictureSettings.find(s=>s.label==="生图语言")?.value).toContain("不指定");
 expect(result.pictureSettings.find(s=>s.label==="背景设置")?.value).toContain("不限制");
 expect(result.pictureSettings.find(s=>s.label==="主图图片位置")?.value).toBe("未选");
 expect(result.steps.find(s=>s.name==="图片优化配置")?.status).toBe("not-enabled");
});

it("imports 48 independently generated demo images but keeps 4 review and 2 incomplete, and preserves original photos",()=>{
 const org="import-org",member="import-member";
 const batch=createOwnProductBatch(org,member,"自有商品测试批次");
 expect(installSixProductOptimizationDemo(org,member).created).toBe(6);
 const codes=["SH-OPT-TEE-001","SH-OPT-HOOD-002","SH-OPT-TOTE-003","SH-OPT-BOTTLE-004","SH-OPT-MUG-005","SH-OPT-TRAVEL-006"];
 const photo="data:image/jpeg;base64,"+btoa("demo-image");
 const payload={format:"shuomi-own-product-six-optimization-image-pack",version:2,language:"英语",background:"白色背景",perProduct:8,
  products:codes.map(code=>({skuCode:code,images:Array.from({length:8},(_,n)=>photo+n.toString(36).padEnd(4,"a"))}))};
 // Each simulated slot must remain separately addressable and valid Base64.
 payload.products.forEach(p=>p.images=p.images.map((_,n)=>"data:image/jpeg;base64,"+btoa("image-"+p.skuCode+"-"+n)));
 const result=importOwnProductDemoImagePack(org,member,payload);
 expect(result).toEqual({products:6,images:48,pending:2,review:4});
 const products=readOwnProducts(org,member);
 for(const p of products){
  expect(p.skus[0].images).toHaveLength(8);
  expect(p.skus[0].images[0]).toMatch(/^data:image\/jpeg;base64,/);
  expect(p.originalSkus?.[0]?.images).toHaveLength(1);
  expect(p.demoImageSource).toContain("模拟");
 }
 expect(products.filter(p=>p.status==="待审核")).toHaveLength(4);
 expect(products.filter(p=>p.status==="入库待完善")).toHaveLength(2);
 const mug=products.find(p=>p.skus[0].skuCode==="SH-OPT-MUG-005")!;
 expect(mug.missing.some(m=>m.includes("基础资料"))).toBe(true);
 const pouch=products.find(p=>p.skus[0].skuCode==="SH-OPT-TRAVEL-006")!;
 expect(pouch.skus[1].images).toHaveLength(0);
 expect(pouch.missing.some(m=>m.includes("商品图片"))).toBe(true);
 expect(()=>importOwnProductDemoImagePack("other-org",member,payload)).toThrow("请先创建");
});

it("rejects incorrect English-white eight-slot image pack without changing records",()=>{
 const org="reject-org",member="reject-member";
 createOwnProductBatch(org,member,"自有商品测试批次");
 installSixProductOptimizationDemo(org,member);
 const baseline=JSON.stringify(readOwnProducts(org,member));
 expect(()=>importOwnProductDemoImagePack(org,member,{format:"shuomi-own-product-six-optimization-image-pack",version:2,language:"中文",background:"白色背景",perProduct:8,products:[]})).toThrow("不符合测试模板");
 expect(JSON.stringify(readOwnProducts(org,member))).toBe(baseline);
});

it("automatically hydrates eight English-white generated tiles for each of the six sample products",async()=>{
 const org="atlas-org",member="atlas-member";
 createOwnProductBatch(org,member,"自有商品测试批次");
 installSixProductOptimizationDemo(org,member);
 const original=readOwnProducts(org,member).map(p=>p.originalSkus?.[0]?.images[0]);
 const oldImage=globalThis.Image;
 class AtlasImage {
  onload:(()=>void)|null=null;
  onerror:(()=>void)|null=null;
  naturalWidth=1024;naturalHeight=3072;
  set src(_value:string){queueMicrotask(()=>this.onload?.());}
 }
 vi.stubGlobal("Image",AtlasImage);
 const draw=vi.fn();
 const getContext=vi.spyOn(HTMLCanvasElement.prototype,"getContext").mockReturnValue({drawImage:draw,clearRect:vi.fn()} as unknown as CanvasRenderingContext2D);
 const dataURL=vi.spyOn(HTMLCanvasElement.prototype,"toDataURL").mockReturnValue("data:image/webp;base64,"+btoa("a-preview-tile"));
 try{
  expect(await installGeneratedOwnProductDemoImages(org,member)).toEqual({products:6,images:48,review:4,pending:2,alreadyInstalled:false});
  const all=readOwnProducts(org,member);
  expect(all.filter(p=>p.status==="待审核")).toHaveLength(4);
  expect(all.filter(p=>p.status==="入库待完善")).toHaveLength(2);
  expect(all.map(p=>p.skus[0].images.length)).toEqual([8,8,8,8,8,8]);
  expect(all.map(p=>p.originalSkus?.[0]?.images[0])).toEqual(original);
  expect(draw).toHaveBeenCalledTimes(48);
  expect((await installGeneratedOwnProductDemoImages(org,member)).alreadyInstalled).toBe(true);
 }finally{
  getContext.mockRestore();dataURL.mockRestore();vi.stubGlobal("Image",oldImage);
 }
});

it("does not change approvals when a completed demo product is revisited",async()=>{
 const org="approved-demo-org",member="approved-demo-member";
 createOwnProductBatch(org,member,"自有商品测试批次");
 installSixProductOptimizationDemo(org,member);
 const item=readOwnProducts(org,member).find(p=>p.status==="待审核")!;
 approveOwnProductIntake(org,member,item.id);
 const result=await installGeneratedOwnProductDemoImages(org,member);
 expect(result.alreadyInstalled).toBe(true);
 expect(readOwnProducts(org,member).find(p=>p.id===item.id)?.status).toBe("已入库");
});
