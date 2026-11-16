import { describe, expect, it } from 'vitest';

import { QUESTION_TYPE_IDS, buildWebhookGrading, type WebhookGradedAnswerRow } from '../src';

function answer(overrides: Partial<WebhookGradedAnswerRow> & Pick<WebhookGradedAnswerRow, 'questionId'>) {
  return {
    parentQuestionId: null,
    questionTypeId: QUESTION_TYPE_IDS.MATH_EXPRESSION,
    pointsPossible: 2,
    pointsEarned: 0,
    answerData: null,
    ...overrides
  } satisfies WebhookGradedAnswerRow;
}

describe('buildWebhookGrading', () => {
  it('returns null for an exercise without math questions or skills', () => {
    const rows = [answer({ questionId: 1, questionTypeId: QUESTION_TYPE_IDS.RADIO, pointsEarned: 2 })];

    expect(buildWebhookGrading(rows, [])).toBeNull();
  });

  it('lists each question with its reason code and partial points', () => {
    const rows = [
      answer({
        questionId: 1,
        pointsEarned: 2,
        answerData: { type: 'MATH_EXPRESSION', grading: { reason: 'equivalent' } }
      }),
      answer({ questionId: 2, answerData: { type: 'MATH_EXPRESSION', grading: { reason: 'not_simplified' } } }),
      answer({
        questionId: 3,
        parentQuestionId: 9,
        questionTypeId: QUESTION_TYPE_IDS.WORKED_SOLUTION,
        pointsPossible: 6,
        pointsEarned: 3.456
      })
    ];

    expect(buildWebhookGrading(rows, [])?.questions).toEqual([
      {
        questionId: 1,
        parentQuestionId: null,
        type: 'MATH_EXPRESSION',
        pointsEarned: 2,
        pointsPossible: 2,
        reason: 'equivalent'
      },
      {
        questionId: 2,
        parentQuestionId: null,
        type: 'MATH_EXPRESSION',
        pointsEarned: 0,
        pointsPossible: 2,
        reason: 'not_simplified'
      },
      {
        questionId: 3,
        parentQuestionId: 9,
        type: 'WORKED_SOLUTION',
        pointsEarned: 3.46,
        pointsPossible: 6,
        reason: null
      }
    ]);
  });

  it('totals points per skill, sorted by code', () => {
    const rows = [
      answer({ questionId: 1, pointsEarned: 2 }),
      answer({ questionId: 2, pointsEarned: 0.5 }),
      answer({ questionId: 3, pointsEarned: 1 })
    ];
    const tags = [
      { questionId: 1, skillId: 'b', code: 'B.2', name: 'Second' },
      { questionId: 2, skillId: 'b', code: 'B.2', name: 'Second' },
      { questionId: 2, skillId: 'a', code: 'A.1', name: 'First' },
      { questionId: 99, skillId: 'a', code: 'A.1', name: 'First' }
    ];

    expect(buildWebhookGrading(rows, tags)?.skills).toEqual([
      { skillId: 'a', code: 'A.1', name: 'First', pointsEarned: 0.5, pointsPossible: 2 },
      { skillId: 'b', code: 'B.2', name: 'Second', pointsEarned: 2.5, pointsPossible: 4 }
    ]);
  });

  it('reports a skill-tagged exercise that has no math question', () => {
    const rows = [answer({ questionId: 1, questionTypeId: QUESTION_TYPE_IDS.RADIO, pointsEarned: 2 })];
    const grading = buildWebhookGrading(rows, [{ questionId: 1, skillId: 's', code: 'S', name: 'Skill' }]);

    expect(grading?.skills).toHaveLength(1);
  });
});
