import type { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : '系統發生錯誤，請稍後再試';
  res.status(500).json({ message });
};
