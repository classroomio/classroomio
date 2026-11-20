import { createHash } from 'node:crypto';

import { AppError, ErrorCodes } from '@api/utils/errors';
import { publishCourseImportDraftToExistingCourseService } from '@api/services/course-import/course-import';
import { getAppBaseUrl } from '@cio/core/config/dashboard-url';
import { captureServerEvent } from '@cio/core/services/posthog';
import { createCourse, updateCourse } from '@cio/core/services/course/course';
import { fillMissingStarterSlots, isOnboardingAiAvailable, runStarterJob } from '@cio/core/services/onboarding/index';
import {
  archiveUnpublishedStarterDrafts,
  cancelActiveStarterJobs,
  countStarterJobs,
  createStarterJob,
  discardStarterCourse,
  getCourseBySeedKey,
  getLatestStarterJob,
  getOnboardingSession,
  getOrganizationById,
  listStarterDrafts,
  markStarterDraftPublished,
  renameStarterDraft,
  replaceStarterDraftContent,
  setStarterDraftArchived
} from '@cio/db/queries';
import { getProfileById } from '@cio/db/queries/auth';
import type { TCourseImportDraft, TOnboardingStarterJob } from '@cio/db/types';
import { isRedisConfigured, enqueueOnboardingStarterJob } from '@cio/jobs';
import {
  STARTER_BANNER_PATHS,
  STARTER_COURSE_SLOTS,
  STARTER_REGENERATIONS_PER_ORG,
  buildStarterCourseSeedKey,
  type TStarterCourseSlot
} from '@cio/utils/constants/onboarding';
import { ZCourseImportDraftPayload, type TOnboardingStarterInput } from '@cio/utils/validation';
import {
  ONBOARDING_DESCRIPTION_MAX_LENGTH,
  ONBOARDING_DESCRIPTION_MIN_LENGTH,
  normalizeWebsiteUrl,
  type TOnboardingContextMode
} from '@cio/utils/validation/onboarding';
import type { TOnboardingSession } from '@cio/db/types';

import { phasesFrom, requireOnboardingSession } from './session';

function hashGenerationAnswers(input: TOnboardingStarterInput): string {
  const stable = JSON.stringify({
    firstOutcome: input.firstOutcome,
    contextMode: input.contextMode,
    websiteUrl: input.websiteUrl ?? null,
    description: input.description ?? null,
    locale: input.locale
  });

  return createHash('sha256').update(stable).digest('hex');
}

function hashStarterInput(input: TOnboardingStarterInput, mode: string): string {
  return createHash('sha256')
    .update(`${hashGenerationAnswers(input)}:${mode}`)
    .digest('hex');
}

type GenerationContext = { contextMode: TOnboardingContextMode; websiteUrl?: string; description?: string };

/**
 * Re-checks the saved answers that feed generation, because drafts saved after the business step are not fully
 * validated. Anything that would not pass the business step falls back to no context.
 */
function readGenerationContext(business: TOnboardingSession['business']): GenerationContext {
  if (business.contextMode === 'website') {
    const websiteUrl = business.websiteUrl ? normalizeWebsiteUrl(business.websiteUrl) : null;

    return websiteUrl ? { contextMode: 'website', websiteUrl } : { contextMode: 'none' };
  }

  if (business.contextMode === 'description') {
    const description = business.description?.trim() ?? '';
    const isValid =
      description.length >= ONBOARDING_DESCRIPTION_MIN_LENGTH &&
      description.length <= ONBOARDING_DESCRIPTION_MAX_LENGTH;

    return isValid ? { contextMode: 'description', description } : { contextMode: 'none' };
  }

  return { contextMode: 'none' };
}

async function dispatchStarterJob(job: TOnboardingStarterJob): Promise<void> {
  if (job.status !== 'PENDING') return;

  if (job.mode === 'sample') {
    await runStarterJob(job.id);

    return;
  }

  if (isRedisConfigured()) {
    try {
      await enqueueOnboardingStarterJob({ jobId: job.id, organizationId: job.organizationId });

      return;
    } catch (error) {
      console.error('onboarding.starter.enqueue_failed', { jobId: job.id, error: String(error) });
    }
  }

  void runStarterJob(job.id);
}

