// @vitest-environment jsdom
import {beforeEach,expect,it} from "vitest";
import {simulateAmazonFiveListingWorkflow,simulateAmazonMultiVariantListingWorkflow,saveListingVariantPhoto,listingVariantPhotoRoles,variantGroupReady,readShowcaseUploadTasks,completeShowcaseUploadTask,approveShowcaseUploadTask,refreshAmazonFiveDemoPhotos} from "./showcase-upload-tasks";
import {listingDemoArtSet} from "./showcase-listing-ai-images";
import {readDemoCollectionBatches,amazonMultiVariantPhotoFixtures} from "../showcase-collection-batches";
beforeEach(()=>sessionStorage.clear());
const org="SM-ENT-000001",member="admin";
const items=[
 ["B00TTD9BRC","Moisturizing Cream"],
 ["B07WRKXQ8W","USB-C Charger"],
 ["B00008GKD3","Cast Iron Skillet"],
 ["B0CFPJYX7P","E-Reader"],
 ["B00NTCHCU2","AAA Batteries"]
].map(([sku,name])=>({id:"SIM-AMZ-US-"+sku,sku,name,description:"Original source content",images:["https://example.test/original.jpg"]}));
const args={organizationId:org,memberId:member,batchId:"SIM-AMAZON-US-5-20261124",
 batchName:"Amazon 美国站 · 5个真实商品（模拟采集）",products:items,
 storeId:"store-admin-01",storeName:"管理员演示店铺01",region:"美国站",storeType:"全托店",
 rule:"硕米规则",agentName:"商品优化智能体",templateId:"test-template"};
it("creates 5 separate optimized items, three missing and two review without external submission",()=>{
 expect(simulateAmazonFiveListingWorkflow(args)).toEqual({created:5,missing:3,review:2,alreadyInstalled:false});
 const all=readShowcaseUploadTasks(org,member);
 expect(all).toHaveLength(5);
 expect(all.filter(x=>x.status==="待补全")).toHaveLength(3);
 expect(all.filter(x=>x.status==="待审核")).toHaveLength(2);
 expect(all.every(x=>x.productIds.length===1&&x.mode==="直接上传到平台"&&x.demoProduct?.agentRun==="模拟已优化")).toBe(true);
 expect(all.every(x=>x.demoProduct?.optimizedImages.length===6)).toBe(true);
 expect(all.every(x=>x.demoProduct?.sourceImages.length===1)).toBe(true);
 expect(new Set(all.flatMap(x=>x.demoProduct!.optimizedImages)).size).toBe(30);
 expect(all.every(x=>x.status!=="待平台提交")).toBe(true);
 expect(simulateAmazonFiveListingWorkflow(args).alreadyInstalled).toBe(true);
 expect(readShowcaseUploadTasks("different-org",member)).toHaveLength(0);
 expect(readShowcaseUploadTasks(org,"other-member")).toHaveLength(0);
});
it("gates missing fields, then review and never fakes upload",()=>{
 simulateAmazonFiveListingWorkflow(args);
 const records=readShowcaseUploadTasks(org,member);
 const incomplete=records.find(x=>x.status==="待补全")!;
 const ready=records.find(x=>x.status==="待审核")!;
 expect(()=>approveShowcaseUploadTask(org,member,incomplete.id)).toThrow();
 expect(()=>completeShowcaseUploadTask(org,member,incomplete.id,{})).toThrow();
 const entries=Object.fromEntries(incomplete.demoProduct!.missingFields.map(field=>[field,"Reviewed document"]));
 expect(completeShowcaseUploadTask(org,member,incomplete.id,entries).status).toBe("待审核");
 expect(approveShowcaseUploadTask(org,member,ready.id).status).toBe("待平台提交");
 expect(approveShowcaseUploadTask(org,member,incomplete.id).status).toBe("待平台提交");
 expect(()=>approveShowcaseUploadTask(org,member,ready.id)).toThrow();
 expect(readShowcaseUploadTasks(org,member).every(t=>t.demo&&t.demoProduct?.reviewedAt!==undefined?Boolean(t.demoProduct.reviewedAt):true)).toBe(true);
});
it("references six independent square white-background photos per product",()=>{
 const kinds=["cream","charger","skillet","ereader","battery"] as const;
 const all=kinds.flatMap(kind=>{
  const images=listingDemoArtSet(kind);
  expect(images).toHaveLength(6);
  expect(new Set(images).size).toBe(6);
  expect(images.every(x=>x.startsWith("/assets/listing-ai-preview/approved/"))).toBe(true);
  expect(images.every(x=>x.endsWith(".jpg"))).toBe(true);
  return images;
 });
 expect(new Set(all).size).toBe(30);
});
it("migrates old generated SVG pictures, without changing source photos or approval status",()=>{
 simulateAmazonFiveListingWorkflow(args);
 const before=readShowcaseUploadTasks(org,member);
 const target=before[0];
 const old={...target,demoProduct:{...target.demoProduct!,optimizedImages:Array.from({length:8},(_,i)=>"data:image/svg+xml;charset=utf-8,"+i)}};
 const key="shuomi:listing-upload-tasks-v1:"+org+":"+member;
 sessionStorage.setItem(key,JSON.stringify([old,...before.slice(1)]));
 expect(refreshAmazonFiveDemoPhotos(org,member)).toBe(1);
 const updated=readShowcaseUploadTasks(org,member)[0];
 expect(updated.status).toBe(target.status);
 expect(updated.demoProduct?.sourceImages).toEqual(target.demoProduct?.sourceImages);
 expect(updated.demoProduct?.optimizedImages).toHaveLength(6);
 expect(updated.demoProduct?.optimizedImages.every(x=>x.endsWith(".jpg"))).toBe(true);
 expect(refreshAmazonFiveDemoPhotos(org,member)).toBe(0);
});

