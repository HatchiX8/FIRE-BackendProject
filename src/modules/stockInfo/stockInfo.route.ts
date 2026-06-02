import { Router } from 'express';

import { syncStockInfoController } from './stockInfo.controller.js';
import { syncStockMetadataController } from './stockInfo.metadata.controller.js';
import { stockOptionsRouter } from '../stockOptions/stockOptions.router.js';

import { requireInternalKey } from '../../middlewares/requireInternalKey.js';

export const stockInfoRouter = Router();

stockInfoRouter.post('/admin/stockPrice/sync', requireInternalKey, syncStockInfoController);

// 這邊因為不使用第三方API，所以不需要額外的requireInternalKey
stockInfoRouter.post('/admin/stockMetadata/sync', requireInternalKey, syncStockMetadataController);

stockInfoRouter.use(stockOptionsRouter);
