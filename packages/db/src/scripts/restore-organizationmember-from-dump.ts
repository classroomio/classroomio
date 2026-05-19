/**
 * Insert `public.organizationmember` **rows from a dump** into the DB on `DATABASE_URL` **only when
 * missing** relative to existing data:
 * - skip if **`id`** already exists;
 * - skip if **`(organization_id, profile_id)`** already exists (**`profile_id IS NOT NULL`**, aligned with
 *   partial unique `organizationmember_org_profile_unique`);
 * - skip if **`(organization_id, email)`** already exists (**`email IS NOT NULL`**, aligned with
 *   `organizationmember_org_email_unique`).
 *
 * **Custom format** (`.dump` / `-Fc`): `pg_restore --data-only -t organizationmember`.
 * **Plain SQL** (`-Fp` `.sql`): finds `COPY ... organizationmember ... FROM stdin` block.
 *
 * Usage:
 *   DATABASE_URL="postgres://..." pnpm exec tsx src/scripts/restore-organizationmember-from-dump.ts path/to/backup.dump
 *   pnpm exec tsx src/scripts/restore-organizationmember-from-dump.ts --dry-run path/to/backup.sql
 *
 * Requires existing `organization`, `profile` (when `profile_id` set), and `role` rows for FKs.
 *
 * Env:
 * - `DATABASE_URL` — target DB (required unless `--dry-run`).
 * - `PG_RESTORE_BIN` — default `pg_restore`.
 * - `PSQL_BIN` — default `psql`.
 */

import 'dotenv/config';

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backupDir = path.resolve(scriptDir, '../../backups');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const dumpPathRaw = args.find((argument) => !argument.startsWith('-'));

const databaseUrl = process.env.DATABASE_URL;
const pgRestoreExecutable = process.env.PG_RESTORE_BIN ?? 'pg_restore';
const psqlExecutable = process.env.PSQL_BIN ?? 'psql';

/** Column order matches `organizationmember` in schema / typical pg_dump. */
const prelude = `
BEGIN;

CREATE TEMP TABLE _organizationmember_import (
  id bigint NOT NULL PRIMARY KEY,
  organization_id uuid NOT NULL,
  role_id bigint NOT NULL,
  profile_id uuid,
  email text,
  verified boolean,
  created_at timestamptz NOT NULL
);

`;

const mergeSql = `
INSERT INTO public.organizationmember (
  id,
  organization_id,
  role_id,
  profile_id,
  email,
  verified,
  created_at
)
SELECT
  i.id,
  i.organization_id,
  i.role_id,
  i.profile_id,
  i.email,
  COALESCE(i.verified, false),
  i.created_at
FROM _organizationmember_import i
WHERE NOT EXISTS (SELECT 1 FROM public.organizationmember om WHERE om.id = i.id)
AND (
  i.profile_id IS NULL
  OR NOT EXISTS (
    SELECT 1
    FROM public.organizationmember om
    WHERE om.organization_id = i.organization_id
      AND om.profile_id IS NOT NULL
      AND om.profile_id = i.profile_id
  )
)
AND (
  i.email IS NULL
  OR NOT EXISTS (
    SELECT 1
    FROM public.organizationmember om
    WHERE om.organization_id = i.organization_id
      AND om.email IS NOT NULL
      AND om.email = i.email
  )
);

SELECT setval(
  pg_get_serial_sequence('public.organizationmember', 'id'),
  COALESCE((SELECT MAX(id)::bigint FROM public.organizationmember), 1),
  true
);

COMMIT;
`;

function renameCopyTargets(body: string) {
  let out = body;
  out = out.replace(/\bCOPY\s+public\.organizationmember\b/i, 'COPY _organizationmember_import');
  out = out.replace(/\bCOPY\s+organizationmember\b/i, 'COPY _organizationmember_import');

  return out;
}

