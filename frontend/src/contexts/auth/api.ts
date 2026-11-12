import type { AuthErrorCode } from '../../utils/authValidation';

export const API = '/api';

/**
 * Auth so'rovi xatosi. `code` — t.auth.errors dagi kalit, `fields` — qaysi
 * maydon noto'g'ri (server 422 qaytarganda), `retryAfter` — soniyalarda.
 * Ilgari xato matni to'g'ridan-to'g'ri ko'rsatilardi: 422 da u massiv bo'lib
 * "[object Object]" chiqardi, qolganlari esa doim o'zbekcha edi.
 */
export type AuthField = 'name' | 'email' | 'phone' | 'identifier' | 'password' | 'code' | 'target';

export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    public fields: Partial<Record<AuthField, AuthErrorCode>> = {},
    public retryAfter = 0,
    public attemptsLeft = 0,
  ) {
    super(code);
  }
}

export async function apiPost<T = { token: string; user: any }>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthError('network');
  }
  const data = await res.json().catch(() => ({}));
  if (res.ok) return data as T;

  const detail = typeof data?.detail === 'object' && data.detail !== null && !Array.isArray(data.detail)
    ? data.detail : {};
  const retryAfter = Number(detail.retryAfter ?? res.headers.get('Retry-After') ?? 0) || 0;
  if (res.status === 422) throw new AuthError('validation', detail.fields ?? {});
  // Server har xatoga kod beradi (auth_codes_api.py / auth_api.py) — ro'yxatda bo'lsa o'zi
  const known: AuthErrorCode[] = [
    'email_taken', 'phone_taken', 'invalid_credentials', 'too_many_attempts', 'rate_limited',
    'code_invalid', 'code_expired', 'code_attempts_exceeded', 'resend_cooldown', 'too_many_codes',
    'delivery_failed', 'channel_unavailable', 'verification_required',
  ];
  if (known.includes(detail.code)) {
    const fields = detail.field ? { [detail.field]: detail.code } : {};
    throw new AuthError(detail.code, fields, retryAfter, Number(detail.attemptsLeft) || 0);
  }
  if (res.status === 429) throw new AuthError('rate_limited', {}, retryAfter);
  if (res.status === 401) throw new AuthError('invalid_credentials');
  throw new AuthError('server');
}