it("adds the two real photographed multi-variant families to the existing five-product batch, idempotently",()=>{
 const original=readDemoCollectionBatches(org,member).find(b=>b.id===args.batchId)!;
 expect(original.products).toHaveLength(7);
 const multi=original.products.filter(p=>p.variantCount&&p.variantCount>1);
 expect(multi).toHaveLength(2);
 expect(multi.map(p=>p.variantCount)).toEqual([6,3]);
 expect(multi.every(p=>p.variantDetails?.every(v=>v.image.startsWith("https://")))).toBe(true);
 const originalFive=simulateAmazonFiveListingWorkflow({...args,products:original.products});
 expect(originalFive.created).toBe(5);
 const extra=simulateAmazonMultiVariantListingWorkflow({...args,batchName:original.name,products:original.products});
 expect(extra).toEqual({created:2,missing:1,review:1,alreadyInstalled:false});
 const all=readShowcaseUploadTasks(org,member);
 expect(all).toHaveLength(7);
 expect(all.filter(t=>t.status==="待补全")).toHaveLength(4);
 expect(all.filter(t=>t.status==="待审核")).toHaveLength(3);
 expect(all.filter(t=>t.id.startsWith("SHUOMI-AMZ-AI-5:"))).toHaveLength(5);
 const clog=all.find(t=>t.productIds.includes("SIM-AMZ-US-CROCS-10001"))!;
 const stanley=all.find(t=>t.productIds.includes("SIM-AMZ-US-STANLEY-Q40"))!;
 expect(clog.status).toBe("待补全");
 expect(clog.demoProduct?.variantDetails).toHaveLength(6);
 expect(stanley.status).toBe("待审核");
 expect(stanley.demoProduct?.variantDetails).toHaveLength(3);
 expect(clog.storeId).toBe(stanley.storeId);
 expect(clog.batchId).toBe(stanley.batchId);
 expect(clog.demoProduct?.optimizedImages).toEqual([]);
 expect(stanley.demoProduct?.optimizedImages).toEqual([]);
 expect(clog.demoProduct?.variantImageGroups?.map(g=>g.color)).toEqual(["Black","White","Navy"]);
 expect(clog.demoProduct?.variantImageGroups?.map(g=>g.skuIds.length)).toEqual([2,2,2]);
 expect(stanley.demoProduct?.variantImageGroups?.map(g=>g.skuIds.length)).toEqual([1,1,1]);
 expect(clog.demoProduct?.variantImageGroups?.every(g=>g.optimizedImages.length===0&&g.originalImages.length>0)).toBe(true);
 expect(()=>approveShowcaseUploadTask(org,member,clog.id)).toThrow();
 expect(simulateAmazonMultiVariantListingWorkflow({...args,products:original.products}).alreadyInstalled).toBe(true);
 expect(readShowcaseUploadTasks("other-tenant",member)).toHaveLength(0);
 expect(readShowcaseUploadTasks(org,"colleague")).toHaveLength(0);
});
it("migrates old five-product browser sessions in place without duplication or resetting renamed batch",()=>{
 const original=readDemoCollectionBatches(org,member).find(b=>b.id===args.batchId)!;
 const storageKey="shuomi:demo-collection-batches-v1:"+org;
 const existing=JSON.parse(sessionStorage.getItem(storageKey)||"[]");
 const old=existing.map((b:{id:string;name:string;products:unknown[]})=>b.id===args.batchId?{...b,name:"My manually renamed Amazon batch",products:b.products.slice(0,5)}:b);
 sessionStorage.setItem(storageKey,JSON.stringify(old));
 const migrated=readDemoCollectionBatches(org,member).find(b=>b.id===args.batchId)!;
 expect(migrated.name).toBe("My manually renamed Amazon batch");
 expect(migrated.products).toHaveLength(7);
 expect(readDemoCollectionBatches(org,member).find(b=>b.id===args.batchId)?.products).toHaveLength(7);
 expect(amazonMultiVariantPhotoFixtures).toHaveLength(2);
});

