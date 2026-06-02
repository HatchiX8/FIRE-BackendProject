import type {
  UpdateProfileDto,
  UserInfoDto,
  AccountUpgradeRequestDto,
  UserTotalInvestDto,
} from './user.dto.js';
import { httpError, roundTo2 } from '@/utils/index.js';
import { userRepository } from './user.repository.js';

// ----------取得使用者資料----------
export async function getUserInfo(UserId: string): Promise<UserInfoDto> {
  const user = await userRepository.findUserById(UserId);

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
export async function updateProfile(userId: string, dto: UpdateProfileDto): Promise<void> {
  const user = await userRepository.findUserById(userId);
  if (!user) throw httpError(404, '更新失敗，找不到使用者資料');

  if (dto.name !== undefined) user.userName = dto.name;
  if (dto.nickname !== undefined) user.userNickname = dto.nickname;
  // if (dto.avatar_url !== undefined) user.avatarUrl = dto.avatar_url; 未來擴充更新圖片功能

  await userRepository.saveUser(user);
}
// ---------------------------

// ----------帳號升級----------
export type AccountUpgradeStatus = 'none' | 'pending' | 'approved' | 'rejected';

export async function requestAccountUpgrade(
  userId: string,
  dto: AccountUpgradeRequestDto
): Promise<void> {
  const user = await userRepository.findUserById(userId);
  if (!user) throw httpError(404, '更新失敗，找不到使用者資料');

  const status = user.upgradePlan as AccountUpgradeStatus | null | undefined;

  // 嚴格版：避免重複申請 / 已通過仍申請
  if (status === 'pending') throw httpError(404, '此帳號已提交申請');
  if (status === 'approved') throw httpError(404, '已通過申請，無法重複提交');

  // rejected / none / null → pending
  user.upgradePlan = 'pending';
  user.userNote = dto.upgradeReason;
  user.updatedAt = new Date();

  await userRepository.saveUser(user);
}
// ---------------------------

// ----------資金操作----------
// 取得使用者總金額 total_invest（get）
export async function getUserTotalInvest(userId: string): Promise<UserTotalInvestDto> {
  return {
    totalInvest: await userRepository.getUserTotalInvest(userId),
  };
}

// 設定使用者總投入資金 total_invest（set）
export async function depositTotalInvest(userId: string, amount: number): Promise<void> {
  if (amount <= 0) throw httpError(400, '投入金額必須大於 0');

  return userRepository.runCapitalTransaction(async (repo) => {
    const capital = await repo.getOrCreateCapitalRow(userId);

    // 改用 lots.remainingCost 彙總
    const holdingCost = await repo.getUserHoldingCost(userId);

    if (holdingCost > amount) {
      throw httpError(400, '投入金額不可小於目前持倉成本');
    }

    capital.totalInvest = roundTo2(amount).toFixed(2);
    capital.updatedAt = new Date();
    await repo.saveCapital(capital);
  });
}

// 投入金額 total_invest（+=）
export async function addTotalInvest(userId: string, amount: number): Promise<void> {
  if (amount <= 0) throw httpError(400, '投入金額必須大於 0');

  const capital = await userRepository.getOrCreateCapitalRow(userId);

  const nextTotal = roundTo2(Number(capital.totalInvest) + amount);

  capital.totalInvest = nextTotal.toFixed(2);
  capital.updatedAt = new Date();
  await userRepository.saveCapital(capital);
}

// 提領金額 total_invest（-=）
export async function withdrawalTotalInvest(userId: string, amount: number): Promise<void> {
  if (amount <= 0) throw httpError(400, '提領金額必須大於 0');

  return userRepository.runCapitalTransaction(async (repo) => {
    const capital = await repo.getOrCreateCapitalRow(userId);

    const nextTotal = roundTo2(Number(capital.totalInvest) - amount);

    // 你原本的規則：不可 <= 0
    if (nextTotal <= 0) {
      throw httpError(400, '提領後投入資金不得小於等於 0');
    }

    // 改用 lots.remainingCost
    const holdingCost = await repo.getUserHoldingCost(userId);

    if (holdingCost > nextTotal) {
      throw httpError(400, '提領後投入資金不可小於目前持倉成本');
    }

    capital.totalInvest = nextTotal.toFixed(2);
    capital.updatedAt = new Date();
    await repo.saveCapital(capital);
  });
}
// ---------------------------
