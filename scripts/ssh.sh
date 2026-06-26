#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

CONTAINER=$(docker ps \
  --filter "label=com.docker.compose.project=ai-agent-analytics" \
  --filter "label=com.docker.compose.service=claude-dev" \
  -q | head -1)

if [ -z "$CONTAINER" ]; then
  echo "No running container found for claude-dev. Run ./scripts/up.sh first." >&2
  exit 1
fi

docker exec -it "$CONTAINER" bash
