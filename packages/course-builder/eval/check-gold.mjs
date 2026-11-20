/**
 * Item 10 on the gold course: groundedness of the course `write-gold.mjs` wrote, measured by an independent judge (Opus)
 * before and after the pipeline's checks (Haiku), repair (Sonnet) and review (Opus). The judge reads each lesson's section
 * sources, the ones the writer saw. Runs in steps; each saves its
 * result under eval-data/energis/check/, so no step runs past 7 minutes and a failed step is rerun alone:
 *   estimate        sizes every step's prompts and prints a cost estimate; no requests
 *   judge-written   judges the written course
 *   check           runs the pipeline's checks on the written course
 *   repair          repairs from the check, then reviews; writes checked-course.json and checked-course.html
 *   judge-checked   judges the checked course, reusing verdicts for lessons repair and review left unchanged
 *   report          checker-versus-judge agreement, both scores, and a 50-claim sheet for a person to label; no requests
 *   package         writes eval-data/energis/learning-package.json from the checked course, for an import; no requests
 *   score-labels    the judge and the checker against a labelled sheet (check/labels.csv, or --labels=<file in check/>);
 *                   no requests
 * Paid steps need ANTHROPIC_API_KEY. Progress every 30 s.
 * Run: node eval/check-gold.mjs --step=<step> [--course=<course key or title part>]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  applyReviewFixes,
  buildCorpus,
  checkerReport,
  buildGlossary,
  checkCourse,
  ClaudeClient,
  corpusBlockLookup,
  courseGlossary,
  courseQuestions,
  groundednessScore,
  judgeLessonGroundedness,
  lessonClaims,
  lessonSources,
  mapLimit,
  repairCourse,
  reviewCourse,
  reviewCoverage,
  sectionBriefs,
  ENGLISH_PACKAGE_LABELS,
  LEARNING_PACKAGE_VERSION,
  ZLearningPackage,
  ZPackageCourse
} from '../dist/index.js';

import { courseHtml } from './preview.mjs';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const DATA = join(ROOT, 'eval-data', 'energis');
const OUT = join(DATA, 'check');
const argv = process.argv.slice(2);
const option = (name, fallback) => argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const step = option('step', '');
const STEPS = ['estimate', 'judge-written', 'check', 'repair', 'judge-checked', 'report', 'score-labels', 'package'];
const PAID = new Set(['judge-written', 'check', 'repair', 'judge-checked']);
if (!STEPS.includes(step)) throw new Error(`--step must be one of ${STEPS.join(', ')}`);
if (PAID.has(step) && !process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
mkdirSync(OUT, { recursive: true });

const JUDGE_MODEL = { model: 'claude-opus-5-5', effort: 'medium' };
const CONCURRENCY = 8;
const STEP_LIMIT_MS = 400_000;
const SAMPLE_UNIFORM = 40;
const SAMPLE_FLAGGED = 10;
const WHOLE_COURSE_WRITE_RUN_USD = 1.37;

const readJson = (name) => JSON.parse(readFileSync(join(OUT, name), 'utf8'));
const writeJson = (name, value) => writeFileSync(join(OUT, name), `${JSON.stringify(value, null, 2)}\n`);

const knowledgeBase = JSON.parse(readFileSync(join(DATA, 'knowledge-base.json'), 'utf8'));
const corpus = buildCorpus(
  knowledgeBase.map((entry, index) => ({
    id: entry.id,
    url: entry.url,
    title: entry.title,
    kind: 'page',
    summary: null,
    labels: [],
    parentId: entry.parentId ?? null,
    position: index,
    order: index,
    depth: entry.path.length,
    path: entry.path,
    updatedAt: entry.updatedAt ?? null,
    locale: 'en',
    content: { format: 'html', text: entry.html }
  })),
  'en'
);
const pagesById = new Map(corpus.pages.map((page) => [page.pageId, page]));
const lookup = corpusBlockLookup(corpus.pages);
const glossary = buildGlossary(JSON.parse(readFileSync(join(DATA, 'cards.json'), 'utf8')));
const { plans } = JSON.parse(readFileSync(join(DATA, 'plan-result.json'), 'utf8'));
const wanted = option('course', 'admin').toLowerCase();
const plan = plans.find((entry) => `${entry.course.key} ${entry.title}`.toLowerCase().includes(wanted));
if (!plan) throw new Error(`No planned course matches "${wanted}"`);

const briefs = sectionBriefs(plan, pagesById, glossary);
const fetchedAt = JSON.parse(readFileSync(join(DATA, 'meta.json'), 'utf8')).capturedAt;
const writtenCourse = JSON.parse(readFileSync(join(DATA, 'written-course.json'), 'utf8')).written.course;
const lessonsOf = (course) => course.sections.flatMap((section) => section.lessons);
const videoUrls = lessonsOf(writtenCourse).flatMap((lesson) =>
  lesson.blocks.filter((block) => block.type === 'video').map((block) => block.url)
);
const checks = {
  blocks: lookup,
  allowedUrls: new Set([...corpus.pages.map((page) => page.url), ...videoUrls]),
  glossary: new Set(glossary.flatMap((entry) => [entry.name, ...entry.aliases.map((alias) => alias.name)])),
  otherCourseTitles: plans.filter((entry) => entry !== plan).map((entry) => entry.title),
  lessonSources: lessonSources(briefs)
};
const context = {
  courseTitle: plan.title,
  audience: plan.course.audience,
  outcomes: plan.outcomes,
  glossary: courseGlossary(glossary, new Set(plan.course.pageIds)),
  fetchedAt
};
const briefLessons = new Map(briefs.flatMap((brief) => brief.lessons.map((lesson) => [lesson.key, lesson])));
const sectionSources = lessonSources(briefs);
const judgeSources = (lesson) =>
  (sectionSources.get(lesson.key) ?? []).map((source) => ({
    url: source.url,
    title: source.title,
    blocks: source.blocks
  }));

const clients = [];
const newClient = (roleModels) => {
  const client = new ClaudeClient({ apiKey: process.env.ANTHROPIC_API_KEY ?? 'unused', roleModels });
  clients.push(client);

  return client;
};
const pipeline = newClient();
const judge = newClient({ checker: JUDGE_MODEL });
const startedAt = Date.now();
const spent = () => clients.reduce((sum, client) => sum + client.ledger.totalCostUsd, 0);
const requests = () => clients.reduce((sum, client) => sum + client.ledger.entries.length, 0);
const seconds = () => Math.round((Date.now() - startedAt) / 1000);
const timer = setInterval(
  () => console.log(`[progress ${seconds()}s] ${requests()} requests done, $${spent().toFixed(3)} so far`),
  30_000
);
const signal = AbortSignal.timeout(STEP_LIMIT_MS);
const costByRole = () =>
  Object.fromEntries(
    clients.flatMap((client, index) =>
      Object.entries(client.ledger.byRole()).map(([role, usage]) => [
        `${index === 1 ? 'judge' : role}`,
        Number(usage.costUsd.toFixed(4))
      ])
    )
  );

const plainClaim = (claim, extra) => ({
  index: claim.index,
  blockIndex: claim.blockIndex,
  text: claim.text,
  blockIds: claim.blockIds,
  ...extra
});

async function judgeCourse(course, reuse = new Map()) {
  const byLesson = {};
  const failed = [];
  let reused = 0;

  await mapLimit(lessonsOf(course), CONCURRENCY, async (lesson) => {
    const sources = judgeSources(lesson);
    const fingerprint = JSON.stringify([lesson.blocks, sources.map((source) => source.url)]);
    const previous = reuse.get(lesson.key);
    if (previous?.fingerprint === fingerprint) {
      byLesson[lesson.key] = previous;
      reused += 1;
      return;
    }

    try {
      const judged = await judgeLessonGroundedness(judge, lesson, sources, signal);
      byLesson[lesson.key] = {
        fingerprint,
        judged: judged.map((entry) => plainClaim(entry.claim, { verdict: entry.verdict, reason: entry.reason }))
      };
    } catch (error) {
      failed.push({ lesson: lesson.key, reason: error.message });
    }
  });

  const all = Object.values(byLesson).flatMap((entry) => entry.judged);

  return { score: groundednessScore(all), lessons: Object.keys(byLesson).length, reused, failed, byLesson };
}

function estimate() {
  const tokens = (text) => Math.ceil(text.length / 3.5);
  const lessons = lessonsOf(writtenCourse);
  const claims = lessons.flatMap((lesson) => lessonClaims(lesson));
  const docTokens = lessons.reduce(
    (sum, lesson) =>
      sum +
      tokens(
        judgeSources(lesson)
          .flatMap((source) => source.blocks.map((block) => block.text))
          .join('\n')
      ),
    0
  );
  const claimTokens = tokens(claims.map((claim) => `${claim.text} ${claim.blockIds.join(', ')}`).join('\n'));
  const citedTokens = tokens(
    lessons
      .map((lesson) =>
        [...new Set(lessonClaims(lesson).flatMap((claim) => claim.blockIds))]
          .map((id) => lookup.get(id)?.text ?? '')
          .join('\n')
      )
      .join('\n')
  );
  const keyed = courseQuestions(writtenCourse).filter((ref) =>
    ['single', 'multiple', 'true-false'].includes(ref.question.type)
  ).length;
  const judgeUsd = ((docTokens + claimTokens) * 4 + (claims.length * 45 + lessons.length * 2_000) * 20) / 1e6;
  const checkUsd =
    ((citedTokens + claimTokens) * 0.1 + (claims.length * 40 + lessons.length * 3_000) * 0.5) / 1e6 +
    (keyed * 4 * (800 * 0.1 + 1_500 * 0.5)) / 1e6;
  const flaggedLessons = Math.ceil(lessons.length * 0.4);
  const repairUsd =
    (flaggedLessons * 2 * (docTokens / lessons.length + 4_000) * 2 + flaggedLessons * 2 * 4_000 * 10) / 1e6 +
    checkUsd * 0.5;
  const reviewUsd = (15_000 * 4 + 4_000 * 20) / 1e6;

  console.log(
    JSON.stringify(
      {
        lessons: lessons.length,
        claims: claims.length,
        keyedQuestions: keyed,
        judgeInputTokens: docTokens + claimTokens,
        checkerInputTokens: citedTokens + claimTokens,
        estimateUsd: {
          judgeWritten: Number(judgeUsd.toFixed(2)),
          check: Number(checkUsd.toFixed(2)),
          repairAndReview: Number((repairUsd + reviewUsd).toFixed(2)),
          judgeCheckedUpTo: Number((judgeUsd * 0.5).toFixed(2)),
          total: Number((judgeUsd * 1.5 + checkUsd + repairUsd + reviewUsd).toFixed(2))
        }
      },
      null,
      2
    )
  );
}

async function check() {
  const result = await checkCourse(pipeline, writtenCourse, checks, { concurrency: CONCURRENCY, signal });
  const claims = Object.fromEntries(
    [...result.claims].map(([key, results]) => [
      key,
      results.map((entry) =>
        plainClaim(entry.claim, { verdict: entry.verdict, sourceBlockIds: entry.sourceBlockIds, reason: entry.reason })
      )
    ])
  );
  const allClaims = Object.values(claims).flat();
  const byKind = result.issues.reduce((acc, issue) => ({ ...acc, [issue.kind]: (acc[issue.kind] ?? 0) + 1 }), {});
  writeJson('check.json', {
    seconds: seconds(),
    costUsd: Number(spent().toFixed(4)),
    claims: allClaims.length,
    checkerSupported: allClaims.filter((claim) => claim.verdict === 'supported').length,
    checkerSupportedElsewhere: allClaims.filter((claim) => claim.verdict === 'supported-elsewhere').length,
    issuesByKind: byKind,
    unchecked: result.unchecked,
    issues: result.issues,
    claimsByLesson: claims
  });
  console.log({ claims: allClaims.length, byKind, unchecked: result.unchecked.length });
}

async function repair() {
  const checkResult = readJson('check.json');
  const claims = new Map(
    Object.entries(checkResult.claimsByLesson).map(([key, results]) => [
      key,
      results.map((entry) => ({
        claim: {
          index: entry.index,
          lessonKey: key,
          blockIndex: entry.blockIndex,
          text: entry.text,
          blockIds: entry.blockIds
        },
        verdict: entry.verdict,
        sourceBlockIds: entry.sourceBlockIds ?? [],
        reason: entry.reason
      }))
    ])
  );
  const repaired = await repairCourse(pipeline, {
    course: writtenCourse,
    briefs,
    context,
    checks,
    issues: checkResult.issues,
    claims,
    signal
  });
  const fixes = await reviewCourse(
    pipeline,
    {
      course: repaired.course,
      coverage: reviewCoverage(briefs),
      checkerReport: checkerReport(repaired, checkResult.issuesByKind)
    },
    signal
  );
  const applied = applyReviewFixes(repaired.course, fixes);
  const valid = ZPackageCourse.safeParse(applied.course);
  writeJson('checked-course.json', {
    seconds: seconds(),
    costUsd: Number(spent().toFixed(4)),
    costByRole: costByRole(),
    validPackageCourse: valid.success,
    repair: {
      repaired: repaired.repaired,
      correctedCitations: repaired.correctedCitations,
      removed: repaired.removed,
      reported: repaired.reported,
      failures: repaired.failures
    },
    review: {
      fixes,
      merges: applied.merges,
      gaps: applied.gaps,
      removed: applied.removed,
      rejected: applied.rejected
    },
    course: applied.course
  });
  writeFileSync(join(DATA, 'checked-course.html'), courseHtml(applied.course));
  console.log({
    repaired: repaired.repaired.length,
    removed: repaired.removed.map((entry) => `${entry.what} ${entry.target}`),
    failures: repaired.failures.length,
    fixes: fixes.map((fix) => `${fix.kind} ${fix.target}`),
    rejected: applied.rejected.length,
    valid: valid.success
  });
}

async function judgeStep(name, course, reuse) {
  const result = await judgeCourse(course, reuse);
  writeJson(name, { seconds: seconds(), costUsd: Number(spent().toFixed(4)), ...result });
  console.log({ score: result.score, lessons: result.lessons, reused: result.reused, failed: result.failed });
}

function mulberry32(seed) {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (char !== '\r') cell += char;
  }
  if (cell || row.length) rows.push([...row, cell]);

  return rows;
}

function agreement(checkerClaims, judged) {
  const counts = {
    claims: 0,
    citedBoth: 0,
    checkerOnly: 0,
    judgeOnly: 0,
    neither: 0,
    groundedBoth: 0,
    groundedJudgeOnly: 0,
    groundedCheckerOnly: 0,
    groundedNeither: 0
  };
  for (const [key, claims] of Object.entries(checkerClaims)) {
    const verdicts = new Map((judged[key]?.judged ?? []).map((entry) => [entry.index, entry.verdict]));
    for (const claim of claims) {
      const judgeVerdict = verdicts.get(claim.index);
      if (!judgeVerdict) continue;

      const checkerYes = claim.verdict === 'supported';
      const checkerGrounded = checkerYes || claim.verdict === 'supported-elsewhere';
      const citedYes = judgeVerdict === 'supported';
      const groundedYes = citedYes || judgeVerdict === 'supported-elsewhere';
      counts.claims += 1;
      if (checkerYes && citedYes) counts.citedBoth += 1;
      else if (checkerYes) counts.checkerOnly += 1;
      else if (citedYes) counts.judgeOnly += 1;
      else counts.neither += 1;
      if (checkerGrounded && groundedYes) counts.groundedBoth += 1;
      else if (groundedYes) counts.groundedJudgeOnly += 1;
      else if (checkerGrounded) counts.groundedCheckerOnly += 1;
      else counts.groundedNeither += 1;
    }
  }

  return counts;
}

function report() {
  const before = readJson('judge-written.json');
  const after = readJson('judge-checked.json');
  const checkResult = readJson('check.json');
  const checked = readJson('checked-course.json');
  const flaggedAfter = Object.entries(after.byLesson).flatMap(([key, entry]) =>
    entry.judged.filter((claim) => claim.verdict !== 'supported').map((claim) => ({ lesson: key, ...claim }))
  );

  const random = mulberry32(10);
  const pick = (list, count) => {
    const pool = [...list];
    const chosen = [];
    while (pool.length && chosen.length < count) chosen.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);

    return chosen;
  };
  const afterClaims = Object.entries(after.byLesson).flatMap(([key, entry]) =>
    entry.judged.map((claim) => ({ lesson: key, stratum: 'uniform', ...claim }))
  );
  const beforeNotGrounded = Object.entries(before.byLesson).flatMap(([key, entry]) =>
    entry.judged
      .filter((claim) => !['supported', 'supported-elsewhere'].includes(claim.verdict))
      .map((claim) => ({ lesson: key, stratum: 'judge-flagged-before-repair', ...claim }))
  );
  const uniform = pick(afterClaims, SAMPLE_UNIFORM);
  const seen = new Set(uniform.map((claim) => `${claim.lesson}|${claim.text}`));
  const flagged = pick(
    beforeNotGrounded.filter((claim) => !seen.has(`${claim.lesson}|${claim.text}`)),
    SAMPLE_FLAGGED
  );
  const sample = pick([...uniform, ...flagged], uniform.length + flagged.length);
  const checkerVerdict = (claim) =>
    claim.stratum === 'judge-flagged-before-repair'
      ? (checkResult.claimsByLesson[claim.lesson]?.find((entry) => entry.index === claim.index)?.verdict ?? null)
      : null;
  const sentenceBefore = (claim) => {
    const judged = (claim.stratum === 'uniform' ? after : before).byLesson[claim.lesson]?.judged ?? [];

    return judged.find((entry) => entry.index === claim.index - 1)?.text ?? '';
  };
  const rows = sample.map((claim, position) => ({
    id: `c${position + 1}`,
    lesson: `${claim.lesson}: ${briefLessons.get(claim.lesson)?.title ?? ''}`,
    context: sentenceBefore(claim),
    claim: claim.text,
    cited: claim.blockIds.map((id) => lookup.get(id)?.text ?? '(missing)').join('\n'),
    pages: [...new Set(claim.blockIds.map((id) => lookup.get(id)?.pageUrl).filter(Boolean))].join('\n'),
    key: {
      claim: claim.text,
      stratum: claim.stratum,
      judge: claim.verdict,
      judgeReason: claim.reason,
      checker: checkerVerdict(claim)
    }
  }));
  if (!existsSync(join(OUT, 'labels.csv'))) {
    const header = ['id', 'lesson', 'sentence_before', 'claim', 'cited_source_text', 'source_pages', 'label', 'note'];
    const lines = rows.map((row) =>
      [row.id, row.lesson, row.context, row.claim, row.cited, row.pages, '', ''].map(csvCell).join(',')
    );
    writeFileSync(join(OUT, 'labels.csv'), `${header.join(',')}\n${lines.join('\n')}\n`);
    writeJson('labels-key.json', Object.fromEntries(rows.map((row) => [row.id, row.key])));
  }

  const summary = {
    judgeModel: JUDGE_MODEL,
    writtenCourse: before.score,
    checkedCourse: after.score,
    target: 0.98,
    meetsTarget: after.score.groundedness >= 0.98,
    checker: {
      claims: checkResult.claims,
      supported: checkResult.checkerSupported,
      supportedElsewhere: checkResult.checkerSupportedElsewhere ?? 0,
      issuesByKind: checkResult.issuesByKind,
      unchecked: checkResult.unchecked.length
    },
    checkerVersusJudge: agreement(checkResult.claimsByLesson, before.byLesson),
    repair: {
      repaired: checked.repair.repaired.length,
      correctedCitations: checked.repair.correctedCitations ?? 0,
      removed: checked.repair.removed.map((entry) => `${entry.what} ${entry.target}`),
      failures: checked.repair.failures.length,
      reported: checked.repair.reported.length
    },
    review: {
      fixes: checked.review.fixes.map((fix) => `${fix.kind} ${fix.target}: ${fix.detail}`),
      rejected: checked.review.rejected.map((entry) => `${entry.fix.kind} ${entry.fix.target}: ${entry.reason}`)
    },
    validPackageCourse: checked.validPackageCourse,
    costUsd: {
      judgeWritten: before.costUsd,
      check: checkResult.costUsd,
      repairAndReview: checked.costUsd,
      judgeChecked: after.costUsd,
      pipeline: Number((checkResult.costUsd + checked.costUsd).toFixed(4))
    },
    seconds: { check: checkResult.seconds, repairAndReview: checked.seconds },
    notGroundedAfter: flaggedAfter
      .filter((claim) => claim.verdict !== 'supported-elsewhere')
      .map((claim) => `${claim.lesson} #${claim.index} [${claim.verdict}] ${claim.text} — ${claim.reason}`),
    labelSheet: 'eval-data/energis/check/labels.csv'
  };
  writeJson('report.json', summary);
  console.log(JSON.stringify(summary, null, 2));
}

function scoreLabels() {
  const sheet = option('labels', 'labels.csv');
  const key = readJson(join(dirname(sheet), 'labels-key.json'));
  const [header, ...rows] = parseCsv(readFileSync(join(OUT, sheet), 'utf8')).filter((row) => row.some(Boolean));
  const column = (name) => header.indexOf(name);
  const strays = rows.filter(
    (row) => !key[row[column('id')]] || (key[row[column('id')]].claim ?? row[column('claim')]) !== row[column('claim')]
  );
  if (strays.length)
    throw new Error(`${sheet} does not match the key beside it: ${strays.map((row) => row[column('id')]).join(', ')}`);
  const grounded = (verdict) => verdict === 'supported' || verdict === 'supported-elsewhere' || verdict === 'elsewhere';
  const labelled = rows
    .map((row) => ({ id: row[column('id')], label: row[column('label')].trim().toLowerCase() }))
    .filter((row) => row.label && row.label !== 'unsure' && key[row.id]);
  const score = (pick) => {
    const scored = labelled.filter((row) => pick(key[row.id]) !== null && pick(key[row.id]) !== undefined);
    const agree = scored.filter((row) => grounded(row.label) === grounded(pick(key[row.id]))).length;

    return { labelled: scored.length, agree, accuracy: scored.length ? agree / scored.length : null };
  };
  const byStratum = Object.fromEntries(
    [...new Set(Object.values(key).map((entry) => entry.stratum))].map((stratum) => [
      stratum,
      {
        labels: labelled.filter((row) => key[row.id].stratum === stratum).length,
        personGrounded: labelled.filter((row) => key[row.id].stratum === stratum && grounded(row.label)).length
      }
    ])
  );
  const result = {
    labelled: labelled.length,
    judge: score((entry) => entry.judge),
    checker: score((entry) => entry.checker),
    byStratum,
    disagreements: labelled
      .filter((row) => grounded(row.label) !== grounded(key[row.id].judge))
      .map((row) => ({ id: row.id, person: row.label, judge: key[row.id].judge, reason: key[row.id].judgeReason }))
  };
  writeJson(`${sheet.replace(/\.csv$/, '')}-score.json`, result);
  console.log(JSON.stringify(result, null, 2));
}

function learningPackage() {
  const checked = readJson('checked-course.json');
  const written = JSON.parse(readFileSync(join(DATA, 'written-course.json'), 'utf8'));
  const { summary: planSummary } = JSON.parse(readFileSync(join(DATA, 'plan-result.json'), 'utf8'));
  const checkResult = readJson('check.json');
  const meta = JSON.parse(readFileSync(join(DATA, 'meta.json'), 'utf8'));
  const teachable = corpus.pages.filter((page) => !page.excluded);
  const byRole = {};
  const spentBy = [
    planSummary?.costByRole ?? {},
    { writer: WHOLE_COURSE_WRITE_RUN_USD },
    written.summary.costByRole,
    { checker: checkResult.costUsd },
    checked.costByRole
  ];
  for (const costs of spentBy)
    for (const [role, cost] of Object.entries(costs)) byRole[role] = Number(((byRole[role] ?? 0) + cost).toFixed(4));
  const removedItems = [
    ...checked.repair.removed.map((entry) => ({
      kind: entry.what === 'blocks' ? 'lesson' : entry.what,
      target: entry.target,
      reason: entry.what === 'blocks' ? `paragraphs removed: ${entry.reason}` : entry.reason
    })),
    ...checked.review.removed
  ];
  const pkg = {
    version: LEARNING_PACKAGE_VERSION,
    locale: 'en',
    labels: ENGLISH_PACKAGE_LABELS,
    courses: [checked.course],
    report: {
      sources: [
        {
          url: meta.sources[0],
          kind: 'knowledge-base',
          evidence: 'gold snapshot (evaluation)',
          access: 'open',
          status: 'read',
          completeness: { declared: knowledgeBase.length, read: knowledgeBase.length, ratio: 1, status: 'complete' }
        }
      ],
      held: [],
      skipped: [],
      excludedPages: corpus.pages
        .filter((page) => page.excluded)
        .map((page) => ({ url: page.url, title: page.title, reason: page.excluded })),
      contradictions: [],
      gaps: [...written.written.gaps, ...checked.review.gaps],
      removedItems,
      gate: {
        passed: true,
        teachablePages: teachable.length,
        words: teachable.reduce((sum, page) => sum + page.wordCount, 0),
        reason: 'enough-material'
      },
      cost: {
        totalUsd: Number(
          Object.values(byRole)
            .reduce((sum, cost) => sum + cost, 0)
            .toFixed(4)
        ),
        byRole
      },
      timings: {
        totalSeconds: written.summary.seconds + checkResult.seconds + checked.seconds,
        byStage: { write: written.summary.seconds, check: checkResult.seconds, repair: checked.seconds }
      }
    }
  };
  const valid = ZLearningPackage.safeParse(pkg);
  if (!valid.success) throw new Error(JSON.stringify(valid.error.issues.slice(0, 5)));

  writeFileSync(join(DATA, 'learning-package.json'), `${JSON.stringify(valid.data, null, 2)}\n`);
  console.log({
    courses: 1,
    lessons: lessonsOf(checked.course).length,
    removedItems: removedItems.length,
    cost: pkg.report.cost
  });
}

try {
  if (step === 'package') learningPackage();
  if (step === 'estimate') estimate();
  if (step === 'judge-written') {
    const saved = existsSync(join(OUT, 'judge-written.json')) ? readJson('judge-written.json').byLesson : {};
    await judgeStep('judge-written.json', writtenCourse, new Map(Object.entries(saved)));
  }
  if (step === 'check') await check();
  if (step === 'repair') await repair();
  if (step === 'judge-checked') {
    const reuse = new Map(Object.entries(readJson('judge-written.json').byLesson));
    await judgeStep('judge-checked.json', readJson('checked-course.json').course, reuse);
  }
  if (step === 'report') report();
  if (step === 'score-labels') scoreLabels();
} finally {
  clearInterval(timer);
  if (PAID.has(step)) console.log(`step ${step}: ${seconds()} s, $${spent().toFixed(4)}`, costByRole());
}
