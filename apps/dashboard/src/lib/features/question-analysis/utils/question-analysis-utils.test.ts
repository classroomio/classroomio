import { describe, expect, it } from 'vitest';

import { toQuestionAnalysisRows } from './question-analysis-utils';

describe('toQuestionAnalysisRows', () => {
  it('maps metric columns, parses wrong answers and raises flags', () => {
    const rows = toQuestionAnalysisRows([
      {
        question_id: '7',
        question_label: 'Solve $x+2=5$',
        question_facility__rate: 20,
        question_discrimination__upper_lower_gap: 0.5,
        time_on_question__median: 15.5,
        common_wrong_answers__collect_json: JSON.stringify([{ label: 'x = 7', count: 3, grade: 'wrong' }])
      }
    ]);

    expect(rows).toEqual([
      {
        questionId: '7',
        title: 'Solve $x+2=5$',
        facility: 20,
        discrimination: 0.5,
        medianSeconds: 15.5,
        wrongAnswers: [{ label: 'x = 7', count: 3, grade: 'wrong' }],
        flags: ['too_hard']
      }
    ]);
  });

  it('treats missing metrics and bad JSON as empty', () => {
    const [row] = toQuestionAnalysisRows([
      { question_id: '1', question_label: 'Q', question_facility__rate: null, common_wrong_answers__collect_json: '{' }
    ]);

    expect(row.facility).toBeNull();
    expect(row.discrimination).toBeNull();
    expect(row.wrongAnswers).toEqual([]);
    expect(row.flags).toEqual([]);
  });
});
