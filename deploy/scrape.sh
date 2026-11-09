#!/usr/bin/env bash
# Narxlarni yig'ib bazaga yozadi. Cron kuniga 2 marta ishga tushiradi
# (setup-server.sh): 05:00 va 17:00 Toshkent.
#
#   deploy/scrape.sh              — hamma skreyperlar + sinxronizatsiya
#   deploy/scrape.sh --sync-only  — faqat repodagi CSV larni bazaga yozish
#                                   (deploy.sh data/ o'zgarganda chaqiradi)
#
# CSV lar /var/lib/bazar/data da turadi, repoda emas. Repodan faqat mahalliy
# yig'iladigan do'konlar (asaxiy, olcha, ozon — yonida .meta bor) va
# gsmarena_specs.csv olinadi, ular kompyuterda yig'ilib commit qilinadi.
set -euo pipefail

REPO=/opt/full-bazar
DATA=/var/lib/bazar/data
cd "$REPO/deploy"

exec 9>/var/lock/bazar-jobs.lock
flock 9

mkdir -p "$DATA"

# Repodagi .meta (yig'ilgan sana, ISO) serverdagisidan yangi bo'lsa — ko'chiramiz
for meta in "$REPO"/data/*.meta; do
  [ -e "$meta" ] || continue
  name=$(basename "$meta" .meta)
  csv="$REPO/data/$name.csv"
  [ -f "$csv" ] || continue
  if [ ! -f "$DATA/$name.meta" ] || [[ "$(cat "$meta")" > "$(cat "$DATA/$name.meta")" ]]; then
    cp "$csv" "$meta" "$DATA/"
    echo "[data] $name repodan olindi ($(cat "$meta"))"
  fi
done
cp "$REPO/data/gsmarena_specs.csv" "$DATA/"

run() { docker compose --profile jobs run --rm -T jobs "$@"; }

if [ "${1:-}" != "--sync-only" ]; then
  # 0 mahsulot bergan do'kon run_scrapers da FAIL bo'ladi, lekin qolganlarning
  # yangi narxlari baribir bazaga tushishi kerak — shuning uchun `|| true`
  run python python/run_scrapers.py --output /data --delay 0.5 || true
  # chakana GitHub runner IP laridan ochilmasdi, bu serverdan esa ochiladi
  # (2026-11-09 da tekshirilgan). asaxiy va olcha bu yerdan ham 403 beradi —
  # ular ozon bilan birga hali ham kompyuterda yig'iladi.
  run python python/run_scrapers.py --local --only chakana --output /data --delay 1.5 || true
fi

run python python/sync_csv.py
echo "[scrape] tugadi: $(date -Is)"
