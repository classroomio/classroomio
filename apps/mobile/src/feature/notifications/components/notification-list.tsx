import { FlashList } from '@shopify/flash-list';
import type { ReactElement } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PullRefreshControl, type RefreshHandler } from '@/feature/common/components/pull-refresh-control';
import { SkeletonList, SkeletonText } from '@/feature/common/components/skeleton';
import { Spinner } from '@/feature/common/components/spinner';
import { Text } from '@/feature/common/components/text';
import { GUTTER, HIT_SLOP, RADII, SPACING } from '@/feature/common/constants/layout';
import { useTheme } from '@/feature/common/helpers/use-theme';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import type { NotificationListEntry } from '@/feature/notifications/helpers/notification-groups';
import { notificationsCatalog } from '@/feature/notifications/translations/catalog';

import { NotificationRow } from './notification-row';

type NotificationListProps = {
  entries: NotificationListEntry[];
  loading: boolean;
  loadingMore: boolean;
  canMarkAllRead: boolean;
  header?: ReactElement;
  empty: ReactElement;
  onRefresh: RefreshHandler;
  onEndReached: () => void;
  onMarkAllRead: () => void;
};

export function NotificationList({
  entries,
  loading,
  loadingMore,
  canMarkAllRead,
  header,
  empty,
  onRefresh,
  onEndReached,
  onMarkAllRead
}: NotificationListProps) {
  const t = useTranslations(notificationsCatalog);
  const { colors } = useTheme();

  return (
    <FlashList
      data={entries}
      keyExtractor={(entry) => entry.key}
      getItemType={(entry) => entry.kind}
      renderItem={({ item: entry }) =>
        entry.kind === 'header' ? (
          <NotificationSectionHeader
            title={t(entry.section)}
            action={entry.first && canMarkAllRead ? <MarkAllReadButton onPress={onMarkAllRead} /> : null}
            first={entry.first}
          />
        ) : (
          <NotificationRow item={entry.item} position={entry.position} />
        )
      }
      ListHeaderComponent={header}
      ListEmptyComponent={loading ? <NotificationListSkeleton /> : empty}
      ListFooterComponent={loadingMore ? <NotificationListFooter /> : null}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<PullRefreshControl onRefresh={onRefresh} />}
      contentContainerStyle={styles.content}
      style={{ backgroundColor: colors.background }}
    />
  );
}

function NotificationSectionHeader({
  title,
  action,
  first
}: {
  title: string;
  action: ReactElement | null;
  first: boolean;
}) {
  return (
    <View style={[styles.sectionHeader, !first && styles.sectionGap]}>
      <Text variant="subheading" accessibilityRole="header">
        {title}
      </Text>
      {action}
    </View>
  );
}

function MarkAllReadButton({ onPress }: { onPress: () => void }) {
  const t = useTranslations(notificationsCatalog);

  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={HIT_SLOP}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Text variant="captionStrong" tone="primary">
        {t('markAllRead')}
      </Text>
    </Pressable>
  );
}

function NotificationListSkeleton() {
  return (
    <View>
      <View style={styles.sectionHeader}>
        <SkeletonText variant="subheading" lines={1} width={72} />
      </View>
      <SkeletonList count={5} media="thumbnail" />
    </View>
  );
}

function NotificationListFooter() {
  return (
    <View style={styles.footer}>
      <Spinner />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: GUTTER, paddingTop: SPACING.xs, paddingBottom: SPACING.xxxl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 24,
    marginBottom: SPACING.sm
  },
  sectionGap: { marginTop: SPACING.xl },
  pressed: { opacity: 0.5 },
  footer: { paddingVertical: SPACING.lg, alignItems: 'center' }
});
