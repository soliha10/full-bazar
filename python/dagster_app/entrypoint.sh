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

# Cancel any runs stuck in STARTED state from a previous daemon crash.
# Must run before webserver/daemon so the QueuedRunCoordinator queue is never blocked.
python3 - <<'PYEOF'
try:
    from dagster import DagsterInstance, DagsterRunStatus, RunsFilter
    inst = DagsterInstance.get()
    stuck = inst.get_runs(filters=RunsFilter(statuses=[DagsterRunStatus.STARTED]))
    for run in stuck:
        inst.report_run_canceled(run)
        print(f"[dagster-init] canceled stuck run {run.run_id}", flush=True)
    if stuck:
        print(f"[dagster-init] cleared {len(stuck)} stuck run(s)", flush=True)
except Exception as e:
    print(f"[dagster-init] cleanup skipped: {e}", flush=True)
PYEOF

exec "$@"
