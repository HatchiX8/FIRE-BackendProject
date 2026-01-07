import { Request, Response } from 'express';
import { getPendingUpgradeRequests } from './upgrade.service.js';
import type { GetUpgradeRequestsResponseDto } from './upgrade.dto.js';

export async function getUpgradeRequestsController(req: Request, res: Response): Promise<void> {
  const data = await getPendingUpgradeRequests();

  const body: GetUpgradeRequestsResponseDto = {
    message: data.length === 0 ? '目前沒有待審核申請' : '成功取得申請者資料',
    data,
  };

  res.status(200).json(body);
}
