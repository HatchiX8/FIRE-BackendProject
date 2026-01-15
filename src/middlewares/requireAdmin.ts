import { Request, Response, NextFunction } from 'express';
import { httpError } from '@/utils/index.js';
import { AppDataSource } from '@/db/data-source.js';
import { UserSchema } from '@/entity/user.schema.js';
type LocalsWithUserId = {
  userId?: string;
};

export async function requireAdmin(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const locals = res.locals as LocalsWithUserId;

  if (!locals.userId) {
    next(httpError(401, '未登入或登入狀態已失效'));
    return;
  }

  try {
    const userRepo = AppDataSource.getRepository(UserSchema);

    // 只撈 role，避免撈整筆 user
    const user = await userRepo.findOne({
      where: { userId: locals.userId },
      select: { role: true },
    });

    if (!user) {
      // token 有效但 user 不存在（帳號被刪/異常），視為登入失效
      next(httpError(401, '未登入或登入狀態已失效'));
      return;
    }

    if (user.role !== 'admin') {
      next(httpError(403, '權限不足'));
      return;
    }

    next();
  } catch (err) {
    // DB/系統錯誤交給 error handler
    next(err);
  }
}
