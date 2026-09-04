import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// `vi.mock` factories are hoisted above imports, so this has to be a `var` to
// be initialised by the time the factory runs.
// eslint-disable-next-line no-var
var TX = { __transaction: true };

vi.mock('@cio/db/queries/lesson/version', () => ({
  extendLessonLanguageVersion: vi.fn(),
  getLatestLessonLanguageVersion: vi.fn(),
  insertLessonLanguageVersion: vi.fn(),
  lockLessonLanguageVersionSession: vi.fn(),
  promoteLessonLanguageVersion: vi.fn(),
  sealLatestLessonVersionsForCourse: vi.fn()
}));

vi.mock('@cio/db/drizzle', () => ({
  // The service opens its own transaction when the caller supplies no client,
  // so the advisory lock it takes is transaction-scoped. The callback receives a
  // sentinel rather than undefined, so the assertions below fail if any
  // transaction-scoped call runs outside it.
  db: { transaction: (run: (client: unknown) => unknown) => run(TX) }
}));

import { LESSON_VERSION_SESSION_IDLE_MS, LESSON_VERSION_SESSION_MAX_MS } from '@cio/utils/constants/lesson-version';
import { canExtendVersionSession, recordLessonLanguageVersion } from '@cio/core/services/lesson-version';
import {
  extendLessonLanguageVersion,
  getLatestLessonLanguageVersion,
  insertLessonLanguageVersion,
  lockLessonLanguageVersionSession,
  promoteLessonLanguageVersion
} from '@cio/db/queries/lesson/version';

import type { LessonVersionSessionState } from '@cio/db/queries/lesson/version';

const AUTHOR_ID = 'c2d4f6a8-0b9c-4d2e-8f1a-3e5d7c9b1a23';
const OTHER_AUTHOR_ID = 'd3e5a7b9-1c0d-4e3f-9a2b-4f6e8d0c2b34';
const LESSON_LANGUAGE_ID = 42;
const NOW = new Date('2026-03-10T14:00:00.000Z').getTime();

function buildLatest(overrides: Partial<LessonVersionSessionState> = {}): LessonVersionSessionState {
  const oneMinuteAgo = new Date(NOW - 60_000).toISOString();

  return {
    id: 7,
    lessonLanguageId: LESSON_LANGUAGE_ID,
    newContent: '<p>previous</p>',
    kind: 'auto',
    label: null,
    authorId: AUTHOR_ID,
    sessionStartedAt: oneMinuteAgo,
    timestamp: oneMinuteAgo,
    editCount: 3,
    isSealed: false,
    // Elapsed times come from Postgres, not from parsing the timestamps above.
    msSinceLastEdit: 60_000,
    msSinceSessionStart: 60_000,
    ...overrides
  };
}

describe('canExtendVersionSession', () => {
  const baseInput = { intent: 'auto' as const, authorId: AUTHOR_ID };

  it('folds a follow-up autosave into the open session', () => {
    expect(canExtendVersionSession(buildLatest(), baseInput)).toBe(true);
  });

  it('starts a session when there is no history yet', () => {
    expect(canExtendVersionSession(null, baseInput)).toBe(false);
  });

  it('never reopens a sealed session, which is how publishing resets the window', () => {
    expect(canExtendVersionSession(buildLatest({ isSealed: true, kind: 'publish' }), baseInput)).toBe(false);
  });

  it('does not extend across a milestone snapshot', () => {
    expect(canExtendVersionSession(buildLatest({ kind: 'manual' }), baseInput)).toBe(false);
  });

  it('gives a different author their own entry', () => {
    expect(canExtendVersionSession(buildLatest({ authorId: OTHER_AUTHOR_ID }), baseInput)).toBe(false);
  });

  it('gives a system write its own entry when the session belongs to a person', () => {
    expect(canExtendVersionSession(buildLatest(), { ...baseInput, authorId: null })).toBe(false);
  });

  it('ends the session once the author has been idle past the window', () => {
    const idle = buildLatest({
      msSinceLastEdit: LESSON_VERSION_SESSION_IDLE_MS + 1_000,
      msSinceSessionStart: LESSON_VERSION_SESSION_IDLE_MS + 1_000
    });

    expect(canExtendVersionSession(idle, baseInput)).toBe(false);
  });

  it('still extends right up to the idle limit', () => {
    const nearlyIdle = buildLatest({
      msSinceLastEdit: LESSON_VERSION_SESSION_IDLE_MS,
      msSinceSessionStart: LESSON_VERSION_SESSION_IDLE_MS
    });

    expect(canExtendVersionSession(nearlyIdle, baseInput)).toBe(true);
  });

  it('checkpoints continuous writing once the session hits its maximum length', () => {
    const longRunning = buildLatest({
      msSinceLastEdit: 1_000,
      msSinceSessionStart: LESSON_VERSION_SESSION_MAX_MS + 1_000
    });

    expect(canExtendVersionSession(longRunning, baseInput)).toBe(false);
  });

  it('does not coalesce an explicit save', () => {
    expect(canExtendVersionSession(buildLatest(), { ...baseInput, intent: 'manual' })).toBe(false);
  });
});

