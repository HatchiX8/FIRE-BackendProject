import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@/db/data-source.js';
// ...existing code...
// 原本同時引入兩個 repo，改成只引入 StockInfoRepository
import { StockInfoRepository } from './stockInfo.query.repo.js';

import { SyncStockMetadataService } from './stockInfo.query.service.js';

export async function syncStockMetadata(req: Request, res: Response, next: NextFunction) {
  try {
    // const pricesRepo = new StockPricesRepository(AppDataSource);
    const infoRepo = new StockInfoRepository(AppDataSource);

    // const service = new SyncStockMetadataService(pricesRepo, infoRepo);
    const service = new SyncStockMetadataService(infoRepo);
    const result = await service.execute();

    res.json({
      success: true,
      result,
    });
  } catch (err) {
    next(err);
  }
}