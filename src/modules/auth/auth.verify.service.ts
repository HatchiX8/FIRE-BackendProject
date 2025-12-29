import { DataSource } from 'typeorm';
import { UserEntity } from '../users/user.entity.js';

export type MeResponse = {
  id: string;
  email: string;
  name: string;
  picture: string;
};

export async function checkLogin(ds: DataSource, userId: string): Promise<MeResponse | null> {
  const repo = ds.getRepository(UserEntity);

  const user = await repo.findOne({ where: { userId } });
  if (!user) return null;

  return {
    id: user.userId,
    email: user.userEmail,
    name: user.userName,
    picture: user.avatarUrl || '',
  };
}
