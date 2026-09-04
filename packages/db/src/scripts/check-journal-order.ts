import fs from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const migrationsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../migrations');

interface JournalEntry {
  idx: number;
  when: number;
  tag: string;
}

function readEntries(path: string): JournalEntry[] {
  if (!fs.existsSync(path)) return [];

  return (JSON.parse(fs.readFileSync(path, 'utf8')) as { entries?: JournalEntry[] }).entries ?? [];
}

/**
 * drizzle applies only journal entries newer than the newest one already
 * applied, so an entry dated at or before one that precedes it in the journal
 * is silently skipped — as is every entry authored before a future-dated one.
 *
 * Only entries absent from `baseEntries` are checked: existing history may
 * contain inversions that predate this rule, and rewriting their timestamps
 * would change hashes of migrations that have already run.
 */
export function findJournalOrderProblems(
  headEntries: JournalEntry[],
  baseEntries: JournalEntry[],
  now: number
): string[] {
  const baseTags = new Set(baseEntries.map((entry) => entry.tag));
  const problems: string[] = [];

  headEntries.forEach((entry, index) => {
    if (baseTags.has(entry.tag)) return;

    const precedingMax = Math.max(0, ...headEntries.slice(0, index).map((preceding) => preceding.when));

    if (entry.when <= precedingMax) {
      problems.push(
        `${entry.tag}: when=${entry.when} is not newer than an earlier entry (${precedingMax}); drizzle would skip it`
      );
    }

    if (entry.when > now) {
      problems.push(
        `${entry.tag}: when=${entry.when} is in the future; every migration authored before then would be skipped`
      );
    }
  });

  return problems;
}

const invokedDirectly = fileURLToPath(import.meta.url) === resolve(process.argv[1] ?? '');

if (invokedDirectly) {
  const basePath = process.argv[2];

  if (!basePath) {
    console.error('Usage: tsx src/scripts/check-journal-order.ts <base-journal.json>');
    process.exit(1);
  }

  const headEntries = readEntries(resolve(migrationsDir, 'meta/_journal.json'));
  const baseEntries = readEntries(basePath);
  const added = headEntries.filter((entry) => !new Set(baseEntries.map((e) => e.tag)).has(entry.tag));

  if (added.length === 0) {
    console.log('no new journal entries');
    process.exit(0);
  }

  const problems = findJournalOrderProblems(headEntries, baseEntries, Date.now());

  if (problems.length > 0) {
    problems.forEach((problem) => console.error(problem));
    process.exit(1);
  }

  console.log(`ok: ${added.map((entry) => entry.tag).join(', ')}`);
}
