"""
FastAPI service — serves product data from PostgreSQL.

Bu fayl faqat ilovani yig'adi: middleware lar, xato handleri va routerlar.
Yo'llarning o'zi *_api.py modullarida. Dockerfile `uvicorn main:app` ni
ishga tushiradi, shuning uchun `app` shu yerda qolishi shart.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

import analytics_api
import auth_api
import auth_codes_api
import catalog
import feedback_api
import image_proxy
import ml_matcher
import pages
import products_api
import recs_api
import search_api
import specs_api
import tracking
import trends_api
import users_api
from auth_models import _auth_validation_handler
from lifecycle import lifespan
from middleware import _ALLOWED_ORIGINS, CdnCacheMiddleware, DbReadyMiddleware, RateLimitMiddleware

app = FastAPI(
    title="Full-Bazar API",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)
catalog.bind_state(app.state)

app.add_exception_handler(RequestValidationError, _auth_validation_handler)

app.add_middleware(DbReadyMiddleware)
app.add_middleware(CdnCacheMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Tartib muhim: yo'llar shu ketma-ketlikda ro'yxatga olinadi (openapi.json
# dagi tartib ham shundan). /product/{product_param:path} hamma narsani
# ushlaydi, lekin u faqat /product/ ostida — /api yo'llari bilan to'qnashmaydi.
app.include_router(ml_matcher.router)
app.include_router(products_api.router)
app.include_router(specs_api.router)
app.include_router(recs_api.router)
app.include_router(trends_api.router)
app.include_router(analytics_api.router)
app.include_router(tracking.router)
app.include_router(pages.router)


@app.get("/health")
async def health() -> dict:
    matcher = ml_matcher._load_matcher()
    return {
        "status": "ok",
        "db": "ready" if getattr(app.state, "pool", None) is not None else "connecting",
        "matcher_model": "loaded" if matcher else "not_trained_yet",
    }


app.include_router(auth_codes_api.router)
app.include_router(auth_api.router)
app.include_router(users_api.router)
app.include_router(feedback_api.router)
app.include_router(image_proxy.router)
app.include_router(search_api.router)
