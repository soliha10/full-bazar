import {
  createContext, useContext, useState, useCallback, useEffect, ReactNode,
} from 'react';
import { trackGaEvent } from '../services/tracking';
import type { AuthErrorCode } from '../utils/authValidation';

export interface UserProfile {
  name: string;
  email: string;
  ageGroup: '18-24' | '25-34' | '35-44' | '45+';
  budgetLevel: 'budget' | 'mid' | 'premium';
  preferredBrands: string[];
  preferredCategories: string[];
}

export interface AuthUser {
  id: string;
  name: string;
  /** Telefon bilan ro'yxatdan o'tganlarda bo'sh */
  email: string;
  phone: string;
  profile: UserProfile;
  token: string;
}

/** Modal ochilganda tepada ko'rsatiladigan xabar (masalan, sessiya tugadi) */
export type AuthNotice = 'session_expired' | null;

interface AuthContextValue {
  user: AuthUser | null;
  isAuthOpen: boolean;
  authMode: 'login' | 'register';
  notice: AuthNotice;
  openLogin: () => void;
  openRegister: () => void;
  closeAuth: () => void;
  /** Qaysi kanal orqali kod yuboriladi (server .env dagi kalitlarga qarab) */
  channels: Channels;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  checkEmailAvailable: (email: string) => Promise<boolean>;
  sendCode: (channel: Channel, target: string, lang: string) => Promise<SendCodeResult>;
  verifyCode: (channel: Channel, target: string, code: string) => Promise<string>;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

export type Channel = 'email' | 'phone';
export interface Channels { email: boolean; phone: boolean }
export interface SendCodeResult { maskedTarget: string; expiresIn: number; resendIn: number }

export interface RegisterData {
  name: string;
  /** Email yoki telefondan bittasi */
  email?: string;
  phone?: string;
  /** /api/auth/verify-code dan; kanal yoqilmagan bo'lsa yo'q */
  verificationToken?: string;
  password: string;
  ageGroup: UserProfile['ageGroup'];
  budgetLevel: UserProfile['budgetLevel'];
  preferredBrands: string[];
  preferredCategories: string[];
}

const STORAGE_KEY = 'bazar_user';
const API = '/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getTokenExpiry(token: string | undefined): number {
  if (!token) return 0;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return (payload.exp ?? 0) * 1000;
  } catch {
    return 0;
  }
}

function readUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as AuthUser;
    // Auto-clear expired token so user is shown as logged out on next visit
    if (getTokenExpiry(u.token) < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return u;
  } catch {
    return null;
  }
}

function shapeUser(apiUser: {
  id: string; name: string; email: string | null; phone?: string | null;
  profile: {
    ageGroup: string; budgetLevel: string;
    preferredBrands: string[]; preferredCategories: string[];
  };
}, token: string): AuthUser {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email ?? '',
    phone: apiUser.phone ?? '',
    token,
    profile: {
      name: apiUser.name,
      email: apiUser.email ?? '',
      ageGroup: apiUser.profile.ageGroup as UserProfile['ageGroup'],
      budgetLevel: apiUser.profile.budgetLevel as UserProfile['budgetLevel'],
      preferredBrands: apiUser.profile.preferredBrands,
      preferredCategories: apiUser.profile.preferredCategories,
    },
  };
}

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

