import {
  createContext, useContext, useState, useCallback, useEffect, ReactNode,
} from 'react';
import { trackGaEvent } from '../services/tracking';
import { API, apiPost } from './auth/api';
import { STORAGE_KEY, getTokenExpiry, readUser, shapeUser } from './auth/session';
import type {
  AuthContextValue, AuthNotice, AuthUser, Channel, Channels, RegisterData, SendCodeResult, UserProfile,
} from './auth/types';

// Turlar va xato klassi alohida fayllarga ko'chirildi; tashqi importlar
// ('../contexts/AuthContext' dan) o'zgarmasligi uchun shu yerdan qayta eksport.
export { AuthError } from './auth/api';
export type { AuthField } from './auth/api';
export type {
  AuthNotice, AuthUser, Channel, Channels, RegisterData, SendCodeResult, UserProfile,
} from './auth/types';

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
