import { beforeEach, describe, expect, it, vi } from 'vitest';

const TX = { tx: true };

vi.mock('@cio/db/drizzle', () => ({
  db: { transaction: vi.fn((run: (tx: unknown) => unknown) => run(TX)) }
}));
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
vi.mock('@cio/core/utils/s3', () => ({
  generateDocumentDownloadPresignedUrls: vi.fn(),
  generateVideoDownloadPresignedUrls: vi.fn()
}));
vi.mock('@api/services/course/compliance', () => ({ syncComplianceProgressFromSubmission: vi.fn() }));
vi.mock('@api/services/course/completion', () => ({ evaluateCourseCertification: vi.fn() }));

import {
  createSubmission,
  hasSubmission,
  insertQuestionAnswersBatch,
  lockSubmissionAttempt
} from '@cio/db/queries/submission';
import { getExerciseWithRelationsOptimized } from '@cio/db/queries/exercise';
import { getCourseById } from '@cio/db/queries/course';
import { createSubmissionService } from '@api/services/submission/submission';

const COURSE_ID = 'course-1';
const EXERCISE_ID = 'exercise-1';
const MEMBER_ID = 'member-1';
const strict = { strict: true, allowUploads: false };

type TestQuestion = { id: number; questionTypeId: number; settings?: Record<string, unknown>; optionIds?: number[] };

const mockExercise = (allowMultipleAttempts: boolean, ...questions: TestQuestion[]) =>
  vi.mocked(getExerciseWithRelationsOptimized).mockResolvedValue({
    exercise: { allowMultipleAttempts },
    questions: questions.map(({ optionIds = [], ...question }) => ({
      ...question,
      title: `Question ${question.id}`,
      points: 1,
      questionType: { typename: 'TEXTAREA' },
      options: optionIds.map((id) => ({ id, label: String(id), isCorrect: id % 10 === 0 }))
    }))
  } as never);

const submitAnswers = (
  answers: Array<{ questionId: number; optionId?: number; answer?: string }>,
  options: Parameters<typeof createSubmissionService>[4] = strict
) => createSubmissionService(COURSE_ID, EXERCISE_ID, MEMBER_ID, answers, options);

const expectNothingSaved = () => {
  expect(createSubmission).not.toHaveBeenCalled();
  expect(insertQuestionAnswersBatch).not.toHaveBeenCalled();
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCourseById).mockResolvedValue([{ id: COURSE_ID }] as never);
  vi.mocked(hasSubmission).mockResolvedValue(false);
  vi.mocked(createSubmission).mockResolvedValue({ id: 'submission-1', submittedBy: MEMBER_ID } as never);
  vi.mocked(insertQuestionAnswersBatch).mockResolvedValue([]);
  mockExercise(false, { id: 7, questionTypeId: 1, optionIds: [70, 71] });
});

describe('createSubmissionService one-attempt exercises', () => {
  it('checks and creates under the per-student lock in one transaction', async () => {
    await submitAnswers([{ questionId: 7, optionId: 70 }]);

    expect(lockSubmissionAttempt).toHaveBeenCalledWith(EXERCISE_ID, MEMBER_ID, TX);
    expect(hasSubmission).toHaveBeenCalledWith(EXERCISE_ID, MEMBER_ID, TX);
    expect(createSubmission).toHaveBeenCalledWith(expect.objectContaining({ exerciseId: EXERCISE_ID }), TX);
    expect(insertQuestionAnswersBatch).toHaveBeenCalledWith(
      [expect.objectContaining({ submissionId: 'submission-1', questionId: 7 })],
      TX
    );
  });

  it('returns 409 for a second attempt and saves nothing', async () => {
    vi.mocked(hasSubmission).mockResolvedValue(true);

    await expect(submitAnswers([{ questionId: 7, optionId: 70 }])).rejects.toMatchObject({ statusCode: 409 });
    expectNothingSaved();
  });

  it('skips the lock and the check when the exercise allows multiple attempts', async () => {
    mockExercise(true, { id: 7, questionTypeId: 1, optionIds: [70] });
    vi.mocked(hasSubmission).mockResolvedValue(true);

    await expect(submitAnswers([{ questionId: 7, optionId: 70 }])).resolves.toMatchObject({ id: 'submission-1' });
    expect(lockSubmissionAttempt).not.toHaveBeenCalled();
  });
});

