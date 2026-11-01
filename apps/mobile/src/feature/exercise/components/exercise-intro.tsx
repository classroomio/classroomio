import { CalendarDotsIcon } from 'phosphor-react-native/src/icons/CalendarDots';
import { ClipboardTextIcon } from 'phosphor-react-native/src/icons/ClipboardText';
import { ListChecksIcon } from 'phosphor-react-native/src/icons/ListChecks';
import { RepeatIcon } from 'phosphor-react-native/src/icons/Repeat';
import { TargetIcon } from 'phosphor-react-native/src/icons/Target';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonText } from '@/feature/common/components/button';
import { HtmlContent } from '@/feature/common/components/html-content';
import type { AppIcon } from '@/feature/common/components/icon';
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from '@/feature/common/components/item';
import { IconTile, type IconTileTone } from '@/feature/common/components/icon-tile';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { formatDateTime, formatPoints, isPast } from '@/feature/exercise/helpers/format';
import { activeQuestionsOf, plainTextOf, totalPointsOf } from '@/feature/exercise/helpers/question-model';
import type { Exercise } from '@/feature/exercise/types/exercise';
import { exerciseCatalog } from '@/feature/exercise/translations/catalog';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

function IntroFact({
  icon,
  tone,
  children,
  danger
}: {
  icon: AppIcon;
  tone?: IconTileTone;
  children: string;
  danger?: boolean;
}) {
  return (
    <Item>
      <ItemMedia>
        <IconTile icon={icon} tone={tone} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle tone={danger ? 'danger' : 'ink'}>{children}</ItemTitle>
      </ItemContent>
    </Item>
  );
}

/** What the learner is about to take: the title, the facts that shape the attempt and the instructions. */
export function ExerciseIntro({ exercise }: { exercise: Exercise }) {
  const t = useTranslations(exerciseCatalog);
  const format = useFormatters();
  const { colors } = useTheme();
  const questions = activeQuestionsOf(exercise);
  const description = plainTextOf(exercise.description);
  const overdue = isPast(exercise.dueBy);

  return (
    <View style={styles.wrap}>
      <View style={styles.heading}>
        <IconTile icon={ClipboardTextIcon} tone="primary" size={52} />
        <Text variant="display" accessibilityRole="header">
          {exercise.title}
        </Text>
      </View>

      <ItemGroup>
        <IntroFact icon={ListChecksIcon}>
          {`${t('questionCount', { count: questions.length })} · ${formatPoints(totalPointsOf(questions), t, format)}`}
        </IntroFact>
        {exercise.dueBy ? (
          <IntroFact icon={CalendarDotsIcon} tone={overdue ? 'danger' : 'neutral'} danger={overdue}>
            {t(overdue ? 'wasDueOn' : 'dueOn', { date: formatDateTime(exercise.dueBy, format.locale) })}
          </IntroFact>
        ) : null}
        <IntroFact icon={RepeatIcon}>
          {t(exercise.allowMultipleAttempts ? 'multipleAttempts' : 'singleAttempt')}
        </IntroFact>
        {exercise.completionPolicy === 'passed' ? (
          <IntroFact icon={TargetIcon}>
            {t('passMark', { percent: format.percent(Number(exercise.passThreshold ?? 100)) })}
          </IntroFact>
        ) : null}
      </ItemGroup>

      {description ? <HtmlContent html={exercise.description} /> : null}

      <Text variant="caption" tone="muted">
        {t('introSavingNote')}
      </Text>
    </View>
  );
}

export function ExerciseIntroStart({ exercise, onStart }: { exercise: Exercise; onStart: () => void }) {
  const t = useTranslations(exerciseCatalog);
  const empty = activeQuestionsOf(exercise).length === 0;

  return (
    <Button size="lg" onPress={onStart} disabled={empty}>
      <ButtonText>{t(empty ? 'noQuestionsYet' : 'startExercise')}</ButtonText>
    </Button>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACING.xl },
  heading: { gap: SPACING.md }
});
