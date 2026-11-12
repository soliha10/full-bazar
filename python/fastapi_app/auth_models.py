"""Auth so'rov modellari va 422 xatolarini maydon -> kod ko'rinishiga keltiruvchi handler."""

from __future__ import annotations

import re
from typing import Literal, Optional

from fastapi import Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator, model_validator
from pydantic_core import PydanticCustomError

import auth_rules
import otp

# ── Auth Pydantic models ──────────────────────────────────────────────────────
# Har bir xato PydanticCustomError(<kod>) bo'lib chiqadi; quyidagi
# _auth_validation_handler ularni {"fields": {"email": "email_invalid"}}
# ko'rinishiga keltiradi va frontend kodni tanlangan tilda ko'rsatadi.

def _rule(code: str | None) -> None:
    if code:
        raise PydanticCustomError(code, code)


def _clean_list(v: list[str]) -> list[str]:
    return [s.strip()[:40] for s in v[:20] if isinstance(s, str) and s.strip()]


Channel = Literal["email", "phone"]


def _check_target(channel: str, value: str) -> str:
    """Email yoki telefonni tekshirib, normallashtirilgan ko'rinishini qaytaradi."""
    if channel == "phone":
        _rule(auth_rules.phone_error(value))
        return auth_rules.normalize_phone(value)
    _rule(auth_rules.email_error(value))
    return auth_rules.normalize_email(value)


class RegisterRequest(BaseModel):
    name:                 str
    # Email yoki telefondan aynan bittasi. Kanal yoqilgan bo'lsa (otp) —
    # verification_token ham shart: u /api/auth/verify-code dan keladi.
    email:                Optional[str] = None
    phone:                Optional[str] = None
    password:             str
    verification_token:   Optional[str] = None
    age_group:            Literal["18-24", "25-34", "35-44", "45+"] = "25-34"
    budget_level:         Literal["budget", "mid", "premium"]       = "mid"
    preferred_brands:     list[str]                                 = []
    preferred_categories: list[str]                                 = []

    @field_validator("name")
    @classmethod
    def check_name(cls, v: str) -> str:
        _rule(auth_rules.name_error(v))
        return auth_rules.normalize_name(v)

    @field_validator("email")
    @classmethod
    def check_email(cls, v: Optional[str]) -> Optional[str]:
        return None if v is None or not v.strip() else _check_target("email", v)

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v: Optional[str]) -> Optional[str]:
        return None if v is None or not v.strip() else _check_target("phone", v)

    @model_validator(mode="after")
    def check_password(self) -> "RegisterRequest":
        if not self.email and not self.phone:
            raise PydanticCustomError("email:email_required", "email_required")
        code = auth_rules.new_password_error(self.password, email=self.email or "", name=self.name)
        if code:
            # model_validator xatosi "password" maydoniga tegishli bo'lishi uchun
            raise PydanticCustomError("password:" + code, code)
        return self

    @property
    def channel(self) -> str:
        return "email" if self.email else "phone"

    @property
    def target(self) -> str:
        return self.email or self.phone or ""

    @field_validator("preferred_brands", "preferred_categories")
    @classmethod
    def cap_list(cls, v: list[str]) -> list[str]:
        return _clean_list(v)


class LoginRequest(BaseModel):
    # "identifier" — email yoki telefon. Eski mijozlar uchun "email" ham qabul qilinadi.
    identifier: Optional[str] = None
    email:      Optional[str] = None
    password:   str

    @model_validator(mode="after")
    def check_identifier(self) -> "LoginRequest":
        raw = (self.identifier or self.email or "").strip()
        if not raw:
            raise PydanticCustomError("identifier:identifier_required", "identifier_required")
        if auth_rules.is_email_like(raw):
            code = auth_rules.email_error(raw)
            self.identifier = auth_rules.normalize_email(raw)
        else:
            code = auth_rules.phone_error(raw)
            self.identifier = auth_rules.normalize_phone(raw)
        if code:
            raise PydanticCustomError("identifier:" + code, code)
        return self

    @property
    def is_phone(self) -> bool:
        return not auth_rules.is_email_like(self.identifier or "")

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str) -> str:
        _rule(auth_rules.login_password_error(v))
        return v


class SendCodeRequest(BaseModel):
    channel: Channel
    target:  str
    lang:    Literal["uz", "ru", "en"] = "uz"

    @model_validator(mode="after")
    def normalize(self) -> "SendCodeRequest":
        try:
            self.target = _check_target(self.channel, self.target)
        except PydanticCustomError as exc:
            raise PydanticCustomError("target:" + exc.type, exc.type) from None
        return self


class VerifyCodeRequest(BaseModel):
    channel: Channel
    target:  str
    code:    str

    @model_validator(mode="after")
    def normalize(self) -> "VerifyCodeRequest":
        try:
            self.target = _check_target(self.channel, self.target)
        except PydanticCustomError as exc:
            raise PydanticCustomError("target:" + exc.type, exc.type) from None
        self.code = re.sub(r"\s", "", self.code or "")
        if not re.fullmatch(rf"\d{{{otp.CODE_LENGTH}}}", self.code):
            raise PydanticCustomError("code:code_invalid", "code_invalid")
        return self


class EmailCheckRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def check_email(cls, v: str) -> str:
        _rule(auth_rules.email_error(v))
        return auth_rules.normalize_email(v)


class UpdateProfileRequest(BaseModel):
    age_group:            Literal["18-24", "25-34", "35-44", "45+"]
    budget_level:         Literal["budget", "mid", "premium"]
    preferred_brands:     list[str] = []
    preferred_categories: list[str] = []

    @field_validator("preferred_brands", "preferred_categories")
    @classmethod
    def cap_list(cls, v: list[str]) -> list[str]:
        return _clean_list(v)


async def _auth_validation_handler(request: Request, exc: RequestValidationError):
    """Auth so'rovlarida 422 ni maydon -> kod ko'rinishiga keltiradi.

    Standart javob ({"detail": [{loc, msg, ...}]}) inglizcha va frontend uni
    "[object Object]" deb ko'rsatardi. Boshqa yo'llarga tegmaymiz.
    """
    if not (request.url.path.startswith("/api/auth/") or request.url.path == "/api/users/me/profile"):
        return await request_validation_exception_handler(request, exc)
    fields: dict[str, str] = {}
    for err in exc.errors():
        loc = [str(p) for p in err.get("loc", ()) if p != "body"]
        etype = str(err.get("type", "invalid"))
        if ":" in etype:
            field, code = etype.split(":", 1)
        else:
            field = loc[0] if loc else "body"
            code = etype if etype.startswith(("name_", "email_", "phone_", "password_", "code_")) else f"{field}_invalid"
            if etype == "missing":
                code = f"{field}_required"
        fields.setdefault(field, code)
    return JSONResponse(
        status_code=422,
        content={"detail": {"code": "validation", "message": "Invalid input", "fields": fields}},
    )
