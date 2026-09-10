/**
 * /product/:id sahifalari uchun server tomonda meta teglarni joylaydi.
 *
 * Nega kerak: sayt — SPA. Telegram, Facebook, WhatsApp, Twitter va LinkedIn
 * botlari JavaScript ishlatmaydi, shuning uchun React qo'ygan meta teglarni
 * umuman ko'rmaydi — ular faqat index.html dagi umumiy teglarni o'qiydi.
 * Bu funksiya HTML javobni ushlab, mahsulotning haqiqiy nomi, narxi, rasmi va
 * Product JSON-LD sxemasini o'sha HTML ichiga yozib yuboradi.
 *
 * API javob bermasa (Render "cold start") sahifa o'zgarishsiz uzatiladi —
 * foydalanuvchi uchun hech narsa buzilmaydi.
 */
import type { Config, Context } from '@netlify/edge-functions';
// Ilova bilan bir xil slug mantig'i — Deno TS ni to'g'ridan-to'g'ri o'qiydi
import { productPath, productRef } from '../../src/utils/slug.ts';

const SITE = 'https://bazarcom.online';
const API = Deno.env.get('SEO_API_URL') ?? 'https://full-bazar-api.onrender.com';
const FETCH_TIMEOUT_MS = 3_000;

interface Market {
  source?: string;
  price?: number;
  url?: string;
}

interface Product {
  id: string;
  slug?: string | null;
  name?: string;
  title?: string;
  category?: string;
  image?: string;
  price?: number;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  source?: string;
  markets?: Market[];
}

const esc = (s: unknown) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** JSON-LD ichida </script> bilan HTML dan chiqib ketishning oldini oladi */
const escJsonLd = (obj: unknown) =>
  JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

const fmtPrice = (n: number) => new Intl.NumberFormat('ru-RU').format(Math.round(n));

/** <title> va meta/link qiymatlarini almashtiradi */
function replaceTag(html: string, pattern: RegExp, value: string): string {
  return html.replace(pattern, (m) => m.replace(/(content|href)="[^"]*"/i, (a) => {
    const attr = a.slice(0, a.indexOf('='));
    return `${attr}="${esc(value)}"`;
  }));
}

