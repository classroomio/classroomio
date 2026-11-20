import { roundPoints } from './points';
import { getQuestionTypeById } from './question-type-lookup';
import { QUESTION_TYPE_KEY, type QuestionTypeKey } from './question-type-keys';

const MATH_GRADED_KEYS: ReadonlySet<QuestionTypeKey> = new Set<QuestionTypeKey>([
  QUESTION_TYPE_KEY.MATH_EXPRESSION,
  QUESTION_TYPE_KEY.WORKED_SOLUTION,
  QUESTION_TYPE_KEY.GRAPH_PLOT,
  QUESTION_TYPE_KEY.GRAPH_READ
]);

export type WebhookGradedAnswerRow = {
  questionId: number;
  parentQuestionId: number | null;
  questionTypeId: number;
  pointsPossible: number | null;
  pointsEarned: number | null;
  answerData: unknown;
};

export type WebhookQuestionSkillRow = { questionId: number; skillId: string; code: string; name: string };

export type WebhookQuestionResult = {
  questionId: number;
  parentQuestionId: number | null;
  type: string;
  pointsEarned: number;
  pointsPossible: number;
  /** The grader's reason code (`equivalent`, `wrong`, `not_simplified`, ...); null when the answer carries none. */
  reason: string | null;
};

export type WebhookSkillResult = {
  skillId: string;
  code: string;
  name: string;
  pointsEarned: number;
  pointsPossible: number;
};

export type WebhookSubmissionGrading = { questions: WebhookQuestionResult[]; skills: WebhookSkillResult[] };

function readReason(answerData: unknown): string | null {
  if (!answerData || typeof answerData !== 'object') return null;

  const grading = (answerData as { grading?: unknown }).grading;
  if (!grading || typeof grading !== 'object') return null;

  const reason = (grading as { reason?: unknown }).reason;

  return typeof reason === 'string' ? reason : null;
}

/**
 * The per-question results and per-skill totals a graded-submission webhook carries. Returns null for an exercise with
 * no math or graph question and no skill tag, so other exercises keep their payload unchanged.
 */
export function buildWebhookGrading(
  answers: readonly WebhookGradedAnswerRow[],
  skillTags: readonly WebhookQuestionSkillRow[]
): WebhookSubmissionGrading | null {
  const isMathExercise = answers.some((answer) => {
    const key = getQuestionTypeById(answer.questionTypeId)?.key;

    return key !== undefined && MATH_GRADED_KEYS.has(key);
  });
  if (!isMathExercise && skillTags.length === 0) return null;

  const questions = answers.map<WebhookQuestionResult>((answer) => ({
    questionId: answer.questionId,
    parentQuestionId: answer.parentQuestionId,
    type: getQuestionTypeById(answer.questionTypeId)?.key ?? 'UNKNOWN',
    pointsEarned: roundPoints(Number(answer.pointsEarned ?? 0)),
    pointsPossible: roundPoints(Number(answer.pointsPossible ?? 0)),
    reason: readReason(answer.answerData)
  }));
  const questionById = new Map(questions.map((question) => [question.questionId, question]));
  const skillById = new Map<string, WebhookSkillResult>();

  for (const tag of skillTags) {
    const question = questionById.get(tag.questionId);
    if (!question) continue;

    const skill = skillById.get(tag.skillId) ?? {
      skillId: tag.skillId,
      code: tag.code,
      name: tag.name,
      pointsEarned: 0,
      pointsPossible: 0
    };
    skill.pointsEarned = roundPoints(skill.pointsEarned + question.pointsEarned);
    skill.pointsPossible = roundPoints(skill.pointsPossible + question.pointsPossible);
    skillById.set(tag.skillId, skill);
  }

  return { questions, skills: [...skillById.values()].sort((left, right) => left.code.localeCompare(right.code)) };
}
