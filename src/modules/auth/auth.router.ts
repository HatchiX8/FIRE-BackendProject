import { Router } from 'express';
import passport from 'passport';

import { authMiddleware } from '../../middlewares/auth.middleware.js';
import {
  checkLoginController,
  googleCallbackController,
  logoutController,
  refreshAccessTokenController,
} from './auth.controller.js';
// ----------初始化----------
export const authRouter = Router();
// --------------------------

// ----------google第三方登入----------
// Step1: 導向 google OAuth 頁面
authRouter.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// Step2: Google OAuth 登入成功後的 callback 處理
authRouter.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/api/v1/user/google/failure',
  }),
  googleCallbackController
);

authRouter.get('/check', authMiddleware, checkLoginController);

authRouter.post('/refresh', refreshAccessTokenController);

// 登出
authRouter.post('/logout', logoutController);
// -----------------------------------
