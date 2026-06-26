#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

docker-compose down --remove-orphans 2>/dev/null || true
docker-compose ps -q 2>/dev/null | xargs -r docker wait 2>/dev/null || true
