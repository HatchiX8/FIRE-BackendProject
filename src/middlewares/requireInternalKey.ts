import type { Request, Response, NextFunction } from 'express';

export function requireInternalKey(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.INTERNAL_SYNC_KEY;
  const actual = req.header('x-internal-key');

  if (!expected) {
    return res.status(500).json({ ok: false, message: 'INTERNAL_SYNC_KEY is not set' });
  }
  if (!actual || actual !== expected) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' });
  }

  return next();
}
