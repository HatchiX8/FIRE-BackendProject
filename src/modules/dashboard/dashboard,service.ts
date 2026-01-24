import { AppDataSource } from '@/db/data-source.js';
import { DealsSchema, type DealsEntity } from '@/entity/deals.schema.js';
import { LotsSchema, type LotsEntity } from '@/entity/lots.schema.js';
import { UserCapitalSchema, type UserCapitalEntity } from '@/entity/portfolioSummaries.schema.js';
import { StockInfoSchema } from '@/entity/stockInfo.schema.js';
import type {
  DashboardReportsDto,
  DashboardTradeReportItem,
  DashboardTrendsDto,
  DashboardTrendPoint,
  NewDashboardReportDto,
  UpdateDashboardReportDto,
} from './dashboard.dto.js';
import { httpError, roundTo2 } from '@/utils/index.js';
import type { EntityManager } from 'typeorm';

type UserRole = 'guest' | 'user' | 'admin';
// ✅ 訪客配額
const GUEST_DAILY_TRADES_LIMIT = 50;
// ✅ 一般使用者配額
const BASIC_DAILY_TRADES_LIMIT = 500;

// 取得歷史紀錄
export async function getUserDashboardReports(
  userId: string,
  year: number,
  month: number,
  page: number,
  pageSize = 10
): Promise<DashboardReportsDto> {
  // 基本驗證
  if (!Number.isInteger(year) || year < 1970 || year > 2100) {
    throw httpError(400, '年份格式不正確');
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw httpError(400, '月份格式不正確');
  }

  const safePage = page > 0 ? page : 1;

  // 計算當月起訖（使用 >= 本月1號, < 次月1號，比較吃得到索引）
  const startDate = new Date(year, month - 1, 1);
  const nextMonth = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const nextMonthStart = new Date(nextMonth.y, nextMonth.m - 1, 1);

  const startStr = formatDateForSql(startDate); // "YYYY-MM-DD"
  const nextMonthStr = formatDateForSql(nextMonthStart);

  const dealsRepo = AppDataSource.getRepository(DealsSchema);

  // QueryBuilder：只抓使用者的賣出紀錄，並 join lots 取得 buyPrice
  const qb = dealsRepo
    .createQueryBuilder('d')
    .leftJoinAndSelect('d.lot', 'l')
    .where('d.userId = :userId', { userId })
    .andWhere('d.type = :type', { type: 'sell' })
    .andWhere('d.isVoided = false')
    .andWhere('d.dealDate >= :start AND d.dealDate < :end', {
      start: startStr,
      end: nextMonthStr,
    })
    .orderBy('d.dealDate', 'DESC')
    .addOrderBy('d.createdAt', 'DESC') // 同日多筆時固定順序
    .skip((safePage - 1) * pageSize)
    .take(pageSize);

  const [rows, count] = await qb.getManyAndCount();

  const totalTrades: DashboardTradeReportItem[] = rows.map((d: DealsEntity) => {
    const lot = d.lot; // 可能為 undefined（安全起見要處理）

    const buyPrice = lot ? Number(lot.buyPrice) : 0;
    const sellPrice = Number(d.price);
    const quantity = d.quantity;
    const buyCost = Number(d.totalCost); // 這次賣掉對應的成本
    const actualRealizedPnl = Number(d.sellCost); // 應收付金額
    const stockProfit = Number(d.realizedPnl);

    let profitLossRate = 0;
    if (buyCost > 0) {
      profitLossRate = Number(((stockProfit / buyCost) * 100).toFixed(2));
    }

    return {
      tradesId: d.tradeId,
      stockId: d.stockId,
      stockName: d.stockName,
      tradesDate: formatDateToSlash(d.dealDate),
      buyPrice: Number.isFinite(buyPrice) ? buyPrice : 0,
      sellPrice: Number.isFinite(sellPrice) ? sellPrice : 0,
      quantity,
      buyCost: Number.isFinite(buyCost) ? buyCost : 0,
      actualRealizedPnl: Number.isFinite(actualRealizedPnl) ? actualRealizedPnl : 0,
      stockProfit: Number.isFinite(stockProfit) ? stockProfit : 0,
      profitLossRate,
      note: d.note ?? null,
    };
  });

  const totalPage = Math.max(1, Math.ceil(count / pageSize));

  return {
    totalTrades,
    pagination: {
      total_page: totalPage,
      current_page: safePage,
    },
  };
}

