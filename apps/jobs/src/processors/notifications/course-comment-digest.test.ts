import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listPending: vi.fn(),
  markEmailed: vi.fn(),
  shouldSend: vi.fn(),
  canUse: vi.fn(),
  getProfile: vi.fn(),
  getCourse: vi.fn(),
  getLesson: vi.fn(),
  getExercise: vi.fn(),
  enqueueEmail: vi.fn()
}));

vi.mock('@cio/db/queries/notifications', () => ({
  listPendingCourseCommentDigestNotifications: mocks.listPending,
  markNotificationsEmailed: mocks.markEmailed,
  EmailPreferenceLookupCache: class {
    shouldSend = mocks.shouldSend;
  }
}));
vi.mock('@cio/core/services/course-comment/access', () => ({ canUseCourseComments: mocks.canUse }));
vi.mock('@cio/core/config/dashboard-url', () => ({ getAppBaseUrl: () => 'https://app.example.com' }));
vi.mock('@cio/db/queries/auth', () => ({ getProfileById: mocks.getProfile }));
vi.mock('@cio/db/queries/course', () => ({ getCourseWithOrgData: mocks.getCourse }));
vi.mock('@cio/db/queries/lesson', () => ({ getLessonById: mocks.getLesson }));
vi.mock('@cio/db/queries/exercise', () => ({ getExerciseById: mocks.getExercise }));
vi.mock('@cio/jobs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cio/jobs')>()),
  enqueueEmailSend: mocks.enqueueEmail
}));
vi.mock('../../utils/logger', () => ({ log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { processCourseCommentDigest } from './course-comment-digest';

const payload = {
  organizationId: '11111111-1111-4111-8111-111111111111',
  courseId: '22222222-2222-4222-8222-222222222222',
  threadId: '33333333-3333-4333-8333-333333333333',
  recipientId: '44444444-4444-4444-8444-444444444444'
};

function row(id: string, kind: string, body: string | null = 'A comment') {
  return {
    id,
    kind,
    createdAt: '2026-11-14T10:00:00.000Z',
    readAt: null,
    actorId: 'actor',
    actorFullname: 'Ada Admin',
    actorAvatarUrl: null,
    courseId: payload.courseId,
    courseTitle: 'Pricing 101',
    threadId: payload.threadId,
    threadLessonId: 'lesson-1',
    threadExerciseId: null,
    commentBody: body,
    commentMentions: []
  };
}

describe('processCourseCommentDigest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.canUse.mockResolvedValue(true);
    mocks.shouldSend.mockResolvedValue(true);
    mocks.getProfile.mockResolvedValue({ id: payload.recipientId, email: 'tutor@example.com' });
    mocks.getCourse.mockResolvedValue({
      courseTitle: 'Pricing 101',
      orgName: 'Acme Academy',
      orgAvatarUrl: null,
      orgTheme: null
    });
    mocks.getLesson.mockResolvedValue({ title: 'Anchoring' });
  });

  it('does nothing when every notification was read or emailed already', async () => {
    mocks.listPending.mockResolvedValue([]);

    expect(await processCourseCommentDigest(payload)).toEqual({
      sent: false,
      notificationCount: 0,
      skipped: 'nothing_pending'
    });
    expect(mocks.enqueueEmail).not.toHaveBeenCalled();
    expect(mocks.markEmailed).not.toHaveBeenCalled();
  });

  it('sends one email for the thread and marks every pending notification emailed', async () => {
    mocks.listPending.mockResolvedValue([
      row('n2', 'course_comment.replied', 'Second'),
      row('n1', 'course_comment.mentioned', 'First')
    ]);

    expect(await processCourseCommentDigest(payload)).toEqual({ sent: true, notificationCount: 2 });
    expect(mocks.enqueueEmail).toHaveBeenCalledTimes(1);

    const [email, options] = mocks.enqueueEmail.mock.calls[0];
    expect(email).toMatchObject({
      template: 'courseCommentDigest',
      to: 'tutor@example.com',
      organizationId: payload.organizationId,
      fields: {
        courseTitle: 'Pricing 101',
        locationLabel: 'Anchoring',
        moreCount: 0,
        threadUrl: `https://app.example.com/courses/${payload.courseId}/lessons/lesson-1?thread=${payload.threadId}`,
        items: [
          { actorName: 'Ada Admin', action: 'replied', snippet: 'Second' },
          { actorName: 'Ada Admin', action: 'mentioned', snippet: 'First' }
        ]
      }
    });
    expect(email.from).toContain('Acme Academy (via ClassroomIO.com)');
    expect(options).toEqual({ idempotencyKey: 'course-comment-digest:n2' });
    expect(mocks.markEmailed).toHaveBeenCalledWith(['n2', 'n1']);
  });

  it('caps the listed updates and counts the rest', async () => {
    mocks.listPending.mockResolvedValue(
      Array.from({ length: 7 }, (_, index) => row(`n${index}`, 'course_comment.replied'))
    );

    await processCourseCommentDigest(payload);

    const [email] = mocks.enqueueEmail.mock.calls[0];
    expect(email.fields.items).toHaveLength(5);
    expect(email.fields.moreCount).toBe(2);
  });

  it.each([
    ['no_access', () => mocks.canUse.mockResolvedValue(false)],
    ['opted_out', () => mocks.shouldSend.mockResolvedValue(false)],
    ['no_email', () => mocks.getProfile.mockResolvedValue({ id: payload.recipientId, email: null })]
  ])('skips with %s and never emails those notifications later', async (reason, arrange) => {
    mocks.listPending.mockResolvedValue([row('n1', 'course_comment.mentioned')]);
    arrange();

    expect(await processCourseCommentDigest(payload)).toEqual({
      sent: false,
      notificationCount: 1,
      skipped: reason
    });
    expect(mocks.enqueueEmail).not.toHaveBeenCalled();
    expect(mocks.markEmailed).toHaveBeenCalledWith(['n1']);
  });

  it('leaves the snippet out of a resolved update', async () => {
    mocks.listPending.mockResolvedValue([row('n1', 'course_comment.resolved', 'Original comment')]);

    await processCourseCommentDigest(payload);

    const [email] = mocks.enqueueEmail.mock.calls[0];
    expect(email.fields.items).toEqual([{ actorName: 'Ada Admin', action: 'resolved', snippet: null }]);
  });
});
