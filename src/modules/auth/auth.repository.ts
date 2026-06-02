import { AppDataSource } from '@/db/data-source.js';
import { UserSchema, type UserEntity } from '@/entity/user.schema.js';
import type { DataSource, Repository } from 'typeorm';
import { RefreshTokenEntity } from './refresh-token.entity.js';

export class AuthRepository {
  private readonly userRepo: Repository<UserEntity>;
  private readonly refreshRepo: Repository<RefreshTokenEntity>;

  constructor(dataSource: DataSource) {
    this.userRepo = dataSource.getRepository(UserSchema);
    this.refreshRepo = dataSource.getRepository(RefreshTokenEntity);
  }

  async findUserByGoogleIdOrEmail(googleId: string, email: string): Promise<UserEntity | null> {
    return (
      (await this.userRepo.findOne({ where: { googleId } })) ??
      (await this.userRepo.findOne({ where: { userEmail: email } }))
    );
  }

  createGoogleUser(input: {
    email: string;
    name: string;
    googleId: string;
    picture: string;
  }): UserEntity {
    return this.userRepo.create({
      userEmail: input.email,
      userName: input.name,
      googleId: input.googleId,
      avatarUrl: input.picture,
    });
  }

  saveUser(user: UserEntity): Promise<UserEntity> {
    return this.userRepo.save(user);
  }

  findUserById(userId: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { userId } });
  }

  createRefreshToken(input: {
    userId: string;
    expiresAt: Date;
    tokenHash: string;
    revokedAt: Date | null;
  }): RefreshTokenEntity {
    return this.refreshRepo.create(input);
  }

  saveRefreshToken(row: RefreshTokenEntity): Promise<RefreshTokenEntity> {
    return this.refreshRepo.save(row);
  }

  findRefreshTokenById(id: string): Promise<RefreshTokenEntity | null> {
    return this.refreshRepo.findOne({ where: { id } });
  }

  async deleteRefreshTokenById(id: string): Promise<void> {
    await this.refreshRepo.delete({ id });
  }
}

export const authRepository = new AuthRepository(AppDataSource);
