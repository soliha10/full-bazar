"""
Tasdiqlash kodlari: yaratish, xeshlash va yuborish (email — Resend, SMS — Eskiz.uz).

Kanal faqat kaliti .env da bo'lsa yoqiladi (`email_enabled()` / `sms_enabled()`).
Kalit yo'q bo'lsa kanal "o'chiq" hisoblanadi — kod hech qachon jimgina
yuborilmay qolmaydi: yuborib bo'lmasa `DeliveryError` ko'tariladi.

OTP_DEBUG=1 faqat lokal sinov uchun: kod jurnalga (stdout) yoziladi, hech
qayerga yuborilmaydi. Prod da yoqmang.
"""
from __future__ import annotations

import asyncio
import hashlib
import hmac
import html
import logging
import os
import secrets
import time

import httpx

log = logging.getLogger("otp")

CODE_LENGTH = 6
CODE_TTL_SECONDS = 10 * 60
RESEND_COOLDOWN_SECONDS = 60
MAX_SENDS_PER_HOUR = 5
MAX_VERIFY_ATTEMPTS = 5

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
EMAIL_FROM = os.getenv("EMAIL_FROM") or "Bazarcom <noreply@bazarcom.online>"

ESKIZ_EMAIL = os.getenv("ESKIZ_EMAIL", "")
ESKIZ_PASSWORD = os.getenv("ESKIZ_PASSWORD", "")
ESKIZ_FROM = os.getenv("ESKIZ_FROM") or "4546"
# Eskiz faqat oldindan TASDIQLANGAN shablon matnini yuboradi — bu matn
# my.eskiz.uz dagi shablon bilan harfma-harf bir xil bo'lishi shart.
# `or`: docker-compose bo'sh qiymatni ham uzatadi, getenv standartga qaytmaydi
ESKIZ_TEMPLATE = (
    os.getenv("ESKIZ_TEMPLATE")
    or "Bazarcom: tasdiqlash kodingiz {code}. Kodni hech kimga bermang."
)

OTP_DEBUG = os.getenv("OTP_DEBUG", "") == "1"


class DeliveryError(Exception):
    """Kodni yuborib bo'lmadi (provayder xatosi yoki kanal sozlanmagan)."""


def email_enabled() -> bool:
    return bool(RESEND_API_KEY) or OTP_DEBUG


def sms_enabled() -> bool:
    return bool(ESKIZ_EMAIL and ESKIZ_PASSWORD) or OTP_DEBUG


def generate_code() -> str:
    return f"{secrets.randbelow(10 ** CODE_LENGTH):0{CODE_LENGTH}d}"


def hash_code(code: str, target: str, secret: str) -> str:
    """Bazada kodning o'zi emas, HMAC i saqlanadi — baza sizsa ham kodlar ochilmaydi."""
    return hmac.new(secret.encode(), f"{target}:{code}".encode(), hashlib.sha256).hexdigest()


def codes_match(code: str, target: str, secret: str, stored_hash: str) -> bool:
    return hmac.compare_digest(hash_code(code, target, secret), stored_hash)


def mask_email(email: str) -> str:
    local, _, domain = email.partition("@")
    shown = local[:2] if len(local) > 3 else local[:1]
    return f"{shown}{'•' * max(2, len(local) - len(shown))}@{domain}"


def mask_phone(phone: str) -> str:
    # 998901234567 -> +998 90 ••• •• 67
    return f"+{phone[:3]} {phone[3:5]} ••• •• {phone[-2:]}"


# ── Email ─────────────────────────────────────────────────────────────────────

_EMAIL_TEXT = {
    "uz": {
        "subject": "Bazarcom tasdiqlash kodi: {code}",
        "title": "Email manzilingizni tasdiqlang",
        "body": "Bazarcom da ro'yxatdan o'tishni yakunlash uchun quyidagi kodni kiriting:",
        "expires": "Kod 10 daqiqa amal qiladi.",
        "ignore": "Agar siz ro'yxatdan o'tmagan bo'lsangiz, bu xatga e'tibor bermang.",
    },
    "ru": {
        "subject": "Код подтверждения Bazarcom: {code}",
        "title": "Подтвердите ваш email",
        "body": "Чтобы завершить регистрацию на Bazarcom, введите этот код:",
        "expires": "Код действует 10 минут.",
        "ignore": "Если вы не регистрировались, просто проигнорируйте это письмо.",
    },
    "en": {
        "subject": "Your Bazarcom verification code: {code}",
        "title": "Confirm your email",
        "body": "Enter this code to finish creating your Bazarcom account:",
        "expires": "The code expires in 10 minutes.",
        "ignore": "If you didn't sign up, you can safely ignore this email.",
    },
}


