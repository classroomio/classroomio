/**
 * Discovery against the ground truth (plan §13): for each site of a split, runs `discoverSources` from the organisation's
 * homepage and compares the sources it accepts with the truth's reviewed sources.
 *   - recall: share of the truth's sources that discovery accepted (same host, and one path a prefix of the other,
 *     comparing the source URL and where it landed)
 *   - readable recall: the same, over the truth's sources that do not answer automated readers with a bot challenge
 *     (they cannot be read, and links inside them cannot be followed)
 *   - precision (plan §13): share of the accepted documentation sources that really belong to the organisation: one of
 *     its reviewed sources or reviewed non-sources, or a host on its own domain or a source's domain
 *   - source precision: share of the accepted documentation sources that are one of the truth's reviewed sources
 * Each miss and each extra source is listed with what discovery recorded, so every one can be explained. Spends no
 * model tokens. Needs a build of the package. Progress every 30 s, naming the sites still running; a site still
 * discovering after 5 minutes is recorded as timed out, so a run never passes 7 minutes.
 * Writes eval-data/discovery-<sample>-<split>.json.
 * `--public-dns` resolves through public DNS servers, for runs on an unreliable local network.
 * Run: node eval/score-discovery.mjs [dev|held] [--sites=sites-icp.json] [--only=domain,...] [--public-dns]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getDomain } from 'tldts';

if (process.argv.includes('--public-dns')) await import('./public-dns.mjs');
const { createFetcher, discoverSources } = await import('../dist/index.js');

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const argv = process.argv.slice(2);
const option = (name, fallback) => argv.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;
const sitesFile = option('sites', 'sites-icp.json');
const split = argv.includes('held') ? 'heldOut' : 'development';
const only = option('only', null)?.split(',');
const sites = JSON.parse(readFileSync(join(ROOT, 'eval', sitesFile), 'utf8'));
const domains = sites.split[split].filter((domain) => !only || only.includes(domain));
const SITE_LIMIT_MS = 5 * 60_000;

const fetcher = createFetcher({ productToken: 'ClassroomIO-CourseBuilder-Eval' });
const startedAt = Date.now();
const running = new Set();
const timer = setInterval(
  () =>
    console.log(
      `[progress ${Math.round((Date.now() - startedAt) / 1000)}s] ${domains.length - running.size}/${domains.length} sites; running: ${[...running].join(', ')}`
    ),
  30_000
);

function withinLimit(promise) {
  let timeout;
  const limit = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`timed out after ${SITE_LIMIT_MS / 1000} s`)), SITE_LIMIT_MS);
  });

  return Promise.race([promise, limit]).finally(() => clearTimeout(timeout));
}

function parts(url) {
  const parsed = new URL(url);

  return { host: parsed.hostname.replace(/^www\./, ''), path: parsed.pathname.replace(/\/+$/, '').toLowerCase() };
}

function sameSource(left, right) {
  const a = parts(left);
  const b = parts(right);

  return a.host === b.host && (a.path.startsWith(b.path) || b.path.startsWith(a.path));
}

const urlsOf = (source) => [source.url, ...(source.redirectChain ?? []), source.landingUrl].filter(Boolean);
const matches = (discovered, truth) =>
  urlsOf(discovered).some((url) => urlsOf(truth).some((other) => sameSource(url, other)));

async function scoreSite(domain) {
  const truth = JSON.parse(readFileSync(join(ROOT, 'eval-data', domain, 'truth.json'), 'utf8'));
  const siteStart = Date.now();
  const map = await discoverSources(truth.homepage?.url ?? `https://${domain}/`, { fetcher });
  const seconds = Number(((Date.now() - siteStart) / 1000).toFixed(1));
  const homeHost = parts(truth.homepage?.finalUrl ?? truth.homepage?.url ?? `https://${domain}/`).host;

  const ownDomains = new Set(
    [truth.homepage?.url, truth.homepage?.finalUrl, ...truth.sources.map((entry) => entry.url)]
      .filter(Boolean)
      .map((url) => getDomain(url))
  );
  const reviewedNot = truth.notSources.filter((entry) => entry.url);
  const accepted = map.sources.map((source) => ({
    url: source.url,
    kind: source.kind,
    evidence: source.evidence,
    access: source.access,
    truth: truth.sources.find((entry) => matches(source, entry))?.url ?? null,
    product: source.kind === 'product-site' && parts(source.url).host === homeHost,
    belongs:
      truth.sources.some((entry) => matches(source, entry)) ||
      reviewedNot.some((entry) => matches(source, entry)) ||
      urlsOf(source).some((url) => ownDomains.has(getDomain(url)))
  }));
  const found = truth.sources.filter((entry) => map.sources.some((source) => matches(source, entry)));
  const readable = truth.sources.filter((entry) => entry.access !== 'challenge');
  const missed = truth.sources
    .filter((entry) => !found.includes(entry))
    .map((entry) => ({
      url: entry.url,
      kind: entry.kind,
      access: entry.access,
      confirm: map.needsConfirmation.some((source) => matches(source, entry)),
      skipped: map.skipped.find((source) => sameSource(source.url, entry.url)) ?? null
    }));
  const documentation = accepted.filter((source) => !source.product);
  const extras = documentation.filter((source) => !source.truth);
  const foreign = documentation.filter((source) => !source.belongs);

  return {
    domain,
    seconds,
    truthSources: truth.sources.length,
    found: found.length,
    readableSources: readable.length,
    readableFound: found.filter((entry) => readable.includes(entry)).length,
    documentation: documentation.length,
    belonging: documentation.length - foreign.length,
    correct: documentation.length - extras.length,
    accepted,
    missed,
    extras,
    foreign,
    needsConfirmation: map.needsConfirmation.map((source) => source.url)
  };
}

const results = [];
await Promise.all(
  domains.map(async (domain) => {
    running.add(domain);
    try {
      results.push(await withinLimit(scoreSite(domain)));
    } catch (error) {
      results.push({ domain, error: String(error) });
    } finally {
      running.delete(domain);
    }
  })
);
clearInterval(timer);

const scored = results.filter((result) => !result.error);
const truthSources = scored.reduce((total, result) => total + result.truthSources, 0);
const found = scored.reduce((total, result) => total + result.found, 0);
const documentation = scored.reduce((total, result) => total + result.documentation, 0);
const correct = scored.reduce((total, result) => total + result.correct, 0);
const sum = (field) => scored.reduce((total, result) => total + result[field], 0);
const summary = {
  sample: sitesFile,
  split,
  sites: scored.length,
  errors: results.filter((result) => result.error).map((result) => `${result.domain}: ${result.error}`),
  recall: Number((found / Math.max(truthSources, 1)).toFixed(3)),
  readableRecall: Number((sum('readableFound') / Math.max(sum('readableSources'), 1)).toFixed(3)),
  precision: Number((sum('belonging') / Math.max(documentation, 1)).toFixed(3)),
  sourcePrecision: Number((correct / Math.max(documentation, 1)).toFixed(3)),
  truthSources,
  found,
  documentation,
  correct,
  slowestSeconds: Math.max(0, ...scored.map((result) => result.seconds)),
  wallSeconds: Math.round((Date.now() - startedAt) / 1000)
};

const outPath = join(ROOT, 'eval-data', `discovery-${sitesFile.replace(/\.json$/, '')}-${split}.json`);
writeFileSync(
  outPath,
  JSON.stringify({ summary, results: results.sort((a, b) => a.domain.localeCompare(b.domain)) }, null, 2)
);
console.log(summary);
for (const result of scored) {
  for (const miss of result.missed)
    console.log(
      `MISS  ${result.domain}  ${miss.url} [${miss.kind}, ${miss.access}]${miss.confirm ? ' (asked to confirm)' : ''}${miss.skipped ? ` skipped: ${miss.skipped.reason}` : ''}`
    );
  for (const extra of result.extras)
    console.log(
      `${extra.belongs ? 'EXTRA' : 'WRONG'} ${result.domain}  ${extra.url} [${extra.kind}, ${extra.evidence}]`
    );
}
console.log(`written ${outPath}`);
process.exit(0);
