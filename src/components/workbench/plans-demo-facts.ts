/** Shared, non-billable showcase facts. These do not represent a real account. */
export const plansDemoFacts = {
  activeStores: 5,
  expiringStores: 1,
  aiPoints: 8650,
  dataRows: 300000,
  storageCapacityGiB: 5,
  storageUsedGiB: 2,
  storageReservedGiB: 0.25,
  get storageAvailableGiB(){return this.storageCapacityGiB-this.storageUsedGiB-this.storageReservedGiB;},
  walletBalanceCny: 5000,
  walletTopUpsCny: 12000,
  walletSpentCny: 7000,
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
