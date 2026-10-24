/**
 * Mahsulot sahifasi HTML iga meta teglar va Product JSON-LD yozadi.
 *
 * Ikki joyda ishlatiladi: Cloudflare Pages funksiyasi (functions/product/)
 * va eski Netlify edge funksiyasi (netlify/edge-functions/product-meta.ts).
 * Sayt — SPA, Telegram/Facebook/WhatsApp botlari esa JavaScript ishlatmaydi,
 * shuning uchun meta teglar server tomonda qo'yilishi kerak.
 */
export const SITE = 'https://bazarcom.online';

interface Market {
  source?: string;
  price?: number;
  url?: string;
}

export interface Product {
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

export function injectProductMeta(html: string, product: Product, canonicalPath: string): string {
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

  return html;
}
