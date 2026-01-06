import { AppDataSource } from '../../db/data-source.js';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity.js';
import { UpdateProfileDto, type UserInfoDto, type AccountUpgradeRequestDto } from './user.dto.js';

export async function getUserInfo(UserId: string): Promise<UserInfoDto> {
  const userRepo = AppDataSource.getRepository(UserEntity);

  const user = await userRepo.findOne({
    where: { userId: UserId },
  });

  if (!user) {
    throw Object.assign(new Error('User not found'), { statusCode: 404 });
  }

  return {
    name: user.userName,
    nickname: user.userNickname ?? null,
    email: user.userEmail,
    role: user.role,
    avatar_url: user.avatarUrl ?? null,
    upgrade_status: user.upgradePlan ?? 'none',
  };
}

// ----------編輯資料----------
export type PublicUserProfile = {
  id: string;
  email: string;
  name: string;
  nickname: string | null;
  // avatar_url: string | null; 未來擴充更新圖片功能
  updatedAt: string;
};

type HttpError = Error & { statusCode?: number };

const httpError = (statusCode: number, message: string): HttpError =>
  Object.assign(new Error(message), { statusCode });

export const updateProfile =
  (usersRepo: Repository<UserEntity>) =>
  async (userId: string, dto: UpdateProfileDto): Promise<void> => {
    const user = await usersRepo.findOne({ where: { userId: userId } });
    if (!user) throw httpError(404, '更新失敗，請稍後再試');

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
    if (!user) throw httpError(404, '更新失敗，請稍後再試');

    const status = user.upgradePlan as AccountUpgradeStatus | null | undefined;

    // 嚴格版：避免重複申請 / 已通過仍申請
    if (status === 'pending') throw httpError(409, 'Already pending');
    if (status === 'approved') throw httpError(409, 'Already approved');

    // rejected / none / null → pending
    user.upgradePlan = 'pending';
    user.userNote = dto.upgradeReason;
    user.updatedAt = new Date();

    await usersRepo.save(user);
  };
// ---------------------------
