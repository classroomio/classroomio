import {
  buildReport,
  ClaudeClient,
  coursePackage,
  discoverSources,
  finishStage,
  packageLabels,
  planStage,
  prepareCorpus,
  readStage,
  storedImages,
  understandStage,
  writeStage,
  type CoursePlan,
  type DiscoveredSource,
  type DiscoveryFetcher,
  type FinishedCourse,
  type PageCard,
  type PageMedia,
  type PageRenderer,
  type PreparedCorpus,
  type ReadSourceStage,
  type SourceMap,
  type SourceOutcome,
  type SourcePage,
  type Understanding,
  type WrittenCourse
} from '@cio/course-builder';
import type { CompletenessReport } from '@cio/course-builder';
import {
  addCourseBuildJobCost,
  claimCourseBuildJob,
  countUnfinishedCourseBuildSources,
  createCourseBuildCourses,
  createCourseBuildJob,
  createCourseBuildSources,
  getCourseBuildCourseById,
  getCourseBuildJobById,
  getCourseBuildSourceById,
  incrementCourseBuildSectionsWritten,
  listCourseBuildCourses,
  listCourseBuildPages,
  listCourseBuildSources,
  replaceCourseBuildSourcePages,
  setCourseBuildPageCards,
  updateCourseBuildCourse,
  updateCourseBuildSource,
  updateRunningCourseBuildJob
} from '@cio/db/queries/course-build';
import type { TCourseBuildCourse, TCourseBuildJob } from '@cio/db/types';
import { enqueueCourseBuildStage, type TCourseBuildQueueStage } from '@cio/jobs';
import {
  ZCourseBuildScope,
  type TCourseBuildScope,
  type TCourseBuildScopeInput
} from '@cio/utils/validation/course-build';

import { recordTokenUsage } from '../agent/usage';
import { publishPackageCourse } from './publish';

/** What the host gives a build: network access, an optional browser, image storage and API keys. */
export interface CourseBuildHost {
  anthropicApiKey: string;
  fetcher: DiscoveryFetcher;
  renderer?: PageRenderer | null;
  /** Copies an image into the host's storage and returns the stored URL; without it images are left out. */
  captureImage?: (imageUrl: string, pageUrl: string) => Promise<string | null>;
}

/** `ai_token_usage.course_id` is NOT NULL but carries no FK; build stages have no course yet. */
const UNATTRIBUTED_COURSE_ID = '00000000-0000-0000-0000-000000000000';
const PROGRESS_WRITE_MS = 5_000;

type StoredSourceMap = Omit<SourceMap, 'sources'>;

function errorOf(error: unknown): { code: string; message: string } {
  return {
    code: error instanceof Error ? error.name : 'Error',
    message: error instanceof Error ? error.message : String(error)
  };
}

function scopeOf(job: TCourseBuildJob): TCourseBuildScope {
  return ZCourseBuildScope.parse(job.scope);
}

async function runningJob(jobId: string): Promise<TCourseBuildJob | null> {
  const job = await getCourseBuildJobById(jobId);

  return job?.status === 'RUNNING' ? job : null;
}

async function enqueue(
  stage: TCourseBuildQueueStage,
  job: TCourseBuildJob,
  item: { sourceId?: string; courseBuildCourseId?: string } = {}
) {
  await enqueueCourseBuildStage(stage, { jobId: job.id, organizationId: job.organizationId, ...item });
}

/** A Claude client for one stage, with what earlier stages spent counted against the build's budget. */
function stageClient(host: CourseBuildHost, job: TCourseBuildJob): ClaudeClient {
  return new ClaudeClient({
    apiKey: host.anthropicApiKey,
    budget: { limitUsd: scopeOf(job).budgetUsd, spentUsd: job.costUsd }
  });
}

/**
 * Records one stage run's spend on the job and in `ai_token_usage`. Build usage never counts toward the organisation's
 * AI balance (plan §5.2).
 */
