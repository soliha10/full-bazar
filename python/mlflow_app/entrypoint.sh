#!/bin/sh
set -e

MLFLOW_PG_HOST="${MLFLOW_PG_HOST:-postgres}"
MLFLOW_PG_USER="${MLFLOW_PG_USER:-postgres}"
MLFLOW_PG_PASSWORD="${MLFLOW_PG_PASSWORD:-postgres}"
MLFLOW_PG_DB="${MLFLOW_PG_DB:-mlflow}"

echo "[mlflow] waiting for postgres at ${MLFLOW_PG_HOST}..."
until python3 -c "
import psycopg2
conn = psycopg2.connect(
    host='${MLFLOW_PG_HOST}',
    user='${MLFLOW_PG_USER}',
    password='${MLFLOW_PG_PASSWORD}',
    dbname='postgres'
)
conn.autocommit = True
cur = conn.cursor()
cur.execute(\"SELECT 1 FROM pg_database WHERE datname = '${MLFLOW_PG_DB}'\")
if not cur.fetchone():
    cur.execute('CREATE DATABASE ${MLFLOW_PG_DB}')
    print('[mlflow] created database ${MLFLOW_PG_DB}')
conn.close()
" 2>/dev/null; do
    sleep 3
done
echo "[mlflow] postgres ready"

exec "$@"
