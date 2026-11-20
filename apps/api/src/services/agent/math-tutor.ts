import {
  MATH_QUESTION_LABEL_DEFAULTS,
  QUESTION_TYPE_KEY,
  dbQuestionToExerciseQuestionModel,
  gradeMathQuestion,
  readNumericSettings,
  type AnswerData,
  type DbQuestionForScoring,
  type MathMisconception,
  type MathNotationSettings,
  DEFAULT_MATH_NOTATION
} from '@cio/question-types';
import { createMathGrader } from '@cio/question-types/math-grading';
import type { TutorAssessmentMode } from '@cio/ai-assistant/tutor-config';
import type { TAgentCurrentAttempt } from '@cio/utils/validation/agent';

const BLOCKED_GUIDANCE =
  'This workspace blocks help during an exercise. Do not check, hint at or reveal anything about the question; encourage the learner to attempt it and offer to discuss it after they submit.';

const MATH_QUESTION_KEYS: ReadonlySet<string> = new Set([
  QUESTION_TYPE_KEY.MATH_EXPRESSION,
  QUESTION_TYPE_KEY.WORKED_SOLUTION,
  QUESTION_TYPE_KEY.NUMERIC
]);

export type CurrentAttemptInput = NonNullable<TAgentCurrentAttempt['answer']>;

export function isHelpBlocked(mode: TutorAssessmentMode): boolean {
  return mode === 'block_during_exercise';
}

export { BLOCKED_GUIDANCE };

/** The learner's current input as the grader's answer shape; null when it is empty or not a math answer. */
export function toMathAnswerData(question: DbQuestionForScoring, input: CurrentAttemptInput): AnswerData | null {
  const latex = input.latex?.trim() ?? '';
  const key = dbQuestionToExerciseQuestionModel(question).questionType;
  if (key === QUESTION_TYPE_KEY.MATH_EXPRESSION) return latex ? { type: 'MATH_EXPRESSION', latex } : null;
  if (key === QUESTION_TYPE_KEY.WORKED_SOLUTION) {
    return latex ? { type: 'WORKED_SOLUTION', latex, working: { lines: input.working?.lines ?? [], files: [] } } : null;
  }
  if (key !== QUESTION_TYPE_KEY.NUMERIC) return null;

  const value = input.value ?? Number.NaN;
  return latex || Number.isFinite(value) ? { type: 'NUMERIC', value, latex: latex || undefined } : null;
}

export type AttemptVerdict =
  | { status: 'unavailable'; reason: 'not_math' | 'empty' }
  | {
      status: 'graded';
      isCorrect: boolean;
      reason: string;
      misconception?: MathMisconception;
      teacherFeedback?: string;
    };

/** Grades the learner's current input with the Compute Engine; the answer key never leaves this function. */
export function gradeCurrentInput(
  question: DbQuestionForScoring,
  input: CurrentAttemptInput,
  notation: MathNotationSettings = DEFAULT_MATH_NOTATION
): AttemptVerdict {
  const mathGrader = createMathGrader(notation);
  const model = dbQuestionToExerciseQuestionModel(question);
  if (!MATH_QUESTION_KEYS.has(model.questionType)) return { status: 'unavailable', reason: 'not_math' };

  const answer = toMathAnswerData(question, input);
  if (!answer) return { status: 'unavailable', reason: 'empty' };

  if (answer.type === 'NUMERIC') {
    const isCorrect = mathGrader.gradeNumeric(readNumericSettings(model.settings), answer);
    return { status: 'graded', isCorrect, reason: isCorrect ? 'equivalent' : 'wrong' };
  }

  const result = gradeMathQuestion(model, answer, mathGrader)?.result;
  if (!result) return { status: 'unavailable', reason: 'not_math' };

  return {
    status: 'graded',
    isCorrect: result.reason === 'equivalent',
    reason: result.reason,
    misconception: result.misconception,
    teacherFeedback: result.feedback
  };
}

export function describeMisconception(code: MathMisconception): string {
  return MATH_QUESTION_LABEL_DEFAULTS[`math.misconception.${code}`];
}

/** What the tutor may say about a graded answer under the workspace's assessment policy. */
export function answerGuidance(mode: TutorAssessmentMode, verdict: AttemptVerdict): string {
  if (verdict.status === 'unavailable') {
    return verdict.reason === 'empty'
      ? 'The learner has not entered an answer yet. Ask them to try the question first.'
      : 'This question is not a math question the engine can check. Do not judge the answer yourself.';
  }
  if (verdict.isCorrect)
    return 'The engine confirms the answer is correct. Say so and encourage the learner to submit.';
  if (verdict.reason === 'needs_review' || verdict.reason === 'invalid') {
    return 'The engine could not read or decide this answer. Say so, ask the learner to check how they typed it, and do not judge it yourself.';
  }
  if (mode === 'direct_answer') {
    return 'The answer is not correct. You may explain the mistake and show the correct working.';
  }

  return 'The answer is not correct yet. Say so, then give ONE short nudge about what to re-check (use the misconception hint when present). Do not give the answer, a corrected value or a worked solution.';
}

/** What the tutor may say about checked working under the workspace's assessment policy. */
export function stepsGuidance(mode: TutorAssessmentMode, firstIncorrectIndex: number | null): string {
  if (firstIncorrectIndex === null) {
    return 'No line contradicts the one before it. Acknowledge the progress and ask what the learner plans next; do not reveal the next step.';
  }
  if (mode === 'direct_answer') {
    return 'Point to the first line that does not follow and you may show the corrected line and explain it.';
  }

  return 'Point to the first line that does not follow (by its number) and give ONE short nudge about what to re-check. Do not write the corrected line, the lines after it or the final answer.';
}
