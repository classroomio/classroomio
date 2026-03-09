import {
  getExerciseQuestionLabel,
  type AnswerData,
  type ExerciseQuestionLabels,
  type ExerciseQuestionModel,
  type ExerciseSubmissionModel
} from '@cio/question-types';

export const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)'
] as const;

export type SubmissionChartDatum = {
  key: string;
  label: string;
  responses: number;
  color: string;
};

export function getSubmissionLabel(
  labels: ExerciseQuestionLabels | undefined,
  key:
    | 'submission.common.no_answer'
    | 'submission.common.other'
    | 'submission.chart.responses'
    | 'submission.chart.no_data'
    | 'submission.list.responses'
    | 'submission.list.no_responses',
  fallback = ''
): string {
  return getExerciseQuestionLabel(labels, key, fallback);
}

function getQuestionKey(question: ExerciseQuestionModel): string | null {
  if (question.id !== undefined && question.id !== null) return String(question.id);
  if (question.key) return String(question.key);
  return null;
}

export function normalizeLabel(value: string | null | undefined, fallback: string): string {
  const label = String(value || '').trim();
  return label.length > 0 ? label : fallback;
}

export function getAnswerForQuestion(
  submission: ExerciseSubmissionModel,
  question: ExerciseQuestionModel
): AnswerData | undefined {
  const questionKey = getQuestionKey(question);
  if (!questionKey) return undefined;

  const answer = submission.answers.find((item) => String(item.questionId) === questionKey);

  if (!answer?.answerData || typeof answer.answerData !== 'object' || !('type' in answer.answerData)) {
    return undefined;
  }

  return answer.answerData;
}

export function withChartColors(
  items: Array<{ key: string; label: string; responses: number }>
): SubmissionChartDatum[] {
  return items.map((item, index) => ({
    ...item,
    color: CHART_COLORS[index % CHART_COLORS.length]
  }));
}
