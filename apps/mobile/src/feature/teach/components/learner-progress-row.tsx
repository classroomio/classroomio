import { StyleSheet, View } from 'react-native';

import { Avatar } from '@/feature/common/components/avatar';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle
} from '@/feature/common/components/item';
import { ProgressRing } from '@/feature/common/components/progress';
import { Text } from '@/feature/common/components/text';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { AGO_KEYS, elapsedCopy } from '@/feature/teach/helpers/relative-time';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { CourseAnalyticsLearner } from '@/feature/teach/types/teach';

export function LearnerProgressRow({ learner }: { learner: CourseAnalyticsLearner }) {
  const t = useTranslations(teachCatalog);
  const format = useFormatters();
  const name = learner.profile.fullname || learner.profile.email || t('learnerFallback');
  const progress = Math.round(learner.progressPercentage);
  const percent = format.percent(progress);
  const lessons = t('lessonsProgress', { completed: learner.lessonsCompleted, count: learner.totalLessons });
  const ago = elapsedCopy(t, AGO_KEYS, learner.lastSeen);
  const seen = ago ? t('seenAgo', { ago }) : t('notSeenYet');

  return (
    <Item accessibilityLabel={t('learnerProgressA11y', { name, percent, lessons, seen })}>
      <ItemMedia>
        <Avatar name={name} uri={learner.profile.avatar_url || null} size={36} />
      </ItemMedia>
      <ItemContent>
        <ItemTitle numberOfLines={1}>{name}</ItemTitle>
        <ItemDescription numberOfLines={1}>
          {lessons} · {seen}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <View style={styles.progress}>
          <ProgressRing value={progress} size={34} />
          <Text variant="micro" tone="muted" style={styles.percent}>
            {percent}
          </Text>
        </View>
      </ItemActions>
    </Item>
  );
}

const styles = StyleSheet.create({
  progress: { alignItems: 'center', justifyContent: 'center' },
  percent: { position: 'absolute', fontSize: 10, letterSpacing: -0.2 }
});
