/**
 * Copy `public.lesson_section` **data** from a `pg_dump` backup into **live** `public.course_section`
 * on `DATABASE_URL` (UPSERT on `id`).
 *
 * **Custom format** (`.dump` / `-Fc`): uses `pg_restore --data-only -t lesson_section` (needs version
 * compatible with the dump, same as `pg_dump`).
 *
 * **Plain SQL** (`-Fp` `.sql`): scans for a `COPY ... lesson_section ... FROM stdin` block.
 *
 * Usage:
 *   pnpm --filter @cio/db db:restore-lesson-section-from-dump -- path/to/backup.dump
 *   pnpm exec tsx src/scripts/restore-lesson-section-from-dump.ts --dry-run path/to/backup.sql
 *
 * Workflow: If `pnpm db migrate` halted on FK errors because `course_section` had no rows yet, restore
 * sections from your dump with this script, then run `pnpm db migrate` again—the migration uses conditional
 * `DO` blocks that add missing FKs when referenced ids exist.
 *
 * Env:
 * - `DATABASE_URL` — target DB (required unless `--dry-run`).
 * - `PG_RESTORE_BIN` — `pg_restore` binary (default `pg_restore`).
 * - `PSQL_BIN` — `psql` binary (default `psql`).
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

const prelude = `
BEGIN;
CREATE TEMP TABLE _lesson_section_import (
  id uuid NOT NULL PRIMARY KEY,
  created_at timestamptz NOT NULL,
  updated_at timestamptz,
  title varchar,
  "order" bigint,
  course_id uuid
);

`;

const mergeSql = `
INSERT INTO public.course_section (id, created_at, updated_at, title, "order", course_id)
SELECT id, created_at, updated_at, title, "order", course_id
FROM _lesson_section_import
ON CONFLICT (id) DO UPDATE SET
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at,
  title = EXCLUDED.title,
  "order" = EXCLUDED."order",
  course_id = EXCLUDED.course_id;

COMMIT;
`;

function renameCopyTargets(body: string) {
  let out = body;
  out = out.replace(/\bCOPY\s+public\.lesson_section\b/i, 'COPY _lesson_section_import');
  out = out.replace(/\bCOPY\s+lesson_section\b/i, 'COPY _lesson_section_import');

  return out;
}

/** Plain-format dump: one COPY ... lesson_section ... FROM stdin; … \\. block */
function slicePlainCopyLessonSection(fileText: string) {
  const copyPublic = /\bCOPY\s+public\.lesson_section\b/i.exec(fileText);
  const copyBare = /\bCOPY\s+lesson_section\b/i.exec(fileText);

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

  /** First line after DATA is first row; terminator is a line `\`. */
  const terminator = /\n\\\.\s*(?:\n|\r?\n|$)/;

  const dataRegion = fileText.slice(lineEnd);
  const terminatorMatch = terminator.exec(dataRegion);

  if (!terminatorMatch) {
    return null;
  }

  const terminatorEndAbs = lineEnd + terminatorMatch.index + terminatorMatch[0].length;

  return fileText.slice(matchIndex, terminatorEndAbs);
}

function pgRestoreLessonSectionExtract(dumpFilePath: string) {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'lesson-section-restore-'));
  const extractedPath = path.join(tempDir, 'lesson_section.sql');

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
        'lesson_section',
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
  DATABASE_URL="postgres://..." pnpm exec tsx src/scripts/restore-lesson-section-from-dump.ts <dump.dump|.sql>

  Flags:
    --dry-run   Write merged SQL preview to packages/db/backups/restore-lesson-section-preview.sql`);

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

  let lessonSectionChunk: string | null;

  if (resolvedDump.endsWith('.sql')) {
    const text = readFileSync(resolvedDump, 'utf8');
    lessonSectionChunk = slicePlainCopyLessonSection(text);
    if (lessonSectionChunk) {
      lessonSectionChunk = renameCopyTargets(lessonSectionChunk);
    }
  } else {
    lessonSectionChunk = pgRestoreLessonSectionExtract(resolvedDump);
  }

  if (!lessonSectionChunk) {
    console.error(
      'Could not extract lesson_section data. Check:',
      `\n - Table exists in backup as public.lesson_section`,
      `\n - For custom dumps: pg_restore -l "${resolvedDump}" | grep lesson_section`,
      `\n - pg_restore major version matches the dump`
    );
    process.exitCode = 1;

    return;
  }

  const fullScript = prelude + lessonSectionChunk + mergeSql;

  mkdirSync(backupDir, { recursive: true });

  const previewFile = path.join(backupDir, 'restore-lesson-section-preview.sql');
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

  console.log('Done: lesson_section rows from dump were UPSERT-ed into course_section via', previewFile);
}

main();
