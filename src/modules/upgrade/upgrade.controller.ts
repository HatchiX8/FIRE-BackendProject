import { Request, Response, NextFunction } from 'express';
import { httpError } from '@/utils/index.js';
import {
  getPendingUpgradeRequests,
  getUserList,
  reviewUpgradeRequest,
  patchUserActivation,
} from './upgrade.service.js';
import type {
  GetUpgradeRequestsResponseDto,
  GetUserListResponseDto,
  ReviewStatus,
  ReviewUpgradeRequestBodyDto,
  ReviewUpgradeResponseDto,
  ActivationStatus,
  PatchUserActivationBodyDto,
  PatchUserActivationResponseDto,
} from './upgrade.dto.js';

// ----------取得申請者----------
export async function getUpgradeRequestsController(req: Request, res: Response): Promise<void> {
  const data = await getPendingUpgradeRequests();

  const body: GetUpgradeRequestsResponseDto = {
    message: data.length === 0 ? '目前沒有待審核申請' : '成功取得申請者資料',
    data,
  };

  res.status(200).json(body);
}
// -----------------------------

// ----------取得使用者----------
export async function getUserListController(req: Request, res: Response): Promise<void> {
  const data = await getUserList();

  const body: GetUserListResponseDto = {
    message: data.length === 0 ? '目前沒有一般使用者' : '成功取得使用者資料',
    data,
  };
  res.status(200).json(body);
}
// -----------------------------

// ----------審核申請----------
function isReviewStatus(val: unknown): val is ReviewStatus {
  return val === 'approved' || val === 'rejected';
}

export async function reviewUpgradeRequestController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.params.userId;
    if (!userId) {
      throw httpError(400, '缺少 userId');
    }

    const body = req.body as Partial<ReviewUpgradeRequestBodyDto>;

    if (!isReviewStatus(body.status)) {
      throw httpError(400, "status 必須是 'approved' 或 'rejected'");
    }

    if (typeof body.userNote !== 'string') {
      throw httpError(400, 'userNote 必須是字串');
    }

    await reviewUpgradeRequest({
      userId,
      status: body.status,
      userNote: body.userNote,
    });

    const resp: ReviewUpgradeResponseDto = {
      message: '審核完成',
    };

    res.status(200).json(resp);
  } catch (err) {
    next(err);
  }
}
// ---------------------------

// ----------會員權限操作----------
function isActivationStatus(val: unknown): val is ActivationStatus {
  return val === 'downgrade' || val === 'ban';
}

export async function patchUserActivationController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.params.userId;
    if (!userId) throw httpError(400, '缺少 userId');

    const body = req.body as Partial<PatchUserActivationBodyDto>;

    if (!isActivationStatus(body.status)) {
      throw httpError(400, "status 必須是 'downgrade' 或 'ban'");
    }

    if (typeof body.userNote !== 'string') {
      throw httpError(400, 'userNote 必須是字串');
    }

    await patchUserActivation({
      userId,
      status: body.status,
      userNote: body.userNote,
    });

    const resp: PatchUserActivationResponseDto = { message: '操作完成' };
    res.status(200).json(resp);
  } catch (err) {
    next(err);
  }
}
// -------------------------------
