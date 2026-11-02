import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { StyleSheet, View, type PressableProps } from 'react-native';

import { Icon } from '@/feature/common/components/icon';
import { PressableScale } from '@/feature/common/components/pressable-scale';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { courseTypeKey } from '@/feature/course/constants/course-type';
import { learningStatusOf, progressPercentOf } from '@/feature/course/helpers/learning-status';
import { courseCatalog } from '@/feature/course/translations/catalog';
import type { EnrolledCourse, LearningStatus } from '@/feature/course/types/course';
import { useCourseAvailableOffline } from '@/feature/downloads/helpers/download-store';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

import { CourseThumbnail } from './course-thumbnail';

export const COURSE_ROW_ARTWORK_WIDTH = 112;
export const COURSE_ROW_ARTWORK_RATIO = 16 / 10;

type CourseRowProps = Pick<
  PressableProps,
  'onPress' | 'onLongPress' | 'accessibilityActions' | 'onAccessibilityAction'
> & { course: EnrolledCourse };

/** A course in a list: its artwork, title, type and progress. Press handlers come from the wrapping `Link`. */
export function CourseRow({
  course,
  onPress,
  onLongPress,
  accessibilityActions,
  onAccessibilityAction
}: CourseRowProps) {
  const t = useTranslations(courseCatalog);
  const format = useFormatters();
  const progress = progressPercentOf(course);
  const percent = format.percent(progress);
  const status = learningStatusOf(course);
  const lessons = t('lessonCount', { count: course.lessonCount ?? 0 });
  const typeKey = courseTypeKey(course.type);
  const type = typeKey ? t(typeKey) : null;
  const downloaded = useCourseAvailableOffline(course.id);
  const statusLabel =
    status === 'completed'
      ? t('completed')
      : status === 'not-started'
        ? t('filterNotStarted')
        : t('percentComplete', { percent });

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={[course.title, type, lessons, statusLabel, downloaded ? t('downloaded') : null]
        .filter(Boolean)
        .join(', ')}
      scaleTo={0.985}
      onPress={(event) => {
        tapHaptic();
        onPress?.(event);
      }}
      onLongPress={onLongPress ?? undefined}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={onAccessibilityAction}
      style={styles.row}
    >
      <CourseThumbnail
        uri={course.bannerImage || course.logo}
        size={COURSE_ROW_ARTWORK_WIDTH}
        aspectRatio={COURSE_ROW_ARTWORK_RATIO}
        recyclingKey={course.id}
      />
      <View style={styles.copy}>
        <Text variant="subheading" numberOfLines={2}>
          {course.title}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {[type, lessons, downloaded ? t('downloaded') : null].filter(Boolean).join(' · ')}
        </Text>
        <CourseRowProgress status={status} progress={progress} label={statusLabel} percent={percent} />
      </View>
    </PressableScale>
  );
}

type CourseRowProgressProps = {
  status: LearningStatus;
  progress: number;
  label: string;
  percent: string;
};

function CourseRowProgress({ status, progress, label, percent }: CourseRowProgressProps) {
  const { colors } = useTheme();

  if (status === 'completed') {
    return (
      <View style={styles.status}>
        <Icon icon={CheckCircleIcon} size={15} tone="success" weight="fill" />
        <Text variant="captionStrong" tone="success">
          {label}
        </Text>
      </View>
    );
  }

  if (status === 'not-started') {
    return (
      <Text variant="captionStrong" tone="subtle" style={styles.statusText}>
        {label}
      </Text>
    );
  }

  return (
    <View style={styles.status}>
      <View style={[styles.track, { backgroundColor: colors.mutedStrong }]}>
        <View style={[styles.fill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
      </View>
      <Text variant="micro" tone="muted" style={styles.percent}>
        {percent}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, paddingVertical: SPACING.sm },
  copy: { flex: 1, gap: 2 },
  status: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.xxs, minHeight: 19 },
  statusText: { marginTop: SPACING.xxs },
  track: { flex: 1, height: 4, borderRadius: RADII.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: RADII.pill },
  percent: { minWidth: 34, textAlign: 'right', fontVariant: ['tabular-nums'] }
});
