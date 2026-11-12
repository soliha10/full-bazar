"""auth_rules qoidalari. Ishga tushirish: cd python/fastapi_app && python -m pytest tests"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import auth_rules as r  # noqa: E402


def test_name():
    assert r.name_error("Shahzod") is None
    assert r.name_error("  O'g'iloy   Karimova ") is None
    assert r.normalize_name("  O'g'iloy   Karimova ") == "O'g'iloy Karimova"
    assert r.name_error("Гульшода") is None
    assert r.name_error("Anne-Marie") is None
    assert r.name_error("") == "name_required"
    assert r.name_error("   ") == "name_required"
    assert r.name_error("A") == "name_too_short"
    assert r.name_error("A" * 61) == "name_too_long"
    assert r.name_error("123") == "name_invalid"
    assert r.name_error("Ali2") == "name_invalid"
    assert r.name_error("Ali <script>") == "name_invalid"
    assert r.name_error("'Ali") == "name_invalid"


def test_email():
    assert r.email_error("user@gmail.com") is None
    assert r.email_error("  User.Name+tag@Mail.UZ ") is None
    assert r.normalize_email("  User@Mail.UZ ") == "user@mail.uz"
    assert r.email_error("") == "email_required"
    for bad in ["user", "user@", "@mail.com", "user@mail", "us er@mail.com",
                "user@@mail.com", ".user@mail.com", "user.@mail.com", "us..er@mail.com",
                "user@-mail.com", "user@mail.c"]:
        assert r.email_error(bad) == "email_invalid", bad
    assert r.email_error("a" * 65 + "@mail.com") == "email_invalid"
    assert r.email_error("a@" + "b" * 250 + ".com") == "email_too_long"


def test_new_password():
    ok = "Bazar2026x"
    assert r.new_password_error(ok, email="ali@mail.uz", name="Ali") is None
    assert r.new_password_error("") == "password_required"
    assert r.new_password_error("ab12") == "password_too_short"
    assert r.new_password_error("abcdefgh") == "password_no_digit"
    assert r.new_password_error("12345678") == "password_no_letter"
    assert r.new_password_error(" abcd1234") == "password_whitespace"
    assert r.new_password_error("Password123") == "password_common"
    assert r.new_password_error("aaaa1111") == "password_common"
    # 72 baytdan oshsa — bcrypt qolganini jimgina tashlab yuborardi
    assert r.new_password_error("ж" * 36 + "1") == "password_too_long"
    assert r.new_password_error("ab1c" * 18) is None  # aynan 72 bayt
    assert r.new_password_error("shahzod99", email="shahzod@mail.uz") == "password_contains_email"
    assert r.new_password_error("gulshoda2026", email="x@mail.uz", name="Gulshoda") == "password_contains_name"


def test_login_password():
    assert r.login_password_error("x") is None
    assert r.login_password_error("") == "password_required"
    assert r.login_password_error("x" * 129) == "password_too_long"


def test_phone():
    for ok in ["+998 90 123 45 67", "998901234567", "90 123-45-67", "(93) 1234567", "+998331234567"]:
        assert r.phone_error(ok) is None, ok
        assert r.normalize_phone(ok).startswith("998") and len(r.normalize_phone(ok)) == 12
    assert r.phone_error("") == "phone_required"
    for bad in ["+998 71 123 45 67", "+7 900 123 45 67", "90123", "90 abc 45 67", "+998 90 123 45 678"]:
        assert r.phone_error(bad) == "phone_invalid", bad
