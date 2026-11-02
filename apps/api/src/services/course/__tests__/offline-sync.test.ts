import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError, ErrorCodes } from '@cio/utils/errors';
import type { TSyncIntent } from '@cio/utils/validation/course';
import type { IdempotencyClaim, IdempotencyStore } from '@api/utils/redis/idempotency';

const mocks = vi.hoisted(() => ({
  assertAccess: vi.fn(),
  evaluate: vi.fn(),
  getCompletion: vi.fn(),
  upsertCompletion: vi.fn(),
  updateWatch: vi.fn(),
  videoProgress: vi.fn(),
  offlineIssue: vi.fn()
}));

vi.mock('@api/services/course/access', () => ({ assertEnrolledStudentContentAccess: mocks.assertAccess }));
vi.mock('@api/services/course/completion', () => ({ evaluateCourseCertification: mocks.evaluate }));
vi.mock('@cio/core/services/lesson/lesson', () => ({
  getLessonCompletionService: mocks.getCompletion,
  upsertLessonCompletionService: mocks.upsertCompletion,
  updateLessonWatchProgressService: mocks.updateWatch
}));
vi.mock('@api/utils/redis/idempotency', () => ({ createRedisIdempotencyStore: vi.fn() }));
vi.mock('@cio/db/queries/lesson/video-progress', () => ({ getLessonVideoProgress: mocks.videoProgress }));
vi.mock('@api/utils/redis/offline-issue', () => ({ readOfflineIssue: mocks.offlineIssue }));

import { groupSyncIntents, syncCourseIntents } from '../offline-sync';

const COURSE_ID = '11111111-1111-4111-8111-111111111111';
const PROFILE_ID = '22222222-2222-4222-8222-222222222222';
const LESSON_A = '33333333-3333-4333-8333-333333333333';
const LESSON_B = '44444444-4444-4444-8444-444444444444';

function memoryStore(initial: Record<string, IdempotencyClaim> = {}) {
  const state = new Map<string, 'pending' | 'done'>();
  const preset = new Map(Object.entries(initial));
  const store: IdempotencyStore & { state: typeof state } = {
    state,
    claim: vi.fn(async (key: string) => {
      const forced = preset.get(key);
      if (forced) return forced;

      const current = state.get(key);
      if (current === 'done') return 'done';
      if (current === 'pending') return 'busy';

      state.set(key, 'pending');
      return 'claimed';
    }),
    complete: vi.fn(async (key: string) => {
      state.set(key, 'done');
    }),
    release: vi.fn(async (key: string) => {
      state.delete(key);
    })
  };

  return store;
}

function complete(key: string, lessonId = LESSON_A): TSyncIntent {
  return { key, type: 'lesson.complete', lessonId, recordedAt: '2026-10-01T10:00:00.000Z' };
}

function beat(key: string, positionSeconds: number, playedDeltaSeconds: number, assetId = 'asset-1'): TSyncIntent {
  return {
    key,
    type: 'playback.position',
    lessonId: LESSON_B,
    assetId,
    positionSeconds,
    playedDeltaSeconds,
    durationSeconds: 600,
    recordedAt: '2026-10-01T10:00:00.000Z'
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.assertAccess.mockResolvedValue(undefined);
  mocks.evaluate.mockResolvedValue({});
  mocks.getCompletion.mockResolvedValue(null);
  mocks.upsertCompletion.mockResolvedValue({ isComplete: true });
  mocks.updateWatch.mockResolvedValue({ isComplete: false, didJustComplete: false });
  mocks.videoProgress.mockResolvedValue({ updatedAt: '2026-10-01T09:00:00.000Z' });
  mocks.offlineIssue.mockResolvedValue(null);
});

