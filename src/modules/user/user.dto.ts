import type { UserRole, UpgradeStatus } from './user.types.js';

export interface UserInfoDto {
  name: string;
  nickname: string | null;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  upgrade_status: UpgradeStatus;
}

export type UpdateProfileDto = {
  name?: string;
  nickname?: string;
  avatar_url?: string | null;
};

export type AccountUpgradeRequestDto = {
  upgradeReason: string;
};

export type TotalInvestDepositDto = {
  amount: number;
};

export type UserTotalInvestDto = {
  total_invest: number;
};
