import { ContentType } from '@cio/utils/constants/content';
import type { TLessonCompleteIntent, TPlaybackPositionIntent, TSyncIntent } from '@cio/utils/validation/course';
import { assertEnrolledStudentContentAccess } from '@api/services/course/access';
import { evaluateCourseCertification } from '@api/services/course/completion';
import {
  getLessonCompletionService,
  updateLessonWatchProgressService,
  upsertLessonCompletionService
} from '@cio/core/services/lesson/lesson';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { createRedisIdempotencyStore, type IdempotencyStore } from '@api/utils/redis/idempotency';
import { advanceOfflineWatchCursor, readOfflineIssue, readOfflineWatchCursor } from '@api/utils/redis/offline-issue';

// Mirrors the watch-progress service: the route's per-beat cap and its wall-clock tolerance.
const FIRST_BEAT_MAX_SECONDS = 120;
const WALL_CLOCK_TOLERANCE = 1.5;

/**
 * `applied`: changed server state now. `duplicate`: the key was applied by an earlier request.
 * `already_complete`: the lesson was complete before this intent. `rejected`: the server's rules refuse it; retrying
 * the same intent gives the same answer. `failed`: a transient error; retry later.
 */
export type SyncIntentStatus = 'applied' | 'duplicate' | 'already_complete' | 'rejected' | 'failed';

export type SyncIntentResult = {
  key: string;
  status: SyncIntentStatus;
  code: string | null;
  message: string | null;
  retryable: boolean;
};

export type CourseSyncResult = {
  results: SyncIntentResult[];
  completedLessonIds: string[];
};

type SyncUnit =
  | { type: 'lesson.complete'; lessonId: string; intents: TLessonCompleteIntent[] }
  | { type: 'playback.position'; lessonId: string; assetId: string; intents: TPlaybackPositionIntent[] };

type UnitOutcome = { status: 'applied' | 'already_complete'; completed: boolean };

/**
 * Groups intents in arrival order. Consecutive playback beats for one video become a single beat (latest position,
 * summed watch time) so the watch-progress wall-clock rule judges the offline session as a whole rather than
 * rejecting every beat after the first as arriving too fast.
 */
export function groupSyncIntents(intents: TSyncIntent[]): SyncUnit[] {
  const units: SyncUnit[] = [];

  for (const intent of intents) {
    const last = units.at(-1);

    if (intent.type === 'lesson.complete') {
      units.push({ type: 'lesson.complete', lessonId: intent.lessonId, intents: [intent] });
      continue;
    }

    if (last?.type === 'playback.position' && last.lessonId === intent.lessonId && last.assetId === intent.assetId) {
      last.intents.push(intent);
      continue;
    }

    units.push({ type: 'playback.position', lessonId: intent.lessonId, assetId: intent.assetId, intents: [intent] });
  }

  return units;
}

async function claimIntents<T extends TSyncIntent>(
  intents: T[],
  store: IdempotencyStore,
  results: Map<string, SyncIntentResult>
): Promise<T[]> {
  const claimed: T[] = [];

  for (const intent of intents) {
    if (results.has(intent.key) || claimed.some((entry) => entry.key === intent.key)) continue;

    const claim = await store.claim(intent.key);
    if (claim === 'done') {
      results.set(intent.key, resultOf(intent.key, 'duplicate'));
    } else if (claim === 'busy') {
      results.set(intent.key, {
        key: intent.key,
        status: 'failed',
        code: 'SYNC_IN_PROGRESS',
        message: 'This change is being applied by another request',
        retryable: true
      });
    } else {
      claimed.push(intent);
    }
  }

  return claimed;
}

function resultOf(key: string, status: SyncIntentStatus, error?: unknown): SyncIntentResult {
  if (!error) return { key, status, code: null, message: null, retryable: false };

  const appError = error instanceof AppError ? error : null;

  return {
    key,
    status,
    code: appError?.code ?? 'SYNC_FAILED',
    message: appError?.message ?? (error instanceof Error ? error.message : 'Sync failed'),
    retryable: status === 'failed'
  };
}

function isPermanent(error: unknown) {
  return error instanceof AppError && error.statusCode >= 400 && error.statusCode < 500;
}

/**
 * Watch time an offline session may claim, judged by when its beats were recorded rather than when they reach the
 * server, so a session split across several sync requests keeps the time it was watched over. The allowance is the
 * recorded span from `since` to the latest beat, which never extends past now. `since` is the later of the lesson's
 * download and the time already credited, so the same stretch of time cannot be claimed twice. Without a known start,
 * the span runs from the first beat, which may also claim up to the per-beat cap.
 */
