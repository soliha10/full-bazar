/**
 * Eski WordPress sahifalari uchun haqiqiy 404.
 *
 * Bu domenda ilgari WordPress ishlagan va Google indeksida undan qolgan
 * sahifalar bor (/sample-page-3/, /wp-admin/ ...). SPA fallback tufayli ular
 * 200 qaytarib, indeksda "tirik" ko'rinardi. Funksiya FAQAT _routes.json dagi
 * shu yo'llar uchun ishga tushadi (scripts/cloudflare-postbuild.mjs).
 */
interface Ctx {
  request: Request;
  env: { ASSETS: { fetch(input: Request | string): Promise<Response> } };
}

export const onRequest = async ({ request, env }: Ctx) => {
  const page = await env.ASSETS.fetch(new URL('/404-page', request.url).toString());
  return new Response(page.ok ? page.body : 'Not found', {
    status: 404,
    headers: { 'content-type': 'text/html; charset=UTF-8' },
  });
};
