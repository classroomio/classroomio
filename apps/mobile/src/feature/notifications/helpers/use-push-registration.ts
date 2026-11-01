import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { useApi } from '@/feature/common/components/api-provider';
import { registerDeviceToken, unregisterDeviceToken } from '@/feature/notifications/api/device-token';
import { easProjectId } from '@/feature/notifications/helpers/push-project';
import { usePushPermission } from '@/feature/notifications/helpers/push-permission-store';
import { setRegisteredPushToken } from '@/feature/notifications/helpers/push-registration-store';
import { appVersionOf } from '@/feature/settings/helpers/app-version';

const REFRESH_INTERVAL_MS = 60 * 60 * 1000;

function deviceLocale() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale;
  } catch {
    return undefined;
  }
}

/**
 * Registers this device's Expo push token with the API once notifications are allowed, and again when the token
 * changes or the app returns to the foreground. Builds without an EAS project id skip registration.
 */
export function usePushRegistration() {
  const api = useApi();
  const { userId } = useAuth();
  const permission = usePushPermission();

  useEffect(() => {
    const projectId = easProjectId();
    if (!userId || permission !== 'granted' || !projectId) return;

    let cancelled = false;
    let lastToken: string | null = null;
    let lastRegisteredAt = 0;

    const register = async (force: boolean) => {
      const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
      if (cancelled) return;
      if (!force && token === lastToken && Date.now() - lastRegisteredAt < REFRESH_INTERVAL_MS) return;

      await registerDeviceToken(api, {
        token,
        platform: Platform.OS === 'android' ? 'android' : 'ios',
        appVersion: appVersionOf(),
        deviceName: Device.deviceName ?? Device.modelName ?? undefined,
        locale: deviceLocale()
      });
      lastToken = token;
      lastRegisteredAt = Date.now();
      setRegisteredPushToken(token, async () => {
        await unregisterDeviceToken(api, token);
      });
    };

    void register(true).catch(() => {});
    const tokenSubscription = Notifications.addPushTokenListener(() => void register(true).catch(() => {}));
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void register(false).catch(() => {});
    });

    return () => {
      cancelled = true;
      tokenSubscription.remove();
      appStateSubscription.remove();
    };
  }, [api, userId, permission]);
}
