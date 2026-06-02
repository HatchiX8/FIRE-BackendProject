import { AppDataSource } from '@/db/data-source.js';
import { type StockInfoEntity, StockInfoSchema } from '@/entity/stockInfo.schema.js';
import type { DataSource, Repository } from 'typeorm';

export class StockInfoMetadataRepository {
  private readonly repo: Repository<StockInfoEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(StockInfoSchema);
  }

  async deleteAll(): Promise<void> {
    await this.repo.createQueryBuilder().delete().from(StockInfoSchema).execute();
  }

  async upsertMany(rows: Pick<StockInfoEntity, 'stockId' | 'stockName' | 'note'>[]): Promise<void> {
    await this.repo.upsert(rows, ['stockId']);
  }
}

export const stockInfoMetadataRepository = new StockInfoMetadataRepository(AppDataSource);