async function recordSpend(job: TCourseBuildJob, stage: string, startedAt: number, client: ClaudeClient | null) {
  const byRole = Object.fromEntries(
    Object.entries(client?.ledger.byRole() ?? {}).map(([role, row]) => [role, row.costUsd])
  );
  const costUsd = client?.ledger.totalCostUsd ?? 0;
  const seconds = Math.round((Date.now() - startedAt) / 1000);
  await addCourseBuildJobCost(job.id, stage, { costUsd, byRole, seconds });

  const byModel = new Map<string, { promptTokens: number; completionTokens: number }>();
  for (const entry of client?.ledger.entries ?? []) {
    const row = byModel.get(entry.model) ?? { promptTokens: 0, completionTokens: 0 };
    row.promptTokens += entry.inputTokens + entry.cacheWrite5mTokens + entry.cacheWrite1hTokens + entry.cacheReadTokens;
    row.completionTokens += entry.outputTokens;
    byModel.set(entry.model, row);
  }
  for (const [model, tokens] of byModel) {
    const usage = { ...tokens, totalTokens: tokens.promptTokens + tokens.completionTokens };
    try {
      await recordTokenUsage(job.organizationId, job.profileId, UNATTRIBUTED_COURSE_ID, usage, model, {
        countsTowardBalance: false
      });
    } catch (error) {
      console.error('course-build.usage_record_failed', { jobId: job.id, stage, error: String(error) });
    }
  }
}

/** Runs one stage's work and records its spend and time, whether it finished or threw. */
async function withSpend<Result>(
  job: TCourseBuildJob,
  stage: string,
  client: ClaudeClient | null,
  run: () => Promise<Result>
): Promise<Result> {
  const startedAt = Date.now();
  try {
    return await run();
  } finally {
    await recordSpend(job, stage, startedAt, client);
  }
}

async function loadReads(jobId: string): Promise<ReadSourceStage[]> {
  const [sources, pages] = await Promise.all([listCourseBuildSources(jobId), listCourseBuildPages(jobId)]);

  return sources
    .filter((source) => source.status === 'READ')
    .map((source) => {
      const own = pages.filter((page) => page.sourceId === source.id);
      const media: Record<string, PageMedia> = {};
      for (const row of own) {
        const page = row.page as unknown as SourcePage;
        if (row.media) media[page.id] = row.media as unknown as PageMedia;
      }

      return {
        source: source.source as unknown as DiscoveredSource,
        outcome: source.outcome as SourceOutcome,
        pages: own.map((row) => row.page as unknown as SourcePage),
        media,
        completeness: source.completeness as unknown as CompletenessReport,
        readAt: source.readAt ?? source.updatedAt
      };
    });
}

function fetchedAtOf(reads: ReadSourceStage[]): string {
  return reads.map((entry) => entry.readAt).sort()[0] ?? new Date().toISOString();
}

async function loadUnderstanding(job: TCourseBuildJob): Promise<Understanding> {
  const pages = await listCourseBuildPages(job.id);
  const stored = (job.understanding ?? {}) as unknown as Omit<Understanding, 'cards'>;
  const cards = pages.flatMap((row) => (row.card ? [row.card as unknown as PageCard] : []));

  return {
    cards,
    cardFailures: stored.cardFailures ?? [],
    glossary: stored.glossary ?? [],
    aliasConflicts: stored.aliasConflicts ?? []
  };
}

async function finishJob(jobId: string, status: 'COMPLETED' | 'NOTHING_TO_BUILD' | 'FAILED', error?: unknown) {
  await updateRunningCourseBuildJob(jobId, {
    status,
    stage: 'done',
    finishedAt: new Date().toISOString(),
    ...(error ? { error: errorOf(error) } : {})
  });
}

/** Ends the build once every planned course is ready or failed: completed when at least one course was created. */
async function settleCourses(jobId: string) {
  const courses = await listCourseBuildCourses(jobId);
  if (courses.some((course) => course.status !== 'READY' && course.status !== 'FAILED')) return;

  const anyReady = courses.some((course) => course.status === 'READY');
  await finishJob(
    jobId,
    anyReady ? 'COMPLETED' : 'FAILED',
    anyReady ? undefined : new Error('No course could be built')
  );
}

