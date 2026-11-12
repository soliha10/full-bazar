"""Hotlink himoyalangan CDN rasmlari (OLX) uchun proksi."""

from __future__ import annotations

from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException, Query, Request, Response

router = APIRouter()


# ── Image proxy (for hotlink-protected CDN images e.g. OLX) ──────────────────

@router.get("/api/proxy-image")
async def proxy_image(request: Request, url: str = Query(...)) -> Response:
    parsed = urlparse(url)
    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(status_code=403, detail="Host not allowed")
    
    # Check if host is olxcdn.com, img.olxcdn.com or their subdomains
    is_allowed = (
        hostname == "olxcdn.com" or hostname.endswith(".olxcdn.com") or
        hostname == "img.olxcdn.com" or hostname.endswith(".img.olxcdn.com")
    )
    if not is_allowed:
        raise HTTPException(status_code=403, detail="Host not allowed")
        
    try:
        resp = await request.app.state.http.get(
            url,
            headers={
                "Referer": "https://www.olx.uz/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
        )
    except Exception:
        raise HTTPException(status_code=502, detail="Image fetch failed")
    # olx 404/403 sahifasini rasm sifatida 200 bilan qaytarmaymiz — aks holda
    # CDN singan rasmni bir kunga keshlab qo'yardi.
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Image fetch failed")
    content_type = resp.headers.get("content-type", "image/jpeg")
    if not content_type.startswith("image/"):
        content_type = "image/jpeg"
    return Response(
        content=resp.content,
        media_type=content_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )
