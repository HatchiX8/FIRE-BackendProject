import { AppDataSource } from '@/db/data-source.js';
import { UserEntity } from '@/entity/user.entity.js';
import { formatDateTime, diffDays } from '@/utils/index.js';
import type {
  UpgradeRequestItemDto,
  UserItemDto,
  ReviewStatus,
  ActivationStatus,
} from './upgrade.dto.js';
import { httpError } from '@/utils/index.js';

// ----------取得申請者----------
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
// ------------------------------

// ----------取得使用者----------
export async function getUserList(): Promise<UserItemDto[]> {
  const userRepo = AppDataSource.getRepository(UserEntity);

  const users = await userRepo.find({
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

  return users.map((u) => ({
    id: u.userId,
    name: u.userName ?? '',
    adminNote: '', // u.adminNote ?? '',
    memberAge: u.createdAt ? diffDays(u.createdAt) : 0,
  }));
}

// ------------------------------

// ----------審核申請----------
export async function reviewUpgradeRequest(params: {
  userId: string;
  status: ReviewStatus;
  userNote: string;
}): Promise<void> {
  const userRepo = AppDataSource.getRepository(UserEntity);

  // 因為審核者初期只有一位，故沒有更新 reviewerId 和 reviewedAt 欄位，如有需要可額外添加
  const user = await userRepo.findOne({
    where: { userId: params.userId },
    select: {
      userId: true,
      role: true,
      upgradePlan: true,
      userNote: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw httpError(404, '查無申請者資料');
  }

  // 避免重複審核：只允許 pending → approved/rejected
  if (user.upgradePlan !== 'pending') {
    throw httpError(409, '此申請已審核或狀態不允許變更');
  }

  if (user.role !== 'guest') {
    throw httpError(409, '此帳號目前身分不允許進行升級審核');
  }

  user.upgradePlan = params.status; // approved / rejected
  user.userNote = params.userNote;

  if (params.status === 'approved') {
    user.role = 'user';
  }

  await userRepo.save(user);
}
// ---------------------------

// ----------會員權限操作----------
export async function patchUserActivation(params: {
  userId: string;
  status: ActivationStatus; // downgrade | ban
  userNote: string;
}): Promise<void> {
  const userRepo = AppDataSource.getRepository(UserEntity);

  const user = await userRepo.findOne({
    where: { userId: params.userId },
    select: {
      userId: true,
      role: true,
      userNote: true,
      upgradePlan: true,
    },
  });

  if (!user) {
    throw httpError(404, '查無使用者資料');
  }

  if (user.role === 'guest') throw httpError(409, '此帳號已為訪客身分，無法再進行降級或封鎖操作');

  // 依目前規則：downgrade / ban 都一律降為 guest
  user.role = 'guest';
  user.userNote = params.userNote;
  user.upgradePlan = 'none';
  // （可選）若你想先留痕，未來擴充 ban 分類可用：
  // user.lastAdminAction = params.status;

  await userRepo.save(user);
}
// -------------------------------
