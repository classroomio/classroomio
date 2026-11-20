/**
 * Writes one course of the gold plan end to end (item 9): the sections with citations, each section's check, the
 * final quiz and practice tasks, and the screenshots of the cited pages. Uses eval-data/energis/plan-result.json and
 * cards.json from `plan-gold.mjs`, so only writing is paid for. Spends real tokens: needs ANTHROPIC_API_KEY.
 * Writes eval-data/energis/written-course.json (the package course and the report) and written-course.html, a
 * preview to read. Progress every 30 s.
 * `--section=<title part>` rewrites only the matching sections and merges them into the course saved by an earlier run.
 * Run: node eval/write-gold.mjs [--course=<course key or title part>] [--section=<title part>]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildCorpus,
  buildGlossary,
  ClaudeClient,
  courseGlossary,
  sectionBriefs,
  sectionCheck,
  withLessonMedia,
  writeCourse,
  writeSection,
  ZPackageCourse
} from '../dist/index.js';

import { courseHtml } from './preview.mjs';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const DATA = join(ROOT, 'eval-data', 'energis');
const argv = process.argv.slice(2);
const option = (name, fallback) => argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const wanted = option('course', 'admin').toLowerCase();

if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');

const client = new ClaudeClient({ apiKey: process.env.ANTHROPIC_API_KEY });
const startedAt = Date.now();
const totalCost = () => client.ledger.entries.reduce((sum, entry) => sum + entry.costUsd, 0);
const timer = setInterval(() => {
  console.log(
    `[progress ${Math.round((Date.now() - startedAt) / 1000)}s] ${client.ledger.entries.length} requests done, $${totalCost().toFixed(3)} so far`
  );
}, 30_000);

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
const cards = JSON.parse(readFileSync(join(DATA, 'cards.json'), 'utf8'));
const glossary = buildGlossary(cards);
const { plans } = JSON.parse(readFileSync(join(DATA, 'plan-result.json'), 'utf8'));
const plan = plans.find((entry) => `${entry.course.key} ${entry.title}`.toLowerCase().includes(wanted));
if (!plan) throw new Error(`No planned course matches "${wanted}"`);

const briefs = sectionBriefs(plan, pagesById, glossary);
const fetchedAt = JSON.parse(readFileSync(join(DATA, 'meta.json'), 'utf8')).capturedAt;
console.log(
  `writing "${plan.title}": ${briefs.length} sections, ${briefs.reduce((sum, brief) => sum + brief.lessons.length, 0)} lessons`
);

const courseNames = courseGlossary(glossary, new Set(plan.course.pageIds));
const onlySection = option('section', null)?.toLowerCase();
const written = onlySection
  ? await rewriteSections(onlySection)
  : await writeCourse(client, { plan, briefs, glossary: courseNames, fetchedAt });

/**
 * Rewrites only the sections whose title contains `part` and merges them into the course saved by an earlier run, in
 * planned order, so the other sections are not paid for again.
 */
async function rewriteSections(part) {
  const saved = JSON.parse(readFileSync(join(DATA, 'written-course.json'), 'utf8')).written;
  const targets = briefs.filter((brief) => brief.section.title.toLowerCase().includes(part));
  if (!targets.length) throw new Error(`No planned section matches "${part}"`);

  const context = {
    courseTitle: plan.title,
    audience: plan.course.audience,
    outcomes: plan.outcomes,
    glossary: courseNames,
    fetchedAt
  };
  const issues = saved.issues.filter((issue) => !targets.some((brief) => issue.includes(`"${brief.section.title}"`)));
  for (const brief of targets) {
    const [section, check] = await Promise.all([
      writeSection(client, context, brief).catch((error) => ({ failure: error.message })),
      sectionCheck(client, brief).catch(() => null)
    ]);
    if (section.failure || !section.lessons.length) {
      issues.push(
        `Section "${brief.section.title}" could not be written: ${section.failure ?? section.issues.join(' ')}`
      );
      continue;
    }

    issues.push(...section.issues.map((issue) => `${brief.section.title}: ${issue}`));
    saved.gaps.push(...section.gaps);
    const lessons = [];
    for (const lesson of section.lessons) {
      const briefLesson = brief.lessons.find((candidate) => candidate.key === lesson.key);
      const media = await withLessonMedia(lesson.blocks, briefLesson, { fetchedAt });
      saved.stats.uncitedParagraphs += lesson.uncitedParagraphs;
      saved.stats.images += media.blocks.filter((block) => block.type === 'image').length;
      const { uncitedParagraphs: _uncited, ...packageLesson } = lesson;
      lessons.push({ ...packageLesson, blocks: media.blocks });
    }

    const rewritten = { key: section.key, title: section.title, lessons, check: check?.questions ?? [] };
    const order = (key) => briefs.findIndex((candidate) => candidate.section.key === key);
    saved.course.sections = [
      ...saved.course.sections.filter((existing) => existing.key !== section.key),
      rewritten
    ].sort((left, right) => order(left.key) - order(right.key));
  }

  return { ...saved, issues };
}
clearInterval(timer);

const valid = ZPackageCourse.safeParse(written.course);
const lessons = written.course.sections.flatMap((section) => section.lessons);
const blocks = lessons.flatMap((lesson) => lesson.blocks);
const textBlocks = blocks.filter((block) => block.type === 'text' || block.type === 'callout');
const byRole = client.ledger.entries.reduce(
  (acc, entry) => ({ ...acc, [entry.role]: (acc[entry.role] ?? 0) + entry.costUsd }),
  {}
);
const cacheRead = client.ledger.entries.reduce((sum, entry) => sum + entry.cacheReadTokens, 0);
const summary = {
  course: written.course.title,
  seconds: Math.round((Date.now() - startedAt) / 1000),
  costUsd: Number(totalCost().toFixed(4)),
  costByRole: Object.fromEntries(Object.entries(byRole).map(([role, cost]) => [role, Number(cost.toFixed(4))])),
  requests: client.ledger.entries.length,
  cacheReadTokens: cacheRead,
  validPackageCourse: valid.success,
  sections: written.course.sections.length,
  plannedSections: briefs.length,
  lessons: lessons.length,
  plannedLessons: briefs.reduce((sum, brief) => sum + brief.lessons.length, 0),
  textBlocks: textBlocks.length,
  citedTextBlocks: textBlocks.filter((block) => block.citations.length).length,
  citedSourceBlocks: new Set(textBlocks.flatMap((block) => block.citations.flatMap((citation) => citation.blockIds)))
    .size,
  sectionCheckQuestions: written.course.sections.map((section) => section.check.length),
  finalQuiz: written.course.finalQuiz.length,
  practiceTasks: written.course.practiceTasks.length,
  questionTypes: [...written.course.sections.flatMap((section) => section.check), ...written.course.finalQuiz].reduce(
    (acc, question) => ({ ...acc, [question.type]: (acc[question.type] ?? 0) + 1 }),
    {}
  ),
  stats: written.stats,
  gaps: written.gaps.length,
  issues: written.issues
};

const html = courseHtml(written.course);

writeFileSync(join(DATA, 'written-course.json'), `${JSON.stringify({ summary, written }, null, 2)}\n`);
writeFileSync(join(DATA, 'written-course.html'), html);
console.log(JSON.stringify(summary, null, 2));
