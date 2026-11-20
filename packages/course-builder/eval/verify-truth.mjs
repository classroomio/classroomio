/**
 * Checks that ground-truth page lists are real public pages a polite reader may read. For each source it counts the
 * pages robots.txt forbids to our reader, then fetches a fixed sample of the allowed pages and records how many answer
 * 200 inside the source, are restricted, missing, blocked by an anti-bot page, or redirect out of the source.
 * `readTarget` = allowed pages × live share: the number of pages a complete reader should read. Use it, not the raw
 * page count, for the 98% reading target.
 * With --write, stores the result as `verification` on each source in eval-data/<site>/truth.json.
 * Needs a build of the package.
 * Run: node eval/verify-truth.mjs [dev|held] [--sample=20] [--only=domain,...] [--sites=sites-icp.json] [--write]
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createFetcher, FetchError, inScope, isBotChallenge, isLoginWall, sourceScope } from '../dist/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const argv = process.argv.slice(2);
const sitesFile = argv.find((arg) => arg.startsWith('--sites='))?.slice('--sites='.length) ?? 'sites-icp.json';
const sites = JSON.parse(readFileSync(join(ROOT, 'eval', sitesFile), 'utf8'));
const split = argv.includes('held') ? 'heldOut' : 'development';
const sampleSize = Number(argv.find((arg) => arg.startsWith('--sample='))?.slice('--sample='.length) ?? 20);
const only = argv
  .find((arg) => arg.startsWith('--only='))
  ?.slice('--only='.length)
  .split(',');
const domains = sites.split[split].filter((domain) => !only || only.includes(domain));
const fetcher = createFetcher({ productToken: 'ClassroomIO-CourseBuilder-Eval' });

function sample(pages) {
  const ranked = pages.map((url) => [createHash('sha256').update(url).digest('hex'), url]);
  ranked.sort((left, right) => left[0].localeCompare(right[0]));

  return ranked.slice(0, sampleSize).map(([, url]) => url);
}

async function check(url, scope) {
  try {
    const response = await fetcher.get(url, { maxBytes: 2_000_000, timeoutMs: 20_000 });
    if (isBotChallenge(response)) return 'blocked';
    if (response.status === 401 || response.status === 403 || isLoginWall(response)) return 'restricted';
    if (response.status === 404 || response.status === 410) return 'missing';
    if (response.status !== 200) return `status-${response.status}`;

    return inScope(response.url, scope) ? 'live' : 'left-source';
  } catch (error) {
    return error instanceof FetchError && error.reason === 'robots-disallowed' ? 'robots' : 'unreachable';
  }
}

async function robotsAllowed(pages) {
  const allowed = [];
  for (const url of pages) {
    const rules = await fetcher.robots(new URL(url).origin);
    if (rules.isAllowed(url)) allowed.push(url);
  }

  return allowed;
}

async function verifySource(domain, source) {
  const scope = sourceScope(source.url, {});
  if (source.landingUrl) scope.extraHosts.add(new URL(source.landingUrl).host);

  const allowed = await robotsAllowed(source.pages);
  const outcomes = {};
  for (const url of sample(allowed)) {
    const outcome = await check(url, scope);
    outcomes[outcome] = (outcomes[outcome] ?? 0) + 1;
  }

  const checked = Object.values(outcomes).reduce((total, count) => total + count, 0);
  const liveShare = checked ? (outcomes.live ?? 0) / checked : 0;
  const robotsDisallowed = source.pages.length - allowed.length;
  const readTarget = Math.round(allowed.length * liveShare);

  return {
    domain,
    url: source.url,
    pageCount: source.pageCount,
    robotsDisallowed,
    checked,
    liveShare,
    outcomes,
    readTarget
  };
}

const jobs = [];
for (const domain of domains) {
  const path = join(ROOT, 'eval-data', domain, 'truth.json');
  if (!existsSync(path)) continue;

  const truth = JSON.parse(readFileSync(path, 'utf8'));
  for (const source of truth.sources) if (source.pages?.length) jobs.push(verifySource(domain, source));
}

const results = await Promise.all(jobs);
results.sort((left, right) => left.liveShare - right.liveShare);
for (const result of results) {
  const share = `${Math.round(result.liveShare * 100)}%`;
  console.log(
    `${share.padStart(4)} live  ${result.url}  ${result.pageCount} listed, ${result.robotsDisallowed} robots-excluded, target ${result.readTarget}  ${JSON.stringify(result.outcomes)}`
  );
}

if (argv.includes('--write')) {
  const checkedAt = new Date().toISOString();
  for (const domain of new Set(results.map((result) => result.domain))) {
    const path = join(ROOT, 'eval-data', domain, 'truth.json');
    const truth = JSON.parse(readFileSync(path, 'utf8'));
    for (const source of truth.sources) {
      const result = results.find((entry) => entry.domain === domain && entry.url === source.url);
      if (!result) continue;

      source.verification = {
        checkedAt,
        sampleSize,
        robotsDisallowed: result.robotsDisallowed,
        outcomes: result.outcomes,
        liveShare: result.liveShare,
        readTarget: result.readTarget
      };
    }
    writeFileSync(path, `${JSON.stringify(truth, null, 2)}\n`);
  }
}

const out = join(ROOT, 'eval-data', `verify-${split}.json`);
writeFileSync(out, `${JSON.stringify({ checkedAt: new Date().toISOString(), sampleSize, results }, null, 2)}\n`);
const below = results.filter((result) => result.liveShare < 0.9).length;
console.log(`\n${results.length} sources checked; ${below} below 90% live. Saved ${out}`);
