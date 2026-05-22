#!/bin/sh
set -e

mkdir -p /mlruns
exec "$@"
