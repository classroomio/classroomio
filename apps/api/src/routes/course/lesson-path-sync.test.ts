import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  upsertLessonCompletionService: vi.fn(),
  updateLessonWatchProgressService: vi.fn(),
  recordCourseCompletionFromProgress: vi.fn(),
  syncCourseProgressInLearningPaths: vi.fn()
}));

vi.mock('@api/middlewares/auth', () => ({
  authMiddleware: async (c: { set: (key: string, value: unknown) => void }, next: () => Promise<void>) => {
    c.set('user', { id: 'profile-1' });
    await next();
  }
}));

vi.mock('@api/middlewares/course-member', () => ({
  courseMemberMiddleware: async (_c: unknown, next: () => Promise<void>) => next()
}));

vi.mock('@api/middlewares/course-team-member', () => ({
  courseTeamMemberMiddleware: async (_c: unknown, next: () => Promise<void>) => next()
}));

vi.mock('@api/services/course/access', () => ({
  assertEnrolledStudentContentAccess: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@api/services/lesson', () => ({
  createLesson: vi.fn(),
  createLessonCommentService: vi.fn(),
  deleteLessonCommentService: vi.fn(),
  deleteLessonService: vi.fn(),
  getLesson: vi.fn(),
  getLessonCommentsPaginated: vi.fn(),
  getLessonCompletionService: vi.fn(),
  getLessonHistoryService: vi.fn(),
  getLessonWatchProgressService: vi.fn(),
  listLessons: vi.fn(),
  reorderLessons: vi.fn(),
  updateLessonCommentService: vi.fn(),
  updateLessonService: vi.fn(),
  updateLessonWatchProgressService: mocks.updateLessonWatchProgressService,
  upsertLessonCompletionService: mocks.upsertLessonCompletionService
}));

vi.mock('@api/services/course/progress-completion', () => ({
  recordCourseCompletionFromProgress: mocks.recordCourseCompletionFromProgress
}));

vi.mock('@api/services/learning-path', () => ({
  syncCourseProgressInLearningPaths: mocks.syncCourseProgressInLearningPaths
}));

vi.mock('@api/services/course/notify-session', () => ({
  notifyCourseSessionUpdateService: vi.fn()
}));

vi.mock('@api/utils/lesson', () => ({
  generateLessonPdf: vi.fn()
}));

vi.mock('@cio/core/services/course/course', () => ({
  ensureCourseGroupMemberId: vi.fn()
}));

vi.mock('@api/routes/course/lesson-language', async () => {
  const { Hono } = await import('@api/utils/hono');

  return { lessonLanguageRouter: new Hono() };
});

import { Hono } from '@api/utils/hono';
import { lessonRouter } from './lesson';

const app = new Hono().route('/:courseId/lesson', lessonRouter);

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

function putCompletion(): Promise<Response> {
  return Promise.resolve(
    app.request('/course-1/lesson/lesson-1/completion', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ isComplete: true })
    })
  );
}

function putWatchProgress(): Promise<Response> {
  return Promise.resolve(
    app.request('/course-1/lesson/lesson-1/watch-progress', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ positionSeconds: 90, playedDeltaSeconds: 30, durationSeconds: 100 })
    })
  );
}

describe('learner path progress sync on lesson completion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.upsertLessonCompletionService.mockResolvedValue({ lessonId: 'lesson-1', isComplete: true });
    mocks.updateLessonWatchProgressService.mockResolvedValue({ didJustComplete: true });
    mocks.recordCourseCompletionFromProgress.mockResolvedValue(undefined);
  });

  it('waits for the path sync before responding to a mark-as-complete', async () => {
    const syncGate = deferred();
    mocks.syncCourseProgressInLearningPaths.mockReturnValue(syncGate.promise);

    const responsePromise = putCompletion();
    let responded = false;
    void responsePromise.then(() => {
      responded = true;
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(responded).toBe(false);

    syncGate.resolve();
    const response = await responsePromise;

    expect(response.status).toBe(200);
    expect(mocks.syncCourseProgressInLearningPaths).toHaveBeenCalledWith('course-1', 'profile-1');
  });

  it('still completes the lesson when the path sync fails', async () => {
    mocks.syncCourseProgressInLearningPaths.mockRejectedValue(new Error('sync down'));

    const response = await putCompletion();

    expect(response.status).toBe(200);
  });

  it('waits for the path sync when a video finishes', async () => {
    const syncGate = deferred();
    mocks.syncCourseProgressInLearningPaths.mockReturnValue(syncGate.promise);

    const responsePromise = putWatchProgress();
    let responded = false;
    void responsePromise.then(() => {
      responded = true;
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(responded).toBe(false);

    syncGate.resolve();
    const response = await responsePromise;

    expect(response.status).toBe(200);
    expect(mocks.syncCourseProgressInLearningPaths).toHaveBeenCalledWith('course-1', 'profile-1');
  });
});
