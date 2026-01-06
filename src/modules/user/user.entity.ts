import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import type { UserRole, UpgradeStatus } from './user.types.js';

@Entity({ name: 'users' })
@Index('UQ_user_google_id', ['googleId'], { unique: true })
@Index('UQ_user_email', ['userEmail'], { unique: true })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', length: 100, name: 'google_id', nullable: true })
  googleId!: string | null;

  @Column({ type: 'varchar', length: 30, name: 'user_name', nullable: true })
  userName!: string;

  @Column({ type: 'varchar', length: 30, name: 'user_nickname', nullable: true })
  userNickname!: string | null;

  @Column({ type: 'varchar', length: 150, name: 'user_email' })
  userEmail!: string;

  @Column({ type: 'varchar', length: 20, name: 'role', default: 'guest' })
  role!: UserRole;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ type: 'varchar', length: 20, name: 'upgrade_status', default: 'none' })
  upgradePlan!: UpgradeStatus;

  @Column({ type: 'text', name: 'avatar_url', nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'text', name: 'user_note', nullable: true })
  userNote!: string | null;

  @Column({ type: 'timestamptz', name: 'last_login_at', nullable: true })
  lastLoginAt!: Date | null;

  @Column({ type: 'uuid', name: 'reviewer_id', nullable: true })
  reviewerId!: string | null;

  @Column({ type: 'timestamptz', name: 'reviewed_at', nullable: true })
  reviewedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt!: Date;
}
