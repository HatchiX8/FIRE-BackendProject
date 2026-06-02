import { AppDataSource } from '@/db/data-source.js';
import { StockPricesSchema } from '@/entity/currentStockPrices.schema.js';
import type { DataSource } from 'typeorm';

export type UpsertStockPriceInput = {
  stockId: string;
  stockName: string;
  closePrice?: number | null;
};

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

export class StockInfoPriceRepository {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * 用於 init 模式判斷是否已經灌過資料
   */
  async hasAnyStockPrice(): Promise<boolean> {
    const repo = this.dataSource.getRepository(StockPricesSchema);
    const count = await repo.count();
    return count > 0;
  }

  /**
   * 重要：不用 repo.upsert（避免大量資料時 pg bind 問題）
   * 改用 QueryBuilder + 分批 insert ... on conflict do update
   *
   * - 無 raw SQL
   * - 可重跑（upsert）
   */
  async upsertStockPricesChunked(rows: UpsertStockPriceInput[]): Promise<number> {
    if (rows.length === 0) return 0;

    const chunkSize = Number(process.env.STOCK_UPSERT_CHUNK_SIZE ?? 300);
    const chunks = chunkArray(rows, chunkSize);

    await this.dataSource.transaction(async (trx) => {
      const repo = trx.getRepository(StockPricesSchema);

      for (const chunk of chunks) {
        if (chunk.length === 0) continue;

        await repo
          .createQueryBuilder()
          .insert()
          .into(StockPricesSchema)
          .values(
            chunk.map((row) => ({
              stockId: row.stockId,
              stockName: row.stockName,
              closePrice: row.closePrice ?? null,
            }))
          )
          // 注意：orUpdate 這裡用「DB 欄位名」
          .orUpdate(['stock_name', 'close_price', 'updated_at'], ['stock_id'])
          .execute();
      }
    });

    return rows.length;
  }
}

export const stockInfoPriceRepository = new StockInfoPriceRepository(AppDataSource);
