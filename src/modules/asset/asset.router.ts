import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware.js';
import { AppDataSource } from '@/db/data-source.js';
import { DealsSchema } from '@/entity/deals.schema.js';

import {
  newAssetController,
  getUserAssetsController,
  updateAssetController,
  deleteAssetController,
  getUserPortfolioSummaryController,
} from './asset.controller.js';
// const dealsRepo = AppDataSource.getRepository(DealsSchema);

export const assetRouter = Router();

assetRouter.post('/new-asset', authMiddleware, newAssetController);

assetRouter.get('/portfolio/holdings', authMiddleware, getUserAssetsController);

assetRouter.patch('/:assetId', authMiddleware, updateAssetController);

assetRouter.delete('/:assetId', authMiddleware, deleteAssetController);

assetRouter.get('/portfolio/summary', authMiddleware, getUserPortfolioSummaryController);
