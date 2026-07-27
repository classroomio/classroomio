import { describe, expect, it } from 'vitest';

import type { Question } from '$features/course/types';
import { mapZodErrorsToQuestionErrors } from './store';

function makeQuestion(overrides: Partial<Question>): Question {
  return {
    id: overrides.id ?? 'question-1',
    title: overrides.title ?? 'Question',
    points: overrides.points ?? 1,
    questionTypeId: overrides.questionTypeId ?? 1,
    questionType: overrides.questionType,
    options: overrides.options ?? [],
    ...overrides
  } as Question;
}

describe('mapZodErrorsToQuestionErrors', () => {
  it('maps Zod question errors to the correct active question when deleted questions are present', () => {
    const questions = [
      makeQuestion({ id: 'question-1', title: 'Saved question 1' }),
      makeQuestion({ id: 'question-2', title: 'Deleted question', deletedAt: '2026-01-01T00:00:00.000Z' }),
      makeQuestion({ id: 'question-3', title: '' }),
      makeQuestion({ id: 'question-4', title: 'Saved question 4' })
    ];

    const zodErrors = {
      'questions.1.question': 'Question text is required',
      'questions.1.options.0.label': 'Option label is required'
    };

    const result = mapZodErrorsToQuestionErrors(zodErrors, questions);

    expect(result).toEqual({
      'question-3': {
        title: 'Question text is required',
        option: 'Option label is required'
      }
    });
  });
});
