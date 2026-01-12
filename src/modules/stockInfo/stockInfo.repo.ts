import type { DataSource } from 'typeorm';
import { StockInfoSchema } from '@/entity/stockInfo.schema.js';

export type UpsertStockInfoInput = {
  stockId: string;
  stockName: string;
};

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

/**
 * 用於 init 模式判斷是否已經灌過資料
 */
export async function hasAnyStockInfo(ds: DataSource): Promise<boolean> {
  const repo = ds.getRepository(StockInfoSchema);
  const count = await repo.count();
  return count > 0;
}

/**
 * 重要：不用 repo.upsert（避免大量資料時 pg bind 問題）
 * 改用 QueryBuilder + 分批 insert ... on conflict do update
 *
 * - 無 raw SQL
 * - 無 class
 * - 可重跑（upsert）
 */
export async function upsertStockInfoChunked(
  ds: DataSource,
  rows: UpsertStockInfoInput[]
): Promise<number> {
  if (rows.length === 0) return 0;

  const chunkSize = Number(process.env.STOCK_UPSERT_CHUNK_SIZE ?? 300);
  const chunks = chunkArray(rows, chunkSize);

  await ds.transaction(async (trx) => {
    const repo = trx.getRepository(StockInfoSchema);

    for (const chunk of chunks) {
      if (chunk.length === 0) continue;

      await repo
        .createQueryBuilder()
        .insert()
        .into(StockInfoSchema)
        .values(
          chunk.map((r) => ({
            stockId: r.stockId,
            stockName: r.stockName,
            isActive: true,
          }))
        )
        // 注意：orUpdate 這裡用「DB 欄位名」
        .orUpdate(['stock_name', 'is_active', 'updated_at'], ['stock_id'])
        .execute();
    }
  });

  return rows.length;
}