// 取得歷史紀錄趨勢（每月損益）
export async function getUserDashboardTrends(
  userId: string,
  year: number
): Promise<DashboardTrendsDto> {
  if (!Number.isInteger(year) || year < 1970 || year > 2100) {
    throw httpError(400, '年份格式不正確');
  }

  const dealsRepo = AppDataSource.getRepository(DealsSchema);

  // 這一年： [year-01-01, (year+1)-01-01)
  const startDate = new Date(year, 0, 1);
  const nextYearStart = new Date(year + 1, 0, 1);

  const startStr = formatDateForSql(startDate);
  const nextYearStr = formatDateForSql(nextYearStart);

  // 只抓使用者該年度的賣出紀錄，按月份加總 realizedPnl
  const raw = await dealsRepo
    .createQueryBuilder('d')
    .select(`TO_CHAR(d.dealDate, 'MM')`, 'month')
    .addSelect('COALESCE(SUM(d.realizedPnl), 0)', 'pnl')
    .where('d.userId = :userId', { userId })
    .andWhere('d.type = :type', { type: 'sell' })
    .andWhere('d.isVoided = false')
    .andWhere('d.dealDate >= :start AND d.dealDate < :end', {
      start: startStr,
      end: nextYearStr,
    })
    .groupBy(`TO_CHAR(d.dealDate, 'MM')`)
    .orderBy(`TO_CHAR(d.dealDate, 'MM')`, 'ASC')
    .getRawMany<{ month: string; pnl: string }>();

  // 把有資料的月份先放進 map，key 用數字月份 1~12
  const monthPnlMap = new Map<number, number>();
  for (const row of raw) {
    const m = Number(row.month); // "01" -> 1
    if (!Number.isNaN(m) && m >= 1 && m <= 12) {
      const value = Number(row.pnl);
      monthPnlMap.set(m, Number.isFinite(value) ? value : 0);
    }
  }

  // 補滿 1~12 月
  const series: DashboardTrendPoint[] = [];
  for (let m = 1; m <= 12; m++) {
    const period = `${year}-${String(m).padStart(2, '0')}`;
    const pnl = monthPnlMap.get(m) ?? 0;
    series.push({ period, pnl });
  }

  return { series };
}

