import type {PodLibraryAsset} from "./pod-asset-library";
import type {PodPrintVersion} from "./pod-print-lineage";

/**
 * Checked-in, cross-browser POD showcase fixtures.
 * Artwork files are real 1254×1254 transparent-background WebP exports
 * of the four user-approved butterfly/peony PNG designs.
 * No product mockups are generated or added at this stage.
 */
export const SHOWCASE_POD_ORGANIZATION="SM-ENT-000001";
export const SHOWCASE_POD_MEMBER="admin";
export const SHOWCASE_POD_ORIGIN_ID="POD-BUTTERFLY-ORIGINAL-001";
export const SHOWCASE_POD_BATCH="POD 服装演示批次";
const directory="/assets/pod-prints/v1/";
export const isShowcasePODScope=(org:string,member:string)=>
 org===SHOWCASE_POD_ORGANIZATION&&member===SHOWCASE_POD_MEMBER;

export const showcasePODOriginalAsset:PodLibraryAsset={
 id:9900001,
 name:"蝴蝶牡丹 · 原始印花",
 category:"POD 服装演示原图",
 style:0,
 prompt:"原始印花：复古蝴蝶与牡丹植物图案。三个裂变印花均引用此素材；原图不参与当前审核。",
 archivePath:directory+"butterfly-peony-original.webp",
 archiveSha256:"914875b2b35fe39403c87224ebe401c191eb3127801b845ef6ea4400a2a7cbe8",
 originPrintId:SHOWCASE_POD_ORIGIN_ID,
 readonly:true
};

export const showcasePODReviewPrints:PodPrintVersion[]=[
 {
  printId:"POD-BUTTERFLY-FISSION-A",version:1,originPrintId:SHOWCASE_POD_ORIGIN_ID,
  name:"蝴蝶牡丹 · 黑白雕刻",sourceBatchId:SHOWCASE_POD_BATCH,sourceKind:"图片裂变",
  assetPath:directory+"butterfly-peony-monochrome.webp",
  sha256:"0dc57360fa9f1c96f8095b7434c1664f75d4abf69cfba41ca37b841d299184e0",
  mimeType:"image/webp",width:1254,height:1254,createdAt:"2026-11-26T00:00:00.000Z"
 },
 {
  printId:"POD-BUTTERFLY-FISSION-B",version:1,originPrintId:SHOWCASE_POD_ORIGIN_ID,
  name:"蝴蝶牡丹 · 暖色复古",sourceBatchId:SHOWCASE_POD_BATCH,sourceKind:"图片裂变",
  assetPath:directory+"butterfly-peony-warm.webp",
  sha256:"d54d27896e0ee6916843682527e1187a7e9ff6eb34cf351c5260ed028750ecce",
  mimeType:"image/webp",width:1254,height:1254,createdAt:"2026-11-26T00:00:00.000Z"
 },
 {
  printId:"POD-BUTTERFLY-FISSION-C",version:1,originPrintId:SHOWCASE_POD_ORIGIN_ID,
  name:"蝴蝶牡丹 · 花卉裂变",sourceBatchId:SHOWCASE_POD_BATCH,sourceKind:"图片裂变",
  assetPath:directory+"butterfly-peony-cluster.webp",
  sha256:"b73e6c490c7caf3d27ac2f3498aa3d56d425fdc2f63d3fe03986590160a0779c",
  mimeType:"image/webp",width:1254,height:1254,createdAt:"2026-11-26T00:00:00.000Z"
 }
];


/** Pre-review source-product references for the three archived print variants.
 * These are display-only demo associations, NOT approved POD variant bindings.
 * Product identity, color/size SKUs and images are resolved from the actual
 * SDS collection batch rather than duplicated here.
 */
export const SHOWCASE_SDS_POD_BATCH_ID="SIM-SDS-POD-TWO-20261126";
export const showcaseSDSPrintSourceProducts:Readonly<Record<string,readonly string[]>>={
 "POD-BUTTERFLY-FISSION-A":["SIM-SDS-POD-DTF-WOMEN-150G","SIM-SDS-POD-HOODIE-280G"],
 "POD-BUTTERFLY-FISSION-B":["SIM-SDS-POD-DTF-WOMEN-150G","SIM-SDS-POD-HOODIE-280G"],
 "POD-BUTTERFLY-FISSION-C":["SIM-SDS-POD-DTF-WOMEN-150G","SIM-SDS-POD-HOODIE-280G"]
};
