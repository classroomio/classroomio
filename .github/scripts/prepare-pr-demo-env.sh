#!/usr/bin/env bash
set -euo pipefail

# Writes minimal .env files for the pr-demo CI job (preview on :4173, API on :3002).

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

SERVER_KEY="${PRIVATE_SERVER_KEY:-$(openssl rand -hex 32)}"
AUTH_SECRET="${BETTER_AUTH_SECRET:-$(openssl rand -hex 32)}"

mkdir -p apps/api apps/dashboard packages/db

cat > apps/api/.env <<EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/classroomio
REDIS_URL=redis://localhost:6379
PUBLIC_SERVER_URL=http://localhost:3002
TRUSTED_ORIGINS=http://localhost:4173
BETTER_AUTH_SECRET=${AUTH_SECRET}
PRIVATE_SERVER_KEY=${SERVER_KEY}
PUBLIC_IS_SELFHOSTED=false
EOF

cat > apps/dashboard/.env <<EOF
PUBLIC_SERVER_URL=http://localhost:3002
PRIVATE_SERVER_URL=http://localhost:3002
PRIVATE_SERVER_KEY=${SERVER_KEY}
PUBLIC_IS_SELFHOSTED=false
EOF

cp packages/db/.env.example packages/db/.env

echo "Prepared API, dashboard, and db env files for PR demo CI."
