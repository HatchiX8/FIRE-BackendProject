import { Router } from 'express';
import { getHealth } from './health.controller.js';

export const healthRoutes = Router();

healthRoutes.get('/', getHealth);

healthRoutes.get('/me', (req, res) => {
  // middleware 已經掛好
  const userId = res.locals.userId as string;
  return res.json({ ok: true, userId });
});
