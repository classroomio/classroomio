import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { Image } from 'expo-image';
import { createContext, use, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { HtmlContent } from '@/feature/common/components/html-content';
import { Icon } from '@/feature/common/components/icon';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { QUESTION_TYPE_LABEL_KEY } from '@/feature/exercise/constants/question-types';
import { formatPoints } from '@/feature/exercise/helpers/format';
import {
  isQuestionRequired,
  plainTextOf,
  questionImageUrlsOf,
  questionTypeOf,
  stringSetting
} from '@/feature/exercise/helpers/question-model';
import type { ExerciseQuestion } from '@/feature/exercise/types/exercise';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

type QuestionShellValue = { question: ExerciseQuestion; number: number; total: number; problem: string | null };

const QuestionShellContext = createContext<QuestionShellValue | null>(null);

export function useQuestionShell() {
  const shell = use(QuestionShellContext);
  if (!shell) throw new Error('useQuestionShell must be used inside QuestionShell');

  return shell;
}

type QuestionShellProps = QuestionShellValue & { children: ReactNode };

export function QuestionShell({ question, number, total, problem, children }: QuestionShellProps) {
  return (
    <QuestionShellContext value={{ question, number, total, problem }}>
      <View style={styles.shell}>{children}</View>
    </QuestionShellContext>
  );
}

export function QuestionHeader() {
  const { question, number, total } = useQuestionShell();
  const t = useTranslations(exerciseCatalog);
  const format = useFormatters();
  const type = questionTypeOf(question);
  const meta = [
    t('questionPosition', { number, total }),
    type ? t(QUESTION_TYPE_LABEL_KEY[type]) : null,
    formatPoints(Number(question.points ?? 0), t, format),
    isQuestionRequired(question) ? null : t('optional')
  ].filter(Boolean);

  return (
    <View style={styles.header}>
      <Text variant="captionStrong" tone="muted">
        {meta.join(' · ')}
      </Text>
      <Text variant="title" accessibilityRole="header">
        {plainTextOf(question.title)}
      </Text>
    </View>
  );
}

export function QuestionDescription() {
  const { question } = useQuestionShell();
  const description = stringSetting(question, 'description');
  if (!plainTextOf(description)) return null;

  return <HtmlContent html={description} size="compact" />;
}

export function QuestionMedia() {
  const { question } = useQuestionShell();
  const { colors } = useTheme();
  const t = useTranslations(exerciseCatalog);
  const urls = questionImageUrlsOf(question);
  if (urls.length === 0 || questionTypeOf(question) === 'HOTSPOT') return null;

  return (
    <View style={styles.media}>
      {urls.map((url) => (
        <Image
          key={url}
          source={{ uri: url }}
          contentFit="contain"
          transition={150}
          accessibilityLabel={t('questionImage')}
          style={[styles.image, { backgroundColor: colors.muted, borderColor: colors.border }]}
        />
      ))}
    </View>
  );
}

export function QuestionBody({ children }: { children: ReactNode }) {
  return <View style={styles.body}>{children}</View>;
}

export function QuestionProblem() {
  const { problem } = useQuestionShell();
  if (!problem) return null;

  return (
    <View style={styles.problem} accessibilityLiveRegion="polite">
      <Icon icon={WarningCircleIcon} size={16} tone="danger" />
      <Text variant="caption" tone="danger" style={styles.problemText}>
        {problem}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { gap: SPACING.lg },
  header: { gap: SPACING.xs },
  media: { gap: SPACING.xs },
  image: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: RADII.lg,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth * 2
  },
  body: { gap: SPACING.sm },
  problem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  problemText: { flex: 1 }
});
