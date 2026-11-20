/**
 * Item 12 without the host: runs the build stages (`src/build/stages.ts`) on one live site, step by step, the way the
 * jobs worker chains them, saving each step's result under eval-data/<site>/build/ so no step runs past 7 minutes and
 * a failed step is rerun alone:
 *   discover   finds the product site and the documentation sources; no requests to Claude
 *   read       reads every accepted source (the product site up to --product-pages); no requests to Claude
 *   prepare    corpus and usefulness gate, and a cost estimate for the paid steps; no requests to Claude
 *   understand page cards and glossary (paid)
 *   plan       course list and section plans (paid)
 *   write      writes one planned course, --course=<n> (1-based, default 1) (paid)
 *   finish     checks, repairs and reviews that course (paid)
 *   package    the learning package of every finished course, for an import; no requests to Claude
 * Paid steps need ANTHROPIC_API_KEY and stop sending requests once --budget (default 15) dollars are spent across steps.
 * Responses are cached in eval-data/http-cache (shared with read-sites.mjs); --fresh fetches everything again.
 * Progress every 30 s.
 * Run: node eval/build-site.mjs --site=<domain> --step=<step> [--course=1] [--max-pages=300] [--product-pages=25]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync, gzipSync } from 'node:zlib';

import {
  buildReport,
  ClaudeClient,
  coursePackage,
  createFetcher,
  discoverSources,
  finishStage,
  planStage,
  prepareCorpus,
  readStage,
  teachablePages,
  understandStage,
  writeStage,
  ENGLISH_PACKAGE_LABELS,
  ZLearningPackage
} from '../dist/index.js';

import { withDiskCache } from './http-cache.mjs';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const argv = process.argv.slice(2);
const option = (name, fallback) => argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const site = option('site', null);
const step = option('step', null);
if (!site || !step) throw new Error('--site and --step are required');

const OUT = join(ROOT, 'eval-data', site, 'build');
mkdirSync(OUT, { recursive: true });
const LOCALE = 'en';
const STEP_LIMIT_MS = 400_000;
const maxPages = Number(option('max-pages', 300));
const productPages = Number(option('product-pages', 25));
const courseCount = Number(option('courses', 3));
const budgetUsd = Number(option('budget', 15));
const courseNumber = Number(option('course', 1));
const ANSWERS = {
  firstOutcome: 'onboard-customers',
  jobRole: 'customer-education',
  companySize: '51-200',
  learningMethod: 'help-docs'
};

const has = (name) => existsSync(join(OUT, name));
const readJson = (name) => {
  const raw = readFileSync(join(OUT, name));

  return JSON.parse(name.endsWith('.gz') ? gunzipSync(raw).toString('utf8') : raw.toString('utf8'));
};
const writeJson = (name, value) =>
  writeFileSync(
    join(OUT, name),
    name.endsWith('.gz') ? gzipSync(JSON.stringify(value)) : `${JSON.stringify(value, null, 2)}\n`
  );
const ledger = () => (has('cost.json') ? readJson('cost.json') : { byStep: {}, byRole: {}, seconds: {} });
const spentSoFar = () => Object.values(ledger().byStep).reduce((sum, cost) => sum + cost, 0);

const startedAt = Date.now();
const seconds = () => Math.round((Date.now() - startedAt) / 1000);
const deadline = new AbortController();
setTimeout(() => deadline.abort(new Error('step stopped at its time limit')), STEP_LIMIT_MS).unref();
let progress = () => '';
const timer = setInterval(() => console.log(`[progress ${seconds()}s] ${step}: ${progress()}`), 30_000);

const fetcher = withDiskCache(createFetcher({ productToken: 'ClassroomIO-CourseBuilder-Eval' }), {
  fresh: argv.includes('--fresh')
});
let client = null;
const claude = () => {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
  client ??= new ClaudeClient({
    apiKey: process.env.ANTHROPIC_API_KEY,
    budget: { limitUsd: budgetUsd, spentUsd: spentSoFar() }
  });
  progress = () => `${client.ledger.entries.length} requests, $${client.ledger.totalCostUsd.toFixed(3)} this step`;

  return client;
};

function recordCost(name) {
  const costs = ledger();
  if (client) {
    costs.byStep[name] = Number(client.ledger.totalCostUsd.toFixed(4));
    for (const [role, row] of Object.entries(client.ledger.byRole()))
      costs.byRole[`${name}:${role}`] = Number(row.costUsd.toFixed(4));
  }
  costs.seconds[name] = seconds();
  writeJson('cost.json', costs);
}

const loadSources = () => readJson('sources.json');
const loadRead = () => readJson('read.json.gz');
const loadPrepared = () => readJson('prepared.json.gz');
const fetchedAtOf = (reads) => reads.map((entry) => entry.readAt).sort()[0];

async function discover() {
  const map = await discoverSources(`https://${site}/`, { fetcher });
  writeJson('sources.json', map);
  console.log({
    sources: map.sources.map((source) => `${source.kind} ${source.url} (${source.evidence}, ${source.access})`),
    needsConfirmation: map.needsConfirmation.map((source) => source.url),
    skipped: map.skipped.length,
    youtube: map.youtubeChannels
  });
}

async function read() {
  const map = loadSources();
  const counts = Object.fromEntries(map.sources.map((source) => [source.url, 0]));
  progress = () =>
    Object.entries(counts)
      .map(([url, count]) => `${url} ${count}`)
      .join(', ');
  const reads = await Promise.all(
    map.sources.map((source) =>
      readStage({
        source,
        sourceMap: map,
        fetcher,
        locale: LOCALE,
        maxPages: source.kind === 'product-site' ? productPages : maxPages,
        deadlineAt: startedAt + STEP_LIMIT_MS - 30_000,
        onPage: () => (counts[source.url] += 1),
        signal: deadline.signal
      })
    )
  );
  writeJson('read.json.gz', reads);
  console.log(
    reads.map((entry) => ({
      url: entry.source.url,
      kind: entry.source.kind,
      outcome: entry.outcome,
      pages: entry.pages.length,
      completeness: entry.completeness
    }))
  );
}

function prepare() {
  const reads = loadRead();
  const prepared = prepareCorpus(reads, LOCALE);
  writeJson('prepared.json.gz', prepared);
  const teachable = teachablePages(prepared.corpus);
  const words = teachable.reduce((sum, page) => sum + page.wordCount, 0);
  console.log({
    pages: prepared.corpus.pages.length,
    teachable: teachable.length,
    words,
    excluded: prepared.corpus.excluded,
    productPages: prepared.productPages.length,
    gate: prepared.gate,
    estimateUsd: {
      understand: Number(((teachable.length / 110) * 0.086).toFixed(2)),
      plan: 1.0,
      writePerCourse: 1.7,
      finishPerCourse: 0.4,
      note: 'from the gold run (§4.10–4.12, §4.6); a course of a larger corpus costs more'
    }
  });
}

async function understand() {
  const prepared = loadPrepared();
  if (!prepared.gate.passed) throw new Error(`The gate stopped this site: ${prepared.gate.reason}`);

  let cards = 0;
  const caller = claude();
  const base = progress;
  progress = () => `${cards} cards; ${base()}`;
  const understanding = await understandStage(caller, prepared, {
    onCard: () => (cards += 1),
    signal: deadline.signal
  });
  writeJson('understanding.json.gz', understanding);
  console.log({
    cards: understanding.cards.length,
    failures: understanding.cardFailures.length,
    glossary: understanding.glossary.length,
    aliases: understanding.glossary.reduce((sum, entry) => sum + entry.aliases.length, 0),
    aliasConflicts: understanding.aliasConflicts.length,
    costUsd: client.ledger.totalCostUsd
  });
}

async function plan() {
  const planned = await planStage(claude(), {
    prepared: loadPrepared(),
    understanding: readJson('understanding.json.gz'),
    answers: ANSWERS,
    courseCount,
    signal: deadline.signal
  });
  writeJson('plan.json', planned);
  console.log({
    courses: planned.plans.map(
      (entry) =>
        `${entry.title}: ${entry.sections.length} sections, ${entry.sections.reduce((sum, section) => sum + section.lessons.length, 0)} lessons${entry.issues.length ? `, issues ${JSON.stringify(entry.issues)}` : ''}`
    ),
    coverage: {
      used: planned.courseList.coverage.used.length,
      excluded: planned.courseList.coverage.excluded.length,
      unplaced: planned.courseList.coverage.unplaced.length
    },
    listIssues: planned.courseList.issues,
    costUsd: client.ledger.totalCostUsd
  });
}

function plannedCourse() {
  const { plans } = readJson('plan.json');
  const chosen = plans[courseNumber - 1];
  if (!chosen) throw new Error(`The plan has ${plans.length} courses; --course=${courseNumber} is not one`);

  return { plans, chosen };
}

async function write() {
  const { chosen } = plannedCourse();
  const prepared = loadPrepared();
  const { glossary } = readJson('understanding.json.gz');
  const written = await writeStage(claude(), {
    plan: chosen,
    corpus: prepared.corpus,
    glossary,
    fetchedAt: fetchedAtOf(loadRead()),
    fetcher,
    signal: deadline.signal
  });
  writeJson(`written-${courseNumber}.json`, written);
  console.log({
    course: written.course.title,
    sections: written.course.sections.length,
    lessons: written.course.sections.reduce((sum, section) => sum + section.lessons.length, 0),
    stats: written.stats,
    issues: written.issues,
    gaps: written.gaps.length,
    costUsd: client.ledger.totalCostUsd
  });
}

async function finish() {
  const { plans, chosen } = plannedCourse();
  const prepared = loadPrepared();
  const { glossary } = readJson('understanding.json.gz');
  const finished = await finishStage(claude(), {
    plan: chosen,
    corpus: prepared.corpus,
    glossary,
    fetchedAt: fetchedAtOf(loadRead()),
    written: readJson(`written-${courseNumber}.json`),
    otherCourseTitles: plans.filter((entry) => entry !== chosen).map((entry) => entry.title),
    signal: deadline.signal
  });
  writeJson(`finished-${courseNumber}.json`, finished);
  console.log({
    valid: finished.valid,
    check: finished.check,
    repaired: finished.repair.repaired.length,
    removed: finished.removedItems,
    reviewFixesRejected: finished.review.rejected.length,
    costUsd: client.ledger.totalCostUsd
  });
}

function learningPackage() {
  const reads = loadRead();
  const finished = readJson('plan.json').plans.flatMap((_, index) =>
    has(`finished-${index + 1}.json`) ? [readJson(`finished-${index + 1}.json`)] : []
  );
  if (!finished.length) throw new Error('No course is finished yet');

  const costs = ledger();
  const report = buildReport({
    sourceMap: loadSources(),
    sources: reads,
    prepared: loadPrepared(),
    finished,
    cost: { totalUsd: Number(spentSoFar().toFixed(4)), byRole: costs.byRole },
    timings: {
      totalSeconds: Object.values(costs.seconds).reduce((sum, value) => sum + value, 0),
      byStage: costs.seconds
    }
  });
  const pkg = { ...coursePackage(finished[0].course, report, LOCALE, ENGLISH_PACKAGE_LABELS) };
  pkg.courses = finished.map((entry) => entry.course);
  const valid = ZLearningPackage.safeParse(pkg);
  writeJson('learning-package.json', pkg);
  console.log({ courses: pkg.courses.length, valid: valid.success, issues: valid.error?.issues.slice(0, 5) });
}

const steps = { discover, read, prepare, understand, plan, write, finish, package: learningPackage };
if (!steps[step]) throw new Error(`Unknown step "${step}"`);
const costName = ['write', 'finish'].includes(step) ? `${step}-${courseNumber}` : step;
try {
  await steps[step]();
} finally {
  clearInterval(timer);
  if (client) recordCost(costName);
}
console.log(`${step} done in ${seconds()}s; $${spentSoFar().toFixed(3)} spent across steps`);
process.exit(0);
