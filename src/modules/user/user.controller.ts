import { Request, Response, NextFunction, type RequestHandler } from 'express';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity.js';
import { parseUpdateProfileDto, parseAccountUpgradeRequestDto } from './users.validators.js';
import { getUserInfo, updateProfile, requestAccountUpgrade } from './user.service.js';

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
