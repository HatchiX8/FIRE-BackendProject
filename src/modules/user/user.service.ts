import { AppDataSource } from '@/db/data-source.js';
import { Repository } from 'typeorm';
import { UserSchema, type UserEntity } from '@/entity/user.schema.js';
import { LotsSchema } from '@/entity/lots.schema.js';
import { UserCapitalSchema, type UserCapitalEntity } from '@/entity/portfolioSummaries.schema.js';
import type {
  UpdateProfileDto,
  UserInfoDto,
  AccountUpgradeRequestDto,
  UserTotalInvestDto,
} from './user.dto.js';
import { httpError, roundTo2 } from '@/utils/index.js';
import type { EntityManager } from 'typeorm';
// ----------取得使用者資料----------
export async function getUserInfo(UserId: string): Promise<UserInfoDto> {
  const userRepo = AppDataSource.getRepository(UserSchema);

  const user = await userRepo.findOne({
    where: { userId: UserId },
  });

  if (!user) throw httpError(404, '查無個人資料，請重新登入');

  return {
    name: user.userName,
    nickname: user.userNickname ?? null,
    email: user.userEmail,
    role: user.role,
    avatar_url: user.avatarUrl ?? null,
    upgrade_status: user.upgradePlan ?? 'none',
  };
}
// ---------------------------------

// ----------編輯資料----------
export type PublicUserProfile = {
  id: string;
  email: string;
  name: string;
  nickname: string | null;
  // avatar_url: string | null; 未來擴充更新圖片功能
  updatedAt: string;
};

// 更新使用者資料
export const updateProfile =
  (usersRepo: Repository<UserEntity>) =>
  async (userId: string, dto: UpdateProfileDto): Promise<void> => {
    const user = await usersRepo.findOne({ where: { userId: userId } });
    if (!user) throw httpError(404, '更新失敗，找不到使用者資料');

    if (dto.name !== undefined) user.userName = dto.name;
    if (dto.nickname !== undefined) user.userNickname = dto.nickname;
    // if (dto.avatar_url !== undefined) user.avatarUrl = dto.avatar_url; 未來擴充更新圖片功能

    await usersRepo.save(user);
  };
// ---------------------------

// ----------帳號升級----------
export type AccountUpgradeStatus = 'none' | 'pending' | 'approved' | 'rejected';

export const requestAccountUpgrade =
  (usersRepo: Repository<UserEntity>) =>
  async (userId: string, dto: AccountUpgradeRequestDto): Promise<void> => {
    const user = await usersRepo.findOne({ where: { userId } });
    if (!user) throw httpError(404, '更新失敗，找不到使用者資料');

    const status = user.upgradePlan as AccountUpgradeStatus | null | undefined;

    // 嚴格版：避免重複申請 / 已通過仍申請
    if (status === 'pending') throw httpError(404, '此帳號已提交申請');
    if (status === 'approved') throw httpError(404, '已通過申請，無法重複提交');

    // rejected / none / null → pending
    user.upgradePlan = 'pending';
    user.userNote = dto.upgradeReason;
    user.updatedAt = new Date();

    await usersRepo.save(user);
  };
// ---------------------------

// ----------資金操作----------
// 取得使用者總金額 total_invest（get）
export async function getUserTotalInvest(userId: string): Promise<UserTotalInvestDto> {
  const capitalRepo = AppDataSource.getRepository(UserCapitalSchema);

  const row = await capitalRepo.findOne({
    where: { userId },
    select: {
      totalInvest: true,
    },
  });

  return {
    total_invest: row ? Number(row.totalInvest) : 0,
  };
}

// 共用：取得資金列，不存在就建立（cost_total 預設 0）
async function getOrCreateCapitalRow(
  userId: string,
  manager?: EntityManager
): Promise<UserCapitalEntity> {
  const repo = manager
    ? manager.getRepository(UserCapitalSchema)
    : AppDataSource.getRepository(UserCapitalSchema);

  const exist = await repo.findOne({ where: { userId } });
  if (exist) return exist;

  const created: UserCapitalEntity = {
    userId,
    totalInvest: '0',
    updatedAt: new Date(),
  };

  return repo.save(created);
}

// 設定使用者總投入資金 total_invest（set）
export async function depositTotalInvest(userId: string, amount: number): Promise<void> {
  if (amount <= 0) throw httpError(400, '投入金額必須大於 0');

  return AppDataSource.transaction(async (manager) => {
    const capitalRepo = manager.getRepository(UserCapitalSchema);
    const capital = await getOrCreateCapitalRow(userId, manager);

    // 改用 lots.remainingCost 彙總
    const holdingCost = await getUserHoldingCost(manager, userId);

    if (holdingCost > amount) {
      throw httpError(400, '投入金額不可小於目前持倉成本');
    }

    capital.totalInvest = roundTo2(amount).toFixed(2);
    capital.updatedAt = new Date();
    await capitalRepo.save(capital);
  });
}

// 投入金額 total_invest（+=）
export async function addTotalInvest(userId: string, amount: number): Promise<void> {
  if (amount <= 0) throw httpError(400, '投入金額必須大於 0');

  const capitalRepo = AppDataSource.getRepository(UserCapitalSchema);
  const capital = await getOrCreateCapitalRow(userId);

  const nextTotal = roundTo2(Number(capital.totalInvest) + amount);

  capital.totalInvest = nextTotal.toFixed(2);
  capital.updatedAt = new Date();
  await capitalRepo.save(capital);
}

// 提領金額 total_invest（-=）
export async function withdrawalTotalInvest(userId: string, amount: number): Promise<void> {
  if (amount <= 0) throw httpError(400, '提領金額必須大於 0');

  return AppDataSource.transaction(async (manager) => {
    const capitalRepo = manager.getRepository(UserCapitalSchema);
    const capital = await getOrCreateCapitalRow(userId, manager);

    const nextTotal = roundTo2(Number(capital.totalInvest) - amount);

    // 你原本的規則：不可 <= 0
    if (nextTotal <= 0) {
      throw httpError(400, '提領後投入資金不得小於等於 0');
    }

    // 改用 lots.remainingCost
    const holdingCost = await getUserHoldingCost(manager, userId);

    if (holdingCost > nextTotal) {
      throw httpError(400, '提領後投入資金不可小於目前持倉成本');
    }

    capital.totalInvest = nextTotal.toFixed(2);
    capital.updatedAt = new Date();
    await capitalRepo.save(capital);
  });
}
// ---------------------------

async function getUserHoldingCost(manager: any, userId: string): Promise<number> {
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