// 建立歷史紀錄（實際建倉 + 賣出）
export async function createDashboardNewReport(
  userId: string,
  dto: NewDashboardReportDto,
  role: UserRole
): Promise<void> {
  const {
    stockId,
    buyPrice,
    quantity,
    buyCost,
    buyDate,
    buyNote,
    sellPrice,
    sellQty,
    sellCost,
    // ✅ 新增從前端接的已實現損益
    realizedPnl,
    sellDate,
    sellNote,
  } = dto;

  // 1) 基本欄位檢查（避免 0 被當成缺值，用 == null）
  if (
    !stockId ||
    !buyDate ||
    !sellDate ||
    buyPrice == null ||
    quantity == null ||
    buyCost == null ||
    sellPrice == null ||
    sellQty == null ||
    sellCost == null ||
    realizedPnl == null // ✅ 新增檢查 realizedPnl
  ) {
    throw httpError(400, '請確認欄位填寫完整');
  }

  // 2) 數值合法性
  if (
    !Number.isFinite(buyPrice) ||
    !Number.isFinite(quantity) ||
    !Number.isFinite(buyCost) ||
    !Number.isFinite(sellPrice) ||
    !Number.isFinite(sellQty) ||
    !Number.isFinite(sellCost) ||
    !Number.isFinite(realizedPnl) // ✅ 新增型別檢查
  ) {
    throw httpError(400, '數值欄位格式不正確');
  }

  if (
    buyPrice <= 0 ||
    quantity <= 0 ||
    buyCost <= 0 ||
    sellPrice <= 0 ||
    sellQty <= 0 ||
    sellCost <= 0
    // ✅ realizedPnl 可以是正也可以是負（賺/賠），所以不檢查 > 0
  ) {
    throw httpError(400, '價格、股數與金額必須大於 0');
  }

  if (sellQty > quantity) {
    throw httpError(400, '賣出股數不可大於買進股數');
  }

  const buyDateObj = parseYMDSlashDateLocal(buyDate, '買進日期');
  const sellDateObj = parseYMDSlashDateLocal(sellDate, '賣出日期');

  // 3) 把成本、價格統一成兩位小數
  const buyCost2 = roundTo2(buyCost);
  const buyAmountStr = buyCost2.toFixed(2);
  const buyPriceStr = roundTo2(buyPrice).toFixed(2);
  const sellPriceStr = roundTo2(sellPrice).toFixed(2);
  const sellCost2 = roundTo2(sellCost);
  const realizedPnl2 = Number(realizedPnl); // ✅ 前端提供的實現損益

  // 4) 由「應收付 + 已實現損益」反推此次賣出的成本部分
  //    soldCost = 應收付金額 - 已實現損益
  const soldCost = roundTo2(sellCost2 - realizedPnl2);

  if (!Number.isFinite(soldCost)) {
    throw httpError(400, '計算出的賣出成本不合法');
  }
  if (soldCost < 0) {
    throw httpError(400, '輸入的應收付與損益不合理，導致賣出成本為負數');
  }
  // 🔴 新增檢查：賣出成本不得超過「可分配成本」
  const avgCostPerShare = buyCost2 / quantity; // 平均成本
  const maxAllocatableCost = roundTo2(avgCostPerShare * sellQty);

  if (soldCost > maxAllocatableCost) {
    throw httpError(400, '此筆交易會導致持倉成本與持股比例不合理，請調整應收付金額或實際損益');
  }

  if (soldCost > buyCost2) {
    throw httpError(400, '賣出成本大於總成本，請檢查輸入');
  }

  return AppDataSource.transaction(async (manager) => {
    const now = new Date();

    const stockRepo = manager.getRepository(StockInfoSchema);
    const lotsRepo = manager.getRepository(LotsSchema);
    const dealsRepo = manager.getRepository(DealsSchema);
    const capitalRepo = manager.getRepository(UserCapitalSchema);

    // ✅ 依角色取得本次配額
    const { dailyTradesLimit } = getQuotaByRole(role);

    // ✅ 今日交易數檢查（只有有上限的角色才檢查）
    //    歷史紀錄會產生 2 筆 deals（1 buy + 1 sell），所以要確保 count + 2 <= limit
    if (dailyTradesLimit != null) {
      const { start, end } = getTodayRange();
      const todayTradesCount = await dealsRepo
        .createQueryBuilder('d')
        .where('d.userId = :userId', { userId })
        .andWhere('d.isVoided = false')
        .andWhere('d.dealDate >= :start AND d.dealDate < :end', {
          start,
          end,
        })
        .getCount();

      // 這次建立歷史紀錄會多 2 筆 deals（buy + sell），檢查是否超限
      if (todayTradesCount + 2 > dailyTradesLimit) {
        throw httpError(429, '已達今日可建立交易上限，無法新增歷史紀錄');
      }
    }

    const capital = await getOrCreateCapitalRowDashboard(userId, manager);

    // 檢查投入資金是否足夠建倉（沿用 asset 建立資產的邏輯）
    if (buyCost2 > Number(capital.totalInvest)) {
      throw httpError(400, '投入金額不足，無法建立交易歷史紀錄');
    }

    const stockMeta = await stockRepo.findOne({ where: { stockId } });
    if (!stockMeta) throw httpError(400, '查無此股票代碼');

    // 6) 建立 lot（完整部位）
    const lot = lotsRepo.create({
      userId,
      stockId: stockMeta.stockId,
      stockName: stockMeta.stockName,
      buyDate: buyDateObj,
      buyPrice: buyPriceStr,
      buyQuantity: quantity,
      remainingQuantity: quantity,
      remainingCost: buyAmountStr,
      buyAmount: buyAmountStr,
      note: buyNote ?? null,
    } satisfies Partial<LotsEntity>);
    const savedLot = await lotsRepo.save(lot);

    // 7) 建立 buy deal
    const buyDeal = dealsRepo.create({
      userId,
      lotId: savedLot.lotId,
      stockId: stockMeta.stockId,
      stockName: stockMeta.stockName,
      type: 'buy',
      totalCost: buyAmountStr,
      sellCost: '0',
      price: buyPriceStr,
      quantity,
      realizedPnl: '0',
      dealDate: buyDateObj,
      isVoided: false,
      note: buyNote ?? null,
    } satisfies Partial<DealsEntity>);
    await dealsRepo.save(buyDeal);

    // 8) 建立 sell deal（部分賣出）
    const sellDeal = dealsRepo.create({
      userId,
      lotId: savedLot.lotId,
      stockId: stockMeta.stockId,
      stockName: stockMeta.stockName,
      type: 'sell',
      price: sellPriceStr,
      quantity: sellQty,
      totalCost: soldCost.toFixed(2), // ✅ 這次賣掉的「成本部分」
      sellCost: sellCost2.toFixed(2), // 這次應收付
      realizedPnl: realizedPnl2.toFixed(2), // ✅ 使用者輸入的實現損益
      dealDate: sellDateObj,
      isVoided: false,
      note: sellNote ?? null,
    } satisfies Partial<DealsEntity>);
    await dealsRepo.save(sellDeal);

    // 9) 更新 lot 剩餘股數 & 剩餘成本
    const remainingQty = quantity - sellQty;
    const remainingCost = roundTo2(buyCost2 - soldCost);
    if (remainingCost < 0) {
      throw httpError(400, '計算後剩餘成本為負數，請檢查輸入');
    }

    savedLot.remainingQuantity = remainingQty;
    savedLot.remainingCost = remainingCost.toFixed(2);
    if (remainingQty === 0) {
      savedLot.isVoided = true;
      savedLot.voidedAt = now;
    }
    savedLot.updatedAt = now;
    await lotsRepo.save(savedLot);

    // 10) 更新 capital：累加已實現損益到 totalInvest（沿用 sellAsset 邏輯）
    let nextTotalInvest = roundTo2(Number(capital.totalInvest) + realizedPnl2);
    if (nextTotalInvest < 0) nextTotalInvest = 0;
    capital.totalInvest = nextTotalInvest.toFixed(2);
    capital.updatedAt = now;
    await capitalRepo.save(capital);
  });
}

