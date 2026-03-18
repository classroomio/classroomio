#!/bin/sh
set -e

if [ "${SKIP_DB_SETUP}" = "true" ]; then
  echo "Skipping database setup (SKIP_DB_SETUP=true)."
else
  echo "Running database setup..."
  pnpm --filter @cio/db db:setup
  echo "Database setup complete."
fi

echo "Starting API..."
exec pnpm --filter @cio/api start
