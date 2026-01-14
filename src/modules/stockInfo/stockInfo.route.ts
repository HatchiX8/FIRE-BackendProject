import { Router } from 'express';

import { buildStockInfoSyncHandler } from './stockInfo.controller.js';
import { syncStockMetadata } from './stockInfo.query.controller.js';
import { getStockInfo } from './stockInfo.options.controller.js';

import { requireInternalKey } from '@/middlewares/requireInternalKey.js';
import { authMiddleware } from '@/middlewares/auth.middleware.js';
import { AppDataSource } from '@/db/data-source.js';

export const stockInfoRouter = Router();

stockInfoRouter.post(
  '/admin/stockPrice/sync',
  requireInternalKey,
  buildStockInfoSyncHandler(AppDataSource)
);

stockInfoRouter.post('/admin/stockMetadata/sync', requireInternalKey, syncStockMetadata);

stockInfoRouter.get('/stockInfo', authMiddleware, getStockInfo);
