import type { AnswerData, DbQuestionForScoring, ExerciseQuestionModel } from '@cio/question-types';
import {
  dbQuestionToExerciseQuestionModel,
  getMultiPartStemIds,
  getWorkedSolutionPointSplit,
  roundPoints,
  scoreAutoGradedPart,
  scoreSubmissionAnswers
} from '@cio/question-types';
import { annotateMathAnswer, mathGrader } from '@cio/question-types/math-grading';

export type GradableQuestion = {
  id?: number | null;
  title: string | null;
  questionTypeId: number;
  parentQuestionId?: number | null;
  points?: number | string | null;
  settings?: unknown;
  options?: DbQuestionForScoring['options'] | null;
};

/** Maps stored questions to the shape the scorers take. Questions without an id are dropped. */
export function toScoringQuestions(questions: GradableQuestion[]): DbQuestionForScoring[] {
  return questions
    .filter((question): question is GradableQuestion & { id: number } => question.id != null)
    .map((question) => ({
      id: question.id,
      title: question.title,
      questionTypeId: question.questionTypeId,
      parentQuestionId: question.parentQuestionId ?? null,
      points: question.points != null ? Number(question.points) : 0,
      settings: (question.settings as Record<string, unknown> | null) ?? {},
      options: question.options ?? []
    }));
}

/** The questions a student answers: every question except the stems of multi-part questions. */
export function getAnswerableQuestions<Question extends { id?: number | null; parentQuestionId?: number | null }>(
  questions: Question[]
): Question[] {
  const stemIds = getMultiPartStemIds(
    questions.filter((question): question is Question & { id: number } => question.id != null)
  );

  return questions.filter((question) => question.id == null || !stemIds.has(question.id));
}

/** Attaches the canonical MathJSON and the grading reason to every math answer, leaving other answers as they are. */
export function annotateMathAnswers(
  questions: DbQuestionForScoring[],
  answerByQuestionId: ReadonlyMap<number, AnswerData>
): Map<number, AnswerData> {
  const modelById = new Map<number, ExerciseQuestionModel>(
    questions.map((question) => [question.id, dbQuestionToExerciseQuestionModel(question)])
  );
  const annotated = new Map<number, AnswerData>();

  for (const [questionId, answer] of answerByQuestionId) {
    const model = modelById.get(questionId);
    annotated.set(questionId, model ? annotateMathAnswer(model, answer) : answer);
  }

  return annotated;
}

/**
 * Re-scores a stored answer against the current answer key. A worked solution keeps the working points a teacher
 * already awarded: they are the stored points minus the answer points its previous grading earned.
 */
export function regradeStoredAnswer(
  question: DbQuestionForScoring,
  answer: AnswerData,
  storedPoints: number
): { answer: AnswerData; points: number } | null {
  const regraded = annotateMathAnswers([question], new Map([[question.id, answer]])).get(question.id) ?? answer;
  const answerByQuestionId = new Map([[question.id, regraded]]);

  if (answer.type !== 'WORKED_SOLUTION') {
    const { scores } = scoreSubmissionAnswers([question], answerByQuestionId, mathGrader);

    return { answer: regraded, points: scores[0]?.points ?? 0 };
  }

  const { answerPoints } = getWorkedSolutionPointSplit(question.settings, Number(question.points ?? 0));
  const previousAnswerPoints = answer.grading?.reason === 'equivalent' ? answerPoints : 0;
  const workingPoints = Math.max(0, storedPoints - previousAnswerPoints);
  const { scores } = scoreAutoGradedPart([question], answerByQuestionId, mathGrader);

  return {
    answer: regraded,
    points: roundPoints(Math.min((scores[0]?.points ?? 0) + workingPoints, Number(question.points ?? 0)))
  };
}
