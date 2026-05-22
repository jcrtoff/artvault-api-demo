#!/usr/bin/env bash
#
# deploy.local.sh — build and serve a production build of the demo locally.
#
# Runs the same `next build` + `next start` a real deploy would, but bound to
# port 35105 so it can coexist with `npm run dev` (3000) and the local ArtVault
# API (35100). Not part of any production pipeline — see CLAUDE.md charter.
#
# Usage:
#   ./scripts/deploy.local.sh           # build + start
#   ./scripts/deploy.local.sh --no-build # skip build, start existing .next
#
set -euo pipefail

PORT=35105

# Resolve repo root from this script's location so it works from anywhere.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

# The API key / base URL live in .env.local (gitignored). Next loads it
# automatically; we only check it exists so we fail loud instead of serving a
# build that 401s on every ArtVault call.
if [[ ! -f .env.local ]]; then
  echo "error: .env.local not found. Copy .env.example and fill it in:" >&2
  echo "  cp .env.example .env.local" >&2
  exit 1
fi

if [[ "${1:-}" != "--no-build" ]]; then
  echo "==> next build"
  npm run build
fi

echo "==> next start on http://localhost:${PORT}"
exec npx next start --port "${PORT}"
