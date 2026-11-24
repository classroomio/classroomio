import {
  STARTER_COURSE_SLOTS,
  STARTER_JOB_SERVER_BUDGET_MS,
  type TStarterCourseSlot,
  type TStarterDraftOrigin,
  type TStarterJobStage
} from '@cio/utils/constants/onboarding';
import type { TOnboardingBrand, TOnboardingWebsiteExtraction } from '@cio/utils/validation';
import {
  claimStarterJob,
  createStarterDraft,
  finishRunningStarterJob,
  getOnboardingSession,
  getStarterDraftBySlot,
  getStarterJobById,
  updateOnboardingSession,
  updateStarterJob
} from '@cio/db/queries';
import type { TOnboardingStarterJob } from '@cio/db/types';
import { captureServerEvent } from '../posthog';
import { recordTokenUsage } from '../agent/usage';
import { readPublicPageMarkdown } from '../agent/fetch-url';

import { getSampleStarterBlueprint } from './sample-starter-courses';
import { generateStarterBlueprint } from './starter-blueprint';
import { blueprintToDraftPayload, buildStarterDraftIdempotencyKey, buildStarterDraftSummary } from './starter-draft';
import { extractWebsiteBrand } from './website-context';
import type { StarterPromptInput } from './starter-prompt';

const MAX_WEBSITE_MARKDOWN_CHARS = 48_000;
const WEBSITE_READ_TIMEOUT_MS = 15_000;
const CANCEL_CHECK_INTERVAL_MS = 3_000;
/** `ai_token_usage.course_id` is NOT NULL but carries no FK; starter drafts have no course yet. */
const UNATTRIBUTED_COURSE_ID = '00000000-0000-0000-0000-000000000000';

type StarterContext = {
  websiteMarkdown?: string;
  sourceUrls: string[];
  warning: TOnboardingWebsiteExtraction['warning'];
  finalUrl: string | null;
  pageTitle: string | null;
  brand: TOnboardingBrand | null;
};

function toPromptInput(job: TOnboardingStarterJob): StarterPromptInput {
  const { input } = job;

  return {
    productName: input.productName,
    firstOutcome: input.firstOutcome,
    contextMode: input.contextMode,
    description: input.description,
    jobRole: input.jobRole,
    companySize: input.companySize,
    learningMethod: input.learningMethod,
    locale: input.locale
  };
}

class StarterJobCanceledError extends Error {}

async function setStage(jobId: string, stage: TStarterJobStage, controller: AbortController): Promise<void> {
  const current = await getStarterJobById(jobId);
  if (current?.status !== 'RUNNING') {
    controller.abort();
    throw new StarterJobCanceledError('Starter job is no longer running');
  }

  await updateStarterJob(jobId, { stage });
}

async function readStarterContext(job: TOnboardingStarterJob, signal: AbortSignal): Promise<StarterContext> {
  const empty: StarterContext = { sourceUrls: [], warning: null, finalUrl: null, pageTitle: null, brand: null };

  if (job.input.contextMode !== 'website' || !job.input.websiteUrl) return empty;

  const websiteUrl = job.input.websiteUrl;
  const readSignal = AbortSignal.any([signal, AbortSignal.timeout(WEBSITE_READ_TIMEOUT_MS)]);
  const [page, brand] = await Promise.allSettled([
    readPublicPageMarkdown(websiteUrl, readSignal),
    extractWebsiteBrand(websiteUrl)
  ]);

  const brandResult = brand.status === 'fulfilled' ? brand.value : null;

  if (page.status === 'rejected') {
    console.warn('onboarding.starter.website_unreadable', { jobId: job.id, error: String(page.reason) });

    return { ...empty, warning: 'WEBSITE_UNREADABLE', brand: brandResult };
  }

  return {
    websiteMarkdown: page.value.markdown.slice(0, MAX_WEBSITE_MARKDOWN_CHARS),
    sourceUrls: [page.value.url, ...page.value.links.slice(0, 4)],
    warning: null,
    finalUrl: page.value.url,
    pageTitle: page.value.pageTitle,
    brand: brandResult
  };
}