describe('recordLessonLanguageVersion', () => {
  beforeEach(() => {
    // The service reads the wall clock to decide whether a session is still
    // open, so pin it to the fixtures' reference time.
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.clearAllMocks();
    vi.mocked(getLatestLessonLanguageVersion).mockResolvedValue(null);
    vi.mocked(insertLessonLanguageVersion).mockImplementation(async (data) => ({ ...buildLatest(), ...data }) as any);
    vi.mocked(extendLessonLanguageVersion).mockResolvedValue(buildLatest());
    vi.mocked(promoteLessonLanguageVersion).mockResolvedValue(buildLatest({ kind: 'manual', isSealed: true }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('records nothing when the caller opted out', async () => {
    const result = await recordLessonLanguageVersion({
      lessonLanguageId: LESSON_LANGUAGE_ID,
      content: '<p>changed</p>',
      intent: 'none'
    });

    expect(result).toBeNull();
    expect(getLatestLessonLanguageVersion).not.toHaveBeenCalled();
    expect(insertLessonLanguageVersion).not.toHaveBeenCalled();
  });

  it('opens an unsealed session for the first autosave', async () => {
    await recordLessonLanguageVersion({
      lessonLanguageId: LESSON_LANGUAGE_ID,
      content: '<p>first</p>',
      authorId: AUTHOR_ID,
      intent: 'auto'
    });

    expect(insertLessonLanguageVersion).toHaveBeenCalledTimes(1);
    const inserted = vi.mocked(insertLessonLanguageVersion).mock.calls[0]?.[0];
    expect(inserted).toMatchObject({
      lessonLanguageId: LESSON_LANGUAGE_ID,
      newContent: '<p>first</p>',
      kind: 'auto',
      editCount: 1,
      isSealed: false
    });
    // Postgres owns the clock for these, so the service must not send them.
    expect(inserted).not.toHaveProperty('timestamp');
    expect(inserted).not.toHaveProperty('sessionStartedAt');
  });

  it('seals a snapshot the author explicitly saved', async () => {
    await recordLessonLanguageVersion({
      lessonLanguageId: LESSON_LANGUAGE_ID,
      content: '<p>checkpoint</p>',
      authorId: AUTHOR_ID,
      intent: 'manual',
      label: 'Before the rewrite'
    });

    expect(vi.mocked(insertLessonLanguageVersion).mock.calls[0]?.[0]).toMatchObject({
      kind: 'manual',
      label: 'Before the rewrite',
      isSealed: true
    });
  });

  it('extends the open session instead of inserting a row', async () => {
    vi.mocked(getLatestLessonLanguageVersion).mockResolvedValue(buildLatest());

    await recordLessonLanguageVersion({
      lessonLanguageId: LESSON_LANGUAGE_ID,
      content: '<p>a few more words</p>',
      authorId: AUTHOR_ID,
      intent: 'auto'
    });

    expect(extendLessonLanguageVersion).toHaveBeenCalledTimes(1);
    expect(vi.mocked(extendLessonLanguageVersion).mock.calls[0]?.[1]).toEqual({
      newContent: '<p>a few more words</p>'
    });
    expect(vi.mocked(extendLessonLanguageVersion).mock.calls[0]?.[2]).toBe(TX);
    expect(insertLessonLanguageVersion).not.toHaveBeenCalled();
  });

  it('records nothing for an autosave that did not change the content', async () => {
    const latest = buildLatest();
    vi.mocked(getLatestLessonLanguageVersion).mockResolvedValue(latest);

    const result = await recordLessonLanguageVersion({
      lessonLanguageId: LESSON_LANGUAGE_ID,
      content: latest.newContent,
      authorId: AUTHOR_ID,
      intent: 'auto'
    });

    expect(result).toBe(latest);
    expect(extendLessonLanguageVersion).not.toHaveBeenCalled();
    expect(insertLessonLanguageVersion).not.toHaveBeenCalled();
  });

  it('takes the per-lesson lock before reading the session', async () => {
    await recordLessonLanguageVersion({
      lessonLanguageId: LESSON_LANGUAGE_ID,
      content: '<p>first</p>',
      authorId: AUTHOR_ID,
      intent: 'auto'
    });

    expect(lockLessonLanguageVersionSession).toHaveBeenCalledWith(LESSON_LANGUAGE_ID, TX);
    expect(vi.mocked(lockLessonLanguageVersionSession).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(getLatestLessonLanguageVersion).mock.invocationCallOrder[0]
    );

    // Every transaction-scoped call must share the one client, or a regression
    // that moved work outside the transaction would go undetected.
    expect(getLatestLessonLanguageVersion).toHaveBeenCalledWith(LESSON_LANGUAGE_ID, TX);
    expect(vi.mocked(insertLessonLanguageVersion).mock.calls[0]?.[1]).toBe(TX);
  });

  it('opens a new session when the open one was sealed mid-flight', async () => {
    vi.mocked(getLatestLessonLanguageVersion).mockResolvedValue(buildLatest());
    // A concurrent publish sealed the row between the read and the update.
    vi.mocked(extendLessonLanguageVersion).mockResolvedValue(null);

    await recordLessonLanguageVersion({
      lessonLanguageId: LESSON_LANGUAGE_ID,
      content: '<p>raced</p>',
      authorId: AUTHOR_ID,
      intent: 'auto'
    });

    expect(extendLessonLanguageVersion).toHaveBeenCalledTimes(1);
    expect(insertLessonLanguageVersion).toHaveBeenCalledTimes(1);
  });

  it('never downgrades a publish snapshot to a manual one', async () => {
    const published = buildLatest({ kind: 'publish', isSealed: true, label: null });
    vi.mocked(getLatestLessonLanguageVersion).mockResolvedValue(published);

    const result = await recordLessonLanguageVersion({
      lessonLanguageId: LESSON_LANGUAGE_ID,
      content: published.newContent,
      authorId: AUTHOR_ID,
      intent: 'manual',
      label: 'Reviewed'
    });

    // Promoting would erase the record of what students were served.
    expect(result).toBe(published);
    expect(promoteLessonLanguageVersion).not.toHaveBeenCalled();
    expect(insertLessonLanguageVersion).not.toHaveBeenCalled();
  });

  it('promotes the existing snapshot when a save adds no new content', async () => {
    const latest = buildLatest();
    vi.mocked(getLatestLessonLanguageVersion).mockResolvedValue(latest);

    await recordLessonLanguageVersion({
      lessonLanguageId: LESSON_LANGUAGE_ID,
      content: latest.newContent,
      authorId: AUTHOR_ID,
      intent: 'manual',
      label: 'Reviewed'
    });

    expect(promoteLessonLanguageVersion).toHaveBeenCalledWith(latest.id, { kind: 'manual', label: 'Reviewed' }, TX);
    expect(insertLessonLanguageVersion).not.toHaveBeenCalled();
  });
});
