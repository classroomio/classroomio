/**
 * Pushes the **`public` schema DDL** from a `pg_dump` backup into a fresh Postgres database
 * (e.g. [PlanetScale Postgres](https://planetscale.com/docs/postgres/imports/postgres-migrate-dumprestore)).
 * Does **not** load table data (`COPY` / `--data-only` rows).
 *
 * **Custom format** (`.dump` / `-Fc`, default from `db:dump-backup`): `pg_restore --schema-only -n public`,
 * with `--no-publications` / `--no-subscriptions` (Supabase `supabase_realtime` is not on PlanetScale).
 *
 * **Plain SQL** (`.sql`): runs the file with `psql` when it looks like a schema-only dump (no `COPY public.`
 * data blocks). Full plain dumps with data are rejected — re-dump with `-Fc` or `pg_dump --schema-only`.
 *
 * Before push, creates `authenticated` / `anon` roles and a minimal `extensions` schema
 * (`moddatetime`, `gen_random_uuid`) so Supabase-sourced dumps restore on PlanetScale.
 *
 * @example
 * DATABASE_URL="postgres://...@aws.connect.psdb.cloud/..." \
 *   pnpm --filter @cio/db db:push-dump-to-new-db -- packages/db/backups/full-….dump
 *
 * @example
 * pnpm --filter @cio/db db:push-dump-to-new-db -- --dry-run path/to/backup.dump
 *
 * Env:
 * - `DATABASE_URL` — target DB (required unless `--dry-run`).
 * - `PG_RESTORE_BIN` — default `pg_restore`.
 * - `PSQL_BIN` — default `psql`.
 * - `PG_RESTORE_JOBS` — parallel workers for custom-format restore (e.g. `4`).
 * - `PUSH_DUMP_SSLMODE` — override `sslmode` for `pg_restore` / `psql` only (e.g. `require`).
 * - `PGSSLROOTCERT` — path to CA bundle for libpq (alternative to `sslrootcert=system` in the URL).
 *
 * PlanetScale URLs often use `sslmode=verify-full`. Node `postgres` handles that; libpq often does not
 * unless `PGSSLROOTCERT` points at a CA file. This script downgrades to `sslmode=require` for
 * `pg_restore` / `psql` when verify modes are set without a cert path (encrypted, no CA verify).
 */

import 'dotenv/config';

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backupDir = path.resolve(scriptDir, '../../backups');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');
const cleanFirst = args.includes('--clean');
const skipRoles = args.includes('--skip-roles');
const skipSupabaseExtensions = args.includes('--skip-supabase-extensions');
const sslRequireOnly = args.includes('--ssl-require');
const jobsRaw = args.find((argument) => argument.startsWith('--jobs='));
const parallelJobs = jobsRaw ? Number(jobsRaw.slice('--jobs='.length)) : Number(process.env.PG_RESTORE_JOBS ?? 0);

const dumpPathRaw = args.find((argument) => !argument.startsWith('-'));

const databaseUrl = process.env.DATABASE_URL;
const pgRestoreExecutable = process.env.PG_RESTORE_BIN ?? 'pg_restore';
const psqlExecutable = process.env.PSQL_BIN ?? 'psql';

async function main() {
  if (!dumpPathRaw) {
    printUsage();

    return;
  }

  if (!dryRun && !databaseUrl) {
    console.error('Set DATABASE_URL (or pass --dry-run to only generate a SQL preview).');
    printUsage();

    return;
  }

  const resolvedDump = path.isAbsolute(dumpPathRaw) ? dumpPathRaw : path.resolve(process.cwd(), dumpPathRaw);

  let dumpKind: DumpKind;
  try {
    dumpKind = detectDumpKind(resolvedDump);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;

    return;
  }

  console.log('Dump:', resolvedDump);
  console.log('Format:', dumpKind === 'custom' ? 'custom (pg_restore)' : 'plain SQL (psql)');

  try {
    if (dryRun) {
      mkdirSync(backupDir, { recursive: true });
      const previewFile = path.join(backupDir, 'push-dump-to-new-db-preview.sql');

      if (dumpKind === 'custom') {
        extractCustomFormatSchemaPreview(resolvedDump, previewFile);
      } else {
        writeFileSync(previewFile, readFileSync(resolvedDump, 'utf8'));
      }

      console.log('Dry run: wrote preview SQL to', previewFile);
      console.log('Apply manually with psql, or re-run without --dry-run and DATABASE_URL set.');

      return;
    }

    await ensureTargetReady(databaseUrl!, force);

    if (!skipRoles) {
      await ensureRlsRoles(databaseUrl!);
    }

    if (!skipSupabaseExtensions) {
      await ensureSupabaseExtensionCompat(databaseUrl!);
    }

    const pgCliDatabaseUrl = connectionStringForPgCli(databaseUrl!, sslRequireOnly);

    if (dumpKind === 'custom') {
      pushCustomFormatSchema(resolvedDump, pgCliDatabaseUrl);
    } else {
      pushPlainSchemaSql(resolvedDump, pgCliDatabaseUrl);
    }
  } catch (error) {
    console.error('Push dump to new DB failed:', error);
    process.exitCode = 1;
  }
}

