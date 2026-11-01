import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { showToast } from '@/feature/toast/helpers/toast-store';
import { openNotificationTarget } from '@/feature/notifications/helpers/open-notification';
import type { PushPayload } from '@/feature/notifications/types/notifications';
import { useActiveOrg } from '@/feature/org/helpers/use-active-org';

function payloadOf(notification: Notifications.Notification): PushPayload {
  const data = notification.request.content.data ?? {};
  const read = (key: keyof PushPayload) => (typeof data[key] === 'string' ? (data[key] as string) : undefined);

  return {
    notificationId: read('notificationId'),
    type: read('type'),
    entityId: read('entityId'),
    deepLink: read('deepLink'),
    orgId: read('orgId')
  };
}

/**
 * Routes notification taps (from a cold start, the background or the foreground) to their deep link, marks them
 * read, and turns pushes that arrive while the app is open into a toast.
 */
export function useNotificationResponses() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const { org, organizations } = useActiveOrg();
  const memberOrgKey = organizations.map((organization) => organization.id).join(',');
  const handled = useRef(new Set<string>());
  const ready = Boolean(userId && org);

  useEffect(() => {
    if (!ready) return;

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });

    const handleResponse = (response: Notifications.NotificationResponse) => {
      const identifier = response.notification.request.identifier;
      if (handled.current.has(identifier)) return;

      handled.current.add(identifier);
      const payload = payloadOf(response.notification);
      openNotificationTarget({
        deepLink: payload.deepLink,
        orgId: payload.orgId,
        memberOrgIds: memberOrgKey.split(',')
      });

      if (payload.notificationId) {
        void request(
          api.account.notifications[':notificationId'].read.$post({ param: { notificationId: payload.notificationId } })
        )
          .catch(() => {})
          .finally(refresh);
      }
      void Notifications.clearLastNotificationResponseAsync().catch(() => {});
    };

    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse) handleResponse(lastResponse);

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
      const { title, body } = notification.request.content;
      if (title) showToast({ title, description: body ?? undefined, tone: 'info' });
      void refresh();
    });

    return () => {
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, [api, queryClient, ready, memberOrgKey]);
}
