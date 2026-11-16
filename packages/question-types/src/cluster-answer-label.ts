import type { AnswerData } from './answer-data';
import type { ExerciseQuestionModel } from './exercise-types';

/** The answer as text for `MathText`: math between `$` delimiters, choices by label. */
export function describeClusterAnswer(question: ExerciseQuestionModel, answer: AnswerData): string {
  const labelOf = (optionId: number) =>
    (question.options ?? []).find((option) => option.id === optionId)?.label ?? String(optionId);

  switch (answer.type) {
    case 'MATH_EXPRESSION':
    case 'WORKED_SOLUTION':
      return `$${answer.latex}$`;
    case 'NUMERIC':
      return answer.latex?.trim() ? `$${answer.latex}$` : String(answer.value);
    case 'RADIO':
      return labelOf(answer.optionId);
    case 'CHECKBOX':
      return answer.optionIds.map(labelOf).join(', ');
    case 'TRUE_FALSE':
      return String(answer.value);
    case 'SHORT_ANSWER':
      return answer.text.trim();
    case 'FILL_BLANK':
      return answer.values.join(', ');
    case 'WORD_BANK':
      return answer.filledBlanks.join(', ');
    case 'ORDERING':
      return answer.orderedValues.join(' → ');
    case 'MATCHING':
      return answer.pairs.map((pair) => `${pair.left} → ${pair.right}`).join('; ');
    default:
      return '';
  }
}
