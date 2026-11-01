import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { snapshotQueryOptions, writeQuerySnapshot } from '@/feature/common/helpers/query-snapshot';
import type {
  NotificationPreferences,
  NotificationPreferencesUpdate
} from '@/feature/notifications/types/notifications';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';

export const notificationPreferencesQueryKey = (userId: string | null, orgId: string | null) =>
  ['notification-preferences', userId, orgId] as const;

function usePreferencesKey() {
  const { userId } = useAuth();
  const orgId = useActiveOrgId();

  return { key: notificationPreferencesQueryKey(userId, orgId), enabled: Boolean(userId && orgId) };
}

export function useNotificationPreferencesQuery() {
  const api = useApi();
  const { key, enabled } = usePreferencesKey();

  return useQuery({
    ...snapshotQueryOptions(key, async () => {
      const response = await request(api.account['notification-preferences'].$get());

      return response.data;
    }),
    enabled
  });
}

function applyUpdate(current: NotificationPreferences, update: NotificationPreferencesUpdate): NotificationPreferences {
  const changes = new Map((update.categories ?? []).map((change) => [change.category, change]));

  return {
    ...current,
    categories: current.categories.map((row) => {
      const change = changes.get(row.category);
      if (!change) return row;

      return {
        ...row,
        push: row.locked ? row.push : (change.push ?? row.push),
        inApp: row.locked ? row.inApp : (change.inApp ?? row.inApp),
        email: row.email === null ? null : (change.email ?? row.email)
      };
    }),
    quietHours: update.quietHours === undefined ? current.quietHours : update.quietHours
  };
}

/** Saves preference changes, showing them immediately and rolling back if the save fails. */
export function useUpdateNotificationPreferences() {
  const api = useApi();
  const queryClient = useQueryClient();
  const { key } = usePreferencesKey();

  return useMutation({
    mutationFn: async (update: NotificationPreferencesUpdate) => {
      const response = await request(api.account['notification-preferences'].$put({ json: update }));

      return response.data;
    },
    onMutate: async (update) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<NotificationPreferences>(key);
      if (previous) queryClient.setQueryData(key, applyUpdate(previous, update));

      return previous;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(key, data);
      writeQuerySnapshot(key, data);
    },
    onError: (_error, _update, previous) => {
      if (previous) queryClient.setQueryData(key, previous);
    }
  });
}
