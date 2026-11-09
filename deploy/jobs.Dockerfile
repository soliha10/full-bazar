# Skreyperlar va sync_csv.py / sync_specs.py uchun image.
# Kod image ichiga ko'chirilmaydi — repo /repo ga ulanadi (docker-compose.yml).
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# scrape_and_sync.yml dagi bilan bir xil versiyalar. curl_cffi — Cloudflare
# ortidagi asaxiy/olcha uchun Chrome TLS barmoq izi.
RUN pip install requests==2.32.3 beautifulsoup4==4.12.3 lxml==5.2.2 \
        psycopg2-binary==2.9.9 "curl_cffi>=0.7,<0.8"
