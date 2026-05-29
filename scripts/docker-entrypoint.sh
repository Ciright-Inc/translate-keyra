#!/bin/sh
set -e

export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export PORT="${PORT:-3000}"

echo "[entrypoint] PORT=${PORT} — waiting for database and applying migrations…"

if [ "${SKIP_DB_MIGRATE}" != "true" ] && [ -f "./scripts/migrate.mjs" ]; then
  node ./scripts/migrate.mjs
else
  echo "[entrypoint] SKIP_DB_MIGRATE=true or migrate.mjs missing — skipping migrations"
fi

echo "[entrypoint] Starting Next.js server on port ${PORT}…"
exec node server.js
