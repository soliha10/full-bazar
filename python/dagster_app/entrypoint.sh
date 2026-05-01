#!/bin/sh
set -e
mkdir -p "$DAGSTER_HOME"
if [ ! -f "$DAGSTER_HOME/dagster.yaml" ]; then
    cp /app/dagster_config.yaml "$DAGSTER_HOME/dagster.yaml"
fi
exec "$@"
