import type { Translator } from '@/feature/i18n/helpers/translate';
import type { Locale } from '@/feature/i18n/types/i18n';
import { ANSWER_KIND_KEYS, ANSWER_KIND_ORDER, ANSWER_KINDS } from '@/feature/teach/constants/question-types';
import type { en } from '@/feature/teach/translations/en';
import type { QuestionTypeKey } from '@/feature/teach/types/teach';

/** "Written, video" style summary of the kinds of answer a submission holds. */
export function answerKindsLabel(types: QuestionTypeKey[], t: Translator<typeof en>, locale: Locale) {
  const kinds = [...new Set(types.map((type) => ANSWER_KINDS[type]))].sort(
    (first, second) => ANSWER_KIND_ORDER.indexOf(first) - ANSWER_KIND_ORDER.indexOf(second)
  );
  const label = kinds.map((kind) => t(ANSWER_KIND_KEYS[kind])).join(', ');

  return label ? label.charAt(0).toLocaleUpperCase(locale) + label.slice(1) : '';
}
