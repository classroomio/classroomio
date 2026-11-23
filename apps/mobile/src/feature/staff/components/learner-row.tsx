import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { HandWavingIcon } from 'phosphor-react-native/src/icons/HandWaving';

import { Avatar } from '@/feature/common/components/avatar';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '@/feature/common/components/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle
} from '@/feature/common/components/item';
import { Text } from '@/feature/common/components/text';
import { parseTimestamp, timeAgo } from '@/feature/common/helpers/time-ago';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { daysSince } from '@/feature/teach/helpers/relative-time';
import { staffCatalog } from '@/feature/staff/translations/catalog';
import type { TeachingLearner } from '@/feature/staff/types/staff';

type LearnerRowProps = {
  learner: TeachingLearner;
  nudging: boolean;
  onNudge: (learner: TeachingLearner) => void;
};

/** A student enrollment in a taught course, with progress, last activity, why they stalled, and a nudge action. */
export function LearnerRow({ learner, nudging, onNudge }: LearnerRowProps) {
  const t = useTranslations(staffCatalog);
  const format = useFormatters();
  const locale = useLocale();
  const name = learner.fullname || learner.email || t('learnerFallback');
  const progress = learner.completed
    ? t('learnerCompleted')
    : t('progressComplete', { percent: format.percent(learner.progressPercent) });
  const active = learner.lastActivityAt
    ? t('lastActive', { time: timeAgo(learner.lastActivityAt, Date.now(), locale) })
    : t('neverActive');
  const idleDays = daysSince(learner.lastActivityAt);
  const reason = !learner.needsNudge
    ? null
    : learner.nudgeReason === 'failed_quiz' && learner.failedExercise
      ? t('reasonFailedQuiz', { exercise: learner.failedExercise.title })
      : idleDays !== null
        ? t('reasonInactive', { count: idleDays })
        : t('reasonInactiveNever');
  const nudgeLocked = learner.nextNudgeAt !== null && parseTimestamp(learner.nextNudgeAt) > Date.now();

  return (
    <Item>
      <ItemMedia>
        <Avatar name={name} uri={learner.avatarUrl} size={40} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle numberOfLines={1}>{name}</ItemTitle>
        <ItemDescription numberOfLines={1}>{learner.course.title}</ItemDescription>
        <Text variant="caption" tone="subtle" numberOfLines={2}>
          {[progress, active].join(' · ')}
        </Text>
        {reason ? (
          <Text variant="caption" tone="warning" numberOfLines={2}>
            {reason}
          </Text>
        ) : null}
      </ItemContent>
      {!learner.completed ? (
        <ItemActions>
          <Button
            variant="secondary"
            size="sm"
            disabled={nudgeLocked || nudging}
            accessibilityLabel={
              nudgeLocked
                ? t('nudgedA11y', { name, course: learner.course.title })
                : t('nudgeA11y', { name, course: learner.course.title })
            }
            onPress={() => onNudge(learner)}
          >
            {nudging ? <ButtonSpinner /> : <ButtonIcon icon={nudgeLocked ? CheckIcon : HandWavingIcon} />}
            <ButtonText>{nudgeLocked ? t('nudged') : t('nudge')}</ButtonText>
          </Button>
        </ItemActions>
      ) : null}
    </Item>
  );
}
