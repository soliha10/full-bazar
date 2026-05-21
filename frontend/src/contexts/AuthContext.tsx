import {
  createContext, useContext, useState, useCallback, ReactNode,
} from 'react';

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
  email: string;
  profile: UserProfile;
  token: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthOpen: boolean;
  authMode: 'login' | 'register';
  openLogin: () => void;
  openRegister: () => void;
  closeAuth: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

export interface RegisterData {
  name: string;
  email: string;
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
  id: string; name: string; email: string;
  profile: {
    ageGroup: string; budgetLevel: string;
    preferredBrands: string[]; preferredCategories: string[];
  };
}, token: string): AuthUser {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    token,
    profile: {
      name: apiUser.name,
      email: apiUser.email,
      ageGroup: apiUser.profile.ageGroup as UserProfile['ageGroup'],
      budgetLevel: apiUser.profile.budgetLevel as UserProfile['budgetLevel'],
      preferredBrands: apiUser.profile.preferredBrands,
      preferredCategories: apiUser.profile.preferredCategories,
    },
  };
}

async function apiPost(path: string, body: unknown): Promise<{ token: string; user: any }> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail ?? 'Xatolik yuz berdi');
  return data;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readUser);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const openLogin    = useCallback(() => { setAuthMode('login');    setIsAuthOpen(true);  }, []);
  const openRegister = useCallback(() => { setAuthMode('register'); setIsAuthOpen(true);  }, []);
  const closeAuth    = useCallback(() => setIsAuthOpen(false), []);

  const save = useCallback((u: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiPost('/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });
    save(shapeUser(data.user, data.token));
    setIsAuthOpen(false);
  }, [save]);

  const register = useCallback(async (form: RegisterData) => {
    const data = await apiPost('/auth/register', {
      name:                 form.name.trim(),
      email:                form.email.trim().toLowerCase(),
      password:             form.password,
      age_group:            form.ageGroup,
      budget_level:         form.budgetLevel,
      preferred_brands:     form.preferredBrands,
      preferred_categories: form.preferredCategories,
    });
    save(shapeUser(data.user, data.token));
    setIsAuthOpen(false);
  }, [save]);

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
      user, isAuthOpen, authMode,
      openLogin, openRegister, closeAuth,
      login, register, logout, updateProfile,
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
