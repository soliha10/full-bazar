"""
Ro'yxatdan o'tish / kirish maydonlari uchun tekshiruv qoidalari.

Qoidalar frontenddagi src/utils/authValidation.ts bilan AYNAN bir xil bo'lishi
kerak: foydalanuvchi xatoni yozayotgan paytida ko'radi, server esa o'sha
qoidani qayta tekshiradi (mijozga ishonib bo'lmaydi). Har bir xato matn emas,
KOD qaytaradi — matnni frontend tanlangan tilda ko'rsatadi.

Bu modul ataylab FastAPI/baza ga bog'lanmagan, shuning uchun alohida test
qilinadi (tests/test_auth_rules.py).
"""
from __future__ import annotations

import re
import unicodedata

NAME_MIN = 2
NAME_MAX = 60
EMAIL_MAX = 254
EMAIL_LOCAL_MAX = 64
PASSWORD_MIN = 8
# bcrypt faqat birinchi 72 baytni hisobga oladi va qolganini JIMGINA tashlaydi:
# 80 belgili parolning oxirini o'zgartirib ham kirsa bo'lardi. Shuning uchun
# chegara belgida emas, UTF-8 baytda (kirill harfi 2 bayt).
PASSWORD_MAX_BYTES = 72
LOGIN_PASSWORD_MAX = 128

# Ismdagi harflar orasida ruxsat etilgan belgilar: o'zbekcha tutuq belgilari
# (o' g' — ʻ ʼ ' ’ `), chiziqcha, nuqta va bo'sh joy.
_NAME_JOINERS = set("'ʻʼ’`-. ")

# Eng ko'p uchraydigan parollar — bular "8 belgi, harf va raqam" qoidasidan
# o'tib ketadi, lekin birinchi bo'lib sinab ko'riladi.
COMMON_PASSWORDS = frozenset({
    "password1", "password123", "passw0rd", "qwerty123", "qwerty1234",
    "abc12345", "abcd1234", "a1234567", "1q2w3e4r", "1qaz2wsx",
    "iloveyou1", "admin123", "welcome1", "letmein1", "parol123",
    "uzbekistan1", "tashkent1", "toshkent1", "bazarcom1", "samsung123",
    "12345678a", "123456789a", "qwertyuiop1", "football1", "baseball1",
})

_EMAIL_RE = re.compile(
    r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@"
    r"(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$"
)


def normalize_name(value: str) -> str:
    return " ".join(unicodedata.normalize("NFC", value or "").split())


def normalize_email(value: str) -> str:
    return (value or "").strip().lower()


def name_error(value: str) -> str | None:
    name = normalize_name(value)
    if not name:
        return "name_required"
    if len(name) < NAME_MIN:
        return "name_too_short"
    if len(name) > NAME_MAX:
        return "name_too_long"
    if not name[0].isalpha():
        return "name_invalid"
    for ch in name:
        if ch.isalpha() or ch in _NAME_JOINERS or unicodedata.category(ch).startswith("M"):
            continue
        return "name_invalid"
    return None


def email_error(value: str) -> str | None:
    email = normalize_email(value)
    if not email:
        return "email_required"
    if len(email) > EMAIL_MAX:
        return "email_too_long"
    local, _, domain = email.partition("@")
    if (
        not _EMAIL_RE.match(email)
        or len(local) > EMAIL_LOCAL_MAX
        or local.startswith(".") or local.endswith(".") or ".." in email
    ):
        return "email_invalid"
    return None


def new_password_error(password: str, *, email: str = "", name: str = "") -> str | None:
    if not password:
        return "password_required"
    if len(password) < PASSWORD_MIN:
        return "password_too_short"
    if len(password.encode("utf-8")) > PASSWORD_MAX_BYTES:
        return "password_too_long"
    if not any(ch.isalpha() for ch in password):
        return "password_no_letter"
    if not any(ch.isdigit() for ch in password):
        return "password_no_digit"
    if password != password.strip():
        return "password_whitespace"
    lowered = password.lower()
    if lowered in COMMON_PASSWORDS or len(set(lowered)) <= 2:
        return "password_common"
    email = normalize_email(email)
    local = email.partition("@")[0]
    if lowered == email or (len(local) >= 4 and local in lowered):
        return "password_contains_email"
    compact_name = normalize_name(name).lower().replace(" ", "")
    if len(compact_name) >= 4 and compact_name in lowered.replace(" ", ""):
        return "password_contains_name"
    return None


def login_password_error(password: str) -> str | None:
    if not password:
        return "password_required"
    if len(password) > LOGIN_PASSWORD_MAX:
        return "password_too_long"
    return None
