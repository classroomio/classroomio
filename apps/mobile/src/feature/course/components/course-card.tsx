import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/feature/common/components/pressable-scale';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { withAlpha } from '@/feature/common/helpers/color';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { learningStatusOf, progressPercentOf } from '@/feature/course/helpers/learning-status';
import { courseCatalog } from '@/feature/course/translations/catalog';
import type { EnrolledCourse } from '@/feature/course/types/course';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { CourseBanner } from './course-banner';
import { CourseZoomLink } from './course-zoom-link';

export const COURSE_CARD_WIDTH = 216;

/** A shelf item for horizontal rows: the course artwork with its progress along the bottom, then title and status. */
export function CourseCard({ course }: { course: EnrolledCourse }) {
  const t = useTranslations(courseCatalog);
  const format = useFormatters();
  const { colors } = useTheme();
  const progress = progressPercentOf(course);
  const started = learningStatusOf(course) !== 'not-started';
  const lessons = t('lessonCount', { count: course.lessonCount ?? 0 });
  const meta = started
    ? t('percentComplete', { percent: format.percent(progress) })
    : `${t('filterNotStarted')} · ${lessons}`;

  return (
    <CourseZoomLink courseId={course.id}>
      <PressableScale accessibilityRole="button" accessibilityLabel={`${course.title}, ${meta}`} scaleTo={0.96}>
        <View style={styles.card}>
          <View style={[styles.artwork, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <CourseBanner
              uri={course.bannerImage || course.logo}
              recyclingKey={course.id}
              style={StyleSheet.absoluteFill}
            />
            {started ? (
              <View style={[styles.track, { backgroundColor: withAlpha(colors.artworkScrim, 0.35) }]}>
                <View style={[styles.fill, { width: `${progress}%`, backgroundColor: colors.onSolid }]} />
              </View>
            ) : null}
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
    </CourseZoomLink>
  );
}

const styles = StyleSheet.create({
  card: { width: COURSE_CARD_WIDTH, gap: SPACING.sm },
  artwork: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: RADII.xl,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden'
  },
  track: {
    position: 'absolute',
    left: SPACING.sm,
    right: SPACING.sm,
    bottom: SPACING.sm,
    height: 4,
    borderRadius: RADII.pill,
    overflow: 'hidden'
  },
  fill: { height: '100%', borderRadius: RADII.pill },
  copy: { gap: SPACING.xxs / 2 }
});
