import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/tag', () => ({ getCourseOrganizationId: vi.fn() }));
vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: vi.fn(),
  isUserCourseMemberOrOrgAdmin: vi.fn()
}));
vi.mock('@cio/core/services/course/course', () => ({ ensureProgramCourseAccess: vi.fn() }));
vi.mock('@cio/db/queries/course/people', () => ({ getCourseMember: vi.fn() }));
vi.mock('@cio/db/queries/exercise', () => ({ getQuestionsByExerciseIds: vi.fn() }));
vi.mock('@cio/db/queries/lesson', () => ({ getLessonById: vi.fn() }));
vi.mock('@cio/db/queries/submission', () => ({ hasSubmission: vi.fn() }));
vi.mock('@api/services/course/access', () => ({ assertEnrolledStudentContentAccess: vi.fn() }));
vi.mock('@api/services/course/completion', () => ({ evaluateCourseCertification: vi.fn() }));
vi.mock('@api/services/lesson', () => ({ upsertLessonCompletionService: vi.fn() }));
vi.mock('@api/services/submission', () => ({ createSubmissionService: vi.fn() }));
vi.mock('@api/services/v1/courses/exercises', () => ({ assertExerciseBelongsToCourse: vi.fn() }));
vi.mock('@api/services/v1/courses/submissions', () => ({
  toPublicSubmission: (submission: { id: string; submittedBy: string; gradingState: string; total: number }) => ({
    id: submission.id,
    memberId: submission.submittedBy,
    gradingState: submission.gradingState,
    total: submission.total
  })
}));

import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { isCourseTeamMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getCourseMember } from '@cio/db/queries/course/people';
import { getQuestionsByExerciseIds } from '@cio/db/queries/exercise';
import { getLessonById } from '@cio/db/queries/lesson';
import { hasSubmission } from '@cio/db/queries/submission';
import { ContentType, ROLE } from '@cio/utils/constants';
import { assertEnrolledStudentContentAccess } from '@api/services/course/access';
import { evaluateCourseCertification } from '@api/services/course/completion';
import { upsertLessonCompletionService } from '@api/services/lesson';
import { createSubmissionService } from '@api/services/submission';
import { assertExerciseBelongsToCourse } from '@api/services/v1/courses/exercises';
import { createLearnerSubmissionService, setLearnerLessonCompletionService } from '@api/services/v1/courses/learner';
import { AppError, ErrorCodes } from '@api/utils/errors';

const ORG_ID = 'org-1';
const ACTOR_ID = 'actor-1';
const COURSE_ID = 'course-1';
const MEMBER_ID = 'member-1';
const LEARNER_PROFILE_ID = 'learner-profile-1';
const LESSON_ID = 'lesson-1';
const EXERCISE_ID = 'exercise-1';
const lessonParams = { courseId: COURSE_ID, memberId: MEMBER_ID, lessonId: LESSON_ID };
const exerciseParams = { courseId: COURSE_ID, memberId: MEMBER_ID, exerciseId: EXERCISE_ID };
const answers = [{ questionId: 7, optionId: 70 }];

const complete = () => setLearnerLessonCompletionService(ORG_ID, ACTOR_ID, lessonParams, { isComplete: true });
const submit = () => createLearnerSubmissionService(ORG_ID, ACTOR_ID, exerciseParams, { answers });

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
  vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
  vi.mocked(getCourseMember).mockResolvedValue({
    id: MEMBER_ID,
    roleId: ROLE.STUDENT,
    profileId: LEARNER_PROFILE_ID
  } as never);
  vi.mocked(getLessonById).mockResolvedValue({ id: LESSON_ID, courseId: COURSE_ID } as never);
  vi.mocked(upsertLessonCompletionService).mockResolvedValue({ isComplete: true, updatedAt: '2026-01-02' } as never);
  vi.mocked(evaluateCourseCertification).mockResolvedValue({} as never);
  vi.mocked(assertExerciseBelongsToCourse).mockResolvedValue({ allowMultipleAttempts: false } as never);
  vi.mocked(getQuestionsByExerciseIds).mockResolvedValue([{ id: 7, questionTypeId: 1 }] as never);
  vi.mocked(hasSubmission).mockResolvedValue(false);
  vi.mocked(createSubmissionService).mockResolvedValue({
    id: 'submission-1',
    submittedBy: MEMBER_ID,
    gradingState: 'completed',
    total: 1
  } as never);
});

