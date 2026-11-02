import { characterLimitsOf, isQuestionRequired } from '@/feature/exercise/helpers/question-model';
import type { AnswerData, ExerciseQuestion, ExerciseTranslator } from '@/feature/exercise/types/exercise';

/** Whether an answer carries a value the API will accept; mirrors the web's `hasAnswerValue`. */
export function hasAnswerValue(answer: AnswerData | null | undefined): answer is AnswerData {
  if (!answer) return false;

  switch (answer.type) {
    case 'RADIO':
    case 'TRUE_FALSE':
    case 'THUMBS':
    case 'STAR':
      return true;
    case 'NUMERIC':
      return Number.isFinite(answer.value);
    case 'CHECKBOX':
      return answer.optionIds.length > 0;
    case 'TEXTAREA':
    case 'SHORT_ANSWER':
      return answer.text.trim().length > 0;
    case 'FILL_BLANK':
      return answer.values.some((value) => value.trim().length > 0);
    case 'WORD_BANK':
      return answer.filledBlanks.length > 0 && answer.filledBlanks.every((value) => value.trim().length > 0);
    case 'FILE_UPLOAD':
      return Boolean(answer.fileKey);
    case 'VIDEO_RECORDING':
      return Boolean(answer.assetId && answer.storageKey);
    case 'MATCHING':
      return answer.pairs.length > 0;
    case 'ORDERING':
      return answer.orderedValues.length > 0;
    case 'LINK':
      return answer.urls.length > 0;
    case 'HOTSPOT':
      return answer.coordinates.length > 0;
  }
}

export function isValidLink(value: string) {
  return /^https?:\/\/[^\s/?#]+\S*$/i.test(value.trim());
}

export function answerProblemOf(
  question: ExerciseQuestion,
  answer: AnswerData | null | undefined,
  t: ExerciseTranslator
) {
  const answered = hasAnswerValue(answer);

  if (!answered) return isQuestionRequired(question) ? t('problemRequired') : null;

  if (answer.type === 'TEXTAREA') {
    const { minCharacters, maxCharacters } = characterLimitsOf(question);
    const count = answer.text.trim().length;
    if (minCharacters !== undefined && count < minCharacters)
      return t('problemMinCharacters', { count: minCharacters });
    if (maxCharacters !== undefined && count > maxCharacters)
      return t('problemMaxCharacters', { count: maxCharacters });
  }

  if (answer.type === 'LINK' && answer.urls.some((url) => !isValidLink(url))) {
    return t('problemLinkFormat');
  }

  return null;
}
