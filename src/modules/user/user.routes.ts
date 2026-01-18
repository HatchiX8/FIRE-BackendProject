import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware.js';
import {
  getUserInfoController,
  makeUpdateProfileHandler,
  makeAccountUpgradeHandler,
  depositTotalInvestHandler,
  addInvestHandler,
  withdrawalInvestHandler,
  getUserTotalInvestHandler,
} from './user.controller.js';
import { AppDataSource } from '@/db/data-source.js';
import { UserSchema } from '@/entity/user.schema.js';

export const userRouter = Router();
const usersRepo = AppDataSource.getRepository(UserSchema);
userRouter.get('/info', authMiddleware, getUserInfoController);

userRouter.patch('/update', authMiddleware, makeUpdateProfileHandler(usersRepo));

userRouter.post('/account-upgrade', authMiddleware, makeAccountUpgradeHandler(usersRepo));

userRouter.post('/update/totalInvest/deposit', authMiddleware, depositTotalInvestHandler);

userRouter.post('/update/totalInvest/add', authMiddleware, addInvestHandler);

userRouter.post('/update/totalInvest/withdrawal', authMiddleware, withdrawalInvestHandler);

userRouter.get('/totalInvest', authMiddleware, getUserTotalInvestHandler);
