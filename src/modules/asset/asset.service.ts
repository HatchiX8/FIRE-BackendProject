import { AppDataSource } from '@/db/data-source.js';
import { DealsSchema, type DealsEntity } from '@/entity/deals.schema.js';
import { LotsSchema, type LotsEntity } from '@/entity/lots.schema.js';
import { StockInfoSchema } from '@/entity/stockInfo.schema.js';
import { UserCapitalSchema, type UserCapitalEntity } from '@/entity/portfolioSummaries.schema.js';
import { httpError } from '@/utils/index.js';
import type {
  NewAssetDto,
  AssetPortfolioDto,
  EditAssetDto,
  UserPortfolioSummaryDto,
} from './asset.dto.js';
import type { EntityManager } from 'typeorm';

// ----------資產操作----------
// 取得資產比例
export async function getUserPortfolioSummary(userId: string): Promise<UserPortfolioSummaryDto> {
  const capitalRepo = AppDataSource.getRepository(UserCapitalSchema);

  const row = await capitalRepo.findOne({
    where: { userId },
    select: {
      totalInvest: true,
      costTotal: true,
    },
  });

  const totalInvest = row ? Number(row.totalInvest) : 0;
  const stockCost = row ? Number(row.costTotal) : 0;

  const cashInvest = totalInvest - stockCost < 0 ? 0 : totalInvest - stockCost;
  const positionRatio = totalInvest > 0 ? Number((stockCost / totalInvest).toFixed(3)) : 0;

  return {
    totalInvest,
    cashInvest,
    // stockValue: 0, // 未來擴充股票市值計算
    stockCost,
    positionRatio,
    // stockProfit: 0, // 未來擴充未實現損益
    // profitRate: 0, // 未來擴充未實現損益報酬率
  };
}

// 取得資產
export async function getUserAssets(
  userId: string,
  page: number,
  pageSize = 10
): Promise<AssetPortfolioDto> {
  const lotsRepo = AppDataSource.getRepository(LotsSchema);
  const safePage = page > 0 ? page : 1;

  const [lots, total] = await lotsRepo.findAndCount({
    where: {
      userId,
    },
  });

  // 上面 findAndCount 無法寫 remaining_quantity > 0，所以我們用 QueryBuilder
  const qb = lotsRepo
    .createQueryBuilder('l')
    .select([
      'l.lotId',
      'l.stockId',
      'l.stockName',
      'l.buyPrice',
      'l.remainingQuantity',
      'l.buyAmount',
      'l.buyDate',
      'l.note',
    ])
    .where('l.user_id = :userId', { userId })
    .andWhere('l.is_voided = false')
    .andWhere('l.remaining_quantity > 0')
    .orderBy('l.buy_date', 'DESC')
    .skip((safePage - 1) * pageSize)
    .take(pageSize);

  const [rows, count] = await qb.getManyAndCount();

  const shareholding = rows.map((r) => ({
    assetId: r.lotId, // 改成 lotId 作為前端資產 id
    stockId: r.stockId,
    stockName: r.stockName,
    buyPrice: parseFloat(r.buyPrice),
    quantity: r.remainingQuantity,
    totalCost: parseFloat(r.buyAmount),
    created_at: r.buyDate as unknown as string, // YYYY-MM-DD
    note: r.note ?? '',
  }));

  const totalPage = Math.max(1, Math.ceil(count / pageSize));

  return {
    shareholding,
    pagination: {
      total_page: totalPage,
      current_page: safePage,
    },
  };
}

