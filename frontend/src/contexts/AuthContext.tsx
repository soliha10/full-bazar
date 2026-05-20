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
  updateProfile: (profile: Partial<UserProfile>) => void;
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

const KEY = 'bazar_user';

function readUser(): AuthUser | null {
  try { return JSON.parse(localStorage.getItem(KEY) ?? 'null'); } catch { return null; }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readUser);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const openLogin    = useCallback(() => { setAuthMode('login');    setIsAuthOpen(true);  }, []);
  const openRegister = useCallback(() => { setAuthMode('register'); setIsAuthOpen(true);  }, []);
  const closeAuth    = useCallback(() => setIsAuthOpen(false), []);

  const save = (u: AuthUser) => {
    localStorage.setItem(KEY, JSON.stringify(u));
    setUser(u);
  };

  // In a real app these would hit /api/auth/login and /api/auth/register.
  // For now they simulate a successful response so the UI is fully functional.
  const login = useCallback(async (email: string, _password: string) => {
    const existing = readUser();
    if (existing && existing.email === email) {
      save(existing);
      setIsAuthOpen(false);
      return;
    }
    const u: AuthUser = {
      id: crypto.randomUUID(),
      name: email.split('@')[0],
      email,
      token: crypto.randomUUID(),
      profile: {
        name: email.split('@')[0],
        email,
        ageGroup: '25-34',
        budgetLevel: 'mid',
        preferredBrands: [],
        preferredCategories: [],
      },
    };
    save(u);
    setIsAuthOpen(false);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const u: AuthUser = {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      token: crypto.randomUUID(),
      profile: {
        name: data.name,
        email: data.email,
        ageGroup: data.ageGroup,
        budgetLevel: data.budgetLevel,
        preferredBrands: data.preferredBrands,
        preferredCategories: data.preferredCategories,
      },
    };
    save(u);
    setIsAuthOpen(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(KEY);
    setUser(null);
  }, []);

  const updateProfile = useCallback((partial: Partial<UserProfile>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, profile: { ...prev.profile, ...partial } };
      localStorage.setItem(KEY, JSON.stringify(updated));
      return updated;
    });
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
