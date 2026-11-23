import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { UserMinusIcon } from 'phosphor-react-native/src/icons/UserMinus';
import { UsersThreeIcon } from 'phosphor-react-native/src/icons/UsersThree';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { FlashList } from '@shopify/flash-list';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle
} from '@/feature/common/components/alert-dialog';
import { Banner, BannerContent, BannerDescription, BannerIcon, BannerTitle } from '@/feature/common/components/banner';
import type { SheetRef } from '@/feature/common/components/bottom-sheet';
import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { ItemGroup } from '@/feature/common/components/item';
import { OptionSheet, OptionSheetItem, OptionSheetTitle } from '@/feature/common/components/option-sheet';
import { PullRefreshControl } from '@/feature/common/components/pull-refresh-control';
import { SkeletonList } from '@/feature/common/components/skeleton';
import { Spinner } from '@/feature/common/components/spinner';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useDebouncedValue } from '@/feature/common/helpers/use-debounced-value';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useCourseStudentsQuery, useRemoveCourseMemberMutation } from '@/feature/staff/api/course-people';
import { useStudentCapacityQuery } from '@/feature/staff/api/org-insights';
import { memberName, StudentRow } from '@/feature/staff/components/student-row';
import { staffCatalog } from '@/feature/staff/translations/catalog';
import type { CourseMember } from '@/feature/staff/types/staff';
import { useTeachingCoursesQuery } from '@/feature/teach/api/teaching-courses';
import { HeaderTextButton } from '@/feature/teach/components/header-text-button';
import { showToast } from '@/feature/toast/helpers/toast-store';

function Separator() {
  return <View style={styles.separator} />;
}

export default function CoursePeopleScreen() {
  const t = useTranslations(staffCatalog);
  const common = useTranslations(commonCatalog);
  const format = useFormatters();
  const { colors } = useTheme();
  const { courseId = '' } = useLocalSearchParams<{ courseId: string }>();
  const [query, setQuery] = useState('');
  const search = useDebouncedValue(query.trim());
  const students = useCourseStudentsQuery(courseId, search);
  const capacity = useStudentCapacityQuery();
  const course = useTeachingCoursesQuery().data?.find((candidate) => candidate.id === courseId);
  const remove = useRemoveCourseMemberMutation(courseId);
  const actions = useRef<SheetRef>(null);
  const [selected, setSelected] = useState<CourseMember | null>(null);
  const [confirming, setConfirming] = useState(false);
  const members = students.data?.pages.flatMap((page) => page.data) ?? [];
  const limitReached = capacity.data?.reached === true;
  const selectedName = selected ? memberName(selected, t('learnerFallback')) : '';

  const openActions = (member: CourseMember) => {
    setSelected(member);
    actions.current?.present();
  };

  const confirmRemove = () => {
    if (!selected) return;

    const name = selectedName;
    remove.mutate(selected.id, {
      onSuccess: () => {
        setConfirming(false);
        showToast({ tone: 'success', title: t('removed', { name }) });
      },
      onError: (error) => {
        setConfirming(false);
        showToast({ tone: 'danger', title: t('removeFailed', { name }), description: errorMessage(error) });
      }
    });
  };

  const header = limitReached ? (
    <View style={styles.header}>
      <Banner tone="warning">
        <BannerIcon icon={WarningCircleIcon} />
        <BannerContent>
          <BannerTitle>{t('studentLimitTitle')}</BannerTitle>
          <BannerDescription>
            {t('studentLimitDescription', {
              used: format.number(capacity.data?.used ?? 0),
              limit: format.number(capacity.data?.limit ?? 0)
            })}
          </BannerDescription>
        </BannerContent>
      </Banner>
    </View>
  ) : null;

  const empty = students.isPending ? (
    <SkeletonList count={6} />
  ) : students.isError ? (
    <Empty>
      <EmptyMedia icon={UsersThreeIcon} />
      <EmptyTitle>{t('studentsLoadError')}</EmptyTitle>
      <EmptyDescription>{errorMessage(students.error)}</EmptyDescription>
      <EmptyContent>
        <Button variant="outline" onPress={() => students.refetch()}>
          <ButtonIcon icon={ArrowsClockwiseIcon} />
          <ButtonText>{common('retry')}</ButtonText>
        </Button>
      </EmptyContent>
    </Empty>
  ) : search ? (
    <Empty>
      <EmptyMedia icon={MagnifyingGlassIcon} />
      <EmptyDescription>{t('noStudentMatches', { search })}</EmptyDescription>
    </Empty>
  ) : (
    <Empty>
      <EmptyMedia icon={UsersThreeIcon} />
      <EmptyTitle>{t('noStudentsTitle')}</EmptyTitle>
      <EmptyDescription>{t('noStudentsDescription')}</EmptyDescription>
    </Empty>
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderTextButton
              onPress={() => router.push({ pathname: '/courses/[courseId]/invite', params: { courseId } })}
            >
              {t('invite')}
            </HeaderTextButton>
          )
        }}
      />
      <Stack.SearchBar
        placeholder={t('searchStudents')}
        hideWhenScrolling={false}
        obscureBackground={false}
        tintColor={colors.primary}
        onChangeText={(event) => setQuery(event.nativeEvent.text)}
        onCancelButtonPress={() => setQuery('')}
      />
      <FlashList
        data={members}
        keyExtractor={(member) => member.id}
        renderItem={({ item }) => (
          <ItemGroup>
            <StudentRow member={item} onActions={openActions} />
          </ItemGroup>
        )}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          students.isFetchingNextPage ? (
            <View style={styles.footer}>
              <Spinner />
            </View>
          ) : null
        }
        onEndReached={() => {
          if (students.hasNextPage && !students.isFetchingNextPage) void students.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        refreshControl={<PullRefreshControl onRefresh={() => Promise.all([students.refetch(), capacity.refetch()])} />}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
      />

      <OptionSheet ref={actions}>
        <OptionSheetTitle>{selectedName}</OptionSheetTitle>
        <OptionSheetItem icon={UserMinusIcon} destructive onSelect={() => setConfirming(true)}>
          {t('removeFromCourse')}
        </OptionSheetItem>
      </OptionSheet>

      <AlertDialog open={confirming} onOpenChange={setConfirming} busy={remove.isPending}>
        <AlertDialogContent>
          <AlertDialogTitle>{t('removeTitle', { name: selectedName })}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('removeDescription', { course: course?.title ?? common('titleCourse') })}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel />
            <AlertDialogAction variant="destructive" loading={remove.isPending} onPress={confirmRemove}>
              {t('remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.xs, paddingBottom: SPACING.xxxl },
  header: { paddingBottom: SPACING.sm },
  separator: { height: SPACING.xs },
  footer: { paddingVertical: SPACING.lg }
});
