/** Demonstration-only approved supplier listings, not real platform approvals,
 * live inventory, prices, merchants or cross-tenant records. Product illustrations are demonstration assets.
 */
export type SupplyType="现货"|"定制"|"POD"|"待确认";
export type SelectedCatalogProduct={
 id:string;name:string;category:string;description:string;supplierId:string;supplierName:string;
 price:number;moq:number;stock:number;dispatch:string;origin:string;returns:string;
 supplyType?:SupplyType;warehouseCountry?:string;shipToCountries?:string[];dropship?:boolean;
 /** Supplier-supplied offer information, or explicitly marked demonstration estimates. */
 quotationCurrency?:string;packagingWeightKg?:number;packagingLengthCm?:number;packagingWidthCm?:number;packagingHeightCm?:number;
 shippingQuotes?:Array<{country:string;freight:number|null;currency:string;transitDays:string|null;method:string;demo?:boolean}>;
 serviceFees?:{inspection:number|null;packing:number|null;labeling:number|null;currency:string;demo?:boolean};
 version:string;approved:"演示审核通过";images:string[];skus:Array<{id:string;label:string;color:string;size:string;stock:number;price:number;images?:string[];
  /** Per-SKU offers can override product defaults when the supplier supplies a variant-specific figure. */
  moq?:number;origin?:string;dispatch?:string;warehouseCountry?:string;dropship?:boolean;
  packagingWeightKg?:number;packagingLengthCm?:number;packagingWidthCm?:number;packagingHeightCm?:number;
  serviceFees?:SelectedCatalogProduct["serviceFees"];shippingQuotes?:SelectedCatalogProduct["shippingQuotes"]}>;
};
const supplierA={supplierId:"DEMO-SUP-A",supplierName:"演示供货商 · 织造工厂"};
const supplierB={supplierId:"DEMO-SUP-B",supplierName:"演示供货商 · 生活用品"};
const teePhotos=(color:"black"|"white")=>Array.from({length:4},(_,i)=>((typeof window!=="undefined"&&(window.location.pathname==="/shuomi"||window.location.pathname.startsWith("/shuomi/")))?"/shuomi":"")+"/assets/selected-market/SMYX-DEMO-001/"+color+"-0"+(i+1)+".png");
const baseSelectedCatalogFixtures:SelectedCatalogProduct[]=[
 {id:"SMYX-DEMO-001",name:"纯棉圆领短袖T恤",category:"服装",description:"基础纯棉圆领短袖，男女休闲版型，可进行平台专属标题及属性适配。",...supplierA,price:28,moq:1,stock:3600,dispatch:"48小时内",origin:"浙江义乌",returns:"质量问题按规则处理",version:"DEMO-V1",approved:"演示审核通过",images:teePhotos("black"),skus:[{id:"SMYX-001-BK-M",label:"黑色 / M",color:"黑色",size:"M",stock:900,price:28,images:teePhotos("black")},{id:"SMYX-001-BK-L",label:"黑色 / L",color:"黑色",size:"L",stock:900,price:28,images:teePhotos("black")},{id:"SMYX-001-WH-M",label:"白色 / M",color:"白色",size:"M",stock:900,price:28,images:teePhotos("white")},{id:"SMYX-001-WH-L",label:"白色 / L",color:"白色",size:"L",stock:900,price:28,images:teePhotos("white")}]},
 {id:"SMYX-DEMO-002",name:"宽松连帽卫衣",category:"服装",description:"常规连帽卫衣，宽松休闲款，提供基础颜色和尺码供卖家选择。",...supplierA,price:65,moq:1,stock:1800,dispatch:"72小时内",origin:"浙江义乌",returns:"质量问题按规则处理",version:"DEMO-V1",approved:"演示审核通过",images:[],skus:[{id:"SMYX-002-BK-M",label:"黑色 / M",color:"黑色",size:"M",stock:450,price:65},{id:"SMYX-002-BK-L",label:"黑色 / L",color:"黑色",size:"L",stock:450,price:65},{id:"SMYX-002-GR-M",label:"灰色 / M",color:"灰色",size:"M",stock:450,price:65},{id:"SMYX-002-GR-L",label:"灰色 / L",color:"灰色",size:"L",stock:450,price:65}]},
 {id:"SMYX-DEMO-003",name:"帆布手提购物袋",category:"箱包",description:"简约帆布托特袋，可用于通勤、购物和礼品搭配。",...supplierA,price:15,moq:5,stock:2400,dispatch:"48小时内",origin:"浙江义乌",returns:"质量问题按规则处理",version:"DEMO-V1",approved:"演示审核通过",images:[],skus:[{id:"SMYX-003-NT",label:"原色 / 标准",color:"原色",size:"标准",stock:1200,price:15},{id:"SMYX-003-BK",label:"黑色 / 标准",color:"黑色",size:"标准",stock:1200,price:15}]},
 {id:"SMYX-DEMO-004",name:"不锈钢保温杯",category:"家居",description:"日常办公与旅行使用的保温杯，演示版产品参数与报价非真实供货承诺。",...supplierB,price:32,moq:2,stock:1300,dispatch:"72小时内",origin:"广东汕头",returns:"质量问题按规则处理",version:"DEMO-V1",approved:"演示审核通过",images:[],skus:[{id:"SMYX-004-BK-500",label:"黑色 / 500ml",color:"黑色",size:"500ml",stock:600,price:32},{id:"SMYX-004-WH-500",label:"白色 / 500ml",color:"白色",size:"500ml",stock:700,price:32}]},
 {id:"SMYX-DEMO-005",name:"旅行收纳洗漱包",category:"箱包",description:"旅行洗漱分区收纳包，适合跨境日用收纳品类。",...supplierB,price:22,moq:2,stock:960,dispatch:"48小时内",origin:"广东汕头",returns:"质量问题按规则处理",version:"DEMO-V1",approved:"演示审核通过",images:[],skus:[{id:"SMYX-005-BK",label:"黑色 / 标准",color:"黑色",size:"标准",stock:480,price:22},{id:"SMYX-005-GR",label:"灰色 / 标准",color:"灰色",size:"标准",stock:480,price:22}]},
 {id:"SMYX-DEMO-006",name:"纯色家居抱枕套",category:"家居",description:"纯色家居抱枕套，多规格可选；颜色和尺寸需要在目标平台重新适配。",...supplierB,price:12,moq:5,stock:1100,dispatch:"72小时内",origin:"广东汕头",returns:"质量问题按规则处理",version:"DEMO-V1",approved:"演示审核通过",images:[],skus:[{id:"SMYX-006-WH",label:"米白 / 45×45cm",color:"米白",size:"45×45cm",stock:550,price:12},{id:"SMYX-006-GR",label:"灰色 / 45×45cm",color:"灰色",size:"45×45cm",stock:550,price:12}]}
];

