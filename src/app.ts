import express from 'express';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import cors from 'cors';
// ----------登入驗證----------
import { setupGoogleStrategy } from './modules/auth/google.strategy.js';
import { authRouter } from './modules/auth/auth.router.js';
import { rateLimitMiddleware } from './middlewares/real-limit.middleware.js';
import { authMiddleware } from './middlewares/auth.middleware.js';
import { requireAdmin } from './middlewares/requireAdmin.js';

// ---------------------------

// ----------router引入----------
import { userRouter } from './modules/user/user.routes.js';
import { upgradeRouter } from './modules/upgrade/upgrade.routes.js';
import { stockInfoRouter } from './modules/stockInfo/stockInfo.route.js';
import { assetRouter } from './modules/asset/asset.router.js';
import { dashboardRouter } from './modules/dashboard/dashboard.router.js';
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

  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  setupGoogleStrategy();
  app.use(passport.initialize());
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/v1/user', authRouter);

  app.use('/api/v1/stock', stockInfoRouter);

  app.use('/api/v1/user', authMiddleware, userRouter);
  app.use('/api/v1/admin', authMiddleware, rateLimitMiddleware, requireAdmin, upgradeRouter);
  app.use('/api/v1/assets', authMiddleware, rateLimitMiddleware, assetRouter);
  app.use('/api/v1/dashboard', authMiddleware, dashboardRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
