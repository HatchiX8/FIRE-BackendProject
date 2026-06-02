import type { Request, Response, NextFunction } from 'express';
import { getStockOptions } from './stockOptions.service.js';

export async function getStockOptionsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = await getStockOptions();

    res.status(200).json({
      message: '成功取得股票資料',
      data,
    });
  } catch (err) {
    next(err);
  }
}
