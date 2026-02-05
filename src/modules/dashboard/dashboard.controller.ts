import { Request, Response, NextFunction } from 'express';
import {
  getUserDashboardReports,
  getUserDashboardTrends,
  createDashboardNewReport,
  updateDashboardReport,
  cancelDashboardReport,
} from './dashboard,service.js';
import type { NewDashboardReportRequestBody, UpdateDashboardReportDto } from './dashboard.dto.js';
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

// 建立歷史紀錄（建倉 + 賣出）
export async function createUserDashboardReportController(
  req: Request<unknown, unknown, NewDashboardReportRequestBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      res.status(401).json({ message: '請先登入' });
      return;
    }
    console.log('檢視role',res.locals);
    
    const role = res.locals.role;

    await createDashboardNewReport(userId, req.body, role);

    res.status(201).json({
      message: '成功建立歷史紀錄',
    });
  } catch (err) {
    next(err);
  }
}

// 編輯歷史紀錄（只調整賣出那一筆）
export async function updateUserDashboardReportController(
  req: Request<{ tradesId: string }, unknown, UpdateDashboardReportDto>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      res.status(401).json({ message: '請先登入' });
      return;
    }

    const { tradesId } = req.params;
    const role = res.locals.role;

    await updateDashboardReport(userId, tradesId, req.body, role);

    res.status(200).json({
      message: '成功更新歷史紀錄',
    });
  } catch (err) {
    next(err);
  }
}

// 撤銷歷史紀錄（退回舊賣出，不再產生新賣出）
export async function cancelUserDashboardReportController(
  req: Request<{ tradesId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      res.status(401).json({ message: '請先登入' });
      return;
    }

    const { tradesId } = req.params;

    await cancelDashboardReport(userId, tradesId);

    res.status(200).json({
      message: '成功撤銷歷史紀錄',
    });
  } catch (err) {
    next(err);
  }
}
