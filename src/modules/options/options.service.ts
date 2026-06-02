import type { StockInfoOptionDto } from './options.dto.js';
import { optionsRepository } from './options.repository.js';

export async function getStockInfoOptions(): Promise<StockInfoOptionDto[]> {
  const rows = await optionsRepository.findActiveStockOptions();

  return rows.map((row) => ({
    stockId: row.stockId,
    stockName: row.stockName,
  }));
}
