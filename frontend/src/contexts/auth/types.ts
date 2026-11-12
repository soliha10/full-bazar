// Auth turlari — AuthContext.tsx shularni qayta eksport qiladi, shuning
// uchun boshqa fayllar avvalgidek '../contexts/AuthContext' dan import qiladi.

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

export interface AuthContextValue {
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

