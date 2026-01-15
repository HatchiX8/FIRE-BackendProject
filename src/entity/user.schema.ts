import { EntitySchema } from 'typeorm';

import type { UserRole, UpgradeStatus } from '../modules/user/user.types.js';

export type UserEntity = {
  userId: string;

  googleId: string | null;
  userName: string;
  userNickname: string | null;

  userEmail: string;

  role: UserRole;
  isActive: boolean;
  upgradePlan: UpgradeStatus;

  avatarUrl: string | null;
  userNote: string | null;

  lastLoginAt: Date | null;

  reviewerId: string | null;
  reviewedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
};

export const UserSchema = new EntitySchema<UserEntity>({
  name: 'users',
  tableName: 'users',

  columns: {
    userId: {
      name: 'user_id',
      type: 'uuid',
      primary: true,
      generated: 'uuid',
    },

    googleId: {
      name: 'google_id',
      type: 'varchar',
      length: 100,
      nullable: true,
    },

    userName: {
      name: 'user_name',
      type: 'varchar',
      length: 30,
      nullable: true,
    },

    userNickname: {
      name: 'user_nickname',
      type: 'varchar',
      length: 30,
      nullable: true,
    },

    userEmail: {
      name: 'user_email',
      type: 'varchar',
      length: 150,
      nullable: false,
    },

    role: {
      name: 'role',
      type: 'varchar',
      length: 20,
      nullable: false,
      default: 'guest',
    },

    isActive: {
      name: 'is_active',
      type: 'boolean',
      nullable: false,
      default: true,
    },

    upgradePlan: {
      name: 'upgrade_status',
      type: 'varchar',
      length: 20,
      nullable: false,
      default: 'none',
    },

    avatarUrl: {
      name: 'avatar_url',
      type: 'text',
      nullable: true,
    },

    userNote: {
      name: 'user_note',
      type: 'text',
      nullable: true,
    },

    lastLoginAt: {
      name: 'last_login_at',
      type: 'timestamptz',
      nullable: true,
    },

    reviewerId: {
      name: 'reviewer_id',
      type: 'uuid',
      nullable: true,
    },

    reviewedAt: {
      name: 'reviewed_at',
      type: 'timestamptz',
      nullable: true,
    },

    createdAt: {
      name: 'created_at',
      type: 'timestamptz',
      createDate: true,
    },

    updatedAt: {
      name: 'updated_at',
      type: 'timestamptz',
      updateDate: true,
    },
  },

  // ✅ 對應你原本的 @Index(unique)
  indices: [
    {
      name: 'UQ_user_google_id',
      columns: ['googleId'],
      unique: true,
    },
    {
      name: 'UQ_user_email',
      columns: ['userEmail'],
      unique: true,
    },
  ],
});