function slicePlainCopyOrganizationMember(fileText: string) {
  const copyPublic = /\bCOPY\s+public\.organizationmember\b/i.exec(fileText);
  const copyBare = /\bCOPY\s+organizationmember\b/i.exec(fileText);

  const matchIndex = copyPublic?.index ?? copyBare?.index;
  if (matchIndex === undefined) {
    return null;
  }

  const fromStdinIdx = fileText.indexOf('FROM stdin;', matchIndex);

  if (fromStdinIdx === -1) {
    return null;
  }

  let lineEnd = fileText.indexOf('\n', fromStdinIdx + 'FROM stdin;'.length);

  if (lineEnd === -1) {
    return null;
  }

  const terminator = /\n\\\.\s*(?:\n|\r?\n|$)/;

  const dataRegion = fileText.slice(lineEnd);
  const terminatorMatch = terminator.exec(dataRegion);

  if (!terminatorMatch) {
    return null;
  }

  const terminatorEndAbs = lineEnd + terminatorMatch.index + terminatorMatch[0].length;

  return fileText.slice(matchIndex, terminatorEndAbs);
}

function pgRestoreOrganizationMemberExtract(dumpFilePath: string) {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'organizationmember-restore-'));
  const extractedPath = path.join(tempDir, 'organizationmember.sql');

  try {
    const flags = spawnSync(
      pgRestoreExecutable,
      [
        '--data-only',
        '--no-owner',
        '--no-privileges',
        '-n',
        'public',
        '-t',
        'organizationmember',
        '-f',
        extractedPath,
        dumpFilePath
      ],
      { encoding: 'utf8' }
    );

    if (flags.status !== 0) {
      console.error(pgRestoreExecutable, '--data-only extraction failed:', (flags.stderr ?? '').trim() || flags.status);

      return null;
    }

    return renameCopyTargets(readFileSync(extractedPath, 'utf8'));
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function printUsage() {
  console.error(`Usage:
  DATABASE_URL="postgres://..." pnpm exec tsx src/scripts/restore-organizationmember-from-dump.ts <dump.dump|.sql>

  Flags:
    --dry-run   Write merged SQL preview to packages/db/backups/restore-organizationmember-preview.sql`);

  process.exitCode = 1;
}

function main() {
  if (!dumpPathRaw) {
    console.error('Missing dump file path.');
    printUsage();

    return;
  }

  if (!dryRun && !databaseUrl) {
    console.error('Set DATABASE_URL (or pass --dry-run to only generate SQL preview).');
    printUsage();

    return;
  }

  const resolvedDump = path.isAbsolute(dumpPathRaw) ? dumpPathRaw : path.resolve(process.cwd(), dumpPathRaw);

  let organizationMemberChunk: string | null;

  if (resolvedDump.endsWith('.sql')) {
    const text = readFileSync(resolvedDump, 'utf8');
    organizationMemberChunk = slicePlainCopyOrganizationMember(text);
    if (organizationMemberChunk) {
      organizationMemberChunk = renameCopyTargets(organizationMemberChunk);
    }
  } else {
    organizationMemberChunk = pgRestoreOrganizationMemberExtract(resolvedDump);
  }

  if (!organizationMemberChunk) {
    console.error(
      'Could not extract organizationmember data. Check:',
      `\n - Table exists in backup as public.organizationmember`,
      `\n - For custom dumps: pg_restore -l "${resolvedDump}" | grep organizationmember`,
      `\n - pg_restore major version matches the dump`
    );
    process.exitCode = 1;

    return;
  }

  const fullScript = prelude + organizationMemberChunk + mergeSql;

  mkdirSync(backupDir, { recursive: true });

  const previewFile = path.join(backupDir, 'restore-organizationmember-preview.sql');
  writeFileSync(previewFile, fullScript, 'utf8');
  console.log('Wrote SQL preview:', previewFile);

  if (dryRun) {
    console.log('Dry run: skipping psql execution.');

    return;
  }

  const invoke = spawnSync(psqlExecutable, [databaseUrl!, '-v', 'ON_ERROR_STOP=1', '-f', previewFile], {
    stdio: 'inherit'
  });

  if (invoke.error) {
    console.error('psql spawn failed:', invoke.error.message);
    process.exitCode = 1;

    return;
  }

  if (invoke.status !== 0) {
    process.exitCode = invoke.status ?? 1;

    return;
  }

  console.log('Done: organizationmember rows from dump were merged (missing-only) via', previewFile);
}

main();