type DumpKind = 'custom' | 'plain';

function printUsage() {
  console.error(`Usage:
  DATABASE_URL="postgres://..." pnpm --filter @cio/db db:push-dump-to-new-db -- <dump.dump|.sql>

  Flags:
    --dry-run     Write SQL preview to packages/db/backups/push-dump-to-new-db-preview.sql
    --force       Push even when public already has tables
    --clean       Drop existing public objects before push (pg_restore --clean --if-exists)
    --skip-roles  Do not create authenticated / anon roles before push
    --skip-supabase-extensions  Skip creating extensions.moddatetime / gen_random_uuid stubs
    --jobs=N      Parallel pg_restore workers (custom .dump only)
    --ssl-require Force sslmode=require for pg_restore/psql (same as the default when no CA file)`);

  process.exitCode = 1;
}

function detectDumpKind(dumpFilePath: string): DumpKind {
  const header = readFileSync(dumpFilePath).subarray(0, 5).toString();

  if (header === 'PGDMP') {
    return 'custom';
  }

  const plainText = readFileSync(dumpFilePath, 'utf8');

  if (/\bCOPY\s+public\./i.test(plainText)) {
    throw new Error(
      'Plain SQL dump contains public COPY data blocks. Use a custom-format .dump from db:dump-backup, or pg_dump --schema-only -n public.'
    );
  }

  return 'plain';
}

async function ensureTargetReady(connectionString: string, allowExistingTables: boolean) {
  const sql = postgres(connectionString, { max: 1 });

  try {
    const existingTables = await sql<{ tablename: string }[]>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    if (existingTables.length === 0) {
      console.log('Target public schema is empty.');

      return;
    }

    if (!allowExistingTables) {
      throw new Error(
        `Target already has ${existingTables.length} table(s) in public (e.g. ${existingTables[0]?.tablename}). ` +
          'Use --force to push anyway, or provision a fresh database branch.'
      );
    }

    console.warn(
      `--force: continuing despite ${existingTables.length} existing public table(s).`,
      cleanFirst ? ' (--clean will drop objects first)' : ''
    );
  } finally {
    await sql.end();
  }
}

/**
 * Supabase dumps reference `extensions.moddatetime` triggers and sometimes `extensions.gen_random_uuid`.
 * PlanetScale has no `extensions` schema; create minimal compatible stubs before pg_restore.
 */
async function ensureSupabaseExtensionCompat(connectionString: string) {
  const sql = postgres(connectionString, { max: 1 });

  try {
    await sql.unsafe(`
      CREATE SCHEMA IF NOT EXISTS extensions;

      CREATE OR REPLACE FUNCTION extensions.gen_random_uuid()
      RETURNS uuid
      LANGUAGE sql
      PARALLEL SAFE
      AS $$ SELECT gen_random_uuid(); $$;

      CREATE OR REPLACE FUNCTION extensions.moddatetime()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$;

      CREATE OR REPLACE FUNCTION extensions.moddatetime(column_name text)
      RETURNS trigger
      LANGUAGE plpgsql
      AS $$
      BEGIN
        IF column_name = 'updated_at' THEN
          NEW.updated_at = NOW();
        ELSE
          NEW := jsonb_populate_record(NEW, jsonb_build_object(column_name, NOW()));
        END IF;
        RETURN NEW;
      END;
      $$;
    `);

    console.log('Ensured extensions schema (moddatetime, gen_random_uuid) for Supabase-compatible dumps');
  } finally {
    await sql.end();
  }
}

async function ensureRlsRoles(connectionString: string) {
  const sql = postgres(connectionString, { max: 1 });

  try {
    const authenticatedExists = await sql`SELECT 1 FROM pg_roles WHERE rolname = 'authenticated'`;
    if (authenticatedExists.length === 0) {
      await sql`CREATE ROLE authenticated`;
      console.log('Created role: authenticated');
    } else {
      console.log('Role already exists: authenticated');
    }

    const anonExists = await sql`SELECT 1 FROM pg_roles WHERE rolname = 'anon'`;
    if (anonExists.length === 0) {
      await sql`CREATE ROLE anon`;
      console.log('Created role: anon');
    } else {
      console.log('Role already exists: anon');
    }
  } finally {
    await sql.end();
  }
}

