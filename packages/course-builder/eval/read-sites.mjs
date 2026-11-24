/**
 * Measures the universal reader against verified ground truth. For each source of each site in a split, runs
 * `readSource` from the ground-truth root (so reading is measured apart from discovery) and compares with the
 * truth's page list:
 *   - completeness: pages read / `verification.readTarget`
 *   - recall: share of the truth's robots-allowed pages the reader read (exact, by normalised URL)
 *   - accounted: share of the truth's pages read, or seen to hold no article (a group of other pages, or empty)
 *   - outcome, representation mix, which structure signal placed each page, time
 *   - the corpus stage on the pages read: each page's title, words and exclusion reason (item 6 labels are made
 *     from these), and the usefulness gate per site
 * Sources the ground truth records as unreadable are read too (`truthNull`), outside the completeness numbers, so the
 * gate sees every site.
 * Writes eval-data/<site>/read.json (tree outline and statuses, no page text) and eval-data/read-<sample>-<split>[-<batch>].json.
 * Needs a build of the package. Only tune thresholds on development sites.
 * Sources are spread over `--workers` processes (default 8, one host never split across two), so parsing uses every
 * core; inside a worker every source runs at once and the fetcher keeps requests to one host one at a time, so the
 * slowest single source sets the wall time. A source larger than `--max-pages` cannot meet the completeness target
 * anyway, so it is read only to `--over-cap-pages` (default 300), enough to see the cap and the corpus. Each finished
 * source is written at once to eval-data/read-parts/, so results can be studied while the slowest still read. Successful and 404 answers are kept in eval-data/http-cache, so a rerun
 * after a reader change reads the same pages from disk with no network wait; `--fresh` fetches everything again.
 * `--keep-corpus` also saves each source's corpus with its page text (eval-data/<site>/corpus-<source>.json.gz), for
 * `eval/card-sites.mjs` and the later stages.
 * `--offline` sends no request at all: only cached answers are read, robots.txt is not asked again (a page was only
 * cached when robots allowed it), and a page missing from the cache fails as "offline". Use it to rerun sites that
 * should not be contacted again.
 * Without `--render`, a stand-in renderer only records which pages are script shells (they stay unread), so the
 * shell share is measured without a browser. With `--render`, the jobs app's headless renderer reads them.
 * Deadline: `--deadline-minutes` (default 7). Sources still reading then are stopped and reported as unfinished; the
 * rest of the results are written as usual.
 * Progress: every 30 s (`--progress-seconds`) it prints finished sources, cache hits and network requests, and each
 * running source's pages read against its target with an estimated time left; the same snapshot is written to
 * eval-data/read-<sample>-<split>[-<batch>].progress.json.
 * Run: node eval/read-sites.mjs [dev|held] [--sites=sites-icp.json] [--only=domain,...] [--source=url,...]
 *        [--max-pages=1500] [--render] [--offline]   (--render needs `node --import tsx`, for the jobs app's TypeScript renderer)
 */
import { spawn } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { cachePathOf, withDiskCache } from './http-cache.mjs';

import {
  buildCorpus,
  createFetcher,
  normalizePageUrl,
  readSource,
  registrableDomain,
  usefulnessGate
} from '../dist/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const argv = process.argv.slice(2);
const option = (name, fallback) => argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const sitesFile = option('sites', 'sites-icp.json');
const sites = JSON.parse(readFileSync(join(ROOT, 'eval', sitesFile), 'utf8'));
const split = argv.includes('held') ? 'heldOut' : 'development';
const only = option('only', null)?.split(',');
const onlySources = option('source', null)?.split(',');
const maxPages = Number(option('max-pages', 1500));
const overCapPages = Number(option('over-cap-pages', 300));
const workerCount = Number(option('workers', 8));
const deadlineMinutes = Number(option('deadline-minutes', 7));
const deadline = new AbortController();
setTimeout(
  () => deadline.abort(new Error(`stopped at the ${deadlineMinutes}-minute deadline`)),
  deadlineMinutes * 60_000
).unref();
const warmLanes = Number(option('warm-lanes', 0));
const workerTasksPath = option('worker-tasks', null);
const workerOutPath = option('worker-out', null);
const PARTS_DIR = join(ROOT, 'eval-data', 'read-parts');
const sampleName = `${sitesFile.replace(/\.json$/, '')}-${split}${option('batch', null) ? `-${option('batch', null)}` : ''}`;
const sourceConcurrency = Number(option('concurrency', Infinity));
const fresh = argv.includes('--fresh');
const offline = argv.includes('--offline');
const keepCorpus = argv.includes('--keep-corpus');
/** Truth pages the reader saw but that hold no article: groups of other pages, and pages with nothing to read. */
const NOTHING_TO_READ = new Set(['index', 'empty']);
const renderPages = argv.includes('--render');
const fetcher = withDiskCache(createFetcher({ productToken: 'ClassroomIO-CourseBuilder-Eval' }), { offline, fresh });

