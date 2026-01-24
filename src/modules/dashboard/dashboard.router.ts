import { Router } from 'express';

import {
  getUserReportsController,
  getUserTrendsController,
  createUserDashboardReportController,
  updateUserDashboardReportController,
  cancelUserDashboardReportController,
} from './dashboard.controller.js';

export const dashboardRouter = Router();

dashboardRouter.get('/reports', getUserReportsController);

dashboardRouter.get('/trends', getUserTrendsController);

dashboardRouter.post('/new-reports', createUserDashboardReportController);

dashboardRouter.patch('/:tradesId', updateUserDashboardReportController);

dashboardRouter.delete('/:tradesId', cancelUserDashboardReportController);
