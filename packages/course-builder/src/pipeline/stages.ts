import { buildCorpus, teachablePages } from '../corpus/corpus';
import { EXCLUDED_PATH_SEGMENTS } from '../corpus/exclude';
import type { Corpus, CorpusPage } from '../corpus/types';
import type { DiscoveredSource, DiscoveryFetcher, SourceMap } from '../discover/discover';
import type { Fetcher } from '../fetch/types';
import { usefulnessGate, type GateResult } from '../gate/gate';
import { BudgetExceededError } from '../llm/claude';
import { oembedInfo } from '../media/lesson-media';
import type { ChannelVideo } from '../media/youtube';
import {
  LEARNING_PACKAGE_VERSION,
  ZPackageCourse,
  type BuildReport,
  type LearningPackage,
  type PackageCourse,
  type PackageLabels
} from '../package/schema';
import { lessonSources, sectionBriefs, type SectionBrief } from '../plan/briefs';
import { planCourseList, type CourseList, type OnboardingAnswers } from '../plan/course-list';
import { courseGlossary, planCourses, type CoursePlan } from '../plan/sections';
import type { PageMedia } from '../read/media';
import { readSource } from '../read/read-source';
import type { PageRenderer, SourceOutcome } from '../read/types';
import type { CompletenessReport, SourcePage } from '../sources/types';
import {
  addAliases,
  buildGlossary,
  type AliasConflict,
  type GlossaryEntry,
  type ProductPage
} from '../understand/glossary';
import { pageCards, type CardFailure, type PageCard } from '../understand/page-card';
import { checkCourse, type CheckContext } from '../verify/check-course';
import { corpusBlockLookup } from '../verify/lookup';
import { applyReviewFixes, reviewCourse, type AppliedReview } from '../verify/review';
import type { CheckIssue, StructuredCaller } from '../verify/types';
import { writeCourse, type WrittenCourse } from '../write/course-writer';
import { repairCourse, type RepairedCourse } from '../write/repair-course';
import type { CitedCaller } from '../write/section-writer';

export type BuildCaller = CitedCaller & StructuredCaller;

/** One source once read: everything later stages and the build report need from it. */
export interface ReadSourceStage {
  source: DiscoveredSource;
  outcome: SourceOutcome;
  pages: SourcePage[];
  media: Record<string, PageMedia>;
  completeness: CompletenessReport;
  readAt: string;
}

export interface ReadStageInput {
  source: DiscoveredSource;
  sourceMap: Pick<SourceMap, 'brandDomain' | 'siteTitle'>;
  fetcher: DiscoveryFetcher;
  renderer?: PageRenderer | null;
  locale: string;
  maxPages: number;
  deadlineAt?: number;
  captureImage?: (imageUrl: string, pageUrl: string) => Promise<string | null>;
  onPage?: () => void;
  signal?: AbortSignal;
}

/**
 * The product site is read with a small page budget and only to plan and to name features, so it skips the paths the
 * corpus never teaches (blog, legal, careers, community, release notes) instead of spending the budget on them.
 */
export const PRODUCT_SITE_EXCLUDE = EXCLUDED_PATH_SEGMENTS.flatMap((segment) => [`*/${segment}`, `*/${segment}/*`]);

/** Reads one discovered source. The product site's title is the name the relevance check looks for on other domains. */
export async function readStage(input: ReadStageInput): Promise<ReadSourceStage> {
  const brandDomain = input.sourceMap.brandDomain ?? new URL(input.source.url).hostname;
  const result = await readSource({
    fetcher: input.fetcher,
    renderer: input.renderer,
    source: input.source,
    brandDomain,
    productNames: input.sourceMap.siteTitle ? [input.sourceMap.siteTitle] : [],
    preferredLocale: input.locale,
    maxPages: input.maxPages,
    exclude: input.source.kind === 'product-site' ? PRODUCT_SITE_EXCLUDE : undefined,
    deadlineAt: input.deadlineAt,
    captureImage: input.captureImage,
    onPage: input.onPage,
    signal: input.signal
  });

  return {
    source: input.source,
    outcome: result.outcome,
    pages: result.tree.pages,
    media: result.media,
    completeness: result.tree.completeness,
    readAt: result.tree.readAt
  };
}

export interface PreparedCorpus {
  corpus: Corpus;
  gate: GateResult;
  /** The product site's pages, as text: used to plan and to name features, never taught from. */
  productPages: ProductPage[];
}

