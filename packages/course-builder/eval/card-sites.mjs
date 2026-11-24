/**
 * Measures page cards and the glossary (item 7) on corpora saved by `read-sites.mjs --keep-corpus`: time, cost per
 * page and per 110 pages (plan §6.5 expects about $0.05), failures, what the code checks dropped, the card types, and
 * the glossary. Spends real tokens: needs ANTHROPIC_API_KEY.
 * Writes eval-data/<site>/cards-<source>.json (cards and glossary) and prints a summary.
 * Progress: every 30 s (`--progress-seconds`), cards done against pages, failures, cost so far and time left.
 * Run: node eval/card-sites.mjs --only=<domain> [--source=<corpus file name part>] [--pages=N] [--concurrency=16]
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

import { buildGlossary, ClaudeClient, pageCards, teachablePages } from '../dist/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const argv = process.argv.slice(2);
const option = (name, fallback) => argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const domain = option('only', null);
const sourceFilter = option('source', '');
const pageLimit = Number(option('pages', Infinity));
const concurrency = Number(option('concurrency', 16));
const progressSeconds = Number(option('progress-seconds', 30));

if (!domain) throw new Error('Pass --only=<domain>');
if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');

const siteDir = join(ROOT, 'eval-data', domain);
const corpusFiles = existsSync(siteDir)
  ? readdirSync(siteDir).filter((name) => name.startsWith('corpus-') && name.includes(sourceFilter))
  : [];
if (!corpusFiles.length) throw new Error(`No saved corpus in ${siteDir}; run read-sites.mjs --keep-corpus first`);

const client = new ClaudeClient({ apiKey: process.env.ANTHROPIC_API_KEY });
const cost = () => client.ledger.entries.reduce((sum, entry) => sum + entry.costUsd, 0);

for (const file of corpusFiles) {
  const corpus = JSON.parse(gunzipSync(readFileSync(join(siteDir, file))).toString('utf8'));
  const pages = teachablePages(corpus).slice(0, pageLimit);
  const startedAt = Date.now();
  let done = 0;
  const timer = setInterval(() => {
    const seconds = (Date.now() - startedAt) / 1000;
    const left = done ? Math.round(((pages.length - done) * seconds) / done) : null;
    console.log(
      `[progress ${Math.round(seconds)}s] ${file}: ${done}/${pages.length} cards, $${cost().toFixed(4)} so far${left === null ? '' : `, ~${left}s left`}`
    );
  }, progressSeconds * 1000);

  const run = await pageCards(client, pages, { concurrency, onCard: () => (done += 1) });
  clearInterval(timer);

  const cards = [...run.cards.values()];
  const glossary = buildGlossary(cards);
  const seconds = (Date.now() - startedAt) / 1000;
  const total = cost();
  const sum = (pick) => cards.reduce((acc, card) => acc + pick(card), 0);
  const count = (values) => values.reduce((acc, value) => ({ ...acc, [value]: (acc[value] ?? 0) + 1 }), {});
  const outputTokens = client.ledger.entries.reduce((acc, entry) => acc + entry.outputTokens, 0);
  const summary = {
    corpus: file,
    pages: pages.length,
    cards: cards.length,
    failures: run.failures,
    requests: client.ledger.entries.length,
    seconds: Math.round(seconds),
    costUsd: Number(total.toFixed(4)),
    costPer110Pages: Number(((total / Math.max(cards.length, 1)) * 110).toFixed(4)),
    outputTokensPerCard: Math.round(outputTokens / Math.max(cards.length, 1)),
    splitPages: cards.filter((card) => card.parts > 1).length,
    types: count(cards.map((card) => card.type)),
    levels: count(cards.map((card) => card.level)),
    looksObsolete: cards.filter((card) => card.freshness.looksObsolete).length,
    keyFacts: sum((card) => card.keyFacts.length),
    procedures: sum((card) => card.procedures.length),
    names: sum((card) => card.names.length),
    dropped: {
      facts: sum((card) => card.dropped.facts),
      procedures: sum((card) => card.dropped.procedures),
      names: sum((card) => card.dropped.names)
    },
    glossaryEntries: glossary.length,
    topNames: glossary.slice(0, 25).map((entry) => `${entry.name} (${entry.kind}, ${entry.pageIds.length})`)
  };

  writeFileSync(
    join(siteDir, file.replace(/^corpus-/, 'cards-').replace(/\.json\.gz$/, '.json')),
    `${JSON.stringify({ summary, cards, glossary }, null, 2)}\n`
  );
  console.log(JSON.stringify(summary, null, 2));
  client.ledger.entries.length = 0;
}
