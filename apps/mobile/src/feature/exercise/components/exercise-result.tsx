import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleMinus,
  CircleX,
  Clock,
  type LucideIcon
} from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Card, CardContent } from '@/feature/common/components/card';
import { HtmlContent } from '@/feature/common/components/html-content';
import { Icon } from '@/feature/common/components/icon';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/feature/common/components/item';
import { NotchCard } from '@/feature/common/components/notch-card';
import { ProgressRing } from '@/feature/common/components/progress';
import { ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { Text, type TextTone } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { answerSummaryOf } from '@/feature/exercise/helpers/answer-summary';
import { formatDateTime, formatScore } from '@/feature/exercise/helpers/format';
import { plainTextOf, questionKeyOf } from '@/feature/exercise/helpers/question-model';
import type {
  AttemptOutcome,
  ExerciseAttempt,
  ExerciseAttempts,
  ExerciseMessageKey,
  ExerciseQuestion
} from '@/feature/exercise/types/exercise';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

const OUTCOME_COPY: Record<AttemptOutcome, { title: ExerciseMessageKey; tone: TextTone; icon: LucideIcon }> = {
  awaiting_grade: { title: 'outcomeAwaitingGrade', tone: 'muted', icon: Clock },
  graded: { title: 'outcomeGraded', tone: 'ink', icon: CircleCheck },
  passed: { title: 'outcomePassed', tone: 'success', icon: CircleCheck },
  failed: { title: 'outcomeFailed', tone: 'danger', icon: CircleX }
};

type ResultSummaryProps = { attempt: ExerciseAttempt; summary: ExerciseAttempts };

export function ResultSummary({ attempt, summary }: ResultSummaryProps) {
  const t = useTranslations(exerciseCatalog);
  const format = useFormatters();
  const copy = OUTCOME_COPY[attempt.outcome];
  const graded = attempt.outcome !== 'awaiting_grade';
  const percent = attempt.scorePercent ?? 0;
  const details = [
    graded && attempt.score !== null
      ? t('scoreOfTotal', {
          count: summary.totalPoints,
          score: formatScore(attempt.score, format),
          total: formatScore(summary.totalPoints, format)
        })
      : null,
    summary.passThreshold !== null ? t('passMarkInline', { percent: format.percent(summary.passThreshold) }) : null
  ].filter(Boolean);

  return (
    <NotchCard style={styles.summary}>
      {graded ? (
        <View style={styles.ring}>
          <ProgressRing value={percent} size={92} strokeWidth={6} />
          <View style={StyleSheet.absoluteFill}>
            <View style={styles.ringLabel}>
              <Text variant="heading" style={styles.tabular}>
                {format.percent(percent)}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <Icon icon={Clock} size={32} tone="muted" />
      )}
      <View style={styles.summaryText}>
        <View style={styles.outcome}>
          <Icon icon={copy.icon} size={18} tone={copy.tone} />
          <Text variant="heading" tone={copy.tone}>
            {t(copy.title)}
          </Text>
        </View>
        <Text variant="caption" tone="muted" style={styles.center}>
          {graded ? details.join(' · ') : t('awaitingGradeDescription')}
        </Text>
        <Text variant="micro" tone="subtle">
          {t('attemptSubmitted', {
            number: attempt.attemptNumber,
            date: formatDateTime(attempt.submittedAt, format.locale)
          })}
        </Text>
      </View>
    </NotchCard>
  );
}

export function ResultFeedback({ feedback }: { feedback: string | null }) {
  const t = useTranslations(exerciseCatalog);
  const text = plainTextOf(feedback);
  if (!text) return null;

  return (
    <ScreenSection>
      <ScreenSectionHeader title={t('tutorFeedback')} />
      <Card>
        <CardContent>
          <HtmlContent html={feedback} preserveLineBreaks />
        </CardContent>
      </Card>
    </ScreenSection>
  );
}

type ResultBreakdownProps = { attempt: ExerciseAttempt; questions: ExerciseQuestion[] };

export function ResultBreakdown({ attempt, questions }: ResultBreakdownProps) {
  const t = useTranslations(exerciseCatalog);
  const format = useFormatters();
  const answerByQuestion = new Map(attempt.answers.map((answer) => [String(answer.questionId), answer]));

  return (
    <ScreenSection>
      <ScreenSectionHeader title={t('questionBreakdown')} />
      <ItemGroup>
        {questions.map((question, index) => {
          const row = answerByQuestion.get(questionKeyOf(question));
          const maxPoints = Number(question.points ?? 0);
          const points = row?.points ?? null;
          const { icon, tone } =
            points === null
              ? { icon: Clock, tone: 'subtle' as const }
              : points >= maxPoints && maxPoints > 0
                ? { icon: CircleCheck, tone: 'success' as const }
                : points <= 0
                  ? { icon: CircleX, tone: 'danger' as const }
                  : { icon: CircleMinus, tone: 'warning' as const };
          const score =
            points === null
              ? t('pointsNotGraded', { count: maxPoints, points: formatScore(maxPoints, format) })
              : t('scoreOfTotal', {
                  count: maxPoints,
                  score: formatScore(points, format),
                  total: formatScore(maxPoints, format)
                });

          return (
            <Item key={questionKeyOf(question)}>
              <ItemMedia>
                <Icon icon={icon} size={20} tone={tone} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{`${index + 1}. ${plainTextOf(question.title)}`}</ItemTitle>
                <ItemDescription>{`${score} · ${answerSummaryOf(question, row?.answerData, t, format)}`}</ItemDescription>
              </ItemContent>
            </Item>
          );
        })}
      </ItemGroup>
    </ScreenSection>
  );
}

type AttemptSwitcherProps = { index: number; total: number; onChange: (index: number) => void };

export function AttemptSwitcher({ index, total, onChange }: AttemptSwitcherProps) {
  const t = useTranslations(exerciseCatalog);
  if (total < 2) return null;

  return (
    <View style={styles.switcher}>
      <Button
        variant="ghost"
        size="icon"
        accessibilityLabel={t('previousAttempt')}
        disabled={index === 0}
        onPress={() => onChange(index - 1)}
      >
        <ButtonIcon icon={ChevronLeft} />
      </Button>
      <Text variant="captionStrong" tone="muted">
        {t('attemptPosition', { current: index + 1, total })}
      </Text>
      <Button
        variant="ghost"
        size="icon"
        accessibilityLabel={t('nextAttempt')}
        disabled={index === total - 1}
        onPress={() => onChange(index + 1)}
      >
        <ButtonIcon icon={ChevronRight} />
      </Button>
    </View>
  );
}

type ResultActionsProps = { canRetake: boolean; isLatest: boolean; onRetake: () => void; onDone: () => void };

export function ResultActions({ canRetake, isLatest, onRetake, onDone }: ResultActionsProps) {
  const t = useTranslations(exerciseCatalog);

  return (
    <View style={styles.actions}>
      {canRetake && isLatest && (
        <Button size="lg" onPress={onRetake}>
          <ButtonText>{t('retakeExercise')}</ButtonText>
        </Button>
      )}
      <Button variant={canRetake && isLatest ? 'outline' : 'primary'} size="lg" onPress={onDone}>
        <ButtonText>{t('backToCourse')}</ButtonText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: { alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xl },
  ring: { width: 92, height: 92 },
  ringLabel: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabular: { fontVariant: ['tabular-nums'] },
  summaryText: { alignItems: 'center', gap: SPACING.xxs },
  outcome: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  center: { textAlign: 'center' },
  switcher: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs },
  actions: { gap: SPACING.xs }
});