function pageText(page: CorpusPage): string {
  return page.blocks.map((block) => block.text).join('\n');
}

/** Every source numbers its pages from 0; reading order across sources is source by source, in discovery order. */
function inReadingOrder(sources: ReadSourceStage[]): SourcePage[] {
  let offset = 0;

  return sources.flatMap((entry) => {
    const pages = entry.pages.map((page) => ({ ...page, order: offset + page.order }));
    offset += Math.max(-1, ...entry.pages.map((page) => page.order)) + 1;

    return pages;
  });
}

/**
 * Builds the corpus from every source but the product site, and runs the usefulness gate. No model call: a site with
 * nothing to teach stops here at no cost.
 */
export function prepareCorpus(sources: ReadSourceStage[], locale: string): PreparedCorpus {
  const taught = sources.filter((entry) => entry.source.kind !== 'product-site');
  const product = sources.filter((entry) => entry.source.kind === 'product-site');
  const corpus = buildCorpus(inReadingOrder(taught), locale);
  const productCorpus = buildCorpus(inReadingOrder(product), locale);
  const gate = usefulnessGate(
    corpus.pages,
    taught.map((entry) => entry.outcome)
  );
  const productPages = productCorpus.pages
    .filter((page) => !page.excluded)
    .map((page) => ({ pageId: page.url, title: page.title, text: pageText(page) }));

  return { corpus, gate, productPages };
}

export interface Understanding {
  cards: PageCard[];
  cardFailures: CardFailure[];
  glossary: GlossaryEntry[];
  aliasConflicts: AliasConflict[];
}

/** Page cards for every teachable page, then the glossary with the aliases the product site confirms. */
export async function understandStage(
  caller: StructuredCaller,
  prepared: PreparedCorpus,
  options: { concurrency?: number; onCard?: () => void; signal?: AbortSignal } = {}
): Promise<Understanding> {
  const run = await pageCards(caller, teachablePages(prepared.corpus), {
    concurrency: options.concurrency,
    onCard: options.onCard,
    signal: options.signal
  });
  const named = await addAliases(caller, buildGlossary(run.cards.values()), prepared.productPages, options.signal);

  return {
    cards: [...run.cards.values()],
    cardFailures: run.failures,
    glossary: named.glossary,
    aliasConflicts: named.conflicts
  };
}

export interface PlanStageInput {
  prepared: PreparedCorpus;
  understanding: Understanding;
  answers: OnboardingAnswers;
  courseCount: number;
  signal?: AbortSignal;
}

export interface PlannedBuild {
  courseList: CourseList;
  plans: CoursePlan[];
}

/** The course list, then one section plan per course. */
export async function planStage(caller: StructuredCaller, input: PlanStageInput): Promise<PlannedBuild> {
  const planInput = {
    pages: teachablePages(input.prepared.corpus),
    cards: new Map(input.understanding.cards.map((card) => [card.pageId, card])),
    productPages: input.prepared.productPages,
    answers: input.answers,
    courseCount: input.courseCount,
    signal: input.signal
  };
  const courseList = await planCourseList(caller, planInput);
  const plans = await planCourses(caller, planInput, courseList, input.understanding.glossary);

  return { courseList, plans };
}

/**
 * The most writing, checking, repair and review cost a lesson has taken in measured builds ($0.03–0.05 to write and
 * $0.01 to finish), with a margin.
 */
export const COURSE_COST_PER_LESSON_USD = 0.07;

/**
 * The planned courses the budget left after planning can write and finish, at `COURSE_COST_PER_LESSON_USD` a lesson,
 * taken in plan order; a course that does not fit is set aside before anything is spent on it, so no course stops
 * half way for lack of budget. The first course is always kept.
 */
export function affordablePlans(
  plans: CoursePlan[],
  remainingUsd: number
): { kept: CoursePlan[]; dropped: CoursePlan[] } {
  const kept: CoursePlan[] = [];
  const dropped: CoursePlan[] = [];
  let left = remainingUsd;

  for (const plan of plans) {
    const lessons = plan.sections.reduce((total, section) => total + section.lessons.length, 0);
    const costUsd = lessons * COURSE_COST_PER_LESSON_USD;
    if (kept.length && costUsd > left) {
      dropped.push(plan);
      continue;
    }

    kept.push(plan);
    left -= costUsd;
  }

  return { kept, dropped };
}

