#!/usr/bin/env bash
# Toza Ubuntu serverni bir marta tayyorlaydi (root sifatida):
#   Docker, firewall, swap, avtomatik xavfsizlik yangilanishlari, repo, cron.
# Qayta ishga tushirsa ham zarar qilmaydi.
set -euo pipefail

REPO_URL=${REPO_URL:-https://github.com/soliha10/full-bazar.git}
REPO=/opt/full-bazar

export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -yq ca-certificates curl git rsync ufw fail2ban unattended-upgrades

# ── Docker ──────────────────────────────────────────────────────────────────
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
cat >/etc/docker/daemon.json <<'JSON'
{ "log-driver": "json-file", "log-opts": { "max-size": "20m", "max-file": "3" } }
JSON
systemctl restart docker

# ── Firewall: faqat SSH va veb ──────────────────────────────────────────────
# Diqqat: Docker o'zi ochgan portlar ufw ni chetlab o'tadi — shuning uchun
# Postgres docker-compose.yml da faqat 127.0.0.1 ga bog'langan.
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

# ── SSH: faqat kalit bilan ──────────────────────────────────────────────────
if [ -s /root/.ssh/authorized_keys ]; then
  cat >/etc/ssh/sshd_config.d/10-bazar.conf <<'CONF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
CONF
  systemctl reload ssh || systemctl reload sshd
fi
systemctl enable --now fail2ban

# ── Swap (skreyperlar va npm build xotira cho'qqisi uchun) ──────────────────
if ! swapon --show | grep -q .; then
  fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

timedatectl set-timezone Asia/Tashkent

# ── Repo ────────────────────────────────────────────────────────────────────
if [ ! -d "$REPO/.git" ]; then
  git clone "$REPO_URL" "$REPO"
fi
mkdir -p /var/www/bazarcom /var/lib/bazar/data /var/log/bazar

# Narxlar va xususiyatlar jadvali — Dagster da (deploy/dagster/definitions.py),
# cron emas. Eski cron fayli qolgan bo'lsa ikki marta yig'ilmasin:
rm -f /etc/cron.d/bazar
mkdir -p /var/lib/bazar/data/models
cat >/etc/logrotate.d/bazar <<'ROT'
/var/log/bazar/*.log {
  weekly
  rotate 8
  compress
  missingok
  notifempty
}
ROT

echo "Tayyor. Endi $REPO/deploy/.env ni to'ldiring va $REPO/deploy/deploy.sh ni ishga tushiring."