export interface StartCourseBuildInput {
  organizationId: string;
  profileId: string;
  scope: TCourseBuildScopeInput;
}

/** Records a new build and enqueues its first stage. */
export async function startCourseBuild(input: StartCourseBuildInput): Promise<TCourseBuildJob> {
  const scope = ZCourseBuildScope.parse(input.scope);
  const job = await createCourseBuildJob({
    organizationId: input.organizationId,
    profileId: input.profileId,
    scope
  });
  await enqueue('discover', job);

  return job;
}

/** Finds the product site and documentation sources, stores them, and enqueues one read per source. */
export async function runCourseBuildDiscover(jobId: string, host: CourseBuildHost): Promise<void> {
  const job = await claimCourseBuildJob(jobId);
  if (!job) return;

  const scope = scopeOf(job);
  const map = await withSpend(job, 'discover', null, () =>
    discoverSources(scope.websiteUrl, { fetcher: host.fetcher })
  );
  const { sources, ...sourceMap } = map;
  await updateRunningCourseBuildJob(jobId, {
    sourceMap: sourceMap as unknown as Record<string, unknown>,
    stage: 'read'
  });

  const rows = await createCourseBuildSources(
    sources.map((source, position) => ({
      jobId,
      position,
      kind: source.kind,
      url: source.url,
      source: source as unknown as Record<string, unknown>
    }))
  );
  if (!rows.length) {
    await finishJob(jobId, 'NOTHING_TO_BUILD');
    return;
  }

  for (const row of rows) await enqueue('read', job, { sourceId: row.id });
}

/** Moves on to the understand stage once no source is pending or being read. */
async function afterSourceSettled(job: TCourseBuildJob) {
  const unfinished = await countUnfinishedCourseBuildSources(job.id);
  if (unfinished === 0) await enqueue('understand', job);
}

/** Reads one source and stores its pages. */
export async function runCourseBuildRead(jobId: string, sourceId: string, host: CourseBuildHost): Promise<void> {
  const job = await runningJob(jobId);
  const sourceRow = await getCourseBuildSourceById(sourceId);
  if (!job || !sourceRow || sourceRow.jobId !== jobId) return;

  const scope = scopeOf(job);
  const source = sourceRow.source as unknown as DiscoveredSource;
  const sourceMap = (job.sourceMap ?? {}) as unknown as StoredSourceMap;
  await updateCourseBuildSource(sourceId, { status: 'READING', pagesRead: 0 });

  let pagesRead = 0;
  let lastWrite = Date.now();
  const read = await withSpend(job, `read:${sourceRow.position + 1}`, null, () =>
    readStage({
      source,
      sourceMap,
      fetcher: host.fetcher,
      renderer: host.renderer,
      locale: scope.locale,
      maxPages: source.kind === 'product-site' ? scope.productSitePages : scope.maxPagesPerSource,
      captureImage: host.captureImage,
      onPage: () => {
        pagesRead += 1;
        if (Date.now() - lastWrite < PROGRESS_WRITE_MS) return;

        lastWrite = Date.now();
        void updateCourseBuildSource(sourceId, { pagesRead }).catch(() => undefined);
      }
    })
  );

  await replaceCourseBuildSourcePages(
    sourceId,
    read.pages.map((page, position) => ({
      jobId,
      sourceId,
      url: page.url,
      position,
      page: page as unknown as Record<string, unknown>,
      media: (read.media[page.id] ?? null) as unknown as Record<string, unknown> | null
    }))
  );
  await updateCourseBuildSource(sourceId, {
    status: 'READ',
    outcome: read.outcome,
    completeness: read.completeness as unknown as Record<string, unknown>,
    pagesRead: read.pages.length,
    readAt: read.readAt
  });
  await afterSourceSettled(job);
}

/** A read that failed for good: the source is recorded as failed and the build goes on with the others. */
export async function failCourseBuildRead(jobId: string, sourceId: string, error: unknown): Promise<void> {
  const job = await runningJob(jobId);
  if (!job) return;

  await updateCourseBuildSource(sourceId, { status: 'FAILED', error: errorOf(error) });
  await afterSourceSettled(job);
}

