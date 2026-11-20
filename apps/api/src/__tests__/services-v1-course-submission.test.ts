import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@cio/db/queries/tag', () => ({ getCourseOrganizationId: vi.fn() }));
vi.mock('@cio/db/queries/group', () => ({
  isCourseTeamMemberOrOrgAdmin: vi.fn(),
  isUserCourseMemberOrOrgAdmin: vi.fn()
}));
vi.mock('@cio/core/services/course/course', () => ({ ensureProgramCourseAccess: vi.fn() }));
vi.mock('@cio/db/queries/course/people', () => ({ getCourseMember: vi.fn() }));
vi.mock('@cio/db/queries/exercise', () => ({
  getExerciseById: vi.fn(),
  getExerciseSectionOwnersByIds: vi.fn(),
  getQuestionsByExerciseIds: vi.fn()
}));
vi.mock('@cio/core/services/exercise/exercise', () => ({ resolveExerciseCourseId: vi.fn() }));
vi.mock('@cio/db/queries/submission', () => ({
  getCourseSubmissionsPage: vi.fn(),
  getQuestionAnswersBySubmissionId: vi.fn(),
  getSubmissionById: vi.fn()
}));
vi.mock('@api/services/submission', () => ({
  deleteSubmissionService: vi.fn(),
  getSubmission: vi.fn(),
  resolveSubmissionGradingState: (submission: { gradingState?: string }) => submission.gradingState ?? 'queued',
  resolveSubmissionOverallStatus: (stored: string | null, questionTypeIds: number[]) =>
    stored ?? (questionTypeIds.includes(3) ? 'manual_required' : 'auto_graded'),
  updateSubmissionGradesBatch: vi.fn(),
  updateSubmissionService: vi.fn()
}));
vi.mock('@api/services/mark/gradebook', () => ({ getGradebook: vi.fn() }));

import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { isCourseTeamMemberOrOrgAdmin, isUserCourseMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getCourseMember } from '@cio/db/queries/course/people';
import { getExerciseById, getQuestionsByExerciseIds } from '@cio/db/queries/exercise';
import { resolveExerciseCourseId } from '@cio/core/services/exercise/exercise';
import {
  getCourseSubmissionsPage,
  getQuestionAnswersBySubmissionId,
  getSubmissionById
} from '@cio/db/queries/submission';
import {
  deleteSubmissionService,
  getSubmission,
  updateSubmissionGradesBatch,
  updateSubmissionService
} from '@api/services/submission';
import { getGradebook } from '@api/services/mark/gradebook';
import {
  deleteCourseSubmissionService,
  getCourseSubmissionService,
  gradeCourseSubmissionService,
  listCourseSubmissionsService,
  updateCourseSubmissionService
} from '@api/services/v1/courses/submissions';
import { getCourseMarksService } from '@api/services/v1/courses/marks';

const ORG_ID = 'org-1';
const ACTOR_ID = 'actor-1';
const COURSE_ID = 'course-1';
const SUBMISSION_ID = 'submission-1';
const params = { courseId: COURSE_ID };
const submissionParams = { courseId: COURSE_ID, submissionId: SUBMISSION_ID };

const submissionRow = (overrides: Record<string, unknown> = {}) =>
  ({
    id: SUBMISSION_ID,
    courseId: COURSE_ID,
    exerciseId: 'exercise-1',
    submittedBy: 'member-1',
    gradingState: 'awaiting_manual',
    overallStatus: 'manual_required',
    total: 0,
    feedback: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-02',
    ...overrides
  }) as never;

const pageRow = (id: string, createdAt: string, overrides: Record<string, unknown> = {}) => ({
  submission: submissionRow({ id, createdAt, total: 3, ...overrides }) as Record<string, unknown>,
  exerciseTitle: 'Quiz',
  exerciseDueBy: null as string | null,
  student: { id: 'profile-1', fullname: 'Ada', email: 'ada@x.io', avatarUrl: null } as Record<string, unknown>
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCourseOrganizationId).mockResolvedValue(ORG_ID);
  vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(true);
  vi.mocked(getSubmissionById).mockResolvedValue(submissionRow());
});