/** The section briefs of one planned course. Pure, so each stage can rebuild them instead of storing them. */
export function courseBriefs(plan: CoursePlan, corpus: Corpus, glossary: GlossaryEntry[]): SectionBrief[] {
  const pagesById = new Map(corpus.pages.map((page) => [page.pageId, page]));

  return sectionBriefs(plan, pagesById, glossary);
}

export interface CourseStageInput {
  plan: CoursePlan;
  corpus: Corpus;
  glossary: GlossaryEntry[];
  /** When the pages were read, for every citation. */
  fetchedAt: string;
  signal?: AbortSignal;
}

export interface WriteStageInput extends CourseStageInput {
  /** Where the reader stored each image, by its source URL. An image without a stored copy is left out. */
  storedImages?: Readonly<Record<string, string>>;
  /** For each embedded video's oEmbed answer; without it, embedded videos are left out. */
  fetcher?: Fetcher;
  channelVideos?: ChannelVideo[];
  onSectionDone?: () => void;
}

/** Writes one planned course: sections with citations, checks, final quiz, practice tasks and media. */
export async function writeStage(caller: BuildCaller, input: WriteStageInput): Promise<WrittenCourse> {
  const fetcher = input.fetcher;
  const storedImages = input.storedImages;

  return writeCourse(caller, {
    plan: input.plan,
    briefs: courseBriefs(input.plan, input.corpus, input.glossary),
    glossary: courseGlossary(input.glossary, new Set(input.plan.course.pageIds)),
    fetchedAt: input.fetchedAt,
    storedImageUrl: storedImages ? (url) => storedImages[url] ?? null : undefined,
    videoInfo: fetcher ? (url) => oembedInfo(fetcher, url) : undefined,
    channelVideos: input.channelVideos,
    onSectionDone: input.onSectionDone,
    signal: input.signal
  });
}

/** The stored copy of every image the reader captured, by the image's source URL. */
export function storedImages(sources: ReadSourceStage[]): Record<string, string> {
  const stored: Record<string, string> = {};
  for (const entry of sources)
    for (const media of Object.values(entry.media))
      for (const image of media.images) if (image.storedUrl) stored[image.url] = image.storedUrl;

  return stored;
}

/** What the planner wrote each section's lessons from, for the reviewer. */
export function reviewCoverage(briefs: SectionBrief[]): string {
  return briefs
    .map(
      (brief) =>
        `${brief.section.key}: ${brief.section.title}\n${brief.lessons
          .map(
            (lesson) =>
              `  - ${lesson.key}: ${lesson.title} (${lesson.sources.map((source) => source.title).join('; ')})`
          )
          .join('\n')}`
    )
    .join('\n');
}

function countByKind(issues: CheckIssue[]): Record<string, number> {
  return issues.reduce<Record<string, number>>(
    (acc, issue) => ({ ...acc, [issue.kind]: (acc[issue.kind] ?? 0) + 1 }),
    {}
  );
}

/** What the checks found and what repair did, for the reviewer. */
export function checkerReport(repaired: RepairedCourse, issuesByKind: Record<string, number>): string {
  return [
    `Checks found: ${Object.entries(issuesByKind)
      .map(([kind, count]) => `${count} ${kind}`)
      .join(', ')}.`,
    `Repaired: ${repaired.repaired.join(', ') || 'nothing'}.`,
    ...repaired.removed.map((entry) => `Removed ${entry.what} of ${entry.target}: ${entry.reason}`),
    ...repaired.reported.map((issue) => `Note on ${issue.target}: ${issue.reason}`)
  ].join('\n');
}

export interface FinishStageInput extends CourseStageInput {
  written: WrittenCourse;
  /** Titles of the build's other courses; a lesson never refers to another course. */
  otherCourseTitles: string[];
  concurrency?: number;
}

export interface FinishedCourse {
  course: PackageCourse;
  valid: boolean;
  check: { claims: number; issuesByKind: Record<string, number>; unchecked: number };
  repair: Omit<RepairedCourse, 'course'>;
  review: Omit<AppliedReview, 'course'>;
  /** The build's budget ran out before the review; the checked and repaired course is kept without it. */
  reviewSkipped: boolean;
  /** For the build report: what writing, repair and review left out, and the gaps they found. */
  removedItems: BuildReport['removedItems'];
  gaps: BuildReport['gaps'];
}

/**
 * Checks a written course, repairs what failed, then has it reviewed and applies the review's fixes in code. When the
 * budget runs out at the review, the checked and repaired course is returned unreviewed rather than lost.
 */
