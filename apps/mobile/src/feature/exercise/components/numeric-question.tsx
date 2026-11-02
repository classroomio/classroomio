import { useState } from 'react';

import { Field, FieldError } from '@/feature/common/components/field';
import { Input } from '@/feature/common/components/input';
import { useQuestionAnswer } from '@/feature/exercise/components/exercise-session';
import { useQuestionShell } from '@/feature/exercise/components/question-shell';
import type { ExerciseQuestion } from '@/feature/exercise/types/exercise';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

function parseNumber(text: string) {
  const normalized = text.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/i.test(normalized)) return null;

  const value = Number(normalized);

  return Number.isFinite(value) ? value : null;
}

export function NumericQuestion({ question }: { question: ExerciseQuestion }) {
  const t = useTranslations(exerciseCatalog);
  const { problem } = useQuestionShell();
  const { answer, setAnswer } = useQuestionAnswer(question, 'NUMERIC');
  const [draft, setDraft] = useState(answer ? String(answer.value) : '');
  const invalid = draft.trim().length > 0 && parseNumber(draft) === null;

  return (
    <Field invalid={invalid || Boolean(problem)}>
      <Input
        value={draft}
        placeholder={t('numberPlaceholder')}
        accessibilityLabel={t('yourAnswer')}
        keyboardType="numbers-and-punctuation"
        returnKeyType="done"
        onChangeText={(next) => {
          setDraft(next);
          const value = parseNumber(next);
          setAnswer(value === null ? null : { type: 'NUMERIC', value });
        }}
      />
      <FieldError>{invalid ? t('numberInvalid') : null}</FieldError>
    </Field>
  );
}