function pushCustomFormatSchema(dumpFilePath: string, connectionString: string) {
  const restoreArgs = [
    '--dbname',
    connectionString,
    '--schema-only',
    '--no-owner',
    '--no-privileges',
    '--no-publications',
    '--no-subscriptions',
    '--exit-on-error',
    '-n',
    'public',
    ...(cleanFirst ? ['--clean', '--if-exists'] : []),
    ...(parallelJobs > 0 ? ['--jobs', String(parallelJobs)] : []),
    '--verbose',
    dumpFilePath
  ];

  console.log('Running:', pgRestoreExecutable, restoreArgs.filter((argument) => !argument.includes('://')).join(' '));

  const result = spawnSync(pgRestoreExecutable, restoreArgs, { stdio: 'inherit' });

  if (result.error) {
    throw new Error(`pg_restore spawn failed: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`pg_restore exited with status ${result.status ?? 'unknown'}`);
  }

  console.log('Public schema push finished.');
  console.log(
    'Next: run pnpm --filter @cio/db db:setup --skip-schema-sync (roles + reference seed), then data restores as needed.'
  );
}

function pushPlainSchemaSql(dumpFilePath: string, connectionString: string) {
  console.log('Running:', psqlExecutable, '<DATABASE_URL> -v ON_ERROR_STOP=1 -f', dumpFilePath);

  const result = spawnSync(psqlExecutable, [connectionString, '-v', 'ON_ERROR_STOP=1', '-f', dumpFilePath], {
    stdio: 'inherit'
  });

  if (result.error) {
    throw new Error(`psql spawn failed: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`psql exited with status ${result.status ?? 'unknown'}`);
  }

  console.log('Public schema SQL applied.');
}

function extractCustomFormatSchemaPreview(dumpFilePath: string, previewFilePath: string) {
  const extractArgs = [
    '--schema-only',
    '--no-owner',
    '--no-privileges',
    '-n',
    'public',
    '-f',
    previewFilePath,
    dumpFilePath
  ];

  const result = spawnSync(pgRestoreExecutable, extractArgs, { encoding: 'utf8' });

  if (result.error) {
    throw new Error(`pg_restore preview spawn failed: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(
      `pg_restore preview failed: ${(result.stderr ?? '').trim() || `exit ${result.status}`}. ` +
        'Ensure pg_restore major version matches the dump.'
    );
  }
}

/**
 * libpq (`pg_restore`, `psql`) does not use Node's TLS stack. `verify-full` without a CA file makes
 * libpq look for `~/.postgresql/root.crt`. Older libpq also treats `sslrootcert=system` as a path.
 * Use `sslmode=require` unless the URL or `PGSSLROOTCERT` supplies a real certificate file.
 */
function connectionStringForPgCli(rawUrl: string, useSslRequireOnly: boolean): string {
  const url = new URL(rawUrl.replace(/^postgres:/, 'postgresql:'));

  const envSslMode = process.env.PUSH_DUMP_SSLMODE?.trim();
  if (envSslMode) {
    applyPgCliSslMode(url, envSslMode);
    console.log(`pg_restore/psql: using PUSH_DUMP_SSLMODE=${envSslMode}`);

    return url.toString();
  }

  if (useSslRequireOnly) {
    applyPgCliSslMode(url, 'require');
    console.log('pg_restore/psql: using sslmode=require (--ssl-require)');

    return url.toString();
  }

  const sslmode = url.searchParams.get('sslmode') ?? '';
  const rootCertPath = resolvePgCliRootCertPath(url);

  if (rootCertPath) {
    url.searchParams.set('sslrootcert', rootCertPath);
    if (!sslmode) {
      url.searchParams.set('sslmode', 'verify-full');
    }

    console.log(`pg_restore/psql: using sslrootcert=${rootCertPath}`);

    return url.toString();
  }

  const needsEncryptedConnection =
    sslmode === 'verify-full' ||
    sslmode === 'verify-ca' ||
    sslmode === 'require' ||
    url.hostname.endsWith('.psdb.cloud');

  if (needsEncryptedConnection && sslmode !== 'require') {
    applyPgCliSslMode(url, 'require');
    console.log(
      'pg_restore/psql: using sslmode=require (libpq has no CA file; connection is still TLS-encrypted). ' +
        'Set PGSSLROOTCERT or PUSH_DUMP_SSLMODE=verify-full to verify the server certificate.'
    );
  }

  return url.toString();
}

function applyPgCliSslMode(url: URL, sslmode: string) {
  url.searchParams.set('sslmode', sslmode);

  if (sslmode === 'require' || sslmode === 'prefer' || sslmode === 'disable') {
    url.searchParams.delete('sslrootcert');
  }
}

function resolvePgCliRootCertPath(url: URL): string | null {
  const envPath = process.env.PGSSLROOTCERT?.trim();
  if (envPath) {
    return envPath;
  }

  const paramPath = url.searchParams.get('sslrootcert')?.trim();
  if (!paramPath || paramPath === 'system') {
    return null;
  }

  return paramPath;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
