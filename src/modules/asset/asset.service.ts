import { AppDataSource } from '@/db/data-source.js';
import { DealsSchema, type dealsEntity } from '@/entity/deals.schema.js';
import { StockInfoSchema } from '@/entity/stockInfo.schema.js';
import { UserCapitalSchema, type UserCapitalEntity } from '@/entity/portfolioSummaries.schema.js';
import { httpError } from '@/utils/index.js';
import type {
  NewAssetDto,
  AssetPortfolioDto,
  EditAssetDto,
  UserPortfolioSummaryDto,
} from './asset.dto.js';

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
  const dealsRepo = AppDataSource.getRepository(DealsSchema);

  const safePage = page > 0 ? page : 1;

  const [assets, total] = await dealsRepo.findAndCount({
    where: { userId, type: 'buy' },
    select: {
      tradeId: true,
      stockId: true,
      stockName: true,
      price: true,
      quantity: true,
      totalCost: true,
      dealDate: true,
      note: true,
    },
    order: { dealDate: 'DESC' },
    skip: (safePage - 1) * pageSize,
    take: pageSize,
  });

  const shareholding = assets.map((a) => ({
    assetId: a.tradeId,
    stockId: a.stockId,
    stockName: a.stockName,
    buyPrice: parseFloat(a.price),
    quantity: a.quantity,
    totalCost: parseFloat(a.totalCost),
    created_at: a.dealDate as unknown as string, // YYYY-MM-DD
    note: a.note ?? '',
  }));

  const totalPage = Math.max(1, Math.ceil(total / pageSize));

  return {
    shareholding,
    pagination: {
      total_page: totalPage,
      current_page: safePage,
    },
  };

  // return { shareholding: assets, pagination: { total_page: 1, current_page: 1 } };
}
// 建立資產
export async function createNewAsset(userId: string, dto: NewAssetDto): Promise<dealsEntity> {
  const { stockId, buyPrice, quantity, buyCost, buyDate, note } = dto;

  if (!stockId || !buyPrice || !quantity || !buyCost || !buyDate) {
    throw httpError(400, '請確認欄位填寫完整');
  }

  if (buyPrice <= 0 || quantity <= 0 || buyCost <= 0) {
    throw httpError(400, '價格、股數與成本必須大於 0');
  }

  const stockRepo = AppDataSource.getRepository(StockInfoSchema);
  const dealsRepo = AppDataSource.getRepository(DealsSchema);

  // 1) 先去 StockMetadata 核對是否有這檔代碼
  const stockMeta = await stockRepo.findOne({
    where: { stockId },
  });

  if (!stockMeta) {
    throw httpError(400, '查無此股票代碼');
  }

  // 2) 解析日期 YYYY/MM/DD
  const [y, m, d] = buyDate.split('/');
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);

  const buyDateObj = new Date(year, month - 1, day);
  if (!year || !month || !day || Number.isNaN(buyDateObj.getTime())) {
    throw httpError(400, '買進日期格式錯誤，需為 YYYY/MM/DD');
  }

  // 3) 建立 deals 紀錄
  const deal = dealsRepo.create({
    userId,
    stockId: stockMeta.stockId,
    stockName: stockMeta.stockName,
    type: 'buy',
    totalCost: buyCost.toString(),
    price: buyPrice.toString(),
    quantity,
    note: note ?? null,
    dealDate: buyDateObj,
  });

  const saved = await dealsRepo.save(deal);

  // 4) 更新 capitals.cost_total（+= buyCost）
  const capitalRepo = AppDataSource.getRepository(UserCapitalSchema);
  const capital = await getOrCreateCapitalRow(userId);

  const nextCostTotal = Number(capital.costTotal) + buyCost;
  capital.costTotal = nextCostTotal.toString();
  capital.updatedAt = new Date();

  await capitalRepo.save(capital);

  return saved;
}

