import { useEffect } from 'react';
import {
  SITE_NAME, DEFAULT_OG_IMAGE, OG_LOCALE, buildCanonical, absoluteImage,
  type Breadcrumb, type ProductSchema,
} from './seo/config';
import { makeHeadWriters } from './seo/headTags';
import { buildGraph } from './seo/jsonLd';

// Sahifalar SITE_URL va turlarni shu fayldan import qiladi — qayta eksport
export { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE } from './seo/config';
export type { Breadcrumb, ProductSchema } from './seo/config';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  canonicalUrl?: string;
  ogType?: 'website' | 'article' | 'product';
  ogImage?: string;
  /** Shaxsiy/takroriy sahifalar uchun — indeksdan chiqaradi */
  noindex?: boolean;
  /** 'uz' | 'ru' | 'en' — <html lang> va og:locale ni yangilaydi */
  locale?: string;
  breadcrumbs?: Breadcrumb[];
  productSchema?: ProductSchema;
}

export function SEO({
  title,
  description,
  keywords,
  canonicalUrl,
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  noindex = false,
  locale = 'uz',
  breadcrumbs,
  productSchema,
}: SEOProps) {
  // Obyekt proplar har renderda yangi havola bo'ladi — effekt cheksiz qayta
  // ishga tushmasligi uchun ularni barqaror satrga aylantiramiz.
  const breadcrumbsKey = breadcrumbs ? JSON.stringify(breadcrumbs) : '';
  const productKey = productSchema ? JSON.stringify(productSchema) : '';

  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    // Bu komponent yaratgan teglarni belgilab boramiz — unmount'da tozalash uchun
    const owned: Element[] = [];

    const { setMeta, setLink } = makeHeadWriters(owned);

    const canonical = buildCanonical(canonicalUrl);
    const image = absoluteImage(ogImage);

    // ── Standart meta ──────────────────────────────────────────────────────
    setMeta('description', description);
    if (keywords) setMeta('keywords', keywords);
    setMeta(
      'robots',
      noindex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    );

    // <html lang> — til almashganda yangilanishi kerak
    document.documentElement.lang = locale;

    // ── OpenGraph ──────────────────────────────────────────────────────────
    setMeta('og:title', fullTitle, true);
    setMeta('og:description', description, true);
    setMeta('og:image', image, true);
    setMeta('og:image:width', '1200', true);
    setMeta('og:image:height', '630', true);
    setMeta('og:image:alt', fullTitle, true);
    setMeta('og:type', ogType, true);
    setMeta('og:url', canonical, true);
    setMeta('og:site_name', SITE_NAME, true);
    setMeta('og:locale', OG_LOCALE[locale] ?? OG_LOCALE.uz, true);

    // og:locale:alternate bir nechta bo'ladi — setMeta har doim birinchisini
    // topgani uchun bu yerda hammasini olib tashlab, qaytadan qo'shamiz.
    document.head
      .querySelectorAll('meta[property="og:locale:alternate"]')
      .forEach((el) => el.remove());
    for (const [code, ogLocale] of Object.entries(OG_LOCALE)) {
      if (code === locale) continue;
      const el = document.createElement('meta');
      el.setAttribute('property', 'og:locale:alternate');
      el.setAttribute('content', ogLocale);
      document.head.appendChild(el);
      owned.push(el);
    }

    // ── Twitter ────────────────────────────────────────────────────────────
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);
    setMeta('twitter:image:alt', fullTitle);

    // ── Kanonik ────────────────────────────────────────────────────────────
    setLink('canonical', canonical);

    // ── JSON-LD ────────────────────────────────────────────────────────────
    // Server (pages.py) birinchi yuklanishda o'zinikini yozadi — JS ishlatmaydigan
    // botlar uchun. Keyin uni shu yerdagi to'liq nusxa almashtiradi: aks holda
    // sahifada ikkita Product bo'lardi, SPA ichida o'tilganda esa eski sahifaniki qolardi.
    document.getElementById('ld-json-server')?.remove();
    const graph = buildGraph(breadcrumbs, productSchema);

    let ldScript: HTMLScriptElement | null = null;
    if (graph.length > 0) {
      ldScript = document.createElement('script');
      ldScript.id = 'ld-json-page';
      ldScript.type = 'application/ld+json';
      ldScript.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
      // Oldingi sahifadan qolgani bo'lsa olib tashlaymiz
      document.getElementById('ld-json-page')?.remove();
      document.head.appendChild(ldScript);
    } else {
      document.getElementById('ld-json-page')?.remove();
    }

    return () => {
      ldScript?.remove();
      // Faqat shu komponent qo'shgan teglarni olib tashlaymiz; index.html dagi
      // bazaviy teglarga tegilmaydi (ular keyingi sahifada qayta yoziladi).
      for (const el of owned) el.remove();
    };
  }, [
    title,
    description,
    keywords,
    canonicalUrl,
    ogType,
    ogImage,
    noindex,
    locale,
    breadcrumbsKey,
    productKey,
  ]);

  return null;
}
