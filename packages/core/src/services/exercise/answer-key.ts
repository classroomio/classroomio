import { AppError, ErrorCodes } from '@cio/utils/errors';
import { formatAnswerKeyIssues, type AnswerKeyInput } from '@cio/question-types/math-key-verification';

type QuestionToVerify = {
  question: string;
  questionTypeId?: number;
  points?: number;
  settings?: Record<string, unknown> | null;
  options?: ReadonlyArray<{ label?: string | null }>;
  verify?: AnswerKeyInput['verify'];
};

/**
 * Throws a validation error naming every answer key the Compute Engine could not confirm (unparseable LaTeX, a key that
 * disagrees with the author's `verify` expression or equation, unclosed `$`), so a wrong key is never stored.
 */
export function assertAnswerKeysVerified(questions: readonly QuestionToVerify[]): void {
  const inputs = questions.flatMap((question, index) =>
    question.questionTypeId === undefined
      ? []
      : [
          {
            label: String(index + 1),
            questionTypeId: question.questionTypeId,
            title: question.question,
            points: question.points,
            settings: question.settings,
            optionLabels: (question.options ?? []).map((option) => option.label ?? ''),
            verify: question.verify
          }
        ]
  );
  const message = formatAnswerKeyIssues(inputs);
  if (message) throw new AppError(message, ErrorCodes.VALIDATION_ERROR, 400);
}
