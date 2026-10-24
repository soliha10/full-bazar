// Sitemap API da bazadan yaratiladi — narxlar yangilanganda deploy kerak emas
// (python/fastapi_app/main.py: sitemap()).
import { API_ORIGIN, proxyCached, type FnContext } from './_lib/edge-cache';

export const onRequest = (ctx: FnContext) =>
  proxyCached(ctx, ctx.request, `${API_ORIGIN}/sitemap.xml`);