async function buildStarterInput(organizationId: string, profileId: string) {
  const [session, organization, profile] = await Promise.all([
    getOnboardingSession(profileId),
    getOrganizationById(organizationId),
    getProfileById(profileId)
  ]);

  if (!session || !organization || !profile) {
    throw new AppError('Onboarding session not found', ErrorCodes.ONBOARDING_SESSION_NOT_FOUND, 404);
  }

  const business = session.business;
  const generation = readGenerationContext(business);
  const mode: TOnboardingStarterJob['mode'] =
    isOnboardingAiAvailable() && generation.contextMode !== 'none' ? 'ai' : 'sample';

  const input: TOnboardingStarterInput = {
    productName: (session.brand.productName || organization.name).slice(0, 80),
    firstOutcome: business.firstOutcome ?? 'onboard-customers',
    contextMode: generation.contextMode,
    websiteUrl: generation.websiteUrl,
    description: generation.description,
    jobRole: business.jobRole ?? '',
    companySize: business.companySize ?? '',
    learningMethod: business.learningMethod ?? '',
    locale: profile.locale ?? 'en'
  };

  return { input, mode };
}

/**
 * Creates the starter-course job for a new organization and starts it. Sample jobs finish before this returns;
 * AI jobs run on the worker, or in this process when no queue is configured.
 */
export async function startStarterJob(params: { organizationId: string; profileId: string }) {
  const { organizationId, profileId } = params;
  const { input, mode } = await buildStarterInput(organizationId, profileId);

  const job = await createStarterJob({
    organizationId,
    profileId,
    mode,
    input,
    inputHash: hashStarterInput(input, mode)
  });

  await dispatchStarterJob(job);

  return job;
}

function toDraftSummary(row: TCourseImportDraft) {
  const payload = ZCourseImportDraftPayload.parse(row.draft);
  const onboarding = (row.summary as { onboarding?: { slot: TStarterCourseSlot; origin: 'ai' | 'sample' } }).onboarding;
  const slot: TStarterCourseSlot = onboarding?.slot ?? 'getting-started';

  return {
    slot,
    title: row.title,
    description: payload.course.description,
    origin: onboarding?.origin ?? ('sample' as const),
    status: row.status,
    sectionCount: payload.sections.length,
    lessonCount: payload.lessons.length,
    bannerPath: STARTER_BANNER_PATHS[slot]
  };
}

async function requireStarterContext(profileId: string, allowed: Parameters<typeof requireOnboardingSession>[1]) {
  const session = await requireOnboardingSession(profileId, allowed);
  if (!session.organizationId) {
    throw new AppError('Workspace not created yet', ErrorCodes.ONBOARDING_PHASE_MISMATCH, 409);
  }

  const job = await getLatestStarterJob(session.organizationId);
  if (!job) {
    throw new AppError('Starter courses not found', ErrorCodes.ONBOARDING_STARTER_NOT_FOUND, 404);
  }

  return { session, organizationId: session.organizationId, job };
}

async function listSortedDraftSummaries(organizationId: string, jobId: string) {
  const rows = await listStarterDrafts(organizationId, jobId);

  return rows
    .map(toDraftSummary)
    .sort((left, right) => STARTER_COURSE_SLOTS.indexOf(left.slot) - STARTER_COURSE_SLOTS.indexOf(right.slot));
}

/**
 * Status of the latest starter job and the drafts it has produced so far.
 */
export async function getStarterStatus(profileId: string) {
  const { organizationId, job } = await requireStarterContext(profileId, phasesFrom('workspace'));
  const [drafts, jobCount, current] = await Promise.all([
    listSortedDraftSummaries(organizationId, job.id),
    countStarterJobs(organizationId),
    buildStarterInput(organizationId, profileId)
  ]);
  const hasChangedAnswers = hashGenerationAnswers(current.input) !== hashGenerationAnswers(job.input);

  return {
    jobId: job.id,
    status: job.status,
    stage: job.stage,
    mode: job.mode,
    startedAt: job.startedAt,
    createdAt: job.createdAt,
    warning: job.extraction?.warning ?? null,
    drafts,
    hasChangedAnswers,
    regenerationsLeft: Math.max(0, STARTER_REGENERATIONS_PER_ORG - (jobCount - 1))
  };
}

