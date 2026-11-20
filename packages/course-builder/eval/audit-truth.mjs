import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const sitesFile = process.argv.find((arg) => arg.startsWith('--sites='))?.slice('--sites='.length) ?? 'sites-icp.json';
const sites = JSON.parse(readFileSync(join(ROOT, 'eval', sitesFile), 'utf8'));
const curation = JSON.parse(readFileSync(join(ROOT, 'eval', 'truth-curation.json'), 'utf8'));
const split = process.argv.includes('held') ? 'heldOut' : 'development';
const domains = sites.split[split];

function normalize(value) {
  const url = new URL(value);
  url.hash = '';

  if (url.pathname.length > 1 && url.pathname.endsWith('/')) url.pathname = url.pathname.slice(0, -1);

  return url.href;
}

function bareHost(host) {
  return host.toLowerCase().replace(/^www\./, '');
}

let totals = { sites: 0, sources: 0, pages: 0, nulls: 0, missing: 0, duplicates: 0, foreign: 0 };

for (const domain of domains) {
  const path = join(ROOT, 'eval-data', domain, 'truth.json');

  if (!existsSync(path)) {
    console.log(`\n${domain}: NO truth.json`);
    totals.missing += 1;
    continue;
  }

  const truth = JSON.parse(readFileSync(path, 'utf8'));
  const roots = truth.sources.map((source) => normalize(source.url));
  const duplicates = [...new Set(roots.filter((url, index) => roots.indexOf(url) !== index))];
  const present = new Set(
    truth.sources.flatMap((source) => [source.url, source.landingUrl].filter(Boolean).map(normalize))
  );
  const missingKept = (curation[domain]?.keepSources ?? []).filter((url) => !present.has(normalize(url)));
  const rows = [];

  for (const source of truth.sources) {
    const rootHost = bareHost(new URL(source.url).hostname);
    const foreign = [
      ...new Set(source.pages.map((page) => bareHost(new URL(page).hostname)).filter((host) => host !== rootHost))
    ];
    const label = source.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    rows.push(`${source.pageCount ?? '?'} ${label}${foreign.length ? ` [foreign: ${foreign.join(', ')}]` : ''}`);

    totals.sources += 1;
    totals.pages += source.pageCount ?? 0;
    if (source.pageCount === null) totals.nulls += 1;
    if (foreign.length) totals.foreign += 1;
  }

  totals.sites += 1;
  totals.missing += missingKept.length;
  totals.duplicates += duplicates.length;

  console.log(`\n${domain}: ${rows.join(' | ') || 'no sources'}`);
  if (missingKept.length) console.log(`  missing kept: ${missingKept.join(', ')}`);
  if (duplicates.length) console.log(`  duplicate roots: ${duplicates.join(', ')}`);
}

console.log(
  `\n${split}: ${totals.sites} sites, ${totals.sources} sources, ${totals.pages} pages, ${totals.nulls} null, ` +
    `${totals.missing} missing kept, ${totals.duplicates} duplicate roots, ${totals.foreign} sources with foreign hosts`
);
