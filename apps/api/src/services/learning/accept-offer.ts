import { acceptPersonalLearningOffer, getPersonalLearningJourneyForOffer } from '@cio/db/queries/personal-learning';
import { enqueuePersonalLearningSession } from '@cio/jobs/enqueue/personal-learning';
import { redis } from '@cio/core/utils/redis/redis';
import { AppError } from '@api/utils/errors';

const DAILY_GENERATION_LIMIT = 3;
const QUOTA_TTL_SECONDS = 25 * 60 * 60;

export async function reserveLearningGenerationQuota(ownerUserId: string): Promise<void> {
  if (!redis.isReady) throw new AppError('Learning generation quota is unavailable', 'LEARNING_QUOTA_UNAVAILABLE', 503);

  const utcDay = new Date().toISOString().slice(0, 10);
  const quotaKey = `personal-learning:generation-quota:${ownerUserId}:${utcDay}`;
  let requestCount: number;

  try {
    requestCount = await redis.incr(quotaKey);
    if (requestCount === 1) await redis.expire(quotaKey, QUOTA_TTL_SECONDS);
  } catch {
    throw new AppError('Learning generation quota is unavailable', 'LEARNING_QUOTA_UNAVAILABLE', 503);
  }

  if (requestCount > DAILY_GENERATION_LIMIT) {
    throw new AppError('Daily learning generation limit reached', 'LEARNING_GENERATION_QUOTA_EXCEEDED', 429);
  }
}

export async function enqueueLearningSession(sessionId: string, journeyId: string, attempt = 0): Promise<void> {
  try {
    const jobId = attempt > 0 ? `personal-session-${journeyId}-1-retry-${attempt}` : undefined;
    await enqueuePersonalLearningSession({ sessionId, journeyId }, jobId ? { jobId } : undefined);
  } catch {
    console.warn('personal-learning-enqueue-deferred', { sessionId, journeyId, status: 'queued' });
  }
}

export async function acceptLearningOffer(input: {
  ownerUserId: string;
  offerId: string;
  goal: string;
  language: string;
  targetStudyDays: 1 | 7 | 30;
  dailyMinutes: 30 | 60 | 120;
}) {
  const existing = await getPersonalLearningJourneyForOffer(input.ownerUserId, input.offerId);
  if (existing) {
    await enqueueLearningSession(existing.session.id, existing.journey.id);
    return { journey: existing.journey, session: existing.session };
  }

  await reserveLearningGenerationQuota(input.ownerUserId);
  const accepted = await acceptPersonalLearningOffer(input);
  if (!accepted) throw new AppError('Learning offer not found', 'LEARNING_NOT_FOUND', 404);

  await enqueueLearningSession(accepted.session.id, accepted.journey.id);
  return accepted;
}
