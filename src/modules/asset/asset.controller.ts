import type { Request, Response, NextFunction } from 'express';
import {
  createNewAsset,
  getUserAssets,
  updateAsset,
  deleteAsset,
  getUserPortfolioSummary,
} from './asset.service.js';

// 取得使用者資金配置
export async function getUserPortfolioSummaryController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      res.status(401).json({ message: '請先登入' });
      return;
    }

    const summary = await getUserPortfolioSummary(userId);

    res.json({
      message: '成功取得使用者資料',
      data: summary,
    });
  } catch (err) {
    next(err);
  }
}

// 取得使用者資產配置
export async function getUserAssetsController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      res.status(401).json({ message: '請先登入' });
      return;
    }

    const page = Number(req.query.page) || 1;
    const result = await getUserAssets(userId, page, 10);

    res.status(200).json({
      message: '成功取得持股配置',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

// 新增資產
export async function newAssetController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      res.status(401).json({ message: '請先登入' });
      return;
    }

    await createNewAsset(userId, req.body);
    res.status(200).json({
      message: '新增資產成功',
    });
  } catch (err) {
    next(err);
  }
}

// 編輯資產
export async function updateAssetController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      res.status(401).json({ message: '請先登入' });
      return;
    }

    // 路徑定義為 /api/v1/assets/:assetsId
    const assetId = req.params.assetsId;

    await updateAsset(userId, assetId, req.body);
    res.status(200).json({ message: '資產編輯成功' });
  } catch (err) {
    next(err);
  }
}

// 刪除資產
export async function deleteAssetController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      res.status(401).json({ message: '請先登入' });
      return;
    }

    const assetId = req.params.assetId;

    await deleteAsset(userId, assetId);
    res.status(200).json({ message: '資產刪除成功' });
  } catch (err) {
    next(err);
  }
}
