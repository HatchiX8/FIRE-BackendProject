import { Router } from 'express';
import type { DataSource } from 'typeorm';
import { buildStockInfoSyncHandler } from './stockInfo.controller.js';
import { requireInternalKey } from '@/middlewares/requireInternalKey.js';
import { AppDataSource } from '@/db/data-source.js';

export const stockInfoRouter = Router();

stockInfoRouter.post(
  '/admin/stockInfo/sync',
  requireInternalKey,
  buildStockInfoSyncHandler(AppDataSource)
);
