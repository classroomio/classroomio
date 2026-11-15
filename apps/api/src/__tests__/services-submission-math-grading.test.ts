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
  updateSubmissionGrades
} from '@cio/db/queries/submission';
import { getExerciseWithRelationsOptimized } from '@cio/db/queries/exercise';
import { getCourseById } from '@cio/db/queries/course';
import { createSubmissionService } from '@api/services/submission/submission';
import { readQuestionParameters } from '@cio/question-types';
import { instantiateVariant } from '@cio/question-types/variants';

const COURSE_ID = 'course-1';
const EXERCISE_ID = 'exercise-1';
const MEMBER_ID = 'member-1';

type TestQuestion = {
  id: number;
  typename: string;
  questionTypeId: number;
  points: number;
  settings?: Record<string, unknown>;
  parentQuestionId?: number;
};

const mockExercise = (...questions: TestQuestion[]) =>
  vi.mocked(getExerciseWithRelationsOptimized).mockResolvedValue({
    exercise: { allowMultipleAttempts: true },
    questions: questions.map(({ typename, ...question }) => ({
      ...question,
      title: `Question ${question.id}`,
      questionType: { typename },
      options: []
    }))
  } as never);

const mathQuestion = (id: number, extra: Partial<TestQuestion> = {}): TestQuestion => ({
  id,
  typename: 'MATH_EXPRESSION',
  questionTypeId: 17,
  points: 2,
  settings: {
    acceptedAnswers: ['2x+2'],
    wrongAnswerFeedback: [{ answer: '2x+1', feedback: 'Distribute the 2' }]
  },
  ...extra
});

const submit = (answers: Array<{ questionId: number; answer: string }>) =>
  createSubmissionService(COURSE_ID, EXERCISE_ID, MEMBER_ID, answers, { strict: true, allowUploads: false });

const mathAnswer = (questionId: number, latex: string) => ({
  questionId,
  answer: JSON.stringify({ type: 'MATH_EXPRESSION', latex })
});

const insertedRows = () => vi.mocked(insertQuestionAnswersBatch).mock.calls[0][0] as Array<Record<string, any>>;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getCourseById).mockResolvedValue([{ id: COURSE_ID }] as never);
  vi.mocked(hasSubmission).mockResolvedValue(false);
  vi.mocked(createSubmission).mockResolvedValue({ id: 'submission-1', submittedBy: MEMBER_ID } as never);
  vi.mocked(insertQuestionAnswersBatch).mockImplementation(async (rows) => rows as never);
  vi.mocked(updateSubmissionGrades).mockResolvedValue({ id: 'submission-1', gradingState: 'completed' } as never);
});

