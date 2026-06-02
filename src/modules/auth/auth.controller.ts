import type { Request, Response } from 'express';
import { googleOAuthLogin, logoutByRefreshToken } from './auth.service.js';
import { toGoogleProfile } from './auth.normalize.js';
import { checkLogin } from './auth.verify.service.js';
import { refreshAccessToken } from './auth.refresh.service.js';

const ACCESS_SECRET = mustGetEnv('JWT_ACCESS_SECRET');
const REFRESH_SECRET = mustGetEnv('JWT_REFRESH_SECRET');

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

export async function googleCallbackController(req: Request, res: Response): Promise<void> {
  const profile = toGoogleProfile(req.user);

  if (!profile) {
    res.status(500).json({
      ok: false,
      message: 'Invalid Google OAuth payload',
    });
    return;
  }

  const result = await googleOAuthLogin(profile, ACCESS_SECRET, REFRESH_SECRET);

  res.cookie('refreshToken', result.tokens.refreshToken, {
    httpOnly: true,
    secure: isSecureEnv,
    sameSite: isSecureEnv ? 'none' : 'lax',
    path: '/api/v1/user',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  const frontendUrl = process.env.FRONTEND_URL;
  res.redirect(`${frontendUrl}/auth/callback`);
}

export async function checkLoginController(_req: Request, res: Response): Promise<void> {
  res.setHeader('Cache-Control', 'no-store');
  const userIdUnknown: unknown = res.locals.userId;
  if (typeof userIdUnknown !== 'string' || !userIdUnknown) {
    res.status(401).json({ ok: false, message: '請先登入' });
    return;
  }

  const user = await checkLogin(userIdUnknown);
  if (!user) {
    res.status(401).json({ ok: false, message: '驗證錯誤，token 無效或是不存在' });
    return;
  }

  res.json({
    message: '驗證成功',
    data: {
      user,
    },
  });
}

export async function refreshAccessTokenController(req: Request, res: Response): Promise<void> {
  const refreshToken = readRefreshTokenFromCookies(req);

  const result = await refreshAccessToken(refreshToken, ACCESS_SECRET, REFRESH_SECRET);

  if (!result) {
    res.status(401).json({ ok: false, message: 'Refresh failed' });
    return;
  }

  res.json({
    message: '已重新取得新的存取權杖',
    data: result.accessToken,
  });
}

export async function logoutController(req: Request, res: Response): Promise<void> {
  const refreshToken = readRefreshTokenFromCookies(req);

  await logoutByRefreshToken(refreshToken, REFRESH_SECRET);

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isSecureEnv,
    sameSite: isSecureEnv ? 'none' : 'lax',
    path: '/api/v1/user',
  });

  res.json({ message: '已成功登出' });
}
