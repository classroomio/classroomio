import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { UsersThreeIcon } from 'phosphor-react-native/src/icons/UsersThree';
import { FlashList } from '@shopify/flash-list';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, ButtonIcon, ButtonText } from '@/feature/common/components/button';
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { ItemGroup } from '@/feature/common/components/item';
import { PullRefreshControl } from '@/feature/common/components/pull-refresh-control';
import { SegmentedControl, SegmentedControlItem } from '@/feature/common/components/segmented-control';
import { SkeletonList } from '@/feature/common/components/skeleton';
import { Spinner } from '@/feature/common/components/spinner';
import { Text } from '@/feature/common/components/text';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useDebouncedValue } from '@/feature/common/helpers/use-debounced-value';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useFormatters } from '@/feature/i18n/helpers/use-formatters';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useOrgPeopleQuery } from '@/feature/staff/api/org-insights';
import { PersonRow } from '@/feature/staff/components/person-row';
import { staffCatalog } from '@/feature/staff/translations/catalog';
import type { PeopleRoleFilter } from '@/feature/staff/types/staff';

function isRoleFilter(value: string | undefined): value is PeopleRoleFilter {
  return value === 'all' || value === 'students' || value === 'tutors' || value === 'admins';
}

function Separator() {
  return <View style={styles.separator} />;
}

export default function PeopleScreen() {
  const t = useTranslations(staffCatalog);
  const common = useTranslations(commonCatalog);
  const format = useFormatters();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ role?: string }>();
  const role: PeopleRoleFilter = isRoleFilter(params.role) ? params.role : 'all';
  const [query, setQuery] = useState('');
  const search = useDebouncedValue(query.trim());
  const people = useOrgPeopleQuery(role, search);
  const items = people.data?.pages.flatMap((page) => page.items) ?? [];
  const total = people.data?.pages[0]?.pagination.total;

  const empty = people.isPending ? (
    <SkeletonList count={8} />
  ) : people.isError ? (
    <Empty>
      <EmptyMedia icon={UsersThreeIcon} />
      <EmptyTitle>{t('peopleLoadError')}</EmptyTitle>
      <EmptyDescription>{errorMessage(people.error)}</EmptyDescription>
      <EmptyContent>
        <Button variant="outline" onPress={() => people.refetch()}>
          <ButtonIcon icon={ArrowsClockwiseIcon} />
          <ButtonText>{common('retry')}</ButtonText>
        </Button>
      </EmptyContent>
    </Empty>
  ) : search ? (
    <Empty>
      <EmptyMedia icon={MagnifyingGlassIcon} />
      <EmptyDescription>{t('noPeopleMatches', { search })}</EmptyDescription>
    </Empty>
  ) : (
    <Empty>
      <EmptyMedia icon={UsersThreeIcon} />
      <EmptyTitle>{t('noPeopleTitle')}</EmptyTitle>
      <EmptyDescription>{t('noPeopleDescription')}</EmptyDescription>
    </Empty>
  );

  return (
    <>
      <Stack.SearchBar
        placeholder={t('searchPeople')}
        hideWhenScrolling={false}
        obscureBackground={false}
        tintColor={colors.primary}
        onChangeText={(event) => setQuery(event.nativeEvent.text)}
        onCancelButtonPress={() => setQuery('')}
      />
      <FlashList
        data={items}
        keyExtractor={(person) => String(person.memberId)}
        renderItem={({ item }) => (
          <ItemGroup>
            <PersonRow person={item} />
          </ItemGroup>
        )}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={
          <View style={styles.header}>
            <SegmentedControl value={role} onValueChange={(next) => router.setParams({ role: next })}>
              <SegmentedControlItem value="all">{t('segmentAll')}</SegmentedControlItem>
              <SegmentedControlItem value="students">{t('segmentStudents')}</SegmentedControlItem>
              <SegmentedControlItem value="tutors">{t('segmentTutors')}</SegmentedControlItem>
              <SegmentedControlItem value="admins">{t('segmentAdmins')}</SegmentedControlItem>
            </SegmentedControl>
            {total !== undefined && items.length > 0 ? (
              <Text variant="caption" tone="muted">
                {t('peopleCount', { count: total, formatted: format.number(total) })}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={empty}
        ListFooterComponent={
          people.isFetchingNextPage ? (
            <View style={styles.footer}>
              <Spinner />
            </View>
          ) : null
        }
        onEndReached={() => {
          if (people.hasNextPage && !people.isFetchingNextPage) void people.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        refreshControl={<PullRefreshControl onRefresh={() => people.refetch()} />}
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.xs, paddingBottom: SPACING.xxxl },
  header: { gap: SPACING.sm, paddingBottom: SPACING.sm },
  separator: { height: SPACING.xs },
  footer: { paddingVertical: SPACING.lg }
});
