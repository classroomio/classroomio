import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { useAuth } from '@/feature/auth/components/auth-provider';
import { request } from '@/feature/common/api/request';
import { useApi } from '@/feature/common/components/api-provider';
import { readQuerySnapshot, snapshotQueryOptions, writeQuerySnapshot } from '@/feature/common/helpers/query-snapshot';
import { NOTIFICATIONS_PAGE_SIZE } from '@/feature/notifications/constants/notifications';
import type { NotificationPage } from '@/feature/notifications/types/notifications';
import { useActiveOrgId } from '@/feature/org/helpers/active-org-store';

type NotificationPages = InfiniteData<NotificationPage, string | undefined>;

type UnreadSummary = { unreadCount: number };

export const notificationsQueryKey = (userId: string | null, orgId: string | null) =>
  ['notifications', userId, orgId] as const;

export function useNotificationKeys() {
  const { userId } = useAuth();
  const orgId = useActiveOrgId();
  const all = notificationsQueryKey(userId, orgId);

  return {
    all,
    list: [...all, 'list'] as const,
    summary: [...all, 'summary'] as const,
    enabled: Boolean(userId && orgId)
  };
}

export function useNotificationsQuery() {
  const api = useApi();
  const keys = useNotificationKeys();

  return useInfiniteQuery({
    queryKey: keys.list,
    queryFn: async ({ pageParam }) => {
      const response = await request(
        api.account.notifications.$get({
          query: { limit: String(NOTIFICATIONS_PAGE_SIZE), ...(pageParam ? { cursor: pageParam } : {}) }
        })
      );
      if (!pageParam) writeQuerySnapshot(keys.list, response.data);

      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialData: () => {
      const firstPage = readQuerySnapshot<NotificationPage>(keys.list);

      return firstPage ? { pages: [firstPage], pageParams: [undefined] } : undefined;
    },
    initialDataUpdatedAt: 0,
    enabled: keys.enabled
  });
}

/** Unread count for the bell and the app icon badge, from a one-item page. */
export function useUnreadNotificationsQuery() {
  const api = useApi();
  const keys = useNotificationKeys();

  return useQuery({
    ...snapshotQueryOptions<UnreadSummary>(keys.summary, async () => {
      const response = await request(api.account.notifications.$get({ query: { limit: '1' } }));

      return { unreadCount: response.data.unreadCount };
    }),
    enabled: keys.enabled
  });
}

function markPagesRead(pages: NotificationPages | undefined, notificationId: string | null, unreadCount: number) {
  if (!pages) return pages;

  const readAt = new Date().toISOString();

  return {
    ...pages,
    pages: pages.pages.map((page) => ({
      ...page,
      unreadCount,
      items: page.items.map((item) =>
        (notificationId === null || item.id === notificationId) && !item.readAt ? { ...item, readAt } : item
      )
    }))
  };
}

function useReadCache() {
  const queryClient = useQueryClient();
  const keys = useNotificationKeys();

  const apply = (notificationId: string | null, unreadCount: number) => {
    queryClient.setQueryData<NotificationPages>(keys.list, (pages) =>
      markPagesRead(pages, notificationId, unreadCount)
    );
    queryClient.setQueryData<UnreadSummary>(keys.summary, { unreadCount });
    writeQuerySnapshot(keys.summary, { unreadCount });
  };

  const currentUnread = () => queryClient.getQueryData<UnreadSummary>(keys.summary)?.unreadCount ?? 0;

  const snapshot = () => ({
    list: queryClient.getQueryData<NotificationPages>(keys.list),
    summary: queryClient.getQueryData<UnreadSummary>(keys.summary)
  });

  const restore = (previous: ReturnType<typeof snapshot>) => {
    queryClient.setQueryData(keys.list, previous.list);
    queryClient.setQueryData(keys.summary, previous.summary);
  };

  return { apply, currentUnread, snapshot, restore, keys, queryClient };
}

export function useMarkNotificationRead() {
  const api = useApi();
  const cache = useReadCache();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await request(
        api.account.notifications[':notificationId'].read.$post({ param: { notificationId } })
      );

      return response.data;
    },
    onMutate: (notificationId) => {
      const previous = cache.snapshot();
      cache.apply(notificationId, Math.max(0, cache.currentUnread() - 1));

      return previous;
    },
    onSuccess: (data) => cache.apply(data.id, data.unreadCount),
    onError: (_error, _notificationId, previous) => {
      if (previous) cache.restore(previous);
    }
  });
}

export function useMarkAllNotificationsRead() {
  const api = useApi();
  const cache = useReadCache();

  return useMutation({
    mutationFn: async () => {
      const response = await request(api.account.notifications['read-all'].$post());

      return response.data;
    },
    onMutate: () => {
      const previous = cache.snapshot();
      cache.apply(null, 0);

      return previous;
    },
    onError: (_error, _variables, previous) => {
      if (previous) cache.restore(previous);
    }
  });
}

export function useRefreshNotifications() {
  const queryClient = useQueryClient();
  const keys = useNotificationKeys();

  return () => queryClient.invalidateQueries({ queryKey: keys.all });
}