// 編輯歷史紀錄（退回舊賣出，再套用新賣出）
export async function updateDashboardReport(
  userId: string,
  tradesId: string,
  dto: UpdateDashboardReportDto,
  role: UserRole
): Promise<void> {
  const { sellDate, sellPrice, sellQty, sellCost, realizedPnl, note } = dto;

  // 1) 基本欄位檢查
  if (
    !sellDate ||
    sellPrice == null ||
    sellQty == null ||
    sellCost == null ||
    realizedPnl == null
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
    throw httpError(400, '賣出價格、股數與應收付金額必須大於 0');
  }

  const sellDateObj = parseYMDSlashDateLocal(sellDate, '賣出日期');

  await AppDataSource.transaction(async (manager) => {
    const now = new Date();

    const dealsRepo = manager.getRepository(DealsSchema);
    const lotsRepo = manager.getRepository(LotsSchema);
    const capitalRepo = manager.getRepository(UserCapitalSchema);

    // ✅ 依角色取得本次配額
    const { dailyTradesLimit } = getQuotaByRole(role);

    // ✅ 今日交易數檢查（編輯時要確保沒有超過新的上限）
    //    編輯只是修改 sell deal，不會增加新的 deals 筆數，但為了安全起見還是檢查一下
    if (dailyTradesLimit != null) {
      const { start, end } = getTodayRange();
      const todayTradesCount = await dealsRepo
        .createQueryBuilder('d')
        .where('d.userId = :userId', { userId })
        .andWhere('d.isVoided = false')
        .andWhere('d.dealDate >= :start AND d.dealDate < :end', {
          start,
          end,
        })
        .getCount();

      // 編輯歷史紀錄本身不會增加 deals 數量，所以只需確認不超過上限
      if (todayTradesCount > dailyTradesLimit) {
        throw httpError(429, '已達今日可建立交易上限，無法編輯歷史紀錄');
      }
    }

    // 2) 找出這筆要編輯的賣出紀錄
    const sellDeal = await dealsRepo.findOne({
      where: {
        tradeId: tradesId,
        userId,
        type: 'sell',
        isVoided: false,
      },
      relations: ['lot'],
    });

    if (!sellDeal) {
      throw httpError(404, '找不到要編輯的歷史紀錄');
    }

    if (!sellDeal.lotId) {
      throw httpError(400, '此歷史紀錄缺少對應的持倉資訊，無法編輯');
    }

    const lot = await lotsRepo.findOne({ where: { lotId: sellDeal.lotId, userId } });
    if (!lot) {
      throw httpError(400, '找不到對應的持倉資料，無法編輯歷史紀錄');
    }

    const capital = await getOrCreateCapitalRowDashboard(userId, manager);

    // 3) 退回舊的賣出影響（回補）
    const oldSellQty = sellDeal.quantity;
    const oldSoldCost = Number(sellDeal.totalCost); // 舊的成本部分
    const oldRealizedPnl = Number(sellDeal.realizedPnl); // 舊的已實現損益

    let lotRemainingQty = lot.remainingQuantity + oldSellQty;
    let lotRemainingCost = roundTo2(Number(lot.remainingCost) + oldSoldCost);

    if (lotRemainingQty <= 0 || lotRemainingCost < 0) {
      throw httpError(400, '舊有歷史紀錄資料異常，無法進行編輯');
    }

    lot.remainingQuantity = lotRemainingQty;
    lot.remainingCost = lotRemainingCost.toFixed(2);

    // 若原本因為這筆賣出被標成已撤銷，回補後有持倉就復原
    if (lot.isVoided && lotRemainingQty > 0) {
      lot.isVoided = false;
      lot.voidedAt = null;
    }

    // 回補資金：減去舊的已實現損益
    let nextTotalInvest = roundTo2(Number(capital.totalInvest) - oldRealizedPnl);
    if (nextTotalInvest < 0) nextTotalInvest = 0;
    capital.totalInvest = nextTotalInvest.toFixed(2);

    // 4) 用新的參數重新檢查與計算

    // 股數不得超過「回補後」的可賣股數
    if (sellQty > lot.remainingQuantity) {
      throw httpError(400, '賣出股數超過可賣出股數，請檢查輸入');
    }

    const sellCost2 = roundTo2(sellCost);
    const realizedPnl2 = roundTo2(realizedPnl);

    // soldCost = 應收付 - 實際損益
    const soldCost = roundTo2(sellCost2 - realizedPnl2);

    if (!Number.isFinite(soldCost)) {
      throw httpError(400, '計算出的賣出成本不合法');
    }
    if (soldCost < 0) {
      throw httpError(400, '輸入的應收付與損益不合理，導致賣出成本為負數');
    }

    // 可分配成本上限：避免只賣少量股卻吃掉整個持倉成本
    const avgCostPerShare = lotRemainingCost / lotRemainingQty;
    const maxAllocatableCost = roundTo2(avgCostPerShare * sellQty);

    if (soldCost > maxAllocatableCost) {
      throw httpError(400, '此次賣出分配的成本超過可分配成本，請調整應收付金額或實際損益');
    }

    if (soldCost > lotRemainingCost) {
      throw httpError(400, '賣出成本大於持有成本，請檢查輸入');
    }

    // 5) 套用新的賣出影響

    // 更新 lot
    lotRemainingQty = lotRemainingQty - sellQty;
    const newRemainingCost = roundTo2(lotRemainingCost - soldCost);
    if (newRemainingCost < 0) {
      throw httpError(400, '計算後剩餘成本為負數，請檢查輸入');
    }

    lot.remainingQuantity = lotRemainingQty;
    lot.remainingCost = newRemainingCost.toFixed(2);

    if (lotRemainingQty === 0) {
      lot.isVoided = true;
      lot.voidedAt = now;
    }

    lot.updatedAt = now;
    await lotsRepo.save(lot);

    // 更新 capital：加上新的已實現損益
    nextTotalInvest = roundTo2(Number(capital.totalInvest) + realizedPnl2);
    if (nextTotalInvest < 0) nextTotalInvest = 0;
    capital.totalInvest = nextTotalInvest.toFixed(2);
    capital.updatedAt = now;
    await capitalRepo.save(capital);

    // 更新這筆 sell deal 本身
    sellDeal.price = roundTo2(sellPrice).toFixed(2);
    sellDeal.quantity = sellQty;
    sellDeal.totalCost = soldCost.toFixed(2);
    sellDeal.sellCost = sellCost2.toFixed(2);
    sellDeal.realizedPnl = realizedPnl2.toFixed(2);
    sellDeal.dealDate = sellDateObj;
    sellDeal.note = note ?? null;
    // 若 DealsEntity 有 updatedAt，就一併更新
    (sellDeal as any).updatedAt = now;

    await dealsRepo.save(sellDeal);
  });
}