/** Builds the corpus and runs the gate; when it passes, makes page cards and the glossary. */
export async function runCourseBuildUnderstand(jobId: string, host: CourseBuildHost): Promise<void> {
  const job = await updateRunningCourseBuildJob(jobId, { stage: 'understand' });
  if (!job) return;

  const scope = scopeOf(job);
  const prepared = prepareCorpus(await loadReads(jobId), scope.locale);
  await updateRunningCourseBuildJob(jobId, { gate: prepared.gate as unknown as Record<string, unknown> });
  if (!prepared.gate.passed) {
    await finishJob(jobId, 'NOTHING_TO_BUILD');
    return;
  }

  const client = stageClient(host, job);
  const understanding = await withSpend(job, 'understand', client, () => understandStage(client, prepared));

  const pages = await listCourseBuildPages(jobId);
  const rowIdByPageId = new Map(pages.map((row) => [(row.page as unknown as SourcePage).id, row.id]));
  await setCourseBuildPageCards(
    understanding.cards.flatMap((card) => {
      const pageRowId = rowIdByPageId.get(card.pageId);

      return pageRowId ? [{ pageRowId, card: card as unknown as Record<string, unknown> }] : [];
    })
  );
  const { cards: _cards, ...stored } = understanding;
  await updateRunningCourseBuildJob(jobId, {
    understanding: stored as unknown as Record<string, unknown>,
    stage: 'plan'
  });
  await enqueue('plan', job);
}

/** Plans the course list and each course's sections, then enqueues one write per course. */
export async function runCourseBuildPlan(jobId: string, host: CourseBuildHost): Promise<void> {
  const job = await updateRunningCourseBuildJob(jobId, { stage: 'plan' });
  if (!job) return;

  const scope = scopeOf(job);
  const prepared = prepareCorpus(await loadReads(jobId), scope.locale);
  const understanding = await loadUnderstanding(job);
  const client = stageClient(host, job);
  const planned = await withSpend(job, 'plan', client, () =>
    planStage(client, { prepared, understanding, answers: scope.answers, courseCount: scope.courseCount })
  );

  await updateRunningCourseBuildJob(jobId, {
    courseList: planned.courseList as unknown as Record<string, unknown>,
    stage: 'write'
  });
  const rows = await createCourseBuildCourses(
    planned.plans.map((plan, position) => ({
      jobId,
      position,
      title: plan.title,
      plan: plan as unknown as Record<string, unknown>,
      sectionsTotal: plan.sections.length
    }))
  );
  if (!rows.length) {
    await finishJob(jobId, 'NOTHING_TO_BUILD');
    return;
  }

  for (const row of rows) await enqueue('write', job, { courseBuildCourseId: row.id });
}

interface CourseContext {
  job: TCourseBuildJob;
  row: TCourseBuildCourse;
  scope: TCourseBuildScope;
  reads: ReadSourceStage[];
  prepared: PreparedCorpus;
  understanding: Understanding;
}

async function courseContext(jobId: string, courseBuildCourseId: string): Promise<CourseContext | null> {
  const job = await runningJob(jobId);
  const row = await getCourseBuildCourseById(courseBuildCourseId);
  if (!job || !row || row.jobId !== jobId) return null;

  const scope = scopeOf(job);
  const reads = await loadReads(jobId);

  return {
    job,
    row,
    scope,
    reads,
    prepared: prepareCorpus(reads, scope.locale),
    understanding: await loadUnderstanding(job)
  };
}