export default async (request: Request, context: Context) => {
  const response = await context.next();

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html')) return response;

  const requestUrl = new URL(request.url);
  const param = requestUrl.pathname.split('/')[2];
  const ref = productRef(param);
  if (!ref) return response;

  let product: Product | null = null;
  try {
    const res = await fetch(`${API}/api/products/${encodeURIComponent(ref)}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { accept: 'application/json' },
    });
    if (res.status === 404) {
      // Mahsulot o'chirilgan — "soft 404" o'rniga haqiqiy 404 qaytaramiz,
      // aks holda Google bo'sh sahifani indeksga qo'shib yuboradi.
      return new Response(await response.text(), {
        status: 404,
        headers: response.headers,
      });
    }
    if (res.ok) product = await res.json();
  } catch {
    // API sekin yoki uxlab qolgan — sahifani o'zgartirmasdan uzatamiz
    return response;
  }
  if (!product?.name) return response;

  // Kanonik yo'l — slug bilan. Eski (/product/prod-xxx) yoki eskirgan slugli
  // manzil bilan kelingan bo'lsa, 301 qaytaramiz: shunda Google eski URL ga
  // to'plangan vaznni yangisiga o'tkazadi.
  const canonicalPath = productPath(product);
  if (requestUrl.pathname !== canonicalPath) {
    return Response.redirect(new URL(canonicalPath + requestUrl.search, requestUrl), 301);
  }

  const name = product.title || product.name;
  const url = SITE + canonicalPath;
  const markets = Array.isArray(product.markets) ? product.markets : [];
  const prices = markets.map((m) => Number(m.price)).filter((p) => Number.isFinite(p) && p > 0);
  const price = Number(product.price) || (prices.length ? Math.min(...prices) : 0);
  const storeCount = markets.length || 1;

  const title = price
    ? `${name} narxi — ${fmtPrice(price)} so'mdan | Bazarcom`
    : `${name} | Bazarcom`;

  const description = price
    ? `${name} — O'zbekistonda eng arzon narxi ${fmtPrice(price)} so'm. ` +
      `${storeCount} ta do'kondagi narxlarni solishtiring, xususiyatlarini ko'ring va narx tushishini kuzating.`
    : `${name} — O'zbekiston do'konlaridagi narxlari, xususiyatlari va taqqoslash. Bazarcom.`;

  const image = product.image && /^https?:\/\//.test(product.image) ? product.image : `${SITE}/og-image.jpg`;

  // ── JSON-LD: Product + BreadcrumbList ────────────────────────────────────
  const offers = prices.length > 1
    ? {
        '@type': 'AggregateOffer',
        url,
        priceCurrency: 'UZS',
        lowPrice: Math.min(...prices),
        highPrice: Math.max(...prices),
        offerCount: prices.length,
        availability: product.inStock === false
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
      }
    : {
        '@type': 'Offer',
        url,
        priceCurrency: 'UZS',
        price: price || undefined,
        itemCondition: 'https://schema.org/NewCondition',
        availability: product.inStock === false
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
      };

  const productLd: Record<string, unknown> = {
    '@type': 'Product',
    name,
    sku: product.id,
    image,
    description,
    brand: { '@type': 'Brand', name: product.category || 'Bazarcom' },
    offers,
  };

  const rating = Number(product.rating);
  const reviews = Number(product.reviews);
  if (rating > 0 && reviews > 0) {
    productLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rating,
      reviewCount: reviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      productLd,
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Bosh sahifa', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Smartfonlar', item: `${SITE}/products` },
          { '@type': 'ListItem', position: 3, name, item: url },
        ],
      },
    ],
  };

  // ── HTML ga yozish ───────────────────────────────────────────────────────
  let html = await response.text();

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(title)}</title>`);
  html = replaceTag(html, /<meta[^>]*name="description"[^>]*>/i, description);
  html = replaceTag(html, /<meta[^>]*property="og:title"[^>]*>/i, title);
  html = replaceTag(html, /<meta[^>]*property="og:description"[^>]*>/i, description);
  html = replaceTag(html, /<meta[^>]*property="og:url"[^>]*>/i, url);
  // property="og:image" dagi yopuvchi qo'shtirnoq og:image:width / og:image:alt
  // teglariga mos kelmaydi, shuning uchun qo'shimcha shart kerak emas.
  html = replaceTag(html, /<meta[^>]*property="og:image"[^>]*>/i, image);
  html = replaceTag(html, /<meta[^>]*property="og:image:alt"[^>]*>/i, name);
  html = replaceTag(html, /<meta[^>]*property="og:type"[^>]*>/i, 'product');
  html = replaceTag(html, /<meta[^>]*name="twitter:title"[^>]*>/i, title);
  html = replaceTag(html, /<meta[^>]*name="twitter:description"[^>]*>/i, description);
  html = replaceTag(html, /<meta[^>]*name="twitter:image"[^>]*>/i, image);
  html = replaceTag(html, /<link[^>]*rel="canonical"[^>]*>/i, url);

  html = html.replace(
    '</head>',
    `  <script type="application/ld+json">${escJsonLd(jsonLd)}</script>\n  </head>`,
  );

  const headers = new Headers(response.headers);
  headers.set('content-type', 'text/html; charset=UTF-8');
  headers.delete('content-length');
  // Botlar va takroriy tashriflar uchun edge'da keshlaymiz
  headers.set('cache-control', 'public, max-age=0, must-revalidate');
  headers.set('netlify-cdn-cache-control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  return new Response(html, { status: response.status, headers });
};

export const config: Config = {
  path: '/product/*',
  cache: 'manual',
};
