import { Router } from 'express';
import {
  getUserInfoController,
  updateProfileHandler,
  accountUpgradeHandler,
  depositTotalInvestHandler,
  addInvestHandler,
  withdrawalInvestHandler,
  getUserTotalInvestHandler,
} from './user.controller.js';

export const userRouter = Router();
userRouter.get('/info', getUserInfoController);

userRouter.patch('/update', updateProfileHandler);

userRouter.post('/account-upgrade', accountUpgradeHandler);

userRouter.post('/update/totalInvest/deposit', depositTotalInvestHandler);

userRouter.post('/update/totalInvest/add', addInvestHandler);

userRouter.post('/update/totalInvest/withdrawal', withdrawalInvestHandler);

userRouter.get('/totalInvest', getUserTotalInvestHandler);
