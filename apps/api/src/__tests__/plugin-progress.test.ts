import { beforeEach, describe, expect, it, vi } from 'vitest';

const dbMocks = vi.hoisted(() => ({
  getInstallationById: vi.fn(),
  getPluginLessonAccessContext: vi.fn(),
  getPluginCourseById: vi.fn(),
  getCourseProgress: vi.fn(),
  getInstallationGrants: vi.fn(),
  getUserOrgRole: vi.fn()
}));
const accessMocks = vi.hoisted(() => ({
  assertEnrolledStudentContentAccess: vi.fn()
}));
const completionMocks = vi.hoisted(() => ({
  evaluateCourseCertification: vi.fn()
}));
const lessonMocks = vi.hoisted(() => ({
  getLessonCompletionService: vi.fn(),
  upsertLessonCompletionService: vi.fn()
}));

vi.mock('@cio/db/queries', () => dbMocks);
vi.mock('@api/services/course/access', () => accessMocks);
vi.mock('@api/services/course/completion', () => completionMocks);
vi.mock('@api/services/lesson', () => lessonMocks);

import {
  getCourseProgressForPlugin,
  getLessonCompletionForPlugin,
  resetLessonCompletionForPlugin,
  setLessonCompletionForPlugin
} from '@api/services/plugin/progress';

describe('plugin learner progress API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.getInstallationById.mockResolvedValue({
      id: 'installation-1',
      ownerType: 'organization',
      organizationId: 'organization-1',
      status: 'active',
      orgApprovalStatus: 'approved'
    });
    dbMocks.getPluginLessonAccessContext.mockResolvedValue({ courseId: 'course-1' });
    dbMocks.getInstallationGrants.mockResolvedValue([
      { scope: 'learner.progress:read' },
      { scope: 'learner.progress:write' }
    ]);
    dbMocks.getUserOrgRole.mockResolvedValue(3);
    lessonMocks.getLessonCompletionService.mockResolvedValue({ isComplete: true });
    lessonMocks.upsertLessonCompletionService.mockImplementation(
      async (_lessonId: string, _profileId: string, isComplete: boolean) => ({ isComplete })
    );
    completionMocks.evaluateCourseCertification.mockResolvedValue(undefined);
  });

  it('returns only the current learner completion state', async () => {
    await expect(
      getLessonCompletionForPlugin('installation-1', 'organization-1', 'profile-1', 'lesson-1')
    ).resolves.toEqual({ isComplete: true });

    expect(dbMocks.getInstallationGrants).toHaveBeenCalledWith('installation-1');
    expect(accessMocks.assertEnrolledStudentContentAccess).toHaveBeenCalledWith(
      expect.objectContaining({ courseId: 'course-1', profileId: 'profile-1', contentId: 'lesson-1' })
    );
  });

  it('sets completion for the authenticated learner and evaluates certification', async () => {
    await expect(
      setLessonCompletionForPlugin('installation-1', 'organization-1', 'profile-1', 'lesson-1', true)
    ).resolves.toEqual({ isComplete: true });

    expect(dbMocks.getInstallationGrants).toHaveBeenCalledWith('installation-1');
    expect(lessonMocks.upsertLessonCompletionService).toHaveBeenCalledWith('lesson-1', 'profile-1', true);
    expect(completionMocks.evaluateCourseCertification).toHaveBeenCalledWith('course-1', 'profile-1');
  });

  it('rejects a lesson outside the installation organization', async () => {
    dbMocks.getPluginLessonAccessContext.mockResolvedValue(null);

    await expect(
      setLessonCompletionForPlugin('installation-1', 'organization-1', 'profile-1', 'lesson-2', true)
    ).rejects.toMatchObject({ code: 'LESSON_NOT_FOUND', statusCode: 404 });

    expect(lessonMocks.upsertLessonCompletionService).not.toHaveBeenCalled();
  });

  it('rejects an installation without learner progress permission', async () => {
    dbMocks.getInstallationGrants.mockResolvedValue([{ scope: 'learner.progress:read' }]);

    await expect(
      setLessonCompletionForPlugin('installation-1', 'organization-1', 'profile-1', 'lesson-1', true)
    ).rejects.toMatchObject({ code: 'PLUGIN_PERMISSION_DENIED', statusCode: 403 });

    expect(dbMocks.getPluginLessonAccessContext).not.toHaveBeenCalled();
  });

  it('resets lesson completion to false', async () => {
    await expect(
      resetLessonCompletionForPlugin('installation-1', 'organization-1', 'profile-1', 'lesson-1')
    ).resolves.toEqual({ isComplete: false });

    expect(lessonMocks.upsertLessonCompletionService).toHaveBeenCalledWith('lesson-1', 'profile-1', false);
    expect(completionMocks.evaluateCourseCertification).not.toHaveBeenCalled();
  });

  it('returns course-level progress for enrolled learner', async () => {
    dbMocks.getPluginCourseById.mockResolvedValue({ id: 'course-1' });
    dbMocks.getCourseProgress.mockResolvedValue({
      groupMemberId: 'member-1',
      lessonsCount: 10,
      lessonsCompleted: 8,
      exercisesCount: 2,
      exercisesCompleted: 2,
      certificateEarnedAt: '2026-01-01T00:00:00.000Z'
    });

    const progress = await getCourseProgressForPlugin('installation-1', 'organization-1', 'profile-1', 'course-1');

    expect(progress).toEqual({
      courseId: 'course-1',
      percentage: 83,
      lessonsCompleted: 8,
      totalLessons: 10,
      isComplete: true,
      certificateEarnedAt: '2026-01-01T00:00:00.000Z'
    });
  });

  it('rejects course progress when learner is not enrolled', async () => {
    dbMocks.getPluginCourseById.mockResolvedValue({ id: 'course-1' });
    dbMocks.getCourseProgress.mockResolvedValue({
      groupMemberId: null,
      lessonsCount: 10,
      lessonsCompleted: 0,
      exercisesCount: 0,
      exercisesCompleted: 0
    });

    await expect(
      getCourseProgressForPlugin('installation-1', 'organization-1', 'profile-1', 'course-1')
    ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
  });

  it('rejects course progress when course is not in organization', async () => {
    dbMocks.getPluginCourseById.mockResolvedValue(null);

    await expect(
      getCourseProgressForPlugin('installation-1', 'organization-1', 'profile-1', 'course-1')
    ).rejects.toMatchObject({ code: 'COURSE_NOT_FOUND', statusCode: 404 });
  });
});
