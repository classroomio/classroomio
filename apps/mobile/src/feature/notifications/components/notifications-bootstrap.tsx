import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { getCurrentLocale } from '@/feature/i18n/helpers/current-locale';
import { createTranslator } from '@/feature/i18n/helpers/translate';
import { ANDROID_NOTIFICATION_CHANNEL_ID } from '@/feature/notifications/constants/notifications';
import { refreshPushPermission } from '@/feature/notifications/helpers/push-permission-store';
import { useBadgeSync } from '@/feature/notifications/helpers/use-badge-sync';
import { useNotificationResponses } from '@/feature/notifications/helpers/use-notification-responses';
import { usePendingDeleteSender } from '@/feature/notifications/helpers/use-pending-delete-sender';
import { usePushPrompt } from '@/feature/notifications/helpers/use-push-prompt';
import { usePushRegistration } from '@/feature/notifications/helpers/use-push-registration';
import { notificationsCatalog } from '@/feature/notifications/translations/catalog';

import { PushPermissionDialog } from './push-permission-dialog';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true
  })
});

if (Platform.OS === 'android') {
  void Notifications.setNotificationChannelAsync(ANDROID_NOTIFICATION_CHANNEL_ID, {
    name: createTranslator(notificationsCatalog, getCurrentLocale())('androidChannelName'),
    importance: Notifications.AndroidImportance.DEFAULT
  }).catch(() => {});
}

/**
 * App-wide push wiring: permission pre-prompt, token registration, tap routing, foreground toasts and the icon badge.
 * Renders nothing until signed in.
 */
export function NotificationsBootstrap() {
  const { userId } = useAuth();

  if (!userId) return <SignedOutBadgeReset />;

  return <SignedInNotifications />;
}

function SignedOutBadgeReset() {
  useEffect(() => {
    void Notifications.setBadgeCountAsync(0).catch(() => {});
  }, []);

  return null;
}

function SignedInNotifications() {
  const queryClient = useQueryClient();
  const prompt = usePushPrompt();

  usePushRegistration();
  useNotificationResponses();
  useBadgeSync();
  usePendingDeleteSender();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;

      void refreshPushPermission();
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    return () => subscription.remove();
  }, [queryClient]);

  return (
    <PushPermissionDialog
      open={prompt.open}
      orgName={prompt.orgName}
      onOpenChange={prompt.onOpenChange}
      onAllow={prompt.onAllow}
    />
  );
}
