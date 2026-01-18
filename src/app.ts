import express from 'express';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import cors from 'cors';
// ----------登入驗證----------
import { setupGoogleStrategy } from './modules/auth/google.strategy.js';
import { authRouter } from './modules/auth/auth.router.js';
import { authMiddleware } from './middlewares/auth.middleware.js';
import { requireAdmin } from '@/middlewares/requireAdmin.js';

// ---------------------------

// ----------router引入----------
import { healthRoutes } from './modules/health/health.routes.js';
import { userRouter } from './modules/user/user.routes.js';
import { upgradeRouter } from './modules/upgrade/upgrade.routes.js';
import { stockInfoRouter } from './modules/stockInfo/stockInfo.route.js';
import { assetRouter } from './modules/asset/asset.router.js';
// ------------------------------

import { notFound } from './middlewares/not-found.js';
import { errorHandler } from './middlewares/error-handler.js';

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
    })
  );

  setupGoogleStrategy();
  app.use(passport.initialize());
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/v1/user', authRouter);
  app.use('/api/health', authMiddleware, healthRoutes);
  app.use('/api/v1/user', userRouter);
  app.use('/api/v1/admin', authMiddleware, requireAdmin, upgradeRouter);
  app.use('/api/v1/stock', stockInfoRouter);
  app.use('/api/v1/assets', assetRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
