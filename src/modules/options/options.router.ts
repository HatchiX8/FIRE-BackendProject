import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware.js';
import { getStockInfoOptionsController } from './options.controller.js';

export const optionsRouter = Router();

optionsRouter.get('/stockInfo', authMiddleware, getStockInfoOptionsController);