describe('syncCourseIntents idempotency', () => {
  it('applies a completion once and reports the replay as a duplicate', async () => {
    const store = memoryStore();

    const first = await syncCourseIntents(COURSE_ID, PROFILE_ID, [complete('key-0001')], store);
    const replay = await syncCourseIntents(COURSE_ID, PROFILE_ID, [complete('key-0001')], store);

    expect(first.results[0]).toMatchObject({ key: 'key-0001', status: 'applied', retryable: false });
    expect(replay.results[0]).toMatchObject({ key: 'key-0001', status: 'duplicate', retryable: false });
    expect(mocks.upsertCompletion).toHaveBeenCalledTimes(1);
  });

  it('treats a repeated key inside one batch as the same intent', async () => {
    const store = memoryStore();

    const result = await syncCourseIntents(COURSE_ID, PROFILE_ID, [complete('key-0002'), complete('key-0002')], store);

    expect(result.results.map((entry) => entry.status)).toEqual(['applied', 'applied']);
    expect(mocks.upsertCompletion).toHaveBeenCalledTimes(1);
  });

  it('does not double count a playback beat that was already applied', async () => {
    const store = memoryStore();
    await syncCourseIntents(COURSE_ID, PROFILE_ID, [beat('beat-0001', 15, 15)], store);
    mocks.updateWatch.mockClear();

    const result = await syncCourseIntents(
      COURSE_ID,
      PROFILE_ID,
      [beat('beat-0001', 15, 15), beat('beat-0002', 30, 15)],
      store
    );

    expect(result.results.map((entry) => entry.status)).toEqual(['duplicate', 'applied']);
    expect(mocks.updateWatch).toHaveBeenCalledTimes(1);
    expect(mocks.updateWatch).toHaveBeenCalledWith(LESSON_B, PROFILE_ID, {
      assetId: 'asset-1',
      positionSeconds: 30,
      playedDeltaSeconds: 15,
      durationSeconds: 600
    });
  });

  it('asks the client to retry a key another request is applying', async () => {
    const store = memoryStore({ 'key-busy1': 'busy' });

    const result = await syncCourseIntents(COURSE_ID, PROFILE_ID, [complete('key-busy1')], store);

    expect(result.results[0]).toMatchObject({ status: 'failed', code: 'SYNC_IN_PROGRESS', retryable: true });
    expect(mocks.upsertCompletion).not.toHaveBeenCalled();
  });

  it('applies intents without duplicate detection when the store is unavailable', async () => {
    const store = memoryStore({ 'key-nore1': 'unavailable' });

    const result = await syncCourseIntents(COURSE_ID, PROFILE_ID, [complete('key-nore1')], store);

    expect(result.results[0]?.status).toBe('applied');
  });
});

describe('syncCourseIntents monotonic completion', () => {
  it('only ever marks lessons complete', async () => {
    const store = memoryStore();

    await syncCourseIntents(COURSE_ID, PROFILE_ID, [complete('key-0003'), complete('key-0004', LESSON_B)], store);

    for (const call of mocks.upsertCompletion.mock.calls) {
      expect(call[2]).toBe(true);
    }
  });

  it('reports an already complete lesson as success without writing', async () => {
    const store = memoryStore();
    mocks.getCompletion.mockResolvedValue({ isComplete: true });

    const result = await syncCourseIntents(COURSE_ID, PROFILE_ID, [complete('key-0005')], store);

    expect(result.results[0]?.status).toBe('already_complete');
    expect(result.completedLessonIds).toEqual([LESSON_A]);
    expect(mocks.upsertCompletion).not.toHaveBeenCalled();
    expect(mocks.evaluate).not.toHaveBeenCalled();
  });

  it('evaluates the certificate once after a batch that completes lessons', async () => {
    const store = memoryStore();

    await syncCourseIntents(COURSE_ID, PROFILE_ID, [complete('key-0006'), complete('key-0007', LESSON_B)], store);

    expect(mocks.evaluate).toHaveBeenCalledTimes(1);
    expect(mocks.evaluate).toHaveBeenCalledWith(COURSE_ID, PROFILE_ID);
  });
});

