import { Router } from 'express';

import {
  newAssetController,
  getUserAssetsController,
  updateAssetController,
  deleteAssetController,
  getUserPortfolioSummaryController,
  sellAssetController,
} from './asset.controller.js';
// const dealsRepo = AppDataSource.getRepository(DealsSchema);

export const assetRouter = Router();

assetRouter.post('/new-asset', newAssetController);

assetRouter.get('/portfolio/holdings', getUserAssetsController);

assetRouter.patch('/:assetId', updateAssetController);

assetRouter.delete('/:assetId', deleteAssetController);

assetRouter.get('/portfolio/summary', getUserPortfolioSummaryController);

assetRouter.post('/:assetId', sellAssetController);
