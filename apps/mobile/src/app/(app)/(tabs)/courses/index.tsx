import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { GraduationCapIcon } from 'phosphor-react-native/src/icons/GraduationCap';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { FlashList } from '@shopify/flash-list';
import { router, Stack } from 'expo-router';
import { useDeferredValue, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyIllustration,
  EmptyMedia,
  EmptyTitle
} from '@/feature/common/components/empty';
import { ItemGroup } from '@/feature/common/components/item';
import { PullRefreshControl } from '@/feature/common/components/pull-refresh-control';
import { SkeletonList } from '@/feature/common/components/skeleton';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useLocale } from '@/feature/i18n/helpers/use-locale';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { StaffCourseRow } from '@/feature/staff/components/staff-course-row';
import { staffCatalog } from '@/feature/staff/translations/catalog';
import { useTeachingCoursesQuery } from '@/feature/teach/api/teaching-courses';
import { teachCatalog } from '@/feature/teach/translations/catalog';
import type { TeachingCourse } from '@/feature/teach/types/teach';

function openCourse(course: TeachingCourse) {
  router.push({ pathname: '/courses/[courseId]', params: { courseId: course.id, title: course.title } });
}

function Separator() {
  return <View style={styles.separator} />;
}

export default function CoursesScreen() {
  const t = useTranslations(staffCatalog);
  const teach = useTranslations(teachCatalog);
  const common = useTranslations(commonCatalog);
  const { colors } = useTheme();
  const locale = useLocale();
  const courses = useTeachingCoursesQuery();
  const [query, setQuery] = useState('');
  const search = useDeferredValue(query.trim().toLocaleLowerCase(locale));
  const items = (courses.data ?? []).filter(
    (course) => !search || course.title.toLocaleLowerCase(locale).includes(search)
  );

  const empty = courses.isPending ? (
    <SkeletonList count={6} media="thumbnail" />
  ) : courses.isError ? (
    <Empty>
      <EmptyMedia icon={GraduationCapIcon} />
      <EmptyTitle>{teach('coursesLoadError')}</EmptyTitle>
      <EmptyDescription>{errorMessage(courses.error)}</EmptyDescription>
      <EmptyContent>
        <Button variant="outline" onPress={() => courses.refetch()}>
          <ButtonIcon icon={ArrowsClockwiseIcon} />
          <ButtonText>{common('retry')}</ButtonText>
        </Button>
      </EmptyContent>
    </Empty>
  ) : search ? (
    <Empty>
      <EmptyMedia icon={MagnifyingGlassIcon} />
      <EmptyDescription>{t('noCourseMatches', { search: query.trim() })}</EmptyDescription>
    </Empty>
  ) : (
    <Empty>
      <EmptyIllustration name="courses" />
      <EmptyTitle>{teach('noCoursesTitle')}</EmptyTitle>
      <EmptyDescription>{teach('noCoursesDescription')}</EmptyDescription>
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
      <FlashList
        data={items}
        keyExtractor={(course) => course.id}
        renderItem={({ item }) => (
          <ItemGroup>
            <StaffCourseRow course={item} onPress={openCourse} />
          </ItemGroup>
        )}
        ItemSeparatorComponent={Separator}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        refreshControl={<PullRefreshControl onRefresh={() => courses.refetch()} />}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        ListEmptyComponent={empty}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.xs, paddingBottom: SPACING.xxxl },
  separator: { height: SPACING.xs }
});