async function apiPost<T = { token: string; user: any }>(path: string, body: unknown): Promise<T> {
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
  // Server har xatoga kod beradi (otp.py / main.py) — ro'yxatda bo'lsa o'zi
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

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readUser);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [notice, setNotice] = useState<AuthNotice>(null);
  const [channels, setChannels] = useState<Channels>({ email: false, phone: false });

  useEffect(() => {
    fetch(`${API}/auth/channels`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) setChannels({ email: Boolean(d.email), phone: Boolean(d.phone) }); })
      .catch(() => undefined);
  }, []);

  const openLogin    = useCallback(() => { setAuthMode('login');    setIsAuthOpen(true);  }, []);
  const openRegister = useCallback(() => { setAuthMode('register'); setIsAuthOpen(true);  }, []);
  const closeAuth    = useCallback(() => { setIsAuthOpen(false); setNotice(null); }, []);

  // Token muddati sahifa ochiq turganda tugasa ham foydalanuvchi chiqariladi
  // va kirish oynasi sababi bilan ochiladi. Ilgari muddat faqat sahifa qayta
  // yuklanganda tekshirilardi — oraliqda so'rovlar jimgina 401 qaytarardi.
  const expireSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    setNotice('session_expired');
    setAuthMode('login');
    setIsAuthOpen(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    const ms = getTokenExpiry(user.token) - Date.now();
    if (ms <= 0) { expireSession(); return; }
    // setTimeout 2^31 ms dan (~24.8 kun) katta qiymatni darhol bajaradi
    const id = setTimeout(expireSession, Math.min(ms, 2 ** 31 - 1));
    return () => clearTimeout(id);
  }, [user, expireSession]);

  // Saqlangan token hali haqiqiymi (foydalanuvchi o'chirilgan, kalit
  // almashgan bo'lishi mumkin) — bir marta, sahifa ochilganda tekshiriladi.
  useEffect(() => {
    const token = readUser()?.token;
    if (!token) return;
    fetch(`${API}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { if (res.status === 401 || res.status === 404) expireSession(); })
      .catch(() => undefined);
  }, [expireSession]);

  const save = useCallback((u: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const data = await apiPost('/auth/login', { identifier: identifier.trim(), password });
    save(shapeUser(data.user, data.token));
    setIsAuthOpen(false);
    setNotice(null);
    trackGaEvent('login', { method: 'email' });
  }, [save]);

  const register = useCallback(async (form: RegisterData) => {
    const data = await apiPost('/auth/register', {
      name:                 form.name.trim(),
      email:                form.email?.trim().toLowerCase() || undefined,
      phone:                form.phone || undefined,
      verification_token:   form.verificationToken,
      password:             form.password,
      age_group:            form.ageGroup,
      budget_level:         form.budgetLevel,
      preferred_brands:     form.preferredBrands,
      preferred_categories: form.preferredCategories,
    });
    save(shapeUser(data.user, data.token));
    setIsAuthOpen(false);
    setNotice(null);
    trackGaEvent('sign_up', { method: 'email' });
  }, [save]);

  const checkEmailAvailable = useCallback(async (email: string) => {
    const data = await apiPost<{ available: boolean }>('/auth/check-email', {
      email: email.trim().toLowerCase(),
    });
    return data.available;
  }, []);

  const sendCode = useCallback(async (channel: Channel, target: string, lang: string) => {
    return apiPost<SendCodeResult>('/auth/send-code', { channel, target, lang });
  }, []);

  const verifyCode = useCallback(async (channel: Channel, target: string, code: string) => {
    const data = await apiPost<{ verificationToken: string }>('/auth/verify-code', { channel, target, code });
    return data.verificationToken;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (partial: Partial<UserProfile>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated: AuthUser = {
        ...prev,
        profile: { ...prev.profile, ...partial },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    // Sync to backend (best-effort — don't block the UI on failure)
    const current = readUser();
    if (!current?.token) return;
    const profile = { ...current.profile, ...partial };
    fetch(`${API}/users/me/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${current.token}`,
      },
      body: JSON.stringify({
        age_group:            profile.ageGroup,
        budget_level:         profile.budgetLevel,
        preferred_brands:     profile.preferredBrands,
        preferred_categories: profile.preferredCategories,
      }),
    }).catch(() => undefined);
  }, []);

  return (
    <AuthContext.Provider value={{
      user, isAuthOpen, authMode, notice, channels,
      openLogin, openRegister, closeAuth,
      login, register, checkEmailAvailable, sendCode, verifyCode, logout, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
