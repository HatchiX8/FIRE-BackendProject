import type { Request, Response, NextFunction } from 'express';
import { syncStockInfo } from './stockInfo.service.js';
import { releaseStockInfoSyncLock, tryAcquireStockInfoSyncLock } from './stockInfo.locks.js';

export async function syncStockInfoController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const lockOk = tryAcquireStockInfoSyncLock();
  if (!lockOk) {
    res.status(409).json({ ok: false, message: 'Sync is already running' });
    return;
  }

  try {
    const modeRaw = String(req.query.mode ?? 'sync');
    const mode: 'init' | 'sync' = modeRaw === 'init' ? 'init' : 'sync';

    const result = await syncStockInfo(mode);
    res.status(200).json({ ok: true, data: result });
  } catch (err) {
    const anyErr = err as Error & { code?: string };
    if (anyErr?.code === 'ALREADY_INITIALIZED') {
      res.status(409).json({
        ok: false,
        message: 'stock_info already initialized; use mode=sync if you really want to re-sync',
      });
      return;
    }
    next(err);
  } finally {
    releaseStockInfoSyncLock();
  }
}
