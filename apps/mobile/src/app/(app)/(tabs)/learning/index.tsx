import { BookOpenIcon } from 'phosphor-react-native/src/icons/BookOpen';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { ClipboardTextIcon } from 'phosphor-react-native/src/icons/ClipboardText';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { PathIcon } from 'phosphor-react-native/src/icons/Path';
import { WifiSlashIcon } from 'phosphor-react-native/src/icons/WifiSlash';
import { courseDurationBucketOf } from '@cio/utils/constants/course-level';
import { FlashList } from '@shopify/flash-list';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useDeferredValue, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Banner, BannerContent, BannerDescription, BannerIcon } from '@/feature/common/components/banner';
import type { SheetRef } from '@/feature/common/components/bottom-sheet';
import { Empty, EmptyDescription, EmptyIllustration, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/feature/common/components/item';
import { PagedCarousel } from '@/feature/common/components/paged-carousel';
import { PullRefreshControl } from '@/feature/common/components/pull-refresh-control';
import { ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { SegmentedControl, SegmentedControlItem } from '@/feature/common/components/segmented-control';
import { SkeletonList } from '@/feature/common/components/skeleton';
import { Text } from '@/feature/common/components/text';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useEnrolledCoursesQuery } from '@/feature/course/api/enrolled-courses';
import { COURSE_CARD_WIDTH } from '@/feature/course/components/course-card';
import { CourseList } from '@/feature/course/components/course-list';
import { CourseListSkeleton } from '@/feature/course/components/course-skeletons';
import { CourseThumbnail } from '@/feature/course/components/course-thumbnail';
import { formatDay } from '@/feature/course/helpers/format-date';
import { learningStatusOf } from '@/feature/course/helpers/learning-status';
import type { EnrolledCourse } from '@/feature/course/types/course';
import { useDownloadedCourseIds } from '@/feature/downloads/helpers/download-store';
import { useExploreCoursesQuery } from '@/feature/explore/api/explore-courses';
import { ExploreCourseCard } from '@/feature/explore/components/explore-course-card';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useEnrolledPathsQuery, useExplorePathsQuery } from '@/feature/learning-path/api/learning-paths';
import { openPath } from '@/feature/learning-path/components/path-card';
import { PathRow } from '@/feature/learning-path/components/path-row';
import { pathProgressLabel } from '@/feature/learning-path/helpers/path-copy';
import { learningPathCatalog } from '@/feature/learning-path/translations/catalog';
import type { EnrolledPath } from '@/feature/learning-path/types/learning-path';
import { useAssignmentsQuery, useLearningHistoryQuery } from '@/feature/learning/api/learning';
import { AssignmentRow } from '@/feature/learning/components/assignment-row';
import { FilterButton } from '@/feature/learning/components/filter-button';
import { activeFilterCount, FilterSheet, type FilterValues } from '@/feature/learning/components/filter-sheet';
import { learningCatalog } from '@/feature/learning/translations/catalog';
import type { Assignment, AssignmentStatus, HistoryCourse } from '@/feature/learning/types/learning';

type LearningTab = 'paths' | 'courses' | 'assignments';

const SUGGESTION_LIMIT = 6;

const DEFAULT_FILTERS: FilterValues = { status: 'all', level: 'all', duration: 'all' };

function isTab(value: string | undefined): value is LearningTab {
  return value === 'paths' || value === 'courses' || value === 'assignments';
}

function matchesSearch(text: string, search: string, locale: string) {
  return !search || text.toLocaleLowerCase(locale).includes(search);
}

function courseMatches(course: EnrolledCourse, filters: FilterValues) {
  const status = learningStatusOf(course);
  if (filters.status === 'in-progress' && status !== 'in-progress') return false;
  if (filters.status === 'not-started' && status !== 'not-started') return false;
  if (filters.level !== 'all' && course.level !== filters.level) return false;
  if (filters.duration !== 'all' && courseDurationBucketOf(course.durationMinutes ?? null) !== filters.duration) {
    return false;
  }

  return true;
}

function pathMatches(path: EnrolledPath, filters: FilterValues) {
  if (filters.status === 'in-progress') return path.progressPercent > 0;
  if (filters.status === 'not-started') return path.progressPercent === 0;

  return true;
}

