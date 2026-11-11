#!/usr/bin/env bash
# Serverdan yig'ib bo'lmaydigan do'konlar (asaxiy, olcha — datacenter IP ga
# 403; ozon — haqiqiy Chrome kerak) ni shu kompyuterda yig'ib, repoga push
# qiladi. Push dan keyin GitHub Actions serverga deploy qiladi va deploy.sh
# yangi CSV larni bazaga yozadi.
#
# launchd ishga tushiradi (deploy/uz.bazarcom.mac-scrape.plist):
# dushanba va payshanba 13:00 — sync_csv.py ning 10 kunlik chegarasidan
# ancha oldin. Qo'lda: deploy/mac-scrape.sh
set -uo pipefail
export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin

cd "$(dirname "$0")/.."
echo "=== $(date -Iseconds)"

if [ "$(git branch --show-current)" != main ]; then
  echo "main branch da emas — o'tkazib yuborildi"; exit 0
fi

# Faol gh akkaunti boshqa bo'lishi mumkin — faqat shu repo uchun soliha10
git_auth() {
  git -c credential.helper= \
      -c credential.helper='!f(){ echo username=soliha10; echo "password=$(gh auth token --user soliha10)"; }; f' "$@"
}

git_auth pull --rebase --autostash -q origin main || { echo "git pull yiqildi"; exit 1; }

.venv/bin/python python/run_scrapers.py --local --only asaxiy,olcha --delay 1.5
.venv/bin/python python/scrape_ozon_local.py

files=(data/asaxiy_products.* data/olcha_products.* data/ozon_products.*)
if git diff --quiet -- "${files[@]}"; then
  echo "o'zgarish yo'q"; exit 0
fi
# Faqat shu fayllar — foydalanuvchining boshqa staged o'zgarishlari kirmasin
git add -- "${files[@]}"
git commit -q -m "chore(data): asaxiy, olcha, ozon yangilandi (avtomatik)" -- "${files[@]}"
git_auth push -q origin main && echo "push qilindi: $(git rev-parse --short HEAD)"
