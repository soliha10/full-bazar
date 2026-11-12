import type { Language } from '../../locales/translations';

// Profil sahifasidagi til tugmalari (kirgan va kirmagan holatda bir xil)
export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'uz', label: "O'z", flag: '🇺🇿' },
  { code: 'ru', label: 'Рус', flag: '🇷🇺' },
  { code: 'en', label: 'En',  flag: '🇬🇧' },
];
