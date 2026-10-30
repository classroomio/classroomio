import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  captureServerEvent: vi.fn(),
  captureCourseEvent: vi.fn(),
  getCourseById: vi.fn(),
  updateCourseQuery: vi.fn(),
  getCourseCertificationRow: vi.fn(),
  getCourseProgress: vi.fn(),
  getActiveOrganizationPlan: vi.fn(),
  claimMemberCertificateEarned: vi.fn(),
  claimMemberCompleted: vi.fn(),
  emitWebhookEvent: vi.fn(),
  getLessonById: vi.fn(),
  getLessonCompletion: vi.fn(),
  upsertLessonCompletion: vi.fn()
}));

vi.mock('@cio/core/services/posthog', () => ({
  captureServerEvent: mocks.captureServerEvent,
  captureCourseEvent: mocks.captureCourseEvent
}));
vi.mock('@cio/db/queries/course', () => ({
  getCourseById: mocks.getCourseById,
  updateCourse: mocks.updateCourseQuery
}));
vi.mock('@cio/db/queries/course/course', () => ({
  getCourseById: mocks.getCourseById,
  getCourseCertificationRow: mocks.getCourseCertificationRow,
  getCourseProgress: mocks.getCourseProgress
}));
vi.mock('@cio/db/queries/course/people', () => ({
  claimMemberCertificateEarned: mocks.claimMemberCertificateEarned,
  claimMemberCompleted: mocks.claimMemberCompleted
}));
vi.mock('@cio/db/queries/organization', () => ({ getActiveOrganizationPlan: mocks.getActiveOrganizationPlan }));
vi.mock('@cio/db/queries/lesson', () => ({
  getLessonById: mocks.getLessonById,
  getLessonCompletion: mocks.getLessonCompletion,
  upsertLessonCompletion: mocks.upsertLessonCompletion
}));
vi.mock('@cio/core/services/webhook/emit', () => ({
  emitWebhookEvent: mocks.emitWebhookEvent,
  emitCourseWebhookEvent: vi.fn()
}));
vi.mock('@cio/core/utils/redis/org-stats-cache', () => ({ invalidateOrgStats: vi.fn() }));
vi.mock('@cio/analytics', () => ({ trackServerEvent: vi.fn(), SERVER_EVENTS: {} }));
vi.mock('@api/utils/course-completion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@api/utils/course-completion')>();

  return { ...actual, scheduleCertificationCompletionWork: vi.fn() };
});

import { updateCourse } from '@cio/core/services/course/course';
import { upsertLessonCompletionService } from '@cio/core/services/lesson/lesson';
import { evaluateCourseCertification } from '@api/services/course/completion';

describe('course_published', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports publishedNow only when the course goes from unpublished to published', async () => {
    mocks.getCourseById.mockResolvedValue([{ id: 'course-1', isPublished: false, cost: 0 }]);
    mocks.updateCourseQuery.mockResolvedValue({ id: 'course-1', isPublished: true });

    await expect(updateCourse('course-1', { isPublished: true })).resolves.toMatchObject({ publishedNow: true });
  });

  it('does not report publishedNow when an already-published course is saved again', async () => {
    mocks.getCourseById.mockResolvedValue([{ id: 'course-1', isPublished: true, cost: 0 }]);
    mocks.updateCourseQuery.mockResolvedValue({ id: 'course-1', isPublished: true });

    await expect(updateCourse('course-1', { isPublished: true, title: 'New' })).resolves.toMatchObject({
      publishedNow: false
    });
  });
});

describe('lesson_completed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getLessonById.mockResolvedValue({ id: 'lesson-1', courseId: 'course-1', completionPolicy: 'manual' });
    mocks.upsertLessonCompletion.mockResolvedValue({ isComplete: true });
  });

  it('fires when a lesson is completed for the first time', async () => {
    mocks.getLessonCompletion.mockResolvedValue(null);

    await upsertLessonCompletionService('lesson-1', 'student-1', true);

    expect(mocks.captureCourseEvent).toHaveBeenCalledWith('course-1', {
      event: 'lesson_completed',
      distinctId: 'student-1',
      properties: { lesson_id: 'lesson-1', completion_method: 'manual' }
    });
  });

  it('does not fire when a completed lesson is marked complete again', async () => {
    mocks.getLessonCompletion.mockResolvedValue({ isComplete: true });

    await upsertLessonCompletionService('lesson-1', 'student-1', true);

    expect(mocks.captureCourseEvent).not.toHaveBeenCalled();
  });

  it('does not fire when a lesson is marked incomplete', async () => {
    await upsertLessonCompletionService('lesson-1', 'student-1', false);

    expect(mocks.captureCourseEvent).not.toHaveBeenCalled();
  });
});

