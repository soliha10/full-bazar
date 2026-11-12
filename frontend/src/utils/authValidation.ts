/**
 * Ro'yxatdan o'tish / kirish maydonlari tekshiruvi.
 *
 * Qoidalar python/fastapi_app/auth_rules.py bilan AYNAN bir xil: bu yerda
 * foydalanuvchi xatoni darhol ko'radi, server esa o'sha qoidani qayta
 * tekshiradi. Funksiyalar matn emas, xato KODINI qaytaradi — matn
 * t.auth.errors[kod] dan tanlangan tilda olinadi.
 */

export const NAME_MIN = 2;
export const NAME_MAX = 60;
export const EMAIL_MAX = 254;
const EMAIL_LOCAL_MAX = 64;
export const PASSWORD_MIN = 8;
/** bcrypt faqat birinchi 72 baytni hisobga oladi — chegara baytda */
export const PASSWORD_MAX_BYTES = 72;
const LOGIN_PASSWORD_MAX = 128;

export type AuthErrorCode =
  | 'name_required' | 'name_too_short' | 'name_too_long' | 'name_invalid'
  | 'email_required' | 'email_invalid' | 'email_too_long' | 'email_taken'
  | 'password_required' | 'password_too_short' | 'password_too_long'
  | 'password_no_letter' | 'password_no_digit' | 'password_whitespace'
  | 'password_common' | 'password_contains_email' | 'password_contains_name'
  | 'invalid_credentials' | 'too_many_attempts' | 'rate_limited'
  | 'validation' | 'network' | 'server';

const COMMON_PASSWORDS = new Set([
  'password1', 'password123', 'passw0rd', 'qwerty123', 'qwerty1234',
  'abc12345', 'abcd1234', 'a1234567', '1q2w3e4r', '1qaz2wsx',
  'iloveyou1', 'admin123', 'welcome1', 'letmein1', 'parol123',
  'uzbekistan1', 'tashkent1', 'toshkent1', 'bazarcom1', 'samsung123',
  '12345678a', '123456789a', 'qwertyuiop1', 'football1', 'baseball1',
]);

const EMAIL_RE =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
// Harflar orasida: o'zbekcha tutuq belgilari, chiziqcha, nuqta, bo'sh joy
const NAME_RE = /^\p{L}[\p{L}\p{M}'ʻʼ’`. -]*$/u;

export const normalizeName  = (v: string) => v.normalize('NFC').trim().split(/\s+/).filter(Boolean).join(' ');
export const normalizeEmail = (v: string) => v.trim().toLowerCase();
const utf8Bytes = (v: string) => new TextEncoder().encode(v).length;

export function nameError(value: string): AuthErrorCode | null {
  const name = normalizeName(value);
  if (!name) return 'name_required';
  if ([...name].length < NAME_MIN) return 'name_too_short';
  if ([...name].length > NAME_MAX) return 'name_too_long';
  if (!NAME_RE.test(name)) return 'name_invalid';
  return null;
}

export function emailError(value: string): AuthErrorCode | null {
  const email = normalizeEmail(value);
  if (!email) return 'email_required';
  if (email.length > EMAIL_MAX) return 'email_too_long';
  const local = email.split('@')[0];
  if (
    !EMAIL_RE.test(email) || local.length > EMAIL_LOCAL_MAX
    || local.startsWith('.') || local.endsWith('.') || email.includes('..')
  ) return 'email_invalid';
  return null;
}

export function newPasswordError(password: string, email = '', name = ''): AuthErrorCode | null {
  if (!password) return 'password_required';
  if ([...password].length < PASSWORD_MIN) return 'password_too_short';
  if (utf8Bytes(password) > PASSWORD_MAX_BYTES) return 'password_too_long';
  if (!/\p{L}/u.test(password)) return 'password_no_letter';
  if (!/\p{Nd}/u.test(password)) return 'password_no_digit';
  if (password !== password.trim()) return 'password_whitespace';
  const lowered = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lowered) || new Set(lowered).size <= 2) return 'password_common';
  const mail = normalizeEmail(email);
  const local = mail.split('@')[0];
  if (lowered === mail || (local.length >= 4 && lowered.includes(local))) return 'password_contains_email';
  const compactName = normalizeName(name).toLowerCase().replace(/ /g, '');
  if (compactName.length >= 4 && lowered.replace(/ /g, '').includes(compactName)) return 'password_contains_name';
  return null;
}

export function loginPasswordError(password: string): AuthErrorCode | null {
  if (!password) return 'password_required';
  if (password.length > LOGIN_PASSWORD_MAX) return 'password_too_long';
  return null;
}

/** Parol talablari ro'yxati (ro'yxatdan o'tishda jonli belgilanadi) */
export function passwordChecks(password: string) {
  return {
    length: [...password].length >= PASSWORD_MIN && utf8Bytes(password) <= PASSWORD_MAX_BYTES,
    letter: /\p{L}/u.test(password),
    digit:  /\p{Nd}/u.test(password),
  };
}

/** 0–4: kuchlilik ko'rsatkichi uchun (qoidalardan alohida, faqat maslahat) */
export function passwordScore(password: string): number {
  if (!password) return 0;
  let score = 0;
  const len = [...password].length;
  if (len >= PASSWORD_MIN) score++;
  if (len >= 12) score++;
  if (/\p{Lu}/u.test(password) && /\p{Ll}/u.test(password)) score++;
  if (/[^\p{L}\p{Nd}]/u.test(password)) score++;
  if (newPasswordError(password)) score = Math.min(score, 1);
  return score;
}

// Ko'p uchraydigan email domenlari va ularning xato yozilishlari.
const DOMAIN_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmal.com': 'gmail.com',
  'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.ru': 'gmail.com',
  'gmaill.com': 'gmail.com', 'gnail.com': 'gmail.com', 'g.mail.com': 'gmail.com',
  'mail.r': 'mail.ru', 'mial.ru': 'mail.ru', 'mail.ri': 'mail.ru',
  'yandex.r': 'yandex.ru', 'yandx.ru': 'yandex.ru', 'yadex.ru': 'yandex.ru',
  'yahoo.co': 'yahoo.com', 'yaho.com': 'yahoo.com',
  'outlok.com': 'outlook.com', 'hotmal.com': 'hotmail.com', 'iclod.com': 'icloud.com',
};

/** "ali@gmial.com" -> "ali@gmail.com" (taklif; o'zi almashtirmaydi) */
export function suggestEmail(value: string): string | null {
  const email = normalizeEmail(value);
  const at = email.lastIndexOf('@');
  if (at < 1) return null;
  const fix = DOMAIN_TYPOS[email.slice(at + 1)];
  return fix ? `${email.slice(0, at + 1)}${fix}` : null;
}