/**
 * Replaces the current drafts with a fresh set built from the current answers. Allowed a limited number of times,
 * only before the starter courses are created, and not when both the old and the new job are sample jobs, because
 * they would produce the same content.
 */
export async function regenerateStarterCourses(profileId: string) {
  const { organizationId, job } = await requireStarterContext(profileId, ['customise']);
  const { input, mode } = await buildStarterInput(organizationId, profileId);

  if (job.mode === 'sample' && mode === 'sample') {
    throw new AppError('Sample courses cannot be regenerated', ErrorCodes.ONBOARDING_NOT_AVAILABLE, 409);
  }

  const jobCount = await countStarterJobs(organizationId);
  if (jobCount - 1 >= STARTER_REGENERATIONS_PER_ORG) {
    throw new AppError('Regeneration limit reached', ErrorCodes.ONBOARDING_REGENERATE_LIMIT, 429);
  }

  await cancelActiveStarterJobs(organizationId);
  await archiveUnpublishedStarterDrafts(organizationId, job.id);

  const nextJob = await createStarterJob({
    organizationId,
    profileId,
    mode,
    input,
    inputHash: hashStarterInput(input, `${mode}:${jobCount}`)
  });

  await dispatchStarterJob(nextJob);

  captureServerEvent({
    event: 'onboarding_starter_regenerated',
    distinctId: profileId,
    orgId: organizationId,
    properties: {
      mode,
      regenerations_used: jobCount,
      answers_changed: hashGenerationAnswers(input) !== hashGenerationAnswers(job.input)
    }
  });

  return getStarterStatus(profileId);
}

async function requireDraftBySlot(profileId: string, slot: TStarterCourseSlot) {
  const context = await requireStarterContext(profileId, ['customise']);
  const rows = await listStarterDrafts(context.organizationId, context.job.id);
  const row = rows.find((candidate) => toDraftSummary(candidate).slot === slot);

  if (!row) {
    throw new AppError('Starter course not found', ErrorCodes.ONBOARDING_STARTER_NOT_FOUND, 404);
  }

  return { ...context, row };
}

function assertDraftNotCreated(row: TCourseImportDraft): void {
  if (row.status === 'PUBLISHED') {
    throw new AppError(
      'This course was already created. Manage it from the Courses page.',
      ErrorCodes.ONBOARDING_PHASE_MISMATCH,
      409
    );
  }
}

export async function renameStarterCourse(profileId: string, slot: TStarterCourseSlot, title: string) {
  const { organizationId, row } = await requireDraftBySlot(profileId, slot);

  const renamed = await renameStarterDraft(organizationId, row.id, title);
  if (!renamed) throw new AppError('Starter course not found', ErrorCodes.ONBOARDING_STARTER_NOT_FOUND, 404);

  if (renamed.publishedCourseId) {
    await updateCourse(renamed.publishedCourseId, { title });
  }

  return toDraftSummary(renamed);
}

export async function removeStarterCourse(profileId: string, slot: TStarterCourseSlot) {
  const { organizationId, row } = await requireDraftBySlot(profileId, slot);
  assertDraftNotCreated(row);

  const archived = await setStarterDraftArchived(organizationId, row.id, true);
  if (!archived) throw new AppError('Starter course not found', ErrorCodes.ONBOARDING_STARTER_NOT_FOUND, 404);

  return toDraftSummary(archived);
}

export async function restoreStarterCourse(profileId: string, slot: TStarterCourseSlot) {
  const { organizationId, row } = await requireDraftBySlot(profileId, slot);
  assertDraftNotCreated(row);

  const restored = await setStarterDraftArchived(organizationId, row.id, false);
  if (!restored) throw new AppError('Starter course not found', ErrorCodes.ONBOARDING_STARTER_NOT_FOUND, 404);

  return toDraftSummary(restored);
}

