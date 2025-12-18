import express from 'express';
import { healthRoutes } from './modules/health/health.routes';
import { notFound } from './middlewares/not-found';
import { errorHandler } from './middlewares/error-handler';

export const createApp = () => {
  const app = express();

  app.use(express.json());

  app.use('/health', healthRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
