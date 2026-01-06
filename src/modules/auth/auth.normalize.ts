export type GoogleProfile = {
  id: string;
  email: string;
  name: string;
  picture: string;
};

type PassportEmail = { value?: unknown };
type PassportPhoto = { value?: unknown };

type PassportGoogleUser = {
  id?: unknown;
  displayName?: unknown;
  emails?: unknown;
  photos?: unknown;
  _json?: unknown;
};

type PassportGoogleJson = {
  email?: unknown;
  name?: unknown;
  picture?: unknown;
};

export function toGoogleProfile(input: unknown): GoogleProfile | null {
  if (typeof input !== 'object' || input === null) return null;

  const u = input as PassportGoogleUser;

  // id
  const id = typeof u.id === 'string' ? u.id : null;
  if (!id) return null;

  // email: 優先 emails[0].value，其次 _json.email
  let email = '';
  if (Array.isArray(u.emails) && u.emails.length > 0) {
    const e0 = u.emails[0] as PassportEmail;
    if (typeof e0.value === 'string') email = e0.value;
  }
  if (!email && typeof u._json === 'object' && u._json !== null) {
    const j = u._json as PassportGoogleJson;
    if (typeof j.email === 'string') email = j.email;
  }
  if (!email) return null; // email 是你 DB 唯一鍵，建議必填

  // name: 優先 displayName，其次 _json.name
  let name = '';
  if (typeof u.displayName === 'string') name = u.displayName;
  if (!name && typeof u._json === 'object' && u._json !== null) {
    const j = u._json as PassportGoogleJson;
    if (typeof j.name === 'string') name = j.name;
  }
  if (!name) name = email.split('@')[0] ?? ''; // 最後 fallback

  // picture: 優先 photos[0].value，其次 _json.picture，沒有就空字串
  let picture = '';
  if (Array.isArray(u.photos) && u.photos.length > 0) {
    const p0 = u.photos[0] as PassportPhoto;
    if (typeof p0.value === 'string') picture = p0.value;
  }
  if (!picture && typeof u._json === 'object' && u._json !== null) {
    const j = u._json as PassportGoogleJson;
    if (typeof j.picture === 'string') picture = j.picture;
  }

  return { id, email, name, picture };
}
