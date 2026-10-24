// /api/* → Render API (edge keshi bilan). Batafsil: _lib/edge-cache.ts
import { API_ORIGIN, proxyCached, type FnContext } from '../_lib/edge-cache';

export const onRequest = (ctx: FnContext) => {
  const url = new URL(ctx.request.url);
  return proxyCached(ctx, ctx.request, API_ORIGIN + url.pathname + url.search);
};
