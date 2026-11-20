import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/math/notation', async () => {
  const { DEFAULT_MATH_NOTATION } = await import('@cio/question-types');

  return { getEffectiveMathNotation: vi.fn().mockResolvedValue(DEFAULT_MATH_NOTATION) };
});

vi.mock('@cio/db/queries/submission', () => ({
  getSubmissionsByCourseIdWithDetails: vi.fn(),
  updateQuestionAnswer: vi.fn(),
  updateSubmission: vi.fn(),
  getExerciseResultsPage: vi.fn(),
  getCohortsForCourse: vi.fn(),
  getLatestAnswersForQuestion: vi.fn()
}));
vi.mock('@cio/db/queries/exercise', () => ({ getExerciseWithRelationsOptimized: vi.fn(), updateQuestion: vi.fn() }));
vi.mock('@api/services/v1/courses/exercises', () => ({ assertExerciseBelongsToCourse: vi.fn() }));

import { getExerciseWithRelationsOptimized, updateQuestion } from '@cio/db/queries/exercise';
import {
  getCohortsForCourse,
  getExerciseResultsPage,
  getLatestAnswersForQuestion,
  getSubmissionsByCourseIdWithDetails,
  updateQuestionAnswer,
  updateSubmission
} from '@cio/db/queries/submission';
import { getAnswerClusterKey } from '@cio/question-types/answer-clusters';
import {
  classifyCell,
  getAnswerClusters,
  getExerciseResultsGrid,
  resetClusterOverride,
  setClusterOverride
} from '@api/services/submission/results';

const mathQuestion = (settings: Record<string, unknown> = {}) => ({
  id: 1,
  title: 'Solve',
  questionTypeId: 17,
  points: 2,
  settings: { acceptedAnswers: ['x=-3'], ...settings },
  options: [],
  questionType: { typename: 'MATH_EXPRESSION' }
});
const shortAnswer = {
  id: 2,
  title: 'Explain',
  questionTypeId: 5,
  points: 3,
  settings: {},
  options: [],
  questionType: { typename: 'SHORT_ANSWER' }
};
const math = (latex: string) => ({ type: 'MATH_EXPRESSION', latex });
const keyOf = (latex: string) =>
  getAnswerClusterKey(
    { id: 1, title: '', questionType: 'MATH_EXPRESSION', points: 2, options: [], settings: {} } as never,
    math(latex) as never
  );

let storedQuestions: unknown[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(updateQuestion).mockImplementation((async (questionId: number, data: { settings?: unknown }) => {
    storedQuestions = storedQuestions.map((question) =>
      (question as { id: number }).id === questionId ? { ...(question as object), settings: data.settings } : question
    );
  }) as never);
  vi.mocked(getExerciseWithRelationsOptimized).mockImplementation((async () => ({
    exercise: {},
    questions: storedQuestions
  })) as never);
});

describe('classifyCell', () => {
  const question = { id: 1, questionTypeId: 17, points: 2, settings: {}, options: [] };

  it('colours by points, blank and awaiting grading', () => {
    expect(classifyCell(question, null, 0, 'completed')).toBe('blank');
    expect(classifyCell(question, math('x') as never, 2, 'completed')).toBe('full');
    expect(classifyCell(question, math('x') as never, 0.67, 'completed')).toBe('partial');
    expect(classifyCell(question, math('x') as never, 0, 'completed')).toBe('wrong');
    expect(
      classifyCell({ ...question, questionTypeId: 5 }, { type: 'SHORT_ANSWER', text: 'a' }, 0, 'awaiting_manual')
    ).toBe('awaiting');
    expect(classifyCell({ ...question, questionTypeId: 5 }, { type: 'SHORT_ANSWER', text: 'a' }, 1, 'completed')).toBe(
      'partial'
    );
  });
});

describe('getExerciseResultsGrid', () => {
  it('builds one cell per question for each student', async () => {
    storedQuestions = [mathQuestion(), shortAnswer];
    vi.mocked(getCohortsForCourse).mockResolvedValue([]);
    vi.mocked(getExerciseResultsPage).mockResolvedValue({
      students: [{ submissionId: 's1', total: '2.5', gradingState: 'awaiting_manual', fullname: 'Ada' }],
      answers: [
        { submissionId: 's1', questionId: 1, answerData: math('x=-3'), point: 2 },
        { submissionId: 's1', questionId: 2, answerData: { type: 'SHORT_ANSWER', text: 'because' }, point: 0.5 }
      ],
      total: 1
    } as never);

    const grid = await getExerciseResultsGrid('c', 'e', { page: 1, limit: 25, filter: 'all' });

    expect(grid.totalPoints).toBe(5);
    expect(grid.students[0].total).toBe(2.5);
    expect(grid.students[0].cells.map((cell) => cell.state)).toEqual(['full', 'awaiting']);
  });
});

