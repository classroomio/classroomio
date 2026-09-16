import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getEventBus: vi.fn(),
  getSubmissionById: vi.fn(),
  getSubmissionsForGrading: vi.fn(),
  updateSubmissionGrades: vi.fn(),
  getCourseWithOrgData: vi.fn(),
  getCourseById: vi.fn(),
  getProfileByGroupMemberId: vi.fn()
}));

vi.mock('@cio/sdk', () => ({
  getEventBus: mocks.getEventBus
}));

vi.mock('@cio/db/queries/submission', () => ({
  getSubmissionById: mocks.getSubmissionById,
  getSubmissionsForGrading: mocks.getSubmissionsForGrading,
  updateSubmissionGrades: mocks.updateSubmissionGrades
}));

vi.mock('@cio/db/queries/course', () => ({
  getCourseWithOrgData: mocks.getCourseWithOrgData,
  getCourseById: mocks.getCourseById
}));

vi.mock('@cio/db/queries/course/people', () => ({
  getProfileByGroupMemberId: mocks.getProfileByGroupMemberId
}));

vi.mock('@api/services/course/compliance', () => ({
  syncComplianceProgressFromSubmission: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@api/services/jobs', () => ({
  enqueueTransactionalEmail: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@cio/core/utils/s3', () => ({
  generateDocumentDownloadPresignedUrls: vi.fn().mockResolvedValue([]),
  generateVideoDownloadPresignedUrls: vi.fn().mockResolvedValue([])
}));

vi.mock('@api/services/course/completion', () => ({
  evaluateCourseCertification: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('@cio/db/queries/exercise', () => ({
  getExerciseById: vi.fn().mockResolvedValue(null),
  getExerciseWithRelationsOptimized: vi.fn().mockResolvedValue(null)
}));

vi.mock('@cio/db/queries/group', () => ({
  getGroupMemberIdByCourseAndProfile: vi.fn().mockResolvedValue(null),
  isCourseTeamMemberOrOrgAdmin: vi.fn().mockResolvedValue(false)
}));

vi.mock('@cio/db/queries/assets', () => ({
  createAssetUsage: vi.fn().mockResolvedValue(null),
  getAssetById: vi.fn().mockResolvedValue(null)
}));

vi.mock('@cio/db/queries/course/progression', () => ({
  isExerciseCompletedForMember: vi.fn().mockResolvedValue(false)
}));

vi.mock('@cio/email', () => ({
  buildEmailBranding: vi.fn().mockReturnValue({}),
  buildEmailFromName: vi.fn().mockReturnValue('')
}));

import { updateSubmissionGradesBatch } from '@api/services/submission';

describe('exercise.graded plugin event dispatch', () => {
  const mockBus = { dispatch: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getEventBus.mockReturnValue(mockBus);
    mockBus.dispatch.mockResolvedValue(undefined);

    mocks.getSubmissionById.mockResolvedValue({
      id: 'sub-1',
      courseId: 'course-1',
      exerciseId: 'exercise-1',
      submittedBy: 'gm-1',
      gradingState: 'awaiting_manual',
      statusId: 1
    });

    mocks.getProfileByGroupMemberId.mockResolvedValue({
      id: 'profile-1',
      userId: 'user-1'
    });

    mocks.getCourseWithOrgData.mockResolvedValue({
      id: 'course-1',
      orgId: 'org-1'
    });

    mocks.getSubmissionsForGrading.mockResolvedValue([]);
    mocks.getCourseById.mockResolvedValue([]);

    mocks.updateSubmissionGrades.mockResolvedValue({
      id: 'sub-1',
      courseId: 'course-1',
      exerciseId: 'exercise-1',
      submittedBy: 'gm-1',
      gradingState: 'completed',
      statusId: 3,
      total: 85
    });
  });

  it('dispatches exercise.graded event after grading submission', async () => {
    await updateSubmissionGradesBatch('sub-1', {
      total: 85,
      answers: [{ questionId: 1, points: 85 }]
    });

    await vi.waitFor(() => {
      expect(mockBus.dispatch).toHaveBeenCalledWith(
        'exercise.graded',
        expect.objectContaining({
          exerciseId: 'exercise-1',
          score: 85,
          courseId: 'course-1'
        })
      );
    });
  });

  it('does not block grading if plugin dispatch throws an error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockBus.dispatch.mockRejectedValue(new Error('plugin handler error'));

    const result = await updateSubmissionGradesBatch('sub-1', {
      total: 90,
      answers: [{ questionId: 1, points: 90 }]
    });

    expect(result).toBeDefined();
    expect(result.id).toBe('sub-1');
    await vi.waitFor(() => expect(consoleError).toHaveBeenCalled());

    consoleError.mockRestore();
  });

  it('does not wait for event context lookups', async () => {
    mocks.getProfileByGroupMemberId.mockReturnValue(new Promise(() => {}));

    const result = await updateSubmissionGradesBatch('sub-1', {
      total: 90,
      answers: [{ questionId: 1, points: 90 }]
    });

    expect(result.id).toBe('sub-1');
  });
});
