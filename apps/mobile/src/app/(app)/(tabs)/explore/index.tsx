import { CompassIcon } from 'phosphor-react-native/src/icons/Compass';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { Stack } from 'expo-router';
import { useDeferredValue, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import type { SheetRef } from '@/feature/common/components/bottom-sheet';
import { Button, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { ItemGroup } from '@/feature/common/components/item';
import { PagedCarousel } from '@/feature/common/components/paged-carousel';
import { ScreenSection, ScreenSectionHeader } from '@/feature/common/components/screen';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useExploreCoursesQuery } from '@/feature/explore/api/explore-courses';
import { ExploreCourseGrid, ExploreCourseGridSkeleton } from '@/feature/explore/components/explore-course-grid';
import { exploreCatalog } from '@/feature/explore/translations/catalog';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useExplorePathsQuery } from '@/feature/learning-path/api/learning-paths';
import { PathRow } from '@/feature/learning-path/components/path-row';
import { learningPathCatalog } from '@/feature/learning-path/translations/catalog';
import { FilterButton } from '@/feature/learning/components/filter-button';
import { activeFilterCount, FilterSheet, type FilterValues } from '@/feature/learning/components/filter-sheet';
import { learningCatalog } from '@/feature/learning/translations/catalog';
import { useExploreLiveClassesQuery } from '@/feature/live-class/api/live-classes';
import { LiveClassCard } from '@/feature/live-class/components/live-class-card';
import { liveClassCatalog } from '@/feature/live-class/translations/catalog';

const DEFAULT_FILTERS: FilterValues = { type: 'all', level: 'all', duration: 'all' };

const LIVE_CARD_PEEK = 40;

export default function ExploreScreen() {
  const t = useTranslations(exploreCatalog);
  const tl = useTranslations(learningCatalog);
  const tp = useTranslations(learningPathCatalog);
  const tlc = useTranslations(liveClassCatalog);
  const common = useTranslations(commonCatalog);
  const locale = useLocale();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const offline = useIsOffline();
  const [query, setQuery] = useState('');
  const search = useDeferredValue(query.trim());
  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS);
  const filterSheet = useRef<SheetRef>(null);
  const showPaths = filters.type !== 'courses';
  const showCourses = filters.type !== 'paths';
  const courseFilters = {
    search: search || undefined,
    level: filters.level === 'all' ? undefined : filters.level,
    duration: filters.duration === 'all' ? undefined : filters.duration
  };
  const courses = useExploreCoursesQuery(courseFilters);
  const paths = useExplorePathsQuery(showPaths);
  const liveClasses = useExploreLiveClassesQuery();
  const filtering = Boolean(search) || activeFilterCount(filters) > 0;
  const lowered = search.toLocaleLowerCase(locale);
  const visiblePaths = showPaths
    ? (paths.data ?? []).filter((path) => !lowered || path.name.toLocaleLowerCase(locale).includes(lowered))
    : [];
  const upcoming = filtering ? [] : (liveClasses.data ?? []);
  const allCourses = showCourses ? (courses.data?.pages.flatMap((page) => page.data) ?? []) : [];
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = courses;
  const liveCardWidth = width - GUTTER * 2 - LIVE_CARD_PEEK;

  const loadMore = () => {
    if (offline || !showCourses || !hasNextPage || isFetchingNextPage) return;

    void fetchNextPage();
  };

  const header = (
    <View style={styles.header}>
      {visiblePaths.length > 0 ? (
        <ScreenSection>
          <ScreenSectionHeader title={t('pathsTitle')} />
          <ItemGroup>
            {visiblePaths.map((path) => (
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

      {upcoming.length > 0 ? (
        <ScreenSection>
          <ScreenSectionHeader title={tlc('upcomingTitle')} />
          <PagedCarousel
            items={upcoming}
            itemWidth={upcoming.length > 1 ? liveCardWidth : width - GUTTER * 2}
            keyOf={(liveClass) => liveClass.lessonId}
            renderItem={(liveClass) => <LiveClassCard liveClass={liveClass} />}
          />
        </ScreenSection>
      ) : null}

      {showCourses && (allCourses.length > 0 || courses.isPending) ? (
        <ScreenSectionHeader title={t('coursesTitle')} />
      ) : null}
    </View>
  );

  const empty = !showCourses ? (
    visiblePaths.length === 0 ? (
      <Empty>
        <EmptyMedia icon={MagnifyingGlassIcon} />
        <EmptyTitle>{tl('noMatchesTitle')}</EmptyTitle>
        <EmptyDescription>{tl('noMatchesDescription')}</EmptyDescription>
      </Empty>
    ) : undefined
  ) : courses.isPending ? (
    <ExploreCourseGridSkeleton />
  ) : courses.isError && !courses.data ? (
    <Empty>
      <EmptyMedia icon={CompassIcon} />
      <EmptyTitle>{t('loadError')}</EmptyTitle>
      <EmptyDescription>{errorMessage(courses.error)}</EmptyDescription>
      <EmptyContent>
        <Button variant="outline" onPress={() => courses.refetch()}>
          <ButtonText>{common('retry')}</ButtonText>
        </Button>
      </EmptyContent>
    </Empty>
  ) : filtering ? (
    visiblePaths.length === 0 ? (
      <Empty>
        <EmptyMedia icon={MagnifyingGlassIcon} />
        <EmptyTitle>{tl('noMatchesTitle')}</EmptyTitle>
        <EmptyDescription>{tl('noMatchesDescription')}</EmptyDescription>
      </Empty>
    ) : undefined
  ) : visiblePaths.length === 0 && upcoming.length === 0 ? (
    <Empty>
      <EmptyMedia icon={CompassIcon} />
      <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
      <EmptyDescription>{t('emptyDescription')}</EmptyDescription>
    </Empty>
  ) : undefined;

  return (
    <>
      <Stack.SearchBar
        placeholder={t('searchCatalog')}
        hideWhenScrolling={false}
        obscureBackground={false}
        tintColor={colors.primary}
        onChangeText={(event) => setQuery(event.nativeEvent.text)}
        onCancelButtonPress={() => setQuery('')}
      />
      <Stack.Screen
        options={{
          headerRight: () => (
            <FilterButton count={activeFilterCount(filters)} onPress={() => filterSheet.current?.present()} />
          )
        }}
      />
      <ExploreCourseGrid
        courses={allCourses}
        header={header}
        empty={empty}
        loadingMore={isFetchingNextPage}
        onEndReached={loadMore}
        onRefresh={() => Promise.all([courses.refetch(), paths.refetch(), liveClasses.refetch()])}
      />
      <FilterSheet ref={filterSheet} value={filters} onChange={setFilters} />
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: SPACING.xl, paddingBottom: SPACING.md }
});
