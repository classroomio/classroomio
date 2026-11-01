import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonText } from '@/feature/common/components/button';
import { Card } from '@/feature/common/components/card';
import { PressableScale } from '@/feature/common/components/pressable-scale';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { parseTimestamp } from '@/feature/common/helpers/time-ago';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { formatSessionTime } from '@/feature/course/helpers/format-date';
import type { NextLiveClass } from '@/feature/course/helpers/home-sections';
import { courseCatalog } from '@/feature/course/translations/catalog';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useOpenLink } from '@/feature/lesson/helpers/open-external';

/** The learner's next live class, with its date at a glance and a way straight into the call. */
export function NextLiveClassCard({ next }: { next: NextLiveClass }) {
  const t = useTranslations(courseCatalog);
  const format = useFormatters();
  const { colors } = useTheme();
  const { openInSystem } = useOpenLink();
  const { course, session, live } = next;
  const startsAt = new Date(parseTimestamp(session.lessonAt));
  const time = formatSessionTime(session.lessonAt, format.locale);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${live ? t('liveNow') : t('nextLiveClass')}, ${session.lessonTitle}, ${course.title}, ${time}`}
      scaleTo={0.985}
      onPress={() =>
        router.push({
          pathname: '/course/[courseId]/lesson/[lessonId]',
          params: { courseId: course.id, lessonId: session.lessonId }
        })
      }
    >
      <Card style={styles.card}>
        <View style={[styles.date, { backgroundColor: live ? colors.primary : colors.primaryTint }]}>
          <Text variant="micro" tone={live ? 'onPrimary' : 'primary'}>
            {format.monthShort(startsAt)}
          </Text>
          <Text variant="title" tone={live ? 'onPrimary' : 'primary'}>
            {format.dayOfMonth(startsAt)}
          </Text>
        </View>
        <View style={styles.copy}>
          <Text variant="captionStrong" tone={live ? 'primary' : 'muted'} numberOfLines={1}>
            {live ? t('liveNow') : time}
          </Text>
          <Text variant="bodyStrong" numberOfLines={1}>
            {session.lessonTitle}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {course.title}
          </Text>
        </View>
        <Button size="sm" variant={live ? 'primary' : 'outline'} onPress={() => openInSystem(session.callUrl)}>
          <ButtonText>{t('joinSession')}</ButtonText>
        </Button>
      </Card>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.sm },
  date: {
    width: 52,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.lg,
    borderCurve: 'continuous'
  },
  copy: { flex: 1, gap: SPACING.xxs / 2 }
});