describe.each([
  ['lesson completion', complete],
  ['exercise submission', submit]
])('who may act for a learner: %s', (_name, call) => {
  const expectNothingWritten = () => {
    expect(upsertLessonCompletionService).not.toHaveBeenCalled();
    expect(createSubmissionService).not.toHaveBeenCalled();
  };

  it('returns 404 for a course in another organization', async () => {
    vi.mocked(getCourseOrganizationId).mockResolvedValue('org-2');

    await expect(call()).rejects.toMatchObject({ statusCode: 404 });
    expectNothingWritten();
  });

  it('returns 401 without an actor', async () => {
    await expect(
      setLearnerLessonCompletionService(ORG_ID, null, lessonParams, { isComplete: true })
    ).rejects.toMatchObject({ statusCode: 401 });
    await expect(createLearnerSubmissionService(ORG_ID, null, exerciseParams, { answers })).rejects.toMatchObject({
      statusCode: 401
    });
    expectNothingWritten();
  });

  it('returns 403 when the key creator is not course team or org admin', async () => {
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

    await expect(call()).rejects.toMatchObject({ statusCode: 403 });
    expectNothingWritten();
  });

  it('returns 404 for a member of another course', async () => {
    vi.mocked(getCourseMember).mockResolvedValue(null);

    await expect(call()).rejects.toMatchObject({ statusCode: 404 });
    expect(getCourseMember).toHaveBeenCalledWith(COURSE_ID, MEMBER_ID);
    expectNothingWritten();
  });

  it('returns 400 for a tutor member', async () => {
    vi.mocked(getCourseMember).mockResolvedValue({
      id: MEMBER_ID,
      roleId: ROLE.TUTOR,
      profileId: LEARNER_PROFILE_ID
    } as never);

    await expect(call()).rejects.toMatchObject({ statusCode: 400 });
    expectNothingWritten();
  });

  it('returns 409 for a member who has not accepted their invite', async () => {
    vi.mocked(getCourseMember).mockResolvedValue({ id: MEMBER_ID, roleId: ROLE.STUDENT, profileId: null } as never);

    await expect(call()).rejects.toMatchObject({ statusCode: 409 });
    expectNothingWritten();
  });

  it("applies the learner's own content access, not the key creator's", async () => {
    vi.mocked(assertEnrolledStudentContentAccess).mockRejectedValue(
      new AppError('Content is locked', ErrorCodes.VALIDATION_ERROR, 403)
    );

    await expect(call()).rejects.toMatchObject({ statusCode: 403 });
    expect(assertEnrolledStudentContentAccess).toHaveBeenCalledWith(
      expect.objectContaining({ courseId: COURSE_ID, profileId: LEARNER_PROFILE_ID })
    );
    expectNothingWritten();
  });
});