async function saveDraft(params: {
  job: TOnboardingStarterJob;
  slot: TStarterCourseSlot;
  origin: TStarterDraftOrigin;
  blueprint: ReturnType<typeof getSampleStarterBlueprint>;
  sourceUrls: string[];
}): Promise<void> {
  const { job, slot, origin, blueprint, sourceUrls } = params;
  const draft = blueprintToDraftPayload({
    slot,
    blueprint,
    locale: job.input.locale,
    sourceUrls,
    productName: job.input.productName
  });

  await createStarterDraft({
    organizationId: job.organizationId,
    createdByProfileId: job.profileId,
    sourceType: origin === 'sample' ? 'sample' : job.input.contextMode === 'website' ? 'website' : 'prompt',
    status: 'DRAFT',
    title: draft.course.title,
    locale: job.input.locale as 'en',
    idempotencyKey: buildStarterDraftIdempotencyKey(job.id, slot),
    summary: buildStarterDraftSummary(job.id, slot, origin),
    draft,
    warnings: [],
    sourceArtifacts: sourceUrls.map((label) => ({ type: 'website', label }))
  });
}

/**
 * Keeps the spend of one generated starter course for internal cost tracking. It never counts against the new
 * org's AI allowance, and a failure to record never fails the job.
 */
async function recordStarterUsage(
  job: TOnboardingStarterJob,
  generated: { modelId: string; promptTokens: number; completionTokens: number }
): Promise<void> {
  const usage = {
    promptTokens: generated.promptTokens,
    completionTokens: generated.completionTokens,
    totalTokens: generated.promptTokens + generated.completionTokens
  };

  try {
    await recordTokenUsage(job.organizationId, job.profileId, UNATTRIBUTED_COURSE_ID, usage, generated.modelId, {
      countsTowardBalance: false
    });
  } catch (error) {
    console.error('onboarding.starter.usage_record_failed', { jobId: job.id, error: String(error) });
  }
}

async function draftSlot(params: {
  job: TOnboardingStarterJob;
  slot: TStarterCourseSlot;
  context: StarterContext;
  signal: AbortSignal;
}): Promise<{ origin: TStarterDraftOrigin; modelId: string | null; tokens: number }> {
  const { job, slot, context, signal } = params;

  try {
    const generated =
      job.mode === 'ai'
        ? await generateStarterBlueprint({
            slot,
            input: toPromptInput(job),
            websiteMarkdown: context.websiteMarkdown,
            signal
          })
        : null;

    if (generated) {
      const tokens = generated.promptTokens + generated.completionTokens;
      await recordStarterUsage(job, generated);
      await saveDraft({ job, slot, origin: 'ai', blueprint: generated.blueprint, sourceUrls: context.sourceUrls });
      console.info('onboarding.starter.slot_generated', { jobId: job.id, slot, tokens });

      return { origin: 'ai', modelId: generated.modelId, tokens };
    }
  } catch (error) {
    console.warn('onboarding.starter.slot_failed', { jobId: job.id, slot, error: String(error) });
  }

  await saveDraft({ job, slot, origin: 'sample', blueprint: getSampleStarterBlueprint(slot), sourceUrls: [] });

  return { origin: 'sample', modelId: null, tokens: 0 };
}

async function fillMissingSlotsWithSamples(job: TOnboardingStarterJob): Promise<void> {
  for (const slot of STARTER_COURSE_SLOTS) {
    const existing = await getStarterDraftBySlot(job.organizationId, job.id, slot);
    if (existing) continue;

    await saveDraft({ job, slot, origin: 'sample', blueprint: getSampleStarterBlueprint(slot), sourceUrls: [] });
  }
}

/**
 * Saves the brand read from the website and makes the job use the product name found there, before any course is
 * drafted. The job was created with the workspace name when the business step's own brand read had not finished, and
 * every draft of this job, including sample fill-ins added later, must name the same product.
 */
async function adoptDetectedBrand(
  job: TOnboardingStarterJob,
  brand: TOnboardingBrand | null
): Promise<TOnboardingStarterJob> {
  if (!brand) return job;

  const session = await getOnboardingSession(job.profileId);
  if (session) await updateOnboardingSession(job.profileId, { brand: { ...session.brand, ...brand } });

  const productName = brand.productName?.trim().slice(0, 80);
  if (!productName || productName === job.input.productName) return job;

  const input = { ...job.input, productName };
  const updated = await updateStarterJob(job.id, { input });

  return updated ?? { ...job, input };
}

