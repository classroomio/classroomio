import { CalendarClock, ListChecks, Repeat, Target, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonText } from '@/feature/common/components/button';
import { HtmlContent } from '@/feature/common/components/html-content';
import { Icon } from '@/feature/common/components/icon';
import { NotchCard } from '@/feature/common/components/notch-card';
import { Text, type TextTone } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { formatDateTime, formatPoints, isPast } from '@/feature/exercise/helpers/format';
import { activeQuestionsOf, plainTextOf, totalPointsOf } from '@/feature/exercise/helpers/question-model';
import type { Exercise } from '@/feature/exercise/types/exercise';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

function IntroFact({ icon, children, tone }: { icon: LucideIcon; children: string; tone?: TextTone }) {
  return (
    <View style={styles.fact}>
      <Icon icon={icon} size={18} tone={tone ?? 'muted'} />
      <Text variant="body" tone={tone ?? 'body'} style={styles.factText}>
        {children}
      </Text>
    </View>
  );
}

type ExerciseIntroProps = { exercise: Exercise; onStart: () => void };

export function ExerciseIntro({ exercise, onStart }: ExerciseIntroProps) {
  const t = useTranslations(exerciseCatalog);
  const format = useFormatters();
  const questions = activeQuestionsOf(exercise);
  const description = plainTextOf(exercise.description);
  const overdue = isPast(exercise.dueBy);

  return (
    <View style={styles.wrap}>
      <NotchCard style={styles.card}>
        <Text variant="title" accessibilityRole="header">
          {exercise.title}
        </Text>
        <View style={styles.facts}>
          <IntroFact icon={ListChecks}>
            {`${t('questionCount', { count: questions.length })} · ${formatPoints(totalPointsOf(questions), t, format)}`}
          </IntroFact>
          {exercise.dueBy ? (
            <IntroFact icon={CalendarClock} tone={overdue ? 'danger' : undefined}>
              {t(overdue ? 'wasDueOn' : 'dueOn', { date: formatDateTime(exercise.dueBy, format.locale) })}
            </IntroFact>
          ) : null}
          <IntroFact icon={Repeat}>
            {t(exercise.allowMultipleAttempts ? 'multipleAttempts' : 'singleAttempt')}
          </IntroFact>
          {exercise.completionPolicy === 'passed' ? (
            <IntroFact icon={Target}>
              {t('passMark', { percent: format.percent(Number(exercise.passThreshold ?? 100)) })}
            </IntroFact>
          ) : null}
        </View>
      </NotchCard>

      {description ? <HtmlContent html={exercise.description} /> : null}

      <Text variant="caption" tone="muted">
        {t('introSavingNote')}
      </Text>

      <Button size="lg" onPress={onStart} disabled={questions.length === 0}>
        <ButtonText>{t(questions.length === 0 ? 'noQuestionsYet' : 'startExercise')}</ButtonText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACING.lg },
  card: { gap: SPACING.md },
  facts: { gap: SPACING.xs },
  fact: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  factText: { flex: 1 }
});
