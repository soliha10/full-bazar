"""
E'lon sahifalaridan to'liq galereya yig'ish (gallery.py).

    python python/collect_gallery.py                 # 45 daqiqa byudjet
    python python/collect_gallery.py --budget 600    # qisqa sinov

Natija data/listing_images.csv da; sync_csv.py har e'longa shu galereyani
qo'shadi. Serverda Dagster ning "galereya" ishi har kuni ishga tushiradi.
"""
from __future__ import annotations

import argparse
import contextlib
import io
import os
import sys

import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from gallery import collect  # noqa: E402
from sync.load import DATA_DIR, load_rows  # noqa: E402

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")


def main() -> int:
    ap = argparse.ArgumentParser(description="E'lon galereyalari")
    ap.add_argument("--budget", type=int, default=2700, help="sekund")
    ap.add_argument("--delay", type=float, default=0.8, help="so'rovlar orasida, sekund")
    args = ap.parse_args()

    # Faqat katalogga kiradigan e'lonlar (aksessuar, nomsiz e'lonlarsiz)
    with contextlib.redirect_stdout(io.StringIO()):
        rows = load_rows()
    urls = [r["url"] for r in rows if r["url"].startswith("http")]

    session = requests.Session()
    session.headers.update({"User-Agent": UA, "Accept-Language": "uz,ru;q=0.9,en;q=0.8"})

    def fetch(url: str) -> str | None:
        try:
            resp = session.get(url, timeout=15)
        except requests.RequestException:
            return None
        return resp.text if resp.status_code == 200 else None

    print(f"[gallery] {len(urls)} ta e'lon; byudjet {args.budget} s", flush=True)
    collect(DATA_DIR, urls, fetch, args.budget, args.delay, log=lambda m: print(m, flush=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
