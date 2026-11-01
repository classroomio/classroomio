import { Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Field, FieldError } from '@/feature/common/components/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/feature/common/components/input';
import { SPACING } from '@/feature/common/constants/layout';
import { isValidLink } from '@/feature/exercise/helpers/answer-state';
import { useQuestionAnswer } from '@/feature/exercise/components/exercise-session';
import type { ExerciseQuestion } from '@/feature/exercise/types/exercise';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export function LinkQuestion({ question }: { question: ExerciseQuestion }) {
  const t = useTranslations(exerciseCatalog);
  const { answer, setAnswer } = useQuestionAnswer(question, 'LINK');
  const [rows, setRows] = useState(() => (answer && answer.urls.length > 0 ? answer.urls : ['']));

  const commit = (next: string[]) => {
    setRows(next);
    const urls = next.map((url) => url.trim()).filter(Boolean);
    setAnswer(urls.length > 0 ? { type: 'LINK', urls } : null);
  };

  return (
    <View style={styles.list}>
      {rows.map((row, index) => {
        const invalid = row.trim().length > 0 && !isValidLink(row);

        return (
          <Field key={index} invalid={invalid}>
            <InputGroup>
              <InputGroupInput
                value={row}
                placeholder="https://"
                accessibilityLabel={t('linkLabel', { number: index + 1 })}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                textContentType="URL"
                onChangeText={(text) => commit(rows.map((value, position) => (position === index ? text : value)))}
              />
              {rows.length > 1 && (
                <InputGroupAddon>
                  <Button
                    variant="ghost"
                    size="icon"
                    accessibilityLabel={t('removeLink', { number: index + 1 })}
                    onPress={() => commit(rows.filter((_, position) => position !== index))}
                  >
                    <ButtonIcon icon={X} />
                  </Button>
                </InputGroupAddon>
              )}
            </InputGroup>
            <FieldError>{invalid ? t('linkInvalid') : null}</FieldError>
          </Field>
        );
      })}
      <Button variant="secondary" size="sm" style={styles.add} onPress={() => setRows([...rows, ''])}>
        <ButtonIcon icon={Plus} />
        <ButtonText>{t('addLink')}</ButtonText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: SPACING.sm },
  add: { alignSelf: 'flex-start' }
});
