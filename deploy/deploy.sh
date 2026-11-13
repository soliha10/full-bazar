#!/usr/bin/env bash
# main dagi oxirgi holatni serverga chiqaradi. GitHub Actions (deploy.yml) har
# push da SSH orqali chaqiradi; qo'lda ham bo'ladi: /opt/full-bazar/deploy/deploy.sh
#
# Faqat o'zgargan qism qayta quriladi: frontend/ o'zgarmagan bo'lsa sayt
# build qilinmaydi, data/ o'zgarsa narxlar bazaga yoziladi.
set -euo pipefail

REPO=/opt/full-bazar
SITE=/var/www/bazarcom
cd "$REPO"

exec 9>/var/lock/bazar-deploy.lock
flock 9

old=$(git rev-parse HEAD)
git fetch --quiet origin main
git reset --hard --quiet origin/main
new=$(git rev-parse HEAD)
echo "[deploy] ${old:0:7} → ${new:0:7}"

# Yo'llar repo ildiziga nisbatan — pastda `cd deploy` dan keyin ham to'g'ri ishlasin
changed() { [ "$old" != "$new" ] && ! git -C "$REPO" diff --quiet "$old" "$new" -- "$@"; }
first_run=$([ -f "$SITE/index.html" ] && echo no || echo yes)

# ── Frontend ────────────────────────────────────────────────────────────────
if [ "$first_run" = yes ] || [ "${FORCE:-}" = 1 ] || changed frontend/; then
  echo "[deploy] frontend build"
  docker run --rm -v "$REPO/frontend:/app" -w /app node:22-alpine \
    sh -c "npm ci --no-audit --no-fund --loglevel=error && npm run build"
  mkdir -p "$SITE"
  # --delete YO'Q: ochiq turgan eski sahifalar eski hash li chunklarni
  # so'rashda davom etadi. 30 kundan eski assetlar pastda tozalanadi.
  rsync -a frontend/build/ "$SITE/"
  find "$SITE/assets" -type f -mtime +30 -delete 2>/dev/null || true
fi

# ── API, baza, Caddy ────────────────────────────────────────────────────────
cd deploy
docker compose up -d --build --remove-orphans
docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile >/dev/null
# Dagster kodni /repo dan o'qiydi, image o'zgarmasa konteyner qayta ishga
# tushmaydi — yangi definitions.py / skreyperlarni ko'rishi uchun
if changed deploy/dagster/ python/; then
  echo "[deploy] dagster qayta ishga tushirilmoqda"
  docker compose restart dagster-webserver dagster-daemon >/dev/null
fi

# ── Ma'lumotlar ─────────────────────────────────────────────────────────────
# E'lon galereyalari keshi (python/gallery.py): repodagi nusxa serverdagisidan
# yangi bo'lsa olinadi — aks holda server o'zi yig'gan kesh saqlanadi
if changed data/listing_images.csv; then
  cp -pu "$REPO/data/listing_images.csv" /var/lib/bazar/data/listing_images.csv
fi
if changed data/ python/sync_csv.py python/sync/ python/matching.py python/matching_parse.py python/fastapi_app/brands.py; then
  echo "[deploy] data/ yoki sinxronizatsiya kodi o'zgardi — narxlar bazaga yozilmoqda"
  ./scrape.sh --sync-only
fi
if changed data/gsmarena_specs.csv python/sync_specs.py python/sync/specs_sql.py python/sync/specs_report.py; then
  # jobs konteyneri /var/lib/bazar/data dagi CSV ni o'qiydi: repodagi yangi
  # fayl u yerga faqat keyingi narx ishida (Dagster) ko'chirilardi va bu
  # yerdagi yuklash ESKI faylni qayta yozib qo'yardi
  if changed data/gsmarena_specs.csv; then
    cp -p "$REPO/data/gsmarena_specs.csv" /var/lib/bazar/data/gsmarena_specs.csv
  fi
  docker compose --profile jobs run --rm -T jobs python python/sync_specs.py
fi

docker image prune -f >/dev/null
echo "[deploy] tayyor"
