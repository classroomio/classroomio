import { writable } from 'svelte/store';
import type { AnswerData } from '@cio/question-types';

const MAX_LATEX_LENGTH = 2000;
const MAX_TEXT_LENGTH = 4000;
const MAX_LINE_LENGTH = 500;
const MAX_LINES = 30;

/** The question a student is working on in the exercise take view; the tutor chat reads its unsubmitted answer. */
export type CurrentAttemptFocus = {
  exerciseId: string;
  questionId: number;
  questionKey: string;
};

export const currentAttemptFocus = writable<CurrentAttemptFocus | null>(null);

export function setCurrentAttemptFocus(focus: CurrentAttemptFocus) {
  currentAttemptFocus.update((current) =>
    current?.exerciseId === focus.exerciseId &&
    current.questionId === focus.questionId &&
    current.questionKey === focus.questionKey
      ? current
      : focus
  );
}

export function clearCurrentAttemptFocus() {
  currentAttemptFocus.set(null);
}

function limitLines(lines: string[]): string[] {
  return lines.slice(0, MAX_LINES).map((line) => line.slice(0, MAX_LINE_LENGTH));
}

function toAttemptAnswer(answer: AnswerData) {
  switch (answer.type) {
    case 'MATH_EXPRESSION':
      return { type: answer.type, latex: answer.latex.slice(0, MAX_LATEX_LENGTH) };
    case 'WORKED_SOLUTION':
      return {
        type: answer.type,
        latex: answer.latex.slice(0, MAX_LATEX_LENGTH),
        working: { lines: limitLines(answer.working.lines) }
      };
    case 'NUMERIC':
      return {
        type: answer.type,
        latex: answer.latex?.slice(0, MAX_LATEX_LENGTH),
        value: Number.isFinite(answer.value) ? answer.value : undefined
      };
    case 'TEXTAREA':
    case 'SHORT_ANSWER':
      return { type: answer.type, text: answer.text.slice(0, MAX_TEXT_LENGTH) };
    case 'RADIO':
      return { type: answer.type, optionId: answer.optionId };
    case 'CHECKBOX':
      return { type: answer.type, optionIds: answer.optionIds.slice(0, 50) };
    case 'FILL_BLANK':
      return { type: answer.type, values: limitLines(answer.values) };
    default:
      return { type: answer.type };
  }
}

/**
 * The `context.currentAttempt` the tutor chat sends: the focused question and the student's unsubmitted answer to it.
 * Undefined when nothing is focused or the focus belongs to another exercise than the one open in the chat.
 */
export function buildCurrentAttempt(
  focus: CurrentAttemptFocus | null,
  answers: Record<string, AnswerData | undefined>,
  openExerciseId: string | undefined
) {
  if (!focus || !openExerciseId || focus.exerciseId !== openExerciseId) return undefined;

  const answer = answers[focus.questionKey];

  return { questionId: focus.questionId, ...(answer ? { answer: toAttemptAnswer(answer) } : {}) };
}
