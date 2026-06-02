let isRunning = false;

export function tryAcquireStockInfoSyncLock(): boolean {
  if (isRunning) return false;
  isRunning = true;
  return true;
}

export function releaseStockInfoSyncLock(): void {
  isRunning = false;
}
