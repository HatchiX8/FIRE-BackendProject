import type { DataSource } from 'typeorm';
import { getStockOptions, lookupStocks, type StockOptionItem } from './stockInfo.query.repo.js';

export async function fetchStockOptions(ds: DataSource): Promise<StockOptionItem[]> {
  return getStockOptions(ds);
}

export async function searchStocks(
  ds: DataSource,
  q: string,
  limit: number
): Promise<StockOptionItem[]> {
  return lookupStocks(ds, q, limit);
}
