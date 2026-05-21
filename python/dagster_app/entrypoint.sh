#!/bin/sh
set -e
mkdir -p "$DAGSTER_HOME"
cp /app/dagster_config.yaml "$DAGSTER_HOME/dagster.yaml"

echo "[dagster] waiting for postgres..."
until python3 -c "
import psycopg2, os
conn = psycopg2.connect(os.environ.get('DAGSTER_DB_URL', 'postgresql://postgres:postgres@postgres:5432/dagster_db'))
conn.close()
" 2>/dev/null; do
    sleep 3
done
echo "[dagster] postgres ready"

exec "$@"
