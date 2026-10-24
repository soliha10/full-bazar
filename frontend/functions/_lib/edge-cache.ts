/**
 * Render'dagi API ga proksi + Cloudflare chekkasida keshlash.
 *
 * Netlify'da bu ishni `_redirects` dagi proksi va API qo'ygan
 * `Netlify-CDN-Cache-Control` sarlavhasi qilardi. Cloudflare Pages tashqi
 * manzilga proksi qila olmaydi, shuning uchun funksiya orqali: API o'sha
 * sarlavhani hali ham yuboradi (python/fastapi_app/main.py: _cdn_header),
 * bu yerda undan s-maxage va stale-while-revalidate o'qiladi.
 *
 * Nega muhim: Render bepul tarifi uxlaydi, Supabase ham sekin. Kesh eskirgan
 * bo'lsa ham darhol beriladi va fonda yangilanadi — foydalanuvchi uyg'onishni
 * kutmaydi, API ga esa har bir sahifa ochilishi emas, 5 daqiqada bir so'rov
 * boradi.
 */

export const API_ORIGIN = 'https://full-bazar-api.onrender.com';

// Pages Functions kontekstining bizga kerakli qismi
export interface FnContext {
  request: Request;
  waitUntil(promise: Promise<unknown>): void;
}

// Workers runtime'dagi caches.default — DOM tiplarida yo'q
const edgeCache = () => (caches as unknown as { default: Cache }).default;

const STORED_AT = 'x-edge-stored-at';
const FRESH_FOR = 'x-edge-fresh-for';
const ORIG_CACHE_CONTROL = 'x-edge-orig-cache-control';

/** "public, durable, s-maxage=300, stale-while-revalidate=604800" → soniyalar */
function parsePolicy(header: string | null): { fresh: number; stale: number } | null {
  if (!header) return null;
  const fresh = /s-maxage=(\d+)/.exec(header);
  if (!fresh) return null;
  const stale = /stale-while-revalidate=(\d+)/.exec(header);
  return { fresh: Number(fresh[1]), stale: stale ? Number(stale[1]) : 0 };
}

function upstreamRequest(request: Request, url: string): Request {
  const req = new Request(url, request);
  const headers = new Headers(req.headers);
  // API rate limiter uchun haqiqiy mijoz IP si (main.py: _client_ip)
  const ip = request.headers.get('cf-connecting-ip');
  if (ip) headers.set('x-bazar-client-ip', ip);
  return new Request(req, { headers, redirect: 'manual' });
}

/** API javobini keshga yozadi; keshlanmaydigan bo'lsa hech narsa qilmaydi */
async function store(key: Request, res: Response): Promise<void> {
  if (res.status !== 200) return;
  const policy = parsePolicy(res.headers.get('netlify-cdn-cache-control'));
  if (!policy) return;
  const headers = new Headers(res.headers);
  headers.set(ORIG_CACHE_CONTROL, res.headers.get('cache-control') ?? '');
  headers.set('cache-control', `public, max-age=${policy.fresh + policy.stale}`);
  headers.set(STORED_AT, String(Date.now()));
  headers.set(FRESH_FOR, String(policy.fresh));
  headers.delete('set-cookie');
  await edgeCache().put(key, new Response(res.body, { status: 200, headers }));
}

/** Keshdagi nusxani mijozga beriladigan ko'rinishga qaytaradi */
function fromCache(hit: Response, state: 'HIT' | 'STALE'): Response {
  const headers = new Headers(hit.headers);
  const orig = headers.get(ORIG_CACHE_CONTROL);
  if (orig) headers.set('cache-control', orig);
  else headers.delete('cache-control');
  for (const h of [ORIG_CACHE_CONTROL, STORED_AT, FRESH_FOR]) headers.delete(h);
  headers.set('x-edge-cache', state);
  return new Response(hit.body, { status: hit.status, headers });
}

async function fetchAndStore(ctx: FnContext, key: Request | null, upstream: Request,
                             timeoutMs: number): Promise<Response> {
  const res = await fetch(upstream, { signal: AbortSignal.timeout(timeoutMs) });
  if (key && res.status === 200) {
    ctx.waitUntil(store(key, res.clone()).catch(() => {}));
  }
  return res;
}

/**
 * So'rovni `upstreamUrl` ga uzatadi. GET va avtorizatsiyasiz so'rovlar API
 * ruxsat bergan muddatga keshlanadi. API javob bermasa — 503 + Retry-After
 * (frontend qayta urinadi), osilib turmaydi.
 */
export async function proxyCached(ctx: FnContext, request: Request, upstreamUrl: string,
                                  timeoutMs = 30_000): Promise<Response> {
  const cacheable = request.method === 'GET' && !request.headers.has('authorization');
  const key = cacheable ? new Request(request.url, { method: 'GET' }) : null;

  if (key) {
    const hit = await edgeCache().match(key);
    if (hit) {
      const age = (Date.now() - Number(hit.headers.get(STORED_AT) ?? 0)) / 1000;
      const fresh = Number(hit.headers.get(FRESH_FOR) ?? 0);
      if (age <= fresh) return fromCache(hit, 'HIT');
      // Eskirgan — darhol beramiz, fonda yangilaymiz
      ctx.waitUntil(
        fetchAndStore(ctx, key, upstreamRequest(request, upstreamUrl), timeoutMs)
          .catch(() => {}),
      );
      return fromCache(hit, 'STALE');
    }
  }

  try {
    return await fetchAndStore(ctx, key, upstreamRequest(request, upstreamUrl), timeoutMs);
  } catch {
    return new Response(
      JSON.stringify({ detail: "Server vaqtincha javob bermayapti" }),
      {
        status: 503,
        headers: { 'content-type': 'application/json', 'retry-after': '30' },
      },
    );
  }
}