describe('setLearnerLessonCompletionService', () => {
  it('completes the lesson as the learner and evaluates the certificate', async () => {
    const result = await complete();

    expect(assertEnrolledStudentContentAccess).toHaveBeenCalledWith({
      courseId: COURSE_ID,
      profileId: LEARNER_PROFILE_ID,
      contentId: LESSON_ID,
      type: ContentType.Lesson
    });
    expect(upsertLessonCompletionService).toHaveBeenCalledWith(LESSON_ID, LEARNER_PROFILE_ID, true);
    expect(evaluateCourseCertification).toHaveBeenCalledWith(COURSE_ID, LEARNER_PROFILE_ID);
    expect(result).toEqual({ lessonId: LESSON_ID, memberId: MEMBER_ID, isComplete: true, updatedAt: '2026-01-02' });
  });

  it('returns 404 for a lesson from another course', async () => {
    vi.mocked(getLessonById).mockResolvedValue({ id: LESSON_ID, courseId: 'course-2' } as never);

    await expect(complete()).rejects.toMatchObject({ statusCode: 404 });
    expect(upsertLessonCompletionService).not.toHaveBeenCalled();
  });

  it('undoes a completion without evaluating the certificate', async () => {
    vi.mocked(upsertLessonCompletionService).mockResolvedValue({ isComplete: false, updatedAt: '2026-01-03' } as never);

    const result = await setLearnerLessonCompletionService(ORG_ID, ACTOR_ID, lessonParams, { isComplete: false });

    expect(upsertLessonCompletionService).toHaveBeenCalledWith(LESSON_ID, LEARNER_PROFILE_ID, false);
    expect(evaluateCourseCertification).not.toHaveBeenCalled();
    expect(result.isComplete).toBe(false);
  });

  it('still succeeds when the certificate evaluation fails', async () => {
    vi.mocked(evaluateCourseCertification).mockRejectedValue(new Error('boom'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(complete()).resolves.toMatchObject({ isComplete: true });
  });
});

describe('createLearnerSubmissionService', () => {
  it('submits as the learner through the dashboard service', async () => {
    const result = await submit();

    expect(assertExerciseBelongsToCourse).toHaveBeenCalledWith(COURSE_ID, EXERCISE_ID);
    expect(assertEnrolledStudentContentAccess).toHaveBeenCalledWith({
      courseId: COURSE_ID,
      profileId: LEARNER_PROFILE_ID,
      contentId: EXERCISE_ID,
      type: ContentType.Exercise
    });
    expect(createSubmissionService).toHaveBeenCalledWith(COURSE_ID, EXERCISE_ID, MEMBER_ID, answers);
    expect(result).toEqual({ id: 'submission-1', memberId: MEMBER_ID, gradingState: 'completed', total: 1 });
  });

  it('returns 404 for an exercise from another course', async () => {
    vi.mocked(assertExerciseBelongsToCourse).mockRejectedValue(
      new AppError('Exercise not found', ErrorCodes.EXERCISE_NOT_FOUND, 404)
    );

    await expect(submit()).rejects.toMatchObject({ statusCode: 404 });
    expect(createSubmissionService).not.toHaveBeenCalled();
  });

  it('returns 404 for a question outside the exercise', async () => {
    vi.mocked(getQuestionsByExerciseIds).mockResolvedValue([{ id: 8, questionTypeId: 1 }] as never);

    await expect(submit()).rejects.toMatchObject({ statusCode: 404 });
    expect(createSubmissionService).not.toHaveBeenCalled();
  });

  it.each([
    ['file upload', 8],
    ['video recording', 13]
  ])('returns 400 for an answer to a %s question', async (_name, questionTypeId) => {
    vi.mocked(getQuestionsByExerciseIds).mockResolvedValue([{ id: 7, questionTypeId }] as never);

    await expect(submit()).rejects.toMatchObject({ statusCode: 400 });
    expect(createSubmissionService).not.toHaveBeenCalled();
  });

  it('returns 409 for a second submission on a one-attempt exercise', async () => {
    vi.mocked(hasSubmission).mockResolvedValue(true);

    await expect(submit()).rejects.toMatchObject({ statusCode: 409 });
    expect(hasSubmission).toHaveBeenCalledWith(EXERCISE_ID, MEMBER_ID);
    expect(createSubmissionService).not.toHaveBeenCalled();
  });

  it('allows another submission when the exercise allows multiple attempts', async () => {
    vi.mocked(assertExerciseBelongsToCourse).mockResolvedValue({ allowMultipleAttempts: true } as never);
    vi.mocked(hasSubmission).mockResolvedValue(true);

    await expect(submit()).resolves.toMatchObject({ id: 'submission-1' });
  });
});
