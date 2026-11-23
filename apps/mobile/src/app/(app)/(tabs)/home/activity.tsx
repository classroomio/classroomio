import { PulseIcon } from 'phosphor-react-native/src/icons/Pulse';
import { FlashList } from '@shopify/flash-list';
import { StyleSheet, View } from 'react-native';

import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from '@/feature/common/components/empty';
import { ItemGroup } from '@/feature/common/components/item';
import { PullRefreshControl } from '@/feature/common/components/pull-refresh-control';
import { SkeletonList } from '@/feature/common/components/skeleton';
import { Spinner } from '@/feature/common/components/spinner';
import { GUTTER, SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useTeachingActivityQuery } from '@/feature/staff/api/teaching-insights';
import { ActivityRow } from '@/feature/staff/components/activity-row';
import { staffCatalog } from '@/feature/staff/translations/catalog';

function Separator() {
  return <View style={styles.separator} />;
}

export default function ActivityScreen() {
  const t = useTranslations(staffCatalog);
  const { colors } = useTheme();
  const activity = useTeachingActivityQuery();
  const items = activity.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <FlashList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ItemGroup>
          <ActivityRow item={item} />
        </ItemGroup>
      )}
      ItemSeparatorComponent={Separator}
      onEndReached={() => {
        if (activity.hasNextPage && !activity.isFetchingNextPage) void activity.fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<PullRefreshControl onRefresh={() => activity.refetch()} />}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      ListEmptyComponent={
        activity.isPending ? (
          <SkeletonList count={8} />
        ) : (
          <Empty>
            <EmptyMedia icon={PulseIcon} />
            <EmptyTitle>{activity.isError ? t('activityLoadError') : t('recentActivity')}</EmptyTitle>
            <EmptyDescription>{activity.isError ? errorMessage(activity.error) : t('noActivity')}</EmptyDescription>
          </Empty>
        )
      }
      ListFooterComponent={
        activity.isFetchingNextPage ? (
          <View style={styles.footer}>
            <Spinner />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.xs, paddingBottom: SPACING.xxxl },
  separator: { height: SPACING.xs },
  footer: { paddingVertical: SPACING.lg }
});
