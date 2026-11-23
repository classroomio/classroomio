import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { LockSimpleIcon } from 'phosphor-react-native/src/icons/LockSimple';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Icon } from '@/feature/common/components/icon';
import { PressableScale } from '@/feature/common/components/pressable-scale';
import { Text } from '@/feature/common/components/text';
import { RADII, SPACING } from '@/feature/common/constants/layout';
import { tapHaptic } from '@/feature/common/helpers/haptics';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { pathCourseStateLabel } from '@/feature/learning-path/helpers/path-copy';
import { learningPathCatalog } from '@/feature/learning-path/translations/catalog';
import type { LearnerPathCourse } from '@/feature/learning-path/types/learning-path';

const STEP = 28;

type PathCourseRowProps = { course: LearnerPathCourse; position: number; isMember: boolean };

/** One step in a learning path: its position, title and state. Opens the course once it is unlocked and joined. */
export function PathCourseRow({ course, position, isMember }: PathCourseRowProps) {
  const t = useTranslations(learningPathCatalog);
  const format = useFormatters();
  const { colors } = useTheme();
  const locked = course.state === 'locked';
  const openable = isMember && course.isEnrolled && !locked;
  const label = pathCourseStateLabel(course, t);
  const detail =
    course.state === 'in_progress'
      ? `${label} · ${t('percentComplete', { percent: format.percent(course.progressPercent) })}`
      : label;

  const marker =
    course.state === 'completed' ? (
      <Icon icon={CheckCircleIcon} size={STEP} tone="success" weight="fill" />
    ) : locked ? (
      <View style={[styles.step, { backgroundColor: colors.muted }]}>
        <Icon icon={LockSimpleIcon} size={14} tone="muted" />
      </View>
    ) : (
      <View
        style={[
          styles.step,
          { borderColor: course.state === 'in_progress' ? colors.primary : colors.border, borderWidth: 1.5 }
        ]}
      >
        <Text variant="captionStrong" tone={course.state === 'in_progress' ? 'primary' : 'muted'}>
          {format.number(position)}
        </Text>
      </View>
    );

  return (
    <PressableScale
      accessibilityRole={openable ? 'button' : undefined}
      accessibilityLabel={`${position}. ${course.title}, ${detail}`}
      accessibilityState={{ disabled: !openable }}
      disabled={!openable}
      scaleTo={0.985}
      onPress={() => {
        tapHaptic();
        router.push({ pathname: '/course/[courseId]', params: { courseId: course.courseId } });
      }}
      style={styles.row}
    >
      {marker}
      <View style={styles.copy}>
        <Text variant="subheading" tone={locked ? 'muted' : undefined} numberOfLines={2}>
          {course.title}
        </Text>
        <Text variant="caption" tone={locked ? 'subtle' : 'muted'} numberOfLines={2}>
          {detail}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md
  },
  step: { width: STEP, height: STEP, borderRadius: RADII.pill, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 2 }
});
