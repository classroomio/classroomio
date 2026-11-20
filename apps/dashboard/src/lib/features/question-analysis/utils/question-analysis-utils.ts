import { flagItem } from '@cio/question-types/item-analysis';

import type { CommonWrongAnswer, QuestionAnalysisCell, QuestionAnalysisResult, QuestionAnalysisRow } from './types';

export const QUESTION_ANALYSIS_MEASURES = [
  { metric: 'question_facility', agg: 'rate' },
  { metric: 'question_discrimination', agg: 'upper_lower_gap' },
  { metric: 'time_on_question', agg: 'median' },
  { metric: 'common_wrong_answers', agg: 'collect_json' }
] as const;

function toNumber(cell: QuestionAnalysisCell | undefined): number | null {
  if (cell === null || cell === undefined || cell === '') return null;

  const value = Number(cell);

  return Number.isFinite(value) ? value : null;
}

function toWrongAnswers(cell: QuestionAnalysisCell | undefined): CommonWrongAnswer[] {
  if (typeof cell !== 'string') return [];

  try {
    const parsed: unknown = JSON.parse(cell);

    return Array.isArray(parsed) ? (parsed as CommonWrongAnswer[]) : [];
  } catch {
    return [];
  }
}

/** One row per question in exercise order, with the item-analysis metrics and the review flags they raise. */
export function toQuestionAnalysisRows(rows: QuestionAnalysisResult['rows']): QuestionAnalysisRow[] {
  return rows.map((row) => {
    const facility = toNumber(row['question_facility__rate']);
    const discrimination = toNumber(row['question_discrimination__upper_lower_gap']);

    return {
      questionId: String(row['question_id']),
      title: String(row['question_label'] ?? ''),
      facility,
      discrimination,
      medianSeconds: toNumber(row['time_on_question__median']),
      wrongAnswers: toWrongAnswers(row['common_wrong_answers__collect_json']),
      flags: flagItem(facility, discrimination)
    };
  });
}
