import { StockInfoRepository } from './stockInfo.options.repo.js';

export type StockInfoOptionDTO = {
  stockId: string;
  stockName: string;
};

export class GetStockInfoOptionsService {
  constructor(private readonly stockInfoRepo: StockInfoRepository) {}

  async execute(): Promise<StockInfoOptionDTO[]> {
    const rows = await this.stockInfoRepo.findActiveOptions();
    return rows.map((r) => ({
      stockId: r.stockId,
      stockName: r.stockName,
    }));
  }
}
