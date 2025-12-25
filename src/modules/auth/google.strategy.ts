import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';

type GoogleProfile = Profile;

type GoogleStrategyConfig = {
  clientID: string;
  clientSecret: string;
  callbackURL: string;
};

export function setupGoogleStrategy(): void {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL;

  if (!clientID || !clientSecret || !callbackURL) {
    throw new Error('Missing Google OAuth env vars.');
  }

  const config: GoogleStrategyConfig = {
    clientID,
    clientSecret,
    callbackURL,
  };

  passport.use(
    new GoogleStrategy(
      config,
      async (_accessToken: string, _refreshToken: string, profile: GoogleProfile, done) => {
        // For step-1, we only pass through the profile.
        return done(null, profile);
      }
    )
  );
}
