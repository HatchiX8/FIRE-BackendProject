import { fetchStockListFromProviders } from './stockInfo.provider.js';
import { stockInfoPriceRepository } from './stockInfo.price.repository.js';

export type SyncStockInfoResult = {
  mode: 'init' | 'sync';
  totalFetched: number;
  totalUpserted: number;
  fetchedAt: string;
};

export async function syncStockInfo(mode: 'init' | 'sync'): Promise<SyncStockInfoResult> {
  const fetchedAt = new Date().toISOString();

  if (mode === 'init') {
    const existed = await stockInfoPriceRepository.hasAnyStockPrice();
    if (existed) {
      // 交由 controller 回 409
      const err = new Error('stock_info already initialized');
      (err as any).code = 'ALREADY_INITIALIZED';
      throw err;
    }
  }

  const list = await fetchStockListFromProviders();
  const totalUpserted = await stockInfoPriceRepository.upsertStockPricesChunked(list);

  return {
    mode,
    totalFetched: list.length,
    totalUpserted,
    fetchedAt,
  };
}
