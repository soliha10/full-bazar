#!/bin/sh
set -e

CERT="/etc/letsencrypt/live/bazarcom.online/fullchain.pem"

if [ -f "$CERT" ]; then
    echo "[nginx] SSL cert found — enabling HTTPS"
    cp /etc/nginx/nginx.prod.conf /etc/nginx/conf.d/default.conf
else
    echo "[nginx] No SSL cert — running HTTP only on port 80"
    # default.conf is already the HTTP-only config (set at build time by Dockerfile)
fi

exec nginx -g "daemon off;"
