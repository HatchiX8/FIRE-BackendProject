import { DataSource } from 'typeorm';
import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';

import { UserEntity } from '@/entity/user.entity.js';
import { RefreshTokenEntity } from './refresh-token.entity.js';
import { GoogleProfile } from './auth.normalize.js';
import { signAccessToken, signRefreshToken } from './jwt.js';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type GoogleLoginResult = {
  user: {
    id: string;
    email: string;
    name: string;
    picture: string;
  };
  tokens: AuthTokens;
};

//  refresh token 的 payload 需要能解析出 tokenId + userId
type RefreshPayload = {
  userId: string;
  tokenId: string;
  iat?: number;
  exp?: number;
};

// 工具：sha256
function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function parseRefreshPayload(decoded: unknown): RefreshPayload | null {
  if (!isRecord(decoded)) return null;

  const userId = decoded.userId;
  const tokenId = decoded.tokenId;

  if (typeof userId !== 'string' || typeof tokenId !== 'string') return null;

  return { userId, tokenId };
}

export async function googleOAuthLogin(
  ds: DataSource,
  profile: GoogleProfile,
  accessSecret: string,
  refreshSecret: string
): Promise<GoogleLoginResult> {
  const userRepo = ds.getRepository(UserEntity);
  const refreshRepo = ds.getRepository(RefreshTokenEntity);

  // 1) 找 user：先用 googleId，找不到再用 email
  let user =
    (await userRepo.findOne({ where: { googleId: profile.id } })) ??
    (await userRepo.findOne({ where: { userEmail: profile.email } }));

  // 2) 沒有就建立；有就補 googleId / 更新資料（你要存 picture 就在這更新）
  if (!user) {
    user = userRepo.create({
      userEmail: profile.email,
      userName: profile.name,
      googleId: profile.id,
      avatarUrl: profile.picture,
    });
    user = await userRepo.save(user);
  } else {
    let changed = false;

    if (!user.googleId) {
      user.googleId = profile.id;
      changed = true;
    }

    // 你要存 picture：建議每次登入都更新（頭像可能會換）
    if (user.avatarUrl !== profile.picture) {
      user.avatarUrl = profile.picture || null;
      changed = true;
    }

    // name 也可能會改，視你要不要同步
    if (user.userName !== profile.name) {
      user.userName = profile.name;
      changed = true;
    }

    if (changed) {
      user = await userRepo.save(user);
    }
  }

  // 3) 先寫一筆 refresh token row（拿到 tokenId）
  const expiresAt = new Date(Date.now() + THIRTY_DAYS_MS);
  let tokenRow = refreshRepo.create({
    userId: user.userId,
    expiresAt,
    tokenHash: '', // 先塞空字串，等簽完 token 再回寫 hash
    revokedAt: null,
  });
  tokenRow = await refreshRepo.save(tokenRow);

  // 4) 簽 refresh token（payload 帶 userId + tokenId），只存 hash 到 DB
  const refreshToken = signRefreshToken(user.userId, tokenRow.id, refreshSecret);
  tokenRow.tokenHash = sha256(refreshToken);
  tokenRow = await refreshRepo.save(tokenRow);

  // 5) 簽 access token
  const accessToken = signAccessToken(user.userId, accessSecret);

  return {
    user: {
      id: user.userId,
      email: user.userEmail,
      name: user.userName,
      picture: user.avatarUrl || '',
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  };
}

export async function logoutByRefreshToken(
  ds: DataSource,
  refreshToken: string,
  refreshSecret: string
): Promise<boolean> {
  if (!refreshToken || !refreshToken.trim()) return true;

  try {
    const decoded: unknown = jwt.verify(refreshToken, refreshSecret);
    const payload = parseRefreshPayload(decoded);
    if (!payload) return true;

    const refreshRepo = ds.getRepository(RefreshTokenEntity);

    const row = await refreshRepo.findOne({ where: { id: payload.tokenId } });
    if (!row) return true;

    // 必要的歸屬檢查
    if (row.userId !== payload.userId) return false;

    // hash 比對，防止偽造 tokenId
    const incomingHash = sha256(refreshToken);
    if (row.tokenHash !== incomingHash) return false;

    // 刪除整筆，避免表一直累積
    await refreshRepo.delete({ id: row.id });
    return true;
  } catch {
    // refresh token 過期/驗簽失敗 -> 視為已登出
    return true;
  }
}
