import type { RegisterData } from '../../contexts/AuthContext';
import type { AuthErrorCode } from '../../utils/authValidation';

// Qiymatlar profilga shu ko'rinishda saqlanadi — ekranda esa tarjimasi chiqadi.
export const CATEGORIES = ['Telefonlar', 'Noutbuklar', 'Planshetlar', 'Aksessuarlar', 'Audio', 'TV'] as const;

export const AGE_GROUPS: { value: RegisterData['ageGroup']; label: string }[] = [
  { value: '18-24', label: '18–24' },
  { value: '25-34', label: '25–34' },
  { value: '35-44', label: '35–44' },
  { value: '45+',   label: '45+' },
];

export const BUDGET_LEVELS: { value: RegisterData['budgetLevel']; desc: string }[] = [
  { value: 'budget',  desc: '< 3 mln' },
  { value: 'mid',     desc: '3–8 mln' },
  { value: 'premium', desc: '> 8 mln' },
];

// verify — kod bosqichi; faqat tanlangan kanal serverda yoqilgan bo'lsa
export type Step = 'credentials' | 'verify' | 'profile';
export type FieldName = 'name' | 'email' | 'phone' | 'password' | 'code';
export type FieldErrors = Partial<Record<FieldName, AuthErrorCode>>;

export const FIELD_ORDER: FieldName[] = ['name', 'email', 'phone', 'password', 'code'];
export const CODE_LENGTH = 6;

export const STRENGTH_BAR = ['bg-gray-200 dark:bg-gray-700', 'bg-red-400', 'bg-yellow-400', 'bg-lime-500', 'bg-green-500'];
