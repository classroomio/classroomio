/**
 * Measures the plan (item 8) on the gold organisation's snapshot (eval-data/energis, git-ignored): builds the corpus
 * from its 140 knowledge-base pages, makes page cards (item 7's gold-corpus cost), the glossary, the course list and
 * one section plan per course, then judges how much of the gold course the plan covers (`judgeCoverage`, target ≥ 90%).
 * Spends real tokens: needs ANTHROPIC_API_KEY. `--reuse-cards` reuses eval-data/energis/cards.json from an earlier run.
 * Writes eval-data/energis/plan-result.json. Progress every 30 s: the stage running, time and cost so far.
 * `--planner-model` and `--planner-effort` plan with another model or effort and write plan-result-<model>-<effort>-<run>.json,
 * `--run` naming the run.
 * Run: node eval/plan-gold.mjs [--courses=4] [--reuse-cards] [--planner-effort=high] [--run=1]
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildCorpus,
  buildGlossary,
  ClaudeClient,
  judgeCoverage,
  pageCards,
  planCourseList,
  planCourses,
  sectionBriefs,
  teachablePages
} from '../dist/index.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const DATA = join(ROOT, 'eval-data', 'energis');
const argv = process.argv.slice(2);
const option = (name, fallback) => argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback;
const courseCount = Number(option('courses', 4));
const reuseCards = argv.includes('--reuse-cards');
const ANSWERS = {
  firstOutcome: 'onboard-customers',
  jobRole: 'customer-education',
  companySize: '51-200',
  learningMethod: 'help-docs'
};

if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');

const plannerEffort = option('planner-effort', null);
const plannerModel = option('planner-model', null);
const runName = option('run', '1');
const plannerOverride = {
  ...(plannerEffort ? { effort: plannerEffort } : {}),
  ...(plannerModel ? { model: plannerModel } : {})
};
const variant = [plannerModel, plannerEffort].filter(Boolean).join('-');
const client = new ClaudeClient({
  apiKey: process.env.ANTHROPIC_API_KEY,
  roleModels: variant ? { planner: plannerOverride } : undefined
});
const startedAt = Date.now();
const costByRole = () =>
  client.ledger.entries.reduce((acc, entry) => ({ ...acc, [entry.role]: (acc[entry.role] ?? 0) + entry.costUsd }), {});
const totalCost = () => client.ledger.entries.reduce((sum, entry) => sum + entry.costUsd, 0);
let stage = 'starting';
const timer = setInterval(() => {
  console.log(
    `[progress ${Math.round((Date.now() - startedAt) / 1000)}s] ${stage}; ${client.ledger.entries.length} requests, $${totalCost().toFixed(3)} so far`
  );
}, 30_000);
const step = (name) => {
  stage = name;
  console.log(`${Math.round((Date.now() - startedAt) / 1000)}s: ${name} ($${totalCost().toFixed(3)} so far)`);
};

const knowledgeBase = JSON.parse(readFileSync(join(DATA, 'knowledge-base.json'), 'utf8'));
const sourcePages = knowledgeBase.map((entry, index) => ({
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
}));
const corpus = buildCorpus(sourcePages, 'en');
const pages = teachablePages(corpus);
const pagesById = new Map(pages.map((page) => [page.pageId, page]));
const productPages = JSON.parse(readFileSync(join(DATA, 'product-pages.json'), 'utf8')).map((entry) => ({
  pageId: entry.url,
  title: entry.title,
  text: `${entry.summary ?? ''}\n${entry.markdown ?? ''}`
}));
console.log(
  `corpus: ${corpus.pages.length} pages, ${pages.length} teachable, excluded ${JSON.stringify(corpus.excluded)}`
);

const cardsPath = join(DATA, 'cards.json');
let cards;
if (reuseCards && existsSync(cardsPath)) {
  cards = new Map(JSON.parse(readFileSync(cardsPath, 'utf8')).map((card) => [card.pageId, card]));
  step(`reusing ${cards.size} cards`);
} else {
  step('page cards');
  const run = await pageCards(client, pages);
  cards = run.cards;
  writeFileSync(cardsPath, JSON.stringify([...cards.values()]));
  console.log(`cards: ${cards.size}, failures ${run.failures.length}, $${(costByRole().card ?? 0).toFixed(4)}`);
}
const glossary = buildGlossary(cards.values());

const input = { pages, cards, productPages, answers: ANSWERS, courseCount };
step('course list');
const courseList = await planCourseList(client, input);
console.log(
  JSON.stringify(
    courseList.courses.map((course) => `${course.title} [${course.area}] ${course.pageIds.length} pages`),
    null,
    1
  )
);
console.log(
  `coverage: ${courseList.coverage.used.length} used, ${courseList.coverage.excluded.length} excluded, ${courseList.coverage.unplaced.length} unplaced; issues ${JSON.stringify(courseList.issues)}`
);

step('section plans');
const plans = await planCourses(client, input, courseList, glossary);
const briefs = plans.flatMap((plan) => sectionBriefs(plan, pagesById, glossary));

step('coverage judge');
const gold = JSON.parse(readFileSync(join(DATA, 'gold-course.json'), 'utf8'));
const candidate = {
  courses: plans.map((plan) => ({
    title: plan.title,
    sections: plan.sections.map((section) => ({
      title: section.title,
      lessons: section.lessons.map((lesson) => lesson.title)
    }))
  }))
};
const coverage = await judgeCoverage(client, gold, candidate);
clearInterval(timer);

const summary = {
  seconds: Math.round((Date.now() - startedAt) / 1000),
  costUsd: Number(totalCost().toFixed(4)),
  costByRole: Object.fromEntries(Object.entries(costByRole()).map(([role, cost]) => [role, Number(cost.toFixed(4))])),
  requests: client.ledger.entries.length,
  planner: variant || 'default',
  plannerCalls: client.ledger.entries
    .filter((entry) => entry.role === 'planner')
    .map((entry) => ({ seconds: Math.round(entry.durationMs / 1000), output: entry.outputTokens })),
  goldCoverage: coverage.score,
  verdicts: {
    covered: coverage.covered,
    partial: coverage.partial,
    missing: coverage.missing,
    unknown: coverage.unknown
  },
  courses: plans.map((plan) => ({
    title: plan.title,
    sections: plan.sections.length,
    lessons: plan.sections.reduce((sum, section) => sum + section.lessons.length, 0),
    issues: plan.issues,
    openQuestions: plan.openQuestions.length
  })),
  listIssues: courseList.issues,
  pageCoverage: {
    used: courseList.coverage.used.length,
    excluded: courseList.coverage.excluded.length,
    unplaced: courseList.coverage.unplaced.length
  },
  briefs: briefs.length
};
writeFileSync(
  join(DATA, variant ? `plan-result-${variant}-${runName}.json` : 'plan-result.json'),
  `${JSON.stringify({ summary, courseList, plans, judgement: coverage.judgement, candidate }, null, 2)}\n`
);
console.log(JSON.stringify(summary, null, 2));
