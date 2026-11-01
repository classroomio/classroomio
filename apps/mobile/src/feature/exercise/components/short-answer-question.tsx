import { Field } from '@/feature/common/components/field';
import { Input } from '@/feature/common/components/input';
import { useQuestionAnswer } from '@/feature/exercise/components/exercise-session';
import { useQuestionShell } from '@/feature/exercise/components/question-shell';
import type { ExerciseQuestion } from '@/feature/exercise/types/exercise';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export function ShortAnswerQuestion({ question }: { question: ExerciseQuestion }) {
  const t = useTranslations(exerciseCatalog);
  const { problem } = useQuestionShell();
  const { answer, setAnswer } = useQuestionAnswer(question, 'SHORT_ANSWER');

  return (
    <Field invalid={Boolean(problem)}>
      <Input
        value={answer?.text ?? ''}
        placeholder={t('shortAnswerPlaceholder')}
        accessibilityLabel={t('yourAnswer')}
        returnKeyType="done"
        onChangeText={(next) => setAnswer(next.length > 0 ? { type: 'SHORT_ANSWER', text: next } : null)}
      />
    </Field>
  );
}
