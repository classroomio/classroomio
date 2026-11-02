import { CompassIcon } from 'phosphor-react-native/src/icons/Compass';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { Stack } from 'expo-router';
import { useDeferredValue, useEffect, useState } from 'react';

import { Button, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useExploreCoursesQuery } from '@/feature/explore/api/explore-courses';
import { ExploreCourseGrid, ExploreCourseGridSkeleton } from '@/feature/explore/components/explore-course-grid';
import { exploreCatalog } from '@/feature/explore/translations/catalog';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';

export default function ExploreScreen() {
  const t = useTranslations(exploreCatalog);
  const common = useTranslations(commonCatalog);
  const locale = useLocale();
  const { colors } = useTheme();
  const offline = useIsOffline();
  const courses = useExploreCoursesQuery();
  const [query, setQuery] = useState('');
  const search = useDeferredValue(query.trim().toLocaleLowerCase(locale));
  const all = courses.data?.pages.flatMap((page) => page.data) ?? [];
  const visible = search ? all.filter((course) => course.title.toLocaleLowerCase(locale).includes(search)) : all;
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = courses;

  useEffect(() => {
    if (search && hasNextPage && !isFetchingNextPage && !offline) void fetchNextPage();
  }, [search, hasNextPage, isFetchingNextPage, offline, fetchNextPage]);

  const loadMore = () => {
    if (offline || !hasNextPage || isFetchingNextPage) return;

    void fetchNextPage();
  };

  const empty = courses.isPending ? (
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
  ) : search ? (
    <Empty>
      <EmptyMedia icon={MagnifyingGlassIcon} />
      <EmptyTitle>{t('searchNoResultsTitle')}</EmptyTitle>
      <EmptyDescription>{t('searchNoResultsDescription', { query: query.trim() })}</EmptyDescription>
    </Empty>
  ) : (
    <Empty>
      <EmptyMedia icon={CompassIcon} />
      <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
      <EmptyDescription>{t('emptyDescription')}</EmptyDescription>
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
      <ExploreCourseGrid
        courses={visible}
        empty={empty}
        loadingMore={isFetchingNextPage}
        onEndReached={loadMore}
        onRefresh={() => courses.refetch()}
      />
    </>
  );
}
