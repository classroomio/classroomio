import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSubmissionById: vi.fn(),
  updateSubmission: vi.fn(),
  updateSubmissionGrades: vi.fn(),
  deleteSubmission: vi.fn(),
  getProfileByGroupMemberId: vi.fn(),
  syncComplianceProgressFromSubmission: vi.fn(),
  syncCourseProgressInLearningPaths: vi.fn()
}));

vi.mock('@cio/db/queries/submission', () => ({
  createSubmission: vi.fn(),
  deleteSubmission: mocks.deleteSubmission,
  getQuestionAnswersBySubmissionId: vi.fn(),
  getSubmissionById: mocks.getSubmissionById,
  getSubmissionsByCourseIdWithDetails: vi.fn(),
  getSubmissionsForGrading: vi.fn().mockResolvedValue([]),
  hasSubmission: vi.fn(),
  insertQuestionAnswersBatch: vi.fn(),
  updateQuestionAnswer: vi.fn(),
  updateSubmission: mocks.updateSubmission,
  updateSubmissionGrades: mocks.updateSubmissionGrades
}));

vi.mock('@cio/db/queries/course/people', () => ({
  getCourseTeachers: vi.fn(),
  getProfileByGroupMemberId: mocks.getProfileByGroupMemberId
}));

vi.mock('@api/services/course/compliance', () => ({
  syncComplianceProgressFromSubmission: mocks.syncComplianceProgressFromSubmission
}));

vi.mock('@api/services/learning-path', () => ({
  syncCourseProgressInLearningPaths: mocks.syncCourseProgressInLearningPaths
}));

vi.mock('@api/services/jobs', () => ({ enqueueTransactionalEmail: vi.fn() }));

import {
  deleteSubmissionService,
  updateSubmissionGradesBatch,
  updateSubmissionService
} from '@api/services/submission/submission';

const graded = {
  id: 'submission-1',
  courseId: 'course-1',
  submittedBy: 'groupmember-1',
  gradingState: 'completed',
  statusId: 3
};

describe('learning-path progress sync after a submission change', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSubmissionById.mockResolvedValue(graded);
    mocks.getProfileByGroupMemberId.mockResolvedValue({ id: 'profile-1' });
    mocks.syncCourseProgressInLearningPaths.mockResolvedValue(undefined);
  });

  it('syncs after a teacher grades, without recording learner activity', async () => {
    mocks.updateSubmissionGrades.mockResolvedValue(graded);

    await updateSubmissionGradesBatch('submission-1', { answers: [], total: 8 } as never);

    await vi.waitFor(() => {
      expect(mocks.syncCourseProgressInLearningPaths).toHaveBeenCalledWith('course-1', 'profile-1', undefined, {
        recordActivity: false
      });
    });
  });

  it('syncs when a single update completes grading, and not otherwise', async () => {
    mocks.updateSubmission.mockResolvedValue(graded);
    await updateSubmissionService('submission-1', { feedback: 'Good' } as never);

    await vi.waitFor(() => expect(mocks.syncCourseProgressInLearningPaths).toHaveBeenCalledOnce());

    mocks.syncCourseProgressInLearningPaths.mockClear();
    mocks.getSubmissionById.mockResolvedValue({ ...graded, gradingState: 'queued', statusId: 1 });
    mocks.updateSubmission.mockResolvedValue({ ...graded, gradingState: 'queued' });
    await updateSubmissionService('submission-1', { feedback: 'Pending' } as never);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mocks.syncCourseProgressInLearningPaths).not.toHaveBeenCalled();
  });

  it('syncs after a submission is deleted, since that can reopen a course', async () => {
    mocks.deleteSubmission.mockResolvedValue(graded);

    await deleteSubmissionService('submission-1');

    await vi.waitFor(() => {
      expect(mocks.syncCourseProgressInLearningPaths).toHaveBeenCalledWith('course-1', 'profile-1', undefined, {
        recordActivity: false
      });
    });
  });

  it('never fails the grading request when the sync fails', async () => {
    mocks.updateSubmissionGrades.mockResolvedValue(graded);
    mocks.syncCourseProgressInLearningPaths.mockRejectedValue(new Error('sync down'));

    await expect(updateSubmissionGradesBatch('submission-1', { answers: [], total: 8 } as never)).resolves.toEqual(
      graded
    );
  });
});
