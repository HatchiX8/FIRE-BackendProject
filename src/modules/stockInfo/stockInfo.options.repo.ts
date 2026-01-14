import { DataSource, Repository } from 'typeorm';
import { StockInfoEntity, StockInfoSchema } from '@/entity/stockInfo.schema.js';

export class StockInfoRepository {
  private readonly repo: Repository<StockInfoEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(StockInfoSchema);
  }

  async findActiveOptions(): Promise<Array<Pick<StockInfoEntity, 'stockId' | 'stockName'>>> {
    return this.repo.find({
      select: ['stockId', 'stockName'],
      where: { isActive: true },
      order: { stockId: 'ASC' },
    });
  }
}
