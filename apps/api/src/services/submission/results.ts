import type { AnswerData, DbQuestionForScoring } from '@cio/question-types';
import {
  QUESTION_TYPE_IDS,
  dbQuestionToExerciseQuestionModel,
  getQuestionTypeById,
  readClusterOverrides,
  readQuestionParameters,
  roundPoints,
  withClusterOverride,
  withoutClusterOverride,
  type ClusterOverrideRule
} from '@cio/question-types';
import {
  buildAnswerClusters,
  isClusterableQuestionType,
  type AnswerCluster
} from '@cio/question-types/answer-clusters';
import type { TClusterOverrideBody, TExerciseResultsQuery } from '@cio/utils/validation/math';
import { getExerciseWithRelationsOptimized, updateQuestion } from '@cio/db/queries/exercise';
import { getCohortsForCourse, getExerciseResultsPage, getLatestAnswersForQuestion } from '@cio/db/queries/submission';
import { AppError, ErrorCodes } from '@api/utils/errors';
import { assertExerciseBelongsToCourse } from '@api/services/v1/courses/exercises';

import { getAnswerableQuestions, toScoringQuestions } from './auto-grading';
import { regradeExerciseSubmissions, type RegradeResult } from './regrade';

export type ResultCellState = 'full' | 'partial' | 'wrong' | 'awaiting' | 'blank';

export type ResultCell = {
  questionId: number;
  state: ResultCellState;
  points: number;
  answer: AnswerData | null;
};

const PENDING_GRADING_STATES = new Set(['queued', 'awaiting_manual']);

function needsTeacher(question: DbQuestionForScoring): boolean {
  if (question.questionTypeId === QUESTION_TYPE_IDS.WORKED_SOLUTION) return true;

  return getQuestionTypeById(question.questionTypeId)?.manualGradingRequired === true;
}

/** Colours one answer: no answer is blank, a manual answer in an ungraded attempt is awaiting, the rest follow points. */
export function classifyCell(
  question: DbQuestionForScoring,
  answer: AnswerData | null,
  points: number,
  gradingState: string
): ResultCellState {
  if (!answer) return 'blank';
  if (needsTeacher(question) && PENDING_GRADING_STATES.has(gradingState)) return 'awaiting';

  const maxPoints = Number(question.points ?? 0);
  if (maxPoints > 0 && points >= maxPoints) return 'full';

  return points > 0 ? 'partial' : 'wrong';
}

/** One page of the results grid: each student's latest attempt with a coloured cell per question. */
export async function getExerciseResultsGrid(courseId: string, exerciseId: string, query: TExerciseResultsQuery) {
  await assertExerciseBelongsToCourse(courseId, exerciseId);

  const [{ questions }, page, cohorts] = await Promise.all([
    getExerciseWithRelationsOptimized(exerciseId),
    getExerciseResultsPage(
      courseId,
      exerciseId,
      { filter: query.filter, cohortId: query.cohortId },
      { page: query.page, limit: query.limit }
    ),
    getCohortsForCourse(courseId)
  ]);
  const scoringQuestions = toScoringQuestions(getAnswerableQuestions(questions));
  const totalPoints = roundPoints(scoringQuestions.reduce((sum, question) => sum + Number(question.points ?? 0), 0));
  const answersBySubmission = new Map<string, typeof page.answers>();

  for (const answer of page.answers) {
    if (!answer.submissionId) continue;

    answersBySubmission.set(answer.submissionId, [...(answersBySubmission.get(answer.submissionId) ?? []), answer]);
  }

  const students = page.students.map((student) => {
    const stored = new Map((answersBySubmission.get(student.submissionId) ?? []).map((row) => [row.questionId, row]));
    const cells = scoringQuestions.map((question): ResultCell => {
      const row = stored.get(question.id);
      const answer = (row?.answerData as AnswerData | null | undefined) ?? null;
      const points = Number(row?.point ?? 0);

      return {
        questionId: question.id,
        state: classifyCell(question, answer, points, student.gradingState),
        points,
        answer
      };
    });

    return { ...student, total: Number(student.total ?? 0), cells };
  });

  return { students, totalPoints, total: page.total, page: query.page, limit: query.limit, cohorts };
}