// 編輯資產
export async function updateAsset(
  userId: string,
  assetId: string,
  dto: EditAssetDto
): Promise<dealsEntity> {
  const { stockId, buyDate, buyPrice, quantity, buyCost, note } = dto;

  if (!stockId || !buyDate || !buyPrice || !quantity || !buyCost) {
    throw httpError(400, '請確認欄位填寫完整');
  }
  if (buyPrice <= 0 || quantity <= 0 || buyCost <= 0) {
    throw httpError(400, '價格、股數與成本必須大於 0');
  }

  const dealsRepo = AppDataSource.getRepository(DealsSchema);
  const stockRepo = AppDataSource.getRepository(StockInfoSchema);

  // 1) 先找出原本的資產（僅限自己的、且為 buy）
  const asset = await dealsRepo.findOne({
    where: { tradeId: assetId, userId, type: 'buy' },
  });
  if (!asset) {
    throw httpError(400, '找不到要編輯的資產');
  }

  const oldCost = Number(asset.totalCost);

  // 2) 核對股票代碼
  const stockMeta = await stockRepo.findOne({ where: { stockId } });
  if (!stockMeta) {
    throw httpError(400, '查無此股票代碼');
  }

  // 3) 解析日期 YYYY/MM/DD
  const [y, m, d] = buyDate.split('/');
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);

  const buyDateObj = new Date(year, month - 1, day);
  if (!year || !month || !day || Number.isNaN(buyDateObj.getTime())) {
    throw httpError(400, '買進日期格式錯誤，需為 YYYY/MM/DD');
  }

  // 4) 更新 deals 欄位
  asset.stockId = stockMeta.stockId;
  asset.stockName = stockMeta.stockName;
  asset.price = buyPrice.toString();
  asset.quantity = quantity;
  asset.totalCost = buyCost.toString();
  asset.note = note ?? null;
  asset.dealDate = buyDateObj;

  const saved = await dealsRepo.save(asset);

  // 5) 調整 capitals.cost_total = cost_total + (新成本 - 舊成本)
  const capitalRepo = AppDataSource.getRepository(UserCapitalSchema);
  const capital = await getOrCreateCapitalRow(userId);

  const diff = buyCost - oldCost;
  const nextCostTotal = Number(capital.costTotal) + diff;

  if (nextCostTotal < 0) {
    throw httpError(400, '調整後持倉總成本不可小於 0');
  }

  capital.costTotal = nextCostTotal.toString();
  capital.updatedAt = new Date();

  await capitalRepo.save(capital);

  return saved;
}

// 刪除資產
export async function deleteAsset(userId: string, assetId: string): Promise<void> {
  const dealsRepo = AppDataSource.getRepository(DealsSchema);

  // 1) 只允許刪除自己的、且為 buy 的資產
  const asset = await dealsRepo.findOne({
    where: { tradeId: assetId, userId, type: 'buy' },
  });

  if (!asset) {
    throw httpError(400, '找不到要刪除的資產');
  }

  const oldCost = Number(asset.totalCost);

  // 2) 先刪除 deals 紀錄
  await dealsRepo.remove(asset);

  // 3) 調整 capitals.cost_total = cost_total - oldCost
  const capitalRepo = AppDataSource.getRepository(UserCapitalSchema);
  const capital = await getOrCreateCapitalRow(userId);

  const nextCostTotal = Number(capital.costTotal) - oldCost;

  // 不允許小於 0，直接歸 0
  capital.costTotal = nextCostTotal > 0 ? nextCostTotal.toString() : '0';
  capital.updatedAt = new Date();

  await capitalRepo.save(capital);
}
// ---------------------------

// 共用：取得資金列，不存在就建立（total_invest, cost_total 預設 0）
async function getOrCreateCapitalRow(userId: string): Promise<UserCapitalEntity> {
  const capitalRepo = AppDataSource.getRepository(UserCapitalSchema);

  const exist = await capitalRepo.findOne({ where: { userId } });
  if (exist) return exist;

  const created: UserCapitalEntity = {
    userId,
    totalInvest: '0',
    costTotal: '0',
    updatedAt: new Date(),
  };

  return capitalRepo.save(created);
}
