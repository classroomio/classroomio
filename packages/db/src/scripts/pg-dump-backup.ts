/**
 * Full logical backup of the database into `packages/db/backups/` using `pg_dump`.
 *
 * Requires PostgreSQL client tools (`pg_dump`) on PATH unless `PG_DUMP_BIN` is set.
 *
 * **Server/client major version:** `pg_dump` must match the server's major version or be newer (e.g.
 * PostgreSQL **15** server needs `pg_dump` **15+**, not 14). Postgres.app 14 ships `pg_dump` 14 —
 * upgrade Postgres.app, install `postgresql@15` / `libpq` from Homebrew, or set `PG_DUMP_BIN`.
 *
 * Env:
 * - `DATABASE_URL` — connection string (default source).
 * - `PGDUMP_URL` — overrides `DATABASE_URL` (use Supabase **direct** Postgres `5432` if pooler rejects dump).
 * - `PG_DUMP_BIN` — path to `pg_dump` executable (defaults to `pg_dump` on `PATH`).
 * - `PG_DUMP_FORMAT=plain` — SQL text `.sql`; default is custom `-Fc` `.dump` (`pg_restore` compatible).
 */

import 'dotenv/config';

import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const connectionUrl = process.env.PGDUMP_URL ?? process.env.DATABASE_URL;

if (!connectionUrl) {
  console.error('Set DATABASE_URL (or PGDUMP_URL) to run a backup.');
  process.exitCode = 1;
}

const usePlainSql = process.env.PG_DUMP_FORMAT === 'plain';
const verbose = process.env.PG_DUMP_VERBOSE !== '0';
const pgDumpExecutable = process.env.PG_DUMP_BIN ?? 'pg_dump';

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backupDir = path.resolve(scriptDir, '../../backups');

function versionMismatchHint() {
  return [
    '',
    'If the error mentions server/client version mismatch, use a newer pg_dump (major >= server), e.g.:',
    '  brew install postgresql@15',
    `  PG_DUMP_BIN=$(brew --prefix postgresql@15)/bin/pg_dump pnpm --filter @cio/db db:dump-backup`,
    '(Or upgrade Postgres.app to a bundle that ships PostgreSQL 15+ client tools.)',
    ''
  ].join('\n');
}

function main() {
  if (!connectionUrl) {
    return;
  }

  mkdirSync(backupDir, { recursive: true });

  const outfile = path.join(backupDir, usePlainSql ? `full-${stamp}.sql` : `full-${stamp}.dump`);

  const args = usePlainSql
    ? [...(verbose ? ['-v'] : []), '--dbname', connectionUrl, '-F', 'p', '-f', outfile]
    : [...(verbose ? ['-v'] : []), '--dbname', connectionUrl, '-F', 'c', '-Z', '9', '--file', outfile];

  console.log('Using:', pgDumpExecutable);
  console.log('pg_dump →', outfile);

  const result = spawnSync(pgDumpExecutable, args, { stdio: 'inherit' });

  if (result.error) {
    console.error('pg_dump spawn failed:', result.error.message);
    console.error(versionMismatchHint());
    process.exitCode = 1;

    return;
  }

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    console.error(versionMismatchHint());

    return;
  }

  console.log('Backup finished:', outfile);
}

main();
