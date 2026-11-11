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

# ── Ma'lumotlar ─────────────────────────────────────────────────────────────
if changed data/ python/sync_csv.py; then
  echo "[deploy] data/ o'zgardi — narxlar bazaga yozilmoqda"
  ./scrape.sh --sync-only
fi
if changed data/gsmarena_specs.csv python/sync_specs.py; then
  docker compose --profile jobs run --rm -T jobs python python/sync_specs.py
fi

docker image prune -f >/dev/null
echo "[deploy] tayyor"
