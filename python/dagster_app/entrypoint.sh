#!/bin/sh
set -e
mkdir -p "$DAGSTER_HOME"
cp /app/dagster_config.yaml "$DAGSTER_HOME/dagster.yaml"
exec "$@"