async function createStarterCourse(params: {
  organizationId: string;
  profileId: string;
  draft: TCourseImportDraft;
  slot: TStarterCourseSlot;
  seedKey: string;
}): Promise<string> {
  const { organizationId, profileId, draft, slot, seedKey } = params;
  const payload = ZCourseImportDraftPayload.parse(draft.draft);

  const bannerImage = `${getAppBaseUrl()}${STARTER_BANNER_PATHS[slot]}`;
  let courseId: string;

  try {
    const { course } = await createCourse(
      profileId,
      {
        title: draft.title,
        description: payload.course.description,
        type: 'SELF_PACED',
        organizationId,
        bannerImage,
        seedKey
      },
      'onboarding'
    );
    courseId = course.id;
  } catch (error) {
    const concurrentCourse = await getCourseBySeedKey(seedKey);
    if (concurrentCourse) return concurrentCourse.id;

    throw error;
  }

  try {
    await publishCourseImportDraftToExistingCourseService(organizationId, draft.id, {
      courseId,
      syncMode: 'merge',
      title: draft.title,
      description: payload.course.description
    });
  } catch (error) {
    await discardStarterCourse(courseId);

    throw error;
  }

  await markStarterDraftPublished(draft.id, courseId);

  return courseId;
}

const MIN_RENAMEABLE_PRODUCT_NAME_LENGTH = 3;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Swaps the product name a job was drafted with for the current one, as a whole word, in a draft's title and
 * payload. Returns null when nothing changes or the old name is too short to replace safely. Only used when the
 * product name is the workspace name, so renaming the workspace later carries into the starter courses.
 */
export function renameProductInDraft(
  draft: Pick<TCourseImportDraft, 'title' | 'draft'>,
  previousName: string,
  nextName: string
): { title: string; draft: TCourseImportDraft['draft'] } | null {
  if (previousName === nextName || previousName.trim().length < MIN_RENAMEABLE_PRODUCT_NAME_LENGTH) return null;

  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(previousName)}(?![\\p{L}\\p{N}])`, 'gu');
  const title = draft.title.replace(pattern, () => nextName);
  const serialized = JSON.stringify(draft.draft);
  const replacement = JSON.stringify(nextName).slice(1, -1);
  const renamedPayload = serialized.replace(pattern, () => replacement);

  if (title === draft.title && renamedPayload === serialized) return null;

  return { title, draft: JSON.parse(renamedPayload) };
}

async function syncProductNameInDrafts(
  organizationId: string,
  job: TOnboardingStarterJob,
  drafts: TCourseImportDraft[]
): Promise<TCourseImportDraft[]> {
  const [session, organization] = await Promise.all([
    getOnboardingSession(job.profileId),
    getOrganizationById(organizationId)
  ]);
  if (!organization || session?.brand.productName) return drafts;

  const currentProductName = organization.name.slice(0, 80);
  const synced: TCourseImportDraft[] = [];

  for (const draft of drafts) {
    const renamed =
      draft.status === 'PUBLISHED' ? null : renameProductInDraft(draft, job.input.productName, currentProductName);
    const updated = renamed ? await replaceStarterDraftContent(organizationId, draft.id, renamed) : null;

    synced.push(updated ?? draft);
  }

  return synced;
}

/**
 * Creates one unpublished course per live starter draft and returns their ids. Safe to call twice: a draft that
 * already has a course is skipped, and a course is found by its seed key before one is created. If a course fails
 * halfway it is deleted, so a retry starts that slot again from scratch.
 */
export async function applyStarterDrafts(organizationId: string, profileId: string): Promise<string[]> {
  const job = await getLatestStarterJob(organizationId);
  if (!job) return [];

  if (job.status === 'PENDING' || job.status === 'RUNNING') {
    await cancelActiveStarterJobs(organizationId);
    await fillMissingStarterSlots(job.id);
  }

  const listedDrafts = await listStarterDrafts(organizationId, job.id);
  const drafts = await syncProductNameInDrafts(organizationId, job, listedDrafts);
  const courseIds: string[] = [];

  for (const draft of drafts) {
    if (draft.status === 'ARCHIVED') continue;

    try {
      const { slot } = toDraftSummary(draft);
      const seedKey = buildStarterCourseSeedKey(organizationId, slot);
      const existingId = draft.publishedCourseId ?? (await getCourseBySeedKey(seedKey))?.id;

      if (existingId) {
        courseIds.push(existingId);
        continue;
      }

      courseIds.push(await createStarterCourse({ organizationId, profileId, draft, slot, seedKey }));
    } catch (error) {
      console.error('onboarding.starter.apply_failed', { organizationId, draftId: draft.id, error: String(error) });

      throw new AppError('Could not create your starter courses', ErrorCodes.ONBOARDING_STARTER_APPLY_FAILED, 500);
    }
  }

  return courseIds;
}
