import { httpError, roundTo2 } from '@/utils/index.js';
import type {
  NewAssetDto,
  AssetPortfolioDto,
  EditAssetDto,
  UserPortfolioSummaryDto,
  sellAssetDto,
} from './asset.dto.js';
import { assetRepository } from './asset.repository.js';

type UserRole = 'guest' | 'user' | 'admin';

// 訪客配額
const GUEST_ACTIVE_LOTS_LIMIT = 10;
const GUEST_DAILY_TRADES_LIMIT = 50;
// 一般使用者配額（之後要改成不限制，就把值調整或改成 Infinity）
const BASIC_ACTIVE_LOTS_LIMIT = 200;
const BASIC_DAILY_TRADES_LIMIT = 500;

// ----------資產操作----------
// 取得資產比例
export async function getUserPortfolioSummary(userId: string): Promise<UserPortfolioSummaryDto> {
  const { totalInvest, stockCost } = await assetRepository.getPortfolioSummaryValues(userId);

  // 3) cashInvest / positionRatio
  //    cashInvest 在沒有 cash 帳的情況下，只能視為「非持倉部分的近似」。
  const cashInvest = totalInvest - stockCost < 0 ? 0 : Number((totalInvest - stockCost).toFixed(2));
  const positionRatio = totalInvest > 0 ? Number((stockCost / totalInvest).toFixed(3)) : 0;

  return {
    totalInvest,
    cashInvest,
    stockCost,
    positionRatio,
  };
}

