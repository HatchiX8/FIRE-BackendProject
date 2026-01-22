import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware.js';

import { getUserReportsController, getUserTrendsController } from './dashboard.controller.js';

export const dashboardRouter = Router();

dashboardRouter.get('/reports', authMiddleware, getUserReportsController);

dashboardRouter.get('/trends', authMiddleware, getUserTrendsController);
