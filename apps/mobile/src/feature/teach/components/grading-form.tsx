import { SparkleIcon } from 'phosphor-react-native/src/icons/Sparkle';
import { createContext, use, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import { Card } from '@/feature/common/components/card';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/feature/common/components/field';
import { InputGroup, InputGroupInput } from '@/feature/common/components/input';
import { Icon } from '@/feature/common/components/icon';
import { Text } from '@/feature/common/components/text';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { QUESTION_TYPE_KEYS } from '@/feature/teach/constants/question-types';
import { htmlToText } from '@/feature/teach/helpers/rich-text';
import {
  isScorable,
  maxPointsOf,
  scoreError,
  useGradingForm,
  type GradingFormState,
  type ScoreError
} from '@/feature/teach/helpers/use-grading-form';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { GradingQuestion as GradingQuestionData, GradingSubmission } from '@/feature/teach/types/teach';

import { AnswerView } from './answer-view';
import { ScoreStepper } from './score-stepper';

const GradingFormContext = createContext<GradingFormState | null>(null);

export function useGradingFormContext() {
  const form = use(GradingFormContext);
  if (!form) throw new Error('useGradingFormContext must be used inside GradingForm');

  return form;
}

type GradingFormProps = {
  submission: GradingSubmission;
  children: ReactNode | ((form: GradingFormState) => ReactNode);
};

/** Owns the scores and feedback for one submission; mount with a `key` of the submission id to reset between items. */
export function GradingForm({ submission, children }: GradingFormProps) {
  const form = useGradingForm(submission);

  return (
    <GradingFormContext value={form}>{typeof children === 'function' ? children(form) : children}</GradingFormContext>
  );
}

const GradingQuestionContext = createContext<{ question: GradingQuestionData; number: number } | null>(null);

function useGradingQuestion() {
  const value = use(GradingQuestionContext);
  if (!value) throw new Error('GradingQuestion parts must be used inside GradingQuestion');

  return value;
}

type GradingQuestionProps = { question: GradingQuestionData; number: number; children: ReactNode };

export function GradingQuestion({ question, number, children }: GradingQuestionProps) {
  return (
    <GradingQuestionContext value={{ question, number }}>
      <Card style={styles.question}>{children}</Card>
    </GradingQuestionContext>
  );
}

const SCORE_ERROR_KEYS = {
  empty: 'scoreEmpty',
  notWhole: 'scoreNotWhole',
  tooHigh: 'scoreTooHigh'
} as const satisfies Record<ScoreError, string>;

export function GradingQuestionHeader() {
  const t = useTranslations(teachCatalog);
  const { question, number } = useGradingQuestion();
  const points = maxPointsOf(question);

  return (
    <View style={styles.header}>
      <View style={styles.headerMeta}>
        <Text variant="micro" tone="muted">
          {t('questionHeading', { number, type: t(QUESTION_TYPE_KEYS[question.type]) })}
        </Text>
        <Text variant="micro" tone="muted">
          {t('points', { count: points })}
        </Text>
      </View>
      <Text variant="bodyStrong" accessibilityRole="header">
        {htmlToText(question.title)}
      </Text>
    </View>
  );
}

export function GradingQuestionAnswer() {
  const { question } = useGradingQuestion();

  return (
    <View style={styles.answer}>
      <AnswerView question={question} />
    </View>
  );
}

export function GradingQuestionScore() {
  const t = useTranslations(teachCatalog);
  const { colors } = useTheme();
  const { question, number } = useGradingQuestion();
  const form = useGradingFormContext();
  const value = form.scores[question.id] ?? '';
  const error = form.showErrors ? scoreError(question, value) : null;

  if (!isScorable(question)) {
    return (
      <View style={[styles.scoreRow, { borderTopColor: colors.border }]}>
        <Text variant="caption" tone="muted">
          {t('notAnswered')}
        </Text>
      </View>
    );
  }

  const automatic =
    question.autoGradable && question.startingPoints !== null && value === String(question.startingPoints);

  return (
    <View style={[styles.scoreRow, { borderTopColor: colors.border }]}>
      <Field invalid={Boolean(error)} style={styles.scoreField}>
        <FieldLabel>{t('score')}</FieldLabel>
        <ScoreStepper
          value={value}
          max={maxPointsOf(question)}
          onChange={(next) => form.setScore(question.id, next)}
          accessibilityLabel={t('scoreForQuestion', { number })}
        />
        {error ? (
          <FieldError>{t(SCORE_ERROR_KEYS[error], { max: maxPointsOf(question) })}</FieldError>
        ) : automatic ? (
          <View style={styles.automatic}>
            <Icon icon={SparkleIcon} size={13} tone="muted" />
            <FieldDescription>{t('scoredAutomatically')}</FieldDescription>
          </View>
        ) : null}
      </Field>
    </View>
  );
}

export function GradingFeedbackField() {
  const t = useTranslations(teachCatalog);
  const form = useGradingFormContext();

  return (
    <Field>
      <FieldLabel>{t('feedback')}</FieldLabel>
      <InputGroup style={styles.feedbackGroup}>
        <InputGroupInput
          value={form.feedback}
          onChangeText={form.setFeedback}
          multiline
          textAlignVertical="top"
          placeholder={t('feedbackPlaceholder')}
          style={styles.feedbackInput}
        />
      </InputGroup>
      <FieldDescription>{t('feedbackDescription')}</FieldDescription>
    </Field>
  );
}

type GradingSaveBarProps = {
  label: string;
  saving: boolean;
  onSave: (form: GradingFormState) => void;
};

/** Total and save action pinned above the keyboard. Place it after the scroll view in a flex container. */
export function GradingSaveBar({ label, saving, onSave }: GradingSaveBarProps) {
  const t = useTranslations(teachCatalog);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const form = useGradingFormContext();

  return (
    <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
      <View
        style={[
          styles.saveBar,
          {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + SPACING.sm
          }
        ]}
      >
        <View
          style={styles.total}
          accessible
          accessibilityLabel={t('totalA11y', { total: form.total, count: form.maxPoints })}
        >
          <Text variant="micro" tone="muted">
            {t('total')}
          </Text>
          <Text variant="heading" style={styles.totalValue}>
            {form.total}
            <Text variant="caption" tone="muted">
              {' '}
              / {form.maxPoints}
            </Text>
          </Text>
        </View>
        <Button size="lg" disabled={saving} onPress={() => onSave(form)} style={styles.saveButton}>
          {saving ? <ButtonSpinner /> : <ButtonText>{label}</ButtonText>}
        </Button>
      </View>
    </KeyboardStickyView>
  );
}

const styles = StyleSheet.create({
  question: { gap: 0 },
  header: { gap: SPACING.xs - 2, paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  headerMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.sm },
  answer: { paddingHorizontal: SPACING.md },
  scoreRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    marginTop: SPACING.sm
  },
  scoreField: { gap: SPACING.xs },
  automatic: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  feedbackGroup: { alignItems: 'stretch', minHeight: 120 },
  feedbackInput: { minHeight: 120 },
  saveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: GUTTER,
    paddingTop: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth * 2
  },
  total: { gap: 0 },
  totalValue: { fontVariant: ['tabular-nums'] },
  saveButton: { flex: 1 }
});
