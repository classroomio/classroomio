import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { WarningIcon } from 'phosphor-react-native/src/icons/Warning';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { StyleSheet, View } from 'react-native';

import { cohortCatalog } from '@/feature/cohort/translations/catalog';
import type { CohortGoal, CohortGoalStatus } from '@/feature/cohort/types/cohort';
import { Icon, type AppIcon } from '@/feature/common/components/icon';
import { ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle, Item } from '@/feature/common/components/item';
import { ProgressRing } from '@/feature/common/components/progress';
import { Text, type TextTone } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { relativeDays } from '@/feature/course/helpers/compliance-deadline';
import { daysUntil, formatDay } from '@/feature/course/helpers/format-date';
import { courseCatalog } from '@/feature/course/translations/catalog';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

const STATUS = {
  not_started: { key: 'goalNotStarted', tone: 'muted', icon: null },
  in_progress: { key: 'goalInProgress', tone: 'primary', icon: null },
  completed: { key: 'goalCompleted', tone: 'success', icon: CheckCircleIcon },
  at_risk: { key: 'goalAtRisk', tone: 'warning', icon: WarningIcon },
  overdue: { key: 'goalOverdue', tone: 'danger', icon: WarningCircleIcon },
  waived: { key: 'goalWaived', tone: 'muted', icon: null }
} as const satisfies Record<CohortGoalStatus, { key: string; tone: TextTone; icon: AppIcon | null }>;

export function CohortGoalList({ goals }: { goals: CohortGoal[] }) {
  return (
    <ItemGroup>
      {goals.map((goal) => (
        <CohortGoalRow key={goal.id} goal={goal} />
      ))}
    </ItemGroup>
  );
}

/** One goal assigned to the learner: progress against it, its deadline and the status the server evaluated. */
function CohortGoalRow({ goal }: { goal: CohortGoal }) {
  const t = useTranslations(cohortCatalog);
  const tc = useTranslations(courseCatalog);
  const locale = useLocale();
  const status = STATUS[goal.status];
  const percent = goal.requiredCount > 0 ? (goal.completedCount / goal.requiredCount) * 100 : 0;
  const progress = t('goalProgress', { completed: goal.completedCount, required: goal.requiredCount });
  const due = goal.dueDate
    ? t('goalDue', { date: formatDay(goal.dueDate, locale), relative: relativeDays(daysUntil(goal.dueDate), tc) })
    : null;
  const settled = goal.status === 'completed' || goal.status === 'waived';

  return (
    <Item
      accessibilityLabel={[goal.goal.title, t(status.key), progress, settled ? null : due].filter(Boolean).join(', ')}
    >
      <ItemMedia>
        <ProgressRing value={goal.status === 'completed' ? 100 : percent} size={40} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{goal.goal.title}</ItemTitle>
        <ItemDescription numberOfLines={1}>
          {[progress, settled ? null : due].filter(Boolean).join(' · ')}
        </ItemDescription>
        <View style={styles.status}>
          {status.icon ? <Icon icon={status.icon} size={14} tone={status.tone} weight="fill" /> : null}
          <Text variant="captionStrong" tone={status.tone}>
            {t(status.key)}
          </Text>
        </View>
      </ItemContent>
    </Item>
  );
}

const styles = StyleSheet.create({
  status: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xxs, marginTop: 2 }
});
