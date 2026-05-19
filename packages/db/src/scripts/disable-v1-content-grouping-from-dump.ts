/**
 * Reads **`course`** table data from a **legacy** Postgres dump (before `course.version` was dropped)
 * and disables content grouping for former **V1** courses on the live DB (`DATABASE_URL`).
 *
 * Legacy model (see commented `0000_stale_storm.sql` and `DROP COLUMN "version"` in
 * `0003_fancy_harry_osborn.sql`):
 * - Column **`version`** had type **`"COURSE_VERSION"`** enum with values **`V1`** and **`V2`**.
 *
 * App stores grouping in **`course.metadata` → `isContentGroupingEnabled`**. This script sets
 * **`metadata.isContentGroupingEnabled = false`** for every course id whose dump row has **`version = V1`**.
 * Rows with **`V2`** or other values are unchanged.
 *
 * **Your dump must still contain the `version` column** (pg_dump from before that migration, or a
 * full schema+data backup from that era). Dumps taken after `version` was dropped cannot be used—
 * the script exits with a clear error if `COPY ... course (...)` has no `version` column.
 *
 * **Plain SQL** (`.sql`): finds `COPY public.course` / `COPY course` with column list, parses tab rows.
 * **Custom** (`.dump`): `pg_restore --data-only -t course`.
 *
 * Limitation: COPY rows are split on **tab** boundaries. If a text/json column contains a literal tab,
 * parsing may mis-align; use a plain-format dump from pg_dump defaults (usually fine).
 *
 * Usage:
 *   DATABASE_URL="..." pnpm exec tsx src/scripts/disable-v1-content-grouping-from-dump.ts path/to/backup.sql
 *   pnpm exec tsx src/scripts/disable-v1-content-grouping-from-dump.ts --dry-run path/to/backup.dump
 *
 * Env: `DATABASE_URL`, `PG_RESTORE_BIN`, `PSQL_BIN` (same as other restore scripts).
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function slicePlainCopyCourse(fileText: string) {
  const copyPublic = /\bCOPY\s+public\.course\b/i.exec(fileText);
  const copyBare = /\bCOPY\s+course\b/i.exec(fileText);

  const matchIndex = copyPublic?.index ?? copyBare?.index;
  if (matchIndex === undefined) {
    return null;
  }

  const fromStdinIdx = fileText.indexOf('FROM stdin', matchIndex);
  if (fromStdinIdx === -1) {
    return null;
  }

  let lineEnd = fileText.indexOf('\n', fromStdinIdx);
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

function pgRestoreCourseExtract(dumpFilePath: string) {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'v1-course-copy-'));
  const extractedPath = path.join(tempDir, 'course.sql');

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
        'course',
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

    return readFileSync(extractedPath, 'utf8');
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

/** Parse `COPY ... course ( a, b, "c" ) FROM stdin;` */
function parseCopyColumnList(copyBlock: string): string[] | null {
  const lineEnd = copyBlock.indexOf('\n');
  const firstLine = lineEnd === -1 ? copyBlock : copyBlock.slice(0, lineEnd);

  const withCols = /COPY\s+(?:public\.)?course\s*\(\s*([^)]+)\s*\)\s*FROM\s+stdin\s*;?\s*$/im.exec(firstLine.trim());

  if (!withCols) {
    return null;
  }

  const raw = withCols[1];

  const columns: string[] = [];
  let current = '';
  let inQuote = false;

  for (let index = 0; index < raw.length; index++) {
    const character = raw[index];

    if (character === '"') {
      inQuote = !inQuote;
      current += character;
      continue;
    }

    if (character === ',' && !inQuote) {
      columns.push(stripIdent(current.trim()));
      current = '';

      continue;
    }

    current += character;
  }

  if (current.trim()) {
    columns.push(stripIdent(current.trim()));
  }

  return columns;
}

function stripIdent(identifier: string) {
  return identifier.replace(/^"|"$/g, '');
}