// 撤銷歷史紀錄（退回舊賣出，不再產生新賣出）
export async function cancelDashboardReport(userId: string, tradesId: string): Promise<void> {
  await AppDataSource.transaction(async (manager) => {
    const now = new Date();

    const dealsRepo = manager.getRepository(DealsSchema);
    const lotsRepo = manager.getRepository(LotsSchema);
    const capitalRepo = manager.getRepository(UserCapitalSchema);

    // 1) 找出這筆要撤銷的賣出紀錄
    const sellDeal = await dealsRepo.findOne({
      where: {
        tradeId: tradesId,
        userId,
        type: 'sell',
        isVoided: false,
      },
      relations: ['lot'],
    });

    if (!sellDeal) {
      throw httpError(404, '找不到要撤銷的歷史紀錄');
    }

    if (!sellDeal.lotId) {
      throw httpError(400, '此歷史紀錄缺少對應的持倉資訊，無法撤銷');
    }

    const lot = await lotsRepo.findOne({ where: { lotId: sellDeal.lotId, userId } });
    if (!lot) {
      throw httpError(400, '找不到對應的持倉資料，無法撤銷歷史紀錄');
    }

    const capital = await getOrCreateCapitalRowDashboard(userId, manager);

    // 2) 退回舊的賣出影響（回補）
    const oldSellQty = sellDeal.quantity;
    const oldSoldCost = Number(sellDeal.totalCost); // 舊的成本部分
    const oldRealizedPnl = Number(sellDeal.realizedPnl); // 舊的已實現損益

    let lotRemainingQty = lot.remainingQuantity + oldSellQty;
    let lotRemainingCost = roundTo2(Number(lot.remainingCost) + oldSoldCost);

    if (lotRemainingQty <= 0 || lotRemainingCost < 0) {
      throw httpError(400, '舊有歷史紀錄資料異常，無法進行撤銷');
    }

    lot.remainingQuantity = lotRemainingQty;
    lot.remainingCost = lotRemainingCost.toFixed(2);

    // 若原本因為這筆賣出被標成已撤銷，回補後有持倉就復原
    if (lot.isVoided && lotRemainingQty > 0) {
      lot.isVoided = false;
      lot.voidedAt = null;
    }

    lot.updatedAt = now;
    await lotsRepo.save(lot);

    // 3) 回補資金：減去舊的已實現損益
    let nextTotalInvest = roundTo2(Number(capital.totalInvest) - oldRealizedPnl);
    if (nextTotalInvest < 0) nextTotalInvest = 0;
    capital.totalInvest = nextTotalInvest.toFixed(2);
    capital.updatedAt = now;
    await capitalRepo.save(capital);

    // 4) 將這筆賣出標記為作廢
    sellDeal.isVoided = true;
    // 若 DealsEntity 有 updatedAt / voidedAt 可以在這裡一併設定
    (sellDeal as any).updatedAt = now;
    await dealsRepo.save(sellDeal);
  });
}