/** Where `--keep-corpus` saves a source's corpus: eval-data/<site>/corpus-<source host and path>.json.gz. */
function corpusPathOf(domain, sourceUrl) {
  const name = sourceUrl
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '');

  return join(ROOT, 'eval-data', domain, `corpus-${name}.json.gz`);
}

/** Reading stops this long before the deadline, so the corpus and the result are written in time. */
const READ_MARGIN_MS = 60_000;
const progressSeconds = Number(option('progress-seconds', 30));
const running = new Map();
const progressPath = option('worker-progress', join(ROOT, 'eval-data', `read-${sampleName}.progress.json`));
const runStartedAt = Date.now();
let finishedSources = 0;
let totalSources = 0;

function minutes(ms) {
  return `${Math.round(ms / 60_000)}m`;
}

function reportProgress() {
  const now = Date.now();
  const sources = [...running.values()].map((entry) => {
    const elapsed = now - entry.startedAt;
    const goal = entry.target ?? maxPages;
    const perMinute = entry.read / Math.max(elapsed / 60_000, 0.1);
    const left = goal > entry.read && perMinute > 0 ? ((goal - entry.read) / perMinute) * 60_000 : null;

    return { ...entry, goal, perMinute: Math.round(perMinute), elapsedMs: elapsed, leftMs: left };
  });
  sources.sort((left, right) => (right.leftMs ?? 0) - (left.leftMs ?? 0));
  const snapshot = {
    at: new Date(now).toISOString(),
    elapsed: minutes(now - runStartedAt),
    finished: `${finishedSources}/${totalSources}`,
    cache: fetcher.stats,
    running: sources.map(
      (entry) =>
        `${entry.domain}  ${entry.url}  ${entry.read}/${entry.goal}  ${entry.perMinute}/min  ${minutes(entry.elapsedMs)} in${entry.leftMs === null ? '' : `, ~${minutes(entry.leftMs)} left`}`
    )
  };
  writeFileSync(progressPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(
    `[progress ${snapshot.elapsed}] ${snapshot.finished} sources finished; cache ${fetcher.stats.hits} hits, ${fetcher.stats.misses} fetched; ${sources.length} running`
  );
  for (const line of snapshot.running.slice(0, 15)) console.log(`    ${line}`);
}

const progressTimer = setInterval(reportProgress, progressSeconds * 1000);
progressTimer.unref();

const warmers = Array.from({ length: warmLanes }, () =>
  withDiskCache(createFetcher({ productToken: 'ClassroomIO-CourseBuilder-Eval' }), { offline, fresh })
);

/**
 * Fetches the source's ground-truth pages into the cache over `--warm-lanes` extra connections, unless the host asks
 * for a delay. Off by default: with 3 extra connections, two help centres started refusing the crawler (403 on pages and
 * robots.txt), which loses whole sources. Use only on a host known to allow it.
 * Only for sources read in full: a source over the page limit is read only in part, and which part is the reader's call.
 */
async function warmCache(source, pageLimit, stop) {
  if ((source.pages ?? []).length > pageLimit) return;

  const urls = (source.pages ?? []).filter((url) => !existsSync(cachePathOf(url, undefined)));
  if (!urls.length || !warmers.length) return;

  const rules = await fetcher.robots(new URL(source.url).origin).catch(() => null);
  if (!rules || rules.crawlDelayMs > 0) return;

  await Promise.all(
    warmers.map(async (warmer, lane) => {
      for (let index = lane; index < urls.length && !stop.done; index += warmers.length) {
        if (existsSync(cachePathOf(urls[index], undefined))) continue;
        await warmer.get(urls[index]).catch(() => null);
      }
    })
  );
}

const realRenderer = renderPages ? await loadRenderer() : null;

async function loadRenderer() {
  const { createRenderer } = await import('../../../apps/jobs/src/services/course-builder/renderer.ts');

  return createRenderer({ userAgent: 'ClassroomIO-CourseBuilder-Eval' });
}

/** Records each page the reader would render; renders it only with `--render`. */
function shellRecorder() {
  const shells = [];
  const renderer = {
    async render(url, options) {
      shells.push(url);
      if (!realRenderer) throw new Error('not rendering in this run');

      return realRenderer.render(url, options);
    }
  };

  return { shells, renderer };
}

function asDiscovered(source, domain) {
  const host = new URL(source.url).hostname;
  const landing = source.landingUrl ?? source.url;

  return {
    kind: source.kind,
    url: source.url,
    title: source.title ?? null,
    foundVia: 'site-link',
    foundAt: source.foundAt ?? source.url,
    redirectChain: [landing],
    ownership: registrableDomain(host) === domain ? 'own' : 'foreign',
    evidence: 'linked-from-site',
    access: source.access ?? 'open',
    llmsTxtUrl: source.llmsTxtUrl ?? null,
    sitemapUrls: source.sitemapUrls ?? []
  };
}

async function measureSource(domain, organisation, source) {
  const startedAt = Date.now();
  const locale = source.locale ?? 'en';
  const recorder = shellRecorder();
  const target = source.verification?.readTarget ?? source.pageCount ?? null;
  const pageLimit = target !== null && target > maxPages ? Math.min(overCapPages, maxPages) : maxPages;
  const progress = {
    domain,
    url: source.url,
    target: target === null ? null : Math.min(target, pageLimit),
    read: 0,
    startedAt
  };
  running.set(source.url, progress);
  const warming = { done: false };
  const warmed = warmCache(source, pageLimit, warming);
  const result = await readSource({
    onPage: () => {
      progress.read += 1;
    },
    fetcher,
    renderer: recorder.renderer,
    source: asDiscovered(source, domain),
    brandDomain: domain,
    productNames: [organisation.name],
    preferredLocale: locale,
    maxPages: pageLimit,
    deadlineAt: runStartedAt + deadlineMinutes * 60_000 - READ_MARGIN_MS,
    signal: deadline.signal
  });
  warming.done = true;
  await warmed;
  const readKeys = new Set(result.inventory.filter((entry) => entry.status === 'read').map((entry) => entry.key));
  const corpus = buildCorpus(result.tree.pages, locale);
  if (keepCorpus) writeFileSync(corpusPathOf(domain, source.url), gzipSync(JSON.stringify(corpus)));
  const corpusPages = corpus.pages.map((page) => ({
    url: page.url,
    title: page.title,
    path: page.path.join(' > '),
    wordCount: page.wordCount,
    excluded: page.excluded,
    referenceOnly: page.referenceOnly
  }));
  const truthPages = (source.pages ?? []).map((url) => normalizePageUrl(url));
  const recalled = truthPages.filter((url) => readKeys.has(url)).length;
  const inventoryByKey = new Map(result.inventory.map((entry) => [entry.key, entry]));
  const missedByStatus = {};
  const missedExamples = {};
  for (const url of truthPages.filter((key) => !readKeys.has(key))) {
    const entry = inventoryByKey.get(url);
    const status = entry
      ? `${entry.status}${entry.detail ? `: ${String(entry.detail).slice(0, 40)}` : ''}`
      : 'never-listed';
    missedByStatus[status] = (missedByStatus[status] ?? 0) + 1;
    missedExamples[status] = [...(missedExamples[status] ?? []), url].slice(0, 3);
  }
  const indexed = truthPages.filter((url) => NOTHING_TO_READ.has(inventoryByKey.get(url)?.status)).length;
  const readTarget = source.verification?.readTarget ?? null;
  const statuses = {};
  for (const entry of result.inventory) statuses[entry.status] = (statuses[entry.status] ?? 0) + 1;

  return {
    domain,
    url: source.url,
    truthNull: !source.pageCount,
    pageLimit,
    outcome: result.outcome,
    readTarget,
    read: readKeys.size,
    completeness: readTarget ? Math.min(readKeys.size / readTarget, 1) : null,
    truthPages: truthPages.length,
    recall: truthPages.length ? recalled / truthPages.length : null,
    accounted: truthPages.length ? (recalled + indexed) / truthPages.length : null,
    missedByStatus,
    missedExamples,
    capped: result.tree.notes.some((note) => note.startsWith('stopped at')),
    stoppedByTime: result.tree.notes.includes('stopped at the time limit'),
    statuses,
    representations: result.representations,
    shells: recorder.shells.length,
    shellSample: recorder.shells.slice(0, 10),
    placedBy: result.placedBy,
    seconds: Math.round((Date.now() - startedAt) / 1000),
    outline: result.tree.pages
      .slice(0, 200)
      .map(
        (page) =>
          `${'  '.repeat(page.depth)}${page.kind === 'group' ? '[' : ''}${page.title}${page.kind === 'group' ? ']' : ''}`
      ),
    missedSample: truthPages.filter((url) => !readKeys.has(url)).slice(0, 15),
    excludedByReason: corpus.excluded,
    corpusPages
  };
}

async function mapLimit(items, limit, worker) {
  const results = [];
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(runners);

  return results;
}

const domains = sites.split[split].filter((domain) => !only || only.includes(domain));
const allTasks = domains.flatMap((domain) => {
  const path = join(ROOT, 'eval-data', domain, 'truth.json');
  if (!existsSync(path)) return [];

  const truth = JSON.parse(readFileSync(path, 'utf8'));

  return truth.sources
    .filter((entry) => entry.url && (!onlySources || onlySources.includes(entry.url)))
    .map((source) => ({ domain, source }));
});

async function measureTasks(tasks, onRow) {
  totalSources = tasks.length;

  return mapLimit(tasks, sourceConcurrency, async ({ domain, source }) => {
    let row;
    try {
      row = await measureSource(domain, sites.organisations[domain], source);
    } catch (error) {
      row = { domain, url: source.url, error: String(error), stack: error?.stack };
    }
    running.delete(source.url);
    finishedSources += 1;
    onRow?.(row);
    console.log(
      row.error
        ? `${domain}  ${row.url}  ERROR ${row.error}`
        : `${domain}  ${row.url}  ${row.outcome}  read ${row.read}/${row.readTarget ?? '?'}${row.capped ? ' (capped)' : ''}  recall ${row.recall === null ? '?' : Math.round(row.recall * 100) + '%'}  shells ${row.shells}  ${row.seconds}s  ${JSON.stringify(row.representations)}`
    );

    return row;
  });
}

/** Splits tasks into `count` groups of similar size; sources on one host stay in one group, so politeness holds. */
function partition(tasks, count) {
  const byHost = new Map();
  for (const task of tasks) {
    const host = new URL(task.source.url).host;
    byHost.set(host, [...(byHost.get(host) ?? []), task]);
  }
  const weight = (task) => {
    const target = task.source.verification?.readTarget ?? task.source.pageCount ?? 5;

    return target > maxPages ? overCapPages : target;
  };
  const groups = [...byHost.values()].sort(
    (left, right) =>
      right.reduce((sum, task) => sum + weight(task), 0) - left.reduce((sum, task) => sum + weight(task), 0)
  );
  const buckets = Array.from({ length: count }, () => ({ load: 0, tasks: [] }));
  for (const group of groups) {
    const lightest = buckets.reduce((best, bucket) => (bucket.load < best.load ? bucket : best));
    lightest.tasks.push(...group);
    lightest.load += group.reduce((sum, task) => sum + weight(task), 0);
  }

  return buckets.filter((bucket) => bucket.tasks.length).map((bucket) => bucket.tasks);
}

async function runWorkers(tasks) {
  mkdirSync(PARTS_DIR, { recursive: true });
  clearInterval(progressTimer);
  const groups = partition(tasks, workerCount);
  const workers = groups.map((group, index) => {
    const base = join(PARTS_DIR, `${sampleName}-${index}`);
    writeFileSync(`${base}.tasks.json`, JSON.stringify(group));
    writeFileSync(`${base}.rows.jsonl`, '');
    const child = spawn(
      process.execPath,
      [
        ...process.execArgv,
        fileURLToPath(import.meta.url),
        ...argv.filter((arg) => !arg.startsWith('--workers=')),
        `--worker-tasks=${base}.tasks.json`,
        `--worker-out=${base}.rows.jsonl`,
        `--worker-progress=${base}.progress.json`
      ],
      { stdio: ['ignore', 'pipe', 'inherit'] }
    );
    child.stdout.on('data', (chunk) => {
      for (const line of chunk.toString().split('\n'))
        if (line && !line.startsWith('[progress') && !line.startsWith('    ')) console.log(line);
    });

    const killer = setTimeout(() => child.kill('SIGKILL'), deadlineMinutes * 60_000 + 2 * HARD_STOP_GRACE_MS);
    killer.unref();

    return { base, done: new Promise((resolve) => child.on('exit', resolve)) };
  });

  const readRows = () =>
    workers.flatMap((worker) =>
      readFileSync(`${worker.base}.rows.jsonl`, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line))
    );
  const report = () => {
    const snapshots = workers
      .map((worker) => `${worker.base}.progress.json`)
      .filter((path) => existsSync(path))
      .map((path) => JSON.parse(readFileSync(path, 'utf8')));
    const hits = snapshots.reduce((sum, snapshot) => sum + snapshot.cache.hits, 0);
    const misses = snapshots.reduce((sum, snapshot) => sum + snapshot.cache.misses, 0);
    const runningLines = snapshots.flatMap((snapshot) => snapshot.running);
    const snapshot = {
      at: new Date().toISOString(),
      elapsed: minutes(Date.now() - runStartedAt),
      finished: `${readRows().length}/${tasks.length}`,
      workers: workers.length,
      cache: { hits, misses },
      running: runningLines
    };
    writeFileSync(progressPath, `${JSON.stringify(snapshot, null, 2)}\n`);
    console.log(
      `[progress ${snapshot.elapsed}] ${snapshot.finished} sources finished; cache ${hits} hits, ${misses} fetched; ${runningLines.length} running in ${workers.length} workers`
    );
    for (const line of runningLines.slice(0, 15)) console.log(`    ${line}`);
  };
  const timer = setInterval(report, progressSeconds * 1000);
  await Promise.all(workers.map((worker) => worker.done));
  clearInterval(timer);
  report();

  return readRows();
}

