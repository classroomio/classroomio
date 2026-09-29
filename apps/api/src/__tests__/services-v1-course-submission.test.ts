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
vi.mock('@cio/db/queries/submission', () => ({ getSubmissionById: vi.fn() }));
vi.mock('@api/services/submission', () => ({
  deleteSubmissionService: vi.fn(),
  getSubmission: vi.fn(),
  listSubmissionsForGrading: vi.fn(),
  resolveSubmissionGradingState: (submission: { gradingState?: string }) => submission.gradingState ?? 'queued',
  updateSubmissionGradesBatch: vi.fn(),
  updateSubmissionService: vi.fn()
}));
vi.mock('@api/services/mark/gradebook', () => ({ getGradebook: vi.fn() }));

import { getCourseOrganizationId } from '@cio/db/queries/tag';
import { isCourseTeamMemberOrOrgAdmin, isUserCourseMemberOrOrgAdmin } from '@cio/db/queries/group';
import { getCourseMember } from '@cio/db/queries/course/people';
import { getExerciseById, getQuestionsByExerciseIds } from '@cio/db/queries/exercise';
import { resolveExerciseCourseId } from '@cio/core/services/exercise/exercise';
import { getSubmissionById } from '@cio/db/queries/submission';
import {
  deleteSubmissionService,
  getSubmission,
  listSubmissionsForGrading,
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

const boardItem = (id: string, createdAt: string, overrides: Record<string, unknown> = {}) => ({
  id,
  createdAt,
  memberId: 'member-1',
  total: 3,
  gradingState: 'awaiting_manual',
  overallStatus: 'manual_required',
  feedback: null,
  isEarly: true,
  exercise: { id: 'exercise-1', title: 'Quiz' },
  student: { id: 'profile-1', fullname: 'Ada', email: 'ada@x.io', avatarUrl: null },
  ...overrides
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
    vi.mocked(listSubmissionsForGrading).mockResolvedValue({
      sections: [
        { id: 1, title: 'Submitted', value: 1, items: [boardItem('s-1', '2026-01-01', { gradingState: 'queued' })] },
        { id: 2, title: 'In Progress', value: 1, items: [boardItem('s-2', '2026-01-03')] },
        { id: 3, title: 'Graded', value: 1, items: [boardItem('s-3', '2026-01-02', { memberId: 'member-2' })] }
      ],
      submissionIdData: {}
    } as never);
  });

  it('flattens the grading board newest first', async () => {
    const result = await listCourseSubmissionsService(ORG_ID, ACTOR_ID, params, { page: 1, limit: 20 });

    expect(result.items.map((item) => item.id)).toEqual(['s-2', 's-3', 's-1']);
    expect(result.items[0]).toMatchObject({
      exerciseId: 'exercise-1',
      exerciseTitle: 'Quiz',
      memberId: 'member-1',
      student: { profileId: 'profile-1', fullname: 'Ada' },
      submittedAt: '2026-01-03'
    });
    expect(result.pagination.total).toBe(3);
  });

  it('filters by grading state and member', async () => {
    vi.mocked(getCourseMember).mockResolvedValue({ id: 'member-1' } as never);

    const result = await listCourseSubmissionsService(ORG_ID, ACTOR_ID, params, {
      page: 1,
      limit: 20,
      memberId: 'member-1',
      gradingState: 'awaiting_manual'
    });

    expect(result.items.map((item) => item.id)).toEqual(['s-2']);
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

  it('grades through the dashboard service', async () => {
    vi.mocked(getQuestionsByExerciseIds).mockResolvedValue([{ id: 7 }] as never);
    vi.mocked(updateSubmissionGradesBatch).mockResolvedValue(submissionRow({ gradingState: 'completed', total: 2 }));
    const payload = { answers: [{ questionId: 7, points: 2 }], total: 2, feedback: 'Good' };

    const result = await gradeCourseSubmissionService(ORG_ID, ACTOR_ID, submissionParams, payload);

    expect(getQuestionsByExerciseIds).toHaveBeenCalledWith(['exercise-1']);
    expect(updateSubmissionGradesBatch).toHaveBeenCalledWith(SUBMISSION_ID, payload);
    expect(result).toMatchObject({ gradingState: 'completed', total: 2 });
  });
});

describe('updateCourseSubmissionService', () => {
  it('changes the grading state through the dashboard service', async () => {
    vi.mocked(updateSubmissionService).mockResolvedValue(submissionRow({ gradingState: 'completed' }));

    const result = await updateCourseSubmissionService(ORG_ID, ACTOR_ID, submissionParams, {
      gradingState: 'completed'
    });

    expect(updateSubmissionService).toHaveBeenCalledWith(SUBMISSION_ID, { gradingState: 'completed' });
    expect(result.gradingState).toBe('completed');
  });
});

describe('deleteCourseSubmissionService', () => {
  it('deletes through the dashboard service', async () => {
    vi.mocked(deleteSubmissionService).mockResolvedValue(submissionRow());

    const result = await deleteCourseSubmissionService(ORG_ID, ACTOR_ID, submissionParams);

    expect(deleteSubmissionService).toHaveBeenCalledWith(SUBMISSION_ID);
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
    studentMarksByExerciseId: { 'member-1': { 'exercise-1': '4' } }
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

  it('gives a student actor only the rows the gradebook scopes to them', async () => {
    vi.mocked(isUserCourseMemberOrOrgAdmin).mockResolvedValue(true);
    vi.mocked(getGradebook).mockResolvedValue({ ...gradebook, students: [gradebook.students[1]] } as never);

    const result = await getCourseMarksService(ORG_ID, ACTOR_ID, params, { page: 1, limit: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].memberId).toBe('member-1');
  });
});