/**
 * Runs one starter-course job to the end: reads the website, drafts the four slots in parallel, fills any slot
 * that failed or ran out of time with sample content, and records the outcome. It never throws, and the job
 * always ends with four drafts. Safe to call twice: only the first caller claims the job.
 */
export async function runStarterJob(jobId: string): Promise<void> {
  const claimed = await claimStarterJob(jobId);
  if (!claimed) return;

  let job = claimed;

  const startedAt = Date.now();
  const controller = new AbortController();
  const budget = setTimeout(() => controller.abort(), STARTER_JOB_SERVER_BUDGET_MS);
  const cancelWatch = setInterval(() => {
    void getStarterJobById(job.id)
      .then((current) => {
        if (current && current.status !== 'RUNNING') controller.abort();
      })
      .catch(() => undefined);
  }, CANCEL_CHECK_INTERVAL_MS);

  let warning: TOnboardingWebsiteExtraction['warning'] = null;
  let modelId: string | null = null;
  let totalTokens = 0;
  let aiSlots = 0;
  let sampleSlots = 0;

  try {
    const context = await readStarterContext(job, controller.signal);
    warning = context.warning;
    job = await adoptDetectedBrand(job, context.brand);

    await setStage(job.id, 'drafting', controller);
    const outcomes = await Promise.all(
      STARTER_COURSE_SLOTS.map((slot) => draftSlot({ job, slot, context, signal: controller.signal }))
    );

    await setStage(job.id, 'organising', controller);
    await fillMissingSlotsWithSamples(job);

    await setStage(job.id, 'finishing', controller);

    aiSlots = outcomes.filter((outcome) => outcome.origin === 'ai').length;
    sampleSlots = STARTER_COURSE_SLOTS.length - aiSlots;
    modelId = outcomes.find((outcome) => outcome.modelId)?.modelId ?? null;
    totalTokens = outcomes.reduce((total, outcome) => total + outcome.tokens, 0);

    const incomplete = job.mode === 'ai' && sampleSlots > 0 && !warning;
    const extraction: TOnboardingWebsiteExtraction = {
      finalUrl: context.finalUrl,
      pageTitle: context.pageTitle,
      sourceUrls: context.sourceUrls,
      warning: warning ?? (incomplete ? 'GENERATION_INCOMPLETE' : null)
    };

    const finished = await finishRunningStarterJob(job.id, {
      status: 'COMPLETED',
      stage: 'done',
      extraction,
      modelId,
      finishedAt: new Date().toISOString()
    });
    if (!finished) return;

    captureServerEvent({
      event: 'onboarding_starter_completed',
      distinctId: job.profileId,
      orgId: job.organizationId,
      properties: {
        mode: job.mode,
        duration_ms: Date.now() - startedAt,
        ai_slots: aiSlots,
        sample_slots: sampleSlots,
        warning: extraction.warning,
        model_id: modelId,
        total_tokens: totalTokens
      }
    });
  } catch (error) {
    if (error instanceof StarterJobCanceledError) return;

    console.error('onboarding.starter.failed', { jobId: job.id, error: String(error) });

    try {
      await fillMissingSlotsWithSamples(job);
    } catch (fallbackError) {
      console.error('onboarding.starter.fallback_failed', { jobId: job.id, error: String(fallbackError) });
    }

    const failed = await finishRunningStarterJob(job.id, {
      status: 'FAILED',
      stage: 'done',
      error: { code: 'ONBOARDING_STARTER_FAILED', message: error instanceof Error ? error.message : 'Unknown error' },
      finishedAt: new Date().toISOString()
    });
    if (!failed) return;

    captureServerEvent({
      event: 'onboarding_starter_failed',
      distinctId: job.profileId,
      orgId: job.organizationId,
      properties: { mode: job.mode, duration_ms: Date.now() - startedAt }
    });
  } finally {
    clearTimeout(budget);
    clearInterval(cancelWatch);
  }
}

/**
 * Gives a job any starter slot it does not have yet, using sample content. Used when the user moves on while a job
 * is still running, so the next step always has four drafts to work with.
 */
export async function fillMissingStarterSlots(jobId: string): Promise<void> {
  const job = await getStarterJobById(jobId);
  if (!job) return;

  await fillMissingSlotsWithSamples(job);
}
