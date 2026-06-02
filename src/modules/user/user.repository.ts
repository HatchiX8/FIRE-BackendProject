import { AppDataSource } from '@/db/data-source.js';
import { LotsSchema } from '@/entity/lots.schema.js';
import { UserCapitalSchema, type UserCapitalEntity } from '@/entity/portfolioSummaries.schema.js';
import { UserSchema, type UserEntity } from '@/entity/user.schema.js';
import type { DataSource, EntityManager, Repository } from 'typeorm';

type CapitalTransactionRepository = {
  getOrCreateCapitalRow(userId: string): Promise<UserCapitalEntity>;
  getUserHoldingCost(userId: string): Promise<number>;
  saveCapital(capital: UserCapitalEntity): Promise<void>;
};

export class UserRepository {
  private readonly dataSource: DataSource;
  private readonly usersRepo: Repository<UserEntity>;
  private readonly capitalRepo: Repository<UserCapitalEntity>;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.usersRepo = dataSource.getRepository(UserSchema);
    this.capitalRepo = dataSource.getRepository(UserCapitalSchema);
  }

  findUserById(userId: string): Promise<UserEntity | null> {
    return this.usersRepo.findOne({ where: { userId } });
  }

  async saveUser(user: UserEntity): Promise<void> {
    await this.usersRepo.save(user);
  }

  async getUserTotalInvest(userId: string): Promise<number> {
    const row = await this.capitalRepo.findOne({
      where: { userId },
      select: {
        totalInvest: true,
      },
    });

    return row ? Number(row.totalInvest) : 0;
  }

  async getOrCreateCapitalRow(userId: string): Promise<UserCapitalEntity> {
    return getOrCreateCapitalRow(this.capitalRepo, userId);
  }

  async saveCapital(capital: UserCapitalEntity): Promise<void> {
    await this.capitalRepo.save(capital);
  }

  runCapitalTransaction<T>(
    operation: (repo: CapitalTransactionRepository) => Promise<T>
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      const capitalRepo = manager.getRepository(UserCapitalSchema);

      const transactionRepo: CapitalTransactionRepository = {
        getOrCreateCapitalRow: (userId) => getOrCreateCapitalRow(capitalRepo, userId),
        getUserHoldingCost: (userId) => getUserHoldingCost(manager, userId),
        saveCapital: async (capital) => {
          await capitalRepo.save(capital);
        },
      };

      return operation(transactionRepo);
    });
  }
}

async function getOrCreateCapitalRow(
  capitalRepo: Repository<UserCapitalEntity>,
  userId: string
): Promise<UserCapitalEntity> {
  const exist = await capitalRepo.findOne({ where: { userId } });
  if (exist) return exist;

  const created: UserCapitalEntity = {
    userId,
    totalInvest: '0',
    updatedAt: new Date(),
  };

  return capitalRepo.save(created);
}

async function getUserHoldingCost(manager: EntityManager, userId: string): Promise<number> {
  const lotsRepo = manager.getRepository(LotsSchema);

  const raw = (await lotsRepo
    .createQueryBuilder('lot')
    .select('COALESCE(SUM(lot.remainingCost), 0)', 'holdingCost')
    .where('lot.userId = :userId', { userId })
    .andWhere('lot.isVoided = false')
    .andWhere('lot.remainingQuantity > 0')
    .getRawOne()) as { holdingCost: string } | null;

  return raw ? Number(raw.holdingCost) : 0;
}

export const userRepository = new UserRepository(AppDataSource);