describe('createSubmissionService answer checks', () => {
  it('saves nothing when a paragraph breaks its limit, even in lenient mode', async () => {
    mockExercise(false, { id: 7, questionTypeId: 3, settings: { maxCharacters: 5 } });

    await expect(submitAnswers([{ questionId: 7, answer: 'too long' }], {})).rejects.toMatchObject({
      statusCode: 400
    });
    expectNothingSaved();
  });

  it('skips an answer to an unknown question in lenient mode', async () => {
    await expect(submitAnswers([{ questionId: 99, answer: 'x' }], {})).resolves.toMatchObject({ id: 'submission-1' });
  });

  it('returns 404 for a question outside the exercise in strict mode', async () => {
    await expect(submitAnswers([{ questionId: 99, optionId: 70 }])).rejects.toMatchObject({ statusCode: 404 });
    expectNothingSaved();
  });

  it.each([
    ['file upload', 8],
    ['video recording', 13]
  ])('returns 400 for a %s answer when uploads are not allowed', async (_name, questionTypeId) => {
    mockExercise(false, { id: 7, questionTypeId });

    await expect(submitAnswers([{ questionId: 7, answer: '{}' }])).rejects.toMatchObject({ statusCode: 400 });
    expectNothingSaved();
  });

  it.each([
    ['a single choice option from another question', { id: 7, questionTypeId: 1, optionIds: [70] }, { optionId: 99 }],
    ['a single choice answer with no option', { id: 7, questionTypeId: 1, optionIds: [70] }, { answer: 'A' }],
    ['a multiple choice answer that is not JSON', { id: 7, questionTypeId: 2, optionIds: [70] }, { answer: '70,71' }],
    [
      'a multiple choice option from another question',
      { id: 7, questionTypeId: 2, optionIds: [70] },
      { answer: '{"type":"CHECKBOX","optionIds":[70,99]}' }
    ],
    ['a true/false answer that is neither', { id: 7, questionTypeId: 4 }, { answer: 'maybe' }],
    ['a numeric answer with no value', { id: 7, questionTypeId: 6 }, { answer: '{"type":"NUMERIC"}' }],
    ['a fill in the blank answer with no answers', { id: 7, questionTypeId: 7 }, { answer: '{}' }],
    ['a paragraph over the limit', { id: 7, questionTypeId: 3, settings: { maxCharacters: 5 } }, { answer: 'too long' }]
  ])('returns 400 for %s in strict mode, before anything is saved', async (_name, question, answer) => {
    mockExercise(false, question);

    await expect(submitAnswers([{ questionId: 7, ...answer }])).rejects.toMatchObject({ statusCode: 400 });
    expect(hasSubmission).not.toHaveBeenCalled();
    expectNothingSaved();
  });

  it('accepts each answer format the dashboard sends in strict mode', async () => {
    mockExercise(
      false,
      { id: 1, questionTypeId: 1, optionIds: [10] },
      { id: 2, questionTypeId: 2, optionIds: [20, 21] },
      { id: 3, questionTypeId: 3 },
      { id: 4, questionTypeId: 4 },
      { id: 6, questionTypeId: 6 }
    );

    await expect(
      submitAnswers([
        { questionId: 1, optionId: 10 },
        { questionId: 2, answer: '{"type":"CHECKBOX","optionIds":[20,21]}' },
        { questionId: 3, answer: 'Some text' },
        { questionId: 4, answer: 'true' },
        { questionId: 6, answer: '{"type":"NUMERIC","value":2}' }
      ])
    ).resolves.toMatchObject({ id: 'submission-1' });
    expect(insertQuestionAnswersBatch).toHaveBeenCalledWith(expect.arrayContaining([expect.anything()]), TX);
  });
});
