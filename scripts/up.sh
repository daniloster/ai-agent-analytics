#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Building image..."
docker-compose build

echo "Starting..."
docker-compose run --rm --service-ports claude-dev bash -c '
  # Install deps if needed
  if [ -f /workspace/package.json ] && [ ! -f /workspace/node_modules/.bin/vite ]; then
    echo "Installing dependencies..."
    npm install --prefix /workspace
  fi

  # Start dev server in background
  if [ -f /workspace/package.json ]; then
    pkill -f "node.*vite" 2>/dev/null || true
    cd /workspace && npm run dev >> /tmp/vite.log 2>&1 &
    echo "Dev server started (logs: /tmp/vite.log)"
  fi

  cd /workspace && claude --dangerously-skip-permissions
'