it("stores six independently versioned image roles per color, inherits across sizes, gates review and isolates tenants",()=>{
 const batch=readDemoCollectionBatches(org,member).find(b=>b.id===args.batchId)!;
 simulateAmazonMultiVariantListingWorkflow({...args,products:batch.products});
 const clog=readShowcaseUploadTasks(org,member).find(t=>t.demoProduct?.variantDetails?.length===6)!;
 const stanley=readShowcaseUploadTasks(org,member).find(t=>t.demoProduct?.variantDetails?.length===3)!;
 expect(()=>approveShowcaseUploadTask(org,member,stanley.id)).toThrow(/六张/);
 expect(()=>saveListingVariantPhoto("other",member,stanley.id,"black",listingVariantPhotoRoles[0],"https://example.test/black.jpg")).toThrow();
 expect(()=>saveListingVariantPhoto(org,member,stanley.id,"unknown",listingVariantPhotoRoles[0],"https://example.test/black.jpg")).toThrow();
 expect(()=>saveListingVariantPhoto(org,member,stanley.id,"cream 2.0",listingVariantPhotoRoles[0],stanley.demoProduct!.variantImageGroups![0].originalImages[0])).toThrow(/原始采集图片/);
 for(const group of stanley.demoProduct!.variantImageGroups!){
  listingVariantPhotoRoles.forEach((role,i)=>saveListingVariantPhoto(org,member,stanley.id,group.id,role,"https://example.test/"+group.id+"-"+i+".jpg"));
 }
 const completed=readShowcaseUploadTasks(org,member).find(t=>t.id===stanley.id)!;
 expect(completed.demoProduct?.variantImageGroups?.every(variantGroupReady)).toBe(true);
 expect(completed.demoProduct?.variantImageGroups?.map(g=>g.optimizedImages.length)).toEqual([6,6,6]);
 expect(approveShowcaseUploadTask(org,member,stanley.id).status).toBe("待平台提交");
 expect(clog.demoProduct?.variantImageGroups?.map(g=>g.skuIds.length)).toEqual([2,2,2]);
 expect(readShowcaseUploadTasks(org,"other-member")).toHaveLength(0);
});
it("preserves a legacy multi-variant task's status while removing false AI-image attribution",()=>{
 const batch=readDemoCollectionBatches(org,member).find(b=>b.id===args.batchId)!;
 simulateAmazonMultiVariantListingWorkflow({...args,products:batch.products});
 const original=readShowcaseUploadTasks(org,member)[0];
 const rawKey="shuomi:listing-upload-tasks-v1:"+org+":"+member;
 sessionStorage.setItem(rawKey,JSON.stringify([{...original,demoProduct:{...original.demoProduct!,optimizedImages:[...original.demoProduct!.sourceImages],variantImageGroups:undefined}}]));
 const migrated=readShowcaseUploadTasks(org,member)[0];
 expect(migrated.status).toBe(original.status);
 expect(migrated.demoProduct?.sourceImages).toEqual(original.demoProduct?.sourceImages);
 expect(migrated.demoProduct?.optimizedImages).toEqual([]);
 expect(migrated.demoProduct?.variantImageGroups).toHaveLength(3);
});
