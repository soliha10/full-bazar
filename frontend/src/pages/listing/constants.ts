import type { ServerSort } from '../../services/api';

export const MARKETS_VISIBLE = 8;

export const SORT_OPTIONS = [
  { key: 'relevance' as const, labelKey: 'relevance' },
  { key: 'priceLow'  as const, labelKey: 'priceAsc'  },
  { key: 'priceHigh' as const, labelKey: 'priceDesc' },
  { key: 'rating'    as const, labelKey: 'rating'    },
];
export type SortKey = 'relevance' | 'priceLow' | 'priceHigh' | 'rating';
export const SERVER_SORT: Record<SortKey, ServerSort> = {
  relevance: 'relevance', priceLow: 'price_asc', priceHigh: 'price_desc', rating: 'rating',
};

export type FilterTab = 'price' | 'brand' | 'store' | 'rating' | 'specs';

export const FILTER_KEY = 'productListingFilters';

/**
 * Saqlangan filtrlarni tiklaydi va ENDI MAVJUD BO'LMAGAN qiymatlarni tashlaydi.
 *
 * Bu shunchaki ehtiyotkorlik emas. Brandstore va OLX do'konlari ro'yxatdan
 * olib tashlandi (biri yopilgan, ikkinchisi 403 beradi). Ularni ilgari tanlab
 * qo'ygan foydalanuvchining sessiyasida kalit qolib ketadi va so'rovga
 * `market=olx` bo'lib ketaveradi — natijada QAYSI brend tanlansa ham katalog
 * bo'sh chiqadi. Eng yomoni, o'sha do'kon endi ro'yxatda ko'rinmaydi, ya'ni
 * foydalanuvchi filtrni ko'rmaydi ham, bekor qila ham olmaydi.
 */
interface SavedFilters {
  selectedMarketplaces: string[];
  minRating?: number;
  selectedBrand?: string | null;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: SortKey;
  viewMode?: 'grid' | 'list';
  selectedRam?: string[];
  selectedStorage?: string[];
  minBattery?: number;
}

export function getSavedFilters(): SavedFilters | null {
  let saved: SavedFilters | null = null;
  try { saved = JSON.parse(sessionStorage.getItem(FILTER_KEY) || 'null'); } catch { return null; }
  if (!saved) return null;

  // Endi mavjud bo'lmagan do'konlar /api/markets kelgach tashlanadi (useListingEffects)
  const markets = Array.isArray(saved.selectedMarketplaces) ? saved.selectedMarketplaces : [];
  return { ...saved, selectedMarketplaces: markets };
}

export function formatPriceInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export const priceNum = (v: string) => {
  const n = parseInt(v.replace(/\s/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/**
 * Teskari oraliq ("dan" > "gacha") qo'llanayotganda qiymatlar o'rni
 * almashtiriladi. Aks holda server bo'sh ro'yxat qaytarar, foydalanuvchi esa
 * nega hech narsa topilmaganini tushunmasdi. Kiritish paytida ogohlantirish
 * ko'rsatiladi (priceRangeSwapped), shuning uchun almashtirish kutilmagan emas.
 */
export const normalizePriceRange = (lo: string, hi: string): [string, string] => {
  const a = priceNum(lo), b = priceNum(hi);
  return a !== undefined && b !== undefined && a > b ? [hi, lo] : [lo, hi];
};
