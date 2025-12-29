import express from 'express';
import passport from 'passport';
import cookieParser from 'cookie-parser';
// ----------登入驗證----------
import { setupGoogleStrategy } from './modules/auth/google.strategy.js';
import { authRouter } from './modules/auth/auth.router.js';
import { authMiddleware } from './middlewares/auth.middleware.js';
// ---------------------------

import { healthRoutes } from './modules/health/health.routes.js';
import { notFound } from './middlewares/not-found.js';
import { errorHandler } from './middlewares/error-handler.js';

export const createApp = () => {
  const app = express();

  setupGoogleStrategy();
  app.use(passport.initialize());
  app.use(express.json());
  app.use(cookieParser());

  app.use('/auth', authRouter);
  app.use('/api/health', authMiddleware, healthRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
