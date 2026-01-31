import type { DataSource } from 'typeorm';
import { fetchStockListFromProviders } from './stockInfo.provider.js';
import { hasAnyStockInfo, upsertStockInfoChunked } from './stockInfo.repo.js';

let isRunning = false;

export function tryAcquireLock(): boolean {
  if (isRunning) return false;
  isRunning = true;
  return true;
}

export function releaseLock(): void {
  isRunning = false;
}

export type SyncStockInfoResult = {
  mode: 'init' | 'sync';
  totalFetched: number;
  totalUpserted: number;
  fetchedAt: string;
};

export async function syncStockInfo(
  ds: DataSource,
  mode: 'init' | 'sync'
): Promise<SyncStockInfoResult> {
  const fetchedAt = new Date().toISOString();

  if (mode === 'init') {
    const existed = await hasAnyStockInfo(ds);
    if (existed) {
      // 交由 controller 回 409
      const err = new Error('stock_info already initialized');
      (err as any).code = 'ALREADY_INITIALIZED';
      throw err;
    }
  }

  const list = await fetchStockListFromProviders();
  const totalUpserted = await upsertStockInfoChunked(ds, list);

  return {
    mode,
    totalFetched: list.length,
    totalUpserted,
    fetchedAt,
  };
}
