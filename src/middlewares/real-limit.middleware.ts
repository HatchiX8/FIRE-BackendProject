import { Request, Response, NextFunction } from 'express';

// 記錄：key -> { count, resetTime }
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// 清理過期的 key（每 1 分鐘執行一次）
const CLEANUP_INTERVAL = 60 * 1000; // 60 秒
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now >= data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL);

// 取得 rate limit 的 key（userId 優先，否則用 IP）
function getRateLimitKey(req: Request): string {
  const userId = (req as any).locals?.userId;
  if (userId) {
    return `user:${userId}`;
  }
  // fallback 到 IP
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `ip:${ip}`;
}

// 判斷是否是寫入操作
function isWriteOperation(req: Request): boolean {
  return ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method);
}

// 檢查 rate limit
function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number = 60 * 1000 // 預設 1 分鐘
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const data = rateLimitStore.get(key);

  if (!data || now >= data.resetTime) {
    // 如果沒有記錄或已過期，新建
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  // 在視窗內，檢查是否超過限制
  if (data.count >= limit) {
    // const remainingMs = Math.ceil((data.resetTime - now) / 1000);
    return { allowed: false, remaining: 0 };
  }

  // 還有配額，+1 計數
  data.count += 1;
  return { allowed: true, remaining: limit - data.count };
}

export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const key = getRateLimitKey(req);
  const isWrite = isWriteOperation(req);

  // ✅ 寫入類：20 次/分鐘
  // ✅ 讀取類：80 次/分鐘
  const limit = isWrite ? 20 : 80;
  const windowMs = 60 * 1000; // 1 分鐘

  const { allowed, remaining } = checkRateLimit(key, limit, windowMs);

  // 設定 response header（可選，給前端參考）
  res.set('X-RateLimit-Limit', limit.toString());
  res.set('X-RateLimit-Remaining', Math.max(0, remaining).toString());

  if (!allowed) {
    return res.status(429).json({
      message: '請求過於頻繁，請稍候再試',
    });
  }

  next();
};
