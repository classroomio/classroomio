import { describe, expect, it } from 'vitest';
import {
  buildUpdatedQuestions,
  type CurrentQuestionForPatch,
  type QuestionPatch
} from '@api/services/agent/question-update';
import { QUESTION_TYPE } from '@cio/utils/validation/constants';

const EXERCISE_ID = 'ex-1';

function makeQuestion(overrides: Partial<CurrentQuestionForPatch>): CurrentQuestionForPatch {
  return {
    id: 1,
    title: 'Existing question',
    questionTypeId: QUESTION_TYPE.RADIO,
    points: 1,
    order: 0,
    settings: {},
    options: [],
    ...overrides
  };
}

describe('buildUpdatedQuestions', () => {
  describe('option-based question types (correct answer on options[].isCorrect)', () => {
    it('RADIO: flips the correct option without losing siblings', () => {
      const current = makeQuestion({
        questionTypeId: QUESTION_TYPE.RADIO,
        options: [
          { id: 10, label: 'A', isCorrect: true },
          { id: 11, label: 'B', isCorrect: false },
          { id: 12, label: 'C', isCorrect: false }
        ]
      });
      const patch: QuestionPatch = {
        id: 1,
        options: [
          { id: 10, isCorrect: false },
          { id: 11, isCorrect: true },
          { id: 12, isCorrect: false }
        ]
      };

      const [result] = buildUpdatedQuestions([current], [patch], EXERCISE_ID);

      expect(result.options).toEqual([
        { id: 10, label: 'A', isCorrect: false, settings: undefined },
        { id: 11, label: 'B', isCorrect: true, settings: undefined },
        { id: 12, label: 'C', isCorrect: false, settings: undefined }
      ]);
    });

    it('CHECKBOX: can mark multiple options correct in a single patch', () => {
      const current = makeQuestion({
        questionTypeId: QUESTION_TYPE.CHECKBOX,
        options: [
          { id: 20, label: 'X', isCorrect: false },
          { id: 21, label: 'Y', isCorrect: false },
          { id: 22, label: 'Z', isCorrect: false }
        ]
      });
      const patch: QuestionPatch = {
        id: 1,
        options: [
          { id: 20, isCorrect: true },
          { id: 21, isCorrect: true },
          { id: 22, isCorrect: false }
        ]
      };

      const [result] = buildUpdatedQuestions([current], [patch], EXERCISE_ID);

      expect(result.options.filter((o) => o.isCorrect).map((o) => o.id)).toEqual([20, 21]);
    });

    it('TRUE_FALSE: switches the correct side', () => {
      const current = makeQuestion({
        questionTypeId: QUESTION_TYPE.TRUE_FALSE,
        options: [
          { id: 30, label: 'True', isCorrect: true },
          { id: 31, label: 'False', isCorrect: false }
        ]
      });
      const patch: QuestionPatch = {
        id: 1,
        options: [
          { id: 30, isCorrect: false },
          { id: 31, isCorrect: true }
        ]
      };

      const [result] = buildUpdatedQuestions([current], [patch], EXERCISE_ID);

      const correct = result.options.find((o) => o.isCorrect);
      expect(correct?.label).toBe('False');
    });

    it('appends a new option when id is omitted (RADIO)', () => {
      const current = makeQuestion({
        questionTypeId: QUESTION_TYPE.RADIO,
        options: [
          { id: 40, label: 'A', isCorrect: true },
          { id: 41, label: 'B', isCorrect: false }
        ]
      });
      const patch: QuestionPatch = {
        id: 1,
        options: [
          { id: 40, isCorrect: true },
          { id: 41, isCorrect: false },
          { label: 'C', isCorrect: false }
        ]
      };

      const [result] = buildUpdatedQuestions([current], [patch], EXERCISE_ID);

      expect(result.options).toHaveLength(3);
      expect(result.options[2]).toEqual({ label: 'C', isCorrect: false, settings: undefined });
      expect(result.options[2].id).toBeUndefined();
    });
  });

  describe('settings-based question types (correct answer on question.settings)', () => {
    it('NUMERIC: writes settings.correctValue and preserves existing tolerance', () => {
      const current = makeQuestion({
        questionTypeId: QUESTION_TYPE.NUMERIC,
        settings: { tolerance: 0.1, hint: 'a ray' }
      });
      const patch: QuestionPatch = {
        id: 1,
        settings: { correctValue: 1 }
      };

      const [result] = buildUpdatedQuestions([current], [patch], EXERCISE_ID);

      expect(result.settings).toEqual({ tolerance: 0.1, hint: 'a ray', correctValue: 1 });
      expect(result.options).toEqual([]);
    });

    it('NUMERIC: patching tolerance does not clobber correctValue', () => {
      const current = makeQuestion({
        questionTypeId: QUESTION_TYPE.NUMERIC,
        settings: { correctValue: 42, tolerance: 0 }
      });
      const patch: QuestionPatch = {
        id: 1,
        settings: { tolerance: 0.5 }
      };

      const [result] = buildUpdatedQuestions([current], [patch], EXERCISE_ID);

      expect(result.settings).toEqual({ correctValue: 42, tolerance: 0.5 });
    });

    it('STAR: writes settings.correctValue', () => {
      const current = makeQuestion({
        questionTypeId: QUESTION_TYPE.STAR,
        settings: { maxStars: 5 }
      });
      const patch: QuestionPatch = {
        id: 1,
        settings: { correctValue: 4 }
      };

      const [result] = buildUpdatedQuestions([current], [patch], EXERCISE_ID);

      expect(result.settings).toEqual({ maxStars: 5, correctValue: 4 });
    });

    it('WORD_BANK: writes correctAnswers and template together', () => {
      const current = makeQuestion({
        questionTypeId: QUESTION_TYPE.WORD_BANK,
        settings: { template: 'A ___ has no end.', correctAnswers: ['line'] }
      });
      const patch: QuestionPatch = {
        id: 1,
        settings: {
          template: 'A ___ extends in one direction; a ___ extends in both.',
          correctAnswers: ['ray', 'line']
        }
      };

      const [result] = buildUpdatedQuestions([current], [patch], EXERCISE_ID);

      expect(result.settings).toEqual({
        template: 'A ___ extends in one direction; a ___ extends in both.',
        correctAnswers: ['ray', 'line']
      });
    });

    it('FILL_BLANK: settings shallow-merge preserves untouched keys', () => {
      const current = makeQuestion({
        questionTypeId: QUESTION_TYPE.FILL_BLANK,
        settings: { caseSensitive: false, correctAnswers: ['old'] }
      });
      const patch: QuestionPatch = {
        id: 1,
        settings: { correctAnswers: ['new'] }
      };

      const [result] = buildUpdatedQuestions([current], [patch], EXERCISE_ID);

      expect(result.settings).toEqual({ caseSensitive: false, correctAnswers: ['new'] });
    });

    it('MATCHING: settings shallow-merge preserves pairs not in patch', () => {
      const current = makeQuestion({
        questionTypeId: QUESTION_TYPE.MATCHING,
        settings: { pairs: [{ left: 'A', right: '1' }] }
      });
      const patch: QuestionPatch = {
        id: 1,
        settings: {
          pairs: [
            { left: 'A', right: '1' },
            { left: 'B', right: '2' }
          ]
        }
      };

      const [result] = buildUpdatedQuestions([current], [patch], EXERCISE_ID);

      expect(result.settings).toEqual({
        pairs: [
          { left: 'A', right: '1' },
          { left: 'B', right: '2' }
        ]
      });
    });

    it('ORDERING: writes settings.correctOrder', () => {
      const current = makeQuestion({
        questionTypeId: QUESTION_TYPE.ORDERING,
        settings: { items: ['x', 'y', 'z'] }
      });
      const patch: QuestionPatch = {
        id: 1,
        settings: { correctOrder: ['z', 'y', 'x'] }
      };

      const [result] = buildUpdatedQuestions([current], [patch], EXERCISE_ID);

      expect(result.settings).toEqual({ items: ['x', 'y', 'z'], correctOrder: ['z', 'y', 'x'] });
    });

    it('HOTSPOT: writes settings.correctRegion', () => {
      const current = makeQuestion({
        questionTypeId: QUESTION_TYPE.HOTSPOT,
        settings: { imageUrl: 'https://example.com/img.png' }
      });
      const patch: QuestionPatch = {
        id: 1,
        settings: { correctRegion: { x: 10, y: 20, w: 30, h: 30 } }
      };

      const [result] = buildUpdatedQuestions([current], [patch], EXERCISE_ID);

      expect(result.settings).toEqual({
        imageUrl: 'https://example.com/img.png',
        correctRegion: { x: 10, y: 20, w: 30, h: 30 }
      });
    });
  });

  describe('manually-graded / answer-free types', () => {
    it.each([
      ['TEXTAREA', QUESTION_TYPE.TEXTAREA],
      ['SHORT_ANSWER', QUESTION_TYPE.SHORT_ANSWER],
      ['FILE_UPLOAD', QUESTION_TYPE.FILE_UPLOAD],
      ['LINK', QUESTION_TYPE.LINK]
    ])('%s: updates points and prompt without touching options', (_, questionTypeId) => {
      const current = makeQuestion({
        questionTypeId,
        title: 'Old prompt',
        points: 1,
        settings: { rubric: 'be specific' }
      });
      const patch: QuestionPatch = {
        id: 1,
        question: 'New prompt',
        points: 5
      };

      const [result] = buildUpdatedQuestions([current], [patch], EXERCISE_ID);

      expect(result.question).toBe('New prompt');
      expect(result.points).toBe(5);
      expect(result.settings).toEqual({ rubric: 'be specific' });
      expect(result.options).toEqual([]);
    });
  });

  describe('in-exercise section assignment', () => {
    const sectionA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const sectionB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

    it('sets exerciseSectionId when provided', () => {
      const current = makeQuestion({ exerciseSectionId: sectionA });
      const patch: QuestionPatch = { id: 1, exerciseSectionId: sectionB };

      const [result] = buildUpdatedQuestions([current], [patch], EXERCISE_ID);

      expect(result.exerciseSectionId).toBe(sectionB);
    });

    it('clears exerciseSectionId when patch passes null', () => {
      const current = makeQuestion({ exerciseSectionId: sectionA });
      const patch: QuestionPatch = { id: 1, exerciseSectionId: null };

      const [result] = buildUpdatedQuestions([current], [patch], EXERCISE_ID);

      expect(result.exerciseSectionId).toBeNull();
    });

    it('omits exerciseSectionId when patch does not mention it', () => {
      const current = makeQuestion({ exerciseSectionId: sectionA });
      const patch: QuestionPatch = { id: 1, points: 2 };

      const [result] = buildUpdatedQuestions([current], [patch], EXERCISE_ID);

      expect(result).not.toHaveProperty('exerciseSectionId');
    });
  });

  describe('safety guarantees', () => {
    it('throws when the patched id is not in the exercise', () => {
      const current = makeQuestion({ id: 1 });
      expect(() => buildUpdatedQuestions([current], [{ id: 999, points: 5 }], EXERCISE_ID)).toThrowError(
        /does not belong to exercise/
      );
    });

    it('omitting options preserves existing options (avoids the diff-deletes-all trap)', () => {
      const current = makeQuestion({
        questionTypeId: QUESTION_TYPE.RADIO,
        options: [
          { id: 50, label: 'A', isCorrect: true },
          { id: 51, label: 'B', isCorrect: false }
        ]
      });
      const patch: QuestionPatch = { id: 1, points: 3 };

      const [result] = buildUpdatedQuestions([current], [patch], EXERCISE_ID);

      expect(result.options).toEqual([
        { id: 50, label: 'A', isCorrect: true, settings: undefined },
        { id: 51, label: 'B', isCorrect: false, settings: undefined }
      ]);
    });

    it('passing options drops any existing option missing from the array (downstream diff will delete it)', () => {
      const current = makeQuestion({
        questionTypeId: QUESTION_TYPE.RADIO,
        options: [
          { id: 60, label: 'A', isCorrect: true },
          { id: 61, label: 'B', isCorrect: false },
          { id: 62, label: 'C', isCorrect: false }
        ]
      });
      const patch: QuestionPatch = {
        id: 1,
        options: [
          { id: 60, isCorrect: true },
          { id: 61, isCorrect: false }
        ]
      };

      const [result] = buildUpdatedQuestions([current], [patch], EXERCISE_ID);

      expect(result.options.map((o) => o.id)).toEqual([60, 61]);
    });

    it('omitting question/points/order/typeId backfills from current question', () => {
      const current = makeQuestion({
        title: 'Original',
        questionTypeId: QUESTION_TYPE.NUMERIC,
        points: 7,
        order: 3,
        settings: { correctValue: 5 }
      });
      const patch: QuestionPatch = { id: 1, settings: { correctValue: 9 } };

      const [result] = buildUpdatedQuestions([current], [patch], EXERCISE_ID);

      expect(result.question).toBe('Original');
      expect(result.questionTypeId).toBe(QUESTION_TYPE.NUMERIC);
      expect(result.points).toBe(7);
      expect(result.order).toBe(3);
      expect(result.settings).toEqual({ correctValue: 9 });
    });

    it('per-option settings shallow-merge logic: patch overrides; existing label/isCorrect preserved when omitted', () => {
      const current = makeQuestion({
        questionTypeId: QUESTION_TYPE.RADIO,
        options: [{ id: 70, label: 'Keep label', isCorrect: true, settings: { color: 'red' } }]
      });
      const patch: QuestionPatch = {
        id: 1,
        options: [{ id: 70, settings: { color: 'blue' } }]
      };

      const [result] = buildUpdatedQuestions([current], [patch], EXERCISE_ID);

      expect(result.options[0]).toEqual({
        id: 70,
        label: 'Keep label',
        isCorrect: true,
        settings: { color: 'blue' }
      });
    });

    it('handles multiple patches in one call independently', () => {
      const current: CurrentQuestionForPatch[] = [
        makeQuestion({ id: 1, questionTypeId: QUESTION_TYPE.NUMERIC, settings: { correctValue: 1 } }),
        makeQuestion({
          id: 2,
          questionTypeId: QUESTION_TYPE.RADIO,
          options: [
            { id: 80, label: 'A', isCorrect: false },
            { id: 81, label: 'B', isCorrect: true }
          ]
        })
      ];
      const patches: QuestionPatch[] = [
        { id: 1, settings: { correctValue: 42 } },
        {
          id: 2,
          options: [
            { id: 80, isCorrect: true },
            { id: 81, isCorrect: false }
          ]
        }
      ];

      const result = buildUpdatedQuestions(current, patches, EXERCISE_ID);

      expect(result[0].settings).toEqual({ correctValue: 42 });
      expect(result[1].options.find((o) => o.isCorrect)?.id).toBe(80);
    });
  });
});
