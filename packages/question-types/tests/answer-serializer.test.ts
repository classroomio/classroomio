import { describe, expect, it } from 'vitest';
import {
  QUESTION_TYPE_KEY,
  serializeExerciseAnswer,
  serializeExerciseAnswerMap,
  type ExerciseQuestionModel
} from '../src';

function buildQuestion(overrides: Partial<ExerciseQuestionModel> = {}): ExerciseQuestionModel {
  return {
    id: 1,
    title: 'Question',
    questionType: QUESTION_TYPE_KEY.RADIO,
    ...overrides
  };
}

describe('serializeExerciseAnswer', () => {
  it('returns null for invalid question id or empty answer', () => {
    expect(serializeExerciseAnswer(buildQuestion({ id: 'not-a-number' }), 'x')).toBeNull();
    expect(serializeExerciseAnswer(buildQuestion({ id: 1 }), null)).toBeNull();
    expect(serializeExerciseAnswer(buildQuestion({ id: 1 }), undefined)).toBeNull();
  });

  it('serializes RADIO and TRUE_FALSE using option resolution', () => {
    const options = [
      { id: 11, label: 'True', value: 'true' },
      { id: 12, label: 'False', value: 'false' }
    ];

    expect(
      serializeExerciseAnswer(
        buildQuestion({
          id: 20,
          questionType: QUESTION_TYPE_KEY.RADIO,
          options
        }),
        'FALSE'
      )
    ).toEqual({ questionId: 20, optionId: 12 });

    expect(
      serializeExerciseAnswer(
        buildQuestion({
          id: 21,
          questionType: QUESTION_TYPE_KEY.TRUE_FALSE,
          options
        }),
        ['true']
      )
    ).toEqual({ questionId: 21, optionId: 11 });
  });

  it('falls back to numeric option id for RADIO/TRUE_FALSE without option matches', () => {
    expect(
      serializeExerciseAnswer(
        buildQuestion({
          id: 22,
          questionType: QUESTION_TYPE_KEY.RADIO
        }),
        '44'
      )
    ).toEqual({ questionId: 22, optionId: 44 });

    expect(
      serializeExerciseAnswer(
        buildQuestion({
          id: 23,
          questionType: QUESTION_TYPE_KEY.TRUE_FALSE
        }),
        'not-a-number'
      )
    ).toBeNull();
  });

  it('serializes CHECKBOX answers with payload and first option when resolvable', () => {
    const answer = ['alpha', 'beta'];
    const serialized = serializeExerciseAnswer(
      buildQuestion({
        id: 24,
        questionType: QUESTION_TYPE_KEY.CHECKBOX,
        options: [
          { id: 301, label: 'Alpha', value: 'alpha' },
          { id: 302, label: 'Beta', value: 'beta' }
        ]
      }),
      answer
    );

    expect(serialized).toEqual({
      questionId: 24,
      optionId: 301,
      payload: { type: 'CHECKBOX', values: answer }
    });
  });

  it('serializes CHECKBOX with payload only when first option cannot be resolved', () => {
    const answer = ['missing', 'alpha'];
    const serialized = serializeExerciseAnswer(
      buildQuestion({
        id: 25,
        questionType: QUESTION_TYPE_KEY.CHECKBOX,
        options: [{ id: 401, label: 'Alpha', value: 'alpha' }]
      }),
      answer
    );

    expect(serialized).toEqual({
      questionId: 25,
      payload: { type: 'CHECKBOX', values: answer }
    });
    expect(
      serializeExerciseAnswer(
        buildQuestion({
          id: 25,
          questionType: QUESTION_TYPE_KEY.CHECKBOX
        }),
        []
      )
    ).toBeNull();
  });

  it('serializes text-based answer question types', () => {
    expect(
      serializeExerciseAnswer(
        buildQuestion({
          id: 26,
          questionType: QUESTION_TYPE_KEY.TEXTAREA
        }),
        1001
      )
    ).toEqual({ questionId: 26, answer: '1001' });

    expect(
      serializeExerciseAnswer(
        buildQuestion({
          id: 27,
          questionType: QUESTION_TYPE_KEY.SHORT_ANSWER
        }),
        'short answer'
      )
    ).toEqual({ questionId: 27, answer: 'short answer' });
  });

  it('serializes NUMERIC, FILL_BLANK, and FILE_UPLOAD payloads', () => {
    expect(
      serializeExerciseAnswer(
        buildQuestion({
          id: 28,
          questionType: QUESTION_TYPE_KEY.NUMERIC
        }),
        '12.5'
      )
    ).toEqual({ questionId: 28, payload: { type: 'NUMERIC', value: 12.5 } });

    expect(
      serializeExerciseAnswer(
        buildQuestion({
          id: 29,
          questionType: QUESTION_TYPE_KEY.FILL_BLANK
        }),
        'answer-a'
      )
    ).toEqual({ questionId: 29, payload: { type: 'FILL_BLANK', answers: ['answer-a'] } });

    expect(
      serializeExerciseAnswer(
        buildQuestion({
          id: 30,
          questionType: QUESTION_TYPE_KEY.FILL_BLANK
        }),
        ['answer-a', 'answer-b']
      )
    ).toEqual({ questionId: 30, payload: { type: 'FILL_BLANK', answers: ['answer-a', 'answer-b'] } });

    const filePayload = { fileId: 'f-1', fileName: 'submission.pdf' };
    expect(
      serializeExerciseAnswer(
        buildQuestion({
          id: 31,
          questionType: QUESTION_TYPE_KEY.FILE_UPLOAD
        }),
        filePayload
      )
    ).toEqual({ questionId: 31, payload: { type: 'FILE_UPLOAD', file: filePayload } });
  });

  it('serializes MATCHING, ORDERING, and HOTSPOT payloads', () => {
    const matchingValue = { pairs: [{ left: 'A', right: '1' }] };
    expect(
      serializeExerciseAnswer(
        buildQuestion({
          id: 32,
          questionType: QUESTION_TYPE_KEY.MATCHING
        }),
        matchingValue
      )
    ).toEqual({ questionId: 32, payload: { type: 'MATCHING', value: matchingValue } });

    const orderingValue = ['step-1', 'step-2'];
    expect(
      serializeExerciseAnswer(
        buildQuestion({
          id: 33,
          questionType: QUESTION_TYPE_KEY.ORDERING
        }),
        orderingValue
      )
    ).toEqual({ questionId: 33, payload: { type: 'ORDERING', value: orderingValue } });

    const hotspotValue = { points: [{ x: 10, y: 20 }] };
    expect(
      serializeExerciseAnswer(
        buildQuestion({
          id: 34,
          questionType: QUESTION_TYPE_KEY.HOTSPOT
        }),
        hotspotValue
      )
    ).toEqual({ questionId: 34, payload: { type: 'HOTSPOT', value: hotspotValue } });
  });

  it('serializes LINK answers by trimming and filtering empty values', () => {
    expect(
      serializeExerciseAnswer(
        buildQuestion({
          id: 35,
          questionType: QUESTION_TYPE_KEY.LINK
        }),
        [' https://example.com ', '', '   ', 'https://classroomio.com']
      )
    ).toEqual({
      questionId: 35,
      payload: { type: 'LINK', links: ['https://example.com', 'https://classroomio.com'] }
    });
  });

  it('returns null for unsupported question types', () => {
    expect(
      serializeExerciseAnswer(
        buildQuestion({
          id: 36,
          questionType: 'UNSUPPORTED' as ExerciseQuestionModel['questionType']
        }),
        'value'
      )
    ).toBeNull();
  });
});

describe('serializeExerciseAnswerMap', () => {
  it('serializes by key/id/index precedence and filters null entries', () => {
    const questions: ExerciseQuestionModel[] = [
      buildQuestion({
        id: 100,
        key: 'custom-key',
        questionType: QUESTION_TYPE_KEY.TEXTAREA
      }),
      buildQuestion({
        id: 101,
        questionType: QUESTION_TYPE_KEY.RADIO,
        options: [{ id: 600, label: 'Yes', value: 'yes' }]
      }),
      buildQuestion({
        id: undefined,
        key: undefined,
        questionType: QUESTION_TYPE_KEY.SHORT_ANSWER
      }),
      buildQuestion({
        id: 102,
        questionType: QUESTION_TYPE_KEY.LINK
      })
    ];

    const result = serializeExerciseAnswerMap(questions, {
      'custom-key': 'Paragraph response',
      '101': 'yes',
      '2': 'ignored because question id is not numeric',
      '102': [' https://docs.classroomio.com ', '']
    });

    expect(result).toEqual([
      { questionId: 100, answer: 'Paragraph response' },
      { questionId: 101, optionId: 600 },
      { questionId: 102, payload: { type: 'LINK', links: ['https://docs.classroomio.com'] } }
    ]);
  });
});
