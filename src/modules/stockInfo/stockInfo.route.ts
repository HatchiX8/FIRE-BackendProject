import { Router } from 'express';

import { buildStockInfoSyncHandler } from './stockInfo.controller.js';
import { syncStockMetadata } from './stockInfo.query.controller.js';
import { optionsRouter } from '../options/options.router.js';

import { requireInternalKey } from '../../middlewares/requireInternalKey.js';
import { AppDataSource } from '@/db/data-source.js';

export const stockInfoRouter = Router();

stockInfoRouter.post(
  '/admin/stockPrice/sync',
  requireInternalKey,
  buildStockInfoSyncHandler(AppDataSource)
);

// 這邊因為不使用第三方API，所以不需要額外的requireInternalKey
stockInfoRouter.post('/admin/stockMetadata/sync', requireInternalKey, syncStockMetadata);

stockInfoRouter.use(optionsRouter);
