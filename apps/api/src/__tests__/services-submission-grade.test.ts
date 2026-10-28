import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/drizzle', () => ({ db: {} }));
vi.mock('@cio/db/queries/submission', () => ({
  createSubmission: vi.fn(),
  deleteSubmission: vi.fn(),
  getQuestionAnswersBySubmissionId: vi.fn(),
  getSubmissionById: vi.fn(),
  getSubmissionsByCourseIdWithDetails: vi.fn(),
  getSubmissionsForGrading: vi.fn(),
  hasSubmission: vi.fn(),
  insertQuestionAnswersBatch: vi.fn(),
  lockSubmissionAttempt: vi.fn(),
  updateQuestionAnswer: vi.fn(),
  updateSubmission: vi.fn(),
  updateSubmissionGrades: vi.fn()
}));
vi.mock('@cio/db/queries/exercise', () => ({
  getExerciseById: vi.fn(),
  getExerciseWithRelationsOptimized: vi.fn()
}));
vi.mock('@cio/db/queries/course', () => ({ getCourseById: vi.fn(), getCourseWithOrgData: vi.fn() }));
vi.mock('@cio/db/queries/course/people', () => ({
  getCourseTeachers: vi.fn(),
  getProfileByGroupMemberId: vi.fn()
}));
vi.mock('@cio/db/queries/group', () => ({
  canAccessCourseSubmissions: vi.fn(),
  getGroupMemberIdByCourseAndProfile: vi.fn()
}));
vi.mock('@cio/db/queries/assets', () => ({ createAssetUsage: vi.fn(), getAssetById: vi.fn() }));
vi.mock('@cio/db/queries/course/progression', () => ({ isExerciseCompletedForMember: vi.fn() }));
vi.mock('@cio/email', () => ({ buildEmailBranding: vi.fn(), buildEmailFromName: vi.fn() }));
vi.mock('@api/services/jobs', () => ({ enqueueTransactionalEmail: vi.fn() }));
vi.mock('@cio/core/config/dashboard-url', () => ({ getDashboardBaseUrl: vi.fn() }));
vi.mock('@cio/core/services/webhook/emit', () => ({ emitCourseWebhookEvent: vi.fn() }));
vi.mock('@cio/core/utils/s3', () => ({
  generateDocumentDownloadPresignedUrls: vi.fn(),
  generateVideoDownloadPresignedUrls: vi.fn()
}));
vi.mock('@api/services/course/compliance', () => ({ syncComplianceProgressFromSubmission: vi.fn() }));
vi.mock('@api/services/course/completion', () => ({ evaluateCourseCertification: vi.fn() }));

import {
  getSubmissionById,
  getSubmissionsForGrading,
  updateSubmission,
  updateSubmissionGrades
} from '@cio/db/queries/submission';
import { getProfileByGroupMemberId } from '@cio/db/queries/course/people';
import { isExerciseCompletedForMember } from '@cio/db/queries/course/progression';
import { evaluateCourseCertification } from '@api/services/course/completion';
import { updateSubmissionGradesBatch, updateSubmissionService } from '@api/services/submission/submission';

const COURSE_ID = 'course-1';
const SUBMISSION_ID = 'submission-1';
const MEMBER_ID = 'member-1';
const PROFILE_ID = 'profile-1';

const submissionRow = (gradingState: string) =>
  ({
    id: SUBMISSION_ID,
    courseId: COURSE_ID,
    exerciseId: 'exercise-1',
    submittedBy: MEMBER_ID,
    gradingState,
    statusId: gradingState === 'completed' ? 3 : 2
  }) as never;

const gradeBatch = () =>
  updateSubmissionGradesBatch(SUBMISSION_ID, COURSE_ID, { answers: [{ questionId: 1, points: 5 }], total: 5 });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSubmissionById).mockResolvedValue(submissionRow('awaiting_manual'));
  vi.mocked(getSubmissionsForGrading).mockResolvedValue([]);
  vi.mocked(updateSubmission).mockResolvedValue(submissionRow('completed'));
  vi.mocked(updateSubmissionGrades).mockResolvedValue(submissionRow('completed'));
  vi.mocked(getProfileByGroupMemberId).mockResolvedValue({ id: PROFILE_ID } as never);
  vi.mocked(isExerciseCompletedForMember).mockResolvedValue(true);
  vi.mocked(evaluateCourseCertification).mockResolvedValue({} as never);
});

describe('certificate check after grading', () => {
  it('checks the certificate when grades are saved', async () => {
    await gradeBatch();

    expect(evaluateCourseCertification).toHaveBeenCalledWith(COURSE_ID, PROFILE_ID);
  });

  it('checks the certificate when the submission is marked graded', async () => {
    await updateSubmissionService(SUBMISSION_ID, COURSE_ID, { gradingState: 'completed' });

    expect(evaluateCourseCertification).toHaveBeenCalledWith(COURSE_ID, PROFILE_ID);
  });

  it('checks again on a re-grade of an already graded submission', async () => {
    vi.mocked(getSubmissionById).mockResolvedValue(submissionRow('completed'));

    await gradeBatch();

    expect(evaluateCourseCertification).toHaveBeenCalledWith(COURSE_ID, PROFILE_ID);
  });

  it('skips the check when the exercise is still not complete', async () => {
    vi.mocked(isExerciseCompletedForMember).mockResolvedValue(false);

    await gradeBatch();

    expect(evaluateCourseCertification).not.toHaveBeenCalled();
  });

  it('skips the check when the submission is not graded', async () => {
    vi.mocked(getSubmissionById).mockResolvedValue(submissionRow('queued'));
    vi.mocked(updateSubmission).mockResolvedValue(submissionRow('processing'));

    await updateSubmissionService(SUBMISSION_ID, COURSE_ID, { gradingState: 'processing' });

    expect(evaluateCourseCertification).not.toHaveBeenCalled();
  });

  it('keeps the grade saved when the certificate check fails', async () => {
    vi.mocked(evaluateCourseCertification).mockRejectedValue(new Error('boom'));

    await expect(gradeBatch()).resolves.toMatchObject({ id: SUBMISSION_ID });
  });
});