const HARD_STOP_GRACE_MS = 20_000;

if (workerTasksPath) {
  const tasks = JSON.parse(readFileSync(workerTasksPath, 'utf8'));
  setTimeout(
    () => {
      for (const entry of running.values()) {
        const row = {
          domain: entry.domain,
          url: entry.url,
          error: `stopped at the ${deadlineMinutes}-minute deadline`
        };
        appendFileSync(workerOutPath, `${JSON.stringify(row)}\n`);
      }
      running.clear();
      reportProgress();
      process.exit(0);
    },
    deadlineMinutes * 60_000 + HARD_STOP_GRACE_MS
  ).unref();
  await measureTasks(tasks, (row) => appendFileSync(workerOutPath, `${JSON.stringify(row)}\n`));
  await realRenderer?.close();
  clearInterval(progressTimer);
  reportProgress();
  process.exit(0);
}

console.log(
  `${allTasks.length} sources from ${domains.length} sites in ${Math.min(workerCount, allTasks.length)} workers; progress every ${progressSeconds}s in ${progressPath}`
);
const measured = workerCount > 1 ? await runWorkers(allTasks) : await measureTasks(allTasks);
const gates = {};
for (const domain of domains) {
  const siteRows = measured.filter((row) => row.domain === domain && !row.error);
  gates[domain] = usefulnessGate(
    siteRows.flatMap((row) => row.corpusPages),
    siteRows.map((row) => row.outcome)
  );
  if (siteRows.length)
    writeFileSync(join(ROOT, 'eval-data', domain, 'read.json'), `${JSON.stringify(siteRows, null, 2)}\n`);
}
await realRenderer?.close();
clearInterval(progressTimer);