def _email_content(code: str, lang: str) -> tuple[str, str, str]:
    t = _EMAIL_TEXT.get(lang, _EMAIL_TEXT["uz"])
    subject = t["subject"].format(code=code)
    text = f"{t['title']}\n\n{t['body']}\n\n{code}\n\n{t['expires']}\n{t['ignore']}\n\n— Bazarcom"
    e = {k: html.escape(v) for k, v in t.items()}
    body = f"""<!doctype html><html><body style="margin:0;background:#f5f5f7;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#fff;border-radius:16px;overflow:hidden">
<tr><td style="background:#7c3aed;padding:20px 24px;color:#fff;font-weight:800;font-size:16px;letter-spacing:.5px">BAZARCOM</td></tr>
<tr><td style="padding:28px 24px 8px;color:#111827">
<h1 style="margin:0 0 12px;font-size:20px">{e['title']}</h1>
<p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#4b5563">{e['body']}</p>
<div style="font-size:32px;font-weight:800;letter-spacing:8px;text-align:center;background:#f5f3ff;color:#6d28d9;border-radius:12px;padding:16px 0">{code}</div>
<p style="margin:20px 0 0;font-size:13px;color:#6b7280">{e['expires']}</p>
<p style="margin:8px 0 24px;font-size:13px;color:#9ca3af">{e['ignore']}</p>
</td></tr></table></td></tr></table></body></html>"""
    return subject, text, body


async def send_email_code(to: str, code: str, lang: str) -> None:
    if OTP_DEBUG and not RESEND_API_KEY:
        print(f"[otp-debug] email {to}: {code}", flush=True)
        return
    if not RESEND_API_KEY:
        raise DeliveryError("email channel is not configured")
    subject, text, body = _email_content(code, lang)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
                json={"from": EMAIL_FROM, "to": [to], "subject": subject, "text": text, "html": body},
            )
    except httpx.HTTPError as exc:
        raise DeliveryError(f"resend request failed: {exc}") from exc
    if res.status_code >= 300:
        log.error("resend %s: %s", res.status_code, res.text[:300])
        raise DeliveryError(f"resend returned {res.status_code}")


# ── SMS (Eskiz.uz) ────────────────────────────────────────────────────────────
# Eskiz tokeni 30 kun amal qiladi — har SMS da qayta login qilmaslik uchun
# xotirada saqlanadi, 401 kelsa yangilanadi.

_ESKIZ_BASE = "https://notify.eskiz.uz/api"
_eskiz_token: str = ""
_eskiz_token_at: float = 0.0
_eskiz_lock = asyncio.Lock()


async def _eskiz_login(client: httpx.AsyncClient) -> str:
    global _eskiz_token, _eskiz_token_at
    res = await client.post(f"{_ESKIZ_BASE}/auth/login", data={"email": ESKIZ_EMAIL, "password": ESKIZ_PASSWORD})
    if res.status_code >= 300:
        log.error("eskiz login %s: %s", res.status_code, res.text[:300])
        raise DeliveryError(f"eskiz login returned {res.status_code}")
    _eskiz_token = res.json().get("data", {}).get("token", "")
    _eskiz_token_at = time.time()
    if not _eskiz_token:
        raise DeliveryError("eskiz login returned no token")
    return _eskiz_token


async def send_sms_code(phone: str, code: str) -> None:
    if OTP_DEBUG and not (ESKIZ_EMAIL and ESKIZ_PASSWORD):
        print(f"[otp-debug] sms +{phone}: {code}", flush=True)
        return
    if not (ESKIZ_EMAIL and ESKIZ_PASSWORD):
        raise DeliveryError("sms channel is not configured")
    message = ESKIZ_TEMPLATE.format(code=code)
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            async with _eskiz_lock:
                token = _eskiz_token if _eskiz_token and time.time() - _eskiz_token_at < 25 * 86400 \
                    else await _eskiz_login(client)
            for attempt in range(2):
                res = await client.post(
                    f"{_ESKIZ_BASE}/message/sms/send",
                    headers={"Authorization": f"Bearer {token}"},
                    data={"mobile_phone": phone, "message": message, "from": ESKIZ_FROM},
                )
                if res.status_code == 401 and attempt == 0:
                    async with _eskiz_lock:
                        token = await _eskiz_login(client)
                    continue
                break
    except httpx.HTTPError as exc:
        raise DeliveryError(f"eskiz request failed: {exc}") from exc
    if res.status_code >= 300:
        log.error("eskiz send %s: %s", res.status_code, res.text[:300])
        raise DeliveryError(f"eskiz returned {res.status_code}")
