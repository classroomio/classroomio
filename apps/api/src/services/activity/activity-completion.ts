import { evaluateCourseCertification } from '@api/services/course/completion';
import { syncComplianceProgressForMember } from '@api/services/course/compliance';
import { getComplianceSnapshot } from '@cio/core/services/activity/providers/scorm/results';
import { getActivitiesByCourseId, getActivityById } from '@cio/db/queries/activity/activity';
import {
  claimDueActivityCompletionSideEffects,
  settleActivityCompletionSideEffect
} from '@cio/db/queries/activity/completion-side-effect';
import { getComplianceCycleStartIso } from '@cio/db/queries/course/compliance';
import { getScormActivityStatsForProfile } from '@cio/db/queries/scorm/report';
import { db } from '@cio/db/drizzle';
import type { TActivityCompletionSideEffect, TCourseActivity } from '@cio/db/types';

const CLAIM_LEASE_MS = 5 * 60_000;
const RETRY_BASE_DELAY_MS = 30_000;
const RETRY_MAX_DELAY_MS = 60 * 60_000;
const SWEEP_BATCH_SIZE = 25;
const SWEEP_INTERVAL_MS = 60_000;

function retryDelayMs(attempts: number): number {
  return Math.min(RETRY_BASE_DELAY_MS * 2 ** Math.max(attempts - 1, 0), RETRY_MAX_DELAY_MS);
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function syncActivityCompliance(activity: TCourseActivity, profileId: string): Promise<void> {
  const snapshot = await getComplianceSnapshot(activity.id, profileId);
  let minutes: number | undefined;

  if (snapshot) {
    const sinceIso = await getComplianceCycleStartIso(activity.courseId, profileId);
    const activityIds = (await getActivitiesByCourseId(activity.courseId)).map((row) => row.id);
    const stats = await getScormActivityStatsForProfile(activityIds, profileId, db, sinceIso);

    minutes = Math.floor(stats.reduce((total, row) => total + (row.timeSpentSeconds ?? 0), 0) / 60);
  }

  await syncComplianceProgressForMember(activity.courseId, profileId, 'activity', minutes);
}

/**
 * Runs the pending effects of one claimed row, certification then compliance,
 * each on its own so one failing never blocks the other. Whatever still
 * failed stays pending with a backoff for the next sweep.
 */
async function runClaimedSideEffect(claimed: TActivityCompletionSideEffect): Promise<void> {
  const activity = await getActivityById(claimed.activityId);
  let certificationPending = claimed.certificationPending && activity !== null;
  let compliancePending = claimed.compliancePending && activity !== null;
  const errors: string[] = [];

  if (activity && certificationPending) {
    try {
      await evaluateCourseCertification(activity.courseId, claimed.profileId);
      certificationPending = false;
    } catch (error) {
      console.error('Failed to evaluate course certification after activity completion:', error);
      errors.push(`certification: ${errorText(error)}`);
    }
  }

  if (activity && compliancePending) {
    try {
      await syncActivityCompliance(activity, claimed.profileId);
      compliancePending = false;
    } catch (error) {
      console.error('Failed to sync compliance progress after activity completion:', error);
      errors.push(`compliance: ${errorText(error)}`);
    }
  }

  const nextAttemptAt = new Date(Date.now() + retryDelayMs(claimed.attempts)).toISOString();
  const lastError = errors.length > 0 ? errors.join('; ') : null;

  await settleActivityCompletionSideEffect(claimed, {
    certificationPending,
    compliancePending,
    nextAttemptAt,
    lastError
  });
}

async function runClaimed(claims: TActivityCompletionSideEffect[]): Promise<void> {
  for (const claimed of claims) {
    try {
      await runClaimedSideEffect(claimed);
    } catch (error) {
      console.error('runClaimedSideEffect error:', error);
    }
  }
}

/**
 * Runs one learner's committed completion side effects right away. Never
 * throws: anything that fails stays in the outbox for the sweeper.
 */
export async function deliverActivityCompletionSideEffects(activityId: string, profileId: string): Promise<void> {
  try {
    const leaseUntil = new Date(Date.now() + CLAIM_LEASE_MS).toISOString();
    const claims = await claimDueActivityCompletionSideEffects({
      limit: 1,
      leaseUntil,
      key: { activityId, profileId }
    });

    await runClaimed(claims);
  } catch (error) {
    console.error('deliverActivityCompletionSideEffects error:', error);
  }
}

/**
 * Runs every due outbox row in batches until none are due. Returns how many
 * rows it claimed.
 */
export async function sweepActivityCompletionSideEffects(): Promise<number> {
  let claimedTotal = 0;

  while (true) {
    const leaseUntil = new Date(Date.now() + CLAIM_LEASE_MS).toISOString();
    const claims = await claimDueActivityCompletionSideEffects({ limit: SWEEP_BATCH_SIZE, leaseUntil });

    if (claims.length === 0) return claimedTotal;

    claimedTotal += claims.length;
    await runClaimed(claims);
  }
}

/**
 * Sweeps the outbox on boot and then on an interval, so work left by a failed
 * run or a restarted process is retried without waiting for a learner request.
 * Returns a function that stops the sweeper.
 */
export function startActivityCompletionSideEffectSweeper(intervalMs = SWEEP_INTERVAL_MS): () => void {
  let running = false;

  const tick = async () => {
    if (running) return;

    running = true;
    try {
      await sweepActivityCompletionSideEffects();
    } catch (error) {
      console.error('sweepActivityCompletionSideEffects error:', error);
    } finally {
      running = false;
    }
  };

  void tick();
  const timer = setInterval(() => void tick(), intervalMs);
  timer.unref?.();

  return () => clearInterval(timer);
}