async function loadClusterQuestion(courseId: string, exerciseId: string, questionId: number) {
  await assertExerciseBelongsToCourse(courseId, exerciseId);

  const { questions } = await getExerciseWithRelationsOptimized(exerciseId);
  const stored = getAnswerableQuestions(questions).find((question) => question.id === questionId);
  if (!stored) throw new AppError('Question not found', ErrorCodes.VALIDATION_ERROR, 404);

  const [scoring] = toScoringQuestions([stored]);
  const model = dbQuestionToExerciseQuestionModel(scoring);
  if (!isClusterableQuestionType(model.questionType)) {
    throw new AppError('Answers to this question type cannot be grouped', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return { scoring, model };
}

/** Groups every student's latest answer to a question into clusters of equal answers. */
export async function getAnswerClusters(courseId: string, exerciseId: string, questionId: number) {
  const { scoring, model } = await loadClusterQuestion(courseId, exerciseId, questionId);
  const rows = await getLatestAnswersForQuestion(courseId, exerciseId, questionId);
  const entries = rows.map((row) => ({
    submissionId: row.submissionId,
    studentId: row.studentId,
    studentName: row.studentName,
    answer: (row.answerData as AnswerData | null) ?? null,
    points: Number(row.point ?? 0)
  }));
  const clusters = buildAnswerClusters(model, entries);
  const clusteredCount = clusters.reduce((sum, cluster) => sum + cluster.count, 0);
  const meta = getQuestionTypeById(scoring.questionTypeId);

  return {
    questionId,
    points: Number(scoring.points ?? 0),
    canScore: meta?.autoGradable === true && scoring.questionTypeId !== QUESTION_TYPE_IDS.WORKED_SOLUTION,
    isParameterised: readQuestionParameters(scoring.settings) !== null,
    answered: clusteredCount,
    blank: entries.length - clusteredCount,
    clusters
  };
}

/**
 * Records the teacher's decision for one cluster as a rule in the question's settings, then regrades that question's
 * stored answers so the decision reaches everyone who already answered and everyone who answers later.
 */
export async function setClusterOverride(params: {
  courseId: string;
  exerciseId: string;
  questionId: number;
  actorProfileId: string;
  body: TClusterOverrideBody;
}): Promise<{ regrade: RegradeResult; clusters: Awaited<ReturnType<typeof getAnswerClusters>> }> {
  const { courseId, exerciseId, questionId, actorProfileId, body } = params;
  const current = await getAnswerClusters(courseId, exerciseId, questionId);
  const cluster = current.clusters.find((candidate: AnswerCluster) => candidate.key === body.key);
  if (!cluster) throw new AppError('This answer group no longer exists', ErrorCodes.VALIDATION_ERROR, 404);

  if (body.verdict && !current.canScore) {
    throw new AppError('Answers to this question type cannot be scored here', ErrorCodes.VALIDATION_ERROR, 400);
  }
  if (body.verdict === 'partial' && Number(body.points) > current.points) {
    throw new AppError('Points cannot exceed the question points', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const rule: ClusterOverrideRule = {
    key: body.key,
    label: cluster.label,
    verdict: body.verdict,
    points: body.verdict === 'partial' ? roundPoints(Number(body.points)) : undefined,
    feedback: body.feedback || undefined,
    setBy: actorProfileId,
    setAt: new Date().toISOString()
  };
  const { scoring } = await loadClusterQuestion(courseId, exerciseId, questionId);
  await updateQuestion(questionId, { settings: withClusterOverride(scoring.settings, rule) });

  const regrade = await regradeExerciseSubmissions(courseId, exerciseId, { questionId });
  const clusters = await getAnswerClusters(courseId, exerciseId, questionId);

  return { regrade, clusters };
}

/** Removes a cluster rule and regrades, so every answer in the cluster returns to what the answer key gives. */
export async function resetClusterOverride(params: {
  courseId: string;
  exerciseId: string;
  questionId: number;
  key: string;
}): Promise<{ regrade: RegradeResult; clusters: Awaited<ReturnType<typeof getAnswerClusters>> }> {
  const { courseId, exerciseId, questionId, key } = params;
  const { scoring } = await loadClusterQuestion(courseId, exerciseId, questionId);
  if (!readClusterOverrides(scoring.settings).some((rule) => rule.key === key)) {
    throw new AppError('No decision is recorded for this answer group', ErrorCodes.VALIDATION_ERROR, 404);
  }

  await updateQuestion(questionId, { settings: withoutClusterOverride(scoring.settings, key) });

  const regrade = await regradeExerciseSubmissions(courseId, exerciseId, { questionId });
  const clusters = await getAnswerClusters(courseId, exerciseId, questionId);

  return { regrade, clusters };
}
