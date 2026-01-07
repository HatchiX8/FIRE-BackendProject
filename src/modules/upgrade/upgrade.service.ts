import { AppDataSource } from '@/db/data-source.js';
import { UserEntity } from '@/entity/user.entity.js';
import { formatDateTime } from '@/utils/index.js';
import type { UpgradeRequestItemDto } from './upgrade.dto.js';

export async function getPendingUpgradeRequests(): Promise<UpgradeRequestItemDto[]> {
  const userRepo = AppDataSource.getRepository(UserEntity);

  const users = await userRepo.find({
    where: { upgradePlan: 'pending' },
    select: {
      userId: true,
      userName: true,
      userNote: true,
      updatedAt: true,
    },
    order: { updatedAt: 'ASC' },
  });

  return users.map((u) => ({
    id: u.userId,
    name: u.userName ?? '',
    upgradeReason: u.userNote ?? '',
    createdAt: u.updatedAt ? formatDateTime(u.updatedAt) : '',
  }));
}
