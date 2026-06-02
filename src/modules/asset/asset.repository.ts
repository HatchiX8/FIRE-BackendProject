import { AppDataSource } from '@/db/data-source.js';
import { DealsSchema, type DealsEntity } from '@/entity/deals.schema.js';
import { LotsSchema, type LotsEntity } from '@/entity/lots.schema.js';
import { UserCapitalSchema, type UserCapitalEntity } from '@/entity/portfolioSummaries.schema.js';
import { StockInfoSchema, type StockInfoEntity } from '@/entity/stockInfo.schema.js';
import type { DataSource, DeepPartial, EntityManager, Repository } from 'typeorm';

export type AssetTransactionRepository = {
  countTodayCreatedLots(userId: string, start: Date, end: Date): Promise<number>;
  countTodayTrades(userId: string, start: Date, end: Date): Promise<number>;
  getOrCreateCapitalRow(userId: string): Promise<UserCapitalEntity>;
  getActiveStockCost(userId: string): Promise<number>;
  findStockMetaById(stockId: string): Promise<StockInfoEntity | null>;
  findLotById(lotId: string): Promise<LotsEntity | null>;
  findUserLotById(userId: string, lotId: string): Promise<LotsEntity | null>;
  findActiveBuyDeals(userId: string, lotId: string): Promise<DealsEntity[]>;
  findActiveDeals(userId: string, lotId: string): Promise<DealsEntity[]>;
  createLot(input: DeepPartial<LotsEntity>): LotsEntity;
  createDeal(input: DeepPartial<DealsEntity>): DealsEntity;
  saveLot(lot: LotsEntity): Promise<LotsEntity>;
  saveDeal(deal: DealsEntity): Promise<DealsEntity>;
  saveDeals(deals: DealsEntity[]): Promise<DealsEntity[]>;
  saveCapital(capital: UserCapitalEntity): Promise<UserCapitalEntity>;
};

export class AssetRepository {
  private readonly dataSource: DataSource;
  private readonly lotsRepo: Repository<LotsEntity>;
  private readonly capitalRepo: Repository<UserCapitalEntity>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.lotsRepo = dataSource.getRepository(LotsSchema);
    this.capitalRepo = dataSource.getRepository(UserCapitalSchema);
  }

  async getPortfolioSummaryValues(userId: string): Promise<{
    totalInvest: number;
    stockCost: number;
  }> {
    const capitalRow = await this.capitalRepo.findOne({
      where: { userId },
      select: { totalInvest: true },
    });

    return {
      totalInvest: capitalRow ? Number(capitalRow.totalInvest) : 0,
      stockCost: await getActiveStockCost(this.lotsRepo, userId),
    };
  }

  async findUserAssets(
    userId: string,
    page: number,
    pageSize: number
  ): Promise<{ rows: LotsEntity[]; count: number }> {
    const qb = this.lotsRepo
      .createQueryBuilder('l')
      .select([
        'l.lotId',
        'l.stockId',
        'l.stockName',
        'l.buyPrice',
        'l.remainingQuantity',
        'l.remainingCost',
        'l.buyDate',
        'l.note',
      ])
      .where('l.user_id = :userId', { userId })
      .andWhere('l.is_voided = false')
      .andWhere('l.remaining_quantity > 0')
      .orderBy('l.buy_date', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [rows, count] = await qb.getManyAndCount();

    return { rows, count };
  }

  runTransaction<T>(operation: (repo: AssetTransactionRepository) => Promise<T>): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      return operation(createTransactionRepository(manager));
    });
  }
}

function createTransactionRepository(manager: EntityManager): AssetTransactionRepository {
  const lotsRepo = manager.getRepository(LotsSchema);
  const dealsRepo = manager.getRepository(DealsSchema);
  const stockRepo = manager.getRepository(StockInfoSchema);
  const capitalRepo = manager.getRepository(UserCapitalSchema);

  return {
    countTodayCreatedLots: (userId, start, end) =>
      lotsRepo
        .createQueryBuilder('l')
        .where('l.user_id = :userId', { userId })
        .andWhere('l.created_at >= :start AND l.created_at < :end', {
          start,
          end,
        })
        .getCount(),

    countTodayTrades: (userId, start, end) =>
      dealsRepo
        .createQueryBuilder('d')
        .where('d.user_id = :userId', { userId })
        .andWhere('d.is_voided = false')
        .andWhere('d.dealDate >= :start AND d.dealDate < :end', {
          start,
          end,
        })
        .getCount(),

    getOrCreateCapitalRow: (userId) => getOrCreateCapitalRow(capitalRepo, userId),
    getActiveStockCost: (userId) => getActiveStockCost(lotsRepo, userId),
    findStockMetaById: (stockId) => stockRepo.findOne({ where: { stockId } }),
    findLotById: (lotId) => lotsRepo.findOne({ where: { lotId } }),
    findUserLotById: (userId, lotId) => lotsRepo.findOne({ where: { lotId, userId } }),
    findActiveBuyDeals: (userId, lotId) =>
      dealsRepo.find({
        where: { userId, lotId, type: 'buy', isVoided: false },
      }),
    findActiveDeals: (userId, lotId) =>
      dealsRepo.find({
        where: { userId, lotId, isVoided: false },
      }),
    createLot: (input) => lotsRepo.create(input),
    createDeal: (input) => dealsRepo.create(input),
    saveLot: (lot) => lotsRepo.save(lot),
    saveDeal: (deal) => dealsRepo.save(deal),
    saveDeals: (deals) => dealsRepo.save(deals),
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

async function getActiveStockCost(lotsRepo: Repository<LotsEntity>, userId: string): Promise<number> {
  const raw = await lotsRepo
    .createQueryBuilder('lot')
    .select('COALESCE(SUM(lot.remainingCost), 0)', 'stockCost')
    .where('lot.userId = :userId', { userId })
    .andWhere('lot.isVoided = false')
    .andWhere('lot.remainingQuantity > 0')
    .getRawOne<{ stockCost: string }>();

  return raw ? Number(raw.stockCost) : 0;
}

export const assetRepository = new AssetRepository(AppDataSource);
