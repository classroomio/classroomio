import { StyleSheet, View } from 'react-native';

import { Field } from '@/feature/common/components/field';
import { InputGroup, InputGroupInput } from '@/feature/common/components/input';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { useQuestionAnswer } from '@/feature/exercise/components/exercise-session';
import { useQuestionShell } from '@/feature/exercise/components/question-shell';
import { characterLimitsOf } from '@/feature/exercise/helpers/question-model';
import type { ExerciseQuestion, ExerciseTranslator } from '@/feature/exercise/types/exercise';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

function limitHint(t: ExerciseTranslator, count: number, min?: number, max?: number) {
  const characters = t('characterCount', { count });
  if (min !== undefined && max !== undefined) return `${characters} · ${t('characterRange', { min, max })}`;
  if (min !== undefined) return `${characters} · ${t('characterMinimum', { min })}`;
  if (max !== undefined) return t('characterOfMaximum', { count: max, current: count });

  return characters;
}

export function TextareaQuestion({ question }: { question: ExerciseQuestion }) {
  const t = useTranslations(exerciseCatalog);
  const { problem } = useQuestionShell();
  const { answer, setAnswer } = useQuestionAnswer(question, 'TEXTAREA');
  const { minCharacters, maxCharacters } = characterLimitsOf(question);
  const text = answer?.text ?? '';
  const count = text.trim().length;
  const outOfRange =
    (minCharacters !== undefined && count > 0 && count < minCharacters) ||
    (maxCharacters !== undefined && count > maxCharacters);

  return (
    <Field invalid={Boolean(problem)}>
      <InputGroup style={styles.group}>
        <InputGroupInput
          multiline
          value={text}
          placeholder={t('paragraphPlaceholder')}
          accessibilityLabel={t('yourAnswer')}
          textAlignVertical="top"
          onChangeText={(next) => setAnswer(next.length > 0 ? { type: 'TEXTAREA', text: next } : null)}
          style={styles.input}
        />
        <View style={styles.footer}>
          <Text variant="micro" tone={outOfRange ? 'warning' : 'subtle'} accessibilityLiveRegion="polite">
            {limitHint(t, count, minCharacters, maxCharacters)}
          </Text>
        </View>
      </InputGroup>
    </Field>
  );
}

const styles = StyleSheet.create({
  group: { flexDirection: 'column', alignItems: 'stretch' },
  input: { minHeight: 140 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: SPACING.sm, paddingBottom: SPACING.xs }
});
