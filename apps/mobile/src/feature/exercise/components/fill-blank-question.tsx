import { StyleSheet, View } from 'react-native';

import { Field, FieldLabel } from '@/feature/common/components/field';
import { Input } from '@/feature/common/components/input';
import { SPACING } from '@/feature/common/constants/layout';
import { useQuestionAnswer } from '@/feature/exercise/components/exercise-session';
import { fillBlankCountOf } from '@/feature/exercise/helpers/question-model';
import type { ExerciseQuestion } from '@/feature/exercise/types/exercise';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export function FillBlankQuestion({ question }: { question: ExerciseQuestion }) {
  const t = useTranslations(exerciseCatalog);
  const { answer, setAnswer } = useQuestionAnswer(question, 'FILL_BLANK');
  const count = fillBlankCountOf(question);
  const values = Array.from({ length: count }, (_, index) => answer?.values[index] ?? '');

  const update = (index: number, text: string) => {
    const next = values.map((value, position) => (position === index ? text : value));
    const hasValue = next.some((value) => value.trim().length > 0);
    setAnswer(hasValue ? { type: 'FILL_BLANK', values: next } : null);
  };

  return (
    <View style={styles.list}>
      {values.map((value, index) => (
        <Field key={index}>
          {count > 1 && <FieldLabel>{t('blankLabel', { number: index + 1 })}</FieldLabel>}
          <Input
            value={value}
            placeholder={count > 1 ? t('blankPlaceholder', { number: index + 1 }) : t('singleBlankPlaceholder')}
            accessibilityLabel={t('blankLabel', { number: index + 1 })}
            autoCapitalize="none"
            returnKeyType={index < count - 1 ? 'next' : 'done'}
            onChangeText={(text) => update(index, text)}
          />
        </Field>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: SPACING.sm }
});
