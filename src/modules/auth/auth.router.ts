import { Router } from 'express';
import type { Request } from 'express';
import passport from 'passport';

import { googleOAuthLogin, logoutByRefreshToken } from './auth.service.js';
import { toGoogleProfile } from './auth.normalize.js';
import { AppDataSource } from '../../db/data-source.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { checkLogin } from './auth.verify.service.js';
import { refreshAccessToken } from './auth.refresh.service.js';
// ----------初始化----------
export const authRouter = Router();

const ACCESS_SECRET = mustGetEnv('JWT_ACCESS_SECRET');
const REFRESH_SECRET = mustGetEnv('JWT_REFRESH_SECRET');

// 部署環境判斷
type AppEnv = 'local' | 'development' | 'production';
const appEnv = (process.env.APP_ENV as AppEnv) ?? 'local';
const isSecureEnv = appEnv === 'development' || appEnv === 'production';

function mustGetEnv(key: string): string {
  const v = process.env[key];
  if (!v || !v.trim()) throw new Error(`Missing env: ${key}`);
  return v;
}

function readRefreshTokenFromCookies(req: Request): string {
  const cookiesUnknown: unknown = (req as unknown as { cookies?: unknown }).cookies;
  if (typeof cookiesUnknown !== 'object' || cookiesUnknown === null) return '';
  const cookies = cookiesUnknown as Record<string, unknown>;
  const token = cookies.refreshToken;
  return typeof token === 'string' ? token : '';
}
// --------------------------

// ----------google第三方登入----------
// Step1: 導向 google OAuth 頁面
authRouter.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// Step2: Google OAuth 登入成功後的 callback 處理
authRouter.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/api/v1/user/google/failure',
  }),
  async (req, res) => {
    const profile = toGoogleProfile(req.user);

    if (!profile) {
      return res.status(500).json({
        ok: false,
        message: 'Invalid Google OAuth payload',
      });
    }

    const result = await googleOAuthLogin(AppDataSource, profile, ACCESS_SECRET, REFRESH_SECRET);

    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: isSecureEnv,
      sameSite: isSecureEnv ? 'none' : 'lax',
      path: '/api/v1/user', // 建議限制只有 /auth 底下的 refresh/logout 會帶這個 cookie
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 天（和 refresh token 的有效期限一樣）
    });

    const frontendUrl = process.env.FRONTEND_URL;
    return res.redirect(`${frontendUrl}/auth/callback`);
  }
);

authRouter.get('/check', authMiddleware, async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const userIdUnknown: unknown = res.locals.userId;
  if (typeof userIdUnknown !== 'string' || !userIdUnknown) {
    return res.status(401).json({ ok: false, message: '請先登入' });
  }

  const user = await checkLogin(AppDataSource, userIdUnknown);
  if (!user) {
    return res.status(401).json({ ok: false, message: '驗證錯誤，token 無效或是不存在' });
  }

  return res.json({
    message: '驗證成功',
    data: {
      user: user,
    },
  });
});

authRouter.post('/refresh', async (req, res) => {
  const refreshToken = readRefreshTokenFromCookies(req);

  const result = await refreshAccessToken(
    AppDataSource,
    refreshToken,
    ACCESS_SECRET,
    REFRESH_SECRET
  );

  if (!result) {
    return res.status(401).json({ ok: false, message: 'Refresh failed' });
  }

  return res.json({
    message: '已重新取得新的存取權杖',
    data: result.accessToken,
  });
});

// 登出
authRouter.post('/logout', async (req, res) => {
  const refreshToken = readRefreshTokenFromCookies(req);

  // 1) 刪 DB refresh session（你的 service 會核對 hash 並 delete row）
  await logoutByRefreshToken(AppDataSource, refreshToken, REFRESH_SECRET);

  // 2) 清 cookie（options 要跟你當初 res.cookie 一致）
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isSecureEnv,
    sameSite: isSecureEnv ? 'none' : 'lax',
    path: '/auth',
  });

  // 3) 回應（登出建議 idempotent：永遠回 ok）
  return res.json({ message: '已成功登出' });
});
// -----------------------------------
