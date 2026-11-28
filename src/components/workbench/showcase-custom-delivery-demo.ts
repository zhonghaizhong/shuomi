// Public showcase sample only. Never inject this record into authenticated production APIs.
export const customDeliveryDemo={id:"DC-DEMO-20261128-001",name:"Amazon 美国站保温杯商品选品数据集",source:"Amazon 美国站 · 公开商品页面索引",fields:"ASIN、站点、商品名称、品牌、材质、颜色、规格、评分、评价数、来源链接、来源核对日期、类目、描述、模拟价格、模拟库存、销售状态、AI商品图片",quantity:"3",frequency:"一次性",delivery:"专属数据集",notes:"选品及竞品分析。公开商品参考；补齐字段及图片均用于模拟，订单、报价、支付及验收均为演示。",stage:5,created:"2026-11-25T02:00:00Z",deliveredAt:"2026-11-28T00:00:00Z",version:1,site:"us",amount:500} as const;
export const customDeliveryProducts=[
  {
    "asin": "B0FJN3BTPV",
    "site": "us",
    "title": "Owala FreeSip 24 oz Black Cherry",
    "brand": "Owala",
    "material": "Stainless steel",
    "color": "Black Cherry",
    "size_label": "24 oz",
    "rating": 4.6,
    "reviewCount": 144150,
    "sourceUrl": "https://www.amazon.com/dp/B0FJN3BTPV",
    "price": 29.99,
    "currency": "USD",
    "availability": "In stock (demo)",
    "observedOn": "2026-11-28",
    "sourceNote": "Demo dataset: price, stock and availability are simulated; listing identity is a reference only; rating/reviews are prior sample values, not live metrics.",
    "category": "Kitchen & Dining / Drinkware",
    "description": "24 oz insulated sports bottle with flip straw and carry loop",
    "stock": 128,
    "imagePath": "images/B0FJN3BTPV.webp",
    "imageOrigin": "AI-generated illustrative product image; not original listing photography"
  },
  {
    "asin": "B0DTN5FBMZ",
    "site": "us",
    "title": "Stanley IceFlow Fast Flow 36 oz Rose Quartz",
    "brand": "STANLEY",
    "material": "Stainless steel",
    "color": "Rose Quartz",
    "size_label": "36 oz (listing title; detail capacity conflicts)",
    "rating": 4.6,
    "reviewCount": 7317,
    "sourceUrl": "https://us.amazon.com/STANLEY-IceFlow-Fast-Bottle-Quartz/dp/B0DTN5FBMZ",
    "price": 22.5,
    "currency": "USD",
    "availability": "In stock (demo)",
    "observedOn": "2026-11-28",
    "sourceNote": "Demo dataset: price, stock and availability are simulated; listing identity is a reference only; rating/reviews are prior sample values, not live metrics.",
    "category": "Kitchen & Dining / Drinkware",
    "description": "36 oz rose pink insulated wide-mouth bottle with handle",
    "stock": 96,
    "imagePath": "images/B0DTN5FBMZ.webp",
    "imageOrigin": "AI-generated illustrative product image; not original listing photography"
  },
  {
    "asin": "B0GH2F3QLG",
    "site": "us",
    "title": "Simple Modern Disney Trek 40 oz Tumbler",
    "brand": "Simple Modern",
    "material": "Stainless steel",
    "color": "Minnie Mouse Valentine's",
    "size_label": "40 oz",
    "rating": 4.8,
    "reviewCount": 1708,
    "sourceUrl": "https://us.amazon.com/dp/B0GH2F3QLG",
    "price": 34.99,
    "currency": "USD",
    "availability": "In stock (demo)",
    "observedOn": "2026-11-28",
    "sourceNote": "Demo dataset: price, stock and availability are simulated; listing identity is a reference only; rating/reviews are prior sample values, not live metrics.",
    "category": "Kitchen & Dining / Drinkware",
    "description": "40 oz pink bow-and-heart insulated tumbler with straw and handle",
    "stock": 150,
    "imagePath": "images/B0GH2F3QLG.webp",
    "imageOrigin": "AI-generated illustrative product image; not original listing photography"
  }
] as const;
export function canSeeCustomDelivery(org:string,member:string){return org==="SM-ENT-000001"&&member==="admin"}
export function customDeliveryUrl(format:"csv"|"json"){return "https://zhonghaizhong.github.io/shuomi/data-services/deliveries/amazon-us-drinkware-v1."+format}

export function customDeliveryImage(path:string){return "https://zhonghaizhong.github.io/shuomi/data-services/deliveries/"+path}
