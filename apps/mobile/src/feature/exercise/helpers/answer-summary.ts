import { formatDuration } from '@/feature/exercise/helpers/format';
import { activeOptionsOf, plainTextOf } from '@/feature/exercise/helpers/question-model';
import { orderingItemsOf } from '@/feature/exercise/helpers/arrangement';
import type { AnswerData, ExerciseQuestion, ExerciseTranslator } from '@/feature/exercise/types/exercise';
import type { Formatters } from '@/feature/i18n/helpers/use-formatters';

export function answerSummaryOf(
  question: ExerciseQuestion | undefined,
  answer: AnswerData | null | undefined,
  t: ExerciseTranslator,
  format: Formatters
) {
  if (!answer) return t('noAnswer');

  const options = question ? activeOptionsOf(question) : [];
  const optionLabel = (id: number) =>
    plainTextOf(options.find((option) => Number(option.id) === id)?.label) || t('selectedOption');

  switch (answer.type) {
    case 'RADIO':
      return optionLabel(answer.optionId);
    case 'CHECKBOX':
      return answer.optionIds.map(optionLabel).join(', ');
    case 'TRUE_FALSE':
      return t(answer.value ? 'trueLabel' : 'falseLabel');
    case 'THUMBS':
      return t(answer.value ? 'thumbsUp' : 'thumbsDown');
    case 'TEXTAREA':
    case 'SHORT_ANSWER':
      return plainTextOf(answer.text);
    case 'NUMERIC':
      return format.number(answer.value);
    case 'STAR':
      return t('starCount', { count: answer.value });
    case 'FILL_BLANK':
      return answer.values.filter(Boolean).join(', ');
    case 'WORD_BANK':
      return answer.filledBlanks.filter(Boolean).join(', ');
    case 'FILE_UPLOAD':
      return answer.fileName || t('uploadedFile');
    case 'VIDEO_RECORDING':
      return t('videoSummary', { duration: formatDuration(answer.durationSeconds) });
    case 'LINK':
      return answer.urls.join(', ');
    case 'MATCHING':
      return answer.pairs.map((pair) => `${pair.left} → ${pair.right}`).join(', ');
    case 'ORDERING': {
      const items = question ? orderingItemsOf(question) : [];
      const labelOf = (value: string) => items.find((item) => item.value === value)?.label ?? value;

      return answer.orderedValues.map(labelOf).join(', ');
    }
    case 'HOTSPOT':
      return t('hotspotSummary', { count: answer.coordinates.length });
  }
}