// 建立資產
export async function createNewAsset(
  userId: string,
  dto: NewAssetDto
): Promise<{ lotId: string; tradeId: string }> {
  const { stockId, buyPrice, quantity, buyDate, note } = dto;

  if (!stockId || !buyPrice || !quantity || !buyDate) {
    throw httpError(400, '請確認欄位填寫完整');
  }
  if (buyPrice <= 0 || quantity <= 0) {
    throw httpError(400, '價格與股數必須大於 0');
  }

  const buyDateObj = parseYMDSlashDate(buyDate, '買進日期');

  // 後端計算總成本（固定兩位小數）
  const computedCost = roundTo2(buyPrice * quantity); // number
  const buyAmountStr = computedCost.toFixed(2); // string

  return AppDataSource.transaction(async (manager) => {
    const stockRepo = manager.getRepository(StockInfoSchema);
    const lotsRepo = manager.getRepository(LotsSchema);
    const dealsRepo = manager.getRepository(DealsSchema);
    const capitalRepo = manager.getRepository(UserCapitalSchema);

    const stockMeta = await stockRepo.findOne({ where: { stockId } });
    if (!stockMeta) throw httpError(400, '查無此股票代碼');

    const lot = lotsRepo.create({
      userId,
      stockId: stockMeta.stockId,
      stockName: stockMeta.stockName,
      buyDate: buyDateObj,
      buyPrice: buyPrice.toString(),
      buyQuantity: quantity,
      remainingQuantity: quantity,
      buyAmount: buyAmountStr,
      note: note ?? null,
    });
    const savedLot = await lotsRepo.save(lot);

    const deal = dealsRepo.create({
      userId,
      lotId: savedLot.lotId,
      stockId: stockMeta.stockId,
      stockName: stockMeta.stockName,
      type: 'buy',
      totalCost: buyAmountStr,
      price: buyPrice.toString(),
      quantity,
      dealDate: buyDateObj,
    });
    const savedDeal = await dealsRepo.save(deal);

    const capital = await getOrCreateCapitalRow(userId, manager);

    // 這裡暫用 Number 是 MVP 可接受版；若你要嚴格 decimal，我可再幫你改成字串加法
    const nextCostTotal = roundTo2(Number(capital.costTotal) + computedCost).toFixed(2);

    capital.costTotal = nextCostTotal;
    capital.updatedAt = new Date();
    await capitalRepo.save(capital);

    return { lotId: savedLot.lotId, tradeId: savedDeal.tradeId };
  });
}

function roundTo2(n: number): number {
  return Math.round(n * 100) / 100;
}

// 編輯資產
export async function updateAsset(userId: string, lotId: string, dto: EditAssetDto): Promise<void> {
  if (!lotId) throw httpError(400, 'lotId 不可為空');

  const { stockId, buyDate, buyPrice, quantity, buyCost, note } = dto;

  if (!stockId || !buyDate || !buyPrice || !quantity || !buyCost) {
    throw httpError(400, '請確認欄位填寫完整');
  }
  if (buyPrice <= 0 || quantity <= 0 || buyCost <= 0) {
    throw httpError(400, '價格、股數與成本必須大於 0');
  }

  const buyDateObj = parseYMDSlashDate(buyDate, '買進日期');

  return AppDataSource.transaction(async (manager) => {
    const now = new Date();

    const lotsRepo = manager.getRepository(LotsSchema);
    const stockRepo = manager.getRepository(StockInfoSchema);
    const capitalRepo = manager.getRepository(UserCapitalSchema);
    const dealsRepo = manager.getRepository(DealsSchema);

    const lot = await lotsRepo.findOne({ where: { lotId } });
    if (!lot) throw httpError(400, '找不到要編輯的資產');
    if (lot.isVoided) throw httpError(400, '此資產已刪除，無法編輯');
    if (lot.remainingQuantity !== lot.buyQuantity) {
      throw httpError(400, '此資產已部分或全部賣出，無法編輯價格與數量');
    }

    const oldCost = Number(lot.buyAmount);

    const stockMeta = await stockRepo.findOne({ where: { stockId } });
    if (!stockMeta) throw httpError(400, '查無此股票代碼');

    // 先處理 buy deal：確保只有一筆有效
    const activeBuyDeals = await dealsRepo.find({
      where: { userId, lotId, type: 'buy', isVoided: false },
    });

    if (activeBuyDeals.length !== 1) {
      throw httpError(
        500,
        `買進交易紀錄異常（有效 buy deals = ${activeBuyDeals.length}），請檢查資料一致性`
      );
    }

    const oldBuyDeal = activeBuyDeals[0];
    oldBuyDeal.isVoided = true;
    oldBuyDeal.voidedAt = now;
    oldBuyDeal.updatedAt = now;
    await dealsRepo.save(oldBuyDeal);

    const newBuyDeal = dealsRepo.create({
      userId,
      lotId,
      stockId: stockMeta.stockId,
      stockName: stockMeta.stockName,
      type: 'buy',
      price: buyPrice.toString(),
      quantity,
      totalCost: buyCost.toString(),
      dealDate: buyDateObj,
      isVoided: false,
    });
    await dealsRepo.save(newBuyDeal);

    // 更新 lot
    lot.stockId = stockMeta.stockId;
    lot.stockName = stockMeta.stockName;
    lot.buyDate = buyDateObj;
    lot.buyPrice = buyPrice.toString();
    lot.buyQuantity = quantity;
    lot.remainingQuantity = quantity;
    lot.buyAmount = buyCost.toString();
    lot.note = note ?? null;
    lot.updatedAt = now;
    await lotsRepo.save(lot);

    // 更新 capital
    const capital = await getOrCreateCapitalRow(userId, manager);
    const diff = buyCost - oldCost;

    const nextCostTotal = Number(capital.costTotal) + diff;
    if (nextCostTotal < 0) throw httpError(400, '調整後持倉總成本不可小於 0');

    capital.costTotal = nextCostTotal.toString();
    capital.updatedAt = now;
    await capitalRepo.save(capital);
  });
}

