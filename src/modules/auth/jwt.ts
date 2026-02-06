import jwt from 'jsonwebtoken';

type AccessTokenPayload = {
  userId: string;
  role: 'guest' | 'user' | 'admin';
};

type RefreshTokenPayload = {
  userId: string;
  tokenId: string; // 對應 DB 那筆 refresh token 記錄
};

const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '30d';

export function signAccessToken(userId: string, secret: string, role: 'guest' | 'user' | 'admin' = 'guest'): string {
  const payload: AccessTokenPayload = { userId,role };
  return jwt.sign(payload, secret, { expiresIn: ACCESS_EXPIRES_IN });
}

export function signRefreshToken(userId: string, tokenId: string, secret: string): string {
  const payload: RefreshTokenPayload = { userId, tokenId };
  return jwt.sign(payload, secret, { expiresIn: REFRESH_EXPIRES_IN });
}
