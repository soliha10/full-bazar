"""
Ozon uchun haqiqiy Chrome: ishga tushirish, to'xtatish va antibot challenge
dan o'tishni kutish (OzonScraper qismi). Nega aynan shunday — ozon.py boshidagi
izohda.
"""
from __future__ import annotations

import os
import shutil
import signal
import socket
import subprocess
import tempfile
import time

CHROME_PATHS = (
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
)


def _free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def _chrome_binary() -> str:
    override = os.getenv("CHROME_PATH")
    if override and os.path.exists(override):
        return override
    for path in CHROME_PATHS:
        if os.path.exists(path):
            return path
    raise RuntimeError(
        "Chrome topilmadi. CHROME_PATH muhit o'zgaruvchisida yo'lni ko'rsating."
    )


class _ChromeMixin:
    """Chrome jarayoni (self._proc, self._profile) va kategoriya sahifasini ochish."""

    # ── Chrome ni ko'tarish va CDP ga ulanish ───────────────────────────────
    def _start_chrome(self, port: int) -> None:
        self._profile = tempfile.mkdtemp(prefix="ozon-chrome-")
        cmd = [
            _chrome_binary(),
            f"--remote-debugging-port={port}",
            f"--user-data-dir={self._profile}",
            "--no-first-run",
            "--no-default-browser-check",
            "--window-size=1440,900",
            "about:blank",
        ]
        if os.getenv("OZON_HEADLESS") == "1":
            # DIQQAT: headless rejimda challenge odatda O'TMAYDI — faqat
            # sinov uchun qoldirilgan.
            cmd.insert(1, "--headless=new")
        self._proc = subprocess.Popen(
            cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )

    def _stop_chrome(self) -> None:
        if self._proc and self._proc.poll() is None:
            self._proc.send_signal(signal.SIGTERM)
            try:
                self._proc.wait(timeout=10)
            except subprocess.TimeoutExpired:
                self._proc.kill()
        if self._profile:
            shutil.rmtree(self._profile, ignore_errors=True)
        self._proc, self._profile = None, None

    def _open_category(self, page, url: str) -> bool:
        """Kategoriyani ochadi; challenge o'tmasa False."""
        page.goto(url, wait_until="domcontentloaded", timeout=60_000)
        deadline = time.monotonic() + self.CHALLENGE_TIMEOUT
        reloaded = False
        while time.monotonic() < deadline:
            try:
                page.wait_for_selector("div[data-index] a[href*='/product/']", timeout=5_000)
                return True
            except Exception:
                title = (page.title() or "").lower()
                if "antibot" not in title and "соединения" not in title:
                    continue  # sahifa ochilgan, kartochkalar hali yuklanmagan
                # Challenge: yarim vaqt o'tgach bir marta qayta yuklaymiz —
                # ba'zan birinchi urinishda cookie o'rnatilib, ikkinchisida o'tadi.
                if not reloaded and time.monotonic() > deadline - self.CHALLENGE_TIMEOUT / 2:
                    reloaded = True
                    try:
                        page.reload(wait_until="domcontentloaded", timeout=60_000)
                    except Exception:
                        pass
                time.sleep(3)
        return False