describe('createSubmissionService math grading', () => {
  it('grades an equivalent expression in full and stores the reason with the canonical MathJSON', async () => {
    mockExercise(mathQuestion(1));

    await submit([mathAnswer(1, '2(x+1)')]);

    expect(updateSubmissionGrades).toHaveBeenCalledWith(
      'submission-1',
      expect.objectContaining({ total: 2, answers: [{ questionId: 1, points: 2 }], gradingState: 'completed' })
    );
    const stored = insertedRows()[0].answerData;
    expect(stored.grading).toMatchObject({ reason: 'equivalent', matchedAnswer: '2x+2' });
    expect(stored.mathjson).toBeTruthy();
  });

  it('stores the teacher feedback of a known wrong answer and awards nothing', async () => {
    mockExercise(mathQuestion(1));

    await submit([mathAnswer(1, '2x+1')]);

    expect(updateSubmissionGrades).toHaveBeenCalledWith(
      'submission-1',
      expect.objectContaining({ total: 0, answers: [{ questionId: 1, points: 0 }] })
    );
    expect(insertedRows()[0].answerData.grading).toMatchObject({ reason: 'wrong', feedback: 'Distribute the 2' });
  });

  it('grades a LaTeX numeric answer with the math grader', async () => {
    mockExercise({ id: 3, typename: 'NUMERIC', questionTypeId: 6, points: 1, settings: { correctValue: 0.75 } });

    await submit([{ questionId: 3, answer: JSON.stringify({ type: 'NUMERIC', value: 0.75, latex: '\\frac{3}{4}' }) }]);

    expect(updateSubmissionGrades).toHaveBeenCalledWith('submission-1', expect.objectContaining({ total: 1 }));
  });

  it('auto-grades the answer part of a worked solution and leaves the submission awaiting manual grading', async () => {
    mockExercise({
      id: 5,
      typename: 'WORKED_SOLUTION',
      questionTypeId: 18,
      points: 5,
      settings: { acceptedAnswers: ['4'], answerPoints: 2 }
    });

    await submit([
      {
        questionId: 5,
        answer: JSON.stringify({
          type: 'WORKED_SOLUTION',
          latex: '\\frac{8}{2}',
          working: { lines: ['8/2'], files: [] }
        })
      }
    ]);

    expect(updateSubmissionGrades).not.toHaveBeenCalled();
    expect(createSubmission).toHaveBeenCalledWith(
      expect.objectContaining({ gradingState: 'awaiting_manual', overallStatus: 'manual_required', total: 2 }),
      TX
    );
    expect(insertedRows()[0]).toMatchObject({ questionId: 5, point: 2 });
  });

  it('scores the parts of a multi-part question as normal questions and rolls them up', async () => {
    mockExercise(
      { id: 10, typename: 'SHORT_ANSWER', questionTypeId: 5, points: 0 },
      mathQuestion(11, { parentQuestionId: 10 }),
      mathQuestion(12, { parentQuestionId: 10 })
    );

    const result = await submit([mathAnswer(11, '2x+2'), mathAnswer(12, '2x')]);

    expect(updateSubmissionGrades).toHaveBeenCalledWith(
      'submission-1',
      expect.objectContaining({
        total: 2,
        answers: [
          { questionId: 11, points: 2 },
          { questionId: 12, points: 0 }
        ]
      })
    );
    expect(insertedRows().map((row) => row.questionId)).toEqual([11, 12]);
    expect(result).toMatchObject({ partScores: [{ questionId: 10, partIds: [11, 12], points: 2, maxPoints: 4 }] });
  });

  it('rejects an answer to the stem of a multi-part question', async () => {
    mockExercise(
      { id: 10, typename: 'SHORT_ANSWER', questionTypeId: 5, points: 0 },
      mathQuestion(11, { parentQuestionId: 10 })
    );

    await expect(
      submit([{ questionId: 10, answer: JSON.stringify({ type: 'SHORT_ANSWER', text: 'x' }) }])
    ).rejects.toMatchObject({
      statusCode: 404
    });
  });
});

describe('createSubmissionService parameterised questions', () => {
  const parameterised = (id: number): TestQuestion => ({
    id,
    typename: 'MATH_EXPRESSION',
    questionTypeId: 17,
    points: 1,
    settings: {
      acceptedAnswers: ['{{answer}}'],
      parameters: {
        variables: [
          { name: 'a', type: 'int', min: 2, max: 9, step: 1 },
          { name: 'b', type: 'int', min: 10, max: 20, step: 1 }
        ],
        answerFormula: 'a * b'
      }
    }
  });
  const answerFor = (seed: string) => {
    const instance = instantiateVariant(readQuestionParameters(parameterised(1).settings)!, seed);

    return instance.answer!;
  };

  it('grades against the key re-derived from the seed and stores the seed with the answer', async () => {
    mockExercise(parameterised(1));

    await createSubmissionService(
      COURSE_ID,
      EXERCISE_ID,
      MEMBER_ID,
      [{ questionId: 1, answer: JSON.stringify({ type: 'MATH_EXPRESSION', latex: answerFor('seed-a') }), seed: 'seed-a' }],
      { strict: true, allowUploads: false }
    );

    expect(updateSubmissionGrades).toHaveBeenCalledWith('submission-1', expect.objectContaining({ total: 1 }));
    expect(insertedRows()[0].answerData.seed).toBe('seed-a');
  });

  it('marks the answer of a different seed wrong', async () => {
    const otherSeed = Array.from({ length: 30 }, (_, index) => 'other' + index).find(
      (candidate) => answerFor(candidate) !== answerFor('seed-a')
    )!;
    mockExercise(parameterised(1));

    await createSubmissionService(
      COURSE_ID,
      EXERCISE_ID,
      MEMBER_ID,
      [{ questionId: 1, answer: JSON.stringify({ type: 'MATH_EXPRESSION', latex: answerFor(otherSeed) }), seed: 'seed-a' }],
      { strict: true, allowUploads: false }
    );

    expect(updateSubmissionGrades).toHaveBeenCalledWith('submission-1', expect.objectContaining({ total: 0 }));
  });

  it('rejects a strict answer to a parameterised question that has no seed', async () => {
    mockExercise(parameterised(1));

    await expect(submit([mathAnswer(1, '12')])).rejects.toMatchObject({ statusCode: 400 });
  });
});
