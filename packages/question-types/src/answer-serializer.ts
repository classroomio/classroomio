import type { ExerciseAnswerValue, ExerciseQuestionModel } from './exercise-types';

export interface SerializedExerciseAnswer {
  questionId: number;
  optionId?: number;
  answer?: string;
  payload?: Record<string, unknown>;
}

function toQuestionId(question: ExerciseQuestionModel): number | null {
  const id = Number(question.id);
  return Number.isNaN(id) ? null : id;
}

function resolveOptionId(question: ExerciseQuestionModel, rawValue: unknown): number | undefined {
  if (rawValue === null || rawValue === undefined || rawValue === '') return undefined;

  const normalizedRawValue = String(rawValue).trim().toLowerCase();
  if (Array.isArray(question.options) && question.options.length > 0) {
    const option = question.options.find((item) => {
      const candidateId = item.id != null ? String(item.id) : '';
      const candidateValue = item.value != null ? String(item.value) : '';
      const candidateLabel = item.label != null ? String(item.label) : '';

      return (
        candidateId === String(rawValue) ||
        candidateValue === String(rawValue) ||
        candidateLabel === String(rawValue) ||
        candidateValue.trim().toLowerCase() === normalizedRawValue ||
        candidateLabel.trim().toLowerCase() === normalizedRawValue
      );
    });

    const optionId = Number(option?.id);
    if (!Number.isNaN(optionId)) return optionId;
  }

  const numericOptionId = Number(rawValue);
  return Number.isNaN(numericOptionId) ? undefined : numericOptionId;
}

export function serializeExerciseAnswer(
  question: ExerciseQuestionModel,
  answer: ExerciseAnswerValue
): SerializedExerciseAnswer | null {
  const questionId = toQuestionId(question);
  if (questionId === null || answer === null || answer === undefined) return null;

  switch (question.questionType) {
    case 'RADIO':
    case 'TRUE_FALSE': {
      const optionId = resolveOptionId(question, Array.isArray(answer) ? answer[0] : answer);
      return optionId === undefined ? null : { questionId, optionId };
    }

    case 'CHECKBOX': {
      if (!Array.isArray(answer) || answer.length === 0) return null;
      const first = resolveOptionId(question, answer[0]);
      return first === undefined
        ? { questionId, payload: { type: 'CHECKBOX', values: answer } }
        : { questionId, optionId: first, payload: { type: 'CHECKBOX', values: answer } };
    }

    case 'TEXTAREA':
    case 'SHORT_ANSWER':
      return { questionId, answer: String(answer) };

    case 'NUMERIC':
      return { questionId, payload: { type: 'NUMERIC', value: Number(answer) } };

    case 'FILL_BLANK':
      return {
        questionId,
        payload: {
          type: 'FILL_BLANK',
          answers: Array.isArray(answer) ? answer : [String(answer)]
        }
      };

    case 'FILE_UPLOAD':
      return {
        questionId,
        payload: {
          type: 'FILE_UPLOAD',
          file: answer
        }
      };

    case 'MATCHING':
    case 'ORDERING':
    case 'HOTSPOT':
      return { questionId, payload: { type: question.questionType, value: answer } };

    case 'LINK':
      return {
        questionId,
        payload: {
          type: 'LINK',
          links: (Array.isArray(answer) ? answer : [answer]).map((item) => String(item ?? '').trim()).filter(Boolean)
        }
      };

    default:
      return null;
  }
}

export function serializeExerciseAnswerMap(
  questions: ExerciseQuestionModel[],
  answersByKey: Record<string, ExerciseAnswerValue>
): SerializedExerciseAnswer[] {
  return questions
    .map((question, index) => {
      const key = question.key ?? (question.id !== undefined ? String(question.id) : String(index));
      return serializeExerciseAnswer(question, answersByKey[key]);
    })
    .filter((answer): answer is SerializedExerciseAnswer => answer !== null);
}