describe('syncCourseIntents server rules', () => {
  it('rejects locked content and forgets the key so a later retry is evaluated again', async () => {
    const store = memoryStore();
    mocks.assertAccess.mockRejectedValueOnce(new AppError('Content is locked', ErrorCodes.VALIDATION_ERROR, 403));

    const result = await syncCourseIntents(COURSE_ID, PROFILE_ID, [complete('key-0008')], store);

    expect(result.results[0]).toMatchObject({ status: 'rejected', message: 'Content is locked', retryable: false });
    expect(store.state.has('key-0008')).toBe(false);
    expect(mocks.upsertCompletion).not.toHaveBeenCalled();
  });

  it('marks unexpected errors as retryable failures', async () => {
    const store = memoryStore();
    mocks.upsertCompletion.mockRejectedValueOnce(new Error('connection reset'));

    const result = await syncCourseIntents(COURSE_ID, PROFILE_ID, [complete('key-0009')], store);

    expect(result.results[0]).toMatchObject({ status: 'failed', retryable: true });
    expect(store.state.has('key-0009')).toBe(false);
  });

  it('judges consecutive beats for one video as a single watch session', async () => {
    const store = memoryStore();

    await syncCourseIntents(
      COURSE_ID,
      PROFILE_ID,
      [beat('beat-1001', 15, 15), beat('beat-1002', 30, 15), beat('beat-1003', 44, 14)],
      store
    );

    expect(mocks.updateWatch).toHaveBeenCalledTimes(1);
    expect(mocks.updateWatch).toHaveBeenCalledWith(LESSON_B, PROFILE_ID, {
      assetId: 'asset-1',
      positionSeconds: 44,
      playedDeltaSeconds: 44,
      durationSeconds: 600
    });
  });

  it('rejects every beat of a session the watch rules refuse', async () => {
    const store = memoryStore();
    mocks.updateWatch.mockRejectedValueOnce(
      new AppError('Invalid watch progress update', ErrorCodes.VALIDATION_ERROR, 400)
    );

    const result = await syncCourseIntents(
      COURSE_ID,
      PROFILE_ID,
      [beat('beat-2001', 15, 15), beat('beat-2002', 30, 15)],
      store
    );

    expect(result.results.map((entry) => entry.status)).toEqual(['rejected', 'rejected']);
  });

  it('records a lesson the watch rules complete', async () => {
    const store = memoryStore();
    mocks.updateWatch.mockResolvedValueOnce({ isComplete: true, didJustComplete: true });

    const result = await syncCourseIntents(COURSE_ID, PROFILE_ID, [beat('beat-3001', 590, 15)], store);

    expect(result.completedLessonIds).toEqual([LESSON_B]);
    expect(mocks.evaluate).toHaveBeenCalledTimes(1);
  });
});

describe('syncCourseIntents first offline watch', () => {
  function session(count: number, prefix: string) {
    return Array.from({ length: count }, (_, index) =>
      beat(`${prefix}-${String(index).padStart(4, '0')}`, (index + 1) * 100, 100)
    );
  }

  it('holds a first watch with no download record to the two-minute first-beat limit', async () => {
    mocks.videoProgress.mockResolvedValue(null);

    const short = await syncCourseIntents(COURSE_ID, PROFILE_ID, session(1, 'short'), memoryStore());
    const long = await syncCourseIntents(COURSE_ID, PROFILE_ID, session(2, 'long'), memoryStore());

    expect(short.results[0]?.status).toBe('applied');
    expect(long.results.map((entry) => entry.status)).toEqual(['rejected', 'rejected']);
    expect(mocks.updateWatch).toHaveBeenCalledTimes(1);
  });

  it('allows a first watch as long as the time since the lesson was downloaded', async () => {
    mocks.videoProgress.mockResolvedValue(null);
    mocks.offlineIssue.mockResolvedValue(Date.now() - 10 * 60 * 1000);

    const fits = await syncCourseIntents(COURSE_ID, PROFILE_ID, session(5, 'fits'), memoryStore());
    const tooMuch = await syncCourseIntents(COURSE_ID, PROFILE_ID, session(10, 'over'), memoryStore());

    expect(fits.results.every((entry) => entry.status === 'applied')).toBe(true);
    expect(tooMuch.results.every((entry) => entry.status === 'rejected')).toBe(true);
  });
});

describe('groupSyncIntents', () => {
  it('keeps arrival order and splits beats at a change of video or an intervening completion', () => {
    const units = groupSyncIntents([
      beat('beat-4001', 15, 15),
      beat('beat-4002', 30, 15),
      complete('key-4003'),
      beat('beat-4004', 45, 15),
      beat('beat-4005', 10, 10, 'asset-2')
    ]);

    expect(units.map((unit) => [unit.type, unit.intents.length])).toEqual([
      ['playback.position', 2],
      ['lesson.complete', 1],
      ['playback.position', 1],
      ['playback.position', 1]
    ]);
  });
});
