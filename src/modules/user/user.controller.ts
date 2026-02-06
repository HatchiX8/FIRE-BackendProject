import { Request, Response, NextFunction, type RequestHandler } from 'express';
import { Repository } from 'typeorm';
import { type UserEntity } from '@/entity/user.schema.js';
import { parseUpdateProfileDto, parseAccountUpgradeRequestDto } from './users.validators.js';
import {
  getUserInfo,
  updateProfile,
  requestAccountUpgrade,
  depositTotalInvest,
  addTotalInvest,
  withdrawalTotalInvest,
  getUserTotalInvest,
} from './user.service.js';
import { ca } from 'zod/locales';

export const getUserInfoController: RequestHandler = async (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const userId = res.locals.userId as string | undefined;
    if (!userId) {
      return res.status(401).json({ message: '請先登入' });
    }

    const data = await getUserInfo(userId);

    return res.status(200).json({
      message: '成功取得使用者資料',
      data,
    });
  } catch (err) {
    const e = err as Error & { statusCode?: number };
    if (e.statusCode === 404) {
      res.status(404).json({ message: '查無個人資料，請重新登入' });
      return;
    }
    next(err);
  }
};

export const makeUpdateProfileHandler = (usersRepo: Repository<UserEntity>) => {
  const doUpdateProfile = updateProfile(usersRepo);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = res.locals.userId as string | undefined;
      if (!userId) {
        res.status(401).json({ message: '請先登入' });
        return;
      }

      const dto = parseUpdateProfileDto(req.body);
      await doUpdateProfile(userId, dto);

      res.status(200).json({ message: '成功更新使用者資料' });
    } catch (err) {
      next(err);
    }
  };
};

// ----------帳號升級----------
export const makeAccountUpgradeHandler = (usersRepo: Repository<UserEntity>) => {
  const doRequest = requestAccountUpgrade(usersRepo);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = res.locals.userId as string | undefined;
      if (!userId) {
        res.status(401).json({ message: '請先登入' });
        return;
      }

      const dto = parseAccountUpgradeRequestDto(req.body);
      await doRequest(userId, dto);
      res.status(200).json({ message: '成功提交申請' });
    } catch (err) {
      next(err);
    }
  };
};
// ---------------------------

// ----------資金操作----------
export async function getUserTotalInvestHandler(
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

    const data = await getUserTotalInvest(userId);

    res.status(200).json({
      message: '成功取得投資金額',
      data,
    });
  } catch (err) {
    next(err);
  }
}
// 重置
export async function depositTotalInvestHandler(
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

    const { amount } = req.body;

    await depositTotalInvest(userId, amount);

    res.status(200).json({
      message: '成功更新投資金額',
    });
  } catch (err) {
    next(err);
  }
}

// 投入
export async function addInvestHandler(
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

    const { amount } = req.body;

    await addTotalInvest(userId, amount);

    res.status(200).json({
      message: '成功更新投資金額',
    });
  } catch (err) {
    next(err);
  }
}

// 提領
export async function withdrawalInvestHandler(
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

    const { amount } = req.body;

    await withdrawalTotalInvest(userId, amount);

    res.status(200).json({
      message: '成功更新投資金額',
    });
  } catch (err) {
    next(err);
  }
}
// ---------------------------
