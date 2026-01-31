import type { Request, Response, NextFunction } from 'express';
import type { DataSource } from 'typeorm';
import { syncStockInfo, tryAcquireLock, releaseLock } from './stockInfo.service.js';

export function buildStockInfoSyncHandler(ds: DataSource) {
  return async function (req: Request, res: Response, next: NextFunction) {
    const lockOk = tryAcquireLock();
    if (!lockOk) {
      return res.status(409).json({ ok: false, message: 'Sync is already running' });
    }

    try {
      const modeRaw = String(req.query.mode ?? 'sync');
      const mode: 'init' | 'sync' = modeRaw === 'init' ? 'init' : 'sync';

      const result = await syncStockInfo(ds, mode);
      return res.status(200).json({ ok: true, data: result });
    } catch (err) {
      const anyErr = err as any;
      if (anyErr?.code === 'ALREADY_INITIALIZED') {
        return res.status(409).json({
          ok: false,
          message: 'stock_info already initialized; use mode=sync if you really want to re-sync',
        });
      }
      return next(err);
    } finally {
      releaseLock();
    }
  };
}
