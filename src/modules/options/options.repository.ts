import { AppDataSource } from '@/db/data-source.js';
import { StockInfoSchema, type StockInfoEntity } from '@/entity/stockInfo.schema.js';
import type { DataSource, Repository } from 'typeorm';

export class OptionsRepository {
  private readonly stockInfoRepo: Repository<StockInfoEntity>;

  constructor(dataSource: DataSource) {
    this.stockInfoRepo = dataSource.getRepository(StockInfoSchema);
  }

  findActiveStockOptions(): Promise<Array<Pick<StockInfoEntity, 'stockId' | 'stockName'>>> {
    return this.stockInfoRepo.find({
      select: ['stockId', 'stockName'],
      where: { isActive: true },
      order: { stockId: 'ASC' },
    });
  }
}

export const optionsRepository = new OptionsRepository(AppDataSource);
