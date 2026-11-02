import { ThumbsDownIcon } from 'phosphor-react-native/src/icons/ThumbsDown';
import { ThumbsUpIcon } from 'phosphor-react-native/src/icons/ThumbsUp';

import { ChoiceIcon, ChoiceItem, ChoiceLabel, ChoiceList } from '@/feature/exercise/components/choice-list';
import { useQuestionAnswer } from '@/feature/exercise/components/exercise-session';
import { activeOptionsOf } from '@/feature/exercise/helpers/question-model';
import type { ExerciseQuestion } from '@/feature/exercise/types/exercise';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

function optionLabel(question: ExerciseQuestion, value: boolean, fallback: string) {
  const wanted = value ? 'true' : 'false';
  const option = activeOptionsOf(question).find(
    (candidate) =>
      String(candidate.value ?? '')
        .trim()
        .toLowerCase() === wanted
  );

  return option?.label?.trim() || fallback;
}

export function ThumbsQuestion({ question }: { question: ExerciseQuestion }) {
  const t = useTranslations(exerciseCatalog);
  const { answer, setAnswer } = useQuestionAnswer(question, 'THUMBS');

  return (
    <ChoiceList mode="single" direction="row">
      <ChoiceItem selected={answer?.value === true} onPress={() => setAnswer({ type: 'THUMBS', value: true })}>
        <ChoiceIcon icon={ThumbsUpIcon} />
        <ChoiceLabel>{optionLabel(question, true, t('yes'))}</ChoiceLabel>
      </ChoiceItem>
      <ChoiceItem selected={answer?.value === false} onPress={() => setAnswer({ type: 'THUMBS', value: false })}>
        <ChoiceIcon icon={ThumbsDownIcon} />
        <ChoiceLabel>{optionLabel(question, false, t('no'))}</ChoiceLabel>
      </ChoiceItem>
    </ChoiceList>
  );
}
