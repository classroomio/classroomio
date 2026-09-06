/**
 * Lists doc pages missing `last_reviewed` frontmatter or older than 90 days.
 * Run by hand: `pnpm docs:check-stale`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const content = resolve(root, 'content/docs');
const STALE_AFTER_DAYS = 90;

function findMdxFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) return findMdxFiles(full);
    return entry.isFile() && entry.name.endsWith('.mdx') ? [full] : [];
  });
}

// Frontmatter here is flat key: value pairs, so a small regex is enough.
// No need for a full YAML parser for one field.
function parseFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (field) data[field[1]] = field[2].trim().replace(/^["']|["']$/g, '');
  }
  return data;
}

// `new Date()` silently rolls over invalid calendar dates (e.g. 2026-02-30
// becomes March 2) instead of rejecting them, so a typo'd date would pass
// as valid. Validate the shape, then confirm the parsed date round-trips
// to the same year/month/day before trusting it.
function daysSince(dateString) {
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  const isValid =
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
  if (!isValid) return null;

  return Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24));
}

const stale = [];

for (const file of findMdxFiles(content)) {
  const data = parseFrontmatter(readFileSync(file, 'utf8'));
  const path = relative(root, file);

  if (!data.last_reviewed) {
    stale.push({ path, reason: 'missing last_reviewed' });
    continue;
  }

  const age = daysSince(data.last_reviewed);
  if (age === null) {
    stale.push({ path, reason: `unparseable last_reviewed: "${data.last_reviewed}"` });
  } else if (age > STALE_AFTER_DAYS) {
    stale.push({ path, reason: `last reviewed ${age} days ago` });
  }
}

if (stale.length === 0) {
  console.log('Nothing stale. Every page has a last_reviewed date within 90 days.');
} else {
  console.log(`${stale.length} page(s) need a look:\n`);
  for (const { path, reason } of stale) {
    console.log(`  ${path}: ${reason}`);
  }
}