type AssignmentListItem = { kind: 'header'; status: AssignmentStatus } | { kind: 'row'; assignment: Assignment };

function assignmentItems(assignments: Assignment[]): AssignmentListItem[] {
  const items: AssignmentListItem[] = [];
  let previous: AssignmentStatus | null = null;

  for (const assignment of assignments) {
    if (assignment.status !== previous) {
      items.push({ kind: 'header', status: assignment.status });
      previous = assignment.status;
    }
    items.push({ kind: 'row', assignment });
  }

  return items;
}

const SECTION_KEYS = {
  upcoming: 'sectionUpcoming',
  submitted: 'sectionSubmitted',
  graded: 'sectionGraded'
} as const satisfies Record<AssignmentStatus, string>;

export default function MyLearningScreen() {
  const t = useTranslations(learningCatalog);
  const tp = useTranslations(learningPathCatalog);
  const locale = useLocale();
  const { colors } = useTheme();
  const offline = useIsOffline();
  const params = useLocalSearchParams<{ tab?: string }>();
  const tab: LearningTab = offline ? 'courses' : isTab(params.tab) ? params.tab : 'courses';
  const [query, setQuery] = useState('');
  const search = useDeferredValue(query.trim().toLocaleLowerCase(locale));
  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS);
  const filterSheet = useRef<SheetRef>(null);
  const courses = useEnrolledCoursesQuery();
  const paths = useEnrolledPathsQuery(!offline);
  const suggestedPaths = useExplorePathsQuery(!offline);
  const suggestedCourses = useExploreCoursesQuery();
  const assignments = useAssignmentsQuery(!offline && tab === 'assignments');
  const history = useLearningHistoryQuery(!offline);
  const downloadedIds = useDownloadedCourseIds();

  const refresh = () =>
    Promise.all([
      courses.refetch(),
      paths.refetch(),
      suggestedPaths.refetch(),
      suggestedCourses.refetch(),
      history.refetch(),
      tab === 'assignments' ? assignments.refetch() : Promise.resolve()
    ]);

  const filtering = Boolean(search) || activeFilterCount(filters) > 0;
  const allCourses = courses.data ?? [];
  const visibleCourses = allCourses.filter((course) => {
    if (offline) return downloadedIds.includes(course.id) && matchesSearch(course.title, search, locale);

    const completed = learningStatusOf(course) === 'completed' && course.type !== 'COMPLIANCE';

    return !completed && matchesSearch(course.title, search, locale) && courseMatches(course, filters);
  });
  const activePaths = (paths.data ?? []).filter(
    (path) => !path.completedAt && matchesSearch(path.name, search, locale) && pathMatches(path, filters)
  );
  const completedPaths = (paths.data ?? []).filter((path) => path.completedAt);
  const historyCourses = history.data ?? [];
  const suggestions = (suggestedCourses.data?.pages[0]?.data ?? []).slice(0, SUGGESTION_LIMIT);
  const visibleAssignments = (assignments.data ?? []).filter((assignment) =>
    matchesSearch(`${assignment.title} ${assignment.course.title}`, search, locale)
  );

  const tabs = offline ? null : (
    <SegmentedControl value={tab} onValueChange={(next) => router.setParams({ tab: next })}>
      <SegmentedControlItem value="paths">{t('tabPaths')}</SegmentedControlItem>
      <SegmentedControlItem value="courses">{t('tabCourses')}</SegmentedControlItem>
      <SegmentedControlItem value="assignments">{t('tabAssignments')}</SegmentedControlItem>
    </SegmentedControl>
  );

  const offlineBanner = offline ? (
    <Banner tone="neutral">
      <BannerIcon icon={WifiSlashIcon} />
      <BannerContent>
        <BannerDescription>{t('offlineBanner')}</BannerDescription>
      </BannerContent>
    </Banner>
  ) : null;

  const header = (
    <View style={styles.header}>
      {offlineBanner}
      {tabs}
    </View>
  );

  const noMatches = (
    <Empty>
      <EmptyMedia icon={MagnifyingGlassIcon} />
      <EmptyTitle>{t('noMatchesTitle')}</EmptyTitle>
      <EmptyDescription>{t('noMatchesDescription')}</EmptyDescription>
    </Empty>
  );

  const historySection =
    !offline && !filtering && (historyCourses.length > 0 || completedPaths.length > 0) ? (
      <ScreenSection>
        <ScreenSectionHeader title={t('historyTitle')} />
        <ItemGroup>
          {completedPaths.map((path) => (
            <Item key={`path-${path.id}`} onPress={() => openPath(path.id)}>
              <ItemMedia>
                <CourseThumbnail uri={path.coverImage} size={48} recyclingKey={path.id} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{path.name}</ItemTitle>
                <ItemDescription>
                  {path.completedAt
                    ? `${tp('pathLabel')} · ${t('completedOn', { date: formatDay(path.completedAt, locale) })}`
                    : tp('pathLabel')}
                </ItemDescription>
              </ItemContent>
            </Item>
          ))}
          {historyCourses.map((course: HistoryCourse) => (
            <Item
              key={`course-${course.id}`}
              onPress={() => router.push({ pathname: '/course/[courseId]', params: { courseId: course.id } })}
            >
              <ItemMedia>
                <CourseThumbnail uri={course.bannerImage} size={48} recyclingKey={course.id} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{course.title}</ItemTitle>
                <ItemDescription>
                  {course.completedAt ? t('completedOn', { date: formatDay(course.completedAt, locale) }) : null}
                </ItemDescription>
              </ItemContent>
              <CheckCircleIcon size={18} color={colors.success} weight="fill" />
            </Item>
          ))}
        </ItemGroup>
      </ScreenSection>
    ) : null;

  const searchBar = (
    <Stack.SearchBar
      placeholder={t('searchLearning')}
      hideWhenScrolling={false}
      obscureBackground={false}
      tintColor={colors.primary}
      onChangeText={(event) => setQuery(event.nativeEvent.text)}
      onCancelButtonPress={() => setQuery('')}
    />
  );

  const filterHeader = (
    <Stack.Screen
      options={{
        headerRight:
          offline || tab === 'assignments'
            ? undefined
            : () => <FilterButton count={activeFilterCount(filters)} onPress={() => filterSheet.current?.present()} />
      }}
    />
  );

  const sheet = (
    <FilterSheet
      ref={filterSheet}
      value={tab === 'paths' ? { ...filters, level: 'all', duration: 'all' } : filters}
      onChange={setFilters}
    />
  );

  if (tab === 'paths') {
    const suggested = filtering ? [] : (suggestedPaths.data ?? []);

    return (
      <>
        {searchBar}
        {filterHeader}
        <FlashList
          data={activePaths}
          keyExtractor={(path) => path.id}
          renderItem={({ item }) => (
            <PathRow
              id={item.id}
              name={item.name}
              coverImage={item.coverImage}
              meta={pathProgressLabel(item, tp)}
              progressPercent={item.progressPercent}
              from="learning"
            />
          )}
          ListHeaderComponent={
            <View style={styles.header}>
              {header}
              {paths.isPending ? <CourseListSkeleton /> : null}
            </View>
          }
          ListEmptyComponent={
            paths.isPending ? undefined : paths.isError ? (
              <Empty>
                <EmptyMedia icon={PathIcon} />
                <EmptyTitle>{tp('loadError')}</EmptyTitle>
                <EmptyDescription>{errorMessage(paths.error)}</EmptyDescription>
              </Empty>
            ) : filtering ? (
              noMatches
            ) : (
              <Empty>
                <EmptyMedia icon={PathIcon} />
                <EmptyTitle>{tp('emptyTitle')}</EmptyTitle>
                <EmptyDescription>{tp('emptyDescription')}</EmptyDescription>
              </Empty>
            )
          }
          ListFooterComponent={
            <View style={styles.footer}>
              {suggested.length > 0 ? (
                <ScreenSection>
                  <ScreenSectionHeader title={tp('suggested')} />
                  <ItemGroup>
                    {suggested.map((path) => (
                      <PathRow
                        key={path.id}
                        id={path.id}
                        name={path.name}
                        coverImage={path.coverImage}
                        meta={tp('courseCount', { count: path.courseCount })}
                        from="explore"
                        inset
                      />
                    ))}
                  </ItemGroup>
                </ScreenSection>
              ) : null}
              {historySection}
            </View>
          }
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="on-drag"
          refreshControl={<PullRefreshControl onRefresh={refresh} />}
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={styles.list}
        />
        {sheet}
      </>
    );
  }

  if (tab === 'assignments') {
    const items = assignmentItems(visibleAssignments);

    return (
      <>
        {searchBar}
        {filterHeader}
        <FlashList
          data={items}
          keyExtractor={(item) => (item.kind === 'header' ? `header-${item.status}` : item.assignment.exerciseId)}
          getItemType={(item) => item.kind}
          renderItem={({ item }) =>
            item.kind === 'header' ? (
              <Text variant="subheading" accessibilityRole="header" style={styles.sectionHeader}>
                {t(SECTION_KEYS[item.status])}
              </Text>
            ) : (
              <AssignmentRow assignment={item.assignment} />
            )
          }
          ListHeaderComponent={
            <View style={styles.header}>
              {header}
              {assignments.isPending ? <SkeletonList count={5} /> : null}
            </View>
          }
          ListEmptyComponent={
            assignments.isPending ? undefined : assignments.isError ? (
              <Empty>
                <EmptyMedia icon={ClipboardTextIcon} />
                <EmptyTitle>{t('assignmentsLoadError')}</EmptyTitle>
                <EmptyDescription>{errorMessage(assignments.error)}</EmptyDescription>
              </Empty>
            ) : search ? (
              noMatches
            ) : (
              <Empty>
                <EmptyMedia icon={ClipboardTextIcon} />
                <EmptyTitle>{t('assignmentsEmptyTitle')}</EmptyTitle>
                <EmptyDescription>{t('assignmentsEmptyDescription')}</EmptyDescription>
              </Empty>
            )
          }
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="on-drag"
          refreshControl={<PullRefreshControl onRefresh={refresh} />}
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={styles.list}
        />
      </>
    );
  }

  const coursesEmpty = courses.isPending ? undefined : courses.isError ? (
    <Empty>
      <EmptyMedia icon={BookOpenIcon} />
      <EmptyTitle>{errorMessage(courses.error)}</EmptyTitle>
    </Empty>
  ) : offline ? (
    <Empty>
      <EmptyIllustration name="offline" />
      <EmptyTitle>{t('offlineEmptyTitle')}</EmptyTitle>
      <EmptyDescription>{t('offlineEmptyDescription')}</EmptyDescription>
    </Empty>
  ) : filtering ? (
    noMatches
  ) : (
    <Empty>
      <EmptyIllustration name="courses" />
      <EmptyTitle>{t('coursesEmptyTitle')}</EmptyTitle>
      <EmptyDescription>{t('coursesEmptyDescription')}</EmptyDescription>
    </Empty>
  );

  return (
    <>
      {searchBar}
      {filterHeader}
      <CourseList
        courses={visibleCourses}
        header={
          <View style={styles.header}>
            {header}
            {courses.isPending ? <CourseListSkeleton /> : null}
          </View>
        }
        empty={coursesEmpty}
        footer={
          offline ? undefined : (
            <View style={styles.footer}>
              {!filtering && suggestions.length > 0 ? (
                <ScreenSection>
                  <ScreenSectionHeader title={t('suggestedCourses')} />
                  <PagedCarousel
                    items={suggestions}
                    itemWidth={COURSE_CARD_WIDTH}
                    keyOf={(course) => course.id}
                    renderItem={(course) => <ExploreCourseCard course={course} />}
                  />
                </ScreenSection>
              ) : null}
              {historySection}
            </View>
          )
        }
        onRefresh={refresh}
      />
      {sheet}
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: SPACING.md, paddingBottom: SPACING.md },
  footer: { gap: SPACING.xl, paddingTop: SPACING.xl },
  list: { paddingHorizontal: GUTTER, paddingTop: SPACING.xs, paddingBottom: SPACING.xxxl },
  sectionHeader: { paddingTop: SPACING.md, paddingBottom: SPACING.xs, paddingHorizontal: SPACING.md }
});
