import { useEffect, useState } from 'react';

/**
 * Brend ro'yxati — YAGONA manba.
 *
 * Ilgari u to'rt joyda qo'lda yozilgan edi (katalog filtri, ro'yxatdan o'tish
 * oynasi, tavsiyalar mexanizmi) va ro'yxatlar bir-biriga mos kelmasdi: filtrda
 * Poco bor, ro'yxatdan o'tishda yo'q; tavsiyalarda Huawei umuman hisobga
 * olinmasdi. Endi ro'yxat `/api/brands` dan keladi — ya'ni bazada haqiqatda
 * mahsuloti bor brendlar, soni bilan.
 *
 * ZAXIRA RO'YXAT muhim: API eski versiyada bo'lsa (`/api/brands` hali deploy
 * qilinmagan), tarmoq uzilsa yoki javob bo'sh kelsa, filtr BO'SH qolib
 * ketmasligi kerak. Shunday hollarda quyidagi ro'yxat ishlatiladi — u
 * bazadagi haqiqiy brendlar bo'yicha tuzilgan.
 */

export interface BrandFacet {
  /** Filtrga yuboriladigan kalit, kichik harfda: "poco" */
  key: string;
  /** Ekranda ko'rinadigan nom: "Poco" */
  name: string;
  /** Bazadagi mahsulotlar soni. Zaxira ro'yxatda 0 — son ko'rsatilmaydi. */
  count: number;
}

const FALLBACK: BrandFacet[] = [
  ['samsung', 'Samsung'], ['apple', 'Apple'], ['honor', 'Honor'],
  ['redmi', 'Redmi'], ['xiaomi', 'Xiaomi'], ['poco', 'Poco'],
  ['infinix', 'Infinix'], ['vivo', 'Vivo'], ['tecno', 'Tecno'],
  ['oppo', 'Oppo'], ['huawei', 'Huawei'], ['realme', 'Realme'],
  ['google', 'Google'], ['motorola', 'Motorola'], ['nokia', 'Nokia'],
  ['zte', 'ZTE'], ['itel', 'Itel'],
].map(([key, name]) => ({ key, name, count: 0 }));

/** Brend rangi — nuqtachalar uchun. Ro'yxatda yo'q brend kulrang bo'ladi. */
export const BRAND_COLORS: Record<string, string> = {
  apple:    '#555',
  samsung:  '#1428A0',
  redmi:    '#FF6900',
  xiaomi:   '#F97316',
  poco:     '#FFCD00',
  honor:    '#CF0A2C',
  huawei:   '#C8102E',
  vivo:     '#415FFF',
  oppo:     '#1D8348',
  realme:   '#E8B800',
  tecno:    '#00AEEF',
  infinix:  '#E63946',
  itel:     '#0EA5E9',
  zte:      '#0057B8',
  nokia:    '#124191',
  motorola: '#5C92FA',
  google:   '#34A853',
};

// Modul darajasidagi kesh: hook bir nechta komponentda ishlatiladi
// (katalog filtri + ro'yxatdan o'tish oynasi), so'rov esa bitta ketishi kerak.
let cache: BrandFacet[] | null = null;
let inflight: Promise<BrandFacet[]> | null = null;

function load(): Promise<BrandFacet[]> {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;

  inflight = fetch('/api/brands')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((d: { brands?: BrandFacet[] }) => {
      const list = d.brands ?? [];
      // Bo'sh javob ham nosozlik: zaxira ro'yxat bilan davom etamiz.
      cache = list.length > 0 ? list : FALLBACK;
      return cache;
    })
    .catch(() => {
      // Keshlamaymiz — keyingi urinishda API tiklangan bo'lishi mumkin.
      inflight = null;
      return FALLBACK;
    });

  return inflight;
}

/** Brendlar ro'yxati. Yuklanguncha ham bo'sh emas — zaxira ro'yxat qaytadi. */
export function useBrands(): BrandFacet[] {
  const [brands, setBrands] = useState<BrandFacet[]>(cache ?? FALLBACK);

  useEffect(() => {
    let cancelled = false;
    load().then((list) => { if (!cancelled) setBrands(list); });
    return () => { cancelled = true; };
  }, []);

  return brands;
}

/**
 * Sarlavhadan brend kalitini ajratadi ("Смартфон POCO C71" -> "poco").
 *
 * Tartib muhim: sub-brend oldinroq turadi, chunki "Xiaomi Redmi Note 15"
 * nomida ikkala so'z ham bor va aniqrog'i yutishi kerak. Bu ro'yxat
 * backenddagi `python/fastapi_app/brands.py` bilan bir xil mantiqda.
 */
const BRAND_MATCHERS: [string, string[]][] = [
  ['apple', ['iphone', 'apple']],
  ['samsung', ['samsung', 'galaxy']],
  ['redmi', ['redmi']],
  ['poco', ['poco']],
  ['xiaomi', ['xiaomi']],
  ['honor', ['honor']],
  ['huawei', ['huawei']],
  ['vivo', ['vivo']],
  ['oppo', ['oppo']],
  ['realme', ['realme']],
  ['tecno', ['tecno', 'camon', 'spark', 'pova']],
  ['infinix', ['infinix']],
  ['itel', ['itel']],
  ['zte', ['zte', 'nubia']],
  ['nokia', ['nokia']],
  ['motorola', ['motorola', 'moto ']],
  ['google', ['pixel']],
];

export function brandKeyOf(text: string): string | null {
  const haystack = ` ${(text || '').toLowerCase()} `;
  for (const [key, words] of BRAND_MATCHERS) {
    if (words.some((w) => haystack.includes(w))) return key;
  }
  return null;
}

/**
 * Saqlangan qiymatni ekranga chiqaradigan nomga aylantiradi.
 *
 * Profil `preferred_brands` da endi kalit saqlanadi ("poco"), lekin eski
 * foydalanuvchilarda ko'rinadigan nom yozilgan ("Apple"). Ikkalasi ham
 * to'g'ri ko'rinishi kerak, shuning uchun kalit topilmasa qiymatning o'zi
 * qaytariladi.
 */
export function brandLabel(value: string): string {
  const key = (value || '').trim().toLowerCase();
  if (!key) return value;
  const found = (cache ?? []).concat(FALLBACK).find((b) => b.key === key);
  return found ? found.name : value;
}
