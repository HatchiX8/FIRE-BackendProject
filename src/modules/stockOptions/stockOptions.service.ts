import type { StockOptionDto } from './stockOptions.dto.js';
import { stockOptionsRepository } from './stockOptions.repository.js';

export async function getStockOptions(): Promise<StockOptionDto[]> {
  const rows = await stockOptionsRepository.findActiveStockOptions();

  return rows.map((row) => ({
    stockId: row.stockId,
    stockName: row.stockName,
  }));
}
