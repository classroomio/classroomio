#!/usr/bin/env node
/**
 * Create a changelog post in UserJot via their REST API.
 *
 * By default creates a DRAFT for review in the UserJot dashboard — publishing
 * notifies subscribers (widget badge + email), so it is deliberately manual.
 * Pass --publish (optionally with --publish-at) to publish directly.
 *
 * Config (env):
 *   USERJOT_API_TOKEN  API token from UserJot workspace Settings → API Tokens
 *
 * Usage:
 *   USERJOT_API_TOKEN=... node scripts/userjot-create-changelog.mjs \
 *     --title "Interactive slide embedding" \
 *     --markdown-file draft.md \
 *     [--short "One-line summary"] \
 *     [--tag-ids id1,id2] \
 *     [--request-ids id1,id2] \
 *     [--publish] [--publish-at 2026-09-03T09:00:00Z]
 *
 *   Markdown can also be passed inline with --markdown "..." instead of a file.
 */
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

const API_BASE = 'https://api.userjot.com/v1';

const args = process.argv.slice(2);

function argValue(name) {
  const index = args.indexOf(name);

  return index !== -1 ? args[index + 1] : undefined;
}

function hasFlag(name) {
  return args.includes(name);
}

function fail(message) {
  console.error(`\n  ✗ ${message}\n`);
  process.exit(1);
}

const token = process.env.USERJOT_API_TOKEN;
if (!token) fail('Set USERJOT_API_TOKEN (UserJot Settings → API Tokens).');

const title = argValue('--title');
if (!title) fail('Missing --title.');

const markdownFile = argValue('--markdown-file');
const markdownInline = argValue('--markdown');
const markdown = markdownFile ? readFileSync(markdownFile, 'utf8') : markdownInline;
if (!markdown || markdown.trim() === '') fail('Pass --markdown-file <path> or --markdown <text>.');

function csvArg(name) {
  const value = argValue(name);

  return value
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : undefined;
}

const body = {
  title,
  markdown,
  status: hasFlag('--publish') ? 'published' : 'draft'
};

const short = argValue('--short');
if (short) body.short = short;

const publishAt = argValue('--publish-at');
if (publishAt) body.publish_at = publishAt;

const tagIds = csvArg('--tag-ids');
if (tagIds) body.tag_ids = tagIds;

const requestIds = csvArg('--request-ids');
if (requestIds) body.request_ids = requestIds;

const response = await fetch(`${API_BASE}/changelogs`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': randomUUID()
  },
  body: JSON.stringify(body)
});

const result = await response.json().catch(() => null);

if (!response.ok) {
  fail(`UserJot API returned ${response.status}: ${JSON.stringify(result)}`);
}

const changelogId = result?.changelog?.id ?? result?.id ?? '(unknown id)';

console.log(`\n  ✓ Created ${body.status} changelog post: ${title}`);
console.log(`  Changelog ID: ${changelogId}`);
console.log('  Review/publish it in the UserJot dashboard → Changelog.\n');
