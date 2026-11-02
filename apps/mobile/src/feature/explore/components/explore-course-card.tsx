import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/feature/common/components/pressable-scale';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { CourseBanner } from '@/feature/course/components/course-banner';
import { courseTypeKey } from '@/feature/course/constants/course-type';
import { courseCatalog } from '@/feature/course/translations/catalog';
import type { ExploreCourseSummary } from '@/feature/explore/types/explore';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

/** A catalogue course in the Explore grid: its artwork, then title, type and lesson count. Opens the course landing. */
export function ExploreCourseCard({ course }: { course: ExploreCourseSummary }) {
  const t = useTranslations(courseCatalog);
  const { colors } = useTheme();
  const typeKey = courseTypeKey(course.type);
  const meta = [typeKey ? t(typeKey) : null, t('lessonCount', { count: course.lessonCount })]
    .filter(Boolean)
    .join(' · ');

  return (
    <Link
      href={{ pathname: '/learn/explore/[courseId]', params: { courseId: course.id } }}
      push
      asChild
      onPress={tapHaptic}
    >
      <PressableScale accessibilityRole="button" accessibilityLabel={`${course.title}, ${meta}`} scaleTo={0.96}>
        <View style={styles.card}>
          <View style={[styles.artwork, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <CourseBanner
              uri={course.bannerImage || course.logo}
              recyclingKey={course.id}
              style={StyleSheet.absoluteFill}
            />
          </View>
          <View style={styles.copy}>
            <Text variant="subheading" numberOfLines={2}>
              {course.title}
            </Text>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {meta}
            </Text>
          </View>
        </View>
      </PressableScale>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { gap: SPACING.sm },
  artwork: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: RADII.xl,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden'
  },
  copy: { gap: SPACING.xxs / 2 }
});
