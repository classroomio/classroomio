import { BookOpenIcon } from 'phosphor-react-native/src/icons/BookOpen';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useDeferredValue, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Empty, EmptyDescription, EmptyIllustration, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { SegmentedControl, SegmentedControlItem } from '@/feature/common/components/segmented-control';
import { SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useEnrolledCoursesQuery } from '@/feature/course/api/enrolled-courses';
import { CourseList } from '@/feature/course/components/course-list';
import { CourseListSkeleton } from '@/feature/course/components/course-skeletons';
import { learningStatusOf } from '@/feature/course/helpers/learning-status';
import { courseCatalog } from '@/feature/course/translations/catalog';
import type { LearningStatus } from '@/feature/course/types/course';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

const EMPTY_KEYS = {
  'in-progress': { title: 'emptyInProgressTitle', description: 'emptyInProgressDescription' },
  'not-started': { title: 'emptyNotStartedTitle', description: 'emptyNotStartedDescription' },
  completed: { title: 'emptyCompletedTitle', description: 'emptyCompletedDescription' }
} as const satisfies Record<LearningStatus, { title: string; description: string }>;

function isLearningStatus(value: string | undefined): value is LearningStatus {
  return value === 'in-progress' || value === 'not-started' || value === 'completed';
}

export default function LearnScreen() {
  const t = useTranslations(courseCatalog);
  const locale = useLocale();
  const { colors } = useTheme();
  const courses = useEnrolledCoursesQuery();
  const params = useLocalSearchParams<{ status?: string }>();
  const status: LearningStatus = isLearningStatus(params.status) ? params.status : 'in-progress';
  const [query, setQuery] = useState('');
  const search = useDeferredValue(query.trim().toLocaleLowerCase(locale));
  const visible = useMemo(
    () =>
      (courses.data ?? []).filter((course) =>
        search ? course.title.toLocaleLowerCase(locale).includes(search) : learningStatusOf(course) === status
      ),
    [courses.data, status, search, locale]
  );

  const header = (
    <View style={styles.header}>
      {search ? null : (
        <SegmentedControl value={status} onValueChange={(next) => router.setParams({ status: next })}>
          <SegmentedControlItem value="in-progress">{t('filterInProgress')}</SegmentedControlItem>
          <SegmentedControlItem value="not-started">{t('filterNotStarted')}</SegmentedControlItem>
          <SegmentedControlItem value="completed">{t('filterCompleted')}</SegmentedControlItem>
        </SegmentedControl>
      )}
      {courses.isPending ? <CourseListSkeleton /> : null}
    </View>
  );

  const empty = courses.isError ? (
    <Empty>
      <EmptyMedia icon={BookOpenIcon} />
      <EmptyTitle>{t('coursesLoadError')}</EmptyTitle>
      <EmptyDescription>{errorMessage(courses.error)}</EmptyDescription>
    </Empty>
  ) : !courses.isSuccess ? undefined : search ? (
    <Empty>
      <EmptyMedia icon={MagnifyingGlassIcon} />
      <EmptyTitle>{t('searchNoResultsTitle')}</EmptyTitle>
      <EmptyDescription>{t('searchNoResultsDescription', { query: query.trim() })}</EmptyDescription>
    </Empty>
  ) : (
    <Empty>
      <EmptyIllustration name={status === 'completed' ? 'certificate' : 'courses'} />
      <EmptyTitle>{t(EMPTY_KEYS[status].title)}</EmptyTitle>
      <EmptyDescription>{t(EMPTY_KEYS[status].description)}</EmptyDescription>
    </Empty>
  );

  return (
    <>
      <Stack.SearchBar
        placeholder={t('searchCourses')}
        hideWhenScrolling={false}
        obscureBackground={false}
        tintColor={colors.primary}
        onChangeText={(event) => setQuery(event.nativeEvent.text)}
        onCancelButtonPress={() => setQuery('')}
      />
      <CourseList courses={visible} header={header} empty={empty} onRefresh={() => courses.refetch()} />
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: SPACING.md, paddingBottom: SPACING.md }
});
