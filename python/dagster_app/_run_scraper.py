"""
Subprocess entry-point for a single scraper.
Run as: python _run_scraper.py <store_name> <data_dir>

Each scraper runs in its own process so BeautifulSoup/lxml memory is freed
as soon as the subprocess exits — keeps dagster-daemon resident set small.
"""
from __future__ import annotations

import os
import sys


def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: _run_scraper.py <store_name> <data_dir>", flush=True)
        sys.exit(1)

    store_name = sys.argv[1]
    data_dir = sys.argv[2]

    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

    try:
        from scrapers import ALL_SCRAPERS
    except ImportError as exc:
        print(f"[{store_name}] ImportError: {exc}", flush=True)
        sys.exit(1)

    cls = next((c for c in ALL_SCRAPERS if c.store_name == store_name), None)
    if cls is None:
        print(f"[{store_name}] not found in ALL_SCRAPERS", flush=True)
        sys.exit(1)

    try:
        scraper = cls(output_dir=data_dir, delay=1.0)
        count = scraper.run()
        print(f"[{store_name}] OK {count}", flush=True)
        sys.exit(0)
    except Exception as exc:
        print(f"[{store_name}] FATAL: {exc}", flush=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