describe('submission access rules', () => {
  it('returns 404 for a course in another organization', async () => {
    vi.mocked(getCourseOrganizationId).mockResolvedValue('org-2');

    await expect(getCourseSubmissionService(ORG_ID, ACTOR_ID, submissionParams)).rejects.toMatchObject({
      statusCode: 404
    });
  });

  it('returns 401 without an actor', async () => {
    await expect(getCourseSubmissionService(ORG_ID, null, submissionParams)).rejects.toMatchObject({ statusCode: 401 });
  });

  it('returns 403 when the actor is not course team, for reads and writes', async () => {
    vi.mocked(isCourseTeamMemberOrOrgAdmin).mockResolvedValue(false);

    await expect(listCourseSubmissionsService(ORG_ID, ACTOR_ID, params, { page: 1, limit: 20 })).rejects.toMatchObject({
      statusCode: 403
    });
    await expect(
      gradeCourseSubmissionService(ORG_ID, ACTOR_ID, submissionParams, { answers: [], total: 0 })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(updateSubmissionGradesBatch).not.toHaveBeenCalled();
  });

  it.each([
    ['get', () => getCourseSubmissionService(ORG_ID, ACTOR_ID, submissionParams)],
    ['grade', () => gradeCourseSubmissionService(ORG_ID, ACTOR_ID, submissionParams, { answers: [], total: 0 })],
    ['update', () => updateCourseSubmissionService(ORG_ID, ACTOR_ID, submissionParams, { feedback: 'x' })],
    ['delete', () => deleteCourseSubmissionService(ORG_ID, ACTOR_ID, submissionParams)]
  ])('returns 404 on %s for a submission from another course', async (_action, call) => {
    vi.mocked(getSubmissionById).mockResolvedValue(submissionRow({ courseId: 'course-2' }));

    await expect(call()).rejects.toMatchObject({ statusCode: 404 });
    expect(getSubmission).not.toHaveBeenCalled();
    expect(updateSubmissionGradesBatch).not.toHaveBeenCalled();
    expect(updateSubmissionService).not.toHaveBeenCalled();
    expect(deleteSubmissionService).not.toHaveBeenCalled();
  });
});

describe('listCourseSubmissionsService', () => {
  beforeEach(() => {
    vi.mocked(getQuestionsByExerciseIds).mockResolvedValue([]);
    vi.mocked(getCourseSubmissionsPage).mockResolvedValue({
      items: [pageRow('s-2', '2026-01-03'), pageRow('s-3', '2026-01-02')],
      total: 41
    } as never);
  });

  it('returns the page the query gives, in its order, with the total from the database', async () => {
    const result = await listCourseSubmissionsService(ORG_ID, ACTOR_ID, params, { page: 2, limit: 20 });

    expect(getCourseSubmissionsPage).toHaveBeenCalledWith(
      COURSE_ID,
      { exerciseId: undefined, memberId: undefined, gradingState: undefined },
      { page: 2, limit: 20 }
    );
    expect(result.items.map((item) => item.id)).toEqual(['s-2', 's-3']);
    expect(result.items[0]).toMatchObject({
      exerciseId: 'exercise-1',
      exerciseTitle: 'Quiz',
      memberId: 'member-1',
      student: { profileId: 'profile-1', fullname: 'Ada' },
      gradingState: 'awaiting_manual',
      overallStatus: 'manual_required',
      total: 3,
      isEarly: true,
      submittedAt: '2026-01-03'
    });
    expect(result.pagination).toEqual({ page: 2, limit: 20, total: 41, totalPages: 3 });
  });

  it('does not load answers or sign file URLs', async () => {
    await listCourseSubmissionsService(ORG_ID, ACTOR_ID, params, { page: 1, limit: 20 });

    expect(getSubmission).not.toHaveBeenCalled();
    expect(getQuestionAnswersBySubmissionId).not.toHaveBeenCalled();
  });

  it('passes the filters to the query instead of filtering in memory', async () => {
    vi.mocked(getCourseMember).mockResolvedValue({ id: 'member-1' } as never);

    await listCourseSubmissionsService(ORG_ID, ACTOR_ID, params, {
      page: 1,
      limit: 20,
      memberId: 'member-1',
      gradingState: 'awaiting_manual'
    });

    expect(getCourseSubmissionsPage).toHaveBeenCalledWith(
      COURSE_ID,
      { exerciseId: undefined, memberId: 'member-1', gradingState: 'awaiting_manual' },
      expect.objectContaining({ page: 1, limit: 20 })
    );
  });

  it('marks a submission made after the due date as not early', async () => {
    vi.mocked(getCourseSubmissionsPage).mockResolvedValue({
      items: [{ ...pageRow('s-2', '2026-01-03'), exerciseDueBy: '2026-01-02' }],
      total: 1
    } as never);

    const result = await listCourseSubmissionsService(ORG_ID, ACTOR_ID, params, { page: 1, limit: 20 });

    expect(result.items[0].isEarly).toBe(false);
  });

  it.each([
    ['2026-01-02', null],
    [null, true]
  ])('with due date %s and no submission time, reports isEarly as %s', async (exerciseDueBy, isEarly) => {
    vi.mocked(getCourseSubmissionsPage).mockResolvedValue({
      items: [{ ...pageRow('s-2', '2026-01-03', { createdAt: null }), exerciseDueBy }],
      total: 1
    } as never);

    const result = await listCourseSubmissionsService(ORG_ID, ACTOR_ID, params, { page: 1, limit: 20 });

    expect(result.items[0]).toMatchObject({ isEarly, submittedAt: null });
  });

  it('works out the overall status from the question types when none is stored', async () => {
    vi.mocked(getCourseSubmissionsPage).mockResolvedValue({
      items: [pageRow('s-2', '2026-01-03', { overallStatus: null })],
      total: 1
    } as never);
    vi.mocked(getQuestionsByExerciseIds).mockResolvedValue([{ exerciseId: 'exercise-1', questionTypeId: 3 }] as never);

    const result = await listCourseSubmissionsService(ORG_ID, ACTOR_ID, params, { page: 1, limit: 20 });

    expect(result.items[0].overallStatus).toBe('manual_required');
  });

  it('returns a null student when the member has no profile', async () => {
    vi.mocked(getCourseSubmissionsPage).mockResolvedValue({
      items: [{ ...pageRow('s-2', '2026-01-03'), student: { id: null, fullname: null, email: null, avatarUrl: null } }],
      total: 1
    } as never);

    const result = await listCourseSubmissionsService(ORG_ID, ACTOR_ID, params, { page: 1, limit: 20 });

    expect(result.items[0].student).toBeNull();
  });

  it('returns 404 for a member filter from another course', async () => {
    vi.mocked(getCourseMember).mockResolvedValue(null);

    await expect(
      listCourseSubmissionsService(ORG_ID, ACTOR_ID, params, { page: 1, limit: 20, memberId: 'member-9' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns 404 for an exercise filter from another course', async () => {
    vi.mocked(getExerciseById).mockResolvedValue({ id: 'exercise-9' } as never);
    vi.mocked(resolveExerciseCourseId).mockResolvedValue('course-2');

    await expect(
      listCourseSubmissionsService(ORG_ID, ACTOR_ID, params, { page: 1, limit: 20, exerciseId: 'exercise-9' })
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('getCourseSubmissionService', () => {
  it('returns the submission with its answers', async () => {
    vi.mocked(getSubmission).mockResolvedValue({
      ...(submissionRow() as object),
      answers: [{ questionId: 7, point: 2, answerData: { type: 'TEXTAREA', value: 'hi' } }]
    } as never);

    const result = await getCourseSubmissionService(ORG_ID, ACTOR_ID, submissionParams);

    expect(result).toMatchObject({
      id: SUBMISSION_ID,
      memberId: 'member-1',
      gradingState: 'awaiting_manual',
      answers: [{ questionId: 7, points: 2, answerData: { type: 'TEXTAREA', value: 'hi' } }]
    });
  });
});

describe('gradeCourseSubmissionService', () => {
  it("returns 404 for a question outside the submission's exercise", async () => {
    vi.mocked(getQuestionsByExerciseIds).mockResolvedValue([{ id: 7 }] as never);

    await expect(
      gradeCourseSubmissionService(ORG_ID, ACTOR_ID, submissionParams, {
        answers: [{ questionId: 8, points: 1 }],
        total: 1
      })
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(updateSubmissionGradesBatch).not.toHaveBeenCalled();
  });

  it('returns 400 for a question the student did not answer, without saving', async () => {
    vi.mocked(getQuestionsByExerciseIds).mockResolvedValue([{ id: 7 }, { id: 8 }] as never);
    vi.mocked(getQuestionAnswersBySubmissionId).mockResolvedValue([{ questionId: 7 }] as never);

    await expect(
      gradeCourseSubmissionService(ORG_ID, ACTOR_ID, submissionParams, {
        answers: [
          { questionId: 7, points: 1 },
          { questionId: 8, points: 1 }
        ],
        total: 2
      })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(updateSubmissionGradesBatch).not.toHaveBeenCalled();
  });

  it('grades through the dashboard service', async () => {
    vi.mocked(getQuestionsByExerciseIds).mockResolvedValue([{ id: 7 }] as never);
    vi.mocked(getQuestionAnswersBySubmissionId).mockResolvedValue([{ questionId: 7 }] as never);
    vi.mocked(updateSubmissionGradesBatch).mockResolvedValue(submissionRow({ gradingState: 'completed', total: 2 }));
    const payload = { answers: [{ questionId: 7, points: 2 }], total: 2, feedback: 'Good' };

    const result = await gradeCourseSubmissionService(ORG_ID, ACTOR_ID, submissionParams, payload);

    expect(getQuestionsByExerciseIds).toHaveBeenCalledWith(['exercise-1']);
    expect(getQuestionAnswersBySubmissionId).toHaveBeenCalledWith(SUBMISSION_ID);
    expect(getSubmission).not.toHaveBeenCalled();
    expect(updateSubmissionGradesBatch).toHaveBeenCalledWith(SUBMISSION_ID, COURSE_ID, payload, {
      actorProfileId: ACTOR_ID
    });
    expect(result).toMatchObject({ gradingState: 'completed', total: 2 });
  });
});

describe('updateCourseSubmissionService', () => {
  it('changes the grading state through the dashboard service', async () => {
    vi.mocked(updateSubmissionService).mockResolvedValue(submissionRow({ gradingState: 'completed' }));

    const result = await updateCourseSubmissionService(ORG_ID, ACTOR_ID, submissionParams, {
      gradingState: 'completed'
    });

    expect(updateSubmissionService).toHaveBeenCalledWith(
      SUBMISSION_ID,
      COURSE_ID,
      { gradingState: 'completed' },
      { actorProfileId: ACTOR_ID }
    );
    expect(result.gradingState).toBe('completed');
  });
});

describe('deleteCourseSubmissionService', () => {
  it('deletes through the dashboard service', async () => {
    vi.mocked(deleteSubmissionService).mockResolvedValue(submissionRow());

    const result = await deleteCourseSubmissionService(ORG_ID, ACTOR_ID, submissionParams);

    expect(deleteSubmissionService).toHaveBeenCalledWith(SUBMISSION_ID, COURSE_ID);
    expect(result.id).toBe(SUBMISSION_ID);
  });
});

describe('getCourseMarksService', () => {
  const gradebook = {
    exercises: [
      { id: 'exercise-1', title: 'Quiz', points: 5 },
      { id: 'exercise-2', title: 'Essay', points: 10 }
    ],
    students: [
      { id: 'member-2', profileId: 'p-2', email: null, profile: { fullname: 'Zed', email: 'zed@x.io' } },
      { id: 'member-1', profileId: 'p-1', email: null, profile: { fullname: 'Ada', email: 'ada@x.io' } }
    ],
    studentMarksByExerciseId: { 'member-1': { 'exercise-1': '4', 'exercise-2': '0' } },
    gradedPointsByExerciseId: { 'member-1': { 'exercise-1': 4 } }
  };

  it('returns one row per student with a mark per exercise, using the member rule', async () => {
    vi.mocked(isUserCourseMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(getGradebook).mockResolvedValue(gradebook as never);

    const result = await getCourseMarksService(ORG_ID, ACTOR_ID, params, { page: 1, limit: 20 });

    expect(getGradebook).toHaveBeenCalledWith(COURSE_ID, ACTOR_ID);
    expect(result.items.map((row) => row.fullname)).toEqual(['Ada', 'Zed']);
    expect(result.items[0].marks).toEqual([
      { exerciseId: 'exercise-1', exerciseTitle: 'Quiz', maxPoints: 5, points: 4 },
      { exerciseId: 'exercise-2', exerciseTitle: 'Essay', maxPoints: 10, points: null }
    ]);
    expect(isCourseTeamMemberOrOrgAdmin).not.toHaveBeenCalled();
  });

  it('reports null, not 0, for a submission that is not graded yet', async () => {
    vi.mocked(isUserCourseMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(getGradebook).mockResolvedValue(gradebook as never);

    const result = await getCourseMarksService(ORG_ID, ACTOR_ID, params, { page: 1, limit: 20 });

    expect(result.items[0].marks[1]).toMatchObject({ exerciseId: 'exercise-2', points: null });
  });

  it('reports a graded 0 as 0', async () => {
    vi.mocked(isUserCourseMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(getGradebook).mockResolvedValue({
      ...gradebook,
      gradedPointsByExerciseId: { 'member-1': { 'exercise-1': 0 } }
    } as never);

    const result = await getCourseMarksService(ORG_ID, ACTOR_ID, params, { page: 1, limit: 20 });

    expect(result.items[0].marks[0].points).toBe(0);
  });

  it('gives a student actor only the rows the gradebook scopes to them', async () => {
    vi.mocked(isUserCourseMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(getGradebook).mockResolvedValue({ ...gradebook, students: [gradebook.students[1]] } as never);

    const result = await getCourseMarksService(ORG_ID, ACTOR_ID, params, { page: 1, limit: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].memberId).toBe('member-1');
  });
});
