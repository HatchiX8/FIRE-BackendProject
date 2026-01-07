import { AppDataSource } from '@/db/data-source.js';
import { Repository } from 'typeorm';
import { UserEntity } from '@/entity/user.entity.js';
import { UpdateProfileDto, type UserInfoDto, type AccountUpgradeRequestDto } from './user.dto.js';
import { httpError } from '@/utils/index.js';
// ----------取得使用者資料----------
export async function getUserInfo(UserId: string): Promise<UserInfoDto> {
  const userRepo = AppDataSource.getRepository(UserEntity);

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
