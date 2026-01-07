import 'express';

export type UserRole = 'admin' | 'user';

export interface RequestUser {
  userId: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}
