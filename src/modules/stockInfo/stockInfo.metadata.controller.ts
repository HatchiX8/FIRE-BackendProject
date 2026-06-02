import type { Request, Response, NextFunction } from 'express';
import { syncStockMetadata } from './stockInfo.metadata.service.js';

export async function syncStockMetadataController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await syncStockMetadata();

    res.json({
      success: true,
      result,
    });
  } catch (err) {
    next(err);
  }
}
