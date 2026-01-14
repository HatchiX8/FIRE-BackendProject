import { StockPricesRepository, StockInfoRepository } from './stockInfo.query.repo.js';

import { isMvpStockId } from '@/utils/index.js';

const MVP_NOTE = 'mvp_string_rules_v1';

export class SyncStockMetadataService {
  constructor(
    private readonly pricesRepo: StockPricesRepository,
    private readonly infoRepo: StockInfoRepository
  ) {}

  async execute(): Promise<{ total: number; synced: number }> {
    const prices = await this.pricesRepo.findAllDistinct();

    const filtered = prices.filter((p) => isMvpStockId(p.stockId));

    const payload = filtered.map((p) => ({
      stockId: p.stockId,
      stockName: p.stockName,
      note: MVP_NOTE,
    }));

    await this.infoRepo.upsertMany(payload);

    return {
      total: prices.length,
      synced: payload.length,
    };
  }
}
