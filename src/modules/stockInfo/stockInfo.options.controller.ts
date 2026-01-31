import type { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@/db/data-source.js';
import { StockInfoRepository } from './stockInfo.options.repo.js';
import { GetStockInfoOptionsService } from './stockInfo.options.service.js';

export async function getStockInfo(req: Request, res: Response, next: NextFunction) {
  try {
    const repo = new StockInfoRepository(AppDataSource);
    const service = new GetStockInfoOptionsService(repo);

    const data = await service.execute();

    res.status(200).json({
      message: '成功取得股票資料',
      data,
    });
  } catch (err) {
    next(err);
  }
}
