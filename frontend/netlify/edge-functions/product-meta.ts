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
import { injectProductMeta, type Product } from '../../functions/_lib/product-meta.ts';

const API = Deno.env.get('SEO_API_URL') ?? 'https://full-bazar-api.onrender.com';
const FETCH_TIMEOUT_MS = 3_000;


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

  const html = injectProductMeta(await response.text(), product, canonicalPath);

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
