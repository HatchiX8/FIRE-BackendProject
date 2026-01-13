import type { DataSource } from 'typeorm';
import { StockInfoSchema } from '@/entity/stockInfo.schema.js';

export type StockOptionItem = {
  stockId: string;
  stockName: string;
};

const DEFAULT_EXCLUDE_PATTERNS = ['%權證%', '%認購%', '%認售%', '%牛證%', '%熊證%'] as const;

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

export async function getStockOptions(ds: DataSource): Promise<StockOptionItem[]> {
  const repo = ds.getRepository(StockInfoSchema);

  const qb = repo
    .createQueryBuilder('s')
    .select(['s.stockId AS stockId', 's.stockName AS stockName'])
    .where('s.is_active = true');

  // 排除權證/衍生性（用名稱規則先擋掉大宗）
  DEFAULT_EXCLUDE_PATTERNS.forEach((p, i) => {
    qb.andWhere(`s.stock_name NOT ILIKE :p${i}`, { [`p${i}`]: p });
  });

  qb.orderBy('s.stock_id', 'ASC');

  return qb.getRawMany<StockOptionItem>();
}

export async function lookupStocks(
  ds: DataSource,
  q: string,
  limit: number
): Promise<StockOptionItem[]> {
  const repo = ds.getRepository(StockInfoSchema);

  const keyword = q.trim();
  if (!keyword) return [];

  const safeLimit = clampInt(limit, 1, 50);

  const qb = repo
    .createQueryBuilder('s')
    .select(['s.stockId AS stockId', 's.stockName AS stockName'])
    .where('s.is_active = true')
    .andWhere('(s.stock_id ILIKE :kw OR s.stock_name ILIKE :kw)', { kw: `%${keyword}%` });

  DEFAULT_EXCLUDE_PATTERNS.forEach((p, i) => {
    qb.andWhere(`s.stock_name NOT ILIKE :p${i}`, { [`p${i}`]: p });
  });

  // 代碼前綴優先，讓輸入 23 可以先出現 2330 等
  qb.orderBy('CASE WHEN s.stock_id ILIKE :kwPrefix THEN 0 ELSE 1 END', 'ASC')
    .addOrderBy('s.stock_id', 'ASC')
    .setParameters({ kwPrefix: `${keyword}%` })
    .limit(safeLimit);

  return qb.getRawMany<StockOptionItem>();
}
