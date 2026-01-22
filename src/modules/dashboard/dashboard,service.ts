import { AppDataSource } from '@/db/data-source.js';
import { DealsSchema, type DealsEntity } from '@/entity/deals.schema.js';
import type {
  DashboardReportsDto,
  DashboardTradeReportItem,
  DashboardTrendsDto,
  DashboardTrendPoint,
} from './dashboard.dto.js';
import { httpError } from '@/utils/index.js';

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
