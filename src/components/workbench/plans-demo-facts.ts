/** Shared, non-billable showcase facts. These do not represent a real account. */
export const plansDemoFacts = {
  activeStores: 0,
  renewalPeriods: 2,
  expiringStores: 0,
  aiPoints: 10000000,
  dataRows: 50000,
  storageCapacityGiB: 8,
  storageUsedGiB: 0,
  storageReservedGiB: 0,
  get storageAvailableGiB(){return this.storageCapacityGiB-this.storageUsedGiB-this.storageReservedGiB;},
  walletBalanceCny: 8161,
  walletTopUpsCny: 10000,
  walletSpentCny: 1839,
} as const;
export const plansDemoDisplay = {
  activeStores: `${plansDemoFacts.activeStores} 家使用中`,
  expiringStores: `${plansDemoFacts.expiringStores} 家将到期`,
  aiPoints: plansDemoFacts.aiPoints.toLocaleString("en-US"),
  dataRows: `${plansDemoFacts.dataRows.toLocaleString("en-US")} 条`,
  storageAvailable: `${plansDemoFacts.storageAvailableGiB.toFixed(2)} GiB`,
  storageUsed: `${plansDemoFacts.storageUsedGiB.toFixed(2)} GiB`,
  storageCapacity: `${plansDemoFacts.storageCapacityGiB.toFixed(2)} GiB`,
  walletBalance: `¥${plansDemoFacts.walletBalanceCny.toLocaleString("en-US")}.00`,
} as const;

/** One explicitly simulated, non-billable top-up for the existing showcase tenant. */
export const plansDemoWalletCredit = {
  id: "SIM-WALLET-20261122-10000",
  account: "linchen_demo",
  enterprise: "武汉硕米电子商务有限公司",
  occurredAt: "2026-11-22 10:03",
  amountCny: 10000,
  status: "模拟已到账",
  description: "演示账户钱包模拟充值（非真实付款）",
} as const;

/** Synthetic purchases in the showcase tenant. Only the user-provided conversion rates are applied. These are not real payments. */
export const plansDemoRates = { aiPointsPerCny: 10000, dataCnyPerRow: 0.01 } as const;
export const plansDemoPurchases = [
 {id:"SIM-BUY-STORE-2",at:"2026-11-22 10:06",type:"店铺服务",detail:"2 期（30 天/期），存入企业续费期数池；未绑定店铺",amountCny:336,status:"模拟购买成功",category:"店铺服务",quantity:2},
 {id:"SIM-BUY-TOKEN-1000",at:"2026-11-22 10:07",type:"token 积分",detail:"¥1,000 × 10,000 积分/元 = 10,000,000 积分",amountCny:1000,status:"模拟已到账",category:"token 积分",quantity:10000000},
 {id:"SIM-BUY-DATA-500",at:"2026-11-22 10:08",type:"数据资源",detail:"¥500 ÷ ¥0.01/条 = 50,000 条数据",amountCny:500,status:"模拟已到账",category:"数据资源",quantity:50000},
 {id:"SIM-BUY-STORAGE-3",at:"2026-11-22 10:09",type:"企业存储",detail:"扩容 3 GiB / 30 天；默认 5 GiB + 扩容 3 GiB",amountCny:3,status:"模拟购买成功",category:"企业存储",quantity:3},
] as const;
export const plansDemoPurchaseTotalCny=plansDemoPurchases.reduce((sum,item)=>sum+item.amountCny,0);
