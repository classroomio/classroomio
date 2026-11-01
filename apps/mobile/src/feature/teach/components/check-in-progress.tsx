import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { Avatar } from '@/feature/common/components/avatar';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/feature/common/components/item';
import { Progress } from '@/feature/common/components/progress';
import { Text } from '@/feature/common/components/text';
import { SPACING } from '@/feature/common/constants/layout';
import { DURATION, EASE_OUT } from '@/feature/common/constants/motion';
import { parseTimestamp } from '@/feature/common/helpers/time-ago';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { learnerName, learnersOf } from '@/feature/teach/helpers/use-attendance-roster';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { TeachCourse } from '@/feature/teach/types/teach';

/** Who has checked in to a session so far, newest first, against everyone enrolled. */
export function CheckInProgress({ course, lessonId }: { course: TeachCourse; lessonId: string }) {
  const t = useTranslations(teachCatalog);
  const format = useFormatters();
  const learners = learnersOf(course);
  const checkIns = learners
    .flatMap((learner) => {
      const record = course.attendance.find((item) => item.lessonId === lessonId && item.studentId === learner.id);
      if (!record?.checkedInAt || record.status === 'absent') return [];

      return [{ learner, status: record.status, at: parseTimestamp(record.checkedInAt) }];
    })
    .sort((first, second) => second.at - first.at);
  const percent = learners.length > 0 ? (checkIns.length / learners.length) * 100 : 0;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text variant="subheading" accessibilityRole="header" style={styles.tabular}>
          {t('checkedInProgress', { checked: checkIns.length, count: learners.length })}
        </Text>
        <Progress value={percent} />
      </View>
      {checkIns.length === 0 ? (
        <Text variant="caption" tone="muted">
          {t('noCheckInsYet')}
        </Text>
      ) : (
        <Animated.View layout={LinearTransition.duration(DURATION.base).easing(EASE_OUT)}>
          <ItemGroup>
            {checkIns.map(({ learner, status, at }) => {
              const name = learnerName(learner) ?? t('invitedLearner');

              return (
                <Animated.View key={learner.id} entering={FadeInDown.duration(DURATION.base).easing(EASE_OUT)}>
                  <Item>
                    <ItemMedia>
                      <Avatar name={name} uri={learner.profile?.avatarUrl} size={32} />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle numberOfLines={1}>{name}</ItemTitle>
                      <ItemDescription numberOfLines={1}>
                        {t('checkedInTime', { time: format.time(new Date(at)) })}
                      </ItemDescription>
                    </ItemContent>
                    <Text variant="captionStrong" tone={status === 'late' ? 'warning' : 'success'}>
                      {status === 'late' ? t('statusLate') : t('present')}
                    </Text>
                  </Item>
                </Animated.View>
              );
            })}
          </ItemGroup>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: SPACING.sm },
  header: { gap: SPACING.xs },
  tabular: { fontVariant: ['tabular-nums'] }
});
