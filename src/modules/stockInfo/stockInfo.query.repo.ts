import { DataSource, Repository } from 'typeorm';
import { type StockPricesEntity, StockPricesSchema } from '@/entity/currentStockPrices.schema.js';
import { type StockInfoEntity, StockInfoSchema } from '@/entity/stockInfo.schema.js';

export class StockPricesRepository {
  private repo: Repository<StockPricesEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(StockPricesSchema);
  }

  async findAllDistinct(): Promise<Pick<StockPricesEntity, 'stockId' | 'stockName'>[]> {
    return this.repo.find({
      select: ['stockId', 'stockName'],
    });
  }
}

export class StockInfoRepository {
  private repo: Repository<StockInfoEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(StockInfoSchema);
  }

  async upsertMany(rows: Pick<StockInfoEntity, 'stockId' | 'stockName' | 'note'>[]): Promise<void> {
    await this.repo.upsert(rows, ['stockId']);
  }
}