/** Writes one planned course. */
export async function runCourseBuildWrite(jobId: string, courseBuildCourseId: string, host: CourseBuildHost) {
  const context = await courseContext(jobId, courseBuildCourseId);
  if (!context) return;

  const { job, row } = context;
  await updateCourseBuildCourse(row.id, { status: 'WRITING', sectionsWritten: 0 });
  const client = stageClient(host, job);
  const written = await withSpend(job, `write:${row.position + 1}`, client, () =>
    writeStage(client, {
      plan: row.plan as unknown as CoursePlan,
      corpus: context.prepared.corpus,
      glossary: context.understanding.glossary,
      fetchedAt: fetchedAtOf(context.reads),
      storedImages: host.captureImage ? storedImages(context.reads) : undefined,
      fetcher: host.fetcher,
      onSectionDone: () => void incrementCourseBuildSectionsWritten(row.id).catch(() => undefined)
    })
  );

  await updateCourseBuildCourse(row.id, {
    written: written as unknown as Record<string, unknown>,
    status: 'CHECKING'
  });
  await enqueue('finish', job, { courseBuildCourseId: row.id });
}

/** Checks, repairs and reviews one written course. */
export async function runCourseBuildFinish(jobId: string, courseBuildCourseId: string, host: CourseBuildHost) {
  const context = await courseContext(jobId, courseBuildCourseId);
  if (!context?.row.written) return;

  const { job, row } = context;
  const plan = row.plan as unknown as CoursePlan;
  const otherCourseTitles = (await listCourseBuildCourses(jobId))
    .filter((course) => course.id !== row.id)
    .map((course) => course.title);
  const client = stageClient(host, job);
  const finished = await withSpend(job, `finish:${row.position + 1}`, client, () =>
    finishStage(client, {
      plan,
      corpus: context.prepared.corpus,
      glossary: context.understanding.glossary,
      fetchedAt: fetchedAtOf(context.reads),
      written: row.written as unknown as WrittenCourse,
      otherCourseTitles
    })
  );

  await updateCourseBuildCourse(row.id, {
    finished: finished as unknown as Record<string, unknown>,
    status: 'EXPORTING'
  });
  await enqueue('export', job, { courseBuildCourseId: row.id });
}

/** Creates one finished course in the organisation, unpublished, from its learning package. */
export async function runCourseBuildExport(jobId: string, courseBuildCourseId: string, host: CourseBuildHost) {
  const context = await courseContext(jobId, courseBuildCourseId);
  if (!context?.row.finished) return;

  const { row, scope } = context;
  const job = (await getCourseBuildJobById(jobId)) ?? context.job;
  const finished = row.finished as unknown as FinishedCourse;
  const client = stageClient(host, job);
  const labels = await withSpend(job, `export:${row.position + 1}`, client, () => packageLabels(client, scope.locale));
  const report = buildReport({
    sourceMap: (job.sourceMap ?? { needsConfirmation: [], skipped: [] }) as unknown as StoredSourceMap,
    sources: context.reads,
    prepared: context.prepared,
    finished: [finished],
    cost: { totalUsd: job.costUsd, byRole: job.costByRole },
    timings: {
      totalSeconds: Object.values(job.secondsByStage).reduce((sum, seconds) => sum + seconds, 0),
      byStage: job.secondsByStage
    }
  });
  const pkg = coursePackage(finished.course, report, scope.locale, labels);
  const published = await publishPackageCourse({
    organizationId: job.organizationId,
    profileId: job.profileId,
    pkg,
    courseKey: finished.course.key,
    idempotencyKey: `course-build:${row.id}`,
    existingCourseId: row.courseId,
    onCourseCreated: async (courseId) => {
      await updateCourseBuildCourse(row.id, { courseId });
    }
  });

  await updateCourseBuildCourse(row.id, {
    status: 'READY',
    courseId: published.courseId,
    courseImportDraftId: published.courseImportDraftId
  });
  await settleCourses(jobId);
}

/** A course whose write, finish or export failed for good: the build goes on with the other courses. */
export async function failCourseBuildCourse(jobId: string, courseBuildCourseId: string, error: unknown) {
  await updateCourseBuildCourse(courseBuildCourseId, { status: 'FAILED', error: errorOf(error) });
  await settleCourses(jobId);
}

/** A discover, understand or plan stage that failed for good ends the build. */
export async function failCourseBuild(jobId: string, error: unknown) {
  await finishJob(jobId, 'FAILED', error);
}