const rows = measured.filter((row) => !row.error && !row.truthNull);
const uncapped = rows.filter((row) => !row.capped && row.readTarget);
const meetsTarget = uncapped.filter((row) => row.completeness >= 0.98).length;
const mean = (values) => (values.length ? values.reduce((total, value) => total + value, 0) / values.length : null);
const summary = {
  sample: sitesFile,
  split,
  maxPages,
  overCapPages,
  measuredAt: new Date().toISOString(),
  sources: rows.length,
  errors: measured.filter((row) => row.error).length,
  uncappedSources: uncapped.length,
  sourcesAtOrAbove98: meetsTarget,
  meanCompleteness: mean(uncapped.map((row) => row.completeness)),
  meanRecall: mean(uncapped.filter((row) => row.recall !== null).map((row) => row.recall)),
  unfinished: measured.filter((row) => row.error?.includes('deadline')).map((row) => row.url),
  meanAccounted: mean(uncapped.filter((row) => row.accounted !== null).map((row) => row.accounted)),
  missedByStatus: rows.reduce((totals, row) => {
    for (const [status, count] of Object.entries(row.missedByStatus ?? {}))
      totals[status] = (totals[status] ?? 0) + count;

    return totals;
  }, {}),
  rendered: renderPages,
  shellPages: rows.reduce((total, row) => total + row.shells, 0),
  readPages: rows.reduce((total, row) => total + row.read, 0),
  excludedByReason: rows.reduce((totals, row) => {
    for (const [reason, count] of Object.entries(row.excludedByReason)) totals[reason] = (totals[reason] ?? 0) + count;

    return totals;
  }, {}),
  gates,
  truthNullOutcomes: measured
    .filter((row) => row.truthNull && !row.error)
    .map((row) => `${row.url} ${row.outcome} read ${row.read}`),
  outcomes: rows.reduce((counts, row) => ({ ...counts, [row.outcome]: (counts[row.outcome] ?? 0) + 1 }), {})
};
writeFileSync(join(ROOT, 'eval-data', `read-${sampleName}.json`), `${JSON.stringify({ summary, rows }, null, 2)}\n`);
console.log(`\n${JSON.stringify(summary, null, 2)}`);
