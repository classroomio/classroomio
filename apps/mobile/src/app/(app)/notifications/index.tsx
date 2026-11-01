import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { BellIcon } from 'phosphor-react-native/src/icons/Bell';
import { SlidersHorizontalIcon } from 'phosphor-react-native/src/icons/SlidersHorizontal';
import { router, Stack } from 'expo-router';
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
import { HeaderIconButton } from '@/feature/common/components/header-icon-button';
import { OfflineNotice } from '@/feature/common/components/offline-notice';
import { SPACING } from '@/feature/common/constants/layout';
import { errorMessage } from '@/feature/common/helpers/error-message';
import { useIsOffline } from '@/feature/common/helpers/network-status';
import { commonCatalog } from '@/feature/common/translations/catalog';
import { useTranslations } from '@/feature/i18n/helpers/use-translations';
import { useNotificationPreferencesQuery } from '@/feature/notifications/api/notification-preferences';
import { useMarkAllNotificationsRead, useNotificationsQuery } from '@/feature/notifications/api/notifications';
import { NotificationActions } from '@/feature/notifications/components/notification-actions';
import { NotificationList } from '@/feature/notifications/components/notification-list';
import { PushStatusBanner } from '@/feature/notifications/components/push-status-banner';
import { groupNotifications } from '@/feature/notifications/helpers/notification-groups';
import { usePushPermission } from '@/feature/notifications/helpers/push-permission-store';
import { notificationsCatalog } from '@/feature/notifications/translations/catalog';

export default function NotificationsScreen() {
  const t = useTranslations(notificationsCatalog);
  const common = useTranslations(commonCatalog);
  const notifications = useNotificationsQuery();
  const preferences = useNotificationPreferencesQuery();
  const markAllRead = useMarkAllNotificationsRead();
  const offline = useIsOffline();
  const permission = usePushPermission();

  const pages = notifications.data?.pages ?? [];
  const items = pages.flatMap((page) => page.items);
  const unreadCount = pages[0]?.unreadCount ?? 0;
  const entries = groupNotifications(items);

  const refresh = () => Promise.all([notifications.refetch(), preferences.refetch()]);

  const showError = notifications.isError && items.length === 0;
  const pushAvailable = preferences.data?.pushAvailable === true;
  const showPushBanner = pushAvailable && (permission === 'undetermined' || permission === 'denied');
  const showOffline = offline && items.length > 0;

  return (
    <NotificationActions>
      <Stack.Screen
        options={{
          headerRight: () => (
            <HeaderIconButton
              icon={SlidersHorizontalIcon}
              accessibilityLabel={t('settingsTitle')}
              onPress={() => router.push('/notifications/preferences')}
            />
          )
        }}
      />
      <NotificationList
        entries={entries}
        loading={notifications.isPending}
        loadingMore={notifications.isFetchingNextPage}
        canMarkAllRead={unreadCount > 0 && !offline}
        header={
          showOffline || showPushBanner ? (
            <View style={styles.header}>
              {showOffline ? <OfflineNotice description={t('offlineNote')} /> : null}
              {showPushBanner ? <PushStatusBanner pushAvailable={pushAvailable} /> : null}
            </View>
          ) : undefined
        }
        empty={
          showError ? (
            <Empty>
              <EmptyMedia icon={BellIcon} />
              <EmptyTitle>{t('loadError')}</EmptyTitle>
              <EmptyDescription>{errorMessage(notifications.error)}</EmptyDescription>
              <EmptyContent>
                <Button variant="outline" onPress={refresh}>
                  <ButtonIcon icon={ArrowsClockwiseIcon} />
                  <ButtonText>{common('retry')}</ButtonText>
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <Empty>
              <EmptyIllustration name="notifications" />
              <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
              <EmptyDescription>{t('emptyDescription')}</EmptyDescription>
            </Empty>
          )
        }
        onRefresh={refresh}
        onEndReached={() => {
          if (notifications.hasNextPage && !notifications.isFetchingNextPage) void notifications.fetchNextPage();
        }}
        onMarkAllRead={() => markAllRead.mutate()}
      />
    </NotificationActions>
  );
}

const styles = StyleSheet.create({
  header: { gap: SPACING.sm, marginBottom: SPACING.lg }
});
