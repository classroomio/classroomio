import type { AnswerData } from '@cio/question-types';
import { dbQuestionToExerciseQuestionModel } from '@cio/question-types';
import { buildAnswerClusters, isClusterableQuestionType } from '@cio/question-types/answer-clusters';
import { getQuestionsWithOptionsByIds, type AnalyticsQueryOutput, type AnalyticsRow } from '@cio/db/queries/analytics';

import { toScoringQuestions } from '@api/services/submission/auto-grading';

export const COMMON_WRONG_ANSWERS_COLUMN = 'common_wrong_answers__collect_json';
export const COMMON_WRONG_ANSWERS_LIMIT = 3;

type CollectedWrongAnswer = { answer: AnswerData; points: number; student: string | null };

export type CommonWrongAnswer = { label: string; count: number; grade: string };

function parseCollected(cell: AnalyticsRow[string]): CollectedWrongAnswer[] {
  if (typeof cell !== 'string') return [];

  try {
    const parsed: unknown = JSON.parse(cell);

    return Array.isArray(parsed) ? (parsed as CollectedWrongAnswer[]) : [];
  } catch {
    return [];
  }
}

/**
 * Replaces the wrong answers the common_wrong_answers measure collected per question with the most common groups,
 * clustering equal answers the way the results grid does. The cell becomes a JSON list of label, count and grade, or
 * null when the question's answers cannot be grouped.
 */
export async function groupCommonWrongAnswers(output: AnalyticsQueryOutput): Promise<AnalyticsQueryOutput> {
  const hasMeasure = output.columns.some((column) => column.key === COMMON_WRONG_ANSWERS_COLUMN);
  const hasQuestion = output.columns.some((column) => column.key === 'question_id');
  if (!hasMeasure || !hasQuestion) return output;

  const questionIds = output.rows.map((row) => Number(row['question_id'])).filter((id) => Number.isInteger(id));
  const questions = await getQuestionsWithOptionsByIds(questionIds);
  const modelsById = new Map(
    toScoringQuestions(questions).map((question) => [question.id, dbQuestionToExerciseQuestionModel(question)])
  );

  const rows = output.rows.map((row): AnalyticsRow => {
    const model = modelsById.get(Number(row['question_id']));
    if (!model || !isClusterableQuestionType(model.questionType))
      return { ...row, [COMMON_WRONG_ANSWERS_COLUMN]: null };

    const entries = parseCollected(row[COMMON_WRONG_ANSWERS_COLUMN]).map((item) => ({
      submissionId: '',
      studentId: null,
      studentName: item.student,
      answer: item.answer,
      points: Number(item.points ?? 0)
    }));
    const groups: CommonWrongAnswer[] = buildAnswerClusters(model, entries)
      .filter((cluster) => cluster.grade !== 'full')
      .slice(0, COMMON_WRONG_ANSWERS_LIMIT)
      .map((cluster) => ({ label: cluster.label, count: cluster.count, grade: cluster.grade }));

    return { ...row, [COMMON_WRONG_ANSWERS_COLUMN]: groups.length ? JSON.stringify(groups) : null };
  });

  return { ...output, rows };
}
