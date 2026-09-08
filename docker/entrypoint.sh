#!/bin/sh
set -e

echo "› Applying database migrations…"
npx prisma migrate deploy

echo "› Seeding baseline data (idempotent)…"
npx prisma db seed || echo "  seed skipped"

echo "› Starting Dagsverket on :${PORT:-3000}"
exec npm run start -- -p "${PORT:-3000}" -H "${HOSTNAME:-0.0.0.0}"
