import type { Request, Response, NextFunction } from 'express';
import type { DataSource } from 'typeorm';
import { fetchStockOptions, searchStocks } from './stockInfo.query.service.js';

export function buildStockOptionsHandler(ds: DataSource) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await fetchStockOptions(ds);
      return res.status(200).json({ message: '成功取得股票資料', data });
    } catch (err) {
      return next(err);
    }
  };
}

export function buildStockLookupHandler(ds: DataSource) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = String(req.query.q ?? '');
      const limit = Number(req.query.limit ?? 30);

      const data = await searchStocks(ds, q, limit);
      return res.status(200).json({ message: '成功取得股票資料', data });
    } catch (err) {
      return next(err);
    }
  };
}
