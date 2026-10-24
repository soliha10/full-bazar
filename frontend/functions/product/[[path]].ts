/**
 * /product/:slug — mahsulot nomi, narxi, rasmi va JSON-LD ni HTML ga yozadi
 * (botlar JavaScript ishlatmaydi). API kechiksa sahifa o'zgarishsiz beriladi,
 * mahsulot so'rovi esa fonda tugab keshga tushadi — keyingi safar tayyor.
 */
import { productPath, productRef } from '../../src/utils/slug';
import { injectProductMeta, type Product } from '../_lib/product-meta';
import { API_ORIGIN, proxyCached, type FnContext } from '../_lib/edge-cache';

const META_BUDGET_MS = 3_000;

interface Ctx extends FnContext {
  next(): Promise<Response>;
}

export const onRequest = async (ctx: Ctx) => {
  const response = await ctx.next();
  if (!(response.headers.get('content-type') ?? '').includes('text/html')) return response;

  const requestUrl = new URL(ctx.request.url);
  const ref = productRef(requestUrl.pathname.split('/')[2]);
  if (!ref) return response;

  // /api/products/{ref} bilan bir xil kesh kaliti — brauzer so'rovi ham,
  // bu funksiya ham bitta yozuvdan foydalanadi.
  const apiPath = `/api/products/${encodeURIComponent(ref)}`;
  const apiRequest = new Request(new URL(apiPath, requestUrl).toString(), {
    headers: { accept: 'application/json' },
  });
  const pending = proxyCached(ctx, apiRequest, API_ORIGIN + apiPath);
  ctx.waitUntil(pending.catch(() => {}));
  const res = await Promise.race([
    pending,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), META_BUDGET_MS)),
  ]);
  if (!res) return response;

  if (res.status === 404) {
    // Mahsulot o'chirilgan — "soft 404" o'rniga haqiqiy 404, aks holda Google
    // bo'sh sahifani indeksga qo'shib yuboradi.
    return new Response(response.body, { status: 404, headers: response.headers });
  }
  if (!res.ok) return response;

  let product: Product | null = null;
  try {
    product = await res.json();
  } catch {
    return response;
  }
  if (!product?.name) return response;

  // Eski (/product/prod-xxx) yoki eskirgan slugli manzil → kanonik, 301
  const canonicalPath = productPath(product);
  if (requestUrl.pathname !== canonicalPath) {
    return Response.redirect(new URL(canonicalPath + requestUrl.search, requestUrl).toString(), 301);
  }

  const headers = new Headers(response.headers);
  headers.set('content-type', 'text/html; charset=UTF-8');
  headers.delete('content-length');
  headers.set('cache-control', 'public, max-age=0, must-revalidate');
  return new Response(injectProductMeta(await response.text(), product, canonicalPath), {
    status: 200,
    headers,
  });
};
