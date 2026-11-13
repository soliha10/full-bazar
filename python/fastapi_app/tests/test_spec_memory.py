"""Xususiyatlardagi xotira — mahsulotning o'zi, modelning eng katta varianti emas."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from spec_payload import _own_memory, _spec_payload


def _row(**kw):
    base = dict(display_name="Apple iPhone 16 Plus", display='6.7"', chipset="Apple A18",
                ram_options=["8GB"], storage_options=["512GB"], main_camera=None, selfie_camera=None,
                battery_mah=4674, charging=None, os=None, body=None, release_year=2024)
    return {**base, **kw}


def test_own_memory_parses_name():
    assert _own_memory("Apple iPhone 16E 8/128 GB") == ("8GB", "128GB")
    assert _own_memory("Apple iPhone 16 Plus 128 GB") == (None, "128GB")
    assert _own_memory("iPhone 17 Pro Max 1 TB") == (None, "1TB")
    assert _own_memory("Redmi Note 13") == (None, None)


def test_product_storage_wins_over_model_max():
    p = _spec_payload(_row(), "Apple iPhone 16 Plus 128 GB")
    assert p["storageOptions"] == ["128GB"]


def test_title_only_spec_hides_uncertain_ram():
    # Tafsilotsiz yozuv: RAM sarlavhadagi eng katta konfiguratsiya — ko'rsatilmaydi
    assert _spec_payload(_row(), "Apple iPhone 16 Plus 128 GB")["ramOptions"] == []
    assert _spec_payload(_row(os="iOS 18"), "Apple iPhone 16 Plus 128 GB")["ramOptions"] == ["8GB"]
    assert _spec_payload(_row(), "Samsung Galaxy A55 8/256 GB")["ramOptions"] == ["8GB"]