// Supply capabilities are demonstration fixtures only, not verified logistics promises.
// MOQ and dropshipping belong to each supply offer rather than the product category.
const demoSupply: Array<Pick<SelectedCatalogProduct,"supplyType"|"warehouseCountry"|"shipToCountries"|"dropship"> & {moq?:number;origin?:string}>=[
 {supplyType:"现货",warehouseCountry:"中国",shipToCountries:["美国","加拿大"],dropship:true},
 {supplyType:"定制",warehouseCountry:"中国",shipToCountries:["美国","英国"],dropship:true},
 {supplyType:"POD",warehouseCountry:"美国",origin:"美国洛杉矶演示仓",shipToCountries:["美国","加拿大","英国"],dropship:true,moq:1},
 {supplyType:"POD",warehouseCountry:"墨西哥",origin:"墨西哥蒙特雷演示仓",shipToCountries:["美国","墨西哥"],dropship:true,moq:1},
 {supplyType:"现货",warehouseCountry:"中国",shipToCountries:["美国"],dropship:false},
 {supplyType:"现货",warehouseCountry:"中国",shipToCountries:["美国","加拿大"],dropship:false}
];
// Prices and freight below are sample numbers for UI demonstration ONLY.
const demoPackage:Array<{weight:number;size:[number,number,number];shipping:Record<string,{freight:number;days:string}>}>=[
 {weight:.25,size:[30,24,3],shipping:{"美国":{freight:29,days:"8–15 天"},"加拿大":{freight:37,days:"10–18 天"}}},
 {weight:.65,size:[34,29,8],shipping:{"美国":{freight:42,days:"9–16 天"},"英国":{freight:47,days:"10–18 天"}}},
 {weight:.22,size:[27,20,4],shipping:{"美国":{freight:8,days:"3–6 天"},"加拿大":{freight:17,days:"5–9 天"},"英国":{freight:21,days:"6–11 天"}}},
 {weight:.48,size:[21,11,11],shipping:{"美国":{freight:32,days:"5–9 天"},"墨西哥":{freight:19,days:"3–7 天"}}},
 {weight:.18,size:[25,20,5],shipping:{"美国":{freight:28,days:"8–15 天"}}},
 {weight:.16,size:[26,22,3],shipping:{"美国":{freight:27,days:"8–15 天"},"加拿大":{freight:35,days:"10–18 天"}}}
];
export const selectedCatalogFixtures:SelectedCatalogProduct[]=baseSelectedCatalogFixtures.map((item,index)=>{
 const offer=demoSupply[index],packing=demoPackage[index];
 return {...item,...offer,quotationCurrency:"CNY",serviceFees:{inspection:1.2,packing:1.5,labeling:0.8,currency:"CNY",demo:true},packagingWeightKg:packing.weight,
  packagingLengthCm:packing.size[0],packagingWidthCm:packing.size[1],packagingHeightCm:packing.size[2],
  shippingQuotes:(offer.shipToCountries||[]).map(country=>({
   country,freight:packing.shipping[country]?.freight??null,currency:"CNY",
   transitDays:packing.shipping[country]?.days??null,method:"演示标准运输",demo:true
  }))};
});