export function offlineWatchAllowance(intents: TPlaybackPositionIntent[], since: number | null, now: number): number {
  const recordedTimes = intents.map((intent) => Date.parse(intent.recordedAt)).filter(Number.isFinite);
  if (recordedTimes.length === 0) return 0;

  const latest = Math.min(now, Math.max(...recordedTimes));
  if (since !== null) return Math.max(0, ((latest - since) / 1000) * WALL_CLOCK_TOLERANCE);

  const earliest = Math.min(...recordedTimes);

  return Math.max(0, ((latest - earliest) / 1000) * WALL_CLOCK_TOLERANCE) + FIRST_BEAT_MAX_SECONDS;
}

/** The recorded time of a session's latest beat, never later than now. */
function latestRecordedAt(intents: TPlaybackPositionIntent[], now: number): number | null {
  const recordedTimes = intents.map((intent) => Date.parse(intent.recordedAt)).filter(Number.isFinite);

  return recordedTimes.length === 0 ? null : Math.min(now, Math.max(...recordedTimes));
}

async function claimUnit(
  unit: SyncUnit,
  store: IdempotencyStore,
  results: Map<string, SyncIntentResult>
): Promise<SyncUnit> {
  if (unit.type === 'lesson.complete') {
    const intents = await claimIntents(unit.intents, store, results);

    return { ...unit, intents };
  }

  const intents = await claimIntents(unit.intents, store, results);

  return { ...unit, intents };
}

async function applyUnit(courseId: string, profileId: string, unit: SyncUnit): Promise<UnitOutcome> {
  await assertEnrolledStudentContentAccess({
    courseId,
    profileId,
    contentId: unit.lessonId,
    type: ContentType.Lesson
  });

  if (unit.type === 'lesson.complete') {
    const existing = await getLessonCompletionService(unit.lessonId, profileId);
    if (existing?.isComplete) return { status: 'already_complete', completed: true };

    await upsertLessonCompletionService(unit.lessonId, profileId, true);

    return { status: 'applied', completed: true };
  }

  const latest = unit.intents.at(-1)!;
  const playedDeltaSeconds = unit.intents.reduce((total, intent) => total + intent.playedDeltaSeconds, 0);
  const now = Date.now();
  const issuedAt = await readOfflineIssue(profileId, unit.lessonId);
  const creditedUntil = await readOfflineWatchCursor(profileId, unit.lessonId, unit.assetId);
  const since = issuedAt === null && creditedUntil === null ? null : Math.max(issuedAt ?? 0, creditedUntil ?? 0);
  const allowedDeltaSeconds = offlineWatchAllowance(unit.intents, since, now);

  const progress = await updateLessonWatchProgressService(
    unit.lessonId,
    profileId,
    {
      assetId: unit.assetId,
      positionSeconds: latest.positionSeconds,
      playedDeltaSeconds,
      durationSeconds: latest.durationSeconds
    },
    { allowedDeltaSeconds }
  );

  const recordedUntil = latestRecordedAt(unit.intents, now);
  if (recordedUntil !== null) {
    await advanceOfflineWatchCursor(profileId, unit.lessonId, unit.assetId, recordedUntil);
  }

  return { status: 'applied', completed: progress.didJustComplete || progress.isComplete };
}

/**
 * Replays queued offline intents in order through the same services the online routes use, so content locking,
 * completion policies and the video watch rules apply unchanged. Completion is monotonic: intents only ever mark a
 * lesson complete. Each intent key is applied at most once while Redis remembers it.
 */
export async function syncCourseIntents(
  courseId: string,
  profileId: string,
  intents: TSyncIntent[],
  store: IdempotencyStore = createRedisIdempotencyStore(`course-sync:${profileId}`)
): Promise<CourseSyncResult> {
  const results = new Map<string, SyncIntentResult>();
  const completedLessonIds = new Set<string>();
  let completedAny = false;

  for (const unit of groupSyncIntents(intents)) {
    const claimedUnit = await claimUnit(unit, store, results);
    const claimed: TSyncIntent[] = claimedUnit.intents;
    if (claimed.length === 0) continue;

    try {
      const outcome = await applyUnit(courseId, profileId, claimedUnit);
      if (outcome.completed) completedLessonIds.add(unit.lessonId);
      if (outcome.status === 'applied' && outcome.completed) completedAny = true;

      for (const intent of claimed) {
        await store.complete(intent.key);
        results.set(intent.key, resultOf(intent.key, outcome.status));
      }
    } catch (error) {
      const status = isPermanent(error) ? 'rejected' : 'failed';
      for (const intent of claimed) {
        await store.release(intent.key);
        results.set(intent.key, resultOf(intent.key, status, error));
      }
    }
  }

  if (completedAny) {
    void evaluateCourseCertification(courseId, profileId).catch((error) => {
      console.error('Failed to evaluate course certification after offline sync:', error);
    });
  }

  return {
    results: intents.map((intent) => results.get(intent.key)!),
    completedLessonIds: [...completedLessonIds]
  };
}
