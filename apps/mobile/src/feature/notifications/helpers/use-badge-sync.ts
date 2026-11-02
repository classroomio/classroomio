import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { useUnreadNotificationsQuery } from '@/feature/notifications/api/notifications';
import { usePushPermission } from '@/feature/notifications/helpers/push-permission-store';

/** Keeps the app icon badge equal to the active organization's unread count, and clears it when signed out. */
export function useBadgeSync() {
  const { userId } = useAuth();
  const permission = usePushPermission();
  const unread = useUnreadNotificationsQuery();
  const count = userId ? (unread.data?.unreadCount ?? 0) : 0;

  useEffect(() => {
    if (permission !== 'granted') return;

    void Notifications.setBadgeCountAsync(count).catch(() => {});
  }, [count, permission]);
}
