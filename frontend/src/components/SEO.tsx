import { useEffect } from 'react';

export const SITE_URL = 'https://bazarcom.online';
export const SITE_NAME = 'Bazarcom';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

/** Sahifa tilini OpenGraph locale kodiga o'giradi */
const OG_LOCALE: Record<string, string> = {
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

/** Absolut, so'rov parametrlarisiz kanonik URL quradi */
function buildCanonical(explicit?: string): string {
  if (explicit) return explicit;
  if (typeof window === 'undefined') return SITE_URL + '/';
  // localhost / *.netlify.app kanonikga sizib ketmasligi uchun origin qat'iy
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return SITE_URL + path;
}

/** Nisbiy rasm yo'lini absolutga aylantiradi (og:image absolut bo'lishi shart) */
function absoluteImage(src: string): string {
  if (!src) return DEFAULT_OG_IMAGE;
  if (/^https?:\/\//i.test(src)) return src;
  return SITE_URL + (src.startsWith('/') ? src : `/${src}`);
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

    const setMeta = (name: string, value: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let el = document.head.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
        owned.push(el);
      }
      el.setAttribute('content', value);
    };

    const setLink = (rel: string, href: string, extra?: Record<string, string>) => {
      const selector = extra?.hreflang
        ? `link[rel="${rel}"][hreflang="${extra.hreflang}"]`
        : `link[rel="${rel}"]`;
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        if (extra) for (const [k, v] of Object.entries(extra)) el.setAttribute(k, v);
        document.head.appendChild(el);
        owned.push(el);
      }
      el.setAttribute('href', href);
    };

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
    const graph: Record<string, unknown>[] = [];

    if (breadcrumbs && breadcrumbs.length > 0) {
      graph.push({
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: crumb.name,
          item: crumb.url.startsWith('http') ? crumb.url : SITE_URL + crumb.url,
        })),
      });
    }

    if (productSchema) {
      const offer: Record<string, unknown> =
        productSchema.offerCount && productSchema.offerCount > 1
          ? {
              '@type': 'AggregateOffer',
              url: productSchema.url,
              priceCurrency: productSchema.currency,
              lowPrice: productSchema.lowPrice ?? productSchema.price,
              highPrice: productSchema.highPrice ?? productSchema.price,
              offerCount: productSchema.offerCount,
              availability:
                productSchema.availability === 'InStock'
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
            }
          : {
              '@type': 'Offer',
              url: productSchema.url,
              priceCurrency: productSchema.currency,
              price: productSchema.price,
              itemCondition: 'https://schema.org/NewCondition',
              availability:
                productSchema.availability === 'InStock'
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
            };

      const product: Record<string, unknown> = {
        '@type': 'Product',
        name: productSchema.name,
        image: productSchema.image,
        description: productSchema.description,
        brand: { '@type': 'Brand', name: productSchema.brand || SITE_NAME },
        offers: offer,
      };
      if (productSchema.sku) product.sku = productSchema.sku;
      if (productSchema.ratingValue && productSchema.reviewCount) {
        product.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: productSchema.ratingValue,
          reviewCount: productSchema.reviewCount,
          bestRating: 5,
          worstRating: 1,
        };
      }
      graph.push(product);
    }

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