export async function finishStage(caller: BuildCaller, input: FinishStageInput): Promise<FinishedCourse> {
  const briefs = courseBriefs(input.plan, input.corpus, input.glossary);
  const writtenCourse = input.written.course;
  const videoUrls = writtenCourse.sections.flatMap((section) =>
    section.lessons.flatMap((lesson) => lesson.blocks.flatMap((block) => (block.type === 'video' ? [block.url] : [])))
  );
  const checks: CheckContext = {
    blocks: corpusBlockLookup(input.corpus.pages),
    allowedUrls: new Set([...input.corpus.pages.map((page) => page.url), ...videoUrls]),
    glossary: new Set(input.glossary.flatMap((entry) => [entry.name, ...entry.aliases.map((alias) => alias.name)])),
    otherCourseTitles: input.otherCourseTitles,
    lessonSources: lessonSources(briefs)
  };
  const context = {
    courseTitle: input.plan.title,
    audience: input.plan.course.audience,
    outcomes: input.plan.outcomes,
    glossary: courseGlossary(input.glossary, new Set(input.plan.course.pageIds)),
    fetchedAt: input.fetchedAt
  };

  const checked = await checkCourse(caller, writtenCourse, checks, {
    concurrency: input.concurrency,
    signal: input.signal
  });
  const issuesByKind = countByKind(checked.issues);
  const repaired = await repairCourse(caller, {
    course: writtenCourse,
    briefs,
    context,
    checks,
    issues: checked.issues,
    claims: checked.claims,
    signal: input.signal
  });
  const fixes = await reviewCourse(
    caller,
    { course: repaired.course, coverage: reviewCoverage(briefs), checkerReport: checkerReport(repaired, issuesByKind) },
    input.signal
  ).catch((error: unknown) => {
    if (error instanceof BudgetExceededError) return null;
    throw error;
  });
  const { course, ...review } = applyReviewFixes(repaired.course, fixes ?? []);
  const { course: _repairedCourse, ...repair } = repaired;
  const removedItems: BuildReport['removedItems'] = [
    ...repaired.removed.map((entry) => ({
      kind: entry.what === 'blocks' ? ('lesson' as const) : entry.what,
      target: entry.target,
      reason: entry.what === 'blocks' ? `paragraphs removed: ${entry.reason}` : entry.reason
    })),
    ...review.removed
  ];
  const claims = [...checked.claims.values()].reduce((total, results) => total + results.length, 0);

  return {
    course,
    valid: ZPackageCourse.safeParse(course).success,
    check: { claims, issuesByKind, unchecked: checked.unchecked.length },
    repair,
    review,
    reviewSkipped: fixes === null,
    removedItems,
    gaps: [...input.written.gaps, ...review.gaps]
  };
}

export interface BuildReportInput {
  sourceMap: Pick<SourceMap, 'needsConfirmation' | 'skipped'>;
  sources: ReadSourceStage[];
  prepared: PreparedCorpus;
  finished: FinishedCourse[];
  cost: BuildReport['cost'];
  timings: BuildReport['timings'];
}

/** The build report: what was read, held, skipped and excluded, and what checking, repair and review changed. */
export function buildReport(input: BuildReportInput): BuildReport {
  return {
    sources: input.sources.map((entry) => ({
      url: entry.source.url,
      kind: entry.source.kind,
      evidence: entry.source.evidence,
      access: entry.source.access,
      status: entry.outcome,
      completeness: {
        declared: entry.completeness.declared,
        read: entry.completeness.read,
        ratio: entry.completeness.ratio,
        status: entry.completeness.status
      }
    })),
    held: input.sourceMap.needsConfirmation.map((source) => ({ url: source.url, reason: 'needs-confirmation' })),
    skipped: input.sourceMap.skipped.map((candidate) => ({ url: candidate.url, reason: candidate.reason })),
    excludedPages: input.prepared.corpus.pages.flatMap((page) =>
      page.excluded ? [{ url: page.url, title: page.title, reason: page.excluded }] : []
    ),
    contradictions: [],
    gaps: input.finished.flatMap((entry) => entry.gaps),
    removedItems: input.finished.flatMap((entry) => entry.removedItems),
    gate: input.prepared.gate,
    cost: input.cost,
    timings: input.timings
  };
}

/** A learning package holding one finished course, so a host can create each course as soon as it is ready. */
export function coursePackage(
  course: PackageCourse,
  report: BuildReport,
  locale: string,
  labels: PackageLabels
): LearningPackage {
  return { version: LEARNING_PACKAGE_VERSION, locale, labels, courses: [course], report };
}
