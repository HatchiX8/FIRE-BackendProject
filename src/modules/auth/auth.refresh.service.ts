import { DataSource } from 'typeorm';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';

import { RefreshTokenEntity } from './refresh-token.entity.js';
import { signAccessToken } from './jwt.js';

type RefreshPayload = { userId: string; tokenId: string; iat?: number; exp?: number };

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

export async function refreshAccessToken(
  ds: DataSource,
  refreshToken: string,
  accessSecret: string,
  refreshSecret: string
): Promise<{ accessToken: string } | null> {
  if (!refreshToken || !refreshToken.trim()) return null;

  let payload: RefreshPayload | null = null;
  try {
    const decoded: unknown = jwt.verify(refreshToken, refreshSecret);
    payload = parseRefreshPayload(decoded);
  } catch {
    return null;
  }

  if (!payload) return null;

  const repo = ds.getRepository(RefreshTokenEntity);
  const row = await repo.findOne({ where: { id: payload.tokenId } });
  if (!row) return null;

  // 可選：檢查 expiresAt（若你 DB 有維護）
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;

  // 核對 owner
  if (row.userId !== payload.userId) return null;

  // 核對 hash
  if (row.tokenHash !== sha256(refreshToken)) return null;

  // 簽新的 access
  const accessToken = signAccessToken(payload.userId, accessSecret);
  return { accessToken };
}
