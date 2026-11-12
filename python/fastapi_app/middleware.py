"""ASGI middleware lar: so'rovlar cheklovi, CDN keshi sarlavhasi, baza tayyorligi."""

from __future__ import annotations

import time
from collections import deque

from fastapi.responses import JSONResponse
from starlette.datastructures import Headers, MutableHeaders

_ALLOWED_ORIGINS = [
    "https://bazarcom.online",
    "https://www.bazarcom.online",
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1",
]

# ── So'rovlar cheklovi ────────────────────────────────────────────────────────
# Reklamadan kelgan mehmonlar asosan mobil internetda. Mobil operatorlar
# ko'p abonentni bitta umumiy IP (CGNAT) orqali chiqaradi, shuning uchun
# eski 60 so'rov/daqiqa limiti bir necha haqiqiy foydalanuvchiga bitta bo'lib
# qolardi va 429 boshlanardi. Umumiy limit endi kengroq; parol taxmin qilishni
# to'sish uchun faqat auth yo'llari qattiq cheklanadi.
_RATE_LIMIT = 300        # so'rov / oyna — oddiy o'qish
_AUTH_RATE_LIMIT = 20    # so'rov / oyna — /api/auth/*
_RATE_WINDOW = 60        # soniya
# Cheklovdan tashqari: keepalive, va CDN keshlaydigan rasmlar (sahifada
# o'nlab rasm bo'ladi — ularni hisoblash limitni bir sahifada yeb qo'yardi).
_RATE_EXEMPT = ("/health", "/api/proxy-image")

_rate_store: dict[str, deque[float]] = {}
_rate_last_sweep = 0.0


def _client_ip(scope: dict) -> str:
    """Haqiqiy mijoz IP si.

    scope["client"] Render'da yuklama muvozanatlagichning IP si — uvicorn
    proxy sarlavhalariga ishonmaydi. Shu sabab limit hamma foydalanuvchiga
    BITTA bo'lib, 60 so'rov/daqiqa butun sayt uchun umumiy edi: bir necha
    kishi bir vaqtda kirsa 429 boshlanardi. Netlify mijoz IP sini alohida
    sarlavhada beradi, Cloudflare Pages funksiyasi (frontend/functions/_lib/
    edge-cache.ts) — X-Bazar-Client-IP da; to'g'ridan-to'g'ri kelgan so'rovda
    X-Forwarded-For.
    """
    headers = Headers(scope=scope)
    ip = headers.get("x-nf-client-connection-ip") or headers.get("x-bazar-client-ip")
    if not ip:
        fwd = headers.get("x-forwarded-for", "")
        ip = fwd.split(",")[0].strip()
    client = scope.get("client")
    return ip or (client[0] if client else "unknown")


