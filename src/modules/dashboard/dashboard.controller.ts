import { Request, Response, NextFunction } from 'express';
import { getUserDashboardReports, getUserDashboardTrends } from './dashboard,service.js';

// 取得歷史紀錄
export async function getUserReportsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      res.status(401).json({ message: '請先登入' });
      return;
    }

    // 從 query 取得 year / month / page
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    const page = Number(req.query.page) || 1;
    const result = await getUserDashboardReports(userId, year, month, page);

    res.status(200).json({
      message: '成功取得歷史紀錄資訊',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

// 取得歷史數據
export async function getUserTrendsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      res.status(401).json({ message: '請先登入' });
      return;
    }

    // 從 query 取得 year
    const year = Number(req.query.year);
    const result = await getUserDashboardTrends(userId, year);

    res.status(200).json({
      message: '成功取得歷史趨勢資訊',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