describe('answer clusters', () => {
  const rows = [
    { submissionId: 'a', studentId: 'a', studentName: 'A', answerData: math('x=-3'), point: 2 },
    { submissionId: 'b', studentId: 'b', studentName: 'B', answerData: math('x = -3.0'), point: 2 },
    { submissionId: 'c', studentId: 'c', studentName: 'C', answerData: math('x=3'), point: 0 },
    { submissionId: 'd', studentId: 'd', studentName: 'D', answerData: null, point: 0 }
  ];

  beforeEach(() => {
    storedQuestions = [mathQuestion(), shortAnswer];
    vi.mocked(getLatestAnswersForQuestion).mockResolvedValue(rows as never);
    vi.mocked(getSubmissionsByCourseIdWithDetails).mockResolvedValue([]);
  });

  it('groups equivalent answers and counts blanks separately', async () => {
    const result = await getAnswerClusters('c', 'e', 1);

    expect(result.clusters.map((cluster) => cluster.count)).toEqual([2, 1]);
    expect(result).toMatchObject({ answered: 3, blank: 1, canScore: true, points: 2 });
  });

  it('stores a rule, regrades the question and reports the result', async () => {
    const wrongKey = keyOf('x=3')!;
    vi.mocked(getSubmissionsByCourseIdWithDetails).mockResolvedValue([
      { id: 's-c', answers: [{ questionId: 1, point: 0, answerData: math('x=3') }] }
    ] as never);

    const result = await setClusterOverride({
      courseId: 'c',
      exerciseId: 'e',
      questionId: 1,
      actorProfileId: 'teacher',
      body: { key: wrongKey, verdict: 'partial', points: 1.25 }
    });

    const [, update] = vi.mocked(updateQuestion).mock.calls[0];
    expect((update.settings as { clusterOverrides: unknown[] }).clusterOverrides).toEqual([
      expect.objectContaining({ key: wrongKey, verdict: 'partial', points: 1.25, setBy: 'teacher', label: '$x=3$' })
    ]);
    expect(updateQuestionAnswer).toHaveBeenCalledWith(
      's-c',
      1,
      expect.objectContaining({
        point: 1.25,
        answerData: expect.objectContaining({ clusterOverride: expect.objectContaining({ verdict: 'partial' }) })
      })
    );
    expect(updateSubmission).toHaveBeenCalledWith('s-c', { total: 1.25 });
    expect(result.regrade.answersChanged).toBe(1);
  });

  it('rejects an unknown cluster, partial points above the maximum and a verdict on a manual question', async () => {
    const base = { courseId: 'c', exerciseId: 'e', actorProfileId: 't' };

    await expect(
      setClusterOverride({ ...base, questionId: 1, body: { key: 'nope', verdict: 'correct' } })
    ).rejects.toThrow('no longer exists');
    await expect(
      setClusterOverride({ ...base, questionId: 1, body: { key: keyOf('x=3')!, verdict: 'partial', points: 5 } })
    ).rejects.toThrow('exceed');
    vi.mocked(getLatestAnswersForQuestion).mockResolvedValue([
      {
        submissionId: 'a',
        studentId: 'a',
        studentName: 'A',
        answerData: { type: 'SHORT_ANSWER', text: 'hi' },
        point: 0
      }
    ] as never);
    await expect(
      setClusterOverride({ ...base, questionId: 2, body: { key: 'text:hi', verdict: 'correct' } })
    ).rejects.toThrow('cannot be scored');
    expect(updateQuestion).not.toHaveBeenCalled();
  });

  it('removes the rule and regrades back to the answer key on reset', async () => {
    const key = keyOf('x=3')!;
    const rule = { key, label: '$x=3$', verdict: 'correct', setBy: 't', setAt: 'now' };
    storedQuestions = [mathQuestion({ clusterOverrides: [rule] }), shortAnswer];
    vi.mocked(getSubmissionsByCourseIdWithDetails).mockResolvedValue([
      {
        id: 's-c',
        answers: [{ questionId: 1, point: 2, answerData: { ...math('x=3'), clusterOverride: { ...rule } } }]
      }
    ] as never);

    await resetClusterOverride({ courseId: 'c', exerciseId: 'e', questionId: 1, key });

    expect(vi.mocked(updateQuestion).mock.calls[0][1].settings).toEqual({ acceptedAnswers: ['x=-3'] });
    expect(updateQuestionAnswer).toHaveBeenCalledWith(
      's-c',
      1,
      expect.objectContaining({
        point: 0,
        answerData: expect.not.objectContaining({ clusterOverride: expect.anything() })
      })
    );
  });
});
