import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 小工具：確保 env 一定存在
const mustGetEnv = (key: string): string => {
  const v = process.env[key];
  if (!v || !v.trim()) throw new Error(`Missing env: ${key}`);
  return v;
};

const ACCESS_SECRET = mustGetEnv('JWT_ACCESS_SECRET');

// 簽 access token 時 payload 的型別
type AccessTokenPayload = {
  userId: string;
  iat?: number;
  exp?: number;
  role: 'guest' | 'user' | 'admin';
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // 1) 沒帶 Authorization
  if (!authHeader) {
    return res.status(401).json({ ok: false, message: '請先登入' });
  }

  // 2) 格式必須是 Bearer <token>
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ ok: false, message: '驗證錯誤，token 無效或是不存在' });
  }

  try {
    // 3) 驗證 token（驗簽 + exp）
    const payload = jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;

    // 4) payload 必須有 userId
    if (!payload.userId) {
      return res.status(401).json({ ok: false, message: '驗證錯誤，token 無效或是不存在' });
    }

    // 5) 掛到 res.locals（避免 TS 擴充 req 型別）
    res.locals.userId = payload.userId;
    res.locals.role = payload.role;

    return next();
  } catch (err) {
    // 包含過期、驗簽失敗
    return res.status(401).json({ ok: false, message: '驗證錯誤，token 無效或是不存在' });
  }
};
