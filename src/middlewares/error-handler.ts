import type { Request, Response, NextFunction } from 'express';

type HttpError = Error & { statusCode?: number };

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const e = err as HttpError;

  const statusCode = typeof e.statusCode === 'number' ? e.statusCode : 500;
  const message = e instanceof Error ? e.message : '系統發生錯誤，請稍後再試';

  res.status(statusCode).json({ message });
};