class RateLimitMiddleware:
    """Sof ASGI middleware — BaseHTTPMiddleware har so'rovga qo'shimcha
    vazifa va oqim yaratadi, bu esa 0.1 CPU li bepul Render'da sezilarli."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if (scope["type"] != "http" or scope["method"] == "OPTIONS"
                or scope["path"].startswith(_RATE_EXEMPT)):
            return await self.app(scope, receive, send)

        global _rate_last_sweep
        now = time.monotonic()
        window_start = now - _RATE_WINDOW

        # Ketgan mehmonlarning yozuvlarini tozalash — aks holda lug'at har
        # yangi IP bilan cheksiz o'sib, xotirani asta-sekin yeb borardi.
        if now - _rate_last_sweep > _RATE_WINDOW:
            _rate_last_sweep = now
            for key in [k for k, q in _rate_store.items() if not q or q[-1] <= window_start]:
                del _rate_store[key]

        ip = _client_ip(scope)
        is_auth = scope["path"].startswith("/api/auth/")
        key, limit = (f"auth:{ip}", _AUTH_RATE_LIMIT) if is_auth else (ip, _RATE_LIMIT)

        q = _rate_store.get(key)
        if q is None:
            q = _rate_store[key] = deque()
        while q and q[0] <= window_start:
            q.popleft()
        if len(q) >= limit:
            response = JSONResponse(
                status_code=429,
                content={"detail": {
                    "code": "rate_limited",
                    "message": "Too many requests",
                    "retryAfter": _RATE_WINDOW,
                }},
                headers={"Retry-After": str(_RATE_WINDOW)},
            )
            return await response(scope, receive, send)
        q.append(now)
        return await self.app(scope, receive, send)


# ── Netlify CDN keshi ─────────────────────────────────────────────────────────
# Ommaviy o'qish javoblari Netlify chekkasida saqlanadi. stale-while-revalidate
# tufayli kesh eskirgan bo'lsa ham foydalanuvchi darhol javob oladi, yangilash
# esa fonda ketadi — Render uxlab qolgan bo'lsa ham sayt kutmaydi. Narxlar
# kuniga 4 marta yangilanadi, 5 daqiqalik s-maxage yetarlicha yangi.
# Foydalanuvchiga xos javoblar (users/*, personalized, auth) bu yerga KIRMAYDI.
_CDN_CACHEABLE = (
    "/api/products", "/api/compare", "/api/recommendations", "/api/trends",
    "/api/stats", "/api/markets", "/api/brands", "/api/spec-facets",
    "/api/search-trends", "/api/market-analytics", "/api/search/suggest", "/sitemap.xml",
)
_CDN_DEFAULT = "public, durable, s-maxage=300, stale-while-revalidate=604800"
# Rasmlar o'zgarmaydi — bir kun saqlaymiz, olx ga har safar bormaymiz
_CDN_IMAGES = "public, durable, s-maxage=86400, stale-while-revalidate=604800"


def _cdn_header(path: str) -> str | None:
    if path == "/api/proxy-image" or (path.startswith("/api/markets/") and path.endswith("/logo")):
        return _CDN_IMAGES
    if path.startswith(_CDN_CACHEABLE) and not path.startswith("/api/recommendations/personalized"):
        return _CDN_DEFAULT
    return None


class CdnCacheMiddleware:
    """Sof ASGI: javob sarlavhasiga faqat qo'shimcha qator qo'shadi, tanaga tegmaydi."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http" or scope["method"] != "GET":
            return await self.app(scope, receive, send)
        value = _cdn_header(scope["path"])
        if value is None or "authorization" in Headers(scope=scope):
            return await self.app(scope, receive, send)

        async def send_wrapper(message):
            if message["type"] == "http.response.start" and message["status"] == 200:
                headers = MutableHeaders(scope=message)
                headers["Netlify-CDN-Cache-Control"] = value
            await send(message)

        return await self.app(scope, receive, send_wrapper)


class DbReadyMiddleware:
    """Baza hali ulanmagan bo'lsa /api so'rovlariga darhol 503 qaytaradi.

    Aks holda har endpoint `app.state.pool` None da AttributeError bilan 500
    berardi. 503 + Retry-After CDN da keshlanmaydi (CdnCacheMiddleware faqat
    200 ga sarlavha qo'yadi), frontend esa qayta urinadi.
    """

    _NEEDS_DB = ("/api/", "/sitemap.xml")
    _NO_DB = ("/api/track", "/api/proxy-image", "/api/docs", "/api/redoc", "/api/openapi.json")

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if (scope["type"] == "http"
                and getattr(scope["app"].state, "pool", None) is None
                and scope["path"].startswith(self._NEEDS_DB)
                and not scope["path"].startswith(self._NO_DB)):
            response = JSONResponse(
                {"detail": "Ma'lumotlar bazasi vaqtincha javob bermayapti"},
                status_code=503, headers={"Retry-After": "30"},
            )
            return await response(scope, receive, send)
        return await self.app(scope, receive, send)
