import { DataSource } from 'typeorm';
import { UserSchema } from '@/entity/user.schema.js';

export type MeResponse = {
  id: string;
  name: string;
  nickname: string;
  email: string;
  avatar_url: string;
  role: string;
  upgrade_status: string;
  is_active: boolean;
};

export async function checkLogin(ds: DataSource, userId: string): Promise<MeResponse | null> {
  const repo = ds.getRepository(UserSchema);

  const user = await repo.findOne({ where: { userId } });
  if (!user) return null;

  return {
    id: user.userId,
    name: user.userName,
    nickname: user.userNickname || '',
    email: user.userEmail,
    avatar_url: user.avatarUrl || '',
    role: user.role,
    upgrade_status: user.upgradePlan,
    is_active: user.isActive,
  };
}
