import jwt from 'jsonwebtoken';

type AccessTokenPayload = {
  userId: string;
};

type RefreshTokenPayload = {
  userId: string;
  tokenId: string; // 對應 DB 那筆 refresh token 記錄
};

const ACCESS_EXPIRES_IN = '10s';
const REFRESH_EXPIRES_IN = '30d';

export function signAccessToken(userId: string, secret: string): string {
  const payload: AccessTokenPayload = { userId };
  return jwt.sign(payload, secret, { expiresIn: ACCESS_EXPIRES_IN });
}

export function signRefreshToken(userId: string, tokenId: string, secret: string): string {
  const payload: RefreshTokenPayload = { userId, tokenId };
  return jwt.sign(payload, secret, { expiresIn: REFRESH_EXPIRES_IN });
}