describe('course_completed', () => {
  const completedProgress = {
    groupMemberId: 'member-1',
    lessonsCompleted: 2,
    lessonsCount: 2,
    exercisesCompleted: 0,
    exercisesCount: 0,
    enrolledAt: '2026-10-01T09:00:00.000Z',
    completedAt: null,
    certificateEarnedAt: null
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-04T12:00:00.000Z'));
    vi.clearAllMocks();
    mocks.getCourseCertificationRow.mockResolvedValue({ orgId: 'org-1', type: 'SELF_PACED', certificate: {} });
    mocks.claimMemberCertificateEarned.mockResolvedValue(true);
    mocks.claimMemberCompleted.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires when the course is first completed, with the days since enrolment', async () => {
    mocks.getCourseProgress.mockResolvedValue(completedProgress);
    mocks.getActiveOrganizationPlan.mockResolvedValue({ planName: 'EARLY_ADOPTER' });

    await evaluateCourseCertification('course-1', 'student-1');

    expect(mocks.captureServerEvent).toHaveBeenCalledTimes(1);
    expect(mocks.captureServerEvent).toHaveBeenCalledWith({
      event: 'course_completed',
      distinctId: 'student-1',
      orgId: 'org-1',
      properties: { course_id: 'course-1', course_type: 'SELF_PACED', days_to_complete: 3 }
    });
  });

  it('fires on a plan without certificates', async () => {
    mocks.getCourseProgress.mockResolvedValue(completedProgress);
    mocks.getActiveOrganizationPlan.mockResolvedValue({ planName: 'BASIC' });

    await evaluateCourseCertification('course-1', 'student-1');

    expect(mocks.captureServerEvent).toHaveBeenCalledWith(expect.objectContaining({ event: 'course_completed' }));
  });

  it('sends a null days_to_complete when the enrolment date is unknown', async () => {
    mocks.getCourseProgress.mockResolvedValue({ ...completedProgress, enrolledAt: null });
    mocks.getActiveOrganizationPlan.mockResolvedValue({ planName: 'BASIC' });

    await evaluateCourseCertification('course-1', 'student-1');

    expect(mocks.captureServerEvent).toHaveBeenCalledWith(
      expect.objectContaining({ properties: expect.objectContaining({ days_to_complete: null }) })
    );
  });

  it('still fires when a step after the completion claim fails', async () => {
    mocks.getCourseProgress.mockResolvedValue(completedProgress);
    mocks.getActiveOrganizationPlan.mockResolvedValue({ planName: 'EARLY_ADOPTER' });
    mocks.emitWebhookEvent.mockRejectedValueOnce(new Error('webhook store unavailable'));

    await expect(evaluateCourseCertification('course-1', 'student-1')).rejects.toThrow('webhook store unavailable');

    expect(mocks.captureServerEvent).toHaveBeenCalledWith(expect.objectContaining({ event: 'course_completed' }));
  });

  it('does not fire again once the course is completed', async () => {
    mocks.getCourseProgress.mockResolvedValue({
      ...completedProgress,
      completedAt: '2026-10-02T00:00:00.000Z',
      certificateEarnedAt: '2026-10-02T00:00:00.000Z'
    });
    mocks.getActiveOrganizationPlan.mockResolvedValue({ planName: 'EARLY_ADOPTER' });

    await evaluateCourseCertification('course-1', 'student-1');

    expect(mocks.captureServerEvent).not.toHaveBeenCalled();
  });

  it('does not fire when another request already claimed the completion', async () => {
    mocks.getCourseProgress.mockResolvedValue(completedProgress);
    mocks.getActiveOrganizationPlan.mockResolvedValue({ planName: 'EARLY_ADOPTER' });
    mocks.claimMemberCompleted.mockResolvedValue(false);

    await evaluateCourseCertification('course-1', 'student-1');

    expect(mocks.captureServerEvent).not.toHaveBeenCalled();
  });
});
