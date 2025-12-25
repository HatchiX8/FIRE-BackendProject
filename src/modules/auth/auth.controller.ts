import { Router } from 'express';
import passport from 'passport';
import { googleOAuthLogin } from './auth.service.js';
import { toGoogleProfile } from './auth.normalize.js';
import { AppDataSource } from '../../db/data-source.js';

// ----------初始化----------
export const authRouter = Router();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
// --------------------------

// ----------google第三方登入----------
authRouter.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

authRouter.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/google/failure' }),
  async (req, res) => {
    const profile = toGoogleProfile(req.user);

    if (!profile) {
      return res.status(500).json({
        ok: false,
        message: 'Invalid Google OAuth payload',
      });
    }

    const result = await googleOAuthLogin(AppDataSource, profile, ACCESS_SECRET, REFRESH_SECRET);

    return res.status(200).json({ ok: true, ...result });
  }
);

authRouter.get('/google/failure', (_req, res) => {
  return res.status(401).json({
    ok: false,
    message: 'Google authentication failed',
  });
});

// -----------------------------------
