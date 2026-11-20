import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@api/services/math/notation', async () => {
  const { DEFAULT_MATH_NOTATION } = await import('@cio/question-types');

  return { getEffectiveMathNotation: vi.fn().mockResolvedValue(DEFAULT_MATH_NOTATION) };
});

vi.mock('@cio/db/queries/submission', () => ({
  getSubmissionsByCourseIdWithDetails: vi.fn(),
  updateQuestionAnswer: vi.fn(),
  updateSubmission: vi.fn()
}));
vi.mock('@cio/db/queries/exercise', () => ({ getExerciseWithRelationsOptimized: vi.fn() }));

import { getExerciseWithRelationsOptimized } from '@cio/db/queries/exercise';
import {
  getSubmissionsByCourseIdWithDetails,
  updateQuestionAnswer,
  updateSubmission
} from '@cio/db/queries/submission';
import { regradeExerciseSubmissions } from '@api/services/submission/regrade';

const mathQuestion = (acceptedAnswers: string[]) => ({
  id: 1,
  title: 'Expand',
  questionTypeId: 17,
  points: 2,
  settings: { acceptedAnswers },
  options: [],
  questionType: { typename: 'MATH_EXPRESSION' }
});

const workedQuestion = {
  id: 2,
  title: 'Solve',
  questionTypeId: 18,
  points: 5,
  settings: { acceptedAnswers: ['4'], answerPoints: 2 },
  options: [],
  questionType: { typename: 'WORKED_SOLUTION' }
};

const mockStored = (questions: unknown[], answers: unknown[]) => {
  vi.mocked(getExerciseWithRelationsOptimized).mockResolvedValue({ exercise: {}, questions } as never);
  vi.mocked(getSubmissionsByCourseIdWithDetails).mockResolvedValue([{ id: 'submission-1', answers }] as never);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('regradeExerciseSubmissions', () => {
  it('awards points to answers the corrected key now accepts and updates the total', async () => {
    mockStored(
      [mathQuestion(['2x+2', '2(x+1)'])],
      [
        {
          questionId: 1,
          point: 0,
          answerData: { type: 'MATH_EXPRESSION', latex: '2(x+1)', grading: { reason: 'wrong' } }
        }
      ]
    );

    const result = await regradeExerciseSubmissions('course-1', 'exercise-1');

    expect(updateQuestionAnswer).toHaveBeenCalledWith(
      'submission-1',
      1,
      expect.objectContaining({
        point: 2,
        answerData: expect.objectContaining({ grading: expect.objectContaining({ reason: 'equivalent' }) })
      })
    );
    expect(updateSubmission).toHaveBeenCalledWith('submission-1', { total: 2 });
    expect(result).toEqual({ submissionsChecked: 1, submissionsChanged: 1, answersChanged: 1 });
  });

  it('keeps the working points a teacher awarded on a worked solution', async () => {
    mockStored(
      [workedQuestion],
      [
        {
          questionId: 2,
          point: 3,
          answerData: {
            type: 'WORKED_SOLUTION',
            latex: '4',
            working: { lines: [], files: [] },
            grading: { reason: 'wrong' }
          }
        }
      ]
    );

    await regradeExerciseSubmissions('course-1', 'exercise-1');

    expect(updateQuestionAnswer).toHaveBeenCalledWith('submission-1', 2, expect.objectContaining({ point: 5 }));
    expect(updateSubmission).toHaveBeenCalledWith('submission-1', { total: 5 });
  });

  it('writes nothing when the grades already match', async () => {
    mockStored(
      [mathQuestion(['2x+2'])],
      [{ questionId: 1, point: 2, answerData: { type: 'MATH_EXPRESSION', latex: '2x+2' } }]
    );
    vi.mocked(updateQuestionAnswer).mockClear();

    const first = await regradeExerciseSubmissions('course-1', 'exercise-1');
    const stored = vi.mocked(updateQuestionAnswer).mock.calls[0]?.[2]?.answerData;
    mockStored([mathQuestion(['2x+2'])], [{ questionId: 1, point: 2, answerData: stored }]);
    vi.mocked(updateQuestionAnswer).mockClear();

    const second = await regradeExerciseSubmissions('course-1', 'exercise-1');

    expect(first.answersChanged).toBe(1);
    expect(second).toEqual({ submissionsChecked: 1, submissionsChanged: 0, answersChanged: 0 });
    expect(updateQuestionAnswer).not.toHaveBeenCalled();
  });
});
