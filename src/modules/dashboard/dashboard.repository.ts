import { AppDataSource } from '@/db/data-source.js';
import { DealsSchema, type DealsEntity } from '@/entity/deals.schema.js';
import { LotsSchema, type LotsEntity } from '@/entity/lots.schema.js';
import { UserCapitalSchema, type UserCapitalEntity } from '@/entity/portfolioSummaries.schema.js';
import { StockInfoSchema, type StockInfoEntity } from '@/entity/stockInfo.schema.js';
import type { DataSource, DeepPartial, EntityManager, Repository } from 'typeorm';

export type DashboardTransactionRepository = {
  countCreatedTrades(userId: string, start: Date, end: Date): Promise<number>;
  countDealDateTrades(userId: string, start: Date, end: Date): Promise<number>;
  getOrCreateCapitalRow(userId: string): Promise<UserCapitalEntity>;
  findStockMetaById(stockId: string): Promise<StockInfoEntity | null>;
  findActiveSellDealWithLot(userId: string, tradeId: string): Promise<DealsEntity | null>;
  findUserLot(userId: string, lotId: string): Promise<LotsEntity | null>;
  createLot(input: DeepPartial<LotsEntity>): LotsEntity;
  createDeal(input: DeepPartial<DealsEntity>): DealsEntity;
  saveLot(lot: LotsEntity): Promise<LotsEntity>;
  saveDeal(deal: DealsEntity): Promise<DealsEntity>;
  saveCapital(capital: UserCapitalEntity): Promise<UserCapitalEntity>;
};

export class DashboardRepository {
  private readonly dataSource: DataSource;
  private readonly dealsRepo: Repository<DealsEntity>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.dealsRepo = dataSource.getRepository(DealsSchema);
  }

  async findUserSellDealsByPeriod(
    userId: string,
    start: string,
    end: string,
    page: number,
    pageSize: number
  ): Promise<{ rows: DealsEntity[]; count: number }> {
    const qb = this.dealsRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.lot', 'l')
      .where('d.userId = :userId', { userId })
      .andWhere('d.type = :type', { type: 'sell' })
      .andWhere('d.isVoided = false')
      .andWhere('d.dealDate >= :start AND d.dealDate < :end', {
        start,
        end,
      })
      .orderBy('d.dealDate', 'DESC')
      .addOrderBy('d.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [rows, count] = await qb.getManyAndCount();

    return { rows, count };
  }

  findMonthlyRealizedPnl(
    userId: string,
    start: string,
    end: string
  ): Promise<Array<{ month: string; pnl: string }>> {
    return this.dealsRepo
      .createQueryBuilder('d')
      .select(`TO_CHAR(d.dealDate, 'MM')`, 'month')
      .addSelect('COALESCE(SUM(d.realizedPnl), 0)', 'pnl')
      .where('d.userId = :userId', { userId })
      .andWhere('d.type = :type', { type: 'sell' })
      .andWhere('d.isVoided = false')
      .andWhere('d.dealDate >= :start AND d.dealDate < :end', {
        start,
        end,
      })
      .groupBy(`TO_CHAR(d.dealDate, 'MM')`)
      .orderBy(`TO_CHAR(d.dealDate, 'MM')`, 'ASC')
      .getRawMany<{ month: string; pnl: string }>();
  }

  runTransaction<T>(operation: (repo: DashboardTransactionRepository) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      return operation(createTransactionRepository(manager));
    });
  }
}

function createTransactionRepository(manager: EntityManager): DashboardTransactionRepository {
  const stockRepo = manager.getRepository(StockInfoSchema);
  const lotsRepo = manager.getRepository(LotsSchema);
  const dealsRepo = manager.getRepository(DealsSchema);
  const capitalRepo = manager.getRepository(UserCapitalSchema);

  return {
    countCreatedTrades: (userId, start, end) =>
      dealsRepo
        .createQueryBuilder('d')
        .where('d.userId = :userId', { userId })
        .andWhere('d.isVoided = false')
        .andWhere('d.createdAt >= :start AND d.createdAt < :end', {
          start,
          end,
        })
        .getCount(),
    countDealDateTrades: (userId, start, end) =>
      dealsRepo
        .createQueryBuilder('d')
        .where('d.userId = :userId', { userId })
        .andWhere('d.isVoided = false')
        .andWhere('d.dealDate >= :start AND d.dealDate < :end', {
          start,
          end,
        })
        .getCount(),
    getOrCreateCapitalRow: (userId) => getOrCreateCapitalRow(capitalRepo, userId),
    findStockMetaById: (stockId) => stockRepo.findOne({ where: { stockId } }),
    findActiveSellDealWithLot: (userId, tradeId) =>
      dealsRepo.findOne({
        where: {
          tradeId,
          userId,
          type: 'sell',
          isVoided: false,
        },
        relations: ['lot'],
      }),
    findUserLot: (userId, lotId) => lotsRepo.findOne({ where: { lotId, userId } }),
    createLot: (input) => lotsRepo.create(input),
    createDeal: (input) => dealsRepo.create(input),
    saveLot: (lot) => lotsRepo.save(lot),
    saveDeal: (deal) => dealsRepo.save(deal),
    saveCapital: (capital) => capitalRepo.save(capital),
  };
}

async function getOrCreateCapitalRow(
  capitalRepo: Repository<UserCapitalEntity>,
  userId: string
): Promise<UserCapitalEntity> {
  const exist = await capitalRepo.findOne({ where: { userId } });
  if (exist) return exist;

  const created: UserCapitalEntity = {
    userId,
    totalInvest: '0',
    updatedAt: new Date(),
  };

  return capitalRepo.save(created);
}

export const dashboardRepository = new DashboardRepository(AppDataSource);
