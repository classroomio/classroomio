import { ChoiceIndicator, ChoiceItem, ChoiceLabel, ChoiceList } from '@/feature/exercise/components/choice-list';
import { useQuestionAnswer } from '@/feature/exercise/components/exercise-session';
import type { ExerciseMessageKey, ExerciseQuestion } from '@/feature/exercise/types/exercise';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

const CHOICES: { value: boolean; label: ExerciseMessageKey }[] = [
  { value: true, label: 'trueLabel' },
  { value: false, label: 'falseLabel' }
];

export function TrueFalseQuestion({ question }: { question: ExerciseQuestion }) {
  const t = useTranslations(exerciseCatalog);
  const { answer, setAnswer } = useQuestionAnswer(question, 'TRUE_FALSE');

  return (
    <ChoiceList mode="single" direction="row">
      {CHOICES.map((choice) => (
        <ChoiceItem
          key={choice.label}
          selected={answer?.value === choice.value}
          onPress={() => setAnswer({ type: 'TRUE_FALSE', value: choice.value })}
        >
          <ChoiceIndicator />
          <ChoiceLabel>{t(choice.label)}</ChoiceLabel>
        </ChoiceItem>
      ))}
    </ChoiceList>
  );
}
