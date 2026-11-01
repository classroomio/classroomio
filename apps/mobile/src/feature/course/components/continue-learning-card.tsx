import { ArrowRight } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/feature/common/components/icon';
import { NotchCard } from '@/feature/common/components/notch-card';
import { PressableScale } from '@/feature/common/components/pressable-scale';
import { Progress } from '@/feature/common/components/progress';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { progressPercentOf } from '@/feature/course/helpers/learning-status';
import { courseCatalog } from '@/feature/course/translations/catalog';
import type { EnrolledCourse } from '@/feature/course/types/course';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { CourseBanner } from './course-banner';
import { CourseZoomLink } from './course-zoom-link';

/** The course the learner is most likely to resume, as the featured block at the top of Home. */
export function ContinueLearningCard({ course }: { course: EnrolledCourse }) {
  const t = useTranslations(courseCatalog);
  const common = useTranslations(commonCatalog);
  const format = useFormatters();
  const { colors } = useTheme();
  const progress = progressPercentOf(course);
  const percent = t('percentComplete', { percent: format.percent(progress) });
  const lessons = t('lessonCount', { count: course.lessonCount ?? 0 });

  return (
    <CourseZoomLink courseId={course.id}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${common('continue')}, ${course.title}, ${percent}`}
        scaleTo={0.985}
      >
        <NotchCard style={styles.card}>
          <CourseBanner uri={course.bannerImage || course.logo} recyclingKey={course.id} style={styles.banner} />
          <View style={styles.copy}>
            <Text variant="heading" numberOfLines={2}>
              {course.title}
            </Text>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {`${percent} · ${lessons}`}
            </Text>
          </View>
          <Progress value={progress} />
          <View style={[styles.action, { backgroundColor: colors.primary }]}>
            <Text variant="label" tone="onPrimary">
              {common('continue')}
            </Text>
            <Icon icon={ArrowRight} size={18} tone="onPrimary" />
          </View>
        </NotchCard>
      </PressableScale>
    </CourseZoomLink>
  );
}

const styles = StyleSheet.create({
  card: { gap: SPACING.sm },
  banner: { width: '100%', aspectRatio: 16 / 9, borderRadius: RADII.input, borderCurve: 'continuous' },
  copy: { gap: 2 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    minHeight: 44,
    marginTop: SPACING.xxs,
    borderRadius: RADII.md,
    borderCurve: 'continuous'
  }
});
