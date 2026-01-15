import { Router } from 'express';
import { getUserInfoController } from './user.controller.js';
import { authMiddleware } from '@/middlewares/auth.middleware.js';
import { makeUpdateProfileHandler, makeAccountUpgradeHandler } from './user.controller.js';
import { AppDataSource } from '@/db/data-source.js';
import { UserSchema } from '@/entity/user.schema.js';

export const userRouter = Router();
const usersRepo = AppDataSource.getRepository(UserSchema);
userRouter.get('/info', authMiddleware, getUserInfoController);

userRouter.patch('/update', authMiddleware, makeUpdateProfileHandler(usersRepo));

userRouter.post('/account-upgrade', authMiddleware, makeAccountUpgradeHandler(usersRepo));
