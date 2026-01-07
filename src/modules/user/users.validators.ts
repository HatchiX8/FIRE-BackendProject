import { UpdateProfileDto, AccountUpgradeRequestDto } from './user.dto.js';
import { httpError } from '@/utils/index.js';

const normalizeString = (val: unknown): string | undefined => {
  if (typeof val !== 'string') return undefined;
  const s = val.trim();
  return s.length === 0 ? undefined : s;
};

export const parseUpdateProfileDto = (body: unknown): UpdateProfileDto => {
  if (!body || typeof body !== 'object') {
    throw httpError(404, '無效的請求內容');
  }

  const b = body as Record<string, unknown>;

  const name = normalizeString(b.name);
  const nickname = normalizeString(b.nickname);

  let avatar_url: string | null | undefined;
  if (b.avatar_url === null) {
    avatar_url = null;
  } else if (typeof b.avatar_url === 'string') {
    const s = b.avatar_url.trim();
    avatar_url = s.length ? s : undefined;
  }

  const dto: UpdateProfileDto = {};
  if (name !== undefined) dto.name = name;
  if (nickname !== undefined) dto.nickname = nickname;
  if (avatar_url !== undefined) dto.avatar_url = avatar_url;

  if (Object.keys(dto).length === 0) {
    throw httpError(404, '未提供可更新的欄位');
  }

  if (dto.name && dto.name.length > 100) {
    throw httpError(404, '名稱過長');
  }
  if (dto.nickname && dto.nickname.length > 100) {
    throw httpError(404, '暱稱過長');
  }
  if (dto.avatar_url && dto.avatar_url.length > 500) {
    throw httpError(404, '頭像網址過長');
  }

  return dto;
};

// ----------帳號升級請求轉換----------
export const parseAccountUpgradeRequestDto = (body: unknown): AccountUpgradeRequestDto => {
  if (!body || typeof body !== 'object') throw httpError(404, '提交無效的申請');

  const b = body as Record<string, unknown>;
  const reason = typeof b.upgradeReason === 'string' ? b.upgradeReason.trim() : '';

  if (!reason) throw httpError(404, '需要提交申請備註');
  if (reason.length > 500) throw httpError(404, '申請備註過長');

  return { upgradeReason: reason };
};
// -----------------------------------
