import { router } from 'expo-router';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { LearningStatKind } from '@/feature/account/types/account';
import { accountCatalog } from '@/feature/account/translations/catalog';
import { Icon } from '@/feature/common/components/icon';
import { Progress } from '@/feature/common/components/progress';
import { Text } from '@/feature/common/components/text';
import { GUTTER, RADII, SPACING } from '@/feature/common/constants/layout';
import { parseTimestamp } from '@/feature/common/helpers/time-ago';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useEnrolledCoursesQuery } from '@/feature/course/api/enrolled-courses';
import { CourseThumbnail } from '@/feature/course/components/course-thumbnail';
import { learningStatusOf, progressPercentOf } from '@/feature/course/helpers/learning-status';
import { courseCatalog } from '@/feature/course/translations/catalog';
import type { EnrolledCourse } from '@/feature/course/types/course';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

const TITLE_KEYS = {
  'in-progress': 'statInProgress',
  completed: 'statCompleted',
  certificates: 'statCertificates'
} as const satisfies Record<LearningStatKind, string>;

const EMPTY_KEYS = {
  'in-progress': 'statInProgressEmpty',
  completed: 'statCompletedEmpty',
  certificates: 'statCertificatesEmpty'
} as const satisfies Record<LearningStatKind, string>;

function coursesFor(kind: LearningStatKind, courses: EnrolledCourse[]) {
  if (kind === 'certificates') return courses.filter((course) => course.certificateEarnedAt);

  return courses.filter((course) => learningStatusOf(course) === kind);
}

/** The courses behind one Profile stat, in a native sheet over Profile. */
export function LearningStatSheet({ kind }: { kind: LearningStatKind }) {
  const t = useTranslations(accountCatalog);
  const courses = useEnrolledCoursesQuery();
  const items = coursesFor(kind, courses.data ?? []);

  return (
    <SafeAreaView edges={['bottom']} style={styles.sheet}>
      <View style={styles.header}>
        <Text variant="title" accessibilityRole="header">
          {t(TITLE_KEYS[kind])}
        </Text>
        <Text variant="caption" tone="muted">
          {items.length === 0 ? t(EMPTY_KEYS[kind]) : t('statCourseCount', { count: items.length })}
        </Text>
      </View>
      {items.length > 0 ? (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent} bounces={false}>
          {items.map((course) => (
            <LearningStatRow key={course.id} kind={kind} course={course} />
          ))}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

function LearningStatRow({ kind, course }: { kind: LearningStatKind; course: EnrolledCourse }) {
  const { colors } = useTheme();
  const tc = useTranslations(courseCatalog);
  const t = useTranslations(accountCatalog);
  const format = useFormatters();
  const progress = progressPercentOf(course);
  const earnedTime = course.certificateEarnedAt ? parseTimestamp(course.certificateEarnedAt) : Number.NaN;

  // The sheet sits above the stack the course screen opens in, so it must close first.
  const open = () => {
    router.back();
    if (kind === 'certificates') {
      router.push({ pathname: '/certificates/[courseId]', params: { courseId: course.id } });
      return;
    }

    router.push({ pathname: '/course/[courseId]', params: { courseId: course.id } });
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={open}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.muted }]}
    >
      <CourseThumbnail uri={course.bannerImage || course.logo} size={64} aspectRatio={4 / 3} recyclingKey={course.id} />
      <View style={styles.rowText}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {course.title}
        </Text>
        {kind === 'in-progress' ? (
          <View style={styles.progress}>
            <View style={styles.progressBar}>
              <Progress value={progress} />
            </View>
            <Text variant="caption" tone="muted">
              {format.percent(progress)}
            </Text>
          </View>
        ) : (
          <View style={styles.meta}>
            <Icon icon={CheckCircleIcon} size={14} tone="success" weight="fill" />
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {kind === 'certificates' && Number.isFinite(earnedTime)
                ? t('statEarnedOn', { date: format.date(new Date(earnedTime)) })
                : tc('lessonCount', { count: course.lessonCount ?? 0 })}
            </Text>
          </View>
        )}
      </View>
      <Icon icon={CaretRightIcon} size={16} tone="subtle" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheet: { paddingTop: SPACING.xl },
  header: { gap: SPACING.xxs, paddingHorizontal: GUTTER, paddingBottom: SPACING.md },
  list: { maxHeight: 460 },
  listContent: { paddingHorizontal: SPACING.xs, paddingBottom: SPACING.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADII.lg,
    borderCurve: 'continuous'
  },
  rowText: { flex: 1, gap: SPACING.xxs },
  progress: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  progressBar: { flex: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xxs }
});
