# FastAPI xizmati uchun image.
#
# Render'dagi servis Docker runtime'ida ishlaydi, ya'ni build shu fayldan
# boshlanadi (ilgari `runtime: python` edi va Dockerfile umuman yo'q edi —
# deploy "failed to read dockerfile" bilan to'xtardi).
#
# Build konteksti — python/fastapi_app (render.yaml dagi rootDir). Ilova shu
# katalogdan tashqariga chiqmaydi: main.py faqat `brands` va `specs_seed` ni
# import qiladi, ikkalasi ham shu yerda.

FROM python:3.11-slim

# - PYTHONDONTWRITEBYTECODE: konteynerda .pyc kerak emas
# - PYTHONUNBUFFERED: print/log darhol Render jurnaliga tushsin, buferda qolmasin
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Avval faqat requirements — kod o'zgarganda pip qatlami keshdan olinadi va
# build har safar scikit-learn/numpy ni qaytadan o'rnatmaydi.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Root ostida ishlatmaymiz
RUN useradd --create-home --uid 10001 appuser && chown -R appuser:appuser /app
USER appuser

# Hujjat uchun; haqiqiy portni Render $PORT orqali beradi
EXPOSE 10000

# $PORT ni Render beradi, shuning uchun uni kengaytiradigan shell kerak —
# to'g'ridan-to'g'ri exec shaklida uvicorn portni "$PORT" degan satr sifatida
# olib yiqilardi. Lokalda $PORT bo'lmasa 10000.
#
# `exec` SHART: usiz uvicorn /bin/sh ning bolasi bo'lib qoladi va PID 1 — sh.
# Render qayta deploy paytida SIGTERM ni PID 1 ga yuboradi, sh esa uni
# uzatmaydi — natijada uvicorn "graceful shutdown" qilmay, 30 soniyadan keyin
# majburan o'ldiriladi (ochiq so'rovlar uziladi). `exec` bilan uvicorn sh ning
# o'rniga PID 1 bo'ladi va signalni o'zi oladi.
CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}"]
