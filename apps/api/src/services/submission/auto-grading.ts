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
import { instantiateQuestion } from '@cio/question-types/variants';
import { isSeedValid, readQuestionParameters } from '@cio/question-types';
import { AppError, ErrorCodes } from '@api/utils/errors';

const FALLBACK_SEED = 'default';

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

/**
 * The variant seed each parameterised question was answered with. A missing seed falls back to a fixed one, or is
 * rejected when `strict`, because an API client that never saw the numbers cannot have answered them.
 */
export function resolveAnswerSeeds(
  questions: GradableQuestion[],
  inputs: ReadonlyArray<{ questionId: number; seed?: string }>,
  strict: boolean
): Map<number, string> {
  const seedByQuestionId = new Map<number, string>();
  const parameterisedIds = new Set(
    questions
      .filter((question): question is GradableQuestion & { id: number } => question.id != null)
      .filter((question) => readQuestionParameters(question.settings as Record<string, unknown> | null) !== null)
      .map((question) => question.id)
  );

  for (const input of inputs) {
    if (!parameterisedIds.has(input.questionId)) continue;

    if (input.seed !== undefined && !isSeedValid(input.seed)) {
      throw new AppError(`Question ${input.questionId}: the seed is not valid`, ErrorCodes.VALIDATION_ERROR, 400);
    }
    if (input.seed === undefined && strict) {
      throw new AppError(
        `Question ${input.questionId}: this question has variables, so the answer needs the seed the student was shown`,
        ErrorCodes.VALIDATION_ERROR,
        400
      );
    }

    seedByQuestionId.set(input.questionId, input.seed ?? FALLBACK_SEED);
  }

  return seedByQuestionId;
}

/** Fills each question's placeholders with the numbers its seed produces, so scoring uses the student's own key. */
export function instantiateScoringQuestions(
  questions: DbQuestionForScoring[],
  seedByQuestionId: ReadonlyMap<number, string>
): DbQuestionForScoring[] {
  return questions.map((question) => {
    const seed = seedByQuestionId.get(question.id);

    return seed ? instantiateQuestion(question, seed) : question;
  });
}

/** Stores each seed with its answer so review and regrade reproduce the student's instance. */
export function attachSeeds(
  answerByQuestionId: ReadonlyMap<number, AnswerData>,
  seedByQuestionId: ReadonlyMap<number, string>
): Map<number, AnswerData> {
  return new Map(
    [...answerByQuestionId].map(([questionId, answer]) => {
      const seed = seedByQuestionId.get(questionId);

      return [questionId, seed ? { ...answer, seed } : answer];
    })
  );
}

/** An answer as a student may see it: the AI suggestion is for graders until a teacher accepts it. */
export function withoutAiReview<Answer extends { answerData?: unknown }>(answer: Answer): Answer {
  const data = answer.answerData;
  if (!data || typeof data !== 'object' || !('aiReview' in data)) return answer;

  const { aiReview: _aiReview, ...rest } = data as Record<string, unknown>;

  return { ...answer, answerData: rest };
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
  storedQuestion: DbQuestionForScoring,
  answer: AnswerData,
  storedPoints: number
): { answer: AnswerData; points: number } | null {
  const isParameterised = readQuestionParameters(storedQuestion.settings) !== null;
  const question = isParameterised ? instantiateQuestion(storedQuestion, answer.seed ?? FALLBACK_SEED) : storedQuestion;
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