// 將 JS Date 轉成 "YYYY-MM-DD" 字串給 SQL 用
function formatDateForSql(dt: Date): string {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 將 Date / string 轉成 "YYYY/MM/DD"
function formatDateToSlash(input: Date | string): string {
  let dt: Date;

  if (input instanceof Date) {
    dt = input;
  } else {
    // Postgres date 多半會回來 "YYYY-MM-DD" 字串
    dt = new Date(input);
  }

  if (Number.isNaN(dt.getTime())) {
    return ''; // 若解析失敗就回傳空字串，避免整個 API 爆掉
  }

  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

// 取得 / 建立資金列（dashboard 專用版本）
// 注意：transaction 內一定要用 manager 的 repo
async function getOrCreateCapitalRowDashboard(
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
    updatedAt: new Date(),
  };

  return repo.save(created);
}

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

// ✅ 依角色取得這次要套用的配額；limit 為 null 代表不限制
function getQuotaByRole(role: UserRole): {
  dailyTradesLimit: number | null;
} {
  switch (role) {
    case 'guest':
      return {
        dailyTradesLimit: GUEST_DAILY_TRADES_LIMIT,
      };
    case 'user':
      return {
        dailyTradesLimit: BASIC_DAILY_TRADES_LIMIT,
      };
    case 'admin':
    default:
      // admin 預設不限制
      return {
        dailyTradesLimit: null,
      };
  }
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
