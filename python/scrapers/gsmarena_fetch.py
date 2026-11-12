"""GSMArena so'rovlari: vaqt byudjeti va 429 uchun qayta urinish (GsmarenaSpecsScraper qismi)."""
from __future__ import annotations

import time

from .gsmarena_parse import RateLimited, logger


class _FetchMixin:
    """Byudjet va so'rov. self.get, self.delay, self._base_delay va MAX_DELAY ni scraper beradi."""

    # ── Vaqt byudjeti ──────────────────────────────────────────────────────
    def _start_budget(self, seconds: int) -> None:
        self._deadline = time.monotonic() + seconds if seconds > 0 else None

    def _time_left(self) -> float:
        if self._deadline is None:
            return float("inf")
        return self._deadline - time.monotonic()

    def _expired(self) -> bool:
        return self._time_left() <= 0

    # ── So'rov (429 uchun qayta urinish bilan) ──────────────────────────────
    # GSMArena tez so'rovlarda 429 beradi va cheklov bir necha DAQIQA saqlanadi,
    # shuning uchun kutish har urinishda ikki barobar oshadi.
    # Zanjir ataylab qisqa (jami 3.5 daqiqa): oldingi 30+60+120+240 varianti
    # bitta bloklangan URL uchun 7.5 daqiqagacha yeb qo'yardi va ish CI
    # timeout iga uchrardi. Uzoq kutishning o'rniga umumiy kechikish oshiriladi
    # (pastga qarang) — bu qayta cheklanishning oldini yaxshiroq oladi.
    RETRY_WAITS = (30, 60, 120)
    # Vaqt byudjeti bo'lmaganda (mahalliy ish) cheklovni KUTIB o'tirish
    # brendni tashlab ketishdan yaxshi. 2026-09-18 dagi mahalliy ishda
    # GSMArena ~300 so'rovdan keyin cheklovni yoqdi va qisqa zanjir tufayli
    # har brend 3.5 daqiqa kutib, 0 ta telefon bilan o'tib ketaverdi —
    # Google, OnePlus, Asus, Lenovo shunday yo'qoldi.
    LONG_RETRY_WAITS = (30, 60, 120, 300, 600, 900)

    # Ketma-ket shuncha URL to'liq kutish zanjiridan keyin ham 429 bersa,
    # bu vaqtinchalik tiqilinch emas — IP uzoq muddatga cheklangan. Davom
    # etish har URL uchun yana 33 daqiqa yeydi va baribir 0 natija beradi,
    # shuning uchun to'xtaymiz va yig'ilganini saqlaymiz.
    BAN_GIVEUP = 3

    def _fetch(self, url: str):
        resp = None
        # Byudjet cheklovsiz bo'lsa uzoq kutamiz, aks holda CI ni bloklamaymiz.
        waits = self.LONG_RETRY_WAITS if self._deadline is None else self.RETRY_WAITS
        for wait in (*waits, None):
            resp = self.get(url)
            if resp.status_code not in (429, 503):
                # Sog'lom javob — kechikishni asta-sekin normaga qaytaramiz
                self.delay = max(self._base_delay, self.delay * 0.97)
                self._banned_streak = 0
                return resp
            # Cheklovga tushdik: keyingi so'rovlar odobliroq bo'lsin
            self.delay = min(self.delay * 1.5, self.MAX_DELAY)
            if wait is None or wait >= self._time_left():
                self._banned_streak += 1
                if self._banned_streak >= self.BAN_GIVEUP:
                    raise RateLimited(
                        f"{self._banned_streak} ta manzil ketma-ket cheklandi"
                    )
                return resp
            logger.warning("[gsmarena] %s HTTP %d — %d s kutilmoqda (kechikish %.1f s)",
                           url, resp.status_code, wait, self.delay)
            time.sleep(wait)
        return resp
