import { AppDataSource } from '@/db/data-source.js';
import { UserSchema, type UserEntity } from '@/entity/user.schema.js';
import type { DataSource, Repository } from 'typeorm';

export class UpgradeRepository {
  private readonly userRepo: Repository<UserEntity>;

  constructor(dataSource: DataSource) {
    this.userRepo = dataSource.getRepository(UserSchema);
  }

  findPendingUpgradeRequests(): Promise<UserEntity[]> {
    return this.userRepo.find({
      where: { upgradePlan: 'pending' },
      select: {
        userId: true,
        userName: true,
        userNote: true,
        updatedAt: true,
      },
      order: { updatedAt: 'ASC' },
    });
  }

  findGeneralUsers(): Promise<UserEntity[]> {
    return this.userRepo.find({
      where: { role: 'user' },
      select: {
        userId: true,
        userName: true,
        // adminNote: true,
        createdAt: true,
        updatedAt: true,
      },
      order: { updatedAt: 'ASC' },
    });
  }

  findUpgradeReviewUser(userId: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({
      where: { userId },
      select: {
        userId: true,
        role: true,
        upgradePlan: true,
        userNote: true,
        updatedAt: true,
      },
    });
  }

  findActivationUser(userId: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({
      where: { userId },
      select: {
        userId: true,
        role: true,
        userNote: true,
        upgradePlan: true,
      },
    });
  }

  async saveUser(user: UserEntity): Promise<void> {
    await this.userRepo.save(user);
  }
}

export const upgradeRepository = new UpgradeRepository(AppDataSource);
