import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/feature/common/components/pressable-scale';
import { Progress } from '@/feature/common/components/progress';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { learningStatusOf, progressPercentOf } from '@/feature/course/helpers/learning-status';
import { courseCatalog } from '@/feature/course/translations/catalog';
import type { EnrolledCourse } from '@/feature/course/types/course';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { CourseBanner } from './course-banner';
import { CourseZoomLink } from './course-zoom-link';

export const COURSE_CARD_WIDTH = 236;

/** A fixed-width course tile for horizontal rows: banner, title, progress. */
export function CourseCard({ course }: { course: EnrolledCourse }) {
  const t = useTranslations(courseCatalog);
  const format = useFormatters();
  const { colors, elevation } = useTheme();
  const progress = progressPercentOf(course);
  const started = learningStatusOf(course) !== 'not-started';
  const lessons = t('lessonCount', { count: course.lessonCount ?? 0 });
  const meta = started
    ? t('percentComplete', { percent: format.percent(progress) })
    : `${t('filterNotStarted')} · ${lessons}`;

  return (
    <CourseZoomLink courseId={course.id}>
      <PressableScale accessibilityRole="button" accessibilityLabel={`${course.title}, ${meta}`} scaleTo={0.97}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, elevation.raised]}>
          <CourseBanner uri={course.bannerImage || course.logo} recyclingKey={course.id} style={styles.banner} />
          <View style={styles.body}>
            <Text variant="subheading" numberOfLines={2} style={styles.title}>
              {course.title}
            </Text>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {meta}
            </Text>
            <Progress value={progress} />
          </View>
        </View>
      </PressableScale>
    </CourseZoomLink>
  );
}

const styles = StyleSheet.create({
  card: {
    width: COURSE_CARD_WIDTH,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: RADII.xl,
    borderCurve: 'continuous',
    overflow: 'hidden'
  },
  banner: { width: '100%', aspectRatio: 16 / 9 },
  body: { gap: SPACING.xxs + 2, padding: SPACING.sm, paddingBottom: SPACING.md },
  title: { minHeight: 40 }
});
