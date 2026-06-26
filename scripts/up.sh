#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# On first run, you will be prompted to authenticate via browser.
# Log in with tech_interview2@forgood.ai (Claude Max account).
# Auth is persisted in a named Docker volume (isolated from your personal ~/.claude).
docker-compose run --rm claude-dev claude --dangerously-skip-permissions