function extractV1CourseIdsFromCopyBlock(copyBlock: string): string[] | null {
  const columns = parseCopyColumnList(copyBlock);

  if (!columns?.length) {
    console.error(
      'Could not parse COPY column list for course. Use a dump where pg_dump included explicit columns, e.g. `COPY public.course (id, …, version, …) FROM stdin;`'
    );

    return null;
  }

  const idIndex = columns.findIndex((columnName) => columnName === 'id');
  const versionIndex = columns.findIndex((columnName) => columnName === 'version');

  if (idIndex === -1) {
    console.error('COPY column list for course has no `id` column.');
    return null;
  }

  if (versionIndex === -1) {
    console.error(
      'COPY column list for course has no `version` column. This script needs a **legacy** dump from before `course.version` was dropped (migration 0003).'
    );

    return null;
  }

  const newlineAfterHeader = copyBlock.indexOf('\n');
  const dataPart = newlineAfterHeader === -1 ? '' : copyBlock.slice(newlineAfterHeader + 1);
  const lines = dataPart.split(/\r?\n/);

  const v1Ids = new Set<string>();

  for (const line of lines) {
    if (line === '\\.') {
      break;
    }

    if (line === '') {
      continue;
    }

    /** Postgres COPY text format: tab-separated; `\N` is null */
    const fields = line.split('\t');
    if (fields.length < Math.max(idIndex, versionIndex) + 1) {
      continue;
    }

    const rawId = fields[idIndex]?.trim() ?? '';
    const rawVersion = fields[versionIndex]?.trim() ?? '';

    if (rawVersion === '\\N' || rawVersion === '') {
      continue;
    }

    const versionNormalized = rawVersion.replace(/^"|"$/g, '').toUpperCase();

    if (versionNormalized !== 'V1') {
      continue;
    }

    if (!UUID_RE.test(rawId)) {
      continue;
    }

    v1Ids.add(rawId);
  }

  return [...v1Ids];
}

function buildUpdateSql(courseIds: string[]) {
  const list = courseIds.map((courseId) => `'${courseId.replace(/'/g, "''")}'`).join(',\n  ');

  return `-- Former COURSE_VERSION = V1 → metadata.isContentGroupingEnabled = false
BEGIN;

UPDATE public.course
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{isContentGroupingEnabled}',
  'false'::jsonb,
  true
)
WHERE id IN (
  ${list}
);

COMMIT;
`;
}

function printUsage() {
  console.error(`Usage:
  DATABASE_URL="postgres://..." pnpm exec tsx src/scripts/disable-v1-content-grouping-from-dump.ts <dump.dump|.sql>

  Flags:
    --dry-run   Write SQL to packages/db/backups/disable-v1-content-grouping-preview.sql only`);

  process.exitCode = 1;
}

function main() {
  if (!dumpPathRaw) {
    console.error('Missing dump file path.');
    printUsage();

    return;
  }

  if (!dryRun && !databaseUrl) {
    console.error('Set DATABASE_URL (or use --dry-run).');
    printUsage();

    return;
  }

  const resolvedDump = path.isAbsolute(dumpPathRaw) ? dumpPathRaw : path.resolve(process.cwd(), dumpPathRaw);

  let copyBlock: string | null;

  if (resolvedDump.endsWith('.sql')) {
    const text = readFileSync(resolvedDump, 'utf8');
    copyBlock = slicePlainCopyCourse(text);
  } else {
    const extracted = pgRestoreCourseExtract(resolvedDump);
    copyBlock = extracted ? slicePlainCopyCourse(extracted) : null;
  }

  if (!copyBlock) {
    console.error('Could not find COPY block for public.course. Try: pg_restore -l your.dump | grep course');
    process.exitCode = 1;

    return;
  }

  const v1Ids = extractV1CourseIdsFromCopyBlock(copyBlock);

  if (v1Ids === null) {
    process.exitCode = 1;

    return;
  }

  if (v1Ids.length === 0) {
    console.log('No courses with version V1 found in dump (or no valid rows). Nothing to update.');

    return;
  }

  console.log(`Found ${v1Ids.length} course id(s) with legacy version V1 in dump.`);

  const sql = buildUpdateSql(v1Ids);

  mkdirSync(backupDir, { recursive: true });
  const previewFile = path.join(backupDir, 'disable-v1-content-grouping-preview.sql');
  writeFileSync(previewFile, sql, 'utf8');
  console.log('Wrote SQL:', previewFile);

  if (dryRun) {
    console.log('Dry run: not executing psql.');

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

  console.log('Done: metadata.isContentGroupingEnabled set to false for V1 courses (where ids exist).');
}

main();
