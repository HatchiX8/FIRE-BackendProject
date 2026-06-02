import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware.js';
import { getStockOptionsController } from './stockOptions.controller.js';

export const stockOptionsRouter = Router();

stockOptionsRouter.get('/stockInfo', authMiddleware, getStockOptionsController);
