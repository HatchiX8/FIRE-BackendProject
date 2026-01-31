import { Router } from 'express';
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
userRouter.get('/info', getUserInfoController);

userRouter.patch('/update', makeUpdateProfileHandler(usersRepo));

userRouter.post('/account-upgrade', makeAccountUpgradeHandler(usersRepo));

userRouter.post('/update/totalInvest/deposit', depositTotalInvestHandler);

userRouter.post('/update/totalInvest/add', addInvestHandler);

userRouter.post('/update/totalInvest/withdrawal', withdrawalInvestHandler);

userRouter.get('/totalInvest', getUserTotalInvestHandler);
