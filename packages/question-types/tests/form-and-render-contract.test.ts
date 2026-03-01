import { describe, expect, it } from 'vitest';
import {
  QUESTION_TYPE_KEY,
  createExerciseQuestionFormState,
  getExerciseQuestionContractKey,
  getExerciseQuestionLabel,
  getQuestionStateKey,
  type ExerciseQuestionModel
} from '../src';

function buildQuestion(overrides: Partial<ExerciseQuestionModel> = {}): ExerciseQuestionModel {
  return {
    id: 1,
    key: 'question-1',
    title: 'Question title',
    questionType: QUESTION_TYPE_KEY.RADIO,
    ...overrides
  };
}

describe('form state helpers', () => {
  it('creates default state with copied questions and empty answers', () => {
    const initialQuestions = [buildQuestion()];
    const state = createExerciseQuestionFormState(initialQuestions);

    expect(state).toEqual({
      questions: initialQuestions,
      currentIndex: 0,
      answers: {}
    });
    expect(state.questions).not.toBe(initialQuestions);
  });

  it('creates an empty state when no initial questions are provided', () => {
    expect(createExerciseQuestionFormState()).toEqual({
      questions: [],
      currentIndex: 0,
      answers: {}
    });
  });

  it('resolves question state key with key -> id -> fallback precedence', () => {
    expect(getQuestionStateKey(buildQuestion({ key: 'custom-key', id: 99 }), 7)).toBe('custom-key');
    expect(getQuestionStateKey(buildQuestion({ key: undefined, id: 99 }), 7)).toBe('99');
    expect(getQuestionStateKey(buildQuestion({ key: undefined, id: undefined }), 7)).toBe('7');
  });
});

describe('render contract helpers', () => {
  it('resolves render contract key with key -> id -> fallback precedence', () => {
    expect(getExerciseQuestionContractKey(buildQuestion({ key: 'contract-key', id: 88 }), 3)).toBe('contract-key');
    expect(getExerciseQuestionContractKey(buildQuestion({ key: undefined, id: 88 }), 3)).toBe('88');
    expect(getExerciseQuestionContractKey(buildQuestion({ key: undefined, id: undefined }), 3)).toBe('3');
  });

  it('returns a label value when available and fallback when missing', () => {
    const labels = {
      'common.add_option': 'Add option'
    };

    expect(getExerciseQuestionLabel(labels, 'common.add_option', 'Fallback')).toBe('Add option');
    expect(getExerciseQuestionLabel(labels, 'common.remove', 'Fallback')).toBe('Fallback');
    expect(getExerciseQuestionLabel(undefined, 'common.remove', 'Fallback')).toBe('Fallback');
    expect(getExerciseQuestionLabel(undefined, 'common.remove')).toBe('');
  });
});