// 取得資產
export async function getUserAssets(
  userId: string,
  page: number,
  pageSize = 10
): Promise<AssetPortfolioDto> {
  const safePage = page > 0 ? page : 1;
  const { rows, count } = await assetRepository.findUserAssets(userId, safePage, pageSize);

  const shareholding = rows.map((r) => ({
    assetId: r.lotId, // 改成 lotId 作為前端資產 id
    stockId: r.stockId,
    stockName: r.stockName,
    buyPrice: parseFloat(r.buyPrice),
    quantity: r.remainingQuantity,
    totalCost: parseFloat(r.remainingCost),
    buyDate: r.buyDate as unknown as string, // YYYY-MM-DD
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
  dto: NewAssetDto,
  role: UserRole
): Promise<{ lotId: string; tradeId: string }> {
  const { stockId, buyPrice, quantity, buyCost, buyDate, note } = dto;

  // 1) 必填驗證（避免 0 被當成缺值：用 == null）
  if (!stockId || !buyDate || buyPrice == null || quantity == null || buyCost == null) {
    throw httpError(400, '請確認欄位填寫完整');
  }

  // 2) 型別/數值合法性
  if (!Number.isFinite(buyPrice) || !Number.isFinite(quantity) || !Number.isFinite(buyCost)) {
    throw httpError(400, '價格、股數與成本格式不正確');
  }

  if (buyPrice <= 0 || quantity <= 0 || buyCost <= 0) {
    throw httpError(400, '價格、股數與成本必須大於 0');
  }

  const buyDateObj = parseYMDSlashDateLocal(buyDate, '買進日期');

  // 3) 成本以使用者輸入為準（固定兩位小數）
  const buyCost2 = roundTo2(buyCost);
  const buyAmountStr = buyCost2.toFixed(2);

  return assetRepository.runTransaction(async (repo) => {
    // ✅ 依角色取得本次配額
    const { activeLotsLimit, dailyTradesLimit } = getQuotaByRole(role);

    // 1) active lots：未撤銷且剩餘股數 > 0 的 lot 數量（只有有上限的角色才檢查）
    if (activeLotsLimit != null) {
      const { start, end } = getTodayRange();
      const todayCreatedLotsCount = await repo.countTodayCreatedLots(userId, start, end);

      if (todayCreatedLotsCount >= activeLotsLimit) {
        throw httpError(429, '已達今日建倉上限，無法新增資產，訪客會員可申請升級獲取更高配額');
      }
    }

    // 2) 今日交易數（buy + sell）（只有有上限的角色才檢查）
    if (dailyTradesLimit != null) {
      const { start, end } = getTodayRange();
      const todayTradesCount = await repo.countTodayTrades(userId, start, end);

      if (todayTradesCount >= dailyTradesLimit) {
        throw httpError(429, '已達今日可建立交易上限，無法新增資產');
      }
    }

    const capital = await repo.getOrCreateCapitalRow(userId);

    // ✅ 計算現有所有 active lots 的總持股成本
    const currentStockCost = await repo.getActiveStockCost(userId);
    const availableCash = Number(capital.totalInvest) - currentStockCost;

    // ✅ 如果現金已透支，不允許建倉
    if (availableCash < 0) {
      throw httpError(400, '現金部位已不足，無法進行操作');
    }

    // ✅ 檢查新建倉是否會超過可用現金
    if (buyCost > availableCash) {
      throw httpError(
        400,
        `所輸入的買進成本大於現金部位，無法成功編輯，請確認可用現金：${availableCash.toFixed(2)}`
      );
    }

    const stockMeta = await repo.findStockMetaById(stockId);
    if (!stockMeta) throw httpError(400, '查無此股票代碼');

    const lot = repo.createLot({
      userId,
      stockId: stockMeta.stockId,
      stockName: stockMeta.stockName,
      buyDate: buyDateObj,
      buyPrice: buyPrice.toString(),
      buyQuantity: quantity,
      remainingQuantity: quantity,
      remainingCost: buyAmountStr,
      buyAmount: buyAmountStr,
      note: note ?? null,
    });
    const savedLot = await repo.saveLot(lot);

    const deal = repo.createDeal({
      userId,
      lotId: savedLot.lotId,
      stockId: stockMeta.stockId,
      stockName: stockMeta.stockName,
      type: 'buy',
      totalCost: buyAmountStr,
      price: buyPrice.toString(),
      quantity,
      dealDate: buyDateObj,
      isVoided: false,
      note: note ?? null,
      sellCost: '0',
    });
    const savedDeal = await repo.saveDeal(deal);

    return { lotId: savedLot.lotId, tradeId: savedDeal.tradeId };
  });
}

// 編輯資產
export async function updateAsset(userId: string, lotId: string, dto: EditAssetDto): Promise<void> {
  if (!lotId) throw httpError(400, 'lotId 不可為空');

  const { stockId, buyDate, buyPrice, quantity, buyCost, note } = dto;

  // 1) 必填驗證（避免 0 被當缺值：用 == null）
  if (!stockId || !buyDate || buyPrice == null || quantity == null || buyCost == null) {
    throw httpError(400, '請確認欄位填寫完整');
  }

  // 2) 型別/數值合法性
  if (!Number.isFinite(buyPrice) || !Number.isFinite(quantity) || !Number.isFinite(buyCost)) {
    throw httpError(400, '價格、股數與成本格式不正確');
  }

  if (buyPrice <= 0 || quantity <= 0 || buyCost <= 0) {
    throw httpError(400, '價格、股數與成本必須大於 0');
  }

  const buyDateObj = parseYMDSlashDateLocal(buyDate, '買進日期');
  const now = new Date();

  // 統一兩位小數字串
  const buyPriceStr = roundTo2(buyPrice).toFixed(2);
  const buyCostStr = roundTo2(buyCost).toFixed(2);

  return assetRepository.runTransaction(async (repo) => {
    const lot = await repo.findLotById(lotId);
    if (!lot) throw httpError(400, '找不到要編輯的資產');
    if (lot.isVoided) throw httpError(400, '此資產已刪除，無法編輯');

    // 只允許尚未賣出（避免部分賣出後改成本造成帳亂）
    if (lot.remainingQuantity !== lot.buyQuantity) {
      throw httpError(400, '此資產已部分或全部賣出，無法編輯價格、數量與成本');
    }

    const stockMeta = await repo.findStockMetaById(stockId);
    if (!stockMeta) throw httpError(400, '查無此股票代碼');

    // 取得有效 buy deal：理論上只能有一筆
    const activeBuyDeals = await repo.findActiveBuyDeals(userId, lotId);

    if (activeBuyDeals.length !== 1) {
      throw httpError(
        500,
        `買進交易紀錄異常（有效 buy deals = ${activeBuyDeals.length}），請檢查資料一致性`
      );
    }

    const capital = await repo.getOrCreateCapitalRow(userId);
    // ✅ 計算現有所有 active lots 的總持股成本
    const currentStockCost = await repo.getActiveStockCost(userId);
    const availableCash = Number(capital.totalInvest) - currentStockCost;

    // 如果現金已透支，不允許建倉
    if (availableCash < 0) {
      throw httpError(400, '現金部位已不足，無法進行操作');
    }

    
    // 計算「成本差額」= 新成本 - 舊成本
    const oldCost = Number(lot.remainingCost);
    const costDiff = buyCost - oldCost;

    // 只有「成本增加」時才需要檢查現金
    // 如果 costDiff <= 0（成本減少或不變），不需要檢查
    if (costDiff > 0) {
      if (costDiff > availableCash) {
        throw httpError(
          400,
          `編輯後成本會增加 ${costDiff.toFixed(2)}，但可用現金只有 ${availableCash.toFixed(2)}，無法成功編輯`
        );
      }
    }

    // 作廢舊的 buy deal
    const oldBuyDeal = activeBuyDeals[0];
    oldBuyDeal.isVoided = true;
    oldBuyDeal.voidedAt = now;
    oldBuyDeal.updatedAt = now;
    await repo.saveDeal(oldBuyDeal);

    // 建立新的 buy deal（成本以使用者輸入 buyCost 為準）
    const newBuyDeal = repo.createDeal({
      userId,
      lotId,
      stockId: stockMeta.stockId,
      stockName: stockMeta.stockName,
      type: 'buy',
      price: buyPriceStr,
      quantity,
      totalCost: buyCostStr,
      dealDate: buyDateObj,
      isVoided: false,
      note: note ?? null,
      sellCost: '0',
    });
    await repo.saveDeal(newBuyDeal);

    // 更新 lot（因為尚未賣出，remainingCost 也應等於 buyCost）
    lot.stockId = stockMeta.stockId;
    lot.stockName = stockMeta.stockName;
    lot.buyDate = buyDateObj;
    lot.buyPrice = buyPriceStr;
    lot.buyQuantity = quantity;
    lot.remainingQuantity = quantity;
    lot.buyAmount = buyCostStr; // 原始成本（固定值但可被你這個「編輯建倉」行為更新）
    lot.remainingCost = buyCostStr; // 尚未賣出，所以剩餘成本 = 成本
    lot.note = note ?? null;
    lot.updatedAt = now;
    await repo.saveLot(lot);
  });
}

// 刪除資產：transaction
export async function deleteAsset(userId: string, lotId: string): Promise<void> {
  if (!lotId) throw httpError(400, 'lotId 不可為空');

  return assetRepository.runTransaction(async (repo) => {
    const now = new Date();

    const lot = await repo.findUserLotById(userId, lotId);
    if (!lot) throw httpError(400, '找不到要刪除的資產');
    if (lot.isVoided) throw httpError(400, '此資產已刪除');

    // 已發生賣出就不允許刪除（MVP 先這樣定死）
    if (lot.remainingQuantity !== lot.buyQuantity) {
      throw httpError(400, '此資產已部分或全部賣出，無法刪除');
    }

    // 1) 作廢 lot
    lot.isVoided = true;
    lot.voidedAt = now;
    lot.updatedAt = now;
    await repo.saveLot(lot);

    // 2) 作廢該 lotId 的所有有效交易（理論上只有 buy，但這樣更穩）
    const activeDeals = await repo.findActiveDeals(userId, lotId);

    for (const d of activeDeals) {
      d.isVoided = true;
      d.voidedAt = now;
      d.updatedAt = now;
    }

    if (activeDeals.length > 0) {
      await repo.saveDeals(activeDeals);
    }
  });
}

// 賣出資產
export async function sellAsset(
  userId: string,
  lotId: string,
  dto: sellAssetDto,
  role: UserRole
): Promise<string> {
  if (!lotId) throw httpError(400, 'lotId 不可為空');

  const { sellPrice, sellQty, sellCost, realizedPnl, sellDate, note } = dto;

  if (
    sellPrice == null ||
    sellQty == null ||
    sellCost == null ||
    realizedPnl == null ||
    !sellDate
  ) {
    throw httpError(400, '請確認欄位填寫完整');
  }

  if (
    !Number.isFinite(sellPrice) ||
    !Number.isFinite(sellQty) ||
    !Number.isFinite(sellCost) ||
    !Number.isFinite(realizedPnl)
  ) {
    throw httpError(400, '數值欄位格式不正確');
  }

  if (sellPrice <= 0 || sellQty <= 0 || sellCost <= 0) {
    throw httpError(400, '價格、股數與應收付必須大於 0');
  }

  return assetRepository.runTransaction(async (repo) => {
    const now = new Date();

    // ✅ 依角色取得本次配額
    const { dailyTradesLimit } = getQuotaByRole(role);

    // 只有有上限的角色才檢查今日交易數
    if (dailyTradesLimit != null) {
      const { start, end } = getTodayRange();
      const todayTradesCount = await repo.countTodayTrades(userId, start, end);

      // 這次賣出會多一筆 sell deal，已達上限就不讓賣
      if (todayTradesCount >= dailyTradesLimit) {
        throw httpError(429, '已達今日可建立交易上限，無法新增賣出紀錄');
      }
    }

    const lot = await repo.findLotById(lotId);
    if (!lot) throw httpError(400, '找不到要編輯的資產');
    if (lot.isVoided) throw httpError(400, '此資產已撤銷，無法賣出');

    if (sellQty > lot.remainingQuantity) {
      throw httpError(400, '您輸入的股數超過可賣出股數');
    }

    const stockMeta = await repo.findStockMetaById(lot.stockId);
    if (!stockMeta) throw httpError(400, '查無此股票代碼');

    // 這次實際賣掉的「成本部分」= 應收付 - 已實現損益
    const soldCost = roundTo2(sellCost - realizedPnl);

    if (!Number.isFinite(soldCost)) {
      throw httpError(400, '成本計算結果不合法');
    }

    // 🔴 新增：soldCost 不得超過「本次可分配的最大成本」
    // 目前平均每股成本 = 剩餘成本 / 剩餘股數
    const avgCostPerShare = Number(lot.remainingCost) / lot.remainingQuantity;
    const maxAllocatableCost = roundTo2(avgCostPerShare * sellQty);

    if (soldCost > maxAllocatableCost) {
      throw httpError(400, '此次賣出分配的成本超過可分配成本，請調整應收付金額或實際損益');
    }

    const newSellDeal = repo.createDeal({
      userId,
      lotId,
      stockId: lot.stockId,
      stockName: stockMeta.stockName,
      type: 'sell',
      price: roundTo2(sellPrice).toFixed(2),
      quantity: sellQty,
      totalCost: soldCost.toFixed(2), // 這次賣掉的成本部分
      sellCost: roundTo2(sellCost).toFixed(2),
      dealDate: sellDate,
      realizedPnl: roundTo2(realizedPnl).toFixed(2),
      isVoided: false,
      note: note ?? null,
    });
    await repo.saveDeal(newSellDeal);

    // 更新 lot
    lot.remainingQuantity = lot.remainingQuantity - sellQty;
    // 更新剩餘成本
    const nextLotRemainingCost = roundTo2(Number(lot.remainingCost) - soldCost);
    if (nextLotRemainingCost < 0) {
      throw httpError(400, '此筆 lot 持倉成本不足，請檢查輸入的應收付與損益');
    }
    lot.remainingCost = nextLotRemainingCost.toFixed(2);
    // 股數為0時，自動標記為已撤銷
    if (lot.remainingQuantity === 0) {
      lot.isVoided = true;
      lot.voidedAt = now;
    }
    lot.updatedAt = now;
    await repo.saveLot(lot);

    // 更新 capital
    const capital = await repo.getOrCreateCapitalRow(userId);

    //  累加已實現損益到 totalInvest（總資金會隨盈虧增減）
    let nextTotalInvest = roundTo2(Number(capital.totalInvest) + realizedPnl);
    if (nextTotalInvest < 0) nextTotalInvest = 0;
    capital.totalInvest = nextTotalInvest.toFixed(2);

    capital.updatedAt = now;
    await repo.saveCapital(capital);

    return lotId;
  });
}
// ---------------------------

// 解析 "YYYY/MM/DD"
function parseYMDSlashDateLocal(input: string, fieldName: string): Date {
  // ✅ 支援 "-" 與 "/"
  const sep = input.includes('-') ? '-' : '/';
  const [y, m, d] = input.split(sep);
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);

  const dt = new Date(year, month - 1, day);
  if (!year || !month || !day || Number.isNaN(dt.getTime())) {
    throw httpError(400, `${fieldName}格式錯誤，需為 YYYY/MM/DD 或 YYYY-MM-DD`);
  }
  return dt;
}

// ✅ 取得「今天」的時間範圍 [start, end)
function getTodayRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

// 依角色取得這次要套用的配額；limit 為 null 代表不限制
function getQuotaByRole(role: UserRole): {
  activeLotsLimit: number | null;
  dailyTradesLimit: number | null;
} {
  switch (role) {
    case 'guest':
      return {
        activeLotsLimit: GUEST_ACTIVE_LOTS_LIMIT,
        dailyTradesLimit: GUEST_DAILY_TRADES_LIMIT,
      };
    case 'user':
      return {
        activeLotsLimit: BASIC_ACTIVE_LOTS_LIMIT,
        dailyTradesLimit: BASIC_DAILY_TRADES_LIMIT,
      };
    case 'admin':
    default:
      // admin 預設不限制，若未來要加限制，可在這裡調整
      return {
        activeLotsLimit: null,
        dailyTradesLimit: null,
      };
  }
}
