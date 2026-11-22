/** Shared, non-billable showcase facts. These do not represent a real account. */
export const plansDemoFacts = {
  activeStores: 0,
  expiringStores: 0,
  aiPoints: 0,
  dataRows: 0,
  storageCapacityGiB: 5,
  storageUsedGiB: 0,
  storageReservedGiB: 0,
  get storageAvailableGiB(){return this.storageCapacityGiB-this.storageUsedGiB-this.storageReservedGiB;},
  walletBalanceCny: 0,
  walletTopUpsCny: 0,
  walletSpentCny: 0,
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