// 刪除資產
// 刪除資產：改成 transaction
export async function deleteAsset(userId: string, lotId: string): Promise<void> {
  return AppDataSource.transaction(async (manager) => {
    const lotsRepo = manager.getRepository(LotsSchema);
    const dealsRepo = manager.getRepository(DealsSchema);
    const capitalRepo = manager.getRepository(UserCapitalSchema);

    const lot = await lotsRepo.findOne({
      where: { lotId, userId },
    });

    if (!lot) {
      throw httpError(400, '找不到要刪除的資產');
    }

    if (lot.isVoided) {
      // 重複刪除視為 no-op 或丟錯都可；我建議丟錯讓前端知道狀態
      throw httpError(400, '此資產已刪除');
    }

    // 已發生賣出就不允許刪除（MVP 先這樣定死）
    if (lot.remainingQuantity !== lot.buyQuantity) {
      throw httpError(400, '此資產已部分或全部賣出，無法刪除');
    }

    const now = new Date();
    const oldCost = Number(lot.buyAmount);

    // 1) 作廢 lot
    lot.isVoided = true;
    lot.voidedAt = now;
    lot.updatedAt = now;
    await lotsRepo.save(lot);

    // 2) 作廢對應的 buy deal（同 lotId 的 buy）
    const buyDeal = await dealsRepo.findOne({
      where: { userId, lotId, type: 'buy', isVoided: false },
    });

    if (buyDeal) {
      buyDeal.isVoided = true;
      buyDeal.voidedAt = now;
      buyDeal.updatedAt = now;
      await dealsRepo.save(buyDeal);
    }

    // 3) 調整資金 cost_total
    const capital = await getOrCreateCapitalRow(userId, manager);

    const nextCostTotal = Number(capital.costTotal) - oldCost;
    capital.costTotal = nextCostTotal > 0 ? nextCostTotal.toString() : '0';
    capital.updatedAt = now;

    await capitalRepo.save(capital);
  });
}

// ---------------------------

// 共用：取得資金列，不存在就建立（total_invest, cost_total 預設 0）
// 注意：transaction 內一定要用 manager 的 repo
async function getOrCreateCapitalRow(
  userId: string,
  manager?: EntityManager
): Promise<UserCapitalEntity> {
  const repo = manager
    ? manager.getRepository(UserCapitalSchema)
    : AppDataSource.getRepository(UserCapitalSchema);

  const exist = await repo.findOne({ where: { userId } });
  if (exist) return exist;

  const created: UserCapitalEntity = {
    userId,
    totalInvest: '0',
    costTotal: '0',
    updatedAt: new Date(),
  };

  return repo.save(created);
}

function parseYMDSlashDate(input: string, fieldName: string): Date {
  const [y, m, d] = input.split('/');
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);

  const dt = new Date(year, month - 1, day);
  if (!year || !month || !day || Number.isNaN(dt.getTime())) {
    throw httpError(400, `${fieldName}格式錯誤，需為 YYYY/MM/DD`);
  }
  return dt;
}
