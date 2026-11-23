#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
pnpm exec drizzle-kit generate --name drift >/dev/null 2>&1 || true
node scripts/gen-migrations.mjs >/dev/null
if [ -n "$(git status --porcelain -- src/data/db)" ]; then
  echo "schema.ts e as migrações estão fora de sincronia:"
  git status --short -- src/data/db
  exit 1
fi
echo "migrações em dia"
