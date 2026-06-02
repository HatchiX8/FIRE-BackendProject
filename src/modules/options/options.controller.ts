import type { Request, Response, NextFunction } from 'express';
import { getStockInfoOptions } from './options.service.js';

export async function getStockInfoOptionsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await getStockInfoOptions();

    res.status(200).json({
      message: '成功取得股票資料',
      data,
    });
  } catch (err) {
    next(err);
  }
}
