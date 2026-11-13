export const SITE_URL = 'https://bazarcom.online';
export const SITE_NAME = 'Bazarcom';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

/** Sahifa tilini OpenGraph locale kodiga o'giradi */
export const OG_LOCALE: Record<string, string> = {
  uz: 'uz_UZ',
  ru: 'ru_RU',
  en: 'en_US',
};

export interface Breadcrumb {
  name: string;
  url: string;
}

export interface ProductSchema {
  name: string;
  image: string;
  /** Galereya — birinchisi image bilan bir xil bo'lishi mumkin */
  images?: string[];
  /** Har do'kon — alohida taklif (sotuvchi nomi bilan) */
  sellers?: { name: string; price: number; url?: string }[];
  description: string;
  price: number;
  currency: string;
  availability: string;
  url: string;
  ratingValue?: number;
  reviewCount?: number;
  brand?: string;
  sku?: string;
  offerCount?: number;
  lowPrice?: number;
  highPrice?: number;
}

/** Absolut, so'rov parametrlarisiz kanonik URL quradi */
export function buildCanonical(explicit?: string): string {
  if (explicit) return explicit;
  if (typeof window === 'undefined') return SITE_URL + '/';
  // localhost / *.netlify.app kanonikga sizib ketmasligi uchun origin qat'iy
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return SITE_URL + path;
}

/** Nisbiy rasm yo'lini absolutga aylantiradi (og:image absolut bo'lishi shart) */
export function absoluteImage(src: string): string {
  if (!src) return DEFAULT_OG_IMAGE;
  if (/^https?:\/\//i.test(src)) return src;
  return SITE_URL + (src.startsWith('/') ? src : `/${src}`);
}
